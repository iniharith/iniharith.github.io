const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu a');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  menu.toggleAttribute('inert', !open);
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

menuLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  if (element.closest('.hero')) element.style.transitionDelay = `${Math.min(index * 90, 360)}ms`;
  observer.observe(element);
});

const preview = document.querySelector('.project-preview');
const previewContent = document.querySelector('.preview-content');
const projectLabels = {
  commerce: 'SHOP',
  player: 'PLAY',
  lyrics: 'LYRIC',
  print: 'PRINT'
};

document.querySelectorAll('.project').forEach((project) => {
  project.addEventListener('mouseenter', () => {
    const type = project.dataset.project;
    previewContent.dataset.type = type;
    previewContent.dataset.label = projectLabels[type];
    preview.classList.add('is-visible');
  });
  project.addEventListener('mouseleave', () => preview.classList.remove('is-visible'));
});

window.addEventListener('pointermove', (event) => {
  preview.style.left = `${event.clientX + 24}px`;
  preview.style.top = `${event.clientY - 20}px`;
});

const auroraGlobal = document.querySelector('.aurora--global');
const parallaxElements = document.querySelectorAll('[data-parallax]');
const fluidElements = document.querySelectorAll('[data-fluid]');

let pointerX = 0.5;
let pointerY = 0.5;
let cursorX = 0.5;
let cursorY = 0.5;

window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX / window.innerWidth;
  pointerY = event.clientY / window.innerHeight;
});

function updateParallax() {
  const viewportMiddle = window.innerHeight / 2;
  parallaxElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
    const speed = parseFloat(element.dataset.parallax) || 0.15;
    const offset = (rect.top + rect.height / 2 - viewportMiddle) * speed;
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

function updateFluid() {
  const viewportHeight = window.innerHeight;
  fluidElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight * 0.9)));
    const travel = 1 - progress;
    element.style.transform = `translateY(${travel * 70}px) scale(${0.9 + 0.1 * progress})`;
    element.style.opacity = String(Math.min(1, progress * 2));
  });
}

let scrollTicking = false;
function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    if (!reduceMotion) {
      updateParallax();
      updateFluid();
    }
    scrollTicking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });

let lenis = null;
if (!reduceMotion && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        event.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      }
    });
  });
}

const heroCanvas = document.querySelector('#hero-scene');
let context = null;
let glyphs = [];
let heroWidth = 0;
let heroHeight = 0;

function buildGlyphs() {
  const count = heroWidth < 700 ? 20 : 44;
  glyphs = Array.from({ length: count }, () => ({
    x: Math.random() * heroWidth,
    y: Math.random() * heroHeight,
    size: 7 + Math.random() * 18,
    speed: 0.12 + Math.random() * 0.4,
    sway: (Math.random() - 0.5) * 26,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.14 + Math.random() * 0.55,
    char: Math.random() < 0.5 ? '+' : '×',
    paper: Math.random() < 0.15
  }));
}

function resizeHero() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  heroWidth = heroCanvas.clientWidth;
  heroHeight = heroCanvas.clientHeight;
  heroCanvas.width = heroWidth * ratio;
  heroCanvas.height = heroHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildGlyphs();
}

function drawFog(time) {
  const blobs = [
    { x: heroWidth * 0.3, y: heroHeight * 0.3, r: Math.max(heroWidth, heroHeight) * 0.42, a: 0.1, dx: 40, dy: 26, s: 0.05 },
    { x: heroWidth * 0.8, y: heroHeight * 0.55, r: Math.max(heroWidth, heroHeight) * 0.36, a: 0.08, dx: -36, dy: 20, s: 0.04 },
    { x: heroWidth * 0.55, y: heroHeight * 0.8, r: Math.max(heroWidth, heroHeight) * 0.4, a: 0.07, dx: 26, dy: -22, s: 0.045 }
  ];
  blobs.forEach((blob, index) => {
    const offsetX = Math.sin(time * blob.s + index * 2.1) * blob.dx;
    const offsetY = Math.cos(time * blob.s * 0.8 + index) * blob.dy;
    const cx = blob.x + offsetX;
    const cy = blob.y + offsetY;
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, blob.r);
    gradient.addColorStop(0, `rgba(199, 255, 22, ${blob.a})`);
    gradient.addColorStop(1, 'rgba(199, 255, 22, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, heroWidth, heroHeight);
  });
}

function drawGlyph(glyph) {
  const swayX = Math.sin(glyph.phase + performance.now() * 0.0005) * glyph.sway;
  context.save();
  context.translate(glyph.x + swayX, glyph.y);
  context.globalAlpha = glyph.alpha;
  context.lineWidth = Math.max(1, glyph.size * 0.11);
  context.strokeStyle = glyph.paper ? 'rgba(241,240,234,0.55)' : 'rgba(199,255,22,0.95)';
  context.shadowColor = 'rgba(199,255,22,0.75)';
  context.shadowBlur = glyph.size * 0.9;
  const half = glyph.size;
  if (glyph.char === '+') {
    context.beginPath();
    context.moveTo(-half, 0);
    context.lineTo(half, 0);
    context.moveTo(0, -half);
    context.lineTo(0, half);
  } else {
    context.beginPath();
    context.moveTo(-half, -half);
    context.lineTo(half, half);
    context.moveTo(-half, half);
    context.lineTo(half, -half);
  }
  context.stroke();
  context.restore();
}

function drawScene(time = 0) {
  context.clearRect(0, 0, heroWidth, heroHeight);
  context.save();
  context.translate((cursorX - 0.5) * 22, (cursorY - 0.5) * 22);
  drawFog(time);
  glyphs.forEach((glyph) => {
    glyph.y -= glyph.speed;
    if (glyph.y < -40) {
      glyph.y = heroHeight + 40;
      glyph.x = Math.random() * heroWidth;
    }
    drawGlyph(glyph);
  });
  context.restore();
}

if (heroCanvas && heroCanvas.getContext) {
  context = heroCanvas.getContext('2d');
  window.addEventListener('resize', resizeHero);
  resizeHero();
}

function loop(time) {
  if (lenis) lenis.raf(time);
  cursorX += (pointerX - cursorX) * 0.05;
  cursorY += (pointerY - cursorY) * 0.05;
  if (auroraGlobal) {
    auroraGlobal.style.transform = `translate3d(${(cursorX - 0.5) * -40}px, ${(cursorY - 0.5) * -40}px, 0)`;
  }
  if (context) drawScene(time);
  requestAnimationFrame(loop);
}

if (reduceMotion) {
  if (context) drawScene(0);
  updateFluid();
} else {
  requestAnimationFrame(loop);
  updateParallax();
  updateFluid();
}
