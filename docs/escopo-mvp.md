# Ajuda Automação — Escopo do MVP

> Nome provisório. Documento de planejamento, versão 3 — 18/11/2026.
> Arquivos relacionados: [catálogo](../catalogo/catalogo-casa.xlsx) · [ilustrações](../design/ilustracoes/) · [histórico de decisões](decisoes.md)
> **Protótipo navegável:** Vercel (`*.vercel.app`, principal) · reserva https://grs2001.github.io/ajuda-automacao/ (sem banco e sem login)

## 1. Visão

**Problema.** O eletricista que quer trabalhar com automação esbarra em três dúvidas: quais aparelhos escolher, se funcionam juntos e como instalar sem erro. O cliente recebe uma lista de produtos que não entende.

**Solução.** Um assistente que vai do levantamento da casa ao PDF da proposta, e depois guia a instalação.

**Diferencial.** O Meu Ajudante e o Fechou fazem orçamento. Este app faz o **projeto técnico**: sabe que interruptor inteligente precisa de neutro, que ar-condicionado novo precisa de disjuntor próprio e quais aparelhos funcionam juntos. O orçamento é consequência do projeto.

**Para quem.** Eletricistas, incluindo os mais velhos, com pouca prática no celular. Essa é a regra que guia todas as telas.

### Decisões tomadas

| Tema | Decisão |
|---|---|
| Primeira versão | Só **Casa**, do levantamento até o **PDF** enviado no WhatsApp, mais o guia de instalação |
| O que automatizar | Luz, tomada, cortina, ar-condicionado, TV, portão, fechadura, câmera, sensor |
| App de controle do cliente | **Alexa ou Google Home.** Cada marca tem o próprio app (Intelbras = Izy Smart, Positivo = Positivo Casa Inteligente, motores de portão = apps próprios). O que une tudo num app só é o assistente de voz |
| Qualidade | Obrigatório: homologação Anatel, INMETRO quando aplicável, marca com garantia no Brasil. Selo "Fabricado no Brasil" quando confirmado |
| Tecnologia | Expo (React Native) + Supabase, tudo em TypeScript. Atualizações chegam sozinhas no app (seção 10) |
| Monetização | Grátis para o eletricista → links de afiliado → plano Pro depois |
| Sugestões por cômodo | **Adiadas** (18/11): no protótipo os itens começam em zero |
| Protótipo | Sem banco de dados e sem login (entram depois, junto com o Supabase) |

## 2. Usuários

| Papel | Onde usa | O que faz |
|---|---|---|
| Eletricista | App no celular (e site, mesma base de código) | Faz o levantamento, gera o PDF, segue o guia de instalação |
| Cliente final | Recebe o PDF no WhatsApp | Vê a proposta. Os links de compra no PDF são clicáveis |
| Administrador (você) | Painel do Supabase | Mantém o catálogo (a planilha vira tabela no banco) |

## 3. Regras de tela (eletricista com pouca prática no celular)

1. **Uma pergunta por tela.**
2. **Um só padrão de linha** em todo o app: `[desenho] Nome   [ − ]  2  [ + ]`. Aprendeu uma vez, serve para tudo.
3. **Botões grandes, sempre com desenho e texto.** Nunca só ícone. Texto de no mínimo 18 pt.
4. **Nada de digitar durante o levantamento.** Só toques. O único texto digitado é o nome do cliente, no final (com opção de falar pelo microfone do teclado).
5. **Sempre visível:** "Passo 2 de 6", botão **Voltar** e botão **Continuar** grande fixo embaixo.
6. **Sugestões prontas** *(adiado em 18/11)*: ao adicionar um Quarto, ele já viria com 1 luz, 2 tomadas, 1 cortina, 1 ar, 1 TV. Por enquanto os itens começam em zero.
7. **"Copiar para os outros quartos"**: um toque repete os itens.
8. **Salva sozinho a cada toque** e **funciona sem internet** (casa do cliente sem sinal).
9. **Palavras de eletricista**, não de informática: "teclas do interruptor", "fio neutro", "127 V (110)". Nada de "Zigbee" ou "gateway" na tela; aparece como "central".

## 4. Fluxo do MVP — do "Novo projeto" ao PDF

```
1 Imóvel → 2 Cômodos → 3 Itens de cada cômodo → 4 Perguntas da instalação → 5 Lista recomendada → 6 Valores e PDF
                                                                                   ↓
                                                                    Depois: Guia de instalação
```

