import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addTube,
  boxBetween,
  createMesh,
  mergeGeos,
  tubeBetween,
} from '../../shared/geometry.js';

const Z_AXIS = new THREE.Vector3(0, 0, 1);

function makeRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash3(x, y, z) {
  return (
    Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1
  );
}

function createRockGeometry(x, y, z, sx, sy, sz, seed) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const stone = new THREE.Color('#7e8071');
  const stoneDark = new THREE.Color('#585c53');
  const moss = new THREE.Color('#536540');
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const ox = position.getX(i);
    const oy = position.getY(i);
    const oz = position.getZ(i);
    const noise =
      Math.sin(ox * 3.4 + seed * 1.7) * 0.42 +
      Math.cos(oy * 4.6 + seed * 0.81) * 0.28 +
      Math.sin(oz * 5.1 + seed * 2.2) * 0.22;
    const radial = 1 + noise * 0.2;
    const px = ox * radial * sx + x;
    let py = oy * radial * sy + y;
    const pz = oz * radial * sz + z;
    py = Math.max(py, 0.015);
    position.setXYZ(i, px, py, pz);

    const variation = hash3(ox + seed, oy - seed, oz + seed * 0.5);
    color.copy(stone).lerp(stoneDark, 0.22 + variation * 0.45);
    const mossAmount = smoothstep(0.05, 0.85, oy) * (0.35 + variation * 0.45);
    color.lerp(moss, mossAmount);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createIslet(materials, { x, z, radius, height, seed, scaleX = 1, scaleZ = 1 }) {
  const random = makeRandom(seed);
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.16, height, 36, 3, false).toNonIndexed();
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    let px = position.getX(i);
    let py = position.getY(i) + height / 2;
    let pz = position.getZ(i);
    const angle = Math.atan2(pz, px);
    const radial = Math.hypot(px, pz);
    const edge =
      Math.sin(angle * 4.2 + seed) * 0.055 +
      Math.sin(angle * 8.1 + seed * 0.7) * 0.03 +
      Math.cos(angle * 2.4 + seed * 1.9) * 0.028;
    const factor = 1 + edge * Math.min(1, radial / radius);
    px *= factor * scaleX;
    pz *= factor * scaleZ;
    if (py > height * 0.83) py += Math.sin(angle * 5 + seed) * 0.028;
    position.setXYZ(i, px, py, pz);
  }

  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const colors = new Float32Array(position.count * 3);
  const stone = new THREE.Color('#777769');
  const darkStone = new THREE.Color('#51564d');
  const moss = new THREE.Color('#4b5b3c');
  const wet = new THREE.Color('#3e4941');
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const py = position.getY(i);
    const ny = normals.getY(i);
    const variation = hash3(position.getX(i), py, position.getZ(i));
    color.copy(stone).lerp(darkStone, variation * 0.45);
    const topness =
      smoothstep(height * 0.55, height * 0.98, py) * 0.55 +
      Math.max(0, ny) * 0.45;
    color.lerp(moss, topness * (0.55 + variation * 0.25));
    if (py < height * 0.2) color.lerp(wet, 0.55);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mesh = new THREE.Mesh(geometry, materials.bank);
  mesh.position.set(x, 0, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addRock(list, x, y, z, sx, sy, sz, seed) {
  list.push(createRockGeometry(x, y, z, sx, sy, sz, seed));
}

function createBridge(materials) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(5.02, 0.8, 0.42),
      new THREE.Vector3(6.0, 1.02, 0.42),
      new THREE.Vector3(7.1, 1.16, 0.44),
      new THREE.Vector3(8.2, 1.03, 0.48),
      new THREE.Vector3(9.05, 0.71, 0.52),
      new THREE.Vector3(9.9, 0.43, 0.56),
    ],
    false,
    'catmullrom',
    0.5,
  );

  const archStone = [];
  const bridgeTrim = [];
  const shape = new THREE.Shape();
  const topPoints = [];
  for (let i = 0; i <= 36; i += 1) {
    const point = curve.getPoint(i / 36);
    topPoints.push([point.x, point.y - 0.1]);
  }
  shape.moveTo(topPoints[0][0], 0.02);
  shape.lineTo(topPoints[0][0], topPoints[0][1]);
  topPoints.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.lineTo(topPoints[topPoints.length - 1][0], 0.02);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(6.95, 0.03);
  hole.absarc(7.72, 0.03, 0.77, Math.PI, 0, true);
  hole.lineTo(6.95, 0.03);
  shape.holes.push(hole);

  const arch = new THREE.ExtrudeGeometry(shape, {
    depth: 1.05,
    bevelEnabled: false,
    curveSegments: 28,
    steps: 1,
  });
  arch.translate(0, 0, -0.525);
  arch.translate(0, 0, 0.42);
  archStone.push(arch);

  const segments = 23;
  for (let i = 0; i < segments; i += 1) {
    const t = (i + 0.5) / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const yaw = Math.atan2(tangent.x, tangent.z);
    addBox(bridgeTrim, 1.36, 0.105, 0.34, point.x, point.y - 0.05, point.z, 0, yaw, 0);
  }

  addBox(bridgeTrim, 1.5, 0.1, 1.3, 5.27, 0.78, 0.42);

  for (const side of [-1, 1]) {
    const railPoints = [];
    const posts = [];
    for (let i = 0; i <= 8; i += 1) {
      const t = 0.015 + (i / 8) * 0.97;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const yaw = Math.atan2(tangent.x, tangent.z);
      const nx = -tangent.z;
      const nz = tangent.x;
      const length = Math.hypot(nx, nz) || 1;
      const x = point.x + (nx / length) * 0.64 * side;
      const z = point.z + (nz / length) * 0.64 * side;
      posts.push(new THREE.Vector3(x, point.y, z));
      addBox(bridgeTrim, 0.105, 0.52, 0.105, x, point.y + 0.26, z, 0, yaw, 0);
      addBox(bridgeTrim, 0.16, 0.05, 0.16, x, point.y + 0.53, z, 0, yaw, 0);
      railPoints.push(new THREE.Vector3(x, point.y + 0.55, z));
    }
    addTube(bridgeTrim, railPoints, 0.044, 28, 5);

    for (let i = 0; i < posts.length - 1; i += 1) {
      const a = posts[i];
      const b = posts[i + 1];
      const midY = (a.y + b.y) / 2 + 0.16;
      bridgeTrim.push(
        boxBetween(
          new THREE.Vector3(a.x, midY, a.z),
          new THREE.Vector3(b.x, midY, b.z),
          0.055,
          0.3,
        ),
      );
    }
  }

  for (const z of [-0.11, 0.95]) {
    const rim = new THREE.TorusGeometry(0.79, 0.045, 6, 28, Math.PI);
    rim.translate(7.72, 0.035, z);
    bridgeTrim.push(rim);
  }

  const archMesh = createMesh(archStone, materials.stoneBridge);
  archMesh.position.y = 0;
  group.add(archMesh);

  const trimMesh = createMesh(bridgeTrim, materials.stoneStep);
  group.add(trimMesh);

  return group;
}

