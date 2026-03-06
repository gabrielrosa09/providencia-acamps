// === ALIMENTOS — renderização ===

function rFS() {
  var t = alimentos.length,
    d = alimentos.filter(function (f) {
      return f.received >= f.goal;
    }).length,
    p = t - d;
  $("fs").innerHTML =
    sc("📦", "Total", t, d + " completos") +
    sc(
      "✅",
      "Metas Batidas",
      (t > 0 ? Math.round((d / t) * 100) : 0) + "%",
      d + " de " + t,
      "var(--success)",
    ) +
    sc(
      "⚠️",
      "Pendentes",
      p,
      p === 0 ? "Tudo completo!" : "Precisam de doações",
      p > 0 ? "var(--warning)" : "var(--success)",
    );
}

function gff() {
  var s = ($("fsearch").value || "").toLowerCase(),
    f = $("ffilter").value;
  return alimentos
    .filter(function (x) {
      return x.name.toLowerCase().includes(s);
    })
    .filter(function (x) {
      if (f === "done") return x.received >= x.goal;
      if (f === "pending") return x.received < x.goal;
      return true;
    })
    .sort(function (a, b) {
      if (a.received >= a.goal && b.received < b.goal) return 1;
      if (a.received < a.goal && b.received >= b.goal) return -1;
      return (
        (a.goal > 0 ? a.received / a.goal : 0) -
        (b.goal > 0 ? b.received / b.goal : 0)
      );
    });
}

function ff() {
  rFT();
}

function rFT() {
  var foods = gff(),
    h =
      '<div class="t-hdr food-cols"><span>Alimento</span><span style="text-align:center">Recebido</span><span style="text-align:center">Meta</span><span>Progresso</span><span style="text-align:center">Ações</span></div>',
    c = "";
  if (!foods.length) {
    h += '<div class="empty">Nenhum alimento encontrado</div>';
    c = h;
  }
  foods.forEach(function (f) {
    var dn = f.received >= f.goal,
      rm = Math.max(f.goal - f.received, 0),
      pct = f.goal > 0 ? (f.received / f.goal) * 100 : 0;
    var dc = dn ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--accent)";
    var st = dn ? "✓ Meta batida!" : "Faltam " + rm + " " + f.unit;
    var stc = dn ? "var(--success)" : "var(--text2)";
    h +=
      '<div class="t-row food-cols"><div style="display:flex;align-items:center;gap:10px"><div class="dot" style="background:' +
      dc +
      '"></div><div><span style="font-weight:600;font-size:14px">' +
      esc(f.name) +
      '</span><div style="font-size:11px;color:' +
      stc +
      ';margin-top:2px">' +
      st +
      '</div></div></div><span style="text-align:center;font-weight:600;color:' +
      (dn ? "var(--success)" : "var(--text)") +
      '">' +
      f.received +
      " " +
      f.unit +
      '</span><span style="text-align:center;font-size:13px;color:var(--text2)">' +
      f.goal +
      " " +
      f.unit +
      "</span>" +
      pb(f.received, f.goal) +
      '<div style="display:flex;gap:4px;justify-content:center">' +
      ib("var(--success-bg)", "var(--success)", "oD(" + f.id + ")", "＋") +
      ib("rgba(255,255,255,.05)", "var(--text2)", "oH(" + f.id + ")", "⏱") +
      ib("rgba(255,255,255,.05)", "var(--text2)", "oEF(" + f.id + ")", "✎") +
      ib("var(--danger-bg)", "var(--danger)", "dF(" + f.id + ")", "✕") +
      "</div></div>";
    c +=
      '<div class="fc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:12px"><div style="flex:1"><div style="display:flex;align-items:center;gap:8px"><div class="dot" style="background:' +
      dc +
      '"></div><span style="font-weight:600;font-size:15px">' +
      esc(f.name) +
      '</span></div><span style="font-size:12px;color:' +
      stc +
      ';margin-left:16px">' +
      st +
      '</span></div><span style="font-size:14px;font-weight:600;color:' +
      (dn ? "var(--success)" : "var(--text)") +
      ';white-space:nowrap">' +
      f.received +
      "/" +
      f.goal +
      " " +
      f.unit +
      "</span></div>" +
      pb(f.received, f.goal) +
      '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-success btn-sm" onclick="oD(' +
      f.id +
      ')">+ Doar</button><button class="btn btn-ghost btn-sm" onclick="oH(' +
      f.id +
      ')">⏱ Histórico</button><button class="btn btn-ghost btn-sm" onclick="oEF(' +
      f.id +
      ')">✎ Editar</button><button class="btn btn-danger btn-sm" onclick="dF(' +
      f.id +
      ')">✕</button></div></div>';
  });
  $("ftable").innerHTML = h;
  $("fcards").innerHTML = c;
}

