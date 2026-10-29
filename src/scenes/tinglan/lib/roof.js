import * as THREE from 'three';
import { addCylinder, addTube, boxBetween, createMesh } from '../../shared/geometry.js';

function roofSample(kind, x, z, config) {
  const { width, depth, height, lift } = config;
  const halfDepth = depth / 2;
  const halfWidth = width / 2;

  if (kind === 'gable') {
    const u = Math.min(1, Math.abs(z) / halfDepth);
    const d = 1 - u;
    const base = height * Math.pow(d, 1.64);
    const corner = Math.pow(Math.abs(x) / halfWidth, 7) * Math.pow(u, 3.1);
    return base + lift * corner;
  }

  const d = Math.max(
    0,
    Math.min(1, Math.min(halfDepth - Math.abs(z), halfWidth - Math.abs(x)) / halfDepth),
  );
  const base = height * Math.pow(d, 1.52);
  const corner =
    Math.pow(Math.abs(x) / halfWidth, 4.5) *
    Math.pow(Math.abs(z) / halfDepth, 4.5) *
    Math.pow(1 - d, 1.5);
  return base + lift * corner;
}

function buildSurface(config, kind, segmentsX = 76, segmentsZ = 52) {
  const { width, depth } = config;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iz = 0; iz <= segmentsZ; iz += 1) {
    const z = -depth / 2 + (depth * iz) / segmentsZ;
    for (let ix = 0; ix <= segmentsX; ix += 1) {
      const x = -width / 2 + (width * ix) / segmentsX;
      const y = roofSample(kind, x, z, config);
      positions.push(x, y, z);
      uvs.push(ix / segmentsX, iz / segmentsZ);
    }
  }

  for (let iz = 0; iz < segmentsZ; iz += 1) {
    for (let ix = 0; ix < segmentsX; ix += 1) {
      const a = iz * (segmentsX + 1) + ix;
      const b = a + 1;
      const c = a + segmentsX + 2;
      const d = c - 1;
      indices.push(a, d, b, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createUnderside(surface, offset = 0.055) {
  const geometry = surface.clone();
  geometry.translate(0, -offset, 0);
  const index = geometry.getIndex();
  if (index) {
    const array = index.array;
    for (let i = 0; i < array.length; i += 3) {
      const temp = array[i];
      array[i] = array[i + 2];
      array[i + 2] = temp;
    }
    index.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  return geometry;
}

function addRibsForGable(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const count = 27;

  for (let i = 0; i < count; i += 1) {
    const x = -halfWidth + 0.22 + ((width - 0.44) * i) / (count - 1);
    for (const sign of [-1, 1]) {
      const points = [];
      for (let j = 0; j <= 18; j += 1) {
        const t = j / 18;
        const z = sign * (halfDepth - 0.02) * (1 - t) + sign * 0.012;
        points.push(new THREE.Vector3(x, roofSample('gable', x, z, config) + 0.028, z));
      }
      addTube(list, points, 0.024, 20, 4);
    }
  }
}

function addRibsForHip(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  const addRib = (axis, fixed, sign, count = 22) => {
    for (let i = 0; i < count; i += 1) {
      const offset = 0.18 + ((axis === 'z' ? width : depth) - 0.36) * (i / (count - 1));
      const points = [];
      for (let j = 0; j <= 15; j += 1) {
        const t = j / 15;
        let x;
        let z;
        if (axis === 'z') {
          x = -halfWidth + offset;
          z = sign * (halfDepth - 0.02) * (1 - t);
        } else {
          z = -halfDepth + offset;
          x = sign * (halfWidth - 0.02) * (1 - t);
        }
        const y = roofSample('hip', x, z, config) + 0.026;
        points.push(new THREE.Vector3(x, y, z));
      }
      addTube(list, points, 0.023, 18, 4);
    }
  };

  addRib('z', 0, 1, 25);
  addRib('z', 0, -1, 25);
  addRib('x', 0, 1, 19);
  addRib('x', 0, -1, 19);
}

function addGableCaps(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const count = Math.floor(width / 0.2);

  for (const sign of [-1, 1]) {
    const z = sign * (halfDepth + 0.02);
    for (let i = 0; i < count; i += 1) {
      const x = -halfWidth + 0.12 + ((width - 0.24) * i) / (count - 1);
      const y = roofSample('gable', x, sign * halfDepth, config) + 0.042;
      addCylinder(list, 0.047, 0.047, 0.075, 10, x, y, z, Math.PI / 2, 0, 0);
    }
  }
}

function addHipCaps(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const countX = Math.floor(width / 0.21);
  const countZ = Math.floor(depth / 0.21);

  for (const sign of [-1, 1]) {
    const z = sign * (halfDepth + 0.022);
    for (let i = 0; i < countX; i += 1) {
      const x = -halfWidth + 0.13 + ((width - 0.26) * i) / (countX - 1);
      const y = roofSample('hip', x, sign * halfDepth, config) + 0.04;
      addCylinder(list, 0.046, 0.046, 0.072, 9, x, y, z, Math.PI / 2, 0, 0);
    }

    const x = sign * (halfWidth + 0.022);
    for (let i = 0; i < countZ; i += 1) {
      const zEdge = -halfDepth + 0.13 + ((depth - 0.26) * i) / (countZ - 1);
      const y = roofSample('hip', sign * halfWidth, zEdge, config) + 0.04;
      addCylinder(list, 0.046, 0.046, 0.072, 9, x, y, zEdge, 0, 0, Math.PI / 2);
    }
  }
}

function addEaveFascia(list, config, kind) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const samples = 36;

  if (kind === 'gable') {
    for (const sign of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= samples; i += 1) {
        const x = -halfWidth + (width * i) / samples;
        points.push(
          new THREE.Vector3(x, roofSample(kind, x, sign * halfDepth, config) + 0.012, sign * (halfDepth + 0.005)),
        );
      }
      addTube(list, points, 0.05, 28, 5);
    }
    return;
  }

  for (const sign of [-1, 1]) {
    const front = [];
    for (let i = 0; i <= samples; i += 1) {
      const x = -halfWidth + (width * i) / samples;
      front.push(
        new THREE.Vector3(x, roofSample(kind, x, sign * halfDepth, config) + 0.012, sign * (halfDepth + 0.005)),
      );
    }
    addTube(list, front, 0.05, 28, 5);

    const side = [];
    for (let i = 0; i <= samples; i += 1) {
      const z = -halfDepth + (depth * i) / samples;
      side.push(
        new THREE.Vector3(sign * (halfWidth + 0.005), roofSample(kind, sign * halfWidth, z, config) + 0.012, z),
      );
    }
    addTube(list, side, 0.05, 28, 5);
  }
}

function addGableRafters(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const count = 24;

  for (const zSign of [-1, 1]) {
    for (let i = 0; i < count; i += 1) {
      const x = -halfWidth + 0.4 + ((width - 0.8) * i) / (count - 1);
      const zStart = zSign * (halfDepth - 0.04);
      const zEnd = zSign * (halfDepth - 0.78);
      const start = new THREE.Vector3(x, roofSample('gable', x, zStart, config) - 0.09, zStart);
      const end = new THREE.Vector3(x, roofSample('gable', x, zEnd, config) - 0.09, zEnd);
      list.push(boxBetween(start, end, 0.045, 0.05));
    }
  }
}

function addHipRafters(list, config) {
  const { width, depth } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const countX = 27;
  const countZ = 20;

  for (const sign of [-1, 1]) {
    for (let i = 0; i < countX; i += 1) {
      const x = -halfWidth + 0.45 + ((width - 0.9) * i) / (countX - 1);
      const zStart = sign * (halfDepth - 0.04);
      const zEnd = sign * (halfDepth - 0.8);
      list.push(
        boxBetween(
          new THREE.Vector3(x, roofSample('hip', x, zStart, config) - 0.09, zStart),
          new THREE.Vector3(x, roofSample('hip', x, zEnd, config) - 0.09, zEnd),
          0.042,
          0.045,
        ),
      );
    }
    for (let i = 0; i < countZ; i += 1) {
      const z = -halfDepth + 0.5 + ((depth - 1) * i) / (countZ - 1);
      const xStart = sign * (halfWidth - 0.04);
      const xEnd = sign * (halfWidth - 0.8);
      list.push(
        boxBetween(
          new THREE.Vector3(xStart, roofSample('hip', xStart, z, config) - 0.09, z),
          new THREE.Vector3(xEnd, roofSample('hip', xEnd, z, config) - 0.09, z),
          0.042,
          0.045,
        ),
      );
    }
  }
}

function addGableRidge(group, config, materials) {
  const { width, height } = config;
  const halfWidth = width / 2;
  const ridgePieces = [];
  const hornPieces = [];

  ridgePieces.push(
    (() => {
      const geometry = new THREE.BoxGeometry(width + 0.16, 0.15, 0.2);
      geometry.translate(0, height + 0.075, 0);
      return geometry;
    })(),
  );
  const topRidge = new THREE.BoxGeometry(width * 0.82, 0.06, 0.12);
  topRidge.translate(0, height + 0.175, 0);
  ridgePieces.push(topRidge);

  for (const sign of [-1, 1]) {
    const x = sign * (halfWidth + 0.02);
    const points = [
      new THREE.Vector3(x, height + 0.08, 0),
      new THREE.Vector3(x + sign * 0.1, height + 0.24, 0),
      new THREE.Vector3(x + sign * 0.045, height + 0.39, 0),
      new THREE.Vector3(x - sign * 0.045, height + 0.31, 0),
    ];
    addTube(hornPieces, points, 0.055, 16, 5);
  }

  const ridgeMesh = createMesh(ridgePieces, materials.tileRidge);
  ridgeMesh.position.y = 0.02;
  group.add(ridgeMesh);

  const hornMesh = createMesh(hornPieces, materials.tileRidge);
  group.add(hornMesh);
}

function addHipRidges(group, config, materials) {
  const { width, depth, height } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const ridgeEnd = Math.max(0.1, (width - depth) / 2);
  const pieces = [];

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 18; i += 1) {
        const t = i / 18;
        const x = sx * (halfWidth - t * (halfWidth - ridgeEnd));
        const z = sz * halfDepth * (1 - t);
        const y = roofSample('hip', x, z, config) + 0.03;
        points.push(new THREE.Vector3(x, y, z));
      }
      addTube(pieces, points, 0.052, 22, 5);
      const tip = points[points.length - 1];
      const tipLift = new THREE.Vector3(tip.x * 0.985, height + 0.11, 0);
      addTube(pieces, [tip, tipLift], 0.04, 6, 4);
    }
  }

  const mesh = createMesh(pieces, materials.tileRidge);
  group.add(mesh);
}

