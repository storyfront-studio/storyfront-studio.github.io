/* Home hero — "Mortar Ritual". The logo's mortar & pestle grinds herbs that spiral up into an
   upside-down Tawi Botanics oil bottle, which drips onto a bob. Everything is built from three.js primitives
   in code: no models, no downloads. Falls back to the static logo poster if WebGL or motion is off. */
(() => {
  const host = document.querySelector(".hero-stage");
  if (!host) return;
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowMem = navigator.deviceMemory && navigator.deviceMemory < 2;
  if (RM || lowMem) return; // static poster stays
  const ok = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch (e) { return false; } })();
  if (!ok) return;

  const start = () => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = () => { try { init(window.THREE); } catch (e) { console.warn("hero 3D off:", e); } };
    document.head.appendChild(s);
  };
  let started = false;
  const kick = () => { if (!started) { started = true; window.requestIdleCallback ? requestIdleCallback(start, { timeout: 600 }) : setTimeout(start, 200); } };
  document.addEventListener("splashdone", kick); setTimeout(kick, 2600);

  function init(THREE) {
    const P = { gold: "#B98A3A", accent: "#8DBF45", primary: "#1F5A2A", leaf2: "#2E6B35", warm: "#65301A", hair: "#1b120d", skin: "#6b4430" };
    const C = c => new THREE.Color(c).convertSRGBToLinear();
    const rand = (a, b) => a + Math.random() * (b - a);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);

    // studio environment for the glass + oil
    const ENV = (() => {
      const s = new THREE.Scene(), g = new THREE.SphereGeometry(10, 32, 16), pos = g.attributes.position, cols = [];
      for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10; const c = new THREE.Color().setHSL(.09, .35, .18 + .55 * Math.max(0, y)); cols.push(c.r, c.g, c.b); }
      g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
      s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      const box = (x, y, z, w, h, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i * .96, i * .88), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
      box(-5, 4, 5, 4, 6, 5); box(6, 3, -2, 3, 6, 3); box(0, 8, 0, 6, 2, 4); box(3, -1, 6, 2, 2, 1.5);
      const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(s, .02).texture; pm.dispose(); return t;
    })();
    scene.environment = ENV;
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a1a, .55));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.6); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(C(P.gold), 1.2); rim.position.set(5, 3, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xdfe9ff, .35); fill.position.set(3, -2, 5); scene.add(fill);

    const dotTex = (() => { const cv = document.createElement("canvas"); cv.width = cv.height = 64; const x = cv.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();

    /* leaves */
    const leafGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, -.5); s.bezierCurveTo(.3, -.3, .32, .18, 0, .5); s.bezierCurveTo(-.32, .18, -.3, -.3, 0, -.5); const g = new THREE.ShapeGeometry(s, 10); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -x * x * 1.3 + y * y * .15); } g.computeVertexNormals(); return g; })();
    const leafMats = [P.primary, P.accent].map(c => new THREE.MeshStandardMaterial({ color: C(c), side: THREE.DoubleSide, roughness: .55, envMapIntensity: .6 }));
    const leaves = [];
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(leafGeo, leafMats[i % 2]); m.scale.setScalar(rand(.14, .3)); m.position.set(rand(-4, 4), rand(-3, 4), rand(-2, 2)); m.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6)); m.userData = { vy: -rand(.15, .35), rs: [rand(-1, 1), rand(-1, 1), rand(-1, 1)], ph: rand(0, 6) }; scene.add(m); leaves.push(m); }

    /* bottle — Tawi Botanics applicator style: amber glass, cream label, black pointed nozzle */
    const labelTex = (() => {
      const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 256; const x = cv.getContext("2d");
      x.fillStyle = "#F7F4EC"; x.fillRect(0, 0, 1024, 256);
      x.fillStyle = "#1F5A2A"; x.fillRect(318, 0, 34, 256); x.fillRect(672, 0, 34, 256);
      x.fillStyle = "#8DC63F"; x.fillRect(352, 0, 6, 256); x.fillRect(666, 0, 6, 256);
      x.textAlign = "center"; x.fillStyle = "#65301A"; x.font = '600 22px "Fira Sans Condensed","Fira Sans",sans-serif'; x.fillText("T A W I   B O T A N I C S", 512, 40);
      x.fillStyle = "#1F5A2A"; x.font = '800 40px "Fira Sans",sans-serif'; x.fillText("ROOT", 512, 90); x.fillText("HAIR OIL", 512, 134);
      x.strokeStyle = "#1F5A2A"; x.lineWidth = 5; x.beginPath(); x.moveTo(512, 150); x.bezierCurveTo(538, 176, 548, 198, 512, 214); x.bezierCurveTo(476, 198, 486, 176, 512, 150); x.stroke();
      x.fillStyle = "#65301A"; x.font = '500 20px "Fira Sans",sans-serif'; x.fillText("100 ml · All hair types", 512, 244);
      const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
    })();
    const V2 = a => a.map(p => new THREE.Vector2(p[0], p[1]));
    const bottle = new THREE.Group();
    bottle.add(new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 0], [.44, 0], [.5, .06], [.5, 1.2], [.46, 1.36], [.32, 1.47], [.2, 1.53], [.2, 1.68]]), 64),
      new THREE.MeshPhysicalMaterial({ color: C("#4a1d06"), roughness: .05, clearcoat: 1, clearcoatRoughness: .04, transparent: true, opacity: .93, envMapIntensity: 1.8, side: THREE.DoubleSide })));
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(.506, .506, .8, 64, 1, true, -Math.PI, Math.PI * 2), new THREE.MeshStandardMaterial({ map: labelTex, roughness: .55, envMapIntensity: .6 })); lab.position.y = .62; bottle.add(lab);
    const black = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: .3, metalness: .25, side: THREE.DoubleSide });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .28, 40), black); cap.position.y = 1.8; bottle.add(cap);
    const noz = new THREE.Mesh(new THREE.LatheGeometry(V2([[.23, 0], [.2, .06], [.07, .62], [.035, .8], [0, .82]]), 40), black); noz.position.y = 1.93; bottle.add(noz);
    const TIP = new THREE.Vector3(0, 2.76, 0);
    bottle.scale.setScalar(.8); scene.add(bottle);

    /* bust + bob with fringe */
    const CAP = [[0, 1.14], [.3, 1.11], [.58, .99], [.8, .79], [.93, .56], [.975, .4], [.9, .38]];
    const SIDE = [[.975, .5], [.995, .18], [.99, -.18], [.955, -.5], [.9, -.66], [.8, -.6]];
    const PATH = [[0, 1.14], [.3, 1.11], [.58, .99], [.8, .79], [.93, .56], [.975, .4], [.995, .18], [.99, -.18], [.955, -.5], [.9, -.66]];
    const PL = [0]; for (let i = 1; i < PATH.length; i++) PL.push(PL[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
    const pathAt = d => { d = Math.max(0, Math.min(PL[PL.length - 1], d)); let i = 1; while (i < PL.length - 1 && PL[i] < d) i++; const t = (d - PL[i - 1]) / (PL[i] - PL[i - 1]); return [PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * t, PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * t]; };
    const capY = r => { for (let i = 1; i < PATH.length; i++) if (PATH[i][0] >= r) { const t = (r - PATH[i - 1][0]) / (PATH[i][0] - PATH[i - 1][0]); return PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * t; } return .4; };
    const strandTex = (() => { const cv = document.createElement("canvas"); cv.width = 512; cv.height = 64; const x = cv.getContext("2d"); x.fillStyle = "#808080"; x.fillRect(0, 0, 512, 64); for (let i = 0; i < 900; i++) { const v = Math.random() * 255 | 0; x.fillStyle = `rgba(${v},${v},${v},.5)`; x.fillRect(Math.random() * 512, 0, 1 + Math.random() * 1.5, 64); } const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
    const bobGeos = (k = 1) => { const V = a => a.map(p => new THREE.Vector2(p[0] * k, p[1])); return [new THREE.LatheGeometry(V(CAP), 96), new THREE.LatheGeometry(V(SIDE), 96, .95, Math.PI * 2 - 1.9)]; };
    const bust = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: C(P.skin), roughness: .5, metalness: .05, envMapIntensity: .7 });
    const hg = new THREE.SphereGeometry(1, 64, 48), hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) { let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); const t = y < 0 ? 1 + y * .34 : 1; x *= .8 * t; z *= .9 * (y < 0 ? 1 + y * .1 : 1); if (z > 0 && y < .2 && y > -.8) z *= 1 + .04 * (1 - Math.abs(y + .3)); hp.setXYZ(i, x, y * 1.05, z); }
    hg.computeVertexNormals(); bust.add(new THREE.Mesh(hg, skin));
    const nose = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 14), skin); nose.scale.set(.9, 1.5, 1.05); nose.position.set(0, -.12, .86); bust.add(nose);
    const lip = new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 14), skin); lip.scale.set(1.5, .55, .8); lip.position.set(0, -.5, .78); bust.add(lip);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.34, .46, 1.1, 40), skin); neck.position.y = -1.3; bust.add(neck);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 36), skin); sh.scale.set(1.85, .6, .92); sh.position.y = -2.2; bust.add(sh);
    const hairM = new THREE.MeshStandardMaterial({ color: C(P.hair), roughness: .42, metalness: .1, bumpMap: strandTex, bumpScale: .012, envMapIntensity: .9, side: THREE.DoubleSide });
    bobGeos().forEach(g => bust.add(new THREE.Mesh(g, hairM)));
    const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -10);
    const sheenM = new THREE.MeshPhysicalMaterial({ color: C(P.gold), metalness: .55, roughness: .16, clearcoat: 1, transparent: true, opacity: .6, envMapIntensity: 1.6, clippingPlanes: [clip], side: THREE.DoubleSide, bumpMap: strandTex, bumpScale: .02 });
    bobGeos(1.012).forEach(g => { const m = new THREE.Mesh(g, sheenM); m.scale.y = 1.004; bust.add(m); });
    renderer.localClippingEnabled = true;
    const BP = new THREE.Vector3(.9, -.85, 0), BS = .9, HIT = .22;
    bust.position.copy(BP); bust.scale.setScalar(BS); scene.add(bust);

    /* mortar & pestle (from the logo) */
    const mortar = new THREE.Group(); mortar.position.set(-1.9, -2.35, 1.2); scene.add(mortar);
    mortar.add(new THREE.Mesh(new THREE.LatheGeometry(V2([[0, 0], [.45, 0], [.5, .08], [.78, .3], [.95, .62], [1, .78], [.92, .8], [.84, .68], [.66, .4], [.35, .3], [0, .28]]), 56),
      new THREE.MeshStandardMaterial({ color: C(P.warm), roughness: .6, envMapIntensity: .5, side: THREE.DoubleSide })));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.96, .035, 10, 72), new THREE.MeshStandardMaterial({ color: C(P.gold), metalness: .9, roughness: .3 })); ring.rotation.x = Math.PI / 2; ring.position.y = .8; mortar.add(ring);
    const spice = new THREE.Mesh(new THREE.CylinderGeometry(.72, .5, .2, 40), new THREE.MeshStandardMaterial({ color: C("#9A5C43"), roughness: .9 })); spice.position.y = .45; mortar.add(spice);
    const pestle = new THREE.Mesh(new THREE.CylinderGeometry(.11, .19, 1.5, 28), new THREE.MeshStandardMaterial({ color: C("#7a4a2a"), roughness: .5 })); mortar.add(pestle);

    /* herb + spice particles: mortar -> bottle */
    const N = innerWidth < 700 ? 320 : 520, pg = new THREE.BufferGeometry(), pa = new Float32Array(N * 3), ca = new Float32Array(N * 3), tt = new Float32Array(N);
    const pal = [P.accent, "#9A5C43", P.gold, P.leaf2].map(C);
    for (let i = 0; i < N; i++) { tt[i] = Math.random(); const c = pal[i % 4]; ca.set([c.r, c.g, c.b], i * 3); }
    pg.setAttribute("position", new THREE.BufferAttribute(pa, 3)); pg.setAttribute("color", new THREE.BufferAttribute(ca, 3));
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: .08, map: dotTex, vertexColors: true, transparent: true, depthWrite: false })));

    /* oil drops */
    const oil = new THREE.MeshPhysicalMaterial({ color: C(P.gold), metalness: .35, roughness: .06, clearcoat: 1, transparent: true, opacity: .95, envMapIntensity: 2, emissive: C(P.gold).multiplyScalar(.12) });
    const dg = new THREE.SphereGeometry(.07, 18, 12);
    const forming = new THREE.Mesh(dg, oil); scene.add(forming);
    const drops = [], splash = [], trick = [];
    let grow = 0, level = 1.3, target = 1.3, hold = 0, fade = 1;
    const tipW = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), q = new THREE.Vector3();

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", e => { ptr.tx = e.clientX / innerWidth * 2 - 1; ptr.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

    function update(t, dt) {
      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3);
      bust.rotation.y = ptr.x * .4 + Math.sin(t * .3) * .2;
      // bottle hovers with its nozzle over the crown
      const tgt = new THREE.Vector3(BP.x + HIT * BS, BP.y + 1.14 * BS + .62, BP.z);
      bottle.rotation.set(0, 0, Math.PI - .45 + Math.sin(t * .9) * .035); bottle.position.set(0, 0, 0); bottle.updateMatrixWorld(true);
      tipW.copy(TIP); bottle.localToWorld(tipW); bottle.position.copy(tgt).sub(tipW); bottle.updateMatrixWorld(true);
      tipW.copy(TIP); bottle.localToWorld(tipW);
      grow += dt * .85; const gs = Math.min(1, grow); forming.scale.set(gs * .9, gs * (1 + gs * .6), gs * .9); forming.position.set(tipW.x, tipW.y - .07 * gs * 1.2, tipW.z);
      if (grow >= 1) { grow = 0; const d = new THREE.Mesh(dg, oil); d.position.copy(forming.position); d.userData.v = 0; scene.add(d); drops.push(d); }
      const hitY = BP.y + capY(HIT) * BS;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.userData.v += 4.2 * dt; d.position.y -= d.userData.v * dt; const st = 1 + d.userData.v * .25; d.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st));
        if (d.position.y <= hitY) {
          scene.remove(d); drops.splice(i, 1);
          for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(dg, oil); s.position.copy(d.position); s.scale.setScalar(.35); s.userData = { v: new THREE.Vector3(rand(-.9, .9), rand(.6, 1.5), rand(-.9, .9)), life: 0 }; scene.add(s); splash.push(s); }
          for (let k = 0; k < 2; k++) { const tr = new THREE.Mesh(dg, oil); tr.userData = { phi: rand(1.1, Math.PI * 2 - 1.1), d: PL[1] * rand(.5, 1.2), sp: rand(.35, .55) }; bust.add(tr); trick.push(tr); }
          target = Math.max(-.75, target - .075);
        }
      }
      for (let i = splash.length - 1; i >= 0; i--) { const s = splash[i], u = s.userData; u.life += dt; u.v.y -= 5 * dt; s.position.addScaledVector(u.v, dt); s.scale.setScalar(.35 * (1 - u.life / .6)); if (u.life > .6) { scene.remove(s); splash.splice(i, 1); } }
      for (let i = trick.length - 1; i >= 0; i--) {
        const tr = trick[i], u = tr.userData; u.d += u.sp * dt; const [r, y] = pathAt(u.d); const rr = r + .035;
        tr.position.set(rr * Math.sin(u.phi), y, rr * Math.cos(u.phi)); tr.scale.set(.5, .75, .5);
        if (u.d >= PL[PL.length - 1]) { u.fall = (u.fall || 0) + dt; tr.position.y -= u.fall * u.fall * 3; if (u.fall > .5) { bust.remove(tr); trick.splice(i, 1); } }
      }
      if (target <= -.75) { hold += dt; if (hold > 2.2) { fade -= dt * .8; if (fade <= 0) { fade = 1; hold = 0; target = 1.3; level = 1.3; } } }
      level += (target - level) * Math.min(1, dt * 1.8);
      clip.constant = -(BP.y + level * BS); sheenM.opacity = .6 * fade;
      // pestle grinds
      pestle.position.set(Math.cos(t * 2.4) * .35, 1.05, Math.sin(t * 2.4) * .35); pestle.rotation.set(Math.sin(t * 2.4) * .35, 0, -Math.cos(t * 2.4) * .35);
      // particles spiral from the mortar into the bottle base
      mortar.updateMatrixWorld(); p0.set(0, .7, 0).applyMatrix4(mortar.matrixWorld); p2.set(0, .1, 0); bottle.localToWorld(p2);
      p1.set((p0.x + p2.x) / 2 - 1.2, p2.y + .6, (p0.z + p2.z) / 2);
      const PA = pg.attributes.position;
      for (let i = 0; i < N; i++) { tt[i] += dt * .22; if (tt[i] > 1) tt[i] -= 1; const s = tt[i], is = 1 - s; q.set(is * is * p0.x + 2 * is * s * p1.x + s * s * p2.x, is * is * p0.y + 2 * is * s * p1.y + s * s * p2.y, is * is * p0.z + 2 * is * s * p1.z + s * s * p2.z); const sw = (1 - s) * .55, a = i * .7 + t * 3; PA.setXYZ(i, q.x + Math.cos(a) * sw, q.y + Math.sin(a * 1.3) * sw * .4, q.z + Math.sin(a) * sw); }
      PA.needsUpdate = true;
      leaves.forEach(m => { const u = m.userData; m.position.y += u.vy * dt; m.position.x += Math.sin(t * .7 + u.ph) * .004; m.rotation.x += u.rs[0] * dt * .7; m.rotation.y += u.rs[1] * dt * .7; m.rotation.z += u.rs[2] * dt * .5; if (m.position.y < -3) m.position.y = 4; });
    }

    function resize() {
      const r = host.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // frame the whole ritual: pull back on narrow stages
      const dist = w / h < .9 ? 14.5 : w / h < 1.2 ? 13.4 : 12.8;
      camera.position.set(-.2, .9, dist); camera.lookAt(-.2, .05, 0); camera.updateProjectionMatrix();
    }
    resize(); addEventListener("resize", resize);
    let visible = true, last = performance.now(), T = 0;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .02 }).observe(host);
    const loop = now => {
      requestAnimationFrame(loop);
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      T += dt; update(T, dt); renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);
    host.closest(".hero").classList.add("gl-on");
  }
})();
