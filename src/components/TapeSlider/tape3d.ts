/* The key visual's 3D stage.
 *
 * Deliberately separate from the engine so three.js ships as its own chunk:
 * the engine imports this module dynamically after mount, and until the
 * import resolves — or if it never does — the server-rendered <img> keeps the
 * slot. Everything three-specific lives here; the engine only ever calls
 * ready()/show()/spin().
 *
 * Every model ends up resident in the scene, one flip group per tape, only the
 * active one visible — the flip's midpoint handoff needs the incoming model on
 * the exact frame it is asked for, so nothing is loaded AT selection time.
 *
 * They do not all arrive at once, though. The selected tape's model is what the
 * viewer waits for; the rest stream in behind it, one at a time. See the note
 * above the loader for why, and for the fallback that covers a selection made
 * before its model has landed.
 */
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  type Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const FOV = 35;
/* Mouse parallax. Applied to the stage the flip groups hang off — NOT to the
   models themselves, whose rotation.y is the flip's and only the flip's. The
   two compose instead of fighting: the roll can be halfway through a swap and
   still lean with the cursor, and because every model shares the one stage,
   the pair either side of the edge-on handoff is leaning identically at the
   frame it happens — so the handoff stays invisible however far the tilt is
   from home.

   The signs read as a camera that moves with the pointer rather than an object
   that follows it: cursor right shows more of the roll's right side and slides
   it left, which is what the eye expects from a thing sitting in a scene. */
const MAX_YAW = 0.3; // rad at full deflection, ~17deg
const MAX_PITCH = 0.2; // ~11deg; less than the yaw, as a head moves less vertically
/* World units — the roll is ~1.0 across inside a canvas 1.3 wide, so there is
   0.15 of margin each side and the yaw's own foreshortening gives a little
   back. Held under that: past it the roll starts clipping at full deflection. */
const SHIFT_X = 0.09;
const SHIFT_Y = 0.065;
/* Response rate in 1/s for the chase below. High enough to feel attached to the
   cursor, low enough that the roll has weight and keeps drifting for a beat
   after the pointer stops. */
const TILT_EASE = 5;
/* Below this share of full deflection the remaining travel is under a tenth of
   a degree — take it in one step rather than render a tail nobody can see. */
const TILT_EPS = 0.001;
/* The rolls are exported at diameter ~1.0. The stylesheet oversizes the
   canvas to 130% of the slot, and this distance is derived from that pair:
   the face-on roll spans 1/1.3 of the canvas — exactly the slot, matching
   the flat card it replaced — while the flip's wider mid-swing lands in the
   bleed instead of clipping. 2 * (z - depth/2) * tan(FOV/2) = 1.3. */
const CAMERA_Z = 2.3;
/* The Blender exports point the label face up (+Y). Tip it at the camera. */
const FACE_FORWARD = -Math.PI / 2;
const DPR_CAP = 2;

/* THE LIGHTING, and why it is an argument rather than three constants.
 *
 * This viewer was written for one stage — the slider's, where the roll stands
 * on a saturated field at full brightness — and its numbers are tuned for it:
 * ambient near pi so a camera-facing surface leaves the renderer at almost
 * exactly the artwork's own colour, with a single directional adding just
 * enough shape to the rim not to push the label past it. That is the right
 * balance THERE and it is documented at the lights themselves.
 *
 * It was opened up for a stage that no longer exists: the product page's origin
 * section used to build a viewer of its own with the roll turned thirty degrees
 * on the site's DARK green, and a wound side — one broad, evenly-curved,
 * untextured surface — lit for a bright stage comes out as a flat tan slab.
 * There is nothing in the scene for it to be shaded AGAINST, because ambient
 * that high leaves almost no gradient across a cylinder, and the one directional
 * is placed to catch a face rather than a flank. That section shows the SLIDER'S
 * roll now (see ProductIntro/roll.ts), so nobody passes a key, an ambient or a
 * fill today — and that was the state of this seam for a while: an argument with
 * no caller.
 *
 * IT HAS ONE NOW, AND IT IS ENV. The product page takes the slider's key and
 * ambient verbatim and asks for a room on top, because the roll it opens with
 * has metalness on its label and no environment means no label. That is the one
 * thing here that is not a matter of taste — see `env` below.
 *
 * The rest of the seam is kept because the next stage that wants one will want
 * it for the same reason, and because it costs nothing: the defaults below ARE
 * the slider's, exactly, so passing nothing gets the behaviour this file has
 * always had. FILL and ENV in particular are only BUILT when asked for, so a
 * scene that does not ask gains neither a light nor a room it never had.
 */
