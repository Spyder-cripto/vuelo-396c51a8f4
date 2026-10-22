// Vuelo de Larga Distancia — el JUEGO: carga los niveles (publicados, los del editor con ?vista=editor, o uno compartido
// con ?nivel=<código>), la tira de niveles con desbloqueo, la partida, la pista y la solución (cifrada; no cuenta).
(function () {
  'use strict';
  const V = globalThis.Vuelo, $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let niveles = [], final = '', prog = V.progreso(), actual = 0, partida = null, avisoSolucion = 0, empezado = false;
  const clave = (i) => (niveles[i] && niveles[i].mapa ? niveles[i].mapa.join('/') : String(i));   // el progreso va por nivel, no por número
  const hechos = () => niveles.map((_, i) => !!prog[clave(i)]);

  async function cargar() {
    if (params.get('nivel')) {   // un nivel compartido por enlace (sin solución)
      try { const d = V.leerCodigo(params.get('nivel')); niveles = [Object.assign({ nombre: 'Nivel compartido' }, d)]; } catch (e) { niveles = []; }
    } else if (params.get('vista') === 'editor') {   // los niveles del editor, para probarlos como el jugador
      $('volverEditor').hidden = false;
      let d = null;
      try { const r = await fetch('/api/editor', { cache: 'no-store' }); d = await r.json(); } catch (e) { d = null; }
      if (!d || !d.niveles || !d.niveles.length) { try { d = JSON.parse(localStorage.getItem('vuelo-editor-v1') || '{"niveles":[]}'); } catch (e) { d = { niveles: [] }; } }
      niveles = d.niveles || []; final = d.final || '';
      // en el editor la solución va en claro: aquí se cifra, como en lo publicado
      niveles = niveles.map((n) => Object.assign({}, n, { sol: n.sol ? V.cifrar(n.sol) : null }));
    } else { const d = globalThis.VUELO_NIVELES || { niveles: [] }; niveles = d.niveles; final = d.final || ''; }
    if (!niveles.length) { $('nombre').textContent = 'Aún no hay niveles publicados.'; $('info').textContent = ''; return; }
    const h = hechos(); actual = Math.max(0, h.findIndex((x) => !x)); if (actual < 0 || h.every(Boolean)) actual = 0;
    abrir(actual);
  }

  function abrir(i) {
    actual = i; avisoSolucion = 0;
    const nv = niveles[i];
    $('nombre').textContent = nv.nombre || 'Nivel ' + (i + 1);
    $('pista').hidden = true; $('pista').textContent = nv.pista || 'Este nivel no tiene pista.';
    $('botonPista').hidden = !nv.pista;
    $('solucion').hidden = !nv.sol; $('solucion').textContent = 'Solución';
    $('victoria').hidden = true;
    partida = new V.Partida($('lienzo'), nv.mapa, { alCambiar: info, alGanar: ganado });
    info(); tira();
    if (nv.frase && params.get('frase') !== '0') mostrarFrase(nv.frase, 'Continuar'); else cerrarFrase(true);   // ?frase=0: sin la frase (comparativas)
  }
  // la frase del nivel (o la final), encima del tablero, como los mensajes del original entre niveles
  function mostrarFrase(texto, boton) { $('fraseTexto').textContent = texto; $('fraseSeguir').textContent = boton; $('frase').hidden = false; }
  function cerrarFrase(sinSonido) {
    if ($('frase').hidden) return;
    $('frase').hidden = true;
    if (!sinSonido && !empezado) { empezado = true; V.sonar('empezar'); }   // «startgame» del original, una vez
  }
  $('frase').onclick = () => cerrarFrase();
  $('fraseSeguir').onclick = (e) => { e.stopPropagation(); cerrarFrase(); };
  // mientras se lee la frase no se mueve nada: Intro, espacio o X la cierran
  document.addEventListener('keydown', (e) => {
    if ($('frase').hidden || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'Escape') cerrarFrase();
  }, true);
  // sonido sí / no
  function pintarSonido() { $('sonido').textContent = V.enSilencio() ? '🔇' : '🔊'; $('sonido').title = (V.enSilencio() ? 'Sin sonido' : 'Con sonido') + ' (tecla M)'; }
  $('sonido').onclick = () => { V.silenciar(!V.enSilencio()); pintarSonido(); };
  pintarSonido();
  function info() {
    if (!partida) return;
    $('info').textContent = `Nivel ${actual + 1} de ${niveles.length} · Pasos: ${partida.pasos}`;
  }
  function ganado(pasos, conSolucion) {
    const nv = niveles[actual];
    if (!conSolucion) { prog[clave(actual)] = true; V.guardarProgreso(prog); }
    const minimo = nv.minimo ? ` El mínimo es ${nv.minimo}.` : '';
    $('victoria').innerHTML = conSolucion ? 'Así se resuelve. Ahora inténtalo tú: pulsa «Reiniciar».'
      : `<b>¡Logrado en ${pasos} pasos!</b>${minimo}` + (actual + 1 < niveles.length ? ' <button id="siguiente" class="principal">Siguiente nivel →</button>' : ' <b>¡Has completado todos los niveles!</b>');
    $('victoria').hidden = false;
    if (!conSolucion && actual + 1 === niveles.length && final) setTimeout(() => { if (partida && partida.ganado) mostrarFrase(final, 'Cerrar'); }, 900);
    const s = $('siguiente'); if (s) s.onclick = () => abrir(actual + 1);
    tira();
  }
  function tira() {
    const h = hechos(), t = $('tira'); t.innerHTML = '';
    if (niveles.length < 2) return;
    niveles.forEach((nv, i) => {
      const b = document.createElement('button'), ab = V.abierto(i, h);
      b.textContent = i + 1; b.title = nv.nombre || '';
      b.className = i === actual ? 'actual' : h[i] ? 'hecho' : ab ? 'abierto' : 'cerrado';
      b.disabled = !ab; b.onclick = () => abrir(i);
      t.appendChild(b);
    });
  }

  $('deshacer').onclick = () => partida && partida.deshacer();
  $('reiniciar').onclick = () => { if (partida) { partida.reiniciar(); $('victoria').hidden = true; } };
  $('botonPista').onclick = () => { $('pista').hidden = !$('pista').hidden; };
  $('solucion').onclick = () => {   // doble pulsación, como en Cromatron
    const nv = niveles[actual]; if (!nv || !nv.sol) return;
    if (!avisoSolucion) { avisoSolucion = 1; $('solucion').textContent = '¿Seguro? Pulsa otra vez'; return; }
    avisoSolucion = 0; $('solucion').textContent = 'Solución'; $('victoria').hidden = true;
    try { partida.verSolucion(V.descifrar(nv.sol)); } catch (e) { /* solución ilegible */ }
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && niveles.length) { e.preventDefault(); const h = hechos(); if (actual + 1 < niveles.length && V.abierto(actual + 1, h)) abrir(actual + 1); }
    if (e.key === '-' && actual > 0) { e.preventDefault(); abrir(actual - 1); }
  });
  // la partida cambia con cada nivel: un solo oyente que reenvía a la partida actual
  const TECLAS = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R', W: 'U', S: 'D', A: 'L', D: 'R' };
  document.addEventListener('keydown', (e) => {
    if (!partida || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
    if (TECLAS[e.key]) { e.preventDefault(); V.audio(); partida.mover(TECLAS[e.key]); }
    else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); partida.deshacer(); $('victoria').hidden = partida.ganado ? $('victoria').hidden : true; }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); partida.reiniciar(); $('victoria').hidden = true; }
    else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); $('sonido').onclick(); }
  });
  // deslizar el dedo sobre el tablero
  let x0 = null, y0 = null; const L = $('lienzo');
  L.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; V.audio(); }, { passive: true });
  L.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  L.addEventListener('touchend', (e) => {
    if (x0 === null || !partida) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    partida.mover(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U'));
  });
  window.addEventListener('resize', () => { if (partida) { partida.medir(); partida.pintar(); } });
  // para las pruebas automáticas
  globalThis.__vuelo = { partida: () => partida, abrir, niveles: () => niveles, final: () => final };
  cargar();
})();
