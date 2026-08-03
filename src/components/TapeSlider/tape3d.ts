/* The key visual's 3D stage.
 *
 * Deliberately separate from the engine so three.js ships as its own chunk:
 * the engine imports this module dynamically after mount, and until the
 * import resolves — or if it never does — the server-rendered <img> keeps the
 * slot. Everything three-specific lives here; the engine only ever calls
 * ready()/show()/spin().
 *
 * Every model loads up front and stays resident in the scene, one flip group
 * per tape, only the active one visible. The flip's midpoint handoff needs
 * the incoming model on the exact frame it is asked for, so there is nothing
 * to lazy-load at selection time.
 */
import {
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const FOV = 35;
/* The rolls are exported at diameter ~1.0. The stylesheet oversizes the
   canvas to 130% of the slot, and this distance is derived from that pair:
   the face-on roll spans 1/1.3 of the canvas — exactly the slot, matching
   the flat card it replaced — while the flip's wider mid-swing lands in the
   bleed instead of clipping. 2 * (z - depth/2) * tan(FOV/2) = 1.3. */
const CAMERA_Z = 2.3;
/* The Blender exports point the label face up (+Y). Tip it at the camera. */
const FACE_FORWARD = -Math.PI / 2;
const DPR_CAP = 2;

export type TapeViewer = {
  /** True once this model is resident and can be flipped to. */
  ready(url: string): boolean;
  /** Make this model the visible one. Keeps whatever spin it already has. */
  show(url: string): void;
  /** Rotation of the visible model about the flip axis, in degrees. */
  spin(deg: number): void;
  dispose(): void;
};

export function createTapeViewer(
  container: HTMLElement,
  urls: string[]
): Promise<TapeViewer> {
  const scene = new Scene();

  const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  camera.position.set(0, 0, CAMERA_Z);

  // alpha: the canvas sits over the colour sheet, which stays the background.
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  // No tone mapping and no environment map, deliberately: both exist to make
  // photoreal scenes filmic, and both drag saturated flat artwork toward
  // pastel. This page is flat art — the label must leave the renderer at the
  // texture's own colour.
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);

  /* Ambient at ~pi is the Lambertian identity for a standard material — a
     camera-facing surface comes out at almost exactly its albedo, i.e. the
     artwork as authored. Held a touch under so the directional can add shape
     to the rim and side without pushing the face past the artwork. */
  const dir = new DirectionalLight(0xffffff, 0.7);
  dir.position.set(2, 3, 4);
  scene.add(dir, new AmbientLight(0xffffff, Math.PI * 0.82));

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

  let raf = requestAnimationFrame(function loop() {
    raf = requestAnimationFrame(loop);
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera);
  });

  const groups = new Map<string, Group>();
  let active: Group | null = null;

  function teardown() {
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
    renderer.dispose();
    canvas.remove();
  }

  const loader = new GLTFLoader();
  const jobs = urls.map(
    (url) =>
      new Promise<void>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => {
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
            scene.add(flip);
            groups.set(url, flip);
            resolve();
          },
          undefined,
          reject
        );
      })
  );

  return Promise.all(jobs).then(
    () => {
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
