const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactHeight = matchMedia('(max-height: 500px)');
const experience = $('.experience');
const sticky = $('.experience-sticky');
const slides = $$('.story-slide');
const stageLinks = $$('.stage-nav a');
const stageIds = ['inicio', 'medir', 'conectar', 'detectar', 'interpretar', 'recomendar'];
let activeStage = -1;
let scrollPending = false;
let resizeTimer;

function headerHeight() { return $('.site-header').getBoundingClientRect().height; }
function stepSize() { return $('#medir').offsetTop; }
function stageY(index) {
  if (compactHeight.matches) return slides[index].getBoundingClientRect().top + scrollY - headerHeight() - 16;
  return experience.offsetTop - headerHeight() + index * stepSize();
}
function setStage(index) {
  if (activeStage === index) return;
  activeStage = index;
  sticky.dataset.stage = String(index);
  slides.forEach((slide, i) => {
    const active = index === i || compactHeight.matches;
    slide.classList.toggle('is-active', index === i);
    slide.inert = !active;
    slide.setAttribute('aria-hidden', String(!active));
  });
  stageLinks.forEach((a, i) => i === index ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current'));
  const visualNames = ['La luna conecta sueño, recuperación y hábitos', 'Ejemplo de duración y horarios de una noche', 'Sueño, luz, actividad y horarios conectados', 'Ejemplo de un patrón de horarios de sueño', 'Interpretación de un ejemplo, sin establecer causalidad', 'Un hábito para observar durante la semana'];
  $('.story-visual').setAttribute('aria-label', visualNames[index]);
  $$('.visual-layer').forEach(layer => {
    const map = {1:'layer-measure',3:'layer-pattern',4:'layer-interpret',5:'layer-recommend'};
    layer.setAttribute('aria-hidden', String(!layer.classList.contains(map[index])));
  });
  $('.next-stage').setAttribute('aria-label', index === 5 ? 'Ir al producto' : `Avanzar a ${stageLinks[index + 1].textContent.trim()}`);
}
function updateScroll() {
  const p = (scrollY - experience.offsetTop + headerHeight()) / Math.max(1,stepSize());
  setStage(Math.max(0, Math.min(5, Math.round(p))));
  scrollPending = false;
}
function goToStage(index, smooth = true) {
  window.scrollTo({ top: stageY(index), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
}
addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, {passive:true});
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    activeStage = -1;
    updateScroll();
    if (innerWidth > 650) closeMenu();
  },100);
});
compactHeight.addEventListener('change', () => {activeStage=-1;updateScroll();});
$('.next-stage').addEventListener('click', () => activeStage === 5 ? navigateHash('#producto') : navigateHash('#' + stageIds[activeStage + 1]));

function navigateHash(hash, push = true, smooth = true) {
  const id = hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  if (push && location.hash !== hash) history.pushState({},'',hash);
  closeMenu();
  if (stageIds.includes(id)) goToStage(stageIds.indexOf(id), smooth);
  else window.scrollTo({top: target.getBoundingClientRect().top + scrollY - headerHeight(), behavior:smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const hash = a.getAttribute('href');
  if (document.getElementById(hash.slice(1))) {e.preventDefault();navigateHash(hash);}
}));
addEventListener('popstate', () => navigateHash(location.hash || '#inicio',false));
addEventListener('hashchange', () => navigateHash(location.hash || '#inicio',false));
$('.stage-nav').addEventListener('keydown', e => {
  const n=stageLinks.indexOf(document.activeElement);
  if(n < 0) return;
  let dest;
  if(e.key==='ArrowRight') dest=Math.min(5,n+1);
  if(e.key==='ArrowLeft') dest=Math.max(0,n-1);
  if(e.key==='Home') dest=0;
  if(e.key==='End') dest=5;
  if(dest!==undefined){e.preventDefault();stageLinks[dest].focus();navigateHash('#'+stageIds[dest]);}
});
const menuButton=$('.menu-toggle');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir navegación');$('#mobile-menu').hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar navegación':'Abrir navegación');$('#mobile-menu').hidden=!open;});
addEventListener('keydown', e => {if(e.key==='Escape' && !$('#mobile-menu').hidden){closeMenu();menuButton.focus();}});
addEventListener('click',e=>{if(!$('#mobile-menu').hidden && !e.target.closest('.mobile-menu,.menu-toggle'))closeMenu();});

