import React, { useEffect, useRef } from 'react';
import { flowingWavesShader, vertexShader } from './shaders';

function App() {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animationRef = useRef(null);

  // WebGL helper functions
  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // Initialize WebGL
  const initWebGL = (canvas) => {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    // Create vertex shader
    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShader);
    if (!vShader) return null;

    // Create fragment shader
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, flowingWavesShader);
    if (!fShader) return null;

    // Create program
    const program = createProgram(gl, vShader, fShader);
    if (!program) return null;

    // Set up geometry (full screen quad)
    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      1, 1,
    ]);

    const textureCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    // Create and bind position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Create and bind texture coordinate buffer
    const textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

    const textureLocation = gl.getAttribLocation(program, 'aTextureCoord');
    gl.enableVertexAttribArray(textureLocation);
    gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 0, 0);

    return { gl, program };
  };

  // Render frame
  const render = (gl, program, time) => {
    if (!gl || !program) return;

    const canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Set uniforms
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iMouseLocation = gl.getUniformLocation(program, 'iMouse');
    const hasActiveRemindersLocation = gl.getUniformLocation(program, 'hasActiveReminders');
    const hasUpcomingRemindersLocation = gl.getUniformLocation(program, 'hasUpcomingReminders');
    const disableCenterDimmingLocation = gl.getUniformLocation(program, 'disableCenterDimming');

    gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(iTimeLocation, time * 0.001);
    gl.uniform2f(iMouseLocation, 0.0, 0.0);
    gl.uniform1i(hasActiveRemindersLocation, false);
    gl.uniform1i(hasUpcomingRemindersLocation, false);
    gl.uniform1i(disableCenterDimmingLocation, false);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Main WebGL setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const webglContext = initWebGL(canvas);
    if (!webglContext) return;

    const { gl, program } = webglContext;
    glRef.current = gl;
    programRef.current = program;

    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now() - startTime;
      render(gl, program, currentTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      {/* Background WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Left Bottom Video */}
      <video
        className="fixed bottom-4 left-4 object-cover rounded-lg opacity-80"
        style={{ zIndex: 5, width: '192px', height: '192px' }}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
      >
        <source src="/pixar_3D.mp4" type="video/mp4" />
      </video>

      {/* Right Bottom Video */}
      <video
        className="fixed bottom-4 right-4 object-cover rounded-lg opacity-80"
        style={{ zIndex: 5, width: '192px', height: '192px' }}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
      >
        <source src="/pixar_3D_R.mp4" type="video/mp4" />
      </video>

      {/* Main Clock Circle - Center */}
      <div className="relative flex flex-col items-center justify-center fixed inset-0" style={{ zIndex: 10 }}>
        <div className="relative w-full h-full opacity-100">
          <div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10"
            style={{ width: '481.67px', height: '481.67px' }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center rounded-full bg-black/20 backdrop-blur-lg border border-white/10 cursor-pointer hover:bg-black/30 transition-colors duration-300">
              <div className="text-center">
                <div className="text-5xl font-bold tracking-wider mb-3 text-white" style={{ opacity: 0.9 }}>
                  tracks.io
                </div>
                <div className="text-lg opacity-60 tracking-wide text-white/60">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;