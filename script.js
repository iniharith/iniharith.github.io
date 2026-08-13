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
const mobileMotion = window.matchMedia('(max-width: 800px)').matches;

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
let lastScrollY = window.scrollY;
let scrollImpulse = 0;
let scrollFlow = 0;
function onScroll() {
  const nextScrollY = window.scrollY;
  scrollImpulse = Math.max(-36, Math.min(36, nextScrollY - lastScrollY));
  lastScrollY = nextScrollY;
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
let fireflies = [];
let heroWidth = 0;
let heroHeight = 0;
let heroVisible = true;
let lastSceneDraw = 0;

function buildFireflies() {
  const count = mobileMotion ? 8 : 15;
  fireflies = Array.from({ length: count }, () => ({
    x: Math.random() * heroWidth,
    y: Math.random() * heroHeight,
    size: 6 + Math.random() * 3.5,
    speed: 0.08 + Math.random() * 0.22,
    driftX: (Math.random() - 0.5) * 0.16,
    sway: 15 + Math.random() * 42,
    phase: Math.random() * Math.PI * 2,
    pulse: 0.0008 + Math.random() * 0.0015,
    alpha: 0.38 + Math.random() * 0.48,
    depth: 0.55 + Math.random() * 0.8,
    flip: Math.random() * 1000
  }));
}

function resizeHero() {
  const ratio = mobileMotion ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  heroWidth = heroCanvas.clientWidth;
  heroHeight = heroCanvas.clientHeight;
  heroCanvas.width = heroWidth * ratio;
  heroCanvas.height = heroHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildFireflies();
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

function drawFirefly(firefly, time) {
  const pulse = 0.45 + 0.55 * Math.sin(time * firefly.pulse + firefly.phase);
  const swayX = Math.sin(firefly.phase + time * 0.00022) * firefly.sway;
  const wingSpread = 1.25 + Math.abs(Math.sin(time * 0.006 + firefly.phase)) * 1.15;
  const unit = firefly.size * firefly.depth;
  const flip = Math.floor((time + firefly.flip) / 260);
  const glyphs = [
    { x: -2 * wingSpread, y: -1.1, wing: true },
    { x: -3 * wingSpread, y: 0, wing: true },
    { x: -2 * wingSpread, y: 1.1, wing: true },
    { x: 2 * wingSpread, y: -1.1, wing: true },
    { x: 3 * wingSpread, y: 0, wing: true },
    { x: 2 * wingSpread, y: 1.1, wing: true },
    { x: 0, y: -1.45 },
    { x: 0, y: -.35, core: true },
    { x: 0, y: .75, core: true },
    { x: 0, y: 1.85 }
  ];
  context.save();
  context.translate(firefly.x + swayX + scrollFlow * firefly.depth * .45, firefly.y - scrollFlow * firefly.depth * 1.5);
  context.font = `500 ${unit}px "DM Mono", monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  glyphs.forEach((glyph, index) => {
    const coreLight = glyph.core ? .35 : 0;
    context.globalAlpha = firefly.alpha * Math.min(1, pulse + coreLight) * (glyph.wing ? .62 : 1);
    context.fillStyle = glyph.core && pulse > .68 ? '#e8ff99' : '#c7ff16';
    context.shadowColor = '#c7ff16';
    context.shadowBlur = mobileMotion ? (glyph.core ? 5 : 2) : (glyph.core ? 12 : 5);
    context.fillText((index + flip) % 2 ? '1' : '0', glyph.x * unit, glyph.y * unit);
  });
  context.restore();
}

function drawScene(time = 0) {
  if (!heroVisible) return;
  const interval = mobileMotion ? 1000 / 24 : 1000 / 40;
  if (!reduceMotion && time - lastSceneDraw < interval) return;
  lastSceneDraw = time;
  context.clearRect(0, 0, heroWidth, heroHeight);
  context.save();
  context.translate((cursorX - 0.5) * 22, (cursorY - 0.5) * 22);
  if (!mobileMotion) drawFog(time);
  fireflies.forEach((firefly) => {
    firefly.y -= firefly.speed * firefly.depth + scrollFlow * .018 * firefly.depth;
    firefly.x += firefly.driftX + scrollFlow * .004;
    if (firefly.y < -24 || firefly.x < -60 || firefly.x > heroWidth + 60) {
      firefly.y = heroHeight + 24;
      firefly.x = Math.random() * heroWidth;
    }
    drawFirefly(firefly, time);
  });
  context.restore();
}

if (heroCanvas && heroCanvas.getContext) {
  context = heroCanvas.getContext('2d');
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeHero, 120);
  }, { passive: true });
  resizeHero();
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
  }, { threshold: 0 }).observe(heroCanvas);
}

function loop(time) {
  if (lenis) lenis.raf(time);
  cursorX += (pointerX - cursorX) * 0.05;
  cursorY += (pointerY - cursorY) * 0.05;
  scrollFlow += (scrollImpulse - scrollFlow) * 0.12;
  scrollImpulse *= 0.86;
  if (auroraGlobal) {
    auroraGlobal.style.transform = `translate3d(${(cursorX - 0.5) * -40}px, ${(cursorY - 0.5) * -40}px, 0)`;
  }
  if (context && !document.hidden) drawScene(time);
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
