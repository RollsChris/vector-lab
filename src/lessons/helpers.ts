import * as THREE from "three";
import type { Fn1 } from "../math/expr";
import type { Viewport } from "../core/Viewport";

/**
 * Let the user drag a set of handle objects across the z=0 plane (for flat 2D lessons
 * viewed head-on). Orbit controls are paused while a handle is held so the camera doesn't
 * fight the drag. `onDrag(index, point)` receives the handle's index and the raw plane
 * point; the caller decides any constraint (e.g. snap onto a circle). Returns a disposer.
 */
export function createDragControls(
  viewport: Viewport,
  handles: THREE.Object3D[],
  onDrag: (index: number, point: THREE.Vector3) => void,
): () => void {
  const dom = viewport.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  let active = -1;

  const toNdc = (e: PointerEvent): void => {
    const rect = dom.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };

  const onDown = (e: PointerEvent): void => {
    toNdc(e);
    raycaster.setFromCamera(ndc, viewport.camera);
    const hits = raycaster.intersectObjects(handles, false);
    if (hits.length === 0) return;
    active = handles.indexOf(hits[0].object);
    if (active < 0) return;
    viewport.controls.enabled = false;
    dom.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent): void => {
    if (active < 0) return;
    toNdc(e);
    raycaster.setFromCamera(ndc, viewport.camera);
    if (raycaster.ray.intersectPlane(plane, hit)) onDrag(active, hit.clone());
  };

  const onUp = (e: PointerEvent): void => {
    if (active < 0) return;
    active = -1;
    viewport.controls.enabled = true;
    try {
      dom.releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture may already be gone; ignore.
    }
  };

  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointermove", onMove);
  dom.addEventListener("pointerup", onUp);
  dom.addEventListener("pointerleave", onUp);

  return () => {
    dom.removeEventListener("pointerdown", onDown);
    dom.removeEventListener("pointermove", onMove);
    dom.removeEventListener("pointerup", onUp);
    dom.removeEventListener("pointerleave", onUp);
    viewport.controls.enabled = true;
  };
}

/** Build a polyline (in the XY plane, z=0) sampling y=f(x) over [a,b]. */
export function curveXY(
  f: Fn1,
  a: number,
  b: number,
  n: number,
  color: number,
): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const y = f(x);
    pts.push(new THREE.Vector3(x, Number.isFinite(y) ? y : 0, 0));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

/** Update an existing curve line in place (avoids per-frame allocations). */
export function updateCurveXY(
  line: THREE.Line,
  f: Fn1,
  a: number,
  b: number,
  n: number,
): void {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    const y = f(x);
    pts.push(new THREE.Vector3(x, Number.isFinite(y) ? y : 0, 0));
  }
  line.geometry.setFromPoints(pts);
}

/** A small sphere marker. */
export function marker(color: number, r = 0.12): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 24, 24),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 }),
  );
}

/** Map a scalar in [0,1] to a blue->green->red heat colour. */
export function heat(t: number): THREE.Color {
  const c = new THREE.Color();
  c.setHSL((1 - THREE.MathUtils.clamp(t, 0, 1)) * 0.66, 0.85, 0.55);
  return c;
}

/** A straight line segment between two points. */
export function segment(
  a: THREE.Vector3,
  b: THREE.Vector3,
  color: number,
): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

/** Update a segment's endpoints in place. */
export function updateSegment(
  line: THREE.Line,
  a: THREE.Vector3,
  b: THREE.Vector3,
): void {
  line.geometry.setFromPoints([a, b]);
}

/**
 * Build an arrow mesh in 3D from tail to tip. The shaft is a thin cylinder and the
 * head is a cone. Both share the same colour. The returned group is oriented so the
 * arrow points from `tail` to `tip`.
 */
