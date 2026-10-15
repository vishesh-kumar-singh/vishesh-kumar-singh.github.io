import React from 'react';

// Inline markdown parser: parses **bold**, *italic*, `code`, ~~strike~~, and [links](url)
export function renderInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  // Match bold/italic/code/strike/link tokens
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic: ***text***
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <strong key={index} className="font-extrabold italic text-white font-serif tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          {part.slice(3, -3)}
        </strong>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-extrabold text-white font-serif tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text* (avoids matching single * inside words like k*lled)
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.slice(1, -1).includes('*')) {
      return (
        <em key={index} className="italic text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs sm:text-sm text-purple-300">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <del key={index} className="line-through opacity-70">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, linkText, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target={url.startsWith('http') ? '_blank' : '_self'}
          rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
        >
          {linkText}
        </a>
      );
    }

    return part;
  });
}