export type ViewerLight = {
  /** The key. Shape on the rim and the side. */
  key?: number;
  /** Flat, directionless base, in units of pi — 1 leaves a surface at albedo. */
  ambient?: number;
  /** A second directional from the far side, to model a curved flank. 0 = off. */
  fill?: number;
  /**
   * ROOM LIGHT — an image-based environment, as scene.environmentIntensity.
   * 0 = off, and off is the default for the reason spelled out at the renderer.
   *
   * WHAT IT IS FOR, and it is one thing: A MATERIAL WITH METALNESS ON IT HAS
   * NOTHING TO REFLECT IN A SCENE OF BARE LIGHTS. Metal has no diffuse — its
   * colour IS its reflection — so on a stage with nothing in it, the metallic
   * share of a surface comes out BLACK and the surface renders at roughly
   * (1 - metalness) of the artwork. That is not a look, it is a missing input,
   * and no amount of key or ambient fixes it: those two feed the diffuse term
   * the metal has already given up.
   *
   * WHICH IS NOT HYPOTHETICAL HERE. Of the exports in /assets/tapes only
   * header-brown.glb has one — its label face, "Face Brown", at metalness 0.55
   * — and it is the roll the OPP product page opens with. Every other tape is
   * fully dielectric and renders the same with this on or off, which is why
   * this is a switch rather than a change to the defaults.
   *
   * THE ROOM IS three's OWN RoomEnvironment — the addon studio box, a handful
   * of emissive planes, no texture to fetch — pre-filtered once through
   * PMREMGenerator into a small cube map. It costs one dynamic import, one
   * render into an offscreen target at build time, and nothing per frame.
   *
   * AND IT IS DELIBERATELY NOT A LOOK. Turned up it does what environment maps
   * always do to flat art — reflections and a general lift that drag saturated
   * colour toward pastel. It is set to the level that returns the metal face to
   * the artwork's own brightness and no further; see ROOM at the product page's
   * call site, which is the only caller that asks for it.
   */
  env?: number;
};

const LIGHT: Required<ViewerLight> = { key: 0.7, ambient: 0.82, fill: 0, env: 0 };

/* THE FINISH — what a surface is made of, as opposed to what is shining on it.
 *
 * WHY THIS IS SEPARATE FROM ViewerLight ABOVE. The lights are the STAGE and this
 * is the OBJECT, and the two are not the same argument even though they arrive
 * together and end up in the same picture. A page that wants a softer key is
 * saying something about its own room; a page that wants the label less glossy
 * is saying the export is wrong for the size it is being shown at. Mixing them
 * into one bag makes the second look like a lighting preference, which is how
 * you end up lighting around a material instead of fixing it.
 *
 * KEYED BY THE GLB'S OWN MATERIAL NAMES, which come through the loader intact
 * and are the names in Blender: "Tape" (the wound side), "Tape Inner", "Core",
 * "white", and the label face, which is named per export — "Face Brown" on the
 * OPP roll, "Face Red" on the stationery one. `*` is every material in the
 * model, applied before any name, so a whole-roll change is one line.
 *
 *   { "*": { roughness: 0.6 }, "Face Brown": { metalness: 0 } }
 *
 * A name that is not in the model is silently ignored, on purpose: the six
 * exports do not share a label-material name, and a viewer handed all six should
 * not fall over because five of them have no "Face Brown".
 *
 * WHEN TO USE THIS AND WHEN TO RE-EXPORT. This is for the numbers — metalness,
 * roughness, the base tint — which are one line here and a Blender round trip
 * otherwise, and which are exactly what wants trying at four different values
 * before one of them is right. Anything structural — different maps, a finish
 * that varies across a surface, geometry — belongs in the file. See `modelInner`
 * in src/data/tapes.ts, which is the seam for that.
 *
 * AND IT IS APPLIED ONCE, AT LOAD, not per frame: these are properties of the
 * material, and the material is built when the model lands.
 */
