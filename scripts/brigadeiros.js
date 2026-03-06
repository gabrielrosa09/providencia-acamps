// === BRIGADEIROS — computados ===

function bst() {
  var rv = brigVendas.reduce(function (s, v) {
      return s + v.qty * v.unitPrice;
    }, 0),
    co = brigCustos.reduce(function (s, c) {
      return s + c.amount;
    }, 0),
    qt = brigVendas.reduce(function (s, v) {
      return s + v.qty;
    }, 0);
  return { rv: rv, co: co, pr: rv - co, qt: qt };
}

// === BRIGADEIROS — renderização ===

function rBB() {
  var st = bst(),
    p = metaBrig > 0 ? Math.min((st.pr / metaBrig) * 100, 100) : 0,
    c = p >= 100 ? "var(--success)" : "var(--choco-text)";
  $("bban").innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:14px"><div style="flex:1 1 180px"><h3 style="font-family:\'DM Serif Display\',serif;font-weight:400;font-size:17px;margin-bottom:3px">🍫 Venda de Brigadeiros</h3><span style="color:var(--text2);font-size:12px">Lucro líquido = Vendas − Custos</span></div><div style="text-align:right"><div style="font-size:24px;font-weight:700;font-family:\'DM Serif Display\',serif;color:' +
    c +
    '">R$ ' +
    F(st.pr) +
    '</div><div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:2px"><span style="color:var(--text2);font-size:12px">de R$ ' +
    F(metaBrig) +
    " (" +
    Math.round(Math.max(p, 0)) +
    "%)</span><button style=\"background:rgba(255,255,255,.06);border:none;border-radius:6px;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2)\" onclick=\"om('edit-brig-goal');$('bgv').value=metaBrig\">⚙</button></div></div></div>" +
    pb(Math.max(st.pr, 0), metaBrig, true) +
    '<div class="sm"><div><div class="sl">Vendas</div><div class="sv" style="color:var(--success)">R$ ' +
    F(st.rv) +
    '</div><div class="ss">' +
    st.qt +
    ' un vendidos</div></div><div><div class="sl">Custos Material</div><div class="sv" style="color:var(--danger)">R$ ' +
    F(st.co) +
    '</div><div class="ss">' +
    brigCustos.length +
    ' lançamentos</div></div><div><div class="sl">Lucro Líquido</div><div class="sv" style="color:' +
    (st.pr >= 0 ? "var(--success)" : "var(--danger)") +
    '">R$ ' +
    F(st.pr) +
    '</div><div class="ss">' +
    (st.pr >= 0 ? "Valor real de doação" : "Prejuízo") +
    "</div></div></div>" +
    (p >= 100
      ? '<div style="margin-top:14px;padding:7px 12px;background:var(--success-bg);border-radius:8px;color:var(--success);font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px">✓ Meta atingida!</div>'
      : "");
}

function bv(v) {
  curBV = v;
  $("bt-sales").className = "tbb" + (v === "sales" ? " active" : "");
  $("bt-costs").className = "tbb" + (v === "costs" ? " active" : "");
  $("badd").textContent = v === "sales" ? "+ Lançar Venda" : "+ Lançar Custo";
  $("badd").onclick = function () {
    om(v === "sales" ? "add-brig-sale" : "add-brig-cost");
  };
  rBC();
}

