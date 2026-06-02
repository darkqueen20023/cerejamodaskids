// ═══════════════════════════════════════════════════════════
//  CEREJA MODAS KIDS — APP ENGINE (app.js)
// ═══════════════════════════════════════════════════════════

const App = (() => {
  // ── STATE ──
  let carrinho = JSON.parse(sessionStorage.getItem('cereja_cart') || '[]');
  let filtroAtivo = 'todos';
  let admTabAtiva = 'dashboard';

  // ── SAVE CART ──
  function saveCart() { sessionStorage.setItem('cereja_cart', JSON.stringify(carrinho)); updateCartBadge(); }

  // ── TOAST ──
  function toast(msg, tipo='default', dur=2800) {
    const tc = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${tipo}`; t.textContent = msg;
    tc.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(10px)'; setTimeout(()=>t.remove(), 300); }, dur);
  }

  // ── ROUTER ──
  function goTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) { target.classList.add('active'); window.scrollTo(0,0); }
    updateNav(page);
  }

  function updateNav(page) {
    document.querySelectorAll('.nav-btn[data-page]').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });
  }

  // ── AUTH GUARD ──
  function requireLogin(cb) {
    const s = CerejaDB.getSessao();
    if (!s) { goTo('login'); return; }
    cb(s);
  }

  function requireAdmin(cb) {
    const s = CerejaDB.getSessao();
    if (!s || s.role !== 'admin') { toast('Acesso restrito!','error'); goTo('home'); return; }
    cb(s);
  }

  // ── NAV ──
  function initNav() {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === 'adm') { requireAdmin(() => { goTo('adm'); renderAdm(); }); }
        else if (page === 'pedidos') { requireLogin((s) => { goTo('pedidos'); renderMeusPedidos(s.user.id); }); }
        else { goTo(page); }
      });
    });

    document.getElementById('btnHeaderCart').addEventListener('click', openCartModal);
    document.getElementById('btnHeaderUser').addEventListener('click', () => {
      const s = CerejaDB.getSessao();
      s ? openPerfilModal(s.user) : goTo('login');
    });
  }

  // ── UPDATE CART BADGE ──
  function updateCartBadge() {
    const total = carrinho.reduce((s,i)=>s+i.qtd, 0);
    const el = document.getElementById('cartBadge');
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  }

  // ══════════════════════════════════════════
  //  PAGE: HOME / CATÁLOGO
  // ══════════════════════════════════════════
  function renderHome() {
    renderProducts(CerejaDB.getProdutos());
    initFilters();
    updateCartBadge();
  }

  function initFilters() {
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filtro;
        filtroAtivo = f;
        const filtros = {};
        if (f === 'macacão') filtros.tipo = 'macacão';
        else if (f === 'conjunto') filtros.tipo = 'conjunto';
        else if (f === 'bebe') filtros.categoria = 'bebe';
        else if (f === 'crianca') filtros.categoria = 'crianca';
        else if (['teddy','veludo','moletin','moletom','pelúcia'].includes(f)) filtros.tecido = f;
        renderProducts(CerejaDB.getProdutos(filtros));
      });
    });
  }

  function renderProducts(lista) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    if (!lista.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🔍</div><h3>Nenhum produto encontrado</h3><p>Tente outro filtro.</p></div>`;
      return;
    }

    const bgs = {
      macacão: 'linear-gradient(145deg,#FADADD,#F5C6CC)',
      conjunto: 'linear-gradient(145deg,#FFF0D6,#FFE0A8)'
    };

    lista.forEach((p, idx) => {
      const bg = bgs[p.tipo] || 'linear-gradient(145deg,#F5F5F5,#EEE)';
      const tamOpts = p.tamanhos.map(t=>`<option value="${t}">${t}</option>`).join('');
      const tecOpts = p.tecidos.map(t=>`<option value="${t}">${t}</option>`).join('');
      const tags = p.tecidos.map(t=>`<span class="tag">${t}</span>`).join('');
      const destBadge = p.destaque ? `<span class="prod-badge prod-badge-dest">⭐ Destaque</span>` : '';
      const preco = `R$ ${p.preco.toFixed(2).replace('.',',')}`;

      const div = document.createElement('div');
      div.className = 'card produto-card fade-in';
      div.style.animationDelay = `${idx * 0.05}s`;
      div.innerHTML = `
        <div class="produto-img" style="background:${bg}">
          ${p.emoji}
          <span class="prod-badge prod-badge-tipo">${p.tipo}</span>
          <span class="prod-badge prod-badge-idade">${p.faixaIdade}</span>
          ${destBadge}
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:8px;flex:1">
          <div class="prod-name">${p.nome}</div>
          <div class="prod-desc">${p.descricao}</div>
          <div class="prod-tags">${tags}</div>
          <div class="prod-price">${preco}</div>
          <select class="prod-select" id="tec_${p.id}">${tecOpts}</select>
          <div class="select-row">
            <select class="prod-select" id="tam_${p.id}">${tamOpts}</select>
            <input class="qty-input" type="number" id="qty_${p.id}" value="1" min="1" max="99">
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:4px" onclick="App.addToCart('${p.id}')">
            🛒 Adicionar ao Carrinho
          </button>
        </div>`;
      grid.appendChild(div);
    });
  }

  function addToCart(prodId) {
    const p = CerejaDB.getProduto(prodId);
    if (!p) return;
    const tam = document.getElementById('tam_'+prodId)?.value;
    const tec = document.getElementById('tec_'+prodId)?.value;
    const qty = parseInt(document.getElementById('qty_'+prodId)?.value) || 1;
    carrinho.push({ ...p, tamanhoSel:tam, tecidoSel:tec, qtd:qty, uid: Date.now() });
    saveCart();
    toast(`🍒 ${p.nome} adicionado!`, 'success');
  }

  // ══════════════════════════════════════════
  //  CART MODAL
  // ══════════════════════════════════════════
  function openCartModal() {
    renderCartModal();
    document.getElementById('cartModal').classList.add('open');
  }

  function closeCartModal() { document.getElementById('cartModal').classList.remove('open'); }

  function renderCartModal() {
    const el = document.getElementById('cartItemsList');
    const footer = document.getElementById('cartFooter');

    if (!carrinho.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">🛒</div><h3>Carrinho vazio</h3><p>Adicione produtos do catálogo!</p></div>`;
      footer.style.display = 'none';
      return;
    }

    const total = carrinho.reduce((s,i)=>s+i.preco*i.qtd, 0);
    el.innerHTML = carrinho.map(i=>`
      <div class="cart-item">
        <span class="cart-item-emoji">${i.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.nome}</div>
          <div class="cart-item-detail">${i.tamanhoSel} · ${i.tecidoSel} · ${i.tipo} · Qtd: ${i.qtd}</div>
          <div class="cart-item-price">R$ ${(i.preco*i.qtd).toFixed(2).replace('.',',')}</div>
        </div>
        <button class="btn-remove-item" onclick="App.removeCartItem(${i.uid})">🗑️</button>
      </div>`).join('');

    footer.style.display = 'block';
    footer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--rosa);border-radius:var(--radius-md);margin-bottom:14px">
        <span style="font-weight:700;color:var(--cereja-esc)">Total do Pedido</span>
        <strong style="font-size:1.3rem;color:var(--cereja)">R$ ${total.toFixed(2).replace('.',',')}</strong>
      </div>
      <button class="btn btn-primary btn-lg btn-full" onclick="App.irParaFinalizacao()">
        📋 Finalizar Pedido
      </button>`;
  }

  function removeCartItem(uid) {
    carrinho = carrinho.filter(i=>i.uid!==uid);
    saveCart();
    renderCartModal();
    toast('Item removido','warning');
  }

  function irParaFinalizacao() {
    if (!carrinho.length) return;
    const s = CerejaDB.getSessao();
    if (!s) { closeCartModal(); goTo('login'); toast('Faça login para finalizar o pedido','warning'); return; }
    closeCartModal();
    openFichaModal();
  }

  // ══════════════════════════════════════════
  //  FICHA / CHECKOUT MODAL
  // ══════════════════════════════════════════
  function openFichaModal() {
    const s = CerejaDB.getSessao();
    document.getElementById('fichaModal').classList.add('open');
    if (s) {
      document.getElementById('f_nome').value = s.user.nome || '';
    }
  }

  function closeFichaModal() { document.getElementById('fichaModal').classList.remove('open'); }

  function maskCPF(el) {
    let v = el.value.replace(/\D/g,'').substring(0,11);
    v = v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1-$2');
    el.value = v;
  }

  function maskTel(el) {
    let v = el.value.replace(/\D/g,'').substring(0,11);
    v = v.length>10 ? v.replace(/(\d{2})(\d{5})(\d{1,4})/,'($1) $2-$3') : v.replace(/(\d{2})(\d{4})(\d{1,4})/,'($1) $2-$3');
    el.value = v;
  }

  function maskCEP(el) {
    let v = el.value.replace(/\D/g,'').substring(0,8);
    el.value = v.replace(/(\d{5})(\d)/,'$1-$2');
  }

  function toggleEnviar() {
    const ok = document.getElementById('concordoPriv').checked;
    document.getElementById('btnEnviarPedido').disabled = !ok;
  }

  function enviarPedido() {
    const s = CerejaDB.getSessao();
    const nome = document.getElementById('f_nome').value.trim();
    const cpf  = document.getElementById('f_cpf').value.trim();
    const nasc = document.getElementById('f_nasc').value.trim();
    const tel  = document.getElementById('f_tel').value.trim();
    const cep  = document.getElementById('f_cep').value.trim();
    const end  = document.getElementById('f_end').value.trim();

    if (!nome||!cpf||!nasc||!tel||!cep||!end) { toast('⚠️ Preencha todos os campos!','error'); return; }
    if (cpf.replace(/\D/g,'').length < 11) { toast('CPF inválido!','error'); return; }

    const total = carrinho.reduce((s,i)=>s+i.preco*i.qtd, 0);
    const nascFmt = new Date(nasc+'T12:00:00').toLocaleDateString('pt-BR');

    // Salvar pedido no banco
    const pedido = CerejaDB.criarPedido({
      clienteId: s?.user?.id || 'guest',
      clienteNome: nome, clienteCPF: cpf,
      clienteNasc: nascFmt, clienteTel: tel,
      clienteCEP: cep, clienteEnd: end,
      itens: carrinho.map(i=>({ produtoId:i.id, nome:i.nome, emoji:i.emoji, tamanho:i.tamanhoSel, tecido:i.tecidoSel, tipo:i.tipo, qtd:i.qtd, preco:i.preco })),
      total
    });

    // Montar mensagem WhatsApp
    const itens = carrinho.map(i=>`▸ ${i.emoji} ${i.nome} (${i.tipo})\n   Tamanho: ${i.tamanhoSel} | Tecido: ${i.tecidoSel} | Qtd: ${i.qtd} | R$ ${(i.preco*i.qtd).toFixed(2)}`).join('\n');
    const msg = `🍒 *NOVO PEDIDO — CEREJA MODAS KIDS* 🍒\n*Nº ${pedido.id}*\n\n📋 *DADOS DO CLIENTE*\n👤 Nome: ${nome}\n🪪 CPF: ${cpf}\n🎂 Nascimento: ${nascFmt}\n📞 WhatsApp: ${tel}\n📍 CEP: ${cep}\n🏠 Endereço: ${end}\n\n🛒 *ITENS DO PEDIDO*\n${itens}\n\n💰 *TOTAL: R$ ${total.toFixed(2).replace('.',',')}*\n\n📌 O catálogo de estampas disponíveis será enviado conforme disponibilidade.\n✅ Cliente concordou com a LGPD.\n⏰ Pedido em: ${new Date().toLocaleString('pt-BR')}`;

    window.open(`https://api.whatsapp.com/send/?phone=5511913019409&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`, '_blank');

    carrinho = []; saveCart(); closeFichaModal();
    toast('🍒 Pedido enviado com sucesso!', 'success', 4000);
  }

  // ══════════════════════════════════════════
  //  CATÁLOGO ESTAMPAS (WPP)
  // ══════════════════════════════════════════
  function solicitarCatalogo() {
    const msg = '🍒 Olá! Gostaria de receber o *catálogo de estampas disponíveis* da Cereja Modas Kids. 😊';
    window.open(`https://api.whatsapp.com/send/?phone=5511913019409&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`, '_blank');
  }

  // ══════════════════════════════════════════
  //  PAGE: LOGIN / REGISTER
  // ══════════════════════════════════════════
  function switchLoginTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.login-form-tab').forEach(f=>f.style.display='none');
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('form-'+tab).style.display='block';
  }

  function doLogin() {
    const email = document.getElementById('l_email').value.trim();
    const senha = document.getElementById('l_senha').value;
    const r = CerejaDB.login(email, senha);
    if (r.ok) {
      toast(`✅ Bem-vindo, ${r.user.nome}!`, 'success');
      if (r.user.role === 'admin') { goTo('adm'); renderAdm(); }
      else { goTo('home'); renderHome(); }
    } else { toast(r.msg, 'error'); }
  }

  function doRegister() {
    const nome  = document.getElementById('r_nome').value.trim();
    const email = document.getElementById('r_email').value.trim();
    const senha = document.getElementById('r_senha').value;
    const conf  = document.getElementById('r_conf').value;
    if (!nome||!email||!senha) { toast('Preencha todos os campos!','error'); return; }
    if (senha !== conf) { toast('Senhas não coincidem!','error'); return; }
    if (senha.length < 4) { toast('Senha muito curta!','error'); return; }
    const r = CerejaDB.register(nome, email, senha);
    if (r.ok) { toast(`🍒 Cadastro realizado! Bem-vindo, ${nome}!`, 'success'); goTo('home'); renderHome(); }
    else { toast(r.msg, 'error'); }
  }

  function doLogout() {
    CerejaDB.logout();
    carrinho = []; saveCart();
    toast('Até logo! 🍒','success');
    goTo('home');
    closePerfilModal();
  }

  // ══════════════════════════════════════════
  //  PERFIL MODAL
  // ══════════════════════════════════════════
  function openPerfilModal(user) {
    const el = document.getElementById('perfilModal');
    document.getElementById('perfilContent').innerHTML = `
      <div style="text-align:center;margin-bottom:22px">
        <div style="font-size:3rem;margin-bottom:8px">${user.avatar}</div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--cereja-esc)">${user.nome}</h3>
        <p style="font-size:.83rem;color:var(--cinza)">${user.email}</p>
        ${user.role==='admin' ? '<span class="status-badge status-confirmado" style="margin-top:6px;display:inline-block">👑 Administrador</span>' : ''}
      </div>
      ${user.role==='admin' ? `<button class="btn btn-ouro btn-full" style="margin-bottom:10px" onclick="App.irAdm()">⚙️ Painel Administrativo</button>` : ''}
      <button class="btn btn-secondary btn-full" style="margin-bottom:10px" onclick="App.irPedidos()">📦 Meus Pedidos</button>
      <button class="btn btn-danger btn-full" onclick="App.doLogout()">🚪 Sair da Conta</button>`;
    el.classList.add('open');
  }

  function closePerfilModal() { document.getElementById('perfilModal').classList.remove('open'); }

  function irAdm() { closePerfilModal(); requireAdmin(()=>{ goTo('adm'); renderAdm(); }); }
  function irPedidos() { closePerfilModal(); requireLogin((s)=>{ goTo('pedidos'); renderMeusPedidos(s.user.id); }); }

  // ══════════════════════════════════════════
  //  PAGE: MEUS PEDIDOS (CLIENTE)
  // ══════════════════════════════════════════
  function renderMeusPedidos(userId) {
    const lista = CerejaDB.getPedidos({ clienteId: userId });
    const el = document.getElementById('meusPedidosLista');
    if (!lista.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h3>Nenhum pedido ainda</h3><p>Faça seu primeiro pedido no catálogo!</p></div>`;
      return;
    }
    el.innerHTML = lista.map(p=>{
      const itens = p.itens.map(i=>`<span>${i.emoji} ${i.nome} (${i.tamanho}/${i.tecido}) x${i.qtd}</span>`).join(', ');
      return `<div class="card card-body fade-in" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <strong style="color:var(--cereja-esc)">${p.id}</strong>
            <span style="font-size:.78rem;color:var(--cinza);margin-left:10px">${new Date(p.criadoEm).toLocaleDateString('pt-BR')}</span>
          </div>
          <span class="status-badge status-${p.status}">${STATUS_LABEL[p.status]||p.status}</span>
        </div>
        <p style="font-size:.83rem;color:var(--cinza);margin-bottom:8px">${itens}</p>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:var(--cereja)">R$ ${p.total.toFixed(2).replace('.',',')}</span>
          <button class="btn btn-wpp btn-sm" onclick="App.acompanharPedido('${p.id}')">📲 Acompanhar</button>
        </div>
      </div>`;
    }).join('');
  }

  const STATUS_LABEL = { pendente:'⏳ Pendente', confirmado:'✅ Confirmado', enviado:'🚚 Enviado', entregue:'📦 Entregue', cancelado:'❌ Cancelado' };

  function acompanharPedido(id) {
    const msg = `🍒 Olá! Gostaria de acompanhar meu pedido *${id}*.`;
    window.open(`https://api.whatsapp.com/send/?phone=5511913019409&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`, '_blank');
  }

  // ══════════════════════════════════════════
  //  ADM DASHBOARD
  // ══════════════════════════════════════════
  function renderAdm() {
    switchAdmTab(admTabAtiva);
  }

  function switchAdmTab(tab) {
    admTabAtiva = tab;
    document.querySelectorAll('.adm-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b=>b.classList.remove('active'));
    const el = document.getElementById('admTab-'+tab);
    const btn = document.querySelector(`.sidebar-btn[data-tab="${tab}"]`);
    if (el) el.classList.add('active');
    if (btn) btn.classList.add('active');

    const renders = {
      dashboard: renderAdmDashboard,
      pedidos: renderAdmPedidos,
      produtos: renderAdmProdutos,
      clientes: renderAdmClientes,
      config: renderAdmConfig
    };
    if (renders[tab]) renders[tab]();
  }

  // ── ADM: DASHBOARD ──
  function renderAdmDashboard() {
    const stats = CerejaDB.getStats();

    document.getElementById('admDashContent').innerHTML = `
      <div class="adm-topbar">
        <div><h1>Dashboard</h1><p>Visão geral da loja em tempo real</p></div>
        <button class="btn btn-secondary" onclick="App.renderAdm()">🔄 Atualizar</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Vendas Totais</div>
          <div class="stat-value">R$ ${stats.totalVendas.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}</div>
          <div class="stat-sub">Todos os pedidos pagos</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-label">Total de Pedidos</div>
          <div class="stat-value">${stats.totalPedidos}</div>
          <div class="stat-sub">${stats.pedidosHoje} hoje · ${stats.pedidosMes} este mês</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-label">Clientes</div>
          <div class="stat-value">${stats.clientes}</div>
          <div class="stat-sub">Cadastrados na loja</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-label">Pendentes</div>
          <div class="stat-value">${stats.porStatus.find(s=>s.status==='pendente')?.qtd||0}</div>
          <div class="stat-sub">Aguardando confirmação</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px;flex-wrap:wrap">
        <div class="chart-wrap">
          <div class="chart-title">📈 Vendas (últimos 7 dias)</div>
          ${renderBarChart(stats.vendasDia)}
        </div>
        <div class="chart-wrap">
          <div class="chart-title">📊 Status dos Pedidos</div>
          ${renderStatusChart(stats.porStatus)}
        </div>
      </div>

      <div class="chart-wrap">
        <div class="chart-title">🏆 Top 5 Produtos Mais Vendidos</div>
        ${renderTopProdutos(stats.topProd)}
      </div>`;
  }

  function renderBarChart(dados) {
    const max = Math.max(...dados.map(d=>d.valor), 1);
    const bars = dados.map(d=>{
      const h = Math.max(4, Math.round((d.valor/max)*140));
      return `<div class="bar-col">
        <div class="bar-val">${d.valor>0?'R$'+d.valor.toFixed(0):''}</div>
        <div class="bar" style="height:${h}px" title="R$ ${d.valor.toFixed(2)}"></div>
        <div class="bar-lbl">${d.dia}</div>
      </div>`;
    }).join('');
    return `<div class="bar-chart">${bars}</div>`;
  }

  function renderStatusChart(dados) {
    const cores = { pendente:'#FF9800', confirmado:'#2196F3', enviado:'#673AB7', entregue:'#4CAF50', cancelado:'#F44336' };
    const total = dados.reduce((s,d)=>s+d.qtd,0)||1;
    const legend = dados.map(d=>`
      <div class="legend-item">
        <div class="legend-dot" style="background:${cores[d.status]}"></div>
        <span style="color:var(--texto2)">${STATUS_LABEL[d.status]||d.status}: <strong>${d.qtd}</strong></span>
      </div>`).join('');
    const segments = dados.reduce((acc,d,i)=>{
      const pct = (d.qtd/total)*100;
      const start = acc.offset;
      acc.offset += pct;
      if(d.qtd>0) acc.html += `<circle cx="60" cy="60" r="40" fill="none" stroke="${cores[d.status]}" stroke-width="20" stroke-dasharray="${pct*2.513} ${251.3}" stroke-dashoffset="${-(start)*2.513+62.8}" transform="rotate(-90 60 60)"/>`;
      return acc;
    }, {offset:0,html:''}).html;
    return `<div class="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">${segments}</svg>
      <div class="donut-legend">${legend}</div>
    </div>`;
  }

  function renderTopProdutos(prods) {
    if (!prods.length) return '<p style="color:var(--cinza);font-size:.85rem">Sem dados ainda.</p>';
    return prods.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px;background:${i===0?'var(--ouro-claro)':'var(--creme)'};border-radius:var(--radius-md);margin-bottom:8px">
        <span style="font-size:1.5rem;width:36px;text-align:center">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'▸'}</span>
        <span style="font-size:1.4rem">${p.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.88rem;color:var(--cereja-esc)">${p.nome}</div>
          <div style="font-size:.75rem;color:var(--cinza)">${p.tipo} · ${p.faixaIdade}</div>
        </div>
        <span style="font-weight:800;color:var(--cereja)">${p.vendas||0} vendas</span>
      </div>`).join('');
  }

  // ── ADM: PEDIDOS ──
  function renderAdmPedidos() {
    const lista = CerejaDB.getPedidos();
    const el = document.getElementById('admPedidosContent');

    const rows = lista.length ? lista.map(p=>`
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.clienteNome}</td>
        <td>${new Date(p.criadoEm).toLocaleDateString('pt-BR')}</td>
        <td>${p.itens.length} item(s)</td>
        <td><strong style="color:var(--cereja)">R$ ${p.total.toFixed(2).replace('.',',')}</strong></td>
        <td><span class="status-badge status-${p.status}">${STATUS_LABEL[p.status]||p.status}</span></td>
        <td>
          <select class="prod-select" style="width:140px;font-size:.75rem;padding:5px 8px" onchange="App.updateStatus('${p.id}',this.value)">
            ${['pendente','confirmado','enviado','entregue','cancelado'].map(s=>`<option value="${s}"${p.status===s?' selected':''}>${STATUS_LABEL[s]}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn btn-wpp btn-sm" onclick="App.contatarCliente('${p.clienteNome}','${p.clienteTel}','${p.id}')">📲</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--cinza)">Nenhum pedido ainda.</td></tr>';

    el.innerHTML = `
      <div class="adm-topbar">
        <div><h1>Pedidos</h1><p>Gerencie todos os pedidos da loja</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${['todos','pendente','confirmado','enviado','entregue'].map(s=>`<button class="btn btn-secondary btn-sm" onclick="App.filtrarPedidosAdm('${s}')">${STATUS_LABEL[s]||'Todos'}</button>`).join('')}
        </div>
      </div>
      <div class="table-wrap" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Nº Pedido</th><th>Cliente</th><th>Data</th><th>Itens</th><th>Total</th><th>Status</th><th>Alterar</th><th>Contato</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function filtrarPedidosAdm(status) {
    const lista = status==='todos' ? CerejaDB.getPedidos() : CerejaDB.getPedidos({status});
    // re-render apenas tbody
    renderAdmPedidos();
  }

  function updateStatus(id, status) {
    CerejaDB.updatePedidoStatus(id, status);
    toast('Status atualizado!', 'success');
  }

  function contatarCliente(nome, tel, pedidoId) {
    const msg = `🍒 Olá, *${nome}*! Aqui é a *Cereja Modas Kids*. Estamos entrando em contato sobre seu pedido *${pedidoId}*. Como podemos ajudar?`;
    const num = tel.replace(/\D/g,'');
    window.open(`https://api.whatsapp.com/send/?phone=55${num}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`,'_blank');
  }

  // ── ADM: PRODUTOS ──
  function renderAdmProdutos() {
    const lista = CerejaDB.getProdutos();
    const el = document.getElementById('admProdutosContent');

    const rows = lista.map(p=>`
      <tr>
        <td>${p.emoji} <strong>${p.nome}</strong></td>
        <td>${p.tipo}</td>
        <td>${p.faixaIdade}</td>
        <td>${p.tecidos.join(', ')}</td>
        <td><strong style="color:var(--cereja)">R$ ${p.preco.toFixed(2).replace('.',',')}</strong></td>
        <td>${p.estoque}</td>
        <td>${p.vendas||0}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="App.editarProduto('${p.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="App.excluirProduto('${p.id}')">🗑️</button>
        </td>
      </tr>`).join('');

    el.innerHTML = `
      <div class="adm-topbar">
        <div><h1>Produtos</h1><p>Gerencie o catálogo de produtos</p></div>
        <button class="btn btn-primary" onclick="App.novoProduto()">➕ Novo Produto</button>
      </div>
      <div class="table-wrap" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Produto</th><th>Tipo</th><th>Faixa Etária</th><th>Tecidos</th><th>Preço</th><th>Estoque</th><th>Vendas</th><th>Ações</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function novoProduto() { openProdutoModal(null); }
  function editarProduto(id) { openProdutoModal(CerejaDB.getProduto(id)); }

  function openProdutoModal(p) {
    const isNovo = !p;
    const m = document.getElementById('produtoModal');
    document.getElementById('produtoModalTitle').textContent = isNovo ? 'Novo Produto' : 'Editar Produto';
    document.getElementById('produtoForm').innerHTML = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Nome *</label><input class="form-input" id="pm_nome" value="${p?.nome||''}"></div>
        <div class="form-group"><label class="form-label">Emoji</label><input class="form-input" id="pm_emoji" value="${p?.emoji||'🍒'}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Tipo *</label>
          <select class="form-input" id="pm_tipo">
            <option value="macacão"${p?.tipo==='macacão'?' selected':''}>Macacão</option>
            <option value="conjunto"${p?.tipo==='conjunto'?' selected':''}>Conjunto</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Categoria *</label>
          <select class="form-input" id="pm_cat">
            <option value="bebe"${p?.categoria==='bebe'?' selected':''}>Bebê</option>
            <option value="crianca"${p?.categoria==='crianca'?' selected':''}>Criança</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Faixa Etária *</label>
        <select class="form-input" id="pm_faixa">
          ${['0 a 5 meses','6 a 12 meses','1 a 5 anos','6 a 12 anos'].map(f=>`<option${p?.faixaIdade===f?' selected':''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Tecidos (separar por vírgula) *</label>
        <input class="form-input" id="pm_tec" value="${p?.tecidos?.join(', ')||''}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Preço (R$) *</label><input class="form-input" id="pm_preco" type="number" step="0.01" value="${p?.preco||''}"></div>
        <div class="form-group"><label class="form-label">Estoque *</label><input class="form-input" id="pm_estq" type="number" value="${p?.estoque||'0'}"></div>
      </div>
      <div class="form-group"><label class="form-label">Descrição</label><input class="form-input" id="pm_desc" value="${p?.descricao||''}"></div>
      <div class="checkbox-row" style="margin-bottom:16px">
        <input type="checkbox" id="pm_dest" ${p?.destaque?' checked':''}>
        <label for="pm_dest">Produto em destaque</label>
      </div>
      <button class="btn btn-primary btn-full" onclick="App.salvarProduto('${p?.id||''}')">
        ${isNovo?'➕ Criar Produto':'💾 Salvar Alterações'}
      </button>`;
    m.classList.add('open');
  }

  function closeProdutoModal() { document.getElementById('produtoModal').classList.remove('open'); }

  function salvarProduto(id) {
    const nome = document.getElementById('pm_nome').value.trim();
    const emoji = document.getElementById('pm_emoji').value.trim() || '🍒';
    const tipo = document.getElementById('pm_tipo').value;
    const cat = document.getElementById('pm_cat').value;
    const faixa = document.getElementById('pm_faixa').value;
    const tecidos = document.getElementById('pm_tec').value.split(',').map(t=>t.trim()).filter(Boolean);
    const preco = parseFloat(document.getElementById('pm_preco').value);
    const estoque = parseInt(document.getElementById('pm_estq').value)||0;
    const desc = document.getElementById('pm_desc').value.trim();
    const destaque = document.getElementById('pm_dest').checked;

    // tamanhos automáticos por faixa
    const TAMANHOS = {
      '0 a 5 meses':['RN','P1','P2','P3'],
      '6 a 12 meses':['M1','M2','G1','G2'],
      '1 a 5 anos':['1','2','3','4','5'],
      '6 a 12 anos':['6','7','8','10','12','14']
    };

    if (!nome||!tecidos.length||!preco) { toast('Preencha os campos obrigatórios!','error'); return; }

    const prod = { id, nome, emoji, tipo, categoria:cat, faixaIdade:faixa, tecidos, tamanhos:TAMANHOS[faixa]||[], preco, estoque, descricao:desc, destaque, ativo:true, vendas:0 };
    CerejaDB.saveProduto(prod);
    closeProdutoModal();
    renderAdmProdutos();
    toast('Produto salvo!','success');
  }

  function excluirProduto(id) {
    if (!confirm('Excluir este produto?')) return;
    CerejaDB.deleteProduto(id);
    renderAdmProdutos();
    toast('Produto excluído!','warning');
  }

  // ── ADM: CLIENTES ──
  function renderAdmClientes() {
    const lista = CerejaDB.getClientes();
    const el = document.getElementById('admClientesContent');

    const rows = lista.length ? lista.map(c=>`
      <tr>
        <td>${c.avatar} <strong>${c.nome}</strong></td>
        <td>${c.email}</td>
        <td>${new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
        <td>${CerejaDB.getPedidos({clienteId:c.id}).length}</td>
        <td><span class="status-badge status-${c.ativo?'entregue':'cancelado'}">${c.ativo?'✅ Ativo':'❌ Inativo'}</span></td>
      </tr>`).join('') :
      '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--cinza)">Nenhum cliente cadastrado.</td></tr>';

    el.innerHTML = `
      <div class="adm-topbar">
        <div><h1>Clientes</h1><p>${lista.length} cliente(s) cadastrado(s)</p></div>
      </div>
      <div class="table-wrap" style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Cadastro</th><th>Pedidos</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ── ADM: CONFIG ──
  function renderAdmConfig() {
    const cfg = CerejaDB.getConfig();
    const el = document.getElementById('admConfigContent');
    el.innerHTML = `
      <div class="adm-topbar"><div><h1>Configurações</h1><p>Configurações da loja</p></div></div>
      <div class="card card-body" style="max-width:560px">
        <div class="form-group"><label class="form-label">Nome da Loja</label><input class="form-input" id="cfg_nome" value="${cfg.lojaNome}"></div>
        <div class="form-group"><label class="form-label">WhatsApp (com DDI)</label><input class="form-input" id="cfg_wpp" value="${cfg.whatsapp}"></div>
        <div class="form-group"><label class="form-label">Mensagem de Banner</label><input class="form-input" id="cfg_banner" value="${cfg.banner}"></div>
        <div class="form-group"><label class="form-label">Política de Frete</label><input class="form-input" id="cfg_frete" value="${cfg.frete}"></div>
        <button class="btn btn-primary btn-full" onclick="App.salvarConfig()">💾 Salvar Configurações</button>
      </div>
      <div class="card card-body" style="max-width:560px;margin-top:16px">
        <h3 style="font-family:'Cormorant Garamond',serif;margin-bottom:14px;color:var(--cereja-esc)">🔑 Alterar Senha do Administrador</h3>
        <div class="form-group"><label class="form-label">Nova Senha</label><input class="form-input" id="cfg_newpwd" type="password" placeholder="Nova senha"></div>
        <div class="form-group"><label class="form-label">Confirmar Senha</label><input class="form-input" id="cfg_confpwd" type="password" placeholder="Confirmar"></div>
        <button class="btn btn-outline btn-full" onclick="App.alterarSenhaAdm()">🔑 Alterar Senha</button>
      </div>`;
  }

  function salvarConfig() {
    CerejaDB.saveConfig({
      lojaNome: document.getElementById('cfg_nome').value,
      whatsapp: document.getElementById('cfg_wpp').value,
      banner: document.getElementById('cfg_banner').value,
      frete: document.getElementById('cfg_frete').value,
    });
    toast('Configurações salvas!','success');
  }

  function alterarSenhaAdm() {
    const np = document.getElementById('cfg_newpwd').value;
    const cp = document.getElementById('cfg_confpwd').value;
    if (!np) { toast('Digite a nova senha!','error'); return; }
    if (np !== cp) { toast('Senhas não coincidem!','error'); return; }
    const d = CerejaDB.load();
    const adm = d.users.find(u=>u.role==='admin');
    if (adm) { adm.senha = np; CerejaDB.save(d); toast('Senha alterada!','success'); }
  }

  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════
  function init() {
    initNav();
    updateCartBadge();

    // Checar sessão
    const s = CerejaDB.getSessao();
    const startPage = s?.role === 'admin' ? 'adm' : 'home';
    goTo(startPage);
    renderHome();
    if (s?.role === 'admin') renderAdm();

    // Enter key login/register
    ['l_senha','r_conf'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key==='Enter') id.startsWith('l') ? doLogin() : doRegister();
      });
    });
  }

  return {
    init, goTo, addToCart, removeCartItem, openCartModal, closeCartModal,
    irParaFinalizacao, openFichaModal, closeFichaModal,
    maskCPF, maskTel, maskCEP, toggleEnviar, enviarPedido,
    switchLoginTab, doLogin, doRegister, doLogout,
    openPerfilModal, closePerfilModal, irAdm, irPedidos,
    renderAdm, switchAdmTab, renderAdmDashboard,
    renderAdmPedidos, filtrarPedidosAdm, updateStatus, contatarCliente,
    renderAdmProdutos, novoProduto, editarProduto, openProdutoModal, closeProdutoModal, salvarProduto, excluirProduto,
    renderAdmClientes, renderAdmConfig, salvarConfig, alterarSenhaAdm,
    renderMeusPedidos, acompanharPedido, solicitarCatalogo
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
