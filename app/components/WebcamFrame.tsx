'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader2, VideoOff } from 'lucide-react';
import { detectGesture, drawHand, GestureType, Keypoint } from '../utils/gestureLogic';

// --- Types ---
interface HandDetector {
  estimateHands: (
    video: HTMLVideoElement, 
    config?: { flipHorizontal: boolean }
  ) => Promise<{ keypoints: Keypoint[] }[]>;
}

declare global {
  interface Window {
    handPoseDetection: {
      createDetector: (model: any, config: any) => Promise<HandDetector>;
      SupportedModels: { MediaPipeHands: string };
    };
  }
}

interface WebcamFrameProps {
  onGestureDetected: (gesture: GestureType) => void;
  isCameraActive: boolean;
  onResumeCamera: () => void;
  countdown: number; // NEW: Receive countdown state
}

export default function WebcamFrame({ 
  onGestureDetected, 
  isCameraActive, 
  onResumeCamera,
  countdown // Destructure
}: WebcamFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const detectorRef = useRef<HandDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize AI (Standard as before)
  useEffect(() => {
    const initModel = async () => {
      try {
        const checkForLibraries = () => !!window.handPoseDetection;
        if (!checkForLibraries()) {
          const interval = setInterval(async () => {
            if (checkForLibraries()) {
              clearInterval(interval);
              await loadDetector();
            }
          }, 100);
          return;
        }
        await loadDetector();
      } catch (err) {
        console.error(err);
        setError('Failed to load AI Model');
        setIsLoading(false);
      }
    };

    const loadDetector = async () => {
      const modelConfig = {
        runtime: 'mediapipe', 
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        modelType: 'full'
      };
      const model = await window.handPoseDetection.createDetector(
        window.handPoseDetection.SupportedModels.MediaPipeHands,
        modelConfig
      );
      detectorRef.current = model;
      setIsLoading(false);
    };

    initModel();
  }, []);

  // Detection Loop
  useEffect(() => {
    if (!isCameraActive || isLoading || !detectorRef.current) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            detectLoop();
          };
        }
      } catch (err) {
        setError('Camera permission denied');
      }
    };

    const detectLoop = async () => {
      if (!videoRef.current || !canvasRef.current || !detectorRef.current || videoRef.current.readyState !== 4) {
        requestRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      try {
        const hands = await detectorRef.current.estimateHands(video, { flipHorizontal: false });
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (hands.length > 0) {
            drawHand(ctx, hands[0].keypoints);
            onGestureDetected(detectGesture(hands[0].keypoints));
          } else {
            onGestureDetected('none');
          }
        }
      } catch (e) { /* ignore */ }
      
      requestRef.current = requestAnimationFrame(detectLoop);
    };

    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraActive, isLoading, onGestureDetected]);

  return (
    <div className="relative w-full max-w-[640px] aspect-[4/3] mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${!isCameraActive ? 'hidden' : ''}`} playsInline muted />
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${!isCameraActive ? 'hidden' : ''}`} />

      {/* --- COUNTDOWN OVERLAY --- */}
      {countdown > 0 && isCameraActive && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center backdrop-blur-sm">
           <div className="flex flex-col items-center animate-pulse">
             <span className="text-8xl font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
               {countdown}
             </span>
             <span className="text-white font-medium mt-2">Hold to Stop...</span>
           </div>
        </div>
      )}

      {isLoading && isCameraActive && (
        <div className="absolute inset-0 z-10 bg-neutral-950/90 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-neutral-400 text-sm">Initializing AI...</p>
        </div>
      )}

      {error && (
         <div className="absolute inset-0 z-10 bg-neutral-950/90 flex flex-col items-center justify-center gap-4">
           <VideoOff className="w-10 h-10 text-red-500" />
           <p className="text-red-400 font-medium">{error}</p>
         </div>
      )}

      {!isCameraActive && !isLoading && (
        <div className="absolute inset-0 z-10 bg-neutral-950/90 flex flex-col items-center justify-center gap-4">
          <VideoOff className="w-12 h-12 text-red-500" />
          <h3 className="text-xl font-medium text-white">Camera Stopped</h3>
          <button onClick={onResumeCamera} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium transition-colors">
            Resume Camera
          </button>
        </div>
      )}
    </div>
  );
}