import * as THREE from 'three';

export function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(width, height = width) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function toTexture(canvas, { repeat = [1, 1], srgb = true, anisotropy = 1 } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function repeatTexture(texture, x, y) {
  const clone = texture.clone();
  clone.wrapS = THREE.RepeatWrapping;
  clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(x, y);
  clone.needsUpdate = true;
  return clone;
}

export function createWaterNormalTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  const waves = [
    [1, 2, 0.44, 0.8],
    [2, -3, 0.26, 2.1],
    [5, 1, 0.13, 1.3],
    [7, -5, 0.075, 4.2],
    [3, 7, 0.11, 3.4],
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      let dx = 0;
      let dy = 0;
      for (const [fx, fy, amplitude, phase] of waves) {
        const angle = Math.PI * 2 * (fx * u + fy * v) + phase;
        dx += amplitude * Math.PI * 2 * fx * Math.cos(angle);
        dy += amplitude * Math.PI * 2 * fy * Math.cos(angle);
      }
      const nx = -dx * 0.026;
      const ny = -dy * 0.026;
      const nz = 1;
      const length = Math.hypot(nx, ny, nz);
      const index = (y * size + x) * 4;
      image.data[index] = Math.round(((nx / length) * 0.5 + 0.5) * 255);
      image.data[index + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255);
      image.data[index + 2] = Math.round(((nz / length) * 0.5 + 0.5) * 255);
      image.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createGlowTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(255,246,225,0.92)');
  gradient.addColorStop(0.32, 'rgba(255,210,148,0.34)');
  gradient.addColorStop(0.6, 'rgba(255,180,100,0.08)');
  gradient.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createShadowTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.72)');
  gradient.addColorStop(0.38, 'rgba(255,255,255,0.36)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
