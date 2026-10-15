import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, CheckCircle2, AlertCircle, Mail, Sparkles } from 'lucide-react';

export default function SendMessageModal({ isOpen, onClose, storyTitle = 'HER' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Web3Forms Access Key (read from environment variable)
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    setErrorMessage('');

    // If an access key is configured, submit via Web3Forms API
    if (accessKey) {
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            access_key: accessKey,
            subject: `Thought on "${storyTitle}" from ${name.trim() || 'A Reader'}`,
            from_name: name.trim() || 'A Reader of your Personal Page',
            email: email.trim() || 'no-reply@vishesh.blog',
            story: storyTitle,
            message: message.trim(),
            source: window.location.href,
          })
        });

        const data = await response.json();
        if (data.success) {
          setStatus('success');
          setTimeout(() => {
            handleReset();
            onClose();
          }, 2500);
          return;
        } else {
          throw new Error(data.message || 'Submission failed');
        }
      } catch (err) {
        console.warn('Direct submission error:', err);
        setStatus('error');
        setErrorMessage('Could not send directly. Please verify your connection or use your mail app below.');
      }
    } else {
      // Direct API key not provided yet: Inform user clearly instead of abruptly opening mail client
      setStatus('error');
      setErrorMessage(
        'Direct in-page delivery requires your free Web3Forms access key. Please paste it into .env (or SendMessageModal.jsx), or click below to send via your mail app!'
      );
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMessage('');
    setStatus('idle');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-[#0e111a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Ambient Background Orb */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-300 mb-3">
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>Private Reader Note</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Send a thought on "{storyTitle}"
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-serif italic mt-1">
              Delivered straight to Vishesh's inbox.
            </p>
          </div>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center text-center space-y-4"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
              <h4 className="text-xl font-serif font-bold text-white">Thought Sent!</h4>
              <p className="text-sm font-serif italic text-slate-300 max-w-sm">
                Thank you for taking the time to share your heart. Your note is on its way to Vishesh.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Your Name / Pen Name <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous or your name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/50 focus:bg-white/10 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Your Email <span className="text-slate-500">(Optional, if you'd like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Your Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a memory, reaction, or words from the heart..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500/50 focus:bg-white/10 transition-all font-serif resize-none"
                />
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`mailto:visheshk24@iitk.ac.in?subject=Regarding%20'${encodeURIComponent(storyTitle)}'&body=${encodeURIComponent(message)}`}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Or open in mail client</span>
                </a>

                <button
                  type="submit"
                  disabled={status === 'sending' || !message.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{status === 'sending' ? 'Sending...' : 'Send Note'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