// === ALIMENTOS — modais ===

function oEF(id) {
  var f = fF(id);
  if (!f) return;
  $("ef-id").value = f.id;
  $("ef-n").value = f.name;
  $("ef-u").value = f.unit;
  $("ef-g").value = f.goal;
  om("edit-food");
}

function oD(id) {
  var f = fF(id);
  if (!f) return;
  $("d-id").value = f.id;
  $("dt").textContent = "Registrar Doação — " + f.name;
  $("dl").textContent = "Quantidade (" + f.unit + ")";
  $("di").innerHTML =
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text2);font-size:13px">Atual</span><span style="font-weight:600">' +
    f.received +
    " / " +
    f.goal +
    " " +
    f.unit +
    "</span></div>" +
    pb(f.received, f.goal, true);
  $("d-a").value = "";
  $("d-d").value = "";
  om("donate");
}

function oH(id) {
  var f = fF(id);
  if (!f) return;
  $("ht").textContent = "Histórico — " + f.name;
  $("hc").innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  om("history");
  apiGet("getHistorico", { id: id })
    .then(function (hist) {
      if (!hist || !hist.length) {
        $("hc").innerHTML = '<div class="empty">Nenhuma doação registrada.</div>';
        return;
      }
      var h = '<div style="max-height:320px;overflow-y:auto">';
      []
        .concat(hist)
        .reverse()
        .forEach(function (x) {
          h +=
            '<div class="hi"><div style="min-width:0;flex:1"><span style="font-weight:600;font-size:14px">' +
            esc(x.donor) +
            '</span><div style="color:var(--text2);font-size:11px;margin-top:2px">' +
            fmtD(x.date) +
            '</div></div><span class="hb">+' +
            x.amount +
            " " +
            f.unit +
            "</span></div>";
        });
      var total = hist.reduce(function (s, x) {
        return s + x.amount;
      }, 0);
      h +=
        '</div><div style="margin-top:12px;padding:10px 14px;background:var(--input-bg);border-radius:8px;display:flex;justify-content:space-between;font-size:13px"><span style="color:var(--text2)">Total:</span><span style="font-weight:700">' +
        total +
        " " +
        f.unit +
        "</span></div>";
      $("hc").innerHTML = h;
    })
    .catch(function (e) {
      $("hc").innerHTML =
        '<div class="empty" style="color:var(--danger)">Erro: ' +
        e.message +
        "</div>";
    });
}

// === ALIMENTOS — submits ===

function saf(b) {
  var n = $("af-n").value.trim(),
    u = $("af-u").value,
    g = $("af-g").value;
  if (!n || !g) return alert("Preencha nome e meta.");
  setL(b, true);
  apiPost({ action: "addAlimento", nome: n, unidade: u, meta: Number(g) })
    .then(function (f) {
      alimentos.push(f);
      $("af-n").value = "";
      $("af-g").value = "";
      cm();
      R();
      toast("Alimento adicionado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function sef(b) {
  var id = Number($("ef-id").value),
    n = $("ef-n").value.trim(),
    u = $("ef-u").value,
    g = $("ef-g").value;
  if (!n || !g) return alert("Preencha tudo.");
  setL(b, true);
  apiPost({ action: "updateAlimento", id: id, nome: n, unidade: u, meta: Number(g) })
    .then(function () {
      var f = fF(id);
      if (f) {
        f.name = n;
        f.unit = u;
        f.goal = Number(g);
      }
      cm();
      R();
      toast("Alimento atualizado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function sd(b) {
  var id = Number($("d-id").value),
    a = Number($("d-a").value),
    d = $("d-d").value.trim();
  if (!a || a <= 0) return alert("Quantidade inválida.");
  setL(b, true);
  apiPost({ action: "registrarDoacao", alimentoId: id, quantidade: a, doador: d })
    .then(function (r) {
      var f = fF(id);
      if (f) f.received = r.newReceived;
      cm();
      R();
      toast("Doação registrada!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function dF(id) {
  id = Number(id);
  var f = fF(id);
  if (!f || !confirm('Remover "' + f.name + '"?')) return;
  apiPost({ action: "deleteAlimento", id: id })
    .then(function () {
      alimentos = alimentos.filter(function (x) {
        return Number(x.id) !== id;
      });
      R();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}
