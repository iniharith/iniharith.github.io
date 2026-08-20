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
const heroSection = document.querySelector('#home');

let pointerX = 0.5;
let pointerY = 0.5;
let cursorX = 0.5;
let cursorY = 0.5;
let heroActive = false;

window.addEventListener('pointermove', (event) => {
  pointerX = event.clientX / window.innerWidth;
  pointerY = event.clientY / window.innerHeight;
  const heroRect=heroSection.getBoundingClientRect();
  heroActive=event.clientY>=heroRect.top&&event.clientY<=heroRect.bottom;
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
const gallerySettings = {
  lantern:{size:1024,z:100,cell:6,animate:false},dragon:{size:1024,z:42,y:0,cell:6,animate:false},
  flower:{size:512,z:10,cell:6,animate:true},hive:{size:512,z:35,cell:6,animate:true},
  fish:{size:512,z:11,cell:6,animate:true},logo:{size:512,z:13,cell:6,animate:false}
};
let modelSpinDirection = 1;
let previousScrollY = window.scrollY;
let activeModel = '';
const vertexShader = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const modelVertexShader = `
  #include <common>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  varying vec3 vNormal;varying vec3 vPosition;
  void main(){
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    vNormal=normalize(normalMatrix*objectNormal);
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);vPosition=mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;
  }
`;
const modelFragmentShader = `
  precision highp float;uniform vec3 uRemapColor;uniform vec3 uLightDir;uniform float uBrightness;uniform float uNormalStrength;varying vec3 vNormal;varying vec3 vPosition;
  void main(){vec3 normal=normalize(vNormal);float diff=max(dot(normal,normalize(uLightDir)),0.0);vec3 color=diff*uBrightness+normal*uNormalStrength+.5;color=clamp(color,.15,.995)*uRemapColor;gl_FragColor=vec4(color,1.0);}
`;
const fragmentShader = `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uCell;
  uniform float uFade;
  uniform vec3 uColor;
  uniform float uBlack;
  uniform float uGlyphFloor;
  uniform float uLuminanceBoost;
  varying vec2 vUv;
  void main(){
    vec2 division=uResolution/uCell;vec2 d=1.0/division;vec2 pixelizedUV=d*(floor(vUv/d)+.5);
    vec4 pixelizedColor=texture2D(tScene,pixelizedUV);float gray=clamp(dot(pixelizedColor.rgb,vec3(.299,.587,.114))*uLuminanceBoost,0.0,1.0);
    float charIndex=floor(gray*14.0);float charX=mod(charIndex,16.0);
    vec2 local=fract(vUv*division);vec2 charUV=(vec2(charX,0.0)+vec2(local.x,1.0-local.y))/16.0;
    float glyph=texture2D(tGlyphs,charUV).r;
    float alpha=mix(pixelizedColor.a,glyph*max(gray,.38)*pixelizedColor.a,uBlack)*uFade;
    gl_FragColor=vec4(uColor*glyph*max(gray,uGlyphFloor),alpha);
  }
`;

function createGlyphTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=1024;
  const glyphContext=canvas.getContext('2d');
  const characters=' * _<>,  ./O#SF +';
  glyphContext.clearRect(0,0,1024,1024);glyphContext.fillStyle='#fff';glyphContext.font='72px monospace';
  glyphContext.textAlign='center';glyphContext.textBaseline='middle';
  for(let row=0;row<16;row++){
    [...characters].slice(0,16).forEach((character,index)=>glyphContext.fillText(character,index*64+32,row*64+32));
  }
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

function createModelMaterial(name){
  const branch=name==='branch';const logo=name==='logo';const bright=['flower','fish','hive','dragon'].includes(name);
  const remap=branch?new THREE.Vector3(.35,.35,.35):logo?new THREE.Vector3(.9,.9,.9):mobileMotion?new THREE.Vector3(.82,.98,.98):new THREE.Vector3(.69,.9,.9);
  const brightness=logo?1:branch?.5:bright?1:mobileMotion?.42:.2;
  const normalStrength=branch?1.5:bright?2:mobileMotion?.62:.5;
  return new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{uRemapColor:{value:remap},uLightDir:{value:branch?new THREE.Vector3(0,.8,1):new THREE.Vector3(0,2,1)},uBrightness:{value:brightness},uNormalStrength:{value:normalStrength}},vertexShader:modelVertexShader,fragmentShader:modelFragmentShader});
}

