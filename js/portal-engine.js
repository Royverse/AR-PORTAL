/**
 * AR-PORTAL — Core Portal Occlusion Engine, Direct Three.js Texture Manager,
 * Low-Barrier Multi-Threshold Hiro Detector, Sticky Pose-Hold Latch & Spatial Audio Synth
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

// 4. Hardware IMU Gyroscope Sensor Fusion (compensates phone rotation at 60Hz even during motion blur)
const DeviceIMUFusion = {
  enabled: false,
  hasReading: false,
  alpha: 0,
  beta: 0,
  gamma: 0,
  orient: 0,
  currentQuat: new THREE.Quaternion(),
  prevQuat: new THREE.Quaternion(),
  deltaCamInv: new THREE.Quaternion(),
  _zee: new THREE.Vector3(0, 0, 1),
  _euler: new THREE.Euler(),
  _q0: new THREE.Quaternion(),
  _q1: new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)),

  init() {
    if (this.enabled) return;
    this.enabled = true;

    const updateOrient = () => {
      if (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined) {
        this.orient = THREE.MathUtils.degToRad(window.screen.orientation.angle);
      } else if (typeof window.orientation === 'number') {
        this.orient = THREE.MathUtils.degToRad(window.orientation);
      }
    };
    updateOrient();
    window.addEventListener('orientationchange', updateOrient);

    const onDeviceOrientation = (e) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      this.alpha = THREE.MathUtils.degToRad(e.alpha);
      this.beta = THREE.MathUtils.degToRad(e.beta);
      this.gamma = THREE.MathUtils.degToRad(e.gamma);

      this._euler.set(this.beta, this.alpha, -this.gamma, 'YXZ');
      this.currentQuat.setFromEuler(this._euler);
      this.currentQuat.multiply(this._q1);
      this.currentQuat.multiply(this._q0.setFromAxisAngle(this._zee, -this.orient));

      if (!this.hasReading) {
        this.prevQuat.copy(this.currentQuat);
        this.hasReading = true;
      }
    };

    window.addEventListener('deviceorientation', onDeviceOrientation, true);

    // iOS 13+ permission request on first user interaction
    const requestIOSPermission = () => {
      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', onDeviceOrientation, true);
            }
          })
          .catch(() => {});
      }
      window.removeEventListener('touchend', requestIOSPermission);
      window.removeEventListener('click', requestIOSPermission);
    };
    window.addEventListener('touchend', requestIOSPermission, { once: true });
    window.addEventListener('click', requestIOSPermission, { once: true });
  },

  consumeDeltaCameraInverse() {
    if (!this.hasReading) {
      this.deltaCamInv.identity();
      return false;
    }
    // deltaCamInv = currentQuat^-1 * prevQuat (rotates camera-space vectors opposite to phone motion)
    this.deltaCamInv.copy(this.currentQuat).invert().multiply(this.prevQuat);
    this.prevQuat.copy(this.currentQuat);
    return true;
  }
};

// 5. Zero-Lag Ray-Pinned + Deadband Orientation/Depth Lock + IMU World-Anchor Stabilizer
AFRAME.registerComponent('portal-visibility', {
  init: function () {
    DeviceIMUFusion.init();

    this.portalRoot = document.querySelector('#portal-root');
    this.insideView = document.querySelector('#portal-inside');
    this.outsideView = document.querySelector('#portal-outside');
    this.markerEl = document.querySelector('#hiro-marker');
    this.stabilizedAnchor = document.querySelector('#stabilized-portal-anchor');

    this.lastState = null;
    this.hysteresisThreshold = 0.04;
    this.frameCount = 0;
    this.lostFrameCount = 0;

    // Sticky Pose-Hold Latch state
    this.markerCurrentlyVisible = false;
    this.hasLatched = false;
    this.justAcquired = false;

    // Decoupled Spherical Ray + Depth + Orientation state for rock-solid window stabilization:
    // - (rayX, rayY) pins the portal center to the exact 2D video point with zero lag so it never moves with the phone
    // - stableDepth locks the radial distance against corner-perimeter breathing noise
    // - stableQuat locks the 3D window frame against ARToolKit 4-corner planar homography flips
    this.rayX = 0;
    this.rayY = 0;
    this.stableDepth = 1.6;
    this.stablePos = new THREE.Vector3(0, 0, -1.6);
    this.stableQuat = new THREE.Quaternion();
    this.stableScale = new THREE.Vector3(1, 1, 1);

    this.rawPos = new THREE.Vector3();
    this.prevOpticalRawPos = new THREE.Vector3(999, 999, 999);
    this.rawQuat = new THREE.Quaternion();
    this.rawScale = new THREE.Vector3(1, 1, 1);
    this.optEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.rotOffsetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

    // Directional Coherence state (detects & cancels back-and-forth sign-reversal jitter)
    this.prevDeltaRayX = 0;
    this.prevDeltaRayY = 0;
    this.coherenceStreak = 0;

    this.depthOutlierCount = 0;
    this.rotOutlierCount = 0;

    // Multi-threshold sweep array (used ONLY before lock-on or after extended loss)
    this.thresholds = [70, 95, 115, 135, 160];
    this.threshIdx = 0;

    if (this.markerEl) {
      this.markerEl.addEventListener('markerFound', () => {
        this.markerCurrentlyVisible = true;
        this.lostFrameCount = 0;
        if (!this.hasLatched) {
          this.hasLatched = true;
          this.justAcquired = true;
          PortalAudio.playWorldSwitch(130.8);
        }
        if (window.isSimulationMode) {
          window.setSimulationMode(false);
        }
        if (this.stabilizedAnchor) {
          this.stabilizedAnchor.setAttribute('visible', 'true');
        }
        updateTrackingBadge('tracking', this.lastState === true, false);
      });

      this.markerEl.addEventListener('markerLost', () => {
        this.markerCurrentlyVisible = false;
        if (this.hasLatched && !window.isSimulationMode) {
          updateTrackingBadge('held', this.lastState === true, false);
        } else if (!window.isSimulationMode) {
          updateTrackingBadge('searching', false, false);
        }
      });
    }
  },

  lowerARToolKitBarrier: function () {
    try {
      const arSystem = this.el.sceneEl && this.el.sceneEl.systems && this.el.sceneEl.systems.arjs;
      const ctx = arSystem && arSystem._arToolkitContext;
      if (ctx && ctx.arController) {
        if (this.markerEl && this.markerEl.components && this.markerEl.components.arjsmarker) {
          const markerCtrl = this.markerEl.components.arjsmarker._arMarkerControls;
          if (markerCtrl && markerCtrl.parameters) {
            // Low barrier (0.18) before first lock so it catches immediately;
            // Higher integrity (0.32) once locked so blurry frames don't inject noisy poses
            markerCtrl.parameters.minConfidence = this.hasLatched ? 0.32 : 0.18;
          }
        }
        // IMPORTANT: Freeze the binarization threshold while tracking is active so the Hiro border
        // thickness never fluctuates (which would cause Z-depth jitter). Only sweep if searching!
        if (!this.markerCurrentlyVisible) {
          this.lostFrameCount++;
          if ((!this.hasLatched || this.lostFrameCount > 45) && this.frameCount % 4 === 0) {
            this.threshIdx = (this.threshIdx + 1) % this.thresholds.length;
            ctx.arController.setThreshold(this.thresholds[this.threshIdx]);
          }
        }
      }
    } catch (e) {}
  },

  tick: function () {
    this.frameCount++;
    this.lowerARToolKitBarrier();

    if (!this.portalRoot) this.portalRoot = document.querySelector('#portal-root');
    if (!this.insideView) this.insideView = document.querySelector('#portal-inside');
    if (!this.outsideView) this.outsideView = document.querySelector('#portal-outside');
    if (!this.stabilizedAnchor) this.stabilizedAnchor = document.querySelector('#stabilized-portal-anchor');

    const hasIMU = DeviceIMUFusion.consumeDeltaCameraInverse();

    // 1. Apply Hardware IMU Gyroscope Counter-Rotation when Latched
    // This immediately counter-rotates the portal against hand jitter & panning so it stays fixed in the room!
    if (this.hasLatched && !this.justAcquired && !window.isSimulationMode && hasIMU) {
      this.stablePos.applyQuaternion(DeviceIMUFusion.deltaCamInv);
      this.stableQuat.premultiply(DeviceIMUFusion.deltaCamInv);
      const absZ = Math.max(0.15, Math.abs(this.stablePos.z));
      this.rayX = this.stablePos.x / absZ;
      this.rayY = this.stablePos.y / absZ;
    }

    // 2. Fuse Optical Centroid + Directional Coherence Jitter Killer + Deadband Depth/Rotation Lock
    if (this.markerCurrentlyVisible && this.markerEl && this.stabilizedAnchor && !window.isSimulationMode) {
      const mObj = this.markerEl.object3D;
      mObj.getWorldPosition(this.rawPos);
      mObj.getWorldQuaternion(this.rawQuat);
      mObj.getWorldScale(this.rawScale);

      // Only run optical fusion when ARToolKit actually delivers a new video frame detection
      // (Prevents 60Hz/120Hz render frames from rubber-banding back to stale 30Hz webcam poses!)
      const isNewOpticalFrame = this.rawPos.distanceToSquared(this.prevOpticalRawPos) > 1e-9;

      if (this.justAcquired || isNewOpticalFrame) {
        this.prevOpticalRawPos.copy(this.rawPos);

        // Apply -90 deg X offset so the portal stands upright on the marker plane
        this.rawQuat.multiply(this.rotOffsetQuat);

        const rawAbsZ = Math.max(0.15, Math.abs(this.rawPos.z));
        const rawRayX = this.rawPos.x / rawAbsZ;
        const rawRayY = this.rawPos.y / rawAbsZ;
        const rawDepth = Math.max(0.25, this.rawPos.length());

        const sObj = this.stabilizedAnchor.object3D;
        sObj.visible = true;

        if (this.justAcquired) {
          this.rayX = rawRayX;
          this.rayY = rawRayY;
          this.stableDepth = rawDepth;
          this.stablePos.copy(this.rawPos);

          // Damp initial homography pitch/roll tilt so the window frame starts cleanly upright
          this.optEuler.setFromQuaternion(this.rawQuat, 'YXZ');
          this.optEuler.x *= 0.25;
          this.optEuler.z *= 0.15;
          this.stableQuat.setFromEuler(this.optEuler);

          this.stableScale.copy(this.rawScale);
          sObj.position.copy(this.stablePos);
          sObj.quaternion.copy(this.stableQuat);
          sObj.scale.copy(this.stableScale);
          this.justAcquired = false;
        } else {
          // A. DIRECTIONAL COHERENCE SCREEN-RAY FILTER (Kills back-and-forth jitter while pinning to the marker)
          const dRayX = rawRayX - this.rayX;
          const dRayY = rawRayY - this.rayY;
          const rayDelta = Math.hypot(dRayX, dRayY);

          // Cosine similarity between current displacement and previous optical displacement:
          // Positive (> 0.25) = consistent real camera motion; Negative (< 0) = back-and-forth jitter oscillation!
          const prevMag = Math.hypot(this.prevDeltaRayX, this.prevDeltaRayY);
          const dot = dRayX * this.prevDeltaRayX + dRayY * this.prevDeltaRayY;
          const coherence = prevMag > 0.0005 && rayDelta > 0.0005 ? dot / (prevMag * rayDelta) : 0;

          if (coherence > 0.25 && rayDelta > 0.0025) {
            this.coherenceStreak = Math.min(8, this.coherenceStreak + 1);
          } else if (coherence < 0) {
            this.coherenceStreak = 0;
          } else {
            this.coherenceStreak = Math.max(0, this.coherenceStreak - 1);
          }

          this.prevDeltaRayX = dRayX;
          this.prevDeltaRayY = dRayY;

          let alphaRay;
          if (rayDelta < 0.003) {
            // Sub-pixel / micro-tremor deadband: hold rock-solid!
            alphaRay = 0.035;
          } else if (coherence < 0) {
            // Sign-reversal oscillation (jitter spike): block 95% of the reversal!
            alphaRay = 0.05;
          } else if (hasIMU) {
            // IMU Gyroscope already handled rotational hand shake at 60/120Hz;
            // smoothly tether translational drift without injecting corner noise
            alphaRay = THREE.MathUtils.clamp(0.12 + this.coherenceStreak * 0.06, 0.12, 0.48);
          } else {
            // Pure optical mode: ramp up smoothly on sustained directional movement
            alphaRay = THREE.MathUtils.clamp(
              0.10 + this.coherenceStreak * 0.09 + (rayDelta - 0.003) * 8.0,
              0.10,
              0.68
            );
          }

          this.rayX += dRayX * alphaRay;
          this.rayY += dRayY * alphaRay;

          // B. DEADBAND RADIAL DEPTH LOCK (prevents Z-axis size breathing / forward-back jitter)
          const relDepthDiff = Math.abs(rawDepth - this.stableDepth) / Math.max(0.25, this.stableDepth);
          if (relDepthDiff > 0.30 && this.depthOutlierCount < 4) {
            this.depthOutlierCount++;
          } else {
            this.depthOutlierCount = 0;
            const alphaDepth =
              relDepthDiff < 0.04
                ? 0.012
                : THREE.MathUtils.clamp(0.012 + (relDepthDiff - 0.04) * 1.4, 0.012, 0.20);
            this.stableDepth += (rawDepth - this.stableDepth) * alphaDepth;
          }

          // Reconstruct 3D camera-space position along the stabilized screen ray at the locked depth
          const invNorm = 1.0 / Math.sqrt(this.rayX * this.rayX + this.rayY * this.rayY + 1.0);
          this.stablePos.set(
            this.rayX * invNorm * this.stableDepth,
            this.rayY * invNorm * this.stableDepth,
            -1.0 * invNorm * this.stableDepth
          );

          // C. PLANAR HOMOGRAPHY FLIP REJECTOR & UPRIGHT FRAME STABILIZER
          // ARToolKit's 4-corner solver produces noisy pitch/roll flips; we suppress roll/pitch noise
          // and apply a tight rotational deadband so the 4 cyan window beams stay carved in stone.
          this.optEuler.setFromQuaternion(this.rawQuat, 'YXZ');
          this.optEuler.x *= 0.25;
          this.optEuler.z *= 0.15;
          this.rawQuat.setFromEuler(this.optEuler);

          const angleDiff = this.stableQuat.angleTo(this.rawQuat);
          if (angleDiff > 0.26 && this.rotOutlierCount < 6) {
            // Reject single-frame planar homography normal flip
            this.rotOutlierCount++;
            this.stableQuat.slerp(this.rawQuat, 0.004);
          } else {
            this.rotOutlierCount = 0;
            const alphaRot =
              angleDiff < 0.10
                ? 0.010
                : THREE.MathUtils.clamp(0.010 + (angleDiff - 0.10) * 0.35, 0.010, 0.075);
            this.stableQuat.slerp(this.rawQuat, alphaRot);
          }

          // Lock scale tightly
          this.stableScale.lerp(this.rawScale, 0.015);
        }
      }

      const sObj = this.stabilizedAnchor.object3D;
      sObj.visible = true;
      sObj.position.copy(this.stablePos);
      sObj.quaternion.copy(this.stableQuat);
      sObj.scale.copy(this.stableScale);
    } else if (this.hasLatched && this.stabilizedAnchor && !window.isSimulationMode) {
      // When marker is momentarily out of view, apply the IMU-compensated world pose
      const sObj = this.stabilizedAnchor.object3D;
      sObj.position.copy(this.stablePos);
      sObj.quaternion.copy(this.stableQuat);
    }

    // 2. Evaluate Inside vs Outside Portal Perspective (throttled every 2 frames)
    if (this.frameCount % 2 !== 0) return;

    const camera = this.el.sceneEl && this.el.sceneEl.camera;
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
      if (this.lastState !== null && (this.hasLatched || window.isSimulationMode)) {
        PortalAudio.playThresholdCross(isInside);
      }
      this.lastState = isInside;
      if (window.isSimulationMode) {
        updateTrackingBadge('sim', isInside, true);
      } else if (this.markerCurrentlyVisible) {
        updateTrackingBadge('tracking', isInside, false);
      } else if (this.hasLatched) {
        updateTrackingBadge('held', isInside, false);
      }
    }
  }
});

// 5. World Switching, Cube Excursion Controls & Simulated AR Stage
let currentWorldIndex = 0;
let currentCubeMode = 'loop'; // 'loop' | 'out' | 'in'
window.isSimulationMode = false;

function updateTrackingBadge(state, isInside, isSim) {
  const pill = document.getElementById('tracking-pill');
  const text = document.getElementById('tracking-text');
  if (!pill || !text) return;

  pill.classList.remove('locked', 'inside');
  if (isSim || state === 'sim') {
    pill.classList.add('locked');
    text.textContent = isInside ? 'Sim 360° Inside' : 'Sim Portal Active';
  } else if (state === 'searching') {
    text.textContent = 'Scan Hiro or Tap Sim';
  } else if (isInside) {
    pill.classList.add('inside');
    text.textContent = 'Inside Portal 360°';
  } else if (state === 'held') {
    pill.classList.add('locked');
    text.textContent = 'Portal Held (Locked)';
  } else {
    pill.classList.add('locked');
    text.textContent = 'Hiro Tracking';
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
  const stabilizedAnchor = document.querySelector('#stabilized-portal-anchor');
  const simAnchor = document.querySelector('#sim-portal-anchor');
  const portalRoot = document.querySelector('#portal-root');
  const simBtn = document.getElementById('btn-sim-mode');

  if (!stabilizedAnchor || !simAnchor || !portalRoot) return;

  if (enable) {
    simAnchor.object3D.add(portalRoot.object3D);
    portalRoot.object3D.position.set(0, 0, 0);
    portalRoot.object3D.rotation.set(0, 0, 0);
    simAnchor.setAttribute('visible', 'true');
    if (simBtn) simBtn.classList.add('active');
    updateTrackingBadge('sim', false, true);
  } else {
    stabilizedAnchor.object3D.add(portalRoot.object3D);
    portalRoot.object3D.position.set(0, 0, 0);
    portalRoot.object3D.rotation.set(0, 0, 0);
    simAnchor.setAttribute('visible', 'false');
    if (simBtn) simBtn.classList.remove('active');
    const visComp = document.querySelector('a-scene').components['portal-visibility'];
    const isLatched = visComp && visComp.hasLatched;
    updateTrackingBadge(isLatched ? 'held' : 'searching', false, false);
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

  // Interactive drag-to-orbit in Simulated AR Mode or when Portal is Held
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
