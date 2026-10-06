// GET /api/admin/voluntarios/:id/impressao — dados para a equipe imprimir os documentos do
// voluntário: o termo de adesão (Lei 9.608/1998, todo voluntário — 2026-10-06) e, se menor, a
// autorização do responsável (FR-012, research D17). Só no Painel: nenhuma rota pública devolve
// esses dados a partir do protocolo.

import { sql } from '../../../_lib/db.js';
import { exigirAdmin } from '../../../_lib/acesso.js';
import { registrarAuditoria } from '../../../_lib/auditoria.js';
import { dataTexto } from '../../../_lib/datas.js';
import { json, falhar, idDaRota, rota } from '../../../_lib/http.js';

export const GET = rota(async (request) => {
  const { conta } = await exigirAdmin(request);
  const id = idDaRota(request);
  const [c] = await sql`
    SELECT protocolo, nome, data_nascimento, rg, cpf, escolaridade, profissao, endereco, bairro, cep, cidade, uf,
           telefone, email, tipo_servico, objetivos, condicoes, menor_de_idade, anonimizado_em
    FROM cadastro_voluntario WHERE id = ${id}`;
  if (!c) falhar(404, 'NAO_ENCONTRADO', 'Cadastro não encontrado.');
  if (c.anonimizado_em) falhar(409, 'REGISTRO_ANONIMIZADO', 'Este cadastro foi anonimizado.');
  await registrarAuditoria({
    autorTipo: 'conta_institucional', autorId: conta.id,
    acao: 'voluntario.imprimir_documentos', entidadeTipo: 'cadastro_voluntario', entidadeId: id,
  });
  return json({
    protocolo: c.protocolo, nome: c.nome, dataNascimento: dataTexto(c.data_nascimento), rg: c.rg, cpf: c.cpf,
    escolaridade: c.escolaridade, profissao: c.profissao,
    endereco: c.endereco, bairro: c.bairro, cep: c.cep, cidade: c.cidade, uf: c.uf, telefone: c.telefone, email: c.email,
    tipoServico: c.tipo_servico, objetivos: c.objetivos, condicoes: c.condicoes, menorDeIdade: c.menor_de_idade,
  });
});
