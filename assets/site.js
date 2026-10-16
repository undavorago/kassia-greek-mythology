const root = document.documentElement;
root.dataset.motion = 'off';
function header(active='') {
 const base=location.pathname.includes('/lectures/')?'../':'';
 return `<a class="skip" href="#content">к содержанию</a><header class="site-header">${document.body.classList.contains("home") ? "" : `<a class="brand" href="${base}index.html" aria-label="На главную">ΜΥΘΟΣ <span>кабинет Кассии</span></a>`}<button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">меню</button><nav id="site-nav" aria-label="Главная навигация"><span>занятия</span><span>правила</span></nav></header>`;
}
function footer(){return `<footer class="site-footer"><span>Кабинет мифологии Древней Греции<br>Хогвартс Дамблдора</span><span>Кассия Дэверо<br><a href="${location.pathname.includes('/lectures/')?'../':''}about.html#materials">Материалы и оформление</a></span></footer>`}
document.querySelectorAll('[data-header]').forEach(el=>el.innerHTML=header(el.dataset.header));
document.querySelectorAll('[data-footer]').forEach(el=>el.innerHTML=footer());
document.querySelector('.nav-toggle')?.addEventListener('click',e=>{const b=e.currentTarget,n=document.querySelector('#site-nav'); const open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));n.classList.toggle('open',open)});
document.querySelectorAll('.block-card').forEach((card,i)=>{
 const btn=card.querySelector('.expand'),panel=card.querySelector('.block-details');panel.id=`block-panel-${i}`;btn.setAttribute('aria-controls',panel.id);panel.hidden=!card.classList.contains('open');
 btn.addEventListener('click',()=>{const open=card.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'свернуть':'посмотреть занятия';panel.hidden=!open});
});
document.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{const dialog=document.querySelector('#lightbox');dialog.querySelector('img').src=button.querySelector('img').src;dialog.querySelector('img').alt=button.querySelector('img').alt;dialog.showModal()}));
document.querySelector('#lightbox .close')?.addEventListener('click',()=>document.querySelector('#lightbox').close());
document.querySelector('#lightbox')?.addEventListener('click',e=>{if(e.target===e.currentTarget){const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)e.currentTarget.close()}});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');observer.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else{root.classList.remove('js-motion')}
