/**
 * AR-PORTAL — 8th Wall SLAM Portal Engine (js/portal-engine.js)
 *
 * Implements the official 8th Wall Portal Architecture (https://github.com/8thwall/8thwall &
 * examples/aframe/portal/portal-components.js + portal-aframe):
 *  - Powered by @8thwall/engine-binary (6DoF Visual-Inertial SLAM + Image Target Detection)
 *    and @8thwall/xrextras.
 *  - The Portal Doorway, Hider Enclosure (#hider-walls), Portal Wall (#portal-wall), and
 *    Portal Contents (#portal-contents) sit at FIXED World-Space coordinates (0, 0, 0) so the
 *    window frame NEVER jitters or moves with the phone.
 *  - <a-camera id="camera"> moves in 6DoF World Space driven by 8th Wall's SLAM engine.
 *  - Exact 8th Wall portal bounds-crossing math (isOutside, withinPortalBounds, isInPortalSpace).
 */

// 1. Procedural Web Audio API Portal Synthesizer
const PortalAudio = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playWorldSwitch(baseFreq = 110) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.0, baseFreq * 3.0];

      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f * 0.85, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(f, now + 0.35 + i * 0.04);

        gain.gain.setValueAtTime(0.001, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.08 + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65 + i * 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 0.7 + i * 0.04);
      });
    } catch (e) {}
  },

  playThresholdCross(entering) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(entering ? 95 : 230, now);
      osc.frequency.exponentialRampToValueAtTime(entering ? 250 : 85, now + 0.38);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }
};
window.PortalAudio = PortalAudio;

// 2. Direct Three.js High-Definition 4K Texture Cache (with 16x Anisotropy)
const TextureCache = {
  textures: {},
  loader: new THREE.TextureLoader(),

  preloadAll(renderer) {
    const worlds = window.PORTAL_WORLDS || [];
    const maxAnisotropy =
      renderer && renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 16;

    worlds.forEach((w) => {
      if (this.textures[w.id]) return;
      const tex = this.loader.load(w.src, (loadedTex) => {
        loadedTex.anisotropy = maxAnisotropy;
        loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTex.magFilter = THREE.LinearFilter;
        loadedTex.generateMipmaps = true;
        if ('colorSpace' in loadedTex && THREE.SRGBColorSpace) {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
        }
        loadedTex.needsUpdate = true;
      });
      tex.anisotropy = maxAnisotropy;
      if ('colorSpace' in tex && THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      }
      this.textures[w.id] = tex;
    });
  },

  applyToSky(skyEl, worldId) {
    if (!skyEl) return;
    const tex = this.textures[worldId];
    if (!tex) return;

    const applyMesh = () => {
      const mesh = skyEl.getObject3D('mesh');
      if (mesh) {
        mesh.material = new THREE.MeshBasicMaterial({
          map: tex,
          side: THREE.BackSide,
          depthWrite: true,
          depthTest: true
        });
        mesh.material.needsUpdate = true;
      }
    };

    applyMesh();
    setTimeout(applyMesh, 60);
  }
};

// 3. Guaranteed Hider Material Enforcement (ensures colorWrite: false & renderOrder: -1 on all 8th Wall hider boxes)
AFRAME.registerComponent('hider-material-fallback', {
  init: function () {
    const hiderMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide
    });

    const applyHider = () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.material = hiderMat;
      mesh.renderOrder = -1;
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material = hiderMat;
          node.renderOrder = -1;
        }
      });
    };

    applyHider();
    this.el.addEventListener('object3dset', applyHider);
    this.el.addEventListener('model-loaded', applyHider);
    setTimeout(applyHider, 80);
    setTimeout(applyHider, 350);
  }
});

// 4. Official 8th Wall Portal Component Math (from 8thwall/web/examples/aframe/portal/portal-components.js)
AFRAME.registerComponent('portal', {
  schema: {
    width: { default: 4 },
    height: { default: 6 },
    depth: { default: 1 }
  },

  init: function () {
    this.camera = document.getElementById('camera');
    this.contents = document.getElementById('portal-contents');
    this.walls = document.getElementById('hider-walls');
    this.portalWall = document.getElementById('portal-wall');
    this.isInPortalSpace = false;
    this.wasOutside = true;
    this.lastReportedInside = null;
  },

  tick: function () {
    if (!this.camera) this.camera = document.getElementById('camera');
    if (!this.contents) this.contents = document.getElementById('portal-contents');
    if (!this.walls) this.walls = document.getElementById('hider-walls');
    if (!this.portalWall) this.portalWall = document.getElementById('portal-wall');
    if (!this.camera || !this.contents || !this.walls || !this.portalWall) return;

    const position = this.camera.object3D.position;

    // Official 8th Wall Portal Math:
    const isOutside = position.z > this.data.depth / 2;
    const withinPortalBounds =
      position.y < this.data.height && Math.abs(position.x) < this.data.width / 2;

    if (this.wasOutside !== isOutside && withinPortalBounds) {
      this.isInPortalSpace = !isOutside;
    }

    this.contents.object3D.visible = this.isInPortalSpace || isOutside;
    this.walls.object3D.visible = !this.isInPortalSpace && isOutside;
    this.portalWall.object3D.visible = this.isInPortalSpace && !isOutside;

    this.wasOutside = isOutside;

    if (this.isInPortalSpace !== this.lastReportedInside) {
      if (this.lastReportedInside !== null) {
        PortalAudio.playThresholdCross(this.isInPortalSpace);
      }
      this.lastReportedInside = this.isInPortalSpace;
      updateTrackingBadge('slam', this.isInPortalSpace);
    }
  }
});