function prepareModel(gltf,name){
  const settings=gallerySettings[name];const scene=new THREE.Scene();const root=new THREE.Group();root.add(gltf.scene);scene.add(root);
  const material=createModelMaterial(name);gltf.scene.traverse((child)=>{if(child.isMesh)child.material=material;});
  const camera=new THREE.PerspectiveCamera(27,1,.1,1000);
  const renderTarget=new THREE.WebGLRenderTarget(settings.size,settings.size,{depthBuffer:true,stencilBuffer:false});
  const modelMixer=settings.animate?new THREE.AnimationMixer(gltf.scene):null;
  if(modelMixer){
    gltf.animations.forEach((clip)=>{const action=modelMixer.clipAction(clip);action.setLoop(THREE.LoopRepeat,Infinity);action.play();});
    modelMixer.setTime(0);
  }
  camera.position.set(0,settings.y||0,settings.z);
  galleryModels.push({name,scene,root,camera,mixer:modelMixer,target:renderTarget,settings});
}

function initDragonfly(){
  renderer=new THREE.WebGLRenderer({canvas:heroCanvas,alpha:true,antialias:false,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  modelScene=new THREE.Scene();
  modelCamera=new THREE.PerspectiveCamera(mobileMotion?16:11,1,.1,1000);
  modelCamera.position.set(0,0,7);
  renderTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
  postScene=new THREE.Scene();postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  asciiMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{tScene:{value:renderTarget.texture},tGlyphs:{value:createGlyphTexture()},uResolution:{value:new THREE.Vector2()},uTime:{value:0},uCell:{value:9},uFade:{value:1},uColor:{value:new THREE.Color(0xffffff)},uBlack:{value:0},uGlyphFloor:{value:mobileMotion?.88:.72},uLuminanceBoost:{value:mobileMotion?1.5:1}},vertexShader,fragmentShader});
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),asciiMaterial));
  const draco=new DRACOLoader();draco.setDecoderPath('assets/draco/');draco.setDecoderConfig({type:'wasm'});
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  loader.load('assets/models/dragonfly.glb',(gltf)=>{
    dragonfly=new THREE.Group();dragonflyMotion=new THREE.Group();dragonflyMotion.add(gltf.scene);dragonfly.add(dragonflyMotion);
    const dragonflyMaterial=createModelMaterial('dragonfly');
    dragonfly.traverse((child)=>{if(child.isMesh)child.material=dragonflyMaterial;});
    const branch=gltf.scene.getObjectByName('Branch002');
    if(branch)branch.traverse((child)=>{if(child.isMesh)child.material=createModelMaterial('branch');});
    modelScene.add(dragonfly);
    mixer=new THREE.AnimationMixer(gltf.scene);
    if(gltf.animations[0]){const action=mixer.clipAction(gltf.animations[0]);action.play();animationDuration=gltf.animations[0].duration;mixer.setTime(0);}
    backWingLeft=gltf.scene.getObjectByName('BackWing-L');backWingRight=gltf.scene.getObjectByName('BackWing-R');
    frontWingLeft=gltf.scene.getObjectByName('FrontWing-L');frontWingRight=gltf.scene.getObjectByName('FrontWing-R');
  },undefined,(error)=>console.error('Dragonfly model failed to load:',error));
  galleryFiles.forEach((name)=>loader.load(`assets/models/${name}.glb`,(gltf)=>prepareModel(gltf,name),undefined,(error)=>console.error(`${name} model failed to load:`,error)));
  resizeHero();
  modelViewports.forEach((viewport)=>{
    viewport.addEventListener('pointerenter',()=>{activeModel=viewport.dataset.model;});
    viewport.addEventListener('pointerleave',()=>{if(activeModel===viewport.dataset.model)activeModel='';});
    viewport.addEventListener('pointerdown',()=>{activeModel=viewport.dataset.model;});
    viewport.addEventListener('pointerup',()=>{if(activeModel===viewport.dataset.model)activeModel='';});
  });
  heroSection.addEventListener('pointerenter',()=>{heroActive=true;});
  heroSection.addEventListener('pointerleave',()=>{heroActive=false;});
  heroSection.addEventListener('pointerdown',()=>{heroActive=true;});
  heroSection.addEventListener('pointerup',()=>{heroActive=false;});
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
    asciiMaterial.uniforms.uFade.value=1;asciiMaterial.uniforms.uTime.value=time*.001;
    renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.clear();
    modelViewports.forEach((viewport)=>{
      const rect=viewport.getBoundingClientRect();
      if(rect.bottom<=0||rect.top>=heroHeight)return;
      const entry=galleryModels.find((model)=>model.name===viewport.dataset.model);
      if(!entry)return;
      const black=['lantern','logo'].includes(entry.name);const bright=['flower','fish','hive','dragon'].includes(entry.name);
      asciiMaterial.uniforms.uColor.value.set(activeModel===entry.name?0xc7ff16:black?0x000000:0xffffff);asciiMaterial.uniforms.uBlack.value=black&&activeModel!==entry.name?1:0;
      asciiMaterial.uniforms.uLuminanceBoost.value=bright?2.4:mobileMotion?1.5:1;
      asciiMaterial.uniforms.uGlyphFloor.value=bright?.6:mobileMotion?.88:.72;
      if(entry.settings.spin!==false)entry.scene.rotation.y+=delta*.25*modelSpinDirection;
      entry.root.rotation.y=THREE.MathUtils.lerp(entry.root.rotation.y,window.scrollY*.005,.3);
      if(entry.mixer)entry.mixer.update(delta);
      const ratio=mobileMotion?1:Math.min(window.devicePixelRatio||1,1.5);
      const width=Math.max(1,Math.round(rect.width*ratio));const height=Math.max(1,Math.round(rect.height*ratio));
      entry.camera.aspect=1;entry.camera.updateProjectionMatrix();
      asciiMaterial.uniforms.tScene.value=entry.target.texture;asciiMaterial.uniforms.uResolution.value.set(width,height);asciiMaterial.uniforms.uCell.value=(mobileMotion?Math.max(3,entry.settings.cell-1):entry.settings.cell)*ratio;
      renderer.setRenderTarget(entry.target);renderer.clear();renderer.render(entry.scene,entry.camera);
      renderer.setRenderTarget(null);renderer.setScissorTest(true);
      const bottom=heroHeight-rect.bottom;
      renderer.setViewport(rect.left,bottom,rect.width,rect.height);renderer.setScissor(rect.left,bottom,rect.width,rect.height);renderer.render(postScene,postCamera);
    });
    renderer.setScissorTest(false);
    return;
  }else{
    dragonfly.visible=true;
  const ratio=mobileMotion?1:Math.min(window.devicePixelRatio||1,1.5);
  renderTarget.setSize(Math.max(1,heroWidth*ratio),Math.max(1,heroHeight*ratio));
  asciiMaterial.uniforms.uResolution.value.set(heroWidth*ratio,heroHeight*ratio);
  asciiMaterial.uniforms.tScene.value=renderTarget.texture;
  asciiMaterial.uniforms.uCell.value=6*ratio;
  asciiMaterial.uniforms.uColor.value.set(heroActive?0xc7ff16:0xffffff);
  asciiMaterial.uniforms.uBlack.value=0;
  asciiMaterial.uniforms.uLuminanceBoost.value=mobileMotion?1.5:1;
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
    modelCamera.position.x+=(cursorX-.5)*(mobileMotion?.08:.16);
    modelCamera.position.y-=(cursorY-.5)*(mobileMotion?.06:.12);
    modelCamera.lookAt(cameraLookAt.position);
  }
  dragonfly.position.y=!mobileMotion&&ease>.5?(ease-.5)*9:0;
  dragonflyMotion.rotation.y=THREE.MathUtils.lerp(dragonflyMotion.rotation.y,(cursorX-.5)*.0025,.1);
  dragonflyMotion.rotation.x=THREE.MathUtils.lerp(dragonflyMotion.rotation.x,-(cursorY-.5)*.0015,.1);
  wingPhase+=delta*(.5+19.5*(sceneProgress>.15?.85:.025));
  const boost=sceneProgress>.15?.85:.025;const angle=THREE.MathUtils.degToRad(42+boost*200);
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

