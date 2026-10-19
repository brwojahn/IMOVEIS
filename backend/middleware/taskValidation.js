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

  if (!Number.isInteger(propertyId) || propertyId < 1) erros.push('O campo property_id deve ser um número inteiro positivo.');
  if (typeof dados.title !== 'string' || !dados.title.trim()) erros.push('O título da tarefa é obrigatório.');
  if (typeof dados.title === 'string' && dados.title.trim().length > 120) erros.push('O título não pode ter mais de 120 caracteres.');
  if (dados.description !== undefined && typeof dados.description !== 'string') erros.push('A descrição deve ser um texto.');
  if (typeof dados.description === 'string' && dados.description.length > 500) erros.push('A descrição não pode ter mais de 500 caracteres.');
  if (!prioridades.includes(dados.priority ?? 'Medium')) erros.push(`O campo priority deve ser um destes valores: ${prioridades.join(', ')}.`);
  if (dados.due_date !== undefined && dados.due_date !== null && dados.due_date !== '' && !dataValida(dados.due_date)) erros.push('O campo due_date deve ser uma data válida no formato AAAA-MM-DD ou nulo.');
  if (!statusDasTarefas.includes(dados.status ?? 'Open')) erros.push(`O campo status deve ser um destes valores: ${statusDasTarefas.join(', ')}.`);

  if (erros.length) return res.status(400).json({ mensagem: 'Corrija os dados da tarefa.', detalhes: erros });
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
