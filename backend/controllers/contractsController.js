import { pool } from '../database/conexao.js';

function validarId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const selectContrato = `
  SELECT rc.*, p.title AS property_title, p.address AS property_address,
    r.first_name, r.last_name, r.email AS renter_email, r.phone AS renter_phone,
    CASE
      WHEN rc.status <> 'Active' THEN rc.status
      WHEN rc.start_date > CURDATE() THEN 'Scheduled'
      WHEN rc.end_date < CURDATE() THEN 'Expired'
      ELSE 'Renting'
    END AS occupancy_status,
    TIMESTAMPDIFF(MONTH, CURDATE(), rc.end_date) AS months_until_end,
    DATEDIFF(rc.end_date, CURDATE()) AS days_until_end
  FROM rental_contracts rc
  INNER JOIN properties p ON p.id = rc.property_id
  INNER JOIN renters r ON r.id = rc.renter_id`;

async function listarContratos(req, res) {
  const conditions = [];
  const values = [];
  for (const field of ['property_id', 'renter_id']) {
    if (req.query[field] === undefined) continue;
    const id = validarId(req.query[field]);
    if (!id) return res.status(400).json({ mensagem: `${field} must be a positive integer.` });
    conditions.push(`rc.${field} = ?`);
    values.push(id);
  }
  try {
    const [contratos] = await pool.query(`${selectContrato} ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY rc.id DESC`, values);
    return res.status(200).json(contratos);
  } catch (erro) {
    console.log('Erro ao buscar contratos: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar contratos.' });
  }
}

async function buscarContratoPorId(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The contract ID must be a positive integer.' });
  try {
    const [contratos] = await pool.query(`${selectContrato} WHERE rc.id = ?`, [id]);
    if (contratos.length === 0) return res.status(404).json({ mensagem: 'Rental contract not found.' });
    return res.status(200).json(contratos[0]);
  } catch (erro) {
    console.log('Erro ao buscar contrato: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao buscar contrato.' });
  }
}

async function validarRelacoesDoContrato(dados, res) {
  const [imoveis] = await pool.query('SELECT status FROM properties WHERE id = ?', [dados.property_id]);
  if (imoveis.length === 0) {
    res.status(404).json({ mensagem: 'Property not found.' });
    return false;
  }
  if (imoveis[0].status !== 'Active') {
    res.status(409).json({ mensagem: 'Rental contracts can only be linked to active properties.' });
    return false;
  }
  const [locatarios] = await pool.query('SELECT id FROM renters WHERE id = ?', [dados.renter_id]);
  if (locatarios.length === 0) {
    res.status(404).json({ mensagem: 'Renter not found.' });
    return false;
  }
  return true;
}

async function temConflitoDeContrato(dados, ignorarId = null) {
  if (dados.status !== 'Active') return false;
  let consulta = `SELECT id FROM rental_contracts
    WHERE property_id = ? AND status = 'Active' AND start_date <= ? AND end_date >= ?`;
  const parametros = [dados.property_id, dados.end_date, dados.start_date];
  if (ignorarId !== null) {
    consulta += ' AND id <> ?';
    parametros.push(ignorarId);
  }
  const [contratos] = await pool.query(consulta, parametros);
  return contratos.length > 0;
}

async function cadastrarContrato(req, res) {
  const dados = req.body;
  try {
    if (!await validarRelacoesDoContrato(dados, res)) return;
    if (await temConflitoDeContrato(dados)) {
      return res.status(409).json({ mensagem: 'This property already has an overlapping active rental contract.' });
    }
    const [resultado] = await pool.query(
      `INSERT INTO rental_contracts (property_id, renter_id, start_date, end_date, monthly_rent, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dados.property_id, dados.renter_id, dados.start_date, dados.end_date, dados.monthly_rent, dados.status, dados.notes]
    );
    const [contratos] = await pool.query(`${selectContrato} WHERE rc.id = ?`, [resultado.insertId]);
    return res.status(201).json({ mensagem: 'Rental contract created successfully.', contrato: contratos[0] });
  } catch (erro) {
    console.log('Erro ao cadastrar contrato: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao cadastrar contrato.' });
  }
}

async function atualizarContrato(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The contract ID must be a positive integer.' });
  const dados = req.body;
  try {
    const [existentes] = await pool.query('SELECT id FROM rental_contracts WHERE id = ?', [id]);
    if (existentes.length === 0) return res.status(404).json({ mensagem: 'Rental contract not found.' });
    if (!await validarRelacoesDoContrato(dados, res)) return;
    if (await temConflitoDeContrato(dados, id)) {
      return res.status(409).json({ mensagem: 'This property already has an overlapping active rental contract.' });
    }
    await pool.query(
      `UPDATE rental_contracts SET property_id = ?, renter_id = ?, start_date = ?, end_date = ?,
       monthly_rent = ?, status = ?, notes = ? WHERE id = ?`,
      [dados.property_id, dados.renter_id, dados.start_date, dados.end_date, dados.monthly_rent, dados.status, dados.notes, id]
    );
    const [contratos] = await pool.query(`${selectContrato} WHERE rc.id = ?`, [id]);
    return res.status(200).json({ mensagem: 'Rental contract updated successfully.', contrato: contratos[0] });
  } catch (erro) {
    console.log('Erro ao atualizar contrato: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao atualizar contrato.' });
  }
}

async function excluirContrato(req, res) {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The contract ID must be a positive integer.' });
  try {
    const [resultado] = await pool.query('DELETE FROM rental_contracts WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Rental contract not found.' });
    return res.status(200).json({ mensagem: 'Rental contract deleted successfully.' });
  } catch (erro) {
    console.log('Erro ao excluir contrato: ', erro);
    return res.status(500).json({ mensagem: 'Erro ao excluir contrato.' });
  }
}

export { listarContratos, buscarContratoPorId, cadastrarContrato, atualizarContrato, excluirContrato };
