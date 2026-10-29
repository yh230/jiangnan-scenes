import * as THREE from 'three';
import {
  createFloorTexture,
  createGlowTexture,
  createMistTexture,
  createPaintingTexture,
  createPaperTexture,
  createPlaqueTexture,
  createShadowTexture,
  createStoneTexture,
  createTileTexture,
  createWaterNormalTexture,
  createWoodTexture,
} from './textures.js';
import { repeatTexture as repeat } from '../../shared/textures.js';

function wood(color, map, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    map,
    roughness: 0.58,
    metalness: 0.02,
    ...extra,
  });
}

export function createMaterials(anisotropy = 1) {
  const stoneTexture = createStoneTexture(anisotropy);
  const woodTexture = createWoodTexture(anisotropy);
  const floorTexture = createFloorTexture(anisotropy);
  const tileTexture = createTileTexture(anisotropy);
  const paperTexture = createPaperTexture(anisotropy);

  const stone = new THREE.MeshStandardMaterial({
    color: '#ede2ce',
    map: repeat(stoneTexture, 2.8, 2.1),
    roughness: 0.9,
    metalness: 0.01,
  });

  const stoneStep = new THREE.MeshStandardMaterial({
    color: '#e6dbc7',
    map: repeat(stoneTexture, 1.5, 0.8),
    roughness: 0.86,
    metalness: 0.01,
  });

  const stoneBridge = new THREE.MeshStandardMaterial({
    color: '#ded2bd',
    map: repeat(stoneTexture, 3.2, 0.9),
    roughness: 0.92,
    metalness: 0.01,
  });

  const stoneDark = new THREE.MeshStandardMaterial({
    color: '#9d9b87',
    map: repeat(stoneTexture, 2.2, 1.4),
    roughness: 0.94,
  });

  const stoneWet = new THREE.MeshStandardMaterial({
    color: '#737b69',
    map: repeat(stoneTexture, 2, 1),
    roughness: 0.55,
    metalness: 0.02,
  });

  const woodColumn = wood('#8e4a37', repeat(woodTexture, 1, 2.1));
  woodColumn.roughness = 0.5;

  const woodBeam = wood('#713a2b', repeat(woodTexture, 2.2, 1));
  const woodLattice = wood('#55281d', repeat(woodTexture, 0.8, 1.2), { roughness: 0.62 });
  const woodRailing = wood('#6a3327', repeat(woodTexture, 1.6, 1), { roughness: 0.6 });
  const woodDark = wood('#432119', repeat(woodTexture, 1, 1), { roughness: 0.66 });
  const woodSoffit = wood('#3b1f17', repeat(woodTexture, 2, 2), { roughness: 0.78 });
  const woodFloor = new THREE.MeshStandardMaterial({
    color: '#f0d9bd',
    map: repeat(floorTexture, 3.2, 2.3),
    roughness: 0.68,
    metalness: 0.02,
  });

  const tile = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: repeat(tileTexture, 7, 7),
    roughness: 0.52,
    metalness: 0.06,
    envMapIntensity: 0.62,
  });

  const tileLower = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: repeat(tileTexture, 8, 8),
    roughness: 0.54,
    metalness: 0.05,
    envMapIntensity: 0.55,
  });

  const tileRidge = new THREE.MeshStandardMaterial({
    color: '#3b474d',
    roughness: 0.42,
    metalness: 0.3,
    envMapIntensity: 0.9,
  });

  const tileCap = new THREE.MeshStandardMaterial({
    color: '#707d82',
    roughness: 0.5,
    metalness: 0.12,
  });

  const plaster = new THREE.MeshStandardMaterial({
    color: '#cfc2aa',
    map: repeat(paperTexture, 1.2, 1.2),
    roughness: 0.96,
  });

  const paperGlow = new THREE.MeshStandardMaterial({
    color: '#e4cda7',
    map: repeat(paperTexture, 1.4, 1.4),
    emissive: new THREE.Color('#ff9f55'),
    emissiveIntensity: 0.42,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  const paperSoft = paperGlow.clone();
  paperSoft.emissiveIntensity = 0.17;
  paperSoft.color.set('#d7c2a1');

  const paperNoGlow = paperGlow.clone();
  paperNoGlow.emissiveIntensity = 0.04;

  const teal = new THREE.MeshStandardMaterial({
    color: '#2c5c55',
    roughness: 0.48,
    metalness: 0.12,
    envMapIntensity: 0.5,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: '#b98b50',
    roughness: 0.33,
    metalness: 0.7,
    envMapIntensity: 1,
  });

  const lantern = new THREE.MeshStandardMaterial({
    color: '#a92f22',
    emissive: new THREE.Color('#ff6a2f'),
    emissiveIntensity: 1.15,
    roughness: 0.44,
    metalness: 0.02,
  });

  const lanternGold = new THREE.MeshStandardMaterial({
    color: '#b58a4f',
    roughness: 0.4,
    metalness: 0.55,
  });

  const rock = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.01,
    flatShading: true,
  });

  const bank = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.97,
    metalness: 0,
    flatShading: true,
  });

  const bamboo = new THREE.MeshStandardMaterial({
    color: '#647c4d',
    roughness: 0.66,
    metalness: 0.01,
  });

  const bambooNode = new THREE.MeshStandardMaterial({
    color: '#4d603b',
    roughness: 0.72,
  });

  const leaves = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.82,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const lotusPad = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.62,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const lotusPetal = new THREE.MeshStandardMaterial({
    color: '#e9a4a7',
    roughness: 0.58,
    metalness: 0,
    side: THREE.DoubleSide,
    emissive: new THREE.Color('#2b0808'),
    emissiveIntensity: 0.08,
  });

  const lotusCenter = new THREE.MeshStandardMaterial({
    color: '#d5ac4e',
    roughness: 0.6,
  });

  const soil = new THREE.MeshStandardMaterial({
    color: '#3d2f22',
    roughness: 1,
  });

  const moss = new THREE.MeshStandardMaterial({
    color: '#55633f',
    roughness: 0.95,
  });

  const plaqueTexture = createPlaqueTexture('听澜阁');
  const plaque = new THREE.MeshStandardMaterial({
    map: plaqueTexture,
    roughness: 0.36,
    metalness: 0.15,
    emissive: new THREE.Color('#22120a'),
    emissiveIntensity: 0.5,
  });

  const paintingTexture = createPaintingTexture();
  const painting = new THREE.MeshBasicMaterial({
    map: paintingTexture,
    toneMapped: false,
  });

  const waterNormal = createWaterNormalTexture();
  waterNormal.repeat.set(7, 7);

  return {
    stone,
    stoneStep,
    stoneBridge,
    stoneDark,
    stoneWet,
    woodColumn,
    woodBeam,
    woodLattice,
    woodRailing,
    woodDark,
    woodSoffit,
    woodFloor,
    tile,
    tileLower,
    tileRidge,
    tileCap,
    plaster,
    paperGlow,
    paperSoft,
    paperNoGlow,
    teal,
    gold,
    lantern,
    lanternGold,
    rock,
    bank,
    bamboo,
    bambooNode,
    leaves,
    lotusPad,
    lotusPetal,
    lotusCenter,
    soil,
    moss,
    plaque,
    painting,
    textures: {
      waterNormal,
      glow: createGlowTexture(),
      mist: createMistTexture(),
      shadow: createShadowTexture(),
    },
  };
}
