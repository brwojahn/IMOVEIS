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
    if (typeof dados[campo] !== 'string' || !dados[campo].trim()) erros.push(`${campo} is required.`);
  }
  const limites = { title: 120, address: 180, city: 100, description: 60000 };
  for (const [campo, limite] of Object.entries(limites)) {
    if (typeof dados[campo] === 'string' && dados[campo].trim().length > limite) erros.push(`${campo} cannot exceed ${limite} characters.`);
  }
  if (typeof dados.state === 'string' && dados.state.trim().length !== 2) erros.push('state must contain exactly 2 characters.');
  if (typeof dados.postal_code === 'string' && dados.postal_code.trim().length > 10) erros.push('postal_code cannot exceed 10 characters.');
  if (!tiposDeImovel.includes(dados.property_type)) erros.push(`property_type must be one of: ${tiposDeImovel.join(', ')}.`);
  if (typeof dados.is_for_sale !== 'boolean' && ![0, 1, '0', '1', 'true', 'false'].includes(dados.is_for_sale)) erros.push('is_for_sale must be true or false.');
  if (vendaAtiva && dados.sale_price !== null && dados.sale_price !== undefined && dados.sale_price !== '' && !numeroNaoNegativo(dados.sale_price)) erros.push('sale_price must be a non-negative number or null.');
  if (vendaAtiva && Number(dados.sale_price) > 9999999999.99) erros.push('sale_price exceeds the maximum supported amount.');
  if (dados.bedrooms !== undefined && !inteiroNaoNegativo(dados.bedrooms)) erros.push('bedrooms must be a non-negative whole number.');
  if (dados.bathrooms !== undefined && !inteiroNaoNegativo(dados.bathrooms)) erros.push('bathrooms must be a non-negative whole number.');
  if (dados.bedrooms !== undefined && Number(dados.bedrooms) > 255) erros.push('bedrooms cannot exceed 255.');
  if (dados.bathrooms !== undefined && Number(dados.bathrooms) > 255) erros.push('bathrooms cannot exceed 255.');
  if (dados.area_sqm !== null && dados.area_sqm !== undefined && dados.area_sqm !== '' && (!Number.isFinite(Number(dados.area_sqm)) || Number(dados.area_sqm) <= 0)) erros.push('area_sqm must be a positive number or null.');
  if (dados.area_sqm !== null && dados.area_sqm !== undefined && dados.area_sqm !== '' && Number(dados.area_sqm) > 9999999.99) erros.push('area_sqm exceeds the maximum supported area.');
  if (!statusDoImovel.includes(dados.status ?? 'Active')) erros.push(`status must be one of: ${statusDoImovel.join(', ')}.`);
  if ((dados.status ?? 'Active') !== 'Active' && vendaAtiva) erros.push('Only active properties can be listed for sale.');

  if (erros.length) return res.status(400).json({ mensagem: 'Please correct the property information.', detalhes: erros });

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
