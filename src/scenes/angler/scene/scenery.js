import * as THREE from 'three';
import {
  addCylinder,
  addSphere,
  createMesh,
  cylinderBetween,
  mergeGeos,
  tubeBetween,
} from '../../shared/geometry.js';

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
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
}

function createRockGeometry(x, y, z, sx, sy, sz, seed, minY = 0.01) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const stone = new THREE.Color('#6d7065');
  const stoneDark = new THREE.Color('#4b514b');
  const moss = new THREE.Color('#43553a');
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
    py = Math.max(py, minY);
    position.setXYZ(i, px, py, pz);

    const variation = hash3(ox + seed, oy - seed, oz + seed * 0.5);
    color.copy(stone).lerp(stoneDark, 0.2 + variation * 0.45);
    const mossAmount = smoothstep(0.02, 0.9, oy) * (0.32 + variation * 0.42);
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
  const geometry = new THREE.CylinderGeometry(radius, radius * 1.42, height, 40, 4, false).toNonIndexed();
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    let px = position.getX(i);
    let py = position.getY(i) + height / 2;
    let pz = position.getZ(i);
    const angle = Math.atan2(pz, px);
    const radial = Math.hypot(px, pz);
    const edge =
      Math.sin(angle * 4.1 + seed) * 0.06 +
      Math.sin(angle * 8.4 + seed * 0.7) * 0.032 +
      Math.cos(angle * 2.6 + seed * 1.9) * 0.03;
    const factor = 1 + edge * Math.min(1, radial / radius);
    px *= factor * scaleX;
    pz *= factor * scaleZ;
    if (py > height * 0.8) py += Math.sin(angle * 5 + seed) * 0.03;
    position.setXYZ(i, px, py, pz);
  }

  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const colors = new Float32Array(position.count * 3);
  const stone = new THREE.Color('#686c60');
  const darkStone = new THREE.Color('#454b45');
  const moss = new THREE.Color('#405138');
  const wet = new THREE.Color('#323e38');
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const py = position.getY(i);
    const ny = normals.getY(i);
    const variation = hash3(position.getX(i), py, position.getZ(i));
    color.copy(stone).lerp(darkStone, variation * 0.45);
    const topness = smoothstep(height * 0.55, height * 0.98, py) * 0.55 + Math.max(0, ny) * 0.45;
    color.lerp(moss, topness * (0.5 + variation * 0.28));
    if (py < height * 0.22) color.lerp(wet, 0.5);
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

function createShore(materials) {
  const group = new THREE.Group();
  const islets = [
    { x: -8.8, z: -5.0, radius: 1.55, height: 0.55, seed: 1.7, scaleX: 2.5, scaleZ: 1.0 },
    { x: -4.6, z: -6.8, radius: 1.1, height: 0.4, seed: 4.2, scaleX: 1.3, scaleZ: 0.9 },
  ];

  islets.forEach((islet) => group.add(createIslet(materials, islet)));

  const rocks = [
    [-8.4, 0.44, -5.2, 0.5, 0.5, 0.4, 2.1, 0.25],
    [-6.9, 0.5, -4.6, 0.42, 0.34, 0.36, 5.3, 0.4],
    [-6.3, 0.45, -5.5, 0.34, 0.3, 0.3, 8.7, 0.35],
    [-8.9, 0.4, -4.6, 0.42, 0.36, 0.34, 3.4, 0.2],
    [-7.9, 0.54, -4.2, 0.3, 0.26, 0.28, 6.6, 0.4],
    [-6.5, 0.5, -4.0, 0.55, 0.32, 0.44, 9.4, -0.2],
    [-4.8, 0.05, -3.4, 0.42, 0.36, 0.36, 7.8, -0.3],
    [-3.9, 0.03, -4.0, 0.26, 0.22, 0.24, 11.2, -0.2],
    [-5.6, 0.12, -3.6, 0.5, 0.28, 0.4, 12.4, -0.1],
    [-7.2, 0.1, -3.8, 0.55, 0.3, 0.45, 13.1, -0.1],
    [-8.6, 0.12, -4.0, 0.45, 0.26, 0.4, 14.3, -0.1],
    [-6.0, 0.08, -6.0, 0.4, 0.25, 0.36, 15.2, -0.1],
  ];

  const rockPieces = rocks.map(([x, y, z, sx, sy, sz, seed, minY]) => {
    const min = minY < 0 ? minY : 0.02;
    return createRockGeometry(x, y, z, sx, sy, sz, seed, min);
  });
  const rockMesh = new THREE.Mesh(mergeGeos(rockPieces), materials.rock);
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  group.add(rockMesh);

  const post = new THREE.Group();
  const postPieces = [];
  postPieces.push(cylinderBetween(
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(0.06, 0.58, 0.03),
    0.055,
    0.042,
    8,
  ));
  post.add(createMesh(postPieces, materials.bambooNode));
  const postRope = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.014, 6, 12),
    materials.rope,
  );
  postRope.rotation.z = Math.PI / 2;
  postRope.position.set(0.03, 0.48, 0.02);
  post.add(postRope);
  post.position.set(-2.6, 0, -1.4);
  group.add(post);

  return { group, islets };
}

