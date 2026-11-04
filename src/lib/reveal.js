/* Fade-up on scroll. Elements with class "rv" start hidden only when JS is running (html.js). */
let io;
export function reveal() {
  io ||= new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.js .rv:not(.in)').forEach(el => io.observe(el));
}
