import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=readFileSync(new URL('../assets/js/stage.js',import.meta.url),'utf8');
function boot(reduce=false){
 const listeners={},classes=new Set(),puppetClasses=new Set(),puppetListeners={};let observer;
 const media={matches:reduce,addEventListener(_,fn){this.change=fn}};
 const eros={classList:{add:n=>puppetClasses.add(n),remove:n=>puppetClasses.delete(n)},addEventListener:(n,fn)=>puppetListeners[n]=fn,matches:()=>true};
 const stage={querySelector:selector=>selector==='.stage-eros'?eros:null,classList:{toggle(name,on){on?classes.add(name):classes.delete(name)}},addEventListener:(name,fn)=>listeners[name]=fn};
 const document={hidden:false,documentElement:{dataset:{}},querySelector:()=>stage,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{document,window:{addEventListener:(name,fn)=>listeners[name]=fn},matchMedia:()=>media,IntersectionObserver:class{constructor(fn){observer=fn}observe(){}}});
 return {document,media,classes,listeners,eros,puppetClasses,puppetListeners,observe:on=>observer([{isIntersecting:on}])};
}
test('ambient effects respect reduced motion at load and after preference changes',()=>{
 const app=boot(true);
 assert.equal(app.document.documentElement.dataset.motion,'off');assert.ok(app.classes.has('motion-paused'));
 app.media.matches=false;app.media.change();assert.equal(app.document.documentElement.dataset.motion,'ambient');assert.ok(!app.classes.has('motion-paused'));
 app.media.matches=true;app.media.change();assert.ok(app.classes.has('motion-paused'));
});
test('the scene never subscribes to pointer movement or scroll',()=>{
 const app=boot();
 for(const event of ['pointermove','pointerenter','pointerleave','scroll','resize'])assert.equal(app.listeners[event],undefined);
});
test('ambient effects pause outside the viewport and in a hidden tab',()=>{
 const app=boot();app.observe(false);assert.ok(app.classes.has('motion-paused'));
 app.observe(true);assert.ok(!app.classes.has('motion-paused'));
 app.document.hidden=true;app.listeners.visibilitychange();assert.ok(app.classes.has('motion-paused'));
 app.document.hidden=false;app.listeners.visibilitychange();assert.ok(!app.classes.has('motion-paused'));
});
test('hover affects only Eros and finishes a full swing after the pointer leaves',()=>{
 const app=boot();app.puppetListeners.pointerenter({pointerType:'mouse'});
 assert.ok(app.puppetClasses.has('is-animated'));assert.ok(!app.classes.has('is-animated'));
 app.puppetListeners.animationiteration({animationName:'eros-sway'});assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.pointerleave();assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.animationiteration({animationName:'eros-aim'});assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.animationiteration({animationName:'eros-sway'});assert.ok(!app.puppetClasses.has('is-animated'));
});
test('a touch activates one cycle without leaving a sticky hover state',()=>{
 const app=boot();app.puppetListeners.pointerenter({pointerType:'touch'});assert.ok(!app.puppetClasses.has('is-animated'));
 app.puppetListeners.click();assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.animationiteration({animationName:'eros-sway'});assert.ok(!app.puppetClasses.has('is-animated'));
});
test('keyboard focus starts motion and blur lets the current swing finish',()=>{
 const app=boot();app.puppetListeners.focus();assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.animationiteration({animationName:'eros-sway'});assert.ok(app.puppetClasses.has('is-animated'));
 app.puppetListeners.blur();app.puppetListeners.animationiteration({animationName:'eros-sway'});assert.ok(!app.puppetClasses.has('is-animated'));
});
test('reduced motion prevents hover, click and focus animation',()=>{
 const app=boot(true);app.puppetListeners.pointerenter({pointerType:'mouse'});app.puppetListeners.click();app.puppetListeners.focus();assert.ok(!app.puppetClasses.has('is-animated'));
});
test('running puppet stops when motion is disabled or the stage leaves view',()=>{
 const app=boot();app.puppetListeners.click();app.observe(false);assert.ok(!app.puppetClasses.has('is-animated'));
 app.observe(true);app.puppetListeners.click();app.media.matches=true;app.media.change();assert.ok(!app.puppetClasses.has('is-animated'));
});
