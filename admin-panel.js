/* =========================================
   LOCALIZA AÊ — admin-panel.js
   Painel do Funcionário
   ========================================= */

/* ===== STATE ===== */
const STORAGE_KEY  = 'lz_ae_objects';
const THEME_KEY    = 'lz_ae_theme';

let currentEmployee = null;   // { name, role }
let currentItemId   = null;
let currentType     = 'Perdido';

const EMOJI_MAP = {
  Documentos:'🪪', Eletrônicos:'📱', Chaves:'🔑', Carteiras:'👛',
  Roupas:'👕', Animais:'🐾', Bolsas:'👜', Joias:'💍', Outros:'📦'
};
const COLOR_MAP = {
  Perdido:'#3B5BDB', Encontrado:'#10B981'
};
const STATUS_LABEL = {
  pendente:'⏳ Pendente', ativo:'✔️ Ativo', em_analise:'🔍 Em análise', resolvido:'✅ Resolvido'
};
const PRIORITY_LABEL = { normal:'🟡 Normal', alta:'🔴 Alta', baixa:'🟢 Baixa' };

/* Seed data */
const SEED = [
  { id:1001, type:'Perdido',    name:'Carteira preta de couro',     cat:'Carteiras',   color:'Preto',   brand:'Sem marca',   condition:'Bom',      location:'Aeroporto de Congonhas, SP',   city:'São Paulo - SP', ref:'Portão B12',    date:'15/03/2025', time:'14:30', requester:'João Alves',   phone:'(11) 98877-0011', email:'joao@mail.com',    tags:['RG','CNH','cartões'],     desc:'Carteira de couro preto com zíper dourado contendo RG, CNH e três cartões de crédito.', obs:'Cliente muito ansioso. Ligar assim que localizar.', employee:'Ana Lima', employeeRole:'Recepcionista', status:'ativo',     priority:'alta',   timestamp:'15/03/2025 09:14' },
  { id:1002, type:'Encontrado', name:'iPhone 13 Pro tela trincada', cat:'Eletrônicos', color:'Grafite', brand:'Apple',       condition:'Regular',   location:'Metrô Paulista, SP',           city:'São Paulo - SP', ref:'Dentro do vagão',date:'16/03/2025', time:'08:00', requester:'Maria Costa',  phone:'(11) 97766-0022', email:'maria@mail.com',   tags:['Apple','Preto','iPhone'], desc:'iPhone com tela rachada encontrado no banco do metrô na linha 2.', obs:'',                                              employee:'Bruno Costa', employeeRole:'Atendente',    status:'pendente',  priority:'normal', timestamp:'16/03/2025 10:32' },
  { id:1003, type:'Perdido',    name:'Chave Honda Civic 2022',      cat:'Chaves',      color:'Preto',   brand:'Honda',       condition:'Bom',      location:'Shopping Recife, PE',          city:'Recife - PE',    ref:'Piso L3',        date:'14/03/2025', time:'16:45', requester:'Pedro Lima',   phone:'(81) 96655-0033', email:'pedro@mail.com',   tags:['Honda','Civic','chaveiro azul'], desc:'Chave com controle remoto e chaveiro de borracha azul.', obs:'',                                              employee:'Carla Souza', employeeRole:'Supervisora',  status:'em_analise',priority:'alta',   timestamp:'14/03/2025 17:01' },
  { id:1004, type:'Encontrado', name:'Mochila Nike preta',          cat:'Bolsas',      color:'Preto',   brand:'Nike',        condition:'Bom',      location:'Parque Ibirapuera, SP',        city:'São Paulo - SP', ref:'Perto do lago',  date:'17/03/2025', time:'07:30', requester:'Marina Silva', phone:'(11) 95544-0044', email:'marina@mail.com',  tags:['Nike','Cadernos','livros'],desc:'Mochila com cadernos de faculdade e um livro de cálculo.', obs:'Pertences entregues à segurança do parque.',        employee:'Ana Lima', employeeRole:'Recepcionista', status:'resolvido', priority:'baixa',  timestamp:'17/03/2025 08:45' },
  { id:1005, type:'Perdido',    name:'Cachorro Pug chamado Toby',   cat:'Animais',     color:'Bege',    brand:'—',           condition:'Bom',      location:'Jardim Botânico, RJ',          city:'Rio de Janeiro - RJ', ref:'Portão Norte', date:'17/03/2025', time:'15:00', requester:'Julia Ramos',  phone:'(21) 94433-0055', email:'julia@mail.com',   tags:['Pug','coleira vermelha','amigável'], desc:'Pug bege macho chamado Toby, usa coleira vermelha com plaquinha. Muito dócil.', obs:'Dona está desesperada. Prioridade máxima.', employee:'Diego Ferreira', employeeRole:'Atendente', status:'ativo',     priority:'alta',   timestamp:'17/03/2025 15:22' },
  { id:1006, type:'Encontrado', name:'Óculos grau armação azul',    cat:'Outros',      color:'Azul',    brand:'Ray-Ban',     condition:'Bom',      location:'UFBA, Salvador - BA',          city:'Salvador - BA',  ref:'Biblioteca central', date:'13/03/2025', time:'12:00', requester:'Lucas Torres', phone:'(71) 93322-0066', email:'lucas@mail.com',   tags:['Óculos','grau','azul'],   desc:'Óculos com armação azul escura encontrado na biblioteca da universidade.', obs:'Entregue à secretaria.',                      employee:'Elisa Martins', employeeRole:'Coordenadora', status:'resolvido', priority:'normal', timestamp:'13/03/2025 13:05' },
];

