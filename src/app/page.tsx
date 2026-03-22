"use client";

import { useState, useEffect, useRef } from "react";

interface GeneratedContent {
  blog: string;
  tweets: string[];
  shorts: string;
}

/* ─── tiny icon components (no lucide dependency issues) ─────────── */
const Icon = ({ d, className = "" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}><path d={d} /></svg>
);
const ZapIcon = ({ className = "" }: { className?: string }) => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className={className} />;
const CopyIcon = () => <Icon d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8" />;
const CheckIcon = () => <Icon d="M20 6L9 17l-5-5" />;
const LoaderIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 animate-spin ${className}`}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
);

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<"blog" | "tweets" | "shorts">("blog");
  const [copied, setCopied] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("contentflow_usage");
    if (saved) setUsage(parseInt(saved, 10));
  }, []);

  const handleGenerate = async () => {
    if (!transcript.trim()) { setError("Please paste a transcript first"); return; }
    if (usage >= 3 && !email) { setShowEmailModal(true); return; }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setGeneratedContent(data);
      const n = usage + 1;
      setUsage(n);
      localStorage.setItem("contentflow_usage", n.toString());
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch {
      setError("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabData = [
    { key: "blog" as const, label: "Blog Post", icon: "📝" },
    { key: "tweets" as const, label: "Twitter Thread", icon: "🐦" },
    { key: "shorts" as const, label: "YT Shorts Script", icon: "🎬" },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-amber-500/20 selection:text-amber-200">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.15)} 50%{box-shadow:0 0 40px rgba(245,158,11,0.25)} }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.06); }
        textarea:focus { box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
      `}</style>

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
            <span className="text-lg font-bold tracking-tight text-white">ContentFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500">
              {usage}/3 free
            </span>
            <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-semibold text-amber-400 border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all duration-200">
              Go Pro
            </a>
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
              Three formats.
            </span><br />
            Two minutes.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Paste any video transcript and get a publish-ready blog post, Twitter thread, and YouTube Shorts script — instantly.
          </p>

          {/* 3-STEP FLOW */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            {[
              { step: "01", title: "Copy transcript", desc: "From YouTube via Glasp, or any source", icon: "📋" },
              { step: "02", title: "Paste & generate", desc: "AI transforms it in under 2 minutes", icon: "⚡" },
              { step: "03", title: "Copy & publish", desc: "Blog, thread, Shorts — ready to post", icon: "🚀" },
            ].map((s) => (
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
              <div className="mb-5 bg-red-500/8 border border-red-500/15 text-red-400 px-4 py-3 rounded-xl text-sm font-mono">
                {error}
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Input */}
              <div className="space-y-5">
                {/* Glasp helper */}
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

                {/* Transcript Input */}
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Your transcript
                  </label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your transcript here..."
                    rows={12}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 transition-all resize-none text-sm leading-relaxed"
                  />
                  {transcript.length > 0 && (
                    <div className="mt-1.5 text-right">
                      <span className="text-[11px] font-mono text-zinc-600">
                        {transcript.length.toLocaleString()} chars · ~{Math.ceil(transcript.split(/\s+/).length / 250)} min read
                      </span>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !transcript.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 animate-pulse-glow disabled:animate-none text-sm tracking-wide"
                >
                  {isGenerating ? (
                    <><LoaderIcon className="w-4 h-4" /> Generating content...</>
                  ) : (
                    <><ZapIcon className="w-4 h-4" /> Generate 3 Formats</>
                  )}
                </button>

                <p className="text-center text-[11px] text-zinc-600">
                  {3 - usage > 0 ? `${3 - usage} free generations remaining` : "Free limit reached"} · <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">Upgrade for unlimited</a>
                </p>
              </div>

              {/* RIGHT: Output */}
              <div ref={outputRef}>
                {!generatedContent ? (
                  <div className="h-full min-h-[400px] bg-zinc-900/30 border border-zinc-800/50 rounded-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="text-5xl mb-4 opacity-40">✨</div>
                    <p className="text-zinc-500 text-sm mb-1">Your content will appear here</p>
                    <p className="text-zinc-600 text-xs">Blog post · Twitter thread · Shorts script</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl">
                      {tabData.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                            activeTab === tab.key
                              ? "bg-amber-500/15 text-amber-400 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <span>{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Content Display */}
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 min-h-[350px]">
                      {activeTab === "blog" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Blog Post</h3>
                            <button
                              onClick={() => copyToClipboard(generatedContent.blog, "blog")}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono"
                            >
                              {copied === "blog" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                            </button>
                          </div>
                          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">
                            {generatedContent.blog}
                          </div>
                        </div>
                      )}

                      {activeTab === "tweets" && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Twitter Thread</h3>
                            <button
                              onClick={() => copyToClipboard(generatedContent.tweets.join("\n\n"), "tweets")}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono"
                            >
                              {copied === "tweets" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy All</>}
                            </button>
                          </div>
                          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                            {generatedContent.tweets.map((tweet, i) => (
                              <div key={i} className="bg-zinc-800/40 border border-zinc-700/20 rounded-lg p-3 group">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-amber-500 font-mono text-xs font-bold mt-0.5">{i + 1}/{generatedContent.tweets.length}</span>
                                  <p className="flex-1 text-zinc-300 text-sm leading-relaxed">{tweet}</p>
                                  <button
                                    onClick={() => copyToClipboard(tweet, `t-${i}`)}
                                    className="text-zinc-600 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
                                  >
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
                            <button
                              onClick={() => copyToClipboard(generatedContent.shorts, "shorts")}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-mono"
                            >
                              {copied === "shorts" ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy</>}
                            </button>
                          </div>
                          <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[380px] overflow-y-auto pr-2">
                            {generatedContent.shorts}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SOCIAL PROOF ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { metric: "2 min", label: "Average generation time", icon: "⚡" },
              { metric: "3 formats", label: "From a single transcript", icon: "📄" },
              { metric: "10x faster", label: "Than writing manually", icon: "🚀" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-2xl font-extrabold text-white">{s.metric}</div>
                <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PRICING SECTION ─── */}
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
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Copy to clipboard</li>
              </ul>
            </div>
            <div className="glass rounded-xl p-6 border-amber-500/20 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Popular</div>
              <div className="text-sm font-semibold text-amber-400 mb-1">Pro</div>
              <div className="text-3xl font-extrabold text-white mb-3">$19<span className="text-sm font-normal text-zinc-500">/mo</span></div>
              <ul className="text-xs text-zinc-500 space-y-1.5 mb-4">
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Unlimited generations</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Priority processing</li>
                <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> All formats included</li>
              </ul>
              <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 text-center bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/15">
                Get Pro
              </a>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-white/[0.04] py-8">
          <div className="max-w-5xl mx-auto px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                <ZapIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-zinc-500">ContentFlow</span>
            </div>
            <span className="text-[11px] text-zinc-700">by Dragonstone Enterprises</span>
          </div>
        </footer>
      </main>

      {/* ─── EMAIL MODAL ─── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full animate-fade-up">
            <div className="text-2xl mb-3">📧</div>
            <h3 className="text-lg font-bold text-white mb-1">Free limit reached</h3>
            <p className="text-zinc-400 mb-4 text-sm">
              Enter your email to get 3 more free generations, or upgrade to Pro for unlimited.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-700/40 rounded-xl text-zinc-100 placeholder-zinc-500 mb-4 focus:outline-none focus:border-amber-500/40 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (email.includes("@")) { setShowEmailModal(false); handleGenerate(); } }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-semibold"
              >
                Continue
              </button>
            </div>
            <p className="text-center text-[11px] text-zinc-600 mt-3">
              Or <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400">upgrade to Pro →</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