function createStoneLantern(materials) {
  const group = new THREE.Group();
  const stone = [];

  addCylinder(stone, 0.34, 0.38, 0.14, 8, 0, 0.07, 0);
  addCylinder(stone, 0.12, 0.15, 0.62, 8, 0, 0.45, 0);
  addCylinder(stone, 0.32, 0.24, 0.09, 8, 0, 0.8, 0);
  addBox(stone, 0.32, 0.3, 0.32, 0, 1.0, 0);
  addBox(stone, 0.28, 0.04, 0.28, 0, 1.17, 0);
  addCylinder(stone, 0.05, 0.05, 0.16, 6, 0, 1.47, 0);
  addCylinder(stone, 0.1, 0.1, 0.05, 8, 0, 1.57, 0);

  const roof = new THREE.ConeGeometry(0.45, 0.27, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 1.295, 0);
  stone.push(roof);

  const stoneMesh = createMesh(stone, materials.stoneStep);
  group.add(stoneMesh);

  const lightCore = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), materials.paperGlow);
  lightCore.position.set(0, 1.0, 0);
  group.add(lightCore);

  const glowMaterial = new THREE.SpriteMaterial({
    map: materials.textures.glow,
    color: new THREE.Color('#ffb46b'),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(1.7, 1.7, 1);
  glow.position.set(0, 1.02, 0);
  group.add(glow);

  const light = new THREE.PointLight('#ffac66', 5, 4.5, 2);
  light.position.set(0, 1.1, 0);
  group.add(light);

  return { group, glowMaterial, light };
}

function createLeafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.065, 0.12, 0.08, 0.32, 0, 0.53);
  shape.bezierCurveTo(-0.08, 0.32, -0.065, 0.12, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 5);
  geometry.computeVertexNormals();
  return geometry;
}

