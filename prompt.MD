# MEGA PROMPT — Translucent / refractive hero tape


Hand this back to Claude when you're ready to build. It is written to be pasted whole.


---


## MISSION


Make the hero tape read as real cellophane tape: **translucent, not transparent** — you can see a
little of what's behind it, the edge bends light slightly, the surface carries flaws (smudges,
micro-bubbles in the adhesive, hairline scratches, uneven thickness). It must still read as *this
brand's* tape — the flat, saturated, art-directed look currently on screen is the baseline, not
something to trade away for physical realism.


Work **incrementally and revertably**. Every step below must be independently switchable to zero and
land back on today's exact look.


---


## PROJECT FACTS (verified — do not re-derive, but do re-verify if the file has moved)


- **Stack:** Next 16 (App Router) + React 19, **vanilla three.js `^0.185.1`** — *no* react-three-fiber,
 *no* drei, *no* postprocessing. GSAP + Lenis drive scroll. Payload CMS on the back.
- **Hero 3D lives in [`src/components/Hero/heroTape.ts`](src/components/Hero/heroTape.ts)** (~1421 lines).
 three is dynamically imported by `engine.ts` after mount so it ships as its own chunk. The split is
 strict: `engine.ts` owns scroll, `heroTape.ts` owns the scene and materials.
- **Renderer setup (~line 915):**
 ```js
 new WebGLRenderer({ antialias: true, alpha: true })
 renderer.toneMapping = NoToneMapping
 renderer.setClearColor(0x000000, 0)
 ```
 **There is no environment map, and that is a documented deliberate choice** (see the comment block
 at ~line 907): tone mapping and env maps both drag saturated flat artwork toward pastel.
- **The canvas is a transparent DOM overlay.** `hero.css` `.hero-tape` is `position: absolute;
 z-index: 2; pointer-events: none`, sitting over the page's colour fields and headline type. The
 background you see behind the tape is **HTML, not scene geometry.**
- **DPR is capped at 2 and the drawing buffer height at `MAX_BUFFER = 4096`** — the canvas runs the
 full section height, so it is a very tall buffer.
- **Material pipeline:**
 - `toPhysical(src: MeshStandardMaterial)` (~line 778) hand-copies GLTF materials onto
   `MeshPhysicalMaterial`. It copies only the fields this export uses. **It does not carry
   transmission/thickness/ior/attenuation.**
 - `applyFilmLook(mat, look)` (~line 876) sets roughness/metalness **and patches the shader via
   `onBeforeCompile`**, injecting a saturation/contrast block after `#include <map_fragment>`, fed by
   shared uniform objects (`filmLook`, `faceLook`).
 - `applyFilmFinish(mat, turn)` (~line 827) sets clearcoat, anisotropy + rotation, and `normalScale`.
 - `applyFaceLook(mat)` (~line 840) is the printed label's own finish — glossier, less metallic.
 - Registries: `filmMats[] = {mat, turn, base}` and `faces[] = {mat, base}`. `base` is the **original**
   colour; exposure knobs are applied against it so repeated tuning sets rather than compounds.
- **Surfaces, and they are not interchangeable:**
 1. the roll's **wound side** (GLB material literally named `"Material"` — see the comment at ~line 1336),
 2. the roll's **printed face/label**,
 3. the **dispensed strip** — a `PlaneGeometry` with `side: DoubleSide`, procedural `CanvasTexture`
    maps (mottle colour, mottle roughness, tooth normal) tiled along its length by `STRIP.GRAIN`,
 4. the **torn end** (`END`), sharing the strip's material.
- **Models:** `public/assets/tapes/Cello-Tape.glb` (+ Masking, Low-Noise, Double, Cloth). Placeholder
 mapping in `src/data/tapes.ts`.
- **Dev convention:** every knob is an exported `const` object (`FILM`, `STRIP`, `END`, `LIGHT`,
 `FACE_LIGHT`, `CONFIG`) with a prose comment explaining *what it trades against*, live-tweakable as
 `hero.FILM.X = 0.5; hero.tune()`. `tune()` rebuilds procedural maps and re-applies finishes.


