import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../store/useStore'

export function ScalableLODSystem({ repos = [] }) {
  const { camera } = useThree()
  const groupRef = useRef()
  const meshRefs = useRef([])
  
  const frustum = useMemo(() => new THREE.Frustum(), [])
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), [])
  
  useFrame(() => {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(projScreenMatrix)
    
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh || !repos[index]) return
      
      const pos = new THREE.Vector3(...repos[index].position)
      const distance = camera.position.distanceTo(pos)
      
      const inFrustum = frustum.containsPoint(pos)
      
      let detailLevel = 3
      if (distance > 300 || !inFrustum) {
        detailLevel = 0
        mesh.visible = false
      } else if (distance > 150) {
        detailLevel = 1
      } else if (distance > 80) {
        detailLevel = 2
      }
      
      const targetScale = repos[index].scale * (detailLevel / 3)
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
      
      mesh.visible = distance < 300 && inFrustum
    })
  })
  
  return <group ref={groupRef} />
}

export function GPUInstancedPlanets({ repos = [] }) {
  const instancedMeshRef = useRef()
  
  if (repos.length === 0) return null
  
  const { matrices, colors } = useMemo(() => {
    const matrices = []
    const colors = []
    
    repos.forEach((repo) => {
      const matrix = new THREE.Matrix4()
      matrix.setPosition(...repo.position)
      matrix.scale(new THREE.Vector3(repo.scale, repo.scale, repo.scale))
      matrices.push(matrix)
      
      const color = new THREE.Color(repo.languageColor)
      colors.push(color.r, color.g, color.b)
    })
    
    return { matrices, colors }
  }, [repos])
  
  return null
}

export function AdaptiveQuality() {
  const { gl } = useThree()
  const frameTimeRef = useRef(0)
  
  useFrame((state, delta) => {
    frameTimeRef.current += delta
    
    if (frameTimeRef.current > 1) {
      const fps = 1 / delta
      
      if (fps < 30) {
        gl.setPixelRatio(Math.max(0.5, gl.getPixelRatio() - 0.2))
      } else if (fps > 55) {
        gl.setPixelRatio(Math.min(2, gl.getPixelRatio() + 0.1))
      }
      
      frameTimeRef.current = 0
    }
  })
  
  return null
}

export function CullingOptimizer() {
  return null
}

export function PerformanceOptimizer() {
  const { gl } = useThree()
  const [performanceMode] = useState('high')
  
  useEffect(() => {
    window.setPerformanceMode = (mode) => {
      switch (mode) {
        case 'ultra':
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          break
        case 'high':
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
          break
        case 'medium':
          gl.setPixelRatio(1)
          break
        case 'low':
          gl.setPixelRatio(0.75)
          break
        default:
          break
      }
    }
    
    return () => {
      delete window.setPerformanceMode
    }
  }, [gl, performanceMode])
  
  return null
}

export function WebGLMemoryManager() {
  const { gl } = useThree()
  
  useEffect(() => {
    const memory = gl.info.memory
    console.log('WebGL Memory:', {
      geometries: memory.geometries,
      textures: memory.textures,
      programs: memory.programs
    })
    
    return () => {
      gl.clear()
    }
  }, [gl])
  
  return null
}

export default ScalableLODSystem