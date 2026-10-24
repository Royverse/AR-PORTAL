/**
 * AR-PORTAL — Core Portal Occlusion Engine, Hysteresis Tracker & Spatial Audio Synth
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
    } catch (e) {
      // Ignore audio autoplay restrictions prior to user gesture
    }
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
      osc.frequency.setValueAtTime(entering ? 85 : 220, now);
      osc.frequency.exponentialRampToValueAtTime(entering ? 240 : 80, now + 0.45);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) {}
  }
};

// 2. Depth-Mask Occluder Material Component (writes to Z-buffer only, colorWrite: false)
AFRAME.registerComponent('depth-mask-material', {
  init: function () {
    const applyMaterial = () => {
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        mesh.material = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          depthTest: true
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

// 3. Dual-Perspective Portal Visibility Component with Hysteresis
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
        updateTrackingBadge(true, this.lastState === true);
      });
      marker.addEventListener('markerLost', () => {
        this.markerVisible = false;
        updateTrackingBadge(false, false);
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
      if (this.lastState !== null && this.markerVisible) {
        PortalAudio.playThresholdCross(isInside);
      }
      this.lastState = isInside;
      if (this.markerVisible) {
        updateTrackingBadge(true, isInside);
      }
    }
  }
});

// 4. World Switching & 3D Spatial Modeling Controller
let currentWorldIndex = 0;
let isSwitchingWorld = false;

function updateTrackingBadge(locked, isInside) {
  const pill = document.getElementById('tracking-pill');
  const text = document.getElementById('tracking-text');
  if (!pill || !text) return;

  pill.classList.remove('locked', 'inside');
  if (!locked) {
    text.textContent = 'Scan Hiro Marker';
  } else if (isInside) {
    pill.classList.add('inside');
    text.textContent = 'Inside Portal 360°';
  } else {
    pill.classList.add('locked');
    text.textContent = 'Portal Locked';
  }
}

window.selectPortalWorld = function (index, playSound = true) {
  if (isSwitchingWorld) return;
  const worlds = window.PORTAL_WORLDS || [];
  if (!worlds.length) return;

  currentWorldIndex = ((index % worlds.length) + worlds.length) % worlds.length;
  const world = worlds[currentWorldIndex];
  isSwitchingWorld = true;

  // Update 360° & 180° Nano Banana panoramic canvases
  const insideSphere = document.querySelector('#inside-sphere');
  const outsideSphere = document.querySelector('#outside-sphere');

  if (insideSphere) {
    insideSphere.setAttribute('material', 'src', world.assetId);
    insideSphere.setAttribute('rotation', world.sphereRotationInside || '0 90 0');
  }
  if (outsideSphere) {
    outsideSphere.setAttribute('material', 'src', world.assetId);
    outsideSphere.setAttribute('rotation', world.sphereRotationOutside || '0 -90 0');
  }

  // Update Portal Frame metallic/emissive accents to match the active world
  document.querySelectorAll('.portal-beam').forEach((beam) => {
    beam.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameEmissive}; emissiveIntensity: 0.55; metalness: 0.9; roughness: 0.15`
    );
  });
  document.querySelectorAll('.portal-corner').forEach((corner) => {
    corner.setAttribute(
      'material',
      `color: ${world.frameColor}; emissive: ${world.frameColor}; emissiveIntensity: 0.9; shader: flat; transparent: true; opacity: 0.55`
    );
  });

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

  setTimeout(() => {
    isSwitchingWorld = false;
  }, 240);
};

window.cyclePortalWorld = function () {
  window.selectPortalWorld(currentWorldIndex + 1, true);
};

window.toggleMarkerModal = function (forceState) {
  const modal = document.getElementById('marker-modal');
  if (!modal) return;
  const shouldOpen = typeof forceState === 'boolean' ? forceState : !modal.classList.contains('open');
  modal.classList.toggle('open', shouldOpen);
};

// Initialize Scene & HUD Events
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  if (sceneEl) {
    sceneEl.addEventListener('loaded', () => {
      const loader = document.getElementById('loading-overlay');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
        }, 400);
      }
      sceneEl.setAttribute('portal-visibility', '');
      window.selectPortalWorld(0, false);
    });
  }

  // Tap on 3D canvas (outside HUD) cycles through Nano Banana worlds
  document.addEventListener('click', (e) => {
    if (
      e.target.closest('#hud-top') ||
      e.target.closest('#hud-bottom') ||
      e.target.closest('#marker-modal')
    ) {
      return;
    }
    window.cyclePortalWorld();
  });
});
