const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
const moeda = valor => valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const escapar = valor => String(valor).replace(/[&<>"']/g, caractere => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[caractere]));
const obterProdutoPorId = id => produtosPorId.get(Number(id));

const FRETE = 24.9;
const FRETE_GRATIS = 300;
const grade = $('#grade');
const aviso = $('#aviso');
const itensSacola = $('#itensSacola');
const resumoPagamento = $('#resumoPagamento');
const formularioPagamento = $('#formPagamento');
const produtosPorId = new Map(produtos.map(produto => [produto.id, produto]));
const estadoCatalogo = { categoria: 'todos', termo: '', faixa: 'todas', ordem: 'relevancia' };

function lerSacola(){
  try {
    const atual = localStorage.getItem('cj_sacola');
    const legada = atual === null ? localStorage.getItem('sacola') : null;
    const dados = JSON.parse(atual ?? legada ?? '[]');
    if (!Array.isArray(dados)) return [];

    return dados.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const produto = produtosPorId.get(Number(item.id));
      if (!produto) return [];
      const tamanho = String(item.t || item.tamanho || (produto.i === 'calca' ? '38' : 'M'));
      const quantidade = Math.max(1, Math.min(10, Math.floor(Number(item.q || item.quantidade) || 1)));
      return [{id:produto.id, t:tamanho, q:quantidade}];
    });
  } catch (erro) {
    console.error('Não foi possível ler a sacola salva.', erro);
    return [];
  }
}

let sacola = lerSacola();
let selecaoProduto = null;

try {
  localStorage.removeItem('cj_usuarios');
  localStorage.removeItem('cj_usuario');
} catch (erro) {
  console.error('Não foi possível remover os dados da conta demonstrativa antiga.', erro);
}

function salvarSacola(){
  try {
    localStorage.setItem('cj_sacola', JSON.stringify(sacola));
    localStorage.removeItem('sacola');
  } catch (erro) {
    console.error('Não foi possível salvar a sacola.', erro);
    mostrarAviso('Não foi possível salvar a sacola neste navegador.');
  }
  atualizarContador();
  renderizarDrawer();
  renderizarSacolaPagina();
  renderizarPagamento();
}

function atualizarContador(){
  const contador = $('#qtd');
  if (contador) contador.textContent = sacola.reduce((total, item) => total + item.q, 0);
}

function mostrarAviso(mensagem){
  if (!aviso) return;
  aviso.textContent = mensagem;
  aviso.classList.add('show');
  clearTimeout(mostrarAviso.temporizador);
  mostrarAviso.temporizador = setTimeout(() => aviso.classList.remove('show'), 2400);
}

function obterTotais(){
  const subtotal = sacola.reduce((total, item) => total + produtosPorId.get(item.id).p * item.q, 0);
  const freteGratis = subtotal >= FRETE_GRATIS;
  const frete = sacola.length && !freteGratis ? FRETE : 0;
  return {subtotal, freteGratis, frete, total:subtotal + frete};
}

function obterImagem(produto){
  return produto.foto
    ? `<img src="../IMG/${encodeURIComponent(produto.foto)}" alt="${escapar(produto.n)}">`
    : `<svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${icones[produto.i]}</svg>`;
}

function agruparSacola(){
  return sacola.reduce((grupos, item) => {
    const existente = grupos.find(grupo => grupo.id === item.id && grupo.t === item.t);
    if (existente) existente.q += item.q;
    else grupos.push({...item});
    return grupos;
  }, []);
}

function obterProdutosFiltrados(categoria = estadoCatalogo.categoria){
  const categoriaAtual = categoria || 'todos';
  const termo = (document.getElementById('buscaProduto')?.value || estadoCatalogo.termo || '').trim().toLowerCase();
  const faixa = document.getElementById('filtroPreco')?.value || estadoCatalogo.faixa || 'todas';
  const ordem = document.getElementById('ordemProdutos')?.value || estadoCatalogo.ordem || 'relevancia';

  let lista = produtos.filter(produto => categoriaAtual === 'todos' || produto.c === categoriaAtual);

  if (termo) {
    lista = lista.filter(produto => produto.n.toLowerCase().includes(termo));
  }

  if (faixa === 'ate-150') lista = lista.filter(produto => produto.p <= 150);
  if (faixa === '150-250') lista = lista.filter(produto => produto.p > 150 && produto.p <= 250);
  if (faixa === 'acima-250') lista = lista.filter(produto => produto.p > 250);

  if (ordem === 'menor-preco') lista = [...lista].sort((a, b) => a.p - b.p);
  if (ordem === 'maior-preco') lista = [...lista].sort((a, b) => b.p - a.p);
  if (ordem === 'alfabetica') lista = [...lista].sort((a, b) => a.n.localeCompare(b.n));

  estadoCatalogo.categoria = categoriaAtual;
  estadoCatalogo.termo = termo;
  estadoCatalogo.faixa = faixa;
  estadoCatalogo.ordem = ordem;

  return lista;
}

