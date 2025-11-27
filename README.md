# Hand Gesture Control

A web application that allows you to control a user interface using real-time hand gestures captured from your webcam. This project uses machine learning to recognize specific hand poses and translate them into actions like scrolling and toggling content.

[Check Out Live](https://bachidev.github.io/hand-gesture-control)

## Features

*   **Real-time Hand Tracking**: Utilizes your webcam to track the position and orientation of your hand in real-time.
*   **Gesture-based UI Control**:
    *   👍 **Thumbs Up**: Scroll the page content up.
    *   👎 **Thumbs Down**: Scroll the page content down.
    *   ✌️ **Victory Sign**: Toggle the visibility of a content section.
    *   🖕 **Middle Finger (Hold)**: Hold the gesture for 3 seconds to deactivate the camera and gesture detection.
*   **Visual Feedback**: An overlay on the webcam feed draws the detected hand skeleton, providing immediate visual feedback. A toast notification also confirms the currently recognized gesture.
*   **Client-side Machine Learning**: All hand tracking and gesture recognition runs directly in your browser, ensuring privacy and low latency.

## Technical Deep Dive

This project is built on a modern web stack and leverages in-browser machine learning for its core functionality.

### 1. Architecture & Core Technologies

The application is built with **Next.js**, a React framework, and is written in **TypeScript**. Styling is handled by **Tailwind CSS**.

The key machine learning components are loaded via CDN to keep the initial bundle size small and leverage browser caching:
*   **TensorFlow.js (`@tensorflow/tfjs`)**: The core library that enables running machine learning models in JavaScript.
*   **MediaPipe Hands (`@mediapipe/hands`)**: Provides the underlying high-fidelity hand and finger tracking solution.
*   **Hand Pose Detection Model (`@tensorflow-models/hand-pose-detection`)**: A pre-trained TensorFlow.js model that detects the keypoints of a hand. This project uses the `MediaPipeHands` detector type, which predicts **21 3D landmarks** on the hand.

### 2. Hand Pose Detection & Gesture Logic

The magic happens in two main stages: detecting the hand and interpreting its pose.

#### **Stage 1: Detecting Hand Landmarks**
The `WebcamFrame.tsx` component is responsible for setting up the camera and running the hand-pose-detection model on the video feed. On each frame, the model returns an array of 21 keypoints for each detected hand. Each keypoint contains `x`, `y`, and `z` coordinates.

```typescript
// Simplified model initialization in WebcamFrame.tsx
const model = await handPoseDetection.createDetector(
  handPoseDetection.SupportedModels.MediaPipeHands,
  {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'lite', // or 'full'
  }
);

// On every video frame:
const hands = await model.estimateHands(video);
if (hands.length > 0) {
    onGestureDetected(detectGesture(hands[0].keypoints));
}
```

#### **Stage 2: Interpreting Gestures (`gestureLogic.ts`)**
The `detectGesture` function, located in `app/utils/gestureLogic.ts`, takes the array of 21 keypoints and analyzes their geometric relationships to identify a specific pose.

It works by comparing the relative positions of finger joints:
- **Finger Joints**: The code defines constants for the indices of the fingertips (`TIPS`), proximal interphalangeal joints (`PIPS`), and metacarpophalangeal joints (`MCPs`).
- **Curl/Extension Detection**: A finger is considered "curled" if its tip's Y-coordinate is below its PIP joint's Y-coordinate. It's "extended" if the tip is significantly above the PIP joint.
- **Gesture Rules**: Specific gestures are defined by a set of rules. For example, a **Thumbs Up** is recognized when:
    1. The four fingers (index, middle, ring, pinky) are all curled.
    2. The thumb tip is vertically above the index finger's knuckle (MCP joint).

```typescript
// Simplified logic for "Thumbs Up" from gestureLogic.ts

const isIndexCurled = keypoints[TIPS[1]].y > keypoints[PIPS[1]].y;
const isMiddleCurled = keypoints[TIPS[2]].y > keypoints[PIPS[2]].y;
// ... and so on for ring and pinky fingers

if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
    // If thumb tip is above the index knuckle
    if (keypoints[TIPS[0]].y < keypoints[MCPs[1]].y) {
        return 'thumbs_up';
    }
}
```
This same principle is applied to detect the other gestures, with additional checks like hand inversion for robustness (e.g., distinguishing a thumbs down from a thumbs up when the hand is upside down).

## Technologies Used

*   **Framework**: [Next.js](https://nextjs.org/) 16 / [React](https://react.dev/) 19
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Machine Learning**:
    *   [TensorFlow.js](https://www.tensorflow.org/js)
    *   [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
    *   [TF.js Hand Pose Detection Model](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Lucide React](https://lucide.dev/) (for icons)
*   **Utilities**: [clsx](https://github.com/lukeed/clsx) & [tailwind-merge](https://github.com/dcastil/tailwind-merge)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/hand-gesture-control.git
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

## How to Use

1.  Grant the web page permission to access your webcam.
2.  Position your hand within the webcam view.
3.  A skeletal overlay will appear on your hand, confirming that it is being tracked.
4.  Make one of the supported gestures to interact with the page:
    *   **Thumbs Up/Down**: To scroll the content.
    *   **Victory Sign**: To show or hide the main content block.
    *   **Middle Finger**: Hold for 3 seconds to turn off the camera feed. You can click "Resume Camera" to restart.
5.  A small toast notification will appear at the bottom of the screen to indicate which gesture is currently detected.
