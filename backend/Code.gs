// ═══════════════════════════════════════════════════════════════
// CONTROLE DE DOAÇÕES — ACAMPAMENTO DE JOVENS
// Backend REST API — Google Apps Script v4 (Regionais + Login)
// ═══════════════════════════════════════════════════════════════

const SPREADSHEET_ID = '15m2-iXjeCDcP33BbsmW9WT_oz2jBMuHzfYpqWtfbhvg';

const SHEETS = {
  CONFIG: 'Configuracoes',
  ALIMENTOS: 'Alimentos',
  HISTORICO: 'HistoricoAlimentos',
  APADRINHAMENTO: 'Apadrinhamento',
  BRIG_VENDAS: 'BrigadeiroVendas',
  BRIG_CUSTOS: 'BrigadeiroCustos',
  PARTICIPANTES: 'Participantes',
  USUARIOS: 'Usuarios',
  SESSOES: 'Sessoes',
};

// Regionais disponíveis (código → nome exibido)
const REGIONAIS = {
  BRASILIA: 'Brasília',
  CAMPO_GRANDE: 'Campo Grande',
  CUIABA: 'Cuiabá',
  GOIANIA: 'Goiânia',
  PALMAS: 'Palmas',
};
const TODAS = 'TODAS';

// Regional atribuída aos dados que já existiam antes da divisão
const REGIONAL_LEGADO = 'BRASILIA';

// Papéis: super (tudo), admin (sua regional + equipe + metas), equipe (dados da sua regional)
const PAPEIS = ['super', 'admin', 'equipe'];

const SESSAO_DIAS = 7;
const HASH_ITER = 1000;
const MAX_TENTATIVAS = 5;

// Cabeçalhos de cada aba. "Regional" fica sempre por último para não deslocar colunas antigas.
const HEADERS = {
  Alimentos: ['ID','Nome','Unidade','Meta','Recebido','Regional'],
  HistoricoAlimentos: ['ID','AlimentoID','Doador','Quantidade','Data','Regional'],
  Apadrinhamento: ['ID','Nome','Valor','Metodo','Jovem','Data','Regional'],
  BrigadeiroVendas: ['ID','Data','Quantidade','PrecoUnitario','Descricao','Regional'],
  BrigadeiroCustos: ['ID','Data','Valor','Descricao','Regional'],
  Participantes: ['ID','Nome','Telefone','CanPay','Status','Notes','ReceiptUrl','Date','Regional'],
  Usuarios: ['ID','Usuario','Nome','Regional','Papel','SenhaHash','Salt','Ativo','CriadoEm'],
  Sessoes: ['TokenHash','UsuarioID','Expira'],
};

// Índice (0-based) da coluna Regional em cada aba de dados
function regIdx(sheetName) { return HEADERS[sheetName].indexOf('Regional'); }