export type MaterialFinish = {
  /** 0 = plastic, 1 = metal. Metal has no diffuse — see `env` above. */
  metalness?: number;
  /** 0 = mirror, 1 = fully matte. The "gloss" dial, inverted. */
  roughness?: number;
  /** Multiplied INTO the artwork, so anything but white darkens or tints it. */
  colour?: string;
};

/** Per-material overrides, keyed by the GLB's material name. `*` = all of them. */
export type MaterialFinishes = Record<string, MaterialFinish>;

export type TapeViewer = {
  /** True once this model is resident and can be flipped to. */
  ready(url: string): boolean;
  /** Make this model the visible one. Keeps whatever spin it already has. */
  show(url: string): void;
  /** Rotation of the visible model about the flip axis, in degrees. */
  spin(deg: number): void;
  /** Where the pointer is, as -1..1 either side of the roll's centre. The
   *  lean is eased toward it internally, so this may be called raw. */
  point(nx: number, ny: number): void;
  dispose(): void;
};

export function createTapeViewer(
  container: HTMLElement,
  urls: string[],
  light?: ViewerLight,
  finish?: MaterialFinishes
): Promise<TapeViewer> {
  const lit = { ...LIGHT, ...light };
  const scene = new Scene();

  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  camera.position.set(0, 0, CAMERA_Z);

  // alpha: the canvas sits over the colour sheet, which stays the background.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  // No tone mapping, deliberately: it exists to make photoreal scenes filmic
  // and it drags saturated flat artwork toward pastel. This page is flat art —
  // the label must leave the renderer at the texture's own colour. The
  // environment map used to be refused on the same line and for the same
  // reason; it is now off BY DEFAULT and available on request, because a model
  // with metalness on it does not render at all without one. See `env` in
  // ViewerLight, and the block below.
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);

  /* Ambient at ~pi is the Lambertian identity for a standard material — a
     camera-facing surface comes out at almost exactly its albedo, i.e. the
     artwork as authored. Held a touch under so the directional can add shape
     to the rim and side without pushing the face past the artwork. */
  const dir = new DirectionalLight(0xffffff, lit.key);
  dir.position.set(2, 3, 4);
  scene.add(dir, new AmbientLight(0xffffff, Math.PI * lit.ambient));

  /* The fill, and it is only built when it is asked for — an unused light is
     still a light every material has to be shaded against. Placed opposite and
     BELOW the key rather than mirroring it: what it is there to do is put a
     gradient across the wound side's curve, and a second light at the key's own
     height simply flattens the cylinder from the other direction. */
  if (lit.fill > 0) {
    const back = new DirectionalLight(0xffffff, lit.fill);
    back.position.set(-3, -0.5, 2);
    scene.add(back);
  }

  /* THE ROOM, and like the fill it is only built when it is asked for — see
     `env` in ViewerLight for what it is there to do.
     DYNAMICALLY IMPORTED, so the addon and the room's own geometry stay out of
     the three chunk for every caller that does not ask: the slider mounts this
     viewer six models at a time and wants none of it. It resolves alongside the
     first model rather than before it (see the return below), which costs the
     first frame nothing — the room is a few emissive planes and the fetch is
     already in the same chunk graph as the loader.
     Held so teardown can release it: a PMREM target is a cube render target and
     it does not go away with the renderer. */
  let envTex: Texture | null = null;
  const room =
    lit.env > 0
      ? import("three/addons/environments/RoomEnvironment.js")
          .then(({ RoomEnvironment }) => {
            /* gone: an import that lands after dispose has a renderer whose
               context is already released, and generating into it throws. */
            if (gone) return;
            const pmrem = new PMREMGenerator(renderer);
            const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
            /* The blur is 0.04 rather than 0 for the same reason the wound side
               gets full anisotropy: a sharp room puts the studio's own panel
               edges on the label as reflections. Blurred, it is a light source
               instead of a scene. */
            pmrem.dispose();
            scene.environment = tex;
            /* Intensity rather than a brighter room: it is the one number that
               says how much of the metal face's colour comes from here, and it
               is set at the call site. */
            scene.environmentIntensity = lit.env;
            envTex = tex;
            dirty = true;
          })
          /* A room that will not load must not take the roll down with it. The
             metal face comes out dark, which is exactly what it was before this
             existed, and every other tape is unaffected. */
          .catch(() => {})
      : null;

  const canvas = renderer.domElement;
  // Arrives invisible and fades up once the first real frame has been
  // presented, so loading reads as empty slot -> roll easing in, not a pop.
  canvas.style.opacity = "0";
  canvas.style.transition = "opacity 0.35s ease";
  container.appendChild(canvas);

  /* Render only when something changed. The scene is static between
     selections, and the page already runs Lenis and GSAP tickers — a fixed
     60fps render of a still frame would be pure heat. */
  let dirty = true;

  function size() {
    // The canvas's own box, not the container's — the stylesheet oversizes
    // it past the slot so the mid-flip swing has bleed to land in.
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    // updateStyle false: the stylesheet owns the canvas box; three only sizes
    // the drawing buffer.
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const ro = new ResizeObserver(size);
  ro.observe(container);
  size();

  /* Every flip group hangs off this one, so the pointer lean is a single
     transform above all of them rather than something each model has to carry.
     See MAX_YAW above for why that matters to the flip. */
  const stage = new Group();
  scene.add(stage);

  const to = { x: 0, y: 0 }; // where the pointer is
  const at = { x: 0, y: 0 }; // where the ease has got to

  /* Exponential chase, frame-rate independent: the same fraction of the
     remaining distance is covered per second whatever the frame time. Returns
     whether anything actually moved, so a still pointer costs no render. */
  function lean(dt: number) {
    const k = 1 - Math.exp(-TILT_EASE * dt);
    let x = at.x + (to.x - at.x) * k;
    let y = at.y + (to.y - at.y) * k;
    if (Math.abs(to.x - x) < TILT_EPS) x = to.x;
    if (Math.abs(to.y - y) < TILT_EPS) y = to.y;
    if (x === at.x && y === at.y) return false;
    at.x = x;
    at.y = y;
    stage.rotation.y = x * MAX_YAW;
    stage.rotation.x = -y * MAX_PITCH;
    // Opposite the rotation: a camera that steps right sees more of the right
    // side AND finds the subject further left in frame.
    stage.position.x = -x * SHIFT_X;
    stage.position.y = y * SHIFT_Y;
    return true;
  }

  let prev = 0;
  let raf = requestAnimationFrame(function loop(now) {
    raf = requestAnimationFrame(loop);
    // A backgrounded tab resumes with a huge gap; clamp it or the roll snaps.
    const dt = prev ? Math.min((now - prev) / 1000, 0.1) : 0;
    prev = now;
    if (dt && lean(dt)) dirty = true;
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  });

  const groups = new Map<string, Group>();
  let active: Group | null = null;

  function teardown() {
    gone = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    });
    /* The room's cube target, which the traverse above cannot reach — it hangs
       off the scene rather than off a mesh, and it outlives the renderer. */
    envTex?.dispose();
    envTex = null;
    scene.environment = null;
    renderer.dispose();
    canvas.remove();
  }

  const loader = new GLTFLoader();

  /* Set by teardown, checked by every background load still in flight. A model
     that lands after dispose has a scene to add itself to and a renderer that
     has already released its context — the group would be retained by a Map
     nobody reads, holding its textures off the collector. */
  let gone = false;

  const add = (url: string) =>
    new Promise<void>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          if (gone) return resolve();
          {
            const model = gltf.scene;
            /* Full anisotropy on every map, or the wound side's weave
               collapses to its flat grey mip average wherever the surface
               grazes the view — a grey sheet along the rim mid-flip on real
               GPUs. */
            const maxAniso = renderer.capabilities.getMaxAnisotropy();
            model.traverse((o) => {
              if ((o as Mesh).isMesh) {
                const mat = (o as Mesh).material as MeshStandardMaterial;
                if (mat.map) {
                  mat.map.anisotropy = maxAniso;
                  mat.map.needsUpdate = true;
                }
                /* THE FINISH, BEFORE THE ROOM, and the order is the point: an
                   override that sets metalness to 0 must be seen by the line
                   below, or the material would keep an environment it no longer
                   has any use for. Every knob a caller can turn is turned here,
                   and everything after it reads the result rather than the
                   export. `*` first so a named material can contradict it. */
                for (const key of ["*", mat.name]) {
                  const f = finish?.[key];
                  if (!f) continue;
                  if (f.metalness !== undefined) mat.metalness = f.metalness;
                  if (f.roughness !== undefined) mat.roughness = f.roughness;
                  if (f.colour !== undefined) mat.color.set(f.colour);
                }

                /* THE ROOM IS FOR THE METAL AND NOTHING ELSE.
                   scene.environment lights every material in the scene, and on
                   this model that is the wrong answer for five of the six: the
                   rim, the wound side, the core and the two flat colours are
                   fully dielectric, already render at the artwork's own colour
                   off key and ambient, and only get washed out by a second
                   source. Only the face has metalness — see `env` above — and
                   only the face has a hole the room is filling.
                   So the room is switched off per material rather than dialled
                   down globally: a dial low enough to leave the flank alone is
                   too low to bring the face back, and the two cannot be
                   traded off against each other. Anything metal takes it in
                   full and the intensity is set once, at the scene. */
                if (lit.env > 0) mat.envMapIntensity = mat.metalness > 0 ? 1 : 0;
              }
            });
            // Centre on the geometry, not the export's origin — the flip has
            // to pivot through the middle of the roll.
            const centre = new Box3().setFromObject(model).getCenter(new Vector3());
            model.position.sub(centre);

            const inner = new Group();
            inner.rotation.x = FACE_FORWARD;
            inner.add(model);

            const flip = new Group(); // spin() turns this
            flip.add(inner);
            flip.visible = false;
            stage.add(flip);
            groups.set(url, flip);
          }
          resolve();
        },
        undefined,
        reject
      );
    });

  /* THE FIRST ONE IS THE ONLY ONE ANYONE IS WAITING FOR.
   *
   * This used to be Promise.all over every url, so the viewer did not exist —
   * and the slot stayed empty — until the last of six models had landed.
   * Together they are about 15MB, and they were all in flight at once, so they
   * were also competing with each other and with everything else the page still
   * wanted. The roll you were actually looking at was held up by five you were
   * not.
   *
   * The engine passes the SELECTED tape first (see createTapeViewer's call
   * site), so what resolves this is the model on screen. The rest follow one at
   * a time rather than in parallel: they are a prefetch for a click that has not
   * happened yet, and six simultaneous multi-megabyte fetches are the thing this
   * change exists to stop.
   *
   * WHAT MAKES IT SAFE is that residency was already a question the engine asks.
   * addCard checks viewer.ready(model) before it commits to the 3D flip and
   * falls back to swapping the flat card otherwise — a path that existed for the
   * chunk-still-loading case and was simply never reached before, because every
   * model was always resident by the time the viewer existed. It is reached now,
   * and it is the same fallback.
   *
   * A background failure is swallowed. One model that will not load should cost
   * its own tape the 3D roll, not take down the stage and the five that work —
   * unlike the first, whose failure means there is nothing to show at all. */
  const [lead, ...rest] = urls;

  /* The room joins the wait, so a viewer that asked for one is not handed back
     before it has it — the alternative is the roll fading up unlit and
     brightening a frame later, which is the pop the fade exists to prevent. It
     cannot fail the viewer: `room` has already swallowed its own errors. */
  return Promise.all([add(lead), room]).then(
    () => {
      let queue = Promise.resolve();
      for (const url of rest) {
        queue = queue.then(() => (gone ? undefined : add(url).catch(() => {})));
      }

      // The engine's show()/spin() land in this same microtask turn, so the
      // next animation frame presents the model — fade up on that frame.
      requestAnimationFrame(() => (canvas.style.opacity = "1"));
      return {
      ready: (url: string) => groups.has(url),

      show(url: string) {
        const next = groups.get(url);
        if (!next || next === active) return;
        if (active) active.visible = false;
        next.visible = true;
        active = next;
        dirty = true;
      },

      spin(deg: number) {
        if (!active) return;
        active.rotation.y = (deg * Math.PI) / 180;
        dirty = true;
      },

        point(nx: number, ny: number) {
          // Clamped here rather than at the call site: the caller's normalising
          // depends on where the roll sits, this range does not.
          to.x = Math.max(-1, Math.min(1, nx));
          to.y = Math.max(-1, Math.min(1, ny));
          // No dirty flag — the loop's ease raises it as soon as it moves.
        },

        dispose: teardown,
      };
    },
    (e) => {
      // A failed load must not leak the context it was going to draw into.
      teardown();
      throw e;
    }
  );
}
