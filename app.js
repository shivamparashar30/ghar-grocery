(function () {
  "use strict";

  /* ------------------------------------------------------------------
     DATA SAFETY NOTES — read before editing
     1. KEY must never change: existing phones hold data under it.
     2. Item ids are "<pageId>-<index>" from items.js. NEVER reorder,
        insert or delete entries in items.js — ids would shift and every
        saved price/qty would attach to the wrong item. Append only,
        at the END of a page's array.
     3. load() must tolerate older saved shapes (missing fields).
     4. A rolling backup is kept under BKEY before each write.
     ------------------------------------------------------------------ */
  var KEY  = "dmart-list-v1";
  var BKEY = "dmart-list-v1-backup";

  var state = load();   // { done, price, qty, name, extra, removed }
  var filter = "all";
  var query = "";

  function blank() {
    return { done: {}, price: {}, qty: {}, name: {}, extra: [], removed: {} };
  }

  function load() {
    var s = blank();
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return s;
      var p = JSON.parse(raw);
      if (!p || typeof p !== "object") return s;
      s.done    = p.done    && typeof p.done    === "object" ? p.done    : {};
      s.price   = p.price   && typeof p.price   === "object" ? p.price   : {};
      s.qty     = p.qty     && typeof p.qty     === "object" ? p.qty     : {};
      s.name    = p.name    && typeof p.name    === "object" ? p.name    : {};
      s.removed = p.removed && typeof p.removed === "object" ? p.removed : {};
      s.extra   = Array.isArray(p.extra) ? p.extra.filter(function (e) {
        return e && e.id && typeof e.hi === "string";
      }) : [];
    } catch (e) { /* corrupt or blocked storage -> start clean, don't crash */ }
    return s;
  }

  function save() {
    try {
      var prev = localStorage.getItem(KEY);
      if (prev) localStorage.setItem(BKEY, prev);   // rolling one-step backup
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  // ---- model -------------------------------------------------------------
  var model = [];
  PAGES.forEach(function (p) {
    model.push({
      id: p.id, title: p.title, sub: p.sub,
      items: p.items.map(function (it, i) {
        return { id: p.id + "-" + i, page: p.id, hi: it.hi, en: it.en,
                 qty: it.qty, est: it.est, u: !!it.u };
      })
    });
  });
  var EXTRA = { id: "extra", title: "My Added Items", sub: "added by me", items: [] };
  model.push(EXTRA);

  function syncExtra() {
    EXTRA.items = state.extra.map(function (e) {
      return { id: e.id, page: "extra", hi: e.hi, en: "", qty: e.qty || "", est: null, u: false };
    });
  }
  syncExtra();

  function nameOf(it) { return state.name[it.id] != null ? state.name[it.id] : it.hi; }
  function live(g) { return g.items.filter(function (i) { return !state.removed[i.id]; }); }
  function allItems() {
    return model.reduce(function (a, g) { return a.concat(live(g)); }, []);
  }
  function newPrice(it) { var v = parseFloat(state.price[it.id]); return isNaN(v) ? null : v; }
  function tookQty(it) { return state.qty[it.id] || ""; }

  // ---- render ------------------------------------------------------------
  var listEl = document.getElementById("list");

  function matches(it) {
    if (state.removed[it.id]) return false;
    var done = !!state.done[it.id];
    if (filter === "todo" && done) return false;
    if (filter === "done" && !done) return false;
    if (query) {
      var hay = (nameOf(it) + " " + (it.en || "") + " " + (it.qty || "")).toLowerCase();
      if (hay.indexOf(query) === -1) return false;
    }
    return true;
  }

  function render() {
    listEl.innerHTML = "";
    var shown = 0;

    model.forEach(function (g) {
      var vis = g.items.filter(matches);
      if (!vis.length) return;
      shown += vis.length;
      var lv = live(g);

      var h = document.createElement("div");
      h.className = "grp";
      h.innerHTML = '<h2></h2><small></small><span class="cnt"></span>';
      h.querySelector("h2").textContent = g.title;
      h.querySelector("small").textContent = g.sub;
      h.querySelector(".cnt").textContent =
        lv.filter(function (i) { return state.done[i.id]; }).length + "/" + lv.length;
      listEl.appendChild(h);

      var ul = document.createElement("ul");
      vis.forEach(function (it) { ul.appendChild(row(it)); });
      listEl.appendChild(ul);
    });

    if (!shown) {
      var e = document.createElement("div");
      e.className = "empty";
      e.textContent = query ? "No match 🤷" : "Nothing here";
      listEl.appendChild(e);
    }
    updateStats();
  }

  function row(it) {
    var li = document.createElement("li");
    li.className = "row" + (state.done[it.id] ? " done" : "");
    li.dataset.id = it.id;

    var tick = document.createElement("button");
    tick.className = "tick"; tick.textContent = "✓";
    tick.setAttribute("aria-label", "mark bought");

    var body = document.createElement("div");
    body.className = "body";

    var top = document.createElement("div");
    top.className = "top";

    var tapzone = document.createElement("div");
    tapzone.className = "tapzone";

    var nm = document.createElement("div");
    nm.className = "nm";
    setName();
    function setName() {
      nm.textContent = nameOf(it);
      if (it.u) {
        var qm = document.createElement("span");
        qm.className = "q"; qm.textContent = "?";
        nm.appendChild(qm);
      }
    }
    tapzone.appendChild(nm);

    var bits = [];
    if (it.en) bits.push(it.en);
    if (it.qty) bits.push("List: " + it.qty);
    if (bits.length) {
      var meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = bits.join("  ·  ");
      tapzone.appendChild(meta);
    }

    var ed = document.createElement("button");
    ed.className = "edit"; ed.textContent = "✎";
    ed.setAttribute("aria-label", "edit name");

    var del = document.createElement("button");
    del.className = "edit del"; del.textContent = "🗑";
    del.setAttribute("aria-label", "delete item");

    top.appendChild(tapzone); top.appendChild(ed); top.appendChild(del);
    body.appendChild(top);

    var ctl = document.createElement("div");
    ctl.className = "ctl";

    var qWrap = document.createElement("label");
    qWrap.className = "fld";
    qWrap.innerHTML = '<span class="lbl">Qty taken</span>';
    var qIn = document.createElement("input");
    qIn.type = "text"; qIn.className = "inp qty";
    qIn.placeholder = it.qty || "qty";
    qIn.value = tookQty(it);
    qWrap.appendChild(qIn);

    var pWrap = document.createElement("label");
    pWrap.className = "fld";
    pWrap.innerHTML = '<span class="lbl">New price ₹</span>';
    var pIn = document.createElement("input");
    pIn.type = "text"; pIn.className = "inp price";
    pIn.inputMode = "decimal"; pIn.placeholder = "0";
    pIn.value = state.price[it.id] != null ? state.price[it.id] : "";
    pWrap.appendChild(pIn);

    var cmp = document.createElement("div");
    cmp.className = "cmp";

    ctl.appendChild(qWrap); ctl.appendChild(pWrap); ctl.appendChild(cmp);
    body.appendChild(ctl);

    li.appendChild(tick); li.appendChild(body);

    function paintCmp() {
      cmp.innerHTML = "";
      var np = newPrice(it);
      if (it.est == null) {
        if (np != null) cmp.innerHTML = '<span class="chip neu">New ₹' + fmt(np) + "</span>";
        return;
      }
      var old = document.createElement("span");
      old.className = "chip old"; old.textContent = "Old ₹" + fmt(it.est);
      cmp.appendChild(old);
      if (np == null) return;
      var d = np - it.est;
      var chip = document.createElement("span");
      chip.className = "chip " + (d > 0 ? "up" : d < 0 ? "down" : "same");
      chip.textContent = d > 0 ? "▲ ₹" + fmt(d) + " more"
                       : d < 0 ? "▼ ₹" + fmt(-d) + " saved" : "= same";
      cmp.appendChild(chip);
    }
    paintCmp();

    function toggle() {
      if (state.done[it.id]) delete state.done[it.id]; else state.done[it.id] = 1;
      save();
      li.classList.toggle("done", !!state.done[it.id]);
      updateStats(); refreshCounts();
      if (filter !== "all") render();
    }
    tick.addEventListener("click", toggle);
    tapzone.addEventListener("click", function () {
      if (!li.classList.contains("editing")) toggle();
    });

    qIn.addEventListener("input", function () {
      if (qIn.value === "") delete state.qty[it.id]; else state.qty[it.id] = qIn.value;
      save();
    });
    pIn.addEventListener("input", function () {
      var v = pIn.value.replace(/[^0-9.]/g, "");
      if (v !== pIn.value) pIn.value = v;
      if (v === "") delete state.price[it.id]; else state.price[it.id] = v;
      save(); paintCmp(); updateStats();
    });
    [qIn, pIn].forEach(function (el) {
      el.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault(); el.blur();
        if (!state.done[it.id]) toggle();
      });
    });

    ed.addEventListener("click", function () {
      if (li.classList.contains("editing")) return;
      li.classList.add("editing");
      var inp = document.createElement("input");
      inp.type = "text"; inp.className = "inp rename";
      inp.value = nameOf(it);
      nm.replaceWith(inp);
      inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);

      var closed = false;
      function commit(keep) {
        if (closed) return; closed = true;
        var v = inp.value.trim();
        if (keep && v) {
          state.name[it.id] = v;
          if (it.page === "extra") {
            state.extra.forEach(function (e) { if (e.id === it.id) e.hi = v; });
          }
          save();
        }
        setName();
        inp.replaceWith(nm);
        li.classList.remove("editing");
      }
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
        if (ev.key === "Escape") commit(false);
      });
      inp.addEventListener("blur", function () { commit(true); });
    });

    del.addEventListener("click", function () {
      if (!confirm('Delete "' + nameOf(it) + '"?\n\n(You can bring it back from Menu -> Restore deleted)')) return;
      if (it.page === "extra") {
        state.extra = state.extra.filter(function (e) { return e.id !== it.id; });
        syncExtra();
      }
      state.removed[it.id] = 1;
      save(); render();
    });

    return li;
  }

  function refreshCounts() {
    var heads = listEl.querySelectorAll(".grp");
    var i = 0;
    model.forEach(function (g) {
      if (!g.items.filter(matches).length) return;
      var el = heads[i++]; if (!el) return;
      var lv = live(g);
      el.querySelector(".cnt").textContent =
        lv.filter(function (x) { return state.done[x.id]; }).length + "/" + lv.length;
    });
  }

  // ---- stats -------------------------------------------------------------
  function totals() {
    var items = allItems();
    var spent = 0, oldSum = 0;
    items.forEach(function (i) {
      var np = newPrice(i);
      if (np == null) return;
      spent += np;
      if (i.est != null) oldSum += i.est;
    });
    return {
      items: items,
      total: items.length,
      done: items.filter(function (i) { return state.done[i.id]; }).length,
      spent: spent, oldSum: oldSum, diff: spent - oldSum
    };
  }

  function updateStats() {
    var t = totals();
    document.getElementById("sDone").textContent = t.done + "/" + t.total;
    document.getElementById("sOld").textContent  = "₹" + fmt(t.oldSum);
    var dEl = document.getElementById("sDiff");
    dEl.textContent = (t.diff > 0 ? "+₹" : t.diff < 0 ? "−₹" : "₹") + fmt(Math.abs(t.diff));
    dEl.className = "v " + (t.diff > 0 ? "red" : t.diff < 0 ? "green" : "ind");
    document.getElementById("total").textContent = "₹" + fmt(t.spent);
    document.getElementById("tsub").textContent =
      (t.oldSum ? "Old ₹" + fmt(t.oldSum) + "  ·  " : "") + (t.total - t.done) + " left";
    document.getElementById("bar").style.width = t.total ? (t.done / t.total * 100) + "%" : "0%";
    var rc = Object.keys(state.removed).length;
    var rb = document.getElementById("mRestore");
    rb.textContent = "♻️ Restore deleted (" + rc + ")";
    rb.disabled = !rc;
  }

  function fmt(n) {
    n = Math.round(n * 100) / 100;
    return n.toLocaleString("en-IN");
  }

  // ---- filters / search --------------------------------------------------
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      filter = b.dataset.f; render();
    });
  });
  var qEl = document.getElementById("q");
  qEl.addEventListener("input", function () {
    query = qEl.value.trim().toLowerCase(); render();
  });

  // ---- menu sheet --------------------------------------------------------
  var sheet = document.getElementById("sheet");
  function openSheet(v) { sheet.classList.toggle("open", v); }
  document.getElementById("menu").addEventListener("click", function () { openSheet(true); });
  document.getElementById("sheetBg").addEventListener("click", function () { openSheet(false); });
  document.getElementById("mClose").addEventListener("click", function () { openSheet(false); });

  // add item
  document.getElementById("mAdd").addEventListener("click", function () {
    openSheet(false);
    var n = prompt("New item name:");
    if (!n || !n.trim()) return;
    var q = prompt("How much? (can leave blank)", "") || "";
    var id = "x-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    state.extra.push({ id: id, hi: n.trim(), qty: q.trim() });
    save(); syncExtra(); render();
    var el = listEl.querySelector('[data-id="' + id + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // restore deleted
  document.getElementById("mRestore").addEventListener("click", function () {
    var n = Object.keys(state.removed).length;
    if (!n) return;
    if (!confirm("Restore " + n + " deleted item(s)?\n(Items you added yourself will not come back)")) return;
    state.removed = {};
    save(); render(); openSheet(false);
  });

  // ---- export ------------------------------------------------------------
  function stamp() {
    var d = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
           "_" + p(d.getHours()) + p(d.getMinutes());
  }

  function download(name, text, type) {
    try {
      var blob = new Blob([text], { type: type || "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      return true;
    } catch (e) { return false; }
  }

  document.getElementById("mExport").addEventListener("click", function () {
    var payload = {
      app: "dmart-list", version: 1,
      exportedAt: new Date().toISOString(),
      itemCount: allItems().length,
      data: state
    };
    var txt = JSON.stringify(payload, null, 2);
    if (!download("dmart-list-backup_" + stamp() + ".json", txt)) {
      prompt("Copy this (backup):", txt);
    }
    openSheet(false);
  });

  // ---- import ------------------------------------------------------------
  var fileIn = document.getElementById("file");
  document.getElementById("mImport").addEventListener("click", function () {
    openSheet(false); fileIn.value = ""; fileIn.click();
  });

  fileIn.addEventListener("change", function () {
    var f = fileIn.files && fileIn.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var p;
      try { p = JSON.parse(String(r.result)); }
      catch (e) { alert("❌ Could not read the file — pick a valid JSON backup."); return; }

      var d = (p && p.data) ? p.data : p;
      if (!d || typeof d !== "object" || (!d.price && !d.done && !d.qty && !d.extra)) {
        alert("❌ That does not look like a backup from this app."); return;
      }

      var nP = Object.keys(d.price || {}).length,
          nD = Object.keys(d.done  || {}).length,
          nQ = Object.keys(d.qty   || {}).length,
          nX = (d.extra || []).length;

      if (!confirm("Import this backup?\n\n" + nD + " ticked · " + nP + " prices · " +
                   nQ + " quantities · " + nX + " added items\n\n" +
                   "It will be MERGED into your current data.\n" +
                   "Your existing data is kept in a backup.")) return;

      try { localStorage.setItem(BKEY, JSON.stringify(state)); } catch (e) {}

      ["done", "price", "qty", "name", "removed"].forEach(function (k) {
        var src = d[k];
        if (!src || typeof src !== "object") return;
        Object.keys(src).forEach(function (id) { state[k][id] = src[id]; });
      });
      if (Array.isArray(d.extra)) {
        var have = {};
        state.extra.forEach(function (e) { have[e.id] = 1; });
        d.extra.forEach(function (e) {
          if (e && e.id && typeof e.hi === "string" && !have[e.id]) state.extra.push(e);
        });
      }
      save(); syncExtra(); render();
      alert("✅ Import done.");
    };
    r.onerror = function () { alert("❌ Could not open the file."); };
    r.readAsText(f);
  });

  // ---- copy as text ------------------------------------------------------
  document.getElementById("mCopy").addEventListener("click", function () {
    var txt = asText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { alert("📋 Copied."); },
                                              function () { prompt("Copy this:", txt); });
    } else prompt("Copy this:", txt);
    openSheet(false);
  });

  function asText() {
    var t = totals(), lines = [];
    lines.push("DMart List — " + new Date().toLocaleDateString("en-IN"));
    lines.push("");
    model.forEach(function (g) {
      var lv = live(g); if (!lv.length) return;
      lines.push("— " + g.title + " —");
      lv.forEach(function (i) {
        var np = newPrice(i), parts = [(state.done[i.id] ? "[x] " : "[ ] ") + nameOf(i)];
        var q = tookQty(i) || i.qty;
        if (q) parts.push(q);
        if (np != null) parts.push("₹" + np + (i.est != null ? " (old ₹" + i.est + ")" : ""));
        lines.push(parts.join(" — "));
      });
      lines.push("");
    });
    lines.push("Bought: " + t.done + "/" + t.total + "   Left: " + (t.total - t.done));
    lines.push("New total: ₹" + fmt(t.spent));
    if (t.oldSum) lines.push("Old: ₹" + fmt(t.oldSum) + "   Diff: " +
      (t.diff >= 0 ? "+" : "−") + "₹" + fmt(Math.abs(t.diff)));
    return lines.join("\n");
  }

  // ---- print -------------------------------------------------------------
  document.getElementById("mPrint").addEventListener("click", function () {
    buildPrint(); openSheet(false);
    setTimeout(function () { window.print(); }, 120);
  });

  function buildPrint() {
    var t = totals();
    var done = [], left = [];
    model.forEach(function (g) {
      live(g).forEach(function (i) {
        (state.done[i.id] ? done : left).push({ g: g, i: i });
      });
    });

    var h = [];
    h.push('<h1>DMart Shopping List</h1>');
    h.push('<p class="pmeta">' + new Date().toLocaleString("en-IN") +
           '  ·  Bought ' + t.done + '/' + t.total + '  ·  Left ' + (t.total - t.done) + '</p>');

    h.push('<table class="psum"><tr>' +
           '<td><b>New total spent</b><br>₹' + fmt(t.spent) + '</td>' +
           '<td><b>Old estimate</b><br>₹' + fmt(t.oldSum) + '</td>' +
           '<td><b>Difference</b><br>' + (t.diff >= 0 ? "+" : "−") + '₹' + fmt(Math.abs(t.diff)) + '</td>' +
           '</tr></table>');

    h.push('<h2>✓ Bought — ' + done.length + ' items</h2>');
    h.push(table(done, true));

    h.push('<h2 class="brk">☐ Remaining — ' + left.length + ' items</h2>');
    h.push(table(left, false));

    document.getElementById("print").innerHTML = h.join("");
  }

  function table(rows, withPrice) {
    if (!rows.length) return '<p class="pnone">— none —</p>';
    var h = ['<table class="ptab"><thead><tr><th>#</th><th>Item</th><th>Page</th><th>Qty</th>'];
    h.push(withPrice ? '<th class="r">Old</th><th class="r">New</th><th class="r">Diff</th>'
                     : '<th class="r">Old price</th><th>✓</th>');
    h.push('</tr></thead><tbody>');
    rows.forEach(function (r, n) {
      var i = r.i, np = newPrice(i);
      h.push('<tr><td>' + (n + 1) + '</td><td><b>' + esc(nameOf(i)) + '</b>' +
             (i.en ? '<br><span class="pen">' + esc(i.en) + '</span>' : '') + '</td>' +
             '<td>' + esc(r.g.title) + '</td>' +
             '<td>' + esc(withPrice ? (tookQty(i) || i.qty || "—") : (i.qty || "—")) + '</td>');
      if (withPrice) {
        var d = (np != null && i.est != null) ? np - i.est : null;
        h.push('<td class="r">' + (i.est != null ? "₹" + fmt(i.est) : "—") + '</td>' +
               '<td class="r"><b>' + (np != null ? "₹" + fmt(np) : "—") + '</b></td>' +
               '<td class="r">' + (d == null ? "—" : (d > 0 ? "+" : d < 0 ? "−" : "") + "₹" + fmt(Math.abs(d))) + '</td>');
      } else {
        h.push('<td class="r">' + (i.est != null ? "₹" + fmt(i.est) : "—") + '</td><td class="box"></td>');
      }
      h.push('</tr>');
    });
    return h.join("") + '</tbody></table>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // ---- reset (guarded) ---------------------------------------------------
  document.getElementById("mReset").addEventListener("click", function () {
    openSheet(false);
    if (!confirm("⚠️ All ticks, prices and quantities will be erased.\n\nTake a backup first: Menu -> Export!\n\nContinue?")) return;
    if (prompt('Are you sure? Type DELETE below:') !== "DELETE") { alert("Stopped — nothing was erased."); return; }
    try { localStorage.setItem(BKEY, JSON.stringify(state)); } catch (e) {}
    state.done = {}; state.price = {}; state.qty = {};
    save(); render();
  });

  render();
})();
