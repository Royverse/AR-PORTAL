# PortalAR

**Innovation Hub** - Portal Augmented Reality Experience

## Introduction

PortalAR is a marker-based augmented reality web application that creates immersive 360° portal experiences. Point your camera at a Hiro marker to reveal a portal displaying 360° panoramic images of the Innovation Hub, complete with animated 3D branding and interactive features.

This project evolved from a Rick and Morty-inspired portal concept (originally created for Hack@Brown 2018) into a professional AR showcase for the Innovation Hub, now built with modern A-Frame and AR.js technology.

## Features

- **Marker-Based AR**: Uses the standard Hiro marker for reliable tracking
- **360° Portal Views**: Full immersive panoramic experiences inside the portal
- **Interactive**: Tap anywhere to cycle through different Innovation Hub locations
- **3D Branding**: Animated rotating "IMD" logo with layered depth effects
- **Dual Perspective**: Different views when looking at the portal from outside vs. inside
- **Professional Frame**: Metallic portal frame with glowing corners
- **Optimized Performance**: Throttled updates and hysteresis to prevent flickering

## Technology Stack

- **A-Frame 1.5.0** - WebVR/AR framework
- **AR.js** - Marker-based AR library
- **Three.js** - 3D rendering (via A-Frame)
- **WebGL** - Hardware-accelerated graphics

## Viewing

### Requirements
- A device with a camera (smartphone, tablet, or webcam-enabled computer)
- A modern web browser with WebGL support (Chrome, Firefox, Safari)
- The [Hiro AR Marker](https://raw.githack.com/AR-js-org/AR.js/master/data/images/HIRO.jpg)

### Instructions
1. Print or display the Hiro marker on a screen
2. Open the [portal.html](portal.html) file in your web browser
3. Grant camera permissions when prompted
4. Point your camera at the Hiro marker
5. Tap the screen to cycle through different 360° locations

## Project Structure

```
PortalAR/
├── portal.html                  # Main AR experience
├── assets/                      # 360° panoramic images
│   ├── IMG_1731.jpg
│   ├── IMG_1732.jpg
│   └── IMG_1736.jpg
├── third_party/
│   └── lib/
│       └── threex-portal-door.js  # Legacy portal implementation
└── README.md
```

## Technical Details

### Portal Implementation
- Uses dual-view rendering: full 360° sphere when inside, 180° hemisphere when outside
- Depth-mask materials create realistic occlusion effects
- Position-based visibility switching with hysteresis prevents flickering
- Portal frame uses metallic materials with emissive properties

### 3D Logo
- 12-layer text depth effect for realistic 3D appearance
- Continuous rotation animation (8-second loop)
- Orbiting decorative spheres and rotating torus ring
- Gradient metallic materials from bright blue (#0066CC) to dark blue (#003366)

### Performance Optimizations
- Throttled tick updates (every 2 frames)
- Cached DOM queries
- Debounced interaction events (300ms cooldown)
- Efficient material reuse

## Browser Compatibility

- ✅ Chrome (Android/Desktop)
- ✅ Firefox (Android/Desktop)
- ✅ Safari (iOS/macOS)
- ✅ Edge (Desktop)

## Development History

- **2018**: Original concept created for Hack@Brown using three.ar.js and WebARonARKit/ARCore
- **2025**: Modernized with A-Frame and AR.js, redesigned for Innovation Hub branding

## Credits

Originally inspired by the spawn-at-camera example from Google's [three.ar.js](https://github.com/google-ar/three.ar.js) library.

Updated to use [A-Frame](https://aframe.io/) and [AR.js](https://github.com/AR-js-org/AR.js) for broader compatibility and improved performance.

## Base prompt for app:

Prompt: Create a single-file AR "Portal" Web App

Objective:
Create a single-file HTML web application (index.html) that uses A-Frame and AR.js to create a "portal" effect on a marker. The portal should appear as a 3D hole in the marker, revealing a new "world" inside that is only visible when looking through the portal frame.

Core Technologies:

A-Frame: Load version 1.5.0 from its CDN.

AR.js 3: Load the A-Frame build from the raw.githack.com CDN.

HTML Structure: All CSS and JavaScript must be contained within the single index.html file.

Functional Requirements:

Instruction UI:

Create a <div id="instructions"> overlay at the top of the screen.

Style it with a semi-transparent black background and white text.

The overlay must instruct the user to find the "Hiro" marker and provide a clickable link to view the marker image.

AR Scene Setup:

Configure an <a-scene> with embedded and arjs properties (sourceType: webcam, debugUIEnabled: false).

Include an <a-marker> set to preset="hiro".

Add an <a-entity camera> and basic ambient/directional lighting to the scene.

Portal Rim (The "Window Frame"):

Inside the <a-marker>, create an <a-entity id="portal-rim">.

This entity must be rotated (rotation="-90 0 0") to lie flat on the marker.

The rim must be constructed from four <a-box> primitives, arranged to form a 1x1 square frame.

The rim must be colored magenta to be clearly visible.

It should be slightly elevated (position="0 0.01 0") to prevent flickering with the marker.

Portal World (The "Hole" Illusion):

This is the most critical part. The portal must appear as a hole, and the contents must not be visible from the side (i.e., no "floating box" bug).

Create an <a-entity id="portal-contents">.

Inside this entity, build a 5-sided box (a "room" with 4 walls and a floor) using five separate <a-plane> elements.

Crucial Illusion Logic: All five planes must have their material set to material="side: back". This will make them invisible from the outside, but visible when viewed from the inside (looking through the rim).

Positioning:

The "floor" plane (Bottom Wall) must be positioned to cover the Hiro marker's white area (e.g., position="0 -1 0", rotation="-90 0 0").

The four "wall" planes must be positioned to form a 1x1x1 cube under the floor.

The entire portal-contents entity should be positioned below the rim.

World Contents:

Inside this "box" (i.e., inside portal-contents), add a red (#E63946) <a-box>.

Animate the red cube to spin continuously on its Y-axis.

Add an <a-entity light="type: point"> inside the portal-contents to illuminate the red cube.


Base prompt for logo

## License

This project is provided as-is for educational and demonstration purposes.