function createReeds(materials, islets) {
  const random = makeRandom(8117);
  const geometry = new THREE.PlaneGeometry(0.034, 1, 1, 5);
  geometry.translate(0, 0.5, 0);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    position.setX(i, position.getX(i) + y * y * 0.2);
    position.setZ(i, position.getZ(i) + y * y * 0.05);
  }
  geometry.computeVertexNormals();

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
        new THREE.Vector3(0.85 + random() * 0.9, scale, 0.85 + random() * 0.9),
      ),
    );
    colors.push(
      new THREE.Color().setHSL(
        0.19 + random() * 0.09,
        0.24 + random() * 0.18,
        0.28 + random() * 0.14,
      ),
    );
  };

  islets.forEach((islet) => {
    const count = Math.round(islet.radius * 18);
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = islet.radius * (0.9 + random() * 0.22);
      const x = islet.x + Math.cos(angle) * radius * (islet.scaleX || 1);
      const z = islet.z + Math.sin(angle) * radius * (islet.scaleZ || 1);
      pushBlade(x, islet.height - 0.05 + random() * 0.05, z, 0.5 + random() * 0.8);
    }

    for (let i = 0; i < 22; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = islet.radius * Math.sqrt(random()) * 0.9;
      const x = islet.x + Math.cos(angle) * radius * (islet.scaleX || 1);
      const z = islet.z + Math.sin(angle) * radius * (islet.scaleZ || 1);
      pushBlade(x, islet.height - 0.02, z, 0.14 + random() * 0.2);
    }
  });

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

function createLeafGeometry(width, length) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width, length * 0.24, width * 0.82, length * 0.72, 0, length);
  shape.bezierCurveTo(-width * 0.82, length * 0.72, -width, length * 0.24, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 6);
  geometry.translate(0, -length * 0.5, 0);
  return geometry;
}

