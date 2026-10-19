const API_BASE = window.location.port === '5500'
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : '/api';
const API = {
  properties: `${API_BASE}/properties`,
  tasks: `${API_BASE}/tasks`,
  contracts: `${API_BASE}/rental-contracts`
};

const operationSelect = document.querySelector('#operation-select');
const operationPanel = document.querySelector('#operation-panel');
const propertyGrid = document.querySelector('#property-grid');
const propertyDialog = document.querySelector('#property-dialog');
const notice = document.querySelector('#notice');
let properties = [];
let noticeTimer;
let propertyBeingEdited = null;

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function isTrue(value) {
  return value === true || value === 1 || value === '1';
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    const details = result?.detalhes || result?.details;
    const message = Array.isArray(details) ? details.join(' ') : '';
    throw new Error(message || result?.mensagem || result?.error || 'Não foi possível concluir a solicitação.');
  }
  return result;
}

function showNotice(message, kind = 'success') {
  notice.textContent = message;
  notice.className = `notice ${kind}`;
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4500);
}

function setGridMessage(title, description, icon = '⌕') {
  propertyGrid.innerHTML = `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${icon}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>`;
  document.querySelector('#listing-count').textContent = '0';
}

function badgeHtml(property) {
  const badges = [];
  if (property.status === 'Sold') badges.push('<span class="status-badge badge-sold">Vendido</span>');
  if (property.status === 'Inactive') badges.push('<span class="status-badge badge-inactive">Inativo</span>');
  if (property.status === 'Active' && isTrue(property.is_for_sale)) badges.push('<span class="status-badge badge-sale">À venda</span>');
  if (property.status === 'Active' && isTrue(property.is_renting)) badges.push('<span class="status-badge badge-renting">Alugado</span>');
  if (property.status === 'Active' && !isTrue(property.is_for_sale) && !isTrue(property.is_renting)) badges.push('<span class="status-badge badge-active">Ativo</span>');
  if (Number(property.open_task_count) > 0) badges.push('<span class="status-badge badge-task">Atenção necessária</span>');
  return badges.join('');
}

function cardPrice(property) {
  if (isTrue(property.is_for_sale) && (property.sale_price === null || property.sale_price === undefined)) {
    return '<span class="card-price">Sob consulta</span><span class="card-price-note">preço de venda</span>';
  }
  if (isTrue(property.is_for_sale)) {
    return `<span class="card-price">${currency.format(Number(property.sale_price))}</span><span class="card-price-note">preço de venda</span>`;
  }
  if (isTrue(property.is_renting) && property.monthly_rent !== null && property.monthly_rent !== undefined) {
    return `<span class="card-price">${currency.format(Number(property.monthly_rent))}</span><span class="card-price-note">por mês</span>`;
  }
  return '<span class="card-price">—</span><span class="card-price-note">sem preço ativo</span>';
}

function renderProperties(items) {
  properties = items;
  document.querySelector('#listing-count').textContent = items.length;
  if (!items.length) {
    setGridMessage('Nenhum imóvel encontrado', 'Tente outra busca ou cadastre um imóvel no portfólio.');
    return;
  }

  propertyGrid.innerHTML = items.map((property) => {
    const roomLabel = Number(property.bedrooms) === 1 ? 'quarto' : 'quartos';
    const taskCount = Number(property.open_task_count) || 0;
    const taskHint = taskCount ? `<span class="card-price-note">${taskCount} ${taskCount === 1 ? 'pendência' : 'pendências'}</span>` : '';
    const tipoImovel = { House: 'Casa', Apartment: 'Apartamento', Commercial: 'Comercial', Land: 'Terreno' }[property.property_type] || property.property_type;
    return `
      <button class="property-card" type="button" data-property-id="${Number(property.id)}" aria-label="Ver detalhes de ${escapeHtml(property.title)}">
        <span class="card-art"><span class="card-art-icon" aria-hidden="true">⌂</span><span class="card-type">${escapeHtml(tipoImovel)}</span></span>
        <span class="card-content">
          <span class="card-title">${escapeHtml(property.title)}</span>
          <span class="card-location">${escapeHtml(property.city)}, ${escapeHtml(property.state)}</span>
          <span class="card-price-row">${cardPrice(property)}</span>
          <span class="card-divider"></span>
          <span class="card-bottom"><span class="card-features">${Number(property.bedrooms)} ${roomLabel} <span aria-hidden="true">·</span> ${Number(property.bathrooms)} banheiros <span aria-hidden="true">·</span> ${property.area_sqm ? `${escapeHtml(property.area_sqm)} m²` : 'Área não informada'}</span><span class="card-arrow" aria-hidden="true">↗</span></span>
          <span class="badge-row card-badges">${badgeHtml(property)}</span>${taskHint ? `<span class="task-hint">${taskHint}</span>` : ''}
        </span>
      </button>`;
  }).join('');
}

