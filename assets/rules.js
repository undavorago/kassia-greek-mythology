// The complete text and navigation work without JavaScript.
const sections = [...document.querySelectorAll('.rule-section')];
const chapterLinks = [...document.querySelectorAll('.rules-toc li a')];
function setCurrent(id) {
  chapterLinks.forEach(link => {
    if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
if ('IntersectionObserver' in window) {
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    const current = sections.find(section => visible.has(section));
    if (current) setCurrent(current.id);
  }, { rootMargin: '-8% 0px -45% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
}
chapterLinks.forEach(link => link.addEventListener('click', () => setCurrent(link.hash.slice(1))));
