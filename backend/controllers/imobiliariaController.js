import { pool } from '../database/conexao.js';

function validarIdImovel(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function respostaErro(res, operacao, erro) {
  console.log(`Erro ao ${operacao} imóvel: `, erro);
  return res.status(500).json({ mensagem: `Erro ao ${operacao} imóvel.` });
}

async function listarImoveis(req, res) {
  const filtro = req.query.filter;
  const busca = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const tipo = req.query.property_type;
  const tiposPermitidos = ['House', 'Apartment', 'Commercial', 'Land'];
  if (filtro && !['for-sale', 'renting', 'sold', 'inactive'].includes(filtro)) {
    return res.status(400).json({ mensagem: 'Unknown property filter. Use for-sale, renting, sold, or inactive.' });
  }
  if (tipo && !tiposPermitidos.includes(tipo)) {
    return res.status(400).json({ mensagem: `property_type must be one of: ${tiposPermitidos.join(', ')}.` });
  }

  const condicoes = [];
  const parametros = [];
  if (filtro === 'for-sale') condicoes.push("p.is_for_sale = TRUE AND p.status = 'Active'");
  if (filtro === 'renting') condicoes.push("rc.id IS NOT NULL AND p.status = 'Active'");
  if (filtro === 'sold') condicoes.push("p.status = 'Sold'");
  if (filtro === 'inactive') condicoes.push("p.status = 'Inactive'");
  if (busca) {
    condicoes.push('(p.title LIKE ? OR p.address LIKE ? OR p.city LIKE ?)');
    parametros.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  if (tipo) {
    condicoes.push('p.property_type = ?');
    parametros.push(tipo);
  }

  const consulta = `SELECT p.*, IF(rc.id IS NULL, FALSE, TRUE) AS is_renting,
      rc.id AS rental_contract_id, rc.renter_id,
      CONCAT(r.first_name, ' ', r.last_name) AS renter_name,
      rc.start_date AS rental_start_date, rc.end_date AS rental_end_date,
      rc.monthly_rent,
      TIMESTAMPDIFF(MONTH, CURDATE(), rc.end_date) AS months_until_end,
      DATEDIFF(rc.end_date, CURDATE()) AS days_until_end,
      (SELECT COUNT(*) FROM property_tasks t
        WHERE t.property_id = p.id AND t.status <> 'Completed') AS open_task_count
    FROM properties p
    LEFT JOIN rental_contracts rc ON rc.property_id = p.id AND rc.status = 'Active'
      AND rc.start_date <= CURDATE() AND rc.end_date >= CURDATE()
    LEFT JOIN renters r ON r.id = rc.renter_id
    ${condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : ''}
    ORDER BY p.id DESC`;

  try {
    const [imoveis] = await pool.query(consulta, parametros);
    return res.status(200).json(imoveis);
  } catch (erro) {
    return respostaErro(res, 'buscar', erro);
  }
}

async function buscarImovelPorId(req, res) {
  const id = validarIdImovel(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The property ID must be a positive integer.' });

  try {
    const [imoveis] = await pool.query('SELECT * FROM properties WHERE id = ?', [id]);
    if (imoveis.length === 0) return res.status(404).json({ mensagem: 'Property not found.' });
    return res.status(200).json(imoveis[0]);
  } catch (erro) {
    return respostaErro(res, 'buscar', erro);
  }
}

async function cadastrarImovel(req, res) {
  const dados = req.body;
  try {
    const [resultado] = await pool.query(
      `INSERT INTO properties
        (title, address, city, state, postal_code, property_type, is_for_sale, sale_price,
         bedrooms, bathrooms, area_sqm, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.title, dados.address, dados.city, dados.state, dados.postal_code, dados.property_type,
        dados.is_for_sale, dados.sale_price, dados.bedrooms, dados.bathrooms, dados.area_sqm,
        dados.status, dados.description]
    );
    const [imoveis] = await pool.query('SELECT * FROM properties WHERE id = ?', [resultado.insertId]);
    return res.status(201).json({ mensagem: 'Imóvel cadastrado com sucesso.', imovel: imoveis[0] });
  } catch (erro) {
    return respostaErro(res, 'cadastrar', erro);
  }
}

async function atualizarImovel(req, res) {
  const id = validarIdImovel(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The property ID must be a positive integer.' });
  const dados = req.body;

  try {
    const [existentes] = await pool.query('SELECT id FROM properties WHERE id = ?', [id]);
    if (existentes.length === 0) return res.status(404).json({ mensagem: 'Property not found.' });
    await pool.query(
      `UPDATE properties SET title = ?, address = ?, city = ?, state = ?, postal_code = ?,
       property_type = ?, is_for_sale = ?, sale_price = ?, bedrooms = ?, bathrooms = ?,
       area_sqm = ?, status = ?, description = ? WHERE id = ?`,
      [dados.title, dados.address, dados.city, dados.state, dados.postal_code, dados.property_type,
        dados.is_for_sale, dados.sale_price, dados.bedrooms, dados.bathrooms, dados.area_sqm,
        dados.status, dados.description, id]
    );
    const [imoveis] = await pool.query('SELECT * FROM properties WHERE id = ?', [id]);
    return res.status(200).json({ mensagem: 'Imóvel atualizado com sucesso.', imovel: imoveis[0] });
  } catch (erro) {
    return respostaErro(res, 'atualizar', erro);
  }
}

async function excluirImovel(req, res) {
  const id = validarIdImovel(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The property ID must be a positive integer.' });

  try {
    const [resultado] = await pool.query('DELETE FROM properties WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: 'Property not found.' });
    return res.status(200).json({ mensagem: 'Property deleted successfully.' });
  } catch (erro) {
    if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ mensagem: 'This property has rental contract history and cannot be deleted.' });
    }
    return respostaErro(res, 'excluir', erro);
  }
}

function validarIdTarefa(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const selectTarefa = `SELECT t.*, p.title AS property_title
  FROM property_tasks t INNER JOIN properties p ON p.id = t.property_id`;

async function listarTarefas(req, res) {
  const conditions = [];
  const values = [];
  if (req.query.property_id !== undefined) {
    const propertyId = validarIdTarefa(req.query.property_id);
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
  const id = validarIdTarefa(req.params.id);
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

async function validarImovelDaTarefa(propertyId, res) {
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
    if (!await validarImovelDaTarefa(dados.property_id, res)) return;
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
  const id = validarIdTarefa(req.params.id);
  if (!id) return res.status(400).json({ mensagem: 'The task ID must be a positive integer.' });
  const dados = req.body;
  try {
    const [existentes] = await pool.query('SELECT id FROM property_tasks WHERE id = ?', [id]);
    if (existentes.length === 0) return res.status(404).json({ mensagem: 'Task not found.' });
    if (!await validarImovelDaTarefa(dados.property_id, res)) return;
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
  const id = validarIdTarefa(req.params.id);
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

function validarIdContrato(valor) {
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
    const id = validarIdContrato(req.query[field]);
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
  const id = validarIdContrato(req.params.id);
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
  const id = validarIdContrato(req.params.id);
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
  const id = validarIdContrato(req.params.id);
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

function validarIdLocatario(valor) {
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
  const id = validarIdLocatario(req.params.id);
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
  const id = validarIdLocatario(req.params.id);
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
  const id = validarIdLocatario(req.params.id);
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

export {
  listarImoveis, buscarImovelPorId, cadastrarImovel, atualizarImovel, excluirImovel,
  listarLocatarios, buscarLocatarioPorId, cadastrarLocatario, atualizarLocatario, excluirLocatario,
  listarContratos, buscarContratoPorId, cadastrarContrato, atualizarContrato, excluirContrato,
  listarTarefas, buscarTarefaPorId, cadastrarTarefa, atualizarTarefa, excluirTarefa
};
