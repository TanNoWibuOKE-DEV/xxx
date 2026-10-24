import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Terminal, Play, Cpu, Shield, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PromptPreset {
  id: string;
  name: string;
  badge: string;
  color: string;
  coreHex: number;
  prompt: string;
  metrics: {
    speed: string;
    stack: string;
    security: string;
    scalability: string;
  };
  logs: string[];
}

const PRESETS: PromptPreset[] = [
  {
    id: 'ai-agent',
    name: 'AI Agent & LLM Pipeline',
    badge: 'PROMPT / 01',
    color: '#eeeeee',
    coreHex: 0xeeeeee,
    prompt: 'Thiết kế hệ thống Autonomous AI Agent tự động hoá phân tích dữ liệu, tích hợp RAG pipeline & xác thực bảo mật đa tầng.',
    metrics: { speed: '< 180ms', stack: 'Python / LangChain / Node.js', security: 'Token Auth + AES-256', scalability: 'Elastic Cluster' },
    logs: [
      '>> Khởi tạo Vector Database & Semantic Embedding...',
      '>> Tối ưu bộ nhớ ngữ cảnh Agent Memory & Token Window...',
      '>> Kết nối API Gateway & Xác thực kiểm duyệt nội dung an toàn...',
      '>> Hoàn tất: Tác vụ Agent xử lý song song đạt độ chính xác 99.4%.'
    ]
  },
  {
    id: 'high-scale',
    name: 'High-Load Microservice',
    badge: 'PROMPT / 02',
    color: '#c9c9c9',
    coreHex: 0xc9c9c9,
    prompt: 'Kiến trúc hệ thống backend phân tán chịu tải 50,000+ CCU, đồng bộ Realtime WebSocket & tối ưu hóa MariaDB connection pool.',
    metrics: { speed: '< 12ms RTT', stack: 'Node.js / MariaDB / Redis / Docker', security: 'Rate Limit + WAF', scalability: 'Horizontal Auto-Scale' },
    logs: [
      '>> Thiết lập Redis Pub/Sub cluster phân tán & Cache Invalidation...',
      '>> Tối ưu truy vấn CSDL MariaDB: Index tuning & Connection Pool...',
      '>> Triển khai Non-blocking Worker Threads & BullMQ Queue...',
      '>> Đạt chuẩn: Throughput 12,500 req/sec với tỷ lệ lỗi 0.00%.'
    ]
  },
  {
    id: 'webgl-3d',
    name: '3D WebGL & Interactive UI',
    badge: 'PROMPT / 03',
    color: '#ffffff',
    coreHex: 0xffffff,
    prompt: 'Xây dựng trải nghiệm website 3D tương tác với Three.js, đổ bóng thực tế, hiệu ứng holographic phản chiếu ánh sáng ở 60 FPS mượt mà.',
    metrics: { speed: '60 FPS Lock', stack: 'Three.js / React / GLSL Shaders', security: 'Client-side Safe', scalability: 'GPU Accelerated' },
    logs: [
      '>> Biên dịch Custom Vertex & Fragment Shaders trong WebGL context...',
      '>> Tối ưu hoá BufferGeometry, InstancedMesh & Draw Calls < 15...',
      '>> Ánh xạ phản xạ môi trường vật lý (PBR) & Ambient Occlusion...',
      '>> Sẵn sàng: Trải nghiệm 3D hoạt động mượt mà trên cả Mobile & Desktop.'
    ]
  },
  {
    id: 'commercial-web',
    name: 'Fullstack Thương mại điện tử',
    badge: 'PROMPT / 04',
    color: '#d4d4d4',
    coreHex: 0xd4d4d4,
    prompt: 'Nền tảng thanh toán tự động VietQR, quản lý đơn hàng thời gian thực, tích hợp phân quyền đa cấp & điểm SEO 98+.',
    metrics: { speed: '99+ Lighthouse', stack: 'React 19 / TypeScript / Vite / Express', security: 'PCI-DSS Compliance', scalability: 'CDN Edge Delivery' },
    logs: [
      '>> Tích hợp cổng thanh toán mã động VietQR tự đối soát sao kê...',
      '>> Tối ưu Core Web Vitals (LCP < 0.8s, CLS = 0, FID < 20ms)...',
      '>> Bàn giao 100% mã nguồn sạch, typed TypeScript an toàn tuyệt đối...',
      '>> Sẵn sàng bàn giao: Đã tích hợp trang quản trị Admin và Client Space.'
    ]
  }
];