---


## NON-NEGOTIABLE CONSTRAINTS


1. **Do not switch `toneMapping` globally.** `NoToneMapping` is load-bearing for the flat artwork.
  If transmission highlights clip to white, fix it with light power / clearcoat / roughness, not with
  ACESFilmic.
2. **Do not set `scene.environment`.** If a transmissive surface needs reflections, assign
  `material.envMap` on **that material only**, with a low `envMapIntensity`. A scene-wide environment
  would repaint every flat-art surface in the hero.
3. **Do not break `applyFilmLook`'s `onBeforeCompile`.** If you need a second shader patch, compose it
  into the existing callback — do not reassign `onBeforeCompile` and silently drop the sat/punch
  injection. Set `needsUpdate = true` after any patch change.
4. **Every new knob goes to 0 cleanly**, restoring today's look exactly, and is re-applied by `tune()`.
5. **Match the file's voice.** Comments here explain trade-offs and *why a number is that number*, in
  full prose. Do not add terse one-liners or leave a magic number uncommented.
6. **No new runtime dependencies.** Flaws are authored as procedural `CanvasTexture`s the way
  `mottleTex` / `toothTex` already are — not as new image files, unless we explicitly agree otherwise.
7. **Dispose everything you create.** The teardown path (~line 1293) sweeps materials; StrictMode
  double-mounts. Any new texture or render target must be in that sweep or it leaks per remount.


---


## THE ERROR LIST — symptom → cause → fix


These are the failures this task actually produces. Handle each *before* claiming it works.


### 1. The tape refracts nothing and goes dark/hollow  ← THE BIG ONE
**Cause:** three's transmission is *not* a backdrop filter. It renders the **scene's opaque objects**
into `renderer.transmissionRenderTarget` and samples that. This scene is nearly empty, and the clear
colour is transparent black, so the tape samples emptiness. The page background it appears to sit over
is **DOM behind the canvas** and is invisible to WebGL.


**Fix — pick one, deliberately:**
- **(a) In-scene backdrop.** Add an unlit backdrop `Mesh` behind the roll, painted with the hero's
 background colour (and optionally a `CanvasTexture` copy of the headline type). Cheapest correct
 option; refraction then bends something real. Watch that the backdrop never becomes visible outside
 the tape's silhouette — size and depth it against the camera frustum, and keep it out of the roll's
 own bounds calculation.
- **(b) Fake it in-shader.** Skip `transmission` entirely; extend the existing `onBeforeCompile`
 patch to sample a `uBackdrop` texture in screen space, offset by the view-space normal × a strength
 uniform. No second render pass, works with `alpha: true`, and gives the edge-bend read at a fraction
 of the cost. **This is likely the right answer for a hero over DOM content.**
- **(c) Real page content behind it.** Only if we genuinely need the headline to distort — requires
 rasterising DOM into a texture, which is a much larger job. Ask before going here.


Whichever you pick, **state the choice and why at the top of the diff.**


### 2. Colour disappears when transmission goes up
**Cause:** at `transmission ≈ 1` the diffuse term goes to ~0, so `material.color` — which the existing
`FILM.TONE` exposure bookkeeping (`base` colours in `filmMats`/`faces`) is applied to — stops doing
anything visible.
**Fix:** tint moves to `attenuationColor` + `attenuationDistance`, which deepen with thickness (the
physically right look for tinted tape, and a nicer one). But then `FILM.TONE` and the `base` colour
registries must be taught to drive `attenuationColor` for transmissive materials, or exposure tuning
silently no-ops. Keep both paths working — the label is not transmissive and still needs `color`.


### 3. `thickness` at physical scale does nothing
**Cause:** real tape is ~50µm. The model is ~1 world unit across (`STRIP.RADIUS = 0.5`), so physical
thickness is ~0.0005 — refraction is invisible.
**Fix:** `thickness` is **art direction, not measurement**. Start ~0.05–0.25 and tune by eye. Comment it
as such so nobody "corrects" it later. Note it is in world units *after* the mesh's own scale — and the
strip's `scale.y` is animated by payout length, so verify thickness doesn't visibly change as tape
feeds out.


