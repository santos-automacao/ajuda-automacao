# Revisão do catálogo — novembro/2026 (TESTE)

Feita em 23/11/2026. **Modo relatório: a planilha não foi alterada.**
Teste da skill `atualizar-catalogo` com uma amostra de 4 produtos e 1 produto novo, não o catálogo inteiro.

## Resumo

- 4 produtos conferidos: 0 prontos para aprovar, 4 com falta de informação, 0 para reprovar.
- 1 produto novo sugerido (tipo sem produto na planilha: tomada de embutir).
- 2 alertas: o app da Intelbras mudou de nome, e "Smart Fechadura Positivo" hoje são vários modelos diferentes.
- **Descoberta importante:** a consulta pública da Anatel passou a pedir login (veja "Não consegui confirmar").

## Produtos da planilha

### P001 — Intelbras EWS 1001 (Interruptor Touch 1 tecla) → Falta informação

| Campo | Planilha | Encontrado | Fonte |
|---|---|---|---|
| Tensão | Verificar | 100–240 V~ 50/60 Hz (bivolt) | Manual 01/26 do fabricante |
| Corrente máx. | Verificar | 10 A (FP=1) | Manual 01/26 |
| Potência máx. | Verificar | 1270 W em 127 V · 2200 W em 220 V | Manual 01/26 |
| Neutro | Sim (fabricante) | Sim. O neutro do produto deve ser o mesmo das lâmpadas | Manual 01/26 |
| Protocolo | Wi-Fi 2,4 GHz | Wi-Fi 802.11 b/g/n 2,4 GHz | Manual 01/26 |
| App | Izy Smart | **Mibo Smart** | Manual 01/26 |
| Alexa / Google | Verificar | Não informado no manual | — |
| Garantia | — | 12 meses (9 contratual + 3 legal) | Manual 01/26 |
| Fabricado no Brasil | Verificar | **Não**: origem China, importado pela Intelbras | Manual 01/26 |
| Preço | — | R$ 135,90 (loja oficial, 23/11/2026) | loja.intelbras.com.br |
| Anatel | Verificar | **Não confirmado**: o manual só manda consultar o site da Anatel | — |

Manual: https://backend.intelbras.com/sites/default/files/2026-01/Manual_EWS_1001_01-26_site.pdf

Observação: a Intelbras tem uma página "EWS 1001 & EIW 1001". Parece haver um modelo novo (EIW 1001), e o dono precisa decidir qual cadastrar.

### P013 — Rossi DZ Atto Turbo Wi-Fi (motor deslizante 350 kg) → Falta informação

| Campo | Planilha | Encontrado | Fonte |
|---|---|---|---|
| Tensão | Verificar | Versões separadas de **127 V e 220 V** (não é bivolt) | Anúncios Casas Bahia / Extra |
| Potência | — | 1/5 CV, portão até 350 kg, 20 ciclos/hora, IP44 | Casas Bahia |
| Wi-Fi | — | Módulo "Simply Connect" incluso no kit | Casas Bahia |
| Preço | — | Versão sem Wi-Fi a partir de ~R$ 458; versão Wi-Fi sem preço confiável encontrado | Magalu (busca) |
| Anatel | Verificar | **Não confirmado** | — |
| Alexa / Google | Verificar | Não confirmado em fonte oficial da Rossi | — |

Alerta elétrico: o motor tem tensão fixa. A regra "motor com a mesma tensão da casa" já cobre isso, mas a planilha precisa ter **uma linha por tensão** (ou um campo para indicar a versão).

### P018 — Positivo "Smart Fechadura Digital" → Falta informação (modelo ambíguo)

Hoje existem pelo menos quatro fechaduras Positivo diferentes:

| Modelo | Conexão | Garantia | Anatel | Fonte |
|---|---|---|---|---|
| Smart Fechadura (2022, troca o cilindro) | Bluetooth 5.0 (Wi-Fi com o kit) | — | não visto | Canaltech, 2022 |
| Smart Fechadura Wi-Fi **de Embutir** | Wi-Fi 2,4 GHz + Bluetooth 4.2, sem central | 12 meses | "Certificações: Anatel" (sem número) | Fast Shop |
| Smart Fechadura Wi-Fi **de Sobrepor** | Wi-Fi | 12 meses | 101972415977 (anúncio de loja, **não oficial**) | Casas Bahia |
| Fechadura Digital de Sobrepor com teclado touch | não informado | 12 meses | não visto | Casas Bahia (vendido pela Positivo, R$ 239) |

**Para decidir:** qual (ou quais) entram no catálogo. A versão de 2022 provavelmente não serve mais como recomendação principal.

### P020 — Intelbras Mibo iM5 S (câmera externa) → não conferido neste teste

Ficou fora da amostra por tempo. Entra na primeira rodada completa.

## Produtos novos sugeridos

### N1 — Intelbras ETW 1001 · Tomada Inteligente Wi-Fi de embutir (tipo TOMADA_EMBUTIR, hoje sem produto)

| Campo | Encontrado | Fonte |
|---|---|---|
| Instalação | Caixa 4×2 | Datasheet do fabricante |
| Neutro | **Requer fio neutro** | Datasheet |
| Protocolo | Wi-Fi 802.11 b/g/n 2,4 GHz + Bluetooth 5.1 | Datasheet |
| App | Mibo Smart | Datasheet |
| Anatel | **01004-25-00160** | Datasheet oficial Intelbras |
| Corrente máx. / INMETRO | **Falta conferir** (tomada → INMETRO obrigatório) | — |

Datasheet: https://backend.intelbras.com/sites/default/files/2026-03/ETW%201001%20-%20Datasheet%2008.10.pdf

## Alertas

1. **App da Intelbras mudou de "Izy Smart" para "Mibo Smart"** nos manuais de 2026. O texto do app e do PDF que cita "Izy Smart" precisa mudar, e é preciso conferir se a coluna `app` dos outros produtos Intelbras também mudou.
2. **Origem dos produtos:** o EWS 1001 é fabricado na China. "Marca com garantia no Brasil" continua valendo, mas o selo "Fabricado no Brasil" não se aplica.

## Não consegui confirmar

- **Consulta da Anatel:** desde 08/09/2026 a Anatel usa a Plataforma Certifica no lugar do SCH. Tentei as duas consultas públicas pelo navegador e **as duas pediram login** (gov.br / SSO da Anatel). O arquivo de dados abertos da Anatel (lista de homologados em CSV) é bloqueado no ambiente onde eu rodo.
  - Neste teste, o número de homologação só foi confirmado quando o **datasheet oficial do fabricante** trazia o número (caso do ETW 1001).
- Compatibilidade com Alexa/Google: nenhuma confirmada em fonte oficial nesta amostra.

## Para aprovar

Este relatório é só teste: nada será aplicado. Diga o que achou do formato e do nível de detalhe e decida:
1. Fechadura Positivo: qual modelo cadastrar?
2. Rossi: uma linha por tensão (127 V / 220 V)?
3. Intelbras: EWS 1001 ou o novo EIW 1001?
