import { pool } from '../database/conexao.js';

function validarId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const selectTarefa = `SELECT t.*, p.title AS property_title
  FROM property_tasks t INNER JOIN properties p ON p.id = t.property_id`;

async function listarTarefas(req, res) {
  const conditions = [];
  const values = [];
  if (req.query.property_id !== undefined) {
    const propertyId = validarId(req.query.property_id);
    if (!propertyId) return res.status(400).json({ mensagem: 'property_id must be a positive integer.' });
    conditions.push('t.property_id = ?');
    values.push(propertyId);
  }
  if (req.query.status !== undefined) {
    if (!['Open', 'In Progress', 'Completed'].includes(req.query.status)) {
      return res.status(400).json({ mensagem: 'status must be Open, In Progress, or Completed.' });
    }
    conditions.push('t.status = ?');
    values.push(req.query.status);
  }
  try {
    const [tarefas] = await pool.query(`${selectTarefa} ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY t.due_date IS NULL, t.due_date, t.id DESC`, values);
    return res.status(200).json(tarefas);
  } catch (erro) {
    console.log('Erro ao buscar tarefas: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar tarefas.' });
  }
}

async function buscarTarefaPorId(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The task ID must be a positive integer.' });
  try {
    const [tarefas] = await pool.query(`${selectTarefa} WHERE t.id = ?`, [id]);
    if (tarefas.length === 0) return res.status(404).json({ mensagem: 'Task not found.' });
    return res.status(200).json(tarefas[0]);
  } catch (erro) {
    console.log('Erro ao buscar tarefa: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar tarefa.' });
  }
}

async function validarImovel(propertyId, res) {
  const [imoveis] = await pool.query('SELECT id FROM properties WHERE id = ?', [propertyId]);
  if (imoveis.length === 0) {
    res.status(404).json({ mensagem: 'Property not found.' });
    return false;
  }
  return true;
}

async function cadastrarTarefa(req, res) {
  const dados = req.body;
  try {
    if (!await validarImovel(dados.property_id, res)) return;
    const [resultado] = await pool.query(
      `INSERT INTO property_tasks (property_id, title, description, priority, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dados.property_id, dados.title, dados.description, dados.priority, dados.due_date, dados.status]
    );
    const [tarefas] = await pool.query(`${selectTarefa} WHERE t.id = ?`, [resultado.insertId]);
    return res.status(201).json({ mensagem: 'Task created successfully.', tarefa: tarefas[0] });
  } catch (erro) {
    console.log('Erro ao cadastrar tarefa: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao cadastrar tarefa.' });
  }
}

async function atualizarTarefa(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The task ID must be a positive integer.' });
  const dados = req.body;
  try {
    const [existentes] = await pool.query('SELECT id FROM property_tasks WHERE id = ?', [id]);
    if (existentes.length === 0) return res.status(404).json({ mensagem: 'Task not found.' });
    if (!await validarImovel(dados.property_id, res)) return;
    await pool.query(
      `UPDATE property_tasks SET property_id = ?, title = ?, description = ?, priority = ?, due_date = ?, status = ?
       WHERE id = ?`,
      [dados.property_id, dados.title, dados.description, dados.priority, dados.due_date, dados.status, id]
    );
    const [tarefas] = await pool.query(`${selectTarefa} WHERE t.id = ?`, [id]);
    return res.status(200).json({ mensagem: 'Task updated successfully.', tarefa: tarefas[0] });
  } catch (erro) {
    console.log('Erro ao atualizar tarefa: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao atualizar tarefa.' });
  }
}

async function excluirTarefa(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The task ID must be a positive integer.' });
  try {
    const [resultado] = await pool.query('DELETE FROM property_tasks WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Task not found.' });
    return res.status(200).json({ mensagem: 'Task deleted successfully.' });
  } catch (erro) {
    console.log('Erro ao excluir tarefa: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao excluir tarefa.' });
  }
}

export { listarTarefas, buscarTarefaPorId, cadastrarTarefa, atualizarTarefa, excluirTarefa };