### 4. Tape doesn't refract through tape
**Cause:** transmissive objects are excluded from the transmission render target. The strip will not
show through the roll, overlapping wound layers won't stack, and two transmissive surfaces are mutually
blind.
**Fix:** make **one** surface family transmissive. Recommended order: the **strip first** (simplest
geometry, procedural maps already exist, full control), then evaluate the wound side. Fake layered
depth on the roll with a `thicknessMap` rather than real stacked transmissive shells.


### 5. Massive frame-time regression
**Cause:** transmission adds a **full extra scene render every frame**, sized off the drawing buffer —
which here can be 4096px tall at DPR 2.
**Fix:** set `renderer.transmissionResolutionScale` to ~0.5 (**verify the property exists in the pinned
`three@0.185` in `node_modules` — do not assume the API**). Measure frame time before and after and
report both numbers. Gate transmission off below a DPR/width threshold or behind
`prefers-reduced-motion` if it costs more than a few ms.


### 6. Looks fine in isolation, wrong on the page
**Cause:** `alpha: true` means transmissive pixels write alpha and composite over the DOM. A canvas-only
screenshot lies.
**Fix:** always verify against the real page, over the real background, at the real scroll positions.


### 7. Glassy label / wrong surface
**Cause:** GLB material names. `"Material"` is the **wound side** in this export; the face is separate.
**Fix:** enumerate `mesh.material.name` for the loaded GLB and log it before assigning anything. If the
label ever goes glassy, that's this.


### 8. Colour-space bug in new maps
**Cause:** copying the existing `mottleTex` pattern for a `thicknessMap` and leaving `SRGBColorSpace` on it.
**Fix:** colour maps are `SRGBColorSpace`; roughness / thickness / normal maps stay linear
(`NoColorSpace`). Check every texture you add.


### 9. A GLB-authored transmission silently vanishes
**Cause:** `toPhysical()` copies fields by hand and doesn't include transmission/thickness/ior/
attenuation. Also, three's GLTFLoader already returns `MeshPhysicalMaterial` when KHR extensions are
present, so the `as MeshStandardMaterial` casts become wrong.
**Fix:** if the GLB ever carries `KHR_materials_transmission`, extend `toPhysical()` **and** guard the
conversion with `instanceof MeshPhysicalMaterial`.


### 10. Dead, CG-looking glass
**Cause:** transmission with no environment has nothing to reflect.
**Fix:** per-material `envMap` from a small PMREM (`RoomEnvironment` or a tiny generated gradient),
low `envMapIntensity`. Never `scene.environment` (constraint 2). If it still reads dead, the missing
ingredient is almost always **flaws**, not more reflection.


### 11. Hollow roll
**Cause:** if the wound side becomes see-through, you look into the roll — and the GLB may be a single
shell with no inner wall or core.
**Fix:** inspect the geometry before making the roll transmissive. If it's hollow, either keep the roll
opaque (strip-only transmission) or add a simple inner core cylinder.


### 12. `transparent: true` + `transmission` double-dip
**Cause:** setting both, plus `opacity`, is a common miscombination — transmission already moves the
material into its own pass.
**Fix:** drive translucency with `transmission` alone. Leave `opacity` at 1. Be aware `side:
DoubleSide` on the strip means back faces contribute too — doubled Fresnel on the edges.


### 13. StrictMode leak
**Cause:** new textures/render targets not added to the dispose sweep.
**Fix:** add them. Verify by mounting/unmounting twice and checking `renderer.info.memory`.


---


## THE FLAWS — where the realism actually lives


A clean transmissive surface reads as CG acrylic. Author these as procedural `CanvasTexture`s in the
existing `mottleTex`/`toothTex` idiom, each behind its own zero-able knob:


- **Smudge / adhesive haze** on `roughnessMap` — biggest single win. Broad, low-frequency, subtle.
- **Micro-bubbles in the adhesive** — sparse speckle in roughness *and* normal. This is the specific
 tell that says "sticky tape" rather than "plastic sheet". Deterministic seed so the look is stable
 across reloads.