### Análise da ordem

A ordem que você propôs foi mantida (imóvel → cômodos → itens → lista → instalação), com três ajustes:

- **Perguntas da instalação (passo 4) antes da lista.** A lista depende das respostas: tensão, neutro, Wi-Fi, quadro. Cada pergunta só aparece quando importa. Por exemplo, "o ar já está instalado?" só aparece se houver ar no projeto.
- **Valores e nome do cliente no final.** O levantamento é feito conversando com o cliente, sem parar para digitar.
- **Guia de instalação depois do PDF.** Ele serve para a obra, depois que o cliente aprova. Mas fica acessível a qualquer momento dentro do projeto.

### Passo 1 — Imóvel

Três cartões grandes com desenho: **Casa** (ativo), Apartamento e Comércio (cinza, "em breve").

### Passo 2 — Cômodos

Lista de cômodos com desenho e − / +: Sala, Quarto, Cozinha, Banheiro, Área de serviço, Garagem, Área externa, Varanda, Escritório, Entrada.

Embaixo: "Total: 7 cômodos".

### Passo 3 — O que automatizar em cada cômodo

- Uma tela por cômodo: "**Quarto 2** — cômodo 3 de 7".
- Lista dos 9 itens com desenho e − / +. Começa em zero (a sugestão por cômodo ficou para depois).
- **Luz conta teclas de interruptor, não lâmpadas.** A tela avisa: "5 lâmpadas na mesma tecla = 1".
- Botão "Copiar para os outros quartos" quando houver mais de um cômodo igual.

### Passo 4 — Perguntas da instalação

Uma pergunta por tela, com 2 ou 3 botões grandes e um desenho explicando:

| Pergunta | Respostas | Aparece quando |
|---|---|---|
| Qual a tensão da casa? | 127 V (110) · 220 V · As duas | Sempre |
| Tem fio neutro nas caixas dos interruptores? | Sim · Não · Não sei | Tem Luz |
| O Wi-Fi chega em todos os cômodos? | Sim · Não · Não sei | Sempre |
| Qual assistente o cliente usa? | Alexa · Google · Nenhum ainda | Sempre (se "nenhum", inclui um na lista) |
| Alguma tomada vai ligar aparelho forte (forno, aquecedor)? | Não · Sim, quantas | Tem Tomada |
| Os ar-condicionados já estão instalados? | Sim, só automatizar · Não, vou instalar | Tem Ar |
| O portão já tem motor? | Sim, só colocar Wi-Fi · Não, motor novo | Tem Portão |
| Tem espaço livre no quadro de disjuntores? | Sim · Não · Não sei | O projeto precisa de circuito novo |

### Passo 5 — Lista recomendada

- No topo, quadro amarelo **"Atenção elétrica"** com o resultado das regras. Por exemplo:
  - "2 ar-condicionados novos: circuito exclusivo com disjuntor (adicionado ao orçamento)";
  - "Banheiro: circuito novo precisa de DR".
- Equipamentos agrupados por cômodo. Cada cartão mostra:
  - desenho, nome, marca e modelo;
  - selos "Homologado Anatel" e "Fabricado no Brasil";
  - quantidade e preço.
- Botão **Trocar** em cada item, que mostra as alternativas.
- **Serviços adicionais** gerados pelas regras: circuito exclusivo, DR, passar neutro, repetidor Wi-Fi. É dinheiro a mais para o eletricista, que antes ficava esquecido.

### Passo 6 — Valores e PDF

- Mão de obra preenchida com os valores padrão do eletricista (perguntados só na primeira vez).
- Nome e telefone do cliente.
- Botão **Gerar PDF** → pré-visualização → botão **Enviar no WhatsApp**.

**O PDF contém:**
- dados do eletricista (nome, telefone, logo);
- equipamentos por cômodo, com desenho;
- serviços adicionais e mão de obra;
- total e validade da proposta;
- links de compra clicáveis (afiliado).

### Depois do PDF — Guia de instalação

Dentro do projeto, botão **Como instalar**. Para cada aparelho:
- desenho;
- cuidados elétricos (ex.: "confira 127 V ou 220 V");
- passo a passo de 3 a 5 linhas (aba Tipos de aparelho da planilha).

Na versão seguinte, o guia passa a usar o diagrama e o manual de cada produto.

## 5. Análise elétrica

As 17 regras estão na aba **Regras elétricas** da planilha. As principais:

