// Vuelo de Larga Distancia — ESTILOS para que Fali elija (todos claros, planos y sin sombras). Cada estilo trae:
//   - el dibujo de las piezas: o bien `pixel` (sprites de n×n, con '.' transparente y un dígito por color de la paleta),
//     o bien `vector` (los colores de los dibujos a pulso de comun.js);
//   - el aspecto de la página (`pagina`: colores, botones y letras).
// Se elige con ?estilo=<nombre> en el juego, el editor y «Cómo se juega»; la comparativa está en estilos.html.
(function () {
  'use strict';
  const S = (pal, filas) => ({ pal, n: filas.length, f: (x, y) => { const ch = filas[y][x]; return ch === '.' ? -1 : +ch; } });
  const F = (pal, n, f) => ({ pal, n, f });

  // ---------- piezas procedurales de 16×16 (cápsulas y asiento), con la paleta de cada estilo ----------
  const r16 = (x, y) => Math.hypot(x - 7.5, y - 7.5);
  const copo = (x, y) => { const dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5); return r16(x, y) <= 4.4 && (dx < 1 || dy < 1 || Math.abs(dx - dy) < 0.8); };
  const sol = (x, y) => { const r = r16(x, y), dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5); return r <= 2.2 || (r > 3.2 && r <= 4.8 && (dx < 1 || dy < 1 || Math.abs(dx - dy) < 0.8)); };
  // paleta de cápsula: [relleno, borde, símbolo]
  const capsula16 = (pal, simbolo) => F(pal, 16, (x, y) => { const r = r16(x, y); if (r > 6.7) return -1; if (r > 5.6) return 1; return simbolo(x, y) ? 2 : 0; });
  // asiento: marco cuadrado de esquinas romas; paleta [marco, filo]
  const asiento16 = (pal) => F(pal, 16, (x, y) => {
    const dentro = (a, b) => x >= a && x <= b && y >= a && y <= b;
    if (!dentro(1, 14) || ((x === 1 || x === 14) && (y === 1 || y === 14))) return -1;
    if (dentro(4, 11)) return -1;
    return dentro(2, 13) && !((x === 2 || x === 13) && (y === 2 || y === 13)) ? 0 : 1;
  });

  // ---------- 1) CUBO DE HIELO: arena con rejilla, ladrillo azul pizarra, píxel plano ----------
  const TRIP16 = [
    '................',
    '.....000000.....',
    '....01111110....',
    '...0112222110...',
    '...0122222210...',
    '...0122222210...',
    '...0112222110...',
    '....01111110....',
    '...0003333000...',
    '..011111111110..',
    '..010111111010..',
    '..010133331010..',
    '..000111111000..',
    '....01100110....',
    '....01100110....',
    '....000..000....',
  ];
  const POD16 = [
    '................',
    '....00000000....',
    '...0111111110...',
    '..011111111110..',
    '..012222222210..',
    '..012333333210..',
    '..013443344310..',
    '..013333333310..',
    '..012333333210..',
    '..012222222210..',
    '..011111111110..',
    '..011100001110..',
    '..011111111110..',
    '...0111111110...',
    '....00000000....',
    '................',
  ];
  // en su asiento: despierto, con los ojos abiertos y sin sonrisa (Fali, 22-oct)
  const POD16_SENTADO = POD16.slice();
  POD16_SENTADO[6] = '..013343343310..';
  POD16_SENTADO[7] = '..013343343310..';
  const cubo = {
    nombre: 'Cubo de Hielo',
    desc: 'El de El Cubo de Hielo: suelo de arena con rejilla, muros de ladrillo azul pizarra y piezas de píxel plano.',
    pixel: {
      suelo: S(['#f3e8d0', '#dfcca6', '#e9dcbe'], [
        '1111111111111111', '1000000000000000', '1000000000000000', '1000000000020000', '1000020000000000', '1000000000000000',
        '1000000000000000', '1000000000000000', '1000000000200000', '1000200000000000', '1000000000000000', '1000000000000000',
        '1000000000000002', '1000000002000000', '1002000000000000', '1000000000000000']),
      muro: S(['#7086ab', '#53658b', '#93a6c8'], [
        '2222222222222221', '0000000000000001', '0000000000000001', '0000000000000001', '0000000000000001', '0000000000000001',
        '0000000000000001', '1111111111111111', '2222222122222222', '0000000100000000', '0000000100000000', '0000000100000000',
        '0000000100000000', '0000000100000000', '0000000100000000', '1111111111111111']),
      diana: asiento16(['#f2c14e', '#c98a12']),
      crio: capsula16(['#8fdcf5', '#2f8fc4', '#ffffff'], copo),
      crioGastada: capsula16(['#e3edf2', '#a9bfcc', '#a9bfcc'], copo),
      desc: capsula16(['#ffbe7a', '#d9622b', '#ffffff'], sol),
      descGastada: capsula16(['#f4e6d8', '#cfa98a', '#cfa98a'], sol),
      caja: S(['#2b4c7e', '#d6e8fb', '#9cc0f5', '#f2c79b', '#1d2b53'], POD16),
      cajaOk: S(['#1f7a46', '#d3f3df', '#8fd9ab', '#f2c79b', '#1d2b53'], POD16_SENTADO),
      tripulante: S(['#1d2b53', '#ffffff', '#5ac8fa', '#f28c28'], TRIP16),
    },
    pagina: { fondo: '#f6efe0', panel: '#fffaf0', texto: '#1d2738', suave: '#56657e', borde: '#dfcca6', acento: '#1f3a63',
      boton: '#1f3a63', botonTexto: '#ffffff', radio: '999px', titulo: "'Press Start 2P', monospace", tituloTam: '18px',
      letra: "'Nunito', system-ui, sans-serif", fuentes: 'family=Press+Start+2P&family=Nunito:wght@400;700;800' },
  };

  // ---------- 22-oct: Fali ve soso el tono salmón (fondo y suelo de arena) y quiere ESPACIO: propuestas de suelo y de fondo ----------
  // (se eligen con ?suelo=… y ?fondo=…; la comparativa está en fondos.html)
  const hashS = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0);
  cubo.suelos = {
    arena: cubo.pixel.suelo,
    // placas metálicas de la nave: junta arriba e izquierda (como la rejilla de arena) y cuatro remaches
    metal: F(['#e2e8f1', '#b4c1d3', '#c7d2e0'], 16, (x, y) => (x === 0 || y === 0 ? 1 : (x === 3 || x === 12) && (y === 3 || y === 12) ? 2 : 0)),
    // suelo de cristal: se ve el espacio por debajo (seis variantes con estrellas distintas, se reparten por casilla)
    cristal: [0, 1, 2, 3, 4, 5].map((v) => F(['#1d2852', '#34427a', '#ffffff', '#fff1a8', '#a9bcff'], 16, (x, y) => {
      if (x === 0 || y === 0) return 1;
      for (let i = 0; i < 3; i++) { const h = hashS(v * 7 + i, i * 13 + v); if (x === 2 + (h % 12) && y === 2 + ((h >> 5) % 12)) return 2 + ((h >> 9) % 3); }
      return 0;
    })),
  };
  // fondos de la página: cielo plano con estrellas de píxel, planetas, luna y galaxia (todo plano, sin sombras)
  cubo.fondos = {
    noche: { nombre: 'Noche estrellada', cielo: '#0f1a3d', oscuro: true, estrellas: ['#ffffff', '#fff1a8', '#b9ccff'], densidad: 1 / 1400,
      planetas: [{ x: 0.88, y: 0.14, r: 0.075, c: '#f2a65a', banda: '#e07b39', anillo: '#f6d8a8' }, { x: 0.07, y: 0.84, r: 0.05, c: '#dfe3ec', crater: '#bcc4d6' },
        { x: 0.94, y: 0.76, r: 0.028, c: '#e0584e', banda: '#c2413a' }],
      galaxia: { x: 0.09, y: 0.3, r: 0.1, colores: ['#f3b8ff', '#b9a0ff', '#ffffff'] } },
    nebulosa: { nombre: 'Nebulosa', cielo: '#160f33', oscuro: true, estrellas: ['#ffffff', '#ffe0f4', '#b9f0ff'], densidad: 1 / 1600,
      nubes: [{ x: 0.12, y: 0.22, r: 0.3, c: '#2c1a5c' }, { x: 0.9, y: 0.72, r: 0.34, c: '#13385a' }, { x: 0.72, y: 0.12, r: 0.2, c: '#3d1a52' }, { x: 0.2, y: 0.85, r: 0.22, c: '#1a2f5e' }],
      planetas: [{ x: 0.9, y: 0.2, r: 0.05, c: '#8fe3d0', banda: '#5cc2ad' }, { x: 0.08, y: 0.62, r: 0.035, c: '#f7c4e0', anillo: '#ffffff' }],
      galaxia: { x: 0.85, y: 0.5, r: 0.08, colores: ['#ffd1f0', '#a5f0ff', '#ffffff'] } },
    amanecer: { nombre: 'Cielo claro', cielo: '#dde6ff', oscuro: false, estrellas: ['#ffffff', '#fff6c9', '#c7b6ff'], densidad: 1 / 1500,
      planetas: [{ x: 0.88, y: 0.14, r: 0.075, c: '#ffc3a3', banda: '#f4a07c', anillo: '#ffffff' }, { x: 0.07, y: 0.84, r: 0.05, c: '#ffffff', crater: '#e0e6f6' },
        { x: 0.94, y: 0.76, r: 0.028, c: '#a7e3d6', banda: '#7fcfbd' }],
      galaxia: { x: 0.09, y: 0.3, r: 0.1, colores: ['#cfa8ff', '#ffbfe3', '#ffffff'] } },
  };
  cubo.suelo = 'cristal'; cubo.fondo = 'noche';   // Fali eligió la 2 el 22-oct
  // la tarjeta de los textos (Fali: «cambia el fondo blanco»): colores de la página sobre el cielo
  cubo.tarjetas = {
    blanca: { panel: '#ffffff', borde: '#c8d3e6' },
    noche: { oscura: true, panel: '#16214a', fondoTarjeta: 'rgba(14, 22, 52, 0.9)', borde: '#3a4a85', texto: '#eef2ff', suave: '#b6c2e6', acento: '#ffd56b', boton: '#e8eefc', botonTexto: '#1d2738' },
    cristal: { oscura: true, panel: '#1b2858', fondoTarjeta: 'rgba(255, 255, 255, 0.1)', borde: 'rgba(255, 255, 255, 0.35)', texto: '#ffffff', suave: '#d3dcf5', acento: '#ffd56b', boton: '#e8eefc', botonTexto: '#1d2738' },
    metal: { panel: '#e2e8f1', borde: '#b4c1d3' },
  };
  cubo.tarjeta = 'cristal';   // Fali eligió la B el 22-oct

  // ---------- 2) ORIGINAL: los dibujos de 5×5 del juego de pap4qlxxlevb, con sus colores ----------
  const A = { black: '#000000', white: '#ffffff', gray: '#9d9d9d', darkgray: '#697175', lightgray: '#cccccc', orange: '#eb8931',
    blue: '#1d57f7', lightblue: '#b2dcef', darkblue: '#1b2632', red: '#be2633', grey: '#9d9d9d' };
  const CRATE5 = ['01110', '01110', '11111', '01110', '01010'];
  const original = {
    nombre: 'Original',
    desc: 'Los dibujos del juego original (cuadritos de 5×5 con sus mismos colores), tal como lo jugaste.',
    pixel: {
      suelo: S([A.lightgray, A.gray], ['00000', '00000', '00100', '00000', '00000']),
      muro: S([A.darkgray], ['00000', '00000', '00000', '00000', '00000']),
      diana: S(['#ffff22', A.lightgray], ['.....', '.000.', '.010.', '.000.', '.....']),
      crio: S([A.blue, A.lightgray], ['.....', '..0..', '.010.', '..0..', '.....']),
      crioGastada: S([A.grey, A.lightgray], ['.....', '..0..', '.010.', '..0..', '.....']),
      desc: S([A.red, A.lightgray], ['.....', '.0.0.', '..1..', '.0.0.', '.....']),
      descGastada: S([A.grey, A.lightgray], ['.....', '.0.0.', '..1..', '.0.0.', '.....']),
      caja: S([A.lightblue, '#668899'], CRATE5),
      cajaOk: S([A.lightblue, '#668899'], CRATE5),
      tripulante: S([A.black, A.orange, A.white, A.darkblue], ['.000.', '.111.', '22222', '.333.', '.3.3.']),
    },
    pagina: { fondo: '#e4e4e4', panel: '#ffffff', texto: '#1b2632', suave: '#697175', borde: '#bdbdbd', acento: '#d9761f',
      boton: '#ffffff', botonTexto: '#1b2632', radio: '0', titulo: "'Silkscreen', monospace", tituloTam: '24px',
      letra: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fuentes: 'family=Silkscreen' },
  };

  // ---------- 3) ESTACIÓN: paneles de acero claros y astronauta naranja (dibujo a pulso) ----------
  const estacion = {
    nombre: 'Estación',
    desc: 'Una estación espacial luminosa: paneles de acero claro con remaches, astronauta naranja y cápsulas hexagonales.',
    vector: { muroTipo: 'remaches', capsulaTipo: 'hexagono',
      fondo: '#eef2f7', suelo: '#f8fafc', sueloLinea: '#e2e8f0', muro: '#aebbcc', muroDetalle: '#8a98ad',
      diana: '#f59e0b', dianaRayas: true, caja: '#bae6fd', cajaBorde: '#0284c7', cajaOk: '#bbf7d0', cajaOkBorde: '#16a34a', durmiente: '#0369a1',
      traje: '#f97316', trajeBorde: '#c2410c', casco: '#ffffff', visor: '#0ea5e9',
      crio: '#22d3ee', crioBorde: '#0891b2', desc: '#fb923c', descBorde: '#ea580c', gastada: '#d5dbe4', gastadaBorde: '#a3aebd',
      simbolo: '#ffffff', simboloGastada: '#ffffff' },
    pagina: { fondo: '#eef2f7', panel: '#ffffff', texto: '#1e293b', suave: '#64748b', borde: '#cbd5e1', acento: '#0284c7',
      boton: '#ffffff', botonTexto: '#1e293b', radio: '8px', titulo: "'Exo 2', system-ui, sans-serif", tituloTam: '28px',
      letra: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fuentes: 'family=Exo+2:wght@700' },
  };

  // ---------- 4) PLANO: papel de plano azul claro, piezas de línea en tinta marina ----------
  const plano = {
    nombre: 'Plano',
    desc: 'Como el plano de la nave: papel azul claro cuadriculado, muros rayados y piezas dibujadas a línea en tinta marina.',
    vector: { muroTipo: 'rayado', capsulaTipo: 'circulo',
      fondo: '#e6effb', suelo: '#f5f9ff', sueloLinea: '#d0e0f5', muro: '#dce8f8', muroDetalle: '#3b5f93',
      diana: '#1f3a63', dianaRayas: true, caja: '#ffffff', cajaBorde: '#1f3a63', cajaOk: '#e1f5e8', cajaOkBorde: '#1f7a46', durmiente: '#1f3a63',
      traje: '#ffffff', trajeBorde: '#1f3a63', casco: '#ffffff', visor: '#9cc0f5',
      crio: '#ffffff', crioBorde: '#2f6fd6', desc: '#ffffff', descBorde: '#d9622b', gastada: '#ffffff', gastadaBorde: '#a9bcd6',
      simbolo: null, simboloGastada: '#a9bcd6' },   // null: el símbolo va del color del borde
    pagina: { fondo: '#e6effb', panel: '#f7faff', texto: '#1f3a63', suave: '#4f6a92', borde: '#9cb8de', acento: '#2f6fd6',
      boton: '#f7faff', botonTexto: '#1f3a63', radio: '4px', titulo: "'Architects Daughter', cursive", tituloTam: '30px',
      letra: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fuentes: 'family=Architects+Daughter' },
  };

  // ---------- 5) PASTEL: colores de caramelo, bloques redondeados ----------
  const pastel = {
    nombre: 'Pastel',
    desc: 'Suave y alegre: lila, rosa y menta, muros de bloques redondeados y una astronauta de traje rosa.',
    vector: { muroTipo: 'bloque', capsulaTipo: 'circulo',
      fondo: '#f8f0ff', suelo: '#fffafd', sueloLinea: '#f1e2ef', muro: '#d8cbff', muroDetalle: '#b6a2f2',
      diana: '#f08fb8', dianaRayas: false, caja: '#c9e7ff', cajaBorde: '#76a7dc', cajaOk: '#c8f4d7', cajaOkBorde: '#4fb47a', durmiente: '#76a7dc',
      traje: '#ffb3d1', trajeBorde: '#df7aa6', casco: '#ffffff', visor: '#9fe6f0',
      crio: '#b4eef7', crioBorde: '#5fbfd1', desc: '#ffd6ad', descBorde: '#ee9f5f', gastada: '#efe8f4', gastadaBorde: '#cbbfd8',
      simbolo: '#ffffff', simboloGastada: '#ffffff' },
    pagina: { fondo: '#f8f0ff', panel: '#ffffff', texto: '#4a3a5c', suave: '#86779a', borde: '#e4d3f1', acento: '#a855f7',
      boton: '#b98af0', botonTexto: '#ffffff', radio: '999px', titulo: "'Fredoka', system-ui, sans-serif", tituloTam: '30px',
      letra: "'Nunito', system-ui, sans-serif", fuentes: 'family=Fredoka:wght@600&family=Nunito:wght@400;700;800' },
  };

  globalThis.VUELO_ESTILOS = { cubo, original, estacion, plano, pastel };
})();