const galleryData = {
  'apparel': {
    title: 'APPAREL — BAJU NEGERI COLLECTION',
    images: [
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (FRONT) SELANGOR.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (BACK) SELANGOR.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (FRONT) JOHOR.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (BACK) JOHOR.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (FRONT) SABAH.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (BACK) SABAH.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (FRONT) SARAWAK.webp',
      'assets/design/apparel/ROUND NECK SHORT SLEEVE (BACK) SARAWAK.webp'
    ]
  },
  'kampung-cetak': {
    title: 'KAMPUNG CETAK — PRODUCT CATALOG',
    images: [
      'assets/design/kampung-cetak/COTTON TSHIRT.webp',
      'assets/design/kampung-cetak/CANVAS BAG.webp',
      'assets/design/kampung-cetak/FRIDGE MAGNET.webp',
      'assets/design/kampung-cetak/NON WOVEN BAG.webp',
      'assets/design/kampung-cetak/PORTRAIT.webp',
      'assets/design/kampung-cetak/SUBLIMATION TSHIRT.webp',
      'assets/design/kampung-cetak/ACRYLIC KEYCHAIN.webp',
      'assets/design/kampung-cetak/ACRYLIC TROPHY.webp',
      'assets/design/kampung-cetak/BANNER.webp',
      'assets/design/kampung-cetak/BOARD PRINTING.webp',
      'assets/design/kampung-cetak/BOOKLET.webp',
      'assets/design/kampung-cetak/BUNTING.webp',
      'assets/design/kampung-cetak/BUSINESS CARD.webp',
      'assets/design/kampung-cetak/CALENDAR.webp',
      'assets/design/kampung-cetak/CAR STICKER.webp',
      'assets/design/kampung-cetak/CERTIFICATE.webp',
      'assets/design/kampung-cetak/CORPORATE FOLDER.webp',
      'assets/design/kampung-cetak/CRYSTAL PLAQUE TROPHY.webp',
      'assets/design/kampung-cetak/FLYERS.webp',
      'assets/design/kampung-cetak/GLASS STICKER.webp',
      'assets/design/kampung-cetak/HUMAN STANDEE.webp',
      'assets/design/kampung-cetak/LANDYARD.webp',
      'assets/design/kampung-cetak/MINI X STAND.webp',
      'assets/design/kampung-cetak/MONEY PACKET.webp',
      'assets/design/kampung-cetak/MUG.webp',
      'assets/design/kampung-cetak/NOTEBOOK.webp',
      'assets/design/kampung-cetak/PAPER BAG.webp',
      'assets/design/kampung-cetak/PEN.webp',
      'assets/design/kampung-cetak/PERSONALISED FLAG.webp',
      'assets/design/kampung-cetak/POPUP.webp',
      'assets/design/kampung-cetak/PREMIUM GIFT.webp',
      'assets/design/kampung-cetak/ROLL UP STAND.webp',
      'assets/design/kampung-cetak/STAMP.webp',
      'assets/design/kampung-cetak/STICKER.webp',
      'assets/design/kampung-cetak/TRIPOD STAND.webp',
      'assets/design/kampung-cetak/WALL STICKER.webp',
      'assets/design/kampung-cetak/WATER BAG.webp',
      'assets/design/kampung-cetak/WIND FLAG.webp'
    ]
  },
  'nothing-lyrics': {
    title: 'NOTHING LYRICS — ANDROID APP',
    images: [
      'assets/design/nothing-lyrics/main_screen.webp',
      'assets/design/nothing-lyrics/aod_screen.webp',
      'assets/design/nothing-lyrics/widget_home.webp',
      'assets/design/nothing-lyrics/widget_pin_dialog.webp'
    ]
  },
  'nothing-player': {
    title: 'NOTHING PLAYER — ANDROID APP',
    images: [
      'assets/design/nothing-player/01.webp',
      'assets/design/nothing-player/02.webp',
      'assets/design/nothing-player/03.webp',
      'assets/design/nothing-player/04.webp',
      'assets/design/nothing-player/05.webp',
      'assets/design/nothing-player/06.webp',
      'assets/design/nothing-player/07.webp',
      'assets/design/nothing-player/08.webp',
      'assets/design/nothing-player/09.webp',
      'assets/design/nothing-player/10.webp',
      'assets/design/nothing-player/11.webp',
      'assets/design/nothing-player/12.webp',
      'assets/design/nothing-player/13.webp',
      'assets/design/nothing-player/14.webp',
      'assets/design/nothing-player/15.webp',
      'assets/design/nothing-player/16.webp',
      'assets/design/nothing-player/17.webp'
    ]
  }
};

