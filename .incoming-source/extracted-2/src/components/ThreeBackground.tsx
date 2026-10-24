import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 700;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 240;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Floating Particles Constellation
    const particleCount = 280;
    const positions = new Float32Array(particleCount * 3);
    const velocities: { x: number; y: number; z: number }[] = [];
    const colors = new Float32Array(particleCount * 3);

    const colorLight = new THREE.Color('#eeeeee');
    const colorMid = new THREE.Color('#aaaaaa');
    const colorWhite = new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 450;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 350;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      velocities.push({
        x: (Math.random() - 0.5) * 0.22,
        y: (Math.random() - 0.5) * 0.22,
        z: (Math.random() - 0.5) * 0.15,
      });

      const mixed = Math.random() < 0.5 ? colorLight : Math.random() < 0.8 ? colorMid : colorWhite;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom circle texture for soft glowing points
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(220, 220, 220, 0.6)');
      gradient.addColorStop(0.8, 'rgba(160, 160, 160, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Connecting Lines (Constellation Mesh)
    const maxConnections = particleCount * 4;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    // 6. Floating Abstract 3D Geometric Nodes (Icosahedron & Torus wireframes)
    const ringGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(85, 0.8, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    ringGroup.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(120, 0.6, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.10,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    ringGroup.add(ringMesh2);

    ringGroup.position.set(130, -10, -50);
    scene.add(ringGroup);

    // 7. Mouse tracking with smooth lerp
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = x * 35;
      mouse.targetY = y * 25;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 8. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 700;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;
      camera.position.x = mouse.x;
      camera.position.y = mouse.y;
      camera.lookAt(0, 0, 0);

      // Rotate geometric rings
      ringMesh1.rotation.z += 0.003;
      ringMesh2.rotation.x += 0.002;
      ringGroup.rotation.y = elapsedTime * 0.08;

      // Update particle positions
      const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      let lineVertexIndex = 0;
      let lineCount = 0;
      const connectionDist = 58;

      for (let i = 0; i < particleCount; i++) {
        // Move particle
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 1] += velocities[i].y;
        posArray[i * 3 + 2] += velocities[i].z;

        // Bounce back within bounds
        if (posArray[i * 3] < -220 || posArray[i * 3] > 220) velocities[i].x *= -1;
        if (posArray[i * 3 + 1] < -170 || posArray[i * 3 + 1] > 170) velocities[i].y *= -1;
        if (posArray[i * 3 + 2] < -100 || posArray[i * 3 + 2] > 100) velocities[i].z *= -1;

        // Check distance with others for constellation lines
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDist && lineCount < maxConnections) {
            const alpha = 1.0 - dist / connectionDist;

            // Point A
            linePositions[lineVertexIndex * 3] = posArray[i * 3];
            linePositions[lineVertexIndex * 3 + 1] = posArray[i * 3 + 1];
            linePositions[lineVertexIndex * 3 + 2] = posArray[i * 3 + 2];

            lineColors[lineVertexIndex * 3] = 0.85 * alpha;
            lineColors[lineVertexIndex * 3 + 1] = 0.85 * alpha;
            lineColors[lineVertexIndex * 3 + 2] = 0.85 * alpha;
            lineVertexIndex++;

            // Point B
            linePositions[lineVertexIndex * 3] = posArray[j * 3];
            linePositions[lineVertexIndex * 3 + 1] = posArray[j * 3 + 1];
            linePositions[lineVertexIndex * 3 + 2] = posArray[j * 3 + 2];

            lineColors[lineVertexIndex * 3] = 0.65 * alpha;
            lineColors[lineVertexIndex * 3 + 1] = 0.65 * alpha;
            lineColors[lineVertexIndex * 3 + 2] = 0.65 * alpha;
            lineVertexIndex++;

            lineCount++;
          }
        }
      }

      posAttr.needsUpdate = true;

      // Update lines
      lineGeometry.setDrawRange(0, lineCount * 2);
      (lineGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (lineGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        maskImage: 'radial-gradient(circle at 60% 45%, black 40%, transparent 95%)',
        WebkitMaskImage: 'radial-gradient(circle at 60% 45%, black 40%, transparent 95%)',
      }}
    />
  );
}

export default ThreeBackground;
