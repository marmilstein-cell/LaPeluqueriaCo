# Task 1-c — full-stack-developer — HERO REDESIGN (Opening.tsx)

Project: /home/z/my-project (BARDOS barbershop). Prior agents' records: /home/z/my-project/worklog.md (read sections 1-b + QA5 for context; agent-ctx/ did not exist before this task — created now).

## Task
Complete redesign of src/components/bardos/Opening.tsx: replace the fixed portrait hero with a scroll-driven cinematic video hero (/videos/hero.mp4, 1920×1080, 5.19s B&W macro footage) plus dramatically upgraded text choreography ("crazy incredible transitions"), per client request.

## What was built (8 layers, section h-[380vh] + sticky h-screen, scrollYProgress 0→1)

1. **L1 VIDEO** — `<video>` muted/loop/playsInline/preload=auto, poster=hero-portrait.webp, playbackRate 0.6, autoplay on mount with `.catch`, `v.muted=true` forced in effect (React SSR muted quirk), paused via IntersectionObserver when section off-viewport, onError → BImage fallback. Scroll transforms on the container: scale [1.32→1→1.14] (0/0.5/1), x "-3.5vw"→"3.5vw", rotate -1.2°→1.2°, opacity 0.55→1 over [0.3,0.5]; legibility overlay (gradient, black/45→~25% via opacity 1→0.55); pointer parallax ±14px/±8px (kept mx/my springs) on inner wrapper; vignette + b-img + will-change-transform. **Letterbox**: two h-[9%] black bars, scaleY 0→1 over [0.5,0.75] then hold (transform-only, origin top/bottom).
2. **L2 BARDOS word** — kept HalfWord clip-path split + red cut-line + gap opening. Letter entrance upgraded: y 0.65em + rotateX 55 + blur(12px) → 0, stagger 70ms, dur 1s, ease [0.16,1,0.3,1], transformPerspective 900 (+ perspective on flex parent). Scroll: wordOpacity 1→0 AND blur-out 0→8px [0.42,0.55] (useMotionTemplate). Per-letter cursor parallax kept.
3. **L3 BARBER. thesis (h1 aria-label)** — `BarberLetter({index, progress})` (constant 6 letters, hooks-safe): entrance t=0.55+i·0.025 over 0.07 → x ±90→0, skewX ∓14→0 (alternating sides), opacity, blur 10→0; exit t=0.74+i·0.02 over 0.09 → y 0→(-110/+130), rotate ±6, opacity→0, blur→6. transform+filter via useMotionTemplate; will-change on letters wrapper. Red dot punch-in scale 2.6→1 + opacity at [0.70,0.74], pop-out [0.80,0.88]. Serif "Cortar es quitar.": opacity [0.62,0.68,0.75,0.8], letterSpacing 0.3em→0.04em, y 24→0, blur 8→0. Word wrapper scale 1.05→1.
4. **L4 Kinetic marquees** — bottom strip top-[72%]: "SAN MARTÍN DE LOS ANDES — PATAGONIA — BARBERÍA — EST. MMXIX — EL CORTE COMO EDICIÓN — " ×3, x "6%"→"-34%" [0.5,1], opacity in [0.58,0.66]/out [0.85,0.95], text-bone/45, marquee-mask. Top strip top-[76px] (md+): "BARDOS — BARBER — " ×12 opposite direction ("-20%"→"4%").
5. **L5 Corner slates** (sm+): "BARDOS® — MMXXVI" / "SAN MARTÍN DE LOS ANDES" / "PATAGONIA — ARGENTINA" / "ESCENA 01 — ENTRADA" — mount fade 1.2s+i·0.15, scroll drift y ±18 alternating.
6. **L6 IntroMeta** (2.6s timed): pulsing red hairline + slate "BARDOS / SAN MARTÍN DE LOS ANDES / MMXXVI" (top-[38%]) + top row "SAN MARTÍN DE LOS ANDES / EST. MMXIX" — fades out after intro.
7. **L7 Scroll invite** — "DESLIZÁ" (idle opacity pulse loop) + red vertical line 56px scaleY [0.74,0.88] origin-top, out by 0.9.
8. **L8 Hard cuts** — blackFrame [0.46,0.5,0.54], outroBlack [0.92,1] (z-20).

## Reduced motion
h-screen, BImage poster (static), no autoplay/IO, BARDOS unsplit (y -15vh), BARBER.+serif static (y 12vh), static single marquee line at top-[76px], corners visible, static letterbox — never blank.

## A11y
h1 aria-label "BARBER." (letters aria-hidden); BARDOS container aria-label "BARDOS"; section aria-label "Bardos — apertura"; video aria-hidden; all Spanish copy. Old copy (THE CUT./SCROLL/BUENOS AIRES) fully removed.

## Deviations from spec (deliberate, minor)
- Reduced-motion renders poster via BImage instead of the raw `<video poster>` (better object-cover + alt; intent preserved: "poster visible").
- Reduced static marquee placed at top-[76px] instead of 72% to avoid overlapping the static serif line.
- IntroMeta top row now fades OUT after intro (spec describes that behavior; original code had it fade in and persist).
- autoplay attribute omitted; autoplay done in effect (play().catch) + muted forced there — more reliable than the SSR-muted React quirk; spec intent (autoplay on mount, catch errors) preserved.
- globals.css untouched (no additions were needed — letterbox via scaleY, pulse via framer, marquee reuses existing marquee-mask class).

## Verification
- `bun run lint` → 0 errors.
- `bunx tsc --noEmit` → 0 errors in src/ (4 pre-existing in examples/ + skills/, out of scope).
- dev.log → compiles clean after hot-reload; GET / 200 (the only Fast-Refresh warning in the log predates this task — from 1-b's edit window).
- `curl -s localhost:3000/` → HTTP 200; HTML contains: hero.mp4 (in <video>), BARBER., SAN MARTÍN ×10, DESLIZÁ, "Cortar es quitar.", ESCENA 01, BARDOS® — MMXXVI, PATAGONIA, h-[380vh], 2× h-[9%] letterbox bars, will-change-transform ×2; zero occurrences of "THE CUT."/"SCROLL"/"BUENOS AIRES".

Full record also appended to /home/z/my-project/worklog.md (Task ID: 1-c).
