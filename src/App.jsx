import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import Lenis from 'lenis';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Html } from '@react-three/drei';
import { Mail, FileText, Code2, User, ChevronRight, Brain, Cpu, Rocket, Terminal, Layers, Star, Award, Zap, BookOpen, Camera, X } from 'lucide-react';

// ==========================================
// 1. The Dive-In Hero (3D Network & Camera)
// ==========================================
function NetworkParticles() {
  const ref = useRef();
  
  // We need initial positions for the physics spring-back
  const [positions, initialPositions] = useMemo(() => {
    // Reduced particle count slightly to ensure 60fps with CPU physics
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const init = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      init[i * 3] = x; init[i * 3 + 1] = y; init[i * 3 + 2] = z;
    }
    return [pos, init];
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Slower rotation
    ref.current.rotation.x -= delta / 50;
    ref.current.rotation.y -= delta / 40;

    // Convert mouse to world position slightly in front of the camera
    const vec = new THREE.Vector3(state.mouse.x, state.mouse.y, 0.5);
    vec.unproject(state.camera);
    const dir = vec.sub(state.camera.position).normalize();
    const distance = 25; // 25 units in front of camera
    const cursorWorld = state.camera.position.clone().add(dir.multiplyScalar(distance));
    
    // Convert cursor world pos to local pos of the rotating particle group
    ref.current.worldToLocal(cursorWorld);
    
    const posArray = ref.current.geometry.attributes.position.array;
    
    // Forcefield parameters
    const forceRadius = 15;
    const forceRadiusSq = forceRadius * forceRadius;
    const repulsionStrength = 2.0;
    const springBack = 0.05;

    for (let i = 0; i < 5000; i++) {
        const i3 = i * 3;
        const px = posArray[i3];
        const py = posArray[i3 + 1];
        const pz = posArray[i3 + 2];
        
        const dx = px - cursorWorld.x;
        const dy = py - cursorWorld.y;
        const dz = pz - cursorWorld.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        
        // Repulse particles away from cursor
        if (distSq < forceRadiusSq) {
            const dist = Math.sqrt(distSq);
            const force = (forceRadius - dist) / forceRadius * repulsionStrength;
            posArray[i3] += (dx / dist) * force;
            posArray[i3 + 1] += (dy / dist) * force;
            posArray[i3 + 2] += (dz / dist) * force;
        }
        
        // Always spring back to initial position slowly
        posArray[i3] += (initialPositions[i3] - posArray[i3]) * springBack;
        posArray[i3 + 1] += (initialPositions[i3 + 1] - posArray[i3 + 1]) * springBack;
        posArray[i3 + 2] += (initialPositions[i3 + 2] - posArray[i3 + 2]) * springBack;
    }
    
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#8b5cf6" size={0.4} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
      </Points>
    </group>
  );
}

function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };
    
    const handleMouseOver = (e) => {
      if (e.target.tagName?.toLowerCase() === 'a' || e.target.tagName?.toLowerCase() === 'button' || e.target.closest('a') || e.target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none z-[9999] shadow-[0_0_15px_rgba(255,255,255,0.9)]"
        animate={{
          x: mousePosition.x - 6,
          y: mousePosition.y - 6,
          scale: isVisible ? (isHovering ? 0 : 1) : 0,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border-2 border-orange-400/90 rounded-full pointer-events-none z-[9998] bg-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.6)] backdrop-blur-[2px]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isVisible ? (isHovering ? 1.5 : 1) : 0.5,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 150, damping: 25, mass: 0.8 }}
      />
    </>
  );
}

function CameraController({ scrollYProgress }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Dive into the network from z=5 to z=-80 as you scroll down
    const z = THREE.MathUtils.lerp(5, -80, scrollYProgress.get());
    camera.position.z = z;
  });
  return null;
}

