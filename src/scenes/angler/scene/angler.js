import * as THREE from 'three';
import {
  addSphere,
  createLathe,
  createMesh,
  cylinderBetween,
} from '../../shared/geometry.js';
import { RAFT_DECK_Y } from './raft.js';

const ROD_TIP = new THREE.Vector3(2.58, 1.58, 0.13);
const FLOAT_BASE = new THREE.Vector3(2.95, -0.102, 0.24);

function createRobe(materials) {
  const group = new THREE.Group();

  const skirt = new THREE.Mesh(
    createLathe(
      [
        [0.03, 0],
        [0.23, 0.004],
        [0.325, 0.03],
        [0.335, 0.08],
        [0.3, 0.17],
        [0.255, 0.29],
        [0.216, 0.39],
        [0.198, 0.45],
        [0.03, 0.465],
      ],
      30,
    ),
    materials.cloth,
  );
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  group.add(skirt);

  const hem = new THREE.Mesh(
    new THREE.TorusGeometry(0.327, 0.011, 6, 40),
    materials.clothTrim,
  );
  hem.rotation.x = Math.PI / 2;
  hem.position.y = 0.032;
  group.add(hem);

  const belt = new THREE.Mesh(
    new THREE.TorusGeometry(0.203, 0.02, 7, 32),
    materials.clothDark,
  );
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.442;
  group.add(belt);

  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.05), materials.clothDark);
  knot.position.set(0.185, 0.428, 0.045);
  knot.rotation.z = 0.3;
  group.add(knot);

  const seamPieces = [];
  [-1, 1].forEach((side) => {
    seamPieces.push(cylinderBetween(
      new THREE.Vector3(0.305, 0.055, side * 0.052),
      new THREE.Vector3(0.282, 0.23, side * 0.045),
      0.009,
      0.009,
      5,
    ));
    seamPieces.push(cylinderBetween(
      new THREE.Vector3(0.282, 0.23, side * 0.045),
      new THREE.Vector3(0.232, 0.415, side * 0.03),
      0.009,
      0.008,
      5,
    ));
  });
  group.add(createMesh(seamPieces, materials.clothTrim, { castShadow: false }));

  [-1, 1].forEach((side) => {
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), materials.cloth);
    knee.scale.set(1.18, 0.72, 0.92);
    knee.position.set(0.12, 0.095, side * 0.245);
    knee.rotation.y = side * 0.18;
    knee.castShadow = true;
    group.add(knee);
  });

  const torsoPieces = createLathe(
    [
      [0.02, 0],
      [0.195, 0.01],
      [0.215, 0.1],
      [0.228, 0.22],
      [0.215, 0.33],
      [0.172, 0.395],
      [0.1, 0.428],
      [0.025, 0.44],
    ],
    28,
  );
  const torso = new THREE.Mesh(torsoPieces, materials.cloth);
  torso.position.set(0.025, 0.44, 0);
  torso.rotation.z = -0.13;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  const collarPieces = [];
  collarPieces.push(cylinderBetween(
    new THREE.Vector3(0.12, 0.885, 0.072),
    new THREE.Vector3(0.245, 0.7, 0.015),
    0.019,
    0.014,
    6,
  ));
  collarPieces.push(cylinderBetween(
    new THREE.Vector3(0.12, 0.885, -0.072),
    new THREE.Vector3(0.245, 0.7, -0.015),
    0.019,
    0.014,
    6,
  ));
  group.add(createMesh(collarPieces, materials.clothTrim));

  const armPieces = [];
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Vector3(0.055, 0.865, side * 0.2);
    const elbow = new THREE.Vector3(0.245, 0.705, side * 0.268);
    const wrist = new THREE.Vector3(0.405, 0.618, side * 0.088);
    armPieces.push(cylinderBetween(shoulder, elbow, 0.063, 0.053, 8));
    armPieces.push(cylinderBetween(elbow, wrist, 0.05, 0.04, 8));
    addSphere(armPieces, 0.06, elbow.x, elbow.y, elbow.z, 1, 0.95, 1, 12);
  });
  group.add(createMesh(armPieces, materials.cloth));

  const handPieces = [];
  [-1, 1].forEach((side) => {
    addSphere(handPieces, 0.048, 0.418, 0.615, side * 0.074, 1.12, 0.9, 0.92, 14);
    addSphere(handPieces, 0.02, 0.445, 0.638, side * 0.043, 1.2, 0.8, 0.9, 10);
  });
  group.add(createMesh(handPieces, materials.skin));

  return group;
}

