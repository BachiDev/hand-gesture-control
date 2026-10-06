# Hand Gesture Control — Overhaul Plan

> Goal: take the functional ML demo from "working prototype" to a polished, trustworthy portfolio piece that feels like part of bachi.dev, runs fast and robustly on real webcams, and proves senior-level engineering (tests, perf budget, a11y, SEO).
>
> Owner: Fabian Bachmayer — fabian@bachi.dev — bachi.dev
> Live demo: https://bachidev.github.io/hand-gesture-control (project page; main site links to it from `/work`)
> Stack today: Next.js 16.0.4 + React 19 + TypeScript + Tailwind CSS v4 + TF.js + MediaPipe Hands (CDN) + lucide-react. Deployed to GitHub Pages via `.github/workflows/nextjs.yml` (static export to `./out`, `master` branch).

Cohesion target: [BachiDev.github.io PLAN.md](../BachiDev.github.io/PLAN.md) — one brand everywhere (zinc-950 base, violet/fuchsia accent, sans body + mono kickers, shared `Section/Button/Card` language, server-first, no tracking, Lighthouse 95+).

---

## 1. Current-state audit

### What's already working — keep it

- Real-time pipeline works: webcam → MediaPipe Hands (21 landmarks) → heuristic classifier → page actions. Good demo bones.
- Client-side ML = privacy story ("nothing leaves your browser") — strong portfolio angle, keep and say it louder.
- Skeleton overlay + toast = immediate feedback loop. Keep the pattern, polish the execution.
- `gestureLogic.ts` separation (pure `detectGesture` + `drawHand`) is the right seam — testable, portable.
- `lucide-react` already installed; Next 16 + Tailwind v4 are current.

### Visual / cohesion issues (biggest lever)

1. **Not on-brand:** hard-coded `bg-[#0a0a0a]`, `neutral-800/900` cards, `Arial` body fallback (Geist is loaded but unused), white FAB circle, emoji-as-icons (`👍👎🖕✌️`). Main site is zinc-950 + violet/fuchsia + Inter/Geist Sans + mono kickers. This page looks like a different author.
2. **Thin chrome:** fixed header with logo + title only; no footer, no link back to bachi.dev / `/work`, no "Built by Fabian Bachmayer" signal. Dead end for conversion.
3. **Filler content:** 6 `ContentBlock`s describe the tech stack, not a demo playground. "Scrollable Content Area" doesn't sell the interaction.
4. **Toast is always-on noise:** shows "Waiting for gesture..." permanently; no `aria-live`, no motion discipline.

### Gesture logic issues (correctness)

5. **Only 4 gestures, one is a liability:** thumbs up/down, victory, middle-finger-hold-to-kill. Middle finger as a headline feature reads as a joke in a recruiter-facing portfolio — replace the default kill-switch with an open-palm hold (keep middle finger only as an easter egg or drop it).
6. **Brittle geometry:** all decisions are raw `y`-comparisons with magic pixel thresholds (`-10`, `+10`, `distance > 20`). Not normalized → breaks across resolutions, hand sizes, camera distances. No angle math, no handedness awareness, no rotation tolerance.
7. **No temporal smoothing:** single-frame classification drives actions directly. Jitter → flickering toast, accidental victory toggles (only a 1 s debounce), frame-rate-dependent scroll (`scrollBy 15px` per inference).
8. **Inference loop hazards:** `requestAnimationFrame(detectLoop)` + `await estimateHands` with no in-flight guard → overlapping inferences pile up on slow devices. No frame skipping, no FPS cap, no pause when tab hidden / video offscreen.
9. **Camera handling is minimal:** fixed 640×480, no device selection, no mirror toggle, no resolution fallback, permission-denied path is a bare error string.

### Code health / tech debt

10. **Broken `next.config.ts`:** same dual-export anti-pattern the main site already fixed elsewhere (`import NextConfig` + stray `module.exports = { images }` → `output: 'export'` silently dropped). Relies on `configure-pages` magic in CI. No `basePath` handling for the `/hand-gesture-control` project subpath.
11. **Unpinned CDN:** `tf.min.js@latest` + unversioned `@mediapipe/hands` + `@tensorflow-models/hand-pose-detection` via `next/script beforeInteractive`. Any upstream release can break the demo; no SRI, no fallback, polling `setInterval` to detect load.
12. **`page.tsx` is all-client monolith:** gesture state machine (countdown, debounce, refs), scroll effects, and layout all inline. No `src/data`, no `src/lib`, no state-machine abstraction.
13. **Zero tests, thin scripts:** `lint: eslint` only. No `typecheck`, `format`, `test`. No unit coverage for the one pure, testable module (`gestureLogic.ts`).
14. **SEO/a11y gaps:** metadata is title + one-liner. No OG/Twitter card, canonical, `robots`/`sitemap`/`manifest`, JSON-LD. No skip link, no focus-visible rings, no `prefers-reduced-motion` handling, toast not announced, canvas has no text alternative / status readout, keyboard users can't do anything gesture-equivalent.

