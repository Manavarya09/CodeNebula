import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const waterVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uWaveHeight;
  
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
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    float wave1 = snoise(vec3(pos.x * 2.0 + uTime * 0.5, pos.z * 2.0, uTime * 0.3)) * uWaveHeight;
    float wave2 = snoise(vec3(pos.x * 4.0 - uTime * 0.3, pos.z * 4.0, uTime * 0.5)) * uWaveHeight * 0.5;
    float wave3 = snoise(vec3(pos.x * 8.0 + uTime * 0.7, pos.z * 8.0, uTime * 0.2)) * uWaveHeight * 0.25;
    
    pos.y += wave1 + wave2 + wave3;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = pos;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const waterFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform vec3 uWaterColor;
  uniform vec3 uDeepColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSunDirection;
  uniform float uFresnelPower;
  uniform float uShininess;
  uniform float uReflectionStrength;
  
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
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
    
    vec3 lightDir = normalize(uSunDirection);
    float NdotL = max(dot(normal, lightDir), 0.0);
    
    float depth = smoothstep(-0.5, 0.5, vPosition.y);
    vec3 waterColor = mix(uDeepColor, uWaterColor, depth);
    
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), uShininess);
    specular *= pow(NdotL, 0.5);
    
    float caustic1 = snoise(vec3(vPosition.x * 10.0 + uTime * 2.0, vPosition.z * 10.0, uTime));
    float caustic2 = snoise(vec3(vPosition.x * 15.0 - uTime * 1.5, vPosition.z * 15.0, uTime * 0.8));
    float caustics = (caustic1 + caustic2) * 0.5 + 0.5;
    caustics = pow(caustics, 3.0) * 0.3;
    
    float foamNoise = snoise(vec3(vPosition.x * 20.0 + uTime, vPosition.z * 20.0, uTime * 0.5));
    float foam = smoothstep(0.6, 0.8, foamNoise) * smoothstep(0.3, 0.5, vPosition.y);
    foam *= 0.3;
    
    vec3 ambient = waterColor * 0.2;
    vec3 diffuse = waterColor * NdotL * 0.6;
    vec3 reflectColor = vec3(0.3, 0.5, 0.8) * fresnel * uReflectionStrength;
    vec3 specularColor = vec3(1.0, 0.95, 0.9) * specular * 1.5;
    vec3 causticColor = vec3(0.2, 0.8, 1.0) * caustics;
    vec3 foamColor = uFoamColor * foam;
    
    vec3 finalColor = ambient + diffuse + reflectColor + specularColor + causticColor + foamColor;
    
    float transparency = 0.7 + fresnel * 0.2;
    
    gl_FragColor = vec4(finalColor, transparency);
  }
`

export default function Ocean({ scale = 1, position = [0, 0, 0] }) {
  const meshRef = useRef()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaterColor: { value: new THREE.Color('#006994') },
    uDeepColor: { value: new THREE.Color('#001e3d') },
    uFoamColor: { value: new THREE.Color('#ffffff') },
    uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
    uFresnelPower: { value: 3.0 },
    uShininess: { value: 256.0 },
    uReflectionStrength: { value: 0.8 },
    uWaveHeight: { value: 0.05 }
  }), [])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[scale, 128, 128]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function PlanetOcean({ planetScale = 1, hasOcean = true }) {
  if (!hasOcean) return null
  
  return (
    <mesh scale={planetScale * 0.99}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uWaterColor: { value: new THREE.Color('#0077be') },
          uDeepColor: { value: new THREE.Color('#001a33') },
          uFoamColor: { value: new THREE.Color('#ffffff') },
          uSunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
          uFresnelPower: { value: 2.5 },
          uShininess: { value: 128.0 },
          uReflectionStrength: { value: 0.6 },
          uWaveHeight: { value: 0.02 }
        }}
        transparent
      />
    </mesh>
  )
}