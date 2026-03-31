import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../store/useStore'

export function HolographicProjection({ position, target, data, title }) {
  const groupRef = useRef()
  const [scanProgress, setScanProgress] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  
  useEffect(() => {
    if (target) {
      setIsScanning(true)
      setScanProgress(0)
      
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 1) {
            setIsScanning(false)
            clearInterval(interval)
            return 1
          }
          return prev + 0.02
        })
      }, 30)
      
      return () => clearInterval(interval)
    }
  }, [target])
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.lookAt(state.camera.position)
      groupRef.current.rotation.z += 0.005
    }
  })
  
  if (!target) return null
  
  const points = useRef([])
  
  useEffect(() => {
    if (data && data.length > 0) {
      points.current = data.map((d, i) => {
        const angle = (i / data.length) * Math.PI * 2
        return [
          Math.cos(angle) * 2,
          (d.value || 0) * 0.5,
          Math.sin(angle) * 2
        ]
      })
    }
  }, [data])
  
  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <ringGeometry args={[2, 2.1, 64]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 2, 64]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.1 * scanProgress}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <Line
          key={i}
          points={[
            [Math.cos(angle * Math.PI / 180) * 2, 0, Math.sin(angle * Math.PI / 180) * 2],
            [Math.cos(angle * Math.PI / 180) * 2, scanProgress * 2, Math.sin(angle * Math.PI / 180) * 2]
          ]}
          color="#00d4ff"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
      
      {points.current.length > 0 && (
        <Line
          points={points.current}
          color="#06ffa5"
          lineWidth={2}
          transparent
          opacity={scanProgress}
        />
      )}
      
      <Html position={[0, 2.5, 0]} center>
        <div style={{
          background: 'rgba(0, 20, 40, 0.9)',
          border: '1px solid #00d4ff',
          borderRadius: '4px',
          padding: '12px 20px',
          minWidth: '150px',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: '#00d4ff', 
            fontFamily: 'monospace', 
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            {title || 'ANALYSIS'}
          </div>
          {isScanning && (
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 212, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${scanProgress * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00d4ff, #06ffa5)',
                transition: 'width 0.1s ease'
              }} />
            </div>
          )}
          {!isScanning && (
            <div style={{ color: '#06ffa5', fontSize: '10px', fontFamily: 'monospace' }}>
              COMPLETE
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

export function ScanningBeam({ target, color = '#00d4ff' }) {
  const beamRef = useRef()
  const [scanLine, setScanLine] = useState(0)
  
  useFrame((state) => {
    setScanLine((state.clock.elapsedTime * 0.5) % 1)
    
    if (beamRef.current) {
      beamRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 10) * 0.1
    }
  })
  
  if (!target) return null
  
  return (
    <group position={target}>
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.02, 0.02, 20, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight position={[0, 10, 0]} intensity={0.5} color={color} distance={15} />
    </group>
  )
}

export function TargetLock({ target, color = '#ff6b6b' }) {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.03
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15
      groupRef.current.scale.setScalar(scale)
    }
  })
  
  if (!target) return null
  
  const lockPoints = [
    [0, 1.5],
    [0.3, 1.2],
    [1.5, 1.5],
    [1.2, 1.8],
    [1.5, 3],
    [1.2, 3.3],
    [0, 3],
    [-1.2, 3.3],
    [-1.5, 3],
    [-1.2, 1.8],
    [-1.5, 1.5],
    [-0.3, 1.2]
  ]
  
  return (
    <group ref={groupRef} position={target}>
      <Line
        points={lockPoints.map(p => [p[0], p[1], 0])}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.9}
      />
      <mesh>
        <ringGeometry args={[1.6, 1.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh>
        <ringGeometry args={[3.2, 3.3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

export function ThreatIndicator({ position, level = 'low', label }) {
  const colors = {
    low: '#06ffa5',
    medium: '#ffa500',
    high: '#ff6b6b',
    critical: '#ff0000'
  }
  
  const blinkSpeed = level === 'critical' ? 10 : level === 'high' ? 5 : level === 'medium' ? 2 : 1
  
  useFrame((state) => {
    const blink = Math.sin(state.clock.elapsedTime * blinkSpeed) > 0
  })
  
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.3, 0.6, 4]} />
        <meshBasicMaterial color={colors[level]} transparent opacity={0.8} />
      </mesh>
      <Html position={[0, 1, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid ${colors[level]}`,
          borderRadius: '2px',
          padding: '4px 8px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: colors[level],
          whiteSpace: 'nowrap'
        }}>
          {label || level.toUpperCase()}
        </div>
      </Html>
    </group>
  )
}

export function DataGraph({ position, data = [], width = 3, height = 2 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1) - 0.5) * width
    const y = (d.value - 0.5) * height
    return [x, y, 0]
  })
  
  return (
    <group position={position}>
      <Line
        points={[[-width/2, 0, 0], [width/2, 0, 0]]}
        color="#00d4ff"
        lineWidth={0.5}
        transparent
        opacity={0.3}
      />
      <Line
        points={points}
        color="#06ffa5"
        lineWidth={2}
      />
      {data.map((d, i) => (
        <mesh key={i} position={[points[i][0], points[i][1], 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
      ))}
    </group>
  )
}

export function WarpEffect({ active = false, onComplete }) {
  const groupRef = useRef()
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    if (active) {
      setProgress(0)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            clearInterval(interval)
            onComplete?.()
            return 1
          }
          return prev + 0.01
        })
      }, 20)
      
      return () => clearInterval(interval)
    }
  }, [active, onComplete])
  
  useFrame((state) => {
    if (groupRef.current && active) {
      groupRef.current.rotation.z += 0.5
      const scale = 1 + progress * 10
      groupRef.current.scale.setScalar(scale)
    }
  })
  
  if (!active) return null
  
  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[1, 0.3, 16, 64]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={1 - progress}
        />
      </mesh>
      {[0.5, 1, 1.5, 2].map((r, i) => (
        <mesh key={i} scale={1 + progress * 5}>
          <torusGeometry args={[r, 0.1, 16, 64]} />
          <meshBasicMaterial 
            color="#a855f7" 
            transparent 
            opacity={(1 - progress) * 0.5}
          />
        </mesh>
      ))}
    </group>
  )
}

export function ShieldBubble({ position, radius = 3, color = '#00d4ff' }) {
  const meshRef = useRef()
  const [impact, setImpact] = useState(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x += 0.005
      
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      meshRef.current.scale.setScalar(pulse)
    }
  })
  
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.1}
          wireframe
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 0.95, 32, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.05}
        />
      </mesh>
    </group>
  )
}

export function PortalVortex({ position, scale = 5, color1 = '#00d4ff', color2 = '#a855f7' }) {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.02
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })
  
  const rings = [0.2, 0.4, 0.6, 0.8, 1]
  
  return (
    <group ref={groupRef} position={position}>
      {rings.map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[scale * r, scale * 0.02, 16, 64]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? color1 : color2} 
            transparent 
            opacity={0.5 - i * 0.08}
          />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[scale * 0.3, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}