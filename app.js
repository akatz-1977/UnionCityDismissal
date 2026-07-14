
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('union-city-dismissal-v2') : null;

let state = JSON.parse(localStorage.getItem('uc-dismissal-v2') || '{"active":[],"history":[]}');
let listFilter = 'all';

const typeNames = {car:'Car Rider', walk:'Walk Up', office:'To Office'};

function save(broadcast=true){
  localStorage.setItem('uc-dismissal-v2', JSON.stringify(state));
  if(broadcast && channel) channel.postMessage(state);
}
if(channel){
  channel.onmessage = e => {
    state = e.data;
    localStorage.setItem('uc-dismissal-v2', JSON.stringify(state));
    render();
  };
}
window.addEventListener('storage', e => {
  if(e.key === 'uc-dismissal-v2' && e.newValue){
    state = JSON.parse(e.newValue);
    render();
  }
});

function nowLabel(){
  return new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
}
function makeId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function callNumber(){
  const input = $('#numberInput');
  const number = input.value.trim().replace(/\D/g,'');
  const type = $('#typeSelect').value;

  if(!number) return;

  if(state.active.some(x => x.number === number)){
    alert('That number is already active.');
    input.select();
    return;
  }

  const item = {id:makeId(), number, type, calledAt:nowLabel()};
  state.active.unshift(item);
  state.active = state.active.slice(0,10);

  input.value='';
  save();
  render();
  playTone(type);
  input.focus();
}

function doneNumber(id){
  const idx = state.active.findIndex(x => x.id === id);
  if(idx < 0) return;
  const [item] = state.active.splice(idx,1);
  state.history.unshift({...item, doneAt:nowLabel()});
  state.history = state.history.slice(0,25);
  save();
  render();
}

function recallNumber(id){
  const item = state.active.find(x => x.id === id);
  if(!item) return;
  item.calledAt = nowLabel();
  state.active = [item, ...state.active.filter(x => x.id !== id)];
  save();
  render();
  playTone(item.type);
}

function playTone(type){
  if(!$('#soundToggle')?.checked) return;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = type === 'car' ? 760 : type === 'walk' ? 900 : 620;
    gain.gain.setValueAtTime(.001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.2,ctx.currentTime+.02);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime+.4);
  }catch(e){}
}

function render(){
  $('#countBadge').textContent = `${state.active.length} active`;

  const list = $('#activeList');
  list.innerHTML = '';
  const visible = state.active.filter(x => listFilter === 'all' || x.type === listFilter);

  if(!visible.length){
    list.innerHTML = '<div class="empty">No active numbers in this view.</div>';
  } else {
    visible.forEach(item => {
      const row = document.createElement('div');
      row.className = `active-item ${item.type}`;
      row.innerHTML = `
        <div>
          <div class="active-number">${item.number}</div>
          <div class="meta">${typeNames[item.type]} • Called ${item.calledAt}</div>
        </div>
        <button class="recall-btn">Recall</button>
        <button class="done-btn">Done</button>`;
      row.querySelector('.recall-btn').onclick = () => recallNumber(item.id);
      row.querySelector('.done-btn').onclick = () => doneNumber(item.id);
      list.append(row);
    });
  }

  const hist = $('#historyList');
  hist.innerHTML = '';
  if(!state.history.length){
    hist.innerHTML = '<div class="empty">No completed numbers yet.</div>';
  } else {
    state.history.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'history-chip';
      chip.textContent = `${item.number} • ${typeNames[item.type]} • ${item.doneAt}`;
      hist.append(chip);
    });
  }

  const displayFilter = $('#displayFilter')?.value || 'all';
  const displayItems = state.active.filter(x => displayFilter === 'all' || x.type === displayFilter).slice(0,10);

  const board = $('#displayBoard');
  board.innerHTML = '';
  if(!displayItems.length){
    board.innerHTML = '<div class="display-empty">Waiting for dismissal numbers…</div>';
  } else {
    displayItems.forEach((item,i) => {
      const tile = document.createElement('div');
      tile.className = `display-number ${item.type}${i===0?' newest':''}`;
      tile.innerHTML = `<div>${item.number}</div><div class="display-label">${typeNames[item.type]}</div>`;
      board.append(tile);
    });
  }
}

$('#callBtn').onclick = callNumber;
$('#numberInput').addEventListener('keydown', e => { if(e.key === 'Enter') callNumber(); });

$('#undoBtn').onclick = () => {
  if(!state.active.length) return;
  state.active.shift();
  save();
  render();
};

$('#clearBtn').onclick = () => {
  if(!state.active.length) return;
  if(confirm('Clear every active dismissal number?')){
    state.active = [];
    save();
    render();
  }
};

$$('.filter').forEach(btn => {
  btn.onclick = () => {
    listFilter = btn.dataset.filter;
    $$('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  };
});

$('#modeBtn').onclick = () => {
  $('#callerView').hidden = true;
  $('#displayView').hidden = false;
  document.body.classList.add('display-mode');
  render();
};

$('#backBtn').onclick = () => {
  $('#displayView').hidden = true;
  $('#callerView').hidden = false;
  document.body.classList.remove('display-mode');
};

$('#fullscreenBtn').onclick = () => document.documentElement.requestFullscreen?.();
$('#displayFilter').onchange = render;

render();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js');
}
