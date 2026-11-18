// Passo 2 — quais cômodos e quantos de cada.
import { Redirect } from 'expo-router';

import { Aviso, Grade } from '@/componentes/Blocos';
import { LinhaContador } from '@/componentes/Contador';
import { Carregando, Tela } from '@/componentes/Tela';
import { catalogo } from '@/dados/catalogo';
import type { NomeIlustracao } from '@/dados/ilustracoes';
import { totalComodos, useApp, useMarcarTela } from '@/estado/projeto';
import { irPara, voltarOu } from '@/logica/navegar';

export default function TelaComodos() {
  const { estado, dispatch } = useApp();
  useMarcarTela('/projeto/comodos');
  const projeto = estado.projeto;

  if (!estado.carregado) return <Carregando />;
  if (!projeto) return <Redirect href="/" />;

  const total = totalComodos(projeto);

  return (
    <Tela
      passo={2}
      titulo="Quais cômodos vão ter automação?"
      subtitulo="Use − e + para dizer quantos de cada."
      voltar={() => voltarOu('/projeto/imovel')}
      continuar={() => irPara('/projeto/itens?c=0')}
      podeContinuar={total > 0}
      motivo="Adicione pelo menos 1 cômodo.">
      <Grade>
        {catalogo.comodos.map((c) => (
          <LinhaContador
            key={c.id}
            ilustracao={`comodo_${c.id}` as NomeIlustracao}
            nome={c.nome}
            valor={projeto.contagem[c.id] ?? 0}
            onMudar={(quantidade) => dispatch({ tipo: 'contagemComodo', comodo: c.id, quantidade })}
          />
        ))}
      </Grade>
      <Aviso
        nivel={total > 0 ? 'sucesso' : 'info'}
        titulo={total > 0 ? `Total: ${total} ${total === 1 ? 'cômodo' : 'cômodos'}` : 'Nenhum cômodo ainda'}
      />
    </Tela>
  );
}
