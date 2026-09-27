/*
 * UI layer.
 *
 * The algorithms (sorting.js / pathfinding.js) know nothing about drawing;
 * here we simply replay the operation lists they produce, spread over time.
 * There is a single requestAnimationFrame loop, and the speed slider turns
 * into one question: how many operations should this frame play?
 */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const t = (key) => I18n.t(key);

  let locale = "en-US";
  const num = (value) => value.toLocaleString(locale);

  /* ============================================================
   * Language
   * ============================================================ */
  function applyLanguage(lang) {
    const active = I18n.set(lang);
    locale = active === "tr" ? "tr-TR" : "en-US";
    document.documentElement.lang = active;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    document.querySelectorAll(".lang").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === active);
    });

    try {
      localStorage.setItem("algovizor-lang", active);
    } catch (err) {
      // Private browsing blocks storage; the page still works without it.
    }

    sortView.refreshText();
    pathView.refreshText();
  }

  /* ============================================================
   * Tabs
   * ============================================================ */
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((other) => {
        const isActive = other === tab;
        other.classList.toggle("is-active", isActive);
        other.setAttribute("aria-selected", String(isActive));
      });
      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("is-active", view.id === "view-" + tab.dataset.view);
      });
      if (tab.dataset.view === "pathfinding") pathView.fit();
      else sortView.draw();
    });
  });

  document.querySelectorAll(".lang").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });

  /* ============================================================
   * SORTING VIEW
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
      const key = $("#sort-algo").value;
      const meta = Sorting.meta[key];
      $("#sort-explain").innerHTML =
        "<b>" + meta.name + "</b> &middot; " + t("meta.time") + " " + meta.time +
        " &middot; " + t("meta.space") + " " + meta.space +
        " &middot; " + (meta.stable ? t("meta.stable") : t("meta.unstable")) +
        "<br>" + t("sort." + key + ".note");
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
      $("#stat-cmp").textContent = num(counters.cmp);
      $("#stat-swap").textContent = num(counters.swap);
      $("#stat-step").textContent = num(opIndex) + " / " + num(ops.length);
      $("#stat-time").textContent = (elapsed / 1000).toFixed(1) + " " + t("unit.seconds");
    }

    /** Speed slider -> operations played per frame. */
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

    /* --- events --- */
    $("#sort-size").addEventListener("input", (e) => {
      $("#sort-size-val").textContent = e.target.value;
      generate();
    });
    $("#sort-speed").addEventListener("input", (e) => {
      $("#sort-speed-val").textContent = e.target.value;
    });
    $("#sort-dist").addEventListener("change", generate);
    $("#sort-algo").addEventListener("change", reset);
    $("#sort-shuffle").addEventListener("click", generate);
    $("#sort-run").addEventListener("click", run);
    $("#sort-stop").addEventListener("click", () => {
      stop();
      updateStats();
    });

    return {
      draw,
      generate,
      run,
      stop,
      refreshText() {
        explain();
        updateStats();
      },
    };
  })();

  /* ============================================================
   * PATHFINDING VIEW
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
    let lastResult = null;

    /** Picks a grid size for the available width (odd column count: the maze needs it). */
    function fit() {
      const width = gridEl.clientWidth || 900;
      const target = Math.min(55, Math.max(21, Math.round(width / 22)));
      const nextCols = target % 2 === 0 ? target + 1 : target;
      const nextRows = 21;
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
      lastResult = null;
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove("visited", "route", "frontier");
      }
      $("#stat-visited").textContent = "0";
      $("#stat-path").textContent = "—";
      $("#stat-cost").textContent = "—";
      $("#stat-ptime").textContent = "0.0 " + t("unit.seconds");
      $("#path-explain").textContent = t("hint.grid");
    }

    /* --- drawing with the mouse --- */
    let drawing = false;

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
      // Grabbing the start or target square drags it, whatever tool is selected.
      if (i === start) $("#path-tool").value = "start";
      else if (i === end) $("#path-tool").value = "end";
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
    };
    gridEl.addEventListener("pointerup", stopDrawing);
    gridEl.addEventListener("pointercancel", stopDrawing);
    window.addEventListener("blur", stopDrawing);

    /* --- animation --- */
    function cellsPerFrame() {
      const speed = Number($("#path-speed").value);
      return Math.max(1, Math.round(Math.pow(1.5, speed - 1)));
    }

    function describe(algo) {
      $("#path-explain").innerHTML =
        "<b>" + t("path." + algo + ".name") + "</b><br>" + t("path." + algo + ".note");
    }

    function reportResult(result) {
      $("#stat-path").textContent = result.path.length
        ? result.path.length + " " + t("path.cells")
        : t("path.none");
      $("#stat-cost").textContent = result.cost === null ? "—" : String(result.cost);
      if (!result.path.length) {
        $("#path-explain").innerHTML +=
          "<br><b>" + t("path.none") + "</b> — " + t("path.noneNote");
      }
    }

    function run() {
      if (playing) return;
      clearRun();
      const algo = $("#path-algo").value;
      describe(algo);

      const result = Pathfinding.run(algo, { cells, cols, rows, start, end });
      lastResult = result;
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
          $("#stat-visited").textContent = num(vi);
          if (vi >= result.visited.length) phase = "path";
        } else {
          const step = Math.max(1, Math.round(budget / 2));
          for (let k = 0; k < step && pi < result.path.length; k++) {
            const idx = result.path[pi++];
            if (idx !== start && idx !== end) nodes[idx].classList.add("route");
          }
          if (pi >= result.path.length) {
            reportResult(result);
            $("#stat-ptime").textContent =
              ((performance.now() - startedAt) / 1000).toFixed(1) + " " + t("unit.seconds");
            playing = false;
            toggleButtons(false);
            return;
          }
        }

        $("#stat-ptime").textContent =
          ((performance.now() - startedAt) / 1000).toFixed(1) + " " + t("unit.seconds");
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

    return {
      fit,
      run,
      stop,
      refreshText() {
        if (lastResult) {
          describe($("#path-algo").value);
          reportResult(lastResult);
        } else {
          $("#path-explain").textContent = t("hint.grid");
          $("#stat-path").textContent = "—";
        }
        $("#stat-ptime").textContent =
          $("#stat-ptime").textContent.replace(/[^\d.]+$/, " " + t("unit.seconds"));
      },
    };
  })();

  /* ============================================================
   * Keyboard shortcuts - no mouse needed while recording
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

  /* ============================================================
   * Boot
   * ============================================================ */
  let saved = null;
  try {
    saved = localStorage.getItem("algovizor-lang");
  } catch (err) {
    saved = null;
  }

  sortView.generate();
  pathView.fit();
  applyLanguage(saved || "en");
})();
