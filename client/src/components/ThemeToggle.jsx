// frontend/src/components/ThemeToggle.jsx
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  // On mount, set the theme based on localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine the initial theme
    let initialTheme;
    if (savedTheme) {
      initialTheme = savedTheme;
    } else {
      initialTheme = prefersDark ? 'dark' : 'light';
    }

    setTheme(initialTheme);
    // Apply the class immediately to avoid flash of unstyled content (FOUC)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Empty dependency array means this runs once on mount

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply or remove the 'dark' class based on the new theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-full p-2 transition-all duration-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-zinc-800" />
      )}
    </button>
  );
}