function createBambooCluster(materials, leafGeometry, { x, y, z, stalks, seed, minHeight, maxHeight }) {
  const random = makeRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const stalkPieces = [];
  const nodePieces = [];
  const leafTransforms = [];
  const leafColors = [];

  for (let s = 0; s < stalks; s += 1) {
    const angle = random() * Math.PI * 2;
    const offset = 0.2 + random() * 0.9;
    const bx = Math.cos(angle) * offset;
    const bz = Math.sin(angle) * offset;
    const height = minHeight + random() * (maxHeight - minHeight);
    const leanDirection = random() * Math.PI * 2;
    const lean = 0.18 + random() * 0.42;
    const tipX = bx + Math.cos(leanDirection) * lean;
    const tipZ = bz + Math.sin(leanDirection) * lean;
    const midX = bx + Math.cos(leanDirection) * lean * 0.24 + (random() - 0.5) * 0.13;
    const midZ = bz + Math.sin(leanDirection) * lean * 0.24 + (random() - 0.5) * 0.13;
    const radius = 0.026 + random() * 0.014;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, 0.02, bz),
      new THREE.Vector3(midX, height * 0.32, midZ),
      new THREE.Vector3(
        bx + Math.cos(leanDirection) * lean * 0.58,
        height * 0.68,
        bz + Math.sin(leanDirection) * lean * 0.58,
      ),
      new THREE.Vector3(tipX, height, tipZ),
    ]);
    stalkPieces.push(new THREE.TubeGeometry(curve, 18, radius, 5, false));

    for (let i = 2; i < 9; i += 1) {
      const point = curve.getPoint(i / 10);
      addCylinder(nodePieces, radius * 1.35, radius * 1.35, 0.018, 6, point.x, point.y, point.z);
    }

    const branchCount = 2 + Math.floor(random() * 2);
    for (let b = 0; b < branchCount; b += 1) {
      const t = 0.55 + random() * 0.38;
      const point = curve.getPoint(t);
      const branchAngle = random() * Math.PI * 2;
      const length = 0.3 + random() * 0.55;
      const end = new THREE.Vector3(
        point.x + Math.cos(branchAngle) * length,
        point.y + 0.08 + random() * 0.32,
        point.z + Math.sin(branchAngle) * length,
      );
      const mid = point.clone().lerp(end, 0.55);
      mid.y += 0.1;
      stalkPieces.push(tubeBetween([point, mid, end], 0.009, 8, 4));
    }

    const leaves = 20 + Math.floor(random() * 9);
    for (let i = 0; i < leaves; i += 1) {
      const t = 0.58 + random() * 0.44;
      const point = curve.getPoint(t);
      const leafAngle = random() * Math.PI * 2;
      const distance = 0.12 + random() * 0.72;
      const position = new THREE.Vector3(
        point.x + Math.cos(leafAngle) * distance,
        point.y + (random() - 0.25) * 0.45,
        point.z + Math.sin(leafAngle) * distance,
      );
      const yaw = random() * Math.PI * 2;
      const droop = 0.52 + random() * 0.9;
      const quaternion = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
        .multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, droop));
      const scale = 0.52 + random() * 0.72;
      const matrix = new THREE.Matrix4().compose(
        position,
        quaternion,
        new THREE.Vector3(scale, scale, scale),
      );
      leafTransforms.push(matrix);
      leafColors.push(
        new THREE.Color().setHSL(
          0.22 + random() * 0.07,
          0.25 + random() * 0.2,
          0.3 + random() * 0.13,
        ),
      );
    }
  }

  const stalkMesh = createMesh(stalkPieces, materials.bamboo);
  group.add(stalkMesh);
  const nodeMesh = createMesh(nodePieces, materials.bambooNode);
  group.add(nodeMesh);

  const leaves = new THREE.InstancedMesh(leafGeometry, materials.leaves, leafTransforms.length);
  leafTransforms.forEach((matrix, index) => {
    leaves.setMatrixAt(index, matrix);
    leaves.setColorAt(index, leafColors[index]);
  });
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  leaves.castShadow = false;
  leaves.receiveShadow = true;
  leaves.computeBoundingSphere();
  group.add(leaves);

  return { group, phase: random() * Math.PI * 2 };
}

