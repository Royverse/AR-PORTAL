/**
 * AR-PORTAL — Three.js 6-Face Dimensional Excursion Cube Component (js/portal-cube.js)
 *
 * Implements a rock-solid, distinct 6-face 3D Tesseract Cube that:
 *  1. Has 6 distinct, high-contrast faces so the front, sides, top, bottom, and back of the
 *     box are immediately recognizable from any 3D viewing angle:
 *       - Front (+Z): Crimson (#E63946) with glowing White Beacon Ring
 *       - Back  (-Z): Emerald (#10B981) with glowing Gold Reactor Core Plate
 *       - Right (+X): Cobalt Blue (#2563EB)
 *       - Left  (-X): Royal Violet (#9333EA)
 *       - Top   (+Y): Electric Cyan (#00E5FF)
 *       - Bottom(-Y): Deep Obsidian (#1E293B)
 *  2. Moves strictly along the Z centerline (x = 0, y = 0) with zero lateral wobble so the box
 *     stays rock-solid in space.
 *  3. In `out` ("Breach Out (+Z)") mode, locks completely stationary at (0, 0, +0.62) with
 *     zero self-rotation so moving your phone around the marker reveals the sides and back.
 *  4. In `loop` ("In-Out Loop") mode, glides out of the portal to z = +0.62 and performs a
 *     clean, poised 360° Y-axis presentation at the outer apex so the back of the cube is
 *     also visible when standing still in front of the portal.
 */