function createWillow(materials) {
  const group = new THREE.Group();
  group.position.set(-8.0, 0.5, -5.1);

  const barkMaterial = new THREE.MeshStandardMaterial({
    color: '#5d5645',
    roughness: 0.98,
    metalness: 0,
  });
  const strandMaterial = new THREE.MeshStandardMaterial({
    color: '#757c4e',
    roughness: 0.92,
  });

  const trunkCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.14, 0.8, 0.16),
      new THREE.Vector3(0.34, 1.52, 0.27),
      new THREE.Vector3(0.5, 2.14, 0.35),
    ],
    false,
    'catmullrom',
    0.4,
  );

  const trunkPieces = [new THREE.TubeGeometry(trunkCurve, 20, 0.115, 8, false)];
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    trunkPieces.push(cylinderBetween(
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(Math.cos(angle) * 0.34, -0.08, Math.sin(angle) * 0.3),
      0.075,
      0.02,
      6,
    ));
  }

  const random = makeRandom(3329);
  const branchCurves = [];
  const branchAnchors = [0.36, 0.45, 0.55, 0.65, 0.75, 0.85, 0.94];
  branchAnchors.forEach((anchor, index) => {
    const start = trunkCurve.getPoint(anchor);
    const angle = index * 1.55 + random() * 0.6;
    const reach = 0.8 + random() * 0.6;
    const end = new THREE.Vector3(
      start.x + Math.cos(angle) * reach,
      start.y + 0.32 + random() * 0.35,
      start.z + Math.sin(angle) * reach,
    );
    const mid = start.clone().lerp(end, 0.5);
    mid.y += 0.18;
    const curve = new THREE.CatmullRomCurve3([start, mid, end], false, 'catmullrom', 0.4);
    branchCurves.push(curve);
    trunkPieces.push(new THREE.TubeGeometry(curve, 14, 0.034, 6, false));
  });

  group.add(createMesh(trunkPieces, barkMaterial));

  const strandPieces = [];
  const strandCurves = [];
  for (let i = 0; i < 44; i += 1) {
    const baseCurve = branchCurves[i % branchCurves.length];
    const start = baseCurve.getPoint(0.38 + random() * 0.62);
    const length = 0.95 + random() * 1.35;
    const drift = 0.12 + random() * 0.34;
    const angle = random() * Math.PI * 2;
    const end = new THREE.Vector3(
      start.x + Math.cos(angle) * drift,
      start.y - length,
      start.z + Math.sin(angle) * drift,
    );
    const mid = new THREE.Vector3(
      start.x + Math.cos(angle) * drift * 0.35,
      start.y - length * 0.48,
      start.z + Math.sin(angle) * drift * 0.35,
    );
    const curve = new THREE.CatmullRomCurve3([start, mid, end], false, 'catmullrom', 0.4);
    strandCurves.push(curve);
    strandPieces.push(new THREE.TubeGeometry(curve, 9, 0.0055, 3, false));
  }
  group.add(createMesh(strandPieces, strandMaterial, { castShadow: false }));

  const leafGeometry = createLeafGeometry(0.036, 0.23);
  const leafCount = strandCurves.length * 9;
  const leafMesh = new THREE.InstancedMesh(leafGeometry, materials.leaves, leafCount);
  const leafMatrix = new THREE.Matrix4();
  const leafQuaternion = new THREE.Quaternion();
  const leafScale = new THREE.Vector3();
  const leafColor = new THREE.Color();
  let leafIndex = 0;

  strandCurves.forEach((curve) => {
    for (let i = 0; i < 9; i += 1) {
      const t = 0.16 + i * 0.093 + random() * 0.03;
      const point = curve.getPoint(Math.min(t, 0.98));
      leafQuaternion
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI * 2)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.4 + random() * 0.5));
      const scale = 0.8 + random() * 0.6;
      leafScale.set(scale, scale, scale);
      leafMatrix.compose(point, leafQuaternion, leafScale);
      leafMesh.setMatrixAt(leafIndex, leafMatrix);
      leafColor.setHSL(0.2 + random() * 0.07, 0.3 + random() * 0.22, 0.32 + random() * 0.16);
      leafMesh.setColorAt(leafIndex, leafColor);
      leafIndex += 1;
    }
  });
  leafMesh.instanceMatrix.needsUpdate = true;
  if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
  leafMesh.castShadow = false;
  leafMesh.receiveShadow = true;
  leafMesh.computeBoundingSphere();
  group.add(leafMesh);

  const sway = { phase: 0.7 };
  function update(time) {
    group.rotation.z = Math.sin(time * 0.42 + sway.phase) * 0.008;
    group.rotation.x = Math.cos(time * 0.35 + sway.phase) * 0.005;
  }

  return { group, update };
}

function createEgret(materials) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), materials.egret);
  body.scale.set(1.55, 0.85, 0.9);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  const wingPieces = [];
  [-1, 1].forEach((side) => {
    const wing = new THREE.SphereGeometry(0.17, 14, 10);
    wing.scale(1.3, 0.42, 0.5);
    wing.rotateZ(side * 0.25);
    wing.translate(-0.02, 0.62, side * 0.11);
    wingPieces.push(wing);
  });
  group.add(createMesh(wingPieces, materials.egret));

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 8), materials.egret);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.29, 0.58, 0);
  group.add(tail);

  const neckCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.16, 0.63, 0),
      new THREE.Vector3(0.25, 0.76, 0.01),
      new THREE.Vector3(0.2, 0.9, 0),
      new THREE.Vector3(0.25, 0.98, 0),
    ],
    false,
    'catmullrom',
    0.4,
  );
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 16, 0.032, 6, false), materials.egret);
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), materials.egret);
  head.scale.set(1.2, 1, 0.95);
  head.position.set(0.27, 1.0, 0);
  head.castShadow = true;
  group.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.14, 8), materials.egretBeak);
  beak.rotation.z = -Math.PI / 2;
  beak.rotation.x = 0.1;
  beak.position.set(0.36, 0.99, 0);
  group.add(beak);

  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.07, 6), materials.egret);
  crest.rotation.z = Math.PI * 0.82;
  crest.position.set(0.22, 1.03, 0);
  group.add(crest);

  const legPieces = [];
  [-1, 1].forEach((side) => {
    legPieces.push(cylinderBetween(
      new THREE.Vector3(0.02, 0.47, side * 0.055),
      new THREE.Vector3(side * 0.01, 0.2, side * 0.07),
      0.012,
      0.009,
      5,
    ));
    legPieces.push(cylinderBetween(
      new THREE.Vector3(side * 0.01, 0.2, side * 0.07),
      new THREE.Vector3(0.04, 0.185, side * 0.075),
      0.009,
      0.006,
      5,
    ));
  });
  group.add(createMesh(legPieces, materials.egretLeg));

  const neckSway = { phase: 1.2 };
  function update(time) {
    group.rotation.y = -0.49 + Math.sin(time * 0.24 + neckSway.phase) * 0.06;
  }

  return { group, update };
}

