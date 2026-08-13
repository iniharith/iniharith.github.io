import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
let renderer = null;
let dragonfly = null;
let dragonflyMotion = null;
let mixer = null;
let animationDuration = 1;
let wingPhase = 0;
let backWingLeft = null;
let backWingRight = null;
let frontWingLeft = null;
let frontWingRight = null;
let renderTarget = null;
let asciiMaterial = null;
let modelScene = null;
let modelCamera = null;
let postScene = null;
let postCamera = null;
let heroWidth = window.innerWidth;
let heroHeight = window.innerHeight;
let sceneEnd = 1;
let sceneProgress = 0;
const vertexShader = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const fragmentShader = `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uCell;
  uniform float uFade;
  varying vec2 vUv;
  void main(){
    vec2 cells=floor(uResolution/uCell);
    vec2 cell=floor(vUv*cells);
    vec2 sampleUv=(cell+.5)/cells;
    float light=texture2D(tScene,sampleUv).r;
    if(light<.025){gl_FragColor=vec4(0.0);return;}
    vec2 local=fract(vUv*cells);
    float bit=step(.5,fract(sin(dot(cell,vec2(12.9898,78.233))+floor(uTime*2.4))*43758.5453));
    vec2 glyphUv=vec2((local.x+bit)*.5,local.y);
    float glyph=texture2D(tGlyphs,glyphUv).r;
    float spark=step(.985,fract(sin(dot(cell,vec2(39.346,11.135))+floor(uTime*3.0))*24634.634));
    vec3 paper=vec3(.945,.941,.918);
    vec3 acid=vec3(.78,1.0,.086);
    vec3 color=mix(paper,acid,spark);
    gl_FragColor=vec4(color,glyph*light*uFade);
  }
`;

function createGlyphTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=64;
  const glyphContext=canvas.getContext('2d');
  glyphContext.fillStyle='#000';glyphContext.fillRect(0,0,128,64);
  glyphContext.fillStyle='#fff';glyphContext.font='500 52px "DM Mono",monospace';
  glyphContext.textAlign='center';glyphContext.textBaseline='middle';
  glyphContext.fillText('0',32,34);glyphContext.fillText('1',96,34);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.NoColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  return texture;
}

function resizeHero(){
  if(!renderer)return;
  heroWidth=window.innerWidth;heroHeight=window.innerHeight;
  const ratio=mobileMotion?1:Math.min(window.devicePixelRatio||1,1.5);
  renderer.setPixelRatio(ratio);renderer.setSize(heroWidth,heroHeight,false);
  renderTarget.setSize(Math.max(1,heroWidth*ratio),Math.max(1,heroHeight*ratio));
  modelCamera.aspect=heroWidth/heroHeight;modelCamera.updateProjectionMatrix();
  asciiMaterial.uniforms.uResolution.value.set(heroWidth*ratio,heroHeight*ratio);
  asciiMaterial.uniforms.uCell.value=(mobileMotion?8:9)*ratio;
  sceneEnd=Math.max(1,aboutSection.offsetTop+aboutSection.offsetHeight);
}

function initDragonfly(){
  renderer=new THREE.WebGLRenderer({canvas:heroCanvas,alpha:true,antialias:false,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  modelScene=new THREE.Scene();
  modelCamera=new THREE.PerspectiveCamera(mobileMotion?34:28,1,.1,1000);
  modelCamera.position.set(0,0,7);
  renderTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
  postScene=new THREE.Scene();postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  asciiMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{tScene:{value:renderTarget.texture},tGlyphs:{value:createGlyphTexture()},uResolution:{value:new THREE.Vector2()},uTime:{value:0},uCell:{value:9},uFade:{value:1}},vertexShader,fragmentShader});
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),asciiMaterial));
  const draco=new DRACOLoader();draco.setDecoderPath('assets/draco/');draco.setDecoderConfig({type:'wasm'});
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  loader.load('assets/models/dragonfly.glb',(gltf)=>{
    dragonfly=new THREE.Group();dragonflyMotion=new THREE.Group();dragonflyMotion.add(gltf.scene);dragonfly.add(dragonflyMotion);
    dragonfly.traverse((child)=>{if(child.isMesh){child.material=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});}});
    modelScene.add(dragonfly);
    mixer=new THREE.AnimationMixer(gltf.scene);
    if(gltf.animations[0]){const action=mixer.clipAction(gltf.animations[0]);action.play();animationDuration=gltf.animations[0].duration;mixer.setTime(0);}
    backWingLeft=gltf.scene.getObjectByName('BackWing-L');backWingRight=gltf.scene.getObjectByName('BackWing-R');
    frontWingLeft=gltf.scene.getObjectByName('FrontWing-L');frontWingRight=gltf.scene.getObjectByName('FrontWing-R');
  },undefined,(error)=>console.error('Dragonfly model failed to load:',error));
  resizeHero();
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resizeHero,120);},{passive:true});
}

