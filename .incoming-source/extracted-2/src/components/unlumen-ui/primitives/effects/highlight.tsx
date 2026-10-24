"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HighlightContextValue {
  activeRect: { left: number; top: number; width: number; height: number } | null;
  setActiveRect: (
    rect: { left: number; top: number; width: number; height: number } | null,
  ) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const HighlightContext = React.createContext<HighlightContextValue | null>(null);

export interface HighlightProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "parent" | "item";
  controlledItems?: boolean;
  hover?: boolean;
  containerClassName?: string;
  transition?: any;
}

export function Highlight({
  children,
  className,
  containerClassName,
  hover = true,
  style,
  transition = { type: "spring", stiffness: 400, damping: 30 },
  ...props
}: HighlightProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [activeRect, setActiveRect] = React.useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  return (
    <HighlightContext.Provider
      value={{ activeRect, setActiveRect, containerRef }}
    >
      <div
        ref={containerRef}
        className={cn("relative", containerClassName)}
        onMouseLeave={() => {
          if (hover) setActiveRect(null);
        }}
        {...props}
      >
        <AnimatePresence>
          {activeRect && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: activeRect.left,
                top: activeRect.top,
                width: activeRect.width,
                height: activeRect.height,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={transition}
              className={cn("absolute pointer-events-none", className)}
              style={{ ...style, position: "absolute" }}
            />
          )}
        </AnimatePresence>
        {children}
      </div>
    </HighlightContext.Provider>
  );
}

export interface HighlightItemProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function HighlightItem({ asChild, children }: HighlightItemProps) {
  const context = React.useContext(HighlightContext);

  const handlePointerEnter = (el: HTMLElement) => {
    if (!context || !context.containerRef.current) return;
    const container = context.containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();

    context.setActiveRect({
      left: itemRect.left - containerRect.left,
      top: itemRect.top - containerRect.top,
      width: itemRect.width,
      height: itemRect.height,
    });
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onPointerEnter: (e: React.PointerEvent) => {
        handlePointerEnter(e.currentTarget as HTMLElement);
        child.props.onPointerEnter?.(e);
      },
      onFocus: (e: React.FocusEvent) => {
        handlePointerEnter(e.currentTarget as HTMLElement);
        child.props.onFocus?.(e);
      },
    });
  }

  return (
    <div
      onPointerEnter={(e) => handlePointerEnter(e.currentTarget)}
      className="relative"
    >
      {children}
    </div>
  );
}

export default Highlight;
