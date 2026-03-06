var API_URL =
  "https://script.google.com/macros/s/AKfycbwwAP-vlU1JeaDkm3x2LuhBKe3BHtqqWCv4xKYQ4R39ymaJ3a9sWQPEIgvZEUqoB6oB/exec";

function apiGet(action, params) {
  var url = API_URL + "?action=" + action;
  if (params)
    for (var k in params)
      url += "&" + k + "=" + encodeURIComponent(params[k]);
  return fetch(url).then(function (r) {
    return r.json();
  });
}

function apiPost(body) {
  return fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  }).then(function (r) {
    return r.json();
  });
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
