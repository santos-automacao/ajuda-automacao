-- Ajuda Automação — estrutura do banco (Supabase / PostgreSQL)
-- Comparando com C#/ASP.NET: cada "create table" é como uma entidade do Entity Framework,
-- e as "policies" (RLS) fazem o papel do [Authorize] — só que dentro do próprio banco.
--
-- Duas partes:
--   1) CATÁLOGO  — uma tabela por aba da planilha. Todo mundo lê; só o administrador grava.
--   2) PROJETOS  — dados de cada eletricista (perfil, valores, orçamentos). Cada um só vê os seus.

-------------------------------------------------------------------------------
-- 1) CATÁLOGO (igual às abas de catalogo/catalogo-casa.xlsx)
-------------------------------------------------------------------------------

-- Aba "Imóveis"
create table public.imoveis (
  id        text primary key,               -- casa, apartamento, comercio
  nome      text not null,
  situacao  text                            -- "Ativo no MVP", "Em breve"
);

-- Aba "Tipos de aparelho"
create table public.tipos_aparelho (
  id           text primary key,            -- INT_TOUCH, MOD_RELE...
  item         text not null,               -- luz, tomada... (pode ser "ar_condicionado, tv")
  nome         text not null,
  para_que     text,                        -- "Para que serve"
  neutro       text,                        -- precisa de neutro?
  central      text,                        -- precisa de central?
  alimentacao  text,
  cuidados     text,                        -- cuidados elétricos
  passos       text                         -- passo a passo de instalação
);

-- Aba "Itens" (os 9 botões do passo 3)
create table public.itens (
  id           text primary key,            -- luz, tomada, cortina...
  ordem        int not null,
  botao        text not null,               -- texto do botão
  pergunta     text,                        -- pergunta de quantidade
  ajuda        text,                        -- texto curto na tela
  tipo_padrao  text references public.tipos_aparelho(id),
  outros_tipos text[] not null default '{}'
);

-- Aba "Cômodos" (sugestão inicial de itens por cômodo)
create table public.comodos (
  id                     text primary key,  -- sala, quarto...
  ordem                  int not null,
  nome                   text not null,
  sensor_sugerido        text references public.tipos_aparelho(id),
  sugestao_luz           int not null default 0,
  sugestao_tomada        int not null default 0,
  sugestao_cortina       int not null default 0,
  sugestao_ar_condicionado int not null default 0,
  sugestao_tv            int not null default 0,
  sugestao_portao        int not null default 0,
  sugestao_fechadura     int not null default 0,
  sugestao_camera        int not null default 0,
  sugestao_sensor        int not null default 0
);

-- Aba "Mão de obra"
create table public.servicos (
  id                text primary key,       -- S01, S02...
  nome              text not null unique,   -- "Instalar interruptor inteligente"
  unidade           text not null,          -- "por interruptor"
  valor_referencia  numeric(10,2)           -- valor sugerido (cada eletricista tem o seu em valores_mao_de_obra)
);

-- Aba "Regras elétricas"
create table public.regras_eletricas (
  id          text primary key,             -- R01...
  quando      text not null,                -- "Quando acontece"
  acao        text not null,                -- "O que o app faz"
  mensagem    text,                         -- mensagem para o eletricista
  servico     text,                         -- serviço adicionado (texto da planilha)
  servico_id  text references public.servicos(id),  -- mesmo serviço, pelo código (quando existir)
  base        text                          -- base técnica (NBR 5410, manual...)
);

-- Aba "Produtos"
create table public.produtos (
  id               text primary key,        -- P001, P002...
  item             text not null,
  tipo             text not null references public.tipos_aparelho(id),
  marca            text not null,
  modelo           text,
  nome             text not null,
  app              text,
  alexa            text,
  google           text,
  protocolo        text,
  neutro           text,
  tensao           text,                    -- 127 V, 220 V ou bivolt
  corrente_max     text,
  potencia_max     text,
  teclas           int,
  alimentacao      text,
  anatel           text,                    -- número de homologação
  inmetro          text,
  fabricado_brasil text,                    -- Sim / Não / Verificar
  garantia_meses   int,
  preco            numeric(10,2),
  preco_em         date,
  link             text,
  fonte            text,
  foto_url         text,                    -- foto oficial (fabricante ou loja afiliada)
  foto_fonte       text,
  status           text not null default 'A verificar'
                   check (status in ('A verificar', 'Verificado', 'Inativo')),
  verificado_em    date,
  observacoes      text,
  atualizado_em    timestamptz not null default now()
);
create index on public.produtos (tipo);

-- Histórico de cada conferência feita pela skill atualizar-catalogo (o que mudou e de onde veio).
create table public.verificacoes (
  id              bigint generated always as identity primary key,
  produto_id      text not null references public.produtos(id) on delete cascade,
  campo           text not null,
  valor_anterior  text,
  valor_novo      text,
  fonte           text,
  relatorio       text,                     -- ex.: relatorios/catalogo-2026-12.md
  criado_em       timestamptz not null default now()
);
create index on public.verificacoes (produto_id);

-------------------------------------------------------------------------------
-- 2) PROJETOS (por eletricista; login do Supabase Auth)
-------------------------------------------------------------------------------

