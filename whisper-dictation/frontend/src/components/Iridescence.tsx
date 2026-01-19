import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

import './Iridescence.css';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

// Optimized fragment shader with reduced iterations
const fragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  
  // Reduced from 8 to 5 iterations for better performance
  for (float i = 0.0; i < 5.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
  [key: string]: any;
}

// Target ~30 FPS for smoother experience without taxing the GPU
const TARGET_FPS = 30;
const FRAME_DURATION = 1000 / TARGET_FPS;

// Mouse throttle interval in ms
const MOUSE_THROTTLE = 50;

export default function Iridescence({ 
  color = [1, 1, 1], 
  speed = 1.0, 
  amplitude = 0.1, 
  mouseReact = true, 
  ...rest 
}: IridescenceProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    
    // Use lower pixel ratio for better performance
    const renderer = new Renderer({ 
      dpr: Math.min(window.devicePixelRatio, 1.5),
      antialias: false,
      powerPreference: 'low-power'
    });
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    let program: any;

    function resize() {
      // Render at 50% resolution for better performance
      const scale = 0.5;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      
      // Scale canvas back up via CSS
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }
    
    // Debounced resize handler
    let resizeTimeout: number;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 100);
    }
    
    window.addEventListener('resize', handleResize, false);
    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height)
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;
    let lastFrameTime = 0;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      
      // FPS limiter - skip frame if too soon
      const elapsed = t - lastFrameTime;
      if (elapsed < FRAME_DURATION) return;
      lastFrameTime = t - (elapsed % FRAME_DURATION);
      
      // Smooth mouse interpolation (lerp)
      const lerpFactor = 0.1;
      mousePos.current.x += (targetMousePos.current.x - mousePos.current.x) * lerpFactor;
      mousePos.current.y += (targetMousePos.current.y - mousePos.current.y) * lerpFactor;
      program.uniforms.uMouse.value[0] = mousePos.current.x;
      program.uniforms.uMouse.value[1] = mousePos.current.y;
      
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    // Throttled mouse handler
    let lastMouseUpdate = 0;
    function handleMouseMove(e: MouseEvent) {
      const now = performance.now();
      if (now - lastMouseUpdate < MOUSE_THROTTLE) return;
      lastMouseUpdate = now;
      
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
    }
    
    if (mouseReact) {
      ctn.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animateId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      if (mouseReact) {
        ctn.removeEventListener('mousemove', handleMouseMove);
      }
      if (gl.canvas.parentNode) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact]);

  return <div ref={ctnDom} className="iridescence-container" {...rest} />;
}
