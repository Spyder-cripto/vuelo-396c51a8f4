// Vuelo de Larga Distancia — COMÚN (juego, editor y «Cómo se juega»): dibujo de las piezas, cifrado de soluciones, progreso,
// desbloqueo, sonidos y la PARTIDA (teclado, deslizar el dedo, deshacer, reiniciar, animación y ver la solución).
(function () {
  'use strict';
  const M = globalThis.VueloMotor;

  // ---------- estilos (estilos.js; Fali elegirá uno: ?estilo=…, comparativa en estilos.html) ----------
  const ESTILOS = globalThis.VUELO_ESTILOS || {};
  const POR_DEFECTO = 'cubo';   // elegido por Fali el 22-oct (el 1, con retoques)
  const ESTILO = (() => { try { const e = new URLSearchParams(location.search).get('estilo'); return ESTILOS[e] ? e : POR_DEFECTO; } catch (e) { return POR_DEFECTO; } })();

  // el aspecto de la página (colores, botones y letras) del estilo elegido
  function vestirPagina(nombre) {
    const E = ESTILOS[nombre]; if (!E || typeof document === 'undefined') return;
    const P = E.pagina, r = document.documentElement.style;
    for (const [k, v] of Object.entries({ fondo: P.fondo, panel: P.panel, texto: P.texto, suave: P.suave, borde: P.borde, acento: P.acento,
      boton: P.boton, 'boton-texto': P.botonTexto, radio: P.radio, titulo: P.titulo, 'titulo-tam': P.tituloTam, letra: P.letra })) r.setProperty('--' + k, v);
    if (P.fuentes && !document.getElementById('fuentes-' + nombre)) {
      const l = document.createElement('link'); l.id = 'fuentes-' + nombre; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?' + P.fuentes + '&display=swap'; document.head.appendChild(l);
    }
  }
  vestirPagina(ESTILO);
  // suelo y fondo del estilo (propuestas del 22-oct: ?suelo=arena|metal|cristal, ?fondo=noche|nebulosa|amanecer)
  const PARAM = (k) => { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } };
  const E0 = ESTILOS[ESTILO];
  const SUELO = E0 && E0.suelos ? (E0.suelos[PARAM('suelo')] ? PARAM('suelo') : E0.suelo) : null;
  if (SUELO) E0.pixel.suelo = E0.suelos[SUELO];
  const FONDO = E0 && E0.fondos ? (E0.fondos[PARAM('fondo')] ? PARAM('fondo') : E0.fondo) : null;
  try {   // mientras Fali elige: los enlaces internos conservan el ?estilo=, ?suelo= y ?fondo= de la dirección
    const llevar = ['estilo', 'suelo', 'fondo', 'tarjeta'].filter((k) => PARAM(k));
    if (llevar.length && typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
      for (const a of document.querySelectorAll('a[href$=".html"], a[href*=".html?"]')) { const u = new URL(a.getAttribute('href'), location.href); if (u.origin !== location.origin) continue; for (const k of llevar) u.searchParams.set(k, PARAM(k)); a.href = u.href; }
    });
  } catch (e) { /* sin dirección (Node) */ }

  // ---------- el cielo del fondo: plano y de píxel (cada píxel del lienzo son 3 de pantalla), igual en cada visita ----------
  function pintarCielo(Fd) {
    const c = document.createElement('canvas'); c.id = 'cielo'; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;image-rendering:pixelated';
    document.body.prepend(c); document.body.classList.add('espacio');
    document.documentElement.style.background = Fd.cielo;
    const dibuja = () => {
      const u = 3, W = Math.ceil(innerWidth / u), H = Math.ceil(innerHeight / u), m = Math.min(W, H);
      c.width = W; c.height = H;
      const g = c.getContext('2d'); g.fillStyle = Fd.cielo; g.fillRect(0, 0, W, H);
      let semilla = 20261022; const azar = () => { semilla = (semilla * 1103515245 + 12345) & 0x7fffffff; return semilla / 0x7fffffff; };
      const disco = (cx, cy, r, color, deja) => { g.fillStyle = color; for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r && (!deja || deja(x, y))) g.fillRect(x, y, 1, 1); };
      for (const n of Fd.nubes || []) {   // nebulosa: racimos de discos planos
        const cx = n.x * W, cy = n.y * H, r = n.r * m; disco(cx, cy, r * 0.6, n.c);
        for (let i = 0; i < 6; i++) { const a = azar() * 6.283, d = r * (0.35 + azar() * 0.4); disco(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, r * (0.25 + azar() * 0.25), n.c); }
      }
      const n = Math.round(innerWidth * innerHeight * Fd.densidad);
      for (let i = 0; i < n; i++) {
        const x = Math.floor(azar() * W), y = Math.floor(azar() * H), cruz = azar() < 0.12;
        g.fillStyle = cruz ? Fd.estrellas[0] : Fd.estrellas[Math.floor(azar() * Fd.estrellas.length)];
        g.fillRect(x, y, 1, 1); if (cruz) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
      }
      if (Fd.galaxia) {   // espiral de dos brazos, inclinada
        const G = Fd.galaxia, cx = G.x * W, cy = G.y * H, r = G.r * m;
        for (let brazo = 0; brazo < 2; brazo++) for (let t = 0.08; t <= 1; t += 0.012) {
          const a = brazo * Math.PI + t * 3.4 * Math.PI, d = r * t;
          g.fillStyle = G.colores[(Math.floor(t * 20) + brazo) % 2];
          g.fillRect(Math.round(cx + Math.cos(a) * d + (azar() - 0.5) * 2), Math.round(cy + Math.sin(a) * d * 0.5 + (azar() - 0.5) * 2), 1, 1);
        }
        disco(cx, cy, Math.max(1.5, r * 0.12), G.colores[2]);
      }
      for (const P of Fd.planetas || []) {
        const cx = P.x * W, cy = P.y * H, r = Math.max(3, P.r * m), rx = r * 1.85, ry = r * 0.42;
        const anillo = (delante) => { if (!P.anillo) return; g.fillStyle = P.anillo; for (let a = 0; a < 6.283; a += 0.01) { const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry); if ((y >= cy) === delante) g.fillRect(x, y, 1, 1); } };
        anillo(false); disco(cx, cy, r, P.c);
        if (P.banda) disco(cx, cy, r, P.banda, (x, y) => Math.abs(y + 0.5 - (cy - r * 0.25)) < r * 0.13 || Math.abs(y + 0.5 - (cy + r * 0.3)) < r * 0.09);
        if (P.crater) { disco(cx - r * 0.35, cy - r * 0.2, r * 0.22, P.crater); disco(cx + r * 0.3, cy + r * 0.35, r * 0.15, P.crater); disco(cx + r * 0.25, cy - r * 0.45, r * 0.1, P.crater); }
        anillo(true);
      }
    };
    let espera = null; dibuja(); addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(dibuja, 150); });
  }
  // la tarjeta donde van los textos, encima del cielo (?tarjeta=blanca|noche|cristal|metal)
  const TARJETA = FONDO && E0.tarjetas ? (E0.tarjetas[PARAM('tarjeta')] ? PARAM('tarjeta') : E0.tarjeta) : null;
  if (FONDO && typeof document !== 'undefined' && !globalThis.VUELO_SIN_FONDO) {   // el editor va sin cielo
    const Fd = E0.fondos[FONDO], T = E0.tarjetas[TARJETA], r = document.documentElement.style;
    for (const [k, v] of Object.entries({ panel: T.panel, borde: T.borde, texto: T.texto, suave: T.suave, acento: T.acento, boton: T.boton, 'boton-texto': T.botonTexto, 'fondo-tarjeta': T.fondoTarjeta || T.panel })) if (v) r.setProperty('--' + k, v);
    const poner = () => { pintarCielo(Fd); document.body.classList.add('tarjeta-' + TARJETA); if (T.oscura) document.body.classList.add('tarjeta-oscura'); };
    if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
  }

  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- piezas a pulso (estilos «vector»); K: los colores del estilo ----------
  function piezasVector(K) {
    const sueloV = (g, x, y, s) => { g.fillStyle = K.suelo; g.fillRect(x, y, s, s); g.strokeStyle = K.sueloLinea; g.lineWidth = Math.max(1, s / 32); g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1); };
    function muroV(g, x, y, s) {
      if (K.muroTipo === 'bloque') {
        g.fillStyle = K.fondo; g.fillRect(x, y, s, s);
        g.fillStyle = K.muro; g.strokeStyle = K.muroDetalle; g.lineWidth = Math.max(1, s * 0.05);
        rrect(g, x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88, s * 0.22); g.fill(); g.stroke();
        return;
      }
      g.fillStyle = K.muro; g.fillRect(x, y, s, s);
      g.strokeStyle = K.muroDetalle; g.fillStyle = K.muroDetalle;
      if (K.muroTipo === 'rayado') {
        g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip(); g.lineWidth = Math.max(1, s / 28);
        for (let i = -s; i < s; i += s / 4) { g.beginPath(); g.moveTo(x + i, y + s); g.lineTo(x + i + s, y); g.stroke(); }
        g.restore(); g.lineWidth = Math.max(1, s / 22); g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
      } else {   // remaches: panel plano con su filo y cuatro remaches
        g.lineWidth = Math.max(1, s / 28); g.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
        for (const [a, b] of [[0.22, 0.22], [0.78, 0.22], [0.22, 0.78], [0.78, 0.78]]) { g.beginPath(); g.arc(x + s * a, y + s * b, s * 0.05, 0, 7); g.fill(); }
      }
    }
    function dianaV(g, x, y, s) {   // asiento del pasajero
      g.strokeStyle = K.diana; g.lineWidth = s * 0.07; if (K.dianaRayas) g.setLineDash([s * 0.12, s * 0.08]);
      rrect(g, x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, s * 0.14); g.stroke(); g.setLineDash([]);
      g.fillStyle = K.diana; g.globalAlpha = 0.18; rrect(g, x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, s * 0.14); g.fill(); g.globalAlpha = 1;
    }
    function capsulaV(g, x, y, s, tipo, vivaC) {   // tipo: 'crio' | 'desc'
      const c1 = !vivaC ? K.gastada : tipo === 'crio' ? K.crio : K.desc, c2 = !vivaC ? K.gastadaBorde : tipo === 'crio' ? K.crioBorde : K.descBorde;
      const cx = x + s / 2, cy = y + s / 2, r = s * 0.2;
      g.fillStyle = c1; g.strokeStyle = c2; g.lineWidth = s * 0.06;
      g.beginPath();
      if (K.capsulaTipo === 'hexagono') { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; g.lineTo(cx + Math.cos(a) * s * 0.4, cy + Math.sin(a) * s * 0.4); } g.closePath(); }
      else g.arc(cx, cy, s * 0.38, 0, 7);
      g.fill(); g.stroke();
      g.strokeStyle = !vivaC ? K.simboloGastada : (K.simbolo || c2); g.lineWidth = s * 0.06; g.lineCap = 'round';
      if (tipo === 'crio') { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + Math.PI / 2; g.beginPath(); g.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.stroke(); } }
      else { g.beginPath(); g.arc(cx, cy, r * 0.55, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); g.lineTo(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25); g.stroke(); } }
      g.lineCap = 'butt';
    }
    function cajaV(g, x, y, s, enDiana) {   // pasajero en hibernación
      g.fillStyle = enDiana ? K.cajaOk : K.caja; g.strokeStyle = enDiana ? K.cajaOkBorde : K.cajaBorde; g.lineWidth = s * 0.07;
      rrect(g, x + s * 0.12, y + s * 0.1, s * 0.76, s * 0.8, s * 0.3); g.fill(); g.stroke();
      g.fillStyle = enDiana ? K.cajaOkBorde : K.durmiente;
      g.beginPath(); g.arc(x + s / 2, y + s * 0.36, s * 0.12, 0, 7); g.fill();
      rrect(g, x + s * 0.32, y + s * 0.52, s * 0.36, s * 0.24, s * 0.1); g.fill();
    }
    function tripulanteV(g, x, y, s) {
      g.fillStyle = K.traje; g.strokeStyle = K.trajeBorde; g.lineWidth = s * 0.05;
      rrect(g, x + s * 0.24, y + s * 0.46, s * 0.52, s * 0.44, s * 0.16); g.fill(); g.stroke();
      g.fillStyle = K.casco; g.beginPath(); g.arc(x + s / 2, y + s * 0.34, s * 0.22, 0, 7); g.fill(); g.stroke();
      g.fillStyle = K.visor; rrect(g, x + s * 0.36, y + s * 0.26, s * 0.28, s * 0.14, s * 0.07); g.fill();
    }
    return { fondo: K.fondo, suelo: sueloV, muro: muroV, diana: dianaV, capsula: capsulaV, caja: cajaV, tripulante: tripulanteV };
  }

  // ---------- piezas de píxel (estilos «pixel»): cada sprite se pinta una vez por tamaño y se guarda ----------
  function piezasPixel(P, fondo) {
    const cache = new Map();
    function sello(nombre, s, v) {   // v: variante, para los sprites que tienen varias (el suelo de cristal)
      const k = nombre + '@' + s + '#' + (v || 0); if (cache.has(k)) return cache.get(k);
      const sp = Array.isArray(P[nombre]) ? P[nombre][v || 0] : P[nombre], c = document.createElement('canvas'); c.width = c.height = s;
      const g = c.getContext('2d'), n = sp.n, b = (i) => Math.round(i * s / n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = sp.f(x, y); if (i < 0) continue; g.fillStyle = sp.pal[i]; g.fillRect(b(x), b(y), b(x + 1) - b(x), b(y + 1) - b(y)); }
      cache.set(k, c); return c;
    }
    const variante = (nombre, x, y, s) => (Array.isArray(P[nombre]) ? ((((Math.round(x / s) * 73856093) ^ (Math.round(y / s) * 19349663)) >>> 0) % P[nombre].length) : 0);
    const poner = (nombre) => (g, x, y, s) => g.drawImage(sello(nombre, s, variante(nombre, x, y, s)), Math.round(x), Math.round(y));
    return { fondo, suelo: poner('suelo'), muro: poner('muro'), diana: poner('diana'),
      capsula: (g, x, y, s, tipo, vivaC) => poner(tipo === 'crio' ? (vivaC ? 'crio' : 'crioGastada') : (vivaC ? 'desc' : 'descGastada'))(g, x, y, s),
      caja: (g, x, y, s, enDiana) => poner(enDiana ? 'cajaOk' : 'caja')(g, x, y, s), tripulante: poner('tripulante') };
  }

  // ---------- el «pintor» de un estilo: dibuja un tablero completo o una pieza suelta ----------
  const PINTORES = {};
  function pintor(nombre) {
    nombre = ESTILOS[nombre] ? nombre : ESTILO;
    if (PINTORES[nombre]) return PINTORES[nombre];
    const E = ESTILOS[nombre];
    const P = E.pixel ? piezasPixel(E.pixel, E.pagina.fondo) : piezasVector(E.vector);
    // estado opcional (si falta, el inicial); op: { t (0..1), mov: [[de, a]] } para deslizar lo que se mueve
    function dibujar(g, N, s, estado, op) {
      op = op || {};
      const st = estado || M.inicial(N), C = N.C;
      g.fillStyle = P.fondo; g.fillRect(0, 0, C * s, N.F * s);
      for (let k = 0; k < N.F * C; k++) { const x = (k % C) * s, y = Math.floor(k / C) * s; if (N.muro[k]) P.muro(g, x, y, s); else P.suelo(g, x, y, s); }
      N.dianas.forEach((k) => P.diana(g, (k % C) * s, Math.floor(k / C) * s, s));
      N.cryo.forEach((k, i) => P.capsula(g, (k % C) * s, Math.floor(k / C) * s, s, 'crio', M.viva(st.cv, i)));
      N.thaw.forEach((k, i) => P.capsula(g, (k % C) * s, Math.floor(k / C) * s, s, 'desc', M.viva(st.tv, i)));
      const desde = new Map(); if (op.mov) for (const m of op.mov) if (typeof m[0] === 'number') desde.set(m[1], m[0]);
      const pos = (k) => { const t = op.t == null ? 1 : op.t, d = desde.has(k) ? desde.get(k) : k; return [((d % C) + ((k % C) - (d % C)) * t) * s, (Math.floor(d / C) + (Math.floor(k / C) - Math.floor(d / C)) * t) * s]; };
      st.c.forEach((k) => { const [x, y] = pos(k); P.caja(g, x, y, s, N.diana[k] === 1 && (op.t == null || op.t >= 1)); });
      st.j.forEach((k) => { const [x, y] = pos(k); P.tripulante(g, x, y, s); });
    }
    // una pieza suelta sobre su suelo (para «Cómo se juega», el editor y la comparativa)
    function pieza(g, x, y, s, que) {
      if (que === 'muro') { P.muro(g, x, y, s); return; }
      P.suelo(g, x, y, s);
      if (que === 'diana' || que === 'cajaOk') P.diana(g, x, y, s);
      if (que === 'crio' || que === 'crioGastada') P.capsula(g, x, y, s, 'crio', que === 'crio');
      if (que === 'desc' || que === 'descGastada') P.capsula(g, x, y, s, 'desc', que === 'desc');
      if (que === 'caja' || que === 'cajaOk') P.caja(g, x, y, s, que === 'cajaOk');
      if (que === 'tripulante') P.tripulante(g, x, y, s);
    }
    return (PINTORES[nombre] = { nombre, P, dibujar, pieza });
  }
  const dibujar = (g, N, s, estado, op) => pintor(ESTILO).dibujar(g, N, s, estado, op);
  const pieza = (g, x, y, s, que) => pintor(ESTILO).pieza(g, x, y, s, que);

  // ---------- cifrado de soluciones (como Cromatron) ----------
  const CLAVE = 'vuelo·soluciones·2026';
  function flujo(clave, n) {
    let h = 2166136261;
    for (const ch of clave) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; out[i] = h & 255; }
    return out;
  }
  const aB64 = (bytes) => { let t = ''; for (const b of bytes) t += String.fromCharCode(b); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const deB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  function cifrar(obj, clave) { const b = new TextEncoder().encode(JSON.stringify(obj)), k = flujo(clave || CLAVE, b.length); return aB64(b.map((x, i) => x ^ k[i])); }
  function descifrar(txt, clave) { const b = deB64(txt), k = flujo(clave || CLAVE, b.length); return JSON.parse(new TextDecoder().decode(b.map((x, i) => x ^ k[i]))); }
  // código para compartir un nivel (sin solución): mapa, nombre, frase y pista
  const codigo = (nv) => aB64(new TextEncoder().encode(JSON.stringify({ mapa: nv.mapa, nombre: nv.nombre || '', frase: nv.frase || '', pista: nv.pista || '' })));
  const leerCodigo = (t) => { const d = JSON.parse(new TextDecoder().decode(deB64(t.trim()))); M.nivel(d.mapa); return d; };

  // ---------- progreso y desbloqueo (lineal, como el original: cada nivel abre el siguiente) ----------
  const PROG = 'vuelo-progreso-v2';
  function progreso() { try { return JSON.parse(localStorage.getItem(PROG) || '{}'); } catch (e) { return {}; } }
  function guardarProgreso(p) { try { localStorage.setItem(PROG, JSON.stringify(p)); } catch (e) { /* sin almacenamiento */ } }
  function abierto(i, hechos) { return i === 0 || !!hechos[i - 1] || !!hechos[i]; }

  // ---------- sonidos: los del original (sonidos.js) y la fanfarria de Crímenes de época y Cromatron ----------
  let actx = null;
  function audio() { if (!actx) { const AC = globalThis.AudioContext || globalThis.webkitAudioContext; if (!AC) return null; actx = new AC(); } if (actx.state === 'suspended') actx.resume(); return actx; }
  function tono(f, t0, dur, tipo, vol) {
    const a = audio(); if (!a || silencio) return;
    const o = a.createOscillator(), gn = a.createGain(), t = a.currentTime + t0;
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  // como el motor de PuzzleScript: muestras de 5512 Hz repetidas 4 veces a 22 050 Hz y tres filtros paso bajo a 1600 Hz
  const SONIDOS = globalThis.VUELO_SONIDOS || {}, BUFFERS = {}, SILENCIO = 'vuelo-silencio';
  let silencio = (() => { try { return localStorage.getItem(SILENCIO) === '1'; } catch (e) { return false; } })();
  function silenciar(si) { silencio = !!si; try { localStorage.setItem(SILENCIO, silencio ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } }
  const enSilencio = () => silencio;
  function sonar(nombre) {
    try {
      const a = audio(); if (!a || silencio || !SONIDOS[nombre]) return;
      if (globalThis.__sonidos) globalThis.__sonidos.push(nombre);   // para las pruebas automáticas
      let b = BUFFERS[nombre];
      if (!b) {
        const i16 = new Int16Array(Uint8Array.from(atob(SONIDOS[nombre]), (c) => c.charCodeAt(0)).buffer);
        b = BUFFERS[nombre] = a.createBuffer(1, i16.length * 4, 22050);
        const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = i16[i >> 2] / 32767;
      }
      const src = a.createBufferSource(); src.buffer = b; let nodo = src;
      for (let k = 0; k < 3; k++) { const f = a.createBiquadFilter(); f.frequency.value = 1600; nodo.connect(f); nodo = f; }
      nodo.connect(a.destination); src.start();
    } catch (e) { /* sin audio */ }
  }
  // al ganar: la fanfarria (Fali eligió la B el 22-oct; la otra era el «endlevel» del original)
  const SONIDO_GANAR = 'fanfarria';
  function sonarGanar() { if (SONIDO_GANAR === 'fanfarria') fanfarria(); else sonar('ganar'); }
  function fanfarria() { if (globalThis.__sonidos && !silencio) globalThis.__sonidos.push('fanfarria'); try { [[392, 0, 0.16], [392, 0.17, 0.08], [523, 0.27, 0.2], [659, 0.5, 0.2], [784, 0.74, 0.5], [659, 1.28, 0.14], [784, 1.44, 0.8]].forEach(([f, t, d]) => { tono(f, t, d, 'square', 0.05); tono(f / 2, t, d, 'triangle', 0.08); }); } catch (e) { /* sin audio */ } }

  // ---------- la partida ----------
  // new Partida(lienzo, mapa, { alGanar(pasos), alCambiar(partida) })
  class Partida {
    constructor(lienzo, mapa, op) {
      this.lienzo = lienzo; this.g = lienzo.getContext('2d'); this.op = op || {};
      this.N = M.nivel(mapa); this.historia = []; this.estado = M.inicial(this.N); this.pasos = 0; this.ganado = false; this.cinta = '';
      this.anim = null; this.cola = []; this.viendoSolucion = false;
      this.medir(); this.pintar();
    }
    medir() {
      const ancho = Math.min(this.lienzo.parentElement ? this.lienzo.parentElement.clientWidth : 640, 640);
      this.s = Math.max(16, Math.min(56, Math.floor(ancho / this.N.C)));
      this.lienzo.width = this.N.C * this.s; this.lienzo.height = this.N.F * this.s;
    }
    pintar(t, mov) { dibujar(this.g, this.N, this.s, this.estado, { t, mov }); }
    mover(d) {
      if (this.ganado || this.anim) { if (this.anim) this.cola.push(d); return; }
      const mov = [], t = M.paso(this.N, this.estado, d, mov);
      if (!t) { if (this.estado.j.length) sonar('chocar'); return; }   // nadie pudo moverse: el turno no cuenta
      // los sonidos del original: «Player cantmove», «Player move», «Crate MOVE», «crate create» y «player create»
      const eraJ = new Set(this.estado.j), eraC = new Set(this.estado.c);
      const movJ = mov.filter((m) => typeof m[0] === 'number' && eraJ.has(m[0])).length, movC = mov.filter((m) => typeof m[0] === 'number' && eraC.has(m[0])).length;
      if (movJ < eraJ.size) sonar('chocar');
      if (movJ) sonar('mover');
      if (movC) sonar('empujar');
      if (mov.some((m) => m[0] === 'congela')) sonar('congelar');
      if (mov.some((m) => m[0] === 'despierta')) sonar('despertar');
      this.historia.push({ estado: this.estado, pasos: this.pasos });
      this.estado = t; this.pasos++; this.cinta += d;
      this.animar(mov, () => {
        if (M.gana(this.N, this.estado)) { this.ganado = true; if (!this.viendoSolucion) sonarGanar(); if (this.op.alGanar) this.op.alGanar(this.pasos, this.viendoSolucion); }
        if (this.op.alCambiar) this.op.alCambiar(this);
        if (this.cola.length) this.mover(this.cola.shift());
      });
      if (this.op.alCambiar) this.op.alCambiar(this);
    }
    animar(mov, fin) {
      const t0 = performance.now(), dur = this.viendoSolucion ? 160 : 110;
      this.anim = true;
      const cuadro = (ahora) => {
        const t = Math.min(1, (ahora - t0) / dur);
        this.pintar(t, mov);
        if (t < 1) requestAnimationFrame(cuadro); else { this.anim = null; fin(); }
      };
      requestAnimationFrame(cuadro);
    }
    deshacer() { if (this.anim || !this.historia.length || this.viendoSolucion) return; const h = this.historia.pop(); this.estado = h.estado; this.pasos = h.pasos; this.cinta = this.cinta.slice(0, h.pasos); this.ganado = false; this.pintar(); if (this.op.alCambiar) this.op.alCambiar(this); }
    reiniciar() { if (this.anim) return; this.historia = []; this.estado = M.inicial(this.N); this.pasos = 0; this.cinta = ''; this.ganado = false; this.viendoSolucion = false; this.cola = []; this.pintar(); if (this.op.alCambiar) this.op.alCambiar(this); }
    verSolucion(cinta) {   // la juega sola, paso a paso; NO cuenta como superado
      this.reiniciar(); this.viendoSolucion = true;
      const teclas = cinta.split('');
      const siguiente = () => { if (!this.viendoSolucion || !teclas.length || this.ganado) return; this.mover(teclas.shift()); setTimeout(siguiente, 230); };
      setTimeout(siguiente, 300);
    }
    // teclado y deslizar el dedo
    escuchar(doc) {
      const TECLAS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
      doc.addEventListener('keydown', (e) => {
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (TECLAS[e.key]) { e.preventDefault(); audio(); this.mover(TECLAS[e.key]); }
        else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); this.deshacer(); }
        else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.reiniciar(); }
      });
      let x0 = null, y0 = null;
      this.lienzo.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; audio(); }, { passive: true });
      this.lienzo.addEventListener('touchend', (e) => {
        if (x0 === null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        this.mover(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
      });
      this.lienzo.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
  }

  globalThis.Vuelo = { ESTILO, ESTILOS, SUELO, FONDO, TARJETA, pintarCielo, pintor, vestirPagina, dibujar, pieza, cifrar, descifrar, CLAVE, codigo, leerCodigo,
    progreso, guardarProgreso, abierto, fanfarria, sonar, sonarGanar, silenciar, enSilencio, audio, Partida };
})();
