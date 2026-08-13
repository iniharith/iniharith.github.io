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
const aboutSection = document.querySelector('#about');
let context = null;
let dragonflyPoints = [];
let heroWidth = 0;
let heroHeight = 0;
let sceneEnd = 1;
let lastSceneDraw = 0;

function addDragonflyPoint(x, y, z, alpha = 1) {
  dragonflyPoints.push({ x, y, z, alpha, bit: Math.random() < .5 ? '0' : '1' });
}

function buildDragonfly() {
  dragonflyPoints = [];
  const density = mobileMotion ? .3 : 1;

  // Four tapered wing membranes, sampled as a cloud rather than outlined.
  [-1, 1].forEach((side) => {
    [
      { root: -.42, sweep: -1.05, length: 2.65, width: .62 },
      { root: .02, sweep: .72, length: 2.35, width: .7 }
    ].forEach((wing, wingIndex) => {
      const count = Math.floor(540 * density);
      for (let index = 0; index < count; index += 1) {
        const span = Math.sqrt(Math.random());
        const chord = (Math.random() - .5) * Math.sin(Math.PI * span) * wing.width;
        const x = side * (.2 + span * wing.length);
        const y = wing.root + span * wing.sweep + chord;
        const z = Math.sin(span * Math.PI) * (wingIndex ? -.1 : .12) + chord * .18;
        addDragonflyPoint(x, y, z, .22 + Math.random() * .62);
      }
    });
  });

  // Segmented thorax and abdomen.
  const bodyCount = Math.floor(430 * density);
  for (let index = 0; index < bodyCount; index += 1) {
    const y = -1.05 + Math.random() * 3.65;
    const taper = y < .35 ? .28 + (y + 1.05) * .08 : Math.max(.055, .22 - (y - .35) * .065);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * taper;
    addDragonflyPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, .38 + Math.random() * .58);
  }

  // Head and two denser eyes.
  const headCount = Math.floor(150 * density);
  for (let index = 0; index < headCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * .34;
    const z = (Math.random() - .5) * .42;
    addDragonflyPoint(Math.cos(angle) * radius, -1.25 + Math.sin(angle) * radius * .7, z, .55 + Math.random() * .45);
  }

  // Long binary flight trails crossing behind the insect.
  const trailCount = Math.floor(170 * density);
  for (let index = 0; index < trailCount; index += 1) {
    const t = index / trailCount;
    addDragonflyPoint(-3.2 + t * 6.4, -2.15 + t * 4.3, -.55, .08 + t * .24);
  }
}

function resizeHero() {
  const ratio = mobileMotion ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  heroWidth = heroCanvas.clientWidth;
  heroHeight = heroCanvas.clientHeight;
  heroCanvas.width = heroWidth * ratio;
  heroCanvas.height = heroHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  sceneEnd = Math.max(1, aboutSection.offsetTop + aboutSection.offsetHeight);
  buildDragonfly();
}

function rotatePoint(point, rotateX, rotateY, rotateZ) {
  const cosX = Math.cos(rotateX);
  const sinX = Math.sin(rotateX);
  const cosY = Math.cos(rotateY);
  const sinY = Math.sin(rotateY);
  const cosZ = Math.cos(rotateZ);
  const sinZ = Math.sin(rotateZ);
  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  const x2 = point.x * cosY + z1 * sinY;
  const z2 = -point.x * sinY + z1 * cosY;
  return {
    x: x2 * cosZ - y1 * sinZ,
    y: x2 * sinZ + y1 * cosZ,
    z: z2
  };
}

function drawScene(time = 0) {
  if (window.scrollY > sceneEnd) {
    context.clearRect(0, 0, heroWidth, heroHeight);
    return;
  }
  const interval = mobileMotion ? 1000 / 24 : 1000 / 40;
  if (!reduceMotion && time - lastSceneDraw < interval) return;
  lastSceneDraw = time;
  context.clearRect(0, 0, heroWidth, heroHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, sceneEnd - window.innerHeight * .35)));
  const ease = progress * progress * (3 - 2 * progress);
  const idle = reduceMotion ? 0 : time * .00008;
  const rotateX = .78 - ease * 1.12 + Math.sin(idle * 1.7) * .035;
  const rotateY = -.52 + ease * 1.7 + (cursorX - .5) * .14;
  const rotateZ = -.82 + ease * .92 + Math.sin(idle) * .04;
  const scale = Math.min(heroWidth, heroHeight) * (mobileMotion ? .12 : .15) * (1 + ease * .58);
  const centerX = heroWidth * (.51 + (cursorX - .5) * .018);
  const centerY = heroHeight * (.52 - ease * .03 + (cursorY - .5) * .012);
  const flip = Math.floor(time / 230);

  context.font = `400 ${mobileMotion ? 7 : 8}px "DM Mono", monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const stageFade = progress > .88 ? (1 - progress) / .12 : 1;
  dragonflyPoints.forEach((point, index) => {
    const rotated = rotatePoint(point, rotateX, rotateY, rotateZ);
    const perspective = 1 / Math.max(.6, 1 + rotated.z * .12);
    const x = centerX + rotated.x * scale * perspective;
    const y = centerY + rotated.y * scale * perspective;
    if (x < -10 || x > heroWidth + 10 || y < -10 || y > heroHeight + 10) return;
    const flicker = .68 + Math.sin(time * .002 + index * .73) * .32;
    const depth = Math.max(.24, Math.min(1, .72 - rotated.z * .13));
    context.globalAlpha = point.alpha * flicker * depth * stageFade;
    context.fillStyle = index % 41 === flip % 41 ? '#c7ff16' : 'rgba(241,240,234,.9)';
    context.fillText((index + flip) % 7 === 0 ? (point.bit === '1' ? '0' : '1') : point.bit, x, y);
  });
  context.globalAlpha = 1;
}

if (heroCanvas && heroCanvas.getContext) {
  context = heroCanvas.getContext('2d');
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeHero, 120);
  }, { passive: true });
  resizeHero();
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
