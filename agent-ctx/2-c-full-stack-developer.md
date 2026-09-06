# Task 2-c — STYLING DETAIL LAYER (cinematic micro-details)

Agent: full-stack-developer
Date: 2026-09-06
Scope: Opening.tsx (hero), globals.css (append), StepDate.tsx, StepTime.tsx, StepShell.tsx

## Context read first
- worklog.md: sections 1-c (hero redesign), 1-d/2-a (QA), 2-b (cabina features) — done.
- Files read before editing: Opening.tsx (380vh scroll-driven video hero), globals.css (tokens: --color-red #E5231B, --color-black #0A0A0B, --ease-cut, type-micro), StepDate/StepTime (chips), cursor.tsx (Grain), YourSession.tsx + StepShell.tsx (step transition), Nav.tsx (height ~57px → TC row at top-[76px]), providers.tsx (Lenis), TheCut.tsx (hover grammar reference), framer-motion's useVelocity source (node_modules) — key finding: useVelocity decays to 0 via frame.update self-scheduling, but its getVelocity() underestimates a single big jump after long idle (dt spans the idle period) → my loop ALSO computes per-frame velocity from scrollY deltas and takes the max of both signals.

## Changes implemented (per task item)

1. **#1 Scroll-velocity-reactive video** (Opening.tsx)
   - `useScroll()` page-level + `useVelocity(scrollY)`; `.on("change")` subscription stores framer's velocity signal (with 300ms staleness guard).
   - Single rAF loop (only when video exists && !reduced): computes per-frame velocity from scrollY deltas (EMA 0.2/0.8), takes `max(|framer|, |velEma|)` → target = clamp(0.55 + mag/2000·1.65, …, 2.2); rate lerps toward target at 0.12/frame; writes `video.playbackRate` (skips when paused / |Δ|<0.001). Cleanup: unsub + cancelAnimationFrame + marqueeSkew.reset.
   - Idle playbackRate unified at 0.55 (was 0.6) in the mount effect.
   - **Marquee smear**: `marqueeSkew` MotionValue (skew = clamp(velEma·0.002, ±4°), lerp 0.1 decay) applied as `style={{ skewX }}` on both marquee tracks (top track mirrored via `useTransform(s => -s)`); `.marquee-smear` (will-change: transform) helper class in globals.css.

2. **#2 TC + REC cluster** (Opening.tsx — new `RecCluster` component)
   - Top-right (right-0 top-[76px] z-[6], paddingInline --grid-margin): 6px red dot (`.rec-dot`, hard blink 1.2s steps(1)) + "REC" + live `TC HH:MM:SS:FF` (video.currentTime at 30fps).
   - rAF + direct `ref.textContent` mutation (tabular-nums), zero React state; self-heals to "TC —" if video absent (videoFailed path).
   - Intro fade-in (delay 1.2s, 0.8s) × exit fade tied to scrollYProgress [0.7, 0.78] (thesis exit). aria-hidden. Reduced: static dot + "REC" + "TC —", no rAF.

3. **#3 Projector flicker** (Opening.tsx + globals.css)
   - `<div class="projector-flicker z-[2]">` sibling of the video container (above video, below marquees z-5 / text z-10), pointer-events-none, rendered only when !reduced.
   - CSS: black overlay, irregular keyframes 0/7/9/41/43/71/100% (opacities 0.008–0.05), 4.5s linear infinite + `::after` radial vignette breathing (opacity 0.3↔0.5, same 4.5s). `@media (prefers-reduced-motion: reduce) { animation: none; opacity: 0 }` (both element and ::after).

4. **#4 Letterbox bar labels** (Opening.tsx)
   - Two motion.spans inside the L1 frame container (inherit the frame's zoom/tilt — filmic): top-left "BARDOS — MMXXVI", bottom-right "SAN MARTÍN DE LOS ANDES — PATAGONIA", type-micro text-bone/60, h-[9%] strips centered in the bar zone, z-[1] above the bars.
   - `barLabelOpacity = useTransform(letterbox, [0.44, 0.6], [0, 1])` — hidden below 4% bar height (4/9 = 0.444). Reduced: opacity 1 static. aria-hidden.

5. **#5 Selection/scrollbar/focus** (globals.css, appended at end)
   - ::selection red bg + #0A0A0B text (overrides the earlier offwhite rule by cascade order); html scrollbar-color (Firefox); ::-webkit-scrollbar 10px black track + #26262a thumb (2px black border → 6px visual) + red on hover; :focus-visible red hairline (identical to existing — harmless duplicate per spec).

6. **#6 Projector flicker keyframes + .marquee-smear helper** (globals.css) — as above; also `.rec-dot` + `@keyframes rec-blink`; `.chip-cutline` (#7). NOTE: bare `::-webkit-scrollbar` (0,0,0,1) appended AFTER the existing `*::-webkit-scrollbar` (same specificity) → later wins, so ALL scrollbars get the brand treatment (intended).

7. **#7 Chip hover cut-line** (StepDate.tsx, StepTime.tsx + `.chip-cutline` in globals.css)
   - `chip-cutline` class added to date chips and time slots (buttons are already `relative`). ::before = 1.5px red hairline at top edge (-1px), scaleX(0→1) origin-left, 220ms var(--ease-cut) — same grammar as TheCut rows.
   - Guards: `:disabled::before, .slot-cut::before { display: none }` (disabled/cut chips promise nothing); selected chips keep their red border — hairline is additive (hover/focus-visible only).

8. **#8 Step transition wipe** (StepShell.tsx — the element that carries the exit animation today; YourSession's keyed div stays a plain div, no double animation)
   - initial `{ clipPath: "inset(0 0 100% 0)", y: 12, opacity: 0.4 }` → animate `{ clipPath: "inset(0 0 0% 0)", y: 0, opacity: 1 }`, 420ms, ease [0.16,1,0.3,1]. Exit unchanged (fade-up { opacity: 0, y: -18 }). All 6 steps use StepShell → uniform splice.

## Verification results (all mandatory checks)
- **lint**: 0 errors. **tsc --noEmit**: 0 errors in src/ (only the 4 pre-existing in examples/ + skills/).
- **agent-browser** (1440×900, fresh loads; 8 screenshots in .qa/2c/):
  - Hero: TC/REC cluster live top-right (dot x=1226 y=81, 6×6; "TC 00:00:01:25" ticking at 30fps; VLM confirms readable, cleanly placed, no overlap). Flicker: exists, computed animationName "projector-flicker" 4.5s, opacity sampled 0.0095–0.0136 (≤0.05 ✓). 2 marquee-smear tracks present.
  - **playbackRate PROOF (#1)**: rest 0.55 (fresh, settled) → window.scrollTo(0,2000) → frame-accurate samples: +3 frames 0.947 → +15 frames 1.111 (Lenis still easing) → +55 frames 0.5547 (fully decayed to idle). Manual write test (set 1.8) confirmed the loop pulls it back to idle. Marquee skew measured reacting: skewX(-1.08°) → -0.38° decaying.
  - Booking: step 01 → click CORTE + BARBA → exit captured (fade-up y -7.7→-18, opacity →0) → step 02 mounts at +906ms and wipes: clipPath inset 78.2% → 19.2% → 3.5% → 0.6% → 0% monotonic, opacity 0.53→1, y 8.9→0 — SINGLE smooth splice, no double animation. Screenshots steps 01–04.
  - Chips: 16/16 date chips + 18/18 time slots carry chip-cutline; ::before computed = 1.5px, full width, rgb(229,35,27), matrix scaleX(0), transition 0.22s; 6 disabled slots → ::before display:none ✓. CSS rules verified in stylesheet (hover/focus-visible sweep + disabled guard). NOTE: :hover visual can't render in this headless env (reports hover:none — known limitation, documented in QA4/1-d; rule + structure verified instead).
  - Letterbox: at scrollY 1780 (p≈0.70) bars scaleY 0.825 + both labels opacity 1 (VLM: readable, correctly placed). TC exit: inner opacity 0 at p≈0.80 (fades with thesis exit ✓).
  - **Reduced-motion emulation** (set media reduced-motion + reload): video absent (BImage poster), section h-screen, flicker NOT rendered, 0 smear tracks, static "TC —", rec-dot animation:none — full graceful degradation, no crash. Restored to normal after.
  - Console: 0 page errors; only the known benign framer scroll-offset warning + dev Fast Refresh logs. sessionStorage draft cleared after QA flow.
- **dev.log**: no runtime errors; only ✓ Compiled + 200s (the two "Fast Refresh full reload" lines during the edit window are dev-mode artifacts of editing order — intermediate states referenced RecCluster before its definition; a fresh load shows zero errors).

## Environment findings (for future agents)
- The dev server did NOT recompile globals.css on the first edit (served CSS was stale even though HTML had the new DOM) — `touch` alone didn't trigger it; appending a content change did. If CSS rules "don't exist" in the browser after an edit, verify the served chunk (curl the stylesheet href) and kick a recompile with a real content change.
- Headless rAF runs ~10fps when the page is quiet and faster while an eval promise is pending; setTimeout is clamped — use rAF-count waiting (`waitFrames(n)`) for frame-accurate transition measurements.
- Lenis eases programmatic window.scrollTo jumps (~0.5-1s), so velocity bursts from jumps are moderate; the 2.2 rate ceiling needs a harder flick (mapping is correct by construction: 2000px/s = tope).
- screenshots: use ABSOLUTE paths with agent-browser or they land in /home/z/.agent-browser/tmp/screenshots/.
