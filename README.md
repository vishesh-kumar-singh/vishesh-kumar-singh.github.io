# Vishesh Kumar Singh - Personal Portfolio

Welcome to the source code of my personal portfolio website! This repository actually hosts **two complete versions** of my portfolio, seamlessly integrated into a single domain.

**Live Website**: [vishesh-kumar-singh.github.io](https://vishesh-kumar-singh.github.io)

---

## The 3D Interactive Version (Next-Gen)
The main landing page is a fully modernized, highly interactive 3D Single Page Application. It is designed to be visually stunning, performant, and engaging.

**Tech Stack:**
*   **React + Vite**: For a lightning-fast development experience and optimized production builds.
*   **Tailwind CSS**: For sleek, modern, and highly responsive styling.
*   **Framer Motion**: Powering the smooth scroll reveals, dynamic hovers, and page transitions.
*   **React Three Fiber / Three.js**: Rendering the interactive 3D particle background (the "Cosmic Dust" effect) that reacts to mouse movement.
*   **Lucide React**: For crisp, scalable iconography.
*   **Lenis Scroll**: Providing buttery-smooth scroll hijacking across the entire application.

## The Classic Version (Legacy)
Sometimes you just need the facts without the flash. The site features a built-in toggle that transports you back to the "Classic View"—a clean, minimal, academic-style portfolio.

**Tech Stack:**
*   **Vanilla HTML / CSS / JavaScript**: No frameworks, no build tools, just pure foundational web technologies.
*   **Minimalist Design**: Optimized for readability and speed, serving as a clean fallback for professional environments.

---

## Local Development

To run the interactive 3D version locally on your machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/vishesh-kumar-singh/vishesh-kumar-singh.github.io.git
    cd vishesh-kumar-singh.github.io
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    This will spin up a local server (usually at `localhost:5173`).

*(Note: The Classic version is located inside the `public/classic` folder and is served statically by Vite).*

## Deployment (GitHub Actions)

This repository uses a custom **GitHub Actions Workflow** (`.github/workflows/deploy.yml`) to automatically build and deploy the Vite React application to GitHub Pages. 

Every push to the `main` branch automatically:
1.  Installs dependencies.
2.  Runs the Vite build process (`npm run build`).
3.  Copies the static `public/classic` folder directly into the root of the output.
4.  Deploys the final bundled `/dist` folder to GitHub Pages.
