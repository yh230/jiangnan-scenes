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

export function createBambooTexture(anisotropy = 1) {
  const width = 256;
  const height = 512;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(2411);

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#8d7c46');
  grad.addColorStop(0.28, '#c2b072');
  grad.addColorStop(0.55, '#b3a162');
  grad.addColorStop(0.8, '#c8b47a');
  grad.addColorStop(1, '#8a7944');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 260; i += 1) {
    const x = random() * width;
    const alpha = 0.02 + random() * 0.06;
    ctx.strokeStyle = random() > 0.4 ? `rgba(84,70,34,${alpha})` : `rgba(246,232,188,${alpha})`;
    ctx.lineWidth = 0.5 + random() * 1.8;
    ctx.beginPath();
    for (let y = 0; y <= height; y += 16) {
      const xx = x + Math.sin(y * 0.012 + random() * 0.2) * 2.4;
      if (y === 0) ctx.moveTo(xx, y);
      else ctx.lineTo(xx, y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 26; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const r = 2 + random() * 7;
    const blot = ctx.createRadialGradient(x, y, 0, x, y, r);
    blot.addColorStop(0, 'rgba(87,74,38,0.16)');
    blot.addColorStop(1, 'rgba(87,74,38,0)');
    ctx.fillStyle = blot;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  for (let y = 0; y < height; y += 128) {
    const band = ctx.createLinearGradient(0, y - 8, 0, y + 8);
    band.addColorStop(0, 'rgba(88,72,34,0)');
    band.addColorStop(0.5, 'rgba(88,72,34,0.2)');
    band.addColorStop(1, 'rgba(88,72,34,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 8, width, 16);
  }

  const light = ctx.createLinearGradient(0, 0, width, 0);
  light.addColorStop(0, 'rgba(255,240,196,0)');
  light.addColorStop(0.4, 'rgba(255,240,196,0.16)');
  light.addColorStop(1, 'rgba(255,240,196,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createStrawTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(7319);

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#c9ab6d');
  grad.addColorStop(0.5, '#b99a5d');
  grad.addColorStop(1, '#a98a50');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1500; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const length = 18 + random() * 120;
    const light = random() > 0.42;
    ctx.strokeStyle = light
      ? `rgba(244,224,170,${0.05 + random() * 0.12})`
      : `rgba(104,78,38,${0.04 + random() * 0.11})`;
    ctx.lineWidth = 0.6 + random() * 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 6, y + length);
    ctx.stroke();
  }

  for (let y = 26; y < size; y += 86) {
    ctx.strokeStyle = 'rgba(88,64,32,0.22)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y - 4, size * 0.7, y + 5, size, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(246,226,176,0.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y + 3);
    ctx.lineTo(size, y + 2);
    ctx.stroke();
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createRopeTexture(anisotropy = 1) {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(931);
  ctx.fillStyle = '#9a7d4f';
  ctx.fillRect(0, 0, size, size);

  for (let i = -size; i < size * 2; i += 9) {
    ctx.strokeStyle = `rgba(78,56,30,${0.2 + random() * 0.16})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 26, size * 0.35, i - 26, size * 0.7, i + 8, size);
    ctx.stroke();
    ctx.strokeStyle = `rgba(232,205,150,${0.12 + random() * 0.12})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(i + 4, 0);
    ctx.bezierCurveTo(i + 30, size * 0.35, i - 22, size * 0.7, i + 12, size);
    ctx.stroke();
  }

  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(56,40,20,${random() * 0.12})`;
    ctx.fillRect(random() * size, random() * size, 1, 1 + random() * 2);
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createMatTexture(anisotropy = 1) {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(3557);

  ctx.fillStyle = '#a98c55';
  ctx.fillRect(0, 0, size, size);

  const stripHeight = 26;
  for (let row = 0; row < size / stripHeight; row += 1) {
    const y = row * stripHeight;
    const tone = 158 + random() * 34;
    ctx.fillStyle = `rgb(${tone + 12},${tone - 14},${tone - 74})`;
    ctx.fillRect(0, y, size, stripHeight - 2);
    ctx.fillStyle = 'rgba(70,50,24,0.34)';
    ctx.fillRect(0, y + stripHeight - 2, size, 2);

    for (let i = 0; i < 10; i += 1) {
      const yy = y + 3 + random() * (stripHeight - 8);
      ctx.strokeStyle = `rgba(250,230,178,${0.04 + random() * 0.08})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(size, yy + (random() - 0.5) * 3);
      ctx.stroke();
    }
  }

  for (let x = 24; x < size; x += 72) {
    ctx.strokeStyle = 'rgba(62,44,22,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232,205,150,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, 0);
    ctx.lineTo(x + 3, size);
    ctx.stroke();
  }

  return toTexture(canvas, { repeat: [1, 1], anisotropy });
}

export function createClothTexture(anisotropy = 1) {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const random = mulberry32(6127);

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#455a63');
  grad.addColorStop(0.45, '#384c57');
  grad.addColorStop(1, '#2e404a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = `rgba(214,228,230,${0.012 + random() * 0.02})`;
    ctx.fillRect(0, y, size, 1);
  }
  for (let x = 0; x < size; x += 3) {
    ctx.fillStyle = `rgba(10,20,26,${0.014 + random() * 0.02})`;
    ctx.fillRect(x, 0, 1, size);
  }

  for (let i = 0; i < 40; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = 10 + random() * 46;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
    patch.addColorStop(0, `rgba(176,196,196,${random() * 0.05})`);
    patch.addColorStop(1, 'rgba(176,196,196,0)');
    ctx.fillStyle = patch;
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
  for (let i = 0; i < 8; i += 1) {
    const x = width * (0.25 + random() * 0.5);
    const y = height * (0.35 + random() * 0.35);
    const rx = width * (0.2 + random() * 0.24);
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

export function createEnvironmentTexture() {
  const width = 1024;
  const height = 512;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#405a6c');
  gradient.addColorStop(0.3, '#859aa0');
  gradient.addColorStop(0.46, '#d8b894');
  gradient.addColorStop(0.52, '#e9c49c');
  gradient.addColorStop(0.62, '#8d8471');
  gradient.addColorStop(0.8, '#3c4c48');
  gradient.addColorStop(1, '#182625');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(320, 236, 0, 320, 236, 190);
  glow.addColorStop(0, 'rgba(255,240,206,0.98)');
  glow.addColorStop(0.1, 'rgba(255,216,164,0.72)');
  glow.addColorStop(0.42, 'rgba(255,186,122,0.18)');
  glow.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const random = mulberry32(4417);
  for (let i = 0; i < 62; i += 1) {
    const x = random() * width;
    const y = 120 + random() * 140;
    const rx = 40 + random() * 120;
    const ry = 4 + random() * 12;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, rx);
    cloud.addColorStop(0, 'rgba(255,234,210,0.09)');
    cloud.addColorStop(1, 'rgba(255,234,210,0)');
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
