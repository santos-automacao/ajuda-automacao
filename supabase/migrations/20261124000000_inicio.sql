-- Ajuda Automação — primeira estrutura do banco (Supabase / PostgreSQL)
-- Comparando com C#/ASP.NET: cada "create table" é como uma entidade do Entity Framework,
-- e as "policies" (RLS) fazem o papel do [Authorize] — só que dentro do próprio banco.
--
-- Duas partes:
--   1) CATÁLOGO  — igual às abas da planilha. Todo mundo lê; só o administrador grava.
--   2) PROJETOS  — dados de cada eletricista (perfil, valores, orçamentos). Cada um só vê os seus.

-------------------------------------------------------------------------------
-- 1) CATÁLOGO
-------------------------------------------------------------------------------

create table public.tipos_aparelho (
  id            text primary key,            -- ex.: INT_TOUCH
  item          text not null,               -- luz, tomada, cortina...
  nome          text not null,
  dados         jsonb not null default '{}'  -- cuidados elétricos, passo a passo (aba Tipos de aparelho)
);

create table public.produtos (
  id               text primary key,         -- P001, P002...
  item             text not null,
  tipo             text not null references public.tipos_aparelho(id),
  marca            text not null,
  modelo           text not null,
  nome             text not null,
  app              text,
  alexa            text,
  google           text,
  protocolo        text,
  neutro           text,
  tensao           text,                      -- 127 V, 220 V ou bivolt
  corrente_max     text,
  potencia_max     text,
  teclas           int,
  alimentacao      text,
  anatel           text,                      -- número de homologação (12 dígitos)
  inmetro          text,
  fabricado_brasil text,                      -- Sim / Não / Verificar
  garantia_meses   int,
  preco            numeric(10,2),
  preco_em         date,
  link             text,
  fonte            text,
  foto_url         text,                      -- foto oficial (fabricante ou loja afiliada)
  foto_fonte       text,
  status           text not null default 'A verificar',  -- A verificar / Verificado / Fora de linha
  verificado_em    date,
  observacoes      text,
  atualizado_em    timestamptz not null default now()
);

create table public.regras_eletricas (
  id     text primary key,                    -- R01...
  dados  jsonb not null default '{}'
);

create table public.servicos (
  id     text primary key,                    -- mão de obra padrão
  nome   text not null,
  dados  jsonb not null default '{}'
);

-- Histórico de cada conferência feita pela skill atualizar-catalogo (o que mudou e de onde veio).
create table public.verificacoes (
  id              bigint generated always as identity primary key,
  produto_id      text not null references public.produtos(id) on delete cascade,
  campo           text not null,
  valor_anterior  text,
  valor_novo      text,
  fonte           text,
  relatorio       text,                       -- ex.: relatorios/catalogo-2026-12.md
  criado_em       timestamptz not null default now()
);

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
  valor           numeric(10,2) not null,
  primary key (eletricista_id, servico_id)
);

-- O orçamento inteiro fica em "dados" (o mesmo objeto Projeto do app), para o app
-- funcionar sem internet e só sincronizar depois. Os campos soltos servem para listar e buscar.
create table public.projetos (
  id                uuid primary key default gen_random_uuid(),
  eletricista_id    uuid not null references public.perfis(id) on delete cascade,
  cliente_nome      text,
  cliente_telefone  text,
  status            text not null default 'rascunho',   -- rascunho / enviado / aprovado / instalado
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
  comodo      text,
  quantidade  int not null default 1,
  trocado     boolean not null default false,   -- o eletricista trocou a sugestão do app?
  primary key (projeto_id, produto_id, comodo)
);

-- Ranking anônimo: só contagens, sem mostrar de quem é cada orçamento.
create view public.produtos_mais_escolhidos
with (security_invoker = false) as
select p.id as produto_id, p.item, p.marca, p.modelo,
       count(distinct i.projeto_id)            as projetos,
       count(distinct pr.eletricista_id)       as eletricistas,
       coalesce(sum(i.quantidade), 0)          as unidades,
       count(*) filter (where i.trocado)       as vezes_escolhido_na_troca
from public.produtos p
join public.itens_projeto i on i.produto_id = p.id
join public.projetos pr     on pr.id = i.projeto_id
where pr.status <> 'rascunho'
group by p.id;

-------------------------------------------------------------------------------
-- Segurança (Row Level Security)
-------------------------------------------------------------------------------

alter table public.tipos_aparelho      enable row level security;
alter table public.produtos            enable row level security;
alter table public.regras_eletricas    enable row level security;
alter table public.servicos            enable row level security;
alter table public.verificacoes        enable row level security;
alter table public.perfis              enable row level security;
alter table public.valores_mao_de_obra enable row level security;
alter table public.projetos            enable row level security;
alter table public.itens_projeto       enable row level security;

-- Catálogo: leitura para todos (o app baixa sem login). Gravação só pelo painel / chave de serviço.
create policy "catalogo leitura" on public.tipos_aparelho   for select using (true);
create policy "catalogo leitura" on public.produtos         for select using (true);
create policy "catalogo leitura" on public.regras_eletricas for select using (true);
create policy "catalogo leitura" on public.servicos         for select using (true);

-- Dados do eletricista: cada um só enxerga e mexe no que é seu.
create policy "dono" on public.perfis
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "dono" on public.valores_mao_de_obra
  for all using (eletricista_id = auth.uid()) with check (eletricista_id = auth.uid());
create policy "dono" on public.projetos
  for all using (eletricista_id = auth.uid()) with check (eletricista_id = auth.uid());
create policy "dono" on public.itens_projeto
  for all using (exists (select 1 from public.projetos p where p.id = projeto_id and p.eletricista_id = auth.uid()))
  with check (exists (select 1 from public.projetos p where p.id = projeto_id and p.eletricista_id = auth.uid()));

-- O ranking só pode ser lido por quem está logado.
revoke all on public.produtos_mais_escolhidos from anon, public;
grant select on public.produtos_mais_escolhidos to authenticated;

-- Cria o perfil sozinho quando alguém se cadastra.
create function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end $$;

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
