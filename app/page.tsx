'use client';

import React, { useState, useRef, useCallback } from 'react';
import WebcamFrame from './components/WebcamFrame';
import InstructionPanel from './components/InstructionPanel';
import FeedbackToast from './components/FeedbackToast';
import { GestureType } from './utils/gestureLogic';

const ContentBlock = ({ title, desc }: { title: string, desc: string }) => (
  <div className="p-6 rounded-xl bg-neutral-800/70 border border-neutral-700 space-y-3">
    <h3 className="text-xl font-semibold text-purple-400">{title}</h3>
    <p className="text-sm text-neutral-400">{desc}</p>
  </div>
);

export default function Home() {
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showContent, setShowContent] = useState(true);
  const [stopCountdown, setStopCountdown] = useState(0); // 0 = inactive, 3, 2, 1

  const lastGestureRef = useRef<GestureType>('none');
  const lastToggleTimeRef = useRef<number>(0);
  
  // Timer Refs for the "Hold to Stop" logic
  const stopTimerStartRef = useRef<number | null>(null);
  const STOP_DELAY = 3000; // 3 seconds to hold

  const handleGesture = useCallback((gesture: GestureType) => {
    
    // --- 1. COUNTDOWN LOGIC (Hold Middle Finger) ---
    if (gesture === 'middle_finger') {
      if (!stopTimerStartRef.current) {
        // Start Timer
        stopTimerStartRef.current = Date.now();
      }
      
      const elapsed = Date.now() - stopTimerStartRef.current;
      const remaining = Math.ceil((STOP_DELAY - elapsed) / 1000);

      if (remaining <= 0) {
        // Time is up! Trigger Action
        setIsCameraActive(false);
        setStopCountdown(0);
        stopTimerStartRef.current = null;
      } else {
        // Update UI (Only if changed to prevent render spam)
        setStopCountdown(prev => prev !== remaining ? remaining : prev);
      }
    } else {
      // Gesture interrupted? Cancel Timer
      if (stopTimerStartRef.current) {
        stopTimerStartRef.current = null;
        setStopCountdown(0);
      }
    }

    // --- 2. SCROLLING (Immediate) ---
    if (gesture === 'thumbs_up') {
      window.scrollBy({ top: -15, behavior: 'auto' });
    } else if (gesture === 'thumbs_down') {
      window.scrollBy({ top: 15, behavior: 'auto' });
    }

    // --- 3. STATE UPDATES (On Change) ---
    if (gesture !== lastGestureRef.current) {
      setCurrentGesture(gesture);

      // Handle Toggle (Victory) with Debounce
      if (gesture === 'victory') {
        const now = Date.now();
        if (now - lastToggleTimeRef.current > 1000) {
          setShowContent(prev => !prev);
          lastToggleTimeRef.current = now;
        }
      }
      lastGestureRef.current = gesture;
    }
  }, []);

  const handleResume = () => {
    setIsCameraActive(true);
    lastGestureRef.current = 'none';
    setCurrentGesture('none');
    setStopCountdown(0);
    stopTimerStartRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      <header className="fixed top-0 w-full z-40 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold text-xl">GestureFlow</span>
          </div>
          <div className="hidden sm:flex gap-4 text-sm text-neutral-400">
             <span>👍 Scroll Up</span>
             <span>👎 Scroll Down</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <WebcamFrame 
              isCameraActive={isCameraActive}
              onGestureDetected={handleGesture} 
              onResumeCamera={handleResume}
              countdown={stopCountdown} // Pass the countdown to UI
            />
          </div>
          <div className="lg:col-span-1 h-full">
            <InstructionPanel />
          </div>
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showContent ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'}`}>
           <h2 className="text-3xl font-bold text-neutral-200 mb-6">Scrollable Content Area</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContentBlock title="Timer Logic" desc="Holding the middle finger now triggers a 3-second countdown before stopping." />
              <ContentBlock title="Robustness" desc="Stricter math ensures fingers are definitely curled or extended." />
              <ContentBlock title="User Feedback" desc="Visual overlays help the user know when an action is about to happen." />
              {[...Array(9)].map((_, i) => (
                  <ContentBlock key={i} title={`Block ${i+1}`} desc="Keep scrolling down to test the thumbs-down gesture." />
              ))}
           </div>
           <div className="p-12 text-center text-neutral-600">-- End of Content --</div>
        </div>
      </main>

      <FeedbackToast gesture={currentGesture} />
    </div>
  );
}