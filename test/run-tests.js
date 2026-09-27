/*
 * Tarayicisiz testler:  node test/run-tests.js
 *
 * Algoritma dosyalari DOM'a dokunmadigi icin Node uzerinde dogrudan
 * calistirilabiliyor. Test yok diye bir gorsellestiricinin bozulmasi
 * gerekmiyor.
 */
"use strict";

require("../js/sorting.js");
require("../js/pathfinding.js");

const S = globalThis.Sorting;
const P = globalThis.Pathfinding;

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error("  BASARISIZ: " + label);
  }
}

function section(name) {
  console.log("\n" + name);
}

/* ---------------- siralama ---------------- */

section("Siralama algoritmalari");

for (const key of Object.keys(S.meta)) {
  let ok = true;
  for (const dist of ["random", "nearly", "reversed", "fewunique"]) {
    for (const n of [1, 2, 3, 8, 47, 140]) {
      const input = S.generate(n, dist);
      const result = S.run(key, input);
      const expected = input.slice().sort((a, b) => a - b);

      if (JSON.stringify(expected) !== JSON.stringify(result.sorted)) {
        ok = false;
        check(key + " / " + dist + " / n=" + n + " sonuc sirali degil", false);
      }

      // Her eleman en az bir kez "yerine oturdu" olarak isaretlenmeli,
      // yoksa animasyon sonunda yesile donmeyen cubuklar kalir.
      const done = new Set(result.ops.filter((o) => o.t === "done").map((o) => o.i));
      if (done.size !== n) {
        ok = false;
        check(key + " / " + dist + " / n=" + n + " done isaretleri eksik", false);
      }

      // Islem listesini bagimsiz olarak oynatinca ayni sonuc cikmali.
      const replay = input.slice();
      for (const op of result.ops) {
        if (op.t === "swap") {
          const tmp = replay[op.i];
          replay[op.i] = replay[op.j];
          replay[op.j] = tmp;
        } else if (op.t === "set") {
          replay[op.i] = op.v;
        }
      }
      if (JSON.stringify(replay) !== JSON.stringify(result.sorted)) {
        ok = false;
        check(key + " / " + dist + " / n=" + n + " islem listesi tutmuyor", false);
      }
    }
  }
  if (ok) {
    passed++;
    console.log("  tamam: " + S.meta[key].name);
  }
}

/* ---------------- yol bulma ---------------- */

section("Yol bulma algoritmalari");

const COLS = 41;
const ROWS = 21;
const ALGOS = ["bfs", "dfs", "dijkstra", "astar"];

function randomGrid(wallRate, weightRate) {
  const cells = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < cells.length; i++) {
    const r = Math.random();
    if (r < wallRate) cells[i] = P.WALL;
    else if (r < wallRate + weightRate) cells[i] = P.WEIGHT;
  }
  const start = 0;
  const end = COLS * ROWS - 1;
  cells[start] = 0;
  cells[end] = 0;
  return { cells, cols: COLS, rows: ROWS, start, end };
}

let pathOk = true;
for (let round = 0; round < 300; round++) {
  const grid = randomGrid(0.25, 0.1);
  const results = {};
  for (const algo of ALGOS) results[algo] = P.run(algo, grid);

  for (const algo of ALGOS) {
    const path = results[algo].path;
    if (!path.length) continue;

    if (path[0] !== grid.start || path[path.length - 1] !== grid.end) {
      pathOk = false;
      check(algo + ": yol baslangic/hedef ile eslesmiyor", false);
    }

    for (let i = 1; i < path.length; i++) {
      const diff = Math.abs(path[i] - path[i - 1]);
      const sameRow = Math.floor(path[i] / COLS) === Math.floor(path[i - 1] / COLS);
      if (!((diff === 1 && sameRow) || diff === COLS)) {
        pathOk = false;
        check(algo + ": yolda bitisik olmayan adim var", false);
      }
      if (grid.cells[path[i]] === P.WALL) {
        pathOk = false;
        check(algo + ": yol duvardan geciyor", false);
      }
    }
  }

  // Hepsi ayni sonuca varmali: ya hedefe ulasilir ya ulasilmaz.
  const reachable = ALGOS.map((a) => results[a].path.length > 0);
  if (new Set(reachable).size !== 1) {
    pathOk = false;
    check("algoritmalar ulasilabilirlik konusunda ayrisiyor", false);
  }

  // Dijkstra ve A* ayni en dusuk maliyeti bulmali.
  if (results.dijkstra.path.length && results.dijkstra.cost !== results.astar.cost) {
    pathOk = false;
    check("Dijkstra ve A* farkli maliyet buldu", false);
  }
}
if (pathOk) {
  passed++;
  console.log("  tamam: 300 rastgele izgarada yol gecerliligi ve maliyet tutarliligi");
}

let shortestOk = true;
for (let round = 0; round < 150; round++) {
  const grid = randomGrid(0.25, 0);
  const bfs = P.run("bfs", grid);
  const dijkstra = P.run("dijkstra", grid);
  const astar = P.run("astar", grid);
  if (bfs.path.length !== dijkstra.path.length || dijkstra.path.length !== astar.path.length) {
    shortestOk = false;
    check("agirliksiz izgarada yol uzunluklari farkli", false);
  }
}
if (shortestOk) {
  passed++;
  console.log("  tamam: agirliksiz izgarada BFS = Dijkstra = A* uzunlugu");
}

let mazeOk = true;
for (let round = 0; round < 60; round++) {
  const start = COLS + 1;
  const end = COLS * (ROWS - 2) + COLS - 2;
  const cells = P.maze(COLS, ROWS, start, end);
  const result = P.run("bfs", { cells, cols: COLS, rows: ROWS, start, end });
  if (!result.path.length) {
    mazeOk = false;
    check("uretilen labirentin cozumu yok", false);
  }
}
if (mazeOk) {
  passed++;
  console.log("  tamam: 60 labirentin hepsi cozulebilir");
}

/* ---------------- sonuc ---------------- */

console.log("\n" + passed + " gecti, " + failed + " kaldi.");
process.exit(failed ? 1 : 0);