const galleryOverlay = document.getElementById('gallery-overlay');
const galleryTrack = galleryOverlay.querySelector('.gallery-track');
const galleryTitle = galleryOverlay.querySelector('.gallery-title');
const galleryCount = galleryOverlay.querySelector('.gallery-count');
const galleryClose = galleryOverlay.querySelector('.gallery-close');
const galleryLeft = galleryOverlay.querySelector('.gallery-arrow-left');
const galleryRight = galleryOverlay.querySelector('.gallery-arrow-right');

function openGallery(key) {
  const data = galleryData[key];
  if (!data) return;
  galleryTitle.textContent = data.title;
  galleryCount.textContent = data.images.length + ' IMAGES';
  galleryTrack.innerHTML = '';
  data.images.forEach((src) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = src;
    img.alt = data.title;
    img.loading = 'lazy';
    item.appendChild(img);
    galleryTrack.appendChild(item);
  });
  galleryOverlay.setAttribute('aria-hidden', 'false');
  galleryOverlay.removeAttribute('inert');
  galleryOverlay.classList.add('is-open');
  document.body.classList.add('menu-open');
  galleryTrack.scrollLeft = 0;
}

function closeGallery() {
  galleryOverlay.classList.remove('is-open');
  galleryOverlay.setAttribute('aria-hidden', 'true');
  galleryOverlay.setAttribute('inert', '');
  document.body.classList.remove('menu-open');
}

document.querySelectorAll('.mockup-card[data-gallery]').forEach((card) => {
  const handler = () => openGallery(card.dataset.gallery);
  card.addEventListener('click', handler);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
});

galleryClose.addEventListener('click', closeGallery);
galleryOverlay.querySelector('.gallery-backdrop').addEventListener('click', closeGallery);
document.addEventListener('keydown', (e) => {
  if (!galleryOverlay.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeGallery();
  if (e.key === 'ArrowRight') galleryTrack.scrollBy({ left: 400, behavior: 'smooth' });
  if (e.key === 'ArrowLeft') galleryTrack.scrollBy({ left: -400, behavior: 'smooth' });
});
galleryLeft.addEventListener('click', () => galleryTrack.scrollBy({ left: -400, behavior: 'smooth' }));
galleryRight.addEventListener('click', () => galleryTrack.scrollBy({ left: 400, behavior: 'smooth' }));

requestAnimationFrame(loop);
if (reduceMotion) {
  updateFluid();
} else {
  updateParallax();
  updateFluid();
}