function createFlyingBirds() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: '#3f4a47',
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const birds = [];
  const random = makeRandom(5591);

  for (let i = 0; i < 4; i += 1) {
    const bird = new THREE.Group();
    const wingGeometry = new THREE.PlaneGeometry(0.52, 0.13);
    wingGeometry.translate(0.26, 0, 0);
    const left = new THREE.Mesh(wingGeometry, material);
    left.rotation.y = Math.PI;
    const right = new THREE.Mesh(wingGeometry, material);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), material);
    body.scale.set(1.8, 0.7, 0.8);
    bird.add(left, right, body);
    bird.scale.setScalar(1.1 + random() * 0.7);
    group.add(bird);

    birds.push({
      bird,
      left,
      right,
      radius: 16 + random() * 8,
      height: 5 + random() * 2,
      angle: random() * Math.PI * 2,
      speed: 0.028 + random() * 0.022,
      flap: 2.6 + random() * 1.8,
      phase: random() * Math.PI * 2,
    });
  }

  function update(time) {
    birds.forEach((item) => {
      const angle = item.angle + time * item.speed;
      const x = Math.cos(angle) * item.radius;
      const z = Math.sin(angle) * item.radius;
      item.bird.position.set(x, item.height + Math.sin(time * 0.5 + item.phase) * 0.3, z);
      item.bird.rotation.y = -angle - Math.PI / 2;
      const flap = Math.sin(time * item.flap + item.phase) * 0.55;
      item.left.rotation.z = flap;
      item.right.rotation.z = -flap;
    });
  }

  return { group, update };
}

