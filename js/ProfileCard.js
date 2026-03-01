// ProfileCard.js - Pure Vanilla JavaScript Implementation
// Based on @react-bits/ProfileCard-JS-CSS

class ProfileCard {
  constructor(options) {
    this.options = {
      miniAvatarUrl: options.miniAvatarUrl || '../images/profile.jpg',
      avatarUrl: options.avatarUrl || '../images/profilecard_1.jpg',
      hoverImageUrl: options.hoverImageUrl || '../images/profilecard_2.jpg',
      name: options.name || 'HAHN',
      title: options.title || 'AI Engineer',
      handle: options.handle || 'by-hahn',
      status: options.status || 'Online',
      contactText: options.contactText || 'Contact Me',
      showUserInfo: options.showUserInfo !== false,
      enableTilt: options.enableTilt !== false,
      enableMobileTilt: options.enableMobileTilt || false,
      mobileTiltSensitivity: options.mobileTiltSensitivity || 5,
      behindGlowEnabled: options.behindGlowEnabled !== false,
      behindGlowColor: options.behindGlowColor || 'hsla(255, 100%, 70%, 0.6)',
      customInnerGradient: options.customInnerGradient || 'linear-gradient(145deg,hsla(255, 40%, 45%, 0.55) 0%,hsla(177, 60%, 70%, 0.27) 100%)',
      onContactClick: options.onContactClick || function() { console.log('Contact clicked'); }
    };

    this.wrapRef = null;
    this.shellRef = null;
    this.enterTimer = null;
    this.leaveRaf = null;
    this.tiltEngine = null;

    this.ANIMATION_CONFIG = {
      INITIAL_DURATION: 1200,
      INITIAL_X_OFFSET: 70,
      INITIAL_Y_OFFSET: 60,
      DEVICE_BETA_OFFSET: 20,
      ENTER_TRANSITION_MS: 180
    };
  }

  clamp(v, min = 0, max = 100) {
    return Math.min(Math.max(v, min), max);
  }

  round(v, precision = 3) {
    return parseFloat(v.toFixed(precision));
  }

