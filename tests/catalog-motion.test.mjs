import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachDisclosureMotion, openCatalogTarget} from '../assets/js/catalog.js';

function fixture(initiallyOpen = false) {
  const summaryListeners = new Map();
  const detailsListeners = new Map();
  const motionListeners = new Map();
  const attributes = new Map();
  let bodyHeight = 420;
  let visualHeight = null;
  const animations = [];
  const summary = {
    getBoundingClientRect: () => ({height:120}),
    setAttribute: (k,v) => attributes.set(k,v),
    addEventListener: (n,f) => summaryListeners.set(n,f),
    removeEventListener: n => summaryListeners.delete(n),
  };
  const body = {getBoundingClientRect: () => ({height:bodyHeight})};
  const main = {tagName:'MAIN',parentElement:null};
  const details = {
    tagName:'DETAILS',parentElement:main,open:initiallyOpen,style:{},dataset:{},
    closest: () => main,
    querySelector: s => s.endsWith('summary') ? summary : body,
    getBoundingClientRect() {
      if (visualHeight !== null) return {height:visualHeight};
      const h=this.style.height;
      return {height:h && h!=='auto' ? parseFloat(h) : (this.open ? 122+bodyHeight : 122)};
    },
    get offsetHeight() {return this.getBoundingClientRect().height;},
    get clientHeight() {return this.offsetHeight-2;},
    addEventListener: (n,f) => detailsListeners.set(n,f),
    removeEventListener: n => detailsListeners.delete(n),
    animate(frames,options) {
      visualHeight=parseFloat(frames[0].height);
      const a={frames,options,cancelled:false,onfinish:null,
        cancel() {this.cancelled=true;visualHeight=null;},
        finish() {visualHeight=parseFloat(frames[1].height);this.onfinish?.();},
      };
      animations.push(a);return a;
    },
  };
  const motionQuery = {
    matches:false,
    addEventListener:(n,f)=>motionListeners.set(n,f),
    removeEventListener:n=>motionListeners.delete(n),
  };
  let observer;
  class ResizeObserverClass {
    constructor(callback) {this.callback=callback;observer=this;}
    observe() {}
    disconnect() {this.disconnected=true;}
  }
  const controller=attachDisclosureMotion(details,{motionQuery,ResizeObserverClass});
  return {details,summary,attributes,animations,motionQuery,controller,
    click() {let prevented=false;summaryListeners.get('click')({target:{closest:()=>null},preventDefault(){prevented=true;}});return prevented;},
    midway(h) {visualHeight=h;},
    reduce() {motionQuery.matches=true;motionListeners.get('change')();},
    resize(h) {bodyHeight=h;observer.callback();},
    nativeToggle() {detailsListeners.get('toggle')();},
  };
}

test('closing keeps the lesson content rendered until the motion finishes, then releases fixed height',()=>{
  const f=fixture(true);
  assert.equal(f.click(),true);
  assert.equal(f.details.open,true);
  assert.equal(f.attributes.get('aria-expanded'),'false');
  assert.equal(f.details.dataset.disclosureState,'closing');
  f.animations.at(-1).finish();
  assert.equal(f.details.open,false);
  assert.equal(f.details.style.height,'');
  assert.equal(f.details.style.overflow,'');
});

test('repeated clicks reverse from the visible intermediate height without allowing a stale finish to close it',()=>{
  const f=fixture();
  f.click();const first=f.animations[0];const staleFinish=first.onfinish;
  f.midway(300);f.click();
  const second=f.animations[1];
  assert.equal(first.cancelled,true);
  assert.equal(second.frames[0].height,'300px');
  assert.equal(second.frames[1].height,'122px');
  f.midway(240);f.click();
  const third=f.animations[2];
  assert.equal(second.cancelled,true);
  assert.equal(third.frames[0].height,'240px');
  staleFinish();third.finish();
  assert.equal(f.details.open,true);
  assert.equal(f.details.dataset.disclosureState,'open');
  assert.equal(f.details.style.height,'');
});

test('a deep link cancels an in-progress close and leaves the destination stably open',()=>{
  const f=fixture(true);f.click();const closing=f.animations.at(-1);const staleFinish=closing.onfinish;
  const document={getElementById:id=>id==='foundations'?f.details:null};
  assert.equal(openCatalogTarget(document,'#foundations'),f.details);
  assert.equal(closing.cancelled,true);
  assert.equal(f.details.open,true);
  staleFinish();assert.equal(f.details.open,true);
  assert.equal(f.details.style.height,'');
});

test('reduced motion settles a running animation and prevents new animations',()=>{
  const f=fixture();f.click();f.reduce();
  assert.equal(f.animations[0].cancelled,true);
  assert.equal(f.details.open,true);
  assert.equal(f.details.style.height,'');
  f.click();assert.equal(f.details.open,false);assert.equal(f.animations.length,1);
});

test('a content resize during opening retargets to the new natural height',()=>{
  const f=fixture();f.click();f.midway(280);f.resize(610);
  const latest=f.animations.at(-1);
  assert.equal(latest.frames[0].height,'280px');
  assert.equal(latest.frames[1].height,'732px');
  latest.finish();assert.equal(f.details.open,true);assert.equal(f.details.style.height,'');
});

test('external native closing cancels the current expansion',()=>{
  const f=fixture();f.click();f.details.open=false;f.nativeToggle();
  assert.equal(f.animations[0].cancelled,true);
  assert.equal(f.details.dataset.disclosureState,'closed');
});

test('unsupported animation leaves native details entirely in charge',()=>{
  const details={querySelector:()=>({}),open:false};
  assert.equal(attachDisclosureMotion(details),null);
  assert.equal(details.open,false);
});