function createCape(materials) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.385, 0.3, 30, 3, true, Math.PI * 0.66, Math.PI * 1.68),
    materials.straw,
  );
  outer.position.set(0.02, 0.81, 0);
  outer.castShadow = true;
  outer.receiveShadow = true;
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.ConeGeometry(0.315, 0.22, 26, 3, true, Math.PI * 0.68, Math.PI * 1.64),
    materials.strawDark,
  );
  inner.position.set(0.02, 0.85, 0);
  inner.castShadow = true;
  group.add(inner);

  const fringePieces = [];
  const strandCount = 18;
  for (let i = 0; i < strandCount; i += 1) {
    const theta = Math.PI * 0.66 + (Math.PI * 1.68 * i) / (strandCount - 1);
    const length = 0.1 + Math.sin(i * 2.7) * 0.02;
    const cone = new THREE.ConeGeometry(0.016, length, 5);
    cone.rotateX(Math.PI);
    cone.translate(0, -length / 2, 0);
    const axis = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    cone.applyMatrix4(new THREE.Matrix4().makeRotationAxis(axis, 0.24));
    cone.translate(
      0.02 + Math.sin(theta) * 0.38,
      0.664,
      Math.cos(theta) * 0.38,
    );
    fringePieces.push(cone);
  }
  group.add(createMesh(fringePieces, materials.strawDark));

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.142, 0.024, 8, 26),
    materials.strawDark,
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0.02, 0.94, 0);
  group.add(collar);

  return group;
}

function createHead(materials) {
  const group = new THREE.Group();

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.06, 0.09, 12), materials.skin);
  neck.position.set(0.095, 0.9, 0);
  neck.rotation.z = -0.2;
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 18), materials.skin);
  head.scale.set(1, 1.08, 0.92);
  head.position.set(0.12, 1.0, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  const earPieces = [];
  [-1, 1].forEach((side) => {
    addSphere(earPieces, 0.03, 0.105, 1.0, side * 0.114, 0.55, 1, 0.7, 10);
  });
  group.add(createMesh(earPieces, materials.skinShade));

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.023, 0.055, 10), materials.skinShade);
  nose.rotation.z = -Math.PI / 2;
  nose.rotation.x = Math.PI;
  nose.position.set(0.243, 0.99, 0);
  group.add(nose);

  const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#241a14', roughness: 0.35 });
  const eyePieces = [];
  [-1, 1].forEach((side) => {
    addSphere(eyePieces, 0.0115, 0.231, 1.031, side * 0.047, 1, 1, 1, 10);
  });
  group.add(createMesh(eyePieces, eyeMaterial, { castShadow: false }));

  const browPieces = [];
  [-1, 1].forEach((side) => {
    const brow = new THREE.BoxGeometry(0.018, 0.014, 0.055);
    brow.rotateY(side * 0.25);
    brow.rotateZ(side * 0.18);
    brow.translate(0.229, 1.055, side * 0.05);
    browPieces.push(brow);
  });
  group.add(createMesh(browPieces, materials.beard, { castShadow: false }));

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.3, 12), materials.beard);
  beard.rotation.x = Math.PI;
  beard.rotation.z = 0.14;
  beard.position.set(0.178, 0.79, 0);
  beard.castShadow = true;
  group.add(beard);

  const beardTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 10), materials.beard);
  beardTip.rotation.x = Math.PI;
  beardTip.rotation.z = 0.12;
  beardTip.position.set(0.158, 0.89, 0);
  group.add(beardTip);

  const mustachePieces = [];
  [-1, 1].forEach((side) => {
    mustachePieces.push(cylinderBetween(
      new THREE.Vector3(0.236, 0.968, side * 0.012),
      new THREE.Vector3(0.203, 0.928, side * 0.072),
      0.011,
      0.004,
      6,
    ));
  });
  group.add(createMesh(mustachePieces, materials.beard, { castShadow: false }));

  const hatGroup = new THREE.Group();
  hatGroup.position.set(0.1, 1.17, 0);
  hatGroup.rotation.z = 0.16;

  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.16, 30, 3), materials.hat);
  hat.castShadow = true;
  hat.receiveShadow = true;
  hatGroup.add(hat);

  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.312, 0.014, 6, 34), materials.strawDark);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = -0.082;
  hatGroup.add(brim);

  const hatKnob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), materials.strawDark);
  hatKnob.position.y = 0.09;
  hatGroup.add(hatKnob);

  group.add(hatGroup);

  return group;
}

function createRod(materials) {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0.34, 0.565, 0.01),
      new THREE.Vector3(0.58, 0.7, 0.035),
      new THREE.Vector3(1.06, 0.97, 0.07),
      new THREE.Vector3(1.62, 1.3, 0.095),
      new THREE.Vector3(2.16, 1.51, 0.115),
      ROD_TIP.clone(),
    ],
    false,
    'catmullrom',
    0.42,
  );

  const segments = [
    [0, 0.42, 0.022, 0.017],
    [0.42, 0.76, 0.017, 0.011],
    [0.76, 1, 0.011, 0.0045],
  ];

  segments.forEach(([start, end, radius, endRadius]) => {
    const points = [];
    const steps = 14;
    for (let i = 0; i <= steps; i += 1) {
      points.push(curve.getPoint(start + ((end - start) * i) / steps));
    }
    const sub = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.3);
    const tube = new THREE.TubeGeometry(sub, 20, radius, 6, false);
    const mesh = new THREE.Mesh(tube, materials.bambooRod);
    mesh.castShadow = true;
    group.add(mesh);
  });

  const threadMaterial = new THREE.MeshStandardMaterial({ color: '#7c3128', roughness: 0.72 });
  const wrapPieces = [];
  [0.05, 0.1, 0.15, 0.2, 0.46, 0.6, 0.74, 0.88].forEach((t) => {
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const band = new THREE.CylinderGeometry(0.019, 0.019, 0.016, 8);
    band.applyMatrix4(
      new THREE.Matrix4().compose(
        point,
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent),
        new THREE.Vector3(1, 1, 1),
      ),
    );
    wrapPieces.push(band);
  });
  group.add(createMesh(wrapPieces, threadMaterial, { castShadow: false }));

  const tipKnob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), materials.bambooNode);
  tipKnob.position.copy(ROD_TIP);
  group.add(tipKnob);

  return group;
}