function propertyUrl(filters = {}) {
  const params = new URLSearchParams();
  if (filters.filter && filters.filter !== 'all') params.set('filter', filters.filter);
  if (filters.q) params.set('q', filters.q);
  if (filters.property_type && filters.property_type !== 'all') params.set('property_type', filters.property_type);
  const query = params.toString();
  return query ? `${API.properties}?${query}` : API.properties;
}

async function buscarImoveis(filters = {}, announce = false) {
  setGridMessage('Buscando imóveis…', 'Consultando os dados mais recentes no banco da imobiliária.', '⌕');
  try {
    const items = await apiRequest(propertyUrl(filters));
    renderProperties(items);
    const suffix = filters.filter && filters.filter !== 'all' ? ` em ${filterLabel(filters.filter)}` : '';
    document.querySelector('#listings-caption').textContent = `${items.length} ${items.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}${suffix}.`;
    if (announce) showNotice(`${items.length} ${items.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}.`);
  } catch (error) {
    setGridMessage('Não foi possível carregar os imóveis', error.message || 'Verifique se o servidor e o banco de dados estão ativos.', '!');
    if (announce) showNotice(error.message, 'error');
  }
}

function filterLabel(value) {
  return ({ 'for-sale': 'À venda', renting: 'Alugados', sold: 'Vendidos', inactive: 'Inativos' })[value] || 'todas as categorias';
}

function propertyFields(values = {}) {
  const selected = (field, option, fallback) => (values[field] ?? fallback) === option ? 'selected' : '';
  const checked = isTrue(values.is_for_sale) ? 'checked' : '';
  return `
    <label class="field">Nome do imóvel<input name="title" maxlength="120" required value="${escapeHtml(values.title ?? '')}" placeholder="ex.: Casa com jardim"></label>
    <label class="field">Endereço<input name="address" maxlength="180" required value="${escapeHtml(values.address ?? '')}" placeholder="Rua e número"></label>
    <label class="field">Cidade<input name="city" maxlength="100" required value="${escapeHtml(values.city ?? '')}" placeholder="Cidade"></label>
    <label class="field">Estado<input name="state" maxlength="2" minlength="2" required value="${escapeHtml(values.state ?? '')}" placeholder="SP"></label>
    <label class="field">Tipo de imóvel<select name="property_type" required>
      <option value="House" ${selected('property_type', 'House', 'House')}>Casa</option>
      <option value="Apartment" ${selected('property_type', 'Apartment')}>Apartamento</option>
      <option value="Commercial" ${selected('property_type', 'Commercial')}>Comercial</option>
      <option value="Land" ${selected('property_type', 'Land')}>Terreno</option>
    </select></label>
    <label class="checkbox-field"><input name="is_for_sale" type="checkbox" ${checked}> À venda</label>
    <label class="field">Situação do imóvel<select name="status" required>
      <option value="Active" ${selected('status', 'Active', 'Active')}>Ativo</option>
      <option value="Sold" ${selected('status', 'Sold')}>Vendido</option>
      <option value="Inactive" ${selected('status', 'Inactive')}>Inativo</option>
    </select></label>`;
}

function operationHeading(title, explanation, method) {
  return `<div class="operation-heading"><div><h2>${title}</h2><p>${explanation}</p></div><span class="operation-tag">${method}</span></div>`;
}

