// === DASHBOARD ===

function rDash() {
  var c = comp(),
    t = alimentos.length,
    dn = c.fDone;
  var spPct = Math.min((c.totalSp / metaArr) * 100, 100);
  var st = bst();

  // Cards de estatísticas
  $("ds").innerHTML =
    sc("📦", "Alimentos", dn + "/" + t, Math.round(t > 0 ? (dn / t) * 100 : 0) + "% das metas", "var(--accent-light)") +
    sc("💰", "Doações", "R$ " + F(c.totalSp), Math.round(spPct) + "% da meta", "var(--success)") +
    sc("👥", "Apadrinhados", c.actParts.length + " jovens", c.partsNeed + " precisam apoio", "var(--purple)") +
    sc("🏆", "Total Arrecadado", "R$ " + F(c.grand), "Doações + Brigadeiros", "var(--success)");

  // Progresso dos alimentos (lista descritiva)
  var bh = "";
  if (!alimentos.length) {
    bh = '<div style="padding:20px;text-align:center;color:var(--text2);font-size:13px">Nenhum alimento cadastrado.</div>';
  }
  alimentos
    .slice()
    .sort(function (a, b) {
      var pa = a.goal > 0 ? a.received / a.goal : 0;
      var pb = b.goal > 0 ? b.received / b.goal : 0;
      return pb - pa;
    })
    .forEach(function (f) {
      var pct = f.goal > 0 ? Math.min((f.received / f.goal) * 100, 100) : 0;
      var done = f.received >= f.goal;
      var pctColor = done ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--text2)";
      var rm = Math.max(f.goal - f.received, 0);
      var statusText = done ? "✓ Meta batida!" : "Faltam " + rm + " " + f.unit;
      var statusColor = done ? "var(--success)" : "var(--text2)";
      bh +=
        '<div style="margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;gap:8px">' +
        '<span style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + "</span>" +
        '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0">' +
        '<span style="font-size:12px;color:var(--text2)">' + f.received + "/" + f.goal + " " + f.unit + "</span>" +
        '<span style="font-size:12px;font-weight:700;color:' + pctColor + ';min-width:34px;text-align:right">' + Math.round(pct) + "%</span>" +
        "</div></div>" +
        pb(f.received, f.goal) +
        '<div style="font-size:11px;color:' + statusColor + ';margin-top:4px">' + statusText + "</div>" +
        "</div>";
    });
  $("bar").innerHTML = bh;

  // Arrecadação financeira
  var fh = "";
  [
    { l: "Apadrinhamento", v: c.totalSp, m: metaArr, c: "var(--success)" },
    { l: "Brigadeiros (líquido)", v: Math.max(st.pr, 0), m: metaBrig, c: "var(--choco-text)" },
  ].forEach(function (i) {
    var pp = i.m > 0 ? Math.round((i.v / i.m) * 100) : 0;
    fh +=
      '<div style="background:var(--input-bg);border-radius:10px;padding:14px;border:1px solid var(--border);margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-weight:600;font-size:13px">' +
      i.l +
      '</span><span style="font-size:13px;font-weight:700;color:' +
      i.c +
      '">R$ ' +
      F(i.v) +
      "</span></div>" +
      pb(i.v, i.m) +
      '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text2)"><span>Meta: R$ ' +
      F(i.m) +
      "</span><span>" +
      Math.min(pp, 100) +
      "%</span></div></div>";
  });
  fh +=
    '<div style="background:var(--input-bg);border-radius:10px;padding:14px;border:1px solid rgba(76,175,80,.2);border-left:3px solid var(--success)"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:14px">Total Arrecadado</span><span style="font-size:22px;font-weight:700;color:var(--success);font-family:\'DM Serif Display\',serif">R$ ' +
    F(c.grand) +
    "</span></div></div>";
  $("fin").innerHTML = fh;

  // Itens que precisam de atenção
  var pf = alimentos
    .filter(function (f) {
      return f.received < f.goal;
    })
    .sort(function (a, b) {
      return a.received / a.goal - b.received / b.goal;
    });
  if (!pf.length) {
    $("att").innerHTML =
      '<div style="padding:16px;text-align:center;color:var(--success)">🎉 Todas as metas foram batidas!</div>';
    return;
  }
  var ah = '<div class="ag">';
  pf.forEach(function (f) {
    var pp = f.goal > 0 ? Math.round((f.received / f.goal) * 100) : 0,
      bc = pp < 50 ? "rgba(239,83,80,.2)" : "rgba(255,152,0,.2)",
      tc = pp < 50 ? "var(--danger)" : "var(--warning)";
    ah +=
      '<div style="background:var(--input-bg);border-radius:10px;padding:12px;border:1px solid ' +
      bc +
      '"><div style="display:flex;justify-content:space-between;margin-bottom:8px;gap:8px"><span style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
      esc(f.name) +
      '</span><span style="font-size:12px;font-weight:600;color:' +
      tc +
      ';flex-shrink:0">' +
      pp +
      "%</span></div>" +
      pb(f.received, f.goal) +
      '<div style="margin-top:6px;font-size:11px;color:var(--text2)">Faltam <span style="color:var(--text);font-weight:600">' +
      (f.goal - f.received) +
      " " +
      f.unit +
      "</span></div></div>";
  });
  ah += "</div>";
  $("att").innerHTML = ah;
}