// ==========================================
// 2. Horizontal Timeline (Experience)
// ==========================================
const experiences = [
  {
    id: 1,
    title: "Undergrad Research Assistant",
    meta: "Jul'26 – Present | MILAP Lab, IITK",
    icon: <Brain className="w-8 h-8 text-purple-400" />,
    points: [
      "Formulated Anytime-Valid sequential tests to improve the efficiency of test-time alignment within the BoN framework, providing provable error guarantees for early stopping criteria.",
      "Paper submitted to ICLR 2027."
    ]
  },
  {
    id: 2,
    title: "Research Intern (SURGE)",
    meta: "May'26 – Jul'26 | MILAP Lab, IITK",
    icon: <Cpu className="w-8 h-8 text-blue-400" />,
    points: [
      "Exploited Best-of-N (BoN) strategies for test-time alignment in LLMs as an alternative to standard RLHF pipelines.",
      "Invented Reward Weighted Self Consistency improving performance over standard BoN by up to 10% and SPRT-RWSC for early stopping of candidates generation reducing budgets by up to 65%."
    ]
  },
  {
    id: 3,
    title: "RL Research Intern",
    meta: "Jun'26 – Aug'26 | Wadhwani School of AI and Intelligent Systems, IITK",
    icon: <Rocket className="w-8 h-8 text-emerald-400" />,
    points: [
      "Integrated missing NERO robot support in Robosuite for data collection to train baseline imitation learning policy.",
      "Implementing the Beyond Action Residuals framework in simulation using Robosuite for AgileX NERO arm.",
      "Handling the Sim-to-Real transition from trained simulation-based policy to the real NERO hardware."
    ]
  },
  {
    id: 4,
    title: "Coordinator",
    meta: "April'26 - Present | BCS Club, IITK",
    icon: <User className="w-8 h-8 text-orange-400" />,
    points: [
      "Leading a team of 30 secretaries for participation in competitions and handling events.",
      "Leading 1 competition (AIMO-Interpretability Challenge, NeurIPS 2026) with a total of 10 team members and managing a research project with 8 secretaries on the team."
    ]
  }
];

