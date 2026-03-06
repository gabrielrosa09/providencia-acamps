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
function sc(i, l, v, s, c) {
  return (
    '<div class="stat-card"><div class="stat-label">' +
    i +
    " " +
    l +
    '</div><div class="stat-value" style="color:' +
    (c || "var(--text)") +
    '">' +
    v +
    '</div><div class="stat-sub">' +
    s +
    "</div></div>"
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