// 5. 8th Wall Tap-to-Place & Hiro Image Target Recenter Component (from 8thwall portal-aframe)
AFRAME.registerComponent('tap-to-place-portal', {
  init: function () {
    const sceneEl = this.el.sceneEl || this.el;
    const doorway = document.getElementById('portal-doorway');
    const portalRoot = document.getElementById('portal-root');

    this.hasPlaced = false;

    const animatePortalOpen = () => {
      if (doorway) {
        doorway.removeAttribute('animation__open');
        doorway.setAttribute('animation__open', {
          property: 'scale',
          dur: 1200,
          from: '0.001 0.001 0.001',
          to: '1 1 1',
          easing: 'easeOutElastic'
        });
      }
      if (portalRoot) {
        portalRoot.removeAttribute('animation__open');
        portalRoot.setAttribute('animation__open', {
          property: 'scale',
          dur: 1200,
          from: '0.001 0.001 0.001',
          to: '4 4 4',
          easing: 'easeOutElastic'
        });
      }
      PortalAudio.playWorldSwitch(130.8);
    };

    window.recenterPortal = (animate = false) => {
      sceneEl.emit('recenter');
      if (animate || !this.hasPlaced) {
        this.hasPlaced = true;
        animatePortalOpen();
      }
      const portalComp = sceneEl.components && sceneEl.components.portal;
      const isInside = portalComp ? portalComp.isInPortalSpace : false;
      updateTrackingBadge('slam', isInside);
    };

    // When 8th Wall SLAM initializes, anchor the portal in 6DoF World Space immediately
    sceneEl.addEventListener('realityready', () => {
      const loader = document.getElementById('loading-overlay');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 300);
      }
      window.recenterPortal(true);
    });

    // If the user scans the Hiro marker, snap/recenter the 8th Wall SLAM anchor onto that point
    sceneEl.addEventListener('xrimagefound', () => {
      window.recenterPortal(false);
    });

    // Like 8th Wall's xrextras-tap-recenter / tapToPlacePortalComponent:
    // tapping the 3D canvas re-anchors the portal directly at the point you're facing
    window.addEventListener('click', (e) => {
      if (
        e.target.closest('#hud-top') ||
        e.target.closest('#hud-bottom') ||
        e.target.closest('#marker-modal')
      ) {
        return;
      }
      if (window.recenterPortal) {
        window.recenterPortal(false);
      }
    });
  }
});

// Configure 8th Wall Image Target (Hiro Target) + SLAM World Tracking on xrloaded
const configure8thWallEngine = () => {
  if (!window.XR8 || !window.XR8.XrController) return;
  try {
    window.XR8.XrController.configure({
      imageTargetData: [
        {
          type: 'PLANAR',
          properties: {
            top: 0,
            left: 0,
            width: 480,
            height: 640,
            isRotated: false,
            originalWidth: 480,
            originalHeight: 640
          },
          imagePath: './assets/targets/hiro-target_luminance.jpg',
          metadata: null,
          name: 'hiro-target'
        }
      ]
    });
  } catch (e) {}
};
if (window.XR8) {
  configure8thWallEngine();
} else {
  window.addEventListener('xrloaded', configure8thWallEngine);
}

// 6. World Switching, Cube Excursion Controls & Step-Inside Toggle
let currentWorldIndex = 0;
let currentCubeMode = 'loop';
window.isInsideSimWalk = false;

function updateTrackingBadge(state, isInside) {
  const pill = document.getElementById('tracking-pill');
  const text = document.getElementById('tracking-text');
  if (!pill || !text) return;

  pill.classList.remove('locked', 'inside');
  if (isInside) {
    pill.classList.add('inside');
    text.textContent = 'Inside Portal 360°';
  } else {
    pill.classList.add('locked');
    text.textContent = '8th Wall 6DoF Locked';
  }
}

window.updateCubeTelemetry = function (inRealWorld, zVal) {
  const badge = document.getElementById('cube-telemetry');
  if (!badge) return;
  const worldZ = zVal * 4.0;
  const signStr = worldZ >= 0 ? `+${worldZ.toFixed(1)}m` : `${worldZ.toFixed(1)}m`;
  if (inRealWorld) {
    badge.textContent = `CUBE: REAL WORLD (${signStr})`;
    badge.classList.add('real-world');
  } else {
    badge.textContent = `CUBE: IN PORTAL (${signStr})`;
    badge.classList.remove('real-world');
  }
};

