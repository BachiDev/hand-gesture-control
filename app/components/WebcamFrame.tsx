'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader2, VideoOff } from 'lucide-react';
import { drawHand, type Keypoint } from '../utils/gestureLogic';
import { classifyHand, type HandAnalysis } from '../lib/gestures/classifiers';
import { smoothLandmarks } from '../lib/gestures/landmarkSmoothing';
import { GESTURE_CONFIG } from '../lib/gestures/config';
import { loadHandDetector, HandDetector, type HandModelType } from '../lib/ml-loader';
import type { RawReading } from '../lib/gestures/smoothing';

export interface InferenceStats {
  fps: number;
  ms: number;
  /** Consecutive inference failures (resets on success). Persistent >0 = real problem. */
  errors: number;
  /** Cumulative glitch frames with non-finite landmarks. */
  badLandmarks: number;
}

interface WebcamFrameProps {
  onGestureDetected: (reading: RawReading, analysis: HandAnalysis | null) => void;
  isCameraActive: boolean;
  onResumeCamera: () => void;
  deviceId: string | null;
  mirror: boolean;
  modelType: HandModelType;
  onStats?: (stats: InferenceStats) => void;
  /** Called when the saved deviceId is rejected — parent should clear it to fall back. */
  onBadDeviceId?: () => void;
}

const MIN_INFERENCE_INTERVAL_MS = 1000 / GESTURE_CONFIG.maxInferenceFps;

/** What does the browser see? total vs *labeled* inputs distinguishes "nothing
 *  there" (0) from "permission not effective for this origin" (present, unlabeled). */
async function videoInputs(): Promise<{ total: number; labeled: number }> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const video = devices.filter((d) => d.kind === 'videoinput');
    return { total: video.length, labeled: video.filter((d) => !!d.label).length };
  } catch {
    return { total: -1, labeled: -1 };
  }
}

