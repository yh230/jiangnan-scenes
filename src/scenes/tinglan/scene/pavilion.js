import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  boxBetween,
  createLatticePanel,
  createMesh,
  createRailing,
} from '../../shared/geometry.js';
import { createRoofs } from '../lib/roof.js';

const DECK_Y = 0.84;
const L1_COL_TOP = 3.9;
const BALCONY_Y = 5.13;
const L2_COL_TOP = 7.0;

const L1_X = [-3.15, -1.05, 1.05, 3.15];
const L1_Z = [-2.15, 2.15];
const L2_X = [-2.2, -0.73, 0.73, 2.2];
const L2_Z = [-1.4, 1.4];

function pushPanel(store, width, height, x, y, z, rotationY = 0, paper = 'soft', paperOffset = 0.035) {
  const lattice = createLatticePanel(width, height);
  lattice.rotateY(rotationY);
  lattice.translate(x, y, z);
  store.woodLattice.push(lattice);

  if (paper) {
    const backing = new THREE.PlaneGeometry(width - 0.055, height - 0.055);
    backing.rotateY(rotationY);
    const normalX = Math.sin(rotationY);
    const normalZ = Math.cos(rotationY);
    backing.translate(x - normalX * paperOffset, y, z - normalZ * paperOffset);
    if (paper === 'glow') store.paperGlow.push(backing);
    else if (paper === 'none') backing.dispose();
    else if (paper === 'dim') store.paperDim.push(backing);
    else store.paperSoft.push(backing);
  }
}

function addBeamFrame(store, width, height, depth, x, y, z, rotationY = 0, material = 'woodBeam') {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  if (rotationY) geometry.rotateY(rotationY);
  geometry.translate(x, y, z);
  store[material].push(geometry);
}

function createLantern(materials, glowTexture) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.155, 18, 14),
    materials.lantern,
  );
  body.scale.set(1, 1.25, 1);
  group.add(body);

  const goldPieces = [];
  addCylinder(goldPieces, 0.07, 0.085, 0.045, 12, 0, 0.205, 0);
  addCylinder(goldPieces, 0.085, 0.07, 0.045, 12, 0, -0.205, 0);
  addCylinder(goldPieces, 0.012, 0.012, 0.34, 6, 0, 0.39, 0);
  const goldMesh = createMesh(goldPieces, materials.lanternGold);
  group.add(goldMesh);

  const tasselPieces = [];
  addCylinder(tasselPieces, 0.018, 0.018, 0.12, 6, 0, -0.29, 0);
  addCylinder(tasselPieces, 0.045, 0.012, 0.12, 8, 0, -0.4, 0);
  const tasselMesh = createMesh(tasselPieces, materials.woodDark);
  group.add(tasselMesh);

  const spriteMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color('#ffb26d'),
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(spriteMaterial);
  glow.scale.set(1.42, 1.42, 1);
  group.add(glow);

  return { group, glowMaterial: spriteMaterial };
}

function addDougong(store, x, y, z, rotationY) {
  const parts = {
    dark: [],
    teal: [],
    gold: [],
  };

  addBox(parts.dark, 0.38, 0.09, 0.32, 0, 0.045, 0);
  addBox(parts.teal, 0.64, 0.07, 0.13, 0, 0.13, 0);
  addBox(parts.teal, 0.15, 0.07, 0.58, 0, 0.2, 0);
  addBox(parts.teal, 0.1, 0.12, 0.12, -0.28, 0.19, 0);
  addBox(parts.teal, 0.1, 0.12, 0.12, 0.28, 0.19, 0);
  addBox(parts.teal, 0.12, 0.12, 0.1, 0, 0.19, -0.26);
  addBox(parts.teal, 0.12, 0.12, 0.1, 0, 0.19, 0.26);
  addBox(parts.gold, 0.68, 0.022, 0.055, 0, 0.168, 0.075);
  addBox(parts.gold, 0.68, 0.022, 0.055, 0, 0.168, -0.075);
  addBox(parts.dark, 0.72, 0.045, 0.3, 0, 0.255, 0);

  const matrix = new THREE.Matrix4().makeRotationY(rotationY);
  matrix.setPosition(x, y, z);

  Object.entries(parts).forEach(([key, geometries]) => {
    geometries.forEach((geometry) => {
      geometry.applyMatrix4(matrix);
      store[`dougong_${key}`].push(geometry);
    });
  });
}

