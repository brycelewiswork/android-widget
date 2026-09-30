import { useState } from "react"
import {
  MeshGradient,
  PulsingBorder,
  SmokeRing,
  DotGrid,
  DotOrbit,
  GrainGradient,
  Waves,
  LiquidMetal,
  Metaballs,
  Warp,
  Spiral,
  NeuroNoise,
} from "@paper-design/shaders-react"
import { shaderMaterial } from "@react-three/drei"
import { extend, useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import * as THREE from "three"
import { useRef } from "react"

import { ShaderTile, R3FCanvas, ShadertoyEmbed, type Control } from "@/components/shaders"
import { DemoSection } from "@/components/DemoSection"
import { PageShell, PageHeader, SectionCard } from "@/components/PageLayout"
import { Squircle, SQUIRCLE_RADIUS } from "@/components/squircle"
import { Badge } from "@/components/ui/badge"
import { IconSparkles, IconArrowRight } from "@tabler/icons-react"

// ─── Tier 1: Paper Shaders catalog ─────────────────────────────────────────
// Each entry is a self-contained tile: defines its shader, initial values,
// and the schema that drives ShaderControls. Add a new tile by appending one.

type PaperEntry = {
  title: string
  caption: string
  initial: Record<string, unknown>
  schema: Control[]
  render: (vals: Record<string, unknown>) => React.ReactNode
}

const STYLE_FILL: React.CSSProperties = { width: "100%", height: "100%" }

const PAPER_CATALOG: PaperEntry[] = [
  {
    title: "MeshGradient",
    caption: "Flowing colored spots with organic distortion",
    initial: { distortion: 0.8, swirl: 0.4, speed: 0.4, color1: "#ff3ea5", color2: "#5b6bff", color3: "#1a1a2e" },
    schema: [
      { type: "slider", key: "distortion", label: "distortion", min: 0, max: 1 },
      { type: "slider", key: "swirl", label: "swirl", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 2 },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "color3", label: "color 3" },
    ],
    render: (v) => (
      <MeshGradient
        style={STYLE_FILL}
        colors={[v.color1 as string, v.color2 as string, v.color3 as string]}
        distortion={v.distortion as number}
        swirl={v.swirl as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "PulsingBorder",
    caption: "Luminous glowing contour — the aurora ring",
    initial: {
      thickness: 0.18,
      softness: 0.6,
      bloom: 0.9,
      spots: 4,
      pulse: 0.4,
      smoke: 0.6,
      colorBack: "#0a0014",
      color1: "#ff36c5",
      color2: "#a52bff",
    },
    schema: [
      { type: "slider", key: "thickness", label: "thickness", min: 0, max: 0.5 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "slider", key: "bloom", label: "bloom", min: 0, max: 1 },
      { type: "slider", key: "spots", label: "spots", min: 1, max: 10, step: 1 },
      { type: "slider", key: "pulse", label: "pulse", min: 0, max: 1 },
      { type: "slider", key: "smoke", label: "smoke", min: 0, max: 1 },
      { type: "color", key: "colorBack", label: "background" },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
    ],
    render: (v) => (
      <PulsingBorder
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colors={[v.color1 as string, v.color2 as string]}
        thickness={v.thickness as number}
        softness={v.softness as number}
        bloom={v.bloom as number}
        spots={v.spots as number}
        pulse={v.pulse as number}
        smoke={v.smoke as number}
      />
    ),
  },
  {
    title: "SmokeRing",
    caption: "Radial gradient layered with noise",
    initial: { thickness: 0.4, radius: 0.5, noiseScale: 1.4, speed: 0.6, color1: "#a04bff", color2: "#ff58c6", colorBack: "#0d0820" },
    schema: [
      { type: "slider", key: "thickness", label: "thickness", min: 0.01, max: 1 },
      { type: "slider", key: "radius", label: "radius", min: 0, max: 1 },
      { type: "slider", key: "noiseScale", label: "noise scale", min: 0.01, max: 5 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 2 },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <SmokeRing
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colors={[v.color1 as string, v.color2 as string]}
        thickness={v.thickness as number}
        radius={v.radius as number}
        noiseScale={v.noiseScale as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "DotGrid",
    caption: "Static patterned grid of shapes",
    initial: { dotSize: 4, gapX: 28, gapY: 28, shape: "circle", sizeRange: 0, opacityRange: 0, colorFill: "#ffffff", colorBack: "#0a0a14" },
    schema: [
      { type: "slider", key: "dotSize", label: "dot size", min: 1, max: 40, step: 1 },
      { type: "slider", key: "gapX", label: "gap x", min: 2, max: 100, step: 1 },
      { type: "slider", key: "gapY", label: "gap y", min: 2, max: 100, step: 1 },
      { type: "select", key: "shape", label: "shape", options: [
        { label: "circle", value: "circle" },
        { label: "diamond", value: "diamond" },
        { label: "square", value: "square" },
        { label: "triangle", value: "triangle" },
      ] },
      { type: "slider", key: "sizeRange", label: "size jitter", min: 0, max: 1 },
      { type: "slider", key: "opacityRange", label: "opacity jitter", min: 0, max: 1 },
      { type: "color", key: "colorFill", label: "fill" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <DotGrid
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colorFill={v.colorFill as string}
        size={v.dotSize as number}
        gapX={v.gapX as number}
        gapY={v.gapY as number}
        shape={v.shape as "circle" | "diamond" | "square" | "triangle"}
        sizeRange={v.sizeRange as number}
        opacityRange={v.opacityRange as number}
      />
    ),
  },
  {
    title: "DotOrbit",
    caption: "Dots that orbit their cell centers",
    initial: { size: 0.35, sizeRange: 0.4, spreading: 0.5, speed: 0.8, color1: "#ff58c6", color2: "#5cd5ff", colorBack: "#0a0014" },
    schema: [
      { type: "slider", key: "size", label: "dot size", min: 0, max: 1 },
      { type: "slider", key: "sizeRange", label: "size jitter", min: 0, max: 1 },
      { type: "slider", key: "spreading", label: "orbit radius", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 3 },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <DotOrbit
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colors={[v.color1 as string, v.color2 as string]}
        size={v.size as number}
        sizeRange={v.sizeRange as number}
        spreading={v.spreading as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "GrainGradient",
    caption: "Grainy noisy multi-color blob",
    initial: { intensity: 0.5, noise: 0.4, softness: 0.6, shape: "blob", speed: 0.4, color1: "#ff3ea5", color2: "#5b6bff", colorBack: "#06061a" },
    schema: [
      { type: "slider", key: "intensity", label: "intensity", min: 0, max: 1 },
      { type: "slider", key: "noise", label: "grain", min: 0, max: 1 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 2 },
      { type: "select", key: "shape", label: "shape", options: [
        { label: "wave", value: "wave" },
        { label: "dots", value: "dots" },
        { label: "truchet", value: "truchet" },
        { label: "corners", value: "corners" },
        { label: "ripple", value: "ripple" },
        { label: "blob", value: "blob" },
        { label: "sphere", value: "sphere" },
      ] },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <GrainGradient
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colors={[v.color1 as string, v.color2 as string]}
        intensity={v.intensity as number}
        noise={v.noise as number}
        softness={v.softness as number}
        shape={v.shape as "wave" | "dots" | "truchet" | "corners" | "ripple" | "blob" | "sphere"}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "Waves",
    caption: "Wavy line pattern, zigzag → sine morph",
    initial: { shape: 1, amplitude: 0.3, frequency: 0.6, spacing: 0.8, softness: 0.5, colorFront: "#ff58c6", colorBack: "#0a0014" },
    schema: [
      { type: "slider", key: "shape", label: "shape", min: 0, max: 3 },
      { type: "slider", key: "amplitude", label: "amplitude", min: 0, max: 1 },
      { type: "slider", key: "frequency", label: "frequency", min: 0, max: 2 },
      { type: "slider", key: "spacing", label: "spacing", min: 0, max: 2 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "color", key: "colorFront", label: "front" },
      { type: "color", key: "colorBack", label: "back" },
    ],
    render: (v) => (
      <Waves
        style={STYLE_FILL}
        colorFront={v.colorFront as string}
        colorBack={v.colorBack as string}
        shape={v.shape as number}
        amplitude={v.amplitude as number}
        frequency={v.frequency as number}
        spacing={v.spacing as number}
        softness={v.softness as number}
      />
    ),
  },
  {
    title: "LiquidMetal",
    caption: "Chrome shimmer on a procedural shape",
    initial: { repetition: 4, softness: 0.5, distortion: 0.4, contour: 0.6, speed: 1, shape: "metaballs", colorBack: "#0a0014", colorTint: "#ff58c6" },
    schema: [
      { type: "slider", key: "repetition", label: "repetition", min: 1, max: 10, step: 1 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "slider", key: "distortion", label: "distortion", min: 0, max: 1 },
      { type: "slider", key: "contour", label: "contour", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 3 },
      { type: "select", key: "shape", label: "shape", options: [
        { label: "circle", value: "circle" },
        { label: "daisy", value: "daisy" },
        { label: "diamond", value: "diamond" },
        { label: "metaballs", value: "metaballs" },
      ] },
      { type: "color", key: "colorBack", label: "background" },
      { type: "color", key: "colorTint", label: "tint" },
    ],
    render: (v) => (
      <LiquidMetal
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colorTint={v.colorTint as string}
        repetition={v.repetition as number}
        softness={v.softness as number}
        distortion={v.distortion as number}
        contour={v.contour as number}
        speed={v.speed as number}
        shape={v.shape as "none" | "circle" | "diamond" | "daisy" | "metaballs"}
      />
    ),
  },
  {
    title: "Metaballs",
    caption: "Gooey merging organic shapes",
    initial: { count: 8, size: 0.7, speed: 1, color1: "#ff58c6", color2: "#5b6bff", color3: "#a04bff", colorBack: "#06061a" },
    schema: [
      { type: "slider", key: "count", label: "count", min: 1, max: 20, step: 1 },
      { type: "slider", key: "size", label: "size", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 3 },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "color3", label: "color 3" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <Metaballs
        style={STYLE_FILL}
        colorBack={v.colorBack as string}
        colors={[v.color1 as string, v.color2 as string, v.color3 as string]}
        count={v.count as number}
        size={v.size as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "Warp",
    caption: "Marbled fluid color fields",
    initial: { proportion: 0.5, softness: 0.6, distortion: 0.5, swirl: 0.4, shapeScale: 0.3, speed: 0.6, color1: "#ff3ea5", color2: "#5b6bff", color3: "#06061a" },
    schema: [
      { type: "slider", key: "proportion", label: "proportion", min: 0, max: 1 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "slider", key: "distortion", label: "distortion", min: 0, max: 1 },
      { type: "slider", key: "swirl", label: "swirl", min: 0, max: 1 },
      { type: "slider", key: "shapeScale", label: "shape scale", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 2 },
      { type: "color", key: "color1", label: "color 1" },
      { type: "color", key: "color2", label: "color 2" },
      { type: "color", key: "color3", label: "color 3" },
    ],
    render: (v) => (
      <Warp
        style={STYLE_FILL}
        colors={[v.color1 as string, v.color2 as string, v.color3 as string]}
        proportion={v.proportion as number}
        softness={v.softness as number}
        distortion={v.distortion as number}
        swirl={v.swirl as number}
        shapeScale={v.shapeScale as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "Spiral",
    caption: "Animated spiral morphs between geometry and flow",
    initial: { density: 0.5, distortion: 0.3, strokeWidth: 0.4, softness: 0.5, speed: 0.5, colorFront: "#ff58c6", colorBack: "#06061a" },
    schema: [
      { type: "slider", key: "density", label: "density", min: 0, max: 1 },
      { type: "slider", key: "distortion", label: "distortion", min: 0, max: 1 },
      { type: "slider", key: "strokeWidth", label: "stroke width", min: 0, max: 1 },
      { type: "slider", key: "softness", label: "softness", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 3 },
      { type: "color", key: "colorFront", label: "stroke" },
      { type: "color", key: "colorBack", label: "background" },
    ],
    render: (v) => (
      <Spiral
        style={STYLE_FILL}
        colorFront={v.colorFront as string}
        colorBack={v.colorBack as string}
        density={v.density as number}
        distortion={v.distortion as number}
        strokeWidth={v.strokeWidth as number}
        softness={v.softness as number}
        speed={v.speed as number}
      />
    ),
  },
  {
    title: "NeuroNoise",
    caption: "Glowing web-like neural lines",
    initial: { brightness: 0.6, contrast: 0.5, speed: 0.6, colorFront: "#ffd6f7", colorMid: "#ff3ea5", colorBack: "#0a0014" },
    schema: [
      { type: "slider", key: "brightness", label: "brightness", min: 0, max: 1 },
      { type: "slider", key: "contrast", label: "contrast", min: 0, max: 1 },
      { type: "slider", key: "speed", label: "speed", min: 0, max: 3 },
      { type: "color", key: "colorFront", label: "front" },
      { type: "color", key: "colorMid", label: "mid" },
      { type: "color", key: "colorBack", label: "back" },
    ],
    render: (v) => (
      <NeuroNoise
        style={STYLE_FILL}
        colorFront={v.colorFront as string}
        colorMid={v.colorMid as string}
        colorBack={v.colorBack as string}
        brightness={v.brightness as number}
        contrast={v.contrast as number}
        speed={v.speed as number}
      />
    ),
  },
]

function PaperTile({ entry }: { entry: PaperEntry }) {
  const [vals, setVals] = useState<Record<string, unknown>>(entry.initial)
  return (
    <ShaderTile
      title={entry.title}
      caption={entry.caption}
      schema={entry.schema}
      values={vals}
      onChange={setVals}
      height={220}
      render={() => entry.render(vals)}
    />
  )
}

// ─── Tier 2: Shadertoy bridge ─────────────────────────────────────────────

const STARFIELD_FS = `
float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 starLayer(vec2 uv, float t, float density, vec3 tint) {
  vec2 cell = floor(uv);
  vec2 f = fract(uv);
  vec3 col = vec3(0.0);
  float r = hash21(cell);
  if (r > 1.0 - density) {
    vec2 c = vec2(hash21(cell + 1.7), hash21(cell + 2.9));
    float twinkle = 0.5 + 0.5 * sin(t * (1.0 + r * 3.0) + r * 6.28);
    float d = length(f - c);
    float s = smoothstep(0.18, 0.0, d) * twinkle;
    col += s * tint;
  }
  return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float scale = 12.0 + fi * 8.0;
    vec2 drift = vec2(iTime * (0.04 + fi * 0.02), iTime * 0.01);
    vec3 tint = mix(vec3(0.7, 0.6, 1.0), vec3(1.0, 0.6, 0.95), fi / 2.0);
    col += starLayer(uv * scale + drift, iTime + fi * 4.0, 0.06 + fi * 0.02, tint);
  }
  col += vec3(0.04, 0.02, 0.08);
  fragColor = vec4(col, 1.0);
}
`

const PLASMA_FS = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / iResolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= iResolution.x / iResolution.y;
  float t = iTime * 0.4;
  float v = sin(p.x * 4.0 + t)
          + sin(p.y * 4.0 + t * 1.3)
          + sin((p.x + p.y) * 4.0 + t * 0.7)
          + sin(length(p) * 6.0 - t * 2.0);
  v = v * 0.25;
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + v));
  col = pow(col, vec3(1.2));
  fragColor = vec4(col, 1.0);
}
`

// ─── Tier 3: Custom GLSL via R3F shaderMaterial ───────────────────────────

const AnimatedGradientMaterial = shaderMaterial(
  { uTime: 0, uColorA: new THREE.Color("#ff3ea5"), uColorB: new THREE.Color("#5b6bff") },
  // vertex
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  /* glsl */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float d = length(p) - 0.6 + 0.1 * sin(uTime * 1.2 + atan(p.y, p.x) * 5.0);
      float ring = smoothstep(0.4, 0.0, abs(d));
      vec3 col = mix(uColorB * 0.1, uColorA, ring);
      col += 0.4 * exp(-8.0 * abs(d)) * uColorA;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
)
extend({ AnimatedGradientMaterial })

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      animatedGradientMaterial: object
    }
  }
}

function AnimatedQuad() {
  const ref = useRef<THREE.ShaderMaterial>(null)
  useFrame((_, dt) => {
    if (ref.current) (ref.current as unknown as { uTime: number }).uTime += dt
  })
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {/* @ts-expect-error custom shader material extended onto JSX */}
      <animatedGradientMaterial ref={ref} />
    </mesh>
  )
}

function SpinningTorus({ color = "#ff58c6" }: { color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.4
      ref.current.rotation.y += dt * 0.6
    }
  })
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.9, 0.28, 200, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.3} metalness={0.4} />
    </mesh>
  )
}

// ─── Tier 4: Postprocessing chain ─────────────────────────────────────────

function PostFXScene({
  bloom,
  chromatic,
  vignette,
  noise,
}: { bloom: number; chromatic: number; vignette: number; noise: number }) {
  return (
    <>
      <color attach="background" args={["#06061a"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} color="#ff58c6" intensity={20} />
      <pointLight position={[-3, -2, 2]} color="#5b6bff" intensity={15} />
      <SpinningTorus />
      <EffectComposer>
        <Bloom intensity={bloom} luminanceThreshold={0.1} luminanceSmoothing={0.6} mipmapBlur />
        <ChromaticAberration offset={[chromatic, chromatic]} blendFunction={BlendFunction.NORMAL} radialModulation={false} modulationOffset={0} />
        <Vignette eskil={false} offset={0.2} darkness={vignette} />
        <Noise opacity={noise} premultiply blendFunction={BlendFunction.SCREEN} />
      </EffectComposer>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function ShadersPage() {
  const [stoyA, setStoyA] = useState({ speed: 0.4 })
  const [stoyB, setStoyB] = useState({ speed: 0.4 })

  const [postFX, setPostFX] = useState({ bloom: 1.6, chromatic: 0.002, vignette: 0.6, noise: 0.15 })
  const postFXSchema: Control[] = [
    { type: "slider", key: "bloom", label: "bloom", min: 0, max: 4 },
    { type: "slider", key: "chromatic", label: "chromatic", min: 0, max: 0.02, step: 0.0005 },
    { type: "slider", key: "vignette", label: "vignette", min: 0, max: 1.5 },
    { type: "slider", key: "noise", label: "grain", min: 0, max: 1 },
  ]

  return (
    <PageShell className="space-y-0! flex flex-col gap-stack-xl">
      <PageHeader
        title="Shaders"
        description="Five tiers of WebGL/canvas effects — from drop-in catalog to custom GLSL to WebGPU. Reach for whichever fits the moment."
      />

      {/* Tier decision tree */}
      <SectionCard className="space-y-stack-s">
        <div className="text-xs font-medium text-label-secondary">When to reach for what</div>
        <ol className="grid gap-gutter-2xs text-sm text-label sm:grid-cols-2">
          <li className="flex items-start gap-inline-xs">
            <Badge variant="secondary" className="font-mono shrink-0">1</Badge>
            <span><span className="font-medium">Paper Shaders</span> — does the catalog already have it? Drop in, set props, done.</span>
          </li>
          <li className="flex items-start gap-inline-xs">
            <Badge variant="secondary" className="font-mono shrink-0">2</Badge>
            <span><span className="font-medium">Shadertoy paste</span> — copy a fragment shader from shadertoy.com and run it as-is.</span>
          </li>
          <li className="flex items-start gap-inline-xs">
            <Badge variant="secondary" className="font-mono shrink-0">3</Badge>
            <span><span className="font-medium">R3F + shaderMaterial</span> — write custom GLSL with uniforms and full 3D scene access.</span>
          </li>
          <li className="flex items-start gap-inline-xs">
            <Badge variant="secondary" className="font-mono shrink-0">4</Badge>
            <span><span className="font-medium">Postprocessing chain</span> — bloom, chromatic aberration, vignette, noise on any R3F scene.</span>
          </li>
          <li className="flex items-start gap-inline-xs">
            <Badge variant="secondary" className="font-mono shrink-0">5</Badge>
            <span><span className="font-medium">use-shader-fx / TSL</span> — advanced FX hooks and WebGPU-capable node shaders.</span>
          </li>
        </ol>
      </SectionCard>

      {/* ── Tier 1 ── */}
      <DemoSection
        title="Paper Shaders catalog"
        lib="@paper-design/shaders-react"
        version="0.0"
        docsUrl="https://shaders.paper.design/"
      >
        <p className="text-sm text-label-secondary">
          Zero-dependency canvas shaders. Each tile is a single React component with live, prop-bound controls.
        </p>
        <div className="grid grid-cols-1 gap-gutter-m sm:grid-cols-2 lg:grid-cols-3">
          {PAPER_CATALOG.map((entry) => (
            <PaperTile key={entry.title} entry={entry} />
          ))}
        </div>
      </DemoSection>

      {/* ── Tier 2 ── */}
      <DemoSection
        title="Shadertoy bridge"
        lib="custom WebGL runner"
        version="in-tree"
        docsUrl="https://www.shadertoy.com/"
      >
        <p className="text-sm text-label-secondary">
          Paste any Shadertoy GLSL into the <code className="font-mono text-xs">fs</code> prop on <code className="font-mono text-xs">&lt;ShadertoyEmbed&gt;</code>. A tiny in-tree runner ({" "}
          <code className="font-mono text-xs">components/shaders/ShadertoyEmbed.tsx</code>) wires up <code className="font-mono text-xs">iTime</code>, <code className="font-mono text-xs">iResolution</code>, <code className="font-mono text-xs">iMouse</code>, and <code className="font-mono text-xs">iFrame</code>.
        </p>
        <div className="grid grid-cols-1 gap-gutter-m sm:grid-cols-2">
          <ShaderTile
            title="Drifting starfield"
            caption="Layered 3D value noise"
            schema={[{ type: "slider", key: "speed", label: "speed", min: 0, max: 2 }]}
            values={stoyA}
            onChange={setStoyA}
            render={() => <ShadertoyEmbed fs={STARFIELD_FS} />}
          />
          <ShaderTile
            title="Classic plasma"
            caption="Trigonometric color field"
            schema={[{ type: "slider", key: "speed", label: "speed", min: 0, max: 2 }]}
            values={stoyB}
            onChange={setStoyB}
            render={() => <ShadertoyEmbed fs={PLASMA_FS} />}
          />
        </div>
      </DemoSection>

      {/* ── Tier 3 ── */}
      <DemoSection
        title="Custom GLSL via R3F"
        lib="@react-three/drei · shaderMaterial"
        version="10.7"
        docsUrl="https://drei.docs.pmnd.rs/shaders/shader-material"
      >
        <p className="text-sm text-label-secondary">
          Define a shader material with typed uniforms once, then use it like any three.js material. Animate uniforms inside <code className="font-mono text-xs">useFrame</code>.
        </p>
        <div className="grid grid-cols-1 gap-gutter-m sm:grid-cols-2">
          <ShaderTile
            title="Animated radial shader"
            caption="Custom fragment on a fullscreen quad"
            render={() => (
              <R3FCanvas camera={{ position: [0, 0, 1] }} orthographic>
                <AnimatedQuad />
              </R3FCanvas>
            )}
          />
          <ShaderTile
            title="Lit 3D mesh"
            caption="meshStandardMaterial + scene lights"
            render={() => (
              <R3FCanvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <pointLight position={[3, 3, 3]} color="#ff58c6" intensity={20} />
                <pointLight position={[-3, -2, 2]} color="#5b6bff" intensity={15} />
                <SpinningTorus />
              </R3FCanvas>
            )}
          />
        </div>
      </DemoSection>

      {/* ── Tier 4 ── */}
      <DemoSection
        title="Postprocessing chain"
        lib="@react-three/postprocessing"
        version="3.0"
        docsUrl="https://react-postprocessing.docs.pmnd.rs"
      >
        <p className="text-sm text-label-secondary">
          Stack effects in an <code className="font-mono text-xs">&lt;EffectComposer&gt;</code>. The chain renders bottom-to-top.
        </p>
        <div className="grid grid-cols-1 gap-gutter-m">
          <ShaderTile
            title="Bloom · chromatic · vignette · grain"
            caption="Live-tuned PostFX over a spinning torus knot"
            schema={postFXSchema}
            values={postFX}
            onChange={setPostFX}
            height={320}
            render={() => (
              <R3FCanvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <PostFXScene {...postFX} />
              </R3FCanvas>
            )}
          />
        </div>
      </DemoSection>

      {/* ── Tier 5 — graduation paths ── */}
      <DemoSection
        title="Advanced — use-shader-fx + TSL"
        lib="@funtech-inc/use-shader-fx · three/tsl"
        version="2.0 · r184"
        docsUrl="https://github.com/FunTechInc/use-shader-fx"
      >
        <p className="text-sm text-label-secondary">
          When you outgrow the tiers above, two more roads are open. Both are installed and ready.
        </p>
        <div className="grid grid-cols-1 gap-gutter-s sm:grid-cols-2">
          <Squircle
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.xl}
            className="rounded-xl bg-surface inset-ring-1 inset-ring-stroke-faint p-inset-s space-y-stack-xs"
          >
            <div className="flex items-center gap-inline-2xs">
              <IconSparkles size={16} stroke={2} className="text-label-secondary" />
              <span className="text-sm font-medium text-label">use-shader-fx</span>
            </div>
            <p className="text-[13px] text-label-secondary">
              Pre-built fluid sims, noise textures, FBO blending, and morph particles as React hooks.
              Each hook returns <code className="font-mono text-[11px]">[update, setParams, texture]</code> ready to wire into any material's uniforms.
            </p>
            <pre className="overflow-x-auto rounded-md bg-fill-quaternary p-inset-xs text-[11px] font-mono text-label">
{`const [updateFluid, setFluid, fluidTex] = useFluid({ size: 512, dpr: 1 })
useFrame(({ gl, scene, camera }) => {
  const tex = updateFluid(gl)
  materialRef.current.uniforms.uMap.value = tex
})`}
            </pre>
          </Squircle>

          <Squircle
            as="div"
            cornerRadius={SQUIRCLE_RADIUS.xl}
            className="rounded-xl bg-surface inset-ring-1 inset-ring-stroke-faint p-inset-s space-y-stack-xs"
          >
            <div className="flex items-center gap-inline-2xs">
              <IconArrowRight size={16} stroke={2} className="text-label-secondary" />
              <span className="text-sm font-medium text-label">TSL — three.js shading language</span>
            </div>
            <p className="text-[13px] text-label-secondary">
              Write node-graph shaders in TypeScript that compile to both WebGL <em>and</em> WebGPU. Stable in three r184. Renderer-agnostic, automatic optimization.
            </p>
            <pre className="overflow-x-auto rounded-md bg-fill-quaternary p-inset-xs text-[11px] font-mono text-label">
{`import { mix, time, uv, vec3 } from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'

const mat = new MeshBasicNodeMaterial()
mat.colorNode = mix(
  vec3(1, 0.3, 0.7),
  vec3(0.3, 0.4, 1),
  uv().x.add(time.mul(0.2))
)`}
            </pre>
          </Squircle>
        </div>
      </DemoSection>
    </PageShell>
  )
}
