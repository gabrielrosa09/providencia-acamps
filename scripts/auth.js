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
    reg = '<select class="filter-select ub-sel" onchange="trocaRegional(this.value)" aria-label="Regional">';
    reg += '<option value="TODAS"' + (isTodas() ? " selected" : "") + ">Todas as regionais</option>";
    Object.keys(regionais).forEach(function (k) {
      reg +=
        '<option value="' + k + '"' + (regionalAtual === k ? " selected" : "") + ">" + esc(regionais[k]) + "</option>";
    });
    reg += "</select>";
  } else {
    reg = '<span class="ub-reg">' + esc(regionais[regionalAtual] || regionalAtual) + "</span>";
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
  setRegionalSel(r);
  carregar();
}

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
