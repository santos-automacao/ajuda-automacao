// Totais da proposta, HTML do PDF e texto do WhatsApp.
import { marcaModelo, type Produto } from '@/dados/catalogo';
import { ilustracoes } from '@/dados/ilustracoes';
import type { Perfil, Projeto } from '@/estado/projeto';

import { formatarReais } from './dinheiro';
import type { LinhaServico, Recomendacao } from './recomendar';

export interface EquipamentoTotal {
  produto: Produto;
  quantidade: number;
  precoUnitario: number | null;
  subtotal: number;
}

export interface ServicoTotal extends LinhaServico {
  valorUnitario: number | null;
  subtotal: number;
}

export interface Totais {
  equipamentos: EquipamentoTotal[];
  servicos: ServicoTotal[];
  totalEquipamentos: number;
  totalServicos: number;
  total: number;
  servicosSemValor: number;
  equipamentosSemPreco: number;
}

export function calcularTotais(projeto: Projeto, perfil: Perfil, rec: Recomendacao): Totais {
  const porProduto = new Map<string, EquipamentoTotal>();
  for (const linha of rec.grupos.flatMap((g) => g.linhas)) {
    if (!linha.produto) continue;
    const atual = porProduto.get(linha.produto.id) ?? {
      produto: linha.produto,
      quantidade: 0,
      precoUnitario: projeto.precos[linha.produto.id] ?? null,
      subtotal: 0,
    };
    atual.quantidade += linha.quantidade;
    porProduto.set(linha.produto.id, atual);
  }
  const equipamentos = [...porProduto.values()].map((e) => ({
    ...e,
    subtotal: projeto.quemCompra === 'eletricista' ? (e.precoUnitario ?? 0) * e.quantidade : 0,
  }));
  const servicos = rec.servicos.map((s) => {
    const valorUnitario = perfil.valores[s.servico] ?? null;
    return { ...s, valorUnitario, subtotal: (valorUnitario ?? 0) * s.quantidade };
  });
  const totalEquipamentos = equipamentos.reduce((soma, e) => soma + e.subtotal, 0);
  const totalServicos = servicos.reduce((soma, s) => soma + s.subtotal, 0);
  return {
    equipamentos,
    servicos,
    totalEquipamentos,
    totalServicos,
    total: totalEquipamentos + totalServicos,
    servicosSemValor: servicos.filter((s) => s.valorUnitario === null).length,
    equipamentosSemPreco:
      projeto.quemCompra === 'eletricista' ? equipamentos.filter((e) => e.precoUnitario === null).length : 0,
  };
}

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

