import { createWorld as createTinglanWorld } from './tinglan/scene/world.js';
import { createWorld as createAnglerWorld } from './angler/scene/world.js';

export const scenes = {
  tinglan: {
    title: '听澜阁',
    seal: ['听', '澜'],
    en: 'PAVILION BY THE WATER',
    aria: '听澜阁三维场景，可拖动旋转、滚轮缩放，双击或点击重置视角返回初始画面。',
    caption: '江南一隅 · 暮色初上',
    captionSmall: 'REFERENCE PROMPT · STUDY',
    theme: '#0a1414',
    exposure: 1.08,
    fov: 36,
    fit: { width: 7.0, mobileWidth: 5.75, height: 6.9 },
    target: [0.5, 4.15, 0],
    direction: [0.455, 0.238, 0.89],
    minDistance: 7,
    maxDistance: 46,
    minPolar: 0.22,
    maxPolarFactor: 0.492,
    autoRotateSpeed: 0.42,
    createWorld: createTinglanWorld,
  },
  angler: {
    title: '烟江钓叟',
    seal: ['烟', '江'],
    en: 'AN ANGLER ON THE MISTY RIVER',
    aria: '烟江钓叟三维场景，可拖动旋转、滚轮缩放，双击或点击重置视角返回初始画面。',
    caption: '一篙烟水 · 半日清闲',
    captionSmall: 'DAWN ON THE RIVER',
    theme: '#101c1f',
    exposure: 1.04,
    fov: 34,
    fit: { width: 4.6, mobileWidth: 2.3, height: 2.0 },
    target: [0.6, 0.72, 0.18],
    direction: [0.6, 0.3, 0.8],
    minDistance: 4.5,
    maxDistance: 42,
    minPolar: 0.18,
    maxPolarFactor: 0.492,
    autoRotateSpeed: 0.36,
    createWorld: createAnglerWorld,
  },
};

export const sceneOrder = Object.keys(scenes);