---

## 2. Vision & principles

**Positioning (one line):** _A privacy-first, in-browser hand-tracking demo — real ML, no server, no video ever leaves your device._

**Principles (mirrored from main site):**

1. **One brand, two repos:** same tokens, type, and component language as bachi.dev. A visitor clicking "Live Demo" should feel continuity, not a context switch.
2. **Robust over clever:** normalized geometry + temporal smoothing + hold-to-confirm. No gesture should fire by accident.
3. **Proof over claims:** live FPS meter, landmark confidence readout, and a gesture lab where visitors can _see_ why a classification fired.
4. **Calm + fast:** capped inference, lazy-loaded ML, static shell that paints before the model arrives.
5. **Maintainable:** pure logic in testable modules, thresholds in config, content in data files, `typecheck+lint+test+build` green in CI.

**Success metrics (define done):**

- Lighthouse ≥ 95 / 95 / 95 / 100 (desktop + mobile), zero CLS, first paint never blocked by ML scripts.
- Gesture precision ≥ 95% on a scripted synthetic-keypoint suite; zero accidental destructive actions (kill-switch requires 2 s hold + visual countdown).
- `npm run typecheck && lint && test && build` green; static `out/` deploys from `main` (or current `master` — decide once, §9).

---

## 3. Information architecture (proposed)

