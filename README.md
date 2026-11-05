# Pedro Morais · Finanças

Site (celular e computador) + assistente no WhatsApp. Sem dependências para instalar.

```
public/   o site (index.html, manifest e ícones)
api/      state.js (salva/lê os dados) · whatsapp.js (recebe suas mensagens)
supabase.sql
```

## 1. Banco de dados (Supabase, plano grátis)
1. Crie um projeto em supabase.com.
2. **SQL Editor** → cole o conteúdo de `supabase.sql` → Run.
3. **Project Settings → API**: copie a *Project URL* e a chave *service_role* (secreta: nunca coloque no site).

## 2. Publicar (Vercel, plano grátis)
1. Suba esta pasta para um repositório no GitHub e importe em vercel.com (Framework: *Other*, sem build).
2. Em **Settings → Environment Variables** cadastre:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_KEY` | chave service_role (ou a *secret key*, se o seu Supabase mostrar só essa) |
| `ANTHROPIC_API_KEY` | chave de console.anthropic.com (usada para entender as mensagens) |
| `WA_VERIFY_TOKEN` | um texto qualquer que você inventar |
| `WA_APP_SECRET` | App Secret do app da Meta |
| `WA_TOKEN` | token de acesso do WhatsApp (Meta) |
| `WA_PHONE_ID` | ID do número de telefone (Meta) |
| `ALLOWED_PHONE` | seu número só com dígitos, com DDI e DDD (ex.: 5511999999999) |
| `CLAUDE_MODEL` | opcional (padrão: claude-haiku-5-5) |

3. Faça o **Redeploy**, abra o endereço do site e entre com o seu usuário e senha (já estão no arquivo `api/state.js`; para trocar, cadastre `APP_USER` e `APP_PASSWORD` na Vercel).
4. Em **Configurações** (menu ☰) coloque os nomes dos seus cartões e empresas.

## 3. Atalho na tela de início
- iPhone (Safari): Compartilhar → **Adicionar à Tela de Início**.
- Android (Chrome): ⋮ → **Instalar app** / **Adicionar à tela inicial**.

## 4. WhatsApp (API oficial da Meta)
1. Em developers.facebook.com crie um app do tipo *Business* e adicione o produto **WhatsApp**.
2. Em *API Setup* use o número de teste da Meta (ou registre o seu) e adicione o seu celular como destinatário. Copie o *Phone number ID* (`WA_PHONE_ID`).
3. Gere um token permanente (Business Settings → System Users) e use em `WA_TOKEN`. O token temporário vale só 24 h.
4. Em *App settings → Basic* copie o App Secret (`WA_APP_SECRET`).
5. Em *WhatsApp → Configuration → Webhook*: URL `https://SEU-SITE.vercel.app/api/whatsapp`, token = `WA_VERIFY_TOKEN`; depois assine o campo **messages**.
6. Mande uma mensagem para o número. Exemplos:
   - `gastei 85 no mercado no Nubank`
   - `comprei tv 1200 em 6x no Itaú`
   - `paguei 500 da fatura do Itaú`
   - `recebi 3000 da Empresa A` · `despesa 800 fornecedor Empresa B`
   - `pix 250 mecânico` · `boleto 120 internet`
   - `meu irmão parcelou 900 em 3x no Inter`

Observações:
- Só o número em `ALLOWED_PHONE` é aceito, e toda chamada do webhook tem a assinatura da Meta conferida.
- Números do Brasil às vezes chegam sem o 9 extra (ex.: 551199999999). Se o assistente não responder, veja os logs na Vercel e ajuste `ALLOWED_PHONE`.
- Custos da Meta e da Anthropic mudam: confira as tabelas de preços atuais.
- Os dados ficam em uma única linha do Supabase. O site recarrega ao voltar para o app, então lançamentos feitos pelo WhatsApp aparecem ao reabrir.

## Solução de problemas
- Mantenha o repositório **privado**: o usuário e a senha ficam em `api/state.js`.
- Depois de criar ou mudar variáveis na Vercel, é preciso **publicar de novo** (um novo commit no GitHub, ou Implantações → Reimplantar). Só recarregar a página não basta.
- Abra `https://SEU-SITE.vercel.app/api/state` no navegador:
  - "Faltam as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY…" → cadastre as duas na Vercel e publique de novo.
  - `{"error":"unauthorized"}` → as variáveis existem; confira se usuário e senha digitados são iguais aos cadastrados.
  - "Page not found" → as pastas `api` e `public` precisam estar na raiz do repositório.
- "Erro no servidor" com texto do Supabase → confira `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` e se rodou o `supabase.sql`.
