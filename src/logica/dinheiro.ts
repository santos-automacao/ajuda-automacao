/** 1234.5 → "R$ 1.234,50" */
export function formatarReais(valor: number): string {
  const [inteiro, centavos] = Math.abs(valor).toFixed(2).split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}R$ ${comPontos},${centavos}`;
}

/** 1234.5 → "1.234,50" (para mostrar dentro de um campo) */
export function formatarNumero(valor: number): string {
  return formatarReais(valor).replace('R$ ', '');
}

/** Lê o que o eletricista digitou: "80", "80,50", "1.200,00" ou "80.50". */
export function lerReais(texto: string): number | null {
  let limpo = texto.replace(/[^\d.,]/g, '');
  if (!limpo) return null;
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (!/^\d+\.\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/\./g, '');
  }
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}
