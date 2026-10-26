// Automatically discover all markdown blogs in the blogs directory
const blogModules = import.meta.glob('../blogs/*.md', { query: '?raw', import: 'default', eager: true });

export function getAllBlogs() {
  const blogs = [];
  for (const [path, rawContent] of Object.entries(blogModules)) {
    const fileName = path.split('/').pop().replace(/\.md$/i, '');
    const slug = fileName.toLowerCase();
    const parsed = parseBlog(rawContent);
    blogs.push({
      slug,
      fileName,
      path,
      rawContent,
      metadata: {
        ...parsed.metadata,
        title: parsed.metadata.title || fileName,
      },
      blocks: parsed.blocks,
      readTimeMinutes: parsed.readTimeMinutes,
    });
  }

  // Sort articles alphabetically by their title (case-insensitive)
  blogs.sort((a, b) => {
    const titleA = (a.metadata.title || a.fileName || '').trim().replace(/^["'“‘\s]+/, '');
    const titleB = (b.metadata.title || b.fileName || '').trim().replace(/^["'“‘\s]+/, '');
    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
  });

  return blogs;
}

export function getFeaturedBlogs(limit = 2) {
  const all = getAllBlogs();
  const explicitFeatured = all.filter((b) => b.metadata.featured);
  if (explicitFeatured.length >= limit) {
    return explicitFeatured.slice(0, limit);
  }
  const remaining = all.filter((b) => !b.metadata.featured);
  return [...explicitFeatured, ...remaining].slice(0, limit);
}

export function getBlogBySlug(slug) {
  const blogs = getAllBlogs();
  if (!slug) return blogs[0] || null;
  const target = slug.toLowerCase();
  return blogs.find((b) => b.slug === target) || blogs.find((b) => b.fileName.toLowerCase() === target) || blogs[0] || null;
}

export function parseBlog(rawMarkdown) {
  if (!rawMarkdown) {
    return {
      metadata: {},
      blocks: [],
      rawContent: '',
      wordCount: 0,
      readTimeMinutes: 1,
    };
  }

  // Extract frontmatter between --- and ---
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = rawMarkdown.match(frontmatterRegex);

  let yamlBlock = '';
  let content = rawMarkdown.trim();

  if (match) {
    yamlBlock = match[1];
    content = match[2].trim();
  }

  const metadata = {
    title: '',
    subtitle: '',
    description: '',
    badge: '',
    date: '',
    location: '',
    featured: false,
    featuredQuote: '',
    authorNote: '',
    theme: '',
    tags: [],
  };

  let currentKey = null;

  yamlBlock.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // YAML list item: - value
    if (trimmed.startsWith('-') && currentKey) {
      const val = trimmed.replace(/^-\s*/, '').replace(/^["']|["']$/g, '');
      if (Array.isArray(metadata[currentKey])) {
        metadata[currentKey].push(val);
      } else {
        metadata[currentKey] = [val];
      }
      return;
    }

    // YAML key: value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      let key = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();

      // Normalize common key variants
      if (key === 'authorsNote' || key === 'author_note') key = 'authorNote';
      if (key === 'featured_quote') key = 'featuredQuote';
      if (key.toLowerCase() === 'theme' || key.toLowerCase() === 'atmosphere') {
        key = 'theme';
      }

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key === 'featured') {
        metadata.featured = value.toLowerCase() === 'true';
        currentKey = key;
        return;
      }

      if (key === 'draft') {
        metadata.draft = value.toLowerCase() === 'true';
        currentKey = key;
        return;
      }

      if (value === '') {
        metadata[key] = [];
        currentKey = key;
      } else {
        metadata[key] = value;
        currentKey = key;
      }
    }
  });

  // Parse markdown content into structured blocks
  const rawBlocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let isFirstParagraph = true;

  const blocks = rawBlocks.map((block) => {
    // Check for divider: --- or *** or ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(block)) {
      return { type: 'divider' };
    }

    // Check for Code block: ```lang ... ```
    if (block.startsWith('```') && block.endsWith('```')) {
      const firstLineEnd = block.indexOf('\n');
      const lang = firstLineEnd > -1 ? block.slice(3, firstLineEnd).trim() : '';
      const code = firstLineEnd > -1 ? block.slice(firstLineEnd + 1, -3).trim() : block.slice(3, -3).trim();
      return { type: 'code', lang, code };
    }

    // Check for blockquote or callout: starts with >
    if (block.startsWith('>')) {
      const matchCallout = block.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|INFO)\]\s*\n?([\s\S]*)$/i);
      if (matchCallout) {
        const calloutType = matchCallout[1].toLowerCase();
        const calloutText = matchCallout[2].split('\n').map((l) => l.replace(/^>\s?/, '')).join(' ').trim();
        return { type: 'callout', calloutType, text: calloutText };
      }
      const quoteText = block
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ')
        .trim();
      return { type: 'quote', text: quoteText };
    }

    // Check for Heading 2: ##
    if (block.startsWith('## ')) {
      return { type: 'h2', text: block.replace(/^##\s+/, '') };
    }

    // Check for Heading 3: ###
    if (block.startsWith('### ')) {
      return { type: 'h3', text: block.replace(/^###\s+/, '') };
    }

    // Check for Lists: lines starting with - / * or 1.
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
    const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l));
    if (isBulletList) {
      return {
        type: 'list',
        ordered: false,
        items: lines.map((l) => l.replace(/^[-*]\s+/, '')),
      };
    }
    if (isNumberedList) {
      return {
        type: 'list',
        ordered: true,
        items: lines.map((l) => l.replace(/^\d+\.\s+/, '')),
      };
    }

    // Check for Markdown Image: ![alt](url)
    const imgMatch = block.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/);
    if (imgMatch) {
      let src = imgMatch[2].trim();
      // Normalize relative image paths to root-relative public path
      if (src.startsWith('blogs/')) src = '/' + src;
      else if (src.startsWith('./Images/')) src = '/blogs/Images/' + src.slice(9);
      else if (src.startsWith('Images/')) src = '/blogs/Images/' + src.slice(7);
      return {
        type: 'image',
        alt: imgMatch[1].trim(),
        src: src,
        caption: (imgMatch[3] || imgMatch[1] || '').trim(),
      };
    }

    // Regular paragraph
    const dropCap = isFirstParagraph;
    if (isFirstParagraph) isFirstParagraph = false;

    return { type: 'paragraph', text: block, dropCap };
  });

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // If no description was provided, automatically use the first paragraph
  if (!metadata.description) {
    const firstP = blocks.find((b) => b.type === 'paragraph');
    if (firstP) {
      metadata.description =
        firstP.text.length > 200 ? firstP.text.slice(0, 200).trim() + '...' : firstP.text;
    }
  }

  return {
    metadata,
    blocks,
    rawContent: content,
    wordCount,
    readTimeMinutes,
  };
}
