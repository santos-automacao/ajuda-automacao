# Catálogo vindo do banco — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o app passa a ler o catálogo do Supabase, guardando uma cópia no aparelho, sem perder o funcionamento sem internet.

**Architecture:** um módulo puro (`catalogoBanco.ts`) converte as linhas do banco no mesmo formato do `catalogo.json`. Ao abrir, o app aplica a cópia guardada (se for mais nova que a do app) antes de mostrar as telas e, em segundo plano, baixa do banco e guarda para a próxima abertura. As telas continuam importando `catalogo` de `@/dados/catalogo`; o objeto é atualizado no lugar.

**Tech Stack:** Expo SDK 58, TypeScript, `@supabase/supabase-js`, AsyncStorage, testes com `node --test` (Node 26 roda `.ts` direto).

**Spec:** [docs/superpowers/specs/2026-11-26-catalogo-do-banco-design.md](../specs/2026-11-26-catalogo-do-banco-design.md)

## Global Constraints

- Funciona sem internet; abrir o app **nunca** espera o banco (só o AsyncStorage, como hoje).
- Catálogo novo baixado vale **na próxima abertura**, nunca no meio da sessão.
- Entre cópia guardada e `catalogo.json` do app, vale a de `geradoEm` mais novo; empate → a do app.
- Download incompleto/vazio/inválido nunca substitui o que existe.
- Não editar `src/dados/catalogo.json` à mão; ele continua vindo de `npm run dados`.
- Antes de usar qualquer API do Expo/Supabase no app, ler a doc da versão (AGENTS.md): `https://docs.expo.dev/versions/v58.0.0/` e o guia de Supabase da Expo. Instalar pacotes com `npx expo install`.
- Commits em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Textos para o usuário: nenhum novo nesta entrega.

## Review Focus

1. Supabase fora do ar ou lento ao abrir → o app abre na hora com a cópia guardada/do app (Task 4, teste "sem banco").
2. Cópia guardada corrompida (JSON quebrado ou faltando tabela) → ignora e usa o `catalogo.json` (Task 2 `catalogoValido`, Task 4 teste "cópia corrompida").
3. Download chega no meio do orçamento → lista recomendada não muda até reabrir (Task 4, teste "mesma sessão").
4. Deploy novo com `catalogo.json` mais novo que a cópia guardada → vale o do app (Task 2 `maisNovo`).
5. Build sem as variáveis do Supabase → app funciona com o `catalogo.json`, sem erro na tela (Task 3, cliente devolve `null`).

---

### Task 1: Banco completo para remontar o catálogo

O banco hoje perde informação: `imoveis` e `tipos_aparelho` sem ordem, `produtos.teclas` só aceita número ("Verificar"/"—" viram nulo) e não existe a data de geração.

**Files:**
- Create: `supabase/migrations/20261126000000_catalogo_do_banco.sql`
- Modify: `scripts/gerar-sql-catalogo.mjs`
- Regenerate: `supabase/seed/catalogo.sql` (via `npm run dados`)

**Interfaces:**
- Produces (banco): `imoveis.ordem int`, `tipos_aparelho.ordem int`, `produtos.teclas text`, tabela `catalogo_info (id int primary key default 1 check (id = 1), gerado_em timestamptz not null)` com RLS ligada e policy `"catalogo leitura"` para `anon, authenticated`.

- [ ] **Step 1:** escrever a migração com os 4 itens acima (`alter table ... add column ordem int not null default 0`; `alter column teclas type text using teclas::text`).
- [ ] **Step 2:** no gerador: `ordem` = posição na lista + 1 para `imoveis` e `tipos_aparelho`; `teclas` gravado como texto (`v(p.teclas)`); acrescentar upsert de `catalogo_info` com `(1, cat.geradoEm)`.
- [ ] **Step 3:** `npm run dados` → confere que `catalogo.sql` tem `catalogo_info` e que só mudaram as linhas esperadas (`git diff --stat`).
- [ ] **Step 4:** aplicar a migração no projeto `wobnvnsmzwwcwmdrntkp` (Supabase MCP `apply_migration`) e depois o `catalogo.sql` (`execute_sql`).
- [ ] **Step 5:** verificar com SQL: contagens = 3 imóveis, 10 cômodos, 9 itens, 20 tipos, 37 produtos, 17 regras, 19 serviços; `select gerado_em from catalogo_info` = `geradoEm` do `catalogo.json`; `select count(*) from produtos where teclas = 'Verificar'` > 0. Rodar `get_advisors` (security) e conferir que não há aviso novo.
- [ ] **Step 6:** commit "Banco guarda ordem, teclas em texto e data do catálogo".

