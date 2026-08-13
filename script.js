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
let fireflies = [];
let heroWidth = 0;
let heroHeight = 0;
let heroVisible = true;
let lastSceneDraw = 0;

function buildFireflies() {
  const count = mobileMotion ? 16 : 34;
  fireflies = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * heroWidth,
    y: Math.random() * heroHeight,
    size: 1.1 + Math.random() * 2.3,
    speed: 0.08 + Math.random() * 0.22,
    driftX: (Math.random() - 0.5) * 0.16,
    sway: 12 + Math.random() * 36,
    phase: Math.random() * Math.PI * 2,
    pulse: 0.0008 + Math.random() * 0.0015,
    alpha: 0.28 + Math.random() * 0.58,
    depth: 0.55 + Math.random() * 0.8,
    bit: index % 3 === 0 ? (Math.random() < 0.5 ? '0' : '1') : ''
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
  const wing = Math.sin(time * 0.013 + firefly.phase) * 2.4;
  context.save();
  context.translate(firefly.x + swayX, firefly.y);
  context.globalAlpha = firefly.alpha * pulse;
  if (!mobileMotion) {
    context.fillStyle = 'rgba(225,255,145,.16)';
    context.beginPath();
    context.ellipse(-3.5, wing, 4.8 * firefly.depth, 1.4, -.45, 0, Math.PI * 2);
    context.ellipse(3.5, -wing, 4.8 * firefly.depth, 1.4, .45, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowColor = 'rgba(199,255,22,.95)';
  context.shadowBlur = mobileMotion ? 7 : 12 * firefly.depth;
  context.fillStyle = '#dcff6d';
  context.beginPath();
  context.arc(0, 0, firefly.size * firefly.depth, 0, Math.PI * 2);
  context.fill();
  if (firefly.bit && pulse > .84) {
    context.shadowBlur = 0;
    context.globalAlpha = firefly.alpha * .55;
    context.fillStyle = '#c7ff16';
    context.font = `500 ${7 + firefly.depth * 2}px "DM Mono", monospace`;
    context.fillText(firefly.bit, 7, -6);
  }
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
    firefly.y -= firefly.speed * firefly.depth;
    firefly.x += firefly.driftX;
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
