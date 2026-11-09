const moeda = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const grade = document.getElementById('grade');
const qtd = document.getElementById('qtd');
const aviso = document.getElementById('aviso');

// A sacola fica salva no navegador, então não zera ao trocar de página
let sacola = [];
try { sacola = JSON.parse(localStorage.getItem('sacola')) || []; } catch(e) {}
qtd.textContent = sacola.length;

function mostrar(cat){
  grade.innerHTML = produtos
    .filter(p => cat==='todos' || p.c===cat)
    .map(p => {
      const imagem = p.foto
        ? `<img src="../img/${p.foto}" alt="${p.n}">`
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
  aviso.textContent = t;
  aviso.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(()=>aviso.classList.remove('show'),2200);
}

grade.addEventListener('click',e=>{
  const b = e.target.closest('[data-add]'); if(!b) return;
  const p = produtos.find(x => x.id == b.dataset.add);
  sacola.push(p);
  try { localStorage.setItem('sacola', JSON.stringify(sacola)); } catch(e) {}
  qtd.textContent = sacola.length;
  toast(p.n + ' adicionado à sacola');
});

document.getElementById('btnCarrinho').addEventListener('click',()=>{
  if(!sacola.length) return toast('Sua sacola está vazia');
  const total = sacola.reduce((s,p)=>s+p.p,0);
  toast(sacola.length + ' peça(s) · Total ' + moeda(total));
});

// Filtros (só existem na página inicial)
const filtros = document.getElementById('filtros');
if (filtros) {
  filtros.addEventListener('click',e=>{
    const b = e.target.closest('button'); if(!b) return;
    document.querySelectorAll('#filtros button').forEach(x=>x.setAttribute('aria-pressed',x===b));
    mostrar(b.dataset.cat);
  });
}

// Formulário (só existe na página inicial)
const form = document.getElementById('form');
if (form) {
  form.addEventListener('submit',e=>{
    e.preventDefault();
    toast('Mensagem enviada! Obrigada, ' + document.getElementById('nome').value + '.');
    e.target.reset();
  });
}

// Cada página diz qual categoria mostrar; sem indicação, mostra tudo
mostrar(grade.dataset.categoria || 'todos');