AFRAME.registerComponent('portal-excursion-cube', {
  schema: {
    mode: { type: 'string', default: 'loop' } // 'loop' | 'out' | 'in'
  },

  init: function () {
    this.time = 0;
    this.currentZ = -1.8;
    this.lastSign = -1; // -1 = inside portal (z < 0), +1 = real world (z >= 0)
    this.rippleProgress = 1.0;
    this.rippleDirection = 1;
    this.accentColor = new THREE.Color('#00e5ff');

    // Root Three.js Group attached to #portal-root
    this.rootGroup = new THREE.Group();
    this.cubeGroup = new THREE.Group();
    this.rootGroup.add(this.cubeGroup);

    // 1. 6-Face Distinct 3D Core Cube (0.24m x 0.24m x 0.24m)
    // Three.js BoxGeometry material order: [+X (Right), -X (Left), +Y (Top), -Y (Bottom), +Z (Front), -Z (Back)]
    const coreGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    this.faceMaterials = [
      // +X Right Face: Cobalt Blue
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.45,
        metalness: 0.65,
        roughness: 0.22
      }),
      // -X Left Face: Royal Violet
      new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: 0x6b21a8,
        emissiveIntensity: 0.45,
        metalness: 0.65,
        roughness: 0.22
      }),
      // +Y Top Face: Electric Cyan
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.2
      }),
      // -Y Bottom Face: Deep Slate
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        emissive: 0x0f172a,
        emissiveIntensity: 0.35,
        metalness: 0.8,
        roughness: 0.3
      }),
      // +Z Front Face: Signature Crimson
      new THREE.MeshStandardMaterial({
        color: 0xe63946,
        emissive: 0x991b1b,
        emissiveIntensity: 0.55,
        metalness: 0.65,
        roughness: 0.2
      }),
      // -Z Back Face: High-Contrast Emerald Green
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x047857,
        emissiveIntensity: 0.65,
        metalness: 0.65,
        roughness: 0.2
      })
    ];
    this.coreMesh = new THREE.Mesh(coreGeo, this.faceMaterials);
    this.cubeGroup.add(this.coreMesh);

    // 1b. Distinct Back-Face Gold Reactor Plate (on -Z face at z = -0.123)
    const backPlateGeo = new THREE.BoxGeometry(0.14, 0.14, 0.012);
    const backPlateMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.15
    });
    this.backPlateMesh = new THREE.Mesh(backPlateGeo, backPlateMat);
    this.backPlateMesh.position.set(0, 0, -0.123);
    this.coreMesh.add(this.backPlateMesh);

    // 1c. Back-Face Inner Cyan Diamond Indicator (on -Z face at z = -0.131)
    const backDiamondGeo = new THREE.BoxGeometry(0.065, 0.065, 0.008);
    const backDiamondMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.backDiamondMesh = new THREE.Mesh(backDiamondGeo, backDiamondMat);
    this.backDiamondMesh.rotation.set(0, 0, Math.PI / 4);
    this.backDiamondMesh.position.set(0, 0, -0.131);
    this.coreMesh.add(this.backDiamondMesh);

    // 1d. Front-Face Beacon Ring (on +Z face at z = +0.122)
    const frontRingGeo = new THREE.RingGeometry(0.045, 0.075, 28);
    const frontRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    this.frontRingMesh = new THREE.Mesh(frontRingGeo, frontRingMat);
    this.frontRingMesh.position.set(0, 0, 0.122);
    this.coreMesh.add(this.frontRingMesh);

    // 2. Crisp Structural Outer Wireframe Bezel (locked 1:1 to coreMesh so the box never looks wobbly)
    const cageGeo = new THREE.BoxGeometry(0.265, 0.265, 0.265);
    const edgesGeo = new THREE.EdgesGeometry(cageGeo);
    this.cageMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.92
    });
    this.cageLines = new THREE.LineSegments(edgesGeo, this.cageMat);
    this.coreMesh.add(this.cageLines);

    // 3. Subtle Glassy Dimensional Hull (locked 1:1 to coreMesh)
    const hullGeo = new THREE.BoxGeometry(0.258, 0.258, 0.258);
    this.hullMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    this.hullMesh = new THREE.Mesh(hullGeo, this.hullMat);
    this.coreMesh.add(this.hullMesh);

    // 4. Portal Threshold Shockwave Ripple Ring at z = 0.015 (triggers when cube crosses z = 0)
    const rippleGeo = new THREE.RingGeometry(0.08, 0.13, 36);
    this.rippleMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    this.rippleMesh = new THREE.Mesh(rippleGeo, this.rippleMat);
    this.rippleMesh.position.set(0, 0, 0.015);
    this.rootGroup.add(this.rippleMesh);

    // 5. Quantum Tether Beam connecting Cube back to the Portal Core (0, 0, -2.2)
    const tetherPoints = [new THREE.Vector3(0, 0, -2.2), new THREE.Vector3(0, 0, -1.8)];
    this.tetherGeo = new THREE.BufferGeometry().setFromPoints(tetherPoints);
    this.tetherMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45
    });
    this.tetherLine = new THREE.Line(this.tetherGeo, this.tetherMat);
    this.rootGroup.add(this.tetherLine);

    this.el.setObject3D('excursion-cube', this.rootGroup);
  },

  setWorldAccent: function (hexColor) {
    this.accentColor.set(hexColor);
    if (this.cageMat) this.cageMat.color.copy(this.accentColor);
    if (this.hullMat) this.hullMat.color.copy(this.accentColor);
    if (this.rippleMat) this.rippleMat.color.copy(this.accentColor);
    if (this.tetherMat) this.tetherMat.color.copy(this.accentColor);
  },

  triggerRipple: function (direction) {
    this.rippleProgress = 0.0;
    this.rippleDirection = direction;
    if (window.PortalAudio) {
      window.PortalAudio.playThresholdCross(direction > 0);
    }
  },

  tick: function (time, timeDelta) {
    const dt = Math.min((timeDelta || 16) / 1000, 0.1);
    this.time += dt;

    const mode = this.data.mode;
    let desiredZ = -1.6;
    let targetRotX = 0;
    let targetRotY = 0;

    if (mode === 'loop') {
      // Smooth 10-second excursion cycle along the exact Z centerline (x = 0, y = 0):
      // - Moves out from z = -1.95 (inside portal) to z = +0.62 (in real room space)
      // - Holds steadily at z = +0.62 while smoothly rotating 180° -> 360° around Y so
      //   you can clearly see the Emerald & Gold BACK of the cube even when standing still!
      const period = 10.0;
      const phase = (this.time % period) / period; // 0..1

      if (phase < 0.25) {
        // 0.00 -> 0.25: Emerge smoothly from inside portal (-1.95) to real world (+0.62)
        const p = phase / 0.25;
        const ease = p * p * (3 - 2 * p);
        desiredZ = -1.95 + ease * 2.57;
        targetRotY = 0;
        targetRotX = 0;
      } else if (phase < 0.70) {
        // 0.25 -> 0.70: Hold rock-solid at z = +0.62 in real world and perform a clean
        // 360° Y-axis inspection turn (pausing briefly at 180° so the Emerald/Gold back face is front-and-center)
        desiredZ = 0.62;
        const holdP = (phase - 0.25) / 0.45; // 0..1
        if (holdP < 0.35) {
          // Turn smoothly 0° -> 180° (Back face)
          const t = holdP / 0.35;
          targetRotY = t * t * (3 - 2 * t) * Math.PI;
        } else if (holdP < 0.65) {
          // Hold Back Face (-Z Emerald & Gold Reactor) steady for inspection!
          targetRotY = Math.PI;
        } else {
          // Turn smoothly 180° -> 360° (Front face)
          const t = (holdP - 0.65) / 0.35;
          targetRotY = Math.PI + t * t * (3 - 2 * t) * Math.PI;
        }
        targetRotX = Math.sin(holdP * Math.PI) * 0.22;
      } else if (phase < 0.92) {
        // 0.70 -> 0.92: Recall smoothly back through portal doorway (+0.62 -> -1.95)
        const p = (phase - 0.70) / 0.22;
        const ease = p * p * (3 - 2 * p);
        desiredZ = 0.62 - ease * 2.57;
        targetRotY = 0;
        targetRotX = 0;
      } else {
        // 0.92 -> 1.00: Brief pause deep inside portal (-1.95)
        desiredZ = -1.95;
        targetRotY = 0;
        targetRotX = 0;
      }
    } else if (mode === 'out') {
      // Locked stationary out in real-world AR space at (0, 0, +0.62) with zero self-rotation
      // so moving your phone around the marker (or dragging) lets you walk around the fixed box!
      desiredZ = 0.62;
      targetRotX = 0;
      targetRotY = 0;
    } else {
      // Locked stationary inside portal space at (0, 0, -1.75)
      desiredZ = -1.75;
      targetRotX = 0;
      targetRotY = 0;
    }

    // Strictly lock X = 0, Y = 0 so the box never wobbles laterally
    this.cubeGroup.position.x = 0;
    this.cubeGroup.position.y = 0;
    this.cubeGroup.position.z = THREE.MathUtils.lerp(this.cubeGroup.position.z, desiredZ, dt * 8);
    this.currentZ = this.cubeGroup.position.z;

    // Apply clean, deterministic rotation to coreMesh
    this.coreMesh.rotation.x = THREE.MathUtils.lerp(this.coreMesh.rotation.x, targetRotX, dt * 10);
    this.coreMesh.rotation.y = targetRotY;
    this.coreMesh.rotation.z = 0;

    // Detect exact moment the cube crosses the z = 0 portal plane
    const currentSign = this.currentZ >= 0.03 ? 1 : -1;
    if (currentSign !== this.lastSign) {
      this.lastSign = currentSign;
      this.triggerRipple(currentSign);
      if (window.updateCubeTelemetry) {
        window.updateCubeTelemetry(currentSign > 0, this.currentZ);
      }
    } else if (Math.floor(this.time * 10) % 2 === 0 && window.updateCubeTelemetry) {
      window.updateCubeTelemetry(currentSign > 0, this.currentZ);
    }

    // Subtle scale expansion when out in real-world space
    const outBoost = THREE.MathUtils.clamp((this.currentZ + 0.1) / 0.72, 0, 1);
    const scale = 0.92 + outBoost * 0.28;
    this.cubeGroup.scale.setScalar(scale);

    // Update Tether Line connecting Cube -> Portal Origin (0, 0, -2.2)
    const positions = this.tetherGeo.attributes.position.array;
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = -2.2;
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = this.cubeGroup.position.z;
    this.tetherGeo.attributes.position.needsUpdate = true;

    // Animate Portal Threshold Shockwave Ring when triggered
    if (this.rippleProgress < 1.0) {
      this.rippleProgress = Math.min(1.0, this.rippleProgress + dt * 1.8);
      const rScale = 0.4 + this.rippleProgress * 3.8;
      this.rippleMesh.scale.set(rScale, rScale, 1);
      this.rippleMat.opacity = (1.0 - this.rippleProgress) * 0.85;
    } else {
      this.rippleMat.opacity = 0;
    }
  },

  remove: function () {
    this.el.removeObject3D('excursion-cube');
  }
});
