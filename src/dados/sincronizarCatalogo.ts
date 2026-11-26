// Catálogo do banco com cópia no aparelho:
//  1. Ao abrir: usa a cópia guardada, se for mais nova que a que veio no app (sem esperar internet).
//  2. Depois, em segundo plano: baixa do banco e guarda. A cópia nova vale na PRÓXIMA abertura,
//     para a lista recomendada não mudar no meio de um orçamento.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CATALOGO_DO_APP, usarCatalogo, type Catalogo } from './catalogo';
import { buscarLinhas, catalogoValido, maisNovo, montarCatalogo, type ClienteLeitura } from './catalogoBanco';
import { supabase } from './supabase';

export const CHAVE_CATALOGO = 'ajuda-automacao:catalogo';

/** A cópia guardada, ou null se não existe ou está estragada. */
async function lerGuardado(): Promise<Catalogo | null> {
  try {
    const texto = await AsyncStorage.getItem(CHAVE_CATALOGO);
    const copia: unknown = texto ? JSON.parse(texto) : null;
    return catalogoValido(copia) ? copia : null;
  } catch {
    return null;
  }
}

export async function carregarCatalogoGuardado(): Promise<void> {
  const escolhido = maisNovo(CATALOGO_DO_APP, await lerGuardado());
  if (escolhido !== CATALOGO_DO_APP) usarCatalogo(escolhido);
}

export async function baixarCatalogo(): Promise<void> {
  if (!supabase) return;
  try {
    // O tipo do cliente do Supabase é fundo demais para o TypeScript comparar; o formato é o mesmo.
    const novo = montarCatalogo(await buscarLinhas(supabase as unknown as ClienteLeitura));
    if (!catalogoValido(novo)) return;
    const atual = maisNovo(CATALOGO_DO_APP, await lerGuardado());
    if (Date.parse(novo.geradoEm) <= Date.parse(atual.geradoEm)) return; // nada de novo
    await AsyncStorage.setItem(CHAVE_CATALOGO, JSON.stringify(novo));
  } catch (erro) {
    if (__DEV__) console.warn('Catálogo: não foi possível baixar do banco.', erro);
  }
}
