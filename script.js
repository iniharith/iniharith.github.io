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
  const spanSteps = mobileMotion ? 36 : 44;
  const chordSteps = mobileMotion ? 10 : 13;

  // Dense wing membranes built from a fine halftone mesh so the silhouette
  // reads as a soft dot-matrix render rather than a sparse wireframe.
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
          const jitter = (Math.random() - .5) * .02;
          const x = side * (.18 + span * wing.length) + jitter;
          const y = wing.root + span * wing.sweep + Math.sin(span * Math.PI) * wing.curve + chord;
          const z = Math.sin(span * Math.PI) * (wingIndex ? -.08 : .1) + chord * .12;
          const edgeFade = 1 - Math.abs(row / rows);
          addDragonflyPoint(x, y, z, .22 + edgeFade * .58);
          // Fine venation dust doubles local density along the leading edge,
          // echoing the grainy halftone texture of the reference scene. Kept
          // on mobile too (at a lower rate) since the reference is just as
          // grainy on a phone screen — only frame rate governs the split.
          if (Math.random() < (mobileMotion ? .22 : .35)) {
            addDragonflyPoint(x + jitter, y + (Math.random() - .5) * .05, z, .1 + edgeFade * .3);
          }
        }
      }
    });
  });

  // Ringed thorax and long segmented abdomen.
  const bodySegments = mobileMotion ? 56 : 66;
  const ringPoints = mobileMotion ? 11 : 13;
  for (let segment = 0; segment < bodySegments; segment += 1) {
    const t = segment / (bodySegments - 1);
    const y = -1 + t * 4.45;
    const radius = t < .3 ? .24 + Math.sin(t / .3 * Math.PI) * .28 : Math.max(.035, .18 * (1 - (t - .3) / .7));
    for (let ring = 0; ring < ringPoints; ring += 1) {
      const angle = ring / ringPoints * Math.PI * 2;
      addDragonflyPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, .5 + (ring % 3) * .18);
    }
  }

  const headRings = mobileMotion ? 7 : 8;
  for (let ring = 0; ring < headRings; ring += 1) {
    const latitude = (ring / (headRings - 1) - .5) * Math.PI;
    const radius = Math.cos(latitude) * .34;
    const y = -1.28 + Math.sin(latitude) * .28;
    const points = mobileMotion ? 11 : 14;
    for (let index = 0; index < points; index += 1) {
      const angle = index / points * Math.PI * 2;
      addDragonflyPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, .74);
    }
  }

  // Sparse diagonal trail echoes the reference scene without obscuring the insect.
  const trailCount = mobileMotion ? 65 : 90;
  for (let index = 0; index < trailCount; index += 1) {
    const t = index / trailCount;
    addDragonflyPoint(-3.6 + t * 7.2, -2.4 + t * 4.8, -.55, .05 + t * .18);
  }
}

function resizeHero() {
  const ratio = mobileMotion ? Math.min(window.devicePixelRatio || 1, 1.4) : Math.min(window.devicePixelRatio || 1, 1.5);
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

  // A bell-shaped "crop in" pass through the middle of the scroll range pushes
  // the mesh in tight on the wing joints before pulling back out, matching the
  // close-up-then-reveal rhythm of the reference scene.
  const zoomWindow = Math.min(1, Math.max(0, (sceneProgress - .22) / .5));
  const zoomBump = Math.sin(zoomWindow * Math.PI);

  const rotateX = .08 - ease * .42 + Math.sin(idle * 1.7) * .025;
  const rotateY = -.12 + ease * 1.12 + zoomBump * .18 + (cursorX - .5) * .09;
  const rotateZ = -.46 + ease * .5 + Math.sin(idle) * .025;
  // Mobile viewports are narrow and tall, so the mesh needs a bigger base
  // scale relative to width to fill the portrait frame the way it does on
  // the reference site's phone screenshots.
  const scale = heroWidth * (mobileMotion ? .21 : .137) * (1 + ease * .2 + zoomBump * 1.35);
  const centerX = heroWidth * (.51 + (cursorX - .5) * .018);
  const centerY = heroHeight * (.51 - ease * .015 - zoomBump * .2 + (cursorY - .5) * .012);
  const flip = Math.floor(time / 230);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const stageFade = sceneProgress > .9 ? (1 - sceneProgress) / .1 : 1;
  const baseGlyphSize = mobileMotion ? 6.5 : 7.5;
  let currentFontKey = '';

  dragonflyPoints.forEach((point, index) => {
    const rotated = rotatePoint(point, rotateX, rotateY, rotateZ);
    const perspective = 1 / Math.max(.6, 1 + rotated.z * .12);
    const x = centerX + rotated.x * scale * perspective;
    const y = centerY + rotated.y * scale * perspective;
    if (x < -12 || x > heroWidth + 12 || y < -12 || y > heroHeight + 12) return;
    const flicker = .68 + Math.sin(time * .002 + index * .73) * .32;
    const depth = Math.max(.16, Math.min(1, .74 - rotated.z * .16));

    // Depth grades both glyph size and character weight so nearer dots read
    // as bold "0"/"O" marks and distant ones fade to fine "."/":" grain —
    // the halftone dot-matrix look of the reference, in this site's own mono font.
    let glyph;
    if (depth > .82) glyph = flicker > .5 ? '0' : 'O';
    else if (depth > .6) glyph = flicker > .5 ? 'o' : 'v';
    else if (depth > .4) glyph = flicker > .5 ? ':' : '.';
    else glyph = '.';
    const glyphSize = Math.max(3, baseGlyphSize * (.45 + depth * .95) * perspective);
    const fontKey = Math.round(glyphSize * 2);
    if (fontKey !== currentFontKey) {
      context.font = `400 ${(fontKey / 2).toFixed(1)}px "DM Mono", monospace`;
      currentFontKey = fontKey;
    }

    context.globalAlpha = point.alpha * flicker * depth * stageFade;
    context.fillStyle = index % 53 === flip % 53 ? '#c7ff16' : 'rgba(241,240,234,.92)';
    context.fillText(glyph, x, y);
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
