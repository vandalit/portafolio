const failedSources = new Set();

export function showImageLoading(surface, { square = false } = {}) {
  if (!surface) return null;
  let placeholder = surface.querySelector(':scope > .image-loading-placeholder');
  if (!placeholder) {
    placeholder = document.createElement('span');
    placeholder.className = 'image-loading-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    surface.append(placeholder);
  }

  surface.classList.add('image-loading-surface', 'is-image-loading');
  surface.classList.toggle('image-loading-square', square);
  surface.classList.remove('is-image-loaded', 'is-image-error', 'image-loaded');
  return placeholder;
}

export function watchImageLoading(image, surface = image?.parentElement, { square = false, defer = false } = {}) {
  if (!image || !surface) return;

  const source = image.dataset.deferredSrc || image.dataset.src || image.getAttribute('src') || image.currentSrc;
  if (!source) return;

  showImageLoading(surface, { square });
  if (defer) {
    image.dataset.deferredSrc = source;
    image.dataset.imageLoadingSquare = String(square);
    delete image.dataset.src;
    image.removeAttribute('src');
    image.classList.remove('is-loaded');
    return;
  }

  const token = Number(surface.dataset.imageLoadToken || 0) + 1;
  surface.dataset.imageLoadToken = String(token);
  image.classList.remove('is-loaded');

  const settle = loaded => {
    if (surface.dataset.imageLoadToken !== String(token)) return;
    surface.classList.remove('is-image-loading');
    surface.classList.toggle('is-image-loaded', loaded);
    surface.classList.toggle('is-image-error', !loaded);
    surface.classList.toggle('image-loaded', loaded);
    image.classList.toggle('is-loaded', loaded);

    if (!loaded && !failedSources.has(source)) {
      failedSources.add(source);
      console.warn(`[ImageLoading] Could not load image: ${source}`);
    }
  };

  image.addEventListener('load', () => settle(true), { once: true });
  image.addEventListener('error', () => settle(false), { once: true });

  if (image.dataset.deferredSrc) {
    image.fetchPriority = 'low';
    image.src = image.dataset.deferredSrc;
    delete image.dataset.deferredSrc;
  }

  if (image.complete) settle(image.naturalWidth > 0);
}

export function activateDeferredImages(root = document) {
  root.querySelectorAll('img[data-deferred-src]').forEach(image => {
    const surface = image.closest('.image-loading-surface') || image.parentElement;
    watchImageLoading(image, surface, {
      square: image.dataset.imageLoadingSquare === 'true'
    });
    delete image.dataset.imageLoadingSquare;
  });
}

export function watchMediaLoading(media, surface = media?.parentElement) {
  if (!media || !surface) return;

  showImageLoading(surface);
  const token = Number(surface.dataset.imageLoadToken || 0) + 1;
  surface.dataset.imageLoadToken = String(token);
  const source = media.dataset.src || media.currentSrc || media.src;

  const settle = loaded => {
    if (surface.dataset.imageLoadToken !== String(token)) return;
    surface.classList.remove('is-image-loading');
    surface.classList.toggle('is-image-loaded', loaded);
    surface.classList.toggle('is-image-error', !loaded);

    if (!loaded && source && !failedSources.has(source)) {
      failedSources.add(source);
      console.warn(`[ImageLoading] Could not load media: ${source}`);
    }
  };

  media.addEventListener('loadeddata', () => settle(true), { once: true });
  media.addEventListener('error', () => settle(false), { once: true });
  if (media.readyState >= 2) settle(true);
}