- **Hairline scratches / stretch creases** on the normal map — few, long, mostly along the draw
 direction (which the existing `TURN_STRIP` / `TURN_WOUND` anisotropy convention already encodes).
- **Uneven thickness** via `thicknessMap` — thicker at the wound edges, thinner mid-span. Also the way
 to fake layer depth on the roll (see error 4).
- **Edge irregularity** — the slit edge of real tape is very slightly wavy, and the `END` tear already
 proves this project's appetite for that kind of detail.


Density matters more than variety: too much and it reads as dirty film, not tape. Keep every one of
these under a single master knob so the whole flaw set can be dialled 0→1 in one number.


---


## STARTING VALUES (tune from here, don't treat as targets)


```
transmission        0.85–0.95   // translucent, not invisible
thickness           0.05–0.25   // art-directed (error 3)
ior                 1.5         // BOPP/PET tape is ~1.46–1.55
roughness           0.10–0.30   // 0.08 glossy cello, 0.3 matte "invisible" tape
attenuationColor    the roll's own wound-side colour
attenuationDistance 0.4–0.8
clearcoat           keep the existing FILM.GLAZE relationship
```


Existing knobs interact — `FILM.GLOSS`, `FILM.TOOTH`, `FILM.GLAZE`, `FILM.METAL`, `LIGHT.POWER`,
`FACE_LIGHT.POWER`. Read their comments before changing any of them; several document traps
(e.g. `TOOTH` above ~0.5 turns one highlight into glitter, `GLAZE` compounds with a low base roughness
into plastic).


---


## PLAN OF WORK


1. **Read first, write second.** `heroTape.ts` in full, plus `engine.ts`, `hero.css`, and the three
  version in `node_modules/three/package.json`. Confirm every API you intend to use exists in 0.185.
2. **Decide the backdrop strategy (error 1) and say so before writing code.** Everything else depends
  on it.
3. **Strip only.** Add a `GLASS` const block (zero-able), make the dispensed strip translucent, verify.
4. **Flaws.** Extend the procedural maps. Verify.
5. **Roll wound side** — only if step 3 looks right and the geometry survives error 11.
6. **Perf pass.** Measure, set resolution scale, gate for low-end.
7. **Never the printed label.**


Stop and show me the result after step 3 and after step 4. Do not run the whole plan silently.


---


## VERIFICATION PROTOCOL


- **Headless only.** `playwright-core` is already a devDependency and `glb-test-shots/` is the existing
 precedent. **Never launch my visible Chrome to check work.**
- Verify **the way I will see it**: load the page, scroll down **once, at human pace**, capture along
 the way. Do not scroll past and back to frame a flattering shot.
- Capture at minimum: rest pose, mid-turn, fully side-on with tape paid out, and one mobile viewport.
- Report frame time before and after, honestly. If it regressed, say so with numbers.
- Include a screenshot with the master flaw knob at 0 for A/B against today's look.


---


## ACCEPTANCE


- [ ] You can see a hint of what's behind the tape — translucent, not glass, not fogged.
- [ ] The edge bends light. Visible, subtle, not a fisheye.
- [ ] Surface flaws read as tape at hero size, and vanish at 0.
- [ ] The printed label is untouched and still saturated.
- [ ] `NoToneMapping` and `scene.environment` unchanged.
- [ ] Every knob zero-able, back to today's exact look.
- [ ] `tune()` re-applies everything; live-tweak comments in the file's existing voice.
- [ ] No StrictMode leak; frame time reported.
- [ ] Mobile fallback decided and documented.


## ROLLBACK


One `GLASS.AMOUNT = 0` (or equivalent single master knob) must fully restore the current look without
a rebuild. If it can't, the change isn't finished.


---


## ASK ME BEFORE ASSUMING


- Which backdrop strategy, if the trade-off isn't clear from the render.
- Whether the headline type should actually distort through the tape (option 1c — much bigger job).
- Whether this applies to the TapeSlider key visual (`src/components/TapeSlider/tape3d.ts`) too, or
 hero only. **Default: hero only.**



