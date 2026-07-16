'use strict';

const LS_REMOVED = 'fiszki.removed.v1';
const LS_FILTER  = 'fiszki.filter.v1';

const $ = (id) => document.getElementById(id);
const screens = { home: $('home'), study: $('study'), done: $('done') };

let DATA = { sections: [], cards: [] };
let removed = new Set(loadJSON(LS_REMOVED, []));
let filter  = new Set(loadJSON(LS_FILTER, null) || []);   // section ids selected
let deck = [];
let idx = 0;
let phase = 'q';

function loadJSON(k, fb){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } }
function saveJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function saveRemoved(){ saveJSON(LS_REMOVED, [...removed]); }
function saveFilter(){ saveJSON(LS_FILTER, [...filter]); }

function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function md(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="kw">$1</span>'); }
function stripLead(s){ return String(s).replace(/^[-•●▸➡✅❌\s]+/, ''); }

// Fisher–Yates (deterministic randomness not needed here)
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

async function boot(){
  try {
    const res = await fetch('data/cards.json', { cache: 'no-cache' });
    DATA = await res.json();
  } catch (e) {
    $('activeCount').textContent = '⚠';
    alert('Nie udało się wczytać fiszek. Sprawdź połączenie przy pierwszym uruchomieniu.');
    return;
  }
  if (filter.size === 0) DATA.sections.forEach(s => filter.add(s.id)); // default: all on
  renderChips();
  updateHome();
  wire();
  registerSW();
}

function sectionById(id){ return DATA.sections.find(s => s.id === id); }
function activeCards(){ return DATA.cards.filter(c => filter.has(c.s) && !removed.has(c.id)); }

function renderChips(){
  const wrap = $('chips');
  wrap.innerHTML = '';
  DATA.sections.forEach(s => {
    const total = DATA.cards.filter(c => c.s === s.id && !removed.has(c.id)).length;
    const b = document.createElement('button');
    b.className = 'chip';
    b.style.setProperty('--c', s.color);
    b.dataset.on = filter.has(s.id) ? '1' : '0';
    b.dataset.id = s.id;
    b.innerHTML = `<span class="dot"></span>${esc(s.name)} <span class="n">${total}</span>`;
    b.addEventListener('click', () => {
      if (filter.has(s.id)) filter.delete(s.id); else filter.add(s.id);
      b.dataset.on = filter.has(s.id) ? '1' : '0';
      saveFilter(); updateHome();
    });
    wrap.appendChild(b);
  });
}

function updateHome(){
  const n = activeCards().length;
  $('activeCount').textContent = n;
  $('startBtn').disabled = n === 0;
  $('startBtn').style.opacity = n === 0 ? .5 : 1;
  const rc = removed.size;
  $('removedCount').textContent = rc;
  $('restoreBtn').classList.toggle('hidden', rc === 0);
}

function show(name){
  for (const k in screens) screens[k].classList.toggle('hidden', k !== name);
}

function startDeck(reshuffle){
  deck = shuffle(activeCards().slice());
  idx = 0; phase = 'q';
  if (deck.length === 0){ updateHome(); return; }
  show('study');
  render();
}

function render(){
  const c = deck[idx];
  if (!c){ finish(); return; }
  const sec = sectionById(c.s) || { name:'', color:'#888' };
  document.documentElement.style.setProperty('--accent', sec.color);
  $('card').style.setProperty('--accent', sec.color);
  $('cardSec').textContent = sec.name;
  $('cardEmoji').textContent = c.emoji || '🧠';
  $('qText').innerHTML = md(c.q);

  // answer content (built now, shown on reveal)
  $('aEmoji').textContent = c.emoji || '🧠';
  $('aTitle').textContent = c.title || '';
  $('aPoints').innerHTML = (c.points || []).map(p => `<li>${md(stripLead(p))}</li>`).join('');
  $('aNote').innerHTML = c.note ? md(c.note) : '';

  setPhase('q');
  updateProgress();
}

function setPhase(p){
  phase = p;
  const q = p === 'q';
  $('qSide').classList.toggle('hidden', !q);
  $('aSide').classList.toggle('hidden', q);
  $('mainBtn').textContent = q ? 'Pokaż odpowiedź' : 'Następna →';
  if (!q) $('aSide').scrollTop = 0;
}

function updateProgress(){
  $('counter').textContent = `${Math.min(idx+1, deck.length)} / ${deck.length}`;
  const pct = deck.length ? (idx / deck.length) * 100 : 0;
  $('progressBar').style.width = pct + '%';
}

function advance(){
  if (phase === 'q'){ setPhase('a'); }
  else { idx++; if (idx >= deck.length) finish(); else render(); }
}

function removeForever(){
  const c = deck[idx];
  if (!c) return;
  removed.add(c.id); saveRemoved();
  deck.splice(idx, 1);
  if (idx >= deck.length) finish(); else render();
}

function finish(){
  $('progressBar').style.width = '100%';
  const done = deck.length; // cards remaining in this run that were viewed
  $('doneMsg').textContent = removed.size
    ? `Świetnie! Ukryte fiszki: ${removed.size}. Zostały tylko te, których jeszcze się uczysz.`
    : 'Świetnie! Przejrzałaś całą rundę. 🎓';
  show('done');
}

function openSheet(open){
  $('sheet').classList.toggle('hidden', !open);
  if (open) $('sheetInfo').textContent =
    `Aktywne: ${activeCards().length} • Ukryte: ${removed.size}`;
}

function wire(){
  $('startBtn').addEventListener('click', () => startDeck(false));
  $('toggleAll').addEventListener('click', () => {
    const allOn = filter.size === DATA.sections.length;
    filter.clear();
    if (!allOn) DATA.sections.forEach(s => filter.add(s.id));
    saveFilter(); renderChips(); updateHome();
  });
  $('restoreBtn').addEventListener('click', () => { removed.clear(); saveRemoved(); renderChips(); updateHome(); });

  $('card').addEventListener('click', advance);
  $('mainBtn').addEventListener('click', (e) => { e.stopPropagation(); advance(); });
  $('removeBtn').addEventListener('click', (e) => { e.stopPropagation(); removeForever(); });

  $('homeBtn').addEventListener('click', () => openSheet(true));
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) openSheet(false); });
  $('mContinue').addEventListener('click', () => openSheet(false));
  $('mHome').addEventListener('click', () => { openSheet(false); show('home'); renderChips(); updateHome(); });
  $('mReshuffle').addEventListener('click', () => { openSheet(false); startDeck(true); });
  $('mRestore').addEventListener('click', () => { removed.clear(); saveRemoved(); openSheet(false); startDeck(true); });

  $('againBtn').addEventListener('click', () => startDeck(true));
  $('doneHomeBtn').addEventListener('click', () => { show('home'); renderChips(); updateHome(); });

  document.addEventListener('keydown', (e) => {
    if (screens.study.classList.contains('hidden')) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight'){ e.preventDefault(); advance(); }
  });
}

function registerSW(){
  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }
}

boot();
