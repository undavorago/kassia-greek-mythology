import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBookReader} from '../assets/js/catalog-book.js';
import {bindBookOpener,openCatalogTarget} from '../assets/js/catalog.js';

function fixture({mobile=false,reduced=false,failModal=false}={}) {
  const document={documentElement:{classList:new Set()},activeElement:null};
  document.documentElement.classList.remove=document.documentElement.classList.delete;
  const animations=[];
  function node(name) {
    const n={name,children:[],parentNode:null,attributes:{},handlers:new Map(),dataset:{},isConnected:true,
      get nextSibling(){if(!this.parentNode)return null;const a=this.parentNode.children;return a[a.indexOf(this)+1]??null;},
      append(child){if(child.parentNode){const a=child.parentNode.children;a.splice(a.indexOf(child),1);}this.children.push(child);child.parentNode=this;},
      insertBefore(child,next){if(child.parentNode){const a=child.parentNode.children;a.splice(a.indexOf(child),1);}this.children.splice(this.children.indexOf(next),0,child);child.parentNode=this;},
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return this.attributes[k]??null;},removeAttribute(k){delete this.attributes[k];},
      focus(){document.activeElement=this;},
      addEventListener(k,f){this.handlers.set(k,f);},removeEventListener(k){this.handlers.delete(k);},
      emit(k,e={}){this.handlers.get(k)?.(e);},
      animate(frames,options){const a={owner:this,frames,options,onfinish:null,cancelled:false,cancel(){this.cancelled=true;},finish(){this.onfinish?.();}};animations.push(a);return a;},
    };return n;
  }
  const dialog=node('dialog');dialog.open=false;dialog.ownerDocument=document;
  dialog.showModal=()=>{if(failModal)throw Error('Unavailable');dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.emit('close');};
  dialog.getBoundingClientRect=()=>({left:10,right:500,top:10,bottom:600});
  const slot=node('slot'),image=node('image'),title=node('title'),closeButton=node('close'),spread=node('spread'),page=node('page');
  const dialogParts={'.reader-list-slot':slot,'.reader-cover-image':image,'.reader-title':title,'.reader-close':closeButton,'.reader-spread':spread,'.reader-lessons':page};
  dialog.querySelector=s=>dialogParts[s];
  const course=node('course'),summary=node('summary'),body=node('body'),sentinel=node('sentinel'),source=node('source'),heading=node('heading');
  course.tagName='DETAILS';course.open=false;course.append(summary);course.append(body);course.append(sentinel);
  heading.textContent='Основы';source.setAttribute('src','cover.webp');source.setAttribute('alt','Полный коллаж');
  const parts={':scope > summary':summary,':scope > .lesson-body':body,'.course-art img':source,'.cover-title':heading};
  course.querySelector=s=>parts[s];
  const motionQuery=node('media');motionQuery.matches=reduced;
  const mobileQuery={matches:mobile};
  const reader=createBookReader(dialog,{motionQuery,mobileQuery,document});
  return {dialog,slot,image,title,closeButton,spread,page,course,summary,body,sentinel,animations,motionQuery,mobileQuery,reader,document};
}

test('the same live lesson list opens in the book while the catalog card stays closed',()=>{
  const f=fixture();assert.equal(f.reader.open(f.course),true);
  assert.equal(f.dialog.open,true);assert.equal(f.course.open,false);
  assert.equal(f.body.parentNode,f.slot);assert.equal(f.slot.children.length,1);
  assert.equal(f.image.attributes.src,'cover.webp');assert.equal(f.title.textContent,'Основы');
  assert.equal(f.document.activeElement,f.closeButton);
  assert.equal(f.document.documentElement.classList.has('reader-active'),true);
});

