// Gera o SQL que carrega (ou atualiza) o catálogo no Supabase.
// Uso: npm run dados  →  node scripts/gerar-sql-catalogo.mjs
// Lê:   src/dados/catalogo.json (gerado da planilha)
// Gera: supabase/seed/catalogo.sql — pode rodar quantas vezes quiser; nada é apagado nem sobrescrito.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Entrada opcional (argv[3]): outro catalogo.json, usado para testar mudanças sem mexer na planilha.
const cat = JSON.parse(fs.readFileSync(process.argv[3] ?? path.join(raiz, 'src', 'dados', 'catalogo.json'), 'utf8'));

/** Valor em SQL: texto entre aspas simples, número cru, nulo como null. */
function v(x, tipo = 'texto') {
  if (x === null || x === undefined || x === '') return 'null';
  if (tipo === 'int') return Number.isInteger(Number(x)) ? String(Number(x)) : 'null';
  if (tipo === 'num') return typeof x === 'number' ? String(x) : 'null';
  if (tipo === 'array') return `array[${x.map((i) => v(i)).join(', ')}]::text[]`;
  return `'${String(x).replace(/'/g, "''")}'`;
}

/**
 * Carrega uma aba numa tabela, guardando histórico. colunas[0] é sempre "codigo".
 * 1) põe as linhas da planilha numa tabela temporária (mesmos tipos da tabela de verdade);
 * 2) inativa o registro atual cujo conteúdo mudou; 3) grava quem ficou sem registro atual (novo ou mudou);
 * 4) inativa o que saiu da planilha.
 */
function carregar(tabela, colunas, linhas) {
  if (!linhas.length) throw new Error(`Aba vazia: ${tabela}. Isso inativaria tudo; confira a planilha.`);
  const n = `novo_${tabela}`;
  const cols = colunas.join(', ');
  const dados = colunas.filter((c) => c !== 'codigo');
  const valores = linhas.map((l) => `  (${l.join(', ')})`).join(',\n');
  return `-- ${tabela}\n` +
    `create temp table ${n} on commit drop as select ${cols} from public.${tabela} with no data;\n` +
    `insert into ${n} (${cols}) values\n${valores};\n` +
    `update public.${tabela} t set stareg = 'I' from ${n} n where t.codigo = n.codigo and t.stareg = 'A' and ` +
    `(${dados.map((c) => `t.${c}`).join(', ')}) is distinct from (${dados.map((c) => `n.${c}`).join(', ')});\n` +
    `insert into public.${tabela} (${cols}) select ${cols} from ${n} n ` +
    `where not exists (select 1 from public.${tabela} t where t.codigo = n.codigo and t.stareg = 'A');\n` +
    `update public.${tabela} set stareg = 'I' where stareg = 'A' and codigo not in (select codigo from ${n});\n\n`;
}

const tiposValidos = new Set(cat.tipos.map((t) => t.id));
/** Só códigos de tipo que existem (ex.: o sensor usa "(pelo cômodo)": o tipo vem de comodos.sensor_sugerido). */
const tipo = (id) => (tiposValidos.has(id) ? id : null);
// A aba Regras escreve o serviço com outras palavras ("Circuito exclusivo + disjuntor (por aparelho)").
// Liga pelo começo do nome; se não achar, por palavra-chave.
const PALAVRAS = [['neutro', 'Passar neutro'], ['circuito exclusivo', 'Circuito exclusivo'], [' dr', 'dispositivo DR'],
  ['quadro', 'quadro'], ['repetidor', 'repetidor'], ['central', 'central Zigbee']];
function servicoDaRegra(texto) {
  if (!texto || texto === '—') return null;
  const t = ` ${texto.toLowerCase()}`;
  const exato = cat.servicos.find((s) => t.trim().startsWith(s.servico.toLowerCase()));
  if (exato) return exato.id;
  const par = PALAVRAS.find(([chave]) => t.includes(chave));
  return par ? (cat.servicos.find((s) => s.servico.toLowerCase().includes(par[1].toLowerCase()))?.id ?? null) : null;
}
const ITENS = ['luz', 'tomada', 'cortina', 'ar_condicionado', 'tv', 'portao', 'fechadura', 'camera', 'sensor'];

