import * as THREE from 'three';
import { createMaterials } from '../lib/materials.js';
import { applyEnvironment, createSky } from './sky.js';
import { createPavilion } from './pavilion.js';
import { createWater } from './water.js';
import { createGarden } from './garden.js';

export function createWorld(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1716');
  scene.fog = new THREE.FogExp2('#a99a89', 0.008);

  const materials = createMaterials(renderer.capabilities.getMaxAnisotropy());
  applyEnvironment(renderer, scene);

  const sunPosition = new THREE.Vector3(-24, 10.5, 19);
  // The visible dusk glow sits behind the pavilion; the key light still grazes the facade.
  const skySunDirection = new THREE.Vector3(-0.7, 0.09, -0.71).normalize();
  const sky = createSky(scene, skySunDirection);

  const shadowSize = window.innerWidth < 760 ? 1024 : 2048;
  const sun = new THREE.DirectionalLight('#ffc593', 3.4);
  sun.position.copy(sunPosition);
  sun.target.position.set(0, 3.7, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 72;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.035;
  scene.add(sun, sun.target);

  const hemisphere = new THREE.HemisphereLight('#8faec4', '#4d3f32', 1.2);
  scene.add(hemisphere);

  const fill = new THREE.DirectionalLight('#aec5d4', 0.52);
  fill.position.set(13, 7, 15);
  scene.add(fill);

  const rim = new THREE.DirectionalLight('#ffd2a7', 0.36);
  rim.position.set(-6, 6, -14);
  scene.add(rim);

  const pavilion = createPavilion(materials);
  scene.add(pavilion.group);

  const water = createWater(materials);
  scene.add(water.group);

  const garden = createGarden(materials);
  scene.add(garden.group);

  function update(time, delta) {
    sky.update(time);
    pavilion.update(time, delta);
    water.update(time);
    garden.update(time, delta);
  }

  return { scene, update };
}
