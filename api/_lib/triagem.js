// Triagem das três submissões públicas (Princípio VIII, FR-015, FR-019, FR-022, FR-049b).
// Nenhuma decisão é automática: toda transição aqui parte de uma ação da conta do Painel.
// Transições permitidas: data-model.md → "Submissões públicas com triagem".

import { transacao } from './db.js';
import { registrarAuditoria } from './auditoria.js';
import { enviarEmail } from './email.js';
import { falhar } from './http.js';

const TRANSICOES = {
  cadastro_voluntario: {
    pendente: ['entrevista', 'rejeitado', 'encerrado_titular'],
    entrevista: ['aprovado', 'rejeitado', 'encerrado_titular'],
  },
  candidatura: {
    em_analise: ['entrevista', 'rejeitada', 'encerrada_titular'],
    entrevista: ['aprovada', 'rejeitada', 'encerrada_titular'],
  },
  solicitacao_externa: {
    em_analise: ['aguardando_contato', 'rejeitada', 'encerrada_titular'],
    aguardando_contato: ['confirmada', 'rejeitada', 'encerrada_titular'],
  },
};

const TERMINAIS = new Set(['aprovado', 'rejeitado', 'encerrado_titular', 'aprovada', 'rejeitada', 'encerrada_titular', 'confirmada']);

// Nome usado nas ações de auditoria: voluntario.entrevista, candidatura.aprovada, ...
const PREFIXO_ACAO = { cadastro_voluntario: 'voluntario', candidatura: 'candidatura', solicitacao_externa: 'solicitacao' };

// Qual e-mail do FR-049b cada destino dispara (encerramento a pedido do titular não envia).
const EMAIL_POR_STATUS = {
  entrevista: 'entrevista',
  aguardando_contato: 'solicitacao_aguardando_contato',
  aprovado: 'aprovado', aprovada: 'aprovado', confirmada: 'aprovado',
  rejeitado: 'nao_aprovado', rejeitada: 'nao_aprovado',
};

// `origem` só importa para o voluntário cadastrado no Painel (FR-023): ele não passa por
// entrevista, e o menor vai de pendente a aprovado quando a autorização chega.
export function conferirTransicao(tabela, de, para, { origem } = {}) {
  const permitidas = TRANSICOES[tabela]?.[de] ?? [];
  const excecaoPainel = tabela === 'cadastro_voluntario' && origem === 'painel' && de === 'pendente' && para === 'aprovado';
  if (!permitidas.includes(para) && !excecaoPainel) {
    falhar(409, 'TRANSICAO_INVALIDA',
      'Esta ação não é possível na etapa atual. Recarregue a página para ver a situação mais recente.');
  }
}

// Registra a decisão. `efeito(tx, registro)` roda na MESMA transação, para o que a
// aprovação cria (pessoa e papel, evento ou campanha). O e-mail sai DEPOIS do commit:
// se falhar, a decisão continua valendo (FR-049b).
// `conta` = { id, identificador } da sessão do Painel.
export async function decidir({ tabela, id, para, motivo = null, conta, efeito }) {
  if (!TRANSICOES[tabela]) throw new Error(`Tabela de triagem desconhecida: ${tabela}`);
  const nomeCol = tabela === 'solicitacao_externa' ? 'nome_contato' : 'nome';
  const extra = tabela === 'cadastro_voluntario' ? ', origem, autorizacao_status' : '';

  const registro = await transacao(async (tx) => {
    const [atual] = await tx.query(
      `SELECT id, status, protocolo, email, ${nomeCol} AS nome ${extra}
       FROM ${tabela} WHERE id = $1 AND anonimizado_em IS NULL FOR UPDATE`, [id]);
    if (!atual) falhar(404, 'NAO_ENCONTRADO', 'Registro não encontrado.');

    conferirTransicao(tabela, atual.status, para, { origem: atual.origem });
    if (tabela === 'cadastro_voluntario' && para === 'aprovado' && atual.autorizacao_status === 'pendente') {
      falhar(422, 'AUTORIZACAO_PENDENTE',
        'Este voluntário é menor de idade. Marque a autorização do responsável como recebida antes de aprovar.');
    }

    const motivoLimpo = String(para).startsWith('rejeitad') && motivo && String(motivo).trim() ? String(motivo).trim() : null;
    await tx.query(
      `UPDATE ${tabela}
       SET status = $2, triado_por = $3, triado_em = now(),
           motivo_rejeicao = COALESCE($4, motivo_rejeicao),
           concluido_em = CASE WHEN $5 THEN now() ELSE concluido_em END
       WHERE id = $1`,
      [id, para, conta.identificador, motivoLimpo, TERMINAIS.has(para)]);

    if (efeito) await efeito(tx, atual);

    await registrarAuditoria({
      autorTipo: 'conta_institucional', autorId: conta.id,
      acao: `${PREFIXO_ACAO[tabela]}.${para}`, entidadeTipo: tabela, entidadeId: id,
      detalhe: { de: atual.status, para, comMotivo: Boolean(motivoLimpo) },
    }, tx);

    return { ...atual, motivo: motivoLimpo };
  });

  const modelo = EMAIL_POR_STATUS[para];
  let emailEnviado = null;
  if (modelo && registro.email) {
    emailEnviado = await enviarEmail({
      para: registro.email,
      modelo,
      dados: { tipo: tabela, nome: registro.nome, protocolo: registro.protocolo, motivo: registro.motivo },
      motivo: 'triagem',
      entidadeTipo: tabela,
      entidadeId: id,
    });
  }
  return { id, status: para, emailEnviado };
}
