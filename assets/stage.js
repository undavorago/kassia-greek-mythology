/* Ambient scenery and an independently interactive paper puppet. */
(() => {
 const stage=document.querySelector('.theatre');
 if(!stage)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const eros=stage.querySelector('.stage-eros');
 let visible=true;
 let pointerInside=false;
 let keyboardFocused=false;
 function stopPuppet(){eros?.classList.remove('is-animated');}
 function playPuppet(){
  if(!reduced.matches&&visible&&!document.hidden)eros?.classList.add('is-animated');
 }
 function applyPreference(){
  const paused=reduced.matches||!visible||document.hidden;
  document.documentElement.dataset.motion=reduced.matches?'off':'ambient';
  stage.classList.toggle('motion-paused',paused);
  if(paused)stopPuppet();
 }
 eros?.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  pointerInside=true;
  playPuppet();
 });
 eros?.addEventListener('pointerleave',()=>{pointerInside=false;});
 eros?.addEventListener('focus',()=>{
  keyboardFocused=eros.matches(':focus-visible');
  if(keyboardFocused)playPuppet();
 });
 eros?.addEventListener('blur',()=>{keyboardFocused=false;});
 eros?.addEventListener('click',playPuppet);
 eros?.addEventListener('animationiteration',event=>{
  // Stop at the resting pose, after the last swing, instead of snapping back.
  if(event.animationName==='eros-sway'&&!pointerInside&&!keyboardFocused)stopPuppet();
 });
 reduced.addEventListener('change',applyPreference);
 document.addEventListener('visibilitychange',applyPreference);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;applyPreference();},{threshold:0}).observe(stage);
 applyPreference();
})();
