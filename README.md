# CodeNebula

An advanced interactive GitHub visualization system that transforms repositories, commits, and activity into a real-time explorable 3D universe.

## Description

CodeNebula visualizes a GitHub profile as a dynamic 3D galaxy where:
- **Repositories** become planets orbiting in space
- **Commits** manifest as glowing particles orbiting each planet
- **Stars** (GitHub stars) determine planet size
- **Languages** are represented by unique planet colors
- **Contributions** create pulsing energy waves throughout the galaxy

## Features

### Core Visualization
- Interactive 3D galaxy with procedurally generated planets
- Each repository rendered as a unique planet with language-based coloring
- Orbiting commit particles that animate around planets
- Moons represent forked repositories
- Rings indicate highly popular repositories (100+ stars)

### Visual Effects
- Procedural nebula background using Perlin noise shaders
- Animated starfield with 3000+ stars
- Bloom and depth of field post-processing
- Contribution energy waves emanating from the galaxy center
- Glassmorphism UI panels with neon glow accents

### Interaction
- Hover over planets to see repository names and languages
- Click planets to zoom in and view detailed information
- Smooth camera transitions between viewpoints
- Auto-tour mode for cinematic exploration
- Full orbit controls (pan, zoom, rotate)

### Filtering & Search
- Filter repositories by programming language
- Search repositories by name or description
- Timeline slider to visualize repository growth over time

## Tech Stack

### Frontend
- React 18 with Vite
- Three.js for 3D rendering
- React Three Fiber (R3F) for declarative 3D scenes
- @react-three/drei for helpers and abstractions
- @react-three/postprocessing for visual effects
- Zustand for state management
- GLSL shaders for custom effects

### Graphics
- Custom GLSL vertex and fragment shaders
- Postprocessing pipeline (Bloom, DOF, Vignette)
- GPU-accelerated particle systems
- Instanced rendering for optimal performance

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Manavarya09/CodeNebula.git
cd CodeNebula

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Usage

1. Open the application in your browser
2. Enter a GitHub username in the search box
3. Press Enter or click "Explore" to fetch data
4. Navigate the 3D galaxy:
   - **Click and drag** to rotate the view
   - **Scroll** to zoom in/out
   - **Hover** over planets to see repository names
   - **Click** on planets to view detailed information
5. Use filters to focus on specific languages
6. Use the timeline slider to see repository history
7. Click "Auto Tour" for a cinematic experience

## Project Structure

```
codnebula/
├── src/
│   ├── components/
│   │   ├── Scene.jsx          # Main 3D scene setup
│   │   ├── Galaxy.jsx        # Galaxy container
│   │   ├── Planet.jsx        # Individual planet component
│   │   ├── OrbitParticles.jsx # Commit particles
│   │   ├── Starfield.jsx     # Background stars
│   │   ├── Nebula.jsx        # Procedural nebula
│   │   ├── ContributionWaves.jsx # Energy waves
│   │   └── CameraController.jsx # Camera management
│   ├── hooks/
│   │   └── useGithubData.js  # GitHub data fetching hook
│   ├── utils/
│   │   ├── api.js            # GitHub API utilities
│   │   └── dataMapper.js     # Data transformation
│   ├── store/
│   │   └── useStore.js       # Zustand state store
│   ├── App.jsx               # Main application
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## API

The application uses the GitHub REST API to fetch:
- User profile information
- Repository list with metadata
- User events for contribution data

No authentication required for public data.

## License

MIT License - Copyright (c) 2026 Manav Arya

## Acknowledgments

Built with React Three Fiber and Three.js communities.
