(function () {
  "use strict";

  var KEY = "dmart-list-v1";
  var state = load();          // { done:{}, price:{}, qty:{}, name:{}, extra:[] }
  var filter = "all";
  var query = "";

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        s.done  = s.done  || {}; s.price = s.price || {};
        s.qty   = s.qty   || {}; s.name  = s.name  || {};
        s.extra = s.extra || [];
        return s;
      }
    } catch (e) { /* private mode / blocked storage */ }
    return { done: {}, price: {}, qty: {}, name: {}, extra: [] };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---- flat model with stable ids ---------------------------------------
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
  var EXTRA = { id: "extra", title: "मेरे जोड़े हुए", sub: "extra items", items: [] };
  model.push(EXTRA);

  function syncExtra() {
    EXTRA.items = state.extra.map(function (e) {
      return { id: e.id, page: "extra", hi: e.hi, en: "", qty: e.qty || "", est: null, u: false };
    });
  }
  syncExtra();

  function nameOf(it) { return state.name[it.id] != null ? state.name[it.id] : it.hi; }
  function allItems() { return model.reduce(function (a, g) { return a.concat(g.items); }, []); }
  function newPrice(it) { var v = parseFloat(state.price[it.id]); return isNaN(v) ? null : v; }

  // ---- render -----------------------------------------------------------
  var listEl = document.getElementById("list");

  function matches(it) {
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
      if (!g.items.length) return;
      var vis = g.items.filter(matches);
      if (!vis.length) return;
      shown += vis.length;

      var h = document.createElement("div");
      h.className = "grp";
      h.innerHTML = '<h2></h2><small></small><span class="cnt"></span>';
      h.querySelector("h2").textContent = g.title;
      h.querySelector("small").textContent = g.sub;
      h.querySelector(".cnt").textContent =
        g.items.filter(function (i) { return state.done[i.id]; }).length + "/" + g.items.length;
      listEl.appendChild(h);

      var ul = document.createElement("ul");
      vis.forEach(function (it) { ul.appendChild(row(it)); });
      listEl.appendChild(ul);
    });

    if (!shown) {
      var e = document.createElement("div");
      e.className = "empty";
      e.textContent = query ? "कुछ नहीं मिला 🤷" : "यहाँ कुछ नहीं है";
      listEl.appendChild(e);
    }
    updateStats();
  }

  function row(it) {
    var li = document.createElement("li");
    li.className = "row" + (state.done[it.id] ? " done" : "");
    li.dataset.id = it.id;

    // tick -------------------------------------------------------------
    var tick = document.createElement("button");
    tick.className = "tick"; tick.textContent = "✓";
    tick.setAttribute("aria-label", "mark bought");

    var body = document.createElement("div");
    body.className = "body";

    // name line --------------------------------------------------------
    var top = document.createElement("div");
    top.className = "top";

    var tapzone = document.createElement("div");
    tapzone.className = "tapzone";

    var nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = nameOf(it);
    if (it.u) {
      var qm = document.createElement("span");
      qm.className = "q"; qm.textContent = "?";
      qm.title = "handwriting unclear — verify";
      nm.appendChild(qm);
    }
    tapzone.appendChild(nm);

    var meta = document.createElement("div");
    meta.className = "meta";
    var bits = [];
    if (it.en) bits.push(it.en);
    if (it.qty) bits.push("लिस्ट: " + it.qty);
    meta.textContent = bits.join("  ·  ");
    if (bits.length) tapzone.appendChild(meta);

    var ed = document.createElement("button");
    ed.className = "edit"; ed.textContent = "✎";
    ed.setAttribute("aria-label", "edit name");

    top.appendChild(tapzone);
    top.appendChild(ed);
    body.appendChild(top);

    // controls line ----------------------------------------------------
    var ctl = document.createElement("div");
    ctl.className = "ctl";

    var qWrap = document.createElement("label");
    qWrap.className = "fld";
    qWrap.innerHTML = '<span class="lbl">कितना लिया</span>';
    var qIn = document.createElement("input");
    qIn.type = "text"; qIn.className = "inp qty";
    qIn.placeholder = it.qty || "qty";
    qIn.value = state.qty[it.id] != null ? state.qty[it.id] : "";
    qIn.setAttribute("aria-label", "quantity taken for " + nameOf(it));
    qWrap.appendChild(qIn);

    var pWrap = document.createElement("label");
    pWrap.className = "fld";
    pWrap.innerHTML = '<span class="lbl">नया भाव ₹</span>';
    var pIn = document.createElement("input");
    pIn.type = "text"; pIn.className = "inp price";
    pIn.inputMode = "decimal"; pIn.placeholder = "0";
    pIn.value = state.price[it.id] != null ? state.price[it.id] : "";
    pIn.setAttribute("aria-label", "new price for " + nameOf(it));
    pWrap.appendChild(pIn);

    var cmp = document.createElement("div");
    cmp.className = "cmp";

    ctl.appendChild(qWrap);
    ctl.appendChild(pWrap);
    ctl.appendChild(cmp);
    body.appendChild(ctl);

    li.appendChild(tick);
    li.appendChild(body);

    // old vs new -------------------------------------------------------
    function paintCmp() {
      cmp.innerHTML = "";
      if (it.est == null) {
        var np0 = newPrice(it);
        if (np0 != null) cmp.innerHTML = '<span class="chip neu">नया ₹' + fmt(np0) + "</span>";
        return;
      }
      var old = document.createElement("span");
      old.className = "chip old";
      old.textContent = "पुराना ₹" + fmt(it.est);
      cmp.appendChild(old);

      var np = newPrice(it);
      if (np == null) return;

      var d = np - it.est;
      var chip = document.createElement("span");
      chip.className = "chip " + (d > 0 ? "up" : d < 0 ? "down" : "same");
      chip.textContent = d > 0 ? "▲ ₹" + fmt(d) + " ज़्यादा"
                       : d < 0 ? "▼ ₹" + fmt(-d) + " बचा"
                               : "= बराबर";
      cmp.appendChild(chip);
    }
    paintCmp();

    // interactions -----------------------------------------------------
    function toggle() {
      if (state.done[it.id]) delete state.done[it.id]; else state.done[it.id] = 1;
      save();
      li.classList.toggle("done", !!state.done[it.id]);
      updateStats(); refreshCounts();
      if (filter !== "all") render();
    }
    tick.addEventListener("click", toggle);
    tapzone.addEventListener("click", function () {
      if (li.classList.contains("editing")) return;
      toggle();
    });

    qIn.addEventListener("input", function () {
      var v = qIn.value;
      if (v === "") delete state.qty[it.id]; else state.qty[it.id] = v;
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

    // inline rename ----------------------------------------------------
    ed.addEventListener("click", function () {
      if (li.classList.contains("editing")) return;
      li.classList.add("editing");

      var inp = document.createElement("input");
      inp.type = "text"; inp.className = "inp rename";
      inp.value = nameOf(it);
      inp.setAttribute("aria-label", "item name");
      nm.replaceWith(inp);
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);

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
        nm.firstChild ? (nm.childNodes[0].nodeValue = nameOf(it)) : (nm.textContent = nameOf(it));
        inp.replaceWith(nm);
        li.classList.remove("editing");
        pIn.setAttribute("aria-label", "new price for " + nameOf(it));
      }
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { ev.preventDefault(); commit(true); }
        if (ev.key === "Escape") { commit(false); }
      });
      inp.addEventListener("blur", function () { commit(true); });
    });

    return li;
  }

  function refreshCounts() {
    var heads = listEl.querySelectorAll(".grp");
    var i = 0;
    model.forEach(function (g) {
      if (!g.items.length || !g.items.filter(matches).length) return;
      var el = heads[i++]; if (!el) return;
      el.querySelector(".cnt").textContent =
        g.items.filter(function (x) { return state.done[x.id]; }).length + "/" + g.items.length;
    });
  }

  // ---- stats -------------------------------------------------------------
  function updateStats() {
    var items = allItems();
    var total = items.length;
    var done  = items.filter(function (i) { return state.done[i.id]; }).length;

    var spent = 0, oldSum = 0;
    items.forEach(function (i) {
      var np = newPrice(i);
      if (np == null) return;
      spent += np;
      if (i.est != null) oldSum += i.est;      // compare only what's been priced
    });
    var diff = spent - oldSum;

    document.getElementById("sDone").textContent = done + "/" + total;
    document.getElementById("sOld").textContent  = "₹" + fmt(oldSum);

    var dEl = document.getElementById("sDiff");
    dEl.textContent = (diff > 0 ? "+₹" : diff < 0 ? "−₹" : "₹") + fmt(Math.abs(diff));
    dEl.className = "v " + (diff > 0 ? "red" : diff < 0 ? "green" : "ind");

    document.getElementById("total").textContent = "₹" + fmt(spent);
    document.getElementById("tsub").textContent =
      oldSum ? "पुराना ₹" + fmt(oldSum) + "  ·  " + (total - done) + " बाकी"
             : (total - done) + " आइटम बाकी";
    document.getElementById("bar").style.width = total ? (done / total * 100) + "%" : "0%";
  }

  function fmt(n) {
    n = Math.round(n * 100) / 100;
    return n.toLocaleString("en-IN");
  }

  // ---- toolbar -----------------------------------------------------------
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".seg button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      filter = b.dataset.f;
      render();
    });
  });

  var qEl = document.getElementById("q");
  qEl.addEventListener("input", function () {
    query = qEl.value.trim().toLowerCase();
    render();
  });

  document.getElementById("add").addEventListener("click", function () {
    var n = prompt("नया आइटम का नाम:");
    if (!n || !n.trim()) return;
    state.extra.push({ id: "x-" + Date.now(), hi: n.trim(), qty: "" });
    save(); syncExtra(); render();
    var el = listEl.querySelector('[data-id="' + state.extra[state.extra.length - 1].id + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.getElementById("copy").addEventListener("click", function () {
    var lines = [], spent = 0, oldSum = 0;
    model.forEach(function (g) {
      if (!g.items.length) return;
      lines.push("— " + g.title + " —");
      g.items.forEach(function (i) {
        var np = newPrice(i);
        if (np != null) { spent += np; if (i.est != null) oldSum += i.est; }
        var parts = [(state.done[i.id] ? "[x] " : "[ ] ") + nameOf(i)];
        var took = state.qty[i.id] || i.qty;
        if (took) parts.push(took);
        if (np != null) parts.push("₹" + np + (i.est != null ? " (पुराना ₹" + i.est + ")" : ""));
        lines.push(parts.join(" — "));
      });
      lines.push("");
    });
    lines.push("कुल खर्च: ₹" + fmt(spent));
    if (oldSum) lines.push("पुराना अंदाज़: ₹" + fmt(oldSum) + "  ·  अंतर: " +
      (spent - oldSum >= 0 ? "+" : "−") + "₹" + fmt(Math.abs(spent - oldSum)));
    var txt = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(flash, function () { fallback(txt); });
    } else fallback(txt);
  });

  function fallback(txt) {
    var t = document.createElement("textarea");
    t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); flash(); } catch (e) { alert(txt); }
    document.body.removeChild(t);
  }
  function flash() {
    var b = document.getElementById("copy"), old = b.textContent;
    b.textContent = "✓";
    setTimeout(function () { b.textContent = old; }, 1200);
  }

  document.getElementById("reset").addEventListener("click", function () {
    if (!confirm("सब टिक, भाव और मात्रा मिटा दें?\n(नाम के बदलाव और जोड़े हुए आइटम रहेंगे)")) return;
    state.done = {}; state.price = {}; state.qty = {};
    save(); render();
  });

  render();
})();