create table public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text,
  telefone   text,
  logo_url   text,
  criado_em  timestamptz not null default now()
);

create table public.valores_mao_de_obra (
  eletricista_id  uuid not null references public.perfis(id) on delete cascade,
  servico_id      text not null references public.servicos(id),
  valor           numeric(10,2) not null check (valor >= 0),
  primary key (eletricista_id, servico_id)
);
create index on public.valores_mao_de_obra (servico_id);

-- O orçamento inteiro fica em "dados" (o mesmo objeto Projeto do app), para o app
-- funcionar sem internet e só sincronizar depois. Os campos soltos servem para listar e buscar.
create table public.projetos (
  id                uuid primary key default gen_random_uuid(),
  eletricista_id    uuid not null references public.perfis(id) on delete cascade,
  cliente_nome      text,
  cliente_telefone  text,
  status            text not null default 'rascunho'
                    check (status in ('rascunho', 'enviado', 'aprovado', 'instalado', 'cancelado')),
  total             numeric(12,2),
  dados             jsonb not null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);
create index on public.projetos (eletricista_id, atualizado_em desc);

-- Cada produto que entrou num orçamento. É daqui que sai "os mais escolhidos pelos eletricistas".
create table public.itens_projeto (
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  produto_id  text not null references public.produtos(id),
  comodo      text not null default '',       -- ex.: quarto-2 ('' = projeto inteiro)
  quantidade  int not null default 1 check (quantidade > 0),
  trocado     boolean not null default false, -- o eletricista trocou a sugestão do app?
  primary key (projeto_id, produto_id, comodo)
);
create index on public.itens_projeto (produto_id);

-------------------------------------------------------------------------------
-- Segurança (Row Level Security)
-------------------------------------------------------------------------------

alter table public.imoveis             enable row level security;
alter table public.tipos_aparelho      enable row level security;
alter table public.itens               enable row level security;
alter table public.comodos             enable row level security;
alter table public.servicos            enable row level security;
alter table public.regras_eletricas    enable row level security;
alter table public.produtos            enable row level security;
alter table public.verificacoes        enable row level security;
alter table public.perfis              enable row level security;
alter table public.valores_mao_de_obra enable row level security;
alter table public.projetos            enable row level security;
alter table public.itens_projeto       enable row level security;

-- Catálogo: leitura para todos (o app baixa sem login). Gravação só pelo painel / chave de serviço.
create policy "catalogo leitura" on public.imoveis          for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.tipos_aparelho   for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.itens            for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.comodos          for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.servicos         for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.regras_eletricas for select to anon, authenticated using (true);
create policy "catalogo leitura" on public.produtos         for select to anon, authenticated using (true);
-- verificacoes: sem policy = só o administrador (painel / chave de serviço) lê e grava.

-- Dados do eletricista: cada um só enxerga e mexe no que é seu.
-- "(select auth.uid())" em vez de "auth.uid()" é a forma recomendada pelo Supabase (mais rápida).
create policy "dono" on public.perfis for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "dono" on public.valores_mao_de_obra for all to authenticated
  using (eletricista_id = (select auth.uid())) with check (eletricista_id = (select auth.uid()));
create policy "dono" on public.projetos for all to authenticated
  using (eletricista_id = (select auth.uid())) with check (eletricista_id = (select auth.uid()));
create policy "dono" on public.itens_projeto for all to authenticated
  using (exists (select 1 from public.projetos p where p.id = projeto_id and p.eletricista_id = (select auth.uid())))
  with check (exists (select 1 from public.projetos p where p.id = projeto_id and p.eletricista_id = (select auth.uid())));

-------------------------------------------------------------------------------
-- Funções automáticas
-------------------------------------------------------------------------------

-- Ranking anônimo dos produtos mais escolhidos: só contagens, sem mostrar de quem é cada orçamento.
-- É uma função "security definer" (roda com permissão de administrador) porque precisa somar
-- orçamentos de todos os eletricistas, mas só devolve números.
create function public.produtos_mais_escolhidos()
returns table (produto_id text, item text, marca text, modelo text,
               projetos bigint, eletricistas bigint, unidades bigint, vezes_escolhido_na_troca bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.item, p.marca, p.modelo,
         count(distinct i.projeto_id),
         count(distinct pr.eletricista_id),
         coalesce(sum(i.quantidade), 0),
         count(*) filter (where i.trocado)
  from public.produtos p
  join public.itens_projeto i on i.produto_id = p.id
  join public.projetos pr     on pr.id = i.projeto_id
  where pr.status <> 'rascunho'
  group by p.id
  order by 6 desc, 5 desc;
$$;
revoke execute on function public.produtos_mais_escolhidos() from public, anon;
grant execute on function public.produtos_mais_escolhidos() to authenticated;

-- Cria o perfil sozinho quando alguém se cadastra.
create function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end $$;
revoke execute on function public.criar_perfil() from public, anon, authenticated;

create trigger ao_cadastrar after insert on auth.users
  for each row execute function public.criar_perfil();

-- Atualiza "atualizado_em" sozinho.
create function public.marcar_atualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger marcar_atualizado before update on public.projetos
  for each row execute function public.marcar_atualizado();
create trigger marcar_atualizado before update on public.produtos
  for each row execute function public.marcar_atualizado();
