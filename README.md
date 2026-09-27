# AlgoVizor

[![tests](https://github.com/ProBurakElci/algovizor/actions/workflows/ci.yml/badge.svg)](https://github.com/ProBurakElci/algovizor/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live demo → https://proburakelci.github.io/algovizor/**

A step-by-step visualizer for sorting and pathfinding algorithms that **needs no install**.
One `index.html`, four JavaScript files, zero dependencies. No build step, no `npm install`.

> The point is to watch an algorithm run instead of memorizing it. "Why is Quick Sort fast?",
> "Why does A* visit fewer cells than Dijkstra?" — the answer is on screen.

Available in English and Turkish (EN / TR switch in the header).

## What's inside

**Sorting**
- Bubble, Insertion, Selection, Merge, Quick (median-of-three pivot), Heap
- Array size 8–140, four distributions (random / nearly sorted / reversed / few unique values)
- Live counters: comparisons, swaps and writes, step, elapsed time
- Time and space complexity plus stability shown for every algorithm

**Pathfinding**
- BFS, DFS, Dijkstra, A* (Manhattan heuristic)
- Draw walls with the mouse, add heavy ground (cost 5), drag the start and target
- Maze generation with a recursive backtracker
- Compare cells visited, path length and total cost between algorithms

**Keyboard**: `Space` run · `R` reshuffle the array · `Esc` stop

## Running it

Download the repo and open `index.html` in a browser. That's it.

```bash
git clone https://github.com/ProBurakElci/algovizor.git
cd algovizor
start index.html    # Windows  (macOS: open index.html, Linux: xdg-open index.html)
```

If you prefer a local server (Node installed):

```bash
npx --yes http-server . -p 5173
```

## How the code is laid out

```
index.html          markup
styles.css          theme and layout
js/i18n.js          every user-visible string, per language
js/sorting.js       sorting algorithms      (DOM-free)
js/pathfinding.js   pathfinding algorithms  (DOM-free)
js/app.js           drawing, animation loop, events
```

There is one decision that shapes everything else: **the algorithms never draw anything.**

A sorting function works on a copy of the array and returns every move it made as a list of operations:

```js
{ t: "cmp",  i, j }   // compared i and j
{ t: "swap", i, j }   // swapped them
{ t: "set",  i, v }   // wrote v at index i
{ t: "done", i }      // i is now in its final place
```

Pathfinding functions return `{ visited, path, cost }` in the same spirit.

The UI replays that list inside a single `requestAnimationFrame` loop. Three things follow:

1. The algorithm code never gets polluted with `await` and `setTimeout` — it reads like the textbook version.
2. The speed slider collapses into one question: how many operations should this frame play?
3. The algorithms can be tested without a browser — see below.

## Tests

```bash
node test/run-tests.js
```

Runs every algorithm across sizes and distributions and checks that the result is genuinely sorted,
that replaying the operation list reproduces it, that a returned path never crosses a wall, that BFS,
Dijkstra and A* agree on path length in an unweighted grid, and that every generated maze is solvable.

## Contributing

Adding an algorithm is small work: write a function in `js/sorting.js` that uses the recorder
(`r.cmp`, `r.swap`, `r.set`, `r.done`), register it in `impls`, add its facts to `meta`, put its
description and option label in `js/i18n.js`, then add one `<option>` to `index.html`.
Nothing in the UI layer needs to change.

Issues and pull requests welcome — Shell Sort, Radix Sort, Bidirectional BFS and Greedy Best-First
are on the wishlist.

## License

MIT — see [LICENSE](LICENSE).

---

## Türkçe

AlgoVizor, sıralama ve yol bulma algoritmalarını adım adım gösteren, kurulum gerektirmeyen bir
görselleştirici: `index.html` dosyasını aç, çalışsın. Arayüz başlıktaki EN / TR düğmesiyle Türkçeye geçer.

Tasarımdaki tek önemli karar şu: algoritmalar hiçbir şey çizmez. Sıralama fonksiyonları yaptıkları her
hareketi bir işlem listesi (`cmp` / `swap` / `set` / `done`) olarak, yol bulma fonksiyonları ise
`{ visited, path, cost }` olarak döndürür; arayüz bu listeyi tek bir `requestAnimationFrame`
döngüsünde oynatır. Böylece algoritma kodu ders kitabındaki haliyle aynı kalır, hız ayarı "bir karede
kaç işlem" sorusuna iner ve her şey tarayıcısız test edilebilir (`node test/run-tests.js`).

Altı sıralama (bubble, insertion, selection, merge, quick, heap) ve dört yol bulma algoritması
(BFS, DFS, Dijkstra, A*) ile duvar çizme, ağır zemin ve labirent üretimi içerir. MIT lisanslıdır.
