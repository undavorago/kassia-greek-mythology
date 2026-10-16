/* Only the sky and suspended laurels animate; scenery ignores mouse/scroll. */
(() => {
 const stage=document.querySelector('.theatre');
 if(!stage)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=true;
 function applyPreference(){
  document.documentElement.dataset.motion=reduced.matches?'off':'ambient';
  stage.classList.toggle('motion-paused',reduced.matches||!visible||document.hidden);
 }
 reduced.addEventListener('change',applyPreference);
 document.addEventListener('visibilitychange',applyPreference);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;applyPreference();},{threshold:0}).observe(stage);
 applyPreference();
})();
