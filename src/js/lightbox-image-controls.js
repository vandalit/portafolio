const controllers = new WeakMap();
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.15;

export function attachLightboxImageControls(lightbox) {
  if (!lightbox) return null;
  if (controllers.has(lightbox)) return controllers.get(lightbox);

  const stage = lightbox.querySelector('.modal__lightbox-stage');
  const image = lightbox.querySelector('.modal__lightbox-img');
  if (!stage || !image) return null;

  let scale = MIN_SCALE;
  let panX = 0;
  let panY = 0;
  let panPointerId = null;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const clampPan = () => {
    const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  };

  const render = () => {
    clampPan();
    image.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
    lightbox.classList.toggle('is-zoomed', scale > MIN_SCALE);
  };

  const reset = () => {
    scale = MIN_SCALE;
    panX = 0;
    panY = 0;
    panPointerId = null;
    lightbox.classList.remove('is-panning');
    render();
  };

  stage.addEventListener('wheel', event => {
    if (event.target !== image || !lightbox.classList.contains('is-open')) return;
    event.preventDefault();

    const nextScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, scale * (event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
    );
    if (nextScale === scale) return;

    const imageRect = image.getBoundingClientRect();
    const anchorX = event.clientX - (imageRect.left + imageRect.width / 2);
    const anchorY = event.clientY - (imageRect.top + imageRect.height / 2);
    const ratio = nextScale / scale;
    panX = anchorX - (anchorX - panX) * ratio;
    panY = anchorY - (anchorY - panY) * ratio;
    scale = nextScale;
    render();
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    if (event.button !== 1 || event.target !== image
      || scale === MIN_SCALE || !lightbox.classList.contains('is-open')) return;
    event.preventDefault();
    panPointerId = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    lightbox.classList.add('is-panning');
  });

  stage.addEventListener('pointermove', event => {
    if (event.pointerId !== panPointerId) return;
    panX += event.clientX - lastPointerX;
    panY += event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    render();
  });

  const finishPan = event => {
    if (event.pointerId !== panPointerId) return;
    panPointerId = null;
    lightbox.classList.remove('is-panning');
  };
  stage.addEventListener('pointerup', finishPan);
  stage.addEventListener('pointercancel', finishPan);
  stage.addEventListener('lostpointercapture', finishPan);

  const controller = { reset };
  controllers.set(lightbox, controller);
  return controller;
}
