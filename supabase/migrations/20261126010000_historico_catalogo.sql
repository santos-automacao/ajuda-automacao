-- Histórico do catálogo (decisão do dono, 26/11/2026).
-- Em cada uma das 7 tabelas do catálogo:
--   id      = número do REGISTRO (um por versão da linha; nunca muda, nunca se repete)
--   codigo  = código da planilha (P001, S01, R01, INT_TOUCH, sala...) — o mesmo em todas as versões
--   stareg  = 'A' (registro atual) ou 'I' (registro antigo, ou saiu da planilha)
-- Mudou alguma coisa na planilha: o registro atual vira 'I' e entra um novo, com id novo e o mesmo código.
-- Nada é apagado. O orçamento guarda id + código, então sempre sabe como era o produto naquele dia.
--
-- Uma tabela aponta para a outra pelo CÓDIGO (ex.: regra → serviço "S05"), não pelo id:
-- assim mudar o serviço não obriga a criar versão nova das regras. Por isso as chaves estrangeiras
-- entre as tabelas do catálogo saem (o PostgreSQL só liga chave estrangeira a coluna única).
-- Quem confere os códigos é o gerador do SQL (scripts/gerar-sql-catalogo.mjs).
-- Comparando com C#: "codigo" é a chave de negócio; "id" é a chave substituta (como um Identity).

-- 1) Tira as chaves primárias antigas (texto). "cascade" tira junto as chaves estrangeiras que apontavam para elas.
alter table public.imoveis          drop constraint imoveis_pkey cascade;
alter table public.tipos_aparelho   drop constraint tipos_aparelho_pkey cascade;
alter table public.itens            drop constraint itens_pkey cascade;
alter table public.comodos          drop constraint comodos_pkey cascade;
alter table public.servicos         drop constraint servicos_pkey cascade;
alter table public.regras_eletricas drop constraint regras_eletricas_pkey cascade;
alter table public.produtos         drop constraint produtos_pkey cascade;
alter table public.servicos         drop constraint servicos_nome_key;  -- versões do mesmo serviço repetem o nome

-- 2) id antigo vira "codigo"; entram id (registro), stareg e criado_em.
do $$
declare t text;
begin
  foreach t in array array['imoveis', 'tipos_aparelho', 'itens', 'comodos', 'servicos', 'regras_eletricas', 'produtos'] loop
    execute format('alter table public.%I rename column id to codigo', t);
    execute format('alter table public.%I add column id bigint generated always as identity primary key', t);
    execute format($f$alter table public.%I add column stareg char(1) not null default 'A' check (stareg in ('A', 'I'))$f$, t);
    execute format('alter table public.%I add column criado_em timestamptz not null default now()', t);
    -- Só um registro atual por código.
    execute format($f$create unique index %I on public.%I (codigo) where stareg = 'A'$f$, t || '_codigo_ativo', t);
  end loop;
end $$;

-- 3) Colunas que guardam código de outra tabela ganham nome claro.
alter table public.regras_eletricas    rename column servico_id to servico_codigo;
alter table public.verificacoes        rename column produto_id to produto_codigo;
alter table public.valores_mao_de_obra rename column servico_id to servico_codigo;

-- 4) Item do orçamento: o REGISTRO exato do produto (id) + o código. (Tabela vazia em 26/11/2026.)
alter table public.itens_projeto rename column produto_id to produto_codigo;
alter table public.itens_projeto add column produto_id bigint not null references public.produtos(id);
create index on public.itens_projeto (produto_id);

-- 5) "Mais escolhidos": soma pelo código (as versões do mesmo produto contam juntas);
--    marca e modelo vêm do registro atual.
drop function public.produtos_mais_escolhidos();
create function public.produtos_mais_escolhidos()
returns table (produto_codigo text, item text, marca text, modelo text,
               projetos bigint, eletricistas bigint, unidades bigint, vezes_escolhido_na_troca bigint)
language sql stable security definer set search_path = '' as $$
  select i.produto_codigo, max(p.item), max(p.marca), max(p.modelo),
         count(distinct i.projeto_id),
         count(distinct pr.eletricista_id),
         coalesce(sum(i.quantidade), 0),
         count(*) filter (where i.trocado)
  from public.itens_projeto i
  join public.projetos pr     on pr.id = i.projeto_id
  left join public.produtos p on p.codigo = i.produto_codigo and p.stareg = 'A'
  where pr.status <> 'rascunho'
  group by i.produto_codigo
  order by 6 desc, 5 desc;
$$;
revoke execute on function public.produtos_mais_escolhidos() from public, anon;
grant execute on function public.produtos_mais_escolhidos() to authenticated;