test('closing waits for its animation, restores original node order, unlocks scrolling and restores focus',()=>{
  const f=fixture();f.reader.open(f.course);f.reader.close();
  assert.equal(f.dialog.open,true);assert.equal(f.body.parentNode,f.slot);
  f.animations.at(-1).finish();
  assert.equal(f.dialog.open,false);assert.deepEqual(f.course.children,[f.summary,f.body,f.sentinel]);
  assert.equal(f.slot.children.length,0);assert.equal(f.course.open,false);
  assert.equal(f.document.activeElement,f.summary);assert.equal(f.summary.attributes['aria-expanded'],'false');
  assert.equal(f.document.documentElement.classList.has('reader-active'),false);
});

test('Escape and a genuine outside click close the reader; dragging outward from a page does not',()=>{
  const f=fixture();f.reader.open(f.course);
  f.dialog.emit('pointerdown',{target:f.page,clientX:100,clientY:100});
  f.dialog.emit('click',{target:f.dialog,clientX:1,clientY:1});assert.equal(f.dialog.dataset.readerState,'open');
  f.dialog.emit('pointerdown',{target:f.dialog,clientX:1,clientY:1});
  f.dialog.emit('click',{target:f.dialog,clientX:1,clientY:1});assert.equal(f.dialog.dataset.readerState,'closing');
  f.animations.at(-1).finish();f.reader.open(f.course);
  let prevented=false;f.dialog.emit('cancel',{preventDefault(){prevented=true;}});
  assert.equal(prevented,true);f.animations.at(-1).finish();assert.equal(f.dialog.open,false);
});

test('reopening during closing invalidates the stale close callback and never duplicates content',()=>{
  const f=fixture();f.reader.open(f.course);f.reader.close();const closing=f.animations.at(-1);const stale=closing.onfinish;
  f.reader.open(f.course);assert.equal(closing.cancelled,true);stale();
  assert.equal(f.dialog.open,true);assert.equal(f.slot.children.length,1);assert.equal(f.body.parentNode,f.slot);
});

test('phone motion reveals the list as a scroll and reduced motion completes closing immediately',()=>{
  const f=fixture({mobile:true});f.reader.open(f.course);
  assert.equal(f.animations.length,2);assert.equal(f.animations[1].owner,f.page);
  assert.equal(f.animations[1].frames[0].clipPath,'inset(0 0 100% 0)');
  f.reader.close();f.motionQuery.matches=true;f.motionQuery.emit('change');
  assert.equal(f.dialog.open,false);assert.equal(f.body.parentNode,f.course);
  const before=f.animations.length;f.reader.open(f.course);f.reader.close();
  assert.equal(f.animations.length,before);assert.equal(f.dialog.open,false);
});

test('a rejected showModal restores the original list and does not lock the document',()=>{
  const f=fixture({failModal:true});assert.equal(f.reader.open(f.course),false);
  assert.equal(f.body.parentNode,f.course);assert.equal(f.slot.children.length,0);
  assert.equal(f.document.documentElement.classList.has('reader-active'),false);
});

test('a direct native close restores the list and cancels any active animation',()=>{
  const f=fixture();f.reader.open(f.course);f.dialog.close();
  assert.equal(f.body.parentNode,f.course);assert.equal(f.document.activeElement,f.summary);
  assert.equal(f.animations.every(a=>a.cancelled),true);
});

test('a course deep link opens the book and containing group without expanding the course in its grid',()=>{
  const f=fixture();const group={tagName:'DETAILS',open:false,parentElement:null};f.course.parentElement=group;
  f.course.closest=selector=>selector==='.course-folder'?f.course:group;
  const unbind=bindBookOpener(f.course,f.reader);
  const document={getElementById:id=>id==='foundations'?f.course:null};
  assert.equal(openCatalogTarget(document,'#foundations'),f.course);
  assert.equal(group.open,true);assert.equal(f.course.open,false);assert.equal(f.dialog.open,true);
  unbind();f.reader.destroy();
});

test('no dialog support leaves the original disclosure available',()=>{
  assert.equal(createBookReader(null),null);assert.equal(createBookReader({close(){}}),null);
});
