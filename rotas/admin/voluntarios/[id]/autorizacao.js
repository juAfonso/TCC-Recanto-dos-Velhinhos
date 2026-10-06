// GET /api/admin/voluntarios/:id/autorizacao — dados para a equipe reimprimir a autorização do
// menor (research D17). Só no Painel: nenhuma rota pública devolve dados de menor.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { dataTexto } from '../../../_lib/datas.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const GET = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [c] = await sql`
    SELECT protocolo, nome, data_nascimento, rg, cpf, endereco, bairro, cep, cidade, uf, telefone, email,
           tipo_servico, objetivos, condicoes, menor_de_idade, anonimizado_em
    FROM cadastro_voluntario WHERE id = ${id}`;
  if (!c) falhar(404, 'NAO_ENCONTRADO', 'Cadastro não encontrado.');
  if (!c.menor_de_idade) falhar(409, 'NAO_E_MENOR', 'Este voluntário não é menor de idade.');
  if (c.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Este cadastro foi anonimizado.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'voluntario.reimprimir_autorizacao', entidadeTipo: 'cadastro_voluntario', entidadeId: id,
  });
  return json({
    protocolo: c.protocolo, nome: c.nome, dataNascimento: dataTexto(c.data_nascimento), rg: c.rg, cpf: c.cpf,
    endereco: c.endereco, bairro: c.bairro, cep: c.cep, cidade: c.cidade, uf: c.uf, telefone: c.telefone, email: c.email,
    tipoServico: c.tipo_servico, objetivos: c.objetivos, condicoes: c.condicoes,
  });
});
