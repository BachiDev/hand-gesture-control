// utils/gestureLogic.ts
//
// Public gesture surface. Single-frame classification lives in
// `lib/gestures/classifiers.ts` (normalized angle math); temporal behavior
// (votes, debounce, holds) lives in `lib/gestures/smoothing.ts`.
// This module keeps the historic `detectGesture`/`drawHand` entry points so
// existing callers and tests keep working.

import { classifyHand } from '../lib/gestures/classifiers';

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
}

export type GestureType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'middle_finger' // unlisted easter egg (silent, action TBD), never advertised
  | 'victory'
  | 'open_palm'
  | 'none';

/** Raw single-frame classification (no smoothing — use the machine for actions). */
export const detectGesture = (keypoints: Keypoint[]): GestureType => {
  return classifyHand(keypoints).gesture;
};

// ... drawHand remains unchanged ...
export const drawHand = (ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) => {
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],
  ];

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  connections.forEach(([start, end]) => {
    const p1 = keypoints[start];
    const p2 = keypoints[end];
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  keypoints.forEach((p, i) => {
    ctx.fillStyle = i === 0 ? '#ef4444' : '#4ade80';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
    ctx.fill();
  });
};
