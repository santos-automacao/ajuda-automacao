// Celular (Android/iOS): gera o arquivo PDF e abre o compartilhamento (WhatsApp etc.).
// No navegador quem é usado é o pdf.web.ts.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function salvarPdf(html: string): Promise<'ok' | 'bloqueado'> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Enviar proposta' });
  }
  return 'ok';
}