function addGableWall(store, sign) {
  const shape = new THREE.Shape();
  shape.moveTo(-2.24, 0);
  shape.lineTo(2.24, 0);
  shape.lineTo(0, 1.3);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateY((sign * Math.PI) / 2);
  geometry.translate(sign * 3.17, 7.03, 0);
  store.woodDark.push(geometry);

  const border = [];
  addBox(border, 0.07, 0.1, 4.5, sign * 3.17, 7.04, 0);
  border.push(
    boxBetween(
      new THREE.Vector3(sign * 3.17, 7.04, -2.24),
      new THREE.Vector3(sign * 3.17, 8.32, 0),
      0.08,
      0.12,
    ),
  );
  border.push(
    boxBetween(
      new THREE.Vector3(sign * 3.17, 7.04, 2.24),
      new THREE.Vector3(sign * 3.17, 8.32, 0),
      0.08,
      0.12,
    ),
  );
  border.forEach((piece) => store.woodDark.push(piece));

  const vent = new THREE.TorusGeometry(0.2, 0.026, 7, 24);
  vent.rotateY((sign * Math.PI) / 2);
  vent.translate(sign * 3.195, 7.72, 0);
  store.woodDark.push(vent);
  addBox(store.woodDark, 0.045, 0.36, 0.035, sign * 3.2, 7.72, 0);
  addBox(store.woodDark, 0.045, 0.035, 0.36, sign * 3.2, 7.72, 0);
  const ventPaper = new THREE.CircleGeometry(0.162, 18);
  ventPaper.rotateY((sign * Math.PI) / 2);
  ventPaper.translate(sign * 3.188, 7.72, 0);
  store.paperGlow.push(ventPaper);
}

function createPlatform(store) {
  const stone = store.stone;
  const trim = store.stoneStep;

  addBox(stone, 11.1, 0.46, 8.5, 0, 0.24, 0);
  addBox(stone, 10.25, 0.4, 7.65, 0, 0.64, 0);
  addBox(store.stoneWet, 11.2, 0.16, 8.6, 0, 0.09, 0);

  addBox(trim, 10.42, 0.1, 7.82, 0, 0.835, 0);
  addBox(trim, 10.3, 0.08, 7.7, 0, 0.89, 0);

  addBox(trim, 10.25, 0.1, 0.16, 0, 0.79, 3.8);
  addBox(trim, 10.25, 0.1, 0.16, 0, 0.79, -3.8);
  addBox(trim, 0.16, 0.1, 7.65, 5.04, 0.79, 0);
  addBox(trim, 0.16, 0.1, 7.65, -5.04, 0.79, 0);

  for (let i = 0; i < 4; i += 1) {
    const top = DECK_Y - 0.17 * (i + 1);
    const z = 3.92 + i * 0.36;
    addBox(trim, 3.25, top, 0.34, 0, top / 2, z);
  }

  const cheekAngle = Math.atan2(0.68, 1.45);
  addBox(trim, 0.22, 0.26, 1.7, -1.73, 0.46, 4.48, -cheekAngle, 0, 0);
  addBox(trim, 0.22, 0.26, 1.7, 1.73, 0.46, 4.48, -cheekAngle, 0, 0);
}

