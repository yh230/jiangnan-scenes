import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addSphere,
  createLathe,
  createMesh,
  cylinderBetween,
  tubeBetween,
} from '../../shared/geometry.js';

export const RAFT_DECK_Y = 0.152;

const CULM_Z = [-0.664, -0.498, -0.332, -0.166, 0, 0.166, 0.332, 0.498, 0.664];
const CULM_RADIUS = 0.082;

function culmHeight(x) {
  return 0.052 + 0.078 * Math.pow(Math.abs(x) / 1.95, 3);
}

function createRaftBody(materials) {
  const group = new THREE.Group();

  const culmPieces = [];
  const nodePieces = [];
  const capPieces = [];

  CULM_Z.forEach((z, index) => {
    const zz = z + (index % 2 === 0 ? 0.004 : -0.004);
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1.95, culmHeight(1.95), zz),
        new THREE.Vector3(-1.6, culmHeight(1.6), zz),
        new THREE.Vector3(-0.8, culmHeight(0.8), zz),
        new THREE.Vector3(0, 0.052, zz),
        new THREE.Vector3(0.8, culmHeight(0.8), zz),
        new THREE.Vector3(1.6, culmHeight(1.6), zz),
        new THREE.Vector3(1.95, culmHeight(1.95), zz),
      ],
      false,
      'catmullrom',
      0.35,
    );
    culmPieces.push(new THREE.TubeGeometry(curve, 40, CULM_RADIUS, 10, false));

    for (let x = -1.68; x <= 1.69; x += 0.42) {
      addCylinder(
        nodePieces,
        CULM_RADIUS * 1.06,
        CULM_RADIUS * 1.06,
        0.02,
        10,
        x,
        culmHeight(x) + 0.002,
        zz,
        0,
        0,
        Math.PI / 2,
      );
    }

    [-1, 1].forEach((direction) => {
      const cap = new THREE.CircleGeometry(CULM_RADIUS * 0.94, 12);
      cap.rotateY((direction * Math.PI) / 2);
      cap.translate(direction * 1.958, culmHeight(1.95), zz);
      capPieces.push(cap);
    });
  });

  group.add(createMesh(culmPieces, materials.bamboo));
  group.add(createMesh(nodePieces, materials.bambooNode, { castShadow: false }));
  group.add(createMesh(capPieces, materials.bambooNode, { castShadow: false }));

  const ropePieces = [];
  [-1.15, 0.05, 1.2].forEach((x) => {
    addCylinder(ropePieces, 0.019, 0.019, 1.5, 8, x, 0.145, 0, Math.PI / 2, 0, 0);
    [-0.664, 0.664].forEach((z) => {
      const ring = new THREE.TorusGeometry(CULM_RADIUS + 0.012, 0.018, 8, 20);
      ring.rotateY(Math.PI / 2);
      ring.translate(x, culmHeight(x) + 0.004, z);
      ropePieces.push(ring);
    });
  });
  group.add(createMesh(ropePieces, materials.rope, { castShadow: false }));

  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(2.16, 0.014, 1.2),
    materials.mat,
  );
  mat.position.set(-0.1, RAFT_DECK_Y - 0.005, 0);
  mat.castShadow = true;
  mat.receiveShadow = true;
  group.add(mat);

  return group;
}

