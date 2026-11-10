// === LOGIN / SESSÃO ===

var PAPEL_L = { super: "Super usuário", admin: "Coordenador", equipe: "Equipe" };

function showLogin(msg) {
  $("login-err").textContent = msg && msg !== "Faça login para continuar." ? msg : "";
  $("login").classList.add("open");
  $("loading").style.display = "none";
  document.body.classList.add("logged-out");
  setTimeout(function () {
    $("lg-u").focus();
  }, 50);
}

function doLogin(e) {
  if (e) e.preventDefault();
  var u = $("lg-u").value.trim(),
    s = $("lg-s").value,
    b = $("lg-b");
  if (!u || !s) {
    $("login-err").textContent = "Informe usuário e senha.";
    return false;
  }
  setL(b, true);
  $("login-err").textContent = "";
  apiPost({ action: "login", usuario: u, senha: s })
    .then(function (d) {
      setToken(d.token);
      // Super começa na última regional que viu (ou em "Todas"); os demais não escolhem
      if (d.user.papel !== "super") setRegionalSel(null);
      $("lg-s").value = "";
      $("login").classList.remove("open");
      document.body.classList.remove("logged-out");
      setL(b, false);
      b.textContent = "Entrar";
      carregar();
    })
    .catch(function (err) {
      $("login-err").textContent = err.message;
      setL(b, false);
      b.textContent = "Entrar";
    });
  return false;
}

function doLogout() {
  var t = authToken;
  setToken(null);
  // Recarrega a página para não deixar dados do usuário anterior na memória
  apiPost({ action: "logout", token: t })
    .catch(function () {})
    .then(function () {
      location.reload();
    });
}

// === BARRA DO USUÁRIO (topo) ===

function rUserBar() {
  if (!usuario) return;
  var reg;
  if (usuario.papel === "super") {
    reg = regDropdown();
  } else {
    reg = '<span class="ub-reg">' + ICON_PIN + esc(regionais[regionalAtual] || regionalAtual) + "</span>";
  }
  $("userbar").innerHTML =
    reg +
    '<span class="ub-name" title="' + esc(PAPEL_L[usuario.papel] || usuario.papel) + '">' + esc(usuario.nome) + "</span>" +
    (isAdmin() ? '<button class="btn btn-ghost btn-sm" onclick="abrirEquipe()">Equipe</button>' : "") +
    '<button class="btn btn-ghost btn-sm" onclick="om(\'senha\')">Senha</button>' +
    '<button class="btn btn-ghost btn-sm" onclick="doLogout()">Sair</button>';

  $("ro-banner").style.display = isTodas() ? "block" : "none";
  document.body.classList.toggle("no-admin", !isAdmin() || isTodas());
}

function trocaRegional(r) {
  fechaRegDD();
  if (r === regionalAtual) return;
  setRegionalSel(r);
  carregar();
}

// === SELETOR DE REGIONAL (super) ===

var ICON_PIN =
  '<svg class="rd-ic" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
var ICON_GLOBE =
  '<svg class="rd-ic" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-9 9h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
var ICON_CHEV =
  '<svg class="rd-chev" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>';
var ICON_CHECK =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5 9-10"/></svg>';

function regDropdown() {
  var atual = isTodas() ? "Todas as regionais" : regionais[regionalAtual] || regionalAtual;
  var item = function (k, label, icon) {
    var sel = k === regionalAtual;
    return (
      '<button type="button" role="option" class="rd-item' + (sel ? " sel" : "") + '" aria-selected="' + sel +
      '" onclick="trocaRegional(\'' + k + '\')">' + icon + '<span class="rd-lbl">' + esc(label) + "</span>" +
      (sel ? '<span class="rd-check">' + ICON_CHECK + "</span>" : "") + "</button>"
    );
  };
  var h =
    '<div class="rd" id="rd">' +
    '<button type="button" class="rd-btn" id="rd-btn" aria-haspopup="listbox" aria-expanded="false" onclick="toggleRegDD(event)">' +
    (isTodas() ? ICON_GLOBE : ICON_PIN) + '<span class="rd-cur">' + esc(atual) + "</span>" + ICON_CHEV + "</button>" +
    '<div class="rd-menu" role="listbox" aria-label="Regional">' +
    '<div class="rd-head">Ver dados de</div>' +
    item("TODAS", "Todas as regionais", ICON_GLOBE) +
    '<div class="rd-sep"></div>';
  Object.keys(regionais).forEach(function (k) {
    h += item(k, regionais[k], ICON_PIN);
  });
  return h + "</div></div>";
}

function toggleRegDD(e) {
  e.stopPropagation();
  if (typeof csFecha === "function") csFecha();
  var dd = $("rd"),
    open = !dd.classList.contains("open");
  dd.classList.toggle("open", open);
  $("rd-btn").setAttribute("aria-expanded", open);
  if (open) {
    var s = dd.querySelector(".rd-item.sel") || dd.querySelector(".rd-item");
    if (s) s.focus();
  }
}

function fechaRegDD() {
  var dd = $("rd");
  if (!dd || !dd.classList.contains("open")) return;
  dd.classList.remove("open");
  $("rd-btn").setAttribute("aria-expanded", "false");
}

// Fecha ao clicar fora; Esc fecha; setas navegam
document.addEventListener("click", function (e) {
  var dd = $("rd");
  if (dd && !dd.contains(e.target)) fechaRegDD();
});
document.addEventListener("keydown", function (e) {
  var dd = $("rd");
  if (!dd || !dd.classList.contains("open")) return;
  if (e.key === "Escape") {
    fechaRegDD();
    $("rd-btn").focus();
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    var its = Array.prototype.slice.call(dd.querySelectorAll(".rd-item")),
      i = its.indexOf(document.activeElement);
    i = e.key === "ArrowDown" ? Math.min(i + 1, its.length - 1) : Math.max(i - 1, 0);
    its[i].focus();
  }
});

