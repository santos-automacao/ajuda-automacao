# Ajuda Automação — contexto para o Claude

@AGENTS.md

Este arquivo é a memória do projeto. Ele vai junto no repositório para que qualquer computador (casa ou trabalho) continue de onde parou. Leia também [docs/decisoes.md](docs/decisoes.md) e [docs/escopo-mvp.md](docs/escopo-mvp.md).

## O projeto

App (celular + site) que ajuda o eletricista a planejar **automação residencial**:
levantamento por cômodo → recomendação de equipamentos homologados → análise elétrica (disjuntor, neutro, DR) → proposta em PDF pelo WhatsApp → guia de instalação.
A ideia veio do app "Meu Ajudante" (orçamento de elétrica), mas aqui o foco é o **projeto técnico**, não só o orçamento.

## Quem é o dono

- É **eletricista** e programador. Vem de C# ASP.NET MVC e está aprendendo TypeScript/React Native.
- Fale sempre em **português do Brasil**, de forma simples.
- Ao explicar TypeScript/React, compare com C#/ASP.NET quando ajudar.
- Em assuntos elétricos (NBR 5410, disjuntor, neutro, DR) ele tem experiência de campo: peça a validação dele em vez de afirmar regras como definitivas.
- **Público do app:** eletricistas, inclusive os mais velhos, com pouca prática no celular.

## Como trabalhamos

1. Conversar e decidir antes de programar. Registrar cada decisão em `docs/decisoes.md` (com data).
2. O escopo vivo fica em `docs/escopo-mvp.md`.
3. A planilha `catalogo/catalogo-casa.xlsx` é a fonte dos dados. `npm run dados` gera `src/dados/` (não editar `src/dados/` à mão).
4. Antes de dizer que terminou: `npm run tipos`, `npm run lint`, `npm run exportar-web` e testar o fluxo no navegador em tamanho de celular (390 px) e de notebook (1366 px).
5. Commits em português. `git push` na `main` publica o site no GitHub Pages.

## Regras de tela (não quebrar)

- Uma pergunta por tela. Botões grandes (mínimo 60 px), sempre com desenho e texto.
- Um só padrão de linha: `[desenho] Nome  [ − ] 2 [ + ]`.
- Nada de digitar no levantamento; só no passo 6 (nomes, telefones, valores).
- Barra fixa embaixo com "← Voltar" e "Continuar →".
- Palavras de eletricista, não de informática ("teclas do interruptor", "fio neutro", "127 V (110)").
- Funciona sem internet; salva sozinho a cada toque.

## Estado atual (18/11/2026)

- **Protótipo navegável pronto**, sem banco e sem login: https://grs2001.github.io/ajuda-automacao/
- Fluxo: Início → Imóvel (só Casa) → Cômodos → Itens por cômodo → Perguntas da instalação → Lista recomendada → Valores → Proposta (PDF + WhatsApp) → Guia de instalação.
- Regras elétricas R01–R17 implementadas em `src/logica/recomendar.ts` (o dono aprovou as regras em 18/11/2026).
- **Sugestões de itens por cômodo: adiadas** (`USAR_SUGESTOES = false` em `src/estado/projeto.tsx`). Os itens começam em zero.
- Valores de mão de obra: o eletricista digita no passo 6 e o app lembra no aparelho.
- Testado no navegador (Edge) em celular e notebook. **Não testado ainda no celular com Expo Go** (desenhos via react-native-svg e PDF via expo-print).

## Próximos passos

1. Testar o protótipo com 3 a 5 eletricistas (de preferência os mais velhos) e anotar onde travam.
2. Verificar os produtos da planilha (número Anatel + manual) e cadastrar o que falta: tomada inteligente de embutir, motor de cortina, sensores de gás/vazamento/abertura/fumaça, central Zigbee.
3. Ajustar as telas conforme o teste.
4. Depois: Supabase (catálogo e login), sincronização na nuvem, link para o cliente aprovar, 3 pacotes, Apartamento e Comércio.

## Tecnologia

- **Expo SDK 58** (React Native 0.88, React 19.3, Expo Router, TypeScript). Telas em `src/app/`.
- Web: `web.output = "single"`; no GitHub Pages o endereço-base vem da variável `BASE_URL` (ver `app.config.ts` e `.github/workflows/pages.yml`).
- Armazenamento local: `@react-native-async-storage/async-storage`.
- PDF: no navegador abre a janela de impressão (`src/logica/pdf.web.ts`); no celular usa expo-print + expo-sharing (`src/logica/pdf.ts`).
- Desenhos: SVG em `design/ilustracoes/svg/`, convertidos em `src/dados/ilustracoes.ts`. No navegador viram imagem (`Ilustracao.web.tsx`); no celular, react-native-svg (`Ilustracao.tsx`).
- Planilha lida com `read-excel-file` (o exceljs falha com planilhas que têm imagens).

## Decisões de produto (resumo — detalhes em docs/decisoes.md)

- O app **planeja e recomenda**; o controle da casa fica na **Alexa ou Google Home** (cada marca tem app próprio).
- Qualidade: homologação Anatel obrigatória, INMETRO quando aplicável, marca com garantia no Brasil. Selo "Fabricado no Brasil" só quando confirmado.
- Monetização: grátis para o eletricista → links de afiliado → plano Pro depois. A comissão **nunca** muda a ordem da recomendação.
- Fases: 1) Casa com luz, tomada, cortina, ar/TV (infravermelho), portão, fechadura, câmera, sensor · 2) apartamento, comércio, pacotes, aprovação online · 3) solar, pós-venda, parcerias.