/* Load from localStorage or seed */
function loadObjects() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [...SEED];
}
function saveObjects(objs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(objs));
}

let objects = loadObjects();

/* ===== THEME ===== */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

/* ===== EMPLOYEE ===== */
function selectEmployee(val) {
  if (!val) {
    currentEmployee = null;
    updateEmployeeUI(null);
    return;
  }
  const [name, role] = val.split('|');
  currentEmployee = { name, role };
  updateEmployeeUI(currentEmployee);
  document.getElementById('f-employee').value = `${name} — ${role}`;
  renderMyList();
  updateStats();
  showToast(`👤 Funcionário ativo: ${name}`);
}

function updateEmployeeUI(emp) {
  const initials = emp ? emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
  ['emp-avatar', 'emp-avatar-lg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = initials;
  });
  document.getElementById('emp-name-display').textContent = emp ? emp.name : 'Selecionar funcionário';
  document.getElementById('emp-role-display').textContent = emp ? emp.role : '–';
  document.getElementById('emp-card-name').textContent = emp ? emp.name : 'Selecionar';
  document.getElementById('emp-card-role').textContent = emp ? emp.role : 'funcionário';
  document.getElementById('form-emp-name').textContent = emp ? `${emp.name} — ${emp.role}` : 'Nenhum funcionário selecionado';
  document.getElementById('my-sub').textContent = emp ? `Registros cadastrados por ${emp.name}` : 'Selecione um funcionário no menu lateral';
}

/* ===== VIEWS ===== */
function showView(name) {
  ['cadastro', 'lista', 'meus'].forEach(v => {
    document.getElementById(`view-${v}`).style.display = v === name ? 'block' : 'none';
    document.getElementById(`nav-${v}`).classList.toggle('active', v === name);
  });
  if (name === 'lista') renderAllList();
  if (name === 'meus')  renderMyList();
}

/* ===== TYPE SELECTOR ===== */
function setType(type) {
  currentType = type;
  document.getElementById('opt-lost').classList.toggle('selected-lost',  type === 'Perdido');
  document.getElementById('opt-found').classList.toggle('selected-found', type === 'Encontrado');
  document.getElementById('local-label').textContent = type === 'Perdido' ? 'perdido' : 'encontrado';
}

