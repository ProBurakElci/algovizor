# AlgoVizor

[![testler](https://github.com/ProBurakElci/algovizor/actions/workflows/ci.yml/badge.svg)](https://github.com/ProBurakElci/algovizor/actions/workflows/ci.yml)
[![lisans: MIT](https://img.shields.io/badge/lisans-MIT-blue.svg)](LICENSE)

**Canlı demo → https://proburakelci.github.io/algovizor/**

Sıralama ve yol bulma algoritmalarını adım adım izleten, **kurulum gerektirmeyen** bir görselleştirici.
Tek bir `index.html`, üç JavaScript dosyası, sıfır bağımlılık. Derleme yok, `npm install` yok.

> Amaç: algoritmayı ezberlemek yerine çalışırken görmek. "Quick Sort neden hızlı?", "A* neden Dijkstra'dan az hücre geziyor?" gibi soruların cevabı ekranda.

## Neler var

**Sıralama**
- Bubble, Insertion, Selection, Merge, Quick (medyan-of-three pivot), Heap
- Dizi boyutu 8–140, 4 farklı dağılım (rastgele / neredeyse sıralı / ters / az farklı değer)
- Canlı sayaçlar: karşılaştırma, takas-yazma, adım, süre
- Her algoritmanın zaman–bellek karmaşıklığı ve kararlı (stable) olup olmadığı ekranda

**Yol bulma**
- BFS, DFS, Dijkstra, A* (Manhattan sezgisi)
- Fareyle duvar çizme, ağır zemin (maliyet 5) koyma, başlangıç/hedefi sürükleme
- Recursive backtracker ile labirent üretimi
- Gezilen hücre sayısı, yol uzunluğu ve toplam maliyet karşılaştırması

**Klavye**: `Space` başlat · `R` diziyi yeniden karıştır · `Esc` durdur

## Çalıştırma

Depoyu indir, `index.html` dosyasını tarayıcıda aç. Hepsi bu.

```bash
git clone https://github.com/ProBurakElci/algovizor.git
cd algovizor
start index.html    # Windows  (macOS: open index.html, Linux: xdg-open index.html)
```

Yerel sunucu tercih edersen (Node kuruluysa):

```bash
npx --yes http-server . -p 5173
```

## Kod nasıl düzenlenmiş

```
index.html          arayüz iskeleti
styles.css          tema ve yerleşim
js/sorting.js       sıralama algoritmaları  (DOM bilmez)
js/pathfinding.js   yol bulma algoritmaları (DOM bilmez)
js/app.js           çizim, animasyon döngüsü, olaylar
```

Tasarımdaki tek önemli karar şu: **algoritmalar hiçbir şey çizmez.**

Sıralama fonksiyonları dizinin bir kopyası üzerinde çalışıp yaptıkları her hareketi bir işlem listesi olarak döndürür:

```js
{ t: "cmp",  i, j }   // i ve j karşılaştırıldı
{ t: "swap", i, j }   // yer değiştirdiler
{ t: "set",  i, v }   // i konumuna v yazıldı
{ t: "done", i }      // i artık kesin yerinde
```

Yol bulma fonksiyonları da benzer şekilde `{ visited, path, cost }` döndürür.

Arayüz bu listeyi `requestAnimationFrame` içinde zamana yayarak oynatır. Bunun üç faydası var:

1. Algoritma kodu `await` ve `setTimeout` ile kirlenmez — kitaptaki haliyle okunur.
2. Hız ayarı "bir karede kaç işlem oynatılsın" sorusuna indirgenir.
3. Algoritmalar tarayıcısız test edilebilir — aşağıdaki test buna örnek.

## Test

```bash
node test/run-tests.js
```

Her algoritmayı farklı boyut ve dağılımlarda çalıştırıp sonucun gerçekten sıralı olduğunu,
bulunan yolun duvarlardan geçmediğini ve BFS/Dijkstra/A*'ın ağırlıksız ızgarada aynı uzunlukta
yol bulduğunu doğrular.

## Katkı

Yeni algoritma eklemek kolay: `js/sorting.js` içine kaydedici (`r.cmp`, `r.swap`, `r.set`, `r.done`)
kullanan bir fonksiyon yaz, `impls` nesnesine ekle, `meta` içine açıklamasını gir, `index.html`
içindeki `<select>` listesine bir satır at. Arayüz tarafında hiçbir şey değiştirmen gerekmez.

Issue ve pull request açabilirsin — özellikle Shell Sort, Radix Sort, Bidirectional BFS ve
Greedy Best-First eklemeleri beklemede.

## Lisans

MIT — bkz. [LICENSE](LICENSE).

---

## English

AlgoVizor is a dependency-free sorting and pathfinding visualizer: open `index.html`, no build step.

Algorithms never touch the DOM. Sorting functions return an operation log (`cmp` / `swap` / `set` / `done`)
and pathfinding functions return `{ visited, path, cost }`; the UI replays that log inside a single
`requestAnimationFrame` loop. That keeps the algorithms readable, makes the speed slider trivial
(operations per frame) and lets everything be tested headlessly with `node test/run-tests.js`.

Includes Bubble, Insertion, Selection, Merge, Quick and Heap sort, plus BFS, DFS, Dijkstra and A*
with wall drawing, weighted tiles and recursive-backtracker maze generation. MIT licensed.
