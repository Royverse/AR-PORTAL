/**
 * AR-PORTAL — Three.js Dimensional Excursion Cube Component (js/portal-cube.js)
 *
 * Implements a pure Three.js multi-layered 3D Tesseract Cube that:
 *  1. Starts deep inside the virtual portal world (z < 0, occluded by the 1x1 portal depth mask).
 *  2. Breaches across the z = 0 portal threshold, triggering a 3D shockwave ring on the doorway.
 *  3. Emerges into real-world AR space (z > 0, in front of the depth-mask cloak) where it orbits
 *     wider than the portal frame while tethered back to the portal interior.
 *  4. Dives back through the doorway into the virtual world (in-out excursion loop or manual control).
 */

AFRAME.registerComponent('portal-excursion-cube', {
  schema: {
    mode: { type: 'string', default: 'loop' } // 'loop' | 'out' | 'in'
  },

  init: function () {
    this.time = 0;
    this.currentZ = -1.8;
    this.targetZ = -1.8;
    this.lastSign = -1; // -1 = inside portal (z < 0), +1 = real world (z >= 0)
    this.rippleProgress = 1.0;
    this.rippleDirection = 1;
    this.accentColor = new THREE.Color('#00e5ff');
    this.coreColor = new THREE.Color('#E63946'); // Homage to the original spinning red cube

    // Root Three.js Group attached to #portal-root
    this.rootGroup = new THREE.Group();
    this.cubeGroup = new THREE.Group();
    this.rootGroup.add(this.cubeGroup);

    // 1. Inner Vertex/Emissive Core Cube (Three.js BoxGeometry)
    const coreGeo = new THREE.BoxGeometry(0.19, 0.19, 0.19);
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      emissive: 0x991b1b,
      emissiveIntensity: 0.65,
      metalness: 0.75,
      roughness: 0.2
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMat);
    this.cubeGroup.add(this.coreMesh);

    // 2. Outer Tesseract Wireframe Cage (expands when out in the real world)
    const cageGeo = new THREE.BoxGeometry(0.27, 0.27, 0.27);
    const edgesGeo = new THREE.EdgesGeometry(cageGeo);
    this.cageMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.95
    });
    this.cageLines = new THREE.LineSegments(edgesGeo, this.cageMat);
    this.cubeGroup.add(this.cageLines);

    // 3. Glassy Dimensional Hull
    const hullGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    this.hullMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.16,
      wireframe: false,
      side: THREE.DoubleSide
    });
    this.hullMesh = new THREE.Mesh(hullGeo, this.hullMat);
    this.cubeGroup.add(this.hullMesh);

    // 4. Four Orbiting Micro-Cubes (spread wide beyond the 1x1 frame when in real world z > 0)
    this.satellites = [];
    const satGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const satColors = [0x00e5ff, 0xfbbf24, 0x34d399, 0xe63946];
    for (let i = 0; i < 4; i++) {
      const satMat = new THREE.MeshBasicMaterial({ color: satColors[i] });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      this.cubeGroup.add(satMesh);
      this.satellites.push({ mesh: satMesh, angleOffset: (i * Math.PI) / 2 });
    }

    // 5. Portal Threshold Shockwave Ripple Ring at z = 0.01 (triggers when cube crosses z = 0)
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

    // 6. Quantum Tether Beam connecting Cube back to the Portal Core (0, 0, -2.2)
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
    this.rippleDirection = direction; // +1 = breaching out to real world, -1 = diving into portal
    if (window.PortalAudio) {
      window.PortalAudio.playThresholdCross(direction > 0);
    }
  },

  tick: function (time, timeDelta) {
    const dt = Math.min((timeDelta || 16) / 1000, 0.1);
    this.time += dt;

    const mode = this.data.mode;
    let desiredX = 0;
    let desiredY = 0;
    let desiredZ = -1.6;

    if (mode === 'loop') {
      // Smooth continuous In-Out excursion wave:
      // Travels from z = -2.3 (deep inside portal) through z = 0 (threshold) out to z = +0.78 (real world!)
      const cycle = this.time * 0.85;
      const sinWave = Math.sin(cycle);
      // Map [-1, 1] -> [-2.2, +0.78]
      desiredZ = -0.71 + sinWave * 1.49;

      // When out in the real world (desiredZ > 0), orbit wider than the 1x1 portal doorway
      // to prove it has left the portal boundary and entered physical room space!
      const realWorldFactor = THREE.MathUtils.clamp((desiredZ + 0.1) / 0.85, 0, 1);
      const orbitRadiusX = 0.14 + realWorldFactor * 0.42;
      const orbitRadiusY = 0.10 + realWorldFactor * 0.24;

      desiredX = Math.cos(cycle * 2.0) * orbitRadiusX;
      desiredY = Math.sin(cycle * 1.5) * orbitRadiusY;
    } else if (mode === 'out') {
      // Hover out in real-world AR space in front of the portal (z = +0.72)
      desiredZ = 0.72 + Math.sin(this.time * 2.2) * 0.08;
      desiredX = Math.cos(this.time * 1.4) * 0.38;
      desiredY = Math.sin(this.time * 1.8) * 0.22;
    } else {
      // Inside portal space (z = -1.75)
      desiredZ = -1.75 + Math.sin(this.time * 2.0) * 0.15;
      desiredX = Math.cos(this.time * 1.2) * 0.18;
      desiredY = Math.sin(this.time * 1.6) * 0.14;
    }

    // Smoothly interpolate position
    this.cubeGroup.position.x = THREE.MathUtils.lerp(this.cubeGroup.position.x, desiredX, dt * 6);
    this.cubeGroup.position.y = THREE.MathUtils.lerp(this.cubeGroup.position.y, desiredY, dt * 6);
    this.cubeGroup.position.z = THREE.MathUtils.lerp(this.cubeGroup.position.z, desiredZ, dt * 6);
    this.currentZ = this.cubeGroup.position.z;

    // Detect exact moment the cube crosses the z = 0 portal plane!
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

    // Multi-axis Three.js rotation + real-world scale expansion
    const outBoost = THREE.MathUtils.clamp((this.currentZ + 0.1) / 0.8, 0, 1);
    const scale = 0.85 + outBoost * 0.45;
    this.cubeGroup.scale.setScalar(scale);

    this.coreMesh.rotation.x += dt * 1.6;
    this.coreMesh.rotation.y += dt * 2.1;
    this.cageLines.rotation.x -= dt * 1.1;
    this.cageLines.rotation.z += dt * 1.4;
    this.hullMesh.rotation.y -= dt * 0.9;

    // Morph core emissive intensity as it emerges into the real world
    this.coreMat.emissiveIntensity = 0.5 + outBoost * 0.6;

    // Animate orbiting micro-cubes (expand orbit radius when outside the portal in real world)
    const satOrbit = 0.22 + outBoost * 0.16;
    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      const a = this.time * 2.8 + sat.angleOffset;
      sat.mesh.position.set(
        Math.cos(a) * satOrbit,
        Math.sin(a * 1.3) * (satOrbit * 0.65),
        Math.sin(a) * satOrbit
      );
      sat.mesh.rotation.x += dt * 3;
      sat.mesh.rotation.y += dt * 3;
    }

    // Update Tether Line connecting Cube -> Portal Origin (0, 0, -2.2)
    const positions = this.tetherGeo.attributes.position.array;
    positions[0] = 0;
    positions[1] = 0;
    positions[2] = -2.2;
    positions[3] = this.cubeGroup.position.x;
    positions[4] = this.cubeGroup.position.y;
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
