import { useMemo } from 'react'
import { Effect } from 'postprocessing'
import * as THREE from 'three'

const cinematicColorGradingFragmentShader = `
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uBrightness;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uTime;
  uniform vec3 uShadows;
  uniform vec3 uMidtones;
  uniform vec3 uHighlights;
  
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }
  
  vec3 adjustSaturation(vec3 color, float saturation) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(vec3(gray), color, saturation);
  }
  
  vec3 adjustTone(vec3 color, vec3 shadows, vec3 midtones, vec3 highlights) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 shadowMix = color * shadows;
    vec3 midtoneMix = color * midtones;
    vec3 highlightMix = color * highlights;
    return mix(mix(shadowMix, midtoneMix, smoothstep(0.0, 0.5, luminance)),
               highlightMix, smoothstep(0.5, 1.0, luminance));
  }
  
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 color = inputColor.rgb;
    
    color = adjustContrast(color, uContrast);
    color = adjustSaturation(color, uSaturation);
    color *= uBrightness;
    color = adjustTone(color, uShadows, uMidtones, uHighlights);
    
    float dist = length(uv - 0.5);
    float vignette = 1.0 - smoothstep(0.3, 0.9, dist) * uVignette;
    color *= vignette;
    
    float grain = random(uv + fract(uTime)) * uGrain;
    color += grain - uGrain * 0.5;
    
    color = clamp(color, 0.0, 1.0);
    
    outputColor = vec4(color, inputColor.a);
  }
`

class CinematicColorGradingEffect extends Effect {
  constructor({
    contrast = 1.1,
    saturation = 1.15,
    brightness = 1.0,
    vignette = 0.4,
    grain = 0.03,
    shadows = [0.9, 0.95, 1.1],
    midtones = [1.0, 1.0, 1.0],
    highlights = [1.1, 1.05, 0.95]
  } = {}) {
    super('CinematicColorGradingEffect', cinematicColorGradingFragmentShader, {
      uniforms: new Map([
        ['uContrast', new THREE.Uniform(contrast)],
        ['uSaturation', new THREE.Uniform(saturation)],
        ['uBrightness', new THREE.Uniform(brightness)],
        ['uVignette', new THREE.Uniform(vignette)],
        ['uGrain', new THREE.Uniform(grain)],
        ['uTime', new THREE.Uniform(0)],
        ['uShadows', new THREE.Uniform(new THREE.Vector3(...shadows))],
        ['uMidtones', new THREE.Uniform(new THREE.Vector3(...midtones))],
        ['uHighlights', new THREE.Uniform(new THREE.Vector3(...highlights))]
      ])
    })
  }
  
  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('uTime').value += deltaTime
  }
}

export function CinematicColorGrading({
  contrast = 1.1,
  saturation = 1.15,
  brightness = 1.0,
  vignette = 0.4,
  grain = 0.03
} = {}) {
  const effect = useMemo(() => 
    new CinematicColorGradingEffect({
      contrast,
      saturation,
      brightness,
      vignette,
      grain
    }), 
  [contrast, saturation, brightness, vignette, grain])
  
  return <primitive object={effect} />
}

export default CinematicColorGrading