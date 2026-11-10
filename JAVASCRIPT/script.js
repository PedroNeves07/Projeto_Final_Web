const moeda = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const grade = document.getElementById('grade');
const qtd = document.getElementById('qtd');
const aviso = document.getElementById('aviso');
const itensSacola = document.getElementById('itensSacola');
const valorSubtotal = document.getElementById('valorSubtotal');
const resumoPagamento = document.getElementById('resumoPagamento');
const btnVoltar = document.getElementById('btnVoltar');

if (btnVoltar) {
  btnVoltar.addEventListener('click',()=>{
    if (history.length > 1) history.back();
    else window.location.href = 'index.html';
  });
}

function lerSacola(){
  try {
    const salva = JSON.parse(localStorage.getItem('sacola')) || [];
    if (!Array.isArray(salva)) return [];
    return salva.map(item => produtos.find(p => p.id === Number(item.id))).filter(Boolean);
  } catch(e) {
    return [];
  }
}

let sacola = lerSacola();

function atualizarContador(){
  if (qtd) qtd.textContent = sacola.length;
}

function salvarSacola(){
  try { localStorage.setItem('sacola', JSON.stringify(sacola)); } catch(e) {}
  atualizarContador();
  renderizarSacola();
  renderizarResumoPagamento();
}

function mostrar(cat){
  if (!grade) return;
  grade.innerHTML = produtos
    .filter(p => cat==='todos' || p.c===cat)
    .map(p => {
      const imagem = p.foto
        ? `<img src="../IMG/${p.foto}" alt="${p.n}">`
        : `<svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" stroke-width="2" stroke-linejoin="round">${icones[p.i]}</svg>`;
      return `
      <article class="card">
        <div class="foto">${imagem}</div>
        <div class="info">
          <small>${p.c==='feminino'?'Feminino':'Masculino'}</small>
          <h3>${p.n}</h3>
          <span class="preco">${moeda(p.p)}</span>
          <button class="btn" data-add="${p.id}">Adicionar à sacola</button>
        </div>
      </article>`;
    }).join('');
}

function toast(t){
  if (!aviso) return;
  aviso.textContent = t;
  aviso.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>aviso.classList.remove('show'),2200);
}

if (grade) {
  grade.addEventListener('click',e=>{
    const b = e.target.closest('[data-add]'); if(!b) return;
    const p = produtos.find(x => x.id === Number(b.dataset.add));
    if (!p) return;
    sacola.push(p);
    salvarSacola();
    toast(p.n + ' adicionado à sacola');
  });
}

function agruparSacola(){
  return sacola.reduce((grupos,p)=>{
    const existente = grupos.find(item => item.produto.id === p.id);
    if (existente) existente.quantidade++;
    else grupos.push({produto:p, quantidade:1});
    return grupos;
  },[]);
}

function htmlFoto(p){
  return p.foto
    ? `<img src="../IMG/${p.foto}" alt="${p.n}">`
    : `<svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" stroke-width="2" stroke-linejoin="round" aria-hidden="true">${icones[p.i]}</svg>`;
}

function renderizarSacola(){
  if (!itensSacola) return;
  const grupos = agruparSacola();
  if (!grupos.length) {
    itensSacola.innerHTML = '<p class="sacola-vazia">Sua sacola está vazia. Escolha algumas peças para continuar.</p>';
  } else {
    itensSacola.innerHTML = grupos.map(({produto:p,quantidade})=>`
      <article class="item-sacola">
        <div class="item-sacola-foto">${htmlFoto(p)}</div>
        <div class="item-sacola-info">
          <small>${p.c==='feminino'?'Feminino':'Masculino'}</small>
          <h3>${p.n}</h3>
          <span>${moeda(p.p)} cada</span>
          <div class="controles-qtd" aria-label="Quantidade de ${p.n}">
            <button type="button" data-quantidade="${p.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button>
            <span>${quantidade}</span>
            <button type="button" data-quantidade="${p.id}" data-delta="1" aria-label="Aumentar quantidade">+</button>
            <button type="button" class="remover-item" data-remover="${p.id}">Remover</button>
          </div>
        </div>
        <strong class="item-sacola-total">${moeda(p.p*quantidade)}</strong>
      </article>`).join('');
  }
  const subtotal = sacola.reduce((s,p)=>s+p.p,0);
  if (valorSubtotal) valorSubtotal.textContent = moeda(subtotal);
  const continuar = document.getElementById('irPagamento');
  if (continuar) continuar.hidden = !grupos.length;
}

