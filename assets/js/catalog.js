import {createBookReader} from './catalog-book.js';
// The cover never changes size on disclosure. Native details remains the fallback.
const disclosures = new WeakMap();
const bookOpeners = new WeakMap();

export function attachDisclosureMotion(details, {
  motionQuery = null,
  duration = 680,
  ResizeObserverClass = globalThis.ResizeObserver,
} = {}) {
  const summary = details.querySelector(':scope > summary');
  const body = details.querySelector(':scope > .disclosure-body');
  if (!summary || !body || typeof details.animate !== 'function') return null;
  let expanded = details.open;
  let animation = null;
  let destroyed = false;

  function cancelAnimation() {
    if (!animation) return;
    const previous = animation;
    animation = null;
    previous.onfinish = null;
    previous.cancel();
  }

  function settle(value = expanded) {
    cancelAnimation();
    expanded = value;
    details.open = value;
    details.style.height = '';
    details.style.overflow = '';
    details.dataset.disclosureState = value ? 'open' : 'closed';
    summary.setAttribute('aria-expanded', String(value));
  }

  function setOpen(value, animate = true) {
    if (destroyed) return;
    const startHeight = details.getBoundingClientRect().height;
    cancelAnimation();
    expanded = value;
    summary.setAttribute('aria-expanded', String(value));
    if (!animate || motionQuery?.matches) {
      settle(value);
      return;
    }
    // Keep the content rendered while closing; remove [open] only at the end.
    details.open = true;
    details.style.height = 'auto';
    const fullHeight = details.getBoundingClientRect().height;
    const border = details.offsetHeight - details.clientHeight;
    const closedHeight = summary.getBoundingClientRect().height + border;
    const endHeight = value ? fullHeight : closedHeight;
    const distance = Math.abs(endHeight - startHeight);
    if (distance < 1) {
      settle(value);
      return;
    }
    details.style.height = `${startHeight}px`;
    details.style.overflow = 'hidden';
    details.dataset.disclosureState = value ? 'opening' : 'closing';
    const travel = Math.max(fullHeight - closedHeight, 1);
    let next;
    try {
      next = details.animate(
        [{height: `${startHeight}px`}, {height: `${endHeight}px`}],
        {duration: Math.max(220, Math.min(duration, duration * distance / travel)), easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'both'},
      );
    } catch {
      settle(value);
      return;
    }
    animation = next;
    next.onfinish = () => {
      if (animation === next) settle(value);
    };
  }

  function onClick(event) {
    if (event.defaultPrevented || event.target.closest('a, button, input, select, textarea')) return;
    event.preventDefault();
    setOpen(!expanded);
  }
  function onNativeToggle() {
    // [open] stays true throughout either animation. External closing wins.
    if (animation && details.open) return;
    settle(details.open);
  }
  function onMotionChange() {
    if (motionQuery?.matches) settle();
  }
  const observer = ResizeObserverClass ? new ResizeObserverClass(() => {
    if (animation && expanded) setOpen(true);
  }) : null;
  observer?.observe(body);
  summary.addEventListener('click', onClick);
  details.addEventListener('toggle', onNativeToggle);
  motionQuery?.addEventListener('change', onMotionChange);
  settle();
  const controller = {
    setOpen,
    destroy() {
      settle();
      destroyed = true;
      observer?.disconnect();
      summary.removeEventListener('click', onClick);
      details.removeEventListener('toggle', onNativeToggle);
      motionQuery?.removeEventListener('change', onMotionChange);
      disclosures.delete(details);
    },
  };
  disclosures.set(details, controller);
  return controller;
}

// Deep links settle every parent before scrolling, including a currently closing fold.
export function openCatalogTarget(document, hash) {
  let id;
  try { id = decodeURIComponent(hash.replace(/^#/, '')); }
  catch { return null; }
  if (!id) return null;
  const target = document.getElementById(id);
  if (!target || !target.closest('.lecture-catalog')) return null;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS' && !bookOpeners.has(node)) {
      const motion = disclosures.get(node);
      if (motion) motion.setOpen(true, false);
      else node.open = true;
    }
  }
  const course = target.closest('.course-folder');
  const reader = course && bookOpeners.get(course);
  if (reader) reader.open(course);
  return target;
}

export function bindBookOpener(course, reader) {
  const summary = course.querySelector(':scope > summary');
  const onClick = event => {
    if (event.defaultPrevented || event.target.closest('a, button, input, select, textarea')) return;
    event.preventDefault();
    if (!reader.open(course)) course.open = true;
  };
  summary.setAttribute('aria-haspopup','dialog');
  summary.setAttribute('aria-controls','course-reader');
  summary.addEventListener('click',onClick);
  bookOpeners.set(course,reader);
  return () => {bookOpeners.delete(course);summary.removeEventListener('click',onClick);summary.removeAttribute('aria-haspopup');summary.removeAttribute('aria-controls');};
}

if (typeof document !== 'undefined') {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 700px), (max-height: 520px)');
  const reader = createBookReader(document.getElementById('course-reader'), {motionQuery,mobileQuery,document});
  document.querySelectorAll('.catalog-group').forEach(details => attachDisclosureMotion(details,{motionQuery}));
  document.querySelectorAll('.course-folder').forEach(course => {
    if (reader) bindBookOpener(course,reader);
    else attachDisclosureMotion(course,{motionQuery});
  });
  document.querySelectorAll('.catalog-index a[data-reveal]').forEach(link => {
    link.addEventListener('click', () => openCatalogTarget(document, link.hash));
  });
  const revealCurrentHash = () => {
    const target = openCatalogTarget(document, window.location.hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
  };
  window.addEventListener('hashchange', revealCurrentHash);
  revealCurrentHash();
}
