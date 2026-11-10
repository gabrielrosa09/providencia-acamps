// === DROPDOWN PADRÃO ===
// Transforma todo <select> do site num dropdown com o visual do app.
// O <select> original continua na página (escondido) e é a fonte do valor:
// o resto do código segue usando $("id").value normalmente.
// Se mudar o valor por código fora de um modal, chame csRefreshAll().

var CS_CHEV =
  '<svg class="cs-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';
var CS_CHECK =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5 9-10"/></svg>';

var csAberto = null; // dropdown aberto no momento

function enhanceSelect(sel) {
  if (sel._cs) return;

  var wrap = document.createElement("div");
  wrap.className = "cs " + (sel.classList.contains("filter-select") ? "cs-filter" : "cs-form");
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.classList.add("cs-native");
  sel.tabIndex = -1;
  sel.setAttribute("aria-hidden", "true");

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cs-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = '<span class="cs-val"></span>' + CS_CHEV;
  wrap.appendChild(btn);

  // Label do formulário passa a apontar para o botão
  var fg = wrap.closest(".fg"),
    lbl = fg && fg.querySelector("label");
  if (lbl) {
    if (!lbl.id) lbl.id = "lbl-" + (sel.id || Math.random().toString(36).slice(2));
    btn.setAttribute("aria-labelledby", lbl.id);
    lbl.addEventListener("click", function () {
      btn.focus();
    });
  }

  var menu = document.createElement("div");
  menu.className = "cs-menu";
  menu.setAttribute("role", "listbox");
  document.body.appendChild(menu); // fora do modal para não ser cortado pelo scroll

  var cs = { sel: sel, wrap: wrap, btn: btn, menu: menu };
  sel._cs = cs;

  function refresh() {
    var o = sel.options[sel.selectedIndex];
    btn.querySelector(".cs-val").textContent = o ? o.text : "";
  }
  cs.refresh = refresh;

  // Opções trocadas via innerHTML (ex.: papéis na tela de Equipe)
  new MutationObserver(refresh).observe(sel, { childList: true, subtree: true, attributes: true });

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    csAberto === cs ? csFecha() : csAbre(cs);
  });
  btn.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      csAbre(cs);
    }
  });

  refresh();
}

function csAbre(cs) {
  csFecha();
  if (typeof fechaRegDD === "function") fechaRegDD();
  var sel = cs.sel,
    h = "";
  Array.prototype.forEach.call(sel.options, function (o, i) {
    var s = i === sel.selectedIndex;
    h +=
      '<button type="button" role="option" class="cs-item' + (s ? " sel" : "") + '" aria-selected="' + s + '" data-i="' + i + '">' +
      '<span class="cs-lbl">' + esc(o.text) + "</span>" +
      (s ? '<span class="cs-check">' + CS_CHECK + "</span>" : "") +
      "</button>";
  });
  cs.menu.innerHTML = h;
  Array.prototype.forEach.call(cs.menu.querySelectorAll(".cs-item"), function (it) {
    it.addEventListener("click", function (e) {
      e.stopPropagation();
      csEscolhe(cs, Number(it.dataset.i));
    });
  });

  csPosiciona(cs);
  cs.wrap.classList.add("open");
  cs.menu.classList.add("open");
  cs.btn.setAttribute("aria-expanded", "true");
  csAberto = cs;
  var foco = cs.menu.querySelector(".cs-item.sel") || cs.menu.querySelector(".cs-item");
  if (foco) foco.focus({ preventScroll: true });
}

// Menu usa position:fixed, calculado a partir do botão; abre para cima se faltar espaço
function csPosiciona(cs) {
  var r = cs.btn.getBoundingClientRect(),
    m = cs.menu,
    vw = window.innerWidth,
    vh = window.innerHeight;
  m.style.minWidth = r.width + "px";
  m.style.left = Math.max(8, Math.min(r.left, vw - Math.max(r.width, 180) - 8)) + "px";
  m.style.maxHeight = "";
  var altura = Math.min(m.scrollHeight || 280, 280),
    abaixo = vh - r.bottom - 12,
    acima = r.top - 12;
  if (abaixo < altura && acima > abaixo) {
    m.style.top = "";
    m.style.bottom = vh - r.top + 6 + "px";
    m.style.maxHeight = Math.min(280, acima) + "px";
  } else {
    m.style.bottom = "";
    m.style.top = r.bottom + 6 + "px";
    m.style.maxHeight = Math.min(280, abaixo) + "px";
  }
}

function csEscolhe(cs, i) {
  var mudou = cs.sel.selectedIndex !== i;
  cs.sel.selectedIndex = i;
  cs.refresh();
  csFecha();
  cs.btn.focus();
  if (mudou) cs.sel.dispatchEvent(new Event("change", { bubbles: true }));
}

function csFecha() {
  if (!csAberto) return;
  csAberto.wrap.classList.remove("open");
  csAberto.menu.classList.remove("open");
  csAberto.btn.setAttribute("aria-expanded", "false");
  csAberto = null;
}

document.addEventListener("click", function (e) {
  if (csAberto && !csAberto.menu.contains(e.target)) csFecha();
});
document.addEventListener("keydown", function (e) {
  if (!csAberto) return;
  var cs = csAberto;
  if (e.key === "Escape") {
    e.stopPropagation();
    csFecha();
    cs.btn.focus();
  } else if (e.key === "Tab") {
    csFecha();
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
    e.preventDefault();
    var its = Array.prototype.slice.call(cs.menu.querySelectorAll(".cs-item")),
      i = its.indexOf(document.activeElement);
    if (e.key === "Home") i = 0;
    else if (e.key === "End") i = its.length - 1;
    else i = e.key === "ArrowDown" ? Math.min(i + 1, its.length - 1) : Math.max(i - 1, 0);
    its[i].focus();
  }
});
// Rolar a página ou o modal com o menu aberto: fecha (evita menu "solto")
window.addEventListener(
  "scroll",
  function (e) {
    if (csAberto && !csAberto.menu.contains(e.target)) csFecha();
  },
  true
);
window.addEventListener("resize", csFecha);

// Atualiza o texto de todos (chamado ao abrir modal, depois que o código preencheu os campos)
function csRefreshAll() {
  document.querySelectorAll("select").forEach(function (s) {
    if (s._cs) s._cs.refresh();
  });
}

document.querySelectorAll("select").forEach(enhanceSelect);
