import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { applyEnvironment, createSky } from './sky.js';
import { createWater } from './water.js';
import { createRaft } from './raft.js';
import { createAngler } from './angler.js';
import { createScenery } from './scenery.js';

export function createWorld(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#141d20');
  scene.fog = new THREE.FogExp2('#c9b29a', 0.0098);

  const materials = createMaterials(renderer.capabilities.getMaxAnisotropy());
  applyEnvironment(renderer, scene);

  const sunPosition = new THREE.Vector3(-15.6, 7.4, -25.5);
  const skySunDirection = new THREE.Vector3(-0.52, 0.075, -0.85).normalize();
  const sky = createSky(scene, skySunDirection);

  const shadowSize = window.innerWidth < 760 ? 1024 : 2048;
  const sun = new THREE.DirectionalLight('#ffbd8a', 3.2);
  sun.position.copy(sunPosition);
  sun.target.position.set(0, 0.7, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.026;
  sun.shadow.radius = 2.2;
  sun.shadow.intensity = 0.82;
  scene.add(sun, sun.target);

  const hemisphere = new THREE.HemisphereLight('#a8bcc8', '#3d3a2e', 0.86);
  scene.add(hemisphere);

  const fill = new THREE.DirectionalLight('#b3cbd6', 0.68);
  fill.position.set(10, 4, 12);
  scene.add(fill);

  const bounce = new THREE.DirectionalLight('#ffd7b4', 0.3);
  bounce.position.set(3, 1.5, 5);
  scene.add(bounce);

  const side = new THREE.DirectionalLight('#ffd1a0', 0.3);
  side.position.set(7, 3.2, -4);
  scene.add(side);

  const water = createWater(materials);
  scene.add(water.group);

  const vessel = new THREE.Group();
  const raft = createRaft(materials);
  const angler = createAngler(materials);
  vessel.add(raft.group, angler.group);
  scene.add(vessel);

  const scenery = createScenery(materials);
  scene.add(scenery.group);

  function update(time, delta) {
    sky.update(time);
    water.update(time);
    raft.update(time);
    angler.update(time);
    scenery.update(time);

    vessel.position.y = Math.sin(time * 0.66) * 0.012;
    vessel.rotation.z = Math.sin(time * 0.5) * 0.005;
    vessel.rotation.x = Math.cos(time * 0.43) * 0.004;
  }

  return { scene, update };
}
