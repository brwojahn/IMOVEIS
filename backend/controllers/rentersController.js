import { pool } from '../database/conexao.js';

function validarId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listarLocatarios(_req, res) {
  try {
    const [locatarios] = await pool.query('SELECT * FROM renters ORDER BY last_name, first_name');
    return res.status(200).json(locatarios);
  } catch (erro) {
    console.log('Erro ao buscar locatários: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar locatários.' });
  }
}

async function buscarLocatarioPorId(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The renter ID must be a positive integer.' });
  try {
    const [locatarios] = await pool.query('SELECT * FROM renters WHERE id = ?', [id]);
    if (locatarios.length === 0) return res.status(404).json({ mensagem: 'Renter not found.' });
    return res.status(200).json(locatarios[0]);
  } catch (erro) {
    console.log('Erro ao buscar locatário: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar locatário.' });
  }
}

async function cadastrarLocatario(req, res) {
  const { first_name, last_name, email, phone } = req.body;
  try {
    const [resultado] = await pool.query(
      'INSERT INTO renters (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, phone]
    );
    const [locatarios] = await pool.query('SELECT * FROM renters WHERE id = ?', [resultado.insertId]);
    return res.status(201).json({ mensagem: 'Renter created successfully.', locatario: locatarios[0] });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensagem: 'A renter with this email already exists.' });
    console.log('Erro ao cadastrar locatário: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao cadastrar locatário.' });
  }
}

async function atualizarLocatario(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The renter ID must be a positive integer.' });
  const { first_name, last_name, email, phone } = req.body;
  try {
    const [existentes] = await pool.query('SELECT id FROM renters WHERE id = ?', [id]);
    if (existentes.length === 0) return res.status(404).json({ mensagem: 'Renter not found.' });
    await pool.query(
      'UPDATE renters SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ?',
      [first_name, last_name, email, phone, id]
    );
    const [locatarios] = await pool.query('SELECT * FROM renters WHERE id = ?', [id]);
    return res.status(200).json({ mensagem: 'Renter updated successfully.', locatario: locatarios[0] });
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensagem: 'A renter with this email already exists.' });
    console.log('Erro ao atualizar locatário: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao atualizar locatário.' });
  }
}

async function excluirLocatario(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The renter ID must be a positive integer.' });
  try {
    const [resultado] = await pool.query('DELETE FROM renters WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Renter not found.' });
    return res.status(200).json({ mensagem: 'Renter deleted successfully.' });
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ mensagem: 'This renter has rental contract history and cannot be deleted.' });
    console.log('Erro ao excluir locatário: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao excluir locatário.' });
  }
}

export { listarLocatarios, buscarLocatarioPorId, cadastrarLocatario, atualizarLocatario, excluirLocatario };
