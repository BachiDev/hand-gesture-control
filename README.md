# Hand Gesture Control

A web application that turns your webcam into a controller: real-time hand tracking
recognizes poses and translates them into page actions — scrolling, theme flips,
tab navigation, and camera-frame resizing. All machine learning runs in your
browser; no video ever leaves your device.

[Check Out Live](https://bachidev.github.io/hand-gesture-control)

## Features

- **Real-time Hand Tracking**: Utilizes your webcam to track the position and orientation of your hand in real-time (21 3D landmarks per hand).
- **Gesture-based UI Control**:
  - 👍 **Thumbs Up / Down**: Smooth-scroll the page (velocity-based, glides through jitter).
  - ✌️ **Victory Sign**: Flip the whole page between light and dark mode.
  - 🖐️ **Open Palm**: Greeting toast + hint coach; fling left/right to switch tabs; push/pull (closer–farther) to resize the camera frame and drive the slider.
- **Visual Feedback**: The docked camera feed draws the detected hand skeleton plus a motion trail; a toast confirms the active gesture; the HUD shows live fps/cost.
- **Client-side Machine Learning**: All hand tracking and gesture recognition runs directly in your browser, ensuring privacy and low latency. No video ever leaves your device — there is no server, no tracking, and no analytics.

## Supported gestures

| Gesture         | Action                                                                                                                                   | Policy                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 👍 Thumbs Up    | Smooth-scroll the page up                                                                                                                | immediate (velocity)                                |
| 👎 Thumbs Down  | Smooth-scroll the page down                                                                                                              | immediate (velocity)                                |
| ✌️ Victory Sign | Flip light/dark theme across the whole page                                                                                              | transition, 800 ms cooldown                         |
| 🖐️ Open Palm    | Say hello (+ hint toast) — fling left/right to switch tabs; push/pull (move closer–farther) resizes the camera frame + drives the slider | transition hello 1.5 s + continuous motion/distance |

Design rules: no gesture performs a destructive action (the camera stops only via
explicit UI: dock button, keyboard, or resume overlay). A tucked-thumb fist
matches nothing — resting hands stay silent. The middle-finger classifier remains
as an unlisted easter egg with no mapped action.

All thresholds live in `app/lib/gestures/config.ts` (normalized units — no pixel
magic). Temporal behavior (majority vote, hysteresis, transition cooldowns) is pure
and unit tested in `app/lib/gestures/smoothing.ts` — see `__tests__/` and `TESTING.md`.

## Explore without a camera

- **No-camera access**: the full keyboard map (`↑`/`↓` scroll · `←`/`→` + `1–3` tabs ·
  `V` theme · `P` pause) drives every action; e2e additionally reaches the synthetic
  machine path via `window.__hgcSimulate`.
- **Keyboard map**: `↑`/`↓` scroll · `←`/`→` + `1–3` tabs · `V` theme · `P` pause.
- **Site tabs** (Home / Settings / Insights, sticky nav): every gesture consequence is
  page-sized — frame resize, theme flip, tab switch — never a tiny widget somewhere.
- **Settings**: sensitivity presets (relaxed/standard/strict), mirror preview, camera
  picker — persisted to `localStorage`, shareable via URL (`?sensitivity=strict&mirror=0`).
- **Gesture Lab + HUD + Event Log** (below the stage): live joint angles, vote window,
  inference fps/cost, and a copyable event record.

## Technical Deep Dive

This project is built on a modern web stack and leverages in-browser machine learning for its core functionality.

## Machine Learning

The application is built with **Next.js**, a React framework, and is written in **TypeScript**. Styling is handled by **Tailwind CSS**.

The key machine learning components are bundled via npm (version-pinned, no CDN
scripts) and lazy-loaded **after the camera is granted** — denied/headless visits
never download them:

- **TensorFlow.js core + converter + WebGL/CPU backends** (`@tensorflow/tfjs-core`
  and friends): slim imports instead of the full `@tensorflow/tfjs` bundle (which
  drags data/layers packages the model never uses).
- **Hand Pose Detection Model (`@tensorflow-models/hand-pose-detection`)**: A pre-trained TensorFlow.js model that detects the keypoints of a hand. This project uses the `MediaPipeHands` detector type with the `tfjs` runtime, which predicts **21 3D landmarks** on the hand.

## Technologies Used

- **Framework**: [Next.js](https://nextjs.org/) 16 / [React](https://react.dev/) 19
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Machine Learning**:
  - [TensorFlow.js](https://www.tensorflow.org/js)
  - [MediaPipe Hands](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md)
  - [TF.js Hand Pose Detection Model](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Lucide React](https://lucide.dev/) (for icons)

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/BachiDev/hand-gesture-control.git
    cd hand-gesture-control
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser. You will be prompted to allow camera access.

## Scripts

| Command                                 | What                                          |
| --------------------------------------- | --------------------------------------------- |
| `npm run dev`                           | Start the development server                  |
| `npm run build`                         | Static export to `./out` (what Pages deploys) |
| `npm run typecheck` / `lint` / `format` | `tsc --noEmit` / ESLint / Prettier            |
| `npm test`                              | Vitest unit suite (classifiers, machine, …)   |
| `npm run test:e2e`                      | Playwright smoke + axe against `./out`        |
| `npm run og`                            | Regenerate `public/og-cover.png`              |

## How to Use

1.  Grant the web page permission to access your webcam.
2.  Position your hand within the webcam view.
3.  A skeletal overlay will appear on your hand, confirming that it is being tracked.
4.  Make one of the supported gestures to interact with the page:
    - **Thumbs Up/Down**: To scroll the content (velocity-based).
    - **Victory Sign**: To flip light/dark mode.
    - **Open Palm**: Greeting + hint toast; fling left/right to switch tabs, push/pull to resize the camera frame.
    - The camera stops only via explicit UI (dock stop button, `P` key, or the resume overlay) — no gesture kills the feed.
5.  A small toast notification will appear at the bottom of the screen to indicate which gesture is currently detected.
