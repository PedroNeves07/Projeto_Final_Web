const icones = {
  vestido:'<path d="M42 10h16l4 20-8 8 14 52H32l14-52-8-8z"/>',
  blusa:'<path d="M30 14l-20 14 8 14 10-6v42h44V36l10 6 8-14-20-14q-6 10-20 10t-20-10z"/>',
  camisa:'<path d="M30 14l-20 14 8 14 10-6v42h44V36l10 6 8-14-20-14-20 14z"/><path d="M50 28v58"/>',
  calca:'<path d="M28 12h44l6 78H55l-5-46-5 46H22z"/>',
  saia:'<path d="M34 14h32l18 72H16z"/><path d="M34 14q16 8 32 0"/>',
  jaqueta:'<path d="M30 12L8 30l8 16 10-6v46h48V40l10 6 8-16-22-18-14 12-14 14z"/><path d="M50 26v60"/>'
};

// id: número único | c: feminino ou masculino | foto: nome do arquivo na pasta img (opcional)
const produtos = [
  {id:1, n:'VestidoDourado Noite',      c:'feminino',  p:189.9, i:'vestido', foto:'vestido-dourado-noite.png'},
  {id:2, n:'Blusa Seda Preta',           c:'feminino',  p:119.9, i:'blusa',   foto:'blusa-seda-preta.png'},
  {id:3, n:'Saia Midi Plissada',         c:'feminino',  p:139.9, i:'saia',    foto:'saia-midi-plissada.png'},
  {id:4, n:'Calça Alfaiataria Feminina', c:'feminino',  p:169.9, i:'calca',   foto:''},
  {id:5, n:'Camisa Social Preta',        c:'masculino', p:149.9, i:'camisa',  foto:'camisa-social-preta.png'},
  {id:6, n:'Jaqueta Couro Black',        c:'masculino', p:289.9, i:'jaqueta', foto:'jaqueta-couro-black.png'},
  {id:7, n:'Calça Slim Grafite',         c:'masculino', p:159.9, i:'calca',   foto:'calca-slim-grafite.png'},
  {id:8, n:'Camisa Linho Areia',         c:'masculino', p:129.9, i:'camisa',  foto:'camisa-linho-areia.png'}
];