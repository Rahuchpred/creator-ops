"use client";

import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Slow domain-warped noise mixed through three stops of the brand blue, with
// a fixed film grain on top so the surface never reads as a flat fill.
const FRAGMENT = `
precision mediump float;
uniform vec2 u_size;
uniform float u_time;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  vec2 p = uv * vec2(u_size.x / u_size.y, 1.0) * 1.5;
  float t = u_time * 0.05;
  vec2 warp = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  float n = fbm(p + 2.2 * warp);

  vec3 deep = vec3(0.118, 0.235, 0.486);
  vec3 base = vec3(0.208, 0.431, 0.847);
  vec3 light = vec3(0.561, 0.714, 0.980);

  vec3 color = mix(deep, base, smoothstep(0.15, 0.6, n));
  color = mix(color, light, smoothstep(0.5, 0.95, n + 0.3 * uv.y * uv.x));
  color += (hash(gl_FragCoord.xy) - 0.5) * 0.04;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export function BlueField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false });
    if (!canvas || !gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const size = gl.getUniformLocation(program, "u_size");
    const time = gl.getUniformLocation(program, "u_time");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let onScreen = true;

    // The drift is slow, so every other frame is skipped: 30 a second looks
    // the same as 60 at half the cost. Nothing is drawn while the hero is
    // scrolled out of view.
    const draw = (now: number) => {
      if (!still.matches && onScreen) frame = requestAnimationFrame(draw);
      if (now - last < 30) return;
      last = now;
      gl.uniform2f(size, canvas.width, canvas.height);
      gl.uniform1f(time, now / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.style.opacity = "1";
    };

    // Draws the next frame for certain, then carries on if it should.
    const restart = () => {
      cancelAnimationFrame(frame);
      last = 0;
      frame = requestAnimationFrame(draw);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      restart();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) restart();
    });
    watcher.observe(canvas);
    still.addEventListener("change", restart);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      watcher.disconnect();
      still.removeEventListener("change", restart);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`opacity-0 transition-opacity duration-500 ease-out ${className ?? ""}`}
      />
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0" />
    </>
  );
}
