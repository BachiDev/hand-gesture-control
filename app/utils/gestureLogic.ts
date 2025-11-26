// utils/gestureLogic.ts

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  name?: string;
}

export type GestureType = 'thumbs_up' | 'thumbs_down' | 'middle_finger' | 'victory' | 'none';

export const detectGesture = (keypoints: Keypoint[]): GestureType => {
  if (!keypoints || keypoints.length < 21) return 'none';

  const TIPS = [4, 8, 12, 16, 20]; 
  const PIPS = [3, 6, 10, 14, 18]; 
  const MCPs = [2, 5, 9, 13, 17]; 

  // --- Helpers ---

  // 1. Is the hand upside down? (Wrist is above the knuckles)
  // This is crucial for "Thumbs Down" detection.
  const isHandInverted = keypoints[0].y < keypoints[MCPs[2]].y;

  // 2. Strict Extension (For Victory/Middle Finger)
  // We keep the buffer here to prevent accidental triggers
  const isExtended = (tipIdx: number, pipIdx: number) => {
    if (isHandInverted) return keypoints[tipIdx].y > keypoints[pipIdx].y + 10;
    return keypoints[tipIdx].y < keypoints[pipIdx].y - 10;
  };

  // 3. Loose Curling (For Fists/Thumbs Up/Down)
  // We REMOVED the buffer to make it easy to detect a fist, like in your original file.
  const isCurled = (tipIdx: number, pipIdx: number) => {
    if (isHandInverted) return keypoints[tipIdx].y < keypoints[pipIdx].y;
    return keypoints[tipIdx].y > keypoints[pipIdx].y;
  };

  const thumbTip = keypoints[TIPS[0]];
  const indexMCP = keypoints[MCPs[1]];
  const pinkyMCP = keypoints[MCPs[4]];

  // Check state of the 4 fingers
  const isIndexCurled = isCurled(TIPS[1], PIPS[1]);
  const isMiddleCurled = isCurled(TIPS[2], PIPS[2]);
  const isRingCurled = isCurled(TIPS[3], PIPS[3]);
  const isPinkyCurled = isCurled(TIPS[4], PIPS[4]);
  
  const isIndexExtended = isExtended(TIPS[1], PIPS[1]);
  const isMiddleExtended = isExtended(TIPS[2], PIPS[2]);

  // --- THUMBS UP / DOWN ---
  // Criteria: 4 fingers are curled (making a fist)
  if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) {
    
    // Thumbs Up Logic
    // Thumb tip is ABOVE the index knuckle (lower Y value)
    // Relaxed threshold: changed from -30 to -10
    if (!isHandInverted && thumbTip.y < indexMCP.y - 10) {
      return 'thumbs_up';
    }

    // Thumbs Down Logic
    // Standard: Thumb tip is BELOW the pinky knuckle (higher Y value)
    if (!isHandInverted && thumbTip.y > pinkyMCP.y + 10) {
      return 'thumbs_down';
    }
    // Inverted: Hand is upside down, thumb tip is ABOVE the pinky knuckle
    if (isHandInverted && thumbTip.y < pinkyMCP.y - 10) {
      return 'thumbs_down';
    }
  }

  // --- MIDDLE FINGER (STOP) ---
  // Criteria: Middle extended. Index, Ring, Pinky curled. 
  if (isMiddleExtended && isIndexCurled && isRingCurled && isPinkyCurled) {
    return 'middle_finger';
  }

  // --- VICTORY (TOGGLE) ---
  // Criteria: Index & Middle extended. Ring & Pinky curled.
  if (isIndexExtended && isMiddleExtended && isRingCurled && isPinkyCurled) {
    // Check distance between tips to ensure it's a "V" and not just two fingers together
    const distance = Math.abs(keypoints[TIPS[1]].x - keypoints[TIPS[2]].x);
    if (distance > 20) {
      return 'victory';
    }
  }

  return 'none';
};

// ... drawHand remains unchanged ...
export const drawHand = (ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20]
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