### Task 2: Conversão banco → catálogo (módulo puro, com testes)

**Files:**
- Modify: `src/dados/catalogo.ts` (exportar `interface Catalogo`)
- Create: `src/dados/catalogoBanco.ts` — sem imports de runtime (só `import type`), para rodar no Node.
- Create: `scripts/testes/catalogoBanco.test.mjs`
- Modify: `package.json` — script `"testes": "node --test scripts/testes/"`

**Interfaces:**
- Produces:
  - `type LinhasBanco = { catalogo_info: {gerado_em: string}[]; imoveis: Linha[]; comodos: Linha[]; itens: Linha[]; tipos_aparelho: Linha[]; produtos: Linha[]; regras_eletricas: Linha[]; servicos: Linha[] }` (`Linha = Record<string, unknown>`)
  - `TABELAS_CATALOGO: (keyof LinhasBanco)[]`
  - `buscarLinhas(cliente: SupabaseClient): Promise<LinhasBanco>` — `select('*')` de cada tabela em paralelo; lança erro se alguma falhar.
  - `montarCatalogo(l: LinhasBanco): Catalogo`
  - `catalogoValido(c: unknown): c is Catalogo` — todas as 7 listas são arrays não vazios e `geradoEm` é data válida.
  - `maisNovo(doApp: Catalogo, outro: Catalogo | null): Catalogo`

Regras de `montarCatalogo` (decididas aqui):
- snake_case → nomes atuais do `catalogo.ts` (`para_que`→`paraQue`, `servicos.nome`→`servico`, `valor_referencia`→`valor`, `foto_url`→`fotoUrl`...). Colunas sem par no app (`preco_em`, `atualizado_em`, `servico_id`, `ordem` de imóveis/tipos) ficam de fora.
- Ordem: `ordem` para imóveis, tipos, cômodos e itens; `id` para produtos, regras e serviços.
- `correnteMax`, `potenciaMax`, `teclas`: texto só com número (`/^-?\d+(\.\d+)?$/`) vira `number`; o resto fica texto.
- `itens.tipo_padrao` nulo → `'(pelo cômodo)'` (valor da planilha).
- `comodos.sugestao_<item>` → `sugestao: { luz, tomada, ... }`.
- `geradoEm` = `catalogo_info[0].gerado_em` convertido para ISO (`new Date(x).toISOString()`).

- [ ] **Step 1: testes** (`node:test` + `assert/strict`), com linhas pequenas montadas no próprio teste:
  - `converte nomes e números`: produto com `corrente_max: '10'`, `potencia_max: '1270 (127 V) / 2200 (220 V)'`, `teclas: 'Verificar'` → `correnteMax === 10`, `potenciaMax` igual ao texto, `teclas === 'Verificar'`; serviço `{nome:'X', valor_referencia: null}` → `{servico:'X', valor:null}`.
  - `ordena`: imóveis com ordem 2,1 entregues fora de ordem → `['casa','apartamento']`; produtos `P002, P001` → `P001` primeiro.
  - `tipo padrão do sensor`: `tipo_padrao: null` → `'(pelo cômodo)'`.
  - `sugestão do cômodo`: `sugestao_luz: 2` → `sugestao.luz === 2`.
  - `catalogoValido`: falso para `null`, para `'{}'`, para catálogo com `produtos: []`, para `geradoEm: 'abc'`; verdadeiro para o `catalogo.json` real.
  - `maisNovo`: outro mais novo → outro; igual → doApp; `null` → doApp.
- [ ] **Step 2:** `npm run testes` → falha (módulo não existe).
- [ ] **Step 3:** implementar `catalogoBanco.ts`.
- [ ] **Step 4:** `npm run testes` → passa; `npm run tipos` e `npm run lint` passam.
- [ ] **Step 5:** commit "Conversão do catálogo do banco para o formato do app".

### Task 3: Cliente Supabase e prova de que o banco = planilha

**Files:**
- Install: `npx expo install @supabase/supabase-js` (+ o que o guia de Supabase da Expo SDK 58 pedir)
- Create: `.env` (commitado — os valores são públicos): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (chave *publishable*, via MCP `get_project_url` / `get_publishable_keys`). Assim Vercel e GitHub Pages recebem sem configurar nada. **Nunca** a chave `service_role`/secret.
- Create: `src/dados/supabase.ts`
- Create: `scripts/comparar-catalogo-banco.mjs`; script npm `"comparar-catalogo": "node --env-file=.env scripts/comparar-catalogo-banco.mjs"`

**Interfaces:**
- Consumes: `buscarLinhas`, `montarCatalogo` (Task 2).
- Produces: `supabase: SupabaseClient | null` em `src/dados/supabase.ts` — `null` quando faltar alguma variável (Review Focus 5). Sem sessão de login por enquanto (`auth.persistSession: false`); o login muda isso depois.

