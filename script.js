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
let sceneProgress = 0;

function addDragonflyPoint(x, y, z, alpha = 1) {
  dragonflyPoints.push({ x, y, z, alpha, bit: Math.random() < .5 ? '0' : '1' });
}

function buildDragonfly() {
  dragonflyPoints = [];
  const spanSteps = mobileMotion ? 18 : 28;
  const chordSteps = mobileMotion ? 5 : 8;

  // Four regular binary membranes make the silhouette legible at a glance.
  [-1, 1].forEach((side) => {
    [
      { root: -.28, sweep: -.92, length: 3.05, width: .7, curve: -.32 },
      { root: .08, sweep: .72, length: 2.72, width: .82, curve: .25 }
    ].forEach((wing, wingIndex) => {
      for (let spanIndex = 1; spanIndex <= spanSteps; spanIndex += 1) {
        const span = spanIndex / spanSteps;
        const rows = Math.max(2, Math.round(Math.sin(Math.PI * span) * chordSteps));
        for (let row = -rows; row <= rows; row += 1) {
          const chord = row / rows * Math.sin(Math.PI * span) * wing.width;
          const x = side * (.18 + span * wing.length);
          const y = wing.root + span * wing.sweep + Math.sin(span * Math.PI) * wing.curve + chord;
          const z = Math.sin(span * Math.PI) * (wingIndex ? -.08 : .1) + chord * .12;
          addDragonflyPoint(x, y, z, .28 + (1 - Math.abs(row / rows)) * .48);
        }
      }
    });
  });

  // Ringed thorax and long segmented abdomen.
  const bodySegments = mobileMotion ? 30 : 48;
  const ringPoints = mobileMotion ? 6 : 9;
  for (let segment = 0; segment < bodySegments; segment += 1) {
    const t = segment / (bodySegments - 1);
    const y = -1 + t * 4.45;
    const radius = t < .3 ? .24 + Math.sin(t / .3 * Math.PI) * .28 : Math.max(.035, .18 * (1 - (t - .3) / .7));
    for (let ring = 0; ring < ringPoints; ring += 1) {
      const angle = ring / ringPoints * Math.PI * 2;
      addDragonflyPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, .58 + (ring % 3) * .16);
    }
  }

  const headRings = mobileMotion ? 4 : 6;
  for (let ring = 0; ring < headRings; ring += 1) {
    const latitude = (ring / (headRings - 1) - .5) * Math.PI;
    const radius = Math.cos(latitude) * .34;
    const y = -1.28 + Math.sin(latitude) * .28;
    const points = mobileMotion ? 7 : 11;
    for (let index = 0; index < points; index += 1) {
      const angle = index / points * Math.PI * 2;
      addDragonflyPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, .76);
    }
  }

  // Sparse diagonal trail echoes the reference scene without obscuring the insect.
  const trailCount = mobileMotion ? 34 : 70;
  for (let index = 0; index < trailCount; index += 1) {
    const t = index / trailCount;
    addDragonflyPoint(-3.6 + t * 7.2, -2.4 + t * 4.8, -.55, .06 + t * .2);
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
  context.clearRect(0, 0, heroWidth, heroHeight);
  const targetProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, sceneEnd - window.innerHeight * .35)));
  sceneProgress += (targetProgress - sceneProgress) * (mobileMotion ? .14 : .1);
  const ease = sceneProgress * sceneProgress * (3 - 2 * sceneProgress);
  const idle = reduceMotion ? 0 : time * .00008;
  const rotateX = .08 - ease * .42 + Math.sin(idle * 1.7) * .025;
  const rotateY = -.12 + ease * 1.06 + (cursorX - .5) * .09;
  const rotateZ = -.46 + ease * .5 + Math.sin(idle) * .025;
  const scale = heroWidth * (mobileMotion ? .14 : .137) * (1 + ease * .2);
  const centerX = heroWidth * (.51 + (cursorX - .5) * .018);
  const centerY = heroHeight * (.51 - ease * .015 + (cursorY - .5) * .012);
  const flip = Math.floor(time / 230);

  context.font = `400 ${mobileMotion ? 7 : 8}px "DM Mono", monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const stageFade = sceneProgress > .9 ? (1 - sceneProgress) / .1 : 1;
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
