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

// Botão de ícone inline (t: dica ao passar o mouse, opcional)
function ib(bg, c, fn, icon, t) {
  return (
    '<button class="ib"' +
    (t ? ' title="' + t + '" aria-label="' + t + '"' : "") +
    ' style="background:' +
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

// Caixa de confirmação no estilo do site (substitui o confirm() do navegador)
// confirmar({ titulo, msg (HTML), ok: "Texto do botão", tipo: "warning" | "danger", icone })
// Retorna Promise<boolean>: true se confirmou.
function confirmar(o) {
  var tipo = o.tipo || "danger",
    prev = document.activeElement;
  return new Promise(function (res) {
    var ov = document.createElement("div");
    ov.className = "mo open cf";
    ov.innerHTML =
      '<div class="md cf-box" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-m">' +
      '<div class="cf-ic cf-' + tipo + '" aria-hidden="true">' + (o.icone || "!") + "</div>" +
      '<h3 id="cf-t" class="cf-t">' + o.titulo + "</h3>" +
      '<div id="cf-m" class="cf-msg">' + (o.msg || "") + "</div>" +
      '<div class="cf-fa">' +
      '<button type="button" class="btn btn-secondary" data-r="0">' + (o.cancelar || "Cancelar") + "</button>" +
      '<button type="button" class="btn cf-ok cf-' + tipo + '" data-r="1">' + (o.ok || "Confirmar") + "</button>" +
      "</div></div>";
    document.body.appendChild(ov);

    function fim(v) {
      document.removeEventListener("keydown", kd, true);
      ov.remove();
      if (prev && prev.focus) prev.focus();
      res(v);
    }
    function kd(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        fim(false);
      }
    }
    ov.addEventListener("click", function (e) {
      if (e.target === ov) return fim(false);
      var b = e.target.closest("[data-r]");
      if (b) fim(b.dataset.r === "1");
    });
    document.addEventListener("keydown", kd, true);
    ov.querySelector(".cf-ok").focus();
  });
}