// ─── ROTAS ───

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var action = p.action || 'carregarTudo';
    var user = autenticar(p.token);
    var reg = escopo(user, p.regional, false);
    var result;
    switch (action) {
      case 'carregarTudo': result = carregarTudo(user, reg); break;
      case 'getHistorico': result = getHistoricoAlimento(Number(p.id), reg); break;
      default: result = { error: 'Ação GET desconhecida: ' + action };
    }
    return jsonResponse(result);
  } catch (err) { return jsonResponse({ error: err.message, code: err.code || null }); }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return jsonResponse({ error: 'Servidor ocupado, tente novamente.' });
  }
  try {
    var body = JSON.parse(e.postData.contents);

    // Rotas públicas
    if (body.action === 'login') return jsonResponse(login(body.usuario, body.senha));
    if (body.action === 'logout') return jsonResponse(logout(body.token));

    var user = autenticar(body.token);
    var result;

    // Rotas de conta / equipe (não dependem da regional selecionada)
    switch (body.action) {
      case 'alterarSenha': result = alterarSenha(user, body.senhaAtual, body.novaSenha); break;
      case 'listUsuarios': result = listUsuarios(user); break;
      case 'addUsuario': result = addUsuario(user, body); break;
      case 'updateUsuario': result = updateUsuario(user, body); break;
      case 'resetSenha': result = resetSenha(user, body.id, body.novaSenha); break;
      case 'deleteUsuario': result = deleteUsuario(user, body.id); break;
    }
    if (result) return jsonResponse(result);

    // Daqui pra baixo toda ação escreve dados de UMA regional
    var reg = escopo(user, body.regional, true);

    switch (body.action) {
      // Alimentos
      case 'addAlimento': result = addAlimento(reg, body.nome, body.unidade, body.meta); break;
      case 'updateAlimento': result = updateAlimento(reg, body.id, body.nome, body.unidade, body.meta); break;
      case 'deleteAlimento': result = deleteAlimento(reg, body.id); break;
      case 'zerarAlimento': result = zerarAlimento(reg, body.id); break;
      case 'registrarDoacao': result = registrarDoacao(reg, body.alimentoId, body.quantidade, body.doador); break;
      // Apadrinhamento (doações)
      case 'addApadrinhamento': result = addApadrinhamento(reg, body.nome, body.valor, body.metodo, body.jovem, body.data); break;
      case 'deleteApadrinhamento': result = deleteApadrinhamento(reg, body.id); break;
      case 'setMetaArrecadacao': exigirAdmin(user); result = { success: setConfigReg('MetaArrecadacao', reg, Number(body.valor)) }; break;
      // Brigadeiros
      case 'addBrigVenda': result = addBrigVenda(reg, body.data, body.qty, body.precoUnitario, body.descricao); break;
      case 'deleteBrigVenda': result = deleteBrigVenda(reg, body.id); break;
      case 'addBrigCusto': result = addBrigCusto(reg, body.data, body.valor, body.descricao); break;
      case 'deleteBrigCusto': result = deleteBrigCusto(reg, body.id); break;
      case 'setMetaBrigadeiros': exigirAdmin(user); result = { success: setConfigReg('MetaBrigadeiros', reg, Number(body.valor)) }; break;
      // Participantes (Apadrinhados)
      case 'addParticipante': result = addParticipante(reg, body); break;
      case 'updateParticipante': result = updateParticipante(reg, body); break;
      case 'deleteParticipante': result = deleteParticipante(reg, body.id); break;
      case 'setValorInscricao': exigirAdmin(user); result = { success: setConfigReg('ValorInscricao', reg, Number(body.valor)) }; break;
      // Comprovante upload (base64 -> Google Drive)
      case 'uploadComprovante': result = uploadComprovante(reg, body.participanteId, body.fileName, body.base64Data, body.mimeType); break;
      default: result = { error: 'Ação POST desconhecida: ' + body.action };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message, code: err.code || null });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ─── PLANILHA ───

function getSpreadsheet() { return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); setupSheet(sheet, name); }
  return sheet;
}

function setupSheet(sheet, name) {
  if (HEADERS[name]) {
    sheet.appendRow(HEADERS[name]);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  if (name === 'Configuracoes') {
    sheet.appendRow(['Chave','Valor']);
    sheet.appendRow(['ProximoIdAlimento','1']);
    sheet.appendRow(['ProximoIdHistorico','1']);
    sheet.appendRow(['ProximoIdApadrinhamento','1']);
    sheet.appendRow(['ProximoIdBrigVenda','1']);
    sheet.appendRow(['ProximoIdBrigCusto','1']);
    sheet.appendRow(['ProximoIdParticipante','1']);
    sheet.appendRow(['ProximoIdUsuario','1']);
    sheet.getRange('1:1').setFontWeight('bold');
  }
}

function inicializarPlanilha() {
  Object.values(SHEETS).forEach(getSheet);
  Logger.log('Planilha inicializada com sucesso!');
}

// ─── MIGRAÇÃO (rodar UMA vez no editor, antes de publicar a nova versão) ───
// Adiciona a coluna Regional nas abas existentes e marca os dados atuais como REGIONAL_LEGADO.
// Pode rodar de novo sem problema: só preenche o que estiver vazio.

function migrarParaRegionais() {
  [SHEETS.ALIMENTOS, SHEETS.HISTORICO, SHEETS.APADRINHAMENTO, SHEETS.BRIG_VENDAS, SHEETS.BRIG_CUSTOS, SHEETS.PARTICIPANTES]
    .forEach(function (name) {
      var sheet = getSheet(name);
      var col = regIdx(name) + 1;
      sheet.getRange(1, col).setValue('Regional').setFontWeight('bold');
      var last = sheet.getLastRow();
      if (last < 2) return;
      var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
      var regs = sheet.getRange(2, col, last - 1, 1).getValues();
      var n = 0;
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] && !regs[i][0]) { regs[i][0] = REGIONAL_LEGADO; n++; }
      }
      sheet.getRange(2, col, last - 1, 1).setValues(regs);
      Logger.log(name + ': ' + n + ' linha(s) marcadas como ' + REGIONAL_LEGADO);
    });

  // Metas antigas (globais) passam a ser as metas da regional legado
  ['MetaArrecadacao', 'MetaBrigadeiros', 'ValorInscricao'].forEach(function (k) {
    var v = getConfig(k);
    if (v !== null && getConfig(k + ':' + REGIONAL_LEGADO) === null) setConfig(k + ':' + REGIONAL_LEGADO, v);
  });
  if (getConfig('ProximoIdUsuario') === null) setConfig('ProximoIdUsuario', 1);

  getSheet(SHEETS.USUARIOS);
  getSheet(SHEETS.SESSOES);
  Logger.log('Migração concluída.');
}