Keep one page (it's a demo, not a site), but restructure it as a demo instrument:

```
1. Header (slim, on-brand: back-to-bachi.dev ← · title · GitHub source · status pill)
2. Hero strip (one line: what it is + privacy note; **camera auto-starts per decision**, permission prompt is the gate — permission-denied / no-device states must be first-class).
3. Stage (WebcamFrame: video + skeleton + state overlays + FPS/confidence HUD)
   + side Command Center (gesture list + live active state + sensitivity + mirror + camera picker)
4. Gesture Lab (NEW — detection inspector: per-finger extended/curled readout, active rule, event log)
5. Playground (replaces filler ContentBlocks: scroll track, toggle panel, volume/zoom demo)
6. How it works (3 steps: landmarks → geometry → smoothing; link to source + model credits)
7. Footer (on-brand: nav to bachi.dev/work, GitHub, privacy one-liner, "Built with TF.js + MediaPipe")
```

**Key UX change:** camera starts **only after explicit user gesture** ("Enable camera" button). Fixes autoplay/permission hostility, mobile data concerns, and gives a clean place for a privacy note.

---

## 4. Design system (cohesion with bachi.dev)

### 4.1 Tokens (Tailwind v4 `@theme` in `globals.css` — copy the main-site values)

- **Colors:** `zinc-950` (`#09090b`) base, `zinc-900` raised, `zinc-100` headings / `zinc-300–400` body, accent `violet-400/500` + `fuchsia-500` gradients only, borders `white/10`, success `emerald`, danger `red`.
- **Typography:** sans body (`Inter` or Geist Sans — match whatever the main site settled on), `Geist_Mono` for kickers, pills, stats, HUD readouts. Body must not fall back to Arial.
- **Shape:** `rounded-xl` cards (`border-white/10 bg-white/[0.02]`, hover `border-violet-500/40`), `rounded-full` buttons/pills, sections `py-16 md:py-24`, container `max-w-6xl`.
- **Skeleton palette:** joints violet (`#a78bfa`), bones `white/70`, active-gesture highlight `fuchsia`, low-confidence dimming. Kill the red/green dot scheme.

### 4.2 Shared primitives (mirror main-site names where possible)

- `Section` (kicker → H2 → lede), `Button` v2 (primary/secondary/ghost, external `<a>` vs internal), `Card`, `Pill/Badge`, `StatusDot`.
- `GestureBadge` (icon + label + active ring — replaces emoji tiles; Lucide icons throughout, delete emoji-as-UI).
- `Reveal` / reduced-motion-safe transitions; toast becomes a polite `aria-live` status line, not a permanent pill.

### 4.3 Header/Footer

- Header: `← bachi.dev` ghost link + title + GitHub icon + camera status pill. Sticky, backdrop-blur, border only after scroll (same as main site).
- Footer: 1 row — brand + "Privacy: video never leaves your device" + source link + back-to-top. No FAB (main site removed it for the same reason; a footer source link suffices — delete `FloatingActionButton.tsx`).

---

## 5. Gesture plan

### 5.1 Keep, replace, add

| Gesture                             | Today                    | Target                                                                                                         |
| ----------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Thumbs up / down (scroll)           | raw Y, frame-rate scroll | **keep**, normalized + velocity-scaled smooth scroll                                                           |
| Victory (toggle)                    | 1 s debounce             | **keep**, 800 ms debounce + visible cooldown                                                                   |
| Middle-finger hold (kill)           | headline feature         | **retired from UI; kept as unlisted easter egg** (classification stays in code, action TBD — never advertised) |
| Open palm (stop/show)               | —                        | **NEW primary:** hold 2 s → pause camera; open palm tap → show content                                         |
| Fist (pause tracking)               | —                        | **NEW:** hold 1 s → freeze actions, keep video (good "hold that thought" vs destructive stop)                  |
| Pinch (thumb+index)                 | —                        | **NEW:** continuous → volume/zoom slider in playground (shows analog control, not just discrete)               |
| Swipe left/right (open palm moving) | —                        | **NEW:** navigate playground tabs / carousel (needs motion trail — high wow factor)                            |
| Point (index tip)                   | —                        | **Stretch:** cursor-pad mode — fingertip drives a dot, pinch-clicks targets (gated behind "Labs" toggle)       |
| ✌️+thumb / "I love you" 🤟          | —                        | **stretch:** fun extras once the engine is solid; each needs distinct angle rules                              |

Ship set for v1: **thumbs up/down, open palm (hold), fist (hold), victory, pinch** + middle finger as silent easter egg (action TBD). That's 5 advertised actions — double today's count minus the liability.

### 5.2 Robustness engine (the real upgrade)

1. **Normalize everything:** divide all distances by palm size (`wrist→middle_MCP`) or hand bounding box. No raw-pixel thresholds survive review.
2. **Angle-based finger state:** compute PIP joint angle via dot product (tip–PIP–MCP) → `extended (>150°) / half / curled (<90°)`. Rotation- and handedness-tolerant, unlike Y-comparisons.
3. **Handedness + orientation:** use detector `handedness` + wrist→middle-finger axis to define up/down relative to the _hand_, not the screen. Fixes inverted-hand hacks (`isHandInverted` special cases collapse into one transform).
4. **Temporal layer (`useGestureMachine`):**
   - Majority vote over N-frame window (e.g. 5 frames / ~150 ms) before a discrete gesture becomes "active".
   - Hysteresis: different enter/exit thresholds so the toast doesn't flicker at boundaries.
   - Per-action policy: `immediate` (scroll), `debounced` (victory 800 ms), `hold-to-confirm` (palm/fist stop with progress ring, cancellable).
   - Central `GESTURE_CONFIG.ts` — all thresholds, windows, cooldowns in one typed, documented place.
5. **Scroll done right:** velocity-scaled `requestAnimationFrame` scroll (gesture presence → target velocity, eased), not `scrollBy(15)` per inference. Frame-rate independent, interruptible by touch/wheel.
6. **Per-gesture confidence:** expose score (0–1) from margin-to-threshold; HUD shows it; actions require `score > min` (tunable in Command Center "sensitivity" slider: relaxed/standard/strict presets).

### 5.3 Calibration & inclusivity

- **Mirror handling done once:** mirror display only; run detection on unmirrored coordinates with a documented transform (today both video+canvas are CSS-flipped with `flipHorizontal: false` — fragile, document or fix).
- **Left/right hand toggle** + "any hand" default; two-hand: ignore second hand in v1 (log it in the Lab, don't crash).
- **Keyboard equivalents for every action** (↑/↓ scroll, V toggle, P pause) — makes the demo usable without a camera and fixes the a11y dead end. Document in Command Center.
- **Reduced motion:** disable smooth-scroll + skeleton pulse when `prefers-reduced-motion`.

---

## 6. Creative feature suggestions (pick 3–4 for v1, rest are stretch)

1. **Gesture Lab inspector (highest ROI):** live per-finger state dots, active rule trace ("middle extended + others curled → victory @0.92"), rolling event log. Turns a black box into a senior-engineer artifact. Cheap (reads existing landmarks).
2. **FPS + latency HUD:** inference ms, effective FPS, dropped-frame counter. Proves the perf work and gives you numbers for the portfolio write-up.
3. **Pinch slider:** analog pinch distance → volume/zoom/brightness demo control. Discrete gestures are table stakes; continuous control is the memorable moment.
4. **Swipe navigation:** palm-velocity trail → switch playground tabs. Visible motion trail on canvas = instant wow in screen recordings.
5. **Gesture event log + copy:** timestamped list with "copy JSON" — reviewers and recruiters can verify behavior; doubles as your manual test record.
6. **Sensitivity presets + settings persistence:** relaxed/standard/strict + mirror + camera select, persisted to `localStorage`, shareable via URL params (`?sensitivity=strict`).
7. **No-camera / no-ML fallback demo:** "Simulate gestures" buttons + keyboard map so the page is fully explorable on devices without webcams (and in CI screenshots).
8. **Snapshot + share:** capture landmark frame as PNG (video + skeleton composite) — fun, harmless, no server.
9. **Cursor pad (stretch):** index-tip → dot control with pinch-click. Big build, big payoff; gate behind a "Labs" toggle.
10. ~~Two-player / Connect-4 tie-in~~ — **OUT OF SCOPE per decision** (dropped).

**Recommended v1 slice:** Lab inspector + HUD + pinch slider + settings persistence + keyboard map. All client-only, no new deps, each independently shippable.

---

## 7. Technical plan

### 7.1 Target structure

```
app/
  layout.tsx            # metadata, fonts (sans+mono), JSON-LD, skip link
  page.tsx              # Server Component shell composing sections
  globals.css           # Tailwind v4 @theme tokens (mirrored from main site)
  robots.ts sitemap.ts manifest.ts
  components/
    chrome/   (SiteHeader, SiteFooter, Section, Hero)
    stage/    (CameraStage, WebcamFrame, StatusOverlay, Hud)
    gestures/ (CommandCenter, GestureBadge, GestureLab, EventLog, SettingsPanel)
    play/     (Playground, ScrollTrack, PinchSlider, SwipeTabs, CursorPad*)
    ui/       (Button, Card, Pill, StatusDot, Toast)
  hooks/      (useGestureMachine, useMediaPipe, useCamera, useSettings)
  lib/
    gestures/ (types.ts, fingerState.ts, classifiers.ts, smoothing.ts, config.ts)
    camera.ts  ml-loader.ts  scroll.ts  cn.ts
  data/       (gestures.ts, playground.ts, profile.ts)
__tests__/    (mirror of lib/gestures + hooks state machine)
```

### 7.2 Key refactors (ordered)

1. **Config:** explicit `output: 'export'`, `images.unoptimized`, document `basePath` for the project subpath; fix or remove the dual-export pattern. Branch stays `master` per decision.
2. **ML loading:** bundle TF.js + hand-pose-detection via npm with a dynamic import (decided lean); keep pinned-CDN as fallback only if bundle numbers argue against it. Versioned loader with retry + legible error states ("model failed — retry / simulate without camera").
3. **Pipeline hardening:** in-flight inference guard, `visibilitychange` + IntersectionObserver pause, frame skipping to a target inference FPS (e.g. 20–30), DPR-aware canvas sizing, `playsInline/muted` + explicit track cleanup (already partially there — keep).
4. **State machine extraction:** move countdown/debounce/refs out of `page.tsx` into `useGestureMachine` with pure, tested transition functions.
5. **De-client the shell:** `page.tsx` becomes a Server Component; `'use client'` only on stage/gesture/play islands.
6. **Scripts:** `dev / build / start / typecheck / lint / format / test / test:e2e` (Vitest + Playwright smoke or at minimum a synthetic-keypoint suite + axe check). Prettier config shared with main site if possible.

### 7.3 SEO / sharing (portfolio demos get linked — make links pretty)

- Full metadata: title template, 150-char description with "in-browser hand tracking", `metadataBase` = demo URL, canonical, OG/Twitter card with generated `og-cover.png` (reuse main-site generator script pattern), `robots.ts`/`sitemap.ts`/`manifest.ts`.
- JSON-LD `SoftwareApplication` (+ `author: Person Fabian Bachmayer`, `sameAs` GitHub/bachi.dev).
- `README.md` refresh: correct clone URL (today it says `your-username`), live link, gesture table, how-it-works diagram, test/perf badges, privacy note.

### 7.4 Accessibility acceptance (axe clean, keyboard-only pass)

Skip link, visible violet focus rings, camera controls as real buttons with labels, toast/status via `aria-live="polite"`, canvas `role="img"` + dynamic `aria-label` ("hand detected: victory, confidence 92%"), full keyboard map, reduced-motion respected, contrast-checked HUD text.

### 7.5 Performance budget

- Shell interactive < 150 kB JS before ML loads; ML lazy + deferred, never blocks paint.
- Inference ≤ 30/s, render decoupled from inference (draw on rAF, classify on inference ticks).
- No layout shift (fixed aspect stage, reserved HUD space); `loading="lazy"` below fold; fonts subset `latin`.
- Measure: Lighthouse CI on `out/` + HUD-measured inference p50/p95 recorded in the Lab.

---

## 8. Testing plan (new — nothing exists today)

| Layer               | Tool            | What                                                                                                                                                                                                                |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit: geometry      | Vitest          | `fingerState` angles + `classifiers` on hand-authored synthetic keypoint fixtures (each gesture × upright/inverted/left/right/edge cases); normalization invariance (scaled/translated copies classify identically) |
| Unit: state machine | Vitest          | vote windows, hysteresis, debounce, hold-to-confirm progress/cancel/complete, cooldowns — deterministic fake timers                                                                                                 |
| Component           | Testing Library | CommandCenter toggles, SettingsPanel persistence, Toast announcements, no-camera fallback paths                                                                                                                     |
| E2E smoke           | Playwright      | load → enable-camera-mock → simulated gesture events drive playground actions; keyboard map; axe scan; screenshot diff of stage overlays                                                                            |
| Manual checklist    | `TESTING.md`    | real-webcam matrix (lighting, distance, skin tones, glasses/HMD glare, left/right, mobile Safari/Chrome) + record results per release                                                                               |
| CI gates            | GitHub Actions  | `typecheck + lint + test + build` on PR; Lighthouse on `out/`; block merge on failure                                                                                                                               |

Fixtures live in `__tests__/fixtures/hands.ts` — a small library of 21-point poses is itself a portfolio artifact (shows you test ML-adjacent code properly).

---

## 9. Risks & decisions needed

| #   | Decision                              | Status (decided)                                                                                                                                                           | Owner |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| 1   | Middle finger gesture: keep/cut?      | **DECIDED: remove as headline; keep as unlisted easter egg** (not shown in Command Center/Lab; action TBD — candidates: confetti, fun toast, or legacy stop)               | You   |
| 2   | `master` → `main`?                    | **DECIDED: keep `master`** — not important, avoid churn                                                                                                                    | You   |
| 3   | ML via pinned CDN vs npm bundle?      | **DECIDED (lean): npm bundle** (`@tensorflow-models/hand-pose-detection` + TF.js via dynamic import); fall back to pinned CDN only if bundle-size numbers argue against it | You   |
| 4   | Cursor pad vs Connect-4 tie-in?       | **DECIDED: cursor pad = Phase 4 stretch** (Labs-gated); **Connect-4 = out of scope** (dropped)                                                                             | You   |
| 5   | Camera auto-start vs click-to-enable? | **DECIDED: auto-start** (browser permission prompt is the gate); invest in permission-denied / no-device states instead                                                    | You   |
| 6   | Analytics?                            | **DECIDED: none** — keeps "nothing leaves your device" claim airtight                                                                                                      | You   |

---

## 10. Phased roadmap (each phase shippable to Pages independently)

### Phase 0 — Foundations (done 2026-10-06)

- [x] `next.config.ts`: explicit `output:'export'` + `images.unoptimized`; branch stays `master` per decision. Bonus fix: `@mediapipe/hands` (statically imported by the model's ESM even for `runtime:'tfjs'`) aliased to `app/lib/mediapipe-stub.ts` — Turbopack needs a project-relative path (absolute Windows paths crash it), webpack keeps the absolute one.
- [x] ML bundled per decision: `@tensorflow/tfjs` + `@tensorflow-models/hand-pose-detection` as npm deps; `app/lib/ml-loader.ts` (dynamic import → shell stays lean, cached, WebGL→CPU fallback, retryable); `WebcamFrame` polling/`window` globals replaced; render-blocking CDN `<Script>` tags removed from `layout.tsx`. TF.js lands in a separate ~800 KB lazy chunk, not the shell.
- [x] Scripts: `typecheck / lint / format / test` (Vitest + vite + jsdom + Testing Library) + Prettier; CI gates `typecheck+lint+test` before build; fixed duplicate `</body>` in `layout.tsx`.
- [x] Baseline suite: `__tests__/gestureLogic.test.ts` (7 fixtures pinning legacy classifier behavior for the Phase 2 rewrite).
- [x] README: correct clone URL, gesture table, privacy note.
- [x] Verified: `tsc` + `eslint` + `vitest` (7/7) + `next build` (static `out/`, 48 files) all green.

### Phase 1 — Design cohesion (done 2026-10-06)

- [x] Tokens in `app/globals.css` (`@theme`: brand violet ramp + fuchsia accent, Geist sans/mono vars); body zinc-950/zinc-300 sans (Arial fallback gone); violet `:focus-visible` rings; skip-link style; reduced-motion kill-switch.
- [x] Chrome: `SiteHeader` (← bachi.dev, wordmark, GitHub source, "100% in-browser" pill, scroll-state border) + `SiteFooter` (brand, privacy one-liner, source link, `#top` back-to-top). FAB deleted.
- [x] Primitives: `Section` (kicker→H2→lede) / `Pill` / `cn()`; `InstructionPanel` data-driven from `app/data/gestures.ts` with Lucide icons + live active highlight; middle finger delisted from UI (classifier keeps it as easter egg); `FeedbackToast` → `role=status aria-live`, hidden when idle; `ContentBlock` on shared card style.
- [x] `page.tsx` → Server shell (hero strip + demo `Section` + "Three steps, zero servers" explainer); interactivity isolated in client `DemoApp` (behavior unchanged — engine is Phase 2).
- [x] SEO: full metadata (title/description/canonical/OG+Twitter/`og-cover.png` via `scripts/generate-og-cover.mjs` + `npm run og`, theme-color, author) + JSON-LD `SoftwareApplication` + `robots.ts`/`sitemap.ts`/`manifest.ts` (all `force-static` for export — required, build fails without it) + skip link + single H1. Verified in `out/`.
- [x] Tests: new `__tests__/gestures.test.ts` pins the advertised set (middle finger absent by contract). Verified: `tsc` + `eslint` + `vitest` (9/9) + `next build` all green.
- [ ] Still to run post-deploy: Lighthouse on the live URL (target 95+), OG debugger preview.

### Phase 2 — Robust engine (done 2026-10-06)

- [x] `app/lib/gestures/`: `config.ts` (all thresholds in normalized units/degrees — zero pixel magic), `fingerState.ts` (PIP joint-angle + reach composite, thumb straightness + spread), `classifiers.ts` (priority-ordered: pinch → easter egg → victory → palm → thumbs → fist; symmetric screen-vertical up/down — the `isHandInverted` hacks are gone).
- [x] `smoothing.ts` + `useGestureMachine`: 5-frame majority vote (single-frame blips never fire), transition-guarded + debounced victory, hold-to-confirm with progress (palm 2 s, fist 1 s, complete-once, cancel-on-interrupt). Pure + fully tested.
- [x] Scroll rewrite (velocity rAF, 1000 px/s eased — frame-rate independent), pipeline guards (in-flight flag, 25 fps inference cap, `document.hidden` + IntersectionObserver skip, DPR-aware canvas), accessible hold overlay (`role=progressbar`).
- [x] Gesture set v1 (6 advertised): thumbs ↑↓, palm-hold stop, fist-hold freeze (+palm-tap resume), victory, pinch with analog level. Middle finger: classification kept, kill behavior + headline removed; no page action (TBD).
- [x] Suite: `__tests__/fixtures/hands.ts` pose library + `classifier.test.ts` (19 cases: canonical, mirror, 1.6× scale+translate, upside-down, near-miss rejections — 19/19, above the 95% bar) + `smoothing.test.ts` (votes, hysteresis, debounce, hold, cancel) + compat + advertised-set contracts. `TESTING.md` webcam matrix started.
- [x] Verified: `tsc` + `eslint` (incl. `react-hooks/refs` — fixed 2 violations + 1 effect-resubscription bug it exposed) + `vitest` (17/17) + `next build` all green.

### Phase 3 — Instrument it (done 2026-10-06)

- [x] Gesture Lab inspector (per-finger label/angle/reach, confidence meter, live vote-window histogram, pinch readout) + event log (cap 50, copy-JSON with fallback, clear) + FPS/latency HUD (inference fps + ms from instrumented loop, stable + confidence).
- [x] Playground rebuild: pinch slider (pinch-driven + mouse/touch/arrows), swipe tabs (3 tabs via palm-swipe with mirror-aware direction, buttons, arrows, 1–3). New `swipe.ts` motion tracker (0.6-palm displacement gate, vertical reject, cooldown); swiping cancels pending holds; fuchsia centroid trail on canvas.
- [x] Settings: sensitivity presets (relaxed 3/0.40 · standard 4/0.50 · strict 5/0.65 → live machine tuning, no reload), mirror toggle (display-only, skeleton stays aligned), camera picker (enumerate + exact deviceId, re-enumerate post-permission). `localStorage` + `?sensitivity=&mirror=&camera=` share links. Keyboard map (↑↓ ←→ V P F 1–3, input-aware) + SimulatePanel (synthetic bursts through the real vote path — doubles as the e2e driver).
- [x] Playwright smoke + axe (5 specs, Chromium + fake camera device, serves `out/`): shell render, simulated victory toggle, keyboard map, camera-loader settle, axe scan. New `e2e` CI job (chromium --with-deps, build, serve, test). Axe caught a real contrast bug (`zinc-500` small text 4.12:1 → bumped to `zinc-400` app-wide); e2e debugging caught a test bug (Playwright counts `opacity-0`-collapsed content visible — assertions now target the durable `max-h-0` state).
- [x] Verified: `tsc` + `eslint` (2 more refs-rule violations fixed properly) + `vitest` (26/26) + `next build` + `playwright` (5/5) all green.
- [ ] Still real-world: `TESTING.md` webcam matrix (13 rows) needs a human pass with a camera.

### Follow-up — always-visible camera dock (done 2026-10-06)

- [x] `CameraDock`: fixed bottom-right PiP (expands/collapses, collapsed to a status dot on small screens, detection pauses while collapsed with machine reset). Stage section restructured around it (Command Center + Settings side by side, HUD + simulation full-width). Stop button added top-left (explicit camera stop). Verified: full gates + e2e green.

### Product revision — no fist, no holds, palm says hello (done 2026-10-06)

Owner feedback, all three points adopted:

1. **Fist deleted** — freezing solved a non-problem (hands leave the frame); fist/palm confusion resolved by removal. The shape now classifies as `none` (pinned by test: resting fists fire nothing).
2. **Open palm is the greeting**, never a destructive action: palm transition (1.5 s cooldown) shows a hello toast and reveals hidden content. No holds anywhere.
3. **Camera stops only via explicit UI**: dock stop button, keyboard `P`, resume overlay.

Consequences: hold-to-confirm machinery removed from machine/hook/stage (`actionDebounceMs` transition events replace it: victory 800 ms, palm 1.5 s); `GestureType` shrinks to 5 + easter egg + none; Command Center/panel/toast/e2e surface the 5-gesture set.

### Corrections round — frame resize, mirror, navbar tabs (done 2026-10-06)

Owner corrections, all adopted:

- Push/pull resizes the camera FRAME (not content zoom); mirror back on the proven class.
- Tabs read as top navbar (sticky bar under the header); hero moved into Home only.

Owner feedback: consequences must be page-sized, not widget-sized.

- **Site tabs** (Home / Controls / Insights, sticky nav): swipe, buttons, arrows, and
  `1–3` all switch the same tab state. Playground `SwipeTabs` deleted; its model/proof
  copy moved to Insights. Scrollable content stays below the tabs (always visible).
- **Push/pull resizes the dock frame** (200–520 px from the distance value; feed fills it, detection unaffected) and drives the Distance Slider together. Mirror reverted to the proven Tailwind class (an inline-transform experiment broke rendering on some drivers).
- **Victory flips the whole theme**: class-based dark mode (`@custom-variant`),
  pre-paint script + persisted preference, full light palette across all components
  (dock/toast stay intentionally dark). Palm hello no longer reveals anything (nothing
  hides anymore). Verified: full gates + e2e green (6/6, incl. theme-flip specs).

### Scroll root cause + mobile/hydration fixes (done 2026-10-06)

Owner testing: Lite changed nothing, phone over LAN-http had no camera + hydration crash.

- **Shake root cause found:** page CSS sets `scroll-behavior: smooth` and the velocity loop used `behavior: 'auto'` (obeys CSS) — every frame queued a competing tween: vibration with no travel, fps-independent. Loop now uses `behavior: 'instant'` (keyboard keeps explicit smooth).
- **Insecure contexts guarded:** `http://192.168.x` exposes no camera API (`mediaDevices` undefined → TypeError). Acquisition + enumeration now fail legibly ("needs localhost or HTTPS") instead of crashing.
- **Hydration mismatch fixed:** the dock's `window.innerWidth` initializer diverged on narrow screens → default-open + responsive CSS sizing instead.

### Weak-hardware tuning — smoothing + lite model (done 2026-10-06)

Owner testing on a weak laptop: steady recognition but juddery scroll; pinch % jumping while held.

- Landmark EMA (α=0.5, reset on tracking loss) before draw+classify steadies skeleton, angles, and margins at the source.
- Full/Lite model switch in Settings (persisted + `?model=lite`): lite is 2–4× cheaper inference.

### Gesture tuning round 1 — thumbs glide (done 2026-10-06)

Owner testing: thumbs recognized but juddered without travel.

- Scroll now attacks fast (8/s) and releases slow (1.5/s) to glide through vote gaps.
- Lab gained a margins section (up / down / v-spread with thresholds) for per-gesture remote debugging.

### Gesture tuning round 2 — pinch retired, push/pull replaces it (done 2026-10-06)

Owner testing: pinch unreliable by nature (fine tip geometry on jittery landmarks).
Decision: stop tuning it — pinch rule, type, fixtures, slider wiring, and UI removed
outright (a tip-out rewrite + `deepPinch` regression test were built and then
deleted with the rule; history preserved in git). The analog job moves to palm
push/pull (relative palm-size tracking in `distance.ts`, zero calibration), which
composes with hello + swipe on the same pose. Middle-finger toast is now fully
silent (still classified, still unbound).

### Lighthouse round — 66 → 84 desktop, BP back to 100 (done 2026-10-07)

User report (proxied deploy URL, extensions present): perf 66 (TBT 4.5 s), BP 96
(console 418 hydration error), a11y/SEO 100.
- **Camera-first pipeline:** model downloads only AFTER grant (denied/headless pay
  zero ML). Biggest lever: TBT 4.5 s → 0.6 s in clean-room.
- **Slim TF imports** (core + converter + webgl/cpu instead of full `tfjs`):
  largest chunk 796 → 330 KB.
- **Quiet audits:** acquisition denials → `console.info`, inference warns dev-only.
  BP back to 100.
- **Clean-room baseline** (headless Playwright Chromium, no extensions, local
  prod build): **84 / 100 / 100 / 100**, zero console errors — the user's 418 was
  environmental (extensions/proxy), not app code. Remainder is Next framework
  overhead (38 KB unused in one chunk), not ours. Verified: full gates + e2e green.

### Polish round — fingers icon, docked commands, instructional toast (done 2026-10-07)

Owner fine-tuning, all adopted:

- Victory uses a custom two-finger mark (lucide ships no peace hand).
- Mirror default stays ON; settings storage bumped `v1 → v2` so stale
  toggled-off preferences reset to fresh defaults.
- Scrollable content gained bottom padding.
- Command Center rows carry full-explanation tooltips; open palm split into
  Swipe Palm + Push/Pull rows (shared id, unique titles, deduped simulation).
  Dead `InstructionPanel.tsx` deleted.
- Palm toast now coaches: "Nice hand! Swipe ←/→, push closer, pull away".
- Verified: full gates + e2e green.

### Navbar + dock revision (done 2026-10-06)

Owner corrections, all adopted:

- Tabs live IN the header navbar (brand row + tab row, sticky); hero + "Try it"
  section moved into Home only. Slide-track panels (direction-aware translate,
  `inert` + `aria-hidden`, no whitespace jumps).
- Controls → **Settings**; theme Sun/Moon toggle in the header (persisted).
- Command Center docked left of the feed (`CommandMini`, always visible while
  detecting); Home keeps hero + simulator + how-it-works.
- Push/pull resizes the dock FRAME (not content zoom); mirror reverted to the
  proven Tailwind class after an inline-transform experiment broke rendering.
- Pointer cursors on all interactive elements (Tailwind v4 defaults buttons to
  arrow). Verified: full gates + e2e green (axe caught two heading-order issues
  on the way — dock label demoted to `p`, per-panel `h2` titles added).

### Phase 4 — Launch & cross-link (0.5 day)

- [ ] Deploy, verify live (permissions flow, OG card, 404-free, mobile Safari/Chrome sanity).
- [ ] Main-site `/work` entry refresh: new screenshot + outcome line + "v2: robust engine" note.
- [ ] Stretch backlog: cursor pad (Labs-gated), swipe-trail polish, snapshot-share. (Connect-4 explicitly out of scope.)

**Estimated total:** 5–7 focused days solo. Phase 1 alone delivers ~60% of the perceived upgrade; Phase 2 is the credibility story.

---

## 11. Acceptance criteria (ship gate)

- [ ] Looks like bachi.dev: one palette, two fonts, shared card/button/section language (side-by-side visual review, mobile + desktop).
- [ ] Header links back to bachi.dev + source; footer carries privacy line; no FAB, no emoji-as-UI, no middle-finger headline.
- [ ] 4 advertised gestures (thumbs ↑↓ scroll, victory toggle, palm hello+reveal+push/pull, swipe tabs; middle finger silent easter egg, no action) with per-gesture policy (immediate/transition-cooldown/continuous-motion); no gesture performs a destructive action.
- [ ] No accidental triggers in a 2-minute soak (scripted + one real-webcam pass logged).
- [ ] Camera: auto-start, device picker, permission-denied + no-ML fallbacks, keyboard map covers every action.
- [ ] Tests: unit suites green, E2E smoke green, axe clean, Lighthouse ≥ 95/95/95/100.
- [ ] SEO: OG card renders, sitemap/robots live, JSON-LD valid, single H1, canvas has text alternative.
- [ ] Repo: ML via npm bundle (no unpinned `@latest` CDN), no dead assets, `typecheck+lint+test+build` green, README accurate (run, test, deploy, privacy).

---

## 12. Immediate next actions (if you say "go")

1. Phase 0 foundations PR (config + pinned ML + scripts + CI + README fixes).
2. Phase 1 cohesion PR (tokens + chrome + primitives + auto-start permission states + SEO basics).
3. Gesture fixture set first (poses for all 6 v1 gestures) — tests written before the new classifiers.
4. Phases 2 → 3 → 4, then update the main-site `/work` entry to point at the new demo.

_Suggested commit flow: one PR per phase; each deployable to Pages independently. Say the word and I start with Phase 0._
