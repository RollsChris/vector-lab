import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type TickFn = (dt: number, elapsed: number) => void;

/**
 * Owns the renderer, camera, controls and the per-frame loop.
 * Lessons add their objects to `Viewport.world` and register `onTick` callbacks.
 */
export class Viewport {
  readonly scene = new THREE.Scene();
  readonly world = new THREE.Group(); // lessons mount/unmount their content here
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;

  private readonly clock = new THREE.Clock();
  private readonly ticks = new Set<TickFn>();
  private readonly grid: THREE.GridHelper;
  private readonly axes: THREE.Group;
  private raf = 0;
  private running = false;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.domElement.setAttribute("aria-label", "Interactive WebGL lesson scene");
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(0x0d1117);
    this.scene.add(this.world);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(6, 5, 9);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(5, 10, 7);
    this.scene.add(key);

    this.grid = new THREE.GridHelper(20, 20, 0x30363d, 0x21262d);
    this.scene.add(this.grid);

    this.axes = makeAxes(8);
    this.scene.add(this.axes);

    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";
    this.resize();
    window.addEventListener("resize", this.resize);
    // iOS URL-bar show/hide changes layout without always firing window.resize.
    window.visualViewport?.addEventListener("resize", this.resize);
    this.resume();
  }

  onTick(fn: TickFn): () => void {
    this.ticks.add(fn);
    return () => this.ticks.delete(fn);
  }

  /** Show/hide the helper grid + axes (some lessons prefer a clean stage). */
  setHelpers(visible: boolean): void {
    this.grid.visible = visible;
    this.axes.visible = visible;
  }

  frameCamera(pos: THREE.Vector3Like, target: THREE.Vector3Like): void {
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.controls.target.set(target.x, target.y, target.z);
    this.controls.update();
  }

  /** Whether the rAF render loop is currently scheduled. */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Cancel the animation frame loop. Safe when already paused.
   * Freezes the clock so a later resume() does not apply a huge dt/elapsed jump.
   */
  pause(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.clock.stop();
  }

  /**
   * Restart the animation frame loop after pause(). No-op when already running.
   * Preserves elapsed time accumulated before the pause.
   */
  resume(): void {
    if (this.running) return;
    this.running = true;
    const elapsed = this.clock.elapsedTime;
    this.clock.start();
    this.clock.elapsedTime = elapsed;
    this.loop();
  }

  private resize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
  };

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    this.controls.update();
    for (const fn of this.ticks) fn(dt, elapsed);
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    this.pause();
    window.removeEventListener("resize", this.resize);
    window.visualViewport?.removeEventListener("resize", this.resize);
    this.renderer.dispose();
  }
}

function makeAxes(len: number): THREE.Group {
  const g = new THREE.Group();
  const mk = (dir: THREE.Vector3, color: number, label: string) => {
    g.add(
      new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), len, color, 0.4, 0.25),
    );
    const sprite = makeLabel(label, color);
    sprite.position.copy(dir.clone().multiplyScalar(len + 0.6));
    g.add(sprite);
  };
  mk(new THREE.Vector3(1, 0, 0), 0xff5d5d, "x"); // x = red
  mk(new THREE.Vector3(0, 1, 0), 0x5dff8f, "y"); // y = green
  mk(new THREE.Vector3(0, 0, 1), 0x5db4ff, "z"); // z = blue
  return g;
}

/** A camera-facing text label rendered from a canvas, used for axis tags. */
function makeLabel(text: string, color: number): THREE.Sprite {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
  ctx.font = "bold 90px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.9, 0.9);
  return sprite;
}