// ─── PRIMEIRO SUPER USUÁRIO (rodar no editor) ───
// 1. Preencha usuario/senha/nome abaixo  2. Execute  3. APAGUE a senha daqui e salve.

function criarSuperUsuario() {
  var usuario = '';   // ex: 'gabriel'
  var senha = '';     // mínimo 6 caracteres
  var nome = '';      // ex: 'Gabriel'
  if (!usuario || !senha) throw new Error('Preencha usuario e senha dentro da função criarSuperUsuario.');
  var r = criarUsuarioInterno(usuario, nome || usuario, REGIONAL_LEGADO, 'super', senha);
  Logger.log('Super usuário criado: ' + r.usuario + ' (ID ' + r.id + '). Agora apague a senha do código.');
}

// ─── UTILIDADES ───

function getNextId(tipo) {
  var sheet = getSheet(SHEETS.CONFIG), data = sheet.getDataRange().getValues(), chave = 'ProximoId' + tipo;

  // Pega o ID do contador
  var configId = 1;
  var configRow = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === chave) { configId = Number(data[i][1]) || 1; configRow = i + 1; break; }
  }

  // Pega o MAX ID já existente na sheet de destino (proteção contra duplicatas)
  var sheetMap = { 'Alimento': SHEETS.ALIMENTOS, 'Historico': SHEETS.HISTORICO, 'Apadrinhamento': SHEETS.APADRINHAMENTO, 'BrigVenda': SHEETS.BRIG_VENDAS, 'BrigCusto': SHEETS.BRIG_CUSTOS, 'Participante': SHEETS.PARTICIPANTES, 'Usuario': SHEETS.USUARIOS };
  var targetName = sheetMap[tipo];
  var maxExisting = 0;
  if (targetName) {
    var targetData = getSheet(targetName).getDataRange().getValues();
    for (var j = 1; j < targetData.length; j++) {
      var val = Number(targetData[j][0]);
      if (val > maxExisting) maxExisting = val;
    }
  }

  // Usa o maior entre o contador e o MAX+1
  var id = Math.max(configId, maxExisting + 1);

  // Atualiza o contador (cria se não existir)
  if (configRow > 0) sheet.getRange(configRow, 2).setValue(id + 1);
  else sheet.appendRow([chave, id + 1]);

  return id;
}

function getConfig(chave) {
  var data = getSheet(SHEETS.CONFIG).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (data[i][0] === chave) return data[i][1]; }
  return null;
}

function setConfig(chave, valor) {
  var sheet = getSheet(SHEETS.CONFIG), data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (data[i][0] === chave) { sheet.getRange(i+1,2).setValue(valor); return; } }
  sheet.appendRow([chave, valor]);
}

// Config por regional: chave "MetaArrecadacao:BRASILIA". Sem valor → padrão.
function getConfigReg(chave, reg, padrao) {
  var v = getConfig(chave + ':' + reg);
  return v === null || v === '' ? padrao : Number(v);
}
function setConfigReg(chave, reg, valor) {
  if (!(valor > 0)) throw new Error('Valor inválido.');
  setConfig(chave + ':' + reg, valor);
  return true;
}

