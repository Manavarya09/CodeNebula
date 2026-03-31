import { useRef, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { Effect } from 'postprocessing'
import * as THREE from 'three'

const gravitationalLensingFragmentShader = `
  uniform float uStrength;
  uniform float uRadius;
  uniform vec2 uCenter;
  uniform float uTime;
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 centered = uv - uCenter;
    float dist = length(centered);
    
    float lensEffect = smoothstep(uRadius, 0.0, dist) * uStrength;
    
    vec2 offset = normalize(centered) * lensEffect * 0.1;
    offset += vec2(
      sin(dist * 20.0 - uTime * 2.0) * 0.002,
      cos(dist * 20.0 - uTime * 2.0) * 0.002
    ) * lensEffect;
    
    vec2 distortedUV = uv + offset;
    distortedUV = clamp(distortedUV, 0.0, 1.0);
    
    vec4 color = texture2D(inputBuffer, distortedUV);
    
    float chromaticStrength = lensEffect * 0.01;
    float r = texture2D(inputBuffer, distortedUV + vec2(chromaticStrength, 0.0)).r;
    float g = texture2D(inputBuffer, distortedUV).g;
    float b = texture2D(inputBuffer, distortedUV - vec2(chromaticStrength, 0.0)).b;
    
    color = vec4(r, g, b, 1.0);
    
    float glow = lensEffect * 0.1;
    color.rgb += vec3(0.2, 0.5, 1.0) * glow;
    
    outputColor = color;
  }
`

class GravitationalLensingEffect extends Effect {
  constructor({ strength = 0.5, radius = 0.3, center = [0.5, 0.5] } = {}) {
    super('GravitationalLensingEffect', gravitationalLensingFragmentShader, {
      uniforms: new Map([
        ['uStrength', new THREE.Uniform(strength)],
        ['uRadius', new THREE.Uniform(radius)],
        ['uCenter', new THREE.Uniform(new THREE.Vector2(...center))],
        ['uTime', new THREE.Uniform(0)]
      ])
    })
  }
  
  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('uTime').value += deltaTime
  }
}

export function GravitationalLensing({ strength = 0.5, radius = 0.3, center = [0.5, 0.5] }) {
  const effect = useMemo(() => new GravitationalLensingEffect({ strength, radius, center }), [])
  return <primitive object={effect} />
}

export default GravitationalLensing