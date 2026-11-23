---
name: atualizar-catalogo
description: Revisa o catálogo de equipamentos de automação (catalogo/catalogo-casa.xlsx) — homologação Anatel, INMETRO, tensão, Alexa/Google, garantia no Brasil, preço, saída de linha e produtos novos — e gera um relatório para o dono aprovar. Use na revisão mensal ou quando pedirem para "atualizar o catálogo", "verificar os produtos" ou "procurar equipamentos novos".
---

# Atualizar o catálogo de equipamentos

O app só pode recomendar equipamentos que **podem ser vendidos legalmente no Brasil** e que o
eletricista consegue comprar e instalar. Esta skill pesquisa, confere e **propõe** mudanças.
Quem aprova é o dono (eletricista, responsável técnico). Fale sempre em português do Brasil, simples.

## Dois modos

| Modo | Quando | O que muda no projeto |
|---|---|---|
| **relatório** (padrão) | Revisão mensal, ou quando não disserem o modo | Só cria `relatorios/catalogo-AAAA-MM.md`. **Não toca na planilha.** |
| **aplicar** | Só quando o dono disser "aplica o relatório de <mês>" (ou equivalente) | Passa para a planilha apenas o que ele aprovou |

Na dúvida, use o modo relatório.

## Fontes, em ordem de confiança

1. **Anatel** — número de homologação (12 dígitos, ex.: 01004-25-00160). Desde 08/09/2026 a Anatel usa a
   **Plataforma Certifica** (apps.anatel.gov.br/Certifica/ConsultaPublica.aspx); certificados antigos ficam no
   **SCH** (sistemas.anatel.gov.br/mosaico/sch/publicView/listarProdutosHomologados.xhtml). Em nov/2026 as duas
   consultas pediam login, então use nesta ordem:
   a. Se existir `dados-externos/anatel-homologados.csv` no projeto (dados abertos da Anatel), procure ali
      pelo modelo e pela marca. É a fonte mais forte.
   b. Datasheet ou manual **oficial** do fabricante que traga o número.
   c. Anúncio de loja com o número só vale como pista: marque "número de loja, conferir".
   Se nada funcionar, escreva "não confirmado" — **nunca** invente número.
2. **INMETRO** — consulta de registro de objetos. Obrigatório para tomadas, plugues e adaptadores
   (padrão NBR 14136) e para alguns aparelhos elétricos. Para o resto, escreva "não se aplica" só se tiver certeza.
3. **Fabricante** — página oficial, ficha técnica e manual (PDF). Tensão, corrente/potência máxima,
   precisa de neutro, protocolo (Wi-Fi 2,4 GHz, Zigbee), central, compatibilidade com Alexa/Google, garantia.
4. **Lojas grandes** (site do fabricante, Magalu, Mercado Livre loja oficial, Amazon, KaBuM, Leroy) —
   preço e se ainda está à venda. Anote a data do preço.
5. Notícias e blogs servem só para **descobrir** produtos, nunca como prova de homologação.

## Critério para "pode vender no Brasil"

- **Rádio (Wi-Fi, Zigbee, Bluetooth, RF 433 MHz)** → homologação Anatel obrigatória.
- **Tomada, plugue, adaptador** → INMETRO obrigatório.
- **Garantia e assistência no Brasil** → exigência de qualidade do projeto.
- **Tensão** → 127 V, 220 V ou bivolt, confirmado na ficha técnica.
- Produto importado sem homologação (ex.: vendido só por marketplace estrangeiro) → **reprovado**, mesmo que barato.

## Passo a passo (modo relatório)

1. Leia `src/dados/catalogo.json` (gerado da planilha) para ver os produtos atuais, os tipos de aparelho
   e as colunas. Não edite esse arquivo.
2. Para **cada produto**, preencha uma linha com: o que estava na planilha → o que achou → fonte (link).
   Campos: `anatel`, `inmetro`, `tensao`, `correnteMax`, `potenciaMax`, `neutro`, `protocolo`,
   `alexa`, `google`, `garantiaMeses`, `fabricadoBrasil`, `preco`, `link`, e se ainda está à venda.
3. Sugira um `status` novo: **Pronto para aprovar** (tudo confirmado com fonte oficial),
   **Falta informação** (diga o quê), **Reprovar** (sem Anatel, fora de linha, sem garantia no Brasil).
   Nunca escreva "Verificado" — essa palavra é do dono.
4. **Tipos sem produto**: para cada tipo de aparelho que não tem nenhum produto na planilha, procure
   de 1 a 3 candidatos de marcas com garantia no Brasil, com as mesmas informações.
5. **Novidades**: procure lançamentos do último mês das marcas já usadas (Intelbras, Positivo, Rossi,
   Garen, PPA, NovaDigital, Ekaza…) e de outras marcas com garantia no Brasil.
6. **Alertas para o eletricista**: mudança que afeta as regras elétricas (ex.: modelo novo exige neutro,
   tensão diferente, corrente máxima menor que a anotada). Não mude regras: só avise.
7. Escreva o relatório em `relatorios/catalogo-AAAA-MM.md` no formato abaixo.

## Formato do relatório

```markdown
# Revisão do catálogo — <mês/ano>

Feita em <data>. Modo relatório: a planilha não foi alterada.

## Resumo
- X produtos conferidos: A prontos para aprovar, B com falta de informação, C para reprovar.
- Y produtos novos sugeridos. Z alertas elétricos.

## Produtos da planilha
### P001 — Intelbras EWS 1001 (Interruptor Touch 1 tecla) → Pronto para aprovar
| Campo | Planilha | Encontrado | Fonte |
|---|---|---|---|
| Anatel | Verificar | 12345-21-00160 | <link> |
...
Observação: ...

## Produtos novos sugeridos
(mesma tabela, com o tipo de aparelho)

## Alertas elétricos
## Não consegui confirmar
(lista honesta do que ficou sem fonte e por quê)

## Para aprovar
Responda, por exemplo: "aprovo P001, P004 e os novos N1 e N3; reprova P008".
```

## Modo aplicar

1. Leia o relatório indicado e a resposta do dono. Aplique **só** o que ele aprovou.
2. Edite `catalogo/catalogo-casa.xlsx` (aba Produtos) preservando as outras abas e formatações.
   Status aprovado → `Verificado`, `Verificado em` → data de hoje. Produtos novos ganham o próximo ID livre.
3. Rode `npm run dados`, depois `npm run tipos` e `npm run lint`.
4. Registre em `docs/decisoes.md` (com data) o que entrou, o que saiu e por quê.
5. Faça um commit em português numa branch `catalogo/AAAA-MM` e abra um pull request. Não envie direto
   para a `main` (o push na `main` publica o site).

## Regras que não mudam

- Fonte para tudo. Sem fonte, o campo fica "Verificar".
- Comissão de afiliado **nunca** influencia a sugestão ou a ordem.
- Não altere regras elétricas, telas ou código do app nesta skill.
- Seja honesto no relatório sobre o que não deu para conferir.
