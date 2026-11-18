import { router, type Href } from 'expo-router';

/** Volta uma tela; se não houver histórico (link aberto direto), vai para o destino. */
export function voltarOu(destino: string) {
  if (router.canGoBack()) router.back();
  else router.replace(destino as Href);
}

export function irPara(destino: string) {
  router.push(destino as Href);
}