function createPadGeometry() {
  const geometry = new THREE.CircleGeometry(1, 36, 0.36, Math.PI * 2 - 0.72);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const r = Math.hypot(x, z);
    position.setY(i, 0.018 + r * r * 0.05);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createPetalGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.095, 0.12, 0.11, 0.31, 0, 0.48);
  shape.bezierCurveTo(-0.11, 0.31, -0.095, 0.12, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 6);
  geometry.computeVertexNormals();
  return geometry;
}

function createLotusFlower(materials, petalGeometry, x, z, scale, seed) {
  const random = makeRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0.05, z);

  const petals = [];
  const layers = [
    { count: 8, tilt: 1.04, scale: 0.96, offset: 0 },
    { count: 7, tilt: 0.74, scale: 0.8, offset: 0.23 },
    { count: 5, tilt: 0.43, scale: 0.61, offset: 0.51 },
  ];

  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (i / layer.count) * Math.PI * 2 + layer.offset + layerIndex * 0.18;
      const quaternion = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        .multiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            layer.tilt + (random() - 0.5) * 0.08,
          ),
        );
      const petal = petalGeometry.clone();
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.14 + layerIndex * 0.018, 0),
        quaternion,
        new THREE.Vector3(layer.scale, layer.scale, layer.scale),
      );
      petal.applyMatrix4(matrix);
      petals.push(petal);
    }
  });

  const petalMesh = new THREE.Mesh(mergeGeos(petals), materials.lotusPetal);
  petalMesh.castShadow = true;
  petalMesh.receiveShadow = true;
  group.add(petalMesh);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.06, 12), materials.lotusCenter);
  core.position.y = 0.24;
  group.add(core);

  group.scale.setScalar(scale);
  return { group, baseY: 0.05, phase: random() * Math.PI * 2 };
}

function createLotusBud(materials, petalGeometry, x, z, scale, seed) {
  const random = makeRandom(seed);
  const group = new THREE.Group();
  group.position.set(x, 0.04, z);

  const petals = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + random() * 0.2;
    const quaternion = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)
      .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.22));
    const petal = petalGeometry.clone();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0.1, 0),
      quaternion,
      new THREE.Vector3(0.6, 0.78, 0.6),
    );
    petal.applyMatrix4(matrix);
    petals.push(petal);
  }
  const bud = new THREE.Mesh(mergeGeos(petals), materials.lotusPetal);
  bud.castShadow = true;
  group.add(bud);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 6), materials.bamboo);
  stem.position.y = -0.16;
  group.add(stem);

  const sepals = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 6), materials.lotusPad);
  sepals.position.y = 0.1;
  group.add(sepals);

  group.scale.setScalar(scale);
  return group;
}