| Situação | O que o app faz |
|---|---|
| Tensão da casa | Só mostra aparelhos para essa tensão (bivolt passa sempre) |
| Sem neutro na caixa | Prefere modelo sem neutro ou adiciona "passar neutro" |
| Aparelho acima de 10 A | Tomada 20 A + circuito exclusivo com disjuntor (NBR 5410) |
| Ar-condicionado novo | Circuito exclusivo com disjuntor, por aparelho |
| Motor de portão novo | Circuito exclusivo; motor com a mesma tensão da casa |
| Circuito novo em área molhada ou externa | Adiciona DR (NBR 5410) |
| Circuito novo e quadro sem espaço | Adiciona ampliação do quadro |
| Ar e TV no mesmo cômodo | Um controle infravermelho atende os dois |

O app **sugere**; a responsabilidade técnica é do eletricista. O dimensionamento do disjuntor segue o manual do aparelho e a NBR 5410.

## 6. Como o app escolhe os produtos

1. Filtra pelo tipo de aparelho, pela tensão e pelas respostas do passo 4 (neutro, Zigbee etc.).
2. Exige compatibilidade com o assistente do cliente (Alexa ou Google).
3. **Prefere a mesma marca no projeto inteiro**: menos apps para o eletricista configurar.
4. Ordena por: adequação técnica → preço → selo "Fabricado no Brasil".
5. **A comissão de afiliado nunca entra na ordenação.**
6. Se algum aparelho for Zigbee, inclui uma central da mesma família.

## 7. Catálogo e ilustrações

**Planilha:** [catalogo/catalogo-casa.xlsx](../catalogo/catalogo-casa.xlsx)

| Aba | Conteúdo |
|---|---|
| Leia-me | Legenda e critérios para marcar um produto como Verificado |
| Imóveis | Casa (ativo), Apartamento e Comércio (em breve) |
| Cômodos | 10 cômodos com a sugestão inicial de itens |
| Itens | Os 9 botões, com a pergunta de quantidade e o texto de ajuda |
| Tipos de aparelho | 20 tipos, com cuidados elétricos e passo a passo de instalação |
| Produtos | 22 produtos reais encontrados em pesquisa, **todos "A verificar"** |
| Regras elétricas | 17 regras da análise elétrica |
| Mão de obra | 19 serviços para você preencher os valores |

**Ilustrações:** [design/ilustracoes/](../design/ilustracoes/), em SVG (original) e PNG. Estilo "desenho", com contorno e cores suaves. Já existem 28:
- 3 imóveis;
- 10 cômodos;
- 9 itens;
- 6 perguntas do passo 4 (tensão, caixa com neutro, Wi-Fi, assistente, aparelho forte, quadro).

Ainda faltam desenhos para cada tipo de aparelho (hoje cada tipo usa o desenho do seu item).

**Foto do produto:** os desenhos servem para navegar. Na lista recomendada, pode aparecer também a foto real do produto, para o eletricista reconhecer na loja, desde que a foto venha de fonte autorizada (fabricante ou API da loja afiliada).

## 8. Modelo de dados

### Catálogo (vem da planilha, fica no Supabase)

`Imovel`, `ComodoTipo`, `Item`, `TipoAparelho`, `Produto`, `RegraParametro`, `ServicoPadrao` — mesmas colunas das abas.

### Projeto (fica no celular e sincroniza na versão 2)

| Entidade | Campos principais |
|---|---|
| Eletricista | id, nome, telefone, logo |
| ValorMaoDeObra | eletricistaId, servicoId, valor |
| Projeto | id, imovel, tensao, temNeutro, wifiTodos, assistente, tomadasFortes, arNovo, portaoTemMotor, quadroEspaco, clienteNome, clienteTelefone, status, criadoEm |
| Comodo | id, projetoId, tipo, nome ("Quarto 2"), ordem |
| ItemComodo | comodoId, item, quantidade |
| ItemRecomendado | projetoId, comodoId, produtoId, quantidade, precoUnitario, trocado |
| ServicoAdicional | projetoId, servicoId, quantidade, valor, regraId |
| Alerta | projetoId, regraId, mensagem |

## 9. Monetização

- **Afiliados:** links de compra clicáveis no PDF e na lista. Registrar cliques para medir resultado.
- **Transparência:** aviso no PDF de que os links podem gerar comissão.
- **Plano Pro** (versão 2): logo no PDF, projetos ilimitados, link de aprovação para o cliente.
- **Parceria com marcas** (versão 3): treinamentos e guias patrocinados, nunca posição na recomendação.

