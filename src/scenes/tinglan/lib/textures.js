import * as THREE from 'three';

import {
  createGlowTexture,
  createShadowTexture,
  createWaterNormalTexture,
  makeCanvas,
  mulberry32,
  toTexture,
} from '../../shared/textures.js';

export { createGlowTexture, createShadowTexture, createWaterNormalTexture };


export function createStoneTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(1273);
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#d2c8b4');
  grad.addColorStop(0.48, '#c7bca6');
  grad.addColorStop(1, '#bab098');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 85; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 12 + random() * 78;
    const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = random() > 0.55;
    blob.addColorStop(0, light ? 'rgba(255,247,226,0.055)' : 'rgba(103,95,78,0.05)');
    blob.addColorStop(1, light ? 'rgba(255,247,226,0)' : 'rgba(103,95,78,0)');
    ctx.fillStyle = blob;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (let i = 0; i < 7200; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const alpha = 0.018 + random() * 0.05;
    ctx.fillStyle = random() > 0.42 ? `rgba(92,84,68,${alpha})` : `rgba(255,248,228,${alpha})`;
    ctx.fillRect(x, y, 1 + random() * 1.4, 1 + random() * 1.2);
  }

  ctx.strokeStyle = 'rgba(82,76,62,0.22)';
  ctx.lineWidth = 1.4;
  const rows = [128, 256, 384];
  rows.forEach((y, index) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (index % 2 === 0 ? 1 : -1));
    ctx.stroke();
    const offset = index % 2 === 0 ? 0 : 128;
    for (let x = offset; x < size; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 1, y + 128);
      ctx.stroke();
    }
  });

  ctx.strokeStyle = 'rgba(79,73,59,0.11)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 18; i += 1) {
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 18, y + 3, x + 26, y + 12, x + 43, y + 9);
    ctx.stroke();
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createWoodTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(8831);
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#b4866b');
  grad.addColorStop(0.35, '#c19678');
  grad.addColorStop(0.7, '#a97960');
  grad.addColorStop(1, '#ba8c70');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 150; i += 1) {
    const x = random() * size;
    const amplitude = 1 + random() * 7;
    const frequency = 0.008 + random() * 0.022;
    const phase = random() * Math.PI * 2;
    ctx.beginPath();
    for (let y = 0; y <= size; y += 8) {
      const xx = x + Math.sin(y * frequency + phase) * amplitude;
      if (y === 0) ctx.moveTo(xx, y);
      else ctx.lineTo(xx, y);
    }
    ctx.strokeStyle = `rgba(76,39,27,${0.036 + random() * 0.085})`;
    ctx.lineWidth = 0.5 + random() * 1.4;
    ctx.stroke();
  }

  for (let i = 0; i < 7; i += 1) {
    const x = 40 + random() * (size - 80);
    const y = 40 + random() * (size - 80);
    const radius = 5 + random() * 13;
    for (let ring = 0; ring < 4; ring += 1) {
      const rx = Math.max(0.7, radius - ring * 2.4);
      const ry = Math.max(0.3, rx * 0.42);
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, random() * 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(61,29,20,${0.14 - ring * 0.025})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  const light = ctx.createLinearGradient(0, 0, size, 0);
  light.addColorStop(0, 'rgba(255,224,191,0.02)');
  light.addColorStop(0.5, 'rgba(255,224,191,0.13)');
  light.addColorStop(1, 'rgba(255,224,191,0.01)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size, size);

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createFloorTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(4821);
  ctx.fillStyle = '#4b2d21';
  ctx.fillRect(0, 0, size, size);

  const plankHeight = 64;
  for (let row = 0; row < size / plankHeight; row += 1) {
    const y = row * plankHeight;
    const tone = 45 + random() * 16;
    ctx.fillStyle = `rgb(${tone + 30},${tone + 2},${tone - 8})`;
    ctx.fillRect(0, y, size, plankHeight - 1);
    ctx.fillStyle = 'rgba(24,12,9,0.5)';
    ctx.fillRect(0, y + plankHeight - 2, size, 2);

    const joint = (row % 2 === 0 ? 180 : 360) + (random() - 0.5) * 50;
    ctx.fillStyle = 'rgba(24,12,9,0.45)';
    ctx.fillRect(joint, y, 2, plankHeight);

    for (let i = 0; i < 22; i += 1) {
      const yy = y + 4 + random() * (plankHeight - 8);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(140, yy + random() * 4 - 2, 320, yy + random() * 4 - 2, size, yy);
      ctx.strokeStyle = `rgba(231,183,138,${0.018 + random() * 0.045})`;
      ctx.lineWidth = 0.5 + random() * 0.8;
      ctx.stroke();
    }
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createTileTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(923);
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#65747a');
  grad.addColorStop(0.5, '#55646b');
  grad.addColorStop(1, '#4a575e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 140; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 8 + random() * 52;
    const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
    blob.addColorStop(0, random() > 0.55 ? 'rgba(185,200,204,0.055)' : 'rgba(20,29,33,0.06)');
    blob.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blob;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (let x = 0; x < size; x += 18) {
    const gradLine = ctx.createLinearGradient(x, 0, x + 18, 0);
    gradLine.addColorStop(0, 'rgba(10,17,20,0.2)');
    gradLine.addColorStop(0.32, 'rgba(198,214,216,0.1)');
    gradLine.addColorStop(0.7, 'rgba(198,214,216,0.02)');
    gradLine.addColorStop(1, 'rgba(10,17,20,0.22)');
    ctx.fillStyle = gradLine;
    ctx.fillRect(x, 0, 18, size);
  }

  for (let y = 0; y < size; y += 42) {
    ctx.fillStyle = 'rgba(14,21,24,0.13)';
    ctx.fillRect(0, y, size, 2);
    ctx.fillStyle = 'rgba(188,204,208,0.035)';
    ctx.fillRect(0, y + 2, size, 1);
  }

  for (let i = 0; i < 2600; i += 1) {
    const x = random() * size;
    const y = random() * size;
    ctx.fillStyle = `rgba(225,236,236,${random() * 0.035})`;
    ctx.fillRect(x, y, 1, 1 + random() * 2);
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createPaperTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(5519);
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.45, 10, size * 0.5, size * 0.5, size * 0.75);
  grad.addColorStop(0, '#ead9b9');
  grad.addColorStop(0.65, '#dfcaa6');
  grad.addColorStop(1, '#cdb68f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1900; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const length = 2 + random() * 20;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 2);
    ctx.strokeStyle = random() > 0.5 ? 'rgba(255,246,224,0.08)' : 'rgba(116,91,58,0.05)';
    ctx.lineWidth = 0.4 + random() * 0.6;
    ctx.stroke();
  }

  for (let i = 0; i < 30; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 8 + random() * 36;
    const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
    blob.addColorStop(0, 'rgba(142,108,64,0.035)');
    blob.addColorStop(1, 'rgba(142,108,64,0)');
    ctx.fillStyle = blob;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createMistTexture() {
  const width = 512;
  const height = 256;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(661);
  for (let i = 0; i < 7; i += 1) {
    const x = width * (0.25 + random() * 0.5);
    const y = height * (0.35 + random() * 0.35);
    const rx = width * (0.18 + random() * 0.22);
    const ry = height * (0.16 + random() * 0.16);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(0.52, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    ctx.translate(-x, -y);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPlaqueTexture(text = '听澜阁') {
  const width = 1024;
  const height = 320;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#1a0e0a');
  background.addColorStop(0.45, '#2e1a10');
  background.addColorStop(1, '#160c09');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const random = mulberry32(3109);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(219,170,108,${random() * 0.035})`;
    ctx.fillRect(random() * width, random() * height, 1 + random() * 2, 1);
  }

  ctx.strokeStyle = 'rgba(206,164,96,0.92)';
  ctx.lineWidth = 5;
  ctx.strokeRect(22, 22, width - 44, height - 44);
  ctx.strokeStyle = 'rgba(206,164,96,0.35)';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(38, 38, width - 76, height - 76);

  ctx.strokeStyle = 'rgba(219,180,116,0.6)';
  ctx.lineWidth = 2;
  [
    [22, 22, 1, 1],
    [width - 22, 22, -1, 1],
    [22, height - 22, 1, -1],
    [width - 22, height - 22, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + 64 * sx, y);
    ctx.quadraticCurveTo(x + 22 * sx, y + 18 * sy, x, y + 70 * sy);
    ctx.stroke();
  });

  const gold = ctx.createLinearGradient(0, 90, 0, 245);
  gold.addColorStop(0, '#f1d49a');
  gold.addColorStop(0.38, '#c99a58');
  gold.addColorStop(0.65, '#edc985');
  gold.addColorStop(1, '#a8783c');
  ctx.fillStyle = gold;
  ctx.font = '600 148px "STKaiti", "KaiTi", "Kaiti SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '24px';
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.fillText(text, width / 2, height / 2 + 6);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = '#9b3126';
  ctx.fillRect(width - 102, height - 82, 42, 42);
  ctx.strokeStyle = 'rgba(245,224,190,0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(width - 98, height - 78, 34, 34);
  ctx.fillStyle = 'rgba(248,232,210,0.9)';
  ctx.font = '20px "STKaiti", "KaiTi", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('临', width - 81, height - 70);
  ctx.fillText('水', width - 81, height - 52);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createPaintingTexture() {
  const width = 1024;
  const height = 640;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(7155);

  const paper = ctx.createLinearGradient(0, 0, 0, height);
  paper.addColorStop(0, '#cbb98f');
  paper.addColorStop(0.45, '#ddcaa3');
  paper.addColorStop(1, '#c2ad84');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  const sun = ctx.createRadialGradient(760, 150, 0, 760, 150, 120);
  sun.addColorStop(0, 'rgba(179,102,62,0.4)');
  sun.addColorStop(0.5, 'rgba(179,102,62,0.12)');
  sun.addColorStop(1, 'rgba(179,102,62,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(600, 0, 320, 320);

  ctx.fillStyle = 'rgba(158,85,56,0.34)';
  ctx.beginPath();
  ctx.arc(760, 150, 42, 0, Math.PI * 2);
  ctx.fill();

  const mountainLayers = [
    { color: 'rgba(93,107,104,0.16)', base: 520, peaks: [100, 230, 380, 610, 840, 1024] },
    { color: 'rgba(66,85,84,0.24)', base: 560, peaks: [0, 170, 310, 500, 720, 920, 1024] },
    { color: 'rgba(43,65,63,0.35)', base: 610, peaks: [0, 120, 280, 430, 690, 1024] },
  ];

  mountainLayers.forEach((layer, layerIndex) => {
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, layer.base);
    const span = width / (layer.peaks.length - 1);
    layer.peaks.forEach((x, index) => {
      if (index === 0) return;
      const prev = layer.peaks[index - 1];
      const plateau = layer.base - 20 - random() * 40;
      const peak = plateau - 80 - random() * (layerIndex === 0 ? 70 : 160);
      ctx.bezierCurveTo(prev + span * 0.3, plateau, x - span * 0.35, peak, x, plateau + random() * 40);
    });
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  });

  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = `rgba(231,217,186,${0.14 + i * 0.045})`;
    ctx.fillRect(0, 430 + i * 34, width, 10 + i * 5);
  }

  ctx.strokeStyle = 'rgba(48,61,58,0.32)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 23; i += 1) {
    const y = 560 + random() * 70;
    const x = random() * width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 30, y - 3, x + 60, y + 4, x + 120, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(43,54,51,0.8)';
  ctx.font = '34px "STKaiti", "KaiTi", "SimSun", serif';
  ctx.textAlign = 'center';
  const poem = '水阔听澜';
  poem.split('').forEach((character, index) => {
    ctx.fillText(character, 930, 70 + index * 44);
  });

  ctx.strokeStyle = 'rgba(71,53,35,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createEnvironmentTexture() {
  const width = 1024;
  const height = 512;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#3f5d70');
  gradient.addColorStop(0.3, '#7d979f');
  gradient.addColorStop(0.48, '#e5b98c');
  gradient.addColorStop(0.54, '#c59c74');
  gradient.addColorStop(0.7, '#405458');
  gradient.addColorStop(1, '#1b2b2c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(270, 225, 0, 270, 225, 170);
  glow.addColorStop(0, 'rgba(255,236,202,0.95)');
  glow.addColorStop(0.1, 'rgba(255,214,159,0.7)');
  glow.addColorStop(0.4, 'rgba(255,179,110,0.18)');
  glow.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const random = mulberry32(121);
  for (let i = 0; i < 55; i += 1) {
    const x = random() * width;
    const y = 120 + random() * 150;
    const rx = 30 + random() * 100;
    const ry = 4 + random() * 12;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx);
    cloud.addColorStop(0, 'rgba(255,230,204,0.08)');
    cloud.addColorStop(1, 'rgba(255,230,204,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillStyle = cloud;
    ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}