function createLotus(materials) {
  const group = new THREE.Group();
  const padGeometry = createPadGeometry();
  const petalGeometry = createPetalGeometry();
  const random = makeRandom(7319);

  const clusters = [
    { x: -5.0, z: 4.55, radius: 1.45, count: 12 },
    { x: 4.9, z: 4.75, radius: 1.3, count: 10 },
    { x: -8.2, z: 4.3, radius: 1.0, count: 6 },
    { x: 7.2, z: 3.55, radius: 0.9, count: 5 },
    { x: -2.6, z: 5.35, radius: 0.8, count: 4 },
    { x: 3.25, z: 5.55, radius: 0.7, count: 4 },
    { x: -2.3, z: -4.4, radius: 1.0, count: 5 },
  ];

  const padMatrices = [];
  const padColors = [];
  clusters.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * cluster.radius;
      const x = cluster.x + Math.cos(angle) * distance;
      const z = cluster.z + Math.sin(angle) * distance;
      const size = 0.24 + random() * 0.34;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0.048, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2),
        new THREE.Vector3(size, size, size),
      );
      padMatrices.push(matrix);
      padColors.push(
        new THREE.Color().setHSL(
          0.28 + random() * 0.05,
          0.26 + random() * 0.16,
          0.27 + random() * 0.12,
        ),
      );
    }
  });

  const pads = new THREE.InstancedMesh(padGeometry, materials.lotusPad, padMatrices.length);
  padMatrices.forEach((matrix, index) => {
    pads.setMatrixAt(index, matrix);
    pads.setColorAt(index, padColors[index]);
  });
  pads.instanceMatrix.needsUpdate = true;
  if (pads.instanceColor) pads.instanceColor.needsUpdate = true;
  pads.castShadow = true;
  pads.receiveShadow = true;
  pads.computeBoundingSphere();
  group.add(pads);

  const flowers = [
    createLotusFlower(materials, petalGeometry, -5.2, 4.45, 1.18, 21),
    createLotusFlower(materials, petalGeometry, 4.75, 4.9, 1.02, 32),
    createLotusFlower(materials, petalGeometry, -2.6, 5.35, 1.15, 55),
    createLotusFlower(materials, petalGeometry, 3.25, 5.55, 0.98, 63),
    createLotusFlower(materials, petalGeometry, -2.1, -4.35, 0.8, 45),
  ];
  flowers.forEach((flower) => group.add(flower.group));

  const buds = [
    createLotusBud(materials, petalGeometry, -4.3, 5.1, 0.9, 12),
    createLotusBud(materials, petalGeometry, 5.7, 4.2, 0.8, 24),
  ];
  buds.forEach((bud) => group.add(bud));

  const floatingMatrices = [];
  for (let i = 0; i < 18; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 1.2 + random() * 3.2;
    const x = -4.2 + Math.cos(angle) * radius;
    const z = 4.6 + Math.sin(angle) * radius * 0.55;
    const quaternion = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(-Math.PI / 2, 0, random() * Math.PI * 2, 'YXZ'));
    const scale = 0.12 + random() * 0.12;
    floatingMatrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0.075, z),
        quaternion,
        new THREE.Vector3(scale, scale, scale),
      ),
    );
  }
  const petals = new THREE.InstancedMesh(petalGeometry, materials.lotusPetal, floatingMatrices.length);
  floatingMatrices.forEach((matrix, index) => petals.setMatrixAt(index, matrix));
  petals.instanceMatrix.needsUpdate = true;
  petals.receiveShadow = true;
  petals.computeBoundingSphere();
  group.add(petals);

  function update(time) {
    flowers.forEach((flower) => {
      flower.group.position.y = flower.baseY + Math.sin(time * 0.7 + flower.phase) * 0.008;
      flower.group.rotation.y = Math.sin(time * 0.18 + flower.phase) * 0.04;
    });
  }

  return { group, update };
}

