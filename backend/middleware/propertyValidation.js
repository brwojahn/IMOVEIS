const tiposDeImovel = ['House', 'Apartment', 'Commercial', 'Land'];
const statusDoImovel = ['Active', 'Sold', 'Inactive'];

function numeroNaoNegativo(valor) {
  return valor !== '' && valor !== null && Number.isFinite(Number(valor)) && Number(valor) >= 0;
}

function inteiroNaoNegativo(valor) {
  return numeroNaoNegativo(valor) && Number.isInteger(Number(valor));
}

function validarImovel(req, res, next) {
  const dados = req.body ?? {};
  const erros = [];
  const vendaAtiva = dados.is_for_sale === true || dados.is_for_sale === 1 || dados.is_for_sale === '1' || dados.is_for_sale === 'true';

  for (const campo of ['title', 'address', 'city', 'state']) {
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) erros.push(`O campo ${campo} é obrigatório.`);
  }
  const limites = { title: 120, address: 180, city: 100, description: 60000 };
  for (const [campo, limite] of Object.entries(limites)) {
    if (typeof dados[campo] === 'string' && dados[campo].trim().length > limite) erros.push(`O campo ${campo} não pode ter mais de ${limite} caracteres.`);
  }
  if (typeof dados.state === 'string' && dados.state.trim().length !== 2) erros.push('O campo state deve conter exatamente 2 caracteres.');
  if (typeof dados.postal_code === 'string' && dados.postal_code.trim().length > 10) erros.push('O campo postal_code não pode ter mais de 10 caracteres.');
  if (!tiposDeImovel.includes(dados.property_type)) erros.push(`O campo property_type deve ser um destes valores: ${tiposDeImovel.join(', ')}.`);
  if (typeof dados.is_for_sale !== 'boolean' && ![0, 1, '0', '1', 'true', 'false'].includes(dados.is_for_sale)) erros.push('O campo is_for_sale deve ser verdadeiro ou falso.');
  if (vendaAtiva && dados.sale_price !== null && dados.sale_price !== undefined && dados.sale_price !== '' && !numeroNaoNegativo(dados.sale_price)) erros.push('O campo sale_price deve ser um número não negativo ou nulo.');
  if (vendaAtiva && Number(dados.sale_price) > 9999999999.99) erros.push('O campo sale_price excede o valor máximo permitido.');
  if (dados.bedrooms !== undefined && !inteiroNaoNegativo(dados.bedrooms)) erros.push('O campo bedrooms deve ser um número inteiro não negativo.');
  if (dados.bathrooms !== undefined && !inteiroNaoNegativo(dados.bathrooms)) erros.push('O campo bathrooms deve ser um número inteiro não negativo.');
  if (dados.bedrooms !== undefined && Number(dados.bedrooms) > 255) erros.push('O campo bedrooms não pode ser maior que 255.');
  if (dados.bathrooms !== undefined && Number(dados.bathrooms) > 255) erros.push('O campo bathrooms não pode ser maior que 255.');
  if (dados.area_sqm !== null && dados.area_sqm !== undefined && dados.area_sqm !== '' && (!Number.isFinite(Number(dados.area_sqm)) || Number(dados.area_sqm) <= 0)) erros.push('O campo area_sqm deve ser um número positivo ou nulo.');
  if (dados.area_sqm !== null && dados.area_sqm !== undefined && dados.area_sqm !== '' && Number(dados.area_sqm) > 9999999.99) erros.push('O campo area_sqm excede a área máxima permitida.');
  if (!statusDoImovel.includes(dados.status ?? 'Active')) erros.push(`O campo status deve ser um destes valores: ${statusDoImovel.join(', ')}.`);
  if ((dados.status ?? 'Active') !== 'Active' && vendaAtiva) erros.push('Somente imóveis ativos podem ser anunciados para venda.');

  if (erros.length) return res.status(400).json({ mensagem: 'Corrija os dados do imóvel.', detalhes: erros });

  req.body = {
    title: dados.title.trim(),
    address: dados.address.trim(),
    city: dados.city.trim(),
    state: dados.state.trim().toUpperCase(),
    postal_code: typeof dados.postal_code === 'string' ? dados.postal_code.trim() : '',
    property_type: dados.property_type,
    is_for_sale: vendaAtiva ? 1 : 0,
    sale_price: vendaAtiva && dados.sale_price !== null && dados.sale_price !== undefined && dados.sale_price !== '' ? Number(dados.sale_price) : null,
    bedrooms: dados.bedrooms === undefined ? 0 : Number(dados.bedrooms),
    bathrooms: dados.bathrooms === undefined ? 0 : Number(dados.bathrooms),
    area_sqm: dados.area_sqm === null || dados.area_sqm === undefined || dados.area_sqm === '' ? null : Number(dados.area_sqm),
    status: dados.status ?? 'Active',
    description: typeof dados.description === 'string' ? dados.description.trim() : ''
  };
  return next();
}

export { validarImovel };
