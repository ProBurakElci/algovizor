/*
 * Siralama algoritmalari.
 *
 * Buradaki fonksiyonlar animasyon yapmaz. Dizinin bir kopyasi uzerinde
 * calisip yaptiklari her hareketi bir "islem listesi" olarak dondururler:
 *
 *   { t: "cmp",  i, j }  -> i ve j karsilastirildi
 *   { t: "swap", i, j }  -> i ve j yer degistirdi
 *   { t: "set",  i, v }  -> i konumuna v yazildi (merge sort icin)
 *   { t: "done", i }     -> i artik kesin yerinde
 *
 * Boylece cizim kodu algoritmadan tamamen ayri kaliyor: arayuz sadece
 * listeyi sirayla oynatiyor. Duraklatmak, hizlandirmak veya geri almak
 * bu sayede tek satirlik is.
 */
(function (global) {
  "use strict";

  const Sorting = {};

  Sorting.meta = {
    bubble: {
      name: "Bubble Sort",
      time: "O(n^2)",
      space: "O(1)",
      stable: true,
      note: "Komsu iki elemani karsilastirir, ters duruyorsa takas eder. Her turda en buyuk eleman sona kabarir. Neredeyse sirali dizilerde sasirtici bicimde hizlidir, cunku takas olmayan turda erken cikar.",
    },
    insertion: {
      name: "Insertion Sort",
      time: "O(n^2)",
      space: "O(1)",
      stable: true,
      note: "Elindeki oyun kagitlarini siralamak gibi: her yeni elemani soldaki sirali bolgede dogru yere sokar. Kucuk ve neredeyse sirali dizilerde gercek hayatta en hizli secenektir; bu yuzden bircok kutuphane buyuk algoritmalarin son adiminda buna gecer.",
    },
    selection: {
      name: "Selection Sort",
      time: "O(n^2)",
      space: "O(1)",
      stable: false,
      note: "Kalan kisimdaki en kucugu bulur ve one alir. Takas sayisi en fazla n-1 oldugu icin yazma islemi pahali olan ortamlarda (ornegin flash bellek) avantajlidir.",
    },
    merge: {
      name: "Merge Sort",
      time: "O(n log n)",
      space: "O(n)",
      stable: true,
      note: "Diziyi ikiye bol, her yariyi sirala, sonra iki sirali yariyi birlestir. Garantili O(n log n) verir, en kotu durumda da bozulmaz. Bedeli ek bellektir.",
    },
    quick: {
      name: "Quick Sort",
      time: "O(n log n) ortalama",
      space: "O(log n)",
      stable: false,
      note: "Bir pivot secer, kucukleri soluna buyukleri saginda toplar, sonra iki tarafi ayni sekilde cozer. Pratikte en hizli siralamadir ama kotu pivot secimiyle O(n^2) seviyesine duser. Burada pivotu medyan-of-three ile seciyoruz.",
    },
    heap: {
      name: "Heap Sort",
      time: "O(n log n)",
      space: "O(1)",
      stable: false,
      note: "Diziyi bir max-heap yapisina cevirir, sonra kokteki en buyugu tekrar tekrar sona atar. Ek bellek istemez ve en kotu durumda da O(n log n) kalir.",
    },
  };

  /* ---------------- yardimcilar ---------------- */

  function recorder() {
    const ops = [];
    return {
      ops,
      cmp(i, j) {
        ops.push({ t: "cmp", i, j });
      },
      swap(a, i, j) {
        ops.push({ t: "swap", i, j });
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      },
      set(a, i, v) {
        ops.push({ t: "set", i, v });
        a[i] = v;
      },
      done(i) {
        ops.push({ t: "done", i });
      },
    };
  }

  /* ---------------- algoritmalar ---------------- */

  function bubble(a, r) {
    const n = a.length;
    for (let end = n - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        r.cmp(i, i + 1);
        if (a[i] > a[i + 1]) {
          r.swap(a, i, i + 1);
          swapped = true;
        }
      }
      r.done(end);
      if (!swapped) {
        for (let i = 0; i < end; i++) r.done(i);
        return;
      }
    }
    r.done(0);
  }

  function insertion(a, r) {
    r.done(0);
    for (let i = 1; i < a.length; i++) {
      const key = a[i];
      let j = i - 1;
      while (j >= 0) {
        r.cmp(j, i);
        if (a[j] <= key) break;
        r.set(a, j + 1, a[j]);
        j--;
      }
      r.set(a, j + 1, key);
      r.done(i);
    }
  }

  function selection(a, r) {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        r.cmp(min, j);
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) r.swap(a, i, min);
      r.done(i);
    }
    r.done(n - 1);
  }

  function merge(a, r) {
    const buf = a.slice();

    function sort(lo, hi) {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1;
      sort(lo, mid);
      sort(mid, hi);
      for (let k = lo; k < hi; k++) buf[k] = a[k];
      let i = lo;
      let j = mid;
      for (let k = lo; k < hi; k++) {
        if (i >= mid) {
          r.set(a, k, buf[j++]);
        } else if (j >= hi) {
          r.set(a, k, buf[i++]);
        } else {
          r.cmp(i, j);
          if (buf[i] <= buf[j]) r.set(a, k, buf[i++]);
          else r.set(a, k, buf[j++]);
        }
      }
    }

    sort(0, a.length);
    for (let i = 0; i < a.length; i++) r.done(i);
  }

  function quick(a, r) {
    function medianOfThree(lo, hi) {
      const mid = (lo + hi) >> 1;
      r.cmp(lo, mid);
      r.cmp(mid, hi);
      const x = a[lo];
      const y = a[mid];
      const z = a[hi];
      if ((x <= y && y <= z) || (z <= y && y <= x)) return mid;
      if ((y <= x && x <= z) || (z <= x && x <= y)) return lo;
      return hi;
    }

    function partition(lo, hi) {
      const p = medianOfThree(lo, hi);
      if (p !== hi) r.swap(a, p, hi);
      const pivot = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) {
        r.cmp(j, hi);
        if (a[j] < pivot) {
          if (i !== j) r.swap(a, i, j);
          i++;
        }
      }
      r.swap(a, i, hi);
      return i;
    }

    function sort(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) {
        r.done(lo);
        return;
      }
      const p = partition(lo, hi);
      r.done(p);
      sort(lo, p - 1);
      sort(p + 1, hi);
    }

    sort(0, a.length - 1);
  }

  function heap(a, r) {
    const n = a.length;

    function siftDown(root, end) {
      while (true) {
        const left = 2 * root + 1;
        if (left > end) return;
        let child = left;
        if (left + 1 <= end) {
          r.cmp(left, left + 1);
          if (a[left] < a[left + 1]) child = left + 1;
        }
        r.cmp(root, child);
        if (a[root] >= a[child]) return;
        r.swap(a, root, child);
        root = child;
      }
    }

    for (let i = (n - 2) >> 1; i >= 0; i--) siftDown(i, n - 1);
    for (let end = n - 1; end > 0; end--) {
      r.swap(a, 0, end);
      r.done(end);
      siftDown(0, end - 1);
    }
    r.done(0);
  }

  const impls = { bubble, insertion, selection, merge, quick, heap };

  /**
   * Verilen diziyi siralar ve yapilan hareketlerin listesini dondurur.
   * Orijinal dizi degistirilmez.
   */
  Sorting.run = function (key, input) {
    const impl = impls[key];
    if (!impl) throw new Error("Bilinmeyen algoritma: " + key);
    const a = input.slice();
    const r = recorder();
    impl(a, r);
    return { ops: r.ops, sorted: a };
  };

  /** Farkli dagilimlarda test verisi uretir. */
  Sorting.generate = function (size, dist) {
    const a = new Array(size);
    for (let i = 0; i < size; i++) a[i] = i + 1;

    if (dist === "reversed") return a.reverse();

    if (dist === "fewunique") {
      const buckets = Math.max(3, Math.round(size / 12));
      for (let i = 0; i < size; i++) {
        const bucket = Math.floor(Math.random() * buckets) + 1;
        a[i] = Math.ceil((bucket / buckets) * size);
      }
      return a;
    }

    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }

    if (dist === "nearly" && size > 1) {
      a.sort((x, y) => x - y);
      const swaps = Math.max(1, Math.round(size * 0.06));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * (size - 1));
        const t = a[i];
        a[i] = a[i + 1];
        a[i + 1] = t;
      }
    }

    return a;
  };

  global.Sorting = Sorting;
})(typeof window !== "undefined" ? window : globalThis);
