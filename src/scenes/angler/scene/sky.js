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

    vec3 color = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.2, h));
    color = mix(color, uTopColor, smoothstep(0.14, 0.7, h));
    color = mix(uHazeColor, color, smoothstep(-0.08, 0.18, h));

    vec2 cloudUV = direction.xz / (max(direction.y, 0.02) + 0.32);
    cloudUV = cloudUV * 0.66 + vec2(uTime * 0.0024, uTime * 0.0009);
    float cloudNoise = fbm(cloudUV * 1.7 + vec2(3.4, 6.2));
    float cloudBand = smoothstep(0.02, 0.16, h) * (1.0 - smoothstep(0.38, 0.78, h));
    float cloud = smoothstep(0.54, 0.79, cloudNoise) * cloudBand * 0.42;
    color = mix(color, uCloudColor, cloud);

    vec3 sunDirection = normalize(uSunDirection);
    float sunDot = max(dot(direction, sunDirection), 0.0);
    float sunDisc = pow(sunDot, 1600.0);
    float sunHalo = pow(sunDot, 34.0);
    float sunWide = pow(sunDot, 7.0);
    color += uSunColor * sunDisc * 1.9;
    color += uSunColor * sunHalo * 0.5;
    color += uSunColor * sunWide * 0.2;

    float horizonGlow = pow(max(0.0, 1.0 - abs(h - 0.05) * 4.2), 3.0);
    color = mix(color, uHazeColor * 1.04, horizonGlow * 0.42);

    float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    color += dither;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky(scene, sunDirection) {
  const geometry = new THREE.SphereGeometry(320, 48, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTopColor: { value: new THREE.Color('#405c72') },
      uMidColor: { value: new THREE.Color('#93a7aa') },
      uHorizonColor: { value: new THREE.Color('#f4bf91') },
      uHazeColor: { value: new THREE.Color('#e0b695') },
      uSunColor: { value: new THREE.Color('#ffe0b0') },
      uCloudColor: { value: new THREE.Color('#f7ddc2') },
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
  scene.environmentIntensity = 0.62;
  texture.dispose();
  pmrem.dispose();
  return renderTarget.texture;
}
