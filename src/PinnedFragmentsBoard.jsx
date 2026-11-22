import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Copy, Share2, Check, MapPin, Clock, 
  Sparkles, Feather, Pin, ArrowRight
} from 'lucide-react';
import { initialFragments, THEME_STYLES } from './fragmentsData.js';
import { subscribeToStoryHearts, incrementStoryHearts } from './firebase.js';

// Individual Pinned Polaroid/Postcard
function PinnedFragmentCard({ fragment, index, rotationClass }) {
  const [hearts, setHearts] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const theme = THEME_STYLES[fragment.cardTheme] || THEME_STYLES['velvet-slate'];
  const fragmentKey = `fragment_${fragment.id}`;

  useEffect(() => {
    const liked = localStorage.getItem(`has_liked_${fragmentKey}`) === 'true';
    if (liked) setHasLiked(true);

    const unsubscribe = subscribeToStoryHearts(fragmentKey, (count) => {
      setHearts(count);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fragmentKey]);

  const handleHeartClick = async (e) => {
    e.stopPropagation();
    setIsLiking(true);
    setHasLiked(true);
    try {
      localStorage.setItem(`has_liked_${fragmentKey}`, 'true');
      await incrementStoryHearts(fragmentKey);
    } catch (err) {
      console.warn('Heart increment error:', err);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  const formattedPoemText = fragment.lines.join('\n');

  const handleCopy = async (e) => {
    e.stopPropagation();
    const fullText = `${formattedPoemText}\n\n— Vishesh Kumar Singh (${fragment.location} • ${fragment.time})\nhttps://vishesh-kumar-singh.github.io`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const fullText = `${formattedPoemText}\n\n— Vishesh Kumar Singh (${fragment.location} • ${fragment.time})`;
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=blogs&tab=fragments`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'स्याही और पन्ने • Vishesh Kumar Singh',
          text: fullText,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to WhatsApp
      }
    }

    const encoded = encodeURIComponent(`${fullText}\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={`relative group ${rotationClass} hover:rotate-0 transition-transform duration-500 ease-out`}
    >
      {/* Physical Pushpin Tack at Top Center */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        <div className={`w-4 h-4 rounded-full ${theme.pin} ring-2 ring-white/30 drop-shadow-md`} />
        <div className="w-2 h-1 bg-black/60 rounded-full blur-[1px] mt-0.5" />
      </div>

      {/* Card Body */}
      <div 
        className={`relative rounded-3xl p-6 sm:p-7 border backdrop-blur-xl transition-all duration-500 overflow-hidden flex flex-col justify-between h-full ${theme.card}`}
        style={{ backgroundImage: theme.paperTexture }}
      >
        {/* Subtle Ambient Glow */}
        <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${theme.glow} blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700`} />

        <div>
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-3 mb-5 pt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider border font-medium ${theme.tag}`}>
              <Feather className="w-3 h-3" />
              <span>{fragment.stamp || 'ख्याल'}</span>
            </span>

            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
              {fragment.tag}
            </span>
          </div>

          {/* Poetry Couplet */}
          <div className="relative py-2 my-2">
            <span className="absolute -top-3 -left-2 text-3xl text-white/5 font-serif select-none pointer-events-none">
              “
            </span>
            <div className="space-y-1.5 pl-3 border-l border-white/10 group-hover:border-white/25 transition-colors">
              {fragment.lines.map((line, idx) => (
                <p 
                  key={idx} 
                  className="font-serif text-base sm:text-lg leading-relaxed text-slate-200 tracking-wide select-text selection:bg-rose-500/30"
                  style={{ fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif" }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Location, Time & Micro-Interactions */}
        <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="flex flex-col text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1 text-slate-300 font-medium">
              <MapPin className="w-3 h-3 text-rose-400/80" />
              <span>{fragment.location}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Clock className="w-2.5 h-2.5" />
              <span>{fragment.time}</span>
              {fragment.date && <span>• {fragment.date}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Live Heart Counter */}
            <button
              onClick={handleHeartClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                hasLiked 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]' 
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
              title="React to this fragment"
            >
              <Heart 
                className={`w-3.5 h-3.5 transition-transform ${
                  hasLiked ? 'fill-rose-400 text-rose-400' : 'text-slate-400'
                } ${isLiking ? 'scale-125' : ''}`} 
              />
              <span className="font-bold">{hearts}</span>
            </button>

            {/* Copy Sher Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer relative"
              title="Copy Sher to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500 text-black font-bold whitespace-nowrap shadow-lg">
                  Copied!
                </span>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Share Fragment"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PinnedFragmentsBoard({ onOpenUniverse }) {
  const [heartCounts, setHeartCounts] = useState({});

  useEffect(() => {
    // Listen to heart counts for all fragments to optionally sort by hearts
    const unsubscribes = initialFragments.map((f) => {
      const key = `fragment_${f.id}`;
      return subscribeToStoryHearts(key, (count) => {
        setHeartCounts((prev) => ({ ...prev, [f.id]: count }));
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Sort fragments: highest hearts first, or preserve top favorites
  const featuredFragments = useMemo(() => {
    const list = [...initialFragments];
    list.sort((a, b) => {
      const heartsB = heartCounts[b.id] || 0;
      const heartsA = heartCounts[a.id] || 0;
      if (heartsB !== heartsA) return heartsB - heartsA;
      // Keep initial sequence as tie-breaker (so user's signature sher stays first)
      return 0;
    });
    // Display top 3 cards on the pinboard
    return list.slice(0, 3);
  }, [heartCounts]);

  const rotationClasses = [
    '-rotate-1.5 md:-rotate-2',
    'rotate-1.5 md:rotate-2',
    '-rotate-1 md:-rotate-1'
  ];

  return (
    <section className="relative w-full py-24 px-4 sm:px-8 z-20 bg-transparent">
      <div className="max-w-6xl mx-auto">
        
        {/* Pinned Board Frame */}
        <div className="relative rounded-[32px] p-6 sm:p-12 bg-gradient-to-b from-[#0c0d16]/95 via-[#08090e]/95 to-[#040508]/95 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
          
          {/* Subtle Cork & Slate Texture Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 text-amber-300 mb-4 backdrop-blur-md">
              <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
              <span>स्याही और पन्ने • The Pinned Board</span>
            </div>

            <h2 className="text-4xl sm:text-6xl font-black font-serif text-white tracking-tight">
              Nocturnal Notes & Fragments
            </h2>

            <p 
              className="text-amber-200/70 font-serif italic text-base sm:text-xl mt-3 max-w-2xl"
              style={{ fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif" }}
            >
              "दीवार पर टंगे कुछ अधूरे अल्फ़ाज़, आधी रात की तन्हाई, और दिल से कागज़ तक का सफ़र..."
            </p>
          </div>

          {/* Cards Grid with Pinned Jaunty Angles */}
          <div className={`relative z-10 ${
            featuredFragments.length === 1 
              ? 'max-w-md mx-auto py-4' 
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 pt-4 pb-8'
          }`}>
            {featuredFragments.map((fragment, idx) => (
              <PinnedFragmentCard
                key={fragment.id}
                fragment={fragment}
                index={idx}
                rotationClass={rotationClasses[idx % rotationClasses.length]}
              />
            ))}
          </div>

          {/* Call to Action at Bottom of the Board */}
          <div className="relative z-10 flex items-center justify-center pt-8 border-t border-white/10 mt-6">
            <button
              onClick={() => onOpenUniverse && onOpenUniverse('fragments')}
              className="group flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-amber-200 text-xs sm:text-sm font-mono font-medium transition-all cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              <span>स्याही और पन्ने के सभी अल्फ़ाज़ देखें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

