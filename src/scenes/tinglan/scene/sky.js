import * as THREE from 'three';
import { createEnvironmentTexture } from '../lib/textures.js';

const vertexShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition.xyz, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uHazeColor;
  uniform vec3 uSunColor;
  uniform vec3 uCloudColor;
  uniform vec3 uSunDirection;
  uniform float uTime;
  varying vec3 vDirection;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(7.1, 3.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(vDirection);
    float h = clamp(direction.y, -0.25, 1.0);

    vec3 color = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.18, h));
    color = mix(color, uTopColor, smoothstep(0.12, 0.62, h));
    color = mix(uHazeColor, color, smoothstep(-0.06, 0.16, h));

    vec2 cloudUV = direction.xz / (max(direction.y, 0.02) + 0.3);
    cloudUV = cloudUV * 0.72 + vec2(uTime * 0.0028, uTime * 0.0011);
    float cloudNoise = fbm(cloudUV * 1.55 + vec2(2.8, 5.6));
    float cloudBand = smoothstep(0.015, 0.18, h) * (1.0 - smoothstep(0.45, 0.85, h));
    float cloud = smoothstep(0.52, 0.77, cloudNoise) * cloudBand * 0.34;
    color = mix(color, uCloudColor, cloud);

    vec3 sunDirection = normalize(uSunDirection);
    float sunDot = max(dot(direction, sunDirection), 0.0);
    float sunDisc = pow(sunDot, 1400.0);
    float sunHalo = pow(sunDot, 42.0);
    float sunWide = pow(sunDot, 6.0);
    color += uSunColor * sunDisc * 2.2;
    color += uSunColor * sunHalo * 0.52;
    color += uSunColor * sunWide * 0.19;

    float horizonGlow = pow(max(0.0, 1.0 - abs(h - 0.06) * 4.6), 3.0);
    color = mix(color, uHazeColor * 1.05, horizonGlow * 0.36);

    // A tiny amount of dithering prevents banding in the broad dusk gradient.
    float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky(scene, sunDirection) {
  const geometry = new THREE.SphereGeometry(260, 48, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color('#2e485b') },
      uMidColor: { value: new THREE.Color('#8b9b9e') },
      uHorizonColor: { value: new THREE.Color('#e9a56f') },
      uHazeColor: { value: new THREE.Color('#d29b78') },
      uSunColor: { value: new THREE.Color('#ffd2a0') },
      uCloudColor: { value: new THREE.Color('#f0cfb2') },
      uSunDirection: { value: sunDirection.clone().normalize() },
      uTime: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  scene.add(mesh);

  function update(time) {
    material.uniforms.uTime.value = time;
  }

  return { mesh, material, update };
}

export function applyEnvironment(renderer, scene) {
  const texture = createEnvironmentTexture();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const renderTarget = pmrem.fromEquirectangular(texture);
  scene.environment = renderTarget.texture;
  scene.environmentIntensity = 0.55;
  texture.dispose();
  pmrem.dispose();
  return renderTarget.texture;
}