// One small deterministic procedural moon. It is painted once; movement uses CSS transforms.
function drawMoon() {
  const canvas=$('#moon');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const size=600;
  let seed=71;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const texture=document.createElement('canvas');texture.width=texture.height=size;
  const t=texture.getContext('2d');
  const img=t.createImageData(size,size);
  const noiseGrids=[7,17,37,91,213].map(n=>({n,data:Float32Array.from({length:(n+1)*(n+1)},()=>rand())}));
  const smooth=x=>x*x*(3-2*x);
  function noise(x,y,grid){const n=grid.n,xx=x*n,yy=y*n,ix=Math.floor(xx),iy=Math.floor(yy),fx=smooth(xx-ix),fy=smooth(yy-iy),stride=n+1;const a=grid.data[iy*stride+ix],b=grid.data[iy*stride+ix+1],c=grid.data[(iy+1)*stride+ix],d=grid.data[(iy+1)*stride+ix+1];return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;}
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(x-size/2)/(size/2),ny=(y-size/2)/(size/2),r=nx*nx+ny*ny;
    const at=(y*size+x)*4;
    if(r>1)continue;
    let v=0;const weights=[.46,.27,.14,.085,.045];
    for(let l=0;l<5;l++)v+=noise(x/size,y/size,noiseGrids[l])*weights[l];
    const maria=Math.max(0,(noise(x/size,y/size,noiseGrids[0])-.48))*120;
    const val=150+v*100-maria;
    img.data[at]=val*.85;img.data[at+1]=val*.91;img.data[at+2]=val;img.data[at+3]=255;
  }
  t.putImageData(img,0,0);
  t.save();t.beginPath();t.arc(size/2,size/2,size/2,0,Math.PI*2);t.clip();
  for(let i=0;i<380;i++){
    const x=rand()*size,y=rand()*size,r=1.2+Math.pow(rand(),3)*27;
    const grad=t.createRadialGradient(x-r*.24,y-r*.22,r*.03,x,y,r);
    grad.addColorStop(0,'rgba(15,24,49,.20)');grad.addColorStop(.54,'rgba(33,45,71,.16)');grad.addColorStop(.79,'rgba(181,198,225,.12)');grad.addColorStop(.91,'rgba(224,235,253,.26)');grad.addColorStop(1,'rgba(105,124,156,0)');
    t.fillStyle=grad;t.beginPath();t.ellipse(x,y,r,r*.87,rand()*Math.PI,0,Math.PI*2);t.fill();
    if(r>10){t.strokeStyle='rgba(229,239,255,.17)';t.lineWidth=.7;t.beginPath();t.arc(x,y,r*.83,Math.PI*.95,Math.PI*1.7);t.stroke();}
  }
  t.restore();
  ctx.drawImage(texture,0,0);
  const sphere=ctx.getImageData(0,0,size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=(x-size/2)/(size/2),ny=(y-size/2)/(size/2),r=nx*nx+ny*ny,at=(y*size+x)*4;
    if(r>=1){sphere.data[at+3]=0;continue;}
    const z=Math.sqrt(1-r);
    const direct=Math.max(0,-nx*.62-ny*.35+z*.56);
    const light=.1+.87*Math.pow(direct,.8);
    sphere.data[at]*=light*.9;sphere.data[at+1]*=light*.97;sphere.data[at+2]*=light;
    if(r>.985)sphere.data[at+3]=Math.max(0,(1-r)/.015)*255;
  }
  ctx.putImageData(sphere,0,0);canvas.closest('.moon-wrap').classList.add('moon-ready');
}
try{drawMoon();}catch{ /* CSS moon remains visible when Canvas is unavailable. */ }
const wave=$('.mini-wave');for(let i=0;i<48;i++){const el=document.createElement('i');el.style.setProperty('--height',(14+Math.abs(Math.sin(i*2.63)*Math.cos(i*.31))*85)+'%');wave.append(el);}
const visual=$('.story-visual');
visual.addEventListener('pointermove',e=>{if(reducedMotion.matches||e.pointerType!=='mouse'||activeStage!==0)return;const r=visual.getBoundingClientRect();$('.moon-wrap').style.transform=`translate(${(e.clientX-r.left-r.width/2)*.018}px,${(e.clientY-r.top-r.height/2)*.018}px) rotate(-12deg)`;});
visual.addEventListener('pointerleave',()=>{$('.moon-wrap').style.transform='';});