function dateNow() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

// Lê as linhas de dados de uma aba filtrando pela regional (TODAS = sem filtro)
function linhasDaRegional(sheetName, reg) {
  var ri = regIdx(sheetName);
  return getSheet(sheetName).getDataRange().getValues().slice(1).filter(function (r) {
    return r[0] && (reg === TODAS || r[ri] === reg);
  });
}

// Acha a linha (1-based) do ID, desde que ela pertença à regional. -1 se não achar.
function findRowReg(sheetName, id, reg) {
  var ri = regIdx(sheetName);
  var data = getSheet(sheetName).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(id)) return data[i][ri] === reg ? i + 1 : -1;
  }
  return -1;
}

// ═══ AUTENTICAÇÃO ═══

function erroAuth(msg) { var e = new Error(msg || 'Sessão expirada. Faça login novamente.'); e.code = 'AUTH'; return e; }

function toHex(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function sha256(s) {
  return toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}
function hashSenha(senha, salt) {
  var h = sha256(salt + ':' + senha);
  for (var i = 0; i < HASH_ITER; i++) h = sha256(h + salt);
  return h;
}
function novoSalt() { return Utilities.getUuid().replace(/-/g, ''); }
function normUsuario(u) { return String(u || '').trim().toLowerCase(); }

function validarSenha(s) {
  if (!s || String(s).length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
}

// Linha da aba Usuarios → objeto (sem hash/salt)
function rowToUser(r) {
  return { id: Number(r[0]), usuario: String(r[1]), nome: String(r[2]), regional: String(r[3]),
           papel: String(r[4]), ativo: r[7] === true || String(r[7]).toUpperCase() === 'TRUE' };
}

function login(usuario, senha) {
  usuario = normUsuario(usuario);
  if (!usuario || !senha) return { error: 'Informe usuário e senha.' };

  var cache = CacheService.getScriptCache();
  var kTent = 'tent:' + usuario;
  var tent = Number(cache.get(kTent)) || 0;
  if (tent >= MAX_TENTATIVAS) return { error: 'Muitas tentativas. Aguarde 15 minutos.' };

  var data = getSheet(SHEETS.USUARIOS).getDataRange().getValues();
  var row = null;
  for (var i = 1; i < data.length; i++) { if (normUsuario(data[i][1]) === usuario) { row = data[i]; break; } }

  if (!row || hashSenha(String(senha), String(row[6])) !== String(row[5])) {
    cache.put(kTent, String(tent + 1), 900);
    return { error: 'Usuário ou senha inválidos.' };
  }
  var user = rowToUser(row);
  if (!user.ativo) return { error: 'Usuário desativado. Fale com o coordenador da sua regional.' };
  cache.remove(kTent);

  // Cria sessão e limpa as expiradas
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var ss = getSheet(SHEETS.SESSOES);
  limparSessoes(ss, function (r) { return Number(r[2]) < Date.now(); });
  ss.appendRow([sha256(token), user.id, Date.now() + SESSAO_DIAS * 86400000]);

  return { token: token, user: publicUser(user), regionais: REGIONAIS };
}

function logout(token) {
  if (!token) return { success: true };
  var th = sha256(token);
  limparSessoes(getSheet(SHEETS.SESSOES), function (r) { return r[0] === th; });
  return { success: true };
}

// Remove sessões que satisfazem `cond` (e do cache também)
function limparSessoes(ss, cond) {
  var data = ss.getDataRange().getValues(), keys = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (cond(data[i])) { keys.push('s:' + data[i][0]); ss.deleteRow(i + 1); }
  }
  if (keys.length) CacheService.getScriptCache().removeAll(keys);
}

function encerrarSessoesDoUsuario(userId) {
  limparSessoes(getSheet(SHEETS.SESSOES), function (r) { return Number(r[1]) === Number(userId); });
}

function autenticar(token) {
  if (!token) throw erroAuth('Faça login para continuar.');
  var th = sha256(token);
  var cache = CacheService.getScriptCache();
  var c = cache.get('s:' + th);
  if (c) return JSON.parse(c);

  var sess = getSheet(SHEETS.SESSOES).getDataRange().getValues(), uid = null;
  for (var i = 1; i < sess.length; i++) {
    if (sess[i][0] === th && Number(sess[i][2]) > Date.now()) { uid = Number(sess[i][1]); break; }
  }
  if (uid === null) throw erroAuth();

  var user = getUsuarioById(uid);
  if (!user || !user.ativo) throw erroAuth('Usuário desativado.');
  cache.put('s:' + th, JSON.stringify(user), 300);
  return user;
}

// Decide qual regional a requisição enxerga/altera
function escopo(user, regionalReq, escrita) {
  if (user.papel !== 'super') return user.regional;
  var r = regionalReq || TODAS;
  if (r !== TODAS && !REGIONAIS[r]) throw new Error('Regional inválida.');
  if (escrita && r === TODAS) throw new Error('Selecione uma regional para fazer alterações.');
  return r;
}

function exigirAdmin(user) {
  if (user.papel !== 'super' && user.papel !== 'admin') throw new Error('Apenas coordenadores podem fazer isso.');
}

function publicUser(u) { return { id: u.id, usuario: u.usuario, nome: u.nome, regional: u.regional, papel: u.papel, ativo: u.ativo }; }

// ═══ USUÁRIOS / EQUIPE ═══

function getUsuarioById(id) {
  var data = getSheet(SHEETS.USUARIOS).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (Number(data[i][0]) === Number(id)) return rowToUser(data[i]); }
  return null;
}

