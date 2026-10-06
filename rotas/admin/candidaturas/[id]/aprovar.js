// POST /api/admin/candidaturas/:id/aprovar — entrevista → aprovada; efetiva o funcionário (FR-019).
// Numa transação só (FR-048, research D14): encontra a pessoa pelo CPF (ou cria), ENCERRA o papel
// de voluntário ativo — sem apagar — e cria o papel de funcionário com a candidatura de origem.
// `efetivado_em` marca o início do prazo de retenção do currículo (FR-056).

import { exigirAdmin } from '../../../_lib/acesso.js';
import { decidir } from '../../../_lib/triagem.js';
import { encontrarOuCriarPessoa, adicionarPapel, encerrarPapel } from '../../../_lib/papeis.js';
import { dataTexto } from '../../../_lib/datas.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const POST = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const autor = conta.identificador;

  return json(await decidir({
    tabela: 'candidatura', id, para: 'aprovada', conta,
    efeito: async (tx) => {
      const [c] = await tx.query('SELECT nome, cpf, email, telefone, data_nascimento FROM candidatura WHERE id = $1', [id]);
      const pessoa = await encontrarOuCriarPessoa(tx, {
        cpf: c.cpf, nome: c.nome, email: c.email, telefone: c.telefone,
        dataNascimento: c.data_nascimento ? dataTexto(c.data_nascimento) : null,
      }, autor);
      const [jaFuncionario] = await tx.query(
        `SELECT 1 FROM papel WHERE pessoa_id = $1 AND tipo = 'funcionario' AND status = 'ativo'`, [pessoa.id]);
      if (jaFuncionario) falhar(422, 'JA_E_FUNCIONARIO', 'Esta pessoa já é funcionária ativa do Recanto.');
      await encerrarPapel(tx, pessoa.id, 'voluntario', autor);
      await adicionarPapel(tx, pessoa.id, 'funcionario', id, autor);
      await tx.query('UPDATE candidatura SET pessoa_id = $2, efetivado_em = now() WHERE id = $1', [id, pessoa.id]);
    },
  }));
});