function addFirstStory(store, materials) {
  const columnPositions = [];
  const seen = new Set();
  const register = (x, z) => {
    const key = `${x.toFixed(2)}:${z.toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    columnPositions.push([x, z]);
  };

  L1_X.forEach((x) => L1_Z.forEach((z) => register(x, z)));
  L1_Z.forEach((z) => register(-3.15, z));
  register(-3.15, 0);
  register(3.15, 0);

  columnPositions.forEach(([x, z]) => {
    addCylinder(store.woodColumn, 0.135, 0.15, L1_COL_TOP - 0.94, 16, x, (L1_COL_TOP + 0.94) / 2, z);
    addCylinder(store.stoneStep, 0.18, 0.2, 0.1, 12, x, 0.98, z);
    addBox(store.woodDark, 0.34, 0.06, 0.34, x, 0.89, z);
  });

  [-2.15, 2.15].forEach((z) => {
    addBeamFrame(store, 6.62, 0.25, 0.19, 0, 3.66, z, 0, 'woodBeam');
    addBeamFrame(store, 6.5, 0.07, 0.2, 0, 3.52, z, 0, 'teal');
    addBeamFrame(store, 6.42, 0.022, 0.21, 0, 3.475, z, 0, 'gold');
    addBox(store.woodLattice, 6.62, 0.06, 0.105, 0, 1.33, z);
    addBox(store.woodDark, 6.58, 0.1, 0.1, 0, 0.92, z);
  });

  [-3.15, 3.15].forEach((x) => {
    addBeamFrame(store, 4.42, 0.25, 0.19, x, 3.66, 0, Math.PI / 2, 'woodBeam');
    addBeamFrame(store, 4.3, 0.07, 0.2, x, 3.52, 0, Math.PI / 2, 'teal');
    addBeamFrame(store, 4.24, 0.022, 0.21, x, 3.475, 0, Math.PI / 2, 'gold');
    addBox(store.woodLattice, 0.105, 0.06, 4.42, x, 1.33, 0);
    addBox(store.woodDark, 0.1, 0.1, 4.4, x, 0.92, 0);
  });

  const bays = [-2.1, 0, 2.1];
  bays.forEach((x, index) => {
    const isDoor = index === 1;
    if (isDoor) {
      pushPanel(store, 1.8, 0.44, x, 3.22, 2.15, 0, 'soft');
      addBox(store.woodBeam, 1.86, 0.08, 0.12, x, 3.46, 2.15);
      addBox(store.woodBeam, 0.09, 0.36, 0.12, -0.98, 1.02, 2.15);
      addBox(store.woodBeam, 0.09, 0.36, 0.12, 0.98, 1.02, 2.15);
      addBox(store.woodBeam, 1.96, 0.1, 0.22, 0, 0.91, 2.15);
    } else {
      pushPanel(store, 1.82, 2.08, x, 2.4, 2.15, 0, index === 0 ? 'glow' : 'soft');
      addBox(store.plaster, 1.9, 0.44, 0.07, x, 1.07, 2.15);
    }
    pushPanel(store, 1.82, 2.08, x, 2.4, -2.15, 0, index === 1 ? 'glow' : 'dim');
    addBox(store.plaster, 1.9, 0.44, 0.07, x, 1.07, -2.15);
  });

  [-1.075, 1.075].forEach((z, index) => {
    for (const sign of [-1, 1]) {
      pushPanel(store, 1.85, 2.08, sign * 3.15, 2.4, z, (sign * Math.PI) / 2, index === 0 ? 'soft' : 'dim');
      addBox(store.plaster, 1.9, 0.44, 0.07, sign * 3.15, 1.07, z, 0, Math.PI / 2, 0);
    }
  });

  // Interior floor and furnishings, visible through the open central doorway.
  addBox(store.floor, 6.08, 0.05, 4.1, 0, 0.89, 0);
  addBox(store.woodDark, 6.2, 0.08, 0.16, 0, 0.93, 2.08);

  addBox(store.woodDark, 1.06, 0.065, 0.56, 0, 1.4, -0.25);
  [
    [-0.44, -0.49],
    [0.44, -0.49],
    [-0.44, -0.01],
    [0.44, -0.01],
  ].forEach(([x, z]) => addBox(store.woodDark, 0.055, 0.5, 0.055, x, 1.14, z));
  addBox(store.woodDark, 0.42, 0.05, 0.42, -0.82, 1.12, 0.2);
  addBox(store.woodDark, 0.42, 0.05, 0.42, 0.82, 1.12, 0.2);
  addCylinder(store.woodDark, 0.03, 0.03, 0.33, 8, -0.82, 0.96, 0.2);
  addCylinder(store.woodDark, 0.03, 0.03, 0.33, 8, 0.82, 0.96, 0.2);

  const teapot = new THREE.SphereGeometry(0.09, 12, 8);
  teapot.scale(1, 0.8, 1);
  teapot.translate(0.08, 1.49, -0.22);
  store.woodDark.push(teapot);
  const spout = new THREE.ConeGeometry(0.028, 0.16, 8);
  spout.rotateZ(-Math.PI / 2.8);
  spout.translate(0.2, 1.53, -0.22);
  store.woodDark.push(spout);
  [[-0.12, 1.47, -0.16], [0.24, 1.47, -0.15]].forEach(([x, y, z]) => {
    addCylinder(store.woodDark, 0.045, 0.035, 0.055, 10, x, y, z);
  });

  // Low screen with an ink painting.
  addBox(store.woodDark, 1.92, 0.06, 0.06, 0.1, 2.68, -1.72);
  addBox(store.woodDark, 1.92, 0.06, 0.06, 0.1, 1.38, -1.72);
  addBox(store.woodDark, 0.06, 1.36, 0.06, -0.85, 2.03, -1.72);
  addBox(store.woodDark, 0.06, 1.36, 0.06, 1.05, 2.03, -1.72);
  addBox(store.woodDark, 0.08, 0.42, 0.08, -0.85, 1.17, -1.72);
  addBox(store.woodDark, 0.08, 0.42, 0.08, 1.05, 1.17, -1.72);

  const paintingGeometry = new THREE.PlaneGeometry(1.78, 1.08);
  paintingGeometry.translate(0.1, 2.03, -1.675);
  const paintingMesh = new THREE.Mesh(paintingGeometry, materials.painting);
  paintingMesh.receiveShadow = true;
  store.extraMeshes.push(paintingMesh);

  // Ceiling joists deepen the interior.
  for (const x of [-1.8, 0, 1.8]) {
    addBox(store.woodDark, 0.13, 0.13, 4.1, x, 3.58, 0);
  }

  // Main plaque.
  addBox(store.woodDark, 2.18, 0.7, 0.075, 0, 3.73, 2.29);
  addBox(store.gold, 2.2, 0.025, 0.08, 0, 4.075, 2.295);
  addBox(store.gold, 2.2, 0.025, 0.08, 0, 3.385, 2.295);
  addBox(store.gold, 0.025, 0.7, 0.08, -1.09, 3.73, 2.295);
  addBox(store.gold, 0.025, 0.7, 0.08, 1.09, 3.73, 2.295);
  const plaqueGeometry = new THREE.PlaneGeometry(1.95, 0.61);
  plaqueGeometry.translate(0, 3.73, 2.334);
  const plaqueMesh = new THREE.Mesh(plaqueGeometry, materials.plaque);
  store.extraMeshes.push(plaqueMesh);

  return columnPositions;
}

function addSecondStory(store, materials) {
  addBox(store.floor, 5.95, 0.16, 4.45, 0, BALCONY_Y - 0.08, 0);
  addBox(store.woodDark, 6.08, 0.12, 0.14, 0, BALCONY_Y - 0.17, 2.23);
  addBox(store.woodDark, 6.08, 0.12, 0.14, 0, BALCONY_Y - 0.17, -2.23);
  addBox(store.woodDark, 0.14, 0.12, 4.5, 2.99, BALCONY_Y - 0.17, 0);
  addBox(store.woodDark, 0.14, 0.12, 4.5, -2.99, BALCONY_Y - 0.17, 0);

  addBox(store.woodBeam, 5.9, 0.09, 0.1, 0, BALCONY_Y + 0.04, 2.22);
  addBox(store.woodBeam, 5.9, 0.09, 0.1, 0, BALCONY_Y + 0.04, -2.22);
  addBox(store.woodBeam, 0.1, 0.09, 4.36, 2.95, BALCONY_Y + 0.04, 0);
  addBox(store.woodBeam, 0.1, 0.09, 4.36, -2.95, BALCONY_Y + 0.04, 0);

  const railFront = createRailing(5.86);
  railFront.translate(0, BALCONY_Y, 2.17);
  store.railings.push(railFront);

  const railBack = createRailing(5.86);
  railBack.translate(0, BALCONY_Y, -2.17);
  store.railings.push(railBack);

  for (const sign of [-1, 1]) {
    const railSide = createRailing(4.32);
    railSide.rotateY(Math.PI / 2);
    railSide.translate(sign * 2.93, BALCONY_Y, 0);
    store.railings.push(railSide);
  }

  const seen = new Set();
  const register = (x, z) => {
    const key = `${x.toFixed(2)}:${z.toFixed(2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    addCylinder(store.woodColumn, 0.1, 0.115, L2_COL_TOP - BALCONY_Y - 0.08, 14, x, (L2_COL_TOP + BALCONY_Y + 0.08) / 2, z);
    addCylinder(store.woodDark, 0.14, 0.16, 0.08, 12, x, BALCONY_Y + 0.04, z);
  };

  L2_X.forEach((x) => L2_Z.forEach((z) => register(x, z)));
  [-1.4, 0, 1.4].forEach((z) => {
    register(-2.2, z);
    register(2.2, z);
  });

  [-1.4, 1.4].forEach((z) => {
    addBox(store.woodBeam, 4.68, 0.22, 0.17, 0, 6.95, z);
    addBox(store.woodBeam, 4.58, 0.062, 0.18, 0, 6.83, z);
    addBox(store.teal, 4.5, 0.065, 0.185, 0, 6.83, z);
    addBox(store.gold, 4.42, 0.02, 0.19, 0, 6.795, z);
    addBox(store.woodLattice, 4.68, 0.055, 0.1, 0, 5.52, z);
    addBox(store.woodDark, 4.64, 0.09, 0.1, 0, 5.18, z);
  });

  [-2.2, 2.2].forEach((x) => {
    addBox(store.woodBeam, 3.06, 0.22, 0.17, x, 6.95, 0, 0, Math.PI / 2, 0);
    addBox(store.teal, 2.98, 0.065, 0.185, x, 6.83, 0, 0, Math.PI / 2, 0);
    addBox(store.gold, 2.9, 0.02, 0.19, x, 6.795, 0, 0, Math.PI / 2, 0);
    addBox(store.woodLattice, 3.06, 0.055, 0.1, x, 5.52, 0, 0, Math.PI / 2, 0);
    addBox(store.woodDark, 3.02, 0.09, 0.1, x, 5.18, 0, 0, Math.PI / 2, 0);
  });

  [-1.465, 0, 1.465].forEach((x, index) => {
    pushPanel(store, 1.2, 1.26, x, 6.18, 1.4, 0, index === 1 ? 'glow' : 'soft');
    addBox(store.plaster, 1.26, 0.3, 0.065, x, 5.34, 1.4);
    pushPanel(store, 1.2, 1.26, x, 6.18, -1.4, 0, index === 1 ? 'glow' : 'dim');
    addBox(store.plaster, 1.26, 0.3, 0.065, x, 5.34, -1.4);
  });

  [-0.7, 0.7].forEach((z, index) => {
    for (const sign of [-1, 1]) {
      pushPanel(store, 1.14, 1.26, sign * 2.2, 6.18, z, (sign * Math.PI) / 2, index === 0 ? 'soft' : 'dim');
      addBox(store.plaster, 1.2, 0.3, 0.065, sign * 2.2, 5.34, z, 0, Math.PI / 2, 0);
    }
  });

  addGableWall(store, 1);
  addGableWall(store, -1);

  // Smaller upper plaque.
  addBox(store.woodDark, 1.5, 0.5, 0.06, 0, 6.72, 1.48);
  const plaqueGeometry = new THREE.PlaneGeometry(1.36, 0.425);
  plaqueGeometry.translate(0, 6.72, 1.514);
  const plaqueMesh = new THREE.Mesh(plaqueGeometry, materials.plaque);
  store.extraMeshes.push(plaqueMesh);

  // Interior ceiling and hanging light position is handled by the lantern pass.
}

function addStairsAndBridgeLanding(store) {
  // A small stone side landing where the arched bridge meets the pavilion.
  addBox(store.stoneStep, 1.45, 0.5, 1.55, 5.45, 0.36, 0.42);
  addBox(store.stoneStep, 1.1, 0.12, 1.35, 5.55, 0.67, 0.42);
}

export function createPavilion(materials) {
  const group = new THREE.Group();
  const store = {
    stone: [],
    stoneStep: [],
    stoneWet: [],
    woodColumn: [],
    woodBeam: [],
    woodLattice: [],
    woodDark: [],
    floor: [],
    plaster: [],
    teal: [],
    gold: [],
    paperGlow: [],
    paperSoft: [],
    paperDim: [],
    railings: [],
    dougong_dark: [],
    dougong_teal: [],
    dougong_gold: [],
    extraMeshes: [],
  };

  createPlatform(store);
  addFirstStory(store, materials);
  addSecondStory(store, materials);
  addStairsAndBridgeLanding(store);

  // Brackets under the two eave levels.
  [
    ...L1_X.map((x) => [x, 3.75, 2.15, 0]),
    ...L1_X.map((x) => [x, 3.75, -2.15, 0]),
    ...[-1.05, 0, 1.05].flatMap((z) => [
      [3.15, 3.75, z, Math.PI / 2],
      [-3.15, 3.75, z, Math.PI / 2],
    ]),
    ...L2_X.map((x) => [x, 6.79, 1.4, 0]),
    ...L2_X.map((x) => [x, 6.79, -1.4, 0]),
    ...[-0.7, 0, 0.7].flatMap((z) => [
      [2.2, 6.79, z, Math.PI / 2],
      [-2.2, 6.79, z, Math.PI / 2],
    ]),
  ].forEach(([x, y, z, rotation]) => addDougong(store, x, y, z, rotation));

  const materialsByKey = {
    stone: materials.stone,
    stoneStep: materials.stoneStep,
    stoneWet: materials.stoneWet,
    woodColumn: materials.woodColumn,
    woodBeam: materials.woodBeam,
    woodLattice: materials.woodLattice,
    woodDark: materials.woodDark,
    floor: materials.woodFloor,
    plaster: materials.plaster,
    teal: materials.teal,
    gold: materials.gold,
    paperGlow: materials.paperGlow,
    paperSoft: materials.paperSoft,
    paperDim: materials.paperNoGlow,
    dougong_dark: materials.woodDark,
    dougong_teal: materials.teal,
    dougong_gold: materials.gold,
  };

  Object.entries(store).forEach(([key, list]) => {
    if (!materialsByKey[key] || !Array.isArray(list) || list.length === 0) return;
    const mesh = createMesh(list, materialsByKey[key], {
      castShadow: key !== 'paperGlow' && key !== 'paperSoft' && key !== 'paperDim',
      receiveShadow: true,
    });
    group.add(mesh);
  });

  const railingMesh = createMesh(store.railings, materials.woodRailing);
  group.add(railingMesh);

  store.extraMeshes.forEach((mesh) => group.add(mesh));

  const roofs = createRoofs(materials);
  group.add(roofs.upper, roofs.lower);

  const lanterns = [];
  const lanternPlacements = [
    [-3.32, 3.55, 2.5],
    [3.32, 3.55, 2.5],
    [-3.32, 3.55, -2.5],
    [3.32, 3.55, -2.5],
    [-1.9, 6.48, 1.92],
    [1.9, 6.48, 1.92],
    [0, 2.86, 0],
  ];

  lanternPlacements.forEach(([x, y, z]) => {
    const lantern = createLantern(materials, materials.textures.glow);
    lantern.group.position.set(x, y, z);
    group.add(lantern.group);
    lanterns.push(lantern);
  });

  const interiorLight = new THREE.PointLight('#ffb46d', 15, 7.5, 2);
  interiorLight.position.set(0, 2.35, 0.35);
  group.add(interiorLight);

  const porchLight = new THREE.PointLight('#ff9f58', 8, 5.4, 2);
  porchLight.position.set(2.7, 3.35, 2.8);
  group.add(porchLight);

  const baseGlow = lanterns.map((lantern, index) => ({
    material: lantern.glowMaterial,
    base: index === 6 ? 0.27 : 0.4,
    phase: index * 1.37 + 0.6,
    speed: 0.7 + index * 0.09,
  }));

  function update(time, delta) {
    baseGlow.forEach(({ material, base, phase, speed }) => {
      const flicker = 0.92 + Math.sin(time * speed + phase) * 0.07 + Math.sin(time * 2.7 + phase * 1.4) * 0.025;
      material.opacity = base * flicker;
    });
    interiorLight.intensity = 15 + Math.sin(time * 1.7) * 0.7 + Math.sin(time * 3.1) * 0.3;
    porchLight.intensity = 8 + Math.sin(time * 2.3 + 1.2) * 0.35;
  }

  return { group, update };
}
