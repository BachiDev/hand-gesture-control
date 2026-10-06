# Manual webcam test matrix

Unit coverage (`npm test`) pins the classifier + machine on synthetic poses.
This checklist covers what synthetics can't: real cameras, lighting, and humans.
Record results per release: date, browser, device, pass/fail + notes.

## How to run the suites

```bash
npm test          # vitest: classifier (19 cases), machine, swipe, settings, advertised set
npm run test:e2e  # playwright: shell render, simulated victory, keyboard map, camera settle, axe
```

Unit status (2026-10-06): 26/26 green. E2E status (2026-10-06, local Chromium + fake
camera device): 5/5 green, axe clean. The axe run caught one real issue — `zinc-500`
small text on `zinc-950` (4.12:1) — fixed by bumping small text to `zinc-400`.

## Soak test (no accidental triggers)

1. Open the demo, show an open hand at rest for 2 minutes (natural micro-movement).
2. PASS if: no camera stop, no content toggle, no freeze. Toast may flicker between poses.

## Per-gesture matrix

| #   | Gesture                            | Lighting | Distance | Hand   | Expected                                                                                    | Result |
| --- | ---------------------------------- | -------- | -------- | ------ | ------------------------------------------------------------------------------------------- | ------ |
| 1   | Thumbs up                          | daylight | ~60 cm   | right  | smooth scroll up                                                                            | [ ]    |
| 2   | Thumbs up                          | dim room | ~60 cm   | right  | smooth scroll up                                                                            | [ ]    |
| 3   | Thumbs down                        | daylight | ~60 cm   | right  | smooth scroll down                                                                          | [ ]    |
| 4   | Thumbs down                        | daylight | ~60 cm   | left   | smooth scroll down                                                                          | [ ]    |
| 5   | Victory                            | daylight | ~60 cm   | right  | toggles once per flash                                                                      | [ ]    |
| 6   | Victory (fast double)              | daylight | ~60 cm   | right  | toggles once (debounced)                                                                    | [ ]    |
| 7   | Open palm wave                     | daylight | ~60 cm   | either | greeting toast + hidden content revealed (1.5 s cooldown)                                   | [ ]    |
| 8   | Resting fist in frame              | daylight | ~60 cm   | either | nothing fires (soak 1 min)                                                                  | [ ]    |
| 10  | Push/pull distance                 | daylight | 40–80 cm | either | slider follows approach/retreat, no jumps                                                   | [ ]    |
| 11  | Resting hands visible              | daylight | —        | both   | second hand ignored, no crash                                                               | [ ]    |
| 12  | Permission denied                  | —        | —        | —      | "permission denied" message + Try again button, no loop spam                                | [ ]    |
| 13  | Mobile Chrome / Safari             | daylight | ~40 cm   | either | camera + gestures work                                                                      | [ ]    |
| 14  | Camera busy (Teams/Zoom/other tab) | —        | —        | —      | "already in use" message (never permission), Try again recovers after closing the other app | [ ]    |

## Known limitations (document, don't hide)

- The distance slider needs an open palm held roughly steady in depth; fast approaches may jump — that is expected, the EMA settles it.
- Low light degrades landmark quality; the vote window hides most flicker but actions get sluggish below ~10 inference fps.
- Two hands: only the first is tracked.
