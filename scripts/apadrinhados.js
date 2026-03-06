// === APADRINHADOS — renderização ===

function rApad() {
  var c = comp(),
    vi = valorInsc,
    pt = participantes;
  var search = ($("psearch") ? $("psearch").value : "").toLowerCase();
  var filter = $("pfilter") ? $("pfilter").value : "all";
  var desistidos = pt.filter(function (p) {
    return p.status === "desistiu";
  }).length;

  var filtered = pt
    .filter(function (p) {
      return p.name.toLowerCase().includes(search);
    })
    .filter(function (p) {
      if (filter === "confirmado") return p.status === "confirmado";
      if (filter === "pendente") return p.status === "pendente";
      if (filter === "desistiu") return p.status === "desistiu";
      if (filter === "need") return p.status !== "desistiu" && p.canPay < vi;
      return true;
    })
    .sort(function (a, b) {
      if (a.status === "desistiu" && b.status !== "desistiu") return 1;
      if (a.status !== "desistiu" && b.status === "desistiu") return -1;
      return a.name.localeCompare(b.name);
    });

  // Banner
  var h =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px"><div><h3 style="font-family:\'DM Serif Display\',serif;font-weight:400;font-size:17px;margin-bottom:3px">👥 Gestão de Apadrinhados</h3><span style="color:var(--text2);font-size:12px">Inscrição: R$ ' +
    F(vi) +
    " por jovem <button onclick=\"om('edit-insc');$('iv').value=valorInsc\" style=\"background:rgba(255,255,255,.06);border:none;border-radius:4px;padding:2px 6px;color:var(--text2);cursor:pointer;font-size:11px\">✎ editar</button></span></div></div>";
  h += '<div class="sm" style="margin-top:0">';
  h +=
    '<div><div class="sl">💰 Total Disponível</div><div class="sv" style="color:var(--success)">R$ ' +
    F(c.totalSp + Math.max(c.bProfit, 0)) +
    '</div><div class="ss">Doações: R$ ' +
    F(c.totalSp) +
    (c.bProfit > 0 ? " + Brigadeiros: R$ " + F(c.bProfit) : "") +
    "</div></div>";
  h +=
    '<div><div class="sl">🎯 Total Necessário</div><div class="sv" style="color:var(--warning)">R$ ' +
    F(c.totalNeed) +
    '</div><div class="ss">' +
    c.partsNeed +
    " jovens precisam</div></div>";
  h +=
    '<div><div class="sl">' +
    (c.saldo >= 0 ? "✅" : "⚠️") +
    ' Saldo</div><div class="sv" style="color:' +
    (c.saldo >= 0 ? "var(--success)" : "var(--danger)") +
    '">R$ ' +
    F(c.saldo) +
    '</div><div class="ss">' +
    (c.saldo >= 0 ? "Doações cobrem" : "Faltam doações") +
    "</div></div>";
  h += "</div>";
  h += pb(c.totalSp + Math.max(c.bProfit, 0), c.totalNeed, true);
  h +=
    '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text2)"><span>' +
    c.actParts.length +
    " ativos · " +
    desistidos +
    " desistiram</span><span>" +
    c.partsFull +
    " integrais · " +
    c.partsNeed +
    " precisam apoio</span></div>";
  $("pban").innerHTML = h;

  // Tabela desktop
  var th =
    '<div class="t-hdr part-cols"><span>Participante</span><span style="text-align:center">Pode Pagar</span><span style="text-align:center">Precisa</span><span style="text-align:center">Status Inscrição</span><span style="text-align:center">Comprov.</span><span style="text-align:center">Ações</span></div>';
  if (!filtered.length)
    th += '<div class="empty">Nenhum participante encontrado</div>';
  filtered.forEach(function (p) {
    var need = Math.max(vi - p.canPay, 0),
      isDes = p.status === "desistiu";
    th += '<div class="t-row part-cols" style="opacity:' + (isDes ? 0.5 : 1) + '">';
    th +=
      '<div><span style="font-weight:600;font-size:14px">' +
      esc(p.name) +
      '</span><div style="font-size:11px;color:var(--text2);margin-top:1px">' +
      esc(fmtPhone(p.phone)) +
      "</div>" +
      (p.notes
        ? '<div style="font-size:10px;color:var(--text2);margin-top:2px;font-style:italic;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          esc(p.notes) +
          "</div>"
        : "") +
      "</div>";
    th +=
      '<span style="text-align:center;font-weight:600;font-size:14px;color:' +
      (p.canPay >= vi ? "var(--success)" : "var(--text)") +
      '">R$ ' +
      F(p.canPay) +
      "</span>";
    th +=
      '<span style="text-align:center;font-weight:600;font-size:14px;color:' +
      (need > 0 ? "var(--warning)" : "var(--success)") +
      '">' +
      (need > 0 ? "R$ " + F(need) : "—") +
      "</span>";
    th +=
      '<div style="text-align:center"><span class="badge" style="background:' +
      statusC[p.status] +
      "20;color:" +
      statusC[p.status] +
      '">' +
      statusL[p.status] +
      "</span></div>";
    th +=
      '<div style="text-align:center">' +
      (p.receiptUrl
        ? '<a href="' + esc(p.receiptUrl) + '" target="_blank" style="font-size:11px;font-weight:600">📎 Ver</a>'
        : '<span style="color:var(--text2);font-size:11px">—</span>') +
      "</div>";
    th +=
      '<div style="display:flex;gap:4px;justify-content:center">' +
      ib("rgba(255,255,255,.05)", "var(--text2)", "showPart(" + p.id + ")", "👁") +
      ib("rgba(255,255,255,.05)", "var(--text2)", "oEP(" + p.id + ")", "✎") +
      ib("var(--danger-bg)", "var(--danger)", "dP(" + p.id + ")", "✕") +
      "</div></div>";
  });
  $("ptable").innerHTML = th;

  // Cards mobile
  var mc = "";
  if (!filtered.length) mc = '<div class="empty">Nenhum participante</div>';
  filtered.forEach(function (p) {
    var need = Math.max(vi - p.canPay, 0);
    mc += '<div class="pc" style="opacity:' + (p.status === "desistiu" ? 0.5 : 1) + '">';
    mc +=
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px"><div style="flex:1;min-width:0"><span style="font-weight:600;font-size:15px">' +
      esc(p.name) +
      '</span><div style="font-size:11px;color:var(--text2);margin-top:1px">' +
      esc(fmtPhone(p.phone)) +
      '</div></div><span class="badge" style="background:' +
      statusC[p.status] +
      "20;color:" +
      statusC[p.status] +
      ';flex-shrink:0">' +
      statusL[p.status] +
      "</span></div>";
    mc +=
      '<div style="display:flex;gap:16px;margin-bottom:8px;font-size:13px"><div><span style="color:var(--text2);font-size:11px">Pode pagar</span><div style="font-weight:600;color:' +
      (p.canPay >= vi ? "var(--success)" : "var(--text)") +
      '">R$ ' +
      F(p.canPay) +
      '</div></div><div><span style="color:var(--text2);font-size:11px">Precisa</span><div style="font-weight:600;color:' +
      (need > 0 ? "var(--warning)" : "var(--ok)") +
      '">' +
      (need > 0 ? "R$ " + F(need) : "—") +
      "</div></div>" +
      (p.receiptUrl
        ? '<div><span style="color:var(--text2);font-size:11px">Comprov.</span><div style="color:var(--purple);font-weight:600;font-size:12px">✓ Enviado</div></div>'
        : "") +
      "</div>";
    if (p.notes)
      mc +=
        '<div style="font-size:11px;color:var(--text2);font-style:italic;margin-bottom:8px">' +
        esc(p.notes) +
        "</div>";
    mc +=
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="showPart(' +
      p.id +
      ')">👁 Detalhes</button><button class="btn btn-ghost btn-sm" onclick="oEP(' +
      p.id +
      ')">✎ Editar</button><button class="btn btn-danger btn-sm" onclick="dP(' +
      p.id +
      ')">✕</button></div></div>';
  });
  $("pcards").innerHTML = mc;
}

