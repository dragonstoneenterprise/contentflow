"use client";

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

/* ─── tiny icon components ─────────── */
const Icon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}><path d={d} /></svg>
);
const ZapIcon = ({ className = "" }: { className?: string }) => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className={className} />;
const CopyIcon = () => <Icon d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8" />;
const CheckIcon = () => <Icon d="M20 6L9 17l-5-5" />;
const LoaderIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 animate-spin ${className}`}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
);

const CATEGORY_ICONS: Record<string, string> = {
  Revenue: "💰", Growth: "📈", Product: "🛠", Content: "📝", Operations: "⚙️", Learning: "📚",
};

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
  const [showUserMenu, setShowUserMenu] = useState(false);

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
  const outputRef = useRef<HTMLDivElement>(null);

  // Load auth state
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

  // Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setAuthError(error.message);
  };

  const handleEmailAuth = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setAuthError("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setShowAuthModal(false);
        window.location.reload();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthError(message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    setUser(null);
    setRemaining(null);
    setGeneratedContent(null);
    setExtractedIdeas(null);
  };

  // Generate / Extract
  const handleGenerate = async () => {
    if (!transcript.trim()) { setError("Please paste content first"); return; }
    if (!user) {
      let guestUses = parseInt(localStorage.getItem("guest_uses") || "0");
      if (guestUses >= 7) { setShowAuthModal(true); return; }
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

  const repurposeTabData = [
    { key: "blog" as const, label: "Blog Post", icon: "📝" },
    { key: "tweets" as const, label: "Thread", icon: "🐦" },
    { key: "shorts" as const, label: "Shorts", icon: "🎬" },
  ];

  const ScoreBar = ({ value, max = 10, color }: { value: number; max?: number; color: string }) => (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 w-3">{value}</span>
    </div>
  );

  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-500/20 selection:text-amber-200">
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'); body { font-family: 'Outfit', sans-serif; } .font-mono { font-family: 'JetBrains Mono', monospace; } @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} } @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} } @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.15)} 50%{box-shadow:0 0 40px rgba(245,158,11,0.25)} } .animate-float { animation: float 4s ease-in-out infinite; } .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; } .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; } .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); } textarea:focus { box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }`}</style>

      {/* ─── AMBIENT BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/[0.03] blur-[100px]" />
      </div>

      {/* ─── HEADER ─── */}
      <header className="relative z-10 border-b border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ZapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Snipflow</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {plan === "free" && remaining !== null && (
                  <span className="text-xs font-mono text-zinc-500">{remaining}/3 free today</span>
                )}
                {plan === "pro" && (
                  <span className="text-xs font-mono text-amber-500">Pro ✦</span>
                )}
                {plan === "free" && (
                  <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer"
                    className="px-4 py-1.5 text-sm font-semibold text-amber-400 border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all duration-200">
                    Go Pro
                  </a>
                )}
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#ea580c)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:"bold"}}>{userInitial}</div><a href="/signout" style={{fontSize:"12px",color:"#a1a1aa",textDecoration:"none"}}>Logout</a></div>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-4 py-1.5 text-sm font-semibold text-amber-400 border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all duration-200">
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>


      <main className="relative z-10">

        {/* ─── HERO ─── */}
        <section className="max-w-5xl mx-auto px-5 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-mono text-amber-400 mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-powered content repurposing
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            One transcript.<br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              {mode === "repurpose" ? "Three formats." : "Prioritized action."}
            </span><br />
            Two minutes.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {mode === "repurpose"
              ? "Paste any video transcript and get a publish-ready blog post, Twitter thread, and YouTube Shorts script — instantly."
              : "Paste any content — reel caption, podcast notes, braindump — and get a scored, prioritized action plan instantly."}
          </p>

          {/* ─── MODE TOGGLE ─── */}
          <div className="flex justify-center mb-10 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="inline-flex gap-1 bg-zinc-900/60 border border-zinc-800/50 p-1 rounded-xl">
              <button onClick={() => { setMode("repurpose"); setExtractedIdeas(null); setActiveTab("blog"); }} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${mode === "repurpose" ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                <span>📄</span> Repurpose
              </button>
              <button onClick={() => { setMode("extract"); setGeneratedContent(null); setActiveTab("ideas"); }} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${mode === "extract" ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                <span>⚡</span> Idea Extractor
              </button>
            </div>
          </div>

          {/* 3-STEP FLOW */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            {(mode === "repurpose" ? [
              { step: "01", title: "Copy transcript", desc: "From YouTube via Glasp, or any source", icon: "📋" },
              { step: "02", title: "Paste & generate", desc: "AI transforms it in under 2 minutes", icon: "⚡" },
              { step: "03", title: "Copy & publish", desc: "Blog, thread, Shorts — ready to post", icon: "🚀" },
            ] : [
              { step: "01", title: "Drop any content", desc: "Reel caption, podcast notes, voice memo, braindump", icon: "📲" },
              { step: "02", title: "AI scores & ranks", desc: "Impact, effort, urgency — sorted by priority", icon: "🎯" },
              { step: "03", title: "Execute quick wins", desc: "Check off ideas as you ship them", icon: "✅" },
            ]).map((s) => (
              <div key={s.step} className="glass rounded-xl p-5 text-left hover:border-amber-500/20 transition-all duration-300 group">
                <div className="text-[10px] font-mono text-amber-500/60 mb-2">{s.step}</div>
                <div className="text-2xl mb-2 group-hover:animate-float">{s.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{s.title}</div>
                <div className="text-xs text-zinc-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── APP SECTION ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="glass rounded-2xl p-6 sm:p-8">
            {error && (
              <div className="mb-5 bg-red-500/8 border border-red-500/15 text-red-400 px-4 py-3 rounded-xl text-sm font-mono">{error}</div>
            )}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Input */}
              <div className="space-y-5">
                {mode === "repurpose" ? (
                  <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">🎥</div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Getting a YouTube transcript</div>
                        <ol className="text-xs text-zinc-400 space-y-0.5 list-decimal list-inside leading-relaxed">
                          <li>Install the free <a href="https://chromewebstore.google.com/detail/glasp-social-web-highligh/blnjnbmcgfdcmhphdhfkcmjfgcgfoclo" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Glasp Chrome extension</a></li>
                          <li>Open any YouTube video — transcript appears in sidebar</li>
                          <li>Click the copy icon, then paste below</li>
                        </ol>
                        <p className="text-[11px] text-zinc-500 mt-1.5">Works with podcasts, webinars, lectures — any transcript.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">⚡</div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Idea Extractor</div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-1.5">Paste anything — Instagram reel captions, podcast notes, voice memo transcripts, raw braindump, meeting notes, article highlights.</p>
                        <p className="text-[11px] text-zinc-500">AI will extract every idea, score them on <span className="text-amber-400/80">impact</span>, <span className="text-amber-400/80">effort</span>, and <span className="text-amber-400/80">urgency</span>, then rank them so you know exactly what to do first.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">{mode === "repurpose" ? "Your transcript" : "Your content / notes"}</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={mode === "repurpose" ? "Paste your transcript here..." : "Paste anything here — reel caption, podcast notes, braindump, voice memo transcript, article highlights..."}
                    rows={12}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-all resize-none text-sm leading-relaxed"
                  />
                  {transcript.length > 0 && (
                    <div className="mt-1.5 text-right">
                      <span className="text-[11px] font-mono text-zinc-600">{transcript.length.toLocaleString()} chars · ~{transcript.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !transcript.trim()}
                  className={`w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 ${isLoading ? "" : "animate-pulse-glow"} text-sm tracking-wide`}
                >
                  {isLoading ? (
                    <><LoaderIcon className="w-4 h-4" /> <span className="text-sm font-semibold">{mode === "repurpose" ? "Generating content..." : "Extracting ideas..."}</span></>
                  ) : !user ? (
                    <>{typeof window !== "undefined" && localStorage.getItem("guest_used") ? "Sign in to Generate More" : "Try Free — No Sign In Required"}</>
                  ) : mode === "repurpose" ? (
                    <><ZapIcon className="w-4 h-4" /> Generate 3 Formats</>
                  ) : (
                    <><ZapIcon className="w-4 h-4" /> Extract & Prioritize</>
                  )}
                </button>

                <p className="text-center text-[11px] text-zinc-600">
                  {user ? (
                    plan === "pro" ? "Unlimited generations ✦" :
                    remaining !== null ? <>{remaining} free generation{remaining !== 1 ? "s" : ""} remaining today · <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">Upgrade for unlimited</a></> : null
                  ) : <>{typeof window !== "undefined" && parseInt(localStorage.getItem("guest_uses") || "0") >= 7 ? <>Sign in for 7 free/day · <button onClick={() => setShowAuthModal(true)} className="text-amber-500 hover:text-amber-400">Create free account</button></> : <>Try up to 7 generations free — no sign in needed</>}</>}                </p>
              </div>

              {/* RIGHT: Output */}
              <div ref={outputRef}>
                {!generatedContent && !extractedIdeas ? (
                  <div className="h-full min-h-[400px] bg-zinc-900/30 border border-zinc-800/50 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="text-5xl mb-4 opacity-40">{mode === "repurpose" ? "✨" : "⚡"}</div>
                    <p className="text-zinc-500 text-sm mb-1">{mode === "repurpose" ? "Your content will appear here" : "Your prioritized ideas will appear here"}</p>
                    <p className="text-zinc-600 text-xs">{mode === "repurpose" ? "Blog post · Twitter thread · Shorts script" : "Scored · Ranked · Actionable"}</p>
                  </div>
                ) : activeTab === "ideas" && extractedIdeas ? (
                  /* ─── IDEAS OUTPUT ─── */
                  <div className="space-y-3">
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-white">{extractedIdeas.title}</h3>
                        <button onClick={copyIdeasAsText} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono">
                          {copied === "all-ideas" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{extractedIdeas.summary}</p>
                    </div>

                    {extractedIdeas.quick_wins?.length > 0 && (
                      <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-4">
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
                          <div key={idea.id} className={`bg-zinc-900/50 border rounded-xl p-4 transition-all duration-300 ${done ? "border-zinc-800/30 opacity-50" : "border-zinc-800/50 hover:border-amber-500/15"}`}>
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
                                  <div className="flex items-center gap-1.5"><span className="text-[10px] text-zinc-600 w-9">Confid.</span><ScoreBar value={idea.confidence} color="#22c55e" /></div>
                                </div>
                                <div className="text-xs text-amber-300/70 bg-amber-500/[0.05] border border-amber-500/10 px-3 py-2 rounded-lg">
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
                  /* ─── REPURPOSE OUTPUT ─── */
                  <div className="space-y-3">
                    <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl">
                      {repurposeTabData.map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${activeTab === tab.key ? "bg-amber-500/15 text-amber-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
                          <span>{tab.icon}</span>{tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 min-h-[350px]">
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
                              <div key={i} className="bg-zinc-800/40 border border-zinc-700/20 rounded-lg p-3 group">
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
        </section>

        {/* ─── SOCIAL PROOF ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {(mode === "repurpose" ? [
              { metric: "2 min", label: "Average generation time", icon: "⚡" },
              { metric: "3 formats", label: "From a single transcript", icon: "📄" },
              { metric: "10x faster", label: "Than writing manually", icon: "🚀" },
            ] : [
              { metric: "< 30 sec", label: "From content to action plan", icon: "⚡" },
              { metric: "Scored", label: "Impact · Effort · Urgency", icon: "🎯" },
              { metric: "Quick wins", label: "High value, low effort — first", icon: "✅" },
            ]).map((s) => (
              <div key={s.label} className="glass rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl font-extrabold text-white">{s.metric}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Simple pricing</h2>
            <p className="text-zinc-500 text-sm">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="glass rounded-xl p-6">
              <div className="text-sm font-semibold text-zinc-400 mb-1">Free</div>
              <div className="text-3xl font-extrabold text-white mb-3">$0</div>
              <ul className="text-xs text-zinc-500 space-y-1.5">
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> 3 generations per day</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Blog + Thread + Shorts</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Idea Extractor</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Copy to clipboard</li>
              </ul>
            </div>
            <div className="glass rounded-xl p-6 border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Popular</div>
              <div className="text-sm font-semibold text-amber-400 mb-1">Pro</div>
              <div className="text-3xl font-extrabold text-white mb-3">$19<span className="text-sm font-normal text-zinc-500">/mo</span></div>
              <ul className="text-xs text-zinc-500 space-y-1.5 mb-4">
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Unlimited generations</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Unlimited idea extractions</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Priority processing</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> All formats included</li>
              </ul>
              <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/15">
                Get Pro
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-5xl mx-auto px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center"><ZapIcon className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs font-semibold text-zinc-500">Snipflow</span>
            </div>
            <span className="text-[11px] text-zinc-700">by Dragonstone Enterprises</span>
          </div>
        </footer>
      </main>

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full animate-fade-up relative">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {authMode === "signup" ? "Create your account" : "Welcome back"}
              </h3>
              <p className="text-zinc-500 text-xs mt-1">3 free generations per day, no credit card needed</p>
            </div>

                <button onClick={signInWithGoogle} disabled={authSubmitting} className="w-full py-3 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2.5 text-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <div className="space-y-3">
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/40 text-sm disabled:opacity-50" disabled={authSubmitting} />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password (min 6 characters)" className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/40 text-sm disabled:opacity-50" disabled={authSubmitting} />
              {authError && (
                <div className="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">{authError}</div>
              )}
              <button onClick={handleEmailAuth} disabled={authSubmitting || !authEmail || authPassword.length < 6} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-sm">
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

            <button onClick={() => { setShowAuthModal(false); setAuthError(null); setAuthEmail(""); setAuthPassword(""); }} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors text-lg">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
