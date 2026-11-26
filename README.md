# AetherOS v4 (`4xbranch`)

A modular **4-in-1 Cyber-Glass Web OS** experiment built with **React 19**, **TypeScript**, and **Tailwind CSS v4** — combining 3D spatial card physics, live telemetry simulation, and four dedicated feature branches.

## Architecture & Branches

| Branch | Module | Highlights |
| :--- | :--- | :--- |
| `main` | **Command Hub** | 3D cyber-glass core, live system clock, telemetry simulator & mode switcher (`Performance`, `Stealth`, `Overdrive`) |
| `feature/crypto-terminal` | **Crypto Terminal** | Institutional live order book & custom SVG charts |
| `feature/ai-studio` | **AI Art Studio** | Generative prompt engine & gallery workspace |
| `feature/music-player` | **Spatial Vinyl** | 32-band audio visualizer & WebAudio synth |

## Tech Stack

- **Frontend:** React 19, TypeScript 5.7, Vite 6
- **Styling & Icons:** Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React

## Local Setup

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
