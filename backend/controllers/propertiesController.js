import { pool } from '../database/conexao.js';

function validarId(valor) {
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
  const id = validarId(req.params.id);
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
  const id = validarId(req.params.id);
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
  const id = validarId(req.params.id);
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

export { listarImoveis, buscarImovelPorId, cadastrarImovel, atualizarImovel, excluirImovel };
