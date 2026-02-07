'use client';

import React, { useEffect, useState } from 'react';

interface ResizableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
}

export const ResizableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ResizableTextareaProps
>(({ minHeight = 80, maxHeight = 300, className = '', value, onChange, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const adjustHeight = () => {
    const textarea = textareaRef.current || (ref as any)?.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight || 80), maxHeight || 300)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minHeight, maxHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startY = e.clientY;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startHeight = textarea.offsetHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffY = moveEvent.clientY - startY;
      const newHeight = Math.min(
        Math.max(startHeight + diffY, minHeight || 80),
        maxHeight || 300
      );
      textarea.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
className={`w-full block resize-none border border-slate-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all overflow-y-auto ${className}`}        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          height: 'auto',
        }}
        {...props}
      />
      {/* Resize handle - Grey triangle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute cursor-se-resize pointer-events-auto hidden md:block"
        style={{
          bottom: '5px',
          right: '5px',
          width: '10px',
          height: '10px',
          background: 'linear-gradient(135deg, transparent 50%, #b0b8c1 50%)',
          borderBottomRightRadius: '1px',
        }}
        aria-label="Resize textarea"
      />

    </div>
  );
});

ResizableTextarea.displayName = 'ResizableTextarea';
