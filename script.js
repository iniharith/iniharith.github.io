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
const modelViewports = [...document.querySelectorAll('.section-model')];
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
const galleryModels = [];
const galleryFiles = ['lantern','dragon','logo','flower','hive','fish'];
let modelSpinDirection = 1;
let previousScrollY = window.scrollY;
const vertexShader = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const fragmentShader = `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uCell;
  uniform float uFade;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main(){
    vec2 cells=floor(uResolution/uCell);
    vec2 cell=floor(vUv*cells);
    vec2 sampleUv=(cell+.5)/cells;
    vec4 sceneSample=texture2D(tScene,sampleUv);
    if(sceneSample.a<.025){gl_FragColor=vec4(0.0);return;}
    float sourceLight=dot(sceneSample.rgb,vec3(.2126,.7152,.0722));
    float light=smoothstep(.04,.88,sourceLight);
    vec2 local=fract(vUv*cells);
    float bit=step(.5,fract(sin(dot(cell,vec2(12.9898,78.233))+floor(uTime*2.4))*43758.5453));
    vec2 glyphUv=vec2((local.x+bit)*.5,local.y);
    float glyph=texture2D(tGlyphs,glyphUv).r;
    gl_FragColor=vec4(uColor,glyph*mix(.58,1.0,light)*uFade);
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
  asciiMaterial.uniforms.uCell.value=6*ratio;
  sceneEnd=Math.max(1,aboutSection.offsetTop+aboutSection.offsetHeight);
}

function prepareModel(gltf,name){
  const root=new THREE.Group();
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  const center=bounds.getCenter(new THREE.Vector3());
  const size=bounds.getSize(new THREE.Vector3());
  gltf.scene.position.sub(center);
  root.add(gltf.scene);root.scale.setScalar((mobileMotion?2.65:3.2)/Math.max(size.x,size.y,size.z));root.visible=false;
  root.traverse((child)=>{if(child.isMesh){
    const materials=Array.isArray(child.material)?child.material:[child.material];
    materials.forEach((material)=>{material.side=THREE.DoubleSide;if(material.isMeshStandardMaterial){material.roughness=.52;material.metalness=.12;}material.needsUpdate=true;});
  }});
  const modelMixer=['flower','hive','fish'].includes(name)?new THREE.AnimationMixer(gltf.scene):null;
  let duration=1;
  if(modelMixer)gltf.animations.forEach((clip)=>{modelMixer.clipAction(clip).play();duration=Math.max(duration,clip.duration);});
  modelScene.add(root);
  galleryModels.push({name,root,model:gltf.scene,mixer:modelMixer,duration});
}

function initDragonfly(){
  renderer=new THREE.WebGLRenderer({canvas:heroCanvas,alpha:true,antialias:false,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  modelScene=new THREE.Scene();
  modelScene.add(new THREE.HemisphereLight(0xffffff,0x080808,.6));
  const keyLight=new THREE.DirectionalLight(0xffffff,4.2);keyLight.position.set(-4,6,7);modelScene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0xffffff,.75);fillLight.position.set(5,-2,4);modelScene.add(fillLight);
  const rimLight=new THREE.DirectionalLight(0xffffff,2.6);rimLight.position.set(3,4,-6);modelScene.add(rimLight);
  modelCamera=new THREE.PerspectiveCamera(mobileMotion?16:11,1,.1,1000);
  modelCamera.position.set(0,0,7);
  renderTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
  postScene=new THREE.Scene();postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  asciiMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{tScene:{value:renderTarget.texture},tGlyphs:{value:createGlyphTexture()},uResolution:{value:new THREE.Vector2()},uTime:{value:0},uCell:{value:9},uFade:{value:1},uColor:{value:new THREE.Color(0xffffff)}},vertexShader,fragmentShader});
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),asciiMaterial));
  const draco=new DRACOLoader();draco.setDecoderPath('assets/draco/');draco.setDecoderConfig({type:'wasm'});
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  loader.load('assets/models/dragonfly.glb',(gltf)=>{
    dragonfly=new THREE.Group();dragonflyMotion=new THREE.Group();dragonflyMotion.add(gltf.scene);dragonfly.add(dragonflyMotion);
    dragonfly.traverse((child)=>{if(child.isMesh){
      const materials=Array.isArray(child.material)?child.material:[child.material];
      materials.forEach((material)=>{material.side=THREE.DoubleSide;if(material.isMeshStandardMaterial){material.roughness=.52;material.metalness=.12;}material.needsUpdate=true;});
    }});
    modelScene.add(dragonfly);
    mixer=new THREE.AnimationMixer(gltf.scene);
    if(gltf.animations[0]){const action=mixer.clipAction(gltf.animations[0]);action.play();animationDuration=gltf.animations[0].duration;mixer.setTime(0);}
    backWingLeft=gltf.scene.getObjectByName('BackWing-L');backWingRight=gltf.scene.getObjectByName('BackWing-R');
    frontWingLeft=gltf.scene.getObjectByName('FrontWing-L');frontWingRight=gltf.scene.getObjectByName('FrontWing-R');
  },undefined,(error)=>console.error('Dragonfly model failed to load:',error));
  galleryFiles.forEach((name)=>loader.load(`assets/models/${name}.glb`,(gltf)=>prepareModel(gltf,name),undefined,(error)=>console.error(`${name} model failed to load:`,error)));
  resizeHero();
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resizeHero,120);},{passive:true});
}

function drawScene(time=0,delta=0){
  if(!renderer||!dragonfly)return;
  const inShowcase=modelViewports.some((viewport)=>{const rect=viewport.getBoundingClientRect();return rect.bottom>0&&rect.top<window.innerHeight;});
  heroCanvas.classList.toggle('is-showcase',inShowcase);
  if(inShowcase&&galleryModels.length){
    dragonfly.visible=false;
    if(window.scrollY!==previousScrollY)modelSpinDirection=window.scrollY>previousScrollY?1:-1;
    previousScrollY=window.scrollY;
    modelCamera.fov=27;modelCamera.position.set(0,0,8);modelCamera.lookAt(0,0,0);
    asciiMaterial.uniforms.uFade.value=1;asciiMaterial.uniforms.uTime.value=time*.001;
    renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.clear();
    modelViewports.forEach((viewport)=>{
      const rect=viewport.getBoundingClientRect();
      if(rect.bottom<=0||rect.top>=heroHeight)return;
      const entry=galleryModels.find((model)=>model.name===viewport.dataset.model);
      if(!entry)return;
      asciiMaterial.uniforms.uColor.value.set(['lantern','logo'].includes(entry.name)?0x000000:0xffffff);
      galleryModels.forEach((model)=>{model.root.visible=model===entry;});
      entry.root.rotation.y+=delta*.25*modelSpinDirection;
      entry.model.rotation.y=THREE.MathUtils.lerp(entry.model.rotation.y,window.scrollY*.005,.3);
      if(entry.mixer)entry.mixer.update(delta);
      const ratio=mobileMotion?1:Math.min(window.devicePixelRatio||1,1.5);
      const width=Math.max(1,Math.round(rect.width*ratio));const height=Math.max(1,Math.round(rect.height*ratio));
      renderTarget.setSize(width,height);modelCamera.aspect=width/height;modelCamera.updateProjectionMatrix();
      asciiMaterial.uniforms.uResolution.value.set(width,height);asciiMaterial.uniforms.uCell.value=(['dragon','flower','hive','fish'].includes(entry.name)?4:6)*ratio;
      renderer.setRenderTarget(renderTarget);renderer.clear();renderer.render(modelScene,modelCamera);
      renderer.setRenderTarget(null);renderer.setScissorTest(true);
      const bottom=heroHeight-rect.bottom;
      renderer.setViewport(rect.left,bottom,rect.width,rect.height);renderer.setScissor(rect.left,bottom,rect.width,rect.height);renderer.render(postScene,postCamera);
    });
    renderer.setScissorTest(false);
    return;
  }else{
    galleryModels.forEach((entry)=>{entry.root.visible=false;});
    dragonfly.visible=true;
  const ratio=mobileMotion?1:Math.min(window.devicePixelRatio||1,1.5);
  renderTarget.setSize(Math.max(1,heroWidth*ratio),Math.max(1,heroHeight*ratio));
  asciiMaterial.uniforms.uResolution.value.set(heroWidth*ratio,heroHeight*ratio);
  asciiMaterial.uniforms.uCell.value=6*ratio;
  asciiMaterial.uniforms.uColor.value.set(0xffffff);
  modelCamera.fov=mobileMotion?16:11;modelCamera.updateProjectionMatrix();
  const targetProgress=Math.min(1,Math.max(0,window.scrollY/Math.max(1,sceneEnd-window.innerHeight*.35)));
  sceneProgress+=(targetProgress-sceneProgress)*(mobileMotion?.14:.1);
  const ease=sceneProgress*sceneProgress*(3.-2.*sceneProgress);
  mixer.setTime(ease*animationDuration);
  const cameraFollow=dragonfly.getObjectByName('camera-follow');const cameraLookAt=dragonfly.getObjectByName('camera-lookAt');
  if(cameraFollow&&cameraLookAt){
    modelCamera.position.copy(cameraFollow.position);
    // The portfolio title occupies more of the frame than the reference page,
    // so move slightly toward the authored target while retaining its camera path.
    modelCamera.position.lerp(cameraLookAt.position,mobileMotion?.12:.16);
    modelCamera.lookAt(cameraLookAt.position);
  }
  dragonfly.position.y=!mobileMotion&&ease>.5?(ease-.5)*9:0;
  dragonflyMotion.rotation.y=THREE.MathUtils.lerp(dragonflyMotion.rotation.y,(cursorX-.5)*.0025,.1);
  dragonflyMotion.rotation.x=THREE.MathUtils.lerp(dragonflyMotion.rotation.x,-(cursorY-.5)*.0015,.1);
  wingPhase+=delta*(.5+19.5*(sceneProgress>.15?.85:0));
  const boost=sceneProgress>.15?.85:0;const angle=THREE.MathUtils.degToRad(42+boost*200);
  const back=Math.sin(wingPhase*(.1+boost))*angle*.3;const front=Math.sin(wingPhase*(.05+boost))*angle*.2;
  if(backWingLeft){backWingLeft.rotation.z=THREE.MathUtils.lerp(backWingLeft.rotation.z,front,.1);backWingRight.rotation.z=THREE.MathUtils.lerp(backWingRight.rotation.z,-front,.1);frontWingLeft.rotation.z=THREE.MathUtils.lerp(frontWingLeft.rotation.z,back*.8,.1);frontWingRight.rotation.z=THREE.MathUtils.lerp(frontWingRight.rotation.z,-back*.8,.1);}
  asciiMaterial.uniforms.uTime.value=time*.001;
  asciiMaterial.uniforms.uFade.value=sceneProgress>.9?Math.max(0,(1-sceneProgress)/.1):1;
  }
  asciiMaterial.uniforms.uTime.value=time*.001;
  renderer.setRenderTarget(renderTarget);renderer.clear();renderer.render(modelScene,modelCamera);
  renderer.setRenderTarget(null);renderer.clear();renderer.render(postScene,postCamera);
}

initDragonfly();

let previousTime=performance.now();
function loop(time) {
  if (lenis) lenis.raf(time);
  const delta=reduceMotion?0:Math.min(.05,(time-previousTime)/1000);previousTime=time;
  cursorX += (pointerX - cursorX) * 0.05;
  cursorY += (pointerY - cursorY) * 0.05;
  if (auroraGlobal) {
    auroraGlobal.style.transform = `translate3d(${(cursorX - 0.5) * -40}px, ${(cursorY - 0.5) * -40}px, 0)`;
  }
  if (renderer && !document.hidden) drawScene(time,delta);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
if (reduceMotion) {
  updateFluid();
} else {
  updateParallax();
  updateFluid();
}