## 10. Tecnologia

| Parte | Tecnologia | Por quê |
|---|---|---|
| App Android, iOS e site | **Expo (React Native) + Expo Router, em TypeScript** | Um único código para as três plataformas |
| Atualizações | **EAS Update** | Correções e telas novas chegam sozinhas na próxima vez que o eletricista abre o app, sem esperar a loja aprovar. Só mudanças nativas (ex.: novo acesso a sensor do celular) pedem versão nova na loja |
| Banco, login, arquivos | **Supabase** (PostgreSQL gerenciado) | Sem servidor para manter. O painel do Supabase edita o catálogo no começo, sem precisar criar tela de admin |
| Dados no celular | **SQLite** (expo-sqlite) | Funciona sem internet na casa do cliente |
| PDF | **expo-print + expo-sharing** | Gera o PDF no próprio celular e compartilha no WhatsApp |
| Ilustrações | **SVG** (react-native-svg) | Nítidas em qualquer tamanho de tela |

**Por que não C# (.NET MAUI):** comunidade e bibliotecas bem menores para celular, e sem atualização automática equivalente ao EAS Update.

**Por que não Flutter:** é bom para app, mas a atualização sem loja depende de serviço de terceiros e a versão web é mais fraca.

**MVP sem login:** os projetos ficam no celular e o catálogo vem do Supabase. Login e sincronização na nuvem entram na versão 2. O risco é perder os projetos se o celular for trocado, o que é aceitável no beta.

### Estrutura de pastas

```
ajudaAutomacao/
├── app/                  # Expo: app (Android/iOS) + site
├── supabase/             # tabelas (migrations) e carga do catálogo
├── catalogo/             # planilha do catálogo — fonte dos dados
├── design/ilustracoes/   # svg + png
└── docs/
```

## 11. Roteiro

### Antes de programar

- [x] Revisar as regras elétricas (aprovadas em 18/11).
- [x] Sugestões por cômodo: adiadas.
- [x] Mão de obra: valores digitados no próprio app (passo 6) e lembrados no aparelho.
- [x] Protótipo clicável (18/11) — Expo, sem banco e sem login.
- [ ] Mostrar o protótipo para 3 a 5 eletricistas, de preferência os mais velhos.
- [ ] Verificar pelo menos 1 produto por tipo de aparelho (Anatel + manual) e cadastrar os tipos que faltam.

### MVP (versão 1)

1. ~~Criar o projeto Expo; carregar o catálogo da planilha.~~ Feito no protótipo.
2. ~~Passos 1 a 6, PDF, WhatsApp e guia de instalação.~~ Feito no protótipo.
3. Ajustar as telas com o resultado do teste com eletricistas.
4. Testar no celular com Expo Go (PDF nativo e desenhos).
5. Supabase: catálogo no banco e login.
6. Testes automáticos das regras elétricas.
7. Beta com um grupo pequeno de eletricistas.

### Versão 2

- Link para o cliente aprovar a proposta.
- 3 pacotes (básico, intermediário, completo).
- Apartamento e Comércio.
- Login com sincronização na nuvem.
- Manual da casa para o cliente.
- Plano Pro.

### Versão 3

- Pós-venda.
- Solar: primeiro monitoramento, depois dimensionamento.
- Parcerias com marcas.
- Trilha de capacitação para eletricistas.

## 12. Riscos

| Risco | Como reduzir |
|---|---|
| Catálogo desatualizado | Data de verificação em cada produto; revisão mensal |
| Produto que não funciona como o anúncio diz | Testar na prática os mais recomendados |
| Cliente com muitos apps diferentes | Preferir uma marca por projeto; Alexa/Google como app único |
| Responsabilidade técnica | Termos de uso: o app sugere; a responsabilidade é do eletricista (NBR 5410) |
| Eletricista não se adapta ao app | Regras de tela da seção 3; testar com eletricistas mais velhos antes do lançamento |
| Dependência de afiliados | Mais de uma loja; plano Pro como segunda receita |

## 13. Em aberto

- Nome definitivo e marca do app.
- Contas de desenvolvedor: Google Play (US$ 25, pagamento único) e Apple (US$ 99/ano).
- Cadastro nos programas de afiliado (exige CPF ou CNPJ).
- Termos de uso e política de privacidade (LGPD).
- Ilustrações das perguntas do passo 4 e dos tipos de aparelho.
