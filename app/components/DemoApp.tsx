'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import WebcamFrame, { type InferenceStats } from './WebcamFrame';
import SiteHeader from './chrome/SiteHeader';
import CameraDock from './stage/CameraDock';
import CommandMini from './gestures/CommandMini';
import FeedbackToast from './FeedbackToast';
import ContentBlock from './ContentBlock';
import HomePanel from './panels/HomePanel';
import ControlsPanel from './panels/ControlsPanel';
import InsightsPanel from './panels/InsightsPanel';
import { createSwipeTracker, pushSwipePosition } from '../lib/gestures/swipe';
import { useGestureMachine, type RawReading } from '../hooks/useGestureMachine';
import type { LogEntry } from './gestures/EventLog';
import { useSettings } from '../hooks/useSettings';
import { SENSITIVITY_PRESETS, GESTURE_CONFIG } from '../lib/gestures/config';
import { createPushPull, pushPullDelta, resetPushPull } from '../lib/gestures/distance';
import type { HandAnalysis } from '../lib/gestures/classifiers';
import type { GestureType } from '../utils/gestureLogic';

export type Theme = 'dark' | 'light';

const SITE_TABS = ['Home', 'Settings', 'Insights'] as const;
const THEME_KEY = 'hgc-theme';

const now12 = () =>
  new Date().toLocaleTimeString('en-GB', { hour12: false }) +
  '.' +
  String(new Date().getMilliseconds()).padStart(3, '0');

/**
 * Demo island: machine-ingested readings drive scroll / theme / hello /
 * site tabs / dock zoom. No gesture performs a destructive action — the
 * camera stops only via explicit UI (dock button, keyboard, or resume
 * overlay). Keyboard map + synthetic simulation make every action reachable
 * without a camera.
 */
