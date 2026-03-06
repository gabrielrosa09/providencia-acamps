// === DOAÇÕES — renderização ===

function rGB() {
  var t = apadrinhamentos.reduce(function (s, d) {
      return s + d.amount;
    }, 0),
    p = Math.min((t / metaArr) * 100, 100),
    c = p >= 100 ? "var(--success)" : "var(--accent)";
  $("gban").innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px"><div style="flex:1 1 180px"><h3 style="font-family:\'DM Serif Display\',serif;font-weight:400;font-size:17px;margin-bottom:3px">Meta de Arrecadação</h3><span style="color:var(--text2);font-size:12px">Apadrinhamento de jovens</span></div><div style="text-align:right"><div style="font-size:24px;font-weight:700;font-family:\'DM Serif Display\',serif;color:' +
    c +
    '">R$ ' +
    F(t) +
    '</div><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:2px"><span style="color:var(--text2);font-size:12px">de R$ ' +
    F(metaArr) +
    " (" +
    Math.round(p) +
    "%)</span><button style=\"background:rgba(255,255,255,.06);border:none;border-radius:6px;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2)\" onclick=\"om('edit-goal');$('gv').value=metaArr\">⚙</button></div></div></div>" +
    pb(t, metaArr, true) +
    (p >= 100
      ? '<div style="margin-top:12px;padding:7px 12px;background:var(--success-bg);border-radius:8px;color:var(--success);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px">✓ Meta atingida!</div>'
      : "");
}

function rST() {
  var l = [].concat(apadrinhamentos).reverse();
  $("scount").textContent = "Doações (" + apadrinhamentos.length + ")";
  var h =
      '<div class="t-hdr sponsor-cols"><span>Doador</span><span style="text-align:center">Valor</span><span style="text-align:center">Método</span><span>Jovem</span><span style="text-align:center">Ações</span></div>',
    c = "";
  if (!l.length) {
    h += '<div class="empty">Nenhuma doação</div>';
    c = h;
  }
  l.forEach(function (s) {
    var bc =
      s.method === "PIX"
        ? "background:rgba(232,148,58,.15);color:var(--accent)"
        : "background:rgba(255,255,255,.08);color:var(--text2)";
    h +=
      '<div class="t-row sponsor-cols"><div><span style="font-weight:600;font-size:14px">' +
      esc(s.name) +
      '</span><div style="color:var(--text2);font-size:11px;margin-top:1px">' +
      fmtD(s.date) +
      '</div></div><span style="text-align:center;font-weight:700;font-size:14px;color:var(--success)">R$ ' +
      F(s.amount) +
      '</span><div style="text-align:center"><span class="badge" style="' +
      bc +
      '">' +
      esc(s.method) +
      '</span></div><span style="font-size:13px;color:var(--text2)">' +
      esc(s.youth) +
      '</span><div style="display:flex;justify-content:center">' +
      ib("var(--danger-bg)", "var(--danger)", "dS(" + s.id + ")", "✕") +
      "</div></div>";
    c +=
      '<div class="sc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px"><div style="min-width:0;flex:1"><span style="font-weight:600;font-size:14px">' +
      esc(s.name) +
      '</span><div style="color:var(--text2);font-size:11px;margin-top:1px">' +
      fmtD(s.date) +
      '</div></div><span style="font-weight:700;font-size:15px;color:var(--success);white-space:nowrap">R$ ' +
      F(s.amount) +
      '</span></div><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="badge" style="' +
      bc +
      '">' +
      esc(s.method) +
      '</span><span style="font-size:12px;color:var(--text2)">' +
      esc(s.youth) +
      '</span></div><button class="ib" style="background:var(--danger-bg);color:var(--danger);flex-shrink:0" onclick="dS(' +
      s.id +
      ')">✕</button></div></div>';
  });
  $("stable").innerHTML = h;
  $("scards").innerHTML = c;
}

// === DOAÇÕES — submits ===

function sas(b) {
  var n = $("as-n").value.trim(),
    v = $("as-v").value,
    m = $("as-m").value,
    y = $("as-y").value.trim(),
    d = $("as-d").value;
  if (!n || !v) return alert("Preencha nome e valor.");
  setL(b, true);
  apiPost({ action: "addApadrinhamento", nome: n, valor: Number(v), metodo: m, jovem: y, data: d })
    .then(function (s) {
      apadrinhamentos.push(s);
      $("as-n").value = "";
      $("as-v").value = "";
      $("as-y").value = "";
      $("as-d").value = "";
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

function dS(id) {
  id = Number(id);
  if (!confirm("Remover esta doação?")) return;
  apiPost({ action: "deleteApadrinhamento", id: id })
    .then(function () {
      apadrinhamentos = apadrinhamentos.filter(function (s) {
        return Number(s.id) !== id;
      });
      R();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function sg(b) {
  var v = Number($("gv").value);
  if (!v || v <= 0) return alert("Valor inválido.");
  setL(b, true);
  apiPost({ action: "setMetaArrecadacao", valor: v })
    .then(function () {
      metaArr = v;
      cm();
      R();
      toast("Meta atualizada!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}