function mostrarProdutos(categoria = 'todos'){
  if (!grade) return;
  const lista = obterProdutosFiltrados(categoria);

  if (!lista.length) {
    grade.innerHTML = `
      <div class="lista-vazia">
        <p>Nenhuma peça encontrada com esses filtros.</p>
        <button class="btn vazado" type="button" data-acao="limpar-filtros">Limpar busca</button>
      </div>`;
    return;
  }

  grade.innerHTML = lista.map(produto => `
    <article class="card">
      <button class="foto" type="button" data-acao="detalhe" data-id="${produto.id}" aria-label="Ver ${escapar(produto.n)}">
        ${obterImagem(produto)}
      </button>
      <div class="info">
        <small>${produto.c === 'feminino' ? 'Feminino' : 'Masculino'}</small>
        <h3>${escapar(produto.n)}</h3>
        <span class="preco">${moeda(produto.p)}</span>
        <a class="btn" href="produto.html?id=${produto.id}">Ver detalhes</a>
      </div>
    </article>`).join('');
}

function abrirPainel(painel){
  $$('.painel').forEach(elemento => elemento.classList.toggle('aberto', elemento === painel));
  const overlay = $('#overlay');
  if (overlay) overlay.classList.add('ativo');
  document.body.classList.add('trava');
}

function fecharPainel(){
  $$('.painel').forEach(elemento => elemento.classList.remove('aberto'));
  const overlay = $('#overlay');
  if (overlay) overlay.classList.remove('ativo');
  document.body.classList.remove('trava');
}

document.body.insertAdjacentHTML('beforeend', `
  <div class="overlay" id="overlay" data-acao="fechar"></div>
  <div class="painel modal" id="modal" role="dialog" aria-modal="true" aria-label="Detalhes do produto"></div>
  <aside class="painel drawer" id="drawer" role="dialog" aria-label="Sacola de compras"></aside>`);

function adicionarProduto(){
  if (!selecaoProduto || !selecaoProduto.t) {
    const erro = $('#erroTam');
    if (erro) erro.textContent = 'Escolha um tamanho para continuar.';
    return;
  }
  const item = sacola.find(atual => atual.id === selecaoProduto.id && atual.t === selecaoProduto.t);
  if (item) item.q = Math.min(10, item.q + selecaoProduto.q);
  else sacola.push({...selecaoProduto});
  salvarSacola();
  mostrarAviso('Peça adicionada à sacola.');
  abrirSacola();
}

function mostrarDetalhe(id){
  const produto = produtosPorId.get(Number(id));
  if (!produto) return;
  selecaoProduto = {id:produto.id, t:null, q:1};
  const tamanhos = produto.t || (produto.i === 'calca' ? ['36','38','40','42'] : ['P','M','G','GG']);
  const modal = $('#modal');
  modal.className = 'painel modal';
  modal.innerHTML = `
    <button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">×</button>
    <div class="det">
      <div class="det-foto">${obterImagem(produto)}</div>
      <div class="det-info">
        <small>${produto.c === 'feminino' ? 'Feminino' : 'Masculino'}</small>
        <h2>${escapar(produto.n)}</h2>
        <span class="preco">${moeda(produto.p)}</span>
        <b class="rot">Tamanho</b>
        <div class="tams">${tamanhos.map(tamanho => `<button class="tam" type="button" data-acao="tamanho" data-tamanho="${escapar(tamanho)}">${escapar(tamanho)}</button>`).join('')}</div>
        <p class="erro" id="erroTam" aria-live="polite"></p>
        <b class="rot">Quantidade</b>
        <div class="qtd">
          <button type="button" data-acao="quantidade" data-delta="-1" aria-label="Diminuir quantidade">−</button>
          <span id="quantidadeSelecionada">1</span>
          <button type="button" data-acao="quantidade" data-delta="1" aria-label="Aumentar quantidade">+</button>
        </div>
        <button class="btn" type="button" data-acao="adicionar">Adicionar à sacola</button>
      </div>
    </div>`;
  abrirPainel(modal);
}

