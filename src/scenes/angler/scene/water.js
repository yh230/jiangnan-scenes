import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export function createWater(materials) {
  const group = new THREE.Group();

  const reflectionSize = window.innerWidth < 760 ? 512 : 1024;
  const mirror = new Reflector(new THREE.PlaneGeometry(220, 220), {
    clipBias: 0.003,
    textureWidth: reflectionSize,
    textureHeight: reflectionSize,
    color: 0x717a72,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 0.012;
  group.add(mirror);

  const normalMap = materials.textures.waterNormal;
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: '#1e3335',
    roughness: 0.19,
    metalness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.58,
    normalMap,
    normalScale: new THREE.Vector2(0.24, 0.24),
    envMapIntensity: 0.5,
    depthWrite: false,
  });

  const surface = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), waterMaterial);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.038;
  surface.renderOrder = 2;
  group.add(surface);

  function update(time) {
    normalMap.offset.x = time * 0.0042;
    normalMap.offset.y = time * 0.0028;
    waterMaterial.opacity = 0.57 + Math.sin(time * 0.21) * 0.012;
  }

  return { group, update };
}
