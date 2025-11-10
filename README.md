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

## License

This project is provided as-is for educational and demonstration purposes.