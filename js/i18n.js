/*
 * Translations.
 *
 * Every user-visible string lives here, keyed by a dotted name. The UI looks
 * strings up with t(key); markup declares its key with data-i18n. Adding a
 * language means adding one object below - no other file changes.
 */
(function (global) {
  "use strict";

  const dictionaries = {
    en: {
      "app.tagline": "watch algorithms run, stop memorizing them",
      "tab.sorting": "Sorting",
      "tab.pathfinding": "Pathfinding",

      "label.algorithm": "Algorithm",
      "label.size": "Array size",
      "label.speed": "Speed",
      "label.distribution": "Distribution",
      "label.tool": "Mouse tool",

      "dist.random": "Random",
      "dist.nearly": "Nearly sorted",
      "dist.reversed": "Reversed",
      "dist.fewunique": "Few unique values",

      "tool.wall": "Draw walls",
      "tool.weight": "Heavy ground (swamp)",
      "tool.start": "Move start",
      "tool.end": "Move target",
      "tool.erase": "Erase",

      "btn.shuffle": "Shuffle",
      "btn.start": "Start",
      "btn.stop": "Stop",
      "btn.maze": "Generate maze",
      "btn.clear": "Clear",

      "stat.comparisons": "Comparisons",
      "stat.writes": "Swaps / writes",
      "stat.step": "Step",
      "stat.time": "Time",
      "stat.visited": "Cells visited",
      "stat.pathLength": "Path length",
      "stat.cost": "Total cost",

      "legend.idle": "waiting",
      "legend.comparing": "comparing",
      "legend.swapping": "moving",
      "legend.sorted": "in place",
      "legend.start": "start",
      "legend.end": "target",
      "legend.wall": "wall",
      "legend.weight": "heavy ground (cost 5)",
      "legend.visited": "visited",
      "legend.route": "path found",

      "hint.grid": "Click and drag on the grid to draw walls, or move the start and target.",
      "path.none": "No path reaches the target",
      "path.noneNote": "the walls seal the target off completely.",
      "path.cells": "cells",
      "unit.seconds": "s",

      "meta.time": "time",
      "meta.space": "extra space",
      "meta.stable": "stable",
      "meta.unstable": "not stable",

      "a11y.sortCanvas": "Sorting visualization",
      "a11y.grid": "Pathfinding grid",

      "footer.text": "No install, no dependencies - plain HTML, CSS and JavaScript.",
      "footer.link": "Source code",
      "footer.license": "is MIT licensed.",

      "sort.bubble.option": "Bubble Sort - O(n²)",
      "sort.insertion.option": "Insertion Sort - O(n²)",
      "sort.selection.option": "Selection Sort - O(n²)",
      "sort.merge.option": "Merge Sort - O(n log n)",
      "sort.quick.option": "Quick Sort - O(n log n)",
      "sort.heap.option": "Heap Sort - O(n log n)",

      "sort.bubble.note":
        "Compares neighbouring pairs and swaps them when they are out of order, so the largest value bubbles to the end on every pass. Surprisingly fast on nearly sorted data, because a pass with no swaps ends the whole thing early.",
      "sort.insertion.note":
        "Like sorting a hand of playing cards: each new value slides into its place in the sorted region on the left. On small or nearly sorted arrays it is the fastest option in practice, which is why many standard libraries switch to it for the final step of bigger algorithms.",
      "sort.selection.note":
        "Finds the smallest remaining value and moves it to the front. It performs at most n-1 swaps, so it wins where writing is expensive - flash memory, for example.",
      "sort.merge.note":
        "Split the array in half, sort each half, then merge the two sorted halves. Guaranteed O(n log n) even in the worst case. The price is the extra memory it needs.",
      "sort.quick.note":
        "Pick a pivot, push smaller values left and larger ones right, then solve both sides the same way. The fastest sort in practice, but a bad pivot choice drops it to O(n²) - here the pivot is the median of the first, middle and last element.",
      "sort.heap.note":
        "Turns the array into a max-heap, then repeatedly moves the root - the largest value - to the end. Needs no extra memory and stays O(n log n) even in the worst case.",

      "path.bfs.option": "BFS - guarantees the shortest path",
      "path.dijkstra.option": "Dijkstra - shortest weighted path",
      "path.astar.option": "A* - heuristic, fast",
      "path.dfs.option": "DFS - dives deep, no shortest guarantee",

      "path.bfs.name": "BFS (Breadth-First Search)",
      "path.dfs.name": "DFS (Depth-First Search)",
      "path.dijkstra.name": "Dijkstra",
      "path.astar.name": "A* (A star)",

      "path.bfs.note":
        "Spreads outward from the start like a wave. When every step costs the same, the first path it reaches is the shortest one. It ignores heavy ground, because it only counts steps.",
      "path.dfs.note":
        "Follows one direction as far as it goes, then backtracks when it gets stuck. It can find a path quickly, but that path is rarely the shortest - expect crooked routes.",
      "path.dijkstra.note":
        "Always continues from the cheapest cell found so far. It accounts for heavy ground correctly, and when every weight is 1 it produces exactly the same answer as BFS.",
      "path.astar.note":
        "Same guarantee as Dijkstra, but it also adds the estimated distance to the target (Manhattan heuristic), so it looks the right way first. That is why it visits far fewer cells.",
    },

    tr: {
      "app.tagline": "algoritmaları izle, ezberlemeden anla",
      "tab.sorting": "Sıralama",
      "tab.pathfinding": "Yol Bulma",

      "label.algorithm": "Algoritma",
      "label.size": "Dizi boyutu",
      "label.speed": "Hız",
      "label.distribution": "Dağılım",
      "label.tool": "Fare aracı",

      "dist.random": "Rastgele",
      "dist.nearly": "Neredeyse sıralı",
      "dist.reversed": "Ters sıralı",
      "dist.fewunique": "Az farklı değer",

      "tool.wall": "Duvar çiz",
      "tool.weight": "Ağır zemin (bataklık)",
      "tool.start": "Başlangıcı taşı",
      "tool.end": "Hedefi taşı",
      "tool.erase": "Sil",

      "btn.shuffle": "Karıştır",
      "btn.start": "Başlat",
      "btn.stop": "Durdur",
      "btn.maze": "Labirent üret",
      "btn.clear": "Temizle",

      "stat.comparisons": "Karşılaştırma",
      "stat.writes": "Takas / yazma",
      "stat.step": "Adım",
      "stat.time": "Süre",
      "stat.visited": "Gezilen hücre",
      "stat.pathLength": "Yol uzunluğu",
      "stat.cost": "Toplam maliyet",

      "legend.idle": "bekleyen",
      "legend.comparing": "karşılaştırılan",
      "legend.swapping": "değişen",
      "legend.sorted": "yerine oturan",
      "legend.start": "başlangıç",
      "legend.end": "hedef",
      "legend.wall": "duvar",
      "legend.weight": "ağır zemin (maliyet 5)",
      "legend.visited": "gezilen",
      "legend.route": "bulunan yol",

      "hint.grid": "Izgaraya tıklayıp sürükleyerek duvar çizebilir, başlangıç ve hedefi taşıyabilirsin.",
      "path.none": "Hedefe ulaşan bir yol yok",
      "path.noneNote": "duvarlar hedefi tamamen çevrelemiş.",
      "path.cells": "hücre",
      "unit.seconds": "sn",

      "meta.time": "zaman",
      "meta.space": "ek bellek",
      "meta.stable": "kararlı (stable)",
      "meta.unstable": "kararsız",

      "a11y.sortCanvas": "Sıralama görselleştirmesi",
      "a11y.grid": "Yol bulma ızgarası",

      "footer.text": "Kurulum yok, bağımlılık yok - düz HTML, CSS ve JavaScript.",
      "footer.link": "Kaynak kodu",
      "footer.license": "MIT lisanslı.",

      "sort.bubble.option": "Bubble Sort - O(n²)",
      "sort.insertion.option": "Insertion Sort - O(n²)",
      "sort.selection.option": "Selection Sort - O(n²)",
      "sort.merge.option": "Merge Sort - O(n log n)",
      "sort.quick.option": "Quick Sort - O(n log n)",
      "sort.heap.option": "Heap Sort - O(n log n)",

      "sort.bubble.note":
        "Komşu iki elemanı karşılaştırır, ters duruyorsa takas eder; her turda en büyük eleman sona kabarır. Neredeyse sıralı dizilerde şaşırtıcı biçimde hızlıdır, çünkü takas olmayan bir tur işi erkenden bitirir.",
      "sort.insertion.note":
        "Elindeki oyun kâğıtlarını sıralamak gibi: her yeni eleman soldaki sıralı bölgede yerine kayar. Küçük ve neredeyse sıralı dizilerde gerçek hayatta en hızlı seçenektir; bu yüzden birçok kütüphane büyük algoritmaların son adımında buna geçer.",
      "sort.selection.note":
        "Kalan kısımdaki en küçüğü bulup öne alır. En fazla n-1 takas yapar, yani yazma işleminin pahalı olduğu yerlerde (örneğin flash bellek) kazanır.",
      "sort.merge.note":
        "Diziyi ikiye böl, her yarıyı sırala, sonra iki sıralı yarıyı birleştir. En kötü durumda bile garantili O(n log n). Bedeli ek bellektir.",
      "sort.quick.note":
        "Bir pivot seçer, küçükleri soluna büyükleri sağına iter, sonra iki tarafı aynı şekilde çözer. Pratikte en hızlı sıralamadır ama kötü pivot seçimi onu O(n²) seviyesine düşürür; burada pivot ilk, orta ve son elemanın medyanıdır.",
      "sort.heap.note":
        "Diziyi bir max-heap yapısına çevirir, sonra kökteki en büyüğü tekrar tekrar sona atar. Ek bellek istemez ve en kötü durumda da O(n log n) kalır.",

      "path.bfs.option": "BFS - en kısa yolu garanti eder",
      "path.dijkstra.option": "Dijkstra - ağırlıklı en kısa yol",
      "path.astar.option": "A* - sezgisel, hızlı",
      "path.dfs.option": "DFS - derine dalar, kısa yolu garanti etmez",

      "path.bfs.name": "BFS (Genişlik Öncelikli Arama)",
      "path.dfs.name": "DFS (Derinlik Öncelikli Arama)",
      "path.dijkstra.name": "Dijkstra",
      "path.astar.name": "A* (A yıldız)",

      "path.bfs.note":
        "Başlangıçtan dalga gibi dışa doğru yayılır. Tüm adımların maliyeti eşitse bulduğu ilk yol en kısa yoldur. Ağır zemini görmezden gelir, çünkü sadece adım sayar.",
      "path.dfs.note":
        "Bir yönü sonuna kadar takip eder, tıkanırsa geri döner. Hızlı bir yol bulabilir ama en kısa olması nadirdir; eğri büğrü rotalar çıkarır.",
      "path.dijkstra.note":
        "Her zaman o ana kadarki en ucuz hücreden devam eder. Ağır zemini doğru hesaplar; tüm ağırlıklar 1 ise BFS ile birebir aynı sonucu verir.",
      "path.astar.note":
        "Dijkstra ile aynı garantiyi verir, üstüne hedefe olan tahmini uzaklığı (Manhattan sezgisi) da ekler, yani önce doğru yöne bakar. Bu yüzden çok daha az hücre gezer.",
    },
  };

  const I18n = {
    current: "en",

    available() {
      return Object.keys(dictionaries);
    },

    /** Looks up a key; falls back to English, then to the key itself. */
    t(key) {
      const dict = dictionaries[I18n.current] || dictionaries.en;
      if (dict[key] !== undefined) return dict[key];
      if (dictionaries.en[key] !== undefined) return dictionaries.en[key];
      return key;
    },

    set(lang) {
      I18n.current = dictionaries[lang] ? lang : "en";
      return I18n.current;
    },
  };

  global.I18n = I18n;
})(typeof window !== "undefined" ? window : globalThis);