export default function DemoApp() {
  const machine = useGestureMachine();
  const { push, reset, stableRef } = machine;
  const snap = machine.snapshot;

  // Theme: dark default (matches the pre-paint script); victory/header flips it.
  // Stored preference wins on first client render (header icon suppressed).
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked → session-only */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);

  const { settings, update: updateSettings } = useSettings();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [sliderValue, setSliderValue] = useState(50);
  const [siteTab, setSiteTab] = useState(0);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [stats, setStats] = useState<InferenceStats | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([]);

  const swipeRef = useRef(createSwipeTracker());
  const pushPullRef = useRef(createPushPull());

  const tabPanelClass = (i: number) =>
    clsx(
      'transition-all duration-300 ease-out',
      siteTab === i
        ? 'relative opacity-100 translate-x-0'
        : `absolute inset-x-0 top-0 opacity-0 pointer-events-none ${
            slideDir > 0 ? 'translate-x-8' : '-translate-x-8'
          }`
    );

  const appendLog = useCallback((text: string) => {
    setLog((prev) => [...prev.slice(-49), { time: now12(), text }]);
  }, []);

  const toggleTheme = useCallback(
    (via: string) => {
      // DOM-read (not state-read): keeps this callback identity stable so the
      // camera effect never refires on theme flips. State mirrors for the icon.
      const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      appendLog(`theme → ${next} (${via})`);
      applyTheme(next);
    },
    [appendLog, applyTheme]
  );

  // Apply sensitivity preset to the live machine (ref-staged, push-applied).
  const { setSensitivity } = machine;
  useEffect(() => {
    setSensitivity(SENSITIVITY_PRESETS[settings.sensitivity]);
  }, [settings.sensitivity, setSensitivity]);

  // Enumerate cameras (labels appear once permission is granted).
  const enumerateCameras = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(
        devices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label }))
      );
    } catch {
      /* media devices unavailable */
    }
  }, []);

  useEffect(() => {
    // Async device enumeration (fetch-then-set): the canonical effect use
    // case — the setState-in-effect rule targets synchronous cascades.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    enumerateCameras();
  }, [enumerateCameras]);
  useEffect(() => {
    // Re-enumerate after permission grants reveal device labels.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCameraActive) enumerateCameras();
  }, [isCameraActive, enumerateCameras]);

  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  const changeTab = useCallback(
    (i: number, via: string) => {
      const next = (i + SITE_TABS.length) % SITE_TABS.length;
      if (next === tabIndexRef.current) return;
      // Slide toward the navigation direction (wrap-around keeps its feel).
      const wrappedForward = tabIndexRef.current === SITE_TABS.length - 1 && next === 0;
      const wrappedBackward = tabIndexRef.current === 0 && next === SITE_TABS.length - 1;
      setSlideDir(wrappedForward || (!wrappedBackward && next > tabIndexRef.current) ? 1 : -1);
      appendLog(`tab → ${SITE_TABS[next]} (${via})`);
      tabIndexRef.current = next;
      setSiteTab(next);
    },
    [appendLog, setSlideDir]
  );

  /** Single ingestion path for live readings AND synthetic simulation. */
  const ingest = useCallback(
    (reading: RawReading, analysisIn: HandAnalysis | null, now: number) => {
      const events = push(reading, now);
      const stable = stableRef.current;

      if (analysisIn) setAnalysis(analysisIn);
      else if (reading.gesture === 'none') setAnalysis(null);

      // Push/pull: relative palm-size tracking drives the slider (and the
      // dock zoom bound to it) while a palm is stable. Calibration-free.
      if (stable === 'open_palm' && reading.palmPx) {
        const dv = pushPullDelta(
          pushPullRef.current,
          reading.palmPx,
          GESTURE_CONFIG.distance.emaAlpha,
          GESTURE_CONFIG.distance.gain,
          GESTURE_CONFIG.distance.deadband
        );
        if (dv !== 0) {
          setSliderValue((v) => {
            const next = Math.min(100, Math.max(0, v + dv));
            return Math.abs(next - v) < 0.05 ? v : next;
          });
        }
      } else {
        resetPushPull(pushPullRef.current);
      }

      // Palm-centroid swipe → site tab navigation.
      if (reading.centroid && reading.palmPx) {
        const dir = pushSwipePosition(
          swipeRef.current,
          stable,
          reading.centroid,
          reading.palmPx,
          settings.mirror,
          now
        );
        if (dir) {
          changeTab(tabIndexRef.current + (dir === 'right' ? 1 : -1), `swipe ${dir}`);
        }
      }

      if (events.entered === 'victory') {
        toggleTheme('victory');
      } else if (events.entered === 'open_palm') {
        appendLog('hello (palm)');
      }
    },
    [push, stableRef, settings.mirror, changeTab, appendLog, toggleTheme]
  );

  const tabIndexRef = useRef(siteTab);

  const handleGesture = useCallback(
    (reading: RawReading, analysisIn: HandAnalysis | null) =>
      ingest(reading, analysisIn, Date.now()),
    [ingest]
  );

  const handleStats = useCallback((s: InferenceStats) => {
    setStats(s);
  }, []);

  /** Synthetic drive: 6 gesture frames + 5 settling nones through the real path.
   *  No UI exposes this anymore; e2e reaches it via `window.__hgcSimulate`. */
  const simulate = useCallback(
    (gesture: GestureType) => {
      const t0 = Date.now();
      for (let i = 0; i < 6; i++) {
        ingest({ gesture, confidence: 0.9 }, null, t0 + i * 50);
      }
      for (let i = 0; i < 5; i++) {
        ingest({ gesture: 'none', confidence: 0 }, null, t0 + 300 + i * 50);
      }
      appendLog(`simulated ${gesture.replace(/_/g, ' ')}`);
    },
    [ingest, appendLog]
  );

  useEffect(() => {
    const w = window as unknown as { __hgcSimulate?: (g: GestureType) => void };
    w.__hgcSimulate = simulate;
    return () => {
      delete w.__hgcSimulate;
    };
  }, [simulate]);

  // Velocity scroll: fast attack, slow release — glides through brief vote
  // gaps instead of juddering. Frame-rate independent ('instant' defeats the
  // page's smooth-scroll CSS, which would fight every frame).
  useEffect(() => {
    let raf = 0;
    let vel = 0;
    let last = performance.now();
    const { maxSpeedPxS, attackPerS, releasePerS } = GESTURE_CONFIG.scroll;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const stable = stableRef.current;
      const target =
        stable === 'thumbs_up' ? -maxSpeedPxS : stable === 'thumbs_down' ? maxSpeedPxS : 0;
      const ease = target !== 0 ? attackPerS : releasePerS;
      vel += (target - vel) * Math.min(1, dt * ease);
      if (Math.abs(vel) > 1) window.scrollBy({ top: vel * dt, behavior: 'instant' });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stableRef]);

  // Keyboard map: every action reachable without a camera.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          window.scrollBy({ top: -400, behavior: 'smooth' });
          break;
        case 'ArrowDown':
          e.preventDefault();
          window.scrollBy({ top: 400, behavior: 'smooth' });
          break;
        case 'ArrowRight':
          changeTab(tabIndexRef.current + 1, 'keyboard');
          break;
        case 'ArrowLeft':
          changeTab(tabIndexRef.current - 1, 'keyboard');
          break;
        case 'v':
        case 'V':
          toggleTheme('keyboard');
          break;
        case 'p':
        case 'P':
          setIsCameraActive((prev) => {
            appendLog(prev ? 'camera stopped (keyboard)' : 'camera resumed (keyboard)');
            return !prev;
          });
          break;
        case '1':
        case '2':
        case '3':
          changeTab(Number(e.key) - 1, 'keyboard');
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeTab, appendLog, toggleTheme]);

  const handleResume = () => {
    reset();
    setIsCameraActive(true);
    appendLog('camera resumed');
  };

  const handleStopCamera = () => {
    setIsCameraActive(false);
    appendLog('camera stopped (dock button)');
  };

  const handleDockVisibility = useCallback(
    (visible: boolean) => {
      if (!visible) {
        // Collapsing unmounts the stage: clear machine state so no stale
        // gesture lingers in the toast/panel while detection is paused.
        reset();
      }
    },
    [reset]
  );

  // Push/pull resizes the dock FRAME (200–520 px); the feed inside fills it.
  const dockWidth = 200 + (sliderValue / 100) * 320;

  return (
    <>
      <SiteHeader
        tabs={SITE_TABS}
        activeTab={siteTab}
        onTabChange={(i) => changeTab(i, 'header')}
        theme={theme}
        onToggleTheme={() => toggleTheme('header')}
      />
      <CameraDock
        active={isCameraActive}
        onVisibilityChange={handleDockVisibility}
        onStop={handleStopCamera}
        frameWidth={dockWidth}
        sidePanel={<CommandMini activeGesture={snap.stable} />}
      >
        <WebcamFrame
          isCameraActive={isCameraActive}
          onGestureDetected={handleGesture}
          onResumeCamera={handleResume}
          deviceId={settings.cameraId}
          mirror={settings.mirror}
          modelType={settings.model}
          onStats={handleStats}
          onBadDeviceId={() => {
            updateSettings({ cameraId: null });
            appendLog('saved camera rejected — fell back to default');
          }}
        />
      </CameraDock>

      <div className="relative">
        <div
          role="tabpanel"
          aria-label="Home"
          aria-hidden={siteTab !== 0}
          inert={siteTab !== 0}
          className={tabPanelClass(0)}
        >
          <HomePanel />
        </div>
        <div
          role="tabpanel"
          aria-label="Settings"
          aria-hidden={siteTab !== 1}
          inert={siteTab !== 1}
          className={tabPanelClass(1)}
        >
          <ControlsPanel
            settings={settings}
            cameras={cameras}
            onSettingsChange={updateSettings}
            sliderValue={sliderValue}
            onSliderChange={setSliderValue}
          />
        </div>
        <div
          role="tabpanel"
          aria-label="Insights"
          aria-hidden={siteTab !== 2}
          inert={siteTab !== 2}
          className={tabPanelClass(2)}
        >
          <InsightsPanel
            stats={stats}
            snapshot={snap}
            analysis={analysis}
            log={log}
            onClearLog={() => setLog([])}
          />
        </div>
      </div>

      <div className="mt-12 pb-16 md:pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
          Scroll
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Scrollable Content Area
        </h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ContentBlock
            title="TensorFlow.js"
            desc="The project leverages TensorFlow.js, an open-source library for machine learning in JavaScript, to run the hand pose detection model directly in the browser."
          />
          <ContentBlock
            title="Hand Pose Detection"
            desc="Utilizes a pre-trained machine learning model (MediaPipe Hands) specialized in detecting 21 key points of a hand from a video feed in real-time."
          />
          <ContentBlock
            title="Real-time Gesture Recognition"
            desc="The application analyzes the geometry of the detected hand landmarks to recognize specific gestures like 'Thumbs Up' or 'Victory' with high accuracy."
          />
          <ContentBlock
            title="No Destructive Gestures"
            desc="Gestures scroll, flip the theme, greet, and navigate — never delete, stop, or destroy. The camera stops only via explicit UI."
          />
          <ContentBlock
            title="Robustness"
            desc="Normalized angle math plus a 5-frame majority vote: single-frame flicker never reaches an action, and resting hands fire nothing."
          />
          <ContentBlock
            title="User Feedback"
            desc="Dock zoom, theme flips, tab navigation, skeleton overlay, and the Gesture Lab show every consequence immediately."
          />
        </div>
      </div>
      <FeedbackToast gesture={snap.stable} />
    </>
  );
}
