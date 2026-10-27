import {startArt,CHARACTERS,portrait} from './art.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const API_ORIGIN=(document.querySelector('meta[name="arena-api-origin"]')?.content||'').replace(/\/$/,'');
const apiUrl=path=>API_ORIGIN+path;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=v=>typeof v==='string'?v:v?.t||'';
const plural=(n,one,few,many)=>n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;
const translated=v=>typeof v==='string'?v:v?.ru||v?.t||'';
let exams=[],total=0,selected=new Set(['egemath','egerus']),lessons=new Set(),taskIds=new Set(),difficulties=new Set([1,2,3]);
let session=null,state=null,events=null,clockOffset=0,toastTimer,lastRevision=-1,soundOn=false,audio;
let drafts=null,character='ray',previewTimer;
const art=startArt($('#arena-canvas'));
function characterUI(){
  $('#selected-character-name').textContent=CHARACTERS[character].name;
  $('#selected-character-name').style.color=CHARACTERS[character].color;
  portrait($('#selected-portrait'),character);
  if(!session){art.select(character);$('#p1-character').textContent=`${CHARACTERS[character].name} / ${CHARACTERS[character].title}`;}
  $('#character-grid').innerHTML=Object.entries(CHARACTERS).map(([id,c])=>`<article class="character-card ${id===character?'selected':''}" data-character="${id}" style="--fighter-color:${c.color}">${id===character?'<span class="selected-badge">ВЫБРАН ✓</span>':''}<canvas id="portrait-${id}" width="180" height="250" aria-label="${c.name}"></canvas><h3>${c.name}</h3><span class="fighter-tag">${c.title}</span><p>${c.description}</p><button data-pick="${id}">${id===character?'ВЫБРАН ✓':'ВЫБРАТЬ →'}</button><div class="move-previews"><button class="preview-move" data-preview="${id}">Атака ↗</button><button class="preview-move fatal-preview" data-final="${id}">Фаталити ✦</button></div></article>`).join('');
  for(const id of Object.keys(CHARACTERS))portrait($(`#portrait-${id}`),id);
  $$('[data-pick]').forEach(b=>b.onclick=()=>{clearTimeout(previewTimer);character=b.dataset.pick;characterUI();updateConfig();$('#characters-dialog').close();});
  $$('[data-preview]').forEach(b=>b.onclick=()=>{clearTimeout(previewTimer);const id=b.dataset.preview;$('#characters-dialog').close();art.preview(id);toast(`${CHARACTERS[id].name}: ${CHARACTERS[id].move}`);previewTimer=setTimeout(()=>{if(!session)art.select(character);},1700);});
  $$('[data-final]').forEach(b=>b.onclick=()=>{clearTimeout(previewTimer);const id=b.dataset.final,c=CHARACTERS[id];$('#characters-dialog').close();art.preview(id,true);$('#stage-message').innerHTML=`<small>ФИНАЛЬНЫЙ ПРИЁМ / ${c.name}</small><strong style="color:${c.color}">${c.fatality.toUpperCase()}</strong>`;toast(`${c.name}: ${c.fatality}`);previewTimer=setTimeout(()=>{if(!session){art.select(character);$('#stage-message').innerHTML='<small>ВЫБЕРИ БОЙЦА. БРОСЬ ВЫЗОВ.</small><strong>READY?<em> FIGHT.</em></strong>';}},3900);});
}
$('#choose-character').onclick=()=>{if(session)return;characterUI();$('#characters-dialog').showModal();};
$('#close-characters').onclick=()=>$('#characters-dialog').close();
$('#close-settings').onclick=$('#apply-settings').onclick=()=>$('#settings-drawer').open=false;
$('#cinema-mode').onclick=()=>{document.body.classList.toggle('cinema');$('#cinema-mode').title=document.body.classList.contains('cinema')?'Выйти из режима арены':'Развернуть арену';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('cinema');$('#settings-drawer').open=false;}});
document.addEventListener('click',e=>{const path=e.composedPath();if(!path.includes($('#settings-drawer'))&&!path.includes($('#topics-dialog')))$('#settings-drawer').open=false;});
$('#battle-start').onclick=()=>{const mode=$('#play-mode').value;start(mode==='queue'?'queue':'create',mode==='practice');};
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className=`toast${error?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),5500);}
async function api(route,data){const res=await fetch(apiUrl(`/api/${route}`),{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify({...data,...(data?.code?{}:session?{code:session.code}:{})})});const result=await res.json();if(!res.ok)throw new Error(result.error||'Ошибка запроса');return result;}
function beep(win=true){if(!soundOn)return;try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(win?440:150,audio.currentTime);o.frequency.exponentialRampToValueAtTime(win?880:75,audio.currentTime+.15);g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.23);}catch{}}
function showView(view){$$('[id$="-view"]').forEach(el=>el.classList.toggle('hidden',el.id!==`${view}-view`));$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#crumb').textContent=({arena:'АРЕНА',materials:'МАТЕРИАЛЫ',rules:'КАК ИГРАТЬ'})[view];window.scrollTo({top:0,behavior:'smooth'});}
$$('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));$('#browse-materials').onclick=()=>showView('materials');
$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound').classList.toggle('enabled',soundOn);$('#sound').title=soundOn?'Выключить звуковые эффекты':'Включить звуковые эффекты';$('#sound').setAttribute('aria-label',$('#sound').title);if(soundOn)beep();};
function currentConfig(){return{exams:[...selected],lessons:[...lessons],taskIds:[...taskIds],difficulties:[...difficulties],seconds:Number($('#seconds').value),rounds:Number($('#rounds').value),health:Number($('#health').value)};}
const shortNames={egemath:['ЕГЭ','Математика'],egephys:['ЕГЭ','Физика'],egerus:['ЕГЭ','Русский'],vosmath:['ВсОШ','Математика'],voseng:['ВсОШ','Английский'],voslit:['ВсОШ','Литература'],ielts:['IELTS','English'],delf:['DELF','Français'],sat:['SAT','Math']};
function renderExams(){
  $('#exam-grid').innerHTML=exams.map(e=>`<button class="exam-button ${selected.has(e.id)?'selected':''}" data-exam="${e.id}" aria-pressed="${selected.has(e.id)}"><strong>${shortNames[e.id][0]}</strong><small>${shortNames[e.id][1]}</small></button>`).join('');
  $$('[data-exam]').forEach(b=>b.onclick=()=>{const id=b.dataset.exam;if(selected.has(id)){if(selected.size===1){toast('Оставьте хотя бы один экзамен.');return;}selected.delete(id);}else selected.add(id);const allowed=new Set(exams.filter(e=>selected.has(e.id)).flatMap(e=>e.lessons.map(l=>l.id)));lessons=new Set([...lessons].filter(id=>allowed.has(id)));taskIds=new Set([...taskIds].filter(id=>selected.has(id.split(':')[0])));renderExams();updateConfig();});
  $('#selected-count').textContent=`${selected.size} ВЫБРАНО`;
}
let countGeneration=0;
async function updateConfig(){
  $('#topic-summary').textContent=taskIds.size?`${taskIds.size} задач ↗`:lessons.size?`${lessons.size} тем ↗`:'Все темы ↗';
  $$('[data-diff]').forEach(b=>{b.classList.toggle('selected',difficulties.has(Number(b.dataset.diff)));b.setAttribute('aria-pressed',String(difficulties.has(Number(b.dataset.diff))));});
  $('#mix-summary').textContent=`${[...selected].map(id=>exams.find(e=>e.id===id)?.name).join(' + ')} · ${$('#rounds').value} раундов · ${$('#seconds').value} сек`;
  try{localStorage.setItem('examprep:arena-config',JSON.stringify({...currentConfig(),name:$('#nickname').value,character}));}catch{}
  const generation=++countGeneration;
  try{const result=await api('pool',{config:currentConfig()});if(generation!==countGeneration)return;$('#pool-count').textContent=`${result.count.toLocaleString('ru-RU')} ${plural(result.count,'задача','задачи','задач')} в твоём миксе`;}catch(error){if(generation===countGeneration)$('#pool-count').textContent=error.message;}
}
$$('[data-diff]').forEach(b=>b.onclick=()=>{const d=Number(b.dataset.diff);if(difficulties.has(d)){if(difficulties.size===1){toast('Оставьте хотя бы один уровень сложности.');return;}difficulties.delete(d);}else difficulties.add(d);updateConfig();});
$$('#seconds,#rounds,#health').forEach(e=>e.onchange=updateConfig);
$('#nickname').oninput=()=>{const name=$('#nickname').value.trim()||'Challenger';$('#profile-name').textContent=name;if(!session)$('#p1-name').textContent=name.toUpperCase();updateConfig();};
function topicRows(){
  const search=$('#topic-search').value.toLowerCase();
  $('#topic-list').innerHTML=exams.filter(e=>selected.has(e.id)).map(e=>{
    const visible=e.lessons.filter(l=>`${txt(l.title)} ${e.name}`.toLowerCase().includes(search));if(!visible.length)return '';
    return `<h3>${esc(e.name)}</h3>${visible.map(l=>`<div class="topic-row"><div class="topic-line"><label><input type="checkbox" data-lesson="${esc(l.id)}" ${drafts.lessons.has(l.id)?'checked':''}><span>${esc(l.title)}</span></label><small>${l.count} ЗАДАЧ</small><button class="task-button" data-load="${esc(l.id)}">Выбрать задачи</button></div><div class="task-list hidden" id="tasks-${esc(l.id)}"></div></div>`).join('')}`;
  }).join('')||'<p>Темы не найдены.</p>';
  $$('[data-lesson]').forEach(c=>c.onchange=()=>{if(c.checked)drafts.lessons.add(c.dataset.lesson);else{drafts.lessons.delete(c.dataset.lesson);drafts.taskIds=new Set([...drafts.taskIds].filter(id=>id.split(':')[1]!==c.dataset.lesson));$$(`#tasks-${CSS.escape(c.dataset.lesson)} input`).forEach(i=>i.checked=false);}});
  $$('[data-load]').forEach(b=>b.onclick=async()=>{
    const list=$(`#tasks-${CSS.escape(b.dataset.load)}`);if(!list.classList.contains('hidden')){list.classList.add('hidden');return;}
    list.classList.remove('hidden');list.textContent='Загружаем задания…';
    try{const r=await fetch(apiUrl(`/api/tasks?lesson=${encodeURIComponent(b.dataset.load)}`));const data=await r.json();list.innerHTML=data.map((t,i)=>`<label><input type="checkbox" data-task="${esc(t.id)}" ${drafts.taskIds.has(t.id)?'checked':''}><span><b>${i+1}.</b> ${esc(t.q)} <small>· Уровень ${t.diff}</small></span></label>`).join('');
      list.querySelectorAll('[data-task]').forEach(c=>c.onchange=()=>{if(c.checked){drafts.taskIds.add(c.dataset.task);drafts.lessons.add(b.dataset.load);$(`[data-lesson="${CSS.escape(b.dataset.load)}"]`).checked=true;}else drafts.taskIds.delete(c.dataset.task);});
    }catch{list.textContent='Не удалось загрузить задания. Попробуйте ещё раз.';}
  });
}
$('#open-topics').onclick=()=>{drafts={lessons:new Set(lessons),taskIds:new Set(taskIds)};$('#topic-search').value='';topicRows();$('#topics-dialog').showModal();};
$('#topic-search').oninput=topicRows;$('#close-topics').onclick=()=>$('#topics-dialog').close();
$('#reset-topics').onclick=()=>{drafts={lessons:new Set(),taskIds:new Set()};topicRows();};
$('#save-topics').onclick=()=>{lessons=drafts.lessons;taskIds=drafts.taskIds;$('#topics-dialog').close();updateConfig();};
async function start(route,practice=false){if(session)return;const buttons=[...$$('#config-card button'),$('#battle-start')];buttons.forEach(b=>b.disabled=true);try{const r=await api(route,{name:$('#nickname').value,character,config:currentConfig(),practice});connect(r);}catch(e){toast(e.message,true);}finally{buttons.forEach(b=>b.disabled=!!session&&b.id==='battle-start');}}
$('#create-room').onclick=()=>start('create');$('#quick-match').onclick=()=>start('queue');$('#practice').onclick=()=>start('create',true);
$('#join-form').onsubmit=async e=>{e.preventDefault();if(session)return;const code=$('#room-code').value.trim().toUpperCase();if(code.length!==6){toast('Код комнаты состоит из 6 символов.',true);return;}try{connect(await api('join',{code,name:$('#nickname').value,character}));}catch(error){toast(error.message,true);}};
function connect(r){session={code:r.code,token:r.token};try{sessionStorage.setItem('examprep:arena-session',JSON.stringify(session));}catch{}lastRevision=-1;applyState(r.state);events?.close();let lastEventAt=Date.now();events=new EventSource(apiUrl(`/api/events?code=${r.code}&token=${r.token}`));events.onmessage=e=>{lastEventAt=Date.now();applyState(JSON.parse(e.data));};events.onerror=()=>{if(Date.now()-lastEventAt<12000)return;$('.live-indicator').innerHTML='<i style="background:#f3a272"></i> ВОССТАНОВЛЕНИЕ СВЯЗИ';};events.onopen=()=>{$('.live-indicator').innerHTML='<i></i> СЕРВЕР ПОДКЛЮЧЁН';};$('#config-card').classList.add('locked');$('#below-stage').classList.add('hidden');$('#collection-card').classList.add('hidden');showView('arena');}
function reset(){events?.close();events=null;session=null;state=null;lastRevision=-1;try{sessionStorage.removeItem('examprep:arena-session');}catch{}$('#config-card').classList.remove('locked');$('#below-stage').classList.remove('hidden');$('#collection-card').classList.remove('hidden');$('#match-panel').classList.add('hidden');$('#p1-name').textContent=$('#nickname').value||'CHALLENGER';$('#p2-name').textContent='ТВОЙ СОПЕРНИК';for(const n of[1,2]){$(`#p${n}-bar`).style.width='100%';$(`#p${n}-hp`).textContent='100 HP';}$('#round-clock').textContent='VS';$('#stage-mode').textContent='NEON DOJO';$('#round-tag').textContent='ДО ТВОЕЙ ПЕРВОЙ ПОБЕДЫ — ОДНА ЗАДАЧА';$('#stage-message').className='stage-message';$('#stage-message').innerHTML='<small>ВЫБЕРИ БОЙЦА. БРОСЬ ВЫЗОВ.</small><strong>READY?<em> FIGHT.</em></strong>';$('#damage-tag').textContent='РЕШАЙ → НАНОСИ УДАР';art.select(character);lockUI(false);$('#p1-character').textContent=CHARACTERS[character].name+' / '+CHARACTERS[character].title;history.replaceState(null,'',location.pathname);}
function applyState(next){clockOffset=next.serverNow-Date.now();if(next.revision===lastRevision)return;
  const prev=state;state=next;lastRevision=next.revision;lockUI(true);const drawer=$('#task-drawer');drawer.classList.remove('hidden');if(!prev||prev.round!==next.round||next.phase==='finished')drawer.open=true;$('#task-drawer-title').textContent=next.phase==='waiting'?'ЛОББИ / '+next.code:next.phase==='round'?'ЗАДАНИЕ / РАУНД '+next.round:next.phase==='reveal'?'ОТВЕТ И РАЗБОР':'РЕЗУЛЬТАТ ДУЭЛИ';
  next.players.forEach((p,i)=>{const fighter=CHARACTERS[p.character]||CHARACTERS.ray;$('[id=p'+(i+1)+'-character]').textContent=fighter.name+' / '+fighter.title;$(`#p${i+1}-name`).textContent=`${p.name}${i===next.you?' · ТЫ':''}`;$(`#p${i+1}-hp`).textContent=`${p.health} HP`;$(`#p${i+1}-bar`).style.width=`${p.health/next.config.health*100}%`;});
  if(next.players.length===1){$('#p2-name').textContent='ЖДЁМ СОПЕРНИКА';$('#p2-hp').textContent=`${next.config.health} HP`;}
  $('#stage-mode').textContent=next.practice?'PRACTICE / CPU':`ROOM / ${next.code}`;$('#round-tag').textContent=next.phase==='waiting'?'КОМНАТА ГОТОВА':`РАУНД ${next.round} / ${next.rounds}`;$('#damage-tag').textContent=`УРОН ${20*next.multiplier}–${60*next.multiplier} HP / ×${next.multiplier}`;
  const message=$('#stage-message');message.className=`stage-message${next.phase!=='waiting'?' in-play':''}`;
  if(next.phase==='waiting')message.innerHTML='<small>АРЕНА ГОТОВА</small><strong><em>CHALLENGER WANTED</em></strong>';
  if(next.phase==='round')message.innerHTML=next.firstCorrect>=0?`<small>+4 HP ЗА СЕКУНДУ РАЗНИЦЫ / ДО 10 СЕК</small><strong><em>${next.firstCorrect===next.you?'ТЫ ПЕРВЫЙ!':'УСПЕЙ ОТВЕТИТЬ'}</em></strong>`:`<small>РАУНД ${next.round}</small><strong><em>SOLVE & STRIKE</em></strong>`;
  if(next.phase==='reveal'){const yours=next.result.winner===next.you;message.innerHTML=`<small>${next.result.winner<0?'БЕЗ УРОНА':`−${next.result.damage} HP`}</small><strong><em>${next.result.winner<0?'TIME TO LEARN':yours?'NICE HIT!':'COUNTER NEXT!'}</em></strong>`;if(prev?.phase!=='reveal')beep(yours);}
  if(next.phase==='finished'){
    const finalMessage=`<small>ДУЭЛЬ ЗАВЕРШЕНА</small><strong><em>${next.winner<0?'DRAW':next.winner===next.you?'VICTORY!':'NEXT TIME!'}</em></strong>`;
    if(next.winner>=0&&!next.forfeit&&prev?.phase!=='finished'){
      const c=CHARACTERS[next.players[next.winner].character]||CHARACTERS.ray;
      message.innerHTML=`<small>ФИНАЛЬНЫЙ ПРИЁМ / ${c.name}</small><strong style="color:${c.color}">${c.fatality.toUpperCase()}</strong>`;
      setTimeout(()=>{if(state?.phase==='finished'&&state.code===next.code)message.innerHTML=finalMessage;},3800);
    }else message.innerHTML=finalMessage;
  }
  if(next.phase==='closed')message.innerHTML='<strong><em>ROOM CLOSED</em></strong>';
  art.update(next);renderMatch();updateClock();
}
function configDescription(){return `${state.config.exams.map(id=>exams.find(e=>e.id===id)?.name||id).join(' + ')} · ${state.rounds} ${plural(state.rounds,'раунд','раунда','раундов')} · ${state.config.seconds} сек · ${state.config.health} HP`;}
function renderMatch(){
  const panel=$('#match-panel');panel.classList.remove('hidden');
  if(state.phase==='waiting'){
    panel.innerHTML=`<div class="eyebrow">${state.practice?'ТРЕНИРОВКА С БОТОМ':'ЖИВАЯ ДУЭЛЬ / 1 VS 1'}</div><h2>${state.players.length===2?'Соперник на месте. Готов?':'Пригласи своего соперника'}</h2><p>${state.practice?'CPU отвечает с задержкой и может ошибаться. Это тренировочный бот.':state.players.length===2?esc(state.players.find((p,i)=>i!==state.you)?.name)+' подключился. Оба игрока должны подтвердить готовность.':'Отправь другу ссылку или код. Для начала оба игрока нажимают «Готов».'}</p><div class="room-code-display">${state.code}</div><div class="room-actions"><button id="copy-invite" class="secondary">КОПИРОВАТЬ ССЫЛКУ ↗</button><button id="ready" class="primary" ${state.players[state.you].ready?'disabled':''}>${state.players[state.you].ready?'ТЫ ГОТОВ ✓':'Я ГОТОВ →'}</button></div><div class="room-meta">${esc(configDescription())}<br>${state.players.map(p=>`${esc(p.name)} ${p.ready?'✓ ГОТОВ':'○ ОЖИДАЕТ'}`).join(' / ')}</div><button class="subtle-button" id="leave">Выйти из комнаты</button>`;
    $('#copy-invite').onclick=async()=>{let base=location.origin+location.pathname.replace(/[^/]*$/,'');const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';if(local){try{const r=await fetch(apiUrl('/api/network'));const d=await r.json();if(d.urls?.length)base=d.urls[0].replace(/\/$/,'')+'/';}catch{}}const link=`${base}?room=${state.code}`;try{await navigator.clipboard.writeText(link);toast(local?'Ссылка скопирована. Друг должен быть в той же Wi-Fi сети.':'Ссылка скопирована. Отправь её другу.');}catch{toast(`Ссылка: ${link}`);}};
    $('#ready').onclick=async()=>{try{applyState(await api('ready',{}));}catch(e){toast(e.message,true);}};
  }else if(state.phase==='round'){
    const q=state.task;
    const pressure=state.firstCorrect>=0&&state.firstCorrect!==state.you&&!state.submitted?'<div class="speed-pressure">Соперник уже ответил верно. Успей ответить: каждая секунда задержки добавляет урон.</div>':'';
    const head=pressure+`<div class="question-meta"><span>${esc(exams.find(e=>e.id===q.exam)?.name)} / ${esc(q.lessonTitle)}</span><span>УРОВЕНЬ ${q.diff} · РАУНД ${state.round}</span></div>${q.prompt?`<div class="prompt-text">${esc(txt(q.prompt))}</div>`:''}${q.passage?`<div class="passage">${esc(txt(q.passage))}</div>`:''}<div class="question-text">${esc(txt(q.q))}</div>${q.graph?graph(q.graph):''}`;
    if(state.submitted){panel.innerHTML=head+`<div class="answer-wait">${state.yourCorrect?'✓ Ты ответил первым! Ждём соперника до 10 секунд. Чем больше разница времени, тем сильнее твой удар.':'Попытка использована. Ждём ответ соперника или окончание времени.'}</div><button id="leave" class="subtle-button">Сдаться и выйти</button>`;}
    else{
      let fields='';
      if(q.type==='input')fields=`<input type="text" id="typed-answer" placeholder="Твой ответ…" aria-label="Твой ответ" maxlength="1000" autocomplete="off" required>${q.maxWords?`<p>Не более ${q.maxWords} слов.</p>`:''}`;
      if(q.type==='mcq'||q.type==='multi')fields=`<div class="answer-options">${q.options.map((o,i)=>`<label class="answer-option"><input type="${q.type==='mcq'?'radio':'checkbox'}" name="option" value="${i}" ${q.type==='mcq'?'required':''}><span>${esc(txt(o))}</span></label>`).join('')}</div>`;
      if(q.type==='match')fields=q.rows.map((r,i)=>`<label class="match-row">${esc(r)}<select name="match${i}" required><option value="">Выбери соответствие</option>${q.options.map((o,j)=>`<option value="${j}">${esc(txt(o))}</option>`).join('')}</select></label>`).join('');
      panel.innerHTML=head+`<form class="answer-form" id="answer-form">${fields}<button class="primary" type="submit">НАНЕСТИ УДАР <span>↗</span></button></form><button id="leave" class="subtle-button">Сдаться и выйти</button>`;
      $('#answer-form').onsubmit=async e=>{e.preventDefault();let answer;if(q.type==='input')answer=$('#typed-answer').value;else if(q.type==='mcq')answer=Number($('input[name=option]:checked').value);else if(q.type==='multi'){answer=$$('input[name=option]:checked').map(c=>Number(c.value));if(!answer.length){toast('Выберите хотя бы один вариант.');return;}}else answer=q.rows.map((_,i)=>Number($(`[name=match${i}]`).value));const button=$('#answer-form button');button.disabled=true;try{applyState(await api('answer',{round:state.round,answer}));}catch(err){toast(err.message,true);button.disabled=false;}};
    }
  }else if(state.phase==='reveal'){
    const r=state.result;
    const timing=r.winner<0?'':`<div class="timing-result"><b>${r.timing==='both-correct'?`Разница ответов: ${(r.gapMs/1000).toLocaleString('ru-RU',{maximumFractionDigits:2})} сек`:r.timing==='opponent-wrong'?'Соперник ошибся — максимальный бонус':'Соперник не успел — максимальный бонус'}</b><span>(20 + ${r.speedBonus} за скорость) × ${r.multiplier} = ${r.damage} HP</span></div>`;
    panel.innerHTML=`<div class="eyebrow">РАУНД ${state.round} ЗАВЕРШЁН</div><h2>${r.winner<0?r.reason==='timeout'?'Время вышло':'Оба ответа неверные':r.winner===state.you?'Точный удар!':'Соперник оказался быстрее'}</h2><p>${r.winner<0?'Урона нет. Разберись в решении перед новым раундом.':`${esc(state.players[r.winner].name)} наносит ${r.damage} урона.`}</p>${timing}<div class="field-label">ПРАВИЛЬНЫЙ ОТВЕТ</div><div class="reveal-answer">${esc(r.answer)}</div><div class="explanation">${esc(translated(r.explanation))}</div><div class="room-meta">${state.round>=state.rounds||state.players.some(p=>p.health<=0)?'ИТОГ МАТЧА':'СЛЕДУЮЩИЙ РАУНД'} ЧЕРЕЗ <span id="next-seconds">—</span> СЕК</div><button class="subtle-button" id="leave">Сдаться и выйти</button>`;
  }else if(state.phase==='finished'){
    panel.innerHTML=`<div class="eyebrow">${state.practice?'ТРЕНИРОВКА ЗАВЕРШЕНА':'РЕЗУЛЬТАТ ДУЭЛИ'}</div><h2>${state.winner<0?'Ничья. Достойный поединок.':state.winner===state.you?'Победа. Знания решают.':'Этот раунд за соперником.'}</h2><p>${state.forfeit?'Матч завершён из-за выхода или потери связи.':'Каждый разобранный ответ — вклад в следующую победу.'}</p><table class="summary-table"><thead><tr><th>ИГРОК</th><th>ВЕРНЫХ</th><th>HP</th></tr></thead><tbody>${state.players.map((p,i)=>`<tr><td>${esc(p.name)}${i===state.winner?' ★':''}</td><td>${p.score}</td><td>${p.health}</td></tr>`).join('')}</tbody></table><div class="room-meta">${esc(configDescription())}</div><button id="new-duel" class="primary">НОВАЯ ДУЭЛЬ →</button>`;$('#new-duel').onclick=reset;
  }else{panel.innerHTML='<h2>Комната закрыта</h2><p>Хозяин вышел из комнаты. Создайте новую дуэль.</p><button id="new-duel" class="primary">НА АРЕНУ →</button>';$('#new-duel').onclick=reset;}
  if($('#leave'))$('#leave').onclick=async()=>{try{await api('leave',{});}catch{}reset();};
}
function updateClock(){if(!state||!state.deadline){$('#round-clock').textContent='VS';return;}const n=Math.max(0,Math.ceil((state.deadline-(Date.now()+clockOffset))/1000));$('#round-clock').textContent=String(n).padStart(2,'0');$('#round-clock').classList.toggle('urgent',state.phase==='round'&&n<=10);if($('#next-seconds'))$('#next-seconds').textContent=n;}
setInterval(updateClock,200);
setInterval(async()=>{if(!session)return;try{applyState(await api('state',{}));}catch(error){toast(error.message,true);if(/не найдена|недействительна/.test(error.message))reset();}},5000);
function graph(g){
  const width=560,height=280,pad=30,[xmin,xmax]=g.x,[ymin,ymax]=g.y;
  const x=v=>pad+(v-xmin)/(xmax-xmin)*(width-2*pad),y=v=>height-pad-(v-ymin)/(ymax-ymin)*(height-2*pad);
  let grid='';for(let a=xmin,n=0;a<=xmax&&n<60;a+=g.x[2],n++)grid+=`<line x1="${x(a)}" y1="${pad}" x2="${x(a)}" y2="${height-pad}" stroke="#cad2bc"/><text x="${x(a)}" y="${height-12}" font-size="10" fill="#3a4d32" text-anchor="middle">${a.toFixed(2).replace(/\.00$/,'')}</text>`;
  for(let a=ymin,n=0;a<=ymax&&n<60;a+=g.y[2],n++)grid+=`<line x1="${pad}" y1="${y(a)}" x2="${width-pad}" y2="${y(a)}" stroke="#cad2bc"/><text x="20" y="${y(a)+3}" font-size="10" fill="#3a4d32" text-anchor="end">${a.toFixed(2).replace(/\.00$/,'')}</text>`;
  const lines=(data,dash=false)=>(data||[]).map(line=>`<polyline points="${line.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')}" fill="none" stroke="${dash?'#9b683d':'#1e6e51'}" stroke-width="2" ${dash?'stroke-dasharray="5 4"':''}/>`).join('');
  return `<svg class="graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="График к заданию">${grid}${lines(g.lines)}${lines(g.dash,true)}${(g.dots||[]).map(([a,b])=>`<circle cx="${x(a)}" cy="${y(b)}" r="3" fill="#bd4a35"/>`).join('')}<text x="${width-25}" y="${height-5}" font-size="11" fill="#293f25">${esc(g.xl||'x')}</text><text x="5" y="15" font-size="11" fill="#293f25">${esc(g.yl||'y')}</text></svg>`;
}
function renderMaterials(){$('#materials-list').innerHTML=exams.map(e=>`<section class="material-section"><h2>${esc(e.name)}</h2><div class="material-grid">${e.resources.map(r=>`<a class="material" target="_blank" rel="noopener noreferrer" href="${esc(r.url)}"><h3>${esc(r.name)} ↗</h3><p>${esc(translated(r.desc))}</p><small>${esc(new URL(r.url).hostname)}</small></a>`).join('')}</div></section>`).join('');}
async function init(){
  try{
    const response=await fetch(apiUrl('/api/catalogue'));if(!response.ok)throw new Error('Сервер недоступен.');const data=await response.json();exams=data.exams;total=data.total;$('#total-tasks').textContent=total.toLocaleString('ru-RU');
    try{const saved=JSON.parse(localStorage.getItem('examprep:arena-config'));if(saved){character=CHARACTERS[saved.character]?saved.character:'ray';selected=new Set(saved.exams.filter(id=>exams.some(e=>e.id===id)));if(!selected.size)selected=new Set(['egemath','egerus']);lessons=new Set(saved.lessons||[]);taskIds=new Set(saved.taskIds||[]);difficulties=new Set((saved.difficulties||[1,2,3]).filter(d=>[1,2,3].includes(d)));if(!difficulties.size)difficulties=new Set([1,2,3]);$('#nickname').value=saved.name||'Challenger';for(const id of['seconds','rounds','health'])if(saved[id])$(`#${id}`).value=saved[id];}}catch{}
    $('#profile-name').textContent=$('#nickname').value;$('#p1-name').textContent=$('#nickname').value.toUpperCase();renderExams();renderMaterials();characterUI();updateConfig();
    const invite=new URLSearchParams(location.search).get('room');if(invite){$('#room-code').value=invite.toUpperCase();$('#join-details').open=true;toast('Комната приглашения выбрана. Укажи ник и войди по коду.');}
    try{const saved=JSON.parse(sessionStorage.getItem('examprep:arena-session'));if(saved){session=saved;const current=await api('state',{});connect({...session,state:current});}}catch{session=null;sessionStorage.removeItem('examprep:arena-session');}
    if(location.hash==='#materials')showView('materials');if(location.hash==='#rules')showView('rules');
  }catch(error){toast(error.message,true);$('.live-indicator').innerHTML='<i style="background:#f3a272"></i> СЕРВЕР НЕДОСТУПЕН';}
}
function lockUI(active){$('#battle-start').disabled=active;$('#battle-start').innerHTML=active?'ДУЭЛЬ СОЗДАНА ✓':'НАЧАТЬ ДУЭЛЬ <span>↗</span>';$('#play-mode').disabled=active;$('#choose-character').disabled=active;$('#lobby-strip').classList.toggle('hidden',active);if(active){$('#settings-drawer').open=false;$('#join-details').open=false;}else{$('#task-drawer').classList.add('hidden');$('#task-drawer').open=true;}}
init();