// === APADRINHADOS — modais ===

function oEP(id) {
  var p = fP(id);
  if (!p) return;
  $("ep-id").value = p.id;
  $("ep-n").value = p.name;
  $("ep-p").value = p.phone;
  $("ep-c").value = p.canPay;
  $("ep-s").value = p.status;
  $("ep-d").value = p.date || "";
  $("ep-o").value = p.notes || "";
  $("ep-r").value = p.receiptUrl || "";
  om("edit-part");
}

function showPart(id) {
  var p = fP(id);
  if (!p) return;
  var need = Math.max(valorInsc - p.canPay, 0);
  $("pd-title").textContent = p.name;
  var h = '<div class="pdg">';
  [
    { l: "Telefone", v: fmtPhone(p.phone) || "—" },
    { l: "Status da Inscrição", v: statusL[p.status] || p.status },
    { l: "Pode pagar", v: "R$ " + F(p.canPay) },
    { l: "Precisa", v: need > 0 ? "R$ " + F(need) : "Não precisa" },
    { l: "Inscrição", v: fmtD(p.date) || "—" },
    { l: "Valor inscrição", v: "R$ " + F(valorInsc) },
  ].forEach(function (i) {
    h +=
      '<div class="pdi"><div class="pl">' +
      i.l +
      '</div><div class="pv">' +
      esc(i.v) +
      "</div></div>";
  });
  h += "</div>";
  if (p.notes)
    h +=
      '<div class="ib2"><div style="font-size:11px;color:var(--text2);margin-bottom:4px">Observações</div><div style="font-size:14px">' +
      esc(p.notes) +
      "</div></div>";
  h += '<div class="ib2"><div style="font-size:11px;color:var(--text2);margin-bottom:8px">Comprovante de pagamento</div>';
  if (p.receiptUrl) {
    h +=
      '<a href="' +
      esc(p.receiptUrl) +
      '" target="_blank" rel="noopener" style="font-weight:600;font-size:14px">📎 Ver comprovante</a>';
    if (p.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)/i))
      h +=
        '<div style="margin-top:10px;border-radius:10px;overflow:hidden;border:1px solid var(--border)"><img src="' +
        esc(p.receiptUrl) +
        '" style="width:100%;max-height:300px;object-fit:contain;background:#111"></div>';
  } else {
    h += '<span style="color:var(--text2);font-size:13px">Nenhum comprovante</span>';
  }
  h += "</div>";
  h +=
    '<div class="fa"><button class="btn btn-ghost" onclick="cm();oEP(' +
    p.id +
    ')">✎ Editar</button><button class="btn btn-secondary" onclick="cm()">Fechar</button></div>';
  $("pd-content").innerHTML = h;
  om("part-detail");
}

