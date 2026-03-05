# Controle de Doações — Acampamento de Jovens
## Guia de Configuração (Google Apps Script + Sheets) — v2

---

### Passo 1: Criar a Planilha Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma **nova planilha em branco**
2. Copie o **ID da planilha** da URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_E_O_ID_DA_PLANILHA/edit
   ```

> As abas são criadas automaticamente pelo script.

---

### Passo 2: Criar o Projeto no Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Clique em **"Novo Projeto"**
3. Renomeie para **"Controle Doações Acampamento"**

---

### Passo 3: Adicionar os Arquivos

#### `Code.gs`:
1. Apague o conteúdo existente e cole o arquivo `Code.gs` fornecido
2. Substitua `COLE_AQUI_O_ID_DA_SUA_PLANILHA` pelo ID real

#### `index.html`:
1. Clique **"+"** → **"HTML"** → nomeie como **`index`**
2. Cole o conteúdo do arquivo `index.html`

---

### Passo 4: Inicializar a Planilha

1. Selecione `inicializarPlanilha` no dropdown e clique **▶ Executar**
2. Autorize o acesso quando solicitado
3. Verifique se as **6 abas** foram criadas

---

### Passo 5: Publicar como Web App

1. **"Implantar"** → **"Nova implantação"** → **App da Web**
2. Executar como: **Eu** | Acesso: **Qualquer pessoa**
3. Copie a URL gerada

---

## Estrutura das Abas

| Aba | Colunas | Descrição |
|-----|---------|-----------|
| **Configuracoes** | Chave, Valor | Metas e IDs auto-incrementais |
| **Alimentos** | ID, Nome, Unidade, Meta, Recebido | Cadastro de alimentos |
| **HistoricoAlimentos** | ID, AlimentoID, Doador, Quantidade, Data | Histórico de doações |
| **Apadrinhamento** | ID, Nome, Valor, Metodo, Jovem, Data | Doações em dinheiro/PIX |
| **BrigadeiroVendas** | ID, Data, Quantidade, PrecoUnitario, Descricao | Vendas diárias |
| **BrigadeiroCustos** | ID, Data, Valor, Descricao | Gastos com material |

---

## Funcionalidades

- **Alimentos**: Cadastro com metas, registro de doações, histórico por item
- **Apadrinhamento**: Doações em dinheiro/PIX, meta editável, jovem apadrinhado
- **Brigadeiros**: Lançamento de vendas diárias (qtd × preço), custos de material, lucro líquido automático (vendas − custos), meta de lucro editável
- **Dashboard**: Visão geral de tudo, arrecadação total (apadrinhamento + lucro brigadeiros)
- **Mobile**: Layout responsivo

---

## Atualizando o App

1. **"Implantar"** → **"Gerenciar implantações"**
2. Lápis ✏ → **"Nova versão"** → **"Implantar"**