function createBargeboard(config, sign) {
  const { width, depth } = config;
  const halfDepth = depth / 2;
  const x = sign * (width / 2 + 0.018);
  const segments = 34;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const z = -halfDepth + (depth * i) / segments;
    const top = roofSample('gable', sign * (width / 2), z, config) + 0.02;
    positions.push(x, top, z, x, top - 0.25, z);
    uvs.push(i / segments, 1, i / segments, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createXuanyu(config, sign, materials) {
  const { width, height } = config;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.13, -0.02, 0.18, -0.16, 0.11, -0.27);
  shape.quadraticCurveTo(0.055, -0.35, 0, -0.46);
  shape.quadraticCurveTo(-0.055, -0.35, -0.11, -0.27);
  shape.bezierCurveTo(-0.18, -0.16, -0.13, -0.02, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.rotateY((sign * Math.PI) / 2);
  geometry.translate(sign * (width / 2 + 0.042), height - 0.24, 0);

  const mesh = new THREE.Mesh(geometry, materials.woodDark);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const disc = new THREE.CylinderGeometry(0.035, 0.035, 0.014, 12);
  disc.rotateZ(Math.PI / 2);
  disc.translate(sign * (width / 2 + 0.052), height - 0.43, 0);
  const discMesh = new THREE.Mesh(disc, materials.gold);
  discMesh.castShadow = true;

  const group = new THREE.Group();
  group.add(mesh, discMesh);
  return group;
}

function addGableDetails(group, config, materials) {
  const bargeMaterial = materials.woodDark.clone();
  bargeMaterial.side = THREE.DoubleSide;
  const pieces = [createBargeboard(config, 1), createBargeboard(config, -1)];
  const bargeMesh = createMesh(pieces, bargeMaterial);
  group.add(bargeMesh);

  const trimPieces = [];
  for (const sign of [-1, 1]) {
    const points = [];
    const halfDepth = config.depth / 2;
    for (let i = 0; i <= 24; i += 1) {
      const z = -halfDepth + (config.depth * i) / 24;
      points.push(
        new THREE.Vector3(
          sign * (config.width / 2 + 0.03),
          roofSample('gable', sign * (config.width / 2), z, config) - 0.23,
          z,
        ),
      );
    }
    addTube(trimPieces, points, 0.012, 22, 4);
  }
  const trimMesh = createMesh(trimPieces, materials.gold);
  group.add(trimMesh);

  group.add(createXuanyu(config, 1, materials));
  group.add(createXuanyu(config, -1, materials));
}

function createUpperRoof(materials) {
  const config = {
    width: 6.75,
    depth: 4.8,
    height: 1.42,
    lift: 0.31,
  };
  const group = new THREE.Group();

  const surface = buildSurface(config, 'gable', 84, 56);
  const roofMesh = new THREE.Mesh(surface, materials.tile);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  const under = new THREE.Mesh(createUnderside(surface, 0.06), materials.woodSoffit);
  under.receiveShadow = true;
  group.add(under);

  const ribs = [];
  addRibsForGable(ribs, config);
  group.add(createMesh(ribs, materials.tileCap));

  const caps = [];
  addGableCaps(caps, config);
  group.add(createMesh(caps, materials.tileCap));

  const fascia = [];
  addEaveFascia(fascia, config, 'gable');
  group.add(createMesh(fascia, materials.tileRidge));

  const rafters = [];
  addGableRafters(rafters, config);
  group.add(createMesh(rafters, materials.woodSoffit));

  addGableRidge(group, config, materials);
  addGableDetails(group, config, materials);

  return group;
}

function createLowerRoof(materials) {
  const config = {
    width: 9.45,
    depth: 7.2,
    height: 0.9,
    lift: 0.37,
  };
  const group = new THREE.Group();

  const surface = buildSurface(config, 'hip', 92, 64);
  const roofMesh = new THREE.Mesh(surface, materials.tileLower);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  group.add(roofMesh);

  const under = new THREE.Mesh(createUnderside(surface, 0.06), materials.woodSoffit);
  under.receiveShadow = true;
  group.add(under);

  const ribs = [];
  addRibsForHip(ribs, config);
  group.add(createMesh(ribs, materials.tileCap));

  const caps = [];
  addHipCaps(caps, config);
  group.add(createMesh(caps, materials.tileCap));

  const fascia = [];
  addEaveFascia(fascia, config, 'hip');
  group.add(createMesh(fascia, materials.tileRidge));

  const rafters = [];
  addHipRafters(rafters, config);
  group.add(createMesh(rafters, materials.woodSoffit));

  addHipRidges(group, config, materials);

  return group;
}

export function createRoofs(materials) {
  const upper = createUpperRoof(materials);
  upper.position.y = 7.08;
  upper.name = 'upper-roof';

  const lower = createLowerRoof(materials);
  lower.position.y = 4.04;
  lower.name = 'lower-roof';

  return { upper, lower };
}
