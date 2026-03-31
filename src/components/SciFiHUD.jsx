import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/useStore'

const hudVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const hudFragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  
  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    
    float scan = sin(vUv.y * 50.0 + uTime * 5.0) * 0.5 + 0.5;
    float grid = step(0.98, fract(vUv.x * 20.0)) + step(0.98, fract(vUv.y * 20.0));
    
    float alpha = (1.0 - dist * 1.5) * uOpacity;
    alpha *= 0.7 + scan * 0.2 + grid * 0.3;
    
    vec3 color = uColor;
    color += vec3(1.0) * scan * 0.2;
    
    gl_FragColor = vec4(color, alpha * 0.6);
  }
`

export function SciFiHUD({ active = true }) {
  const { selectedRepo, repositories } = useStore()
  const [scanLine, setScanLine] = useState(0)
  
  useFrame((state) => {
    setScanLine((state.clock.elapsedTime * 0.5) % 1)
  })
  
  if (!active) return null
  
  return (
    <group>
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}>
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="hudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#06ffa5" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            <rect x="20" y="20" width="200" height="120" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.5" />
            <rect x="25" y="25" width="190" height="110" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" />
            
            <line x1="20" y1="20" x2="60" y2="20" stroke="#00d4ff" strokeWidth="2" />
            <line x1="20" y1="20" x2="20" y2="60" stroke="#00d4ff" strokeWidth="2" />
            
            <line x1={220} y1={20} x2={250} y2={20} stroke="#00d4ff" strokeWidth="1" />
            <line x1={20} y1={140} x2={20} y2={160} stroke="#00d4ff" strokeWidth="1" />
            
            <text x="40" y="50" fill="#00d4ff" fontSize="12" fontFamily="monospace">SYSTEM STATUS</text>
            <text x="40" y="70" fill="#06ffa5" fontSize="10" fontFamily="monospace">Online</text>
            <text x="40" y="90" fill="#ffffff" fontSize="10" fontFamily="monospace">FPS: 60</text>
            <text x="40" y="105" fill="#ffffff" fontSize="10" fontFamily="monospace">Objects: {repositories.length}</text>
            
            <rect x="20" y="200" width="250" height="150" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
            <text x="40" y="225" fill="#a855f7" fontSize="12" fontFamily="monospace">TARGET DATA</text>
            
            {selectedRepo && (
              <>
                <text x="40" y="250" fill="#ffffff" fontSize="11" fontFamily="monospace">ID: {selectedRepo.id}</text>
                <text x="40" y="270" fill="#00d4ff" fontSize="11" fontFamily="monospace">Name: {selectedRepo.name}</text>
                <text x="40" y="290" fill="#06ffa5" fontSize="10" fontFamily="monospace">Stars: {selectedRepo.stars}</text>
                <text x="40" y="305" fill="#ffffff" fontSize="10" fontFamily="monospace">Lang: {selectedRepo.language || 'Unknown'}</text>
              </>
            )}
            
            {!selectedRepo && (
              <text x="40" y="270" fill="#666666" fontSize="11" fontFamily="monospace">No target selected</text>
            )}
            
            <rect x={window.innerWidth - 220} y={20} width="200" height="100" fill="none" stroke="#06ffa5" strokeWidth="1" opacity="0.5" />
            <text x={window.innerWidth - 200} y="45" fill="#06ffa5" fontSize="12" fontFamily="monospace">NAVIGATION</text>
            <text x={window.innerWidth - 200} y="65" fill="#ffffff" fontSize="10" fontFamily="monospace">Mode: Orbit</text>
            <text x={window.innerWidth - 200} y="80" fill="#ffffff" fontSize="10" fontFamily="monospace">Zoom: 1.0x</text>
            <text x={window.innerWidth - 200} y="95" fill="#00d4ff" fontSize="10" fontFamily="monospace">Auto-Tour: OFF</text>
            
            <line 
              x1="0" 
              y1={scanLine * window.innerHeight} 
              x2={window.innerWidth} 
              y2={scanLine * window.innerHeight} 
              stroke="#00d4ff" 
              strokeWidth="1" 
              opacity="0.3"
              strokeDasharray="5,5"
            />
            
            <circle cx={window.innerWidth / 2} cy={window.innerHeight / 2} r="150" fill="none" stroke="#00d4ff" strokeWidth="0.5" opacity="0.2" strokeDasharray="10,10" />
            <circle cx={window.innerWidth / 2} cy={window.innerHeight / 2} r="250" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.15" strokeDasharray="20,20" />
            
            <line x1={window.innerWidth / 2 - 160} y1={window.innerHeight / 2} x2={window.innerWidth / 2 - 140} y2={window.innerHeight / 2} stroke="#00d4ff" strokeWidth="1" />
            <line x1={window.innerWidth / 2 + 140} y1={window.innerHeight / 2} x2={window.innerWidth / 2 + 160} y2={window.innerHeight / 2} stroke="#00d4ff" strokeWidth="1" />
            <line x1={window.innerWidth / 2} y1={window.innerHeight / 2 - 160} x2={window.innerWidth / 2} y2={window.innerHeight / 2 - 140} stroke="#00d4ff" strokeWidth="1" />
            <line x1={window.innerWidth / 2} y1={window.innerHeight / 2 + 140} x2={window.innerWidth / 2} y2={window.innerHeight / 2 + 160} stroke="#00d4ff" strokeWidth="1" />
            
            <text x={window.innerWidth / 2 - 170} y={window.innerHeight / 2 + 5} fill="#00d4ff" fontSize="8" fontFamily="monospace">-X</text>
            <text x={window.innerWidth / 2 + 160} y={window.innerHeight / 2 + 5} fill="#00d4ff" fontSize="8" fontFamily="monospace">+X</text>
            <text x={window.innerWidth / 2 + 5} y={window.innerHeight / 2 - 145} fill="#00d4ff" fontSize="8" fontFamily="monospace">+Y</text>
            <text x={window.innerWidth / 2 + 5} y={window.innerHeight / 2 + 165} fill="#00d4ff" fontSize="8" fontFamily="monospace">-Y</text>
          </svg>
        </div>
      </Html>
    </group>
  )
}

export function TargetReticle({ target, active = true }) {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current && active) {
      groupRef.current.rotation.z += 0.02
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      groupRef.current.scale.setScalar(scale)
    }
  })
  
  if (!active || !target) return null
  
  const positions = [
    [0, 0.5, 0],
    [0.35, 0.35, 0],
    [0.5, 0, 0],
    [0.35, -0.35, 0],
    [0, -0.5, 0],
    [-0.35, -0.35, 0],
    [-0.5, 0, 0],
    [-0.35, 0.35, 0]
  ]
  
  return (
    <group ref={groupRef} position={target}>
      {positions.map((pos, i) => (
        <Line
          key={i}
          points={[
            pos,
            positions[(i + 1) % positions.length]
          ]}
          color="#00d4ff"
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      ))}
      <mesh>
        <ringGeometry args={[0.6, 0.65, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function DataPanel({ position, data, title }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position)
    }
  })
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <planeGeometry args={[3, 2]} />
        <shaderMaterial
          vertexShader={hudVertexShader}
          fragmentShader={hudFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#00d4ff') },
            uOpacity: { value: 0.7 }
          }}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html position={[0, 0.8, 0.1]} center>
        <div style={{
          background: 'rgba(0, 20, 40, 0.9)',
          border: '1px solid #00d4ff',
          borderRadius: '4px',
          padding: '8px 16px',
          color: '#00d4ff',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ color: '#fff', fontSize: '10px' }}>
              {key}: {value}
            </div>
          ))}
        </div>
      </Html>
    </group>
  )
}

export function CoordinateGrid({ size = 100, divisions = 20 }) {
  const gridRef = useRef()
  
  const lines = useMemo(() => {
    const result = []
    const step = size / divisions
    const half = size / 2
    
    for (let i = 0; i <= divisions; i++) {
      const pos = -half + i * step
      result.push([[pos, 0, -half], [pos, 0, half]])
      result.push([[-half, 0, pos], [half, 0, pos]])
    }
    return result
  }, [size, divisions])
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <group position={[0, -15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#00d4ff"
          lineWidth={0.5}
          transparent
          opacity={0.1}
        />
      ))}
    </group>
  )
}

export function LoadingBar({ progress = 0 }) {
  return (
    <Html center>
      <div style={{
        width: '300px',
        background: 'rgba(0, 20, 40, 0.8)',
        border: '1px solid #00d4ff',
        borderRadius: '4px',
        padding: '16px',
        fontFamily: 'monospace'
      }}>
        <div style={{ color: '#00d4ff', fontSize: '12px', marginBottom: '8px' }}>INITIALIZING SYSTEMS</div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0, 212, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #06ffa5)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ color: '#666', fontSize: '10px', marginTop: '8px' }}>
          {Math.round(progress * 100)}%
        </div>
      </div>
    </Html>
  )
}

export default SciFiHUD