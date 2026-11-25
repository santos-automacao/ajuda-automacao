-- Índices nas chaves estrangeiras do catálogo (sugestão do verificador de desempenho do Supabase).
create index if not exists comodos_sensor_sugerido_idx on public.comodos (sensor_sugerido);
create index if not exists itens_tipo_padrao_idx on public.itens (tipo_padrao);
create index if not exists regras_eletricas_servico_id_idx on public.regras_eletricas (servico_id);