if (itensSacola) {
  itensSacola.addEventListener('click',e=>{
    const remover = e.target.closest('[data-remover]');
    if (remover) {
      const id = Number(remover.dataset.remover);
      sacola = sacola.filter(p=>p.id!==id);
      salvarSacola();
      return;
    }
    const alterar = e.target.closest('[data-quantidade]');
    if (!alterar) return;
    const id = Number(alterar.dataset.quantidade);
    if (Number(alterar.dataset.delta) > 0) {
      const produto = produtos.find(p=>p.id===id);
      if (produto) sacola.push(produto);
    } else {
      const indice = sacola.findIndex(p=>p.id===id);
      if (indice!==-1) sacola.splice(indice,1);
    }
    salvarSacola();
  });
}

function renderizarResumoPagamento(){
  if (!resumoPagamento) return;
  const grupos = agruparSacola();
  const subtotal = sacola.reduce((s,p)=>s+p.p,0);
  if (!grupos.length) {
    resumoPagamento.innerHTML = '<p>Sua sacola está vazia. <a href="colecao.html">Volte à coleção</a> para escolher suas peças.</p>';
    return;
  }
  resumoPagamento.innerHTML = `
    <ul class="resumo-itens">${grupos.map(({produto:p,quantidade})=>`
      <li><span>${p.n} × ${quantidade}</span><strong>${moeda(p.p*quantidade)}</strong></li>
    `).join('')}</ul>
    <div class="linha-total"><span>Total dos produtos</span><strong>${moeda(subtotal)}</strong></div>
    <p class="aviso-frete">Frete a combinar após a confirmação do endereço.</p>`;
}

// Filtros (só existem na página da coleção)
const filtros = document.getElementById('filtros');
if (filtros) {
  filtros.addEventListener('click',e=>{
    const b = e.target.closest('button'); if(!b) return;
    document.querySelectorAll('#filtros button').forEach(x=>x.setAttribute('aria-pressed',x===b));
    mostrar(b.dataset.cat);
  });
}

// Formulário de contato (só existe na página de contato)
const form = document.getElementById('form');
if (form) {
  form.addEventListener('submit',e=>{
    e.preventDefault();
    toast('Mensagem enviada! Obrigada, ' + document.getElementById('nome').value + '.');
    e.target.reset();
  });
}

const formPagamento = document.getElementById('formPagamento');
if (formPagamento) {
  formPagamento.addEventListener('submit',e=>{
    e.preventDefault();
    if (!sacola.length) {
      toast('Adicione uma peça antes de continuar');
      return;
    }
    const pagamento = new FormData(formPagamento).get('pagamento');
    const confirmacao = document.getElementById('pedidoConfirmado');
    confirmacao.hidden = false;
    confirmacao.innerHTML = `<h2>Pedido demonstrativo confirmado!</h2><p>Nenhum pagamento foi realizado. Forma escolhida: ${pagamento}.</p><p>Esta loja ainda não está conectada a um serviço de pagamento real.</p><a class="btn" href="index.html">Voltar à loja</a>`;
    formPagamento.hidden = true;
    sacola = [];
    salvarSacola();
    window.scrollTo({top:0,behavior:'smooth'});
  });
}

atualizarContador();
renderizarSacola();
renderizarResumoPagamento();
if (grade) mostrar(grade.dataset.categoria || 'todos');