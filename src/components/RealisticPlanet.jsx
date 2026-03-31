import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const planetSurfaceVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uRotationSpeed;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    float rotation = uTime * uRotationSpeed;
    mat3 rotationMatrix = mat3(
      cos(rotation), 0.0, sin(rotation),
      0.0, 1.0, 0.0,
      -sin(rotation), 0.0, cos(rotation)
    );
    
    vec3 rotatedPosition = rotationMatrix * position;
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(rotatedPosition, 1.0)).xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const planetSurfaceFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uEmissiveIntensity;
  uniform float uRoughness;
  uniform float uMetalness;
  uniform float uFresnelPower;
  uniform vec3 uSunDirection;
  uniform float uAtmosphereDensity;
  uniform float uCloudDensity;
  uniform float uHasOcean;
  uniform vec3 uOceanColor;
  uniform sampler2D uNoiseTexture;
  
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
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
    
    vec3 pos = vPosition * 5.0;
    float terrainNoise = fbm(pos, 5);
    float detailNoise = fbm(pos * 4.0, 3);
    float microNoise = fbm(pos * 20.0, 2);
    
    float height = terrainNoise * 0.5 + 0.5;
    
    vec3 terrainColor;
    if(height < 0.3 && uHasOcean > 0.5) {
      terrainColor = mix(uOceanColor, uOceanColor * 0.8, height / 0.3);
    } else if(height < 0.4) {
      terrainColor = mix(uOceanColor, uColor3, (height - 0.3) / 0.1);
    } else if(height < 0.7) {
      terrainColor = mix(uColor3, uColor, (height - 0.4) / 0.3);
    } else {
      terrainColor = mix(uColor, uColor2, (height - 0.7) / 0.3);
    }
    
    terrainColor += microNoise * 0.1;
    terrainColor += detailNoise * 0.05;
    
    float cloudNoise = fbm(pos * 1.5 + vec3(uTime * 0.02), 4);
    float clouds = smoothstep(0.3, 0.7, cloudNoise) * uCloudDensity;
    vec3 cloudColor = vec3(1.0, 1.0, 1.0) * clouds * 0.3;
    
    vec3 lightDir = normalize(uSunDirection);
    float NdotL = max(dot(normal, lightDir), 0.0);
    
    float shadows = 1.0;
    float shadowNoise = fbm(pos * 2.0 + lightDir * 2.0, 3);
    shadows = smoothstep(-0.2, 0.5, NdotL + shadowNoise * 0.3);
    
    vec3 ambient = terrainColor * 0.15;
    vec3 diffuse = terrainColor * NdotL * 0.8;
    
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 32.0);
    specular *= (1.0 - uRoughness) * 0.6;
    
    vec3 sunColor = vec3(1.0, 0.95, 0.9);
    vec3 finalColor = ambient + diffuse * shadows + specular * sunColor;
    
    finalColor += cloudColor;
    
    vec3 rimColor = mix(uColor, vec3(0.5, 0.7, 1.0), 0.5) * fresnel * uAtmosphereDensity;
    finalColor += rimColor;
    
    vec3 emissiveColor = uColor * uEmissiveIntensity * (1.0 + sin(uTime * 2.0 + vPosition.y * 5.0) * 0.2);
    finalColor += emissiveColor * 0.1;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export default function RealisticPlanet({ repo }) {
  const meshRef = useRef()
  
  const secondaryColor = useMemo(() => {
    const color = new THREE.Color(repo.languageColor)
    color.offsetHSL(0.15, 0.3, -0.1)
    return color
  }, [repo.languageColor])
  
  const tertiaryColor = useMemo(() => {
    const color = new THREE.Color(repo.languageColor)
    color.offsetHSL(-0.1, 0.2, 0.2)
    return color
  }, [repo.languageColor])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(repo.languageColor) },
    uColor2: { value: secondaryColor },
    uColor3: { value: tertiaryColor },
    uEmissiveIntensity: { value: 0.5 },
    uRoughness: { value: 0.55 },
    uMetalness: { value: 0.45 },
    uFresnelPower: { value: 3.5 },
    uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    uAtmosphereDensity: { value: 0.9 },
    uCloudDensity: { value: 0.3 },
    uHasOcean: { value: Math.random() > 0.5 ? 1.0 : 0.0 },
    uOceanColor: { value: new THREE.Color('#1e3a5f') },
    uRotationSpeed: { value: 0.1 }
  }), [repo.languageColor, secondaryColor, tertiaryColor])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[repo.scale, 128, 128]} />
      <shaderMaterial
        vertexShader={planetSurfaceVertexShader}
        fragmentShader={planetSurfaceFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}