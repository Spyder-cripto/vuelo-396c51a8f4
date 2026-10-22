// Vuelo de Larga Distancia — MOTOR (navegador y Node). Reglas de REGLAS.md (las de «Long Haul Space Flight», pap4qlxxlevb),
// el mismo modelo que modelo.js del taller, contrastado con el motor real de PuzzleScript (0 diferencias).
// Nivel: rejilla de caracteres (REGLAS §2): w muro · . suelo · p tripulante · o caja · s caja en diana · x diana ·
// c criogénica · t descongelación · 1 caja en descongelación · 2 tripulante en criogénica · 3 caja en criogénica ·
// 4 tripulante en descongelación · 5 tripulante en diana.
(function (raiz) {
  'use strict';
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const VALIDOS = 'w.poxsct12345';
  function nivel(mapa) {
    const F = mapa.length, C = Math.max(...mapa.map((f) => f.length));
    const N = { F, C, muro: new Uint8Array(F * C), diana: new Uint8Array(F * C), cryo: [], thaw: [], jug: [], caja: [] };
    mapa.forEach((f, y) => [...f.padEnd(C, 'w')].forEach((ch, x) => {
      const k = y * C + x;
      if (VALIDOS.indexOf(ch) < 0) throw new Error('carácter desconocido: ' + ch);
      if (ch === 'w') N.muro[k] = 1;
      if (ch === 'p' || ch === '2' || ch === '4' || ch === '5') N.jug.push(k);
      if (ch === 'o' || ch === 's' || ch === '1' || ch === '3') N.caja.push(k);
      if (ch === 's' || ch === 'x' || ch === '5') N.diana[k] = 1;
      if (ch === 'c' || ch === '2' || ch === '3') N.cryo.push(k);
      if (ch === 't' || ch === '1' || ch === '4') N.thaw.push(k);
    }));
    N.dianas = []; for (let k = 0; k < F * C; k++) if (N.diana[k]) N.dianas.push(k);
    return N;
  }
  // estado: { j: tripulantes, c: cajas (casillas ordenadas), cv / tv: máscaras de criogénicas y descongelaciones vivas }
  function inicial(N) { return { j: N.jug.slice().sort((a, b) => a - b), c: N.caja.slice().sort((a, b) => a - b), cv: 2 ** N.cryo.length - 1, tv: 2 ** N.thaw.length - 1 }; }
  const clave = (s) => String.fromCharCode(...s.j, 65535, ...s.c, 65534) + s.cv + ',' + s.tv;
  const viva = (m, i) => Math.floor(m / 2 ** i) % 2 === 1;
  const gastar = (m, i) => m - 2 ** i;
  // un turno (REGLAS §3); devuelve el estado nuevo, o null si el turno no cuenta. Con `mov`, apunta qué se ha movido
  // (de -> a) y qué se ha convertido, para animar.
  function paso(N, s, d, mov) {
    const [dx, dy] = DIRS[d], C = N.C;
    const vecino = (k) => { const x = k % C + dx, y = Math.floor(k / C) + dy; return x < 0 || y < 0 || x >= C || y >= N.F ? -1 : y * C + x; };
    const ocup = new Map();
    s.j.forEach((k) => ocup.set(k, 'j')); s.c.forEach((k) => ocup.set(k, 'c'));
    const mueve = new Set(s.j);
    for (const k of s.j) { const v = vecino(k); if (v >= 0 && ocup.get(v) === 'c') mueve.add(v); }
    let cambio = true, alguno = false;
    while (cambio) {
      cambio = false;
      for (const k of [...mueve]) {
        const v = vecino(k);
        if (v < 0 || N.muro[v] || ocup.has(v)) continue;
        ocup.set(v, ocup.get(k)); ocup.delete(k); mueve.delete(k); cambio = alguno = true;
        if (mov) mov.push([k, v]);
      }
    }
    let j = [], c = [], cv = s.cv, tv = s.tv;
    for (const [k, t] of ocup) (t === 'j' ? j : c).push(k);
    j = j.filter((k) => { const i = N.cryo.indexOf(k); if (i >= 0 && viva(cv, i)) { cv = gastar(cv, i); c.push(k); if (mov) mov.push(['congela', k]); return false; } return true; });
    c = c.filter((k) => { const i = N.thaw.indexOf(k); if (i >= 0 && viva(tv, i)) { tv = gastar(tv, i); j.push(k); if (mov) mov.push(['despierta', k]); return false; } return true; });
    if (!alguno && cv === s.cv && tv === s.tv) return null;
    return { j: j.sort((a, b) => a - b), c: c.sort((a, b) => a - b), cv, tv };
  }
  const gana = (N, s) => s.j.length > 0 && N.dianas.every((k) => s.c.indexOf(k) >= 0);
  // búsqueda en anchura: mínimo, número de soluciones mínimas (caminos), una solución y estados; con tope
  function resolver(N, op) {
    op = op || {};
    const tope = op.tope || 3e6, s0 = inicial(N), k0 = clave(s0);
    if (gana(N, s0)) return { minimo: 0, soluciones: 1, sol: '', estados: 1 };
    const dist = new Map([[k0, 0]]), cuenta = new Map([[k0, 1]]), padre = new Map();
    let capa = [s0], d = 0, finales = [];
    while (capa.length) {
      const sig = [];
      for (const s of capa) {
        const ks = clave(s);
        for (const dir of 'UDLR') {
          const t = paso(N, s, dir); if (!t) continue;
          const kt = clave(t);
          if (!dist.has(kt)) { dist.set(kt, d + 1); cuenta.set(kt, cuenta.get(ks)); padre.set(kt, ks + '\u0001' + dir); sig.push(t); if (gana(N, t)) finales.push(kt); }
          else if (dist.get(kt) === d + 1) cuenta.set(kt, cuenta.get(kt) + cuenta.get(ks));
        }
      }
      d++; capa = sig;
      if (op.progreso) op.progreso(d, dist.size);
      if (finales.length) {
        let sol = '', k = finales[0];
        while (padre.has(k)) { const v = padre.get(k), i = v.lastIndexOf('\u0001'); sol = v.slice(i + 1) + sol; k = v.slice(0, i); }
        return { minimo: d, soluciones: finales.reduce((a, k2) => a + cuenta.get(k2), 0), sol, estados: dist.size };
      }
      if (dist.size > tope) return { minimo: null, tope: true, estados: dist.size };
    }
    return { minimo: null, sinSolucion: true, estados: dist.size };
  }
  // juega una cinta desde el principio: estados y pasos que cuentan; para comprobar soluciones guardadas
  function jugar(N, cinta) {
    let s = inicial(N), pasos = 0;
    for (const d of cinta) { const t = paso(N, s, d); if (t) { s = t; pasos++; } if (gana(N, s)) return { gana: true, pasos, estado: s }; }
    return { gana: false, pasos, estado: s };
  }
  const API = { DIRS, VALIDOS, nivel, inicial, clave, paso, gana, resolver, jugar, viva };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else raiz.VueloMotor = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
