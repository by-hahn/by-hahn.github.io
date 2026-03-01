/* Disable browser's automatic scroll restoration */
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}


document.addEventListener('DOMContentLoaded', () => {
    /* ============================================================
       [1] MAIN PAGE - Main Single Page Section
       Page load, header, theme-related features
    ============================================================ */

    /* 1-1. Scroll to top on page load */
    window.scrollTo(0, 0);

    /* 1-2. Scroll to top on logo click */
    const logoLink = document.getElementById('logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /* 1-3. Mobile menu toggle */
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        const isOpened = nav.classList.contains('active');
        menuBtn.setAttribute('aria-label', isOpened ? 'Close menu' : 'Open menu');
        menuBtn.textContent = isOpened ? '✕' : '☰';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuBtn.textContent = '☰';
            }
        });
    });

    /* 1-4. Dark mode toggle */
    const themeBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // DarkVeil related variables
    const sectionHero = document.querySelector('.section-hero');
    const darkVeilContainer = () => document.getElementById('darkveil-container');
    let darkVeilInstance = null;
    let darkVeilScriptLoaded = false;
    let heroVisibilityObserver = null;

    // Theme initialization function
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
            return;
        }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        applyTheme(systemTheme);
    }

    // DarkVeil initialization (light -> dark transition)
    function initDarkVeil() {
        if (darkVeilInstance) return;
        const container = darkVeilContainer();
        if (container && window.DarkVeil) {
            darkVeilInstance = window.DarkVeil.init(container, {
                hueShift: 0,
                noiseIntensity: 0.1,
                scanlineIntensity: 0.2,
                speed: 0.5,
                scanlineFrequency: 0.01,
                warpAmount: 0
            });
            const canvas = container.querySelector('canvas.darkveil-canvas');
            if (canvas) {
                canvas.style.opacity = '0';
                canvas.style.transition = 'opacity 0.4s';
                setTimeout(() => {
                    canvas.style.opacity = '1';
                }, 50);
            }
        }
    }

    // DarkVeil cleanup (dark -> light transition)
    function destroyDarkVeil(callback) {
        if (darkVeilInstance && darkVeilInstance.destroy) {
            const container = darkVeilContainer();
            const canvas = container ? container.querySelector('canvas.darkveil-canvas') : null;
            if (canvas) {
                canvas.style.transition = 'opacity 0.4s';
                canvas.style.opacity = '0';
                setTimeout(() => {
                    if (darkVeilInstance && darkVeilInstance.destroy) {
                        darkVeilInstance.destroy();
                        darkVeilInstance = null;
                    }
                    canvas.remove();
                    if (callback) callback();
                }, 600);
            } else {
                darkVeilInstance.destroy();
                darkVeilInstance = null;
                const fallbackCanvas = document.querySelector('#darkveil-container canvas.darkveil-canvas');
                if (fallbackCanvas) fallbackCanvas.remove();
                if (callback) callback();
            }
        } else {
            const canvas = document.querySelector('#darkveil-container canvas.darkveil-canvas');
            if (canvas) canvas.remove();
            darkVeilInstance = null;
            if (callback) callback();
        }
    }

    // DarkVeil script loading function
    function loadDarkVeilScript(callback) {
        if (darkVeilScriptLoaded || document.querySelector('script[src$="DarkVeil.js"]')) {
            darkVeilScriptLoaded = true;
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = './js/DarkVeil.js';
        script.onload = () => {
            darkVeilScriptLoaded = true;
            if (callback) callback();
        };
        document.body.appendChild(script);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            destroyDarkVeil();
        } else if (theme === 'dark' && sectionHero) {
            const rect = sectionHero.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                if (!darkVeilInstance) {
                    if (window.DarkVeil) {
                        initDarkVeil();
                    } else if (!darkVeilScriptLoaded) {
                        loadDarkVeilScript(() => {
                            initDarkVeil();
                        });
                    }
                }
            }
        }

        html.setAttribute('data-theme', theme);
        if (themeBtn) {
            themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    // Initial theme setup
    initializeTheme();

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Detect system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
        }
    });

    // Manage DarkVeil rendering based on Hero section visibility
    if (sectionHero) {
        heroVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!darkVeilInstance && localStorage.getItem('theme') === 'dark') {
                        if (window.DarkVeil) {
                            initDarkVeil();
                        } else if (!darkVeilScriptLoaded) {
                            loadDarkVeilScript(() => {
                                initDarkVeil();
                            });
                        }
                    }
                } else {
                    if (darkVeilInstance && darkVeilInstance.destroy) {
                        darkVeilInstance.destroy();
                        darkVeilInstance = null;
                        const canvas = document.querySelector('#darkveil-container canvas.darkveil-canvas');
                        if (canvas) canvas.remove();
                    }
                }
            });
        }, {
            threshold: 0
        });

        heroVisibilityObserver.observe(sectionHero);
    }


    /* ============================================================
       [2] ABOUT SECTION - About Section
       HAHN acrostic scroll animation
    ============================================================ */

    /* 2-1. Scroll animation (Intersection Observer) */
    const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Set observation targets: HAHN items
    const acrosticItems = document.querySelectorAll('.acrostic-item');
    acrosticItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.3}s`;
        observer.observe(item);
    });


    /* ============================================================
       [3] CAREER SECTION - Career Section
       (Currently implemented in separate career/index.html page)
    ============================================================ */
    // Career page handled separately - refer to career/index.html JavaScript if needed


    /* ============================================================
       [4] SKILLS SECTION - Skills Section
       Dynamically rendered by SkillsLoader based on ProjectLoader data
    ============================================================ */
    // Skills rendering is handled together after [5] project loading completes


    /* ============================================================
       [5] PROJECTS SECTION - Projects Section
       Project data YAML integration, dynamic loading
    ============================================================ */

    /* 5-1. Main page project loader */
    const projectsContainerMain = document.getElementById('projects-container-main');
    const skillsContainer = document.getElementById('skills-container');

    if (projectsContainerMain || skillsContainer) {
        (async () => {
            try {
                console.log('Loading projects for main page...');
                const loader = await initProjectLoader('./projects/projects.yaml');
                console.log('Projects loaded:', loader.projects.length);

                // Render project cards
                if (projectsContainerMain) {
                    const projectIds = loader.projects.slice(0, 3).map(p => p.id);
                    console.log('Rendering projects with IDs:', projectIds);
                    loader.renderProjects('projects-container-main', false, projectIds);
                }

                // Dynamic Skills section rendering
                if (skillsContainer) {
                    const skillsLoader = new SkillsLoader(loader, {
                        sortMode: SkillsLoader.SORT.COUNT_DESC,
                        showCount: true,
                        showUncategorized: true
                    });
                    skillsLoader.render('skills-container');
                    console.log('Skills rendered from', loader.getAllTags().length, 'unique tags');
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
                if (projectsContainerMain) {
                    projectsContainerMain.innerHTML = '<p>Unable to load projects.</p>';
                }
                if (skillsContainer) {
                    skillsContainer.innerHTML = '<p>Unable to load skills data.</p>';
                }
            }
        })();
    }


    /* ============================================================
       [6] CONTACT SECTION - Contact Section
       Blog data integration, latest posts display
    ============================================================ */

    /* 6-1. Blog data integration */
    const blogContainer = document.getElementById('blog-list');
    if (blogContainer) {
        const BLOG_JSON_URL = 'https://blog.by-hahn.com/posts-index.json';

        async function loadBlogPosts() {
            try {
                const response = await fetch(BLOG_JSON_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                const realData = await response.json();
                const postsToRender = realData.slice(0, 3);

                blogContainer.innerHTML = '';

                postsToRender.forEach(post => {
                    const postHTML = `
                    <article class="blog-card">
                        <div class="card-content">
                            <div class="project-tags">
                                <span>${post.category}</span>
                            </div>
                            <h3 class="project-name">${post.title}</h3>
                            <p class="project-desc">${post.description}</p>
                            <div class="card-links">
                                <span style="font-size:0.8rem; color:var(--text-secondary); margin-right:10px;">${post.date}</span>
                                <a href="${post.url}" target="_blank">Read More</a>
                            </div>
                        </div>
                    </article>
                `;
                    blogContainer.insertAdjacentHTML('beforeend', postHTML);
                });

            } catch (error) {
                console.error('Failed to load blog posts:', error);
                blogContainer.innerHTML = '<p>Unable to load posts.</p>';
            }
        }

        loadBlogPosts();
    }


    /* ============================================================
       [7] SCROLL DOWN INDICATOR
       Hero section bottom bounce indicator with hover-to-rest effect
    ============================================================ */

    /* 7-1. Scroll-down bounce & hover interaction */
    const scrollDownEl = document.querySelector('.scroll-down');
    if (scrollDownEl) {
        let resting = false;

        scrollDownEl.addEventListener('mouseenter', function () {
            if (resting) return;
            resting = true;
            scrollDownEl.style.animation = 'none';
            scrollDownEl.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            void scrollDownEl.offsetHeight; // reflow to apply transition
            scrollDownEl.style.transform = 'translateX(-50%) translateY(10px)';
        });

        scrollDownEl.addEventListener('mouseleave', function () {
            if (!resting) return;
            scrollDownEl.style.transform = 'translateX(-50%) translateY(-4px)';
            setTimeout(function () {
                scrollDownEl.style.transition = '';
                scrollDownEl.style.transform = '';
                scrollDownEl.style.animation = '';
                resting = false;
            }, 350);
        });

        scrollDownEl.addEventListener('click', function () {
            const hero = document.querySelector('.section-hero');
            if (hero && hero.nextElementSibling) {
                hero.nextElementSibling.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

});
