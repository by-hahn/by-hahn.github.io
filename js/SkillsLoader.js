/**
 * Skills Loader Module
 * Classifies tags from ProjectLoader into categories
 * and dynamically renders the Skills section.
 * 
 * - Tag → category mapping is managed only in this file
 * - projects.yaml is not modified
 * - Sorting: project count descending / ABC ascending, etc.
 */

class SkillsLoader {

    /* ========================================
       Category mapping definition
       Add new tags here when they appear
    ======================================== */
    static CATEGORIES = [
        {
            name: "AI & Data Science",
            tags: ["AI", "PyTorch", "TensorFlow", "Pandas", "Python", "Machine Learning", "NLP"]
        },
        {
            name: "Frontend Development",
            tags: ["Frontend", "React", "Next.js", "JavaScript", "HTML/CSS", "Tailwind CSS", "Responsive Design", "Web Design"]
        },
        {
            name: "Backend & Tools",
            tags: ["Flask", "Docker", "Git & GitHub", "Figma"]
        }
    ];

    /* ========================================
       Sort mode constants
    ======================================== */
    static SORT = {
        COUNT_DESC: 'count-desc',   // Most projects first
        COUNT_ASC:  'count-asc',    // Fewest projects first
        ALPHA_ASC:  'alpha-asc',    // ABC ascending
        ALPHA_DESC: 'alpha-desc'    // ABC descending
    };

    /**
     * @param {ProjectLoader} projectLoader - Initialized ProjectLoader instance
     * @param {Object} options
     * @param {string} options.sortMode - Sort mode (default: COUNT_DESC)
     * @param {boolean} options.showCount - Whether to show project count on badges (default: true)
     * @param {boolean} options.showUncategorized - Whether to show uncategorized tags (default: true)
     */
    constructor(projectLoader, options = {}) {
        this.projectLoader = projectLoader;
        this.sortMode = options.sortMode || SkillsLoader.SORT.COUNT_DESC;
        this.showCount = options.showCount !== undefined ? options.showCount : true;
        this.showUncategorized = options.showUncategorized !== undefined ? options.showUncategorized : true;
    }

    /**
     * Classifies ProjectLoader tags into categories.
     * @returns {Array<{name: string, skills: Array<{tag: string, count: number}>}>}
     */
    categorize() {
        const allTags = this.projectLoader.getAllTags();
        const assignedTags = new Set();
        const result = [];

        // Process in defined category order
        for (const category of SkillsLoader.CATEGORIES) {
            const skills = [];

            for (const tag of category.tags) {
                // Only include tags that exist in actual projects
                if (allTags.includes(tag)) {
                    const count = this.projectLoader.getProjectsByTag(tag).length;
                    skills.push({ tag, count });
                    assignedTags.add(tag);
                }
            }

            if (skills.length > 0) {
                result.push({
                    name: category.name,
                    skills: this._sort(skills)
                });
            }
        }

        // Collect uncategorized tags
        if (this.showUncategorized) {
            const uncategorized = [];
            for (const tag of allTags) {
                if (!assignedTags.has(tag)) {
                    const count = this.projectLoader.getProjectsByTag(tag).length;
                    uncategorized.push({ tag, count });
                }
            }

            if (uncategorized.length > 0) {
                result.push({
                    name: "Other",
                    skills: this._sort(uncategorized)
                });
            }
        }

        return result;
    }

    /**
     * Sorts the tag array according to the configured mode.
     */
    _sort(skills) {
        const copy = [...skills];

        switch (this.sortMode) {
            case SkillsLoader.SORT.COUNT_DESC:
                return copy.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
            case SkillsLoader.SORT.COUNT_ASC:
                return copy.sort((a, b) => a.count - b.count || a.tag.localeCompare(b.tag));
            case SkillsLoader.SORT.ALPHA_ASC:
                return copy.sort((a, b) => a.tag.localeCompare(b.tag));
            case SkillsLoader.SORT.ALPHA_DESC:
                return copy.sort((a, b) => b.tag.localeCompare(a.tag));
            default:
                return copy;
        }
    }

    /**
     * Dynamically renders the Skills section.
     * @param {string} containerId - Target container ID
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`SkillsLoader: Container "#${containerId}" not found`);
            return;
        }

        const categories = this.categorize();

        if (categories.length === 0) {
            container.innerHTML = '<p>Unable to load skills data.</p>';
            return;
        }

        const html = categories.map(category => `
            <div class="skill-category">
                <h3>${this._escapeHtml(category.name)}</h3>
                <ul class="skill-list">
                    ${category.skills.map(({ tag, count }) => `
                        <li class="skill-badge interactive" 
                            data-tag="${this._escapeHtml(tag)}" 
                            tabindex="0"
                            role="button"
                            aria-label="${tag} - ${count} projects">
                            <span class="skill-name">${this._escapeHtml(tag)}</span>
                            ${this.showCount ? `<span class="skill-count">${count}</span>` : ''}
                            <div class="skill-tooltip" role="tooltip"></div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');

        container.innerHTML = html;
        this._bindEvents(container);
    }

    /**
     * Binds hover tooltip & click popup events.
     */
    _bindEvents(container) {
        const badges = container.querySelectorAll('.skill-badge.interactive');

        badges.forEach(badge => {
            const tag = badge.dataset.tag;
            const tooltip = badge.querySelector('.skill-tooltip');
            const projects = this.projectLoader.getProjectsByTag(tag);

            // Pre-generate tooltip content
            if (projects.length > 0) {
                tooltip.innerHTML = `
                    <strong>Related Projects (${projects.length})</strong>
                    <ul class="tooltip-project-list">
                        ${projects.map(p => `<li>${this._escapeHtml(p.name)}</li>`).join('')}
                    </ul>
                    <span class="tooltip-hint">Click to view details</span>
                `;
            } else {
                tooltip.innerHTML = '<span class="tooltip-empty">No related projects</span>';
            }

            // Hover: show tooltip
            badge.addEventListener('mouseenter', () => {
                tooltip.classList.add('visible');
            });

            badge.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });

            // Click: project popup
            badge.addEventListener('click', () => {
                tooltip.classList.remove('visible');
                if (projects.length > 0) {
                    showProjectPopupByTag(tag);
                }
            });

            // Keyboard accessibility: Enter/Space to click
            badge.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tooltip.classList.remove('visible');
                    if (projects.length > 0) {
                        showProjectPopupByTag(tag);
                    }
                }
            });
        });
    }

    /**
     * Escapes HTML special characters
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Changes the sort mode and re-renders.
     * @param {string} sortMode - New sort mode
     * @param {string} containerId - Target container ID
     */
    changeSortMode(sortMode, containerId) {
        this.sortMode = sortMode;
        this.render(containerId);
    }
}
