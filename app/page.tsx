'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  Briefcase,
  CheckCircle,
  Shield,
  Sparkles,
  FileText,
  MessageSquare,
  Mail,
  Target,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Brain,
  Smile,
  Check
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [userCount, setUserCount] = useState('10,000+');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PLUS' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setIsLoggedIn(true);
          // User plan will be fetched by dashboard layout when needed
          setUserPlan('FREE'); // Default assumption
        } else {
          setIsLoggedIn(false);
          setUserPlan(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => setUserCount(data.displayCount))
      .catch(() => setUserCount('10,000+'));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e5d9f2] via-[#f0eaf9] to-[#cfe2f3] relative overflow-hidden">
      {/* Subtle gradient orbs - very soft */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full blur-[100px]" />
      </div>

      {/* Navigation - Liquid Glass Design */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          scrolled ? 'pt-3 pb-2' : 'pt-6 pb-4'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`mx-auto px-6 transition-all duration-700 ${
          scrolled ? 'max-w-5xl px-8' : 'max-w-7xl px-6'
        }`}>
          <motion.div
            className={`relative overflow-hidden rounded-[32px] transition-all duration-700 ${
              scrolled ? 'shadow-lg' : 'shadow-md bg-white/85'
            }`}
            style={{
              background: scrolled
                ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(243,232,255,0.55) 25%, rgba(219,234,254,0.5) 50%, rgba(255,255,255,0.45) 100%)'
                : undefined,
              backdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'blur(10px) saturate(120%)',
              WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'blur(10px) saturate(120%)',
            }}
          >
            {/* Liquid gradient overlay */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${
              scrolled ? 'opacity-20' : 'opacity-[0.08]'
            }`}>
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 20% 50%, rgba(168,85,247,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.3) 0%, transparent 50%)',
                  animation: 'liquid-flow 8s ease-in-out infinite',
                }}
              />
            </div>

            {/* Subtle border */}
            <div
              className="absolute inset-0 rounded-[32px] opacity-30"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(59,130,246,0.1) 100%)',
                padding: '1px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />

            <div className={`relative flex items-center justify-between transition-all duration-700 ${
              scrolled ? 'px-3 sm:px-6 py-2.5' : 'px-4 sm:px-8 py-4'
            }`}>
              {/* Logo - Left side */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg px-2 sm:px-3 py-1.5">
                  <Briefcase className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 leading-tight text-[14px] sm:text-[17px]">AI Job</span>
                  <span className="font-bold text-slate-900 leading-tight text-[14px] sm:text-[17px]">Master</span>
                </div>
              </div>

              {/* Nav Links - Center */}
              <div className="hidden md:flex items-center gap-12">
                {['Features', 'How It Works', 'About', 'Pricing'].map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(' ', '-')}`}
                    className="font-medium text-slate-800 hover:text-slate-900 transition-all duration-300 relative group whitespace-nowrap text-[15px]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 group-hover:w-full transition-all duration-300" />
                  </motion.a>
                ))}
              </div>

              {/* CTA Button - Right side with gradient outline on hover */}
              <div className="relative group flex-shrink-0">
                {/* Animated gradient outline */}
                <div className={`gradient-outline-rotate absolute -inset-[2px] bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500 ${
                  scrolled ? 'rounded-[22px] sm:rounded-[24px]' : 'rounded-[18px] sm:rounded-[22px]'
                }`} />
                <Link
                  href="/auth/signup"
                  className={`relative inline-block bg-slate-900 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl text-[13px] sm:text-[15px] px-4 sm:px-8 py-2.5 sm:py-3.5 ${
                    scrolled ? 'rounded-[20px] sm:rounded-[22px]' : 'rounded-[16px] sm:rounded-[20px]'
                  }`}
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add CSS keyframes for animations */}
        <style jsx>{`
          @keyframes liquid-flow {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }

          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: liquid-flow 3s ease infinite;
          }
        `}</style>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center px-4 sm:px-6 pb-20 sm:pb-32 pt-24 sm:pt-32">
        <div className="max-w-5xl mx-auto text-center w-full">
          {/* Social Proof with Avatars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8"
          >
            {/* Avatar circles */}
            <div className="flex -space-x-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 border-2 sm:border-[3px] border-white shadow-md" />
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-pink-300 to-pink-400 border-2 sm:border-[3px] border-white shadow-md" />
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-green-300 to-green-400 border-2 sm:border-[3px] border-white shadow-md" />
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 border-2 sm:border-[3px] border-white shadow-md" />
            </div>
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-700 font-medium">
              <span className="text-teal-600 font-bold">{userCount}</span> job seekers trust us
            </p>
          </motion.div>

          {/* Main Headline with Icon */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ 
              opacity: { delay: 0.3 },
              y: { 
                delay: 0.3,
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }
            }}
            className="mb-8"
          >
            <h1 className="text-[36px] sm:text-[52px] md:text-[80px] lg:text-[88px] font-bold text-slate-900 leading-[1.1] mb-0">
              Land{' '}
              <span className="inline-flex items-center justify-center align-middle">
                <span className="inline-block bg-gradient-to-br from-purple-500 to-purple-600 p-2 sm:p-3 md:p-4 rounded-[16px] sm:rounded-[22px] md:rounded-[28px] shadow-2xl mx-1 sm:mx-2 md:mx-3 mb-1 sm:mb-2">
                  <Briefcase className="w-[28px] h-[28px] sm:w-[38px] sm:h-[38px] md:w-[52px] md:h-[52px] text-white" strokeWidth={2.5} />
                </span>
              </span>
              Your Dream Job
            </h1>
            <h2 className="text-[36px] sm:text-[52px] md:text-[80px] lg:text-[88px] font-bold text-slate-900 leading-[1.1]">
              With AI-Powered Apps
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-[14px] sm:text-[16px] md:text-[17px] text-slate-700 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4"
          >
            Generate personalized cover letters, emails, and LinkedIn messages in seconds.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Track every application and never miss a follow-up. AI does the heavy lifting.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12 sm:mb-16 md:mb-20"
          >
            <div className="relative group inline-block">
              {/* Animated gradient outline - tighter */}
              <div className="gradient-outline-rotate absolute -inset-[1.5px] bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-[18px] sm:rounded-[23px] opacity-0 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
              <Link
                href="/auth/signup"
                className="relative inline-block bg-slate-900 text-white text-sm sm:text-base md:text-[16px] font-semibold px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 rounded-[16px] sm:rounded-[22px] shadow-2xl transition-all duration-300 hover:shadow-3xl"
              >
                Start For Free
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards - Tilted like in reference */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="hidden lg:flex items-center justify-center gap-8 max-w-3xl mx-auto relative"
          >
            {/* Left Card - Application Success */}
            <div
              className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-2xl border border-white/60 w-[340px]"
              style={{ transform: 'rotate(-4deg)' }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-300 to-orange-400 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <TrendingUp className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <h3 className="text-[19px] font-bold text-slate-900 leading-tight">Application</h3>
                  <h3 className="text-[19px] font-bold text-slate-900 leading-tight">Success Rate</h3>
                </div>
              </div>
              <div className="text-left space-y-2">
                <p className="text-[32px] font-bold text-slate-900 leading-none">3x</p>
                <p className="text-[15px] font-semibold text-slate-700">More Interview Callbacks</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">Users applying with AI-generated content</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">get 3x more responses from recruiters</p>
              </div>
            </div>

            {/* Arrow decoration */}
            <div className="text-purple-300 opacity-50">
              <svg width="100" height="60" viewBox="0 0 100 60" fill="none" className="rotate-12">
                <path
                  d="M 10 30 Q 50 10, 85 25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                />
                <path
                  d="M 85 25 L 80 20 M 85 25 L 80 30"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* Right Card - Time Saved */}
            <div
              className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-2xl border border-white/60 w-[340px]"
              style={{ transform: 'rotate(3deg)' }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-400 to-green-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="text-[19px] font-bold text-slate-900 leading-tight">Time Saved</h3>
                </div>
              </div>
              <div className="text-left space-y-2">
                <p className="text-[32px] font-bold text-slate-900 leading-none">85%</p>
                <p className="text-[15px] font-semibold text-slate-700">Faster Application Process</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">What used to take hours now takes</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">minutes. Apply to more jobs effortlessly</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile Stats - Simplified */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:hidden grid grid-cols-2 gap-4 max-w-md mx-auto px-4"
          >
            {/* Left Stat */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-orange-300 to-orange-400 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <TrendingUp className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none mb-1">3x</p>
                <p className="text-xs font-semibold text-slate-700">More Callbacks</p>
              </div>
            </div>

            {/* Right Stat */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/60">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-emerald-400 to-green-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none mb-1">85%</p>
                <p className="text-xs font-semibold text-slate-700">Time Saved</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="relative z-10 py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              We Understand Your <span className="text-red-400">Challenges</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-purple-200 max-w-3xl mx-auto px-4">
              The job search journey can be overwhelming. You&apos;re qualified and talented, yet...
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4">
            {[
              {
                emoji: "😓",
                title: "Endless Applications",
                description: "Spending countless hours writing the same cover letter repeatedly, making small tweaks for each company. Your time deserves better."
              },
              {
                emoji: "😰",
                title: "Lost in the Crowd",
                description: "Applications disappearing into the void. Does your message stand out among hundreds? The uncertainty is exhausting."
              },
              {
                emoji: "😤",
                title: "Tracking Nightmare",
                description: "Which companies did you contact? What message did you send? When to follow up? Managing everything manually is chaos."
              }
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-[24px] md:rounded-[28px] p-6 sm:p-7 md:p-8 border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 md:mb-5">{problem.emoji}</div>
                <h3 className="text-xl sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">
                  {problem.title}
                </h3>
                <p className="text-sm sm:text-base text-purple-200 leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 px-4">
              Your Personal AI <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Career Assistant</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              Imagine having an assistant who crafts perfect messages, knows what to say, and keeps everything organized. That&apos;s us.
            </p>
          </motion.div>

          <div className="space-y-12 sm:space-y-16 md:space-y-20 lg:space-y-24">
            {/* Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-4 sm:px-0"
              >
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-purple-100 text-purple-700 font-bold mb-4 sm:mb-6 shadow-lg text-sm sm:text-base">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold">1</span>
                  Upload Resume
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-5">
                  Start With Your Experience
                </h3>
                <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                  Upload your resume (PDF or DOCX). Our AI analyzes your skills, experience, and achievements instantly. Manage up to 3 versions for different roles.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {["Fast upload process", "Bank-level encryption", "Multiple resume versions"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-slate-700">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative px-4 sm:px-0"
              >
                <div className="bg-gradient-to-br from-purple-200 to-blue-200 rounded-2xl sm:rounded-3xl md:rounded-[32px] p-6 sm:p-8 md:p-12 shadow-2xl">
                  <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xl">
                    <FileText className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 text-purple-600 mx-auto mb-4 sm:mb-6" strokeWidth={1.5} />
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-2 sm:h-2.5 md:h-3 bg-purple-200 rounded-full w-3/4 mx-auto" />
                      <div className="h-2 sm:h-2.5 md:h-3 bg-blue-200 rounded-full w-full mx-auto" />
                      <div className="h-2 sm:h-2.5 md:h-3 bg-purple-200 rounded-full w-2/3 mx-auto" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:order-2 px-4 sm:px-0"
              >
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-blue-100 text-blue-700 font-bold mb-4 sm:mb-6 shadow-lg text-sm sm:text-base">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold">2</span>
                  AI Generation
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-5">
                  Let AI Work Its Magic
                </h3>
                <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                  Paste the job description. Select your AI (OpenAI, Claude, Gemini). Get perfectly tailored content in seconds that highlights your fit.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {[
                    { icon: FileText, label: "Cover Letters", color: "from-blue-500 to-cyan-500" },
                    { icon: Mail, label: "Emails", color: "from-orange-500 to-red-500" },
                    { icon: MessageSquare, label: "LinkedIn", color: "from-purple-500 to-pink-500" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-lg border border-slate-200">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} p-1.5 sm:p-2 md:p-2.5 mx-auto mb-2 sm:mb-3 shadow-md`}>
                        <item.icon className="w-full h-full text-white" />
                      </div>
                      <p className="text-[10px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:order-1 px-4 sm:px-0"
              >
                <div className="bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl sm:rounded-3xl md:rounded-[32px] p-6 sm:p-8 md:p-12 shadow-2xl">
                  <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
                    <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 text-blue-600 mx-auto mb-4 sm:mb-6 animate-pulse" strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-pulse" />
                    <div className="relative space-y-2 sm:space-y-3">
                      <div className="h-2 sm:h-2.5 bg-blue-200 rounded-full w-full" />
                      <div className="h-2 sm:h-2.5 bg-purple-200 rounded-full w-5/6" />
                      <div className="h-2 sm:h-2.5 bg-blue-200 rounded-full w-4/6" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-4 sm:px-0"
              >
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-green-100 text-green-700 font-bold mb-4 sm:mb-6 shadow-lg text-sm sm:text-base">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold">3</span>
                  Track Progress
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-5">
                  Stay Organized & Follow Up
                </h3>
                <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                  All applications in one dashboard. Track statuses, schedule follow-ups, and watch your progress. Never miss an opportunity.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {["Complete history", "Status tracking (Sent, Draft, Done, Ghost)", "Export anytime"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 sm:gap-3 text-slate-700">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-4 sm:px-0"
              >
                <div className="bg-gradient-to-br from-green-200 to-emerald-200 rounded-2xl sm:rounded-3xl md:rounded-[32px] p-6 sm:p-8 md:p-12 shadow-2xl">
                  <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[24px] p-6 sm:p-8 md:p-10 shadow-xl">
                    <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 text-green-600 mx-auto mb-4 sm:mb-6" strokeWidth={1.5} />
                    <div className="space-y-3 sm:space-y-4">
                      {[
                        { color: 'bg-green-500', width: 'w-full' },
                        { color: 'bg-blue-500', width: 'w-4/5' },
                        { color: 'bg-orange-500', width: 'w-3/5' }
                      ].map((bar, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${bar.color}`} />
                          <div className={`h-2 sm:h-2.5 ${bar.color} bg-opacity-20 rounded-full ${bar.width}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="about" className="relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-6 px-4">
              Why Choose AI Job Master
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              More than software—your competitive advantage
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Zap,
                title: "85% Time Saved",
                description: "What took hours now takes seconds. Apply to more opportunities without exhaustion.",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: Brain,
                title: "Best AI Models",
                description: "OpenAI, Claude, or Gemini. Your API keys, your control, complete privacy.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Shield,
                title: "Military-Grade Security",
                description: "AES-256 encryption. Your data stays encrypted. We never see your keys.",
                color: "from-blue-500 to-indigo-600"
              },
              {
                icon: Target,
                title: "100% Personalized",
                description: "Every message tailored to the role and company. Zero generic templates.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Users,
                title: `${userCount} Community`,
                description: "Join thousands of successful job seekers achieving their goals.",
                color: "from-red-500 to-rose-500"
              },
              {
                icon: Clock,
                title: "3x Faster Applications",
                description: "Quality applications at speed. More applications equal more chances.",
                color: "from-cyan-500 to-blue-500"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-gradient-to-br from-slate-50 to-purple-50/50 rounded-xl sm:rounded-2xl md:rounded-[28px] p-5 sm:p-6 md:p-8 border border-slate-200 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${benefit.color} p-2.5 sm:p-3 md:p-3.5 mb-4 sm:mb-5 md:mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <benefit.icon className="w-full h-full text-white" strokeWidth={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="relative z-10 py-16 sm:py-20 md:py-24 lg:py-28 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 px-4">
              Simple, <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Transparent Pricing</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              Choose the plan that fits your job search. Scale up whenever you&apos;re ready.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 max-w-4xl mx-auto mb-12 md:mb-16">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full bg-white rounded-3xl border-2 border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300 p-8 md:p-10 overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 -mr-20 -mt-20" />

                <div className="relative z-10">
                  {/* Plan Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Free</h3>
                    <p className="text-slate-600">Perfect for getting started</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl md:text-6xl font-bold text-slate-900">$0</span>
                      <span className="text-slate-600">/month</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Forever free with basic features</p>
                  </div>

                  {/* CTA */}
                  {isLoggedIn && userPlan === 'FREE' ? (
                    <div className="w-full mb-6 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-200 text-slate-600 font-semibold cursor-not-allowed">
                      <Check className="w-5 h-5" />
                      Free plan activated
                    </div>
                  ) : isLoggedIn && userPlan === 'PLUS' ? (
                    <div className="w-full mb-6 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-100 text-slate-400 font-semibold cursor-not-allowed">
                      Free plan activated
                    </div>
                  ) : (
                    <Link href="/auth/signup" className="w-full">
                      <Button className="w-full mb-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 rounded-xl">
                        Get Started Free
                      </Button>
                    </Link>
                  )}

                  {/* Features */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-900 mb-4">What&apos;s Included:</p>
                    {[
                      { label: "100 activities/month", icon: "📝" },
                      { label: "No AI model access (use your own API key)", icon: "🔑" },
                      { label: "In-app reminders", icon: "🔔" },
                      { label: "Activity tracking & history", icon: "📊" },
                      { label: "Standard support", icon: "💬" },
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">{feature.icon}</span>
                        <span className="text-sm text-slate-700">{feature.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Not Included */}
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Not Included:</p>
                    {[
                      "Sponsored AI models",
                      "Email reminders",
                      "Job Description Resume Maker"
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-slate-300">✕</span>
                        <span className="text-sm text-slate-500">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Plus Plan */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative"
            >
              {/* Animated gradient outline on hover */}
              <div className="gradient-outline-rotate absolute -inset-[2px] bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 rounded-[24px] opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 pointer-events-none" />
              <div className="relative h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-2 border-purple-500/50 shadow-2xl hover:shadow-2xl transition-all duration-300 p-8 md:p-10 overflow-hidden ring-2 ring-purple-500/30">
                {/* Gradient overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500 to-transparent rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 -mr-20 -mt-20" />

                {/* Badge */}
                {userPlan === 'PLUS' ? (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Your Plan
                  </div>
                ) : (
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-bold">
                    Most Popular
                  </div>
                )}

                <div className="relative z-10">
                  {/* Plan Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Plus</h3>
                    <p className="text-purple-200">
                      {userPlan === 'PLUS'
                        ? 'Congratulations, you\'re already in Plus!'
                        : 'For serious job seekers'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-slate-700">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl md:text-6xl font-bold text-white">$5</span>
                      <span className="text-slate-400">/month</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">Billed monthly • Cancel anytime</p>
                  </div>

                  {/* CTA */}
                  {userPlan === 'PLUS' ? (
                    <div className="w-full mb-6 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-emerald-200 font-semibold border border-green-500/30">
                      <Check className="w-5 h-5" />
                      Already active
                    </div>
                  ) : isLoggedIn && userPlan === 'FREE' ? (
                    <Link href="/auth/signup?plan=plus" className="w-full">
                      <Button className="w-full mb-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-12 rounded-xl shadow-lg">
                        Upgrade to Plus
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/signup?plan=plus" className="w-full">
                      <Button className="w-full mb-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-12 rounded-xl shadow-lg">
                        Get Started with Plus
                      </Button>
                    </Link>
                  )}

                  {/* Features */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-white mb-4">Everything in Free, plus:</p>
                    {[
                      { label: "300 activities/month", icon: "📝", highlight: true },
                      { label: "300 generations/month", icon: "✨", highlight: true },
                      { label: "150 follow-up generations/month", icon: "↩️", highlight: true },
                      { label: "Sponsored AI models - Claude (OpenAI & Gemini soon)", icon: "🤖" },
                      { label: "Email Reminders (soon)", icon: "📧" },
                      { label: "Job Description Resume Maker (soon)", icon: "📄" },
                      { label: "Priority support", icon: "⭐" },
                    ].map((feature, idx) => (
                      <div key={idx} className={`flex items-start gap-3 ${feature.highlight ? 'bg-purple-500/10 p-3 rounded-lg border border-purple-500/20' : ''}`}>
                        <span className="text-lg flex-shrink-0">{feature.icon}</span>
                        <span className={`text-sm ${feature.highlight ? 'text-purple-200 font-medium' : 'text-slate-300'}`}>{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10 px-4 py-8 md:py-12 border-t border-slate-200"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 text-slate-700">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-xs sm:text-sm font-medium">Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 text-slate-700">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium">{userCount} Users</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5 text-slate-700">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              <span className="text-xs sm:text-sm font-medium">Instant Results</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="full" isDark={true} />
    </div>
  );
}
