'use client'
import React, { useState } from 'react';
import { Home, Search, Mail, Settings, User, Heart, Star, Camera } from 'lucide-react';

export interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export const defaultDockItems: DockItem[] = [
  { id: 'home', icon: <Home size={18} />, label: 'Trang chủ' },
  { id: 'search', icon: <Search size={18} />, label: 'Tìm kiếm' },
  { id: 'mail', icon: <Mail size={18} />, label: 'Liên hệ' },
  { id: 'camera', icon: <Camera size={18} />, label: 'Dự án' },
  { id: 'favorites', icon: <Star size={18} />, label: 'Dịch vụ' },
  { id: 'profile', icon: <User size={18} />, label: 'Tài khoản' },
  { id: 'settings', icon: <Settings size={18} />, label: 'Cài đặt' },
];

interface DockItemProps {
  item: DockItem;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

const DockItemComponent: React.FC<DockItemProps> = ({ item, isHovered, onHover }) => {
  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-[2px]
          bg-[#181818]
          border border-[#2e2e2e]
          transition-all duration-200 ease-out
          cursor-pointer
          ${isHovered 
            ? 'scale-110 bg-[#242424] border-[#eeeeee] -translate-y-1 shadow-lg shadow-black/80' 
            : 'hover:scale-105 hover:bg-[#1e1e1e] hover:border-[#3a3a3a] hover:-translate-y-0.5'
          }
        `}
        onClick={item.onClick}
        style={{
          boxShadow: isHovered
            ? '0 6px 20px 0 rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)'
            : undefined,
          transitionProperty: 'box-shadow, transform, background, border-color'
        }}
      >
        <div className={`
          text-[#eeeeee] transition-all duration-200
          ${isHovered ? 'scale-105 text-white' : 'text-[#c9c9c9]'}
        `}>
          {item.icon}
        </div>
      </div>
      
      {/* Tooltip */}
      <div className={`
        absolute -top-9 left-1/2 transform -translate-x-1/2
        px-2.5 py-1 rounded-[2px]
        bg-[#181818]
        text-[#eeeeee] text-[11px] font-mono
        border border-[#363636]
        transition-all duration-150
        pointer-events-none
        whitespace-nowrap
        ${isHovered 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-1'
        }
        shadow-md
      `}>
        {item.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-1.5 h-1.5 bg-[#181818] rotate-45 border-r border-b border-[#363636]"></div>
        </div>
      </div>
    </div>
  );
};

export interface MinimalistDockProps {
  items?: DockItem[];
  className?: string;
  floating?: boolean;
}

export const MinimalistDock: React.FC<MinimalistDockProps> = ({ items = defaultDockItems, className = '', floating = false }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (floating) {
    return (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto ${className}`}>
        <div className="relative">
          {/* Dock Container */}
          <div className={`
            flex items-end gap-2.5 px-4 py-2.5
            rounded-[2px]
            bg-[#121212]/95 backdrop-blur-md
            border border-[#2e2e2e]
            shadow-2xl shadow-black/90
            transition-all duration-200 ease-out
            ${hoveredItem ? 'scale-[1.02]' : ''}
          `}>
            {items.map((item) => (
              <DockItemComponent
                key={item.id}
                item={item}
                isHovered={hoveredItem === item.id}
                onHover={setHoveredItem}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-[#121212] flex items-center justify-center p-8 rounded-[2px] border border-[#262626] ${className}`}>
      <div className="relative">
        {/* Dock Container */}
        <div className={`
          flex items-end gap-2.5 px-5 py-3
          rounded-[2px]
          bg-[#181818]
          border border-[#2e2e2e]
          shadow-xl
          transition-all duration-200 ease-out
          ${hoveredItem ? 'scale-[1.02]' : ''}
        `}>
          {items.map((item) => (
            <DockItemComponent
              key={item.id}
              item={item}
              isHovered={hoveredItem === item.id}
              onHover={setHoveredItem}
            />
          ))}
        </div>
        
        {/* Reflection Effect */}
        <div className="absolute top-full left-0 right-0 h-12 overflow-hidden pointer-events-none">
          <div className={`
            flex items-start gap-2.5 px-5 py-3
            rounded-[2px]
            bg-transparent
            opacity-20
            transform scale-y-[-1]
            transition-all duration-200 ease-out
            ${hoveredItem ? 'scale-[1.02] scale-y-[-1.02]' : ''}
          `}>
            {items.map((item) => (
              <div
                key={`reflection-${item.id}`}
                className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-[2px]
                  bg-white/5
                  transition-all duration-200 ease-out
                  ${hoveredItem === item.id 
                    ? 'scale-110 -translate-y-1' 
                    : ''
                  }
                `}
              >
                <div className="text-white/40">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalistDock;
