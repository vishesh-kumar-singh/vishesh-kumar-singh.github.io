import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Share2, Volume2, VolumeX, Sparkles, 
  Bookmark, Clock, Calendar, MapPin, Check, Send, 
  ChevronUp, Coffee, Smile, Compass, Feather, MessageSquareHeart, MessageSquare,
  Copy, Terminal, Info, AlertTriangle, Lightbulb
} from 'lucide-react';
import { getBlogBySlug } from './blogUtils.js';
import { subscribeToStoryHearts, incrementStoryHearts } from './firebase.js';
import SendMessageModal from './SendMessageModal.jsx';
import CommentsSection from './CommentsSection.jsx';
import { renderInlineMarkdown } from './renderInlineMarkdown.jsx';
import { BlogBadgeIcon } from './BlogBadgeIcon.jsx';

// Authentic Ambient Rain Player with Smooth Fade-in & Seamless Loop
class AmbientLoFiEngine {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.currentVolume = 0.8; // Loud, clear, immersive rain volume
  }

  setVolume(val) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.currentVolume;
    }
  }

  start() {
    if (this.isPlaying) return;
    try {
      if (!this.audio) {
        const basePath = import.meta.env.BASE_URL || '/';
        const audioSrc = `${basePath.endsWith('/') ? basePath : basePath + '/'}audio/rain.mp3`;
        this.audio = new Audio(audioSrc);
        this.audio.loop = true;
        this.audio.preload = 'auto';
      }

      this.audio.volume = this.currentVolume;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            if (this.audio) this.audio.volume = this.currentVolume;
          })
          .catch((err) => {
            console.warn("Audio playback error:", err);
            this.isPlaying = false;
          });
      }
    } catch (e) {
      console.warn("Failed to initialize rain audio:", e);
    }
  }

  stop() {
    if (!this.audio || !this.isPlaying) return;
    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    } catch (e) {
      if (this.audio) this.audio.pause();
      this.isPlaying = false;
    }
  }
}

export function resolveAtmosphere(theme = '', badge = '', tags = []) {
  const normalize = (val) => (typeof val === 'string' ? val.toLowerCase().trim() : '');

  const check = (str) => {
    const s = normalize(str);
    if (!s) return null;
    if (['sepia', 'amber', 'warm', 'vintage', 'candlelight', 'nostalgia', 'childhood', 'child', 'innocence'].some((k) => s.includes(k))) {
      return 'sepia';
    }
    if (['rose', 'pink', 'romance', 'love', 'memoir', 'heart', 'letter', 'confession'].some((k) => s.includes(k))) {
      return 'rose';
    }
    if (['midnight', 'dark', 'indigo', 'night', 'noir', 'philosophy', 'reflect', 'solitude', 'cyan', 'blue', 'violet', 'purple', 'emerald', 'campus'].some((k) => s.includes(k))) {
      return 'midnight';
    }
    return null;
  };

  // 1. Explicit theme from frontmatter (highest priority)
  const fromTheme = check(theme);
  if (fromTheme) return fromTheme;

  // 2. Badge from frontmatter
  const fromBadge = check(badge);
  if (fromBadge) return fromBadge;

  // 3. Tags
  if (Array.isArray(tags)) {
    for (const tag of tags) {
      const fromTag = check(tag);
      if (fromTag) return fromTag;
    }
  }

  // 4. Fallback default
  return 'midnight';
}