function createFloat(materials) {
  const group = new THREE.Group();
  group.position.copy(FLOAT_BASE);

  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: '#e8ddc2', roughness: 0.5 }),
  );
  lower.position.y = 0.025;
  group.add(lower);

  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.026, 10),
    new THREE.MeshStandardMaterial({
      color: '#b83227',
      emissive: new THREE.Color('#3a0a06'),
      roughness: 0.5,
    }),
  );
  upper.position.y = 0.063;
  group.add(upper);

  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.006, 0.045, 6),
    new THREE.MeshStandardMaterial({ color: '#d94a32', roughness: 0.5 }),
  );
  tip.position.y = 0.1;
  group.add(tip);

  return group;
}

function createLine() {
  const positions = new Float32Array(18 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: '#efe9da',
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.frustumCulled = false;
  return line;
}

function createRipples(materials) {
  const group = new THREE.Group();
  const rings = [];

  for (let i = 0; i < 3; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: '#f2e6d2',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(FLOAT_BASE.x, -0.112, FLOAT_BASE.z);
    mesh.renderOrder = 3;
    group.add(mesh);
    rings.push({ mesh, material, offset: i / 3 });
  }

  const vesselMaterial = new THREE.MeshBasicMaterial({
    color: '#ded3bf',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const vesselRing = new THREE.Mesh(new THREE.RingGeometry(0.955, 1, 64), vesselMaterial);
  vesselRing.rotation.x = -Math.PI / 2;
  vesselRing.position.set(0, -0.116, 0);
  vesselRing.renderOrder = 3;
  group.add(vesselRing);

  function update(time) {
    rings.forEach((item, index) => {
      const progress = (time / 2.9 + item.offset) % 1;
      const scale = 0.08 + progress * 0.42;
      item.mesh.scale.set(scale, scale, 1);
      item.material.opacity = Math.sin(Math.PI * progress) * 0.13 * (1 - progress * 0.4);
      item.mesh.position.x = FLOAT_BASE.x + Math.sin(time * 0.8) * 0.012;
      item.mesh.position.z = FLOAT_BASE.z + Math.cos(time * 0.7) * 0.01;
    });

    const vesselProgress = (time / 6.8) % 1;
    const vesselScale = 2.1 + vesselProgress * 1.2;
    vesselRing.scale.set(vesselScale, vesselScale, 1);
    vesselMaterial.opacity = Math.sin(Math.PI * vesselProgress) * 0.022;
  }

  return { group, update };
}

export function createAngler(materials) {
  const group = new THREE.Group();
  group.position.set(-0.02, RAFT_DECK_Y, 0.02);
  group.rotation.y = -0.45;

  group.add(createRobe(materials));
  group.add(createCape(materials));
  group.add(createHead(materials));
  group.add(createRod(materials));

  const floatGroup = createFloat(materials);
  const line = createLine();
  const ripples = createRipples(materials);
  group.add(floatGroup, line, ripples.group);

  const linePositions = line.geometry.attributes.position;
  const point = new THREE.Vector3();

  function update(time) {
    const bob = Math.sin(time * 1.6) * 0.011 + Math.sin(time * 3.4 + 0.7) * 0.004;
    floatGroup.position.y = FLOAT_BASE.y + bob;
    floatGroup.position.x = FLOAT_BASE.x + Math.sin(time * 0.8) * 0.012;
    floatGroup.position.z = FLOAT_BASE.z + Math.cos(time * 0.7) * 0.01;
    floatGroup.rotation.z = Math.sin(time * 1.1) * 0.14;

    for (let i = 0; i < 18; i += 1) {
      const t = i / 17;
      point.lerpVectors(ROD_TIP, floatGroup.position, t);
      const sag = Math.sin(Math.PI * t) * 0.09;
      point.y -= sag;
      point.x += Math.sin(time * 0.7 + t * 2.4) * 0.01 * t;
      point.z += Math.cos(time * 0.6 + t * 1.9) * 0.008 * t;
      linePositions.setXYZ(i, point.x, point.y, point.z);
    }
    linePositions.needsUpdate = true;

    ripples.update(time);
  }

  update(0);

  return { group, update, floatGroup };
}