function drawScene(time=0,delta=0){
  if(!renderer||!dragonfly)return;
  const targetProgress=Math.min(1,Math.max(0,window.scrollY/Math.max(1,sceneEnd-window.innerHeight*.35)));
  sceneProgress+=(targetProgress-sceneProgress)*(mobileMotion?.14:.1);
  const ease=sceneProgress*sceneProgress*(3.-2.*sceneProgress);
  mixer.setTime(ease*animationDuration);
  const cameraFollow=dragonfly.getObjectByName('camera-follow');const cameraLookAt=dragonfly.getObjectByName('camera-lookAt');
  if(cameraFollow&&cameraLookAt){modelCamera.position.copy(cameraFollow.position);modelCamera.lookAt(cameraLookAt.position);}
  dragonfly.position.y=!mobileMotion&&ease>.5?(ease-.5)*9:0;
  dragonflyMotion.rotation.y=THREE.MathUtils.lerp(dragonflyMotion.rotation.y,(cursorX-.5)*.0025,.1);
  dragonflyMotion.rotation.x=THREE.MathUtils.lerp(dragonflyMotion.rotation.x,-(cursorY-.5)*.0015,.1);
  wingPhase+=delta*(.5+19.5*(sceneProgress>.15?.85:0));
  const boost=sceneProgress>.15?.85:0;const angle=THREE.MathUtils.degToRad(42+boost*200);
  const back=Math.sin(wingPhase*(.1+boost))*angle*.3;const front=Math.sin(wingPhase*(.05+boost))*angle*.2;
  if(backWingLeft){backWingLeft.rotation.z=THREE.MathUtils.lerp(backWingLeft.rotation.z,front,.1);backWingRight.rotation.z=THREE.MathUtils.lerp(backWingRight.rotation.z,-front,.1);frontWingLeft.rotation.z=THREE.MathUtils.lerp(frontWingLeft.rotation.z,back*.8,.1);frontWingRight.rotation.z=THREE.MathUtils.lerp(frontWingRight.rotation.z,-back*.8,.1);}
  asciiMaterial.uniforms.uTime.value=time*.001;
  asciiMaterial.uniforms.uFade.value=sceneProgress>.9?Math.max(0,(1-sceneProgress)/.1):1;
  renderer.setRenderTarget(renderTarget);renderer.clear();renderer.render(modelScene,modelCamera);
  renderer.setRenderTarget(null);renderer.clear();renderer.render(postScene,postCamera);
}

initDragonfly();

let previousTime=performance.now();
function loop(time) {
  if (lenis) lenis.raf(time);
  const delta=Math.min(.05,(time-previousTime)/1000);previousTime=time;
  cursorX += (pointerX - cursorX) * 0.05;
  cursorY += (pointerY - cursorY) * 0.05;
  if (auroraGlobal) {
    auroraGlobal.style.transform = `translate3d(${(cursorX - 0.5) * -40}px, ${(cursorY - 0.5) * -40}px, 0)`;
  }
  if (renderer && !document.hidden) drawScene(time,delta);
  requestAnimationFrame(loop);
}

if (reduceMotion) {
  requestAnimationFrame((time)=>drawScene(time,0));
  updateFluid();
} else {
  requestAnimationFrame(loop);
  updateParallax();
  updateFluid();
}