function createReedGeometry() {
  const geometry = new THREE.PlaneGeometry(0.035, 1, 1, 5);
  geometry.translate(0, 0.5, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    position.setX(i, position.getX(i) + y * y * 0.18);
    position.setZ(i, position.getZ(i) + y * y * 0.04);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createReeds(materials, isletData) {
  const random = makeRandom(6111);
  const geometry = createReedGeometry();
  const matrices = [];
  const colors = [];

  const pushBlade = (x, y, z, scale) => {
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      random() * Math.PI * 2,
    );
    matrices.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        quaternion,
        new THREE.Vector3(0.9 + random() * 0.8, scale, 0.9 + random() * 0.8),
      ),
    );
    colors.push(
      new THREE.Color().setHSL(
        0.2 + random() * 0.08,
        0.28 + random() * 0.18,
        0.27 + random() * 0.13,
      ),
    );
  };

  isletData.forEach((islet) => {
    const count = Math.round(islet.radius * 14);
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = islet.radius * (0.92 + random() * 0.2);
      const x = islet.x + Math.cos(angle) * radius * (islet.scaleX || 1);
      const z = islet.z + Math.sin(angle) * radius * (islet.scaleZ || 1);
      const base = islet.height - 0.04 + random() * 0.05;
      pushBlade(x, base, z, 0.45 + random() * 0.7);
    }
  });

  for (let i = 0; i < 34; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 5.2 + random() * 4.6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    pushBlade(x, 0.02, z, 0.35 + random() * 0.55);
  }

  const mesh = new THREE.InstancedMesh(geometry, materials.leaves, matrices.length);
  matrices.forEach((matrix, index) => {
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, colors[index]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function createDistantHills() {
  const group = new THREE.Group();
  const random = makeRandom(4421);
  const hillMaterial = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      metalness: 0,
      fog: true,
      emissive: new THREE.Color('#121b18'),
      emissiveIntensity: 0.22,
    });
  const nearMaterial = hillMaterial('#3f5651');
  const midMaterial = hillMaterial('#4d635d');
  const farMaterial = hillMaterial('#62756f');
  const hazeMaterial = hillMaterial('#7d8c84');
  const geometry = new THREE.SphereGeometry(1, 18, 10);

  const layers = [
    {
      count: 11,
      radius: [32, 46],
      height: [2.6, 6.8],
      width: [11, 21],
      depth: [7, 13],
      materials: [nearMaterial, nearMaterial, midMaterial],
    },
    {
      count: 10,
      radius: [48, 63],
      height: [6, 12],
      width: [22, 37],
      depth: [11, 20],
      materials: [midMaterial, farMaterial],
    },
    {
      count: 7,
      radius: [68, 92],
      height: [12, 23],
      width: [36, 56],
      depth: [16, 28],
      materials: [farMaterial, hazeMaterial],
    },
  ];

  const addHill = (angle, radius, width, height, depth, material, offset = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      Math.cos(angle) * radius + offset,
      -height * (0.52 + random() * 0.12),
      Math.sin(angle) * radius,
    );
    mesh.scale.set(width, height, depth);
    mesh.rotation.y = random() * Math.PI;
    group.add(mesh);
  };

  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (i / layer.count) * Math.PI * 2 + (random() - 0.5) * 0.28;
      const radius = layer.radius[0] + random() * (layer.radius[1] - layer.radius[0]);
      const width = layer.width[0] + random() * (layer.width[1] - layer.width[0]);
      const height = layer.height[0] + random() * (layer.height[1] - layer.height[0]);
      const depth = layer.depth[0] + random() * (layer.depth[1] - layer.depth[0]);
      const material = layer.materials[Math.floor(random() * layer.materials.length)];
      addHill(angle, radius, width, height, depth, material);
    }
  });

  // Taller layered peaks sit behind the pavilion in the opening view.
  [
    [3.72, 62, 46, 18, 22, midMaterial],
    [3.98, 74, 52, 21, 26, farMaterial],
    [4.22, 58, 37, 14, 18, nearMaterial],
    [4.48, 82, 58, 23, 28, hazeMaterial],
    [2.52, 70, 48, 17, 24, farMaterial],
    [5.18, 76, 47, 16, 20, midMaterial],
  ].forEach(([angle, radius, width, height, depth, material]) => {
    addHill(angle, radius, width, height, depth, material);
  });

  return group;
}

