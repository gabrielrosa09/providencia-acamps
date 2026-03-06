// === ESTADO GLOBAL ===
var alimentos = [],
  apadrinhamentos = [],
  brigVendas = [],
  brigCustos = [],
  participantes = [];
var metaArr = 5000,
  metaBrig = 3000,
  valorInsc = 200;
var curTab = "alimentos",
  curBV = "sales";

// === MAPAS DE STATUS ===
var statusC = {
  confirmado: "var(--success)",
  pendente: "var(--warning)",
  desistiu: "var(--danger)",
};
var statusL = {
  confirmado: "Confirmado",
  pendente: "Pendente",
  desistiu: "Desistiu",
};

// === UTILITÁRIOS ===
var $ = function (id) {
  return document.getElementById(id);
};
var F = function (v) {
  return (v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
function esc(s) {
  var d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}
function fmtD(v) {
  if (!v) return "";
  var d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function fmtPhone(p) {
  if (!p) return "";
  var s = String(p).replace(/\D/g, "");
  if (s.length === 11)
    return "(" + s.slice(0, 2) + ") " + s.slice(2, 7) + "-" + s.slice(7);
  return p;
}

// === COMPUTADOS ===
function comp() {
  var totalSp = apadrinhamentos.reduce(function (s, d) {
    return s + d.amount;
  }, 0);
  var bRev = brigVendas.reduce(function (s, v) {
    return s + v.qty * v.unitPrice;
  }, 0);
  var bCost = brigCustos.reduce(function (s, c) {
    return s + c.amount;
  }, 0);
  var bProfit = bRev - bCost;
  var actParts = participantes.filter(function (p) {
    return p.status !== "desistiu";
  });
  var totalNeed = actParts.reduce(function (s, p) {
    return s + Math.max(valorInsc - p.canPay, 0);
  }, 0);
  var partsNeed = actParts.filter(function (p) {
    return p.canPay < valorInsc;
  }).length;
  var partsFull = actParts.filter(function (p) {
    return p.canPay >= valorInsc;
  }).length;
  var fDone = alimentos.filter(function (f) {
    return f.received >= f.goal;
  }).length;
  return {
    totalSp: totalSp,
    bRev: bRev,
    bCost: bCost,
    bProfit: bProfit,
    actParts: actParts,
    totalNeed: totalNeed,
    partsNeed: partsNeed,
    partsFull: partsFull,
    fDone: fDone,
    grand: totalSp + Math.max(bProfit, 0),
    saldo: totalSp + Math.max(bProfit, 0) - totalNeed,
  };
}
