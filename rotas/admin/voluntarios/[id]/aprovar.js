// POST /api/admin/voluntarios/:id/aprovar — entrevista → aprovado (FR-015).
// Na mesma transação: encontra a pessoa pelo CPF (ou cria) e dá a ela o papel de voluntário.
// Menor com autorização pendente → 422 AUTORIZACAO_PENDENTE (FR-012).
// Funcionário ativo → 422 FUNCIONARIO_NAO_PODE_SER_VOLUNTARIO (FR-048, índice do banco — D14).
// Quem já é voluntário ativo não ganha um segundo papel: o cadastro novo só é ligado a ele.

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { encontrarOuCriarPessoa, adicionarPapel } from '../../../_lib/papeis.js';
import { dataTexto } from '../../../_lib/datas.js';
import { json, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const autor = conta.identificador;

  const resultado = await decidir({
    tabela: 'cadastro_voluntario', id, para: 'aprovado', conta,
    efeito: async (tx) => {
      const [c] = await tx.query(
        'SELECT nome, cpf, email, telefone, data_nascimento FROM cadastro_voluntario WHERE id = $1', [id]);
      const pessoa = await encontrarOuCriarPessoa(tx, {
        cpf: c.cpf, nome: c.nome, email: c.email, telefone: c.telefone,
        dataNascimento: c.data_nascimento ? dataTexto(c.data_nascimento) : null,
      }, autor);
      const [jaVoluntario] = await tx.query(
        `SELECT id FROM papel WHERE pessoa_id = $1 AND tipo = 'voluntario' AND status = 'ativo'`, [pessoa.id]);
      if (!jaVoluntario) await adicionarPapel(tx, pessoa.id, 'voluntario', id, autor);
      await tx.query('UPDATE cadastro_voluntario SET pessoa_id = $2 WHERE id = $1', [id, pessoa.id]);
    },
  });
  return json(resultado);
});
