// Compara o catálogo montado do banco com o da planilha (catalogo.json), campo a campo.
// Usado por scripts/comparar-catalogo-banco.mjs; testes em scripts/testes/compararCatalogo.test.mjs.

/**
 * @returns {{ diferencas: string[], avisos: string[] }}
 * Produto que só existe no banco e está Inativo é AVISO (saiu da planilha e foi inativado de propósito).
 */
export function compararCatalogos(banco, planilha) {
  const diferencas = [];
  const avisos = [];
  const idsPlanilha = new Set(planilha.produtos.map((p) => p.id));
  const inativosSoNoBanco = banco.produtos.filter((p) => !idsPlanilha.has(p.id) && p.status === 'Inativo');
  for (const p of inativosSoNoBanco) avisos.push(`${p.id} está só no banco, Inativo (saiu da planilha)`);
  const bancoSemEles = { ...banco, produtos: banco.produtos.filter((p) => !inativosSoNoBanco.includes(p)) };

  /** Listas de objetos com "id" são casadas pelo id. */
  function comparar(a, b, caminho) {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (Array.isArray(a) && Array.isArray(b) && a.every((x) => x?.id) && b.every((x) => x?.id)) {
      const todos = [...new Set([...a.map((x) => x.id), ...b.map((x) => x.id)])];
      for (const id of todos) comparar(a.find((x) => x.id === id), b.find((x) => x.id === id), `${caminho}[${id}]`);
      if (JSON.stringify(a.map((x) => x.id)) !== JSON.stringify(b.map((x) => x.id))) diferencas.push(`${caminho}: ordem diferente`);
      return;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) comparar(a[k], b[k], `${caminho}.${k}`);
      return;
    }
    diferencas.push(`${caminho}: banco ${JSON.stringify(a)} ≠ planilha ${JSON.stringify(b)}`);
  }

  comparar(bancoSemEles, planilha, 'catalogo');
  return { diferencas, avisos };
}
