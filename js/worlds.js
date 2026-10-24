/**
 * AR-PORTAL — Nano Banana 360° Panoramic Worlds & 3D Spatial Volume Definitions
 */

window.PORTAL_WORLDS = [
  {
    id: 'cyber-nexus',
    indexLabel: 'WORLD 01',
    name: 'Cyber Nexus',
    subtitle: 'Holographic Innovation Rotunda & Neural Corridor',
    assetId: '#canvas-cyber-nexus',
    src: './assets/worlds/cyber-nexus.jpg',
    frameColor: '#00e5ff',
    frameEmissive: '#0088cc',
    sphereRotationOutside: '0 0 0',
    sphereRotationInside: '0 -90 0',
    audioFreq: 110
  },
  {
    id: 'lunar-observatory',
    indexLabel: 'WORLD 02',
    name: 'Lunar Outpost',
    subtitle: 'Crater Geodesic Research Base & Earthrise Horizon',
    assetId: '#canvas-lunar-observatory',
    src: './assets/worlds/lunar-observatory.jpg',
    frameColor: '#93c5fd',
    frameEmissive: '#3b82f6',
    sphereRotationOutside: '0 0 0',
    sphereRotationInside: '0 -90 0',
    audioFreq: 92.5
  },
  {
    id: 'solarpunk-sanctuary',
    indexLabel: 'WORLD 03',
    name: 'Solarpunk Sanctuary',
    subtitle: 'Bioluminescent Emerald Lagoon & Glass Biodomes',
    assetId: '#canvas-solarpunk-sanctuary',
    src: './assets/worlds/solarpunk-sanctuary.jpg',
    frameColor: '#34d399',
    frameEmissive: '#f59e0b',
    sphereRotationOutside: '0 0 0',
    sphereRotationInside: '0 -90 0',
    audioFreq: 130.8
  }
];

/**
 * Generates the 3D spatial modeling inside a portal container (`#portal-outside` or `#portal-inside`)
 * so each Nano Banana panoramic canvas is paired with multi-depth 3D geometry (z = -0.5 to -7.0)
 * for true motion parallax and spatial presence.
 */
