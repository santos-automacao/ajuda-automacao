# Catálogo vindo do banco (Supabase) — projeto curto

Data: 26/11/2026 · Situação: aguardando aprovação do dono

## Por que

- Preparar o app para o **plano Pro**: no banco dá para liberar parte do conteúdo só para assinantes (o que vai dentro do app qualquer um copia).
- Corrigir o catálogo (preço errado, produto que saiu de linha) **sem publicar versão nova** do app, no site e no celular.
- Primeiro passo para o banco virar a fonte oficial do catálogo.

## Metas

- O app lê o catálogo (imóveis, cômodos, itens, tipos, produtos, regras, serviços) do Supabase.
- Continua **funcionando sem internet**: usa a última cópia baixada; se nunca baixou, usa o `catalogo.json` que vai junto com o app.
- O eletricista não percebe nada: nenhuma tela nova, nenhuma espera a mais.

## Fora deste trabalho

- Login, orçamentos na nuvem, "mais escolhidos" (próximos passos).
- Conteúdo só para assinantes (a estrutura fica pronta, a regra vem com o login).
- Tela de administrador e trocar a fonte do catálogo para o banco.

## O que não pode acontecer

- O catálogo mudar **no meio de um orçamento** e a lista recomendada mudar sozinha.
- O app travar ou ficar em branco sem internet ou com o Supabase fora do ar.
- Um download incompleto ou vazio apagar o catálogo que funcionava.

## Caminhos considerados

- **A) Planilha continua sendo onde se edita; o app lê do banco** — escolhido pelo dono (26/11/2026). Muda pouco, a skill mensal continua igual.
- B) Banco vira a fonte já (editar no painel do Supabase) — adiado: exigiria reescrever a skill e os scripts antes do login e dos orçamentos.

## Como funciona (decisões)

1. **Caminho dos dados:** planilha → `npm run dados` → `catalogo.json` (vai no app, reserva) e `supabase/seed/catalogo.sql` → aplicado no banco → app baixa.
2. **Quando o catálogo novo vale:** ao abrir, o app usa a cópia guardada (ou o `catalogo.json`) **na hora**. Em segundo plano baixa do banco e guarda; a versão nova passa a valer **na próxima vez que o app abrir**. *(Decisão do Claude: evita espera na abertura e evita mudar a lista no meio do orçamento.)*
3. **Escolha da cópia:** entre a cópia baixada e o `catalogo.json` do app, vale a **mais nova** (pela data de geração). Assim, um app atualizado (novo deploy ou EAS Update) nunca fica preso a uma cópia velha.
4. **Conferência antes de guardar:** só guarda o download se todas as tabelas vieram e não estão vazias; senão mantém o que tinha.
5. **Data do catálogo no banco:** precisa existir uma data de geração no banco (a mesma do `catalogo.json`) para a comparação do item 3. *(Decisão do Claude: guardar numa tabela pequena de informações do catálogo, preenchida pelo `catalogo.sql`.)*
6. **Acesso ao banco:** biblioteca oficial `@supabase/supabase-js` (será usada também no login). Endereço e chave pública do projeto em variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY`, configuradas também na Vercel e no GitHub Pages. A chave pública pode ficar no app; a segurança vem das regras do banco (RLS), que já deixam o catálogo só para leitura.
7. **Formato:** o banco usa nomes como `tipo_padrao`; o app continua recebendo o mesmo formato de hoje (`tipoPadrao`). A conversão fica num lugar só.

## Como saber que deu certo

- O catálogo montado a partir do banco é **igual** ao `catalogo.json` (tirando a data de geração).
- Fluxo completo no navegador em 390 px e 1366 px, com internet e **sem internet** (antes e depois de já ter baixado uma vez).
- `npm run tipos`, `npm run lint`, `npm run exportar-web` passando.

## Fica a cargo de quem programar

- Como as telas acessam o catálogo depois de carregado (hoje importam direto o arquivo).
- Detalhes da conferência do item 4 e do nome da chave no armazenamento do aparelho.