// === APADRINHADOS — submits ===

function subAddPart(b) {
  var n = $("ap-n").value.trim();
  if (!n) return alert("Preencha o nome.");
  setL(b, true);
  apiPost({
    action: "addParticipante",
    name: n,
    phone: $("ap-p").value.trim(),
    canPay: Number($("ap-c").value) || 0,
    status: $("ap-s").value,
    notes: $("ap-o").value.trim(),
    receiptUrl: $("ap-r").value.trim(),
    date: $("ap-d").value,
  })
    .then(function (p) {
      participantes.push(p);
      $("ap-n").value = "";
      $("ap-p").value = "";
      $("ap-c").value = "";
      $("ap-o").value = "";
      $("ap-r").value = "";
      $("ap-d").value = "";
      cm();
      R();
      toast("Cadastrado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function subEditPart(b) {
  var id = Number($("ep-id").value);
  setL(b, true);
  var body = {
    action: "updateParticipante",
    id: id,
    name: $("ep-n").value.trim(),
    phone: $("ep-p").value.trim(),
    canPay: Number($("ep-c").value) || 0,
    status: $("ep-s").value,
    notes: $("ep-o").value.trim(),
    receiptUrl: $("ep-r").value.trim(),
    date: $("ep-d").value,
  };
  apiPost(body)
    .then(function () {
      var p = fP(id);
      if (p) {
        p.name = body.name;
        p.phone = body.phone;
        p.canPay = body.canPay;
        p.status = body.status;
        p.notes = body.notes;
        p.receiptUrl = body.receiptUrl;
        p.date = body.date;
      }
      cm();
      R();
      toast("Atualizado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function dP(id) {
  id = Number(id);
  var p = fP(id);
  if (!p || !confirm('Remover "' + p.name + '"?')) return;
  apiPost({ action: "deleteParticipante", id: id })
    .then(function (res) {
      if (res.error) {
        toast("Erro: " + res.error, false);
        return;
      }
      return apiGet("carregarTudo");
    })
    .then(function (d) {
      if (!d) return;
      participantes = d.participantes || [];
      apadrinhamentos = d.apadrinhamentos || [];
      R();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function subInsc(b) {
  var v = Number($("iv").value);
  if (!v || v <= 0) return alert("Valor inválido.");
  setL(b, true);
  apiPost({ action: "setValorInscricao", valor: v })
    .then(function () {
      valorInsc = v;
      cm();
      R();
      toast("Valor atualizado!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}