function createMist(materials) {
  const group = new THREE.Group();
  const material = new THREE.SpriteMaterial({
    map: materials.textures.mist,
    color: new THREE.Color('#ecd9bd'),
    transparent: true,
    opacity: 0.042,
    depthWrite: false,
    fog: true,
  });
  const random = makeRandom(341);
  const data = [];

  for (let i = 0; i < 6; i += 1) {
    const sprite = new THREE.Sprite(material);
    const angle = (i / 6) * Math.PI * 2 + random() * 0.35;
    const radius = 36 + random() * 14;
    const scale = 22 + random() * 14;
    sprite.scale.set(scale, scale * 0.24, 1);
    sprite.position.set(Math.cos(angle) * radius, 0.5 + random() * 0.9, Math.sin(angle) * radius);
    sprite.renderOrder = 1;
    group.add(sprite);
    data.push({ sprite, angle, radius, speed: 0.004 + random() * 0.006, baseY: sprite.position.y });
  }

  function update(time) {
    data.forEach((item, index) => {
      item.sprite.position.x = Math.cos(item.angle + time * item.speed) * item.radius;
      item.sprite.position.z = Math.sin(item.angle + time * item.speed) * item.radius;
      item.sprite.position.y = item.baseY + Math.sin(time * 0.18 + index) * 0.12;
    });
  }

  return { group, update };
}