function abrirSacola(){
  renderizarDrawer();
  abrirPainel($('#drawer'));
}

function renderizarDrawer(){
  const drawer = $('#drawer');
  if (!drawer) return;
  const totais = obterTotais();
  const quantidade = sacola.reduce((total, item) => total + item.q, 0);
  let conteudo = `<div class="painel-topo"><h3>Minha sacola (${quantidade})</h3><button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">×</button></div>`;

  if (!sacola.length) {
    conteudo += '<div class="vazio"><p>Sua sacola está vazia.</p><button class="btn" type="button" data-acao="fechar">Continuar comprando</button></div>';
  } else {
    conteudo += `
      <div class="corpo">
        <div class="frete-bar">
          <p>${totais.freteGratis ? 'Você ganhou <b>frete grátis</b>!' : `Faltam <b>${moeda(FRETE_GRATIS - totais.subtotal)}</b> para o frete grátis`}</p>
          <div class="barra"><i style="width:${Math.min(100, totais.subtotal / FRETE_GRATIS * 100)}%"></i></div>
        </div>
        ${agruparSacola().map(item => {
          const produto = produtosPorId.get(item.id);
          return `<div class="item">
            <div class="mini-foto">${obterImagem(produto)}</div>
            <div>
              <b>${escapar(produto.n)}</b>
              <small>Tamanho ${escapar(item.t)} · ${moeda(produto.p)} cada</small>
              <div class="linha">
                <div class="qtd">
                  <button type="button" data-acao="alterar" data-id="${item.id}" data-tamanho="${escapar(item.t)}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
                  <span>${item.q}</span>
                  <button type="button" data-acao="alterar" data-id="${item.id}" data-tamanho="${escapar(item.t)}" data-delta="1" aria-label="Aumentar quantidade">+</button>
                </div>
                <b>${moeda(produto.p * item.q)}</b>
              </div>
            </div>
            <button class="x" type="button" data-acao="remover" data-id="${item.id}" data-tamanho="${escapar(item.t)}" aria-label="Remover ${escapar(produto.n)}">×</button>
          </div>`;
        }).join('')}
        <button class="link" type="button" data-acao="limpar">Esvaziar sacola</button>
      </div>
      <div class="resumo">
        <div><span>Subtotal</span><span>${moeda(totais.subtotal)}</span></div>
        <div><span>Frete</span><span>${totais.frete ? moeda(totais.frete) : 'Grátis'}</span></div>
        <div class="total"><span>Total</span><span>${moeda(totais.total)}</span></div>
        <a class="btn" href="pagamento.html">Ir para pagamento</a>
        <a class="btn vazado" href="sacola.html">Ver sacola detalhada</a>
        <button class="btn vazado" type="button" data-acao="fechar">Continuar comprando</button>
      </div>`;
  }
  drawer.innerHTML = conteudo;
}

