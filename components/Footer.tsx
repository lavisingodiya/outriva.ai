'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Mail, MessageSquare, Github, Linkedin, Twitter } from 'lucide-react';

interface FooterProps {
  variant?: 'full' | 'compact';
  isDark?: boolean;
}

export function Footer({ variant = 'full', isDark = false }: FooterProps) {
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadText = async () => {
      const mod = await import('@/lib/utils/config');
      setText(mod.getMetadata());
    };
    loadText();
  }, []);

  if (!mounted) return null;

  const currentYear = new Date().getFullYear();

  // Color classes based on context - now with Tailwind dark mode support
  const bgClass = isDark
    ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700'
    : 'bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-slate-200 dark:border-gray-700';

  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900 dark:text-gray-100';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600 dark:text-gray-400';
  const hoverLinkClass = isDark
    ? 'hover:text-purple-400 transition-colors duration-300'
    : 'hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-300';

  if (variant === 'compact') {
    return (
      <footer className={`${bgClass} py-6 px-6 relative overflow-hidden`}>
        {/* Subtle gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className={`${textSecondary} text-xs md:text-sm`}>
            © {currentYear} AI Job Master. Empowering careers worldwide.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className={`text-xs md:text-sm ${textSecondary} ${hoverLinkClass}`}>
              Privacy
            </Link>
            <Link href="/terms" className={`text-xs md:text-sm ${textSecondary} ${hoverLinkClass}`}>
              Terms
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  // Full footer variant
  return (
    <footer className={`${bgClass} relative overflow-hidden`}>
      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-purple-600' : 'bg-purple-300 dark:bg-purple-600'}`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${isDark ? 'bg-blue-600' : 'bg-blue-300 dark:bg-blue-600'}`} />
      </div>

      {/* Gradient line separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 md:mb-12">
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-2 sm:p-2.5 shadow-lg">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className={`font-bold text-base sm:text-lg ${textPrimary}`}>AI Job Master</p>
                <p className={`text-[10px] sm:text-xs ${textSecondary}`}>Career excellence</p>
              </div>
            </div>
            <p className={`text-xs sm:text-sm ${textSecondary} leading-relaxed`}>
              Leverage AI to craft compelling applications and land your dream role.
            </p>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${textPrimary}`}>Tools</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link href="/dashboard/cover-letter" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Cover Letter
                </Link>
              </li>
              <li>
                <Link href="/dashboard/email" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Email Generator
                </Link>
              </li>
              <li>
                <Link href="/dashboard/linkedin" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  LinkedIn Messages
                </Link>
              </li>
              <li>
                <Link href="/dashboard/history" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  History
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${textPrimary}`}>Resources</h4>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link href="/dashboard" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/settings" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Settings
                </Link>
              </li>
              <li>
                <a href="mailto:support@aijobmaster.com" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Support
                </a>
              </li>
              <li>
                <Link href="/privacy" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${textPrimary}`}>Connect</h4>
            <div className="flex gap-2 sm:gap-3">
              <a href="#" className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600'} transition-colors duration-300`}>
                <Linkedin className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700 dark:text-gray-300'}`} />
              </a>
              <a href="#" className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600'} transition-colors duration-300`}>
                <Twitter className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700 dark:text-gray-300'}`} />
              </a>
              <a href="#" className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600'} transition-colors duration-300`}>
                <Github className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700 dark:text-gray-300'}`} />
              </a>
              <a href="mailto:hello@aijobmaster.com" className={`p-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600'} transition-colors duration-300`}>
                <Mail className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700 dark:text-gray-300'}`} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent ${isDark ? 'via-slate-600' : ''} mb-4 sm:mb-6`} />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className={`text-xs sm:text-sm ${textSecondary} text-center md:text-left`}>
            © {currentYear} AI Job Master. All rights reserved.
          </p>
          <div className="text-center">
            {text && (
              <p className={`text-[10px] sm:text-xs ${textSecondary} opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-help`}>
                {text}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/privacy" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={`text-xs sm:text-sm ${textSecondary} ${hoverLinkClass}`}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