window.selectPortalWorld = function (index, playSound = true) {
  const worlds = window.PORTAL_WORLDS || [];
  if (!worlds.length) return;

  currentWorldIndex = ((index % worlds.length) + worlds.length) % worlds.length;
  const world = worlds[currentWorldIndex];

  const portalSky = document.querySelector('#portal-sky');
  if (portalSky) {
    TextureCache.applyToSky(portalSky, world.id);
    portalSky.setAttribute('rotation', world.sphereRotationInside || '0 -90 0');
  }

  // Update Portal Frame metallic/emissive accents
  document.querySelectorAll('.portal-beam').forEach((beam) => {
    beam.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameEmissive}; emissiveIntensity: 0.75; metalness: 0.9; roughness: 0.15`
    );
  });
  document.querySelectorAll('.portal-corner').forEach((corner) => {
    corner.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameColor}; emissiveIntensity: 0.95; shader: flat`
    );
  });

  // Update Excursion Cube accent color
  const portalRoot = document.querySelector('#portal-root');
  if (portalRoot && portalRoot.components && portalRoot.components['portal-excursion-cube']) {
    portalRoot.components['portal-excursion-cube'].setWorldAccent(world.frameColor);
  }

  // Rebuild 3D Spatial Modeling inside the unified #portal-volume
  const spatialMarkup = window.buildWorldSpatialVolume(world.id);
  const portalVolume = document.querySelector('#portal-volume');
  if (portalVolume) portalVolume.innerHTML = spatialMarkup;

  // Update HUD CSS accent & active tab state
  document.documentElement.style.setProperty('--portal-accent', world.frameColor);
  const subtitleEl = document.getElementById('active-world-subtitle');
  if (subtitleEl) subtitleEl.textContent = world.subtitle;

  document.querySelectorAll('.world-tab').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === currentWorldIndex);
  });

  if (playSound) {
    PortalAudio.playWorldSwitch(world.audioFreq);
  }
};

window.cyclePortalWorld = function () {
  window.selectPortalWorld(currentWorldIndex + 1, true);
};

window.setCubeExcursionMode = function (mode) {
  currentCubeMode = mode;
  const portalRoot = document.querySelector('#portal-root');
  if (portalRoot) {
    portalRoot.setAttribute('portal-excursion-cube', `mode: ${mode}`);
  }
  document.querySelectorAll('.cube-mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  PortalAudio.playThresholdCross(mode === 'out');
};

// Allows stepping directly inside/outside the portal on desktop or with one tap
window.toggleStepInsidePortal = function () {
  const cameraEl = document.getElementById('camera');
  const sceneEl = document.querySelector('a-scene');
  const portalComp = sceneEl && sceneEl.components && sceneEl.components.portal;
  const stepBtn = document.getElementById('btn-step-inside');
  if (!cameraEl || !portalComp) return;

  window.isInsideSimWalk = !portalComp.isInPortalSpace;
  if (window.isInsideSimWalk) {
    // Move camera through the 4x6 doorway (x=0, y=4) from z > 0.5 to z = -2.0
    cameraEl.object3D.position.set(0, 4, 1.0);
    portalComp.tick();
    cameraEl.object3D.position.set(0, 4, -2.0);
    portalComp.tick();
    if (stepBtn) stepBtn.classList.add('active');
  } else {
    // Step back out through the doorway from z < 0.5 to z = 9.0
    cameraEl.object3D.position.set(0, 4, -0.5);
    portalComp.tick();
    cameraEl.object3D.position.set(0, 4, 9.0);
    portalComp.tick();
    if (stepBtn) stepBtn.classList.remove('active');
  }
};

window.toggleMarkerModal = function (forceState) {
  const modal = document.getElementById('marker-modal');
  if (!modal) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !modal.classList.contains('open');
  modal.classList.toggle('open', shouldOpen);
};

// Initialize Scene, Retina Sharpness & Interactive Touch Controls
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');

  const hideLoaderFallback = () => {
    const loader = document.getElementById('loading-overlay');
    if (loader && loader.style.display !== 'none') {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 350);
    }
  };

  if (sceneEl) {
    sceneEl.addEventListener('loaded', () => {
      if (sceneEl.renderer) {
        const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
        sceneEl.renderer.setPixelRatio(dpr);
      }
      TextureCache.preloadAll(sceneEl.renderer);
      window.selectPortalWorld(0, false);
      setTimeout(hideLoaderFallback, 1800);
    });
  }

  // Explicit touch/pointer bindings for mobile reliability
  document.querySelectorAll('.world-tab').forEach((btn, idx) => {
    const handler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.selectPortalWorld(idx, true);
    };
    btn.addEventListener('touchend', handler, { passive: false });
    btn.addEventListener('click', handler);
  });

  document.querySelectorAll('.cube-mode-btn').forEach((btn) => {
    const handler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.setCubeExcursionMode(btn.dataset.mode);
    };
    btn.addEventListener('touchend', handler, { passive: false });
    btn.addEventListener('click', handler);
  });
});