function findUsuarioRow(id) {
  var data = getSheet(SHEETS.USUARIOS).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (Number(data[i][0]) === Number(id)) return { row: i + 1, user: rowToUser(data[i]) }; }
  return null;
}

// Pode `ator` gerenciar `alvo`?
function podeGerenciar(ator, alvo) {
  if (ator.papel === 'super') return true;
  if (ator.papel === 'admin') return alvo.papel !== 'super' && alvo.regional === ator.regional;
  return false;
}

function criarUsuarioInterno(usuario, nome, regional, papel, senha) {
  usuario = normUsuario(usuario);
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) throw new Error('Usuário deve ter 3 a 30 caracteres (letras, números, ponto, hífen).');
  if (!REGIONAIS[regional]) throw new Error('Regional inválida.');
  if (PAPEIS.indexOf(papel) < 0) throw new Error('Papel inválido.');
  validarSenha(senha);
  var sheet = getSheet(SHEETS.USUARIOS), data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (normUsuario(data[i][1]) === usuario) throw new Error('Esse usuário já existe.'); }
  var id = getNextId('Usuario'), salt = novoSalt();
  sheet.appendRow([id, usuario, nome || usuario, regional, papel, hashSenha(String(senha), salt), salt, true, dateNow()]);
  return { id: id, usuario: usuario, nome: nome || usuario, regional: regional, papel: papel, ativo: true };
}

function listUsuarios(ator) {
  exigirAdmin(ator);
  return getSheet(SHEETS.USUARIOS).getDataRange().getValues().slice(1)
    .filter(function (r) { return r[0]; })
    .map(rowToUser)
    .filter(function (u) { return podeGerenciar(ator, u); })
    .map(publicUser);
}

function addUsuario(ator, b) {
  exigirAdmin(ator);
  var regional = ator.papel === 'super' ? b.regional : ator.regional;
  var papel = b.papel || 'equipe';
  if (papel === 'super' && ator.papel !== 'super') throw new Error('Apenas o super usuário pode criar outro super usuário.');
  return criarUsuarioInterno(b.usuario, String(b.nome || '').trim(), regional, papel, b.senha);
}