function updateEmoji() {} // hook for future use

/* ===== FORM ===== */
function clearForm() {
  ['f-name','f-color','f-brand','f-tags','f-desc','f-location','f-ref','f-city',
   'f-time','f-requester','f-cpf','f-phone','f-email','f-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['f-cat','f-condition','f-status','f-priority'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  setType('Perdido');
  document.querySelector('input[name="tipo"][value="Perdido"]').checked = true;
  showToast('🗑️ Formulário limpo.');
}

function saveForm(forceStatus) {
  const name     = document.getElementById('f-name').value.trim();
  const location = document.getElementById('f-location').value.trim();
  const requester= document.getElementById('f-requester').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const cat      = document.getElementById('f-cat').value;

  if (!name)      { showToast('⚠️ Informe o nome do objeto.');         return; }
  if (!cat)       { showToast('⚠️ Selecione a categoria.');            return; }
  if (!location)  { showToast('⚠️ Informe o local.');                  return; }
  if (!requester) { showToast('⚠️ Informe o nome do solicitante.');    return; }
  if (!phone)     { showToast('⚠️ Informe o telefone do solicitante.'); return; }
  if (!currentEmployee) { showToast('⚠️ Selecione o funcionário no menu lateral.'); return; }

  const dateRaw = document.getElementById('f-date').value;
  const d       = dateRaw ? new Date(dateRaw) : new Date();
  const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  const now     = new Date();
  const ts      = `${dateStr} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const tagsRaw = document.getElementById('f-tags').value;
  const tags    = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [cat];

  const newObj = {
    id:           Date.now(),
    type:         currentType,
    name,
    cat,
    color:        document.getElementById('f-color').value.trim()     || '—',
    brand:        document.getElementById('f-brand').value.trim()     || '—',
    condition:    document.getElementById('f-condition').value,
    location,
    city:         document.getElementById('f-city').value.trim()      || '—',
    ref:          document.getElementById('f-ref').value.trim()       || '—',
    date:         dateStr,
    time:         document.getElementById('f-time').value             || '—',
    requester,
    cpf:          document.getElementById('f-cpf').value.trim()       || '—',
    phone,
    email:        document.getElementById('f-email').value.trim()     || '—',
    tags,
    desc:         document.getElementById('f-desc').value.trim()      || '—',
    obs:          document.getElementById('f-obs').value.trim()       || '',
    employee:     currentEmployee.name,
    employeeRole: currentEmployee.role,
    status:       forceStatus || document.getElementById('f-status').value,
    priority:     document.getElementById('f-priority').value,
    timestamp:    ts,
  };

  objects.unshift(newObj);
  saveObjects(objects);
  updateStats();
  clearForm();
  showToast(`✅ Objeto "${name}" cadastrado com sucesso!`);
  showView('meus');
}

/* ===== RENDER CARDS ===== */
function buildCard(obj) {
  const emoji    = EMOJI_MAP[obj.cat] || '📦';
  const color    = COLOR_MAP[obj.type] || '#3B5BDB';
  const isLost   = obj.type === 'Perdido';
  const initials = obj.employee ? obj.employee.split(' ').map(n=>n[0]).join('').substring(0,2) : '?';
  const pLabel   = PRIORITY_LABEL[obj.priority] || '';

  return `
  <div class="obj-card" onclick="openDetail(${obj.id})">
    <div class="obj-thumb" style="background:linear-gradient(135deg,${color}18,${color}30)">
      <div class="obj-thumb-bg" style="background:${color};opacity:.06"></div>
      <span class="obj-thumb-emoji">${emoji}</span>
      <span class="obj-type-badge ${isLost ? 'badge-lost' : 'badge-found'}">${isLost ? '😢 Perdido' : '😊 Encontrado'}</span>
      ${obj.priority === 'alta' ? `<span class="obj-priority">🔴 Urgente</span>` : ''}
    </div>
    <div class="obj-body">
      <h3>${obj.name}</h3>
      <div class="obj-meta">
        <span>📂 ${obj.cat}</span>
        <span>📍 ${obj.location.split(',')[0]}</span>
        <span>📅 ${obj.date}</span>
      </div>
      <div class="obj-tags">
        ${obj.tags.slice(0,3).map(t => `<span class="obj-tag">${t}</span>`).join('')}
      </div>
    </div>
    <div class="obj-footer">
      <div class="obj-employee">
        <div class="obj-emp-av">${initials}</div>
        <span>${obj.employee || '—'}</span>
      </div>
      <span class="status-pill status-${obj.status}">${STATUS_LABEL[obj.status] || obj.status}</span>
    </div>
  </div>`;
}

/* ===== RENDER ALL LIST ===== */
function renderAllList() {
  const search = (document.getElementById('search-all')?.value || '').toLowerCase();
  const type   = document.getElementById('fil-type')?.value   || '';
  const cat    = document.getElementById('fil-cat')?.value    || '';
  const status = document.getElementById('fil-status')?.value || '';

  const filtered = objects.filter(o => {
    const mS = !search || o.name.toLowerCase().includes(search)
                       || o.location.toLowerCase().includes(search)
                       || (o.requester||'').toLowerCase().includes(search)
                       || (o.employee||'').toLowerCase().includes(search);
    const mT = !type   || o.type   === type;
    const mC = !cat    || o.cat    === cat;
    const mSt= !status || o.status === status;
    return mS && mT && mC && mSt;
  });

  const grid  = document.getElementById('list-all-grid');
  const empty = document.getElementById('list-empty');
  document.getElementById('all-count-label').textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    grid.innerHTML  = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = filtered.map(buildCard).join('');
}

function filterList() { renderAllList(); }
function clearListFilters() {
  ['search-all','fil-type','fil-cat','fil-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderAllList();
}

/* ===== RENDER MY LIST ===== */
function renderMyList() {
  const mine  = currentEmployee
    ? objects.filter(o => o.employee === currentEmployee.name)
    : [];

  const grid  = document.getElementById('list-my-grid');
  const empty = document.getElementById('my-empty');
  document.getElementById('my-count-label').textContent = `${mine.length} registro${mine.length !== 1 ? 's' : ''}`;

  if (!mine.length) {
    grid.innerHTML      = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = mine.map(buildCard).join('');
}

/* ===== STATS ===== */
function updateStats() {
  const total    = objects.length;
  const lost     = objects.filter(o => o.type === 'Perdido').length;
  const found    = objects.filter(o => o.type === 'Encontrado').length;
  const resolved = objects.filter(o => o.status === 'resolvido').length;
  const pending  = objects.filter(o => o.status === 'pendente').length;

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-lost').textContent     = lost;
  document.getElementById('stat-found').textContent    = found;
  document.getElementById('stat-resolved').textContent = resolved;
  document.getElementById('stat-pending').textContent  = pending;

  document.getElementById('list-count').textContent = total;
  const mine = currentEmployee ? objects.filter(o => o.employee === currentEmployee.name).length : 0;
  document.getElementById('my-count').textContent  = mine;
}

/* ===== DETAIL MODAL ===== */
function openDetail(id) {
  const obj = objects.find(o => o.id === id);
  if (!obj) return;
  currentItemId = id;

  const isLost = obj.type === 'Perdido';
  document.getElementById('dc-type-badge').innerHTML =
    `<span class="status-pill ${isLost ? 'badge-lost' : 'badge-found'}">${isLost ? '😢 Perdido' : '😊 Encontrado'}</span>`;
  document.getElementById('dc-title').textContent = obj.name;
  document.getElementById('dc-status-sel').value  = obj.status;

  document.getElementById('dc-body').innerHTML = `
    <div class="dc-grid">
      <div class="dc-field"><label>Categoria</label><span>${EMOJI_MAP[obj.cat] || '📦'} ${obj.cat}</span></div>
      <div class="dc-field"><label>Status</label><span class="status-pill status-${obj.status}">${STATUS_LABEL[obj.status]}</span></div>
      <div class="dc-field"><label>Prioridade</label><span>${PRIORITY_LABEL[obj.priority] || '—'}</span></div>
      <div class="dc-field"><label>Cor</label><span>${obj.color}</span></div>
      <div class="dc-field"><label>Marca / Modelo</label><span>${obj.brand}</span></div>
      <div class="dc-field"><label>Estado</label><span>${obj.condition}</span></div>
      <div class="dc-field full"><label>Local</label><span>📍 ${obj.location}${obj.ref !== '—' ? ` — ${obj.ref}` : ''}</span></div>
      <div class="dc-field"><label>Cidade / UF</label><span>${obj.city}</span></div>
      <div class="dc-field"><label>Data / Hora</label><span>📅 ${obj.date} ${obj.time !== '—' ? '· ' + obj.time : ''}</span></div>
      <div class="dc-field full" style="padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin:4px 0">
        <label>Solicitante</label>
        <span style="font-size:.95rem;font-weight:700">${obj.requester}</span>
        <span style="font-size:.82rem;color:var(--muted)">📞 ${obj.phone} ${obj.email !== '—' ? '&nbsp;·&nbsp; ✉️ ' + obj.email : ''}</span>
        ${obj.cpf !== '—' ? `<span style="font-size:.78rem;color:var(--muted)">CPF: ${obj.cpf}</span>` : ''}
      </div>
      <div class="dc-field full">
        <label>Descrição</label>
        <span style="line-height:1.65">${obj.desc}</span>
      </div>
      ${obj.obs ? `<div class="dc-field full"><label>Obs. internas</label><span style="color:var(--muted);font-style:italic">${obj.obs}</span></div>` : ''}
      <div class="dc-field"><label>Funcionário</label><span>👤 ${obj.employee} — ${obj.employeeRole}</span></div>
      <div class="dc-field"><label>Cadastrado em</label><span>🕐 ${obj.timestamp}</span></div>
      ${obj.tags.length ? `<div class="dc-field full">
        <label>Tags</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          ${obj.tags.map(t => `<span class="obj-tag">${t}</span>`).join('')}
        </div>
      </div>` : ''}
    </div>`;

  document.getElementById('detail-overlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('open');
  currentItemId = null;
}
function closeDetailOverlay(e) {
  if (e.target === document.getElementById('detail-overlay')) closeDetail();
}

function updateStatus(val) {
  if (!currentItemId) return;
  const obj = objects.find(o => o.id === currentItemId);
  if (!obj) return;
  obj.status = val;
  saveObjects(objects);
  updateStats();
  renderAllList();
  renderMyList();
  showToast(`✅ Status atualizado: ${STATUS_LABEL[val]}`);
}

function deleteCurrentItem() {
  if (!currentItemId) return;
  const obj = objects.find(o => o.id === currentItemId);
  if (!obj) return;
  if (!confirm(`Excluir "${obj.name}"? Esta ação não pode ser desfeita.`)) return;
  objects = objects.filter(o => o.id !== currentItemId);
  saveObjects(objects);
  closeDetail();
  updateStats();
  renderAllList();
  renderMyList();
  showToast('🗑️ Registro excluído.');
}

/* ===== TOAST ===== */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  const saved       = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  // Set today's date on form
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-timestamp').value = (() => {
    const n = new Date();
    return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  })();

  // Set type selection visual
  setType('Perdido');
  document.getElementById('opt-lost').classList.add('selected-lost');

  // Initial stats
  updateStats();

  // Update timestamp every minute
  setInterval(() => {
    const n = new Date();
    const ts = document.getElementById('f-timestamp');
    if (ts) ts.value = `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  }, 60000);
});