export function arrow3D(
  tail: THREE.Vector3,
  tip: THREE.Vector3,
  color: number,
  shaftRadius = 0.04,
  headRadius = 0.12,
  headLength = 0.25,
): THREE.Group {
  const dir = new THREE.Vector3().subVectors(tip, tail);
  const len = dir.length();
  const tooShort = len < 1e-6;

  // Build the geometry with a non-degenerate length so the mesh children always
  // exist. A genuinely zero-length arrow is hidden until updateArrow gives it a
  // real direction.
  const buildLen = tooShort ? headLength * 2 : len;
  const buildDir = tooShort ? new THREE.Vector3(0, 1, 0) : dir.clone().normalize();

  const group = new THREE.Group();
  group.visible = !tooShort;
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });

  const shaftLen = Math.max(0, buildLen - headLength);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 16),
    mat,
  );
  shaft.position.set(0, shaftLen / 2, 0);
  shaft.castShadow = false;
  group.add(shaft);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(headRadius, headLength, 24),
    mat,
  );
  head.position.set(0, shaftLen + headLength / 2, 0);
  head.castShadow = false;
  group.add(head);

  group.position.copy(tail);
  group.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    buildDir,
  );
  group.userData.headLength = headLength;
  return group;
}

/** Build a 2D arrow in the z=0 plane (convenience wrapper around arrow3D). */
export function arrow2D(
  tail: THREE.Vector2,
  tip: THREE.Vector2,
  color: number,
  shaftRadius = 0.04,
  headRadius = 0.12,
  headLength = 0.25,
): THREE.Group {
  return arrow3D(
    new THREE.Vector3(tail.x, tail.y, 0),
    new THREE.Vector3(tip.x, tip.y, 0),
    color,
    shaftRadius,
    headRadius,
    headLength,
  );
}

/** Update an existing arrow group so it now runs from `tail` to `tip`. Reuses materials. */
export function updateArrow(
  arrow: THREE.Group,
  tail: THREE.Vector3,
  tip: THREE.Vector3,
): void {
  const headLength = (arrow.userData.headLength as number) ?? 0.25;
  const dir = new THREE.Vector3().subVectors(tip, tail);
  const len = dir.length();
  if (len < 1e-6 || arrow.children.length < 2) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;

  const [shaft, head] = arrow.children as [THREE.Mesh, THREE.Mesh];
  const shaftLen = Math.max(0, len - headLength);
  shaft.scale.y = shaftLen / ((shaft.geometry as THREE.CylinderGeometry).parameters.height ?? 1);
  shaft.position.y = shaftLen / 2;
  head.position.y = shaftLen + headLength / 2;

  arrow.position.copy(tail);
  arrow.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
}

/** Attach a native hover tooltip to a lil-gui controller's row. Returns it for chaining. */
export function tip<T>(controller: T, text: string): T {
  const dom = (controller as { domElement?: HTMLElement }).domElement;
  if (dom) dom.title = text;
  return controller;
}

/** A camera-facing text label rendered from a canvas (for in-scene annotations).
 * The canvas auto-widens to fit the text (min 256px) so longer strings — e.g. a full
 * conversion equation — never get clipped at a fixed 256px edge. */
export function textSprite(text: string, color = 0xffffff, scale = 0.8): THREE.Sprite {
  const h = 64;
  const font = "bold 40px system-ui, sans-serif";
  const w = measureTextWidth(text, font);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  sprite.scale.set(scale * (w / h), scale, scale);
  return sprite;
}

/** Update the text on a sprite made by textSprite (reuses the material, resizes the canvas). */
export function setSpriteText(sprite: THREE.Sprite, text: string, color = 0xffffff): void {
  const h = 64;
  const font = "bold 40px system-ui, sans-serif";
  const w = measureTextWidth(text, font);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  mat.map = tex;
  mat.needsUpdate = true;
  const scale = sprite.scale.y;
  sprite.scale.set(scale * (w / h), scale, scale);
}

let measureCtx: CanvasRenderingContext2D | undefined;

/** Canvas width (px) needed to fit `text` at `font`, padded, with a 256px floor. */
function measureTextWidth(text: string, font: string): number {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")!;
  measureCtx.font = font;
  return Math.max(256, Math.ceil(measureCtx.measureText(text).width) + 40);
}

