/**
 * AR-PORTAL — Core Portal Occlusion Engine, Direct Three.js Texture Manager,
 * Simulated AR Stage & Spatial Audio Synthesizer
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

  applyToSphere(sphereEl, worldId, side) {
    if (!sphereEl) return;
    const tex = this.textures[worldId];
    if (!tex) return;

    const applyMesh = () => {
      const mesh = sphereEl.getObject3D('mesh');
      if (mesh) {
        mesh.material = new THREE.MeshBasicMaterial({
          map: tex,
          side: side,
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

// 3. Depth-Mask Occluder Material Component (writes to Z-buffer only, colorWrite: false)
AFRAME.registerComponent('depth-mask-material', {
  init: function () {
    const applyMaterial = () => {
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        mesh.material = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.DoubleSide
        });
        mesh.renderOrder = -1;
        mesh.material.needsUpdate = true;
      }
    };

    this.el.addEventListener('object3dset', applyMaterial);
    if (this.el.getObject3D('mesh')) {
      applyMaterial();
    }
    setTimeout(applyMaterial, 100);
    setTimeout(applyMaterial, 450);
  }
});

// 4. Dual-Perspective Portal Visibility Component with Hysteresis & Sim Mode Support
AFRAME.registerComponent('portal-visibility', {
  init: function () {
    this.portalRoot = null;
    this.insideView = null;
    this.outsideView = null;
    this.lastState = null;
    this.hysteresisThreshold = 0.04;
    this.frameCount = 0;
    this.updateFrequency = 2;
    this.markerVisible = false;

    const marker = document.querySelector('#hiro-marker');
    if (marker) {
      marker.addEventListener('markerFound', () => {
        this.markerVisible = true;
        if (window.isSimulationMode) {
          // Automatically dock back to real marker if user scans physical Hiro target
          window.setSimulationMode(false);
        }
        updateTrackingBadge(true, this.lastState === true, false);
      });
      marker.addEventListener('markerLost', () => {
        this.markerVisible = false;
        if (!window.isSimulationMode) {
          updateTrackingBadge(false, false, false);
        }
      });
    }
  },

  tick: function () {
    this.frameCount++;
    if (this.frameCount % this.updateFrequency !== 0) return;

    const camera = this.el.sceneEl && this.el.sceneEl.camera;
    if (!this.portalRoot) this.portalRoot = document.querySelector('#portal-root');
    if (!this.insideView) this.insideView = document.querySelector('#portal-inside');
    if (!this.outsideView) this.outsideView = document.querySelector('#portal-outside');

    if (!camera || !this.portalRoot || !this.insideView || !this.outsideView) return;

    const localPosition = new THREE.Vector3();
    camera.getWorldPosition(localPosition);
    this.portalRoot.object3D.worldToLocal(localPosition);

    let isInside;
    if (this.lastState === null) {
      isInside = localPosition.z < 0;
    } else if (this.lastState === true) {
      isInside = localPosition.z < this.hysteresisThreshold;
    } else {
      isInside = localPosition.z < -this.hysteresisThreshold;
    }

    if (isInside !== this.lastState) {
      this.insideView.setAttribute('visible', isInside);
      this.outsideView.setAttribute('visible', !isInside);
      if (this.lastState !== null && (this.markerVisible || window.isSimulationMode)) {
        PortalAudio.playThresholdCross(isInside);
      }
      this.lastState = isInside;
      if (this.markerVisible || window.isSimulationMode) {
        updateTrackingBadge(true, isInside, window.isSimulationMode);
      }
    }
  }
});

// 5. World Switching, Cube Excursion Controls & Simulated AR Stage
let currentWorldIndex = 0;
let currentCubeMode = 'loop'; // 'loop' | 'out' | 'in'
window.isSimulationMode = false;

function updateTrackingBadge(locked, isInside, isSim) {
  const pill = document.getElementById('tracking-pill');
  const text = document.getElementById('tracking-text');
  if (!pill || !text) return;

  pill.classList.remove('locked', 'inside');
  if (isSim) {
    pill.classList.add('locked');
    text.textContent = isInside ? 'Sim 360° Inside' : 'Sim Portal Active';
  } else if (!locked) {
    text.textContent = 'Scan Hiro or Tap Sim';
  } else if (isInside) {
    pill.classList.add('inside');
    text.textContent = 'Inside Portal 360°';
  } else {
    pill.classList.add('locked');
    text.textContent = 'Hiro Locked';
  }
}

window.updateCubeTelemetry = function (inRealWorld, zVal) {
  const badge = document.getElementById('cube-telemetry');
  if (!badge) return;
  const signStr = zVal >= 0 ? `+${zVal.toFixed(2)}m` : `${zVal.toFixed(2)}m`;
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

  const insideSphere = document.querySelector('#inside-sphere');
  const outsideSphere = document.querySelector('#outside-sphere');

  // Directly apply Three.js 4K textures to guarantee instant switching on all mobile browsers
  TextureCache.applyToSphere(insideSphere, world.id, THREE.DoubleSide);
  TextureCache.applyToSphere(outsideSphere, world.id, THREE.BackSide);

  if (insideSphere) {
    insideSphere.setAttribute('rotation', world.sphereRotationInside || '0 -90 0');
  }
  if (outsideSphere) {
    outsideSphere.setAttribute('rotation', world.sphereRotationOutside || '0 0 0');
  }

  // Update Portal Frame metallic/emissive accents
  document.querySelectorAll('.portal-beam').forEach((beam) => {
    beam.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameEmissive}; emissiveIntensity: 0.6; metalness: 0.9; roughness: 0.15`
    );
  });
  document.querySelectorAll('.portal-corner').forEach((corner) => {
    corner.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameColor}; emissiveIntensity: 0.95; shader: flat; transparent: true; opacity: 0.65`
    );
  });

  // Update Excursion Cube accent color
  const portalRoot = document.querySelector('#portal-root');
  if (portalRoot && portalRoot.components && portalRoot.components['portal-excursion-cube']) {
    portalRoot.components['portal-excursion-cube'].setWorldAccent(world.frameColor);
  }

  // Rebuild 3D Spatial Modeling inside both outside & inside portal volumes
  const spatialMarkup = window.buildWorldSpatialVolume(world.id);
  const outsideVolume = document.querySelector('#outside-volume');
  const insideVolume = document.querySelector('#inside-volume');
  if (outsideVolume) outsideVolume.innerHTML = spatialMarkup;
  if (insideVolume) insideVolume.innerHTML = spatialMarkup;

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

// Toggle Simulated AR Mode (allows experiencing the Portal & In-Out Cube without a physical Hiro marker)
window.setSimulationMode = function (enable) {
  window.isSimulationMode = enable;
  const marker = document.querySelector('#hiro-marker');
  const simAnchor = document.querySelector('#sim-portal-anchor');
  const portalRoot = document.querySelector('#portal-root');
  const simBtn = document.getElementById('btn-sim-mode');

  if (!marker || !simAnchor || !portalRoot) return;

  if (enable) {
    simAnchor.object3D.add(portalRoot.object3D);
    portalRoot.object3D.position.set(0, 0, 0);
    portalRoot.object3D.rotation.set(0, 0, 0);
    simAnchor.setAttribute('visible', 'true');
    if (simBtn) simBtn.classList.add('active');
    updateTrackingBadge(true, false, true);
  } else {
    marker.object3D.add(portalRoot.object3D);
    portalRoot.object3D.position.set(0, 0, 0);
    portalRoot.object3D.rotation.set(-Math.PI / 2, 0, 0);
    simAnchor.setAttribute('visible', 'false');
    if (simBtn) simBtn.classList.remove('active');
    updateTrackingBadge(false, false, false);
  }
};

window.toggleSimulationMode = function () {
  window.setSimulationMode(!window.isSimulationMode);
};

window.toggleMarkerModal = function (forceState) {
  const modal = document.getElementById('marker-modal');
  if (!modal) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !modal.classList.contains('open');
  modal.classList.toggle('open', shouldOpen);
};

// Initialize Scene, Retina Sharpness & Interactive Touch/Drag Controls
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');

  const enforceRetinaResolution = () => {
    if (sceneEl && sceneEl.renderer) {
      const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
      sceneEl.renderer.setPixelRatio(dpr);
    }
  };

  if (sceneEl) {
    sceneEl.addEventListener('loaded', () => {
      enforceRetinaResolution();
      TextureCache.preloadAll(sceneEl.renderer);

      const loader = document.getElementById('loading-overlay');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 350);
      }

      sceneEl.setAttribute('portal-visibility', '');
      window.selectPortalWorld(0, false);
    });
  }

  window.addEventListener('resize', enforceRetinaResolution);

  // Explicit touch/pointer bindings for mobile reliability (bypasses AR.js canvas interception)
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

  // Interactive drag-to-orbit in Simulated AR Mode so user can inspect the portal & in-out cube from any angle
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotY = 0;
  let rotX = 0;

  window.addEventListener('pointerdown', (e) => {
    if (
      e.target.closest('#hud-top') ||
      e.target.closest('#hud-bottom') ||
      e.target.closest('#marker-modal')
    ) {
      return;
    }
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging || !window.isSimulationMode) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    rotY = THREE.MathUtils.clamp(rotY + dx * 0.25, -42, 42);
    rotX = THREE.MathUtils.clamp(rotX + dy * 0.2, -28, 28);
    const simAnchor = document.querySelector('#sim-portal-anchor');
    if (simAnchor) {
      simAnchor.setAttribute('rotation', `${rotX} ${rotY} 0`);
    }
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });
});