export function dataDeHoje(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function htmlProposta(projeto: Projeto, perfil: Perfil, rec: Recomendacao, totais: Totais): string {
  const eletricistaCompra = projeto.quemCompra === 'eletricista';
  const precoDe = (p: Produto | null) => (p ? projeto.precos[p.id] ?? null : null);

  const gruposHtml = rec.grupos
    .map((g) => {
      const linhas = g.linhas
        .map((l) => {
          const preco = precoDe(l.produto);
          const produto = l.produto
            ? `${escapar(l.produto.nome)}<br><small>${escapar(marcaModelo(l.produto))}</small>`
            : '<i>A definir</i>';
          return `<tr>
            <td class="icone">${ilustracoes[l.ilustracao]}</td>
            <td>${escapar(l.descricao ?? l.titulo)}</td>
            <td>${produto}</td>
            <td class="num">${l.quantidade}</td>
            ${eletricistaCompra ? `<td class="num">${preco !== null ? formatarReais(preco * l.quantidade) : '—'}</td>` : ''}
          </tr>`;
        })
        .join('');
      return `<div class="comodo">${ilustracoes[g.ilustracao]}<span>${escapar(g.titulo)}</span></div>
        <table class="itens"><colgroup><col style="width:44px"><col style="width:38%"><col><col style="width:56px">${eletricistaCompra ? '<col style="width:100px">' : ''}</colgroup>
        <tr><th></th><th>Item</th><th>Produto</th><th class="num">Qtd</th>${eletricistaCompra ? '<th class="num">Valor</th>' : ''}</tr>${linhas}</table>`;
    })
    .join('');

  const servicosHtml = totais.servicos
    .map(
      (s) => `<tr>
        <td>${escapar(s.servico)}${s.adicional ? ' <span class="tag">adicional</span>' : ''}${s.motivos.length ? `<br><small>${escapar(s.motivos.join('; '))}</small>` : ''}</td>
        <td class="num">${s.quantidade}</td>
        <td class="num">${s.valorUnitario !== null ? formatarReais(s.valorUnitario) : '—'}</td>
        <td class="num">${formatarReais(s.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const avisos = rec.alertas
    .filter((a) => a.nivel === 'atencao')
    .map((a) => `<li>${escapar(a.mensagem)}</li>`)
    .join('');

  const cliente = projeto.cliente;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Proposta de automação${cliente.nome ? ` — ${escapar(cliente.nome)}` : ''}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1B2430; margin: 28px; font-size: 13px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 22px 0 6px; border-bottom: 2px solid #1565D8; padding-bottom: 4px; }
  .topo { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #1565D8; padding-bottom: 12px; margin-bottom: 14px; }
  .direita { text-align: right; }
  .comodo { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: bold; margin: 14px 0 4px; }
  .comodo svg { width: 30px; height: 30px; }
  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  table.itens { table-layout: fixed; }
  table.itens td { overflow-wrap: anywhere; }
  tr { page-break-inside: avoid; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #E1E6ED; text-align: left; vertical-align: middle; }
  th { background: #F3F6FA; font-size: 12px; }
  td.icone { width: 34px; } td.icone svg { width: 28px; height: 28px; }
  .num { text-align: right; white-space: nowrap; }
  small { color: #4F5B6B; }
  .tag { background: #FFF6D6; border: 1px solid #F1C84B; border-radius: 4px; padding: 0 4px; font-size: 11px; }
  .totais { margin-top: 14px; margin-left: auto; width: 320px; }
  .totais td { border: none; padding: 3px 0; } .totais .grande td { font-size: 18px; font-weight: bold; border-top: 2px solid #1B2430; padding-top: 6px; }
  .aviso { background: #FFF6D6; border: 1px solid #F1C84B; padding: 8px 12px; border-radius: 6px; margin-top: 16px; }
  .aviso ul { margin: 4px 0 0 18px; padding: 0; }
  .prototipo { color: #7A4F00; font-size: 12px; margin-top: 18px; }
</style></head>
<body>
  <div class="topo">
    <div><h1>Proposta de automação residencial</h1><div>Data: ${dataDeHoje()} · Validade: 15 dias</div></div>
    <div class="direita"><b>${escapar(perfil.nome || 'Eletricista')}</b><br>${escapar(perfil.telefone)}</div>
  </div>
  <div><b>Cliente:</b> ${escapar(cliente.nome || '—')}${cliente.telefone ? ` · ${escapar(cliente.telefone)}` : ''}</div>
  <h2>Equipamentos por cômodo</h2>
  ${gruposHtml}
  ${eletricistaCompra ? '' : '<p><small>Os equipamentos são comprados pelo cliente. O eletricista envia os links de compra.</small></p>'}
  <h2>Mão de obra e serviços</h2>
  <table><tr><th>Serviço</th><th class="num">Qtd</th><th class="num">Valor unit.</th><th class="num">Subtotal</th></tr>${servicosHtml}</table>
  <table class="totais">
    ${eletricistaCompra ? `<tr><td>Equipamentos</td><td class="num">${formatarReais(totais.totalEquipamentos)}</td></tr>` : ''}
    <tr><td>Mão de obra e serviços</td><td class="num">${formatarReais(totais.totalServicos)}</td></tr>
    <tr class="grande"><td>Total</td><td class="num">${formatarReais(totais.total)}</td></tr>
  </table>
  ${avisos ? `<div class="aviso"><b>Observações técnicas</b><ul>${avisos}</ul></div>` : ''}
  <p class="prototipo">Gerado pelo protótipo do Ajuda Automação. Os produtos ainda estão em verificação (homologação Anatel e manual do fabricante).</p>
</body></html>`;
}

/** Texto curto para mandar no WhatsApp junto com o PDF. */
export function textoWhatsapp(projeto: Projeto, perfil: Perfil, rec: Recomendacao, totais: Totais): string {
  const saudacao = projeto.cliente.nome ? `Olá, ${projeto.cliente.nome}!` : 'Olá!';
  const comodos = rec.grupos
    .map((g) => `• ${g.titulo}: ${g.linhas.map((l) => `${l.descricao ?? l.titulo} (${l.quantidade})`).join(', ')}`)
    .join('\n');
  return [
    `${saudacao} Segue o resumo da proposta de automação da sua casa:`,
    '',
    comodos,
    '',
    `Total: ${formatarReais(totais.total)}`,
    'Envio o PDF com todos os detalhes.',
    '',
    [perfil.nome, perfil.telefone].filter(Boolean).join(' · '),
  ]
    .join('\n')
    .trim();
}

/** Link do WhatsApp. Sem telefone, abre a lista de contatos. */
export function linkWhatsapp(telefone: string, texto: string): string {
  let numero = telefone.replace(/\D/g, '');
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