/** Brave exposes itself for exactly this kind of per-site Shields diagnosis. */
async function isBrave(): Promise<boolean> {
  try {
    const b = (navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave;
    return (await b?.isBrave?.()) === true;
  } catch {
    return false;
  }
}

async function notFoundMessage(): Promise<string> {
  const { total, labeled } = await videoInputs();
  if (total === 0) {
    if (await isBrave()) {
      return 'No camera found — the browser reports 0 video inputs. Brave is still blocking enumeration for this origin: set Shields fully DOWN for this exact URL (port included), reload, then try again.';
    }
    return 'No camera found — the browser sees 0 video inputs. Check the OS camera switch (Windows privacy settings, laptop Fn/shutter key, or per-site fingerprinting protection like Brave Shields), then try again.';
  }
  if (total > 0 && labeled === 0) {
    return 'Camera permission isn’t applying to this exact page (permissions are per-origin — a changed port/URL resets them). Click the lock icon → reset the camera permission → reload, grant it fresh, then try again.';
  }
  if (total > 0) {
    return `No camera could be opened, but the browser sees ${total} video input(s) — likely blocked at OS level or held by another process. Close other video apps, then try again.`;
  }
  return cameraErrorMessage('NotFoundError');
}

/** Human-readable, actionable camera errors — a busy device is not a permission denial. */
function cameraErrorMessage(name: string): string {
  switch (name) {
    case 'InsecureContext':
      return 'Camera needs a secure context — open this page via localhost or HTTPS. Plain http over LAN disables the browser camera API entirely.';
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission denied. Allow access via the icon in the address bar, then try again.';
    case 'NotReadableError':
      return 'Camera is already in use — another app or tab grabbed it. Close other video apps/tabs, then try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera found on this device.';
    case 'AbortError':
      return 'Camera start was interrupted. Try again.';
    default:
      return 'Could not start the camera. Check the device, then try again.';
  }
}

/** Fading palm-centroid trail: newest dot brightest. Decorative only. */
function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: { x: number; y: number }[],
  centroid: { x: number; y: number }
) {
  trail.push({ x: centroid.x, y: centroid.y });
  if (trail.length > 14) trail.shift();
  trail.forEach((p, i) => {
    const a = (i + 1) / trail.length;
    ctx.globalAlpha = a * 0.5;
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 + a * 4, 0, 2 * Math.PI);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

export default function WebcamFrame({
  onGestureDetected,
  isCameraActive,
  onResumeCamera,
  deviceId,
  mirror,
  modelType,
  onStats,
  onBadDeviceId,
}: WebcamFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectorRef = useRef<HandDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Pipeline guards (PLAN.md §5.2): never stack inferences, cap inference
  // rate, and skip work when the tab is hidden or the stage is offscreen.
  const inFlightRef = useRef(false);
  const lastInferenceAtRef = useRef(0);
  const visibleRef = useRef(true);
  // Single-flight acquisition: effect refires (StrictMode, deviceId change)
  // must never stack concurrent getUserMedia calls on one driver.
  const startingRef = useRef(false);
  const cancelledRef = useRef(false);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  // Palm-centroid motion trail (screen-recording wow, feeds nothing but the canvas).
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  // Previous frame's landmarks for EMA smoothing (reset on tracking loss).
  const prevLandmarksRef = useRef<Keypoint[] | null>(null);
  // Inference cost accumulators for the HUD (reported ~2×/s).
  const statsRef = useRef({ count: 0, totalMs: 0, lastReport: 0 });
  // Consecutive inference failures — surfaced in the HUD instead of swallowed.
  const inferErrorsRef = useRef(0);
  // Cumulative glitch frames (non-finite landmarks) — a stuck counter here
  // means the model feed itself is corrupt, not the classifier.
  const badLandmarksRef = useRef(0);
  // Consecutive invalid-landmark frames — trips the tracker circuit breaker.
  const consecutiveInvalidRef = useRef(0);
  /** After N corrupt frames the tracker's ROI is self-sustaining garbage:
   *  reset it to force a fresh palm detection (mirrors the model's own
   *  reset-on-empty behavior). */
  const INVALID_TRIP_COUNT = 30;
  const onStatsRef = useRef(onStats);
  const onBadDeviceIdRef = useRef(onBadDeviceId);
  useEffect(() => {
    onStatsRef.current = onStats;
    onBadDeviceIdRef.current = onBadDeviceId;
  });

  // Initialize AI via the bundled TF.js loader (dynamic import, cached per
  // model size, WebGL w/ CPU fallback). Switching modelType disposes the old
  // detector and reloads — the detection effect below pauses meanwhile.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    // NOTE: the previous detector is intentionally NOT disposed — instances
    // are shared via the loader cache (StrictMode/remounts). Model switches
    // are rare manual actions; textures release on page unload.
    detectorRef.current = null;
    prevLandmarksRef.current = null;

    loadHandDetector(modelType)
      .then((detector) => {
        if (cancelled) {
          detector.dispose?.();
          return;
        }
        detectorRef.current = detector;
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError('Failed to load AI model. Check your connection and retry.');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modelType]);

  // Track onscreen visibility: inference pauses offscreen (camera keeps running).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Detection Loop
  useEffect(() => {
    cancelledRef.current = false;
    retriesRef.current = 0;

    if (!isCameraActive || isLoading || !detectorRef.current) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      if (startingRef.current) return; // no stacked acquisitions on one driver
      startingRef.current = true;
      try {
        // LAN-http / non-secure contexts expose no camera API at all — fail
        // legibly instead of TypeErroring on undefined.
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('insecure context'), { name: 'InsecureContext' });
        }
        // Least-surprise ladder: saved exact id → default ideal → bare.
        // Each step sheds constraints; a stale saved id is cleared the moment
        // it fails so later attempts (and reloads) are never poisoned by it.
        const defaults: MediaStreamConstraints = {
          video: { width: 640, height: 480, facingMode: 'user' },
        };
        const attempts: MediaStreamConstraints[] = deviceId
          ? [
              { video: { width: 640, height: 480, deviceId: { exact: deviceId } } },
              defaults,
              { video: true },
            ]
          : [defaults, { video: true }];

        let stream: MediaStream | null = null;
        for (const constraints of attempts) {
          if (cancelledRef.current) return;
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break;
          } catch (err) {
            // DOMException carries the WebRTC name; plain Errors (e.g. our
            // insecure-context throw) carry it on .name just the same.
            const name = err instanceof Error ? err.name : '';
            const retryable =
              name === 'NotFoundError' ||
              name === 'DevicesNotFoundError' ||
              name === 'OverconstrainedError';
            if (!retryable || cancelledRef.current) throw err;
            // …otherwise fall through to the next, less-constrained attempt.
          }
        }
        if (!stream || cancelledRef.current) {
          // Unmounted mid-acquire: release immediately, never attach.
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            const v = videoRef.current;
            if (v) {
              // Critical: the tfjs runtime sizes its crop math off the
              // element's width/height ATTRIBUTES (default 300×150), not CSS.
              // Stamping the true frame size keeps model space == pixel space.
              v.width = v.videoWidth;
              v.height = v.videoHeight;
              v.play().catch(() => {
                /* interrupted by a re-acquire; the new loop takes over */
              });
            }
            detectLoop();
          };
        }
      } catch (err) {
        if (cancelledRef.current) return;
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotReadableError' && retriesRef.current < 1) {
          // Transient driver hiccup (common on Windows): one delayed retry,
          // logged only if it fails again (keeps the dev overlay quiet).
          retriesRef.current += 1;
          retryTimerRef.current = setTimeout(() => {
            if (!cancelledRef.current) {
              startCamera();
            }
          }, 800);
          return;
        }
        console.error(err);
        // A rejected exact id poisons every reload — drop it so the next
        // attempt (this refire included) falls back to the default camera.
        if (
          deviceId &&
          (name === 'NotFoundError' ||
            name === 'DevicesNotFoundError' ||
            name === 'OverconstrainedError')
        ) {
          onBadDeviceIdRef.current?.();
        }
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setError(await notFoundMessage());
        } else {
          setError(cameraErrorMessage(name));
        }
      } finally {
        startingRef.current = false;
      }
    };

    const detectLoop = async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !detectorRef.current ||
        videoRef.current.readyState !== 4
      ) {
        requestRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // DPR-aware backing store (crisp skeleton on retina, CSS size unchanged).
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targetW = Math.round(video.videoWidth * dpr);
      const targetH = Math.round(video.videoHeight * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const now = performance.now();
      const throttled = now - lastInferenceAtRef.current < MIN_INFERENCE_INTERVAL_MS;
      if (!inFlightRef.current && !throttled && !document.hidden && visibleRef.current) {
        inFlightRef.current = true;
        lastInferenceAtRef.current = now;
        const inferStart = performance.now();
        try {
          const hands = await detectorRef.current.estimateHands(video, { flipHorizontal: false });
          const inferMs = performance.now() - inferStart;
          inferErrorsRef.current = 0; // a settled inference clears the streak
          const stats = statsRef.current;
          stats.count += 1;
          stats.totalMs += inferMs;
          if (now - stats.lastReport >= 500) {
            const elapsed = now - stats.lastReport || 1;
            onStatsRef.current?.({
              fps: (stats.count * 1000) / elapsed,
              ms: stats.count > 0 ? stats.totalMs / stats.count : 0,
              errors: inferErrorsRef.current,
              badLandmarks: badLandmarksRef.current,
            });
            stats.count = 0;
            stats.totalMs = 0;
            stats.lastReport = now;
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (hands.length > 0) {
              // EMA-smoothing first: steadies skeleton, angles, and margins
              // against per-frame model jitter (see landmarkSmoothing.ts).
              const smoothed = smoothLandmarks(prevLandmarksRef.current, hands[0].keypoints);
              prevLandmarksRef.current = smoothed;
              const analysis = classifyHand(smoothed);
              if (analysis.invalid) {
                badLandmarksRef.current += 1;
                consecutiveInvalidRef.current += 1;
                if (badLandmarksRef.current === 1) {
                  console.warn(
                    '[gesture] non-finite landmarks (sample):',
                    JSON.stringify(hands[0].keypoints.slice(0, 5))
                  );
                }
                if (consecutiveInvalidRef.current >= INVALID_TRIP_COUNT) {
                  // Tracker ROI is corrupt — force fresh palm detection.
                  console.warn(
                    `[gesture] tracker reset after ${INVALID_TRIP_COUNT} corrupt frames`
                  );
                  try {
                    detectorRef.current?.reset?.();
                  } catch {
                    /* reset is best-effort */
                  }
                  consecutiveInvalidRef.current = 0;
                  trailRef.current = [];
                }
                onGestureDetected({ gesture: 'none', confidence: 0 }, analysis);
              } else {
                consecutiveInvalidRef.current = 0;
                drawHand(ctx, smoothed);
                drawTrail(ctx, trailRef.current, analysis.centroid);
                onGestureDetected(
                  {
                    gesture: analysis.gesture,
                    confidence: analysis.confidence,
                    centroid: analysis.centroid,
                    palmPx: analysis.palmPx,
                  },
                  analysis
                );
              }
            } else {
              consecutiveInvalidRef.current = 0;
              prevLandmarksRef.current = null; // avoid ghost blending on re-entry
              trailRef.current = [];
              onGestureDetected({ gesture: 'none', confidence: 0 }, null);
            }
          }
        } catch (err) {
          // Surface, don't swallow: count consecutive failures for the HUD,
          // log the first per mount so DevTools shows the cause.
          inferErrorsRef.current += 1;
          if (inferErrorsRef.current === 1) console.warn('[gesture] inference failed:', err);
        } finally {
          inFlightRef.current = false;
        }
      }

      requestRef.current = requestAnimationFrame(detectLoop);
    };

    startCamera();
    return () => {
      cancelledRef.current = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // retryKey: the error overlay's "Try again" re-runs acquisition.
  }, [isCameraActive, isLoading, onGestureDetected, deviceId, retryKey]);

  // Proven mirror: Tailwind class on both layers (an earlier inline-transform
  // approach broke rendering on some drivers — classes stay).
  const flipClass = mirror ? '-scale-x-100' : '';

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[640px] aspect-[4/3] mx-auto bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
    >
      <video
        ref={videoRef}
        aria-label="Webcam feed for hand tracking"
        // Mirror comes from persisted settings, which legitimately differ from
        // the SSR default — never a real mismatch.
        suppressHydrationWarning
        className={`absolute inset-0 w-full h-full object-cover ${flipClass} ${!isCameraActive ? 'hidden' : ''}`}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Hand skeleton overlay showing detected landmarks"
        suppressHydrationWarning
        className={`absolute inset-0 w-full h-full object-cover ${flipClass} ${!isCameraActive ? 'hidden' : ''}`}
      />

      {/* --- LOADING / ERROR / STOPPED OVERLAYS --- */}
      {isLoading && isCameraActive && (
        <div className="absolute inset-0 z-10 bg-zinc-950/90 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-zinc-400 text-sm">Initializing AI…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 bg-zinc-950/90 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <VideoOff className="w-10 h-10 text-red-500" />
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setRetryKey((k) => k + 1);
            }}
            className="px-6 py-2 bg-white hover:bg-zinc-300 text-black rounded-full font-medium transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {!isCameraActive && !isLoading && (
        <div className="absolute inset-0 z-10 bg-zinc-950/90 flex flex-col items-center justify-center gap-4">
          <VideoOff className="w-12 h-12 text-red-500" />
          <h3 className="text-xl font-medium text-white">Camera Stopped</h3>
          <button
            onClick={onResumeCamera}
            className="px-6 py-2 bg-white hover:bg-zinc-300 text-black rounded-full font-medium transition-colors cursor-pointer"
          >
            Resume Camera
          </button>
        </div>
      )}
    </div>
  );
}
