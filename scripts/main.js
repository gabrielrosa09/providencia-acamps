// === INICIALIZAÇÃO ===

window.onload = function () {
  apiGet("carregarTudo")
    .then(function (d) {
      alimentos = d.alimentos || [];
      apadrinhamentos = d.apadrinhamentos || [];
      brigVendas = d.brigVendas || [];
      brigCustos = d.brigCustos || [];
      participantes = d.participantes || [];
      metaArr = d.metaArrecadacao || 5000;
      metaBrig = d.metaBrigadeiros || 3000;
      valorInsc = d.valorInscricao || 200;
      $("loading").style.display = "none";
      R();
      go("alimentos");
    })
    .catch(function () {
      $("loading").innerHTML =
        '<p style="color:var(--danger)">Erro ao conectar com a API.<br><br><small style="color:var(--text2)">Verifique se a URL está correta e se o deploy está como "Qualquer pessoa".</small></p>';
    });
};

// === NAVEGAÇÃO ===

function go(t) {
  curTab = t;
  ["alimentos", "apadrinhamento", "apadrinhados", "brigadeiros", "dashboard"].forEach(function (x) {
    $("page-" + x).style.display = x === t ? "block" : "none";
    $("tab-" + x).className = "tab-btn" + (x === t ? " active" : "");
  });
  if (t === "dashboard") rDash();
}

// Atualiza todos os painéis
function R() {
  rFS();
  rFT();
  rGB();
  rST();
  rApad();
  rBB();
  rBC();
  if (curTab === "dashboard") rDash();
}

// === MODAIS ===

function om(id) {
  $("m-" + id).classList.add("open");
}

function cm() {
  document.querySelectorAll(".mo").forEach(function (m) {
    m.classList.remove("open");
  });
}

document.querySelectorAll(".mo").forEach(function (m) {
  m.addEventListener("click", function (e) {
    if (e.target === m) cm();
  });
});

// === BUSCAS POR ID ===

function fF(id) {
  id = Number(id);
  return alimentos.find(function (f) {
    return Number(f.id) === id;
  });
}

function fP(id) {
  id = Number(id);
  return participantes.find(function (p) {
    return Number(p.id) === id;
  });
}