function createLotus(materials) {
  const group = new THREE.Group();
  const random = makeRandom(9211);

  const padGeometry = new THREE.CircleGeometry(1, 30, 0.4, Math.PI * 2 - 0.8);
  padGeometry.rotateX(-Math.PI / 2);

  const pads = [];
  const padPositions = [
    [-4.6, -2.6, 0.36],
    [-5.4, -2.3, 0.3],
    [-6.2, -2.9, 0.42],
    [-7.1, -3.2, 0.33],
    [-7.7, -3.9, 0.27],
    [-4.1, -4.0, 0.24],
    [-6.5, -4.2, 0.3],
  ];

  padPositions.forEach(([x, z, scale], index) => {
    const material = materials.lotusPad.clone();
    material.color.setHSL(0.23, 0.32, 0.24 + random() * 0.08);
    const pad = new THREE.Mesh(padGeometry, material);
    pad.position.set(x, 0.042, z);
    pad.scale.setScalar(scale);
    pad.rotation.y = random() * Math.PI * 2;
    pad.receiveShadow = true;
    group.add(pad);
    pads.push({ mesh: pad, baseY: 0.042, phase: index * 0.9, scale });
  });

  const petalGeometry = new THREE.SphereGeometry(0.1, 10, 8);
  petalGeometry.scale(0.5, 1, 0.22);
  petalGeometry.translate(0, 0.09, 0);
  const flower = new THREE.Group();
  for (let i = 0; i < 8; i += 1) {
    const petal = new THREE.Mesh(petalGeometry, materials.lotusPetal);
    const angle = (i / 8) * Math.PI * 2;
    petal.position.set(Math.cos(angle) * 0.06, 0.02, Math.sin(angle) * 0.06);
    petal.rotation.y = -angle;
    petal.rotation.z = 0.45;
    petal.castShadow = true;
    flower.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), materials.lotusCenter);
  center.position.y = 0.075;
  flower.add(center);
  flower.position.set(-5.9, 0.04, -2.7);
  flower.scale.setScalar(0.85);
  group.add(flower);

  const bud = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), materials.lotusPetal);
  bud.position.set(-7.3, 0.13, -3.5);
  bud.rotation.z = 0.12;
  group.add(bud);

  function update(time) {
    pads.forEach((item) => {
      item.mesh.position.y = item.baseY + Math.sin(time * 0.6 + item.phase) * 0.006;
      item.mesh.rotation.y += 0.0004;
    });
    flower.position.y = 0.04 + Math.sin(time * 0.55 + 1.4) * 0.005;
  }

  return { group, update };
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
      envMapIntensity: 0.24,
      emissive: new THREE.Color('#0b1413'),
      emissiveIntensity: 0.24,
    });
  const nearMaterial = hillMaterial('#2f4542');
  const midMaterial = hillMaterial('#3d5350');
  const farMaterial = hillMaterial('#4d625d');
  const hazeMaterial = hillMaterial('#64766f');
  const geometry = new THREE.SphereGeometry(1, 20, 12);

  const layers = [
    {
      count: 12,
      radius: [30, 44],
      height: [2.4, 6.2],
      width: [10, 20],
      depth: [7, 12],
      materials: [nearMaterial, nearMaterial, midMaterial],
    },
    {
      count: 10,
      radius: [46, 62],
      height: [5.5, 11],
      width: [20, 34],
      depth: [10, 18],
      materials: [midMaterial, farMaterial],
    },
    {
      count: 8,
      radius: [66, 90],
      height: [11, 21],
      width: [32, 52],
      depth: [15, 26],
      materials: [farMaterial, hazeMaterial],
    },
  ];

  const addHill = (angle, radius, width, height, depth, material, offset = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      Math.cos(angle) * radius + offset,
      -height * (0.5 + random() * 0.15),
      Math.sin(angle) * radius,
    );
    mesh.scale.set(width, height, depth);
    mesh.rotation.y = random() * Math.PI;
    group.add(mesh);
  };

  layers.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (i / layer.count) * Math.PI * 2 + (random() - 0.5) * 0.3;
      const radius = layer.radius[0] + random() * (layer.radius[1] - layer.radius[0]);
      const width = layer.width[0] + random() * (layer.width[1] - layer.width[0]);
      const height = layer.height[0] + random() * (layer.height[1] - layer.height[0]);
      const depth = layer.depth[0] + random() * (layer.depth[1] - layer.depth[0]);
      const material = layer.materials[Math.floor(random() * layer.materials.length)];
      addHill(angle, radius, width, height, depth, material);
    }
  });

  // Layered peaks sit behind the raft in the opening view, under the dawn glow.
  [
    [3.75, 58, 44, 15, 20, midMaterial],
    [3.96, 70, 50, 19, 24, farMaterial],
    [4.16, 54, 35, 12, 16, nearMaterial],
    [4.42, 80, 56, 21, 27, hazeMaterial],
    [3.5, 64, 42, 13, 18, nearMaterial],
    [4.7, 72, 46, 16, 21, farMaterial],
    [2.9, 68, 44, 14, 19, midMaterial],
  ].forEach(([angle, radius, width, height, depth, material]) => {
    addHill(angle, radius, width, height, depth, material);
  });

  [
    [2.45, 38, 18, 8, 10, nearMaterial],
    [2.9, 44, 22, 10, 12, midMaterial],
    [3.35, 40, 20, 9, 11, nearMaterial],
    [3.9, 46, 24, 11, 13, midMaterial],
    [4.45, 42, 20, 9, 11, nearMaterial],
    [4.95, 50, 26, 12, 14, farMaterial],
    [1.95, 58, 34, 5, 12, hazeMaterial],
    [2.25, 70, 42, 6, 15, farMaterial],
    [2.6, 64, 36, 5.5, 13, hazeMaterial],
  ].forEach(([angle, radius, width, height, depth, material]) => {
    addHill(angle, radius, width, height, depth, material);
  });

  const peakGeometry = new THREE.ConeGeometry(1, 1, 5, 1);
  [
    [3.68, 62, 26, 22, midMaterial],
    [3.98, 78, 34, 27, farMaterial],
    [4.3, 66, 24, 20, midMaterial],
    [4.55, 88, 36, 30, hazeMaterial],
    [3.4, 84, 28, 24, farMaterial],
  ].forEach(([angle, radius, width, height, material]) => {
    const peak = new THREE.Mesh(peakGeometry, material);
    peak.position.set(
      Math.cos(angle) * radius,
      -height * 0.38,
      Math.sin(angle) * radius,
    );
    peak.scale.set(width, height, width * 0.78);
    peak.rotation.y = random() * Math.PI;
    group.add(peak);
  });

  return { group, materials: [nearMaterial, midMaterial, farMaterial, hazeMaterial] };
}

