import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sceneOrder, scenes } from './scenes/registry.js';

const stage = document.getElementById('stage');
const loader = document.getElementById('loader');
const autoRotateButton = document.getElementById('auto-rotate');
const resetButton = document.getElementById('reset-view');
const sceneFade = document.getElementById('scene-fade');
const tabButtons = Array.from(document.querySelectorAll('.scene-tab'));
const brandSeal = document.querySelector('.seal');
const brandTitle = document.querySelector('.brand h1');
const brandEn = document.querySelector('.brand-en');
const captionText = document.querySelector('.caption p');
const captionSmall = document.querySelector('.caption small');
const metaTheme = document.querySelector('meta[name="theme-color"]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
} catch (error) {
  const title = loader.querySelector('h2');
  const caption = loader.querySelector('p');
  if (title) title.textContent = '未能载入';
  if (caption) caption.textContent = '当前浏览器无法创建 WebGL 场景，请开启硬件加速后重试。';
  console.error(error);
  throw error;
}

function getPixelRatio() {
  const cap = window.innerWidth < 760 ? 1.75 : 2;
  return Math.min(window.devicePixelRatio || 1, cap);
}

renderer.setPixelRatio(getPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.domElement.setAttribute('tabindex', '0');
stage.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);
// The lantern glow sprite in the angler scene lives on layer 1 so it stays out of the mirror pass.
camera.layers.enable(1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.78;

const worlds = {};
sceneOrder.forEach((id) => {
  worlds[id] = scenes[id].createWorld(renderer);
});

function readHash() {
  const id = window.location.hash.replace('#', '');
  return scenes[id] ? id : null;
}

const initialId = readHash();
let activeId = initialId || 'tinglan';
let pendingId = activeId;
let activeWorld = worlds[activeId];
let switchToken = 0;
const stillMode = new URLSearchParams(window.location.search).get('still') === '1';
let autoRotateEnabled = !prefersReducedMotion && !stillMode;
document.body.classList.toggle('is-still', stillMode);
let pauseUntil = 0;
let hasInteracted = false;
let tween = null;
let loadingFinished = false;

if (!initialId) {
  window.history.replaceState(null, '', `#${activeId}`);
}

function getDefaultPose(aspect = camera.aspect) {
  const scene = scenes[activeId];
  const target = new THREE.Vector3(...scene.target);
  const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const widthHalf = aspect < 0.85 ? scene.fit.mobileWidth : scene.fit.width;
  const distanceForHeight = scene.fit.height / Math.tan(halfFov);
  const distanceForWidth = widthHalf / (Math.tan(halfFov) * aspect);
  const distance = Math.max(distanceForHeight, distanceForWidth) * 1.03;
  const direction = new THREE.Vector3(...scene.direction).normalize();
  const position = target.clone().addScaledVector(direction, distance);
  return { target, position };
}

function setPose(pose) {
  camera.position.copy(pose.position);
  controls.target.copy(pose.target);
  camera.lookAt(pose.target);
  controls.update();
}

function setAutoRotate(enabled) {
  autoRotateEnabled = enabled;
  autoRotateButton.classList.toggle('is-active', enabled);
  autoRotateButton.setAttribute('aria-pressed', String(enabled));
  if (enabled) pauseUntil = 0;
}

function updateTabState() {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.scene === activeId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
}

function updateSceneCopy() {
  const scene = scenes[activeId];
  const sealSpans = brandSeal.querySelectorAll('span');
  sealSpans.forEach((span, index) => {
    span.textContent = scene.seal[index] || '';
  });
  brandTitle.textContent = scene.title;
  brandEn.textContent = scene.en;
  captionText.textContent = scene.caption;
  captionSmall.textContent = scene.captionSmall;
  renderer.domElement.setAttribute('aria-label', scene.aria);
  document.title = `${scene.title} · 江南双景`;
  metaTheme.setAttribute('content', scene.theme);
  document.body.dataset.scene = activeId;
}

function activateScene(id) {
  if (!scenes[id]) return;
  activeId = id;
  pendingId = id;
  activeWorld = worlds[id];
  const scene = scenes[id];

  camera.fov = scene.fov;
  camera.updateProjectionMatrix();
  renderer.toneMappingExposure = scene.exposure;

  controls.minDistance = scene.minDistance;
  controls.maxDistance = scene.maxDistance;
  controls.minPolarAngle = scene.minPolar;
  controls.maxPolarAngle = Math.PI * scene.maxPolarFactor;
  controls.autoRotateSpeed = scene.autoRotateSpeed;

  updateSceneCopy();
  updateTabState();

  tween = null;
  controls.enabled = true;
  hasInteracted = false;
  pauseUntil = performance.now() + 1200;
  setPose(getDefaultPose(camera.aspect));
}

function switchTo(id, { fade = true } = {}) {
  if (!scenes[id] || id === pendingId) return;
  if (!loadingFinished || !fade) {
    activateScene(id);
    return;
  }

  pendingId = id;
  const token = ++switchToken;
  sceneFade.classList.add('is-on');
  setTimeout(() => {
    if (token !== switchToken) return;
    activateScene(id);
    sceneFade.classList.remove('is-on');
  }, 210);
}

function resetView({ instant = false } = {}) {
  const pose = getDefaultPose();
  if (instant || prefersReducedMotion) {
    setPose(pose);
    hasInteracted = false;
    pauseUntil = performance.now() + 1200;
    return;
  }

  tween = {
    start: performance.now(),
    duration: 1050,
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition: pose.position,
    toTarget: pose.target,
  };
  controls.enabled = false;
  stage.classList.remove('is-dragging');
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

activateScene(activeId);
setAutoRotate(autoRotateEnabled);

tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    const id = button.dataset.scene;
    if (!scenes[id] || id === pendingId) return;
    window.history.pushState(null, '', `#${id}`);
    switchTo(id);
  });

  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabButtons[(index + offset + tabButtons.length) % tabButtons.length];
    next.focus();
    next.click();
  });
});

