import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function mergeGeos(geometries) {
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  return merged;
}

export function addBox(list, width, height, depth, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  if (rx || ry || rz) {
    const matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    geometry.applyMatrix4(matrix);
  }
  geometry.translate(x, y, z);
  list.push(geometry);
  return geometry;
}

export function addCylinder(
  list,
  radiusTop,
  radiusBottom,
  height,
  segments,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
  if (rx || ry || rz) {
    const matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    geometry.applyMatrix4(matrix);
  }
  geometry.translate(x, y, z);
  list.push(geometry);
  return geometry;
}

export function addSphere(
  list,
  radius,
  x = 0,
  y = 0,
  z = 0,
  scaleX = 1,
  scaleY = 1,
  scaleZ = 1,
  segments = 18,
) {
  const geometry = new THREE.SphereGeometry(radius, segments, Math.round(segments * 0.66));
  geometry.scale(scaleX, scaleY, scaleZ);
  geometry.translate(x, y, z);
  list.push(geometry);
  return geometry;
}

export function createMesh(geometries, material, { castShadow = true, receiveShadow = true } = {}) {
  const merged = mergeGeos(geometries);
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

/** A tapered cylinder that spans two points in space. */
export function cylinderBetween(start, end, radiusStart, radiusEnd = radiusStart, segments = 8) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radiusEnd, radiusStart, length, segments);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  geometry.applyMatrix4(
    new THREE.Matrix4().compose(midpoint, quaternion, new THREE.Vector3(1, 1, 1)),
  );
  return geometry;
}

export function boxBetween(start, end, width, height) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const geometry = new THREE.BoxGeometry(width, height, length);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    direction.normalize(),
  );
  const matrix = new THREE.Matrix4().compose(midpoint, quaternion, new THREE.Vector3(1, 1, 1));
  geometry.applyMatrix4(matrix);
  return geometry;
}

export function tubeBetween(points, radius, tubularSegments = 24, radialSegments = 5, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
}

export function addTube(list, points, radius, tubularSegments = 24, radialSegments = 5, closed = false) {
  list.push(tubeBetween(points, radius, tubularSegments, radialSegments, closed));
}

export function createLathe(points, segments = 24) {
  const vectors = points.map(([radius, y]) => new THREE.Vector2(radius, y));
  return new THREE.LatheGeometry(vectors, segments);
}

/**
 * Traditional square-grid lattice panel lying in the XY plane, facing +Z.
 * Dimensions are in world units.
 */
export function createLatticePanel(width, height, options = {}) {
  const {
    frame = 0.055,
    bar = 0.018,
    depth = 0.03,
    inset = 0.12,
    cell = 0.27,
  } = options;
  const pieces = [];
  const halfW = width / 2;
  const halfH = height / 2;

  addBox(pieces, width, frame, depth, 0, halfH - frame / 2, 0);
  addBox(pieces, width, frame, depth, 0, -halfH + frame / 2, 0);
  addBox(pieces, frame, height - frame * 2, depth, -halfW + frame / 2, 0, 0);
  addBox(pieces, frame, height - frame * 2, depth, halfW - frame / 2, 0, 0);

  const innerWidth = Math.max(0.1, width - (inset + frame) * 2);
  const innerHeight = Math.max(0.1, height - (inset + frame) * 2);
  const innerBar = bar * 0.86;

  addBox(pieces, innerWidth + innerBar * 2, innerBar, depth * 0.82, 0, innerHeight / 2, 0.004);
  addBox(pieces, innerWidth + innerBar * 2, innerBar, depth * 0.82, 0, -innerHeight / 2, 0.004);
  addBox(pieces, innerBar, innerHeight, depth * 0.82, -innerWidth / 2, 0, 0.004);
  addBox(pieces, innerBar, innerHeight, depth * 0.82, innerWidth / 2, 0, 0.004);

  const columns = Math.max(3, Math.round(innerWidth / cell));
  const rows = Math.max(3, Math.round(innerHeight / cell));

  for (let i = 1; i < columns; i += 1) {
    const x = -innerWidth / 2 + (innerWidth / columns) * i;
    addBox(pieces, innerBar, innerHeight, depth * 0.72, x, 0, 0.006);
  }
  for (let j = 1; j < rows; j += 1) {
    const y = -innerHeight / 2 + (innerHeight / rows) * j;
    addBox(pieces, innerWidth, innerBar, depth * 0.72, 0, y, 0.006);
  }

  // Small alternating accents give the grid a hand-cut lattice rhythm.
  for (let i = 0; i < columns; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      if ((i + j) % 4 !== 0) continue;
      const cellW = innerWidth / columns;
      const cellH = innerHeight / rows;
      const x = -innerWidth / 2 + cellW * (i + 0.5);
      const y = -innerHeight / 2 + cellH * (j + 0.5);
      const size = Math.min(cellW, cellH) * 0.34;
      addBox(pieces, size, innerBar, depth * 0.6, x, y, 0.008);
    }
  }

  return mergeGeos(pieces);
}

/** A straight section of timber railing lying along +X with its base at y = 0. */
export function createRailing(length, options = {}) {
  const {
    height = 0.82,
    post = 0.075,
    rail = 0.052,
    slat = 0.017,
    spacing = 0.135,
    postEvery = 0.98,
  } = options;

  const pieces = [];
  addBox(pieces, length, rail, rail * 1.35, 0, height - rail / 2, 0);
  addBox(pieces, length, rail * 0.8, rail, 0, height * 0.57, 0);
  addBox(pieces, length, rail * 0.85, rail, 0, height * 0.22, 0);

  const postCount = Math.max(2, Math.round(length / postEvery));
  for (let i = 0; i <= postCount; i += 1) {
    const x = -length / 2 + (length / postCount) * i;
    addBox(pieces, post, height + 0.06, post, x, height / 2, 0);
    addBox(pieces, post * 1.5, 0.035, post * 1.5, x, height + 0.075, 0);
  }

  const slatCount = Math.floor(length / spacing);
  for (let i = 0; i <= slatCount; i += 1) {
    const x = -length / 2 + (length / slatCount) * i;
    addBox(pieces, slat, height * 0.72, slat, x, height * 0.47, 0);
  }

  return mergeGeos(pieces);
}

export function setGroupShadows(group, castShadow = true, receiveShadow = true) {
  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = castShadow;
      object.receiveShadow = receiveShadow;
    }
  });
}