export function ThreePromptLab() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<PromptPreset>(PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(PRESETS[0].prompt);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeLogIndex, setActiveLogIndex] = useState<number>(3);
  const [coreSpeed, setCoreSpeed] = useState<number>(1);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const ringGroupRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Handle Preset Switching
  const handleSelectPreset = (preset: PromptPreset) => {
    setActivePreset(preset);
    setCustomPrompt(preset.prompt);
    setActiveLogIndex(3);
    setCoreSpeed(2.5);
    setTimeout(() => setCoreSpeed(1), 1200);

    if (coreMeshRef.current && (coreMeshRef.current.material as THREE.MeshStandardMaterial)) {
      const mat = coreMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(preset.coreHex);
      mat.emissive.setHex(preset.coreHex);
    }
    if (pointLightRef.current) {
      pointLightRef.current.color.setHex(preset.coreHex);
    }
  };

  // Run Prompt Simulation
  const handleRunSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveLogIndex(0);
    setCoreSpeed(4.5);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setActiveLogIndex(step);
      if (step >= activePreset.logs.length - 1) {
        clearInterval(interval);
        setIsRunning(false);
        setCoreSpeed(1.2);
      }
    }, 600);
  };

  // Three.js Canvas Mount
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 110);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(activePreset.coreHex, 3, 200);
    pointLight.position.set(0, 0, 30);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // 1. Central Quantum Core (Icosahedron with wireframe outer)
    const coreGroup = new THREE.Group();

    // Solid inner core
    const coreGeo = new THREE.IcosahedronGeometry(22, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: activePreset.coreHex,
      emissive: activePreset.coreHex,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);
    coreMeshRef.current = coreMesh;

    // Wireframe cage surrounding core
    const cageGeo = new THREE.IcosahedronGeometry(27, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // 2. Concentric Astrolabe Rings
    const ringGroup = new THREE.Group();
    ringGroupRef.current = ringGroup;

    const ring1Geo = new THREE.TorusGeometry(38, 0.7, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, wireframe: true, transparent: true, opacity: 0.35 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ringGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(46, 0.6, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, wireframe: true, transparent: true, opacity: 0.25 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.5;
    ringGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(53, 0.5, 16, 120);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, transparent: true, opacity: 0.2 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3;
    ringGroup.add(ring3);

    coreGroup.add(ringGroup);

    // 3. Orbiting Neural Particles
    const partCount = 180;
    const partPositions = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const radius = 30 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      partPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      partPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      partPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xe0e7ff,
      size: 2.2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const partPoints = new THREE.Points(partGeo, partMat);
    particlesRef.current = partPoints;
    coreGroup.add(partPoints);

    scene.add(coreGroup);

    // Interactive Drag to Rotate
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      coreGroup.rotation.y += deltaX * 0.01;
      coreGroup.rotation.x += deltaY * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Continuous rotation modulated by coreSpeed
      coreMesh.rotation.y += delta * 0.6 * coreSpeed;
      coreMesh.rotation.x += delta * 0.4 * coreSpeed;
      cageMesh.rotation.y -= delta * 0.5 * coreSpeed;
      cageMesh.rotation.z += delta * 0.3 * coreSpeed;

      ring1.rotation.z += delta * 0.8 * coreSpeed;
      ring2.rotation.x += delta * 0.6 * coreSpeed;
      ring3.rotation.y -= delta * 0.9 * coreSpeed;

      partPoints.rotation.y += delta * 0.25 * coreSpeed;
      partPoints.rotation.x -= delta * 0.15 * coreSpeed;

      // Pulse scale
      const time = clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 2.5 * coreSpeed) * 0.04;
      coreMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      coreGeo.dispose();
      coreMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      partGeo.dispose();
      partMat.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [coreSpeed]);

  return (
    <div className="three-prompt-lab-container" style={{ position: 'relative', marginTop: 40, marginBottom: 40 }}>
      {/* Background Aura */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          background: `radial-gradient(ellipse at 35% 50%, ${activePreset.color}15 0%, transparent 65%)`,
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }}
      />

      <div
        style={{
          position: 'relative',
          borderRadius: 2,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          overflow: 'hidden',
          padding: '32px 28px',
          boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border-strong)', display: 'grid', placeItems: 'center', color: 'var(--text)' }}>
              <Cpu size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: 'var(--sans)' }}>THREE.JS PROMPT LAB & ARCHITECTURE ENGINE</b>
                <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 2, background: 'var(--surface2)', color: 'var(--soft)', border: '1px solid var(--border-strong)', fontFamily: 'var(--mono)' }}>
                  LIVE 3D SIMULATOR
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                Khám phá năng lực lập trình và kiến trúc hệ thống thương mại qua mô phỏng tương tác thời gian thực
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-live)' }} />
              WEBGL 2.0
            </span>
            <span style={{ color: 'var(--border-strong)' }}>|</span>
            <span>60 FPS LOCKED</span>
          </div>
        </div>

        {/* Preset Tabs Selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {PRESETS.map((p) => {
            const isSelected = p.id === activePreset.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 2,
                  border: isSelected ? '1px solid var(--text)' : '1px solid var(--border-strong)',
                  background: isSelected ? 'var(--surface3)' : 'var(--surface2)',
                  color: isSelected ? '#ffffff' : 'var(--muted)',
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--sans)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? '#ffffff' : 'var(--border-strong)' }} />
                <span>{p.name}</span>
                <small style={{ fontSize: 9.5, opacity: 0.7, fontFamily: 'var(--mono)' }}>{p.badge}</small>
              </button>
            );
          })}
        </div>

        {/* Main Grid: 3D Core Canvas on Left, Interactive Console on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: 24, alignItems: 'center' }}>
          {/* Left Column: 3D Canvas with drag hint */}
          <div
            style={{
              position: 'relative',
              height: 380,
              borderRadius: 2,
              background: '#0d0d0d',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
            }}
          >
            <div ref={canvasContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Orbit Drag Instruction Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 10px',
                borderRadius: 2,
                background: 'rgba(18, 18, 18, 0.85)',
                border: '1px solid var(--border-strong)',
                backdropFilter: 'blur(8px)',
                fontSize: 10,
                color: 'var(--soft)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--mono)',
              }}
            >
              <RefreshCw size={11} className={isRunning ? 'animate-spin' : ''} />
              Kéo chuột để xoay 3D lõi hạt nhân ({activePreset.name})
            </div>

            {/* Status Corner */}
            <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--soft)' }}>
              ● CORE ACTIVITY: {isRunning ? 'SIMULATING (4.5x)' : 'IDLE'}
            </div>
          </div>

          {/* Right Column: Prompt Control & Live Telemetry Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Prompt Input Box */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 2,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal size={13} style={{ color: 'var(--text)' }} />
                  ARCHITECTURE PROMPT INPUT
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text)', fontWeight: 600, fontFamily: 'var(--mono)' }}>
                  {activePreset.badge}
                </span>
              </div>

              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text)',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
                placeholder="Nhập yêu cầu bài toán hoặc thử nghiệm prompt kiến trúc..."
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setCustomPrompt(activePreset.prompt)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'var(--mono)',
                    }}
                  >
                    <RefreshCw size={11} /> Đặt lại mẫu
                  </button>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 2,
                    background: isRunning ? 'var(--surface3)' : 'var(--inv)',
                    color: isRunning ? 'var(--muted)' : 'var(--inv-ink)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s ease',
                    boxShadow: isRunning ? 'none' : '0 0 0 2px var(--surface), 0 0 0 3px var(--border-strong)',
                  }}
                >
                  <Play size={13} fill={isRunning ? 'none' : 'currentColor'} />
                  {isRunning ? 'Đang thực thi mô phỏng...' : 'KÍCH HOẠT PROMPT 3D'}
                </button>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div style={{ padding: '8px 10px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>TỐC ĐỘ XỬ LÝ</div>
                <b style={{ fontSize: 12.5, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{activePreset.metrics.speed}</b>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>CÔNG NGHỆ LÕI</div>
                <b style={{ fontSize: 11, color: 'var(--text)' }}>{activePreset.metrics.stack.split('/')[0]}</b>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>BẢO MẬT</div>
                <b style={{ fontSize: 11, color: 'var(--text)' }}>{activePreset.metrics.security.split('+')[0]}</b>
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 2, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>MỞ RỘNG</div>
                <b style={{ fontSize: 11, color: 'var(--text)' }}>{activePreset.metrics.scalability}</b>
              </div>
            </div>

            {/* Simulated Live Console Log */}
            <div
              style={{
                borderRadius: 2,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: '12px 14px',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                lineHeight: 1.8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 10, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span>ENGINEERING EXECUTION LOG</span>
                <span style={{ color: 'var(--accent-live)' }}>STATUS: 200 OK</span>
              </div>
              {activePreset.logs.map((log, idx) => {
                const isPassed = idx <= activeLogIndex;
                const isCurrent = idx === activeLogIndex && isRunning;
                return (
                  <div
                    key={idx}
                    style={{
                      color: isCurrent ? '#ffffff' : isPassed ? 'var(--soft)' : 'var(--dim)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      opacity: isPassed ? 1 : 0.4,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span style={{ color: isPassed ? 'var(--accent-live)' : 'var(--dim)', fontSize: 10 }}>
                      {isPassed ? '✔' : '○'}
                    </span>
                    <span>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreePromptLab;
