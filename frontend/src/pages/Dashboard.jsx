import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const data = await api.getMeetings();
        setMeetings(data);
      } catch (err) {
        console.error("Failed to fetch meetings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  // WebGL Shader Animation Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float wave = sin(uv.x * 10.0 + u_time * 2.0) * 0.1;
    wave += sin(uv.x * 20.0 - u_time * 3.0) * 0.05;
    
    float mask = smoothstep(0.5 + wave, 0.51 + wave, uv.y) * smoothstep(0.6 + wave, 0.59 + wave, uv.y);
    
    vec3 color1 = vec3(0.427, 0.369, 0.969); // #6D5EF7
    vec3 color2 = vec3(0.0, 0.831, 1.0);     // #00D4FF
    vec3 finalColor = mix(color1, color2, uv.x);
    
    gl_FragColor = vec4(finalColor * mask, mask * 0.4);
}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    const vsShader = cs(gl.VERTEX_SHADER, vs);
    const fsShader = cs(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(prog, vsShader);
    gl.attachShader(prog, fsShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-xl">
      {/* Hero Section with Shader Background */}
      <section className="relative min-h-[420px] flex flex-col justify-center items-center text-center overflow-hidden rounded-3xl">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 w-full h-full opacity-60" style={{ display: 'block' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/80 to-surface"></div>
        </div>
        <div className="relative z-10 space-y-md px-md">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Your AI Meeting Copilot</h1>
          <p className="font-body-md text-on-surface-variant max-w-xs mx-auto">Real-time transcription and AI-driven insights for every conversation.</p>
          <div className="flex flex-col gap-sm pt-md w-full max-w-[280px] mx-auto">
            <Link 
              to="/meeting/new" 
              className="bg-gradient-to-r from-[#6D5EF7] to-[#00D4FF] text-white font-semibold py-md rounded-xl primary-glow active:scale-95 transition-transform flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              Start Meeting
            </Link>
            <button className="glass-card text-on-surface font-medium py-md rounded-xl active:scale-95 transition-transform">
              Upload Recording
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section (Bento style small) */}
      <section className="grid grid-cols-2 gap-sm">
        <div className="glass-card p-md rounded-2xl flex flex-col justify-between aspect-square">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <span className="text-label-md font-label-md text-on-surface-variant">PRODUCTIVITY</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-primary">84%</div>
            <div className="text-xs text-on-surface-variant">+12% from last week</div>
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <div className="glass-card p-sm rounded-2xl flex-1 flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">schedule</span>
            </div>
            <div>
              <div className="font-semibold text-sm">12h</div>
              <div className="text-[10px] uppercase text-on-surface-variant">Time in meetings</div>
            </div>
          </div>
          <div className="glass-card p-sm rounded-2xl flex-1 flex items-center gap-sm">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
            </div>
            <div>
              <div className="font-semibold text-sm">4h</div>
              <div className="text-[10px] uppercase text-on-surface-variant">AI Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Activity Feed */}
      <section className="space-y-sm">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-on-surface text-sm">AI Activity</h2>
          <span className="text-primary text-xs font-semibold">View Live</span>
        </div>
        <div className="glass-card p-md rounded-2xl border-l-4 border-l-primary-container relative overflow-hidden">
          <div className="flex items-start gap-md">
            <div className="ai-pulse bg-primary-container/20 p-sm rounded-full">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">AI generated 3 action items from <span class="text-primary">Sales Sync</span></p>
              <p className="text-xs text-on-surface-variant">2 minutes ago</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Meetings */}
      <section className="space-y-md">
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-on-surface text-sm">Recent Meetings</h2>
          <button className="text-on-surface-variant text-xs flex items-center gap-xs">
            View All <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
        <div className="space-y-sm">
          {loading ? (
            <div className="text-center p-8 text-on-surface-variant italic text-sm">Loading meetings...</div>
          ) : meetings.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl mb-2 block">video_call</span>
              <p className="text-sm">No meetings recorded yet.</p>
              <p className="text-xs text-on-surface-variant mt-1">Start a new meeting to generate transcription and insights.</p>
            </div>
          ) : (
            meetings.map((meeting, index) => (
              <div key={meeting.id} className="glass-card p-md rounded-2xl flex justify-between items-center hover:scale-[0.98] transition-transform duration-200">
                <Link to={`/meeting/${meeting.id}`} className="flex-1 space-y-1 pr-4">
                  <h3 className="font-semibold text-sm text-on-surface hover:text-primary transition-colors">{meeting.title}</h3>
                  <div className="flex items-center gap-sm">
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span> 
                      {new Date(meeting.start_time).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> 
                      {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </Link>
                <div className="flex -space-x-2">
                  <img 
                    className="w-6 h-6 rounded-full border-2 border-surface" 
                    src={index % 2 === 0 
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuD1qOAlpPApvAfWLupy6IgxK8o2TCH4xVbSgfNt9E_2osyqlXGrClmFIhXrFsFdtJLTJy_D6hhFtk4A7yx2wCA3FugBhwO8iFa1qmmVf3wNIf8k2fwffhZzFJGufhCSN8_7idq3RRgpDP6QiXu3jYTb-Xr04739TJFvyIUCzm16KO_Dw7S4fN_IbkA8bscdy2dt2MT2YgN-d5cIrFy4sT0cQjBuUmBI5Jj0-oyuNsUnayvdq61QFLv8oJQP6y7ET9yDcA0-V83EYQ" 
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuBscxtDQ7q4KRR87ZxSzJ8bGBciNQE5UE44Od-kbazwFtsBXJZJsgLNgZr9Zay5rQ7SNKWt6_wwd3T3-3eAN26LeBV0in5OvAy9hjTm3Spo7XP6fASXvRPOle3XfBlWcPtNzOw6FrlG4ktIp2Yjf-vLSd7X5g-CYOoMLkB0GHFqmbHxDUAA0eP8FGb6KG5QMVx9ifL6lfn7aKuEpRelSiflxlRMngG5lymBP3mIzsrYTgy7SVcnu7dEd4j-UZyaAlaIKFxi7eF-qg"
                    } 
                    alt="User Avatar" 
                  />
                  {index % 3 === 0 && (
                    <div className="w-6 h-6 rounded-full border-2 border-surface bg-surface-container-highest text-[8px] flex items-center justify-center font-bold text-on-surface">+3</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Action Items Badge Section */}
      <section className="flex gap-sm overflow-x-auto hide-scrollbar pb-md">
        <span className="px-md py-xs rounded-full glass-card border-primary/30 text-primary text-[10px] font-bold whitespace-nowrap">ACTION REQUIRED (4)</span>
        <span className="px-md py-xs rounded-full glass-card border-tertiary/30 text-tertiary text-[10px] font-bold whitespace-nowrap">DECISIONS (12)</span>
        <span className="px-md py-xs rounded-full glass-card border-secondary/30 text-secondary text-[10px] font-bold whitespace-nowrap">SENTIMENT: POSITIVE</span>
      </section>
    </div>
  );
}

