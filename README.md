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


Base prompt for logo:

Complete A-Frame AR Logo Prompt:

Create a 3D rotating "IMD" logo for an A-Frame AR.js application with the following exact specifications:

Logo Structure:

Parent entity: <a-entity id="logo-imd" position="0 0 -2" rotation="0 0 0">
Two child entities with independent scaling:
Text layers entity: scale="1.0 1.0 1.0"
Decorations entity: scale="0.2 0.2 0.2"
IMD Text Specifications (12 Layered Text Elements):

Font: "roboto"
Width: 6
Alignment: center
Shader: standard with varying metalness (0.9 to 0.5) and roughness (0.1 to 0.5)
All layers rotate continuously: animation="property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear"
12 Text Layers (Front to Back):

Position: 0 0 0.15, Color: #0066CC, Metalness: 0.9, Roughness: 0.1
Position: 0 0 0.13, Color: #0062C4, Metalness: 0.9, Roughness: 0.1
Position: 0 0 0.11, Color: #005EBD, Metalness: 0.9, Roughness: 0.1
Position: 0 0 0.09, Color: #0059B3, Metalness: 0.8, Roughness: 0.2
Position: 0 0 0.07, Color: #0055AA, Metalness: 0.8, Roughness: 0.2
Position: 0 0 0.05, Color: #0051A0, Metalness: 0.8, Roughness: 0.2
Position: 0 0 0.03, Color: #004C99, Metalness: 0.7, Roughness: 0.3
Position: 0 0 0.01, Color: #004890, Metalness: 0.7, Roughness: 0.3
Position: 0 0 -0.01, Color: #004486, Metalness: 0.6, Roughness: 0.4
Position: 0 0 -0.03, Color: #004080, Metalness: 0.6, Roughness: 0.4
Position: 0 0 -0.05, Color: #003C77, Metalness: 0.5, Roughness: 0.5
Position: 0 0 -0.07, Color: #003366, Metalness: 0.5, Roughness: 0.5
Decorative Elements (Scale 0.2):

Two Orbiting Spheres:

Blue sphere:

Radius: 0.15
Start position: 1.2 0.5 0
Material: color: #0066CC; emissive: #0066CC; emissiveIntensity: 0.7; metalness: 0.8
Animation: property: object3D.position.x; to: -1.2; from: 1.2; loop: true; dur: 3000; dir: alternate; easing: easeInOutSine
Dark blue sphere:

Radius: 0.15
Start position: -1.2 -0.5 0
Material: color: #003366; emissive: #003366; emissiveIntensity: 0.7; metalness: 0.8
Animation: property: object3D.position.x; to: 1.2; from: -1.2; loop: true; dur: 3000; dir: alternate; easing: easeInOutSine
Rotating Torus Ring:

Position: 0 0 0
Radius: 1.8
Tube radius: 0.05
Material: color: #0066CC; emissive: #0066CC; emissiveIntensity: 1.0; metalness: 0.9; roughness: 0.1
Animation: property: rotation; to: 360 360 0; loop: true; dur: 10000; easing: linear
Color Gradient Pattern: The text layers create a gradient from bright blue (#0066CC) at the front to dark navy (#003366) at the back, with decreasing metalness (0.9→0.5) and increasing roughness (0.1→0.5) for depth perception.

Key Design Features:

Text is 5x larger than decorations (scale 1.0 vs 0.2)
All elements rotate continuously at different speeds
Spheres oscillate horizontally in opposite directions
Layered text creates 3D depth effect with gradient coloring
High metalness and emissive properties create glowing effect
Blue color scheme (#0066CC to #003366) maintains brand consistency

## License

This project is provided as-is for educational and demonstration purposes.