function ExperienceTimeline() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={targetRef} className="relative h-[400vh] z-10 pointer-events-none">
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden pointer-events-auto">
        
        {/* Glowing connecting line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_20px_rgba(139,92,246,0.8)]"
            style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
          />
        </div>

        <motion.div style={{ x }} className="flex gap-24 px-[20vw] relative z-20 items-center h-full">
          {experiences.map((exp) => (
            <motion.div 
              key={exp.id} 
              initial={{ rotateX: 90, opacity: 0, scale: 0.8 }}
              whileInView={{ rotateX: 0, opacity: 1, scale: 1 }}
              viewport={{ rootMargin: "-20%" }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              className="relative group w-[80vw] md:w-[45vw] lg:w-[35vw] flex-shrink-0 perspective-[1000px]"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative h-full bg-[#0a0a0a]/80 backdrop-blur-2xl border-2 border-slate-700/50 rounded-3xl p-8 md:p-10 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-slate-700 p-3 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  {exp.icon}
                </div>
                <h3 className="text-3xl font-black text-white mt-6 mb-2">{exp.title}</h3>
                <p className="text-purple-400 font-mono text-xs mb-8 tracking-wider uppercase">{exp.meta}</p>
                <div className="text-slate-300 leading-relaxed text-sm md:text-base text-justify space-y-4 font-light">
                  {exp.points.map((pt, i) => (
                    <p key={i}>
                      {pt.includes("Paper submitted") || pt.includes("exceeded") || pt.includes("Mean Score") ? 
                        <strong className="text-emerald-400 font-medium">{pt}</strong> : 
                        pt
                      }
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TerminalIntro() {
  const lines = [
    "> sys.boot() --verbose",
    "[INFO] Initializing quantum core...",
    "> mount /dev/mind /mnt/consciousness",
    "[OK] Synaptic pathways connected.",
    "> bypass --target=reality_constraints",
    "[WARN] Anomalous logic detected. Overriding...",
    "[OK] Override successful. Rendering 3D matrix...",
    "> execute vishesh.exe",
    "[INFO] Compiling thoughts into code...",
    "[OK] Environment stable."
  ];
  
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  
  useEffect(() => {
    if (isDone) return;
    
    if (currentLineIndex < lines.length) {
      const line = lines[currentLineIndex];
      
      if (currentCharIndex < line.length) {
        const timeout = setTimeout(() => {
          setCurrentCharIndex(prev => prev + 1);
        }, Math.random() * 30 + 15); // Fast typing speed
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setDisplayedLines(prev => [...prev, line]);
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, 300); // Pause between lines
        return () => clearTimeout(timeout);
      }
    } else {
      setIsDone(true);
    }
  }, [currentLineIndex, currentCharIndex, isDone, lines.length]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-[#050505]/80 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] text-left font-mono text-xs sm:text-sm z-20 pointer-events-auto">
      <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-700/50 flex gap-2 items-center">
        <div className="w-3 h-3 rounded-full bg-rose-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="ml-4 text-slate-500 text-xs flex items-center gap-2"><Terminal className="w-3 h-3" /> vishesh@iitk:~</span>
      </div>
      <div className="p-4 sm:p-6 text-emerald-400 min-h-[340px]">
        {displayedLines.map((line, i) => (
          <div key={i} className={`mb-1 ${line.startsWith("[") ? (line.includes("WARN") ? "text-yellow-400" : "text-blue-400") : ""}`}>{line}</div>
        ))}
        {!isDone && currentLineIndex < lines.length && (
          <div className="mb-1">
            <span className={lines[currentLineIndex].startsWith("[") ? (lines[currentLineIndex].includes("WARN") ? "text-yellow-400" : "text-blue-400") : ""}>
              {lines[currentLineIndex].substring(0, currentCharIndex)}
            </span>
            <span className="w-2 h-4 bg-emerald-400 inline-block align-middle ml-1 animate-pulse" />
          </div>
        )}
        {isDone && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-white mt-6 font-bold flex items-center gap-2"
          >
            <span className="text-emerald-400">$</span> System ready. Welcome to my digital space.
            <span className="w-2 h-4 bg-emerald-400 inline-block align-middle animate-pulse" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. Publications
// ==========================================
const publications = [
  {
    title: "Biological Memory Consolidation in SNNs",
    meta: "Revision 2 under review for Elsevier Neurocomputing",
    desc: "For mitigating catastrophic forgetting in SNNs, we introduce a Potentiation-Factor (P-Factor) to identify neural patterns responsible for predictions, enabling selective memory preservation during new task learning.",
    links: [
      { text: "Code", url: "https://github.com/vishesh-kumar-singh/Mimicking-Biological-Memory-Consolidation-in-SNNs" },
      { text: "Preprint", url: "https://doi.org/10.36227/techrxiv.177032973.30172948/v1" }
    ]
  }
];

function PublicationsSection() {
  return (
    <div className="relative w-full py-32 px-4 z-20 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-6 mb-16">
          <BookOpen className="w-12 h-12 text-blue-400" />
          <h2 className="text-5xl md:text-7xl font-black text-white text-center">
            Publications
          </h2>
        </div>

        <div className="flex justify-center">
          {publications.map((pub, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="bg-slate-900/50 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors max-w-3xl w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-2">{pub.title}</h3>
              <p className="text-purple-400 font-mono text-sm mb-6">{pub.meta}</p>
              <p className="text-slate-300 leading-relaxed mb-8">{pub.desc}</p>
              
              <div className="flex gap-4">
                {pub.links.map((link, j) => (
                  <a key={j} href={link.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-sm font-mono text-blue-300 transition-colors">
                    {link.text}
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. Achievements Grid (Mosaic Bento Box)
// ==========================================
const achievements = [
  { 
    title: "AIR 786 at JEE Advanced", 
    detail: "3rd in city, among 1.9 lakh shortlisted candidates.", 
    year: "2024", 
    icon: <Award className="text-yellow-400 w-8 h-8" />,
    className: "md:col-span-2 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:border-yellow-500/50"
  },
  { 
    title: "Samsung EnnovateX Hackathon", 
    detail: "Top 6 teams nationally out of 1000+ teams to qualify for pre-finals.", 
    year: "2026", 
    icon: <Cpu className="text-blue-400 w-8 h-8" />,
    className: "md:col-span-1 md:row-span-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/50 flex flex-col justify-center"
  },
  { 
    title: "InterIIT Techmeet 14.0", 
    detail: "Contingent member; IITK secured overall 2nd position.", 
    year: "2025", 
    icon: <Rocket className="text-purple-400 w-8 h-8" />,
    className: "md:col-span-1 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20 hover:border-purple-500/50"
  },
  { 
    title: "AIR 1904 at JEE Mains", 
    detail: "100%ile in Physics among 14 lakh students.", 
    year: "2024", 
    icon: <Zap className="text-emerald-400 w-8 h-8" />,
    className: "md:col-span-1 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 hover:border-emerald-500/50"
  },
  { 
    title: "Top 1% at NSEP", 
    detail: "One amongst 305 selected for INPhO out of 49,460 candidates.", 
    year: "2023", 
    icon: <Star className="text-orange-400 w-8 h-8" />,
    className: "md:col-span-1 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/50"
  },
  { 
    title: "Top 1% at NSEC", 
    detail: "One amongst 531 selected for INChO out of 44,363 candidates.", 
    year: "2023", 
    icon: <Star className="text-red-400 w-8 h-8" />,
    className: "md:col-span-2 bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20 hover:border-red-500/50"
  }
];

function FloatingAchievements() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Group achievements by year (Descending)
  const grouped = achievements.reduce((acc, ach) => {
    if (!acc[ach.year]) acc[ach.year] = [];
    acc[ach.year].push(ach);
    return acc;
  }, {});
  
  const years = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div ref={containerRef} className="relative w-full py-32 px-4 z-20 bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-32">
          <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Hall of Fame.
          </h2>
          <p className="text-xl text-slate-400 mt-4 font-mono">Milestones & Recognitions</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Background Track Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-slate-800/50 -translate-x-1/2 rounded-full" />
          
          {/* Animated Glowing Progress Line */}
          <motion.div 
            style={{ height: lineHeight }}
            className="absolute left-8 md:left-1/2 top-0 w-1 bg-gradient-to-b from-yellow-500 via-orange-500 to-rose-500 -translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
          />

          {years.map((year, yearIndex) => (
            <div key={year} className="mb-24 relative">
              {/* Year Marker */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-20%" }}
                className="absolute left-8 md:left-1/2 -translate-x-1/2 -top-6 z-10 bg-[#050505] border-2 border-orange-500 text-orange-400 font-bold px-6 py-2 rounded-full font-mono shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                {year}
              </motion.div>

              <div className="pt-12 space-y-12">
                {grouped[year].map((ach, i) => {
                  const isEven = i % 2 === 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: isEven ? -50 : 50, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                      className={`relative flex items-center w-full ${isEven ? 'md:justify-start' : 'md:justify-end'} justify-start`}
                    >
                      {/* Node Dot */}
                      <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-orange-500 -translate-x-1/2 shadow-[0_0_10px_rgba(249,115,22,0.8)] z-10" />

                      <div className={`w-full ml-16 md:ml-0 md:w-5/12 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                        <div className="h-full w-full backdrop-blur-xl border border-slate-700/50 p-6 md:p-8 rounded-[2rem] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] bg-[#0a0a0a]/60">
                          <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/50">
                              {ach.icon}
                            </div>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{ach.title}</h3>
                          <p className="text-slate-300 text-sm md:text-base leading-relaxed border-t border-slate-700/50 pt-4 font-light">
                            {ach.detail}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ==========================================
// 6. Life in Frames (Gallery)
// ==========================================
// Dynamically load all image paths from the Gallery folder at build/dev time.
// This allows you to just drop new images into public/Gallery and they will appear automatically!
const rawImages = import.meta.glob('/public/Gallery/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}');
const galleryImages = Object.keys(rawImages).map(path => path.replace('/public', ''));

function GallerySection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  
  useEffect(() => {
    // Pick 8 random images for a beautiful masonry layout
    const randomSubset = [...galleryImages].sort(() => 0.5 - Math.random()).slice(0, 8);
    setPreviewImages(randomSubset);
  }, []);

  // Ensure Lenis scroll is paused when modal opens
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isModalOpen]);

  return (
    <div className={`relative w-full py-32 px-4 bg-transparent border-t border-slate-800/50 ${isModalOpen ? 'z-50' : 'z-20'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Camera className="w-10 h-10 text-rose-400" />
            <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
              Life in Frames.
            </h2>
          </div>
          <p className="text-xl text-slate-400 font-mono">Moments captured along the journey</p>
        </div>

        {/* Pinterest-style Masonry Preview (Guarantees zero cropping and no awkward grid holes) */}
        <div className="columns-2 md:columns-4 gap-4 space-y-4 mb-12">
          {previewImages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="break-inside-avoid relative rounded-3xl overflow-hidden group cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <img 
                src={src} 
                alt="Gallery preview" 
                className="w-full h-auto rounded-3xl transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-500 flex items-center justify-center rounded-3xl">
                 {i === 0 && <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white font-bold tracking-widest uppercase shadow-black drop-shadow-md">View Gallery</span>}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative px-8 py-4 bg-[#0a0a0a] overflow-hidden rounded-full font-bold text-lg text-white border border-rose-500/50 hover:border-rose-400 transition-all shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-rose-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              Explore Full Gallery <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-7xl h-full bg-[#050505] rounded-3xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">All Captures</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 rounded-full bg-slate-900 hover:bg-rose-500 hover:text-white text-slate-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar" data-lenis-prevent="true">
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {galleryImages.map((src, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="break-inside-avoid relative rounded-xl overflow-hidden group mb-4"
                  >
                    <img 
                      src={src} 
                      alt={`Gallery item ${i}`}
                      className="w-full h-auto rounded-xl object-cover transform transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-300 rounded-xl" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Main App
// ==========================================
function App() {
  const container = useRef(null);
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      wheelMultiplier: 1.2,
    });
    
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.5]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.1], ["blur(0px)", "blur(20px)"]);

  return (
    <div ref={container} className="relative bg-[#020202] text-white selection:bg-purple-500/50 cursor-none">
      <CustomCursor />
      
      {/* 3D Canvas Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020202]">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <CameraController scrollYProgress={scrollYProgress} />
          <NetworkParticles />
        </Canvas>
      </div>

      {/* 1. Hero Section */}
      <section className="relative h-[150vh] w-full z-10 pointer-events-none">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur }}
          className="sticky top-0 h-screen flex flex-col items-center justify-start pt-16 lg:justify-center lg:pt-0 text-center px-4"
        >
          <div className="relative mb-12 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-3xl opacity-40 rounded-full animate-pulse" />
            <img src="/image.jpg" alt="Vishesh" className="relative w-48 h-48 rounded-full object-cover border-4 border-slate-700/50 shadow-2xl" />
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-4 leading-none">
            VISHESH <br/>
            KUMAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400">SINGH</span>
          </h1>

          {/* Classic View Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mb-8 pointer-events-auto z-50 mt-8"
          >
            <a href="/classic/index.html" className="px-8 py-3.5 bg-[#0a0a0a]/80 backdrop-blur-md border-2 border-emerald-500 rounded-full text-sm md:text-base font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.8)] transition-all duration-300 flex items-center gap-4 group">
              <span className="relative flex h-3 w-3 md:h-4 md:w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-emerald-500 group-hover:bg-white"></span>
              </span>
              Switch to Professional/Academic View
            </a>
          </motion.div>
          
          {/* <TerminalIntro /> */}

          {/* Scroll Indicator */}
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 2, duration: 1 }}
             className="mt-8 md:mt-16 flex flex-col items-center text-slate-400 font-mono text-xs animate-bounce pointer-events-none"
          >
             <span>Scroll to explore</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-slate-400 to-transparent mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Horizontal Timeline */}
      <ExperienceTimeline />

      {/* 3. Publications Section */}
      <PublicationsSection />

      {/* 5. Floating Achievements */}
      <FloatingAchievements />

      {/* 6. Gallery Section */}
      <GallerySection />

      {/* Footer */}
      <section className="relative z-20 bg-transparent py-40 px-4 flex flex-col items-center text-center border-t border-slate-800/50 backdrop-blur-sm">
        <h2 className="text-5xl md:text-8xl font-black mb-16 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
          Ready to Connect?
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6 mb-20">
          <a href="https://github.com/vishesh-kumar-singh" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-full border border-slate-700 hover:border-white hover:bg-white hover:text-black transition-all group">
            <Code2 className="w-6 h-6" /> <span className="font-bold">GitHub</span>
          </a>
          <a href="https://www.linkedin.com/in/thevishesh16" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-full border border-slate-700 hover:border-[#0a66c2] hover:bg-[#0a66c2] hover:text-white transition-all">
            <User className="w-6 h-6" /> <span className="font-bold">LinkedIn</span>
          </a>
          <a href="mailto:visheshk24@iitk.ac.in" className="flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-full border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
            <Mail className="w-6 h-6" /> <span className="font-bold">Email</span>
          </a>
          <a href="/CV.pdf" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-4 bg-slate-900 rounded-full border border-slate-700 hover:border-purple-500 hover:bg-purple-500 hover:text-white transition-all">
            <FileText className="w-6 h-6" /> <span className="font-bold">Resume</span>
          </a>
        </div>
      </section>
      
    </div>
  );
}

export default App;
