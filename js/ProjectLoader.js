/**
 * Project Data Loader Module
 * Loads data from projects.yaml and dynamically generates project cards.
 */

class ProjectLoader {
    constructor(yamlPath = './projects.yaml') {
        this.yamlPath = yamlPath;
        this.projects = [];
        this.tagsIndex = new Map(); // Index projects by tag
    }

    /**
     * Fetches and parses the YAML file.
     */
    async loadProjects() {
        try {
            const response = await fetch(this.yamlPath);
            if (!response.ok) {
                throw new Error(`Failed to load YAML file: ${response.status}`);
            }
            const yamlText = await response.text();
            
            // Parse using js-yaml
            if (typeof jsyaml === 'undefined') {
                throw new Error('js-yaml library not loaded');
            }
            
            const data = jsyaml.load(yamlText);
            this.projects = data.projects || [];
            this._indexProjectsByTags();
            
            return this.projects;
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    /**
     * Indexes projects by their tags.
     * Used later for filtering by skills.
     */
    _indexProjectsByTags() {
        this.tagsIndex.clear();
        this.projects.forEach(project => {
            if (project.tags && Array.isArray(project.tags)) {
                project.tags.forEach(tag => {
                    if (!this.tagsIndex.has(tag)) {
                        this.tagsIndex.set(tag, []);
                    }
                    this.tagsIndex.get(tag).push(project);
                });
            }
        });
    }

    /**
     * Filters projects by a specific tag.
     * @param {string} tag - Tag to filter by
     * @returns {Array} Array of projects with the given tag
     */
    getProjectsByTag(tag) {
        return this.tagsIndex.get(tag) || [];
    }

    /**
     * Returns all available tags.
     */
    getAllTags() {
        return Array.from(this.tagsIndex.keys());
    }

    /**
     * Generates project card HTML. (Simple version - for main page)
     * @param {Object} project - Project object
     * @returns {string} HTML string
     */
    createSimpleCard(project) {
        const tagsHtml = project.tags
            .map(tag => `<span>${this._escapeHtml(tag)}</span>`)
            .join('');

        return `
            <article class="project-card">
                <div class="card-image">
                    <img src="${this._escapeHtml(project.image)}" alt="${this._escapeHtml(project.name)}">
                </div>
                <div class="card-content">
                    <h3 class="project-name">${this._escapeHtml(project.name)}</h3>
                    <div class="project-tags">
                        ${tagsHtml}
                    </div>
                    <p class="project-desc">${this._escapeHtml(project.description)}</p>
                    <div class="card-links">
                        ${project.links.demo !== '#' ? `<a href="${this._escapeHtml(project.links.demo)}" target="_blank" aria-label="View demo">Demo</a>` : '<a href="#" disabled>Demo</a>'}
                        <a href="${this._escapeHtml(project.links.github)}" target="_blank" aria-label="View GitHub code">GitHub</a>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Generates project card HTML. (Detailed version - for projects page)
     * @param {Object} project - Project object
     * @returns {string} HTML string
     */
    createDetailCard(project) {
        const tagsHtml = project.tags
            .map(tag => `<span>${this._escapeHtml(tag)}</span>`)
            .join('');
        
        const featuresHtml = project.features
            .map(feature => `<li>${this._escapeHtml(feature)}</li>`)
            .join('');

        return `
            <article class="project-card">
                <div class="card-image">
                    <img src="${this._escapeHtml(project.image)}" alt="${this._escapeHtml(project.name)}">
                </div>
                <div class="card-content">
                    <h3 class="project-name">${this._escapeHtml(project.name)}</h3>
                    <p class="project-date">${this._escapeHtml(project.date)} | ${this._escapeHtml(project.category)}</p>
                    <div class="project-tags">
                        ${tagsHtml}
                    </div>
                    <p class="project-desc">
                        ${this._escapeHtml(project.description)}
                    </p>
                    <div class="project-features">
                        <h4>Key Features:</h4>
                        <ul>
                            ${featuresHtml}
                        </ul>
                    </div>
                    <div class="card-links">
                        <a href="${this._escapeHtml(project.links.demo)}" target="_blank" class="btn btn-card">Live Demo</a>
                        <a href="${this._escapeHtml(project.links.github)}" target="_blank" class="btn btn-card btn-outline">GitHub</a>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Escapes HTML special characters.
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Renders project cards into a specific container.
     * @param {string} containerId - Target container ID
     * @param {boolean} isDetail - Whether to use the detailed version
     * @param {Array} projectIds - Array of project IDs to render (renders all if omitted)
     */
    renderProjects(containerId, isDetail = false, projectIds = null) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        const projectsToRender = projectIds 
            ? this.projects.filter(p => projectIds.includes(p.id))
            : this.projects;

        const html = projectsToRender
            .map(project => isDetail ? this.createDetailCard(project) : this.createSimpleCard(project))
            .join('');

        container.innerHTML = html;
    }

    /**
     * Filters and renders projects by a specific tag.
     * @param {string} containerId - Target container ID
     * @param {string} tag - Tag to filter by
     * @param {boolean} isDetail - Whether to use the detailed version
     */
    renderProjectsByTag(containerId, tag, isDetail = false) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        const projects = this.getProjectsByTag(tag);
        if (projects.length === 0) {
            container.innerHTML = '<p>No projects found for this tag.</p>';
            return;
        }

        const html = projects
            .map(project => isDetail ? this.createDetailCard(project) : this.createSimpleCard(project))
            .join('');

        container.innerHTML = html;
    }
}

// Global ProjectLoader instance
let projectLoader = null;

/**
 * Initializes the project loader.
 * @param {string} yamlPath - Path to the YAML file (default: ./projects.yaml)
 */
async function initProjectLoader(yamlPath = './projects.yaml') {
    projectLoader = new ProjectLoader(yamlPath);
    await projectLoader.loadProjects();
    return projectLoader;
}

/**
 * Shows a project filter popup by tag. (For skill filtering)
 * @param {string} tag - Tag to filter by
 */
function showProjectPopupByTag(tag) {
    if (!projectLoader) {
        console.error('ProjectLoader not initialized');
        return;
    }

    const projects = projectLoader.getProjectsByTag(tag);
    
    if (projects.length === 0) {
        alert(`No projects found with the tag '${tag}'.`);
        return;
    }

    // Remove existing popup
    const existingPopup = document.getElementById('project-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Generate popup HTML
    const popupHTML = `
        <div id="project-popup" class="project-popup-overlay">
            <div class="project-popup-content">
                <div class="popup-header">
                    <h2>Projects with tag: <span class="tag-name">${projectLoader._escapeHtml(tag)}</span></h2>
                    <button class="popup-close-btn" aria-label="Close popup">×</button>
                </div>
                <div class="popup-projects">
                    ${projects.map(p => projectLoader.createSimpleCard(p)).join('')}
                </div>
            </div>
        </div>
    `;

    // Append popup
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Lock background scroll
    document.body.style.overflow = 'hidden';

    // Add popup styles (if first time)
    if (!document.getElementById('project-popup-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'project-popup-styles';
        styleSheet.textContent = `
            .project-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            .project-popup-content {
                background: var(--bg-secondary, #ffffff);
                border-radius: 12px;
                padding: 2rem;
                max-width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                scrollbar-width: none;          /* Firefox */
                -ms-overflow-style: none;       /* IE/Edge */
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }

            .project-popup-content::-webkit-scrollbar {
                display: none;                  /* Chrome/Safari */
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                border-bottom: 2px solid var(--border-color, #e0e0e0);
                padding-bottom: 1rem;
            }

            .popup-header h2 {
                margin: 0;
                font-size: 1.5rem;
            }

            .tag-name {
                color: var(--accent-color, #007bff);
                font-weight: bold;
            }

            .popup-close-btn {
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
                color: var(--text-primary, #333);
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .popup-close-btn:hover {
                background: var(--bg-hover, #f0f0f0);
            }

            .popup-projects {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
            }

            @media (max-width: 768px) {
                .project-popup-content {
                    max-width: 95%;
                    padding: 1.5rem;
                }

                .popup-header h2 {
                    font-size: 1.2rem;
                }

                .popup-projects {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Close button functionality
    const popup = document.getElementById('project-popup');
    const closeBtn = popup.querySelector('.popup-close-btn');
    
    function closePopup() {
        const p = document.getElementById('project-popup');
        if (p) p.remove();
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closePopup);

    // Close on background click
    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup();
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
    }, { once: true });
}
