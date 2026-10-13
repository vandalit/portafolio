document.addEventListener('DOMContentLoaded', function() {
    // Initialize accordions
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const content = accordion.querySelector('.accordion-content');
        const icon = header.querySelector('.accordion-icon');
        
        header.addEventListener('click', () => {
            const isExpanded = accordion.classList.contains('expanded');
            
            if (isExpanded) {
                accordion.classList.remove('expanded');
                content.style.display = 'none';
                icon.textContent = '+';
            } else {
                accordion.classList.add('expanded');
                content.style.display = 'block';
                icon.textContent = '−';
            }
        });
    });
    
    // Populate skills
    const skillsGrid = document.querySelector('.skills-grid');
    skillsData.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.className = `skill-item ${skill.category}`;
        skillItem.innerHTML = `
            <h3>${skill.name}</h3>
            <div class="skill-meter">
                <div class="skill-level" style="width: ${skill.level}%"></div>
            </div>
        `;
        skillsGrid.appendChild(skillItem);
    });
    
    // Populate experience timeline
    const timeline = document.querySelector('.timeline');
    experienceData.forEach((exp, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
            <h3>${exp.title} <span>@ ${exp.company}</span></h3>
            <p class="timeline-period">${exp.period}</p>
            <p>${exp.description}</p>
            <div class="skills">
                ${exp.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
    
    // Populate education
    const educationGrid = document.querySelector('.education-grid');
    educationData.forEach(edu => {
        const eduItem = document.createElement('div');
        eduItem.className = 'education-item';
        
        let statusHTML = '';
        if (edu.status) {
            statusHTML = `<span class="education-status">${edu.status}</span>`;
        }
        
        let credentialsHTML = '';
        if (edu.credentials) {
            credentialsHTML = `<p class="education-credentials">${edu.credentials}</p>`;
        }
        
        eduItem.innerHTML = `
            <h3>${edu.degree}</h3>
            <p class="education-institution">${edu.institution} ${statusHTML}</p>
            <p class="education-period">${edu.period}</p>
            <p>${edu.description}</p>
            ${credentialsHTML}
        `;
        educationGrid.appendChild(eduItem);
    });
    
    // Populate bento grid
    const bentoGrid = document.querySelector('.bento-grid');
    projectsData.categories.forEach(category => {
        const bentoItem = document.createElement('a');
        bentoItem.className = `bento-item ${category.id}`;
        bentoItem.href = `projects/${category.id}.html`;
        bentoItem.innerHTML = `
            <img src="${category.image}" alt="${category.title}">
            <div class="bento-content">
                <h3>${category.title}</h3>
                <p>View projects →</p>
            </div>
        `;
        bentoGrid.appendChild(bentoItem);
    });
});