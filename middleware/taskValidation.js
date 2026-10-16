const prioridades = ['Low', 'Medium', 'High'];
const statusDasTarefas = ['Open', 'In Progress', 'Completed'];

function dataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function validarTarefa(req, res, next) {
  const dados = req.body ?? {};
  const erros = [];
  const propertyId = Number(dados.property_id);

  if (!Number.isInteger(propertyId) || propertyId < 1) erros.push('property_id must be a positive integer.');
  if (typeof dados.title !== 'string' || !dados.title.trim()) erros.push('title is required.');
  if (typeof dados.title === 'string' && dados.title.trim().length > 120) erros.push('title cannot exceed 120 characters.');
  if (dados.description !== undefined && typeof dados.description !== 'string') erros.push('description must be text.');
  if (typeof dados.description === 'string' && dados.description.length > 500) erros.push('description cannot exceed 500 characters.');
  if (!prioridades.includes(dados.priority ?? 'Medium')) erros.push(`priority must be one of: ${prioridades.join(', ')}.`);
  if (dados.due_date !== undefined && dados.due_date !== null && dados.due_date !== '' && !dataValida(dados.due_date)) erros.push('due_date must be a valid date in YYYY-MM-DD format or null.');
  if (!statusDasTarefas.includes(dados.status ?? 'Open')) erros.push(`status must be one of: ${statusDasTarefas.join(', ')}.`);

  if (erros.length) return res.status(400).json({ mensagem: 'Please correct the task information.', detalhes: erros });
  req.body = {
    property_id: propertyId,
    title: dados.title.trim(),
    description: dados.description?.trim() ?? '',
    priority: dados.priority ?? 'Medium',
    due_date: dados.due_date || null,
    status: dados.status ?? 'Open'
  };
  return next();
}

export { validarTarefa };
