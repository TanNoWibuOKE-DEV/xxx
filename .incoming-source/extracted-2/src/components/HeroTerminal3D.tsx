import React, { useState, useRef } from 'react';
import { Check } from 'lucide-react';

export function HeroTerminal3D() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalized coordinates from -1 to 1 with safe clamping
    const xPct = Math.max(-1, Math.min(1, (mouseX / width - 0.5) * 2));
    const yPct = Math.max(-1, Math.min(1, (mouseY / height - 0.5) * 2));

    setCoords({ x: xPct, y: yPct });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    setCoords({ x: 0, y: 0 });
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  // 3D rotation angles
  // Resting: subtle isometric perspective (rotateX: 2deg, rotateY: -5deg)
  const rotateX = isHovered ? -coords.y * 11 : 2;
  const rotateY = isHovered ? coords.x * 13 : -5;
  const glareX = ((coords.x + 1) / 2) * 100;
  const glareY = ((coords.y + 1) / 2) * 100;

  // Base elevation in Z space: lifts up when hovered, stays elevated so bottom edge never sinks behind 0
  const zElevation = isPressed ? 14 : isHovered ? 26 : 0;
  const cardScale = isPressed ? 0.99 : isHovered ? 1.025 : 1;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="terminal-3d-wrapper"
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        display: 'inline-block',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* 3D Card Container */}
      <div
        className="terminal-card terminal-3d-card"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${zElevation}px) scale3d(${cardScale}, ${cardScale}, ${cardScale})`,
          transformStyle: 'preserve-3d',
          overflow: 'visible',
          transition: isHovered
            ? 'transform 0.12s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
          boxShadow: isHovered
            ? `${-coords.x * 18}px ${25 + coords.y * 14}px 55px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.18)`
            : '0 35px 90px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Holographic Glare Sheen Layer */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 15,
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%)`,
              mixBlendMode: 'overlay',
              transition: 'opacity 0.2s ease',
            }}
          />
        )}

        {/* Terminal Top Bar */}
        <div className="terminal-top" style={{ transform: 'translateZ(18px)', transformStyle: 'preserve-3d' }}>
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>vantanthedev-engine.ts</span>
          <span className="terminal-live">
            <i /> LIVE PIPELINE
          </span>
        </div>

        {/* Terminal Content with 3D Depth */}
        <div className="terminal-content" style={{ transformStyle: 'preserve-3d' }}>
          <div className="terminal-kicker" style={{ transform: 'translateZ(15px)' }}>
            ENGINEERING / 2026
          </div>
          <div className="terminal-heading" style={{ transform: 'translateZ(26px)' }}>
            Nền tảng sản phẩm<br />
            <span>vận hành thực tế.</span>
          </div>

          <div className="terminal-progress" style={{ transform: 'translateZ(22px)' }}>
            <div>
              <span>Tiến độ hoàn thiện quy trình</span>
              <b>85%</b>
            </div>
            <div className="progress-track">
              <i style={{ width: '85%' }} />
            </div>
          </div>

          <div className="terminal-checks" style={{ transform: 'translateZ(20px)' }}>
            <span>
              <b>01</b> Phân tích yêu cầu & Báo giá rõ <Check size={14} />
            </span>
            <span>
              <b>02</b> Kiến trúc phần mềm & Thiết kế UI <Check size={14} />
            </span>
            <span className="terminal-current">
              <b>03</b> Phát triển & Tối ưu hiệu năng <i />
            </span>
            <span className="terminal-muted">
              <b>04</b> Bàn giao source code & Triển khai <i />
            </span>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="terminal-foot" style={{ transform: 'translateZ(16px)', transformStyle: 'preserve-3d' }}>
          <span>
            <span className="signal-dot" /> Đội ngũ Kỹ sư VanTanTheDEV · Giám sát bởi Nguyễn Văn Tấn (CEO & COO)
          </span>
          <span>VN · REMOTE</span>
        </div>
      </div>
    </div>
  );
}
export default HeroTerminal3D;
