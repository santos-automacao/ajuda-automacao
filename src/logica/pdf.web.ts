// Navegador (notebook ou celular): abre a proposta numa janela nova e chama a impressão.
// Na janela de impressão, o eletricista escolhe "Salvar como PDF".
export async function salvarPdf(html: string): Promise<'ok' | 'bloqueado'> {
  const janela = window.open('', '_blank');
  if (!janela) return 'bloqueado';
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 400);
  return 'ok';
}
