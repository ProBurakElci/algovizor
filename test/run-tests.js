/*
 * Headless tests:  node test/run-tests.js
 *
 * The algorithm files never touch the DOM, so Node can run them directly.
 * A visualizer has no excuse to be untested.
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
    console.error("  FAILED: " + label);
  }
}

function section(name) {
  console.log("\n" + name);
}

/* ---------------- sorting ---------------- */

section("Sorting algorithms");

for (const key of Object.keys(S.meta)) {
  let ok = true;
  for (const dist of ["random", "nearly", "reversed", "fewunique"]) {
    for (const n of [1, 2, 3, 8, 47, 140]) {
      const input = S.generate(n, dist);
      const result = S.run(key, input);
      const expected = input.slice().sort((a, b) => a - b);

      if (JSON.stringify(expected) !== JSON.stringify(result.sorted)) {
        ok = false;
        check(key + " / " + dist + " / n=" + n + ": result is not sorted", false);
      }

      // Every element must be marked "done" at least once, otherwise the
      // animation ends with bars that never turn green.
      const done = new Set(result.ops.filter((o) => o.t === "done").map((o) => o.i));
      if (done.size !== n) {
        ok = false;
        check(key + " / " + dist + " / n=" + n + ": missing done markers", false);
      }

      // Replaying the operation list on its own must produce the same array.
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
        check(key + " / " + dist + " / n=" + n + ": operation list does not replay", false);
      }
    }
  }
  if (ok) {
    passed++;
    console.log("  ok: " + S.meta[key].name);
  }
}

/* ---------------- pathfinding ---------------- */

section("Pathfinding algorithms");

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
      check(algo + ": path does not connect start and target", false);
    }

    for (let i = 1; i < path.length; i++) {
      const diff = Math.abs(path[i] - path[i - 1]);
      const sameRow = Math.floor(path[i] / COLS) === Math.floor(path[i - 1] / COLS);
      if (!((diff === 1 && sameRow) || diff === COLS)) {
        pathOk = false;
        check(algo + ": path contains a non-adjacent step", false);
      }
      if (grid.cells[path[i]] === P.WALL) {
        pathOk = false;
        check(algo + ": path runs through a wall", false);
      }
    }
  }

  // All four must agree on whether the target is reachable at all.
  const reachable = ALGOS.map((a) => results[a].path.length > 0);
  if (new Set(reachable).size !== 1) {
    pathOk = false;
    check("algorithms disagree about reachability", false);
  }

  // Dijkstra and A* must find the same minimum cost.
  if (results.dijkstra.path.length && results.dijkstra.cost !== results.astar.cost) {
    pathOk = false;
    check("Dijkstra and A* report different costs", false);
  }
}
if (pathOk) {
  passed++;
  console.log("  ok: 300 random grids - valid paths and matching costs");
}

let shortestOk = true;
for (let round = 0; round < 150; round++) {
  const grid = randomGrid(0.25, 0);
  const bfs = P.run("bfs", grid);
  const dijkstra = P.run("dijkstra", grid);
  const astar = P.run("astar", grid);
  if (bfs.path.length !== dijkstra.path.length || dijkstra.path.length !== astar.path.length) {
    shortestOk = false;
    check("path lengths differ on an unweighted grid", false);
  }
}
if (shortestOk) {
  passed++;
  console.log("  ok: unweighted grids - BFS = Dijkstra = A* path length");
}

let mazeOk = true;
for (let round = 0; round < 60; round++) {
  const start = COLS + 1;
  const end = COLS * (ROWS - 2) + COLS - 2;
  const cells = P.maze(COLS, ROWS, start, end);
  const result = P.run("bfs", { cells, cols: COLS, rows: ROWS, start, end });
  if (!result.path.length) {
    mazeOk = false;
    check("generated maze has no solution", false);
  }
}
if (mazeOk) {
  passed++;
  console.log("  ok: 60 generated mazes are all solvable");
}

/* ---------------- result ---------------- */

console.log("\n" + passed + " passed, " + failed + " failed.");
process.exit(failed ? 1 : 0);
