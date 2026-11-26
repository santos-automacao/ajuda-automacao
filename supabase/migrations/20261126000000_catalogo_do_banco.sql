-- O app passa a montar o catálogo a partir do banco (26/11/2026).
-- Para sair igual ao catalogo.json, o banco precisa guardar o que antes se perdia:

-- 1) A ordem das abas Imóveis e Tipos (a tela mostra nessa ordem).
alter table public.imoveis        add column ordem int not null default 0;
alter table public.tipos_aparelho add column ordem int not null default 0;

-- 2) "Teclas" aceita texto: a planilha usa "Verificar" e "—" quando ainda não se sabe.
alter table public.produtos alter column teclas type text using teclas::text;

-- 3) Data de geração do catálogo (a mesma do catalogo.json). O app compara as datas
--    para saber se a cópia baixada é mais nova que a que veio dentro dele.
create table public.catalogo_info (
  id         int primary key default 1 check (id = 1),  -- sempre uma linha só
  gerado_em  timestamptz not null
);
alter table public.catalogo_info enable row level security;
create policy "catalogo leitura" on public.catalogo_info for select to anon, authenticated using (true);
