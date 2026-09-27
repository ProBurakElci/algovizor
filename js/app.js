/*
 * Arayuz katmani.
 *
 * Algoritmalar (sorting.js / pathfinding.js) ne cizildigini bilmez;
 * burada sadece onlarin urettigi islem listesini zamana yayarak
 * oynatiyoruz. Tek bir requestAnimationFrame dongusu var, hiz ayari
 * "bir karede kac islem oynatilsin" sorusuna donusuyor.
 */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* ============================================================
   * Sekme gecisleri
   * ============================================================ */
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".view").forEach((v) => {
        v.classList.toggle("is-active", v.id === "view-" + tab.dataset.view);
      });
      if (tab.dataset.view === "pathfinding") pathView.fit();
      else sortView.draw();
    });
  });

  /* ============================================================
   * SIRALAMA GORUNUMU
   * ============================================================ */
  const sortView = (function () {
    const canvas = $("#sort-canvas");
    const ctx = canvas.getContext("2d");
    const colors = {
      idle: "#3f5573",
      cmp: "#fbbf24",
      swap: "#f472b6",
      done: "#34d399",
    };

    let values = [];
    let states = [];
    let ops = [];
    let opIndex = 0;
    let playing = false;
    let rafId = null;
    let startedAt = 0;
    let elapsed = 0;
    let counters = { cmp: 0, swap: 0 };

    function generate() {
      const size = Number($("#sort-size").value);
      const dist = $("#sort-dist").value;
      values = Sorting.generate(size, dist);
      reset();
    }

    function reset() {
      stop();
      states = new Array(values.length).fill("idle");
      ops = [];
      opIndex = 0;
      counters = { cmp: 0, swap: 0 };
      elapsed = 0;
      updateStats();
      draw();
      explain();
    }

    function explain() {
      const meta = Sorting.meta[$("#sort-algo").value];
      $("#sort-explain").innerHTML =
        "<b>" + meta.name + "</b> &middot; zaman " + meta.time +
        " &middot; ek bellek " + meta.space +
        " &middot; " + (meta.stable ? "kararli (stable)" : "kararsiz") +
        "<br>" + meta.note;
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const n = values.length;
      if (!n) return;

      const max = Math.max.apply(null, values);
      const slot = w / n;
      const barW = Math.max(1, slot - Math.min(4, slot * 0.25));
      const pad = 14;

      for (let i = 0; i < n; i++) {
        const barH = Math.max(3, (values[i] / max) * (h - pad * 2));
        const x = i * slot + (slot - barW) / 2;
        const y = h - pad - barH;
        ctx.fillStyle = colors[states[i]] || colors.idle;
        ctx.fillRect(x, y, barW, barH);
      }
    }

    function updateStats() {
      $("#stat-cmp").textContent = counters.cmp.toLocaleString("tr-TR");
      $("#stat-swap").textContent = counters.swap.toLocaleString("tr-TR");
      $("#stat-step").textContent =
        opIndex.toLocaleString("tr-TR") + " / " + ops.length.toLocaleString("tr-TR");
      $("#stat-time").textContent = (elapsed / 1000).toFixed(1) + " sn";
    }

    /** Hiz kaydirmaci -> her karede oynatilacak islem sayisi. */
    function opsPerFrame() {
      const speed = Number($("#sort-speed").value); // 1..12
      return Math.max(1, Math.round(Math.pow(1.55, speed - 1)));
    }

    function clearTransient() {
      for (let i = 0; i < states.length; i++) {
        if (states[i] === "cmp" || states[i] === "swap") states[i] = "idle";
      }
    }

    function applyOp(op) {
      switch (op.t) {
        case "cmp":
          counters.cmp++;
          if (states[op.i] !== "done") states[op.i] = "cmp";
          if (states[op.j] !== "done") states[op.j] = "cmp";
          break;
        case "swap": {
          counters.swap++;
          const tmp = values[op.i];
          values[op.i] = values[op.j];
          values[op.j] = tmp;
          if (states[op.i] !== "done") states[op.i] = "swap";
          if (states[op.j] !== "done") states[op.j] = "swap";
          break;
        }
        case "set":
          counters.swap++;
          values[op.i] = op.v;
          if (states[op.i] !== "done") states[op.i] = "swap";
          break;
        case "done":
          states[op.i] = "done";
          break;
      }
    }

    function frame() {
      if (!playing) return;
      const budget = opsPerFrame();
      clearTransient();

      for (let k = 0; k < budget && opIndex < ops.length; k++) {
        applyOp(ops[opIndex++]);
      }

      elapsed = performance.now() - startedAt;
      draw();
      updateStats();

      if (opIndex >= ops.length) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(frame);
    }

    function finish() {
      playing = false;
      states = new Array(values.length).fill("done");
      draw();
      updateStats();
      toggleButtons(false);
    }

    function toggleButtons(running) {
      $("#sort-run").disabled = running;
      $("#sort-stop").disabled = !running;
      $("#sort-shuffle").disabled = running;
      $("#sort-algo").disabled = running;
      $("#sort-size").disabled = running;
      $("#sort-dist").disabled = running;
    }

    function run() {
      if (playing) return;
      const result = Sorting.run($("#sort-algo").value, values);
      ops = result.ops;
      opIndex = 0;
      counters = { cmp: 0, swap: 0 };
      states = new Array(values.length).fill("idle");
      playing = true;
      startedAt = performance.now();
      toggleButtons(true);
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      playing = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      toggleButtons(false);
    }

    /* --- olaylar --- */
    $("#sort-size").addEventListener("input", (e) => {
      $("#sort-size-val").textContent = e.target.value;
      generate();
    });
    $("#sort-speed").addEventListener("input", (e) => {
      $("#sort-speed-val").textContent = e.target.value;
    });
    $("#sort-dist").addEventListener("change", generate);
    $("#sort-algo").addEventListener("change", () => {
      reset();
    });
    $("#sort-shuffle").addEventListener("click", generate);
    $("#sort-run").addEventListener("click", run);
    $("#sort-stop").addEventListener("click", () => {
      stop();
      updateStats();
    });

    generate();
    return { draw, generate, run, stop };
  })();

  /* ============================================================
   * YOL BULMA GORUNUMU
   * ============================================================ */
  const pathView = (function () {
    const gridEl = $("#grid");
    let cols = 0;
    let rows = 0;
    let cells = null;
    let nodes = [];
    let start = 0;
    let end = 0;
    let playing = false;
    let rafId = null;
    let startedAt = 0;

    /** Ekran genisligine gore izgara boyutunu secer (tek sayi: labirent icin sart). */
    function fit() {
      const width = gridEl.clientWidth || 900;
      const target = Math.min(55, Math.max(21, Math.round(width / 22)));
      const nextCols = target % 2 === 0 ? target + 1 : target;
      const nextRows = Math.max(15, nextCols % 2 === 0 ? 21 : 21);
      if (nextCols === cols && nextRows === rows) return;
      build(nextCols, nextRows);
    }

    function build(c, r) {
      cols = c;
      rows = r;
      cells = new Uint8Array(cols * rows);
      start = Math.floor(rows / 2) * cols + 2;
      end = Math.floor(rows / 2) * cols + (cols - 3);

      gridEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
      gridEl.textContent = "";
      nodes = new Array(cols * rows);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < cols * rows; i++) {
        const div = document.createElement("div");
        div.className = "cell";
        div.dataset.i = String(i);
        nodes[i] = div;
        frag.appendChild(div);
      }
      gridEl.appendChild(frag);
      render();
    }

    function render() {
      for (let i = 0; i < nodes.length; i++) {
        let cls = "cell";
        if (cells[i] === Pathfinding.WALL) cls += " wall";
        else if (cells[i] === Pathfinding.WEIGHT) cls += " weight";
        if (i === start) cls += " start";
        if (i === end) cls += " end";
        nodes[i].className = cls;
      }
    }

    function clearRun() {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove("visited", "route", "frontier");
      }
      $("#stat-visited").textContent = "0";
      $("#stat-path").textContent = "—";
      $("#stat-cost").textContent = "—";
      $("#stat-ptime").textContent = "0.0 sn";
    }

    /* --- fare ile cizim --- */
    let drawing = false;
    let dragTarget = null;

    function paint(index) {
      const tool = $("#path-tool").value;
      if (tool === "start") {
        if (index !== end) start = index;
      } else if (tool === "end") {
        if (index !== start) end = index;
      } else if (index !== start && index !== end) {
        if (tool === "wall") cells[index] = Pathfinding.WALL;
        else if (tool === "weight") cells[index] = Pathfinding.WEIGHT;
        else if (tool === "erase") cells[index] = 0;
      }
      render();
    }

    function indexFromEvent(e) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || !target.dataset || target.dataset.i === undefined) return null;
      return Number(target.dataset.i);
    }

    gridEl.addEventListener("pointerdown", (e) => {
      if (playing) return;
      const i = indexFromEvent(e);
      if (i === null) return;
      drawing = true;
      const tool = $("#path-tool").value;
      dragTarget = i === start ? "start" : i === end ? "end" : tool;
      if (dragTarget === "start" || dragTarget === "end") {
        $("#path-tool").value = dragTarget;
      }
      paint(i);
      gridEl.setPointerCapture(e.pointerId);
    });

    gridEl.addEventListener("pointermove", (e) => {
      if (!drawing || playing) return;
      const i = indexFromEvent(e);
      if (i !== null) paint(i);
    });

    const stopDrawing = () => {
      drawing = false;
      dragTarget = null;
    };
    gridEl.addEventListener("pointerup", stopDrawing);
    gridEl.addEventListener("pointercancel", stopDrawing);
    window.addEventListener("blur", stopDrawing);

    /* --- animasyon --- */
    function cellsPerFrame() {
      const speed = Number($("#path-speed").value);
      return Math.max(1, Math.round(Math.pow(1.5, speed - 1)));
    }

    function run() {
      if (playing) return;
      clearRun();
      const algo = $("#path-algo").value;
      const meta = Pathfinding.meta[algo];
      $("#path-explain").innerHTML = "<b>" + meta.name + "</b><br>" + meta.note;

      const result = Pathfinding.run(algo, { cells, cols, rows, start, end });
      playing = true;
      toggleButtons(true);
      startedAt = performance.now();

      let vi = 0;
      let pi = 0;
      let phase = "visit";

      function frame() {
        if (!playing) return;
        const budget = cellsPerFrame();

        if (phase === "visit") {
          for (let k = 0; k < budget && vi < result.visited.length; k++) {
            const idx = result.visited[vi++];
            if (idx !== start && idx !== end) nodes[idx].classList.add("visited");
          }
          $("#stat-visited").textContent = vi.toLocaleString("tr-TR");
          if (vi >= result.visited.length) phase = "path";
        } else {
          for (let k = 0; k < Math.max(1, Math.round(budget / 2)) && pi < result.path.length; k++) {
            const idx = result.path[pi++];
            if (idx !== start && idx !== end) nodes[idx].classList.add("route");
          }
          if (pi >= result.path.length) {
            $("#stat-path").textContent = result.path.length
              ? result.path.length + " hucre"
              : "yol yok";
            $("#stat-cost").textContent = result.cost === null ? "—" : String(result.cost);
            $("#stat-ptime").textContent = ((performance.now() - startedAt) / 1000).toFixed(1) + " sn";
            playing = false;
            toggleButtons(false);
            if (!result.path.length) {
              $("#path-explain").innerHTML +=
                "<br><b>Hedefe ulasan bir yol yok</b> — duvarlar hedefi tamamen cevrelemis.";
            }
            return;
          }
        }

        $("#stat-ptime").textContent = ((performance.now() - startedAt) / 1000).toFixed(1) + " sn";
        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      playing = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      toggleButtons(false);
    }

    function toggleButtons(running) {
      $("#path-run").disabled = running;
      $("#path-stop").disabled = !running;
      $("#path-maze").disabled = running;
      $("#path-clear").disabled = running;
      $("#path-algo").disabled = running;
    }

    $("#path-speed").addEventListener("input", (e) => {
      $("#path-speed-val").textContent = e.target.value;
    });
    $("#path-maze").addEventListener("click", () => {
      stop();
      clearRun();
      cells = Pathfinding.maze(cols, rows, start, end);
      render();
    });
    $("#path-clear").addEventListener("click", () => {
      stop();
      clearRun();
      cells = new Uint8Array(cols * rows);
      render();
    });
    $("#path-run").addEventListener("click", run);
    $("#path-stop").addEventListener("click", stop);

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fit, 200);
    });

    fit();
    return { fit, run, stop };
  })();

  /* ============================================================
   * Klavye kisayollari — kayit sirasinda fareye gerek kalmasin
   * ============================================================ */
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
    const sortingActive = $("#view-sorting").classList.contains("is-active");
    if (e.code === "Space") {
      e.preventDefault();
      if (sortingActive) sortView.run();
      else pathView.run();
    } else if (e.key.toLowerCase() === "r") {
      if (sortingActive) sortView.generate();
    } else if (e.key === "Escape") {
      sortView.stop();
      pathView.stop();
    }
  });
})();
