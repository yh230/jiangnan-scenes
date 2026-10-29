import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

function createContactShadow(materials, width, depth, x, z, opacity) {
  const material = new THREE.MeshBasicMaterial({
    map: materials.textures.shadow,
    color: '#000000',
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.058, z);
  mesh.renderOrder = 3;
  return mesh;
}

export function createWater(materials) {
  const group = new THREE.Group();

  const reflectionSize = window.innerWidth < 760 ? 512 : 1024;
  const mirror = new Reflector(new THREE.PlaneGeometry(180, 180), {
    clipBias: 0.003,
    textureWidth: reflectionSize,
    textureHeight: reflectionSize,
    color: 0x7c8f8d,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 0.012;
  group.add(mirror);

  const normalMap = materials.textures.waterNormal;
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: '#0d292a',
    roughness: 0.13,
    metalness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.5,
    normalMap,
    normalScale: new THREE.Vector2(0.19, 0.19),
    envMapIntensity: 0.55,
    depthWrite: false,
  });

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), waterMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.038;
  surface.renderOrder = 2;
  group.add(surface);

  group.add(createContactShadow(materials, 16.5, 12.5, 0, 0, 0.26));
  group.add(createContactShadow(materials, 9.5, 5.5, 7.8, 0.4, 0.14));

  function update(time) {
    normalMap.offset.x = time * 0.0048;
    normalMap.offset.y = time * 0.0032;
    waterMaterial.opacity = 0.48 + Math.sin(time * 0.23) * 0.014;
  }

  return { group, update };
}