window.addEventListener('popstate', () => {
  const id = readHash();
  const fallback = id || activeId;
  if (!id) window.history.replaceState(null, '', `#${fallback}`);
  switchTo(fallback);
});

window.addEventListener('hashchange', () => {
  const id = readHash();
  if (!id) {
    window.history.replaceState(null, '', `#${activeId}`);
    return;
  }
  switchTo(id);
});

autoRotateButton.addEventListener('click', () => {
  setAutoRotate(!autoRotateEnabled);
});

resetButton.addEventListener('click', () => {
  resetView();
});

renderer.domElement.addEventListener('dblclick', () => {
  resetView();
});

renderer.domElement.addEventListener('pointerdown', () => {
  stage.classList.add('is-dragging');
  hasInteracted = true;
  pauseUntil = performance.now() + 2600;
});

window.addEventListener('pointerup', () => {
  stage.classList.remove('is-dragging');
});

renderer.domElement.addEventListener(
  'wheel',
  () => {
    hasInteracted = true;
    pauseUntil = performance.now() + 2600;
  },
  { passive: true },
);

renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    resetView();
    return;
  }
  if (event.code === 'Space') {
    if (event.target instanceof HTMLElement && event.target.closest('button')) return;
    event.preventDefault();
    setAutoRotate(!autoRotateEnabled);
  }
});

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(width, height);
  if (!hasInteracted && !tween) {
    setPose(getDefaultPose(camera.aspect));
  }
});

if (import.meta.env.DEV) {
  window.__jiangnan = {
    camera,
    controls,
    renderer,
    worlds,
    scenes,
    get activeId() {
      return activeId;
    },
    switchTo,
    activateScene,
    setAutoRotate,
    resetView,
    getDefaultPose,
  };
}

let previousFrame = performance.now();
const startTime = previousFrame;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  const time = (now - startTime) / 1000;

  if (tween) {
    const progress = Math.min(1, (performance.now() - tween.start) / tween.duration);
    const eased = easeInOutCubic(progress);
    camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
    controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
    camera.lookAt(controls.target);
    if (progress >= 1) {
      tween = null;
      controls.enabled = true;
      hasInteracted = false;
      pauseUntil = performance.now() + 1400;
      controls.update();
    }
  } else {
    controls.autoRotate =
      autoRotateEnabled && loadingFinished && performance.now() > pauseUntil;
    controls.update(delta);
  }

  activeWorld.update(time, delta);
  renderer.render(activeWorld.scene, camera);
}

function finishLoading() {
  if (loadingFinished) return;
  loadingFinished = true;
  if (!hasInteracted && !tween) setPose(getDefaultPose());
  pauseUntil = performance.now() + 2200;
  loader.classList.add('is-hidden');
  document.body.classList.add('is-ready');
}

renderer.render(activeWorld.scene, camera);
requestAnimationFrame(() => {
  setTimeout(finishLoading, 520);
});
animate();
