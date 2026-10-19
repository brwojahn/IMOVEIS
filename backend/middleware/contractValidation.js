const statusDosContratos = ['Active', 'Completed', 'Cancelled'];

function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function validarContrato(req, res, next) {
  const dados = req.body ?? {};
  const erros = [];
  const propertyId = Number(dados.property_id);
  const renterId = Number(dados.renter_id);

  if (!Number.isInteger(propertyId) || propertyId < 1) erros.push('O campo property_id deve ser um número inteiro positivo.');
  if (!Number.isInteger(renterId) || renterId < 1) erros.push('O campo renter_id deve ser um número inteiro positivo.');
  if (!dataValida(dados.start_date)) erros.push('O campo start_date deve ser uma data válida no formato AAAA-MM-DD.');
  if (!dataValida(dados.end_date)) erros.push('O campo end_date deve ser uma data válida no formato AAAA-MM-DD.');
  if (dataValida(dados.start_date) && dataValida(dados.end_date) && dados.end_date <= dados.start_date) erros.push('A data end_date deve ser posterior à data start_date.');
  if (dados.monthly_rent === '' || !Number.isFinite(Number(dados.monthly_rent)) || Number(dados.monthly_rent) < 0) erros.push('O campo monthly_rent deve ser um número não negativo.');
  if (!statusDosContratos.includes(dados.status ?? 'Active')) erros.push(`O campo status deve ser um destes valores: ${statusDosContratos.join(', ')}.`);
  if (dados.notes !== undefined && dados.notes !== null && typeof dados.notes !== 'string') erros.push('O campo notes deve ser um texto ou nulo.');
  if (typeof dados.notes === 'string' && dados.notes.length > 500) erros.push('O campo notes não pode ter mais de 500 caracteres.');

  if (erros.length) return res.status(400).json({ mensagem: 'Corrija os dados do contrato de locação.', detalhes: erros });
  req.body = {
    property_id: propertyId,
    renter_id: renterId,
    start_date: dados.start_date,
    end_date: dados.end_date,
    monthly_rent: Number(dados.monthly_rent),
    status: dados.status ?? 'Active',
    notes: dados.notes?.trim() || null
  };
  return next();
}

export { validarContrato };
