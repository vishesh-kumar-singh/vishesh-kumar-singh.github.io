import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Copy, Share2, Check, MapPin, Clock, 
  Sparkles, Feather, Bookmark, MessageCircle
} from 'lucide-react';
import { initialFragments, THEME_STYLES } from './fragmentsData.js';
import { subscribeToStoryHearts, incrementStoryHearts } from './firebase.js';

function FragmentCard({ fragment, index }) {
  const [hearts, setHearts] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const theme = THEME_STYLES[fragment.cardTheme] || THEME_STYLES['velvet-slate'];
  const fragmentKey = `fragment_${fragment.id}`;

  useEffect(() => {
    // Check if user already liked this locally
    const liked = localStorage.getItem(`has_liked_${fragmentKey}`) === 'true';
    if (liked) setHasLiked(true);

    const unsubscribe = subscribeToStoryHearts(fragmentKey, (count) => {
      setHearts(count);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fragmentKey]);

  const handleHeartClick = async () => {
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

  const handleCopy = async () => {
    const fullText = `${formattedPoemText}\n\n— Vishesh Kumar Singh (${fragment.location} • ${fragment.time})\nhttps://vishesh-kumar-singh.github.io`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const handleShare = async () => {
    const fullText = `${formattedPoemText}\n\n— Vishesh Kumar Singh (${fragment.location} • ${fragment.time})`;
    const shareUrl = window.location.href;

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

    // WhatsApp Fallback
    const encoded = encodeURIComponent(`${fullText}\n\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative rounded-[28px] p-6 sm:p-8 border backdrop-blur-xl transition-all duration-500 overflow-hidden flex flex-col justify-between ${theme.card}`}
      style={{ backgroundImage: theme.paperTexture }}
    >
      {/* Decorative Washi Tape effect at top */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-28 h-3.5 border-b border-x rounded-b-md ${theme.tape} opacity-60 backdrop-blur-sm pointer-events-none`} />

      {/* Ambient background soft glow */}
      <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${theme.glow} blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700`} />

      <div>
        {/* Top Header Stamp & Tag */}
        <div className="flex items-center justify-between gap-3 mb-6 pt-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider border font-medium ${theme.tag}`}>
            <Feather className="w-3 h-3" />
            <span>{fragment.stamp || 'ख्याल'}</span>
          </span>

          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
            {fragment.tag}
          </span>
        </div>

        {/* Poetic Couplet Body */}
        <div className="relative py-2 px-1 my-3">
          {/* Subtle Decorative Opening Quotation Mark */}
          <span className="absolute -top-4 -left-2 text-4xl text-white/5 font-serif select-none pointer-events-none">
            “
          </span>

          <blockquote 
            className="text-lg sm:text-[22px] leading-[2.1] sm:leading-[2.35] text-slate-100 font-medium tracking-normal select-text space-y-1.5"
            style={{ fontFamily: "'Noto Serif Devanagari', 'Rozha One', serif" }}
          >
            {fragment.lines.map((line, lIdx) => (
              <p 
                key={lIdx} 
                className={`${lIdx % 2 === 1 ? 'pl-4 sm:pl-6 text-slate-200' : 'text-white'} transition-colors duration-300`}
              >
                {line}
              </p>
            ))}
          </blockquote>
        </div>
      </div>

      {/* Card Footer: Metadata & Micro-interactions */}
      <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Location & Time Stamp */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          <span>{fragment.location}</span>
          <span>•</span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{fragment.time}</span>
        </div>

        {/* Action Buttons: Hearts, Copy, Share */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Heart Button */}
          <button
            onClick={handleHeartClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all duration-300 active:scale-90 ${
              hasLiked 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                : 'bg-white/5 text-slate-300 border-white/10 hover:border-rose-400/40 hover:text-rose-300'
            }`}
            title="दाद दें / Heart this fragment"
          >
            <motion.div
              animate={isLiking ? { scale: [1, 1.45, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Heart 
                className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} 
              />
            </motion.div>
            <span className="font-bold">{hearts}</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="relative p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all active:scale-90"
            title="शेर कॉपी करें / Copy Sher"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}

            {/* Quick feedback tooltip */}
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -28, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none"
                >
                  कॉपी हो गया!
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Share as Card / WhatsApp Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all active:scale-90"
            title="शेयर करें / Share to WhatsApp / Instagram"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function FragmentsGrid() {
  const [selectedTag, setSelectedTag] = useState('All');

  const allTags = useMemo(() => {
    const set = new Set();
    initialFragments.forEach(item => {
      if (item.tag) set.add(item.tag);
    });
    return ['All', ...Array.from(set)];
  }, []);

  const filteredFragments = initialFragments.filter(item => {
    if (selectedTag === 'All') return true;
    return item.tag === selectedTag;
  });

  return (
    <div className="w-full">
      {/* Fragments Filter Pills (Only shown if multiple tags exist) */}
      {allTags.length > 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {tag === 'All' ? '✦ सभी ख्याल (All)' : `#${tag}`}
            </button>
          ))}
        </div>
      )}

      {/* Masonry / Responsive Postcard Grid */}
      <div className={filteredFragments.length === 1 ? "max-w-md mx-auto" : "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"}>
        <AnimatePresence mode="popLayout">
          {filteredFragments.map((fragment, idx) => (
            <FragmentCard key={fragment.id} fragment={fragment} index={idx} />
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Quill Signoff */}
      <div className="text-center pt-16 pb-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 px-4 py-1.5 rounded-full border border-white/5 bg-white/2">
          <Feather className="w-3.5 h-3.5 text-amber-400/80" />
          <span>स्याही सूखने से पहले लफ्ज़ कैद कर लिए...</span>
        </div>
      </div>
    </div>
  );
}

