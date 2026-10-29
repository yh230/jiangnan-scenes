import * as THREE from 'three';
import {
  createBambooTexture,
  createClothTexture,
  createGlowTexture,
  createMatTexture,
  createMistTexture,
  createRopeTexture,
  createShadowTexture,
  createStrawTexture,
  createWaterNormalTexture,
} from './textures.js';
import { repeatTexture as repeat } from '../../shared/textures.js';

export function createMaterials(anisotropy = 1) {
  const bambooTexture = createBambooTexture(anisotropy);
  const strawTexture = createStrawTexture(anisotropy);
  const ropeTexture = createRopeTexture(anisotropy);
  const matTexture = createMatTexture(anisotropy);
  const clothTexture = createClothTexture(anisotropy);

  const bamboo = new THREE.MeshStandardMaterial({
    color: '#efe6c8',
    map: repeat(bambooTexture, 1.4, 2.6),
    roughness: 0.52,
    metalness: 0.02,
    envMapIntensity: 0.45,
  });

  const bambooRod = new THREE.MeshStandardMaterial({
    color: '#f0e2b8',
    map: repeat(bambooTexture, 1, 4),
    roughness: 0.44,
    metalness: 0.03,
    envMapIntensity: 0.5,
  });

  const bambooPole = new THREE.MeshStandardMaterial({
    color: '#ddcda0',
    map: repeat(bambooTexture, 1, 3),
    roughness: 0.6,
  });

  const bambooNode = new THREE.MeshStandardMaterial({
    color: '#7d6c3c',
    roughness: 0.68,
    metalness: 0.02,
  });

  const rope = new THREE.MeshStandardMaterial({
    color: '#d3b785',
    map: repeat(ropeTexture, 4, 1.2),
    roughness: 0.92,
  });

  const mat = new THREE.MeshStandardMaterial({
    color: '#e6d2a4',
    map: repeat(matTexture, 2.2, 1.4),
    roughness: 0.86,
  });

  const cloth = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: repeat(clothTexture, 1.4, 1.8),
    roughness: 0.88,
    metalness: 0,
  });

  const clothTrim = new THREE.MeshStandardMaterial({
    color: '#7c8d90',
    roughness: 0.82,
  });

  const clothDark = new THREE.MeshStandardMaterial({
    color: '#2c3d46',
    roughness: 0.9,
  });

  const straw = new THREE.MeshStandardMaterial({
    color: '#f2dfb4',
    map: repeat(strawTexture, 3.2, 1.6),
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const strawDark = new THREE.MeshStandardMaterial({
    color: '#b9975c',
    roughness: 0.92,
    side: THREE.DoubleSide,
  });

  const skin = new THREE.MeshStandardMaterial({
    color: '#d1a17a',
    roughness: 0.66,
  });

  const skinShade = new THREE.MeshStandardMaterial({
    color: '#9e6c4b',
    roughness: 0.72,
  });

  const beard = new THREE.MeshStandardMaterial({
    color: '#eeeae0',
    roughness: 0.86,
  });

  const hat = new THREE.MeshStandardMaterial({
    color: '#f0d9a4',
    map: repeat(strawTexture, 4.5, 1),
    roughness: 0.84,
    side: THREE.DoubleSide,
  });

  const gourd = new THREE.MeshStandardMaterial({
    color: '#9a6434',
    roughness: 0.5,
    metalness: 0.03,
  });

  const clay = new THREE.MeshStandardMaterial({
    color: '#7b5f4c',
    roughness: 0.54,
    metalness: 0.04,
  });

  const basket = new THREE.MeshStandardMaterial({
    color: '#d9bc84',
    map: repeat(matTexture, 1.6, 1),
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  const lantern = new THREE.MeshStandardMaterial({
    color: '#b3311f',
    emissive: new THREE.Color('#ff6a30'),
    emissiveIntensity: 1.0,
    roughness: 0.48,
    metalness: 0.02,
  });

  const lanternGold = new THREE.MeshStandardMaterial({
    color: '#b58a4f',
    roughness: 0.36,
    metalness: 0.6,
  });

  const rock = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.01,
    flatShading: true,
  });

  const bank = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.97,
    metalness: 0,
    flatShading: true,
  });

  const egret = new THREE.MeshStandardMaterial({
    color: '#f4f0e4',
    roughness: 0.66,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const egretBeak = new THREE.MeshStandardMaterial({
    color: '#d9a03c',
    roughness: 0.5,
  });

  const egretLeg = new THREE.MeshStandardMaterial({
    color: '#46453a',
    roughness: 0.7,
  });

  const leaves = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const lotusPad = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.64,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const lotusPetal = new THREE.MeshStandardMaterial({
    color: '#f0cfd0',
    roughness: 0.6,
    side: THREE.DoubleSide,
    emissive: new THREE.Color('#2b0808'),
    emissiveIntensity: 0.06,
  });

  const lotusCenter = new THREE.MeshStandardMaterial({
    color: '#d5ac4e',
    roughness: 0.6,
  });

  const waterNormal = createWaterNormalTexture();
  waterNormal.repeat.set(9, 9);

  return {
    bamboo,
    bambooRod,
    bambooPole,
    bambooNode,
    rope,
    mat,
    cloth,
    clothTrim,
    clothDark,
    straw,
    strawDark,
    skin,
    skinShade,
    beard,
    hat,
    gourd,
    clay,
    basket,
    lantern,
    lanternGold,
    rock,
    bank,
    egret,
    egretBeak,
    egretLeg,
    leaves,
    lotusPad,
    lotusPetal,
    lotusCenter,
    textures: {
      waterNormal,
      glow: createGlowTexture(),
      mist: createMistTexture(),
      shadow: createShadowTexture(),
    },
  };
}
