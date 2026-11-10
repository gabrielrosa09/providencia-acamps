// Barra de progresso HTML
function pb(v, m, lg) {
  var p = m > 0 ? Math.min((v / m) * 100, 100) : 0,
    dn = v >= m;
  var c = dn
    ? "var(--success)"
    : p >= 70
      ? "var(--warning)"
      : "var(--accent)";
  return (
    '<div class="pw' +
    (lg ? " lg" : "") +
    '"><div class="pb" style="width:' +
    p +
    "%;background:" +
    c +
    '"></div></div>'
  );
}

// Card de estatística
// i: ícone, l: título, v: valor, s: legenda, c: cor (opcional), pct: 0-100 mostra barrinha (opcional)
function sc(i, l, v, s, c, pct) {
  var cor = c || "var(--accent-light)";
  return (
    '<div class="stat-card" style="--c:' + cor + '">' +
    '<div class="stat-top"><span class="stat-ic" aria-hidden="true">' + i + '</span><span class="stat-label">' + l + "</span></div>" +
    '<div class="stat-value"' + (c ? "" : ' style="color:var(--text)"') + ">" + v + "</div>" +
    '<div class="stat-sub">' + s + "</div>" +
    (pct === undefined || pct === null
      ? ""
      : '<div class="stat-bar"><i style="width:' + Math.max(0, Math.min(pct, 100)) + '%"></i></div>') +
    "</div>"
  );
}

// Botão de ícone inline
function ib(bg, c, fn, icon) {
  return (
    '<button class="ib" style="background:' +
    bg +
    ";color:" +
    c +
    '" onclick="' +
    fn +
    '">' +
    icon +
    "</button>"
  );
}
