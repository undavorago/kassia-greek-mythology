const dialog=document.querySelector('#art-dialog');
let opener=null;
if(dialog&&typeof dialog.showModal==='function'){
  document.querySelectorAll('[data-art-open]').forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();opener=link;
    if(link.dataset.artTitle){
      dialog.querySelector('h2').textContent=link.dataset.artTitle;
      const img=dialog.querySelector('img');img.src=link.href;img.alt=link.dataset.artTitle;
      img.removeAttribute('width');img.removeAttribute('height');
    }
    dialog.showModal();
  }));
  dialog.querySelector('[data-art-close]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const b=dialog.getBoundingClientRect();
    if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
}

const homeworkNav=document.querySelector('.homework-navigation');
if(homeworkNav && typeof ResizeObserver==='function'){
  new ResizeObserver(()=>{
    document.body.style.setProperty('--homework-nav-offset',`${homeworkNav.getBoundingClientRect().height+20}px`);
  }).observe(homeworkNav);
}