export default function BlogPage({ storySlug = 'her', onBack }) {
  // Dynamically load the blog matching the slug
  const blog = React.useMemo(() => {
    return getBlogBySlug(storySlug);
  }, [storySlug]);

  const metadata = blog ? blog.metadata : {};
  const blocks = blog ? blog.blocks : [];
  const readTimeMinutes = blog ? blog.readTimeMinutes : 1;

  // Derive default atmosphere based on frontmatter theme, badge, or tags
  const defaultAtmosphere = React.useMemo(() => {
    return resolveAtmosphere(metadata?.theme, metadata?.badge, metadata?.tags);
  }, [metadata?.theme, metadata?.badge, metadata?.tags]);

  // Theme atmospheres: 'midnight' | 'rose' | 'sepia'
  const [atmosphere, setAtmosphere] = useState(defaultAtmosphere);

  // Automatically sync atmosphere if author changes theme in frontmatter or changes story
  useEffect(() => {
    setAtmosphere(defaultAtmosphere);
  }, [defaultAtmosphere]);

  const currentSlugSafe = (blog?.slug || metadata.title || storySlug || 'her').toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  const [fontSize, setFontSize] = useState('large'); // 'large' (A+) default
  const [copied, setCopied] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [heartsCount, setHeartsCount] = useState(() => {
    return parseInt(localStorage.getItem(`hearts_${currentSlugSafe}`) || (currentSlugSafe === 'her' ? '42' : '0'), 10);
  });
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const audioEngineRef = useRef(null);

  // Initialize Audio Engine
  useEffect(() => {
    audioEngineRef.current = new AmbientLoFiEngine();
    return () => {
      if (audioEngineRef.current) audioEngineRef.current.stop();
    };
  }, []);

  const toggleAudio = () => {
    if (isAudioPlaying) {
      audioEngineRef.current?.stop();
      setIsAudioPlaying(false);
    } else {
      audioEngineRef.current?.start();
      audioEngineRef.current?.setVolume(audioVolume);
      setIsAudioPlaying(true);
    }
  };

  const handleVolumeChange = (newVol) => {
    setAudioVolume(newVol);
    audioEngineRef.current?.setVolume(newVol);
  };

  // Scroll Progress calculation
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subscribe to live global heart count via Firebase Realtime Database
  useEffect(() => {
    setHeartsCount(parseInt(localStorage.getItem(`hearts_${currentSlugSafe}`) || (currentSlugSafe === 'her' ? '42' : '0'), 10));
    const unsubscribe = subscribeToStoryHearts(currentSlugSafe, (liveCount) => {
      setHeartsCount(liveCount);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentSlugSafe]);

  const handleHeartClick = async (e) => {
    // Generate burst particles
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setFloatingHearts(prev => [
      ...prev,
      {
        id,
        x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 40,
        y: rect.top,
      }
    ]);

    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);

    // Optimistically increment locally, then sync to Firebase
    setHeartsCount(prev => prev + 1);
    const updatedCount = await incrementStoryHearts(currentSlugSafe);
    if (typeof updatedCount === 'number') {
      setHeartsCount(updatedCount);
    }
  };

  const handleShare = () => {
    const slug = blog?.slug || storySlug || 'her';
    const url = window.location.origin + window.location.pathname + `?story=${encodeURIComponent(slug)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Theme palettes
  const themes = {
    midnight: {
      bg: 'bg-[#07090e]',
      text: 'text-slate-200',
      prose: 'text-slate-300',
      accent: 'text-purple-400',
      badge: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
      card: 'bg-slate-900/60 border-slate-800/80',
      glow: 'from-purple-900/20 via-indigo-900/10 to-transparent',
      bar: 'from-blue-500 via-purple-500 to-pink-500',
    },
    rose: {
      bg: 'bg-[#0f070b]',
      text: 'text-rose-100',
      prose: 'text-rose-200/90',
      accent: 'text-rose-400',
      badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
      card: 'bg-rose-950/40 border-rose-900/50',
      glow: 'from-rose-950/25 via-pink-950/15 to-transparent',
      bar: 'from-rose-500 via-pink-500 to-amber-400',
    },
    sepia: {
      bg: 'bg-[#0c0a08]',
      text: 'text-amber-100',
      prose: 'text-amber-200/85',
      accent: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      card: 'bg-stone-900/60 border-stone-800/80',
      glow: 'from-amber-900/20 via-orange-950/10 to-transparent',
      bar: 'from-amber-500 via-orange-500 to-yellow-300',
    }
  };

  const currentTheme = themes[atmosphere] || themes.midnight;

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-700 selection:bg-purple-500 selection:text-white font-sans relative overflow-x-hidden`}>
      
      {/* 1. Dynamic Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 bg-black/40 backdrop-blur-sm">
        <motion.div 
          className={`h-full bg-gradient-to-r ${currentTheme.bar}`}
          style={{ width: `${scrollProgress}%` }}
          transition={{ ease: "easeOut", duration: 0.1 }}
        />
      </div>

      {/* 2. Ambient Ethereal Glow Backdrops */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b ${currentTheme.glow} rounded-full blur-[140px] opacity-70`} />
        <div className="absolute top-[35%] -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
        <div className="absolute top-[65%] -right-40 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[130px]" />
      </div>

      {/* 3. Floating Hearts Particles */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {floatingHearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 1, scale: 0.6, y: heart.y, x: heart.x }}
              animate={{ opacity: 0, scale: 1.8, y: heart.y - 120, x: heart.x + (Math.random() - 0.5) * 50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute text-rose-500 text-2xl filter drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. Glass Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/30 border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all group"
            title="Return to Personal Universe"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Universe</span>
          </button>
          
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-slate-400 font-mono">
            <span>{metadata.badge || 'ESSAY'}</span>
            <span>•</span>
            <span className="text-white font-medium">{metadata.title || 'HER'}</span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Authentic Binaural Rain Soundscape Toggle & Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all cursor-pointer ${
                isAudioPlaying 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={isAudioPlaying ? "Mute ambient rain atmosphere" : "Play soothing authentic rain soundscape"}
            >
              {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAudioPlaying ? "Rain: On" : "Rain Sounds"}</span>
            </button>

            {isAudioPlaying && (
              <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 animate-fadeIn">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-14 sm:w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  title={`Rain Volume: ${Math.round(audioVolume * 100)}%`}
                />
                <span className="text-[10px] font-mono text-slate-400 min-w-[28px] text-right">
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Atmosphere Palette Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 text-xs">
            <button
              onClick={() => setAtmosphere('midnight')}
              className={`px-2.5 py-1 rounded-full transition-all ${atmosphere === 'midnight' ? 'bg-purple-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Midnight Obsidian Atmosphere"
            >
              🌙
            </button>
            <button
              onClick={() => setAtmosphere('rose')}
              className={`px-2.5 py-1 rounded-full transition-all ${atmosphere === 'rose' ? 'bg-rose-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Rose Velvet Atmosphere"
            >
              🌹
            </button>
            <button
              onClick={() => setAtmosphere('sepia')}
              className={`px-2.5 py-1 rounded-full transition-all ${atmosphere === 'sepia' ? 'bg-amber-700 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Vintage Warmth Atmosphere"
            >
              ☕
            </button>
          </div>

          {/* Font Size Toggle */}
          <button
            onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-serif text-slate-300 hover:text-white transition-colors"
            title="Toggle Reading Font Size"
          >
            {fontSize === 'large' ? 'A-' : 'A+'}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all relative"
            title="Share Story Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* 5. Main Article Body Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-12 pb-32">
        
        {/* Article Header & Cover Badge */}
        <div className="text-center mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border mb-6 backdrop-blur-md shadow-sm"
          >
            <BlogBadgeIcon badge={metadata.badge} className="w-3.5 h-3.5" />
            <span className={currentTheme.badge}>{metadata.badge || 'Personal Memoir'}</span>
            {metadata.draft && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Draft
              </span>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 mb-6 drop-shadow-sm"
          >
            {renderInlineMarkdown(metadata.title || 'HER')}
          </motion.h1>

          {metadata.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-2xl text-slate-400 font-serif italic max-w-2xl mx-auto leading-relaxed mb-10"
            >
              "{renderInlineMarkdown(metadata.subtitle)}"
            </motion.p>
          )}

          {/* Author Card & Reading Metrics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 px-6 py-3.5 rounded-2xl border backdrop-blur-md ${currentTheme.card}`}
          >
            <div className="flex items-center gap-3">
              <img 
                src="/image.jpg" 
                alt="Vishesh Kumar Singh" 
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md"
              />
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Vishesh Kumar Singh</div>
                {metadata.location && (
                  <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-rose-400" /> {metadata.location}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-white/10" />

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              {metadata.date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> {metadata.date}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> ~{readTimeMinutes} min read
              </span>
            </div>
          </motion.div>
        </div>

        {/* Featured Atmospheric Pull-Quote (if specified in metadata) */}
        {metadata.featuredQuote && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`relative p-8 sm:p-10 rounded-3xl border mb-16 overflow-hidden backdrop-blur-xl ${currentTheme.card}`}
          >
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 text-white/5 font-serif text-9xl select-none pointer-events-none">
              “
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-rose-500 via-purple-500 to-amber-500 flex-shrink-0" />
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-serif italic text-white/95 leading-relaxed mb-3">
                  "{renderInlineMarkdown(metadata.featuredQuote)}"
                </p>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400">
                  — Note
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Editorial Prose Content (Completely controlled from Markdown) */}
        <article className="max-w-2xl sm:max-w-3xl mx-auto space-y-8">
          {blocks.map((block, idx) => {
            // Markdown Divider: --- or ***
            if (block.type === 'divider') {
              return (
                <div key={idx} className="flex items-center justify-center gap-4 my-14 text-slate-600">
                  <span className="w-16 sm:w-28 h-px bg-gradient-to-r from-transparent to-slate-700" />
                  <span className="text-sm font-serif italic text-rose-400/80">✧ ✧ ✧</span>
                  <span className="w-16 sm:w-28 h-px bg-gradient-to-l from-transparent to-slate-700" />
                </div>
              );
            }

            // Markdown Blockquote: > "Quote text"
            if (block.type === 'quote') {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="my-8 p-6 rounded-2xl bg-gradient-to-r from-rose-950/20 to-purple-950/20 border border-rose-500/20 flex items-start gap-4"
                >
                  <Coffee className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base font-serif text-slate-200 italic leading-relaxed">
                    "{renderInlineMarkdown(block.text)}"
                  </p>
                </motion.div>
              );
            }

            // Markdown Callout: > [!NOTE] or [!TIP] or [!WARNING]
            if (block.type === 'callout') {
              const isTip = block.calloutType === 'tip';
              const isWarning = block.calloutType === 'warning' || block.calloutType === 'caution';
              const isImportant = block.calloutType === 'important';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`my-8 p-5 sm:p-6 rounded-2xl border backdrop-blur-md flex items-start gap-4 ${
                    isWarning
                      ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                      : isTip
                      ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                      : 'bg-indigo-950/25 border-indigo-500/30 text-indigo-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isWarning ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : isTip ? <Lightbulb className="w-5 h-5 text-emerald-400" /> : <Info className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <div className="text-sm sm:text-base font-serif leading-relaxed text-slate-200">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-80">
                      {block.calloutType}
                    </span>
                    {renderInlineMarkdown(block.text)}
                  </div>
                </motion.div>
              );
            }

            // Markdown Code Block: ```lang ... ```
            if (block.type === 'code') {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="my-8 rounded-2xl border border-white/10 bg-[#0d1117] shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      <span>{block.lang || 'code'}</span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(block.code)}
                      className="hover:text-white transition-colors flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                      title="Copy Code"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-200 selection:bg-purple-500/40">
                    <code>{block.code}</code>
                  </pre>
                </motion.div>
              );
            }

            // Markdown Lists: bulleted or ordered
            if (block.type === 'list') {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="my-6 pl-2 sm:pl-4"
                >
                  {block.ordered ? (
                    <ol className="list-decimal space-y-3 font-serif text-base sm:text-lg text-slate-300 leading-relaxed pl-5">
                      {block.items.map((item, itemIdx) => (
                        <li key={itemIdx}>{renderInlineMarkdown(item)}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul className="space-y-3 font-serif text-base sm:text-lg text-slate-300 leading-relaxed">
                      {block.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2.5 flex-shrink-0" />
                          <span>{renderInlineMarkdown(item)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              );
            }

            // Markdown Heading 2: ##
            if (block.type === 'h2') {
              return (
                <h2 key={idx} className="text-2xl sm:text-3xl font-serif font-bold text-white pt-6 pb-2">
                  {renderInlineMarkdown(block.text)}
                </h2>
              );
            }

            // Markdown Heading 3: ###
            if (block.type === 'h3') {
              return (
                <h3 key={idx} className="text-xl sm:text-2xl font-serif font-semibold text-rose-200 pt-4 pb-1">
                  {renderInlineMarkdown(block.text)}
                </h3>
              );
            }

            // Markdown Image: ![alt](url)
            if (block.type === 'image') {
              return (
                <motion.figure
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.8 }}
                  className="my-12 text-center"
                >
                  <div className="relative group max-w-xl mx-auto rounded-3xl overflow-hidden border border-white/15 bg-white/5 backdrop-blur-md shadow-2xl p-2 sm:p-3 transition-all duration-500 hover:border-rose-400/40 hover:shadow-rose-950/30">
                    <img
                      src={block.src}
                      alt={block.alt || 'Story illustration'}
                      className="w-full h-auto rounded-2xl object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-3xl pointer-events-none ring-1 ring-inset ring-white/10" />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-3.5 text-xs sm:text-sm font-serif italic text-slate-400 max-w-md mx-auto leading-relaxed">
                      {block.caption}
                    </figcaption>
                  )}
                </motion.figure>
              );
            }

            // Standard Paragraph
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8 }}
              >
                <div className={`font-serif leading-loose tracking-wide ${fontSize === 'large' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} ${currentTheme.prose}`}>
                  {block.dropCap ? (
                    <p className="first-letter:float-left first-letter:text-6xl sm:first-letter:text-7xl first-letter:font-bold first-letter:mr-3 first-letter:leading-none first-letter:font-serif first-letter:text-transparent first-letter:bg-clip-text first-letter:bg-gradient-to-br first-letter:from-white first-letter:to-purple-300">
                      {renderInlineMarkdown(block.text)}
                    </p>
                  ) : (
                    <p>{renderInlineMarkdown(block.text)}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Interactive Heart Reaction & Applause Bar */}
          <div className="my-16 py-10 border-y border-white/10 flex flex-col items-center text-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">
              Did this touch a chord?
            </span>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleHeartClick}
                className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/40 hover:border-rose-400 text-rose-300 font-bold transition-all shadow-[0_0_25px_rgba(244,63,94,0.2)] active:scale-95 group"
              >
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500/50 group-hover:scale-125 transition-transform" />
                <span>Send Love</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-xs font-mono text-rose-200">
                  {heartsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  const commentsEl = document.getElementById('comments');
                  if (commentsEl) commentsEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-slate-200 hover:text-white font-medium text-sm transition-all group"
              >
                <MessageSquare className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Comments</span>
              </button>

              <button
                onClick={() => setIsMessageModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-slate-200 hover:text-white font-medium text-sm transition-all group"
              >
                <Send className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span>Private Note</span>
              </button>
            </div>
          </div>

          {/* Author's Epilogue Note (Controlled from Markdown frontmatter) */}
          {metadata.authorNote && (
            <div className={`p-8 rounded-3xl border backdrop-blur-xl ${currentTheme.card} text-left mb-16`}>
              <div className="flex items-center gap-3 mb-4">
                <Feather className="w-5 h-5 text-purple-400" />
                <h3 className="font-serif text-lg font-semibold text-white">Author's Note</h3>
              </div>
              <p className="text-sm font-serif italic text-slate-300 leading-relaxed mb-6">
                "{renderInlineMarkdown(metadata.authorNote)}"
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
                <span>— Vishesh Kumar Singh</span>
                <button 
                  type="button"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="flex items-center gap-1.5 text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" /> Send a thought to Vishesh
                </button>
              </div>
            </div>
          )}


          {/* Real-time Reader Comments & Reflections */}
          <CommentsSection
            storySlug={currentSlugSafe}
            storyTitle={metadata.title}
            atmosphere={atmosphere}
          />

          {/* Bottom Back Button & Scroll to Top */}
          <div className="flex items-center justify-between pt-8 border-t border-white/10">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white transition-all group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Personal Universe</span>
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-mono text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              title="Scroll to Top"
            >
              <span>Top</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </article>
      </main>

      {/* Direct In-Page Reader Message Modal */}
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        storyTitle={metadata.title || 'HER'}
      />

    </div>
  );
}
