(function () {
  "use strict";

  /* ------------------------------------------------------------------
     IDS: "<groupId>-<index>". Never reorder / insert / delete inside an
     items array in data.js or items.js — append at the end only, or every
     saved price moves to the wrong item.
     ------------------------------------------------------------------ */
  var KEY  = "ration-v1";
  var OLD  = "dmart-list-v1";      // previous app's store, migrated once
  var API  = "/api/list";

  // ---- state ------------------------------------------------------------
  function blank() {
    return { done:{}, price:{}, qty:{}, name:{}, extra:[], removed:{}, seeded:{},
             rev:0, updatedAt:0 };
  }

  function sane(p) {
    var s = blank();
    if (!p || typeof p !== "object") return s;
    ["done","price","qty","name","removed","seeded"].forEach(function (k) {
      if (p[k] && typeof p[k] === "object" && !Array.isArray(p[k])) s[k] = p[k];
    });
    s.extra = Array.isArray(p.extra)
      ? p.extra.filter(function (e) { return e && e.id && typeof e.hi === "string"; }) : [];
    s.rev = Number(p.rev) || 0;
    s.updatedAt = Number(p.updatedAt) || 0;
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return sane(JSON.parse(raw));
      var old = localStorage.getItem(OLD);         // one-time migration
      if (old) { var m = sane(JSON.parse(old)); m.updatedAt = Date.now(); return m; }
    } catch (e) {}
    return blank();
  }

  var state = load();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var pushT = null;
  function save(push) {
    state.updatedAt = Date.now();
    persist();
    if (push !== false) {
      clearTimeout(pushT);
      pushT = setTimeout(pushUp, 900);
    }
  }

  // ---- model ------------------------------------------------------------
  var months = [];
  MONTHS.forEach(function (m) { months.push(mk(m)); });

  // the earlier handwritten list, kept so its saved prices are never orphaned
  if (typeof PAGES !== "undefined" && PAGES.length) {
    months.push(mk({
      id: "old", title: "पुरानी लिस्ट", en: "Previous list",
      groups: PAGES.map(function (p) {
        return { id: p.id, title: p.title, en: p.sub, items: p.items };
      })
    }));
  }

  function mk(m) {
    return {
      id: m.id, title: m.title, en: m.en,
      groups: m.groups.map(function (g) {
        return {
          id: g.id, title: g.title, en: g.en, bought: !!g.bought,
          items: g.items.map(function (it, i) {
            return { id: g.id + "-" + i, gid: g.id, hi: it.hi, en: it.en,
                     qty: it.qty, paid: it.paid != null ? it.paid : null };
          })
        };
      })
    };
  }

  function extraGroup(m) {
    var gid = m.id + "-extra";
    var g = { id: gid, title: "जोड़े हुए", en: "Added by me", bought: false, items: [] };
    g.items = state.extra.filter(function (e) { return e.m === m.id; })
      .map(function (e) {
        return { id: e.id, gid: gid, hi: e.hi, en: "", qty: e.qty || "", paid: null };
      });
    return g;
  }

  function groupsOf(m) { return m.groups.concat([extraGroup(m)]); }
  function liveItems(g) {
    return g.items.filter(function (i) { return !state.removed[i.id]; });
  }
  function allOf(m) {
    return groupsOf(m).reduce(function (a, g) { return a.concat(liveItems(g)); }, []);
  }

  function nameOf(i) { return state.name[i.id] != null ? state.name[i.id] : i.hi; }
  function priceOf(i) {
    if (state.price[i.id] != null && state.price[i.id] !== "") {
      var v = parseFloat(state.price[i.id]); return isNaN(v) ? null : v;
    }
    return i.paid != null ? i.paid : null;
  }
  function priceVal(i) {
    return state.price[i.id] != null ? state.price[i.id]
         : (i.paid != null ? String(i.paid) : "");
  }
  function qtyOf(i) { return state.qty[i.id] || ""; }

  // items in a "bought" group start ticked, once
  months.forEach(function (m) {
    m.groups.forEach(function (g) {
      if (!g.bought || state.seeded[g.id]) return;
      g.items.forEach(function (i) { state.done[i.id] = 1; });
      state.seeded[g.id] = 1;
    });
  });
  persist();

  // ---- search -----------------------------------------------------------
  var qstr = "", qkey = "", qskel = "";
  function hit(i) {
    if (!qstr) return true;
    var hay = nameOf(i) + " " + (i.en || "") + " " + (i.qty || "");
    if (hay.toLowerCase().indexOf(qstr) !== -1) return true;
    // folding collapses repeats ("zzzz" -> "j"), so a 1-char key would
    // match almost everything. Only fuzzy-match from 2 characters up.
    if (qkey.length < 2) return false;
    var k = Translit.key(hay), s = Translit.skel(hay);
    return k.indexOf(qkey) !== -1 || (qskel.length > 1 && s.indexOf(qskel) !== -1);
  }

  // ---- views ------------------------------------------------------------
  var monthView = document.getElementById("monthView");
  var listView  = document.getElementById("listView");
  var listEl    = document.getElementById("list");
  var cur = null, filter = "all";

  function showMonths() {
    cur = null;
    listView.hidden = true; monthView.hidden = false;
    location.hash = "";
    var box = document.getElementById("monthCards");
    box.innerHTML = "";
    months.forEach(function (m) {
      var items = allOf(m);
      var done = items.filter(function (i) { return state.done[i.id]; }).length;
      var spent = items.reduce(function (a, i) {
        return a + (state.done[i.id] ? (priceOf(i) || 0) : 0);
      }, 0);
      var b = document.createElement("button");
      b.className = "mcard";
      b.innerHTML =
        '<div class="top"><div class="ic">🧾</div><div><h3></h3><div class="en"></div></div>' +
        '<div class="go">›</div></div>' +
        '<div class="bar"><span></span></div>' +
        '<div class="row2"><span><b>' + done + '</b> / ' + items.length + ' लिया</span>' +
        '<span><b>' + (items.length - done) + '</b> बाकी</span>' +
        '<span>खर्च <b>₹' + fmt(spent) + '</b></span></div>';
      b.querySelector("h3").textContent = m.title;
      b.querySelector(".en").textContent = m.en;
      b.querySelector(".bar span").style.width =
        (items.length ? done / items.length * 100 : 0) + "%";
      b.addEventListener("click", function () { openMonth(m.id); });
      box.appendChild(b);
    });
  }

  function openMonth(id) {
    cur = months.filter(function (m) { return m.id === id; })[0] || months[0];
    monthView.hidden = true; listView.hidden = false;
    location.hash = cur.id;
    document.getElementById("mTitle").textContent = cur.title;
    document.getElementById("mSub").textContent = cur.en;
    document.getElementById("q").value = ""; qstr = qkey = qskel = "";
    window.scrollTo(0, 0);
    render();
  }

  document.getElementById("back").addEventListener("click", showMonths);
  window.addEventListener("hashchange", function () {
    var h = location.hash.replace("#", "");
    if (!h && cur) showMonths();
  });

  // ---- render list ------------------------------------------------------
  function render() {
    if (!cur) return;
    listEl.innerHTML = "";
    var shown = 0;

    groupsOf(cur).forEach(function (g) {
      var lv = liveItems(g);
      if (!lv.length) return;
      var vis = lv.filter(function (i) {
        var d = !!state.done[i.id];
        if (filter === "todo" && d) return false;
        if (filter === "done" && !d) return false;
        return hit(i);
      });
      if (!vis.length) return;
      shown += vis.length;

      var h = document.createElement("div");
      h.className = "grp";
      h.innerHTML = '<h3></h3><small></small><span class="cnt"></span>';
      h.querySelector("h3").textContent = g.title;
      h.querySelector("small").textContent = g.en || "";
      h.querySelector(".cnt").textContent =
        lv.filter(function (i) { return state.done[i.id]; }).length + "/" + lv.length;
      listEl.appendChild(h);

      var ul = document.createElement("ul");
      vis.forEach(function (i) { ul.appendChild(row(i)); });
      listEl.appendChild(ul);
    });

    if (!shown) {
      var e = document.createElement("div");
      e.className = "empty";
      e.textContent = qstr ? "कुछ नहीं मिला · no match" : "खाली है · empty";
      listEl.appendChild(e);
    }
    stats();
  }

  function row(i) {
    var li = document.createElement("li");
    li.className = "row" + (state.done[i.id] ? " done" : "");
    li.dataset.id = i.id;

    var tick = document.createElement("button");
    tick.className = "tick"; tick.textContent = "✓";
    tick.setAttribute("aria-label", "tick");

    var body = document.createElement("div"); body.className = "body";
    var top = document.createElement("div"); top.className = "top";
    var tap = document.createElement("div"); tap.className = "tap";

    var nm = document.createElement("div"); nm.className = "nm"; nm.textContent = nameOf(i);
    tap.appendChild(nm);
    if (i.en) { var en = document.createElement("div"); en.className = "en"; en.textContent = i.en; tap.appendChild(en); }
    if (i.qty) { var qc = document.createElement("div"); qc.className = "qchip"; qc.textContent = i.qty; tap.appendChild(qc); }

    var ed = document.createElement("button"); ed.className = "mini"; ed.textContent = "✎";
    ed.setAttribute("aria-label", "rename");
    var dl = document.createElement("button"); dl.className = "mini"; dl.textContent = "🗑";
    dl.setAttribute("aria-label", "delete");

    top.appendChild(tap); top.appendChild(ed); top.appendChild(dl);
    body.appendChild(top);

    var ctl = document.createElement("div"); ctl.className = "ctl";
    var qf = document.createElement("div"); qf.className = "fld f-qty";
    qf.innerHTML = '<label>लिया</label>';
    var qi = document.createElement("input");
    qi.type = "text"; qi.placeholder = i.qty || "qty"; qi.value = qtyOf(i);
    qi.setAttribute("aria-label", "quantity taken");
    qf.appendChild(qi);

    var pf = document.createElement("div"); pf.className = "fld f-price";
    pf.innerHTML = '<label>₹</label>';
    var pi = document.createElement("input");
    pi.type = "text"; pi.inputMode = "decimal"; pi.placeholder = "0"; pi.value = priceVal(i);
    pi.setAttribute("aria-label", "price");
    pf.appendChild(pi);

    ctl.appendChild(qf); ctl.appendChild(pf);
    body.appendChild(ctl);
    li.appendChild(tick); li.appendChild(body);

    function toggle() {
      if (state.done[i.id]) delete state.done[i.id]; else state.done[i.id] = 1;
      save();
      li.classList.toggle("done", !!state.done[i.id]);
      stats();
      if (filter !== "all") render();
    }
    tick.addEventListener("click", toggle);
    tap.addEventListener("click", function () {
      if (!li.classList.contains("editing")) toggle();
    });

    qi.addEventListener("input", function () {
      if (qi.value === "") delete state.qty[i.id]; else state.qty[i.id] = qi.value;
      save();
    });
    pi.addEventListener("input", function () {
      var v = pi.value.replace(/[^0-9.]/g, "");
      if (v !== pi.value) pi.value = v;
      if (v === "") delete state.price[i.id]; else state.price[i.id] = v;
      save(); stats();
    });
    [qi, pi].forEach(function (el) {
      el.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter") return;
        ev.preventDefault(); el.blur();
        if (!state.done[i.id]) toggle();
      });
    });

    ed.addEventListener("click", function () {
      if (li.classList.contains("editing")) return;
      li.classList.add("editing");
      var inp = document.createElement("input");
      inp.type = "text"; inp.className = "rename"; inp.value = nameOf(i);
      nm.replaceWith(inp); inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      var closed = false;
      function fin(keep) {
        if (closed) return; closed = true;
        var v = inp.value.trim();
        if (keep && v) {
          state.name[i.id] = v;
          state.extra.forEach(function (e) { if (e.id === i.id) e.hi = v; });
          save();
        }
        nm.textContent = nameOf(i);
        inp.replaceWith(nm);
        li.classList.remove("editing");
      }
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") { ev.preventDefault(); fin(true); }
        if (ev.key === "Escape") fin(false);
      });
      inp.addEventListener("blur", function () { fin(true); });
    });

    dl.addEventListener("click", function () {
      if (!confirm('"' + nameOf(i) + '" हटाएँ? / Delete?')) return;
      state.removed[i.id] = 1;
      state.extra = state.extra.filter(function (e) { return e.id !== i.id; });
      save(); render();
    });

    return li;
  }

  // ---- stats ------------------------------------------------------------
  function totals(m) {
    var items = allOf(m);
    var done = items.filter(function (i) { return state.done[i.id]; });
    var spent = done.reduce(function (a, i) { return a + (priceOf(i) || 0); }, 0);
    return { items: items, total: items.length, done: done.length, spent: spent };
  }

  function stats() {
    if (!cur) return;
    var t = totals(cur);
    document.getElementById("sDone").textContent = t.done + "/" + t.total;
    document.getElementById("sLeft").textContent = t.total - t.done;
    document.getElementById("sSpent").textContent = "₹" + fmt(t.spent);
    document.getElementById("total").textContent = "₹" + fmt(t.spent);
    document.getElementById("bar").style.width =
      (t.total ? t.done / t.total * 100 : 0) + "%";
    var rc = Object.keys(state.removed).length;
    var rb = document.getElementById("mRestore");
    rb.querySelector("span").textContent = "Restore deleted (" + rc + ")";
    rb.disabled = !rc;
  }

  function fmt(n) {
    n = Math.round(n * 100) / 100;
    return n.toLocaleString("en-IN");
  }

  // ---- controls ---------------------------------------------------------
  document.querySelectorAll("#chips button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#chips button").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on"); filter = b.dataset.f; render();
    });
  });

  document.getElementById("q").addEventListener("input", function (e) {
    qstr = e.target.value.trim().toLowerCase();
    qkey = qstr ? Translit.key(qstr) : "";
    qskel = qstr ? Translit.skel(qstr) : "";
    render();
  });

  function sheet(id, v) { document.getElementById(id).classList.toggle("open", v); }
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      sheet("sheet", false); sheet("prsheet", false);
    });
  });
  document.getElementById("menu").addEventListener("click", function () { sheet("sheet", true); });

  document.getElementById("mAdd").addEventListener("click", function () {
    sheet("sheet", false);
    var n = prompt("नया आइटम / New item:");
    if (!n || !n.trim()) return;
    var q = prompt("कितना? / How much?", "") || "";
    state.extra.push({ id: "x-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
                       m: cur.id, hi: n.trim(), qty: q.trim() });
    save(); render();
  });

  document.getElementById("mRestore").addEventListener("click", function () {
    var n = Object.keys(state.removed).length;
    if (!n || !confirm("Restore " + n + " deleted item(s)?")) return;
    state.removed = {}; save(); render(); sheet("sheet", false);
  });

  // ---- print ------------------------------------------------------------
  var pr = { todo: true, done: false, price: false };
  try { Object.assign(pr, JSON.parse(localStorage.getItem("ration-print") || "{}")); } catch (e) {}

  function openPrint() {
    document.getElementById("o_todo").checked = pr.todo;
    document.getElementById("o_done").checked = pr.done;
    document.getElementById("o_price").checked = pr.price;
    sheet("sheet", false); sheet("prsheet", true);
  }
  document.getElementById("printBtn").addEventListener("click", openPrint);
  document.getElementById("mPrint").addEventListener("click", openPrint);

  ["todo", "done", "price"].forEach(function (k) {
    document.getElementById("o_" + k).addEventListener("change", function (e) {
      pr[k] = e.target.checked;
      try { localStorage.setItem("ration-print", JSON.stringify(pr)); } catch (x) {}
    });
  });

  document.getElementById("prGo").addEventListener("click", function () {
    if (!pr.todo && !pr.done) { alert("Pick at least one section."); return; }
    buildPrint(); sheet("prsheet", false);
    setTimeout(function () { window.print(); }, 150);
  });

  function buildPrint() {
    var todo = [], done = [];
    groupsOf(cur).forEach(function (g) {
      liveItems(g).forEach(function (i) {
        (state.done[i.id] ? done : todo).push({ g: g, i: i });
      });
    });
    var h = ['<h1>' + esc(cur.title) + '</h1>',
             '<p class="sub">' + new Date().toLocaleDateString("en-IN") + '</p>'];
    var first = true;
    if (pr.todo) {
      h.push('<h2>बाकी · Still to buy — ' + todo.length + '</h2>');
      h.push(tbl(todo, false, true)); first = false;
    }
    if (pr.done) {
      h.push('<h2' + (first ? '' : ' class="brk"') + '>लिया हुआ · Bought — ' + done.length + '</h2>');
      h.push(tbl(done, pr.price, false)); first = false;
    }
    document.getElementById("printArea").innerHTML = h.join("");
  }

  function tbl(rows, withPrice, box) {
    if (!rows.length) return '<p>—</p>';
    var h = ['<table><thead><tr><th>#</th><th>Item</th><th>Qty</th>'];
    if (withPrice) h.push('<th class="r">₹</th>');
    if (box) h.push('<th class="box">✓</th>');
    h.push('</tr></thead><tbody>');
    var sum = 0;
    rows.forEach(function (r, n) {
      var i = r.i, p = priceOf(i);
      if (p) sum += p;
      h.push('<tr><td>' + (n + 1) + '</td><td><b>' + esc(nameOf(i)) + '</b>' +
        (i.en ? '<br><span class="en2">' + esc(i.en) + '</span>' : '') + '</td>' +
        '<td>' + esc(qtyOf(i) || i.qty || "—") + '</td>');
      if (withPrice) h.push('<td class="r">' + (p != null ? "₹" + fmt(p) : "—") + '</td>');
      if (box) h.push('<td class="box"></td>');
      h.push('</tr>');
    });
    if (withPrice) {
      h.push('<tr class="tot2"><td colspan="3" class="r">Total</td><td class="r">₹' + fmt(sum) + '</td></tr>');
    }
    return h.join("") + '</tbody></table>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c];
    });
  }

  // ---- copy / export / import ------------------------------------------
  document.getElementById("mCopy").addEventListener("click", function () {
    var out = [cur.title, ""];
    groupsOf(cur).forEach(function (g) {
      var lv = liveItems(g); if (!lv.length) return;
      out.push("— " + g.title + " —");
      lv.forEach(function (i) {
        var p = priceOf(i);
        out.push((state.done[i.id] ? "[x] " : "[ ] ") + nameOf(i) +
          (qtyOf(i) || i.qty ? " — " + (qtyOf(i) || i.qty) : "") +
          (p != null ? "  ₹" + p : ""));
      });
      out.push("");
    });
    var t = totals(cur);
    out.push("Total ₹" + fmt(t.spent) + "  ·  " + t.done + "/" + t.total);
    var txt = out.join("\n");
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(
      function () { alert("📋 Copied"); }, function () { prompt("Copy:", txt); });
    else prompt("Copy:", txt);
    sheet("sheet", false);
  });

  document.getElementById("mExport").addEventListener("click", function () {
    var txt = JSON.stringify({ app: "ration", version: 1,
      exportedAt: new Date().toISOString(), data: state }, null, 2);
    try {
      var url = URL.createObjectURL(new Blob([txt], { type: "application/json" }));
      var a = document.createElement("a");
      a.href = url; a.download = "ration-backup.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    } catch (e) { prompt("Backup:", txt); }
    sheet("sheet", false);
  });

  var fin = document.getElementById("file");
  document.getElementById("mImport").addEventListener("click", function () {
    sheet("sheet", false); fin.value = ""; fin.click();
  });
  fin.addEventListener("change", function () {
    var f = fin.files && fin.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      var p; try { p = JSON.parse(String(r.result)); }
      catch (e) { alert("❌ Bad file"); return; }
      var d = sane(p && p.data ? p.data : p);
      if (!confirm("Merge this backup into your data?")) return;
      ["done","price","qty","name","removed","seeded"].forEach(function (k) {
        Object.keys(d[k]).forEach(function (id) { state[k][id] = d[k][id]; });
      });
      var have = {}; state.extra.forEach(function (e) { have[e.id] = 1; });
      d.extra.forEach(function (e) { if (!have[e.id]) state.extra.push(e); });
      save(); render(); alert("✅ Imported");
    };
    r.readAsText(f);
  });

  // ---- shared sync ------------------------------------------------------
  var pill = document.getElementById("syncPill");
  var online = false;

  function setPill(txt, cls) {
    pill.textContent = txt;
    pill.className = "pill" + (cls ? " " + cls : "");
  }

  function merge(remote) {
    // whole-document last-write-wins; the newer updatedAt wins
    if (!remote || typeof remote !== "object") return false;
    if ((Number(remote.updatedAt) || 0) <= (state.updatedAt || 0)) return false;
    var r = sane(remote);
    r.updatedAt = Number(remote.updatedAt) || Date.now();
    state = r; persist();
    return true;
  }

  function pull() {
    fetch(API, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (j) {
      online = true;
      setPill("सब डिवाइस पर सेव · synced", "on");
      if (merge(j && j.data)) { if (cur) render(); else showMonths(); }
    }).catch(function () {
      online = false;
      setPill("सिर्फ़ इस फ़ोन में · this device only", "off");
    });
  }

  function pushUp() {
    fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: state })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      online = true; setPill("सब डिवाइस पर सेव · synced", "on");
    }).catch(function () {
      online = false; setPill("सिर्फ़ इस फ़ोन में · this device only", "off");
    });
  }

  pull();
  setInterval(function () {
    if (!document.hidden) pull();
  }, 15000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) pull();
  });

  // ---- boot -------------------------------------------------------------
  var h0 = location.hash.replace("#", "");
  if (h0 && months.some(function (m) { return m.id === h0; })) openMonth(h0);
  else showMonths();
})();