let product='sleep', period='day';
const completedHabits=new Set();
const habitNames=[['Mi momento para bajar el ritmo','Preparar una pausa al final del día.'],['Un horario que pueda sostener','Elegir una referencia para acostarme.'],['Observar cómo me siento','Registrar mi sensación al despertar.']];
const productTabs=$$('[data-product]');
const chartDay=`<svg viewBox="0 0 600 105" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo de continuidad durante una noche ficticia"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#829af4" stop-opacity=".25"/><stop offset="1" stop-color="#829af4" stop-opacity="0"/></linearGradient></defs><path d="M0 80 C20 80 22 32 45 32 S70 60 91 60 S117 17 140 17 S161 47 190 47 S224 65 250 65 S270 25 300 25 S330 51 351 51 S384 15 410 15 S430 40 449 40 S472 27 490 27 S520 67 549 67 S574 33 600 33 L600 105 L0 105Z" fill="url(#chart-fill)"/><path d="M0 80 C20 80 22 32 45 32 S70 60 91 60 S117 17 140 17 S161 47 190 47 S224 65 250 65 S270 25 300 25 S330 51 351 51 S384 15 410 15 S430 40 449 40 S472 27 490 27 S520 67 549 67 S574 33 600 33" fill="none" stroke="#a2b6ff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
const chartWeek=`<svg viewBox="0 0 600 105" preserveAspectRatio="none" role="img" aria-label="Duración de sueño de ejemplo: lunes 6 horas 42, martes 7 horas 5, miércoles 6 horas 55, jueves 7 horas 48, viernes 7 horas 32, sábado 8 horas 9 y domingo 7 horas 42"><g fill="#8298e4"><rect x="15" y="48" width="42" height="57" rx="3"/><rect x="102" y="35" width="42" height="70" rx="3"/><rect x="189" y="41" width="42" height="64" rx="3"/><rect x="276" y="12" width="42" height="93" rx="3"/><rect x="363" y="22" width="42" height="83" rx="3"/><rect x="450" y="3" width="42" height="102" rx="3"/><rect x="537" y="16" width="42" height="89" rx="3"/></g></svg>`;
function renderProduct() {
 const content=$('#dashboard-content');
 $('#product-panel').setAttribute('aria-labelledby','tab-'+product);
 productTabs.forEach(b=>{const selected=b.dataset.product===product;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 if(product==='sleep'){
  const week=period==='week';
  content.innerHTML=`<div class="dash-heading"><div><h3>${week?'Tu semana, en perspectiva.':'Así fue tu noche.'}</h3><p>${week?'Una semana ficticia · lun a dom':'Domingo · registro de ejemplo'}</p></div><div class="segmented" aria-label="Período del gráfico"><button data-period="day" aria-pressed="${!week}">Día</button><button data-period="week" aria-pressed="${week}">Semana</button></div></div><div class="metrics-row"><div class="metric"><span>${week?'PROMEDIO DE SUEÑO':'TIEMPO DE SUEÑO'}</span><strong>${week?'7<small>h</small> 25<small>m</small>':'7<small>h</small> 42<small>m</small>'}</strong><p class="metric-note">${week?'7 noches de ejemplo':'Una noche de ejemplo'}</p></div><div class="metric"><span>${week?'MÁS TEMPRANO':'AL ACOSTARTE'}</span><strong>${week?'22:45':'23:15'}</strong><p class="metric-note">${week?'Hora de acostarte':'Tu horario'}</p></div><div class="metric"><span>${week?'AL DESPERTAR':'CÓMO TE SENTÍS'}</span><strong>${week?'5 / 7':'Bien'}</strong><p class="metric-note">${week?'Días con energía':'Registro personal'}</p></div></div><div class="chart-block"><div class="chart-label"><span>${week?'Duración por noche':'Tu noche, en una mirada'}</span><span>${week?'Horas de sueño':'Visualización ilustrativa'}</span></div><div class="chart-area">${week?chartWeek:chartDay}</div><div class="chart-axis">${(week?['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']:['23:15','01:00','03:00','05:00','07:10']).map(s=>`<span>${s}</span>`).join('')}</div></div><p class="dash-note"><span class="tiny-dot"></span>${week?'La regularidad se entiende con el tiempo. Esta semana es un ejemplo ficticio.':'Una noche es el comienzo. El contexto aparece al observar más días.'}</p>`;
 } else if(product==='patterns'){
 content.innerHTML=`<div class="dash-heading"><div><h3>Tu ritmo deja pistas.</h3><p>Relaciones para explorar · semana de ejemplo</p></div></div><div class="pattern-grid"><div class="pattern-tile"><p>HORARIOS SIMILARES</p><strong>5 <small>de 7 noches</small></strong><small>Una referencia más estable</small><div class="mini-columns" aria-hidden="true">${[30,50,43,69,72,75,73].map(h=>`<i style="--h:${h}%"></i>`).join('')}</div></div><div class="pattern-tile"><p>AL DESPERTAR</p><strong>Con energía</strong><small>En 5 registros de ejemplo</small><div class="mini-columns" aria-hidden="true">${[28,44,39,69,62,85,77].map(h=>`<i style="--h:${h}%"></i>`).join('')}</div></div></div><div class="pattern-conclusion"><h4>Una coincidencia que invita a observar.</h4><p>En estos datos ficticios, la regularidad coincide con una mejor sensación al despertar. Eso no demuestra una relación de causa y efecto.</p></div>`;
 } else {
 content.innerHTML=`<div class="dash-heading"><div><h3>Un cambio a la vez.</h3><p>Probá marcar una intención para esta noche.</p></div></div><div class="habit-list">${habitNames.map(([name,sub],i)=>`<label class="habit-row"><input type="checkbox" data-habit="${i}" ${completedHabits.has(i)?'checked':''}><span>${name}<small>${sub}</small></span></label>`).join('')}</div><p class="habit-status" aria-live="polite">${completedHabits.size} de 3 intenciones elegidas</p><p class="dash-note"><span class="tiny-dot"></span>Tu selección es temporal y se borra al recargar esta demo.</p>`;
 }
 content.style.animation='none';requestAnimationFrame(()=>{content.style.animation='';});
}
productTabs.forEach(b=>b.addEventListener('click',()=>{product=b.dataset.product;renderProduct();}));
$('.product-tabs').addEventListener('keydown',e=>{let index=productTabs.indexOf(document.activeElement);if(index<0)return;let next;if(['ArrowDown','ArrowRight'].includes(e.key))next=(index+1)%3;if(['ArrowUp','ArrowLeft'].includes(e.key))next=(index+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();productTabs[next].focus();product=productTabs[next].dataset.product;renderProduct();}});
$('#dashboard-content').addEventListener('click',e=>{const button=e.target.closest('[data-period]');if(button){period=button.dataset.period;renderProduct();$(`[data-period="${period}"]`).focus({preventScroll:true});}});
$('#dashboard-content').addEventListener('change',e=>{const input=e.target.closest('[data-habit]');if(input){const i=Number(input.dataset.habit);input.checked?completedHabits.add(i):completedHabits.delete(i);$('.habit-status').textContent=`${completedHabits.size} de 3 intenciones elegidas`;}});
function syncTabOrientation(){ $('.product-tabs').setAttribute('aria-orientation',innerWidth<=850?'horizontal':'vertical'); }
addEventListener('resize',syncTabOrientation);syncTabOrientation();renderProduct();

const dialogs=$$('dialog');let lastFocus=null;
function openDialog(name){const dialog=document.getElementById(name+'-dialog');if(!dialog)return;closeMenu();lastFocus=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');$('.dialog-close',dialog).focus({preventScroll:true});}
$$('[data-dialog]').forEach(b=>b.addEventListener('click',()=>openDialog(b.dataset.dialog)));
dialogs.forEach(dialog=>{
 $('.dialog-close',dialog).addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});});
});
$('[data-switch-demo]').addEventListener('click',()=>{$('#about-dialog').close();queueMicrotask(()=>openDialog('demo'));});
$('#sleep-form').addEventListener('input',()=>{$('#form-error').textContent='';});
$('#sleep-form').addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(e.target);const bedtime=String(data.get('bedtime')),wake=String(data.get('wake'));const toMinutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};const minutes=(toMinutes(wake)-toMinutes(bedtime)+1440)%1440;
 if(minutes===0){$('#form-error').textContent='Los dos horarios son iguales. Revisalos para calcular el intervalo de tu registro.';return;}
 const hours=Math.floor(minutes/60),mins=minutes%60,feeling=String(data.get('feeling'));
 $('#demo-form-view').hidden=true;const result=$('#demo-result');result.hidden=false;
 result.innerHTML=`<h2 id="demo-result-title" tabindex="-1">Una primera pieza<br> de <span>tu descanso.</span></h2><div class="result-number">${hours}<small>h</small> ${String(mins).padStart(2,'0')}<small>m</small></div><p class="result-caption">Entre acostarte y levantarte.</p><div class="result-facts"><span><small>Tu horario</small>${bedtime} → ${wake}</span><span><small>Al despertar</small>${feeling}</span></div><p>Este intervalo no equivale a tiempo real de sueño: puede incluir el tiempo para dormirte y los despertares. Tu registro sirve como punto de partida para observar.</p><div class="result-actions"><button class="button button-primary" id="edit-record">Editar registro <span aria-hidden="true">↗</span></button><button class="inline-link" id="finish-demo">Listo <span aria-hidden="true">✓</span></button></div>`;
 $('#demo-dialog').setAttribute('aria-labelledby','demo-result-title');$('#demo-result-title').focus();
 $('#edit-record').addEventListener('click',()=>{result.hidden=true;$('#demo-form-view').hidden=false;$('#demo-dialog').setAttribute('aria-labelledby','demo-title');$('[name=bedtime]').focus();});
 $('#finish-demo').addEventListener('click',()=>$('#demo-dialog').close());
});
// Native details remains accessible even if scripting is unavailable.
$$('.process-list details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)$$('.process-list details').forEach(other=>{if(other!==detail)other.open=false;});}));
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -20px 0px'});
$$('.reveal').forEach(el=>revealObserver.observe(el));document.documentElement.classList.add('js-ready');
updateScroll();
if(location.hash){requestAnimationFrame(()=>navigateHash(location.hash,false,false));}