function createProps(materials) {
  const group = new THREE.Group();
  const y = RAFT_DECK_Y;

  const basketGroup = new THREE.Group();
  const basketPieces = [];
  addCylinder(basketPieces, 0.145, 0.115, 0.26, 14, 0, 0.13, 0);
  const basketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.115, 0.26, 16, 1, true),
    materials.basket,
  );
  basketBody.position.y = 0.13;
  basketBody.castShadow = true;
  basketBody.receiveShadow = true;
  basketGroup.add(basketBody);

  const basketBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.115, 16),
    materials.basket,
  );
  basketBottom.rotation.x = -Math.PI / 2;
  basketBottom.position.y = 0.004;
  basketGroup.add(basketBottom);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.17, 0.11, 16, 1, true),
    materials.basket,
  );
  lid.position.y = 0.315;
  lid.castShadow = true;
  basketGroup.add(lid);

  const lidTop = new THREE.Mesh(new THREE.CircleGeometry(0.02, 10), materials.bambooNode);
  lidTop.rotation.x = -Math.PI / 2;
  lidTop.position.y = 0.371;
  basketGroup.add(lidTop);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.011, 6, 18, Math.PI),
    materials.rope,
  );
  handle.position.y = 0.3;
  basketGroup.add(handle);
  basketGroup.position.set(-0.95, y, 0.44);
  basketGroup.rotation.y = 0.5;
  group.add(basketGroup);

  const teapot = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.088, 18, 14), materials.clay);
  body.scale.set(1, 0.78, 1);
  body.position.y = 0.068;
  body.castShadow = true;
  teapot.add(body);

  const lidRing = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.022, 14), materials.clay);
  lidRing.position.y = 0.135;
  teapot.add(lidRing);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), materials.clay);
  knob.position.y = 0.153;
  teapot.add(knob);

  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.026, 0.13, 10), materials.clay);
  spout.position.set(0.085, 0.08, 0);
  spout.rotation.z = -0.85;
  teapot.add(spout);

  const teaHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.012, 6, 14, Math.PI * 1.15),
    materials.clay,
  );
  teaHandle.position.set(-0.085, 0.075, 0);
  teaHandle.rotation.y = Math.PI / 2;
  teaHandle.rotation.z = Math.PI * 0.42;
  teapot.add(teaHandle);
  teapot.position.set(0.36, y, -0.42);
  teapot.rotation.y = -0.5;
  group.add(teapot);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.05, 12, 1, true), materials.clay);
  cup.position.set(0.54, y + 0.025, -0.33);
  cup.castShadow = true;
  group.add(cup);

  const cupBase = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), materials.clay);
  cupBase.rotation.x = -Math.PI / 2;
  cupBase.position.set(0.54, y + 0.002, -0.33);
  group.add(cupBase);

  const gourd = new THREE.Group();
  const gourdBody = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), materials.gourd);
  gourdBody.scale.set(1, 0.92, 1);
  gourdBody.position.y = 0.078;
  gourdBody.castShadow = true;
  gourd.add(gourdBody);
  const gourdNeck = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 10), materials.gourd);
  gourdNeck.position.y = 0.168;
  gourd.add(gourdNeck);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.03, 8), materials.rope);
  cork.position.y = 0.214;
  gourd.add(cork);
  const gourdCord = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.007, 5, 14, Math.PI * 1.6),
    materials.rope,
  );
  gourdCord.position.y = 0.132;
  gourdCord.rotation.y = 0.7;
  gourd.add(gourdCord);
  gourd.position.set(-0.32, y, 0.5);
  gourd.rotation.z = 0.16;
  group.add(gourd);

  const coilPieces = [];
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.TorusGeometry(0.135 - i * 0.018, 0.014, 6, 20);
    ring.rotateX(Math.PI / 2);
    ring.translate(-0.69, y + 0.016 + i * 0.02, -0.44);
    coilPieces.push(ring);
  }
  group.add(createMesh(coilPieces, materials.rope));

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.03, 2.8, 9),
    materials.bambooPole,
  );
  pole.rotation.z = Math.PI / 2;
  pole.rotation.y = 0.05;
  pole.position.set(0.02, y + 0.05, -0.58);
  pole.castShadow = true;
  group.add(pole);

  const poleBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.031, 0.031, 0.05, 9),
    materials.bambooNode,
  );
  poleBand.rotation.z = Math.PI / 2;
  poleBand.position.set(1.28, y + 0.05, -0.56);
  group.add(poleBand);

  return group;
}

