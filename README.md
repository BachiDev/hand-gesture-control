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

##  Machine Learning

The application is built with **Next.js**, a React framework, and is written in **TypeScript**. Styling is handled by **Tailwind CSS**.

The key machine learning components are loaded via CDN to keep the initial bundle size small and leverage browser caching:
*   **TensorFlow.js (`@tensorflow/tfjs`)**: The core library that enables running machine learning models in JavaScript.
*   **MediaPipe Hands (`@mediapipe/hands`)**: Provides the underlying high-fidelity hand and finger tracking solution.
*   **Hand Pose Detection Model (`@tensorflow-models/hand-pose-detection`)**: A pre-trained TensorFlow.js model that detects the keypoints of a hand. This project uses the `MediaPipeHands` detector type, which predicts **21 3D landmarks** on the hand.

## Technologies Used

*   **Framework**: [Next.js](https://nextjs.org/) 16 / [React](https://react.dev/) 19
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Machine Learning**:
    *   [TensorFlow.js](https://www.tensorflow.org/js)
    *   [MediaPipe Hands](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md)
    *   [TF.js Hand Pose Detection Model](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Lucide React](https://lucide.dev/) (for icons)

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