- [ ] **Step 1:** instalar e criar `.env` e `supabase.ts`.
- [ ] **Step 2:** script de comparação: busca as linhas, monta, compara campo a campo com `src/dados/catalogo.json` e imprime cada diferença (`produtos[P001].teclas: 1 ≠ '1'`). Sai com código 1 se houver diferença.
- [ ] **Step 3:** `npm run comparar-catalogo` → "Catálogo do banco igual ao catalogo.json". Se aparecer diferença, corrigir a conversão (Task 2, com teste novo) ou o gerador (Task 1), não o script.
- [ ] **Step 4:** `npm run tipos`, `npm run lint` passam. Commit "Cliente Supabase e comparação banco x planilha".

### Task 4: App usa a cópia guardada e baixa em segundo plano

**Files:**
- Modify: `src/dados/catalogo.ts` — `usarCatalogo(novo: Catalogo): void` troca o conteúdo do objeto `catalogo` no lugar (`Object.assign`) e atualiza `ITENS` (`splice`), para que os imports atuais continuem valendo.
- Create: `src/dados/sincronizarCatalogo.ts`
- Modify: `src/estado/projeto.tsx` — no efeito que lê o AsyncStorage (linha ~199): `await carregarCatalogoGuardado()` antes de marcar `carregado`; depois disso chamar `baixarCatalogo()` sem `await`.

**Interfaces:**
- Consumes: `catalogoValido`, `maisNovo`, `buscarLinhas`, `montarCatalogo` (Task 2), `supabase` (Task 3).
- Produces:
  - `CHAVE_CATALOGO = 'ajuda-automacao:catalogo'`
  - `carregarCatalogoGuardado(): Promise<void>` — lê a chave; se válida e mais nova que o `catalogo.json`, `usarCatalogo`. Qualquer erro → não faz nada.
  - `baixarCatalogo(): Promise<void>` — se `supabase` for `null`, sai; busca, monta, valida; guarda **só** se for mais novo que o que já está guardado e que o do app. Nunca chama `usarCatalogo`. Erros engolidos (`console.warn` só em desenvolvimento).

- [ ] **Step 1:** implementar e ligar na abertura.
- [ ] **Step 2:** `npm run tipos`, `npm run lint`, `npm run testes`, `npm run exportar-web` passam.
- [ ] **Step 3: testes no navegador** (Edge via Playwright, como no teste de 25/11; roteiro em pasta temporária, fora do projeto), em 390 px e 1366 px, servindo o `dist`:
  - *online:* fluxo até a lista igual ao de antes; depois de ~3 s, `localStorage['ajuda-automacao:catalogo']` existe e tem 37 produtos.
  - *sem banco:* bloquear `*.supabase.co` (`page.route(..., r => r.abort())`), contexto novo → fluxo completo funciona, sem erro no console, sem demora visível.
  - *cópia corrompida:* gravar `'{quebrado'` na chave antes de abrir → fluxo completo funciona.
  - *mesma sessão:* gravar na chave um catálogo válido com `geradoEm` no futuro e um produto a menos, **sem** recarregar → lista não muda; recarregar → passa a usar o guardado.
- [ ] **Step 4:** commit "App lê o catálogo do banco e guarda cópia para usar sem internet".

### Task 5: Documentação e entrega

**Files:**
- Modify: `docs/decisoes.md` — entrada 26/11/2026: opção A (planilha edita, app lê do banco), cópia vale na próxima abertura, mais novo vence, `.env` com chave pública commitado, motivos (Pro, corrigir sem versão nova); correção: backup do plano grátis do Supabase é limitado → assinar o Pro quando houver assinantes.
- Modify: `CLAUDE.md` — "Onde paramos": PR #1 juntado (25/11), Vercel publica sozinho a cada push na `main`, GitHub Pages agora em `https://santos-automacao.github.io/ajuda-automacao/` (a confirmar), catálogo do banco feito; próximo: login. Em "Como trabalhamos": depois de `npm run dados`, aplicar `supabase/seed/catalogo.sql` no banco e rodar `npm run comparar-catalogo`.
- Modify: `.claude/skills/atualizar-catalogo/SKILL.md` — mesmo passo depois de gerar os dados.

- [ ] **Step 1:** escrever os três.
- [ ] **Step 2:** verificação final: `npm run testes`, `npm run tipos`, `npm run lint`, `npm run exportar-web`, `npm run comparar-catalogo`.
- [ ] **Step 3:** commit "Documenta o catálogo vindo do banco". Push e pull request **só com o ok do dono**.
