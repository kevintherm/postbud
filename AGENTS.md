# Postbud Agent Guidelines (`AGENTS.md`)

Welcome, Agent! This document outlines the architecture, coding standards, and constraints for **Postbud**, a portable API client and Postman alternative that runs as a Progressive Web App (PWA) with automatic cloud synchronization.

---

## 1. System Overview

Postbud is structured as a monorepo containing two main packages under the `apps/` directory:

- **`apps/web`**: The frontend application built with **Svelte 5** and **Vite**. It is configured as a Progressive Web App (PWA) to enable offline usage, local-first data storage, and smooth synchronization.
- **`apps/api`**: The backend REST API built with PHP using the **Stout framework** (configured with Slim/RoadRunner). It exposes sync endpoints, manages users/sessions, and handles backing data store storage.

---

## 2. Core Architectural & Code Rules

These rules are absolute. Do not violate them under any circumstance.

### 🚫 No God Files (Max 500 Lines)
- **A single code file must never exceed 500 lines of code.**
- If a file is reaching or approaching the 500-line limit, it **must** be refactored and split into smaller, cohesive, single-responsibility modules.
- Write highly modular code, keeping components, helper functions, and classes focused and concise.

### 🔍 Explicit Readability over Clever Shorthand
- Prioritize **clear, explicit, and readable code** over clever tricks, dense inline expressions, or magical behaviors.
- Use meaningful variable and function names.
- Avoid implicit side-effects, deep nesting, and hard-to-debug abstractions.
- Document complex logical flows with clean, direct comments.

### 🎨 Bauhaus Design Language
- The frontend **strictly** adheres to the **Bauhaus Design Language** detailed in [DESIGN.md](file://DESIGN.md).
- Key design principles: Geometric shapes, flat fields of solid primary colors (Yellow, Blue, Red, Black, White), asymmetrical layout balance, and clean sans-serif typography.
- Do not use drop shadows, gradients, rounded corners (keep them sharp or minimal), or pastel colors.

---

## 3. Technology Stack & Directory Structure

### Directory Map
- `/apps/web` - Svelte 5 + Vite PWA frontend.
  - `src/App.svelte` - Root application component.
  - `src/lib/` - Shared components, helper scripts, and API clients.
  - `src/app.css` - Global CSS styles representing the Bauhaus Design System.
- `/apps/api` - PHP Stout API backend.
  - `app.php` - Bootstrapping and route definitions.
  - `rr.yaml` - RoadRunner server configuration.
  - `src/` - Autoloaded PHP application namespace (`App\`). Must be structured by Domain folders directly under `src/` (e.g., `src/Database/`, `src/OpenApi/`):
    - `src/{DomainXXX}/Controllers/` - Handlers/Controllers.
    - `src/{DomainXXX}/Models/` - Database Models.
    - `src/{DomainXXX}/Views/` - View templates/presentations.
    - `src/{DomainXXX}/{Other}/` - Other domain code (Services, Repositories, Providers, etc.).

### Tooling Commands
Run these commands from the root directory:
- **Start All (Dev)**: `bun dev` (runs both frontend and backend dev servers in parallel).
- **Start Frontend**: `bun web:dev`
- **Start Backend**: `bun api:serve`
- **Build Frontend**: `bun web:build`

---

## 4. PWA & Sync Architecture

Postbud is designed as a **local-first** application with **automatic cloud synchronization**:

1. **Local-First Storage**: Request collections, history, and environments are stored locally in the browser (e.g., IndexedDB or localStorage) so the app works seamlessly offline.
2. **Background Sync**: Changes made offline or online are queued and synced automatically with the backend PHP API (`apps/api`) when a connection is active.
3. **Conflict Resolution**: Sync payloads should use timestamps or vector clocks to reconcile differences between local state and the cloud database.

---

## 5. Instructions for Agents

- **Read existing context**: Always inspect current routing definitions in `apps/api/app.php` and the state of `apps/web/src/App.svelte` before adding features.
- **Follow the 500-line rule**: If implementing a large feature (e.g., query params builder, request history pane, environment manager), split them into separate Svelte components in `apps/web/src/lib/`.
- **Maintain Bauhaus Aesthetics**: Use bold primary borders, high-contrast tables, sans-serif fonts, and lowercase labels to match [DESIGN.md](file:///home/kevin/Projects/postbud/DESIGN.md).