function updateUsuario(ator, b) {
  exigirAdmin(ator);
  var f = findUsuarioRow(b.id);
  if (!f || !podeGerenciar(ator, f.user)) throw new Error('Usuário não encontrado.');
  var u = f.user, s = getSheet(SHEETS.USUARIOS);

  var nome = b.nome !== undefined ? String(b.nome).trim() || u.nome : u.nome;
  var papel = b.papel !== undefined ? b.papel : u.papel;
  var regional = ator.papel === 'super' && b.regional !== undefined ? b.regional : u.regional;
  var ativo = b.ativo !== undefined ? !!b.ativo : u.ativo;

  if (PAPEIS.indexOf(papel) < 0) throw new Error('Papel inválido.');
  if (papel === 'super' && ator.papel !== 'super') throw new Error('Apenas o super usuário pode promover a super.');
  if (!REGIONAIS[regional]) throw new Error('Regional inválida.');
  if (u.id === ator.id && (!ativo || papel !== u.papel)) throw new Error('Você não pode desativar nem mudar o próprio papel.');

  s.getRange(f.row, 3, 1, 3).setValues([[nome, regional, papel]]);
  s.getRange(f.row, 8).setValue(ativo);
  encerrarSessoesDoUsuario(u.id); // força novo login com as permissões atualizadas
  return { success: true };
}

function resetSenha(ator, id, novaSenha) {
  exigirAdmin(ator);
  var f = findUsuarioRow(id);
  if (!f || !podeGerenciar(ator, f.user)) throw new Error('Usuário não encontrado.');
  validarSenha(novaSenha);
  var salt = novoSalt();
  getSheet(SHEETS.USUARIOS).getRange(f.row, 6, 1, 2).setValues([[hashSenha(String(novaSenha), salt), salt]]);
  encerrarSessoesDoUsuario(f.user.id);
  return { success: true };
}

function deleteUsuario(ator, id) {
  exigirAdmin(ator);
  var f = findUsuarioRow(id);
  if (!f || !podeGerenciar(ator, f.user)) throw new Error('Usuário não encontrado.');
  if (f.user.id === ator.id) throw new Error('Você não pode remover a si mesmo.');
  getSheet(SHEETS.USUARIOS).deleteRow(f.row);
  encerrarSessoesDoUsuario(f.user.id);
  return { success: true };
}

function alterarSenha(user, atual, nova) {
  var data = getSheet(SHEETS.USUARIOS).getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === user.id) {
      if (hashSenha(String(atual || ''), String(data[i][6])) !== String(data[i][5])) throw new Error('Senha atual incorreta.');
      validarSenha(nova);
      var salt = novoSalt();
      getSheet(SHEETS.USUARIOS).getRange(i + 1, 6, 1, 2).setValues([[hashSenha(String(nova), salt), salt]]);
      return { success: true };
    }
  }
  throw erroAuth();
}

// ═══ ALIMENTOS ═══

function getAlimentos(reg) {
  return linhasDaRegional(SHEETS.ALIMENTOS, reg).map(function(r){
    return {id:Number(r[0]),name:String(r[1]),unit:String(r[2]),goal:Number(r[3]),received:Number(r[4]),regional:String(r[5])};
  });
}
function addAlimento(reg,nome,unidade,meta) {
  var id=getNextId('Alimento');
  getSheet(SHEETS.ALIMENTOS).appendRow([id,nome,unidade,Number(meta),0,reg]);
  return {id:id,name:nome,unit:unidade,goal:Number(meta),received:0,regional:reg};
}
function updateAlimento(reg,id,nome,unidade,meta) {
  var r=findRowReg(SHEETS.ALIMENTOS,id,reg); if(r<0)throw new Error('Alimento não encontrado.');
  getSheet(SHEETS.ALIMENTOS).getRange(r,2,1,3).setValues([[nome,unidade,Number(meta)]]);
  return{success:true};
}
function deleteAlimento(reg,id) {
  var r=findRowReg(SHEETS.ALIMENTOS,id,reg); if(r<0)throw new Error('Alimento não encontrado.');
  getSheet(SHEETS.ALIMENTOS).deleteRow(r); deleteHistoricoByAlimento(id);
  return{success:true};
}
// Zera o recebido e apaga o histórico do alimento (mantém nome, unidade e meta)
function zerarAlimento(reg,id) {
  var r=findRowReg(SHEETS.ALIMENTOS,id,reg); if(r<0)throw new Error('Alimento não encontrado.');
  getSheet(SHEETS.ALIMENTOS).getRange(r,5).setValue(0);
  deleteHistoricoByAlimento(id);
  return{success:true};
}
function registrarDoacao(reg,alimentoId,quantidade,doador) {
  var r=findRowReg(SHEETS.ALIMENTOS,alimentoId,reg); if(r<0)throw new Error('Alimento não encontrado.');
  var s=getSheet(SHEETS.ALIMENTOS);
  var nr=Number(s.getRange(r,5).getValue())+Number(quantidade);
  s.getRange(r,5).setValue(nr);
  getSheet(SHEETS.HISTORICO).appendRow([getNextId('Historico'),Number(alimentoId),doador||'Anônimo',Number(quantidade),dateNow(),reg]);
  return{success:true,newReceived:nr};
}

