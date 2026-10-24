# AR-PORTAL

**Spatial WebAR Dimensional Portal Engine** — Built with A-Frame, AR.js, Depth-Buffer Occlusion & Nano Banana 360° Spatial Canvases.

Live Experience: **[https://ar-portal-demo.netlify.app/](https://ar-portal-demo.netlify.app/)**

---

## Overview

**AR-PORTAL** turns any Hiro fiducial marker into a dimensional window in physical space. Using hardware-accelerated WebGL depth-masking (`colorWrite: false` occlusion cloak) and real-time local-space camera tracking with hysteresis, the portal renders both:
- **Outside-In Perspective (`z >= 0`)**: A 180° hemispherical window (`phi-start: 180, phi-length: 180`) masked tightly by a 4-plane depth-buffer cloak, revealing a deep 3D spatial corridor behind the marker.
- **Inside-Out 360° Immersion (`z < 0`)**: Step physically through the portal plane to enter a full 360° equirectangular sphere with a reverse depth-masked doorway looking back out into your real room.

---

## Nano Banana 360° Spatial Worlds & Volumetric 3D Modeling

Each portal world pairs a full-bleed **Nano Banana equirectangular panoramic canvas** (`assets/worlds/`) with multi-layered **3D spatial geometry** (`z = -0.5` to `z = -6.0`) for true motion parallax as you move your camera around or through the doorway:

1. **01 · Cyber Nexus (`cyber-nexus.jpg`)**
   - *Panoramic Canvas*: Futuristic nocturnal cyber-rotunda with glowing electric cyan circuit pathways converging at the central vanishing point.
   - *3D Spatial Volume*: Perspective neon floor runway extending from the portal threshold (`z = 0`), receding rotating holographic depth rings (`z = -1.2, -2.6, -4.2`), and the 9-layer extruded metallic **IMD Innovation Nexus** core with dual counter-rotating gyroscopes.
2. **02 · Lunar Outpost (`lunar-observatory.jpg`)**
   - *Panoramic Canvas*: High-contrast lunar crater research base with geodesic domes, autonomous rover, and Earth rising in the central starfield sky.
   - *3D Spatial Volume*: Lunar regolith telemetry deck, suspended 3D **Earth-Moon Orbital Holomap** (`z = -2.0`) with inclined satellite trajectory, and low-gravity floating relay monoliths.
3. **03 · Solarpunk Sanctuary (`solarpunk-sanctuary.jpg`)**
   - *Panoramic Canvas*: Golden-hour bioluminescent botanical sanctuary with a glass-and-timber boardwalk over an emerald lagoon surrounded by biodomes and waterfalls.
   - *3D Spatial Volume*: 3D suspension bridge rails extending from the portal frame into the lagoon, a golden **Solar-Botanical Gyroscope**, and volumetric floating bioluminescent lantern orbs.

---

## Project Architecture

```text
AR-PORTAL/
├── index.html                   # Primary WebAR application entry
├── portal.html                  # Netlify / direct route entry
├── css/
│   └── portal.css               # Glassmorphic HUD, World Dock & Marker Modal styles
├── js/
│   ├── worlds.js                # Nano Banana world definitions & 3D spatial volume builders
│   └── portal-engine.js         # Depth-mask shader, hysteresis tracker & Web Audio synth
├── assets/
│   ├── hiro-marker.jpg          # Local high-contrast Hiro fiducial target
│   └── worlds/
│       ├── cyber-nexus.jpg
│       ├── lunar-observatory.jpg
│       └── solarpunk-sanctuary.jpg
└── netlify.toml                 # Netlify production routing config
```
