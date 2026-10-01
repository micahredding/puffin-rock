// The side-on camera, and the browser shell around it.
//
// The caterpillar's rig is a dolly a finger trucks along a shelf. Here the
// camera belongs to Oona: it looks straight into the island, never tilts, and
// slides after her — a little ahead of where she is facing, so she can see
// where she is going. Looking straight on is what keeps the layers flat and
// parallel like the show's; sliding past them is what makes them parallax.
//
// Pure pointer math (`ndc`, `castFrom`, `pickRoot`, `onStage`) is shared by
// the browser handlers and the tests. `createStage` is the renderer, the loop
// and WebGL context-loss recovery, the same as every 3D game here: iPad Safari
// kills a backgrounded tab's context and a child cannot be told to reload.

import * as THREE from './three.js';
import { CAM_Z } from './shapes.js';
import { X_MIN, X_MAX } from './ground.js';

export const CAM = { fov: 30, aspect: 1.6 };
export const LEAD = 1.4;          // how far ahead of her the camera looks
export const LIFT = 1.75;         // how far above her feet the middle of the screen is

// Hold the designed WIDTH on a narrow screen (an iPad upright) and let the
// sky and ground grow instead, or portrait amputates the island.
export function fovFor(aspect) {
  if (aspect >= CAM.aspect) return CAM.fov;
  const hHalf = Math.atan(Math.tan((CAM.fov * Math.PI) / 360) * CAM.aspect);
  return (2 * Math.atan(Math.tan(hHalf) / aspect) * 360) / (2 * Math.PI);
}

// Half the width of the stage in view, in world units at z = 0.
export function halfWidth(camera) {
  return Math.tan((camera.fov * Math.PI) / 360) * camera.aspect * CAM_Z;
}

export function halfHeight(camera) {
  return Math.tan((camera.fov * Math.PI) / 360) * CAM_Z;
}

export function makeCamera(aspect = 16 / 10) {
  const cam = new THREE.PerspectiveCamera(fovFor(aspect), aspect, 0.5, 200);
  cam.position.set(0, LIFT, CAM_Z);
  cam.updateMatrixWorld(true);
  return cam;
}

// Where the camera wants to be for a bird at (x, y) facing `facing`. Clamped
// so the island's ends are ends, not the edge of nothing.
export function aimFor(camera, x, y, facing = 1, flying = false, diving = false, bounds = null) {
  const hw = halfWidth(camera);
  // The island's ends, or a room's (the tunnels have their own).
  const lo = (bounds ? bounds[0] : X_MIN - 3) + hw, hi = (bounds ? bounds[1] : X_MAX + 5) - hw;
  const cx = Math.min(hi, Math.max(lo, x + facing * LEAD));
  // In the air she drifts up the screen before the camera follows, so a flap
  // looks like going UP; on the ground she sits in the lower middle.
  // Under the sea the camera goes down with her, keeping her a little below
  // the middle, so the surface she will float back up to stays in view.
  let cy = diving ? y + 1.1 : flying ? Math.max(y + LIFT - 1.6, y - 0.6) + 0.9 : y + LIFT;
  // Upright, the screen is taller than the island needs: spend the extra on
  // sky, not on a wall of ground under her feet.
  cy += Math.max(0, halfHeight(camera) - halfHeight({ fov: CAM.fov })) * 0.75;
  return { x: cx, y: cy };
}

export function placeCamera(camera, x, y, z = CAM_Z) {
  camera.position.set(x, y, z);
  camera.updateMatrixWorld(true);
}

// ---- pure pointer math --------------------------------------------------------

export function ndc(clientX, clientY, rect) {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((clientY - rect.top) / rect.height) * 2 - 1),
  };
}

export function castFrom(camera, n, objects) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(n.x, n.y), camera);
  return ray.intersectObjects(objects, true);
}

// Where on the stage (z = 0) a tap lands: that is where she walks to.
export function onStage(camera, n) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(n.x, n.y), camera);
  const out = new THREE.Vector3();
  return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), out) ? out : null;
}

export function pickRoot(obj) {
  for (let o = obj; o; o = o.parent) if (o.userData.pick) return o;
  return null;
}

// ---- the browser shell ----------------------------------------------------------

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe2eadf);
  const camera = makeCamera();

  function fit() {
    const w = Math.floor(visualViewport?.width || innerWidth);
    const h = Math.floor(visualViewport?.height || innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = fovFor(camera.aspect);
    camera.updateProjectionMatrix();
  }
  fit();
  addEventListener('resize', fit);
  addEventListener('orientationchange', fit);
  visualViewport?.addEventListener('resize', fit);

  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());

  const frameCbs = [];
  let last = null, reported = false;
  renderer.setAnimationLoop((t) => {
    const dt = last === null ? 1 / 60 : Math.min(0.05, (t - last) / 1000);
    last = t;
    // One bad frame must never freeze the island: a child cannot open the
    // console. Report it once (to the page's own error handler) and carry on.
    for (const cb of frameCbs) {
      try { cb(t / 1000, dt); } catch (e) { if (!reported) { reported = true; setTimeout(() => { throw e; }); } }
    }
    renderer.render(scene, camera);
  });
  return { renderer, scene, camera, onFrame: (cb) => frameCbs.push(cb) };
}

// A finger, or a mouse. Down on a named thing and up again without wandering
// is a TAP on that thing. Anything else is the finger on the island: down says
// where it is, moving drags that spot along, up lets go. Tapping the sky and
// tapping the ground are told apart by the game, not here.
export function attachPointer(canvas, camera, { pickables, onTap, onPress, onDrag, onRelease }) {
  const downs = new Map();
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const n = ndc(e.clientX, e.clientY, rect);
    const hit = castFrom(camera, n, pickables())[0];
    const root = hit ? pickRoot(hit.object) : null;
    canvas.setPointerCapture?.(e.pointerId);
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, root, moved: false });
    if (!root) onPress?.(onStage(camera, n), n);
  });
  canvas.addEventListener('pointermove', (e) => {
    const d = downs.get(e.pointerId);
    if (!d) return;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 10) d.moved = true;
    if (!d.root) {
      const n = ndc(e.clientX, e.clientY, canvas.getBoundingClientRect());
      onDrag?.(onStage(camera, n), n);
    }
  });
  const finish = (e) => {
    const d = downs.get(e.pointerId);
    if (!d) return;
    downs.delete(e.pointerId);
    if (d.root) {
      // A tap that wandered off its thing is still a walk toward it.
      onTap?.(d.root, d.moved);
    } else onRelease?.();
  };
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
}
