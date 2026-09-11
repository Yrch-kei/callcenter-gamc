# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de Gestión de Denuncias Municipales — frontend built with React 19, Vite 8, Tailwind CSS v4, and GSAP. Uses JSX (not TypeScript). ES modules throughout.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (output in `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint

## Architecture

- **Entry:** `src/main.jsx` → `App.jsx` (wraps ThemeProvider → AuthProvider → AppRouter → Toaster)
- **Router:** `src/router/AppRouter.jsx` — three layout groups:
  - `AuthLayout` — `/login` (public)
  - `MainLayout` — `/dashboard`, `/denuncias`, `/denuncias/nueva`, `/denuncias/:id`, `/mapa` (protected via `ProtectedRoute`)
  - `PublicLayout` — `/seguimiento` (citizen portal, public)
- **Layouts:** `src/components/layout/` — `MainLayout` has fixed Topbar + collapsible Sidebar (desktop) / BottomNav (mobile)
- **UI Kit:** `src/components/ui/` — reusable components (Button, Input, Select, Card, Badge, Modal, Spinner, Tabs) with barrel export via `index.js`
- **Shared Components:** `src/components/shared/` — domain-specific: StatCard (animated counter), StatusBadge, PriorityIndicator
- **Mock Data:** `src/services/mockData.js` (12 denuncias, stats, chart data), `src/services/mockHistory.js` (timeline events, evidencias)
- **Context:** `AuthContext` (mock auth with localStorage), `ThemeContext` (light/dark toggle via `.dark` class)
- **Path alias:** `@/` maps to `src/` (configured in `vite.config.js`)

## Design Tokens (Institutional Palette)

Defined as CSS custom properties in `src/index.css` via Tailwind `@theme`:
- Primary (celeste): `#4ac1e0` — links, active states, primary buttons
- Accent (rosa/fucsia): `#ea537c` — CTAs, urgent badges, required markers
- Surface: `#f3f4f6` (light bg), `#0a0a0a` (dark bg)
- Semantic: success `#22c55e`, warning `#f59e0b`, danger `#ef4444`
- Dark mode: toggled via `.dark` class on `<html>`, managed by ThemeContext

## Key Libraries

- `react-router-dom` — routing
- `react-hook-form` + `zod` + `@hookform/resolvers` — form validation
- `gsap` — animations (respect `prefers-reduced-motion`)
- `lucide-react` — SVG icons
- `react-hot-toast` — toast notifications
- `recharts` — charts (dashboard)
- `react-leaflet` + `leaflet` — maps
- `@tanstack/react-table` — data tables
- `clsx` — conditional class names (wrapped in `src/utils/cn.js`)
- `dayjs` — date formatting

## Linting

ESLint flat config (`eslint.config.js`) with react-hooks and react-refresh plugins. `no-unused-vars` ignores variables matching `^[A-Z_]`. `dist/` is globally ignored.

## Domain Constants

`src/utils/constants.js` — denuncia statuses (`pendiente`, `en_proceso`, `resuelta`, `rechazada`), priorities (`baja`, `media`, `alta`, `urgente`), and category list. Each has a config object mapping to Tailwind color classes.
