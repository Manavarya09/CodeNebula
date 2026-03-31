import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const photorealisticPlanetVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const photorealisticPlanetFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uSunDirection;
  uniform float uRoughness;
  uniform float uMetalness;
  uniform float uOceanLevel;
  uniform vec3 uOceanColor;
  uniform float uHasAtmosphere;
  uniform vec3 uAtmosphereColor;
  
  #define PI 3.14159265359
  
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 6; i++) {
      if(i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }
  
  float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return nom / denom;
  }
  
  float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    return nom / denom;
  }
  
  float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
  }
  
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    vec3 L = normalize(uSunDirection);
    vec3 H = normalize(V + L);
    
    vec3 baseColor = uColor;
    vec3 secondaryColor = uSecondaryColor;
    
    vec3 pos = vPosition * 8.0;
    float terrain = fbm(pos, 6);
    float detail = fbm(pos * 3.0, 3);
    float micro = fbm(pos * 15.0, 2);
    
    float height = terrain * 0.5 + 0.5;
    
    vec3 surfaceColor;
    if (height < uOceanLevel) {
      surfaceColor = uOceanColor;
      float waveNoise = fbm(pos * 5.0 + vec3(uTime * 0.5, 0.0, 0.0), 3);
      surfaceColor += vec3(0.05) * waveNoise;
    } else if (height < uOceanLevel + 0.1) {
      float t = (height - uOceanLevel) / 0.1;
      surfaceColor = mix(uOceanColor, secondaryColor, t);
    } else if (height < 0.7) {
      float t = (height - uOceanLevel - 0.1) / 0.5;
      surfaceColor = mix(secondaryColor, baseColor, t);
    } else {
      surfaceColor = mix(baseColor, secondaryColor * 0.7, (height - 0.7) / 0.3);
    }
    
    surfaceColor += micro * 0.08;
    surfaceColor += detail * 0.05;
    
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, surfaceColor, uMetalness);
    
    float NDF = distributionGGX(N, H, uRoughness);
    float G = geometrySmith(N, V, L, uRoughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
    
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - uMetalness;
    
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;
    
    float wrap = 0.5;
    float diffuse = max((NdotL + wrap) / (1.0 + wrap), 0.0);
    
    vec3 ambient = surfaceColor * 0.03;
    vec3 sunLight = vec3(1.0, 0.95, 0.9) * 1.5;
    
    vec3 Lo = (kD * surfaceColor / PI + specular) * sunLight * diffuse;
    
    vec3 color = ambient + Lo;
    
    if (uHasAtmosphere > 0.5) {
      float fresnel = pow(1.0 - NdotV, 3.0);
      vec3 atmosphereColor = uAtmosphereColor * fresnel * 0.5;
      color += atmosphereColor;
    }
    
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));
    
    gl_FragColor = vec4(color, 1.0);
  }
`

export function PhotorealisticPlanet({ repo }) {
  const meshRef = useRef()
  
  const secondaryColor = useMemo(() => {
    const color = new THREE.Color(repo.languageColor)
    color.offsetHSL(0.05, -0.2, -0.1)
    return color
  }, [repo.languageColor])
  
  const oceanColor = useMemo(() => {
    return new THREE.Color('#0a2a4a')
  }, [])
  
  const atmosphereColor = useMemo(() => {
    return new THREE.Color(repo.languageColor).offsetHSL(0.1, 0.3, 0.2)
  }, [repo.languageColor])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(repo.languageColor) },
    uSecondaryColor: { value: secondaryColor },
    uSunDirection: { value: new THREE.Vector3(1, 0.8, 0.5).normalize() },
    uRoughness: { value: 0.7 },
    uMetalness: { value: 0.1 },
    uOceanLevel: { value: 0.35 },
    uOceanColor: { value: oceanColor },
    uHasAtmosphere: { value: 1.0 },
    uAtmosphereColor: { value: atmosphereColor }
  }), [repo.languageColor, secondaryColor, oceanColor, atmosphereColor])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
      meshRef.current.rotation.y += 0.0008
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[repo.scale, 128, 128]} />
      <shaderMaterial
        vertexShader={photorealisticPlanetVertexShader}
        fragmentShader={photorealisticPlanetFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default PhotorealisticPlanet