function rBC() {
  var el = $("bcont");
  if (curBV === "sales") {
    var l = [].concat(brigVendas).reverse(),
      h =
        '<div class="table"><div class="t-hdr bs-cols"><span>Data</span><span style="text-align:center">Qtd</span><span style="text-align:center">Preço/Un</span><span style="text-align:center">Total</span><span>Descrição</span><span style="text-align:center">Ações</span></div>',
      c = "";
    if (!l.length) {
      h += '<div class="empty">Nenhuma venda</div>';
      c = '<div class="empty">Nenhuma venda</div>';
    }
    l.forEach(function (s) {
      var t = s.qty * s.unitPrice;
      h +=
        '<div class="t-row bs-cols"><span style="font-weight:500">' +
        fmtD(s.date) +
        '</span><span style="text-align:center;font-weight:600">' +
        s.qty +
        ' un</span><span style="text-align:center;color:var(--text2);font-size:13px">R$ ' +
        F(s.unitPrice) +
        '</span><span style="text-align:center;font-weight:700;color:var(--success)">R$ ' +
        F(t) +
        '</span><span style="font-size:12px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
        esc(s.description) +
        '</span><div style="display:flex;justify-content:center">' +
        ib("var(--danger-bg)", "var(--danger)", "dBS(" + s.id + ")", "✕") +
        "</div></div>";
      c +=
        '<div class="bc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:8px"><div><span style="font-weight:600;font-size:14px">' +
        fmtD(s.date) +
        "</span>" +
        (s.description
          ? '<div style="color:var(--text2);font-size:11px;margin-top:1px">' + esc(s.description) + "</div>"
          : "") +
        '</div><span style="font-weight:700;font-size:15px;color:var(--success);white-space:nowrap">R$ ' +
        F(t) +
        '</span></div><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:10px;font-size:12px;color:var(--text2)"><span>' +
        s.qty +
        " un</span><span>×</span><span>R$ " +
        F(s.unitPrice) +
        '</span></div><button class="ib" style="background:var(--danger-bg);color:var(--danger)" onclick="dBS(' +
        s.id +
        ')">✕</button></div></div>';
    });
    h += "</div>";
    el.innerHTML = '<div class="dt">' + h + '</div><div class="cl">' + c + "</div>";
  } else {
    var l = [].concat(brigCustos).reverse(),
      h =
        '<div class="table"><div class="t-hdr bc-cols"><span>Data</span><span>Descrição</span><span style="text-align:center">Valor</span><span style="text-align:center">Ações</span></div>',
      c = "";
    if (!l.length) {
      h += '<div class="empty">Nenhum custo</div>';
      c = '<div class="empty">Nenhum custo</div>';
    }
    l.forEach(function (x) {
      h +=
        '<div class="t-row bc-cols"><span style="font-weight:500">' +
        fmtD(x.date) +
        '</span><span style="font-size:13px;color:var(--text2)">' +
        esc(x.description) +
        '</span><span style="text-align:center;font-weight:700;color:var(--danger)">- R$ ' +
        F(x.amount) +
        '</span><div style="display:flex;justify-content:center">' +
        ib("var(--danger-bg)", "var(--danger)", "dBC(" + x.id + ")", "✕") +
        "</div></div>";
      c +=
        '<div class="bc"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div style="flex:1;min-width:0"><span style="font-weight:600;font-size:14px">' +
        fmtD(x.date) +
        '</span><div style="color:var(--text2);font-size:12px;margin-top:2px">' +
        esc(x.description) +
        '</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-weight:700;font-size:15px;color:var(--danger);white-space:nowrap">- R$ ' +
        F(x.amount) +
        '</span><button class="ib" style="background:var(--danger-bg);color:var(--danger);flex-shrink:0" onclick="dBC(' +
        x.id +
        ')">✕</button></div></div></div>';
    });
    var tot = brigCustos.reduce(function (s, x) {
      return s + x.amount;
    }, 0);
    h +=
      '<div class="tr"><span style="color:var(--text2);font-weight:500">Total custos</span><span style="font-weight:700;color:var(--danger)">R$ ' +
      F(tot) +
      "</span></div></div>";
    el.innerHTML = '<div class="dt">' + h + '</div><div class="cl">' + c + "</div>";
  }
}

function ubp() {
  var q = Number($("bs-q").value),
    p = Number($("bs-p").value),
    el = $("bs-pv");
  if (q && p) {
    el.style.display = "flex";
    $("bs-t").textContent = "R$ " + F(q * p);
  } else {
    el.style.display = "none";
  }
}

// === BRIGADEIROS — submits ===

function sbs(b) {
  var d = $("bs-d").value,
    q = Number($("bs-q").value),
    p = Number($("bs-p").value),
    ds = $("bs-ds").value.trim();
  if (!q || !p) return alert("Preencha qtd e preço.");
  setL(b, true);
  apiPost({ action: "addBrigVenda", data: d, qty: q, precoUnitario: p, descricao: ds })
    .then(function (s) {
      brigVendas.push(s);
      $("bs-q").value = "";
      $("bs-ds").value = "";
      $("bs-d").value = "";
      cm();
      R();
      toast("Venda lançada!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function sbc(b) {
  var d = $("bc-d").value,
    v = Number($("bc-v").value),
    ds = $("bc-ds").value.trim();
  if (!v) return alert("Preencha o valor.");
  setL(b, true);
  apiPost({ action: "addBrigCusto", data: d, valor: v, descricao: ds })
    .then(function (c) {
      brigCustos.push(c);
      $("bc-v").value = "";
      $("bc-ds").value = "";
      $("bc-d").value = "";
      cm();
      R();
      toast("Custo lançado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function dBS(id) {
  id = Number(id);
  if (!confirm("Remover esta venda?")) return;
  apiPost({ action: "deleteBrigVenda", id: id })
    .then(function () {
      brigVendas = brigVendas.filter(function (x) {
        return Number(x.id) !== id;
      });
      R();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function dBC(id) {
  id = Number(id);
  if (!confirm("Remover este custo?")) return;
  apiPost({ action: "deleteBrigCusto", id: id })
    .then(function () {
      brigCustos = brigCustos.filter(function (x) {
        return Number(x.id) !== id;
      });
      R();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function sbg(b) {
  var v = Number($("bgv").value);
  if (!v || v <= 0) return alert("Valor inválido.");
  setL(b, true);
  apiPost({ action: "setMetaBrigadeiros", valor: v })
    .then(function () {
      metaBrig = v;
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
