// Gera o SQL que carrega (ou atualiza) o catálogo no Supabase.
// Uso: npm run dados  →  node scripts/gerar-sql-catalogo.mjs
// Lê:   src/dados/catalogo.json (gerado da planilha)
// Gera: supabase/seed/catalogo.sql — pode rodar quantas vezes quiser ("upsert": insere ou atualiza).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cat = JSON.parse(fs.readFileSync(path.join(raiz, 'src', 'dados', 'catalogo.json'), 'utf8'));

/** Valor em SQL: texto entre aspas simples, número cru, nulo como null. */
function v(x, tipo = 'texto') {
  if (x === null || x === undefined || x === '') return 'null';
  if (tipo === 'int') return Number.isInteger(Number(x)) ? String(Number(x)) : 'null';
  if (tipo === 'num') return typeof x === 'number' ? String(x) : 'null';
  if (tipo === 'array') return `array[${x.map((i) => v(i)).join(', ')}]::text[]`;
  return `'${String(x).replace(/'/g, "''")}'`;
}

/** insert ... on conflict (id) do update — atualiza o que mudou na planilha. */
function upsert(tabela, colunas, linhas) {
  if (!linhas.length) return '';
  const valores = linhas.map((l) => `  (${l.join(', ')})`).join(',\n');
  const atualiza = colunas.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`).join(', ');
  return `insert into public.${tabela} (${colunas.join(', ')}) values\n${valores}\non conflict (id) do update set ${atualiza};\n\n`;
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

sql += upsert('tipos_aparelho', ['id', 'item', 'nome', 'para_que', 'neutro', 'central', 'alimentacao', 'cuidados', 'passos'],
  cat.tipos.map((t) => [v(t.id), v(t.item), v(t.nome), v(t.paraQue), v(t.neutro), v(t.central), v(t.alimentacao), v(t.cuidados), v(t.passos)]));

sql += upsert('imoveis', ['id', 'nome', 'situacao'], cat.imoveis.map((i) => [v(i.id), v(i.nome), v(i.situacao)]));

sql += upsert('itens', ['id', 'ordem', 'botao', 'pergunta', 'ajuda', 'tipo_padrao', 'outros_tipos'],
  cat.itens.map((i) => [v(i.id), v(i.ordem, 'int'), v(i.botao), v(i.pergunta), v(i.ajuda), v(tipo(i.tipoPadrao)), v(i.outrosTipos ?? [], 'array')]));

sql += upsert('comodos', ['id', 'ordem', 'nome', 'sensor_sugerido', ...ITENS.map((i) => `sugestao_${i}`)],
  cat.comodos.map((c) => [v(c.id), v(c.ordem, 'int'), v(c.nome), v(tipo(c.sensorSugerido)), ...ITENS.map((i) => v(c.sugestao?.[i] ?? 0, 'int'))]));

sql += upsert('servicos', ['id', 'nome', 'unidade', 'valor_referencia'],
  cat.servicos.map((s) => [v(s.id), v(s.servico), v(s.unidade), v(s.valor, 'num')]));

sql += upsert('regras_eletricas', ['id', 'quando', 'acao', 'mensagem', 'servico', 'servico_id', 'base'],
  cat.regras.map((r) => [v(r.id), v(r.quando), v(r.acao), v(r.mensagem), v(r.servico), v(servicoDaRegra(r.servico)), v(r.base)]));

sql += upsert('produtos',
  ['id', 'item', 'tipo', 'marca', 'modelo', 'nome', 'app', 'alexa', 'google', 'protocolo', 'neutro', 'tensao', 'corrente_max',
    'potencia_max', 'teclas', 'alimentacao', 'anatel', 'inmetro', 'fabricado_brasil', 'garantia_meses', 'preco', 'link', 'fonte',
    'foto_url', 'foto_fonte', 'status', 'verificado_em', 'observacoes'],
  cat.produtos.map((p) => [v(p.id), v(p.item), v(p.tipo), v(p.marca), v(p.modelo), v(p.nome), v(p.app), v(p.alexa), v(p.google),
    v(p.protocolo), v(p.neutro), v(p.tensao), v(p.correnteMax), v(p.potenciaMax), v(p.teclas, 'int'), v(p.alimentacao), v(p.anatel),
    v(p.inmetro), v(p.fabricadoBrasil), v(p.garantiaMeses, 'int'), v(p.preco, 'num'), v(p.link), v(p.fonte), v(p.fotoUrl),
    v(p.fotoFonte), v(p.status), v(/^\d{4}-\d{2}-\d{2}$/.test(p.verificadoEm ?? '') ? p.verificadoEm : null), v(p.observacoes)]));

sql += 'commit;\n';
fs.mkdirSync(path.join(raiz, 'supabase', 'seed'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'supabase', 'seed', 'catalogo.sql'), sql);
console.log(`supabase/seed/catalogo.sql: ${cat.tipos.length} tipos, ${cat.itens.length} itens, ${cat.comodos.length} cômodos, ` +
  `${cat.servicos.length} serviços, ${cat.regras.length} regras, ${cat.produtos.length} produtos.`);