function getHistoricoAlimento(alimentoId, reg) {
  return linhasDaRegional(SHEETS.HISTORICO, reg).filter(function(r){return Number(r[1])===Number(alimentoId)}).map(function(r){
    return{id:Number(r[0]),donor:String(r[2]),amount:Number(r[3]),date:String(r[4])};
  });
}
function deleteHistoricoByAlimento(alimentoId) { var s=getSheet(SHEETS.HISTORICO),d=s.getDataRange().getValues(); for(var i=d.length-1;i>=1;i--){if(Number(d[i][1])===Number(alimentoId))s.deleteRow(i+1);} }

// ═══ APADRINHAMENTO ═══

function getApadrinhamentos(reg) {
  return linhasDaRegional(SHEETS.APADRINHAMENTO, reg).map(function(r){
    return{id:Number(r[0]),name:String(r[1]),amount:Number(r[2]),method:String(r[3]),youth:String(r[4]),date:String(r[5]),regional:String(r[6])};
  });
}
function addApadrinhamento(reg,nome,valor,metodo,jovem,data) {
  var id=getNextId('Apadrinhamento'),dt=data||dateNow();
  getSheet(SHEETS.APADRINHAMENTO).appendRow([id,nome,Number(valor),metodo,jovem||'Geral',dt,reg]);
  return{id:id,name:nome,amount:Number(valor),method:metodo,youth:jovem||'Geral',date:dt,regional:reg};
}
function deleteApadrinhamento(reg,id) {
  var r=findRowReg(SHEETS.APADRINHAMENTO,id,reg); if(r<0)throw new Error('Doação não encontrada.');
  getSheet(SHEETS.APADRINHAMENTO).deleteRow(r); return{success:true};
}

// ═══ BRIGADEIROS ═══

function getBrigVendas(reg) {
  return linhasDaRegional(SHEETS.BRIG_VENDAS, reg).map(function(r){
    return{id:Number(r[0]),date:String(r[1]),qty:Number(r[2]),unitPrice:Number(r[3]),description:String(r[4]||''),regional:String(r[5])};
  });
}
function addBrigVenda(reg,data,qty,preco,desc) {
  var id=getNextId('BrigVenda'),dt=data||dateNow();
  getSheet(SHEETS.BRIG_VENDAS).appendRow([id,dt,Number(qty),Number(preco),desc||'',reg]);
  return{id:id,date:dt,qty:Number(qty),unitPrice:Number(preco),description:desc||'',regional:reg};
}
function deleteBrigVenda(reg,id) {
  var r=findRowReg(SHEETS.BRIG_VENDAS,id,reg); if(r<0)throw new Error('Venda não encontrada.');
  getSheet(SHEETS.BRIG_VENDAS).deleteRow(r); return{success:true};
}

function getBrigCustos(reg) {
  return linhasDaRegional(SHEETS.BRIG_CUSTOS, reg).map(function(r){
    return{id:Number(r[0]),date:String(r[1]),amount:Number(r[2]),description:String(r[3]||''),regional:String(r[4])};
  });
}
function addBrigCusto(reg,data,valor,desc) {
  var id=getNextId('BrigCusto'),dt=data||dateNow();
  getSheet(SHEETS.BRIG_CUSTOS).appendRow([id,dt,Number(valor),desc||'',reg]);
  return{id:id,date:dt,amount:Number(valor),description:desc||'',regional:reg};
}
function deleteBrigCusto(reg,id) {
  var r=findRowReg(SHEETS.BRIG_CUSTOS,id,reg); if(r<0)throw new Error('Custo não encontrado.');
  getSheet(SHEETS.BRIG_CUSTOS).deleteRow(r); return{success:true};
}