function renderizarSacolaPagina(){
  if (!itensSacola) return;
  const grupos = agruparSacola();
  if (!grupos.length) {
    itensSacola.innerHTML = '<p class="sacola-vazia">Sua sacola está vazia. <a href="colecao.html">Veja a coleção</a> para escolher suas peças.</p>';
  } else {
    itensSacola.innerHTML = grupos.map(item => {
      const produto = produtosPorId.get(item.id);
      return `<article class="item-sacola">
        <div class="item-sacola-foto">${obterImagem(produto)}</div>
        <div class="item-sacola-info">
          <small>${produto.c === 'feminino' ? 'Feminino' : 'Masculino'}</small>
          <h3>${escapar(produto.n)}</h3>
          <span>Tamanho ${escapar(item.t)} · ${moeda(produto.p)} cada</span>
          <div class="controles-qtd" aria-label="Quantidade de ${escapar(produto.n)} tamanho ${escapar(item.t)}">
            <button type="button" data-acao="alterar" data-id="${item.id}" data-tamanho="${escapar(item.t)}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
            <span>${item.q}</span>
            <button type="button" data-acao="alterar" data-id="${item.id}" data-tamanho="${escapar(item.t)}" data-delta="1" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="remover-item" data-acao="remover" data-id="${item.id}" data-tamanho="${escapar(item.t)}">Remover</button>
          </div>
        </div>
        <strong class="item-sacola-total">${moeda(produto.p * item.q)}</strong>
      </article>`;
    }).join('');
  }

  const totais = obterTotais();
  const subtotal = $('#valorSubtotal');
  const frete = $('#valorFrete');
  const total = $('#valorTotal');
  if (subtotal) subtotal.textContent = moeda(totais.subtotal);
  if (frete) frete.textContent = totais.frete ? moeda(totais.frete) : 'Grátis';
  if (total) total.textContent = moeda(totais.total);
  const continuar = $('#irPagamento');
  if (continuar) continuar.hidden = !grupos.length;
}

function renderizarPagamento(){
  if (!resumoPagamento) return;
  const grupos = agruparSacola();
  if (!grupos.length) {
    resumoPagamento.innerHTML = '<p>Sua sacola está vazia. <a href="colecao.html">Volte à coleção</a> para escolher suas peças.</p>';
    if (formularioPagamento) formularioPagamento.hidden = true;
    return;
  }

  if (formularioPagamento) formularioPagamento.hidden = false;
  const totais = obterTotais();
  resumoPagamento.innerHTML = `
    <ul class="resumo-itens">${grupos.map(item => {
      const produto = produtosPorId.get(item.id);
      return `<li><span>${escapar(produto.n)} · ${escapar(item.t)} × ${item.q}</span><strong>${moeda(produto.p * item.q)}</strong></li>`;
    }).join('')}</ul>
    <div class="linha-total"><span>Subtotal</span><strong>${moeda(totais.subtotal)}</strong></div>
    <div class="linha-total"><span>Frete</span><strong>${totais.frete ? moeda(totais.frete) : 'Grátis'}</strong></div>
    <div class="linha-total"><span>Total</span><strong>${moeda(totais.total)}</strong></div>
    <p class="aviso-frete">Pedido demonstrativo: não haverá cobrança.</p>`;
}

function alterarQuantidade(botao){
  const id = Number(botao.dataset.id);
  const tamanho = botao.dataset.tamanho;
  const delta = Number(botao.dataset.delta);
  const item = sacola.find(atual => atual.id === id && atual.t === tamanho);
  if (!item) return;
  if (delta > 0) item.q = Math.min(10, item.q + 1);
  else if (item.q > 1) item.q--;
  else sacola = sacola.filter(atual => atual !== item);
  salvarSacola();
}

document.addEventListener('click', evento => {
  const acao = evento.target.closest('[data-acao]');
  if (acao) {
    const nome = acao.dataset.acao;
    if (acao instanceof HTMLAnchorElement) evento.preventDefault();
    if (nome === 'fechar') fecharPainel();
    if (nome === 'sacola') abrirSacola();
    if (nome === 'detalhe') mostrarDetalhe(acao.dataset.id);
    if (nome === 'adicionar') adicionarProduto();
    if (nome === 'tamanho') {
      selecaoProduto.t = acao.dataset.tamanho;
      $$('.tam', $('#modal')).forEach(botao => botao.classList.toggle('on', botao === acao));
      $('#erroTam').textContent = '';
    }
    if (nome === 'quantidade') {
      selecaoProduto.q = Math.max(1, Math.min(10, selecaoProduto.q + Number(acao.dataset.delta)));
      $('#quantidadeSelecionada').textContent = selecaoProduto.q;
    }
    if (nome === 'alterar') alterarQuantidade(acao);
    if (nome === 'remover') {
      sacola = sacola.filter(item => item.id !== Number(acao.dataset.id) || item.t !== acao.dataset.tamanho);
      salvarSacola();
    }
    if (nome === 'limpar') {
      sacola = [];
      salvarSacola();
    }
    if (nome === 'limpar-filtros') {
      const busca = $('#buscaProduto');
      const filtroPreco = $('#filtroPreco');
      const ordem = $('#ordemProdutos');
      if (busca) busca.value = '';
      if (filtroPreco) filtroPreco.value = 'todas';
      if (ordem) ordem.value = 'relevancia';
      estadoCatalogo.termo = '';
      estadoCatalogo.faixa = 'todas';
      estadoCatalogo.ordem = 'relevancia';
      mostrarProdutos(estadoCatalogo.categoria);
    }
    return;
  }

  const linkSacola = evento.target.closest('.cart[href="sacola.html"]');
  if (linkSacola) {
    evento.preventDefault();
    abrirSacola();
  }
});