function createPagoda() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: '#425654',
    roughness: 0.95,
    metalness: 0,
    emissive: new THREE.Color('#0d1615'),
    emissiveIntensity: 0.35,
  });

  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), material);
  hill.scale.set(9, 4.2, 7);
  hill.position.set(-18, -2.4, -32);
  group.add(hill);

  const pagoda = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.45, 8), material);
  base.position.y = 0.22;
  pagoda.add(base);

  for (let i = 0; i < 5; i += 1) {
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36 - i * 0.035, 0.44 - i * 0.035, 0.3, 8),
      material,
    );
    tier.position.y = 0.58 + i * 0.56;
    pagoda.add(tier);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.82 - i * 0.1, 0.2, 8), material);
    roof.position.y = 0.76 + i * 0.56;
    pagoda.add(roof);
  }

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 6), material);
  spire.position.y = 3.35;
  pagoda.add(spire);

  pagoda.position.set(-18, 2.4, -32);
  group.add(pagoda);

  return group;
}

function createMist(materials) {
  const group = new THREE.Group();
  const softMaterial = new THREE.SpriteMaterial({
    map: materials.textures.mist,
    color: new THREE.Color('#f2e0c8'),
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    fog: false,
  });
  const nearMaterial = new THREE.SpriteMaterial({
    map: materials.textures.mist,
    color: new THREE.Color('#f4e6d2'),
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    fog: false,
  });

  const random = makeRandom(341);
  const data = [];

  for (let i = 0; i < 8; i += 1) {
    const sprite = new THREE.Sprite(softMaterial);
    const angle = (i / 8) * Math.PI * 2 + random() * 0.4;
    const radius = 14 + random() * 22;
    const width = 18 + random() * 16;
    sprite.scale.set(width, width * 0.2, 1);
    sprite.position.set(Math.cos(angle) * radius, 0.8 + random() * 1.2, Math.sin(angle) * radius);
    sprite.renderOrder = 1;
    group.add(sprite);
    data.push({
      sprite,
      angle,
      radius,
      speed: 0.004 + random() * 0.006,
      baseY: sprite.position.y,
      bob: random() * Math.PI * 2,
    });
  }

  [
    [-6.5, 0.55, -6.0, 10],
    [2.5, 0.5, -8.0, 13],
    [-10.5, 0.8, -2.5, 10],
    [-4.6, 0.38, -4.0, 6.5],
    [-7.8, 0.34, -3.2, 5.5],
    [0.5, 0.3, -7.5, 8],
    [6.5, 0.32, -9.5, 9],
    [-3.5, 0.34, -11.0, 10],
  ].forEach(([x, y, z, width], index) => {
    const sprite = new THREE.Sprite(nearMaterial);
    sprite.scale.set(width, width * 0.16, 1);
    sprite.position.set(x, y, z);
    sprite.renderOrder = 1;
    group.add(sprite);
    data.push({
      sprite,
      angle: Math.atan2(z, x),
      radius: Math.hypot(x, z),
      speed: 0.006 + index * 0.002,
      baseY: y,
      bob: index * 1.4,
      baseX: x,
      baseZ: z,
      drifting: true,
    });
  });

  function update(time) {
    data.forEach((item) => {
      if (item.drifting) {
        item.sprite.position.x = item.baseX + Math.sin(time * 0.035 + item.bob) * 1.6;
        item.sprite.position.z = item.baseZ + Math.cos(time * 0.028 + item.bob) * 1.1;
      } else {
        item.sprite.position.x = Math.cos(item.angle + time * item.speed) * item.radius;
        item.sprite.position.z = Math.sin(item.angle + time * item.speed) * item.radius;
      }
      item.sprite.position.y = item.baseY + Math.sin(time * 0.17 + item.bob) * 0.1;
    });
  }

  return { group, update };
}