function renderOperationPanel(operation) {
  if (operation === 'search') {
    operationPanel.innerHTML = `${operationHeading('Buscar imóveis', 'Pesquise no portfólio por nome, endereço, cidade ou categoria.', 'GET')}
      <form id="search-form" class="operation-form">
        <label class="field wide">Buscar<input name="q" type="search" placeholder="Imóvel, rua ou cidade"></label>
        <label class="field">Categoria<select name="filter"><option value="all">Todas as categorias</option><option value="for-sale">À venda</option><option value="renting">Alugado</option><option value="sold">Vendido</option><option value="inactive">Inativo</option></select></label>
        <label class="field">Tipo de imóvel<select name="property_type"><option value="all">Todos os tipos</option><option value="House">Casa</option><option value="Apartment">Apartamento</option><option value="Commercial">Comercial</option><option value="Land">Terreno</option></select></label>
        <div class="operation-actions"><button class="button button-primary" type="submit">⌕ &nbsp; Buscar</button><button class="button button-outline" id="clear-search" type="button">Limpar</button></div>
      </form>`;
    document.querySelector('#search-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      await buscarImoveis({ q: data.get('q').trim(), filter: data.get('filter'), property_type: data.get('property_type') }, true);
    });
    document.querySelector('#clear-search').addEventListener('click', () => {
      document.querySelector('#search-form').reset();
      buscarImoveis({}, true);
    });
    return;
  }

  if (operation === 'get-id') {
    operationPanel.innerHTML = `${operationHeading('Buscar um imóvel', 'Informe o ID no banco para consultar um imóvel específico.', 'GET POR ID')}
      <form id="get-id-form" class="operation-form"><label class="field">ID do imóvel<input name="id" type="number" min="1" step="1" required placeholder="ex.: 12"></label><div class="operation-actions"><button class="button button-primary" type="submit">Buscar por ID</button></div></form>`;
    document.querySelector('#get-id-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = new FormData(event.currentTarget).get('id');
      setGridMessage('Consultando imóvel…', `Buscando o cadastro nº ${id}.`, '⌕');
      try {
        const property = await apiRequest(`${API.properties}/${encodeURIComponent(id)}`);
        property.is_renting = false;
        property.open_task_count = 0;
        const [contracts, tasks] = await Promise.all([
          apiRequest(`${API.contracts}?property_id=${encodeURIComponent(id)}`),
          apiRequest(`${API.tasks}?property_id=${encodeURIComponent(id)}`)
        ]);
        const currentContract = contracts.find((contract) => contract.occupancy_status === 'Renting');
        if (currentContract) {
          property.is_renting = true;
          property.renter_name = `${currentContract.first_name} ${currentContract.last_name}`;
          property.renter_email = currentContract.renter_email;
          property.renter_phone = currentContract.renter_phone;
          property.rental_end_date = currentContract.end_date;
          property.months_until_end = currentContract.months_until_end;
          property.days_until_end = currentContract.days_until_end;
          property.monthly_rent = currentContract.monthly_rent;
        }
        property.open_task_count = tasks.filter((task) => task.status !== 'Completed').length;
        renderProperties([property]);
        document.querySelector('#listings-caption').textContent = `Exibindo imóvel #${property.id}.`;
      } catch (error) {
        setGridMessage('Imóvel não encontrado', error.message, '!');
        showNotice(error.message, 'error');
      }
    });
    return;
  }

  if (operation === 'post') {
    operationPanel.innerHTML = `${operationHeading('Cadastrar imóvel', 'Informe os dados do imóvel para criar um novo cadastro.', 'POST')}
      <form id="post-form" class="operation-form">${propertyFields()}<p class="form-error" hidden></p><div class="operation-actions"><button class="button button-primary" type="submit">Cadastrar imóvel</button></div></form>`;
    document.querySelector('#post-form').addEventListener('submit', (event) => submitPropertyForm(event, 'POST'));
    return;
  }

  if (operation === 'delete') {
    operationPanel.innerHTML = `${operationHeading('Excluir imóvel', 'A exclusão de imóveis com histórico de locação é bloqueada para proteger os contratos.', 'DELETE')}
      <form id="delete-form" class="operation-form"><label class="field">ID do imóvel<input name="id" type="number" min="1" step="1" required placeholder="ex.: 12"></label><div class="operation-actions"><button class="button button-danger" type="submit">Excluir imóvel</button></div></form>`;
    document.querySelector('#delete-form').addEventListener('submit', deleteProperty);
  }
}

function propertyFromForm(form) {
  const formData = new FormData(form);
  const id = Number(formData.get('id'));
  const values = propertyBeingEdited && Number(propertyBeingEdited.id) === id
    ? { ...propertyBeingEdited, ...Object.fromEntries(formData.entries()) }
    : Object.fromEntries(formData.entries());
  values.is_for_sale = form.elements.namedItem('is_for_sale').checked;
  if (values.status !== 'Active') {
    values.is_for_sale = false;
  }
  values.sale_price = values.is_for_sale ? (values.sale_price ?? null) : null;
  values.postal_code ??= '';
  values.description ??= '';
  values.bedrooms ??= 0;
  values.bathrooms ??= 0;
  values.area_sqm ??= null;
  return values;
}

