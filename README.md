# Ajuda Automação

Assistente para o **eletricista planejar automação residencial**: levantamento por cômodo, recomendação de equipamentos homologados, análise elétrica (disjuntor, neutro, DR), proposta em PDF pelo WhatsApp e guia de instalação.

> **Protótipo** — sem banco de dados e sem login. O projeto fica salvo só no aparelho. Os produtos do catálogo ainda estão em verificação.

**Testar no navegador (celular ou notebook):** https://grs2001.github.io/ajuda-automacao/

## Como rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 22 ou mais novo.

```bash
git clone https://github.com/GRS2001/ajuda-automacao.git
cd ajuda-automacao
npm install
npm run web        # abre no navegador (http://localhost:8081)
```

No celular: instale o app **Expo Go**, rode `npm start` e leia o QR Code.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run web` | Abre o app no navegador, atualizando a cada alteração |
| `npm start` | Servidor para testar no celular com Expo Go |
| `npm run dados` | Lê a planilha do catálogo e os desenhos SVG e gera `src/dados/` |
| `npm run tipos` | Confere os tipos do TypeScript |
| `npm run lint` | Confere o padrão do código |
| `npm run exportar-web` | Gera o site estático em `dist/` |

## Como o projeto está organizado

```
src/app/             telas (cada arquivo é uma tela — Expo Router)
  index.tsx            início
  projeto/imovel.tsx   passo 1 — tipo de imóvel
  projeto/comodos.tsx  passo 2 — cômodos
  projeto/itens.tsx    passo 3 — o que automatizar em cada cômodo
  projeto/perguntas.tsx passo 4 — perguntas da instalação
  projeto/lista.tsx    passo 5 — equipamentos recomendados
  projeto/valores.tsx  passo 6 — valores e dados
  projeto/proposta.tsx proposta, PDF e WhatsApp
  projeto/instalacao.tsx guia de instalação
src/componentes/     peças visuais (botões, contador − / +, tela padrão)
src/logica/          recomendação + regras elétricas, perguntas, PDF, dinheiro
src/estado/          projeto em andamento (salvo no aparelho)
src/dados/           gerado por `npm run dados` — não editar à mão
catalogo/            planilha do catálogo (fonte dos dados)
design/ilustracoes/  desenhos em SVG (originais) e PNG
docs/                escopo do MVP e histórico de decisões
scripts/             gerador de dados
```

## Como mudar o catálogo

1. Edite `catalogo/catalogo-casa.xlsx` (produtos, regras, tipos de aparelho…).
2. Rode `npm run dados`.
3. Confira no navegador com `npm run web`.

Para mudar um desenho, edite o SVG em `design/ilustracoes/svg/` e rode `npm run dados`.

## Publicação

Cada `git push` na branch `main` publica o site no GitHub Pages automaticamente (`.github/workflows/pages.yml`).

## Documentos

- [Escopo do MVP](docs/escopo-mvp.md)
- [Histórico de decisões](docs/decisoes.md)