function createDriftingLeaves(materials) {
  const group = new THREE.Group();
  const random = makeRandom(1777);
  const geometry = createLeafGeometry(0.04, 0.19);
  geometry.rotateX(-Math.PI / 2);

  const leaves = [];
  for (let i = 0; i < 5; i += 1) {
    const material = materials.leaves.clone();
    material.color.setHSL(0.17 + random() * 0.08, 0.38, 0.24 + random() * 0.07);
    const mesh = new THREE.Mesh(geometry, material);
    const startX = -2.2 + random() * 5.2;
    const startZ = -1.7 + random() * 3.4;
    mesh.position.set(startX, 0.052, startZ);
    mesh.rotation.y = random() * Math.PI * 2;
    mesh.scale.setScalar(0.8 + random() * 0.35);
    group.add(mesh);
    leaves.push({
      mesh,
      baseX: startX,
      baseZ: startZ,
      phase: random() * Math.PI * 2,
      speed: 0.02 + random() * 0.03,
    });
  }

  function update(time) {
    leaves.forEach((item) => {
      item.mesh.position.x = item.baseX + Math.sin(time * 0.05 + item.phase) * 0.8;
      item.mesh.position.z = item.baseZ + Math.cos(time * 0.04 + item.phase) * 0.45;
      item.mesh.position.y = 0.052 + Math.sin(time * 0.8 + item.phase) * 0.006;
      item.mesh.rotation.y += 0.0012;
    });
  }

  return { group, update };
}

function createSunGlow(materials) {
  const material = new THREE.SpriteMaterial({
    map: materials.textures.glow,
    color: new THREE.Color('#ffd2a2'),
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(62, 24, 1);
  sprite.position.set(-39, 12, -64);
  sprite.renderOrder = -90;

  function update(time) {
    material.opacity = 0.3 + Math.sin(time * 0.16) * 0.025;
  }

  return { group: sprite, update };
}

function createWillowLeafFall(materials) {
  const group = new THREE.Group();
  const geometry = createLeafGeometry(0.024, 0.12);
  const material = new THREE.MeshStandardMaterial({
    color: '#77804a',
    roughness: 0.9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const random = makeRandom(6613);
  const leaves = [];
  for (let i = 0; i < 10; i += 1) {
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    leaves.push({
      mesh,
      x: -8.0 + (random() - 0.5) * 2.2,
      z: -5.1 + (random() - 0.5) * 1.6,
      offset: random() * 4,
      speed: 0.25 + random() * 0.25,
      sway: random() * Math.PI * 2,
    });
  }

  function update(time) {
    leaves.forEach((item) => {
      const cycle = (time * item.speed + item.offset) % 4;
      const fall = 3.4 - cycle;
      item.mesh.position.set(
        item.x + Math.sin(time * 0.9 + item.sway) * 0.18,
        fall + 0.3,
        item.z + Math.cos(time * 0.6 + item.sway) * 0.12,
      );
      item.mesh.rotation.set(time * 1.1 + item.sway, item.sway, Math.sin(time * 1.6 + item.sway) * 0.8);
      item.mesh.visible = fall > 0.1;
    });
  }

  return { group, update };
}

export function createScenery(materials) {
  const group = new THREE.Group();

  const shore = createShore(materials);
  group.add(shore.group);
  group.add(createReeds(materials, shore.islets));

  const willow = createWillow(materials);
  group.add(willow.group);

  const egret = createEgret(materials);
  egret.group.position.set(-6.5, 0.52, -4.0);
  egret.group.scale.setScalar(1.3);
  group.add(egret.group);

  const birds = createFlyingBirds();
  group.add(birds.group);

  const lotus = createLotus(materials);
  group.add(lotus.group);

  const hills = createDistantHills();
  group.add(hills.group);
  group.add(createPagoda());

  const sunGlow = createSunGlow(materials);
  group.add(sunGlow.group);

  const mist = createMist(materials);
  group.add(mist.group);

  const drifting = createDriftingLeaves(materials);
  group.add(drifting.group);

  const falling = createWillowLeafFall(materials);
  group.add(falling.group);

  function update(time) {
    willow.update(time);
    egret.update(time);
    birds.update(time);
    lotus.update(time);
    mist.update(time);
    drifting.update(time);
    falling.update(time);
    sunGlow.update(time);
  }

  return { group, update };
}