let sql = `-- Gerado por scripts/gerar-sql-catalogo.mjs em ${new Date().toISOString()} — não edite à mão.\nbegin;\n\n`;

// "ordem" = posição na aba (o app mostra nessa ordem).
sql += carregar('tipos_aparelho', ['codigo', 'ordem', 'item', 'nome', 'para_que', 'neutro', 'central', 'alimentacao', 'cuidados', 'passos'],
  cat.tipos.map((t, n) => [v(t.id), v(n + 1, 'int'), v(t.item), v(t.nome), v(t.paraQue), v(t.neutro), v(t.central), v(t.alimentacao), v(t.cuidados), v(t.passos)]));

sql += carregar('imoveis', ['codigo', 'ordem', 'nome', 'situacao'],
  cat.imoveis.map((i, n) => [v(i.id), v(n + 1, 'int'), v(i.nome), v(i.situacao)]));

sql += carregar('itens', ['codigo', 'ordem', 'botao', 'pergunta', 'ajuda', 'tipo_padrao', 'outros_tipos'],
  cat.itens.map((i) => [v(i.id), v(i.ordem, 'int'), v(i.botao), v(i.pergunta), v(i.ajuda), v(tipo(i.tipoPadrao)), v(i.outrosTipos ?? [], 'array')]));

sql += carregar('comodos', ['codigo', 'ordem', 'nome', 'sensor_sugerido', ...ITENS.map((i) => `sugestao_${i}`)],
  cat.comodos.map((c) => [v(c.id), v(c.ordem, 'int'), v(c.nome), v(tipo(c.sensorSugerido)), ...ITENS.map((i) => v(c.sugestao?.[i] ?? 0, 'int'))]));

sql += carregar('servicos', ['codigo', 'nome', 'unidade', 'valor_referencia'],
  cat.servicos.map((s) => [v(s.id), v(s.servico), v(s.unidade), v(s.valor, 'num')]));

sql += carregar('regras_eletricas', ['codigo', 'quando', 'acao', 'mensagem', 'servico', 'servico_codigo', 'base'],
  cat.regras.map((r) => [v(r.id), v(r.quando), v(r.acao), v(r.mensagem), v(r.servico), v(servicoDaRegra(r.servico)), v(r.base)]));

sql += carregar('produtos',
  ['codigo', 'item', 'tipo', 'marca', 'modelo', 'nome', 'app', 'alexa', 'google', 'protocolo', 'neutro', 'tensao', 'corrente_max',
    'potencia_max', 'teclas', 'alimentacao', 'anatel', 'inmetro', 'fabricado_brasil', 'garantia_meses', 'preco', 'link', 'fonte',
    'foto_url', 'foto_fonte', 'status', 'verificado_em', 'observacoes'],
  cat.produtos.map((p) => [v(p.id), v(p.item), v(p.tipo), v(p.marca), v(p.modelo), v(p.nome), v(p.app), v(p.alexa), v(p.google),
    v(p.protocolo), v(p.neutro), v(p.tensao), v(p.correnteMax), v(p.potenciaMax), v(p.teclas), v(p.alimentacao), v(p.anatel),
    v(p.inmetro), v(p.fabricadoBrasil), v(p.garantiaMeses, 'int'), v(p.preco, 'num'), v(p.link), v(p.fonte), v(p.fotoUrl),
    v(p.fotoFonte), v(p.status), v(/^\d{4}-\d{2}-\d{2}$/.test(p.verificadoEm ?? '') ? p.verificadoEm : null), v(p.observacoes)]));

// Data do catálogo (uma linha só, sem histórico): o app compara para saber qual cópia é a mais nova.
sql += `insert into public.catalogo_info (id, gerado_em) values (1, ${v(cat.geradoEm)}) on conflict (id) do update set gerado_em = excluded.gerado_em;\n\n`;

sql += 'commit;\n';
// Destino opcional (os testes gravam num arquivo temporário).
const destino = process.argv[2] ?? path.join(raiz, 'supabase', 'seed', 'catalogo.sql');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, sql);
console.log(`supabase/seed/catalogo.sql: ${cat.tipos.length} tipos, ${cat.itens.length} itens, ${cat.comodos.length} cômodos, ` +
  `${cat.servicos.length} serviços, ${cat.regras.length} regras, ${cat.produtos.length} produtos.`);
