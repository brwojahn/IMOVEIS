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

  if (!Number.isInteger(propertyId) || propertyId < 1) erros.push('property_id must be a positive integer.');
  if (!Number.isInteger(renterId) || renterId < 1) erros.push('renter_id must be a positive integer.');
  if (!dataValida(dados.start_date)) erros.push('start_date must be a valid date in YYYY-MM-DD format.');
  if (!dataValida(dados.end_date)) erros.push('end_date must be a valid date in YYYY-MM-DD format.');
  if (dataValida(dados.start_date) && dataValida(dados.end_date) && dados.end_date <= dados.start_date) erros.push('end_date must be after start_date.');
  if (dados.monthly_rent === '' || !Number.isFinite(Number(dados.monthly_rent)) || Number(dados.monthly_rent) < 0) erros.push('monthly_rent must be a non-negative number.');
  if (!statusDosContratos.includes(dados.status ?? 'Active')) erros.push(`status must be one of: ${statusDosContratos.join(', ')}.`);
  if (dados.notes !== undefined && dados.notes !== null && typeof dados.notes !== 'string') erros.push('notes must be text or null.');
  if (typeof dados.notes === 'string' && dados.notes.length > 500) erros.push('notes cannot exceed 500 characters.');

  if (erros.length) return res.status(400).json({ mensagem: 'Please correct the rental contract information.', detalhes: erros });
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
