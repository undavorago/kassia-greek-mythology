// A single live lesson list moves into the native modal and back; no duplicated links.
export function createBookReader(dialog, {
  motionQuery = null,
  mobileQuery = null,
  document = dialog?.ownerDocument,
} = {}) {
  if (!dialog || typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') return null;
  const slot = dialog.querySelector('.reader-list-slot');
  const image = dialog.querySelector('.reader-cover-image');
  const title = dialog.querySelector('.reader-title');
  const closeButton = dialog.querySelector('.reader-close');
  const spread = dialog.querySelector('.reader-spread');
  const rightPage = dialog.querySelector('.reader-lessons');
  if (!slot || !image || !title || !closeButton || !spread || !rightPage) return null;
  let active = null;
  let animations = [];
  let closing = false;
  let backdropPress = false;

  function cancelAnimations() {
    const previous = animations;
    animations = [];
    previous.forEach(animation => {animation.onfinish = null;animation.cancel();});
  }
  function addAnimation(element, frames, options) {
    if (motionQuery?.matches || typeof element.animate !== 'function') return null;
    try {
      const animation = element.animate(frames, options);
      animations.push(animation);
      return animation;
    } catch {return null;}
  }
  function animateOpening() {
    cancelAnimations();
    closing = false;
    dialog.dataset.readerState = 'open';
    addAnimation(dialog, [{opacity:0}, {opacity:1}], {duration:350,easing:'ease-out'});
    if (mobileQuery?.matches) {
      addAnimation(rightPage,
        [{clipPath:'inset(0 0 100% 0)',transform:'translateY(-8px)'},{clipPath:'inset(0)',transform:'translateY(0)'}],
        {duration:560,easing:'cubic-bezier(.2,.7,.2,1)'},
      );
    } else {
      addAnimation(spread,
        [{opacity:.35,transform:'perspective(1600px) rotateX(3deg) scale(.97)'},{opacity:1,transform:'perspective(1600px) rotateX(0deg) scale(1)'}],
        {duration:650,easing:'cubic-bezier(.2,.7,.2,1)'},
      );
      addAnimation(rightPage,
        [{transform:'perspective(1500px) rotateY(-16deg)'},{transform:'perspective(1500px) rotateY(0deg)'}],
        {duration:720,easing:'cubic-bezier(.2,.7,.2,1)'},
      );
    }
  }
  function restore({focus = true} = {}) {
    cancelAnimations();
    if (!active) return;
    const previous = active;
    active = null;
    closing = false;
    if (previous.next?.parentNode === previous.parent) previous.parent.insertBefore(previous.body, previous.next);
    else previous.parent.append(previous.body);
    previous.course.open = false;
    previous.summary.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('reader-active');
    dialog.dataset.readerState = 'closed';
    if (focus && previous.summary.isConnected) previous.summary.focus({preventScroll:true});
  }
  function finishClose() {
    cancelAnimations();
    if (dialog.open) dialog.close();
    restore();
  }
  function close() {
    if (!active || closing) return;
    cancelAnimations();
    closing = true;
    dialog.dataset.readerState = 'closing';
    const next = addAnimation(dialog,
      [{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],
      {duration:260,easing:'ease-in',fill:'both'},
    );
    if (!next) finishClose();
    else next.onfinish = () => {if (animations.includes(next) && closing) finishClose();};
  }
  function open(course) {
    if (active?.course === course && dialog.open) {
      if (closing) animateOpening();
      closeButton.focus({preventScroll:true});
      return true;
    }
    if (active) {
      if (dialog.open) dialog.close();
      restore({focus:false});
    }
    const summary = course.querySelector(':scope > summary');
    const body = course.querySelector(':scope > .lesson-body');
    const source = course.querySelector('.course-art img');
    const heading = course.querySelector('.cover-title');
    if (!summary || !body || !source || !heading) return false;
    active = {course,summary,body,parent:body.parentNode,next:body.nextSibling};
    course.open = false;
    slot.append(body);
    title.textContent = heading.textContent.trim();
    image.setAttribute('src', source.currentSrc || source.getAttribute('src'));
    image.setAttribute('alt', source.getAttribute('alt') || 'Обложка блока');
    const sourceSet = source.getAttribute('srcset');
    if (sourceSet) {
      image.setAttribute('srcset',sourceSet);
      image.setAttribute('sizes','(max-width: 700px) 1px, (max-height: 520px) 1px, (max-width: 1240px) 45vw, 540px');
    } else image.removeAttribute('srcset');
    summary.setAttribute('aria-expanded','true');
    document.documentElement.classList.add('reader-active');
    try {dialog.showModal();}
    catch {restore({focus:false});return false;}
    closeButton.focus({preventScroll:true});
    animateOpening();
    return true;
  }
  const onCancel = event => {event.preventDefault();close();};
  const isOutside = event => {
    const r = dialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  };
  const onPointerDown = event => {backdropPress = event.target === dialog && isOutside(event);};
  const onBackdropClick = event => {if (backdropPress && event.target === dialog && isOutside(event)) close();backdropPress=false;};
  const onNativeClose = () => {if (!dialog.open) restore();};
  const onMotionChange = () => {
    if (!motionQuery?.matches) return;
    if (closing) finishClose();
    else cancelAnimations();
  };
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',onCancel);
  dialog.addEventListener('close',onNativeClose);
  dialog.addEventListener('pointerdown',onPointerDown);
  dialog.addEventListener('click',onBackdropClick);
  motionQuery?.addEventListener('change',onMotionChange);
  return {
    open,close,
    destroy() {
      finishClose();
      closeButton.removeEventListener('click',close);
      dialog.removeEventListener('cancel',onCancel);
      dialog.removeEventListener('close',onNativeClose);
      dialog.removeEventListener('pointerdown',onPointerDown);
      dialog.removeEventListener('click',onBackdropClick);
      motionQuery?.removeEventListener('change',onMotionChange);
    },
  };
}
