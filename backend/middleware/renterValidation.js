function validarLocatario(req, res, next) {
  const dados = req.body ?? {};
  const erros = [];

  for (const campo of ['first_name', 'last_name', 'email', 'phone']) {
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) erros.push(`O campo ${campo} é obrigatório.`);
  }
  if (typeof dados.first_name === 'string' && dados.first_name.trim().length > 80) erros.push('O primeiro nome não pode ter mais de 80 caracteres.');
  if (typeof dados.last_name === 'string' && dados.last_name.trim().length > 80) erros.push('O sobrenome não pode ter mais de 80 caracteres.');
  if (typeof dados.email === 'string' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim()) || dados.email.trim().length > 160)) erros.push('O e-mail deve ser válido e ter menos de 160 caracteres.');
  if (typeof dados.phone === 'string' && dados.phone.trim().length > 30) erros.push('O telefone não pode ter mais de 30 caracteres.');

  if (erros.length) return res.status(400).json({ mensagem: 'Corrija os dados do locatário.', detalhes: erros });
  req.body = {
    first_name: dados.first_name.trim(),
    last_name: dados.last_name.trim(),
    email: dados.email.trim().toLowerCase(),
    phone: dados.phone.trim()
  };
  return next();
}

export { validarLocatario };