function createLantern(materials) {
  const group = new THREE.Group();

  const polePieces = [];
  polePieces.push(cylinderBetween(
    new THREE.Vector3(-1.52, RAFT_DECK_Y, -0.12),
    new THREE.Vector3(-1.5, 1.18, -0.1),
    0.036,
    0.028,
    8,
  ));
  polePieces.push(cylinderBetween(
    new THREE.Vector3(-1.5, 1.17, -0.1),
    new THREE.Vector3(-1.5, 1.13, 0.44),
    0.024,
    0.018,
    7,
  ));
  group.add(createMesh(polePieces, materials.bambooPole));

  const tiePieces = [];
  tiePieces.push(cylinderBetween(
    new THREE.Vector3(-1.5, 1.13, 0.44),
    new THREE.Vector3(-1.5, 1.03, 0.44),
    0.006,
    0.006,
    5,
  ));
  tiePieces.push(cylinderBetween(
    new THREE.Vector3(-1.52, RAFT_DECK_Y + 0.01, -0.12),
    new THREE.Vector3(-1.62, RAFT_DECK_Y + 0.01, -0.12),
    0.02,
    0.02,
    6,
  ));
  group.add(createMesh(tiePieces, materials.rope, { castShadow: false }));

  const lanternBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.108, 20, 16),
    materials.lantern,
  );
  lanternBody.scale.set(1, 1.16, 1);
  lanternBody.position.set(-1.5, 0.9, 0.44);
  lanternBody.castShadow = true;
  group.add(lanternBody);

  const caps = [];
  addCylinder(caps, 0.052, 0.066, 0.03, 14, -1.5, 1.03, 0.44);
  addCylinder(caps, 0.066, 0.052, 0.03, 14, -1.5, 0.77, 0.44);
  group.add(createMesh(caps, materials.lanternGold, { castShadow: false }));

  const tasselPieces = [];
  tasselPieces.push(cylinderBetween(
    new THREE.Vector3(-1.5, 0.764, 0.44),
    new THREE.Vector3(-1.5, 0.665, 0.44),
    0.006,
    0.004,
    5,
  ));
  group.add(createMesh(tasselPieces, materials.lantern, { castShadow: false }));

  const tassel = new THREE.Mesh(
    new THREE.ConeGeometry(0.022, 0.075, 8),
    materials.lantern,
  );
  tassel.position.set(-1.5, 0.625, 0.44);
  group.add(tassel);

  const glowMaterial = new THREE.SpriteMaterial({
    map: materials.textures.glow,
    color: new THREE.Color('#ffc07c'),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(1.05, 1.05, 1);
  glow.position.set(-1.5, 0.9, 0.44);
  glow.renderOrder = 4;
  // Kept out of the mirror pass so the glow does not become a bright blob in the reflection.
  glow.layers.set(1);
  group.add(glow);

  const light = new THREE.PointLight('#ffa15c', 16, 4.4, 2);
  light.position.set(-1.47, 0.95, 0.44);
  group.add(light);

  function update(time) {
    const flicker = Math.sin(time * 9.1) * 0.8 + Math.sin(time * 21.7 + 1.3) * 0.4;
    light.intensity = 16 + flicker;
    glowMaterial.opacity = 0.39 + Math.sin(time * 7.4) * 0.03;
    const scale = 1.03 + Math.sin(time * 6.2) * 0.025;
    glow.scale.set(scale, scale, 1);
  }

  return { group, update, light };
}

function createContactShadow(materials) {
  const material = new THREE.MeshBasicMaterial({
    map: materials.textures.shadow,
    color: '#000000',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.3), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.047, 0);
  mesh.renderOrder = 3;
  return mesh;
}

export function createRaft(materials) {
  const group = new THREE.Group();
  group.add(createRaftBody(materials));
  group.add(createProps(materials));
  const lantern = createLantern(materials);
  group.add(lantern.group);
  group.add(createContactShadow(materials));

  function update(time) {
    lantern.update(time);
  }

  return { group, update, lantern, deckY: RAFT_DECK_Y };
}