function createDust(materials) {
  const random = makeRandom(9953);
  const count = 150;
  const positions = new Float32Array(count * 3);
  const data = [];
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 2 + random() * 11;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.4 + random() * 7.5;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    data.push({
      x,
      z,
      speed: 0.06 + random() * 0.14,
      phase: random() * Math.PI * 2,
      drift: 0.06 + random() * 0.12,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: materials.textures.glow,
    color: new THREE.Color('#ffd6a6'),
    size: 0.075,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  function update(time, delta) {
    const attribute = geometry.attributes.position;
    for (let i = 0; i < count; i += 1) {
      const item = data[i];
      let y = attribute.getY(i) + delta * item.speed;
      if (y > 8.2) y = 0.4;
      attribute.setY(i, y);
      attribute.setX(i, item.x + Math.sin(time * 0.22 + item.phase) * item.drift);
      attribute.setZ(i, item.z + Math.cos(time * 0.18 + item.phase) * item.drift * 0.7);
    }
    attribute.needsUpdate = true;
  }

  return { points, update };
}

export function createGarden(materials) {
  const group = new THREE.Group();

  const isletData = [
    { x: -7.9, z: 1.0, radius: 2.7, height: 0.48, seed: 11, scaleX: 1.1, scaleZ: 0.9 },
    { x: 10.35, z: 0.95, radius: 1.75, height: 0.46, seed: 23, scaleX: 1.0, scaleZ: 0.9 },
    { x: -4.8, z: -8.6, radius: 2.2, height: 0.38, seed: 37, scaleX: 1.15, scaleZ: 0.8 },
    { x: 13.5, z: -5.2, radius: 1.4, height: 0.34, seed: 51, scaleX: 1.2, scaleZ: 0.9 },
  ];

  isletData.forEach((islet) => {
    group.add(createIslet(materials, islet));
  });

  const rockGeometries = [];
  [
    [-8.9, 0.45, 0.25, 1.0, 0.75, 0.9, 3],
    [-6.9, 0.45, 1.75, 0.8, 0.6, 0.7, 8],
    [-7.4, 0.45, -0.4, 0.55, 0.4, 0.5, 17],
    [9.9, 0.43, 0.5, 0.7, 0.55, 0.65, 21],
    [10.8, 0.43, 1.5, 0.55, 0.45, 0.6, 29],
    [10.6, 0.43, 0.2, 0.4, 0.35, 0.4, 31],
    [-4.6, 0.22, 3.35, 1.15, 0.55, 0.85, 41],
    [4.5, 0.18, 3.55, 0.9, 0.48, 0.75, 47],
    [-5.1, 0.18, -3.4, 1.3, 0.6, 0.95, 53],
    [4.75, 0.16, -3.35, 1.0, 0.52, 0.8, 59],
    [-4.7, 0.15, -3.3, 0.75, 0.36, 0.6, 61],
    [7.8, 0.08, -2.4, 0.65, 0.32, 0.5, 67],
    [-10.5, 0.3, -6.9, 1.0, 0.5, 0.8, 71],
    [13.2, 0.3, -4.8, 0.72, 0.42, 0.65, 73],
  ].forEach(([x, y, z, sx, sy, sz, seed]) => addRock(rockGeometries, x, y, z, sx, sy, sz, seed));
  const rockMesh = createMesh(rockGeometries, materials.rock);
  group.add(rockMesh);

  group.add(createBridge(materials));

  const leafGeometry = createLeafGeometry();
  const bambooClusters = [
    createBambooCluster(materials, leafGeometry, {
      x: -8.1,
      y: 0.45,
      z: 1.0,
      stalks: 8,
      seed: 81,
      minHeight: 3.6,
      maxHeight: 5.6,
    }),
    createBambooCluster(materials, leafGeometry, {
      x: 10.5,
      y: 0.42,
      z: 1.0,
      stalks: 4,
      seed: 89,
      minHeight: 2.8,
      maxHeight: 4.4,
    }),
    createBambooCluster(materials, leafGeometry, {
      x: -4.9,
      y: 0.36,
      z: -8.6,
      stalks: 4,
      seed: 97,
      minHeight: 3.6,
      maxHeight: 5.3,
    }),
  ];
  bambooClusters.forEach((cluster) => group.add(cluster.group));

  const lotus = createLotus(materials);
  group.add(lotus.group);

  group.add(createReeds(materials, isletData));

  const stoneLantern = createStoneLantern(materials);
  stoneLantern.group.position.set(10.0, 0.46, 2.15);
  group.add(stoneLantern.group);

  const hills = createDistantHills();
  group.add(hills);

  const mist = createMist(materials);
  group.add(mist.group);

  const dust = createDust(materials);
  group.add(dust.points);

  function update(time, delta) {
    bambooClusters.forEach((cluster, index) => {
      cluster.group.rotation.z = Math.sin(time * 0.36 + cluster.phase) * 0.008;
      cluster.group.rotation.x = Math.cos(time * 0.28 + cluster.phase * 1.3) * 0.004;
      cluster.group.rotation.y = Math.sin(time * 0.14 + index) * 0.002;
    });
    lotus.update(time);
    mist.update(time);
    dust.update(time, delta);
    stoneLantern.glowMaterial.opacity = 0.44 + Math.sin(time * 1.6 + 0.4) * 0.05;
    stoneLantern.light.intensity = 5 + Math.sin(time * 2.1) * 0.35;
  }

  return { group, update };
}