async function submitPropertyForm(event, method) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorElement = form.querySelector('.form-error');
  const submitButton = form.querySelector('[type="submit"]');
  const id = method === 'PUT' ? new FormData(form).get('id') : null;
  const payload = propertyFromForm(form);
  errorElement.hidden = true;
  submitButton.disabled = true;
  try {
    const result = await apiRequest(id ? `${API.properties}/${encodeURIComponent(id)}` : API.properties, {
      method,
      body: JSON.stringify(payload)
    });
    showNotice(result.mensagem || (method === 'POST' ? 'Imóvel cadastrado.' : 'Imóvel atualizado.'));
    await buscarImoveis({}, false);
    document.querySelector('#listings-caption').textContent = 'Exibindo todos os imóveis.';
    if (method === 'PUT') {
      propertyDialog.close();
      await openProperty(id);
    }
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteProperty(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = new FormData(form).get('id');
  if (!window.confirm(`Excluir imóvel #${id}? Esta ação não poderá ser desfeita.`)) return;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const result = await apiRequest(`${API.properties}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showNotice(result.mensagem || 'Imóvel excluído.');
    await buscarImoveis({}, false);
    document.querySelector('#listings-caption').textContent = 'Exibindo todos os imóveis.';
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function formatDate(value) {
  if (!value) return 'Não informado';
  const dateValue = String(value).slice(0, 10);
  const parts = dateValue.split('-');
  if (parts.length !== 3) return escapeHtml(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function fact(label, value) {
  return `<div class="fact"><span class="fact-label">${escapeHtml(label)}</span><span class="fact-value">${escapeHtml(value)}</span></div>`;
}

function renderTasks(tasks) {
  const taskList = document.querySelector('#task-list');
  const openTasks = tasks.filter((task) => task.status !== 'Completed');
  const prioridadeEmPortugues = { Low: 'Baixa', Medium: 'Média', High: 'Alta' };
  document.querySelector('#task-count').textContent = openTasks.length ? `${openTasks.length} pendente(s)` : '';
  if (!openTasks.length) {
    taskList.innerHTML = '<p class="up-to-date">Este imóvel está totalmente em dia.</p>';
    return;
  }
  taskList.innerHTML = tasks.map((task) => `
    <article class="task-item ${task.status === 'Completed' ? 'completed' : ''}">
      <span class="task-indicator" aria-hidden="true"></span>
      <div><h4>${escapeHtml(task.title)} <span class="task-priority">${escapeHtml(prioridadeEmPortugues[task.priority] || task.priority)}</span></h4>
        <p>${escapeHtml(task.description || 'Sem detalhes adicionais.')}${task.due_date ? ` · Prazo: ${formatDate(task.due_date)}` : ''}</p>
      </div>
    </article>`).join('');
}

async function openProperty(propertyId) {
  const dialog = propertyDialog;
  dialog.showModal();
  document.querySelector('#property-view').hidden = false;
  document.querySelector('#dialog-edit-form').hidden = true;
  document.querySelector('#dialog-edit-form').innerHTML = '';
  document.querySelector('#dialog-title').textContent = 'Carregando imóvel…';
  document.querySelector('#dialog-address').textContent = '';
  document.querySelector('#dialog-badges').innerHTML = '';
  document.querySelector('#dialog-facts').innerHTML = '';
  document.querySelector('#dialog-description').textContent = '';
  document.querySelector('#rental-section').hidden = true;
  document.querySelector('#task-list').innerHTML = '<p class="muted-copy">Carregando pendências do imóvel…</p>';

  try {
    const [property, tasks, contracts] = await Promise.all([
      apiRequest(`${API.properties}/${encodeURIComponent(propertyId)}`),
      apiRequest(`${API.tasks}?property_id=${encodeURIComponent(propertyId)}`),
      apiRequest(`${API.contracts}?property_id=${encodeURIComponent(propertyId)}`)
    ]);
    propertyBeingEdited = property;
    const currentContract = contracts.find((contract) => contract.occupancy_status === 'Renting');
    const activeRental = contracts.find((contract) => contract.occupancy_status === 'Renting' || contract.occupancy_status === 'Scheduled');
    const openTasks = tasks.filter((task) => task.status !== 'Completed');
    property.is_renting = Boolean(currentContract);
    property.open_task_count = openTasks.length;

    document.querySelector('#dialog-title').textContent = property.title;
    document.querySelector('#dialog-address').textContent = `${property.address}, ${property.city}, ${property.state} ${property.postal_code}`;
    document.querySelector('#dialog-badges').innerHTML = badgeHtml(property);
    document.querySelector('#dialog-facts').innerHTML = [
      fact('Tipo de imóvel', ({ House: 'Casa', Apartment: 'Apartamento', Commercial: 'Comercial', Land: 'Terreno' })[property.property_type] || property.property_type),
      fact('Quartos', property.bedrooms),
      fact('Banheiros', property.bathrooms),
      fact('Área', property.area_sqm ? `${property.area_sqm} m²` : 'Não informada'),
      fact('À venda', isTrue(property.is_for_sale) ? currency.format(Number(property.sale_price)) : 'Não'),
      fact('Situação do cadastro', ({ Active: 'Ativo', Sold: 'Vendido', Inactive: 'Inativo' })[property.status] || property.status),
      fact('Cidade', `${property.city}, ${property.state}`),
      fact('ID do imóvel', property.id)
    ].join('');
    document.querySelector('#dialog-description').textContent = property.description || 'Nenhuma descrição informada.';

    if (activeRental) {
      const isCurrentlyRented = activeRental.occupancy_status === 'Renting';
      const remaining = Number(activeRental.months_until_end);
      const remainingText = activeRental.days_until_end < 0
        ? 'O prazo do contrato terminou.'
        : remaining === 0
          ? `O contrato termina em ${activeRental.days_until_end} dias.`
          : `O contrato termina em ${remaining} ${remaining === 1 ? 'mês' : 'meses'} (${activeRental.days_until_end} dias).`;
      document.querySelector('#rental-details').innerHTML = `
        <p class="rental-name">${escapeHtml(activeRental.first_name)} ${escapeHtml(activeRental.last_name)}${isCurrentlyRented ? '' : ' · Contrato agendado'}</p>
        <p class="rental-summary">${escapeHtml(activeRental.renter_email)} · ${escapeHtml(activeRental.renter_phone)}<br>
          ${currency.format(Number(activeRental.monthly_rent))} por mês · ${formatDate(activeRental.start_date)} até ${formatDate(activeRental.end_date)}<br>${escapeHtml(remainingText)}</p>`;
      document.querySelector('#rental-section').hidden = false;
    }
    renderTasks(tasks);
  } catch (error) {
    document.querySelector('#dialog-title').textContent = 'Não foi possível carregar o imóvel';
    document.querySelector('#dialog-description').textContent = error.message;
    document.querySelector('#task-list').innerHTML = '<p class="muted-copy">Não foi possível carregar os dados do imóvel.</p>';
  }
}

function editarImovelNoModal() {
  const editor = document.querySelector('#dialog-edit-form');
  const propertyView = document.querySelector('#property-view');
  editor.innerHTML = `<form id="modal-edit-form" class="operation-form"><h3 class="edit-form-title">Editar imóvel</h3><input type="hidden" name="id" value="${Number(propertyBeingEdited.id)}">${propertyFields(propertyBeingEdited)}<p class="form-error" hidden></p><div class="operation-actions"><button id="cancel-property-edit" class="button button-outline" type="button">Cancelar</button><button class="button button-primary" type="submit">Salvar alterações</button></div></form>`;
  propertyView.hidden = true;
  editor.hidden = false;
  editor.querySelector('#modal-edit-form').addEventListener('submit', (event) => submitPropertyForm(event, 'PUT'));
  editor.querySelector('#cancel-property-edit').addEventListener('click', () => {
    editor.hidden = true;
    editor.innerHTML = '';
    propertyView.hidden = false;
  });
}

operationSelect.addEventListener('change', () => renderOperationPanel(operationSelect.value));
document.querySelector('#load-all-button').addEventListener('click', () => buscarImoveis({}, true));
document.querySelector('#close-dialog').addEventListener('click', () => propertyDialog.close());
document.querySelector('#edit-property-button').addEventListener('click', editarImovelNoModal);
propertyDialog.addEventListener('click', (event) => {
  if (event.target === propertyDialog) propertyDialog.close();
});
propertyGrid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-property-id]');
  if (card) openProperty(card.dataset.propertyId);
});

renderOperationPanel('search');
