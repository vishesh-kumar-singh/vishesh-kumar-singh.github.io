/**
 * Fragments & Shayari Dataset ("स्याही और पन्ने")
 * Short 4-line couplets, deep musings, and nocturnal fragments.
 * You can add new shayaris here anytime!
 */
export const initialFragments = [
  {
    id: "dil-nikal",
    lines: [
      "सोचा था कि तुम्हें तो दिल निकाल के दे देंगे...",
      "तो संभाल के रखोगी तुम",
      "पर अब लगता है कि एक प्याले में आसु ही देदू...",
      "कम से कम तब तो शायद हसोगी तुम"
    ],
    location: "Kanpur",
    time: "02:21 AM",
    date: "23 Nov 2026",
    tag: "अल्फ़ाज़",
    cardTheme: "velvet-slate",
    stamp: "शेर • ०१"
  },
  {
    id: "jee-bhar-ke-nihaar",
    lines: [
      "हाँ... बुरा लगता है कि कभी तुम्हें मैं पा न पाया...",
      "जितना चाहता था, कभी उतना हँसा न पाया...",
      "वक्त कम था हमारे पास, मगर प्यार में डूब जाने को शायद काफी था...",
      "दुःख तो इस बात का है, कि कभी तुम्हें जी भर के निहार न पाया..."
    ],
    location: "Kanpur",
    time: "05:53 AM",
    date: "25 Nov 2026",
    tag: "शिकवे",
    cardTheme: "rose-dust",
    stamp: "शेर • ०२"
  },
  {
    id: "bhagwan-lalkaar",
    lines: [
      "मैं नहीं मानता भगवान में, फिर भी उसे एक दिन याद किया था...",
      "कुछ खो जाने पे, उसी से फ़रियाद किया था...",
      "उसे रोक लो तुम, मैं पूजा करूँगा तुम्हारी...",
      "वो न मानी, तो मैंने उस दिन, भगवान को भी मुझसे लड़ने को ललकार दिया था..."
    ],
    location: "Kanpur",
    time: "06:08 AM",
    date: "25 Nov 2026",
    tag: "फरियाद",
    cardTheme: "vintage-parchment",
    stamp: "शेर • ०३"
  },
  {
    id: "tumhe-hi-banata",
    lines: [
      "माना अभी भी तुम्हें बहुत सताता हूँ मैं...",
      "नींद नहीं तो तुम्हारे पास ही तो आता हूँ मैं...",
      "मेरे दिन के सपनों में, या किताब के इन पन्नों में,",
      "आज भी कलम उठाता हूँ तो, तुम्हें ही बनाता हूँ मैं..."
    ],
    location: "Kanpur",
    time: "06:25 AM",
    date: "25 Nov 2026",
    tag: "स्याही",
    cardTheme: "midnight-ink",
    stamp: "शेर • ०४"
  }
];

export const THEME_STYLES = {
  'velvet-slate': {
    card: 'bg-gradient-to-b from-[#14121d] via-[#0d0c15] to-[#07060b] border-purple-500/20 hover:border-purple-400/50 shadow-[0_4px_30px_rgba(168,85,247,0.08)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.22)]',
    tag: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    accentText: 'text-purple-400',
    glow: 'from-purple-600/15 via-rose-600/5 to-transparent',
    tape: 'bg-purple-900/30 border-purple-500/20',
    pin: 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-indigo-600 shadow-[0_2px_8px_rgba(168,85,247,0.6)]',
    paperTexture: 'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
  },
  'vintage-parchment': {
    card: 'bg-gradient-to-b from-[#19140e] via-[#120e09] to-[#090704] border-amber-600/25 hover:border-amber-500/50 shadow-[0_4px_30px_rgba(245,158,11,0.08)] hover:shadow-[0_10px_40px_rgba(245,158,11,0.22)]',
    tag: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    accentText: 'text-amber-400',
    glow: 'from-amber-600/15 via-orange-600/5 to-transparent',
    tape: 'bg-amber-900/30 border-amber-500/20',
    pin: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.6)]',
    paperTexture: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)'
  },
  'midnight-ink': {
    card: 'bg-gradient-to-b from-[#0f1728] via-[#090f1c] to-[#050810] border-blue-500/25 hover:border-blue-400/50 shadow-[0_4px_30px_rgba(59,130,246,0.08)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.22)]',
    tag: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    accentText: 'text-blue-400',
    glow: 'from-blue-600/15 via-indigo-600/5 to-transparent',
    tape: 'bg-blue-900/30 border-blue-500/20',
    pin: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-[0_2px_8px_rgba(59,130,246,0.6)]',
    paperTexture: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)'
  },
  'rose-dust': {
    card: 'bg-gradient-to-b from-[#1e1017] via-[#140a0f] to-[#0a0407] border-rose-500/25 hover:border-rose-400/50 shadow-[0_4px_30px_rgba(244,63,94,0.08)] hover:shadow-[0_10px_40px_rgba(244,63,94,0.22)]',
    tag: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    accentText: 'text-rose-400',
    glow: 'from-rose-600/15 via-pink-600/5 to-transparent',
    tape: 'bg-rose-900/30 border-rose-500/20',
    pin: 'bg-gradient-to-br from-rose-400 via-pink-500 to-rose-700 shadow-[0_2px_8px_rgba(244,63,94,0.6)]',
    paperTexture: 'radial-gradient(ellipse at 50% 0%, rgba(244, 63, 94, 0.08) 0%, transparent 70%)'
  }
};

