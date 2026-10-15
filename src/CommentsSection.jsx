import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Heart, Send, Sparkles, User, Clock, 
  CheckCircle2, ShieldCheck, Lock, Unlock, EyeOff, 
  Trash2, CornerDownRight, X, ExternalLink
} from 'lucide-react';
import { 
  subscribeToStoryComments, postStoryComment, 
  likeStoryComment, deleteStoryComment, 
  toggleHideComment, postStoryReply, deleteStoryReply 
} from './firebase.js';
import { isAuthorLoggedIn, logoutAuthor } from './auth.js';

// Format timestamp into clean relative or absolute string
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Generate deterministic avatar gradient from name
const AVATAR_GRADIENTS = [
  'from-rose-500 to-purple-600',
  'from-purple-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export default function CommentsSection({ storySlug, storyTitle = 'Story', atmosphere = 'midnight' }) {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAuthorLoggedIn());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  // Author inline reply state
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [likedComments, setLikedComments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`liked_comments_${storySlug}`) || '[]');
    } catch (e) {
      return [];
    }
  });

  // Listen for author login/logout events across the window
  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdmin(isAuthorLoggedIn());
    };
    window.addEventListener('author-auth-change', handleAuthChange);
    return () => window.removeEventListener('author-auth-change', handleAuthChange);
  }, []);

  // Check URL query parameters for ?admin=true or ?admin=1 or #admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || params.get('admin') === '1' || window.location.hash === '#admin') {
        setIsAdminModalOpen(true);
      }
    }
  }, []);

  // Subscribe to live comments
  useEffect(() => {
    if (!storySlug) return;
    const unsubscribe = subscribeToStoryComments(storySlug, (updatedComments) => {
      // Ensure only real reader comments are displayed
      const clean = (updatedComments || []).filter(
        c => c.id !== 'welcome_1' && c.name !== 'Fellow Wanderer'
      );
      setComments(clean);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [storySlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await postStoryComment(storySlug, {
        name: isAdmin ? 'Vishesh Kumar Singh' : (name.trim() || 'Anonymous Reader'),
        text: text.trim(),
        isAuthor: isAdmin
      });
      if (created) {
        setComments(prev => {
          if (prev.some(c => c.id === created.id)) return prev;
          return [created, ...prev];
        });
      }
      setText('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (likedComments.includes(commentId)) return; // already liked locally

    // Optimistic UI update
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c)
    );

    const updated = [...likedComments, commentId];
    setLikedComments(updated);
    try {
      localStorage.setItem(`liked_comments_${storySlug}`, JSON.stringify(updated));
    } catch (e) {}

    await likeStoryComment(storySlug, commentId);
  };

  // Author inline moderation actions
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Permanently delete this comment?")) return;
    setComments(prev => prev.filter(c => c.id !== commentId));
    await deleteStoryComment(storySlug, commentId);
  };

  const handleToggleHide = async (commentId, currentHidden) => {
    setComments(prev =>
      prev.map(c => c.id === commentId ? { ...c, hidden: !currentHidden } : c)
    );
    await toggleHideComment(storySlug, commentId, !currentHidden);
  };

  const handleSendAuthorReply = async (commentId) => {
    if (!replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      const newReply = await postStoryReply(storySlug, commentId, {
        name: 'Vishesh Kumar Singh',
        text: replyText.trim(),
        isAuthor: true
      });
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            const replies = c.replies || [];
            return { ...c, replies: [...replies, newReply] };
          }
          return c;
        })
      );
      setReplyText('');
      setReplyingCommentId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm("Delete this author reply?")) return;
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) };
        }
        return c;
      })
    );
    await deleteStoryReply(storySlug, commentId, replyId);
  };

  // Atmosphere styling adaptations
  const isSepia = atmosphere === 'sepia';
  const isRose = atmosphere === 'rose';

  const cardBg = isSepia 
    ? 'bg-[#181512]/80 border-[#3a3025]' 
    : isRose 
      ? 'bg-[#160c16]/80 border-rose-900/30' 
      : 'bg-[#0b0e18]/80 border-white/10';

  const inputBg = isSepia
    ? 'bg-[#221c16]/90 border-[#4a3f32] focus:border-[#d4a373] text-[#f7ede2]'
    : isRose
      ? 'bg-rose-950/20 border-rose-900/40 focus:border-rose-500 text-rose-100'
      : 'bg-white/5 border-white/10 focus:border-purple-500 text-slate-100';

  const accentButton = isSepia
    ? 'bg-gradient-to-r from-[#b07d4b] to-[#8c5e34] hover:from-[#c28c55] hover:to-[#9d6c3e]'
    : isRose
      ? 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 shadow-rose-500/25'
      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/25';

  // Filter visible comments: if author, show all (with hidden tags); if reader, hide comments with hidden === true
  const displayedComments = isAdmin
    ? comments
    : comments.filter(c => !c.hidden);

  return (
    <section className="mt-20 pt-16 border-t border-white/10" id="comments">
      {/* Author Active Banner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <img
              src="/image.jpg"
              alt="Vishesh"
              className="w-8 h-8 rounded-full object-cover border border-purple-400"
            />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Author Mode Active</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Vishesh Kumar Singh
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                You can moderate, delete, or reply with verified author status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-mono text-purple-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Admin Space</span>
            </a>
            <button
              onClick={() => {
                logoutAuthor();
                setIsAdmin(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-mono text-rose-300 transition-colors cursor-pointer"
            >
              Exit Mode
            </button>
          </div>
        </motion.div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Echoes & Reflections</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-serif font-black text-white tracking-tight">
            Reader Thoughts
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-purple-300">
            {displayedComments.length} {displayedComments.length === 1 ? 'Thought' : 'Thoughts'}
          </span>
        </div>
      </div>

      {/* New Comment Submission Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl ${cardBg} mb-12 shadow-xl relative overflow-hidden`}>
        {/* Ambient Corner Glow */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              {isAdmin ? (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-white text-sm font-sans">
                  <img src="/image.jpg" alt="Vishesh" className="w-5 h-5 rounded-full object-cover border border-purple-400" />
                  <span className="font-semibold">Vishesh Kumar Singh</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Author
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or alias (optional)"
                  maxLength={40}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-sans placeholder-slate-500 outline-none transition-all ${inputBg}`}
                />
              )}
            </div>
            <div className="text-xs font-mono text-slate-500 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Visible to readers</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isAdmin ? "Write an author reflection or response..." : "Leave a reflection, memory, or note for Vishesh..."}
              rows={3}
              maxLength={600}
              required
              className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-serif leading-relaxed placeholder-slate-500 outline-none resize-none transition-all ${inputBg}`}
            />
            <div className="absolute right-3 bottom-3 text-[11px] font-mono text-slate-500">
              {text.length}/600
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <div className="flex items-center gap-3 justify-end">
              <AnimatePresence>
                {justSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1 text-xs font-mono text-emerald-400"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Thought posted!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={!text.trim() || isSubmitting}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${accentButton}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <span>{isAdmin ? 'Post as Author' : 'Post Thought'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Comments Feed List */}
      <div className="space-y-5">
        {displayedComments.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center backdrop-blur-md ${cardBg}`}>
            <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
            <h4 className="font-serif text-lg font-bold text-slate-200 mb-1">The Silence is Waiting</h4>
            <p className="text-sm font-serif italic text-slate-400 max-w-sm mx-auto">
              Be the first to leave an echo or reflection on this story.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayedComments.map((comment, index) => {
              const initial = (comment.name || 'A').trim().charAt(0).toUpperCase();
              const isLiked = likedComments.includes(comment.id);
              const isCommentAuthor = Boolean(comment.isAuthor) || (comment.name || '').toLowerCase().includes('vishesh');

              return (
                <motion.div
                  key={comment.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className={`p-6 sm:p-7 rounded-3xl border backdrop-blur-xl transition-all ${cardBg} ${
                    comment.hidden
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : isCommentAuthor
                        ? 'border-purple-500/40 bg-purple-950/15 shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                        : 'hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Author & Meta */}
                    <div className="flex items-center gap-3">
                      {isCommentAuthor ? (
                        <img
                          src="/image.jpg"
                          alt="Vishesh"
                          className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(comment.name)} flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
                          {initial}
                        </div>
                      )}

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-white">
                            {comment.name || 'Anonymous Reader'}
                          </span>
                          {isCommentAuthor && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-500/50 text-[10px] font-mono text-purple-200">
                              Author ✦
                            </span>
                          )}
                          {comment.hidden && isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono text-rose-300">
                              Hidden from Readers
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatRelativeTime(comment.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Upvote / Like Button & Author Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-all group ${
                          isLiked
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                            : 'bg-white/5 border-white/10 hover:border-white/25 text-slate-400 hover:text-white'
                        }`}
                        title={isLiked ? 'Loved' : 'Send Love'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform group-hover:scale-125 ${
                            isLiked
                              ? 'text-rose-400 fill-rose-500'
                              : 'text-slate-400 group-hover:text-rose-400'
                          }`}
                        />
                        <span>{comment.likes || 0}</span>
                      </button>

                      {/* Author In-Line Moderation Controls */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                          <button
                            onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-mono transition-colors"
                            title="Reply as author"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleHide(comment.id, comment.hidden)}
                            className={`p-1.5 rounded-lg text-xs font-mono transition-colors ${
                              comment.hidden
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title={comment.hidden ? "Unhide comment" : "Hide comment from readers"}
                          >
                            {comment.hidden ? <Unlock className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Body */}
                  <div className="mt-4 pl-13 sm:pl-13 text-slate-200 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {comment.text}
                  </div>

                  {/* Nested Author Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 sm:pl-13 space-y-3">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start justify-between gap-3 shadow-inner"
                        >
                          <div className="flex items-start gap-2.5">
                            <img
                              src="/image.jpg"
                              alt="Vishesh"
                              className="w-7 h-7 rounded-full object-cover border border-purple-400 mt-0.5 flex-shrink-0"
                            />
                            <div>
                              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                <span>Vishesh Kumar Singh</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-200">
                                  Author ✦
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  • {formatRelativeTime(reply.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm font-serif italic text-white/95 mt-1 leading-relaxed">
                                "{reply.text}"
                              </p>
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteReply(comment.id, reply.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Delete reply"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Author Reply Form */}
                  {isAdmin && replyingCommentId === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pl-6 sm:pl-13 pt-3 border-t border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2 text-xs font-mono text-purple-300">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Replying as Vishesh Kumar Singh (Author)</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write reply to this reader..."
                          rows={2}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-purple-500/40 focus:border-purple-400 focus:outline-none text-white text-sm"
                        />
                        <button
                          onClick={() => handleSendAuthorReply(comment.id)}
                          disabled={isSendingReply || !replyText.trim()}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingReply ? '...' : 'Send'}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