// ═══ PARTICIPANTES (APADRINHADOS) ═══

function getParticipantes(reg) {
  return linhasDaRegional(SHEETS.PARTICIPANTES, reg).map(function(r){
    return{id:Number(r[0]),name:String(r[1]),phone:String(r[2]),canPay:Number(r[3]),status:String(r[4]),notes:String(r[5]||''),receiptUrl:String(r[6]||''),date:String(r[7]||''),regional:String(r[8])};
  });
}

function addParticipante(reg, body) {
  var id = getNextId('Participante');
  var dt = body.date || dateNow();
  getSheet(SHEETS.PARTICIPANTES).appendRow([
    id, body.name, body.phone || '', Number(body.canPay) || 0,
    body.status || 'confirmado', body.notes || '', body.receiptUrl || '', dt, reg
  ]);
  return { id:id, name:body.name, phone:body.phone||'', canPay:Number(body.canPay)||0,
    status:body.status||'confirmado', notes:body.notes||'', receiptUrl:body.receiptUrl||'', date:dt, regional:reg };
}

function updateParticipante(reg, body) {
  var r = findRowReg(SHEETS.PARTICIPANTES, body.id, reg);
  if (r < 0) throw new Error('Participante não encontrado.');
  getSheet(SHEETS.PARTICIPANTES).getRange(r, 2, 1, 7).setValues([[
    body.name, body.phone || '', Number(body.canPay) || 0, body.status || 'confirmado',
    body.notes || '', body.receiptUrl || '', body.date || ''
  ]]);
  return { success: true };
}

function deleteParticipante(reg, id) {
  var r = findRowReg(SHEETS.PARTICIPANTES, id, reg);
  if (r < 0) throw new Error('Participante não encontrado.');
  getSheet(SHEETS.PARTICIPANTES).deleteRow(r);
  return { success: true };
}

// ═══ UPLOAD COMPROVANTE (base64 → Google Drive) ═══

function uploadComprovante(reg, participanteId, fileName, base64Data, mimeType) {
  var r = participanteId ? findRowReg(SHEETS.PARTICIPANTES, participanteId, reg) : -1;
  if (participanteId && r < 0) throw new Error('Participante não encontrado.');

  var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType || 'image/jpeg', fileName || 'comprovante.jpg');

  // Criar ou buscar pasta
  var folders = DriveApp.getFoldersByName('Comprovantes_Acampamento');
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Comprovantes_Acampamento');

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = file.getUrl();

  if (r > 0) getSheet(SHEETS.PARTICIPANTES).getRange(r, 7).setValue(url);
  return { success: true, url: url };
}

// ═══ CARREGAR TUDO ═══

var PADRAO = { MetaArrecadacao: 5000, MetaBrigadeiros: 3000, ValorInscricao: 200 };

function carregarTudo(user, reg) {
  var regs = reg === TODAS ? Object.keys(REGIONAIS) : [reg];
  var valores = {}, metas = {}, metaArr = 0, metaBrig = 0;
  regs.forEach(function (r) {
    valores[r] = getConfigReg('ValorInscricao', r, PADRAO.ValorInscricao);
    metas[r] = {
      arrecadacao: getConfigReg('MetaArrecadacao', r, PADRAO.MetaArrecadacao),
      brigadeiros: getConfigReg('MetaBrigadeiros', r, PADRAO.MetaBrigadeiros)
    };
    metaArr += metas[r].arrecadacao;
    metaBrig += metas[r].brigadeiros;
  });
  return {
    alimentos: getAlimentos(reg),
    apadrinhamentos: getApadrinhamentos(reg),
    brigVendas: getBrigVendas(reg),
    brigCustos: getBrigCustos(reg),
    participantes: getParticipantes(reg),
    metaArrecadacao: metaArr,
    metaBrigadeiros: metaBrig,
    valorInscricao: reg === TODAS ? null : valores[reg],
    valoresInscricao: valores,
    metasPorRegional: metas,
    user: publicUser(user),
    regional: reg,
    regionais: REGIONAIS
  };
}