// === ALTERAR A PRÓPRIA SENHA ===

function subSenha(b) {
  var a = $("ps-a").value,
    n = $("ps-n").value,
    c = $("ps-c").value;
  if (!a || !n) return alert("Preencha a senha atual e a nova.");
  if (n !== c) return alert("A confirmação não confere.");
  setL(b, true);
  apiPost({ action: "alterarSenha", senhaAtual: a, novaSenha: n })
    .then(function () {
      $("ps-a").value = $("ps-n").value = $("ps-c").value = "";
      cm();
      toast("Senha alterada!", true);
      setL(b, false);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

// === EQUIPE (coordenador / super) ===

var equipe = [];

function abrirEquipe() {
  var sup = usuario.papel === "super";
  // Formulário: super escolhe regional e pode criar super; coordenador não
  $("nu-reg-wrap").style.display = sup ? "block" : "none";
  var regSel = $("nu-reg");
  regSel.innerHTML = Object.keys(regionais)
    .map(function (k) {
      return '<option value="' + k + '">' + esc(regionais[k]) + "</option>";
    })
    .join("");
  if (!isTodas()) regSel.value = regionalAtual;
  $("nu-papel").innerHTML =
    '<option value="equipe">Equipe</option><option value="admin">Coordenador</option>' +
    (sup ? '<option value="super">Super usuário</option>' : "");
  $("eq-list").innerHTML = '<div class="loading" style="padding:20px"><div class="spinner"></div></div>';
  om("equipe");
  carregarEquipe();
}

function carregarEquipe() {
  return apiPost({ action: "listUsuarios" })
    .then(function (l) {
      equipe = l;
      rEquipe();
    })
    .catch(function (e) {
      $("eq-list").innerHTML = '<div class="empty" style="color:var(--danger)">Erro: ' + esc(e.message) + "</div>";
    });
}

function rEquipe() {
  if (!equipe.length) {
    $("eq-list").innerHTML = '<div class="empty">Nenhum usuário.</div>';
    return;
  }
  var sup = usuario.papel === "super";
  var l = [].concat(equipe).sort(function (a, b) {
    return (a.regional + a.nome).localeCompare(b.regional + b.nome);
  });
  var h = "";
  l.forEach(function (u) {
    var eu = u.id === usuario.id;
    h +=
      '<div class="eq-row' + (u.ativo ? "" : " off") + '"><div class="eq-info"><div class="eq-nome">' +
      esc(u.nome) +
      (eu ? ' <span class="eq-tag">você</span>' : "") +
      (u.ativo ? "" : ' <span class="eq-tag off">desativado</span>') +
      '</div><div class="eq-sub">@' + esc(u.usuario) + " · " + esc(PAPEL_L[u.papel] || u.papel) +
      (sup ? " · " + esc(regionais[u.regional] || u.regional) : "") +
      "</div></div>";
    if (!eu) {
      h +=
        '<div class="eq-act">' +
        '<button class="btn btn-ghost btn-sm" onclick="resetSenhaU(' + u.id + ')">Nova senha</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="toggleU(' + u.id + ')">' + (u.ativo ? "Desativar" : "Ativar") + "</button>" +
        '<button class="btn btn-danger btn-sm" onclick="delU(' + u.id + ')">Remover</button>' +
        "</div>";
    }
    h += "</div>";
  });
  $("eq-list").innerHTML = h;
}

function fU(id) {
  return equipe.find(function (u) {
    return u.id === id;
  });
}

function subNovoU(b) {
  var body = {
    action: "addUsuario",
    nome: $("nu-nome").value.trim(),
    usuario: $("nu-user").value.trim(),
    senha: $("nu-senha").value,
    papel: $("nu-papel").value,
    regional: $("nu-reg").value,
  };
  if (!body.nome || !body.usuario || !body.senha) return alert("Preencha nome, usuário e senha.");
  setL(b, true);
  apiPost(body)
    .then(function () {
      $("nu-nome").value = $("nu-user").value = $("nu-senha").value = "";
      toast("Usuário criado! Passe o usuário e a senha para a pessoa.", true);
      setL(b, false);
      return carregarEquipe();
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
      setL(b, false);
    });
}

function resetSenhaU(id) {
  var u = fU(id);
  if (!u) return;
  var s = prompt("Nova senha para " + u.nome + " (mínimo 6 caracteres):");
  if (!s) return;
  apiPost({ action: "resetSenha", id: id, novaSenha: s })
    .then(function () {
      toast("Senha redefinida!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function toggleU(id) {
  var u = fU(id);
  if (!u) return;
  apiPost({ action: "updateUsuario", id: id, ativo: !u.ativo })
    .then(function () {
      u.ativo = !u.ativo;
      rEquipe();
      toast(u.ativo ? "Usuário ativado!" : "Usuário desativado!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}

function delU(id) {
  var u = fU(id);
  if (!u || !confirm('Remover o usuário "' + u.nome + '"?')) return;
  apiPost({ action: "deleteUsuario", id: id })
    .then(function () {
      equipe = equipe.filter(function (x) {
        return x.id !== id;
      });
      rEquipe();
      toast("Removido!", true);
    })
    .catch(function (e) {
      alert("Erro: " + e.message);
    });
}
