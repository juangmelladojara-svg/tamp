// @ts-nocheck — Motor imperativo de la escena 3D, portado casi tal cual del
// prototipo vanilla de la Oficina Virtual de con María (Three.js r160). Sus
// tipos públicos están en ./tipos.ts; el interior queda sin tipar a propósito.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { OpcionesOficina } from "./tipos";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const corto = (s, n = 60) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const plural = (n, s, p = s + "s") => `${n} ${n === 1 ? s : p}`;
const hora = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

/** Mezcla un color con blanco (k = cuánto blanco): tonos pálidos para paneles y alfombras. */
function palido(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const ESTADO_UI = {
  disponible: { txt: "Disponible", ring: "#94A3B8", op: 0.35 },
  trabajando: { txt: "Trabajando", ring: "#2F6FEB", op: 0.85 },
  aprobacion: { txt: "Esperando tu aprobación", ring: "#F59E0B", op: 0.9 },
  listo: { txt: "¡Listo!", ring: "#22C55E", op: 0.9 },
  camino: { txt: "En camino", ring: "#119C8D", op: 0.85 },
};

/** Monta la oficina dentro de `raiz` (que ya trae el esqueleto de la UI) y devuelve la función para desmontarla. */
export async function montarOficina(raiz: HTMLElement, op: OpcionesOficina): Promise<() => void> {
  const $ = (s) => raiz.querySelector(`[data-o="${s}"]`);
  const limpiezas = [];
  const escuchar = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); limpiezas.push(() => el.removeEventListener(ev, fn, o)); };
  const FD = op.fuentes.display, FS = op.fuentes.sans;

  // ===================================================================
  // 1. EQUIPO: Jefe de Gabinete (camina), coordinadores (cubículos), Juan
  // ===================================================================
  const GX = 22, GY = 12, ALTO = 3.25;
  const ARRIBA = 4; // los primeros 4 coordinadores van en la banda de arriba
  const AGENTES = op.coordinadores.map((c, i) => {
    const top = i < ARRIBA;
    const a = 7 + 4 * (top ? i : i - ARRIBA);
    const ag = {
      ...c, a, banda: top ? "top" : "bottom", ultimoTop: top && i === ARRIBA - 1,
      panel: palido(c.color, 0.7), alfombra: palido(c.color, 0.86),
    };
    if (top) { ag.x = a + 1.6; ag.z = 2.15; ag.rot = Math.PI; ag.parada = [a + 2.75, 2.85]; }
    else { ag.x = a + 1.6; ag.z = 9.55; ag.rot = 0; ag.parada = [a + 2.75, 8.75]; }
    return Object.assign(ag, { estado: "disponible", progreso: 0, tarea: null, cola: [], hechas: 0, listoHasta: 0, dur: 9 });
  });
  const AG = Object.fromEntries(AGENTES.map((a) => [a.id, a]));

  const COORD = {
    ...op.jefe, x: 2.65, z: 4.05, en: "home", ruta: [], destino: null, alLlegar: null, llevando: false, ocupada: false,
    estado: "disponible", texto: "En el gabinete", yaw: Math.PI / 4, yawObj: Math.PI / 4, entregaT: -9,
  };
  const JUAN = { ...op.director, x: 1.45, z: 9.8, rot: Math.PI / 2, saludoHasta: 0 };
  const PERFIL = {
    juan: { nombre: op.director.nombre, ini: op.director.ini, color: op.director.color },
    coord: { nombre: op.jefe.nombre, ini: op.jefe.ini, color: op.jefe.color },
    sistema: { nombre: "Oficina", ini: "●", color: "#64748B" },
  };
  AGENTES.forEach((a) => { PERFIL[a.id] = { nombre: a.nombre, ini: a.ini, color: a.color }; });

  // ===================================================================
  // 2. RENDER, ESCENA, LUCES Y CÁMARA
  // ===================================================================
  const stageEl = $("stage");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    $("loading").textContent = "Este navegador no puede mostrar la oficina en 3D (WebGL desactivado).";
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  stageEl.prepend(renderer.domElement);
  const css2d = new CSS2DRenderer();
  css2d.domElement.className = "labels";
  renderer.domElement.after(css2d.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight("#FFFFFF", "#D9D2C6", 0.5));
  const sol = new THREE.DirectionalLight("#FFF4E6", 1.7);
  sol.position.set(GX / 2 - 7, 22, 15);
  sol.target.position.set(GX / 2, 0, 6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 60 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.03;
  scene.add(sol, sol.target);

  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 300);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minZoom = 0.8;
  controls.maxZoom = 3.2;
  controls.screenSpacePanning = true;
  const DIR = new THREE.Vector3(1, 0.92, 1).normalize();
  controls.minAzimuthAngle = Math.PI / 4 - 0.6;
  controls.maxAzimuthAngle = Math.PI / 4 + 0.6;
  controls.minPolarAngle = 0.72;
  controls.maxPolarAngle = 1.18;

  // ===================================================================
  // 3. AYUDANTES DE GEOMETRÍA
  // ===================================================================
  const GEOS = new Map(), MATS = new Map(), TEXTURAS = [];
  function geo(k, f) { let g = GEOS.get(k); if (!g) { g = f(); GEOS.set(k, g); } return g; }
  function rboxGeo(w, h, d, r = 0.03) {
    const rr = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
    return geo(`rb|${w}|${h}|${d}|${rr}`, () => new RoundedBoxGeometry(w, h, d, 3, rr));
  }
  const capGeo = (r, l) => geo(`cap|${r}|${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 16));
  const sphGeo = (r, w = 24, h = 16) => geo(`sph|${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
  const cylGeo = (a, b, h, s = 24, abierto = false) => geo(`cyl|${a}|${b}|${h}|${s}|${abierto}`, () => new THREE.CylinderGeometry(a, b, h, s, 1, abierto));
  const icoGeo = (r) => geo(`ico|${r}`, () => new THREE.IcosahedronGeometry(r, 1));
  function mat(c, o = {}) {
    const k = c + JSON.stringify(o);
    let m = MATS.get(k);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o }); MATS.set(k, m); }
    return m;
  }
  function mesh(g, m, sombra = true) { const x = new THREE.Mesh(g, m); x.castShadow = sombra; x.receiveShadow = true; return x; }
  function box(x0, z0, w, d, h, c, y0 = 0, r = 0.03, padre = scene) {
    const m = mesh(rboxGeo(w, h, d, r), typeof c === "string" ? mat(c) : c);
    m.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
    padre.add(m);
    return m;
  }
  function obj(g, m, x, y, z, padre = scene) { const o = mesh(g, m); o.position.set(x, y, z); padre.add(o); return o; }
  function lienzo(w, h, dibujar) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    if (dibujar) dibujar(x, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    TEXTURAS.push(t);
    return { c, x, t };
  }
  function rr(x, X, Y, W, H, R) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, W, H, R); else x.rect(X, Y, W, H); }
  function plano(w, h, material, x, y, z, rotY = 0, rotX = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, y, z); m.rotation.set(rotX, rotY, 0); m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  // ===================================================================
  // 4. CONSTRUCCIÓN DE LA OFICINA
  // ===================================================================
  const PARED = "#F6F3EE", ROBLE = "#E2C9A6", BLANCO = "#F4F3F0", ALU = "#C9D0DA";

  const halo = lienzo(256, 256, (x, w, h) => {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(28,45,80,.30)"); g.addColorStop(0.55, "rgba(28,45,80,.12)"); g.addColorStop(1, "rgba(28,45,80,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  plano(GX + 16, 26, new THREE.MeshBasicMaterial({ map: halo.t, transparent: true, depthWrite: false }), GX / 2 + 0.6, -0.62, 6.8, 0, -Math.PI / 2);

  // Losa, piso y pasillos
  box(-0.3, -0.3, GX + 0.3, GY + 0.3, 0.41, "#D5CEC2", -0.45, 0.16);
  box(-0.3, -0.3, GX + 0.3, GY + 0.3, 0.06, "#EEEAE3", -0.06, 0.03);
  const PASILLO = "#DFE5EE";
  box(0, 5, GX, 2, 0.012, PASILLO, 0, 0.006);
  box(5, 0, 2, 5, 0.012, PASILLO, 0, 0.006);
  box(5, 7, 2, 5, 0.012, PASILLO, 0, 0.006);

  // Piso de madera del gabinete
  const madera = lienzo(512, 512, (x, w) => {
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? "#DDBF95" : "#E5CAA4"; x.fillRect(0, i * 64, w, 64);
      x.fillStyle = "rgba(140,100,60,.16)"; x.fillRect(0, i * 64, w, 2);
      x.fillRect((i * 173) % w, i * 64, 2, 64); x.fillRect((i * 173 + 260) % w, i * 64, 2, 64);
    }
  });
  plano(4.95, 4.95, new THREE.MeshStandardMaterial({ map: madera.t, roughness: 0.7 }), 2.475, 0.013, 2.475, 0, -Math.PI / 2);

  // Alfombra de la dirección
  box(0.5, 7.5, 4.0, 4.0, 0.014, "#23467C", 0, 0.02);
  box(0.7, 7.7, 3.6, 3.6, 0.016, "#2B5591", 0, 0.02);

  // Muros
  box(-0.3, -0.3, GX + 0.3, 0.3, ALTO, PARED, 0, 0.05);
  box(-0.3, 0, 0.3, GY, ALTO, PARED, 0, 0.05);
  box(0, 0, GX, 0.03, 0.14, "#E3DED5", 0, 0.01);
  box(0, 0, 0.03, GY, 0.14, "#E3DED5", 0, 0.01);

  // Ventanas con vista a la cordillera
  const cielo = lienzo(256, 160, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9CCDF0"); g.addColorStop(1, "#E6F3FB");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = "#C3CDE6"; x.beginPath(); x.moveTo(0, h);
    [[0, 110], [30, 80], [55, 96], [90, 62], [120, 90], [150, 70], [185, 98], [215, 74], [256, 100], [256, 160]].forEach(([a, b]) => x.lineTo(a, b));
    x.closePath(); x.fill();
    x.fillStyle = "#F4F7FC";
    [[90, 62, 78, 74, 101, 73], [150, 70, 141, 79, 160, 79], [30, 80, 22, 88, 39, 87], [215, 74, 206, 82, 225, 82]].forEach(([a, b, c, d, e, f]) => {
      x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.lineTo(e, f); x.closePath(); x.fill();
    });
    x.fillStyle = "#AFC0D8";
    [[10, 120, 18, 40], [34, 108, 14, 52], [52, 126, 22, 34], [80, 92, 12, 68], [96, 118, 26, 42], [130, 112, 16, 48], [150, 124, 30, 36], [186, 104, 14, 56], [204, 120, 22, 40], [230, 114, 18, 46]]
      .forEach(([a, b, c, d]) => x.fillRect(a, b, c, d));
    x.fillStyle = "rgba(255,255,255,.85)";
    [[40, 30, 14], [56, 26, 18], [72, 32, 12], [180, 22, 12], [194, 18, 16], [208, 24, 11]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, Math.PI * 2); x.fill(); });
  });
  const MAT_CIELO = new THREE.MeshBasicMaterial({ map: cielo.t });
  function ventanaX(x0, x1, y0 = 1.35, y1 = 2.7) {
    box(x0 - 0.06, 0, x1 - x0 + 0.12, 0.06, y1 - y0 + 0.12, "#E2E7EE", y0 - 0.06, 0.02);
    plano(x1 - x0, y1 - y0, MAT_CIELO, (x0 + x1) / 2, (y0 + y1) / 2, 0.065);
    box((x0 + x1) / 2 - 0.025, 0.06, 0.05, 0.03, y1 - y0, "#E2E7EE", y0, 0.01);
    box(x0 - 0.1, 0, x1 - x0 + 0.2, 0.14, 0.05, "#ECE7DF", y0 - 0.1, 0.02);
  }
  function ventanaZ(z0, z1, y0 = 1.35, y1 = 2.7) {
    box(0, z0 - 0.06, 0.06, z1 - z0 + 0.12, y1 - y0 + 0.12, "#E2E7EE", y0 - 0.06, 0.02);
    plano(z1 - z0, y1 - y0, MAT_CIELO, 0.065, (y0 + y1) / 2, (z0 + z1) / 2, Math.PI / 2);
    box(0, z0 - 0.1, 0.14, z1 - z0 + 0.2, 0.05, "#ECE7DF", y0 - 0.1, 0.02);
  }
  ventanaX(0.8, 4.2);
  AGENTES.filter((a) => a.banda === "top").forEach((a) => (a.ultimoTop ? ventanaX(a.a + 0.3, a.a + 2.7) : ventanaX(a.a + 0.6, a.a + 3.0)));
  ventanaZ(5.2, 6.8);

  // Muros de vidrio
  const MAT_VIDRIO = new THREE.MeshStandardMaterial({ color: "#D7E8F4", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false });
  function vidrio(w, h, d, x, y, z) { const v = new THREE.Mesh(rboxGeo(w, h, d, 0.01), MAT_VIDRIO); v.position.set(x, y, z); v.renderOrder = 2; scene.add(v); }
  function vidrioX(x0, x1, z, h = 2.3) {
    vidrio(x1 - x0, h, 0.03, (x0 + x1) / 2, h / 2 + 0.04, z);
    box(x0, z - 0.03, x1 - x0, 0.06, 0.05, ALU, 0, 0.015);
    box(x0, z - 0.03, x1 - x0, 0.06, 0.05, ALU, h + 0.02, 0.015);
    const n = Math.max(1, Math.round((x1 - x0) / 1.25));
    for (let i = 0; i <= n; i++) box(x0 + ((x1 - x0) * i) / n - 0.025, z - 0.025, 0.05, 0.05, h + 0.07, ALU, 0, 0.01);
  }
  function vidrioZ(z0, z1, x, h = 2.3) {
    vidrio(0.03, h, z1 - z0, x, h / 2 + 0.04, (z0 + z1) / 2);
    box(x - 0.03, z0, 0.06, z1 - z0, 0.05, ALU, 0, 0.015);
    box(x - 0.03, z0, 0.06, z1 - z0, 0.05, ALU, h + 0.02, 0.015);
    const n = Math.max(1, Math.round((z1 - z0) / 1.25));
    for (let i = 0; i <= n; i++) box(x - 0.025, z0 + ((z1 - z0) * i) / n - 0.025, 0.05, 0.05, h + 0.07, ALU, 0, 0.01);
  }
  vidrioX(0, 2.1, 4.95); vidrioX(3.2, 4.95, 4.95); vidrioZ(0, 4.95, 4.95);
  vidrioX(0, 4.95, 7.0); vidrioZ(7.0, 9.0, 4.95); vidrioZ(10.5, 12, 4.95);

  // Paneles de cubículo
  function panelX(x0, x1, z, c, h = 1.15) {
    box(x0, z - 0.03, x1 - x0, 0.06, h, c, 0, 0.025);
    box(x0 - 0.01, z - 0.045, x1 - x0 + 0.02, 0.09, 0.035, "#FFFFFF", h - 0.01, 0.015);
  }
  function panelZ(z0, z1, x, c, h = 1.15) {
    box(x - 0.03, z0, 0.06, z1 - z0, h, c, 0, 0.025);
    box(x - 0.045, z0 - 0.01, 0.09, z1 - z0 + 0.02, 0.035, "#FFFFFF", h - 0.01, 0.015);
  }

  // Mobiliario
  function escritorio(x0, z0, w, d, lado, top = ROBLE, pata = BLANCO) {
    box(x0, z0, w, d, 0.05, top, 0.7, 0.02);
    if (lado === "x-") {
      box(x0 + 0.06, z0 + 0.04, w - 0.12, 0.04, 0.7, pata, 0, 0.015);
      box(x0 + 0.06, z0 + d - 0.08, w - 0.12, 0.04, 0.7, pata, 0, 0.015);
      box(x0 + w - 0.1, z0 + 0.1, 0.03, d - 0.2, 0.42, pata, 0.24, 0.01);
    } else {
      box(x0 + 0.04, z0 + 0.06, 0.04, d - 0.12, 0.7, pata, 0, 0.015);
      box(x0 + w - 0.08, z0 + 0.06, 0.04, d - 0.12, 0.7, pata, 0, 0.015);
      box(x0 + 0.1, lado === "z+" ? z0 + 0.07 : z0 + d - 0.1, w - 0.2, 0.03, 0.42, pata, 0.24, 0.01);
    }
  }
  function silla(color = "#2F3747", ejecutiva = false) {
    const g = new THREE.Group();
    const tela = mat(color, { roughness: 0.9 }), metal = mat("#9AA3AF", { metalness: 0.5, roughness: 0.35 });
    obj(rboxGeo(0.5, 0.08, 0.48, 0.035), tela, 0, 0.3, 0, g);
    const bh = ejecutiva ? 0.75 : 0.5;
    const back = obj(rboxGeo(0.46, bh, 0.07, 0.03), tela, 0, 0.38 + bh / 2, -0.25, g); back.rotation.x = -0.08;
    obj(cylGeo(0.025, 0.025, 0.24, 10), metal, 0, 0.16, 0, g);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = obj(rboxGeo(0.05, 0.03, 0.26, 0.012), metal, Math.sin(a) * 0.12, 0.06, Math.cos(a) * 0.12, g); leg.rotation.y = a;
      obj(sphGeo(0.03, 8, 6), mat("#2B2F38"), Math.sin(a) * 0.25, 0.03, Math.cos(a) * 0.25, g);
    }
    return g;
  }
  function sillaEn(x, z, rotY, color, escala = 1, ejecutiva = false) {
    const g = silla(color, ejecutiva); g.position.set(x, 0, z); g.rotation.y = rotY; g.scale.setScalar(escala); scene.add(g); return g;
  }
  const PANTALLAS = [];
  function monitor(cx, cz, rotY, dueno, variante) {
    const g = new THREE.Group(); g.position.set(cx, 0.75, cz); g.rotation.y = rotY; scene.add(g);
    const gris = mat("#C9CED6", { metalness: 0.3, roughness: 0.4 });
    obj(rboxGeo(0.24, 0.02, 0.16, 0.008), gris, 0, 0.01, 0, g);
    obj(cylGeo(0.018, 0.018, 0.26, 10), gris, 0, 0.14, -0.04, g);
    obj(rboxGeo(0.66, 0.4, 0.035, 0.015), mat("#1D222C", { roughness: 0.4 }), 0, 0.44, 0, g);
    if (dueno) {
      const c = document.createElement("canvas"); c.width = 256; c.height = 150;
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TEXTURAS.push(t);
      PANTALLAS.push({ x: c.getContext("2d"), t, dueno, variante, ultimo: "" });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
      p.position.set(0, 0.44, 0.019); g.add(p);
    }
    return g;
  }
  function teclado(cx, cz, rotY) {
    const g = new THREE.Group(); g.position.set(cx, 0.75, cz); g.rotation.y = rotY; scene.add(g);
    obj(rboxGeo(0.42, 0.018, 0.13, 0.008), mat("#E9EBEF"), 0, 0.009, 0, g);
    const r = obj(sphGeo(0.035, 12, 8), mat("#E9EBEF"), 0.32, 0.012, 0.02, g); r.scale.set(1, 0.45, 1.4);
  }
  function taza(x, z, color, y = 0.75) {
    obj(cylGeo(0.04, 0.036, 0.1, 16), mat("#FFFFFF", { roughness: 0.4 }), x, y + 0.05, z);
    obj(cylGeo(0.041, 0.041, 0.025, 16), mat(color), x, y + 0.05, z);
  }
  function plantaMesa(x, z, y = 0.75) {
    obj(cylGeo(0.06, 0.05, 0.09, 16), mat("#F2EFEA"), x, y + 0.045, z);
    obj(icoGeo(0.08), mat("#6DB57F", { flatShading: true }), x, y + 0.13, z);
  }
  const VERDES = ["#5FAF73", "#4E9E63", "#78C08A"];
  function planta(x, z, s = 1, tipo = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    obj(cylGeo(0.2, 0.15, 0.34, 24), mat(tipo === 1 ? "#D98A63" : "#F2EFEA", { roughness: 0.6 }), 0, 0.17, 0, g);
    obj(cylGeo(0.18, 0.18, 0.02, 20), mat("#6B4A33"), 0, 0.335, 0, g);
    const hoja = (c) => mat(c, { flatShading: true, roughness: 0.85 });
    if (tipo === 0) {
      [[0, 0.62, 0, 0.26], [0.14, 0.5, 0.08, 0.2], [-0.13, 0.52, -0.06, 0.2], [0.02, 0.82, -0.04, 0.18], [-0.06, 0.5, 0.14, 0.17]]
        .forEach(([a, b, c, r], i) => obj(icoGeo(r), hoja(VERDES[i % 3]), a, b, c, g));
    } else if (tipo === 1) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const m = obj(sphGeo(0.1, 10, 8), hoja(VERDES[i % 3]), Math.sin(a) * 0.07, 0.66, Math.cos(a) * 0.07, g);
        m.scale.set(0.55, 3.6, 0.22); m.rotation.set(Math.cos(a) * 0.25, a, -Math.sin(a) * 0.25);
      }
    } else {
      obj(cylGeo(0.025, 0.035, 0.7, 8), mat("#8A6446"), 0, 0.68, 0, g);
      [[0, 1.12, 0, 0.3], [0.18, 0.98, 0.05, 0.22], [-0.16, 1.0, -0.04, 0.22], [0.02, 1.3, 0.03, 0.2]]
        .forEach(([a, b, c, r], i) => obj(icoGeo(r), hoja(VERDES[i % 3]), a, b, c, g));
    }
    return g;
  }
  function carpetas(x0, z0, y, colores) {
    colores.forEach((c, i) => box(x0 + i * 0.09, z0, 0.07, 0.26, 0.3, c, y, 0.01));
  }

  // --- Gabinete (sala de coordinación) ---
  const mesa = new THREE.Group(); mesa.position.set(2.5, 0, 2.3); scene.add(mesa);
  obj(cylGeo(1, 1, 0.06, 48), mat("#F7F6F3", { roughness: 0.5 }), 0, 0.72, 0, mesa).scale.set(1.25, 1, 0.72);
  obj(cylGeo(0.08, 0.1, 0.68, 16), mat("#B9C1CC", { metalness: 0.4, roughness: 0.35 }), 0, 0.36, 0, mesa);
  obj(cylGeo(0.4, 0.42, 0.03, 32), mat("#B9C1CC", { metalness: 0.4, roughness: 0.35 }), 0, 0.015, 0, mesa).scale.set(1.4, 1, 0.8);
  [[1.05, 2.3, Math.PI / 2], [3.95, 2.3, -Math.PI / 2], [2.0, 1.5, 0], [3.0, 1.5, 0], [2.0, 3.1, Math.PI], [3.0, 3.1, Math.PI]]
    .forEach(([x, z, r]) => sillaEn(x, z, r, "#E3A07E", 0.92));
  box(2.0, 2.05, 0.4, 0.28, 0.02, "#C9CED6", 0.75, 0.01);
  box(2.0, 2.05, 0.4, 0.02, 0.26, "#2A303C", 0.76, 0.01).rotation.x = -0.25;
  taza(2.95, 2.0, op.jefe.color); taza(1.85, 2.6, "#E5675A");
  box(2.75, 2.45, 0.3, 0.22, 0.006, "#FFFFFF", 0.75, 0.002).rotation.y = 0.2;
  // Pizarra con post-its y pantalla en el muro izquierdo
  box(0, 2.72, 0.03, 1.96, 1.21, ALU, 1.02, 0.02);
  box(0, 2.75, 0.05, 1.9, 1.15, "#FFFFFF", 1.05, 0.02);
  [[2.95, 1.85, "#FDE68A"], [3.25, 1.9, "#A7F3D0"], [3.55, 1.82, "#FBCFE8"], [3.9, 1.88, "#BFDBFE"], [3.1, 1.48, "#FDE68A"], [3.6, 1.43, "#BFDBFE"], [4.2, 1.5, "#A7F3D0"]]
    .forEach(([z, y, c]) => box(0.05, z, 0.012, 0.2, 0.2, c, y - 0.1, 0.004));
  box(0.05, 4.0, 0.008, 0.5, 0.025, "#1C4173", 1.75, 0.004);
  box(0.05, 4.0, 0.008, 0.35, 0.025, "#1C4173", 1.65, 0.004);
  box(0, 0.7, 0.07, 1.62, 0.94, "#15181F", 1.45, 0.03);
  const TV = lienzo(512, 288);
  plano(1.52, 0.855, new THREE.MeshBasicMaterial({ map: TV.t, toneMapped: false }), 0.075, 1.92, 1.51, Math.PI / 2);
  planta(0.35, 4.5, 0.95, 1); planta(4.55, 0.45, 1.0, 0);

  // --- Dirección (la oficina de Juan) ---
  function estante(x0, z0, d, h) {
    const c = "#7C5C44";
    box(x0, z0, 0.04, d, h, c);
    box(x0, z0, 0.4, 0.04, h, c); box(x0, z0 + d - 0.04, 0.4, 0.04, h, c);
    [0, 0.5, 1.0, 1.5, h - 0.04].forEach((y) => box(x0, z0, 0.4, d, 0.04, c, y, 0.01));
    const cols = [...AGENTES.map((a) => a.color), "#1C4173", "#94A3B8"];
    [0.04, 0.54, 1.04].forEach((y, i) => {
      let z = z0 + 0.08;
      for (let j = 0; j < 9 && z < z0 + d - 0.22; j++) {
        const w = 0.07 + ((j * 7) % 4) * 0.015, hh = 0.3 + ((j + i) % 3) * 0.05;
        box(x0 + 0.1, z, 0.26, w, hh, cols[(i * 3 + j) % cols.length], y, 0.008);
        z += w + 0.02;
      }
    });
    plantaMesa(x0 + 0.22, z0 + d / 2, 1.54);
  }
  estante(0.03, 7.25, 1.6, 2.0);
  box(0, 9.0, 0.03, 2.9, ALTO - 0.2, "#1C4173", 0, 0.01);
  escritorio(1.7, 8.6, 1.1, 2.4, "x-", "#6E4A33", "#5A3B28");
  monitor(2.15, 9.0, -Math.PI / 2, null);
  box(2.0, 10.15, 0.3, 0.4, 0.02, "#C9CED6", 0.75, 0.01);
  box(2.27, 10.15, 0.02, 0.4, 0.26, "#2A303C", 0.76, 0.01).rotation.z = -0.25;
  obj(cylGeo(0.07, 0.08, 0.02, 20), mat("#1C4173"), 2.5, 0.76, 10.8);
  obj(cylGeo(0.012, 0.012, 0.42, 8), mat("#C9CED6", { metalness: 0.4, roughness: 0.3 }), 2.5, 0.97, 10.8);
  obj(cylGeo(0.05, 0.12, 0.14, 24, true), mat("#F5E6C8", { emissive: "#FFE2A8", emissiveIntensity: 0.35, side: THREE.DoubleSide }), 2.5, 1.2, 10.8);
  box(2.62, 9.55, 0.04, 0.45, 0.09, "#1C4173", 0.75, 0.01);
  taza(2.45, 9.4, "#1C4173");
  sillaEn(3.2, 9.0, -Math.PI / 2, "#E3A07E");
  sillaEn(3.2, 10.5, -Math.PI / 2, "#E3A07E");
  planta(0.5, 11.45, 1.1, 2); planta(4.45, 7.5, 0.9, 0);

  // --- Cubículos (un coordinador por tema) ---
  AGENTES.forEach((ag) => {
    const a = ag.a;
    if (ag.banda === "top") {
      box(a + 0.3, 1.6, 2.6, 1.8, 0.012, ag.alfombra, 0, 0.01);
      if (!ag.ultimoTop) { panelZ(0, 4.2, a + 3.55, ag.panel); box(a + 2.85, 1.0, 0.5, 0.55, 0.62, BLANCO, 0, 0.03); }
      if (a === 7) panelZ(0, 4.2, a - 0.2, ag.panel);
      escritorio(a + 0.5, 1.0, ag.ultimoTop ? 2.2 : 2.3, 0.9, "z+");
      monitor(a + 1.25, 1.28, 0, ag, 0); monitor(a + 1.95, 1.28, 0, ag, 1);
      teclado(a + 1.6, 1.78, 0);
      taza(a + 2.45, 1.5, ag.color); plantaMesa(a + 0.75, 1.62);
      planta(a + 0.2, 3.6, 0.9, 0);
    } else {
      box(a + 0.3, 8.4, 2.6, 1.9, 0.012, ag.alfombra, 0, 0.01);
      panelX(a, a + 2.4, 7.15, ag.panel);
      panelZ(7.15, 11.6, a + 3.55, ag.panel);
      if (a === 7) panelZ(7.15, 11.6, a - 0.2, ag.panel);
      box(a + 0.2, 7.25, 1.5, 0.45, 0.66, BLANCO, 0, 0.03);
      carpetas(a + 0.3, 7.35, 0.66, [ag.color, palido(ag.color, 0.35), "#94A3B8", ag.color, palido(ag.color, 0.55)]);
      escritorio(a + 0.5, 9.8, 2.3, 0.9, "z-");
      monitor(a + 1.25, 10.42, Math.PI, ag, 0); monitor(a + 1.95, 10.42, Math.PI, ag, 1);
      teclado(a + 1.6, 9.92, Math.PI);
      taza(a + 0.8, 10.0, ag.color); plantaMesa(a + 2.45, 10.45);
      planta(a + 3.0, 11.35, 0.95, 1);
    }
  });

  // --- Rincón de descanso, impresora y agua (a la derecha de la banda de abajo) ---
  const DX = GX - 18;
  box(15.35 + DX, 8.55, 2.4, 2.95, 0.014, "#EADCCB", 0, 0.03);
  const SOFA = "#5E7FA8", COJIN = "#6C8DB6";
  box(15.25 + DX, 8.9, 0.85, 2.2, 0.36, SOFA, 0.06, 0.1);
  box(15.25 + DX, 8.9, 0.24, 2.2, 0.72, SOFA, 0.06, 0.1);
  box(15.25 + DX, 8.72, 0.85, 0.2, 0.56, SOFA, 0.06, 0.08);
  box(15.25 + DX, 11.08, 0.85, 0.2, 0.56, SOFA, 0.06, 0.08);
  box(15.5 + DX, 8.95, 0.56, 1.02, 0.1, COJIN, 0.42, 0.05); box(15.5 + DX, 10.03, 0.56, 1.02, 0.1, COJIN, 0.42, 0.05);
  obj(cylGeo(0.38, 0.38, 0.04, 32), mat("#F7F6F3", { roughness: 0.5 }), 16.75 + DX, 0.42, 9.95);
  obj(cylGeo(0.04, 0.05, 0.4, 12), mat("#B9C1CC", { metalness: 0.4, roughness: 0.35 }), 16.75 + DX, 0.2, 9.95);
  taza(16.65 + DX, 9.85, "#E3A23B", 0.44);
  box(16.8 + DX, 10.0, 0.28, 0.2, 0.012, "#E5675A", 0.44, 0.004).rotation.y = -0.3;
  box(15.4 + DX, 7.3, 0.8, 0.55, 0.55, BLANCO, 0, 0.03);
  box(15.45 + DX, 7.33, 0.7, 0.5, 0.3, "#D9DEE5", 0.55, 0.04);
  box(15.55 + DX, 7.55, 0.5, 0.22, 0.015, "#FFFFFF", 0.85, 0.005);
  obj(cylGeo(0.17, 0.17, 0.95, 24), mat("#F2F3F5", { roughness: 0.5 }), 17.5 + DX, 0.475, 7.65);
  obj(cylGeo(0.13, 0.13, 0.4, 24), mat("#8EC3EC", { transparent: true, opacity: 0.8, roughness: 0.1 }), 17.5 + DX, 1.15, 7.65);
  obj(cylGeo(0.12, 0.14, 0.02, 24), mat("#2B2F38"), 17.6 + DX, 0.01, 11.55);
  obj(cylGeo(0.014, 0.014, 1.5, 8), mat("#2B2F38"), 17.6 + DX, 0.76, 11.55);
  obj(cylGeo(0.13, 0.2, 0.26, 24, true), mat("#F5E6C8", { emissive: "#FFE2A8", emissiveIntensity: 0.3, side: THREE.DoubleSide }), 17.6 + DX, 1.58, 11.55);
  planta(17.5 + DX, 8.55, 1.0, 2); planta(15.55 + DX, 11.7, 0.85, 0);

  // Optimización: lo estático no recalcula matrices y lo chico no proyecta sombra
  scene.traverse((o) => {
    o.matrixAutoUpdate = false; o.updateMatrix();
    if (o.isMesh) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      if (o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) < 0.09) o.castShadow = false;
    }
  });
  scene.updateMatrixWorld(true);

  // ===================================================================
  // 5. PERSONAJES
  // ===================================================================
  function crearPersona(L) {
    const root = new THREE.Group();
    const piel = mat(L.skin, { roughness: 0.6 }), ropa = mat(L.top, { roughness: 0.85 }), pant = mat(L.pants, { roughness: 0.85 });
    const pelo = mat(L.hair, { roughness: 0.55 }), zap = mat("#262A33", { roughness: 0.5 });
    const hips = new THREE.Group(); root.add(hips);
    const legs = [-1, 1].map((s) => {
      const thigh = new THREE.Group(); thigh.position.x = 0.09 * s; hips.add(thigh);
      obj(capGeo(0.075, 0.11), pant, 0, -0.125, 0, thigh);
      const knee = new THREE.Group(); knee.position.y = -0.25; thigh.add(knee);
      obj(capGeo(0.066, 0.1), pant, 0, -0.115, 0, knee);
      obj(rboxGeo(0.13, 0.075, 0.22, 0.035), zap, 0, -0.255, 0.04, knee);
      return { thigh, knee };
    });
    const upper = new THREE.Group(); hips.add(upper);
    obj(capGeo(0.19, 0.24), ropa, 0, 0.3, 0, upper).scale.set(1.08, 1, 0.8);
    if (L.shirt) obj(sphGeo(0.075, 16, 12), mat(L.shirt, { roughness: 0.7 }), 0, 0.53, 0.112, upper).scale.set(1, 1.15, 0.45);
    const head = new THREE.Group(); head.position.y = 0.62; upper.add(head);
    obj(cylGeo(0.055, 0.06, 0.1, 12), piel, 0, 0, 0, head);
    obj(sphGeo(0.205, 32, 24), piel, 0, 0.19, 0, head);
    const ojo = mat("#1E2430", { roughness: 0.3 }), mej = mat("#F09A8E", { roughness: 0.9 });
    [-1, 1].forEach((s) => {
      obj(sphGeo(0.022, 10, 8), ojo, 0.07 * s, 0.2, 0.185, head).castShadow = false;
      const m = obj(sphGeo(0.03, 10, 8), mej, 0.115 * s, 0.135, 0.158, head); m.scale.set(1, 0.65, 0.4); m.castShadow = false;
    });
    obj(sphGeo(0.218, 32, 24), pelo, 0, 0.2, -0.035, head);
    const casco = obj(geo("casco", () => new THREE.SphereGeometry(0.222, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.36)), pelo, 0, 0.2, 0.005, head);
    casco.rotation.x = 0.2;
    if (L.peinado === "largo") obj(capGeo(0.16, 0.2), pelo, 0, 0.02, -0.1, head).scale.set(1.18, 1, 0.55);
    if (L.peinado === "moño") obj(sphGeo(0.095, 16, 12), pelo, 0, 0.41, -0.1, head);
    const arms = [-1, 1].map((s) => {
      const sh = new THREE.Group(); sh.position.set(0.235 * s, 0.5, 0); sh.userData.s = s; upper.add(sh);
      obj(capGeo(0.058, 0.2), ropa, 0, -0.16, 0, sh);
      obj(sphGeo(0.062, 14, 10), piel, 0, -0.33, 0, sh);
      return sh;
    });
    const carpeta = obj(rboxGeo(0.24, 0.32, 0.035, 0.012), mat("#F2C14E", { roughness: 0.6 }), 0.03, -0.36, 0.1, arms[1]);
    carpeta.rotation.set(0.1, 0, 0.05); carpeta.visible = false;
    return { root, hips, upper, head, legs, arms, carpeta };
  }
  // zFuera > 0 abre el brazo hacia afuera; < 0 lo cierra hacia el cuerpo
  function brazo(b, x, zFuera) { b.rotation.set(x, 0, zFuera * b.userData.s); }
  function poseDePie(p, t, caminando) {
    if (caminando) {
      const w = t * 9, s = Math.sin(w);
      p.hips.position.y = 0.54 + Math.abs(Math.cos(w)) * 0.025;
      p.legs[0].thigh.rotation.x = s * 0.5; p.legs[1].thigh.rotation.x = -s * 0.5;
      p.legs[0].knee.rotation.x = Math.max(0, -Math.cos(w)) * 0.6;
      p.legs[1].knee.rotation.x = Math.max(0, Math.cos(w)) * 0.6;
      brazo(p.arms[0], -s * 0.45, 0.08); brazo(p.arms[1], s * 0.45, 0.08);
      p.upper.rotation.x = 0.05; p.head.rotation.set(0, 0, 0);
    } else {
      p.hips.position.y = 0.54;
      p.legs.forEach((l) => { l.thigh.rotation.x = 0; l.knee.rotation.x = 0; });
      brazo(p.arms[0], Math.sin(t * 1.4) * 0.04, 0.1); brazo(p.arms[1], -Math.sin(t * 1.4) * 0.04, 0.1);
      p.upper.rotation.x = 0; p.head.rotation.set(Math.sin(t * 0.9) * 0.03, Math.sin(t * 0.4) * 0.25, 0);
    }
    p.upper.scale.y = 1 + Math.sin(t * 1.8) * 0.006;
  }
  function poseSentado(p, t, modo) {
    p.hips.position.y = 0.41;
    p.legs.forEach((l) => { l.thigh.rotation.x = -1.5; l.knee.rotation.x = 1.45; });
    p.upper.scale.y = 1 + Math.sin(t * 1.6) * 0.008;
    const [L, R] = p.arms;
    if (modo === "tecleando") {
      p.upper.rotation.x = 0.1;
      brazo(L, -1.22 + Math.sin(t * 15) * 0.07, -0.06); brazo(R, -1.22 + Math.sin(t * 15 + 2) * 0.07, -0.06);
      p.head.rotation.set(0.12, Math.sin(t * 0.7) * 0.06, 0);
    } else if (modo === "relajado") {
      p.upper.rotation.x = -0.12;
      brazo(L, -3.45, -0.6); brazo(R, -3.45, -0.6);
      p.head.rotation.set(-0.08, Math.sin(t * 0.5) * 0.2, 0);
    } else if (modo === "saludo") {
      p.upper.rotation.x = 0;
      brazo(L, -1.05, -0.04); brazo(R, -2.95, 0.25 + Math.sin(t * 11) * 0.3);
      p.head.rotation.set(-0.05, 0, Math.sin(t * 5) * 0.06);
    } else {
      p.upper.rotation.x = 0.03;
      brazo(L, -1.05, -0.04); brazo(R, -1.05, -0.04);
      p.head.rotation.set(Math.sin(t * 0.8) * 0.04, Math.sin(t * 0.35) * 0.4, 0);
    }
  }

  // Etiquetas, anillos de estado y selección
  const PICK = [];
  function registrarPick(o, id) { o.traverse((m) => { if (m.isMesh) { m.userData.pick = id; PICK.push(m); } }); }
  function etiqueta(id, nombre, color, alto, padre) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="tag" data-pick="${id}"><div class="nm"><i style="background:${color}"></i>${esc(nombre)}</div><div class="st"></div><div class="bar"><i></i></div></div>`;
    const o = new CSS2DObject(wrap); o.center.set(0.5, 1); o.position.set(0, alto, 0); padre.add(o);
    return { tag: wrap.firstElementChild, st: wrap.querySelector(".st"), bar: wrap.querySelector(".bar i"), cls: "", txt: "", w: "" };
  }
  function anillo() {
    const g = new THREE.Group(); g.position.y = 0.02;
    const r = new THREE.Mesh(geo("ring", () => new THREE.RingGeometry(0.5, 0.58, 48)), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    const d = new THREE.Mesh(geo("disc", () => new THREE.CircleGeometry(0.5, 48)), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    r.rotation.x = d.rotation.x = -Math.PI / 2; g.add(r, d); scene.add(g);
    return { g, r, d };
  }
  function pintarAnillo(an, estado, t, sel) {
    const u = ESTADO_UI[estado];
    an.r.material.color.set(u.ring); an.d.material.color.set(u.ring);
    const opac = estado === "aprobacion" ? 0.45 + (Math.sin(t * 5) * 0.5 + 0.5) * 0.5 : u.op;
    an.r.material.opacity = opac; an.d.material.opacity = opac * 0.18;
    const s = sel ? 1.2 : 1; an.g.scale.set(s, 1, s);
  }

  AGENTES.forEach((a) => {
    const g = new THREE.Group(); g.position.set(a.x, 0, a.z); g.rotation.y = a.rot; scene.add(g);
    g.add(silla("#2F3747"));
    a.p = crearPersona(a.look); a.p.root.position.z = 0.02; g.add(a.p.root);
    a.E = etiqueta(a.id, a.nombre, a.color, 1.72, g);
    a.an = anillo(); a.an.g.position.set(a.x, 0.02, a.z);
    registrarPick(g, a.id);
  });
  {
    const g = new THREE.Group(); g.position.set(JUAN.x, 0, JUAN.z); g.rotation.y = JUAN.rot; scene.add(g);
    g.add(silla("#2B2F3A", true));
    JUAN.p = crearPersona(JUAN.look); JUAN.p.root.position.z = 0.02; g.add(JUAN.p.root);
    JUAN.E = etiqueta("juan", JUAN.nombre, JUAN.color, 1.75, g);
    registrarPick(g, "juan");
  }
  {
    const g = new THREE.Group(); g.position.set(COORD.x, 0, COORD.z); scene.add(g);
    COORD.g = g;
    COORD.p = crearPersona(COORD.look); g.add(COORD.p.root);
    COORD.E = etiqueta("coord", COORD.nombre, COORD.color, 1.95, g);
    COORD.an = anillo();
    registrarPick(g, "coord");
  }

  // ===================================================================
  // 6. TEXTURAS CON TEXTO (letreros, pantallas, TV)
  // ===================================================================
  await Promise.race([
    Promise.all([`600 46px ${FD}`, `700 150px ${FD}`, `500 16px ${FS}`, `600 14px ${FS}`].map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});

  function letrero(texto, color, x, y, z, rotY, ancho) {
    const { t } = lienzo(512, 112, (c, w, h) => {
      c.fillStyle = "#FFFFFF"; rr(c, 4, 4, w - 8, h - 8, 28); c.fill();
      c.fillStyle = color; c.beginPath(); c.arc(54, h / 2, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#0B1A2E"; c.font = `600 46px ${FD}, sans-serif`; c.textBaseline = "middle"; c.fillText(texto, 86, h / 2 + 2);
    });
    plano(ancho, (ancho * 112) / 512, new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6 }), x, y, z, rotY);
  }
  const anchoLetrero = (s) => Math.min(2.1, 0.6 + s.length * 0.085);
  AGENTES.forEach((a) => {
    if (a.banda === "top") letrero(a.nombre, a.color, a.a + 1.75, 2.95, 0.03, 0, anchoLetrero(a.nombre));
    else letrero(a.nombre, a.color, a.a + 1.2, 1.34, 7.2, 0, anchoLetrero(a.nombre));
  });
  letrero("Gabinete", op.jefe.color, 1.1, 1.6, 4.995, 0, 1.2);
  letrero("Dirección", "#1C4173", 4.995, 1.6, 8.0, Math.PI / 2, 1.2);
  {
    const { t } = lienzo(1024, 256, (c) => {
      c.fillStyle = "#FFFFFF"; c.font = `700 120px ${FD}, sans-serif`; c.textBaseline = "alphabetic"; c.fillText(op.marca.titulo, 30, 150);
      c.fillStyle = "rgba(255,255,255,.7)"; c.font = `500 36px ${FS}, sans-serif`; c.fillText(op.marca.subtitulo, 36, 222);
    });
    plano(2.5, 0.625, new THREE.MeshBasicMaterial({ map: t, transparent: true }), 0.04, 2.3, 10.45, Math.PI / 2);
  }

  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  function dibujarPantalla(s, tt) {
    const d = s.dueno, st = d.estado;
    const clave = st === "trabajando" ? "w" + Math.floor(tt * 6) : st + (st === "aprobacion" ? Math.floor(tt * 2) % 2 : "");
    if (clave === s.ultimo) return;
    s.ultimo = clave;
    const x = s.x, W = 256, H = 150;
    x.textBaseline = "alphabetic"; x.textAlign = "left";
    if (st === "trabajando") {
      x.fillStyle = "#F6F8FC"; x.fillRect(0, 0, W, H);
      x.fillStyle = d.color; x.fillRect(0, 0, W, 18);
      x.fillStyle = "rgba(255,255,255,.9)"; x.font = `600 11px ${FS}, sans-serif`; x.fillText(d.tarea ? corto(d.tarea.texto, 34) : d.nombre, 8, 13);
      if (s.variante === 0) {
        const fila = Math.floor(tt * 2.5) % 6;
        for (let i = 0; i < 6; i++) {
          const y = 26 + i * 19;
          x.fillStyle = i === fila ? hexA(d.color, 0.16) : i % 2 ? "#EDF1F7" : "#FFFFFF"; x.fillRect(8, y, W - 16, 16);
          x.fillStyle = "#9AA8BF"; x.fillRect(14, y + 6, 50 + ((i * 23) % 40), 4);
          x.fillStyle = "#C7D0DE"; x.fillRect(120, y + 6, 34, 4);
          x.fillStyle = i <= fila ? d.color : "#D5DCE7"; x.fillRect(184, y + 6, 46, 4);
        }
      } else {
        x.fillStyle = "#0B1A2E"; x.font = `600 22px ${FD}, sans-serif`; x.fillText(Math.floor(d.progreso * 100) + "%", 12, 46);
        x.fillStyle = "#E3E9F2"; x.fillRect(12, 54, W - 24, 6);
        x.fillStyle = d.color; x.fillRect(12, 54, (W - 24) * d.progreso, 6);
        for (let i = 0; i < 9; i++) {
          const h = 16 + (Math.sin(tt * 2 + i * 0.9) * 0.5 + 0.5) * 54;
          x.fillStyle = i % 3 === 0 ? d.color : "#C9D6EA"; x.fillRect(14 + i * 26, 140 - h, 16, h);
        }
      }
    } else if (st === "aprobacion") {
      const on = Math.floor(tt * 2) % 2;
      x.fillStyle = "#FFF8EC"; x.fillRect(0, 0, W, H);
      x.fillStyle = on ? "#F2A93B" : "#E5962A"; x.fillRect(0, 0, W, 18);
      x.fillStyle = "#FFFFFF"; x.strokeStyle = "#E7C48A"; x.lineWidth = 2; rr(x, 100, 30, 56, 70, 6); x.fill(); x.stroke();
      x.fillStyle = "#E7D2AE"; [44, 56, 68, 80].forEach((y) => x.fillRect(110, y, 36, 4));
      x.fillStyle = "#8A5A12"; x.font = `600 14px ${FS}, sans-serif`; x.textAlign = "center"; x.fillText("Esperando aprobación", W / 2, 128);
    } else if (st === "listo") {
      x.fillStyle = "#EAF7F0"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#1F9D6B"; x.beginPath(); x.arc(W / 2, 66, 30, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#FFFFFF"; x.lineWidth = 7; x.lineCap = "round"; x.beginPath(); x.moveTo(W / 2 - 13, 67); x.lineTo(W / 2 - 3, 77); x.lineTo(W / 2 + 15, 57); x.stroke();
      x.fillStyle = "#17845A"; x.font = `600 14px ${FS}, sans-serif`; x.textAlign = "center"; x.fillText("Aprobado", W / 2, 124);
    } else {
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, d.color); g.addColorStop(1, "#1C4173");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = "#FFFFFF"; x.font = `700 28px ${FD}, sans-serif`; x.textAlign = "center"; x.fillText(d.corto, W / 2, 80);
      x.fillStyle = "rgba(255,255,255,.7)"; x.font = `500 12px ${FS}, sans-serif`; x.fillText(`${plural(d.stats.notas, "nota")} · ${plural(d.stats.tareas, "tarea")}`, W / 2, 104);
    }
    x.textAlign = "left";
    s.t.needsUpdate = true;
  }
  function dibujarTV() {
    const x = TV.x, W = 512;
    const g = x.createLinearGradient(0, 0, W, 288); g.addColorStop(0, "#0F2342"); g.addColorStop(1, "#1C4173");
    x.fillStyle = g; x.fillRect(0, 0, W, 288);
    x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillStyle = "#FFFFFF"; x.font = `600 28px ${FD}, sans-serif`; x.fillText("Tablero de control", 28, 50);
    x.fillStyle = "rgba(255,255,255,.6)"; x.font = `500 16px ${FS}, sans-serif`; x.fillText(`Oficina de ${JUAN.nombre} · ${hora()}`, 28, 76);
    const act = AGENTES.filter((a) => a.estado === "trabajando").length + (COORD.ocupada ? 1 : 0);
    const apr = AGENTES.filter((a) => a.estado === "aprobacion").length;
    [["Activos", `${act}/${AGENTES.length + 1}`], ["Por aprobar", String(apr)], ["Encargos", String(encargosHoy)]].forEach(([l, v], i) => {
      const X = 28 + i * 156;
      x.fillStyle = "rgba(255,255,255,.08)"; rr(x, X, 96, 140, 84, 14); x.fill();
      x.fillStyle = i === 1 && apr ? "#FBBF24" : "#FFFFFF"; x.font = `600 36px ${FD}, sans-serif`; x.fillText(v, X + 16, 146);
      x.fillStyle = "rgba(255,255,255,.65)"; x.font = `500 15px ${FS}, sans-serif`; x.fillText(l, X + 16, 168);
    });
    const paso = (W - 56) / AGENTES.length;
    AGENTES.forEach((a, i) => {
      const X = 28 + i * paso;
      x.fillStyle = ESTADO_UI[a.estado].ring; rr(x, X, 206, paso - 10, 8, 4); x.fill();
      x.fillStyle = "rgba(255,255,255,.75)"; x.font = `500 13px ${FS}, sans-serif`; x.fillText(a.corto, X, 240);
    });
    TV.t.needsUpdate = true;
  }

  // ===================================================================
  // 7. RUTAS DEL JEFE DE GABINETE Y LÓGICA DE ENCARGOS (simulada)
  // ===================================================================
  const LUGARES = {
    home: { parada: [2.65, 4.05], camino: [[2.65, 6.0]] },
    juan: { parada: [4.15, 9.75], camino: [[6.0, 9.75], [6.0, 6.0]] },
  };
  AGENTES.forEach((a) => { LUGARES[a.id] = { parada: a.parada, camino: [[a.parada[0], 6.0]] }; });
  function caminarA(destino, cb) {
    if (COORD.en === destino) { cb && cb(); return; }
    const de = LUGARES[COORD.en], a = LUGARES[destino];
    COORD.ruta = [...de.camino, ...a.camino.slice().reverse(), a.parada];
    COORD.destino = destino; COORD.alLlegar = cb;
  }
  function mirarHacia(lugar) {
    if (lugar === "home") return Math.PI / 4;
    const o = lugar === "juan" ? JUAN : AG[lugar];
    return Math.atan2(o.x - COORD.x, o.z - COORD.z);
  }
  function lerpAngulo(a, b, k) { const d = (((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; }

  const cola = [];
  let encargosHoy = 0, T = 0;

  const log = $("log");
  const misMensajes = []; // al desmontar se quitan solo los de esta instancia
  function msg(quien, html, extra = "") {
    const p = PERFIL[quien];
    const d = document.createElement("div"); d.className = "msg"; misMensajes.push(d);
    d.innerHTML = `<div class="av" style="background:${p.color}">${p.ini}</div><div class="b"><div class="meta"><b>${esc(p.nombre)}</b>${hora()}</div><div class="tx">${html}</div>${extra}</div>`;
    log.appendChild(d);
    while (log.children.length > 80) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function tarjetaBorrador(a) {
    const r = a.tarea.respuesta;
    const notas = r.enlaces.length ? `<div class="notas">${r.enlaces.map((e) => `<button data-nav="${esc(e.href)}">📄 ${esc(corto(e.titulo, 34))}</button>`).join("")}</div>` : "";
    return `<div class="draft" data-borrador="${a.id}-${a.tarea.n}"><div class="dl">Borrador · ${esc(r.titulo)}</div><div class="bt">${esc(r.borrador)}</div>${notas}
      <div class="acts"><button class="btn green sm" data-ap="${a.id}">Aprobar</button><button class="btn ghost sm" data-ver="${a.id}">Ver en la oficina</button></div></div>`;
  }

  let nTarea = 0;
  function encargar(texto, destino) {
    texto = texto.trim(); if (!texto) return;
    msg("juan", esc(texto));
    let id = destino;
    if (destino === "auto") {
      id = op.enrutar(texto);
      if (!id) {
        setTimeout(() => msg("coord", "No tengo claro a quién le corresponde. Elige un coordinador en «Para:» o dame un poco más de detalle."), 350);
        return;
      }
    }
    encargosHoy++;
    const ag = AG[id];
    const job = { texto, ag, n: ++nTarea };
    const ocupada = COORD.ocupada;
    if (destino === "auto") setTimeout(() => msg("coord", `Esto le corresponde a <b>${esc(ag.titulo)}</b>.${ocupada ? " Lo anoto y voy apenas termine." : " Voy por el encargo."}`), 350);
    cola.push(job);
    procesarCola();
  }
  function procesarCola() {
    if (COORD.ocupada || !cola.length) return;
    const job = cola.shift(); COORD.ocupada = true;
    setCoord("camino", `Va donde ${JUAN.nombre}`);
    caminarA("juan", () => {
      msg("coord", `Recibido, ${JUAN.nombre}. Se lo llevo a ${esc(job.ag.nombre)}.`);
      COORD.llevando = true; setCoord("camino", `Lleva encargo → ${job.ag.corto}`);
      caminarA(job.ag.id, () => {
        COORD.llevando = false; COORD.entregaT = T;
        entregar(job);
        setCoord("camino", "Volviendo al gabinete");
        caminarA("home", () => { COORD.ocupada = false; setCoord("disponible", "En el gabinete"); procesarCola(); });
      });
    });
  }
  function setCoord(estado, texto) { COORD.estado = estado; COORD.texto = texto; }
  function entregar(job) {
    const a = job.ag;
    if (a.estado === "trabajando" || a.estado === "aprobacion" || a.estado === "listo") {
      a.cola.push(job);
      msg(a.id, `Recibido. Lo dejo en cola (${a.cola.length}); termino lo actual primero.`);
    } else iniciar(a, job);
  }
  function iniciar(a, job) {
    a.estado = "trabajando"; a.progreso = 0; a.tarea = job; a.dur = 5 + Math.random() * 3;
    msg(a.id, `Manos a la obra: «${esc(corto(job.texto))}».`);
  }
  function terminar(a) {
    a.estado = "aprobacion";
    a.tarea.respuesta = op.responder(a.id, a.tarea.texto);
    msg(a.id, esc(a.tarea.respuesta.resumen), tarjetaBorrador(a));
  }
  function aprobar(id) {
    const a = AG[id];
    if (!a || a.estado !== "aprobacion") return;
    a.estado = "listo"; a.hechas++; a.listoHasta = T + 2.6; JUAN.saludoHasta = T + 1.4;
    msg("juan", `Aprobado ✓ ${esc(corto(a.tarea.texto, 50))}`);
    log.querySelectorAll(`[data-borrador="${a.id}-${a.tarea.n}"] [data-ap]`).forEach((b) => { b.disabled = true; b.textContent = "Aprobado ✓"; });
  }

  // ===================================================================
  // 8. INTERFAZ: ficha, selección, canal y tablero
  // ===================================================================
  let seleccion = null, hover = null, fichaHTML = "";
  const ficha = $("ficha");
  function posDe(id) {
    if (id === "coord") return { x: COORD.x, z: COORD.z };
    if (id === "juan") return { x: JUAN.x, z: JUAN.z };
    return AG[id] ? { x: AG[id].x, z: AG[id].z } : null;
  }
  function seleccionar(id, volar) {
    seleccion = id; refrescarFicha(true);
    const p = posDe(id);
    if (volar && p) volarA(new THREE.Vector3(p.x, 0.8, p.z), Math.max(camera.zoom, 1.6));
  }
  function cerrarFicha() { seleccion = null; ficha.hidden = true; fichaHTML = ""; }
  const cab = (ini, color, titulo, sub) => `<div class="f-head"><div class="f-av" style="background:${color}">${ini}</div><div><h3>${esc(titulo)}</h3><small>${esc(sub)}</small></div><button class="f-x" data-cerrar aria-label="Cerrar">×</button></div>`;
  const sec = (t, v) => `<div class="f-sec"><h5>${t}</h5><div class="v">${v}</div></div>`;
  function refrescarFicha(forzar) {
    if (!seleccion) return;
    let h = "";
    if (seleccion === "juan") {
      h = cab(JUAN.ini, JUAN.color, JUAN.nombre, "Director · persona") + `<div class="f-st"><span class="cst jefa">Director</span></div>` + sec("Rol", esc(JUAN.rol))
        + `<div class="f-acts"><button class="btn ghost sm" data-nav="/oficina/archivo">Abrir el archivo del vault</button></div>`;
    } else if (seleccion === "coord") {
      h = cab(COORD.ini, COORD.color, COORD.nombre, "Agente principal · reparte el trabajo")
        + `<div class="f-st"><span class="cst ${COORD.estado}">${esc(COORD.texto)}</span></div>`
        + sec("Qué hace", esc(COORD.rol))
        + sec("Encargos en espera", cola.length ? cola.map((j) => `• ${esc(corto(j.texto, 50))} → ${esc(j.ag.corto)}`).join("<br>") : "Ninguno")
        + `<div class="f-acts"><button class="btn ghost sm" data-escribir="auto">Encargar algo</button></div>`;
    } else {
      const a = AG[seleccion], u = ESTADO_UI[a.estado];
      h = cab(a.ini, a.color, a.nombre, a.titulo)
        + `<div class="f-st"><span class="cst ${a.estado}">${u.txt}</span>${a.cola.length ? `<span class="f-q">${a.cola.length} en cola</span>` : ""}</div>`
        + (a.estado === "trabajando" ? `<div class="f-prog"><i data-o="f-prog"></i></div>` : "")
        + sec("Qué hace", esc(a.rol))
        + sec("Su área del vault", `${esc(a.stats.carpetas.join(" · ") || "—")}<br><span style="color:var(--muted)">${plural(a.stats.notas, "nota")} · ${plural(a.stats.tareas, "tarea abierta", "tareas abiertas")}</span>`)
        + (a.stats.destacadas.length ? sec("Notas a mano", a.stats.destacadas.map((e) => `<button class="tool" data-nav="${esc(e.href)}">${esc(corto(e.titulo, 30))}</button>`).join("")) : "")
        + (a.tarea ? sec("Tarea actual", esc(a.tarea.texto)) : "")
        + (a.estado === "aprobacion" ? sec("Borrador", `<div class="draft">${esc(a.tarea.respuesta.borrador)}</div>`) : "")
        + sec("Aprobadas hoy", String(a.hechas))
        + `<div class="f-acts">${a.estado === "aprobacion" ? `<button class="btn green sm" data-ap="${a.id}">Aprobar</button>` : ""}<button class="btn ghost sm" data-escribir="${a.id}">Encargarle algo</button>${a.stats.sala ? `<button class="btn ghost sm" data-nav="${esc(a.stats.sala)}">Ver su sala</button>` : ""}</div>`;
    }
    if (forzar || h !== fichaHTML) { ficha.innerHTML = h; fichaHTML = h; }
    ficha.hidden = false;
    const pr = $("f-prog");
    if (pr && AG[seleccion]) pr.style.width = Math.floor(AG[seleccion].progreso * 100) + "%";
  }

  const dest = $("dest"), txt = $("txt");
  dest.innerHTML = `<option value="auto">Para: ${esc(COORD.nombre)} (decide quién)</option>` + AGENTES.map((a) => `<option value="${a.id}">Para: ${esc(a.titulo)}</option>`).join("");
  $("chips").innerHTML = op.sugerencias.map((s, i) => `<button class="chip" data-sug="${i}">${esc(s)}</button>`).join("");
  function enviar() { encargar(txt.value, dest.value); txt.value = ""; }
  escuchar($("send"), "click", enviar);
  escuchar(txt, "keydown", (e) => { if (e.key === "Enter") enviar(); });
  escuchar(raiz, "click", (e) => {
    const t = e.target.closest("[data-ap],[data-ver],[data-escribir],[data-cerrar],[data-sug],[data-pick],[data-nav]");
    if (!t) return;
    if (t.dataset.nav) { e.preventDefault(); return op.navegar(t.dataset.nav); }
    if (t.dataset.ap) return aprobar(t.dataset.ap);
    if (t.dataset.ver) return seleccionar(t.dataset.ver, true);
    if (t.dataset.escribir) { dest.value = t.dataset.escribir; txt.focus(); return; }
    if (t.hasAttribute("data-cerrar")) return cerrarFicha();
    if (t.dataset.sug) { txt.value = op.sugerencias[+t.dataset.sug]; dest.value = "auto"; txt.focus(); return; }
    if (t.dataset.pick) return seleccionar(t.dataset.pick, true);
  });
  escuchar(window, "keydown", (e) => { if (e.key === "Escape") cerrarFicha(); });
  escuchar($("centrar"), "click", () => centrar());

  function actualizarKPIs() {
    const act = AGENTES.filter((a) => a.estado === "trabajando").length + (COORD.ocupada ? 1 : 0);
    const apr = AGENTES.filter((a) => a.estado === "aprobacion").length;
    $("k-act").textContent = `${act} / ${AGENTES.length + 1}`;
    $("k-enc").textContent = encargosHoy;
    $("k-apr").textContent = apr;
    const e = $("k-est"); e.textContent = apr ? "Revisión pendiente" : "Operativa"; e.className = apr ? "warn" : "ok";
  }
  function pintar(E, estado, texto, prog, id) {
    const cls = "tag " + estado + (seleccion === id ? " sel" : "") + (hover === id ? " hov" : "");
    if (E.cls !== cls) { E.tag.className = cls; E.cls = cls; }
    if (E.txt !== texto) { E.st.textContent = texto; E.txt = texto; }
    if (estado === "trabajando") { const w = Math.floor(prog * 100) + "%"; if (E.w !== w) { E.bar.style.width = w; E.w = w; } }
  }
  function pintarEtiquetas() {
    AGENTES.forEach((a) => {
      const u = ESTADO_UI[a.estado];
      let texto = a.estado === "trabajando" ? `Trabajando · ${Math.floor(a.progreso * 100)}%` : u.txt;
      if (a.cola.length) texto += ` · ${a.cola.length} en cola`;
      pintar(a.E, a.estado, texto, a.progreso, a.id);
    });
    pintar(COORD.E, COORD.estado, COORD.texto, 0, "coord");
    pintar(JUAN.E, "jefa", "Director", 0, "juan");
  }

  // ===================================================================
  // 9. CÁMARA: encuadre, foco y límites
  // ===================================================================
  const BASE = new THREE.Vector3(GX / 2, 0.6, GY / 2);
  let encuadre = { w: 20, h: 12 }, casa = null, tween = null;
  function encuadrar() {
    const tgt = BASE.clone();
    camera.position.copy(tgt).addScaledVector(DIR, 80); camera.lookAt(tgt); camera.updateMatrixWorld(true);
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    for (const x of [-0.4, GX + 0.4]) for (const y of [-0.5, ALTO + 0.3]) for (const z of [-0.4, GY + 0.4]) {
      const v = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
      a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); d = Math.max(d, v.y);
    }
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    tgt.addScaledVector(right, (a + b) / 2).addScaledVector(up, (c + d) / 2);
    encuadre = { w: (b - a) * 1.03, h: (d - c) * 1.05 };
    casa = { t: tgt, p: tgt.clone().addScaledVector(DIR, 80), z: stageEl.clientWidth < 600 ? 1.3 : 1 };
    camera.position.copy(casa.p); controls.target.copy(casa.t); camera.zoom = casa.z;
    ajustarFrustum(); controls.update();
  }
  function ajustarFrustum() {
    const w = stageEl.clientWidth || 800, h = stageEl.clientHeight || 600, asp = w / h;
    let fw = encuadre.w, fh = encuadre.h;
    if (fw / fh > asp) fh = fw / asp; else fw = fh * asp;
    camera.left = -fw / 2; camera.right = fw / 2; camera.top = fh / 2; camera.bottom = -fh / 2;
    camera.updateProjectionMatrix();
  }
  function redimensionar() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); css2d.setSize(w, h); ajustarFrustum();
  }
  function volarA(tgt, zoom, ms = 700) {
    const off = camera.position.clone().sub(controls.target);
    tween = { t0: performance.now(), ms, t1: controls.target.clone(), t2: tgt.clone(), p1: camera.position.clone(), p2: tgt.clone().add(off), z1: camera.zoom, z2: zoom };
  }
  function centrar() {
    tween = { t0: performance.now(), ms: 800, t1: controls.target.clone(), t2: casa.t.clone(), p1: camera.position.clone(), p2: casa.p.clone(), z1: camera.zoom, z2: casa.z };
  }
  function pasoTween() {
    const k = Math.min(1, (performance.now() - tween.t0) / tween.ms);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    controls.target.lerpVectors(tween.t1, tween.t2, e);
    camera.position.lerpVectors(tween.p1, tween.p2, e);
    camera.zoom = tween.z1 + (tween.z2 - tween.z1) * e; camera.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }
  controls.addEventListener("start", () => { tween = null; });
  controls.addEventListener("change", () => {
    const t = controls.target, c = THREE.MathUtils.clamp;
    const d = new THREE.Vector3(c(t.x, 2, GX - 2) - t.x, c(t.y, 0, 2) - t.y, c(t.z, 1, 11) - t.z);
    if (d.lengthSq() > 0) { t.add(d); camera.position.add(d); }
  });
  const observador = new ResizeObserver(redimensionar);
  observador.observe(stageEl);
  redimensionar();
  encuadrar();

  // Selección con el mouse
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function idBajo(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(PICK, false)[0];
    return hit ? hit.object.userData.pick : null;
  }
  let abajo = null;
  escuchar(renderer.domElement, "pointerdown", (e) => { abajo = { x: e.clientX, y: e.clientY }; });
  escuchar(renderer.domElement, "pointerup", (e) => {
    if (!abajo) return;
    const mov = Math.hypot(e.clientX - abajo.x, e.clientY - abajo.y); abajo = null;
    if (mov > 6) return;
    const id = idBajo(e);
    if (id) seleccionar(id, true); else cerrarFicha();
  });
  escuchar(renderer.domElement, "pointermove", (e) => {
    if (e.buttons) return;
    const id = idBajo(e);
    if (id !== hover) { hover = id; renderer.domElement.style.cursor = id ? "pointer" : ""; }
  });

  // ===================================================================
  // 10. BUCLE PRINCIPAL
  // ===================================================================
  function logica(dt) {
    if (COORD.ruta.length) {
      const [tx, tz] = COORD.ruta[0];
      const dx = tx - COORD.x, dz = tz - COORD.z, dist = Math.hypot(dx, dz), paso = 2.6 * dt;
      if (dist > 1e-4) COORD.yawObj = Math.atan2(dx, dz);
      if (dist <= paso) {
        COORD.x = tx; COORD.z = tz; COORD.ruta.shift();
        if (!COORD.ruta.length) {
          COORD.en = COORD.destino; COORD.yawObj = mirarHacia(COORD.en);
          const cb = COORD.alLlegar; COORD.alLlegar = null; cb && cb();
        }
      } else { COORD.x += (dx / dist) * paso; COORD.z += (dz / dist) * paso; }
    }
    COORD.yaw = lerpAngulo(COORD.yaw, COORD.yawObj, 1 - Math.exp(-dt * 10));
    AGENTES.forEach((a) => {
      if (a.estado === "trabajando") {
        a.progreso = Math.min(1, a.progreso + dt / a.dur);
        if (a.progreso >= 1) terminar(a);
      } else if (a.estado === "listo" && T > a.listoHasta) {
        a.tarea = null;
        if (a.cola.length) iniciar(a, a.cola.shift()); else a.estado = "disponible";
      }
    });
  }
  function animar(t) {
    AGENTES.forEach((a, i) => {
      const modo = { trabajando: "tecleando", aprobacion: "relajado", listo: "saludo" }[a.estado] || "idle";
      poseSentado(a.p, t + i * 1.7, modo);
      pintarAnillo(a.an, a.estado, t, seleccion === a.id || hover === a.id);
    });
    poseSentado(JUAN.p, t + 3, T < JUAN.saludoHasta ? "saludo" : Math.floor(t / 7) % 2 ? "tecleando" : "idle");
    poseDePie(COORD.p, t, COORD.ruta.length > 0);
    if (COORD.llevando) brazo(COORD.p.arms[1], -0.55, 0.05);
    if (T - COORD.entregaT < 0.9) brazo(COORD.p.arms[1], -1.35, -0.05);
    COORD.p.carpeta.visible = COORD.llevando;
    COORD.g.position.set(COORD.x, 0, COORD.z); COORD.g.rotation.y = COORD.yaw;
    COORD.an.g.position.set(COORD.x, 0.02, COORD.z);
    pintarAnillo(COORD.an, COORD.estado, t, seleccion === "coord" || hover === "coord");
  }

  // Estado inicial: parte del día y, si hay algo urgente, un borrador listo para revisar
  msg("sistema", "Oficina abierta. Escribe un encargo abajo o haz clic en un coordinador.");
  msg("coord", esc(op.parte));
  if (op.inicial) {
    const a = AG[op.inicial.id];
    Object.assign(a, { estado: "aprobacion", tarea: { texto: op.inicial.texto, n: ++nTarea, respuesta: op.inicial.respuesta } });
    msg(a.id, esc(op.inicial.respuesta.resumen), tarjetaBorrador(a));
    encargosHoy = 1;
  }

  actualizarKPIs();
  dibujarTV();

  const reloj = new THREE.Clock();
  let accP = 0, accTV = 0, accUI = 0, primero = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(reloj.getDelta(), 0.1);
    T = reloj.elapsedTime;
    logica(dt);
    animar(T);
    if (tween) pasoTween();
    controls.update();
    accP += dt; if (accP > 0.15) { accP = 0; PANTALLAS.forEach((s) => dibujarPantalla(s, T)); }
    accTV += dt; if (accTV > 0.5) { accTV = 0; dibujarTV(); }
    accUI += dt; if (accUI > 0.2) { accUI = 0; actualizarKPIs(); refrescarFicha(); }
    pintarEtiquetas();
    renderer.render(scene, camera);
    css2d.render(scene, camera);
    if (primero) { primero = false; $("loading").classList.add("off"); }
  });

  return () => {
    renderer.setAnimationLoop(null);
    limpiezas.forEach((f) => f());
    observador.disconnect();
    controls.dispose();
    scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    GEOS.forEach((g) => g.dispose());
    MATS.forEach((m) => m.dispose());
    TEXTURAS.forEach((t) => t.dispose());
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    css2d.domElement.remove();
    misMensajes.forEach((d) => d.remove());
    ficha.hidden = true;
  };
}
