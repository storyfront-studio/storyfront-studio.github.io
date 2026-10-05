/* H2 · "The Serum Drop" — three.js hero.
   A green glass dropper bottle with a gold collar floats and turns toward the cursor (or phone tilt).
   A gold drop falls from the pipette, hits a dark mirror-like surface, ripples, and the ripple blooms
   into the Ngozi mark. Falls back to the static SVG bottle if WebGL isn't available. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* The Ngozi mark: droplet, leaf and ripples (viewBox 0 0 200 150, base at 100,112) */
const LOTUS_PATHS = [
  'M100 14C117 44 132 62 132 80A32 32 0 0 1 68 80C68 62 83 44 100 14Z',
  'M100 42C111 58 111 84 100 102C89 84 89 58 100 42Z',
  'M100 54V100',
  'M60 112C74 123 126 123 140 112',
  'M40 117C62 135 138 135 160 117',
  'M22 123C52 146 148 146 178 123'
];

const hero = document.querySelector('.hero');
const canvas = hero && hero.querySelector('canvas.gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fallback() { if (hero) hero.classList.add('no-gl'); if (canvas) canvas.remove(); }

let renderer;
try {
  if (!canvas || reduce) throw new Error('skip');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { fallback(); }

if (renderer) init();

function init() {
  const GOLD = new THREE.Color('#DCC654');
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = makeBackdrop();   // opaque backdrop so the glass has something to refract
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.6, 9);

  /* lights: warm key, green rim */
  const key = new THREE.DirectionalLight('#fff4d6', 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight('#DCC654', 18, 12); rim.position.set(-2.5, 1.5, -2); scene.add(rim);
  scene.add(new THREE.AmbientLight('#0b3a22', 0.6));

  /* ---------- the bottle ---------- */
  const bottle = new THREE.Group();
  scene.add(bottle);

  const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

  // glass body — rounded shoulders, short neck
  const bodyPts = [[0, -1.35], [0.62, -1.35], [0.74, -1.28], [0.78, -1.1], [0.78, 0.55], [0.74, 0.78], [0.56, 0.98], [0.3, 1.08], [0.26, 1.18], [0.26, 1.24]];
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#d8efe1', metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.5, ior: 1.45,
    attenuationColor: new THREE.Color('#2e8f5c'), attenuationDistance: 2.2, clearcoat: 1, clearcoatRoughness: 0.05,
    envMapIntensity: 1.8, side: THREE.FrontSide, emissive: '#0c5a33', emissiveIntensity: 0.18
  });
  bottle.add(new THREE.Mesh(lathe(bodyPts), glass));

  // serum inside (amber-gold liquid)
  const liquidPts = [[0, -1.28], [0.68, -1.28], [0.71, -1.1], [0.71, 0.25], [0, 0.25]];
  // opaque (not transmissive) so it renders into the glass's transmission pass and shows through
  const liquid = new THREE.Mesh(lathe(liquidPts), new THREE.MeshStandardMaterial({ color: '#E2C45A', roughness: 0.25, metalness: 0.1, emissive: '#8a6d12', emissiveIntensity: 0.55 }));
  bottle.add(liquid);

  // gold collar
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.36, 64, 1), goldMat);
  collar.position.y = 1.4; bottle.add(collar);
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 16, 64), goldMat);
  collarRing.rotation.x = Math.PI / 2; collarRing.position.y = 1.22; bottle.add(collarRing);

  // rubber bulb
  const bulbPts = [[0, 2.42], [0.12, 2.4], [0.22, 2.3], [0.27, 2.12], [0.27, 1.86], [0.24, 1.66], [0.28, 1.6], [0.28, 1.58], [0, 1.58]];
  const bulb = new THREE.Mesh(lathe(bulbPts, 64), new THREE.MeshStandardMaterial({ color: '#141a17', roughness: 0.55, metalness: 0 }));
  bottle.add(bulb);

  // glass pipette inside
  const pipette = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 2.3, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0.02, thickness: 0.1, ior: 1.5 }));
  pipette.position.y = 0.22; bottle.add(pipette);

  // label — cream paper band with the gold lotus (no product name: we don't invent a product line)
  const labelTex = makeLabelTexture();
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.785, 0.785, 0.95, 96, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
    new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75, metalness: 0, transparent: true })
  );
  label.position.y = -0.35; label.rotation.y = 0; bottle.add(label);

  let S = 0.72; bottle.scale.setScalar(S);

  /* ---------- surface, drop, ripples, lotus ---------- */
  let surfaceY = -2.2;
  const surface = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: '#01170f', metalness: 0.9, roughness: 0.28, transparent: true, opacity: 0.85 }));
  surface.rotation.x = -Math.PI / 2; surface.position.y = surfaceY; scene.add(surface);

  const dropMat = new THREE.MeshPhysicalMaterial({ color: '#E8CF63', roughness: 0.05, metalness: 0.2, transmission: 0.4, thickness: 0.3, ior: 1.4, emissive: '#6d5a12', emissiveIntensity: 0.35 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 24), dropMat);
  scene.add(drop);

  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = surfaceY + 0.01; scene.add(m); return m;
  });

  const lotus = buildLotus();
  lotus.position.y = surfaceY + 0.015; scene.add(lotus);

  /* floating gold dust */
  const dustN = 220, dustPos = new Float32Array(dustN * 3), dustSeed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 12; dustPos[i * 3 + 1] = (Math.random() - 0.5) * 7; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1; dustSeed[i] = Math.random() * 10; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: GOLD, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(dust);

  /* ---------- layout ---------- */
  let anchorX = 2.1, anchorY = 0.35, mobile = false;
  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    mobile = w < 760;
    if (mobile) { S = 0.58; anchorX = 0; anchorY = 2.35; camera.fov = 44; camera.position.set(0, 0.9, 10.5); }
    else { S = 0.72; anchorX = Math.min(2.5, 1.1 + (w / h) * 0.7); anchorY = 0; camera.fov = 32; camera.position.set(0, 0.4, 9); }
    bottle.scale.setScalar(S);
    surface.visible = !mobile;   // on phones the disc cut across the headline; keep only the ripples + lotus
    surfaceY = anchorY - 1.35 * S - 1.2;
    surface.position.y = surfaceY; rings.forEach(r => r.position.y = surfaceY + 0.01); lotus.position.y = surfaceY + 0.015;
    camera.updateProjectionMatrix();
    surface.position.x = anchorX; rings.forEach(r => r.position.x = anchorX); lotus.position.x = anchorX;
  }
  resize(); addEventListener('resize', resize);

  /* ---------- input ---------- */
  let tx = 0, ty = 0, cx = 0, cy = 0;
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
  hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90)); });

  let scrollK = 0;
  addEventListener('scroll', () => { scrollK = Math.min(1, scrollY / (hero.clientHeight * 0.9)); }, { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }).observe(hero);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const CYCLE = 4.4;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;

    // bottle float + follow
    const bob = Math.sin(t * 1.1) * 0.08;
    bottle.position.set(anchorX + cx * 0.3, anchorY + bob - scrollK * 0.6, 0);
    bottle.rotation.y = Math.sin(t * 0.35) * 0.5 + cx * 1.1;
    bottle.rotation.x = cy * 0.35;
    bottle.rotation.z = Math.sin(t * 0.8) * 0.04 - cx * 0.12;

    // drop cycle (in world space, below the bottle base)
    const p = (t % CYCLE) / CYCLE;
    const baseY = bottle.position.y - 1.35 * S;
    const startY = baseY - 0.08, endY = surfaceY + 0.07;
    if (p < 0.22) { // forming
      const k = p / 0.22; drop.visible = true;
      drop.position.set(bottle.position.x, startY, 0); drop.scale.set(k, k * 1.1, k);
    } else if (p < 0.5) { // falling (ease-in, with stretch)
      const k = (p - 0.22) / 0.28, e = k * k;
      drop.position.set(anchorX, startY + (endY - startY) * e, 0);
      drop.scale.set(0.85, 1 + e * 0.9, 0.85);
    } else drop.visible = false;

    // ripples + lotus bloom after impact
    const q = p >= 0.5 ? (p - 0.5) / 0.5 : -1;
    rings.forEach((r, i) => {
      const k = q - i * 0.1;
      if (k > 0 && k < 1) { r.scale.setScalar(0.1 + k * (1.6 + i * 0.25)); r.material.opacity = (1 - k) * 0.85; }
      else r.material.opacity = 0;
    });
    const lk = q > 0.12 ? Math.min(1, (q - 0.12) / 0.4) : 0;
    const lf = q > 0.7 ? 1 - (q - 0.7) / 0.3 : 1;
    lotus.scale.setScalar(0.4 + lk * 0.75);
    lotus.children.forEach(l => l.material.opacity = q < 0 ? 0 : lk * lf * 0.95);
    lotus.rotation.y = t * 0.1;

    // dust drift
    const a = dustGeo.attributes.position.array;
    for (let i = 0; i < dustN; i++) { a[i * 3 + 1] += 0.0022 + Math.sin(t + dustSeed[i]) * 0.0008; if (a[i * 3 + 1] > 3.6) a[i * 3 + 1] = -3.6; }
    dustGeo.attributes.position.needsUpdate = true;
    dust.rotation.y = cx * 0.2;

    camera.position.x = cx * 0.35; camera.lookAt(mobile ? 0 : anchorX * 0.35, mobile ? 0.4 : 0, 0);
    renderer.domElement.style.opacity = String(1 - scrollK * 0.85);
    renderer.render(scene, camera);
  }
  frame();
  hero.classList.add('gl-ready'); hero.classList.remove('no-gl'); canvas.style.display = '';

  /* ---------- helpers ---------- */
  function makeBackdrop() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(360, 150, 10, 300, 230, 470);
    grd.addColorStop(0, '#04603a'); grd.addColorStop(0.35, '#013B1F'); grd.addColorStop(0.7, '#012219'); grd.addColorStop(1, '#00160F');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function makeLabelTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#F4EACF'; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = '#A78C5F'; g.lineWidth = 6; g.strokeRect(30, 30, 964, 452);
    g.save(); g.translate(512, 290); g.scale(1.9, 1.9); g.translate(-100, -80);
    g.strokeStyle = '#013B1F'; g.lineWidth = 2.4; g.lineJoin = 'round';
    LOTUS_PATHS.forEach(d => g.stroke(new Path2D(d)));
    g.restore();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  function buildLotus() {
    const grp = new THREE.Group();
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    document.body.appendChild(svg);
    LOTUS_PATHS.forEach(d => {
      const path = document.createElementNS(svgNS, 'path'); path.setAttribute('d', d); svg.appendChild(path);
      const len = path.getTotalLength(), n = Math.max(24, Math.round(len / 3)), pts = [];
      for (let i = 0; i <= n; i++) { const pt = path.getPointAtLength(len * i / n); pts.push(new THREE.Vector3((pt.x - 100) / 60, 0, (pt.y - 112) / 60)); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#DCC654', transparent: true, opacity: 0 }));
      grp.add(line);
    });
    svg.remove();
    return grp;
  }
}