document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape') fecharPainel();
});

function inicializarCatalogo(){
  if (!grade) return;

  const toolbarExistente = document.querySelector('.toolbar-listagem');
  if (!toolbarExistente && !document.getElementById('buscaProduto')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar-listagem';
    toolbar.setAttribute('aria-label', 'Buscar e ordenar produtos');
    toolbar.innerHTML = `
      <label class="campo-pesquisa" for="buscaProduto">
        <span>Buscar</span>
        <input id="buscaProduto" type="search" placeholder="Buscar peça..." autocomplete="off">
      </label>
      <label class="campo-select" for="filtroPreco">
        <span>Preço</span>
        <select id="filtroPreco">
          <option value="todas">Todos os preços</option>
          <option value="ate-150">Até R$ 150</option>
          <option value="150-250">R$ 150 a R$ 250</option>
          <option value="acima-250">Acima de R$ 250</option>
        </select>
      </label>
      <label class="campo-select" for="ordemProdutos">
        <span>Ordenar</span>
        <select id="ordemProdutos">
          <option value="relevancia">Mais relevantes</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
          <option value="alfabetica">A-Z</option>
        </select>
      </label>`;
    grade.parentNode.insertBefore(toolbar, grade);
  }

  const busca = $('#buscaProduto');
  const filtroPreco = $('#filtroPreco');
  const ordem = $('#ordemProdutos');

  if (busca) {
    busca.addEventListener('input', evento => {
      estadoCatalogo.termo = evento.target.value.trim();
      mostrarProdutos(estadoCatalogo.categoria);
    });
  }

  if (filtroPreco) {
    filtroPreco.addEventListener('change', evento => {
      estadoCatalogo.faixa = evento.target.value;
      mostrarProdutos(estadoCatalogo.categoria);
    });
  }

  if (ordem) {
    ordem.addEventListener('change', evento => {
      estadoCatalogo.ordem = evento.target.value;
      mostrarProdutos(estadoCatalogo.categoria);
    });
  }
}

