// ═══════════════════════════════════════════════════════════
//  CEREJA MODAS KIDS — DATABASE ENGINE (db.js)
//  Banco de dados completo em JS com persistência via JSON
// ═══════════════════════════════════════════════════════════

const CerejaDB = (() => {
  const STORAGE_KEY = 'cereja_db';

  const DEFAULT_DATA = {
    version: '2.0',
    users: [
      {
        id: 'u001', nome: 'Administrador', email: 'admin@cereja.com',
        senha: '1986', role: 'admin', avatar: '👑',
        criadoEm: '2024-01-01T00:00:00Z', ativo: true
      }
    ],
    clientes: [],
    produtos: [
      // ── MACACÕES 0–5 MESES ──
      { id:'p001', nome:'Macacão Teddy Ursinho', tipo:'macacão', categoria:'bebe', faixaIdade:'0 a 5 meses', emoji:'🐻', tecidos:['Teddy'], tamanhos:['RN','P1','P2','P3'], preco:89.90, estoque:20, descricao:'Macacão quentinho em Teddy com capuz de ursinho, ideal para os primeiros meses.', ativo:true, destaque:true, vendas:0 },
      { id:'p002', nome:'Macacão Veludo Coelhinho', tipo:'macacão', categoria:'bebe', faixaIdade:'0 a 5 meses', emoji:'🐰', tecidos:['Veludo'], tamanhos:['RN','P1','P2','P3'], preco:79.90, estoque:15, descricao:'Macacão de veludo suavíssimo com estampa de coelhinho.', ativo:true, destaque:false, vendas:0 },
      { id:'p003', nome:'Macacão Plush Estrelinhas', tipo:'macacão', categoria:'bebe', faixaIdade:'0 a 5 meses', emoji:'⭐', tecidos:['Plush Pelúcia'], tamanhos:['RN','P1','P2','P3'], preco:84.90, estoque:18, descricao:'Macacão em pelúcia com estampas de estrelinhas brilhantes.', ativo:true, destaque:true, vendas:0 },
      { id:'p004', nome:'Macacão Moletin Nuvem', tipo:'macacão', categoria:'bebe', faixaIdade:'0 a 5 meses', emoji:'☁️', tecidos:['Moletin'], tamanhos:['RN','P1','P2','P3'], preco:74.90, estoque:22, descricao:'Macacão leve em moletin, perfeito para dias mais fresquinhos.', ativo:true, destaque:false, vendas:0 },
      { id:'p005', nome:'Macacão Moletom Pinguim', tipo:'macacão', categoria:'bebe', faixaIdade:'0 a 5 meses', emoji:'🐧', tecidos:['Moletom'], tamanhos:['RN','P1','P2','P3'], preco:77.90, estoque:12, descricao:'Macacão moletom divertido com estampa de pinguim.', ativo:true, destaque:false, vendas:0 },

      // ── MACACÕES 6–12 MESES ──
      { id:'p006', nome:'Macacão Teddy Leãozinho', tipo:'macacão', categoria:'bebe', faixaIdade:'6 a 12 meses', emoji:'🦁', tecidos:['Teddy'], tamanhos:['M1','M2','G1','G2'], preco:89.90, estoque:16, descricao:'Macacão teddy com capuz de leãozinho, quentinho e fofo.', ativo:true, destaque:true, vendas:0 },
      { id:'p007', nome:'Macacão Veludo Borboleta', tipo:'macacão', categoria:'bebe', faixaIdade:'6 a 12 meses', emoji:'🦋', tecidos:['Veludo'], tamanhos:['M1','M2','G1','G2'], preco:82.90, estoque:14, descricao:'Macacão de veludo com bordado de borboletas coloridas.', ativo:true, destaque:false, vendas:0 },
      { id:'p008', nome:'Macacão Plush Baleia', tipo:'macacão', categoria:'bebe', faixaIdade:'6 a 12 meses', emoji:'🐳', tecidos:['Plush Pelúcia'], tamanhos:['M1','M2','G1','G2'], preco:87.90, estoque:10, descricao:'Macacão pelúcia azul com estampa de baleia fofa.', ativo:true, destaque:false, vendas:0 },
      { id:'p009', nome:'Macacão Moletin Girafa', tipo:'macacão', categoria:'bebe', faixaIdade:'6 a 12 meses', emoji:'🦒', tecidos:['Moletin'], tamanhos:['M1','M2','G1','G2'], preco:78.90, estoque:19, descricao:'Macacão moletin com estampa de girafa, conforto total.', ativo:true, destaque:false, vendas:0 },

      // ── CONJUNTOS 1–5 ANOS ──
      { id:'p010', nome:'Conjunto Teddy Dinossauro', tipo:'conjunto', categoria:'crianca', faixaIdade:'1 a 5 anos', emoji:'🦕', tecidos:['Teddy','Moletom'], tamanhos:['1','2','3','4','5'], preco:119.90, estoque:25, descricao:'Conjunto calça + blusa em teddy com estampa de dinossauro.', ativo:true, destaque:true, vendas:0 },
      { id:'p011', nome:'Conjunto Veludo Princesa', tipo:'conjunto', categoria:'crianca', faixaIdade:'1 a 5 anos', emoji:'👑', tecidos:['Veludo'], tamanhos:['1','2','3','4','5'], preco:134.90, estoque:20, descricao:'Conjunto veludo rosê com apliques dourados de coroas.', ativo:true, destaque:true, vendas:0 },
      { id:'p012', nome:'Conjunto Plush Unicórnio', tipo:'conjunto', categoria:'crianca', faixaIdade:'1 a 5 anos', emoji:'🦄', tecidos:['Plush Pelúcia','Moletin'], tamanhos:['1','2','3','4','5'], preco:129.90, estoque:18, descricao:'Conjunto pelúcia com estampa de unicórnio e glitter.', ativo:true, destaque:false, vendas:0 },
      { id:'p013', nome:'Conjunto Moletin Foguete', tipo:'conjunto', categoria:'crianca', faixaIdade:'1 a 5 anos', emoji:'🚀', tecidos:['Moletom','Moletin'], tamanhos:['1','2','3','4','5'], preco:109.90, estoque:30, descricao:'Conjunto moletom galáctico com foguetinhos bordados.', ativo:true, destaque:false, vendas:0 },
      { id:'p014', nome:'Conjunto Teddy Panda', tipo:'conjunto', categoria:'crianca', faixaIdade:'1 a 5 anos', emoji:'🐼', tecidos:['Teddy'], tamanhos:['1','2','3','4','5'], preco:124.90, estoque:22, descricao:'Conjunto teddy branco e preto estampa panda kawaii.', ativo:true, destaque:false, vendas:0 },

      // ── CONJUNTOS 6–12 ANOS ──
      { id:'p015', nome:'Conjunto Moletom Street', tipo:'conjunto', categoria:'crianca', faixaIdade:'6 a 12 anos', emoji:'⚽', tecidos:['Moletom'], tamanhos:['6','8','10','12'], preco:144.90, estoque:28, descricao:'Conjunto moletom estilo street, ideal para o dia a dia.', ativo:true, destaque:true, vendas:0 },
      { id:'p016', nome:'Conjunto Veludo Borboleta Glam', tipo:'conjunto', categoria:'crianca', faixaIdade:'6 a 12 anos', emoji:'🦋', tecidos:['Veludo'], tamanhos:['6','8','10','12'], preco:154.90, estoque:15, descricao:'Conjunto veludo com estampa de borboletas e brilhos.', ativo:true, destaque:true, vendas:0 },
      { id:'p017', nome:'Conjunto Moletin Listrado', tipo:'conjunto', categoria:'crianca', faixaIdade:'6 a 12 anos', emoji:'🎨', tecidos:['Moletin','Moletom'], tamanhos:['6','8','10','12'], preco:139.90, estoque:20, descricao:'Conjunto listrado em cores vibrantes, estilo e conforto.', ativo:true, destaque:false, vendas:0 },
      { id:'p018', nome:'Conjunto Teddy Urso Polar', tipo:'conjunto', categoria:'crianca', faixaIdade:'6 a 12 anos', emoji:'🐻‍❄️', tecidos:['Teddy'], tamanhos:['6','8','10','12'], preco:149.90, estoque:12, descricao:'Conjunto teddy off-white com estampa de urso polar.', ativo:true, destaque:false, vendas:0 },
    ],
    pedidos: [],
    config: {
      lojaNome: 'Cereja Modas Kids',
      whatsapp: '5511913019409',
      cor1: '#C0152A',
      cor2: '#8B0D1E',
      frete: 'Consultar via WhatsApp',
      banner: 'Frete grátis acima de R$ 299,00!'
    },
    sessao: null
  };

  // ── INIT ──
  function init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    } else {
      // merge produtos se não tiver
      const d = JSON.parse(raw);
      if (!d.produtos || d.produtos.length < 5) {
        d.produtos = DEFAULT_DATA.produtos;
        save(d);
      }
    }
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DATA;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ── AUTH ──
  function login(email, senha) {
    const d = load();
    const user = d.users.find(u => (u.email === email || u.nome === email) && u.senha === senha && u.ativo);
    if (user) {
      d.sessao = { userId: user.id, role: user.role, loginAt: new Date().toISOString() };
      save(d);
      return { ok: true, user };
    }
    return { ok: false, msg: 'E-mail ou senha incorretos.' };
  }

  function register(nome, email, senha) {
    const d = load();
    if (d.users.find(u => u.email === email)) return { ok: false, msg: 'E-mail já cadastrado.' };
    const user = {
      id: 'u' + Date.now(), nome, email, senha, role: 'cliente',
      avatar: '👤', criadoEm: new Date().toISOString(), ativo: true
    };
    d.users.push(user);
    d.sessao = { userId: user.id, role: user.role, loginAt: new Date().toISOString() };
    save(d);
    return { ok: true, user };
  }

  function logout() {
    const d = load();
    d.sessao = null;
    save(d);
  }

  function getSessao() {
    const d = load();
    if (!d.sessao) return null;
    const user = d.users.find(u => u.id === d.sessao.userId);
    return user ? { ...d.sessao, user } : null;
  }

  // ── PRODUTOS ──
  function getProdutos(filtros = {}) {
    const d = load();
    let lista = d.produtos.filter(p => p.ativo);
    if (filtros.tipo) lista = lista.filter(p => p.tipo === filtros.tipo);
    if (filtros.categoria) lista = lista.filter(p => p.categoria === filtros.categoria);
    if (filtros.tecido) lista = lista.filter(p => p.tecidos.map(t=>t.toLowerCase()).some(t=>t.includes(filtros.tecido.toLowerCase())));
    if (filtros.faixaIdade) lista = lista.filter(p => p.faixaIdade === filtros.faixaIdade);
    if (filtros.destaque) lista = lista.filter(p => p.destaque);
    return lista;
  }

  function getProduto(id) {
    return load().produtos.find(p => p.id === id);
  }

  function saveProduto(prod) {
    const d = load();
    const idx = d.produtos.findIndex(p => p.id === prod.id);
    if (idx >= 0) d.produtos[idx] = prod;
    else { prod.id = 'p' + Date.now(); d.produtos.push(prod); }
    save(d);
    return prod;
  }

  function deleteProduto(id) {
    const d = load();
    const p = d.produtos.find(x => x.id === id);
    if (p) { p.ativo = false; save(d); }
  }

  // ── PEDIDOS ──
  function criarPedido(pedido) {
    const d = load();
    const novo = {
      id: 'PED' + String(d.pedidos.length + 1).padStart(4,'0'),
      ...pedido,
      status: 'pendente',
      criadoEm: new Date().toISOString()
    };
    // atualizar vendas
    novo.itens.forEach(item => {
      const p = d.produtos.find(x => x.id === item.produtoId);
      if (p) { p.vendas = (p.vendas||0) + item.qtd; p.estoque = Math.max(0, (p.estoque||0) - item.qtd); }
    });
    d.pedidos.push(novo);
    save(d);
    return novo;
  }

  function getPedidos(filtros = {}) {
    const d = load();
    let lista = [...d.pedidos].reverse();
    if (filtros.clienteId) lista = lista.filter(p => p.clienteId === filtros.clienteId);
    if (filtros.status) lista = lista.filter(p => p.status === filtros.status);
    return lista;
  }

  function updatePedidoStatus(id, status) {
    const d = load();
    const p = d.pedidos.find(x => x.id === id);
    if (p) { p.status = status; save(d); }
  }

  // ── CLIENTES (users com role cliente) ──
  function getClientes() {
    return load().users.filter(u => u.role === 'cliente');
  }

  // ── STATS ──
  function getStats() {
    const d = load();
    const pedidos = d.pedidos;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const mesAtual = new Date(); mesAtual.setDate(1); mesAtual.setHours(0,0,0,0);

    const totalVendas = pedidos.filter(p=>p.status!=='cancelado').reduce((s,p)=>s+p.total,0);
    const pedidosHoje = pedidos.filter(p=>new Date(p.criadoEm)>=hoje).length;
    const pedidosMes = pedidos.filter(p=>new Date(p.criadoEm)>=mesAtual).length;
    const clientes = d.users.filter(u=>u.role==='cliente').length;

    // vendas por dia (últimos 7 dias)
    const vendasDia = [];
    for (let i=6; i>=0; i--) {
      const d1 = new Date(); d1.setDate(d1.getDate()-i); d1.setHours(0,0,0,0);
      const d2 = new Date(d1); d2.setHours(23,59,59,999);
      const v = pedidos.filter(p=>{ const dt=new Date(p.criadoEm); return dt>=d1&&dt<=d2&&p.status!=='cancelado'; }).reduce((s,p)=>s+p.total,0);
      vendasDia.push({ dia: d1.toLocaleDateString('pt-BR',{weekday:'short'}), valor: v });
    }

    // top produtos
    const topProd = [...d.produtos].sort((a,b)=>(b.vendas||0)-(a.vendas||0)).slice(0,5);

    // por status
    const porStatus = ['pendente','confirmado','enviado','entregue','cancelado'].map(s=>({
      status: s, qtd: pedidos.filter(p=>p.status===s).length
    }));

    return { totalVendas, pedidosHoje, pedidosMes, totalPedidos: pedidos.length, clientes, vendasDia, topProd, porStatus };
  }

  // ── CONFIG ──
  function getConfig() { return load().config; }
  function saveConfig(cfg) { const d=load(); d.config={...d.config,...cfg}; save(d); }

  init();

  return {
    login, register, logout, getSessao,
    getProdutos, getProduto, saveProduto, deleteProduto,
    criarPedido, getPedidos, updatePedidoStatus,
    getClientes, getStats,
    getConfig, saveConfig,
    load, save
  };
})();
