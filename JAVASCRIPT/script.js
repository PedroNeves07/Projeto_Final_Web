const icones = {
  vestido:'<path d="M42 10h16l4 20-8 8 14 52H32l14-52-8-8z"/>',
  blusa:'<path d="M30 14l-20 14 8 14 10-6v42h44V36l10 6 8-14-20-14q-6 10-20 10t-20-10z"/>',
  camisa:'<path d="M30 14l-20 14 8 14 10-6v42h44V36l10 6 8-14-20-14-20 14z"/><path d="M50 28v58"/>',
  calca:'<path d="M28 12h44l6 78H55l-5-46-5 46H22z"/>',
  saia:'<path d="M34 14h32l18 72H16z"/><path d="M34 14q16 8 32 0"/>',
  jaqueta:'<path d="M30 12L8 30l8 16 10-6v46h48V40l10 6 8-16-22-18-14 12-14 14z"/><path d="M50 26v60"/>'
};

const produtos = [
  {n:'Vestido Dourado Noite',c:'feminino',p:189.9,i:'vestido'},
  {n:'Blusa Seda Preta',c:'feminino',p:119.9,i:'blusa'},
  {n:'Saia Midi Plissada',c:'feminino',p:139.9,i:'saia'},
  {n:'Calça Alfaiataria Feminina',c:'feminino',p:169.9,i:'calca'},
  {n:'Camisa Social Preta',c:'masculino',p:149.9,i:'camisa'},
  {n:'Jaqueta Couro Black',c:'masculino',p:289.9,i:'jaqueta'},
  {n:'Calça Slim Grafite',c:'masculino',p:159.9,i:'calca'},
  {n:'Camisa Linho Areia',c:'masculino',p:129.9,i:'camisa'}
];

const moeda = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const grade = document.getElementById('grade');
const qtd = document.getElementById('qtd');
const aviso = document.getElementById('aviso');
let sacola = [];

function mostrar(cat){
  grade.innerHTML = produtos
    .map((p,idx)=>({...p,idx}))
    .filter(p => cat==='todos' || p.c===cat)
    .map(p => `
      <article class="card">
        <div class="foto"><svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" stroke-width="2" stroke-linejoin="round">${icones[p.i]}</svg></div>
        <div class="info">
          <small>${p.c==='feminino'?'Feminino':'Masculino'}</small>
          <h3>${p.n}</h3>
          <span class="preco">${moeda(p.p)}</span>
          <button class="btn" data-add="${p.idx}">Adicionar à sacola</button>
        </div>
      </article>`).join('');
}

function toast(t){
  aviso.textContent = t;
  aviso.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>aviso.classList.remove('show'),2200);
}

document.getElementById('filtros').addEventListener('click',e=>{
  const b = e.target.closest('button'); if(!b) return;
  document.querySelectorAll('#filtros button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  mostrar(b.dataset.cat);
});

grade.addEventListener('click',e=>{
  const b = e.target.closest('[data-add]'); if(!b) return;
  const p = produtos[b.dataset.add];
  sacola.push(p);
  qtd.textContent = sacola.length;
  toast(p.n + ' adicionado à sacola');
});

document.getElementById('btnCarrinho').addEventListener('click',()=>{
  if(!sacola.length) return toast('Sua sacola está vazia');
  const total = sacola.reduce((s,p)=>s+p.p,0);
  toast(sacola.length + ' peça(s) · Total ' + moeda(total));
});

document.getElementById('form').addEventListener('submit',e=>{
  e.preventDefault();
  toast('Mensagem enviada! Obrigada, ' + document.getElementById('nome').value + '.');
  e.target.reset();
});

mostrar('todos');