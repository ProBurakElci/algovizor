/*
 * Yol bulma algoritmalari.
 *
 * Izgara duz bir dizi olarak tutuluyor: index = row * cols + col.
 * Her hucre icin tip: 0 = bos, 1 = duvar, 2 = agir zemin.
 *
 * Her algoritma ayni seyi dondurur:
 *   { visited: [index...], path: [index...], cost: number|null }
 * visited -> hucrelerin kesfedilme sirasi (animasyon bunu oynatir)
 * path    -> baslangictan hedefe bulunan rota (bos ise yol yok)
 *
 * Algoritmalar DOM'a dokunmaz; bu yuzden ayni kod Node uzerinde test
 * edilebiliyor.
 */
(function (global) {
  "use strict";

  const Pathfinding = {};

  const WALL = 1;
  const WEIGHT = 2;
  const WEIGHT_COST = 5;

  Pathfinding.WALL = WALL;
  Pathfinding.WEIGHT = WEIGHT;
  Pathfinding.WEIGHT_COST = WEIGHT_COST;

  Pathfinding.meta = {
    bfs: {
      name: "BFS (Genislik Oncelikli Arama)",
      note: "Baslangictan dalga gibi disa dogru yayilir. Tum kenarlarin maliyeti esitse buldugu ilk yol en kisa yoldur. Agir zeminleri gormezden gelir, cunku sadece adim sayisi sayar.",
    },
    dfs: {
      name: "DFS (Derinlik Oncelikli Arama)",
      note: "Bir yonu sonuna kadar takip eder, tikanirsa geri doner. Hizli bir yol bulabilir ama en kisa olmasi garanti degildir; egri bugru rotalar cikarir.",
    },
    dijkstra: {
      name: "Dijkstra",
      note: "Her zaman o ana kadarki en ucuz hucreden devam eder. Agir zeminleri dogru hesaplar; agirliklarin hepsi 1 ise BFS ile ayni sonucu verir.",
    },
    astar: {
      name: "A* (A yildiz)",
      note: "Dijkstra ile ayni garantiyi verir, ama hedefe olan tahmini uzakligi (Manhattan sezgisi) de hesaba katarak once dogru yone bakar. Bu yuzden cok daha az hucre gezer.",
    },
  };

  /* ---------------- ortak yardimcilar ---------------- */

  function neighbors(index, cols, rows) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const out = [];
    if (row > 0) out.push(index - cols);
    if (row < rows - 1) out.push(index + cols);
    if (col > 0) out.push(index - 1);
    if (col < cols - 1) out.push(index + 1);
    return out;
  }

  function stepCost(type) {
    return type === WEIGHT ? WEIGHT_COST : 1;
  }

  function buildPath(prev, start, end) {
    if (prev[end] === undefined && start !== end) return [];
    const path = [];
    let cur = end;
    let guard = 0;
    while (cur !== undefined && guard++ < prev.length + 2) {
      path.push(cur);
      if (cur === start) break;
      cur = prev[cur];
    }
    if (path[path.length - 1] !== start) return [];
    return path.reverse();
  }

  function pathCost(path, cells) {
    if (!path.length) return null;
    let cost = 0;
    for (let i = 1; i < path.length; i++) cost += stepCost(cells[path[i]]);
    return cost;
  }

  /* ---------------- minimum yigin (priority queue) ---------------- */

  function MinHeap() {
    const items = [];
    return {
      get size() {
        return items.length;
      },
      push(node, priority) {
        items.push({ node, priority });
        let i = items.length - 1;
        while (i > 0) {
          const parent = (i - 1) >> 1;
          if (items[parent].priority <= items[i].priority) break;
          const t = items[parent];
          items[parent] = items[i];
          items[i] = t;
          i = parent;
        }
      },
      pop() {
        const top = items[0];
        const last = items.pop();
        if (items.length) {
          items[0] = last;
          let i = 0;
          while (true) {
            const l = 2 * i + 1;
            const r = l + 1;
            let small = i;
            if (l < items.length && items[l].priority < items[small].priority) small = l;
            if (r < items.length && items[r].priority < items[small].priority) small = r;
            if (small === i) break;
            const t = items[small];
            items[small] = items[i];
            items[i] = t;
            i = small;
          }
        }
        return top;
      },
    };
  }

  /* ---------------- algoritmalar ---------------- */

  function bfs(grid) {
    const { cells, cols, rows, start, end } = grid;
    const visited = [];
    const seen = new Uint8Array(cells.length);
    const prev = new Array(cells.length);
    const queue = [start];
    seen[start] = 1;

    while (queue.length) {
      const cur = queue.shift();
      visited.push(cur);
      if (cur === end) break;
      for (const nb of neighbors(cur, cols, rows)) {
        if (seen[nb] || cells[nb] === WALL) continue;
        seen[nb] = 1;
        prev[nb] = cur;
        queue.push(nb);
      }
    }

    const path = seen[end] ? buildPath(prev, start, end) : [];
    return { visited, path, cost: pathCost(path, cells) };
  }

  function dfs(grid) {
    const { cells, cols, rows, start, end } = grid;
    const visited = [];
    const seen = new Uint8Array(cells.length);
    const prev = new Array(cells.length);
    const stack = [start];

    while (stack.length) {
      const cur = stack.pop();
      if (seen[cur]) continue;
      seen[cur] = 1;
      visited.push(cur);
      if (cur === end) break;
      const nbs = neighbors(cur, cols, rows);
      for (let i = nbs.length - 1; i >= 0; i--) {
        const nb = nbs[i];
        if (seen[nb] || cells[nb] === WALL) continue;
        prev[nb] = cur;
        stack.push(nb);
      }
    }

    const path = seen[end] ? buildPath(prev, start, end) : [];
    return { visited, path, cost: pathCost(path, cells) };
  }

  function weighted(grid, useHeuristic) {
    const { cells, cols, rows, start, end } = grid;
    const visited = [];
    const dist = new Array(cells.length).fill(Infinity);
    const prev = new Array(cells.length);
    const settled = new Uint8Array(cells.length);
    const heap = MinHeap();

    const endRow = Math.floor(end / cols);
    const endCol = end % cols;
    const h = (index) => {
      if (!useHeuristic) return 0;
      return Math.abs(Math.floor(index / cols) - endRow) + Math.abs((index % cols) - endCol);
    };

    dist[start] = 0;
    heap.push(start, h(start));

    while (heap.size) {
      const cur = heap.pop().node;
      if (settled[cur]) continue;
      settled[cur] = 1;
      visited.push(cur);
      if (cur === end) break;
      for (const nb of neighbors(cur, cols, rows)) {
        if (cells[nb] === WALL || settled[nb]) continue;
        const alt = dist[cur] + stepCost(cells[nb]);
        if (alt < dist[nb]) {
          dist[nb] = alt;
          prev[nb] = cur;
          heap.push(nb, alt + h(nb));
        }
      }
    }

    const path = dist[end] < Infinity ? buildPath(prev, start, end) : [];
    return { visited, path, cost: path.length ? dist[end] : null };
  }

  const impls = {
    bfs,
    dfs,
    dijkstra: (g) => weighted(g, false),
    astar: (g) => weighted(g, true),
  };

  Pathfinding.run = function (key, grid) {
    const impl = impls[key];
    if (!impl) throw new Error("Bilinmeyen algoritma: " + key);
    return impl(grid);
  };

  /**
   * Recursive backtracker ile labirent uretir.
   * Izgarayi 2 adim atlayarak dolasir, boylece duvarlar arada kalir.
   */
  Pathfinding.maze = function (cols, rows, start, end) {
    const cells = new Uint8Array(cols * rows).fill(WALL);
    const idx = (r, c) => r * cols + c;

    const startRow = Math.floor(start / cols);
    const startCol = start % cols;
    const r0 = startRow % 2 === 0 ? startRow : Math.max(0, startRow - 1);
    const c0 = startCol % 2 === 0 ? startCol : Math.max(0, startCol - 1);

    const stack = [[r0, c0]];
    cells[idx(r0, c0)] = 0;

    while (stack.length) {
      const [r, c] = stack[stack.length - 1];
      const options = [];
      if (r > 1 && cells[idx(r - 2, c)] === WALL) options.push([r - 2, c, r - 1, c]);
      if (r < rows - 2 && cells[idx(r + 2, c)] === WALL) options.push([r + 2, c, r + 1, c]);
      if (c > 1 && cells[idx(r, c - 2)] === WALL) options.push([r, c - 2, r, c - 1]);
      if (c < cols - 2 && cells[idx(r, c + 2)] === WALL) options.push([r, c + 2, r, c + 1]);

      if (!options.length) {
        stack.pop();
        continue;
      }

      const pick = options[Math.floor(Math.random() * options.length)];
      cells[idx(pick[2], pick[3])] = 0;
      cells[idx(pick[0], pick[1])] = 0;
      stack.push([pick[0], pick[1]]);
    }

    // Baslangic ve hedef asla duvar olmasin, cevrelerinden cikis kalsin.
    for (const anchor of [start, end]) {
      cells[anchor] = 0;
      const row = Math.floor(anchor / cols);
      const col = anchor % cols;
      let opened = false;
      for (const nb of neighbors(anchor, cols, rows)) {
        if (cells[nb] === 0) opened = true;
      }
      if (!opened) {
        if (col + 1 < cols) cells[idx(row, col + 1)] = 0;
        else if (col > 0) cells[idx(row, col - 1)] = 0;
      }
    }

    // Bir miktar agir zemin serpistir, agirlikli algoritmalar fark etsin.
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === 0 && i !== start && i !== end && Math.random() < 0.06) {
        cells[i] = WEIGHT;
      }
    }

    return cells;
  };

  global.Pathfinding = Pathfinding;
})(typeof window !== "undefined" ? window : globalThis);
