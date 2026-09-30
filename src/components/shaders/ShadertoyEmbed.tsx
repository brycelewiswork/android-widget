import { useEffect, useRef, type CSSProperties } from "react"

type Props = {
  /** Shadertoy-style fragment shader source. Provide either `mainImage(out vec4 fragColor, in vec2 fragCoord)` (Shadertoy syntax) or a standard `void main()`. */
  fs: string
  className?: string
  style?: CSSProperties
}

const VERTEX_SHADER = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const SHADERTOY_PRELUDE = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform int iFrame;
`

const SHADERTOY_EPILOGUE = `void main() {
  vec4 c = vec4(0.0, 0.0, 0.0, 1.0);
  mainImage(c, gl_FragCoord.xy);
  gl_FragColor = c;
}`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, source)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("[ShadertoyEmbed] shader compile error:", gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function ShadertoyEmbed({ fs, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false })
    if (!gl) return

    const isShadertoy = /mainImage\s*\(/.test(fs)
    const fragSource = isShadertoy
      ? `${SHADERTOY_PRELUDE}\n${fs}\n${SHADERTOY_EPILOGUE}`
      : `${SHADERTOY_PRELUDE}\n${fs}`

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fsh = compileShader(gl, gl.FRAGMENT_SHADER, fragSource)
    if (!vs || !fsh) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fsh)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[ShadertoyEmbed] link error:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, "iTime")
    const uRes = gl.getUniformLocation(program, "iResolution")
    const uMouse = gl.getUniformLocation(program, "iMouse")
    const uFrame = gl.getUniformLocation(program, "iFrame")

    const start = performance.now()
    let frame = 0
    let raf = 0
    const mouse: [number, number] = [0, 0]

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse[0] = (e.clientX - rect.left) * (canvas.width / rect.width)
      mouse[1] = (rect.height - (e.clientY - rect.top)) * (canvas.height / rect.height)
    }
    canvas.addEventListener("pointermove", onMove)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const render = () => {
      const t = (performance.now() - start) / 1000
      gl.uniform1f(uTime, t)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse[0], mouse[1])
      gl.uniform1i(uFrame, frame++)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener("pointermove", onMove)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fsh)
      gl.deleteBuffer(buffer)
    }
  }, [fs])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  )
}
