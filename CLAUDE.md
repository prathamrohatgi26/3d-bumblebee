# CLAUDE.md

## Project Overview

A Next.js 16 app featuring an interactive 3D "Bumblebee Transformer" hero animation. Users scroll to watch a car disassemble and reassemble into a robot, built with Three.js and Framer Motion.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`)
- **3D:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **Animation:** Framer Motion
- **Fonts:** Geist Sans & Geist Mono (via `next/font/google`)
- **Package manager:** npm

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Project Structure

```
src/
  app/
    layout.tsx        — Root layout (Geist fonts, global CSS)
    page.tsx          — Home page, renders TransformHeroLoader
    globals.css       — Tailwind import + theme tokens
    favicon.ico
  components/
    TransformHero.tsx      — Main 3D scene (client component, ~340 lines)
    TransformHeroLoader.tsx — Dynamic import wrapper (SSR disabled)
```

## Key Architecture Decisions

- **SSR disabled for 3D:** `TransformHeroLoader` uses `next/dynamic` with `ssr: false` because Three.js/R3F requires a browser environment.
- **Scroll-driven animation:** A 500vh container with a sticky viewport. Scroll progress (0–1) drives a three-phase animation: car → scatter → robot.
- **Ref-based animation loop:** Scroll progress is passed via a mutable ref (`progressRef`) to avoid React re-renders on every frame. `useFrame` reads it directly.
- **PIECES array:** Each piece defines car position/scale/rotation (`cp`, `cs`, `cr`) and robot position/scale/rotation (`rp`, `rs`, `rr`), plus material properties.

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Client components use `"use client"` directive
- ESLint config: `eslint-config-next` with core-web-vitals + TypeScript rules
