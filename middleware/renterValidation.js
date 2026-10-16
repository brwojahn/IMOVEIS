function validarLocatario(req, res, next) {
  const dados = req.body ?? {};
  const erros = [];

  for (const campo of ['first_name', 'last_name', 'email', 'phone']) {
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) erros.push(`${campo} is required.`);
  }
  if (typeof dados.first_name === 'string' && dados.first_name.trim().length > 80) erros.push('first_name cannot exceed 80 characters.');
  if (typeof dados.last_name === 'string' && dados.last_name.trim().length > 80) erros.push('last_name cannot exceed 80 characters.');
  if (typeof dados.email === 'string' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim()) || dados.email.trim().length > 160)) erros.push('email must be a valid address under 160 characters.');
  if (typeof dados.phone === 'string' && dados.phone.trim().length > 30) erros.push('phone cannot exceed 30 characters.');

  if (erros.length) return res.status(400).json({ mensagem: 'Please correct the renter information.', detalhes: erros });
  req.body = {
    first_name: dados.first_name.trim(),
    last_name: dados.last_name.trim(),
    email: dados.email.trim().toLowerCase(),
    phone: dados.phone.trim()
  };
  return next();
}

export { validarLocatario };
