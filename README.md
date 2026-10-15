# Vishesh Kumar Singh - Personal Portfolio & Writings Universe

Welcome to the source code of my personal website! This repository hosts a modernized 3D interactive portfolio, a dedicated Markdown-driven Story Universe, and a classic minimalist academic view.

**Live Website**: [vishesh-kumar-singh.github.io](https://vishesh-kumar-singh.github.io)

---

## 🌟 Experiences & Architecture

### 1. The 3D Interactive Universe (Main Experience)
The main landing page is an interactive 3D Single Page Application designed to be visually rich, responsive, and performant.

* **Tech Stack**:
  * **React 19 + Vite**: High-performance development and production bundling.
  * **Tailwind CSS**: Modern utility styling with dark glassmorphism palettes.
  * **Framer Motion**: Smooth scroll reveals, dynamic hover physics, and layout animations.
  * **React Three Fiber / Three.js**: Interactive 3D particle background ("Cosmic Dust") reacting to cursor movement.
  * **Lenis**: Smooth inertial scrolling.
  * **Lucide React**: Crisp iconography.

### 2. The Writings Constellation (Story & Essay Universe)
A dedicated, immersive reading universe for personal memoirs, philosophical essays, and stories.

* **Markdown-Driven**: Drop any `.md` file into `blogs/`, and it is automatically discovered, parsed, and rendered.
* **Atmospheric Reading Modes**: Readers can toggle between three tailored atmospheres:
  * 🌙 **Midnight Obsidian** (Deep cosmic indigo)
  * 🌹 **Rose Velvet** (Romantic memoir palette)
  * ☕ **Sepia Warmth** (Vintage candlelight paper)
* **Real-Time Global Interaction**:
  * **Live Global Heart Counter**: Synchronized across readers in real-time via Firebase Realtime Database.
  * **Reader Reflections (Comments)**: Community reflection feed with instant sync.
* **Ambient Soundscape**: An integrated authentic stereo rain soundscape with volume control.

### 3. The Classic Version
For quick academic and professional review, the site features a toggle to the **Classic View**—a lightweight, minimalist portfolio.

* **Tech Stack**: Pure HTML / CSS / Vanilla JavaScript located in `public/classic/`.

---

## ✍️ Publishing a New Story

Stories are stored as Markdown files in the `blogs/` directory. Each file supports rich YAML frontmatter:

```yaml
---
title: "Story Title"
subtitle: "A short reflective tagline"
description: "Brief preview for the card"
date: "October 2026"
badge: "Personal Memoir"      # e.g., "Personal Memoir", "Childhood Memories", "Philosophy"
theme: "rose"                 # Default atmosphere: "midnight" | "rose" | "sepia"
featured: true                # Highlights the story on the home page
featuredQuote: "A memorable quote shown in the reader..."
authorNote: "Personal reflection from the author..."
tags:
  - Memoir
  - Memories
---

Your markdown story content goes here...
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory for local development:

```env
# Contact Form (Web3Forms)
VITE_WEB3FORMS_ACCESS_KEY=your_access_key

# Firebase Realtime Database (Live Hearts & Comments)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vishesh-kumar-singh/vishesh-kumar-singh.github.io.git
   cd vishesh-kumar-singh.github.io
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🚢 Deployment (GitHub Actions)

This repository includes automated deployment via `.github/workflows/deploy.yml`. 

Every push to the `main` branch automatically:
1. Sets up Node.js and installs dependencies (`npm ci`).
2. Injects repository environment secrets.
3. Builds the production bundle (`npm run build`).
4. Deploys the `./dist` artifact directly to **GitHub Pages**.