window.buildWorldSpatialVolume = function (worldId) {
  if (worldId === 'cyber-nexus') {
    const imdLayers = [
      { z: 0.11, color: '#00e5ff', metal: 0.9, rough: 0.1 },
      { z: 0.09, color: '#00cce6', metal: 0.9, rough: 0.1 },
      { z: 0.07, color: '#00b3cc', metal: 0.85, rough: 0.15 },
      { z: 0.05, color: '#0099b3', metal: 0.8, rough: 0.2 },
      { z: 0.03, color: '#007f99', metal: 0.75, rough: 0.25 },
      { z: 0.01, color: '#0066CC', metal: 0.7, rough: 0.3 },
      { z: -0.01, color: '#0055AA', metal: 0.65, rough: 0.35 },
      { z: -0.03, color: '#004488', metal: 0.6, rough: 0.4 },
      { z: -0.05, color: '#003366', metal: 0.5, rough: 0.5 }
    ]
      .map(
        (l) => `
        <a-text value="IMD" position="0 0 ${l.z}" align="center" color="${l.color}" width="4.8"
          shader="standard" metalness="${l.metal}" roughness="${l.rough}" font="roboto">
        </a-text>`
      )
      .join('');

    return `
      <!-- 3D Spatial Depth Runway connecting Portal Threshold (z=0) to Canvas Vanishing Point -->
      <a-entity position="0 -0.49 -3.0">
        <a-plane width="0.85" height="6.0" rotation="-90 0 0"
          material="color: #031525; emissive: #004466; emissiveIntensity: 0.45; metalness: 0.9; roughness: 0.15; opacity: 0.75; transparent: true">
        </a-plane>
        <!-- Left & Right Neon Guide Rails -->
        <a-box position="-0.42 0.01 0" width="0.02" height="0.02" depth="6.0"
          material="color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.9; shader: flat"></a-box>
        <a-box position="0.42 0.01 0" width="0.02" height="0.02" depth="6.0"
          material="color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.9; shader: flat"></a-box>
      </a-entity>

      <!-- Receding 3D Spatial Depth Ribs for Parallax -->
      <a-torus position="0 0 -1.2" radius="0.62" radius-tubular="0.008"
        material="color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.8; shader: flat; opacity: 0.65; transparent: true"
        animation="property: rotation; to: 0 0 360; loop: true; dur: 18000; easing: linear">
      </a-torus>
      <a-torus position="0 0 -2.6" radius="0.85" radius-tubular="0.01"
        material="color: #38bdf8; emissive: #0284c7; emissiveIntensity: 0.8; shader: flat; opacity: 0.5; transparent: true"
        animation="property: rotation; to: 0 0 -360; loop: true; dur: 24000; easing: linear">
      </a-torus>
      <a-torus position="0 0 -4.2" radius="1.15" radius-tubular="0.014"
        material="color: #818cf8; emissive: #4f46e5; emissiveIntensity: 0.8; shader: flat; opacity: 0.4; transparent: true"
        animation="property: rotation; to: 0 0 360; loop: true; dur: 30000; easing: linear">
      </a-torus>

      <!-- Centerpiece 3D Extruded IMD Holographic Core at z = -2.2 -->
      <a-entity position="0 0.08 -2.2">
        <a-entity animation="property: rotation; to: 0 360 0; loop: true; dur: 9000; easing: linear">
          ${imdLayers}
        </a-entity>

        <!-- Dual Gyroscope Rings & Orbiting Nodes -->
        <a-entity scale="0.24 0.24 0.24">
          <a-torus radius="1.9" radius-tubular="0.045"
            material="color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.9; metalness: 0.9; roughness: 0.1"
            animation="property: rotation; to: 360 360 0; loop: true; dur: 10000; easing: linear">
          </a-torus>
          <a-torus radius="2.2" radius-tubular="0.03"
            material="color: #3b82f6; emissive: #2563eb; emissiveIntensity: 0.8; metalness: 0.9; roughness: 0.1"
            animation="property: rotation; to: -360 180 90; loop: true; dur: 14000; easing: linear">
          </a-torus>
          <a-sphere radius="0.16" position="1.4 0.5 0"
            material="color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 0.9"
            animation="property: object3D.position.x; from: 1.4; to: -1.4; loop: true; dur: 2800; dir: alternate; easing: easeInOutSine">
          </a-sphere>
          <a-sphere radius="0.16" position="-1.4 -0.5 0"
            material="color: #3b82f6; emissive: #3b82f6; emissiveIntensity: 0.9"
            animation="property: object3D.position.x; from: -1.4; to: 1.4; loop: true; dur: 2800; dir: alternate; easing: easeInOutSine">
          </a-sphere>
        </a-entity>

        <!-- Floating 3D Subtitle -->
        <a-text value="INNOVATION NEXUS" position="0 -0.45 0" align="center" color="#e0f2fe" width="2.4" font="roboto"></a-text>
      </a-entity>
    `;
  }

  if (worldId === 'lunar-observatory') {
    return `
      <!-- Lunar Crater Regolith Telemetry Deck -->
      <a-entity position="0 -0.48 -2.5">
        <a-cylinder radius="0.65" height="0.03" position="0 0 0"
          material="color: #1e293b; emissive: #0f172a; metalness: 0.8; roughness: 0.3">
        </a-cylinder>
        <a-ring radius-inner="0.58" radius-outer="0.63" rotation="-90 0 0" position="0 0.02 0"
          material="color: #60a5fa; emissive: #3b82f6; emissiveIntensity: 0.9; shader: flat">
        </a-ring>
      </a-entity>

      <!-- 3D Earth-Moon Orbital Holomap in Foreground Space (z = -2.0) -->
      <a-entity position="0 0.05 -2.0">
        <!-- Central Holographic Lunar Globe -->
        <a-sphere radius="0.22"
          material="color: #cbd5e1; emissive: #1e3a8a; emissiveIntensity: 0.35; metalness: 0.4; roughness: 0.6; wireframe: false"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 16000; easing: linear">
        </a-sphere>
        <!-- Wireframe Latitude/Longitude Cage -->
        <a-sphere radius="0.235" segments-width="12" segments-height="8"
          material="color: #60a5fa; wireframe: true; opacity: 0.45; transparent: true"
          animation="property: rotation; to: 0 -360 0; loop: true; dur: 22000; easing: linear">
        </a-sphere>

        <!-- Inclined Orbital Track + Orbiting Earth-Link Probe -->
        <a-entity rotation="22 0 -15" animation="property: rotation; to: 22 360 -15; loop: true; dur: 9000; easing: linear">
          <a-torus radius="0.48" radius-tubular="0.006" rotation="90 0 0"
            material="color: #93c5fd; emissive: #60a5fa; emissiveIntensity: 0.8; shader: flat">
          </a-torus>
          <a-sphere radius="0.045" position="0.48 0 0"
            material="color: #38bdf8; emissive: #00e5ff; emissiveIntensity: 1.0; shader: flat">
          </a-sphere>
        </a-entity>

        <a-text value="LUNAR SECTOR 04" position="0 -0.42 0" align="center" color="#bfdbfe" width="2.3" font="roboto"></a-text>
      </a-entity>

      <!-- Low-Gravity Floating Relay Monoliths (Left & Right Depth Parallax) -->
      <a-box position="-0.55 0.1 -1.5" width="0.08" height="0.32" depth="0.08"
        material="color: #475569; emissive: #1d4ed8; emissiveIntensity: 0.4; metalness: 0.9; roughness: 0.2"
        animation="property: object3D.position.y; from: 0.05; to: 0.22; loop: true; dur: 3200; dir: alternate; easing: easeInOutSine">
      </a-box>
      <a-box position="0.55 0.18 -1.8" width="0.08" height="0.32" depth="0.08"
        material="color: #475569; emissive: #1d4ed8; emissiveIntensity: 0.4; metalness: 0.9; roughness: 0.2"
        animation="property: object3D.position.y; from: 0.22; to: 0.05; loop: true; dur: 3600; dir: alternate; easing: easeInOutSine">
      </a-box>
    `;
  }

  // World 03: Solarpunk Sanctuary
  return `
    <!-- 3D Stepped Glass & Timber Suspension Boardwalk Extending Through Portal -->
    <a-entity position="0 -0.48 -2.4">
      <a-plane width="0.75" height="4.8" rotation="-90 0 0"
        material="color: #064e3b; emissive: #047857; emissiveIntensity: 0.35; opacity: 0.7; transparent: true">
      </a-plane>
      <a-box position="-0.38 0.02 0" width="0.025" height="0.03" depth="4.8"
        material="color: #f59e0b; emissive: #d97706; emissiveIntensity: 0.7"></a-box>
      <a-box position="0.38 0.02 0" width="0.025" height="0.03" depth="4.8"
        material="color: #f59e0b; emissive: #d97706; emissiveIntensity: 0.7"></a-box>
    </a-entity>

    <!-- 3D Golden Solar-Botanical Gyroscope at z = -2.1 -->
    <a-entity position="0 0.08 -2.1">
      <a-octahedron radius="0.18"
        material="color: #10b981; emissive: #059669; emissiveIntensity: 0.6; metalness: 0.7; roughness: 0.15"
        animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear">
      </a-octahedron>
      <a-torus radius="0.36" radius-tubular="0.01"
        material="color: #fbbf24; emissive: #f59e0b; emissiveIntensity: 0.9; metalness: 0.9; roughness: 0.1"
        animation="property: rotation; to: 360 180 0; loop: true; dur: 11000; easing: linear">
      </a-torus>
      <a-torus radius="0.46" radius-tubular="0.008"
        material="color: #34d399; emissive: #10b981; emissiveIntensity: 0.8; shader: flat"
        animation="property: rotation; to: -180 360 90; loop: true; dur: 14000; easing: linear">
      </a-torus>
      <a-text value="SOLARPUNK SANCTUARY" position="0 -0.42 0" align="center" color="#fef3c7" width="2.2" font="roboto"></a-text>
    </a-entity>

    <!-- Floating 3D Bioluminescent Lantern Orbs in Volumetric Space -->
    <a-sphere radius="0.045" position="-0.42 0.25 -1.3"
      material="color: #fde68a; emissive: #f59e0b; emissiveIntensity: 1.0; shader: flat"
      animation="property: object3D.position.y; from: 0.18; to: 0.38; loop: true; dur: 2900; dir: alternate; easing: easeInOutSine">
    </a-sphere>
    <a-sphere radius="0.05" position="0.45 0.15 -1.6"
      material="color: #fde68a; emissive: #f59e0b; emissiveIntensity: 1.0; shader: flat"
      animation="property: object3D.position.y; from: 0.34; to: 0.12; loop: true; dur: 3400; dir: alternate; easing: easeInOutSine">
    </a-sphere>
    <a-sphere radius="0.04" position="-0.28 0.42 -2.9"
      material="color: #6ee7b7; emissive: #10b981; emissiveIntensity: 1.0; shader: flat"
      animation="property: object3D.position.y; from: 0.35; to: 0.55; loop: true; dur: 3800; dir: alternate; easing: easeInOutSine">
    </a-sphere>
    <a-sphere radius="0.055" position="0.32 0.38 -3.3"
      material="color: #fde68a; emissive: #f59e0b; emissiveIntensity: 1.0; shader: flat"
      animation="property: object3D.position.y; from: 0.48; to: 0.25; loop: true; dur: 3100; dir: alternate; easing: easeInOutSine">
    </a-sphere>
  `;
};
