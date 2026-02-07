'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load dark mode state on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('darkMode');
    const shouldBeDark = saved === 'true';
    
    if (saved !== null) {
      setIsDarkMode(shouldBeDark);
      // Apply to DOM immediately on mount
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    // Return a placeholder that matches the button dimensions during SSR
    return (
      <div className="relative p-2 w-9 h-9 rounded-lg" aria-label="Toggle dark mode">
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 opacity-0" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}
