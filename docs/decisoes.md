# Histórico de decisões

Registro das conversas de planejamento, para continuar o projeto em qualquer computador.

## 17/11/2026 — Ideia e primeiras decisões

- **Ideia:** um "Ajuda Eletricista" para automação residencial. O app pergunta os cômodos e o que o cliente quer automatizar, recomenda equipamentos nacionais e licenciados que funcionem num único app e ajuda na instalação. Começa com casa e comércio.
- **Inspiração:** app "Meu Ajudante" (orçamento para eletricista). O nosso deve ser maior que orçamento: projeto técnico + instalação.
- **Usuários:** o eletricista usa o app; o cliente vê a proposta (e, no futuro, o guia de uso).
- **Controle dos aparelhos (caminho A):** o app planeja e recomenda; o controle fica num app que já existe. Não vamos controlar aparelhos diretamente.
- **"Nacional":** o objetivo é garantir qualidade ao cliente. Isso vem da certificação (Anatel/INMETRO) e da garantia no Brasil. "Fabricado no Brasil" vira selo quando confirmado.
- **Itens:** iluminação, tomadas, cortinas, ar-condicionado e TV por infravermelho, portão, fechadura, câmeras (com IA para detectar pessoas), sensores, placas solares (fase 3).
- **Monetização:** grátis para o eletricista + links de afiliado + plano Pro depois.
  - Pesquisa: Meu Ajudante R$ 34,90/mês; Fechou R$ 39,90/mês; GetNinjas (venda de contatos) teve muitas reclamações; Portal.io começou grátis, ganhando nas compras, e depois cobrou de quem não comprava.
  - Conversão de grátis para pago em apps de pequenos negócios: 3% a 10%.
- **Concorrência:** não achamos app brasileiro que planeje automação por cômodo com várias marcas. O mais parecido é o planejador da Loxone (só uma marca).
- **Descoberta:** cada marca tem o próprio app (Intelbras = Izy Smart, Positivo = Positivo Casa Inteligente, motores de portão = apps próprios). O "app único" do cliente é a **Alexa ou o Google Home**.
- **Tecnologia:** o dono liberou qualquer linguagem. Escolhido **Expo (React Native) + Supabase, em TypeScript**. Motivo principal: o **EAS Update** atualiza o app instalado sem passar pela loja.
- **Fluxo até o PDF (6 passos):** imóvel → cômodos → itens por cômodo → perguntas da instalação → lista recomendada → valores e PDF. Guia de instalação depois.
  - Luz conta **teclas de interruptor**, não lâmpadas.
  - Perguntas só aparecem quando importam (ex.: "o ar já está instalado?" só se houver ar).
  - Disjuntor separado: ar novo, motor de portão novo, aparelho acima de 10 A; DR em área molhada/externa.
- **Catálogo:** planilha `catalogo/catalogo-casa.xlsx` com 22 produtos reais, todos "A verificar". Ilustrações em estilo "desenho" para imóveis, cômodos, itens e perguntas.

## 18/11/2026 — Protótipo

- **Sugestões de itens por cômodo:** deixar para depois. No protótipo, os itens começam em zero.
- **Regras elétricas (aba da planilha):** aprovadas pelo dono.
- **Mão de obra:** valores digitados no passo 6, lembrados no aparelho.
- **Protótipo:** sem banco de dados e sem login (assunto para depois, junto com o login). Foco em usabilidade no notebook e no celular.
- **Repositório:** público no GitHub (GRS2001/ajuda-automacao), com publicação automática no GitHub Pages para testar no celular pelo navegador.
- **Contexto para outro computador:** `CLAUDE.md` + este arquivo + `docs/escopo-mvp.md`. A memória local do Claude e a conversa não vão junto para outro notebook.
- **Hospedagem para os testes:** Vercel (conta do dono, já ligada ao GitHub) passa a ser o endereço principal: link mais curto, links diretos sem erro 404, endereço de teste por branch e Analytics. O GitHub Pages fica como reserva. Atenção: o plano grátis da Vercel é só para uso não comercial.
- **GitHub:** o dono quer trocar o usuário `GRS2001` por um nome mais profissional. Ao trocar, atualizar o `git remote` nos computadores e os links `grs2001.github.io` nos documentos.

## 23/11/2026 — Catálogo sempre atualizado, produto nacional e banco de dados

- **Skill `atualizar-catalogo`** (`.claude/skills/atualizar-catalogo/`): revisa o catálogo (Anatel, INMETRO, tensão, Alexa/Google, garantia, preço, fora de linha, novidades) e gera um relatório em `relatorios/`. Roda **todo mês** por tarefa agendada e abre um pull request; nada vai para a `main` sem o dono revisar.
- **Anatel:** desde 08/09/2026 a homologação é na Plataforma Certifica (o SCH antigo só consulta). As duas consultas públicas pediram login em nov/2026, então o nº Anatel vem do datasheet/manual oficial do fabricante. Ideia para depois: uma GitHub Action que baixa os dados abertos da Anatel todo mês.
- **Produto nacional:** "Fabricado no Brasil" **não é obrigatório**. Produto da China pode entrar, mas o app/relatório **sempre avisa quando existir opção nacional** para o mesmo tipo.
- **Critério de "Verificado":** nº Anatel em fonte oficial (ou módulo homologado incorporado) + à venda + INMETRO quando for tomada/plugue.
- **Decisões do relatório de teste:** fechadura Positivo → cadastrar os modelos atuais (Wi-Fi de embutir e Wi-Fi de sobrepor); Rossi → uma linha por tensão (127 V e 220 V); Intelbras → manter as duas linhas (EWS antiga e EIW nova) enquanto estiverem à venda.
- **Catálogo atualizado (37 produtos, 7 verificados):** IAC 110, iM5 S 4MP, EIW 1002, ECW 1001, ECW 1002, ELW 1001 e IGD 110. Entraram: Rossi 220 V, fechadura Positivo de sobrepor, EIW 1001–1004, tomadas ETW 1001 e ETW 1001+ (falta INMETRO), minicontroladores ECW, lâmpada ELW 1001, acionador de portão IGD 110, centrais Zigbee (Intelbras MCA 1002, NovaDigital HNZ-CB) e cortina motorizada Ekaza.
- **App da Intelbras:** a linha nova usa o **Mibo Smart** (antes Izy Smart).
- **Fotos dos produtos:** colunas novas na planilha (foto e fonte). Só foto oficial (fabricante ou API do programa de afiliados).
- **Banco de dados: Supabase** (PostgreSQL + login), conta criada pelo dono com o GitHub. Estrutura em `supabase/migrations/`: catálogo (leitura pública), perfis, valores de mão de obra, orçamentos (`projetos`, com o projeto inteiro em JSON para funcionar sem internet) e itens de cada orçamento. Cada eletricista só vê os próprios dados (RLS).
- **"Mais escolhidos pelos eletricistas":** sai da tabela `itens_projeto` pela visão `produtos_mais_escolhidos` (só contagens, sem dados de quem orçou). Começa a funcionar quando o app gravar os orçamentos no banco.