function inicializarPaginaProduto(){
  const container = document.getElementById('produtoDetalhe');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const produto = obterProdutoPorId(params.get('id'));
  if (!produto) {
    container.innerHTML = `
      <div class="produto-vazio">
        <h1 class="titulo-pagina">Peça não encontrada</h1>
        <p class="sub">Essa peça não está disponível no momento.</p>
        <a class="btn" href="colecao.html">Voltar para coleção</a>
      </div>`;
    return;
  }

  const tamanhos = produto.t || (produto.i === 'calca' ? ['36','38','40','42'] : ['P','M','G','GG']);
  let tamanhoSelecionado = tamanhos[0];
  let quantidadeSelecionada = 1;

  const renderizar = () => {
    container.innerHTML = `
      <div class="produto-layout">
        <div class="det-foto det-foto-grande">${obterImagem(produto)}</div>
        <div class="det-info produto-info">
          <small class="eyebrow">${produto.c === 'feminino' ? 'Feminino' : 'Masculino'}</small>
          <h1 class="titulo-pagina produto-titulo">${escapar(produto.n)}</h1>
          <div class="produto-meta">
            <span class="preco produto-preco">${moeda(produto.p)}</span>
            <span class="badge-estoque">Em estoque</span>
          </div>
          <p class="produto-descricao">${escapar(produto.d || 'Peça selecionada com design refinado e acabamento premium.')}</p>

          <div class="lista-caracteristicas">
            <span>Entrega em 3 a 5 dias</span>
            <span>Troca em até 7 dias</span>
            <span>Pagamento demonstrativo</span>
          </div>

          <div class="selecao-produto">
            <div class="rot">Tamanho</div>
            <div class="tams">
              ${tamanhos.map(tamanho => `<button class="tam ${tamanho === tamanhoSelecionado ? 'on' : ''}" type="button" data-tamanho="${escapar(tamanho)}">${escapar(tamanho)}</button>`).join('')}
            </div>
          </div>

          <div class="produto-acoes">
            <div class="qtd" aria-label="Quantidade do produto">
              <button type="button" data-acao="quantidade-pagina" data-delta="-1" aria-label="Diminuir quantidade">−</button>
              <span>${quantidadeSelecionada}</span>
              <button type="button" data-acao="quantidade-pagina" data-delta="1" aria-label="Aumentar quantidade">+</button>
            </div>
            <button class="btn" type="button" data-acao="adicionar-produto">Adicionar à sacola</button>
          </div>
        </div>
      </div>
      <div class="produto-lateral">
        <div class="info-card">
          <h2>Detalhes da peça</h2>
          <ul>
            <li>Modelagem premium e confortável.</li>
            <li>Material com acabamento sofisticado.</li>
            <li>Versátil para looks do dia a dia e ocasiões especiais.</li>
          </ul>
        </div>
      </div>`;

    document.querySelectorAll('[data-tamanho]').forEach(botao => {
      botao.addEventListener('click', () => {
        tamanhoSelecionado = botao.dataset.tamanho;
        renderizar();
      });
    });

    const botaoAdicionar = document.querySelector('[data-acao="adicionar-produto"]');
    if (botaoAdicionar) {
      botaoAdicionar.addEventListener('click', () => {
        const itemExistente = sacola.find(item => item.id === produto.id && item.t === tamanhoSelecionado);
        if (itemExistente) itemExistente.q = Math.min(10, itemExistente.q + quantidadeSelecionada);
        else sacola.push({id: produto.id, t: tamanhoSelecionado, q: quantidadeSelecionada});
        salvarSacola();
        mostrarAviso(`${escapar(produto.n)} adicionada à sacola.`);
      });
    }

    document.querySelectorAll('[data-acao="quantidade-pagina"]').forEach(botao => {
      botao.addEventListener('click', () => {
        const delta = Number(botao.dataset.delta);
        quantidadeSelecionada = Math.max(1, Math.min(10, quantidadeSelecionada + delta));
        renderizar();
      });
    });
  };

  renderizar();
}

const filtros = $('#filtros');
if (filtros) {
  filtros.addEventListener('click', evento => {
    const botao = evento.target.closest('button[data-cat]');
    if (!botao) return;
    $$('#filtros button').forEach(elemento => elemento.setAttribute('aria-pressed', elemento === botao));
    estadoCatalogo.categoria = botao.dataset.cat;
    mostrarProdutos(botao.dataset.cat);
  });
}

const formularioContato = $('#form');
if (formularioContato) {
  formularioContato.addEventListener('submit', evento => {
    evento.preventDefault();
    mostrarAviso(`Mensagem enviada! Obrigada, ${$('#nome').value}.`);
    formularioContato.reset();
  });
}

if (formularioPagamento) {
  formularioPagamento.addEventListener('submit', evento => {
    evento.preventDefault();
    if (!sacola.length) {
      mostrarAviso('Sua sacola está vazia.');
      return;
    }
    const pagamento = new FormData(formularioPagamento).get('pagamento');
    const confirmacao = $('#pedidoConfirmado');
    if (!confirmacao) return;
    confirmacao.hidden = false;
    confirmacao.innerHTML = `
      <h2>Pedido demonstrativo confirmado!</h2>
      <p>Forma de pagamento escolhida: ${escapar(pagamento)}.</p>
      <p>Nenhuma cobrança foi feita e seus dados não foram salvos.</p>
      <a class="btn" href="index.html">Voltar à loja</a>`;
    sacola = [];
    salvarSacola();
    formularioPagamento.hidden = true;
    window.scrollTo({top:0, behavior:'smooth'});
  });
}

const botaoVoltar = $('#btnVoltar');
if (botaoVoltar) {
  botaoVoltar.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else window.location.href = 'index.html';
  });
}

inicializarCatalogo();
inicializarPaginaProduto();
mostrarProdutos(grade?.dataset.categoria || 'todos');
atualizarContador();
renderizarDrawer();
renderizarSacolaPagina();
renderizarPagamento();
