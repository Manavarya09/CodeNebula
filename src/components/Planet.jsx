import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useStore from '../store/useStore'
import { generateCommitParticles } from '../utils/dataMapper'
import OrbitParticles from './OrbitParticles'
import { PlanetAtmosphere } from './Atmosphere'

const planetVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  
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
    vPosition = position;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`

const planetFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uEmissiveIntensity;
  uniform float uRoughness;
  uniform float uMetalness;
  uniform float uFresnelPower;
  uniform vec3 uAtmosphereColor;
  uniform float uAtmosphereIntensity;
  
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
  
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
    
    vec3 pos = vPosition * 4.0;
    float noise1 = fbm(pos + uTime * 0.1);
    float noise2 = fbm(pos * 2.0 - uTime * 0.05);
    float noise3 = fbm(pos * 0.5 + uTime * 0.02);
    
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    vec3 baseColor = mix(uColor, uColor2, combinedNoise * 0.5 + 0.5);
    
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float lighting = max(dot(normal, lightDir), 0.0);
    lighting = lighting * 0.6 + 0.4;
    
    vec3 ambient = baseColor * 0.15;
    vec3 diffuse = baseColor * lighting;
    
    vec3 halfDir = normalize(lightDir + viewDir);
    float specular = pow(max(dot(normal, halfDir), 0.0), 64.0);
    specular *= (1.0 - uRoughness) * 0.8;
    
    vec3 emissive = baseColor * uEmissiveIntensity * (1.0 + sin(uTime * 2.0 + vPosition.y * 3.0) * 0.3);
    
    vec3 finalColor = ambient + diffuse + specular * vec3(1.0, 0.95, 0.9) + emissive;
    
    vec3 rimColor = uAtmosphereColor * fresnel * uAtmosphereIntensity;
    finalColor += rimColor;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const ringVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  
  void main() {
    float dist = abs(vUv.x - 0.5) * 2.0;
    
    float alpha = (1.0 - dist) * uOpacity;
    
    float bands = sin(vUv.x * 50.0 + uTime) * 0.5 + 0.5;
    alpha *= 0.7 + bands * 0.3;
    
    vec3 color = uColor * (1.0 + bands * 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function Planet({ repo }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  const { selectedRepo, setSelectedRepo, setHoveredRepo, cameraTarget } = useStore()
  const isSelected = selectedRepo?.id === repo.id
  const isOtherSelected = selectedRepo && selectedRepo.id !== repo.id
  
  const particles = useMemo(() => generateCommitParticles(repo, repo.commits), [repo])
  
  const secondaryColor = useMemo(() => {
    const color = new THREE.Color(repo.languageColor)
    color.offsetHSL(0.1, 0, 0.2)
    return color
  }, [repo.languageColor])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(repo.languageColor) },
    uColor2: { value: secondaryColor },
    uEmissiveIntensity: { value: 0.4 },
    uRoughness: { value: 0.6 },
    uMetalness: { value: 0.4 },
    uFresnelPower: { value: 3.0 },
    uAtmosphereColor: { value: new THREE.Color(repo.languageColor) },
    uAtmosphereIntensity: { value: 0.8 }
  }), [repo.languageColor, secondaryColor])
  
  const ringUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(repo.ringColor) },
    uOpacity: { value: 0.4 }
  }), [repo.ringColor])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const angle = time * repo.orbitSpeed + repo.orbitPhase
    const radius = repo.orbitRadius
    
    meshRef.current.position.x = Math.cos(angle) * radius
    meshRef.current.position.z = Math.sin(angle) * radius
    meshRef.current.position.y = Math.sin(time * 0.5 + repo.orbitPhase) * 2
    
    meshRef.current.rotation.y += 0.003
    
    if (meshRef.current.material.uniforms) {
      meshRef.current.material.uniforms.uTime.value = time
      meshRef.current.material.uniforms.uEmissiveIntensity.value = hovered || isSelected ? 0.8 : 0.4
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.003
      if (ringRef.current.material.uniforms) {
        ringRef.current.material.uniforms.uTime.value = time
      }
    }
    
    if (glowRef.current) {
      const scale = hovered || isSelected ? 1.4 : 1.2
      glowRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
  })
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (isSelected) {
      setSelectedRepo(null)
    } else {
      setSelectedRepo(repo)
    }
  }
  
  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    setHoveredRepo(repo)
    document.body.style.cursor = 'pointer'
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    setHoveredRepo(null)
    document.body.style.cursor = 'auto'
  }
  
  const opacity = isOtherSelected ? 0.25 : 1
  
  return (
    <group>
      <group position={repo.position}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <sphereGeometry args={[repo.scale, 64, 64]} />
          <shaderMaterial
            vertexShader={planetVertexShader}
            fragmentShader={planetFragmentShader}
            uniforms={uniforms}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
        
        <PlanetAtmosphere 
          scale={repo.scale} 
          color={repo.languageColor} 
          intensity={hovered || isSelected ? 0.8 : 0.5}
        />
        
        <mesh ref={glowRef} scale={1.15}>
          <sphereGeometry args={[repo.scale, 32, 32]} />
          <meshBasicMaterial
            color={repo.languageColor}
            transparent
            opacity={hovered || isSelected ? 0.25 : 0.1}
            side={THREE.BackSide}
          />
        </mesh>
        
        {repo.hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[repo.scale * 1.5, repo.scale * 2.2, 128]} />
            <shaderMaterial
              vertexShader={ringVertexShader}
              fragmentShader={ringFragmentShader}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
        
        <OrbitParticles
          repo={repo}
          particles={particles}
          isVisible={!isOtherSelected}
        />
        
        {repo.moonCount > 0 && (
          <group>
            {[...Array(Math.min(repo.moonCount, 3))].map((_, i) => (
              <Moon key={i} index={i} planetScale={repo.scale} orbitSpeed={0.02 + i * 0.01} />
            ))}
          </group>
        )}
        
        {(hovered || isSelected) && (
          <Html
            position={[0, repo.scale + 1.5, 0]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              border: `1px solid ${repo.languageColor}60`,
              borderRadius: '12px',
              padding: '12px 16px',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(20px)',
              transform: 'translateY(-30px)',
              boxShadow: `0 0 30px ${repo.languageColor}30`,
            }}>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                background: `linear-gradient(90deg, ${repo.languageColor}, ${repo.languageColor}aa)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 0 20px ${repo.languageColor}50`,
              }}>
                {repo.name}
              </div>
              {repo.language && (
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '6px',
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: repo.languageColor,
                    boxShadow: `0 0 10px ${repo.languageColor}`,
                  }} />
                  {repo.language}
                </div>
              )}
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

function Moon({ index, planetScale, orbitSpeed }) {
  const moonRef = useRef()
  const orbitRadius = planetScale * (2.5 + index * 0.8)
  const orbitPhase = (index / 3) * Math.PI * 2
  
  useFrame((state) => {
    if (!moonRef.current) return
    const time = state.clock.elapsedTime
    moonRef.current.position.x = Math.cos(time * orbitSpeed * 10 + orbitPhase) * orbitRadius
    moonRef.current.position.z = Math.sin(time * orbitSpeed * 10 + orbitPhase) * orbitRadius
  })
  
  return (
    <mesh ref={moonRef}>
      <sphereGeometry args={[planetScale * 0.12, 16, 16]} />
      <meshStandardMaterial 
        color="#999999" 
        roughness={0.7}
        metalness={0.3}
      />
    </mesh>
  )
}
