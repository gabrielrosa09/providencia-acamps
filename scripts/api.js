var API_URL =
  "https://script.google.com/macros/s/AKfycby_WTVxcJzD804YDvtR9Hoxjsfi0BF6qoYpZ7o8qp0B5OJIQDBj1lggBS9iQhjqNixC/exec";

// === SESSÃO (token + regional escolhida pelo super) ===

var TOKEN_KEY = "acamps_token",
  REG_KEY = "acamps_regional";

function lsGet(k) {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}
function lsSet(k, v) {
  try {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch (e) {}
}

var authToken = lsGet(TOKEN_KEY),
  regionalSel = lsGet(REG_KEY);

function setToken(t) {
  authToken = t;
  lsSet(TOKEN_KEY, t);
}
function setRegionalSel(r) {
  regionalSel = r;
  lsSet(REG_KEY, r);
}

// Resposta com {error} vira Promise rejeitada; erro de sessão volta pro login
function handleResp(r) {
  return r.json().then(function (d) {
    if (d && d.error) {
      if (d.code === "AUTH") {
        setToken(null);
        showLogin(d.error);
      }
      throw new Error(d.error);
    }
    return d;
  });
}

function apiGet(action, params) {
  var url = API_URL + "?action=" + action;
  var all = Object.assign({}, params || {}, { token: authToken || "" });
  if (regionalSel) all.regional = regionalSel;
  for (var k in all) url += "&" + k + "=" + encodeURIComponent(all[k]);
  return fetch(url).then(handleResp);
}

function apiPost(body) {
  var payload = Object.assign({}, body, { token: body.token || authToken || "" });
  // Cadastro de usuário já manda a regional do novo usuário; não sobrescrever
  if (regionalSel && !payload.regional) payload.regional = regionalSel;
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).then(handleResp);
}

function toast(msg, ok) {
  var el = $("toast");
  el.textContent = msg;
  el.className = "toast show " + (ok ? "ok" : "err");
  setTimeout(function () {
    el.className = "toast";
  }, 3000);
}

function setL(b, l) {
  b.disabled = l;
  if (l) b.dataset.o = b.textContent;
  b.textContent = l ? "Salvando..." : b.dataset.o || "OK";
}
