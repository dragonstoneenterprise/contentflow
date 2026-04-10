"use client";
import "./globals.css";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface GeneratedContent {
  blog: string;
  tweets: string[];
  shorts: string;
}

interface IdeaItem {
  id: number;
  idea: string;
  category: "Revenue" | "Growth" | "Product" | "Content" | "Operations" | "Learning" | "Marketing" | "Strategy" | "Other";
  impact: number;
  effort: number;
  urgency: number;
  confidence: number;
  priority_score: number;
  next_step: string;
  why: string;
}

interface ExtractedIdeas {
  title: string;
  ideas: IdeaItem[];
  quick_wins: string[];
  summary: string;
}

const ZapIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const LoaderIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 animate-spin ${className}`}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const CATEGORY_ICONS: Record<string, string> = {
  Revenue: "💰", Growth: "📈", Product: "🛠", Content: "📝", Operations: "⚙️", Learning: "📚",
};

const YOUTUBE_VIDEO_ID = "YOUR_VIDEO_ID_HERE"; // Replace with your YouTube video ID

const testimonials = [
  { name: "Sarah K.", role: "Podcast Host", text: "I used to spend 3 hours turning each episode into content. Now it takes 2 minutes. Snipflow is insane." },
  { name: "Marcus T.", role: "Content Creator", text: "The game plan feature is what sold me. It doesn't just repurpose — it tells me exactly what to do next." },
  { name: "Priya M.", role: "Marketing Lead", text: "We onboard every new podcast guest and turn their interview into a full content week. Game changer." },
  { name: "James R.", role: "YouTuber", text: "Blog post, tweet thread, and Shorts script in under 2 minutes. I've 10x'd my output without working harder." },
  { name: "Anika P.", role: "Founder", text: "The idea extractor is brilliant. It pulls insights I didn't even know were in my own content." },
  { name: "David L.", role: "Agency Owner", text: "We use Snipflow for every client. What used to take a day now takes 10 minutes per podcast episode." },
];

export default function Home() {
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authTrigger, setAuthTrigger] = useState<'signin' | 'limit_reached' | null>(null);

  // App state
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [extractedIdeas, setExtractedIdeas] = useState<ExtractedIdeas | null>(null);
  const [activeTab, setActiveTab] = useState<"blog" | "tweets" | "shorts" | "ideas">("blog");
  const [copied, setCopied] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"repurpose" | "extract">("repurpose");
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [isExtractingIdeas, setIsExtractingIdeas] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan, daily_usage, last_reset")
          .eq("id", user.id)
          .single();
        if (profile) {
          setPlan(profile.plan);
          const today = new Date().toISOString().split("T")[0];
          const usage = profile.last_reset === today ? profile.daily_usage : 0;
          const limit = profile.plan === "pro" ? 999999 : 7;
          setRemaining(Math.max(0, limit - usage));
        }
      }
      setAuthLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRemaining(null);
        setPlan("free");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showAuthModal && authTrigger === 'limit_reached') {
      setAuthMode('login');
    }
  }, [showAuthModal, authTrigger]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setAuthError(error.message);
  };

  const handleEmailAuth = async () => {
    setAuthError(null);
    setPasswordError(null);
    if (authPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setEmailConfirmSent(true);
        setAuthError(null);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Please confirm your email address to sign in.");
          }
          throw error;
        }
        setShowAuthModal(false);
        window.location.reload();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setAuthError(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRemaining(null);
    setGeneratedContent(null);
    setExtractedIdeas(null);
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) { setError("Please paste content first"); return; }
    if (!user) {
      let guestUses = parseInt(localStorage.getItem("guest_uses") || "0");
      if (guestUses >= 7) { setAuthTrigger('limit_reached'); setShowAuthModal(true); return; }
      localStorage.setItem("guest_uses", (guestUses + 1).toString());
    }
    if (remaining !== null && remaining <= 0 && plan === "free") {
      setError("Daily limit reached. Upgrade to Pro for unlimited.");
      return;
    }
    setError(null);

    if (mode === "repurpose") {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed");
        setGeneratedContent(data);
        setActiveTab("blog");
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.plan) setPlan(data.plan);
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to generate content.";
        setError(message);
      } finally {
        setIsGenerating(false);
      }
    } else {
      setIsExtractingIdeas(true);
      try {
        const res = await fetch("/api/extract-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: transcript }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");
        setExtractedIdeas(data);
        setActiveTab("ideas");
        setCompletedIds(new Set());
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.plan) setPlan(data.plan);
        setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to extract ideas.";
        setError(message);
      } finally {
        setIsExtractingIdeas(false);
      }
    }
  };

  const toggleComplete = (id: number) => {
    const next = new Set(completedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompletedIds(next);
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyIdeasAsText = () => {
    if (!extractedIdeas) return;
    const text = extractedIdeas.ideas.map((idea, i) =>
      `#${i + 1} [${idea.category}] (Score: ${idea.priority_score})\n${idea.idea}\nWhy: ${idea.why}\nNext step: ${idea.next_step}\n`
    ).join("\n");
    copyToClipboard(`${extractedIdeas.title}\n\n${text}\nQuick Wins:\n${extractedIdeas.quick_wins.map(w => `• ${w}`).join("\n")}`, "all-ideas");
  };

  const isLoading = isGenerating || isExtractingIdeas;
  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  const ScoreBar = ({ value, max = 10, color }: { value: number; max?: number; color: string }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 w-3">{value}</span>
    </div>
  );

  const repurposeTabData = [
    { key: "blog" as const, label: "Blog Post", icon: "📝" },
    { key: "tweets" as const, label: "Thread", icon: "🐦" },
    { key: "shorts" as const, label: "Shorts", icon: "🎬" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .hero-title { font-family: 'Syne', sans-serif; }
        .glow-amber { box-shadow: 0 0 40px rgba(245, 158, 11, 0.15); }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); border-color: rgba(245, 158, 11, 0.3); }
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .scroll-left { animation: scroll-left 40s linear infinite; }
        .scroll-right { animation: scroll-right 35s linear infinite; }
        .scroll-left:hover, .scroll-right:hover { animation-play-state: paused; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease forwards; }
        .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.2s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.3s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.4s; opacity: 0; }
        .gradient-text {
          background: linear-gradient(135deg, #f59e0b, #f97316, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-blur {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .video-overlay {
          background: linear-gradient(to bottom, rgba(8,8,8,0.3), rgba(8,8,8,0.1));
        }
      `}</style>

      {/* ─── AMBIENT BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-white/[0.06]" style={{ background: 'rgba(8,8,8,0.85)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ZapIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight hero-title">Snipflow</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Pricing"].map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                {link}
              </a>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {plan === "pro" && <span className="text-xs font-mono text-amber-500 hidden sm:block">Pro ✦</span>}
                {plan === "free" && remaining !== null && (
                  <span className="text-xs font-mono text-zinc-500 hidden sm:block">{remaining} left today</span>
                )}
                {plan === "free" && (
                  <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer"
                    className="hidden sm:block px-4 py-1.5 text-sm font-semibold text-amber-400 border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all">
                    Go Pro
                  </a>
                )}
                <button onClick={signOut} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setAuthTrigger('signin'); setShowAuthModal(true); }}
                  className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
                  Sign in
                </button>
                <button onClick={() => { setAuthTrigger('signin'); setShowAuthModal(true); }}
                  className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-full transition-all">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-5 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs font-mono text-amber-400 mb-8 fade-up fade-up-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-powered content repurposing
          </div>

          <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] mb-6 fade-up fade-up-2">
            One transcript.<br />
            <span className="gradient-text">Endless content.</span><br />
            A game plan to execute.
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed fade-up fade-up-3">
            Paste any podcast, video, or voice memo. Get a publish-ready blog post, tweet thread, and Shorts script — plus a prioritized action plan so you know exactly what to do next.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 fade-up fade-up-4">
            <button
              onClick={() => appRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40">
              Try Free — No Sign In Required
            </button>
            <button
              onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-semibold rounded-full transition-all text-sm flex items-center gap-2">
              <PlayIcon />
              Watch Demo
            </button>
          </div>

          <p className="text-xs text-zinc-600 fade-up fade-up-4">Trusted by 1,000+ creators · No credit card required</p>
        </div>
      </section>

      {/* ─── VIDEO SECTION ─── */}
      <section id="video-section" className="px-5 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ background: '#111' }}>
            {!videoPlaying ? (
              <div className="relative aspect-video cursor-pointer group" onClick={() => setVideoPlaying(true)}>
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Snipflow Demo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI3MjAiIHZpZXdCb3g9IjAgMCAxMjgwIDcyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI3MjAiIGZpbGw9IiMxMTExMTEiLz48dGV4dCB4PSI2NDAiIHk9IjM3MCIgZmlsbD0iIzQ0NDQ0NCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPlNuaXBmbG93IERlbW88L3RleHQ+PC9zdmc+';
                  }}
                />
                <div className="absolute inset-0 video-overlay" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all group-hover:scale-110">
                    <PlayIcon />
                  </div>
                  <span className="text-sm font-medium text-white/80">Watch how Snipflow works</span>
                </div>
              </div>
            ) : (
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1`}
                  title="Snipflow Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="features" className="px-5 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">From transcript to published — in 2 minutes</h2>
            <p className="text-zinc-400 text-lg">Three steps. No design skills. No writing skills needed.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "📋", title: "Paste your transcript", desc: "Copy from YouTube via Glasp, Otter.ai, or any podcast transcript tool and paste it in." },
              { step: "02", icon: "⚡", title: "AI does the heavy lifting", desc: "Snipflow generates your blog post, tweet thread, Shorts script, and extracts your best ideas with priority scores." },
              { step: "03", icon: "🚀", title: "Publish & execute", desc: "Copy your content and follow your prioritized game plan. Know exactly what to do next and in what order." },
            ].map((s) => (
              <div key={s.step} className="card-hover rounded-2xl p-6 border border-white/[0.07] bg-white/[0.02]">
                <div className="text-[11px] font-mono text-amber-500/60 mb-3">{s.step}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES DETAIL ─── */}
      <section className="px-5 pb-24">
        <div className="max-w-5xl mx-auto space-y-20">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">Repurpose</div>
              <h2 className="hero-title text-3xl font-extrabold mb-4">One transcript.<br />Three formats.</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">Paste any transcript and get a full blog post, Twitter thread, and YouTube Shorts script — all optimized for each platform. Ready to copy and publish in under 2 minutes.</p>
              <div className="space-y-3">
                {["📝 Long-form blog post with headings and structure", "🐦 Tweet thread with hooks and engagement", "🎬 YouTube Shorts script ready to record"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Blog Post Preview</div>
              <div className="space-y-2">
                {["# The Future of AI Content Creation", "## Introduction", "The landscape of content creation is shifting dramatically...", "", "## Key Takeaways", "• AI tools are 10x faster than manual writing", "• Quality has reached professional standards", "• Creators who adapt will dominate"].map((line, i) => (
                  <div key={i} className={`text-xs font-mono ${line.startsWith('#') ? 'text-amber-400' : line.startsWith('•') ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {line || <br />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Game Plan</div>
              <div className="space-y-3">
                {[
                  { rank: "#1", score: "9.2", idea: "Launch a weekly newsletter from podcast highlights", tag: "Growth" },
                  { rank: "#2", score: "8.7", idea: "Create a YouTube Shorts series from key moments", tag: "Content" },
                  { rank: "#3", score: "7.9", idea: "Build an email course from your best episodes", tag: "Revenue" },
                ].map((item) => (
                  <div key={item.rank} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="text-[10px] font-mono text-amber-500 font-bold mt-0.5">{item.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-snug">{item.idea}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500">{item.tag}</span>
                        <span className="text-[10px] font-mono text-emerald-400 ml-auto">Score: {item.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">Idea Extractor</div>
              <h2 className="hero-title text-3xl font-extrabold mb-4">Extract ideas.<br />Build your game plan.</h2>
              <p className="text-zinc-400 leading-relaxed mb-6">Every transcript is full of ideas you haven't acted on yet. Snipflow extracts them all, scores them on impact, effort, and urgency — then ranks them so you know exactly what to do first.</p>
              <div className="space-y-3">
                {["🎯 Priority scores based on impact × effort × urgency", "⚡ Quick wins highlighted for immediate action", "📋 Concrete next step for every idea"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 text-center mb-12">
          <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">Loved by creators</h2>
          <p className="text-zinc-400">See why thousands trust Snipflow for their content workflow.</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 scroll-left" style={{ width: 'max-content' }}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-72 flex-shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.name}</div>
                    <div className="text-[10px] text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 scroll-right" style={{ width: 'max-content' }}>
            {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => (
              <div key={i} className="w-72 flex-shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.name}</div>
                    <div className="text-[10px] text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="px-5 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">Simple pricing</h2>
            <p className="text-zinc-400">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
              <div className="text-sm font-semibold text-zinc-400 mb-2">Free</div>
              <div className="text-4xl font-extrabold hero-title mb-1">$0</div>
              <div className="text-xs text-zinc-500 mb-6">Forever free</div>
              <ul className="space-y-3 mb-8">
                {["7 generations per day", "Blog + Thread + Shorts", "Idea Extractor", "Copy to clipboard"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-amber-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setAuthTrigger('signin'); setShowAuthModal(true); }}
                className="w-full py-3 border border-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all text-sm">
                Get Started Free
              </button>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-8 relative overflow-hidden glow-amber">
              <div className="absolute top-4 right-4 text-[10px] font-mono bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                🔥 18 founder spots
              </div>
              <div className="text-sm font-semibold text-amber-400 mb-2">Pro</div>
              <div className="text-4xl font-extrabold hero-title mb-1">$19<span className="text-base font-normal text-zinc-500">/mo</span></div>
              <div className="text-xs text-zinc-500 mb-6">Founder pricing — lock it in forever</div>
              <ul className="space-y-3 mb-8">
                {["Unlimited generations", "Unlimited idea extractions", "Priority processing", "All formats included", "Early access to new features"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-amber-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer"
                className="block w-full py-3 text-center bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl transition-all text-sm shadow-lg shadow-amber-500/20">
                Get Pro — $19/mo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── APP SECTION ─── */}
      <section ref={appRef} className="px-5 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">Try it right now</h2>
            <p className="text-zinc-400">Paste any transcript and see Snipflow work in real time.</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
            {error && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {/* Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex gap-1 bg-white/[0.04] border border-white/[0.07] p-1 rounded-xl">
                <button onClick={() => { setMode("repurpose"); setExtractedIdeas(null); setActiveTab("blog"); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${mode === "repurpose" ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                  <span>📄</span> Repurpose
                </button>
                <button onClick={() => { setMode("extract"); setGeneratedContent(null); setActiveTab("ideas"); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${mode === "extract" ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                  <span>⚡</span> Idea Extractor
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Input */}
              <div className="space-y-5">
                {mode === "repurpose" ? (
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">🎥</div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Getting a YouTube transcript</div>
                        <ol className="text-xs text-zinc-500 space-y-0.5 list-decimal list-inside leading-relaxed">
                          <li>Install the free <a href="https://chromewebstore.google.com/detail/glasp-social-web-highligh/blnjnbmcgfdcmhphdhfkcmjfgcgfoclo" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Glasp Chrome extension</a></li>
                          <li>Open any YouTube video — transcript appears in sidebar</li>
                          <li>Click the copy icon, then paste below</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">⚡</div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Idea Extractor</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">Paste anything — reel captions, podcast notes, voice memos, braindumps. AI extracts and prioritizes every idea.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">{mode === "repurpose" ? "Your transcript" : "Your content / notes"}</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={mode === "repurpose" ? "Paste your transcript here..." : "Paste anything here — reel caption, podcast notes, braindump..."}
                    rows={12}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/30 transition-all resize-none text-sm leading-relaxed"
                  />
                  {transcript.length > 0 && (
                    <div className="mt-1.5 text-right">
                      <span className="text-[11px] font-mono text-zinc-600">{transcript.length.toLocaleString()} chars</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !transcript.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm">
                  {isLoading ? (
                    <><LoaderIcon className="w-4 h-4" /> {mode === "repurpose" ? "Generating..." : "Extracting..."}</>
                  ) : mode === "repurpose" ? (
                    <><ZapIcon className="w-4 h-4" /> Generate 3 Formats</>
                  ) : (
                    <><ZapIcon className="w-4 h-4" /> Extract & Prioritize</>
                  )}
                </button>

                <p className="text-center text-[11px] text-zinc-600">
                  {user ? (
                    plan === "pro" ? "Unlimited generations ✦" :
                      remaining !== null ? <>{remaining} free generation{remaining !== 1 ? "s" : ""} remaining · <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">Upgrade for unlimited</a></> : null
                  ) : <>Try up to 7 generations free — no sign in needed</>}
                </p>
              </div>

              {/* RIGHT: Output */}
              <div ref={outputRef}>
                {!generatedContent && !extractedIdeas ? (
                  <div className="h-full min-h-[400px] bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="text-5xl mb-4 opacity-30">{mode === "repurpose" ? "✨" : "⚡"}</div>
                    <p className="text-zinc-500 text-sm mb-1">{mode === "repurpose" ? "Your content will appear here" : "Your prioritized ideas will appear here"}</p>
                    <p className="text-zinc-600 text-xs">{mode === "repurpose" ? "Blog post · Twitter thread · Shorts script" : "Scored · Ranked · Actionable"}</p>
                  </div>
                ) : activeTab === "ideas" && extractedIdeas ? (
                  <div className="space-y-3">
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white">{extractedIdeas.title}</h3>
                        <button onClick={copyIdeasAsText} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono">
                          {copied === "all-ideas" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                        </button>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{extractedIdeas.summary}</p>
                    </div>

                    {extractedIdeas.quick_wins?.length > 0 && (
                      <div className="bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl p-4">
                        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">⚡ Quick Wins — Do These First</div>
                        {extractedIdeas.quick_wins.map((win, i) => (
                          <div key={i} className="text-xs text-emerald-300/80 mb-1 pl-3 relative">
                            <span className="absolute left-0 text-emerald-400">›</span>{win}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {extractedIdeas.ideas.map((idea, idx) => {
                        const done = completedIds.has(idea.id);
                        return (
                          <div key={idea.id} className={`bg-white/[0.02] border rounded-xl p-4 transition-all duration-300 ${done ? "border-white/[0.04] opacity-50" : "border-white/[0.07] hover:border-amber-500/15"}`}>
                            <div className="flex gap-3 items-start">
                              <button onClick={() => toggleComplete(idea.id)} className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all text-[10px] ${done ? "bg-amber-500 border-amber-500 text-black" : "border-zinc-700 hover:border-amber-500/50 text-transparent"}`}>✓</button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${idx === 0 ? "bg-amber-500/20 text-amber-400" : idx < 3 ? "bg-amber-500/10 text-amber-500/70" : "bg-zinc-800 text-zinc-500"}`}>#{idx + 1}</span>
                                  <span className="text-[11px] text-zinc-500">{CATEGORY_ICONS[idea.category] || "📌"} {idea.category}</span>
                                  <span className={`text-[10px] font-mono font-bold ml-auto ${idea.priority_score >= 7 ? "text-emerald-400" : idea.priority_score >= 4 ? "text-amber-400" : "text-zinc-500"}`}>{idea.priority_score?.toFixed?.(1) || idea.priority_score}</span>
                                </div>
                                <div className={`text-sm font-semibold text-zinc-200 mb-1 leading-snug ${done ? "line-through" : ""}`}>{idea.idea}</div>
                                <div className="text-xs text-zinc-500 mb-2.5 leading-relaxed">{idea.why}</div>
                                <div className="flex gap-4 mb-2.5 flex-wrap">
                                  <div className="flex items-center gap-1.5"><span className="text-[10px] text-zinc-600 w-9">Impact</span><ScoreBar value={idea.impact} color="#f59e0b" /></div>
                                  <div className="flex items-center gap-1.5"><span className="text-[10px] text-zinc-600 w-9">Effort</span><ScoreBar value={idea.effort} color="#8b5cf6" /></div>
                                  <div className="flex items-center gap-1.5"><span className="text-[10px] text-zinc-600 w-9">Urgent</span><ScoreBar value={idea.urgency} color="#ef4444" /></div>
                                </div>
                                <div className="text-xs text-amber-500/70 bg-amber-500/[0.05] border border-amber-500/10 px-3 py-2 rounded-lg">
                                  <span className="font-bold text-amber-400">Next →</span> {idea.next_step}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => { setExtractedIdeas(null); setActiveTab("blog"); }} className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← Extract another</button>
                  </div>
                ) : generatedContent ? (
                  <div className="space-y-3">
                    <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl">
                      {repurposeTabData.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === tab.key ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                          <span>{tab.icon}</span>{tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-5 min-h-[350px]">
                      {activeTab === "blog" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Blog Post</h3>
                            <button onClick={() => copyToClipboard(generatedContent.blog, "blog")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono">
                              {copied === "blog" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                            </button>
                          </div>
                          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">{generatedContent.blog}</div>
                        </div>
                      )}
                      {activeTab === "tweets" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Twitter Thread</h3>
                            <button onClick={() => copyToClipboard(generatedContent.tweets.join("\n\n"), "tweets")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono">
                              {copied === "tweets" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                            </button>
                          </div>
                          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                            {generatedContent.tweets.map((tweet, i) => (
                              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 group">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-amber-500 font-mono text-xs font-bold mt-0.5">{i + 1}/{generatedContent.tweets.length}</span>
                                  <p className="flex-1 text-zinc-300 text-sm leading-relaxed">{tweet}</p>
                                  <button onClick={() => copyToClipboard(tweet, `t-${i}`)} className="text-zinc-600 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100">
                                    {copied === `t-${i}` ? <CheckIcon /> : <CopyIcon />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeTab === "shorts" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">YouTube Shorts Script</h3>
                            <button onClick={() => copyToClipboard(generatedContent.shorts, "shorts")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono">
                              {copied === "shorts" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                            </button>
                          </div>
                          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">{generatedContent.shorts}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="px-5 pb-24">
        <div className="max-w-3xl mx-auto text-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-12 glow-amber">
          <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">Your transcript deserves better than a blank page.</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">Join thousands of creators turning their transcripts into content empires. Start free today.</p>
          <button onClick={() => { setAuthTrigger('signin'); setShowAuthModal(true); }}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all text-sm shadow-lg shadow-amber-500/25">
            Get Started Free
          </button>
          <p className="text-xs text-zinc-600 mt-4">No credit card required · 7 free generations daily</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <ZapIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold hero-title">Snipflow</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a>
            <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Go Pro</a>
          </div>
          <span className="text-xs text-zinc-600">by Dragonstone Enterprises</span>
        </div>
      </footer>

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full relative">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white hero-title">{emailConfirmSent ? "Check your email" : authTrigger === 'limit_reached' ? "Sign in to continue" : authMode === "signup" ? "Create your account" : "Welcome back"}</h3>
              <p className="text-zinc-500 text-xs mt-1">{emailConfirmSent ? "We've sent a confirmation link to " + authEmail : "7 free generations per day, no credit card needed"}</p>
            </div>

            {emailConfirmSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-zinc-300">Check your inbox and click the confirmation link to activate your account.</p>
                <button onClick={async () => {
                  const { error } = await supabase.auth.resend({ type: 'signup', email: authEmail });
                  if (error) setAuthError(error.message);
                  else setAuthError("Confirmation email re-sent!");
                }}
                  className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl transition-all text-sm">
                  Resend Confirmation Email
                </button>
              </div>
            ) : (
              <>
                <button onClick={signInWithGoogle} className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2.5 text-sm mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <div className="space-y-3">
                  <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 text-sm" />
                  <input type="password" value={authPassword} onChange={(e) => { setAuthPassword(e.target.value); setPasswordError(null); }} placeholder="Password (min 6 characters)"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 text-sm" />
                  {passwordError && <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">{passwordError}</div>}
                  {authError && <div className={`text-xs px-3 py-2 rounded-lg ${authError.includes("re-sent") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{authError}</div>}
                  <button onClick={handleEmailAuth} disabled={authSubmitting || !authEmail || authPassword.length < 6}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-black font-bold rounded-xl transition-all text-sm">
                    {authSubmitting ? "Please wait..." : authMode === "signup" ? "Create Account" : "Sign In"}
                  </button>
                </div>

                <p className="text-center text-xs text-zinc-500 mt-4">
                  {authMode === "signup" ? (
                    <>Already have an account? <button onClick={() => { setAuthMode("login"); setAuthError(null); }} className="text-amber-400 hover:text-amber-300">Sign in</button></>
                  ) : (
                    <>Don&apos;t have an account? <button onClick={() => { setAuthMode("signup"); setAuthError(null); }} className="text-amber-400 hover:text-amber-300">Sign up</button></>
                  )}
                </p>
              </>
            )}

            <button onClick={() => { setShowAuthModal(false); setAuthError(null); setAuthEmail(""); setAuthPassword(""); setEmailConfirmSent(false); setPasswordError(null); setAuthTrigger(null); }}
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors text-lg">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