  adjust(v, fMin, fMax, tMin, tMax) {
    return this.round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));
  }

  createTiltEngine() {
    if (!this.options.enableTilt) return null;

    const engine = {
      rafId: null,
      running: false,
      lastTs: 0,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      DEFAULT_TAU: 0.14,
      INITIAL_TAU: 0.6,
      initialUntil: 0,
      profileCard: this
    };

    engine.setVarsFromXY = (x, y) => {
      const shell = this.shellRef;
      const wrap = this.wrapRef;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = this.clamp((100 / width) * x);
      const percentY = this.clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${this.adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${this.adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${this.clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${this.round(-(centerX / 5))}deg`,
        '--rotate-y': `${this.round(centerY / 4)}deg`
      };

      for (const [k, v] of Object.entries(properties)) {
        wrap.style.setProperty(k, v);
      }
    };

    engine.step = (ts) => {
      if (!engine.running) return;
      if (engine.lastTs === 0) engine.lastTs = ts;
      const dt = (ts - engine.lastTs) / 1000;
      engine.lastTs = ts;

      const tau = ts < engine.initialUntil ? engine.INITIAL_TAU : engine.DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      engine.currentX += (engine.targetX - engine.currentX) * k;
      engine.currentY += (engine.targetY - engine.currentY) * k;

      engine.setVarsFromXY(engine.currentX, engine.currentY);

      const stillFar = Math.abs(engine.targetX - engine.currentX) > 0.05 || 
                       Math.abs(engine.targetY - engine.currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        engine.rafId = requestAnimationFrame(engine.step);
      } else {
        engine.running = false;
        engine.lastTs = 0;
        if (engine.rafId) {
          cancelAnimationFrame(engine.rafId);
          engine.rafId = null;
        }
      }
    };

    engine.start = () => {
      if (engine.running) return;
      engine.running = true;
      engine.lastTs = 0;
      engine.rafId = requestAnimationFrame(engine.step);
    };

    engine.setImmediate = (x, y) => {
      engine.currentX = x;
      engine.currentY = y;
      engine.setVarsFromXY(engine.currentX, engine.currentY);
    };

    engine.setTarget = (x, y) => {
      engine.targetX = x;
      engine.targetY = y;
      engine.start();
    };

    engine.toCenter = () => {
      const shell = this.shellRef;
      if (!shell) return;
      engine.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
    };

    engine.beginInitial = (durationMs) => {
      engine.initialUntil = performance.now() + durationMs;
      engine.start();
    };

    engine.getCurrent = () => {
      return { x: engine.currentX, y: engine.currentY, tx: engine.targetX, ty: engine.targetY };
    };

    engine.cancel = () => {
      if (engine.rafId) cancelAnimationFrame(engine.rafId);
      engine.rafId = null;
      engine.running = false;
      engine.lastTs = 0;
    };

    return engine;
  }

  getOffsets(evt, el) {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  handlePointerMove = (event) => {
    const shell = this.shellRef;
    if (!shell || !this.tiltEngine) return;
    const { x, y } = this.getOffsets(event, shell);
    this.tiltEngine.setTarget(x, y);
  }

  handlePointerEnter = (event) => {
    const shell = this.shellRef;
    if (!shell || !this.tiltEngine) return;

    shell.classList.add('active');
    shell.classList.add('entering');
    if (this.enterTimer) window.clearTimeout(this.enterTimer);
    this.enterTimer = window.setTimeout(() => {
      shell.classList.remove('entering');
    }, this.ANIMATION_CONFIG.ENTER_TRANSITION_MS);

    const { x, y } = this.getOffsets(event, shell);
    this.tiltEngine.setTarget(x, y);
  }

  handlePointerLeave = () => {
    const shell = this.shellRef;
    if (!shell || !this.tiltEngine) return;

    this.tiltEngine.toCenter();

    const checkSettle = () => {
      const { x, y, tx, ty } = this.tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove('active');
        this.leaveRaf = null;
      } else {
        this.leaveRaf = requestAnimationFrame(checkSettle);
      }
    };
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
    this.leaveRaf = requestAnimationFrame(checkSettle);
  }

  handleDeviceOrientation = (event) => {
    const shell = this.shellRef;
    if (!shell || !this.tiltEngine) return;

    const { beta, gamma } = event;
    if (beta == null || gamma == null) return;

    const centerX = shell.clientWidth / 2;
    const centerY = shell.clientHeight / 2;
    const x = this.clamp(centerX + gamma * this.options.mobileTiltSensitivity, 0, shell.clientWidth);
    const y = this.clamp(
      centerY + (beta - this.ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * this.options.mobileTiltSensitivity,
      0,
      shell.clientHeight
    );

    this.tiltEngine.setTarget(x, y);
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    const cardStyle = `
      --inner-gradient: ${this.options.customInnerGradient};
      --behind-glow-color: ${this.options.behindGlowColor};
    `;

    const html = `
      <div class="pc-card-wrapper" style="${cardStyle}">
        ${this.options.behindGlowEnabled ? '<div class="pc-behind"></div>' : ''}
        <div class="pc-card-shell">
          <section class="pc-card">
            <div class="pc-inside">
              <div class="pc-shine"></div>
              <div class="pc-glare"></div>
              <div class="pc-content pc-avatar-content">
                <img class="avatar" src="${this.options.avatarUrl}" alt="${this.options.name} avatar" loading="lazy">
                <img class="avatar-hover" src="${this.options.hoverImageUrl}" alt="${this.options.name} hologram" loading="lazy">
                ${this.options.showUserInfo ? `
                  <div class="pc-user-info">
                    <div class="pc-user-details">
                      <div class="pc-mini-avatar">
                        <img src="${this.options.miniAvatarUrl}" alt="${this.options.name} mini avatar" loading="lazy">
                      </div>
                      <div class="pc-user-text">
                        <div class="pc-handle">@${this.options.handle}</div>
                        <div class="pc-status">${this.options.status}</div>
                      </div>
                    </div>
                    <button class="pc-contact-btn" type="button" aria-label="Contact ${this.options.name}">
                      ${this.options.contactText}
                    </button>
                  </div>
                ` : ''}
              </div>
              <div class="pc-content">
                <div class="pc-details">
                  <h3>${this.options.name}</h3>
                  <p>${this.options.title}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.init();
  }

  init() {
    this.wrapRef = document.querySelector('.pc-card-wrapper');
    this.shellRef = document.querySelector('.pc-card-shell');

    if (!this.wrapRef || !this.shellRef) return;

    if (this.options.enableTilt) {
      this.tiltEngine = this.createTiltEngine();

      this.shellRef.addEventListener('pointerenter', this.handlePointerEnter);
      this.shellRef.addEventListener('pointermove', this.handlePointerMove);
      this.shellRef.addEventListener('pointerleave', this.handlePointerLeave);

      if (this.options.enableMobileTilt) {
        this.shellRef.addEventListener('click', () => {
          if (location.protocol !== 'https:') return;
          const anyMotion = window.DeviceMotionEvent;
          if (anyMotion && typeof anyMotion.requestPermission === 'function') {
            anyMotion.requestPermission()
              .then(state => {
                if (state === 'granted') {
                  window.addEventListener('deviceorientation', this.handleDeviceOrientation);
                }
              })
              .catch(console.error);
          } else {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation);
          }
        });
      }

      const initialX = (this.shellRef.clientWidth || 0) - this.ANIMATION_CONFIG.INITIAL_X_OFFSET;
      const initialY = this.ANIMATION_CONFIG.INITIAL_Y_OFFSET;
      this.tiltEngine.setImmediate(initialX, initialY);
      this.tiltEngine.toCenter();
      this.tiltEngine.beginInitial(this.ANIMATION_CONFIG.INITIAL_DURATION);
    }

    // Contact button click handler
    const contactBtn = this.wrapRef.querySelector('.pc-contact-btn');
    if (contactBtn) {
      contactBtn.addEventListener('click', this.options.onContactClick);
    }
  }

  destroy() {
    if (this.options.enableTilt && this.shellRef) {
      this.shellRef.removeEventListener('pointerenter', this.handlePointerEnter);
      this.shellRef.removeEventListener('pointermove', this.handlePointerMove);
      this.shellRef.removeEventListener('pointerleave', this.handlePointerLeave);
      window.removeEventListener('deviceorientation', this.handleDeviceOrientation);
    }
    if (this.enterTimer) window.clearTimeout(this.enterTimer);
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
    if (this.tiltEngine) this.tiltEngine.cancel();
  }
}
