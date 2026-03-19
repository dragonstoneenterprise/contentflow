"use client";

import { useState, useEffect } from "react";
import { Youtube, FileText, Copy, Check, Zap, Mail, Loader2, AlignLeft } from "lucide-react";

interface GeneratedContent {
  blog: string;
  tweets: string[];
  shorts: string;
}

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [email, setEmail] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<"blog" | "tweets" | "shorts">("blog");
  const [copied, setCopied] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("contentflow_usage");
    if (saved) {
      setUsage(parseInt(saved, 10));
    }
  }, []);

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    return match ? match[1] : null;
  };

  const fetchTranscript = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError("Invalid YouTube URL");
      return;
    }
    
    setIsFetching(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/transcript?videoId=${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const text =
        typeof data === "string"
          ? data
          : (data?.transcript ?? data?.data?.transcript ?? "");
      setTranscript(typeof text === "string" ? text : String(text ?? ""));
    } catch {
      setError("Could not fetch transcript. Try pasting manually.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Please enter a transcript");
      return;
    }
    
    if (usage >= 3 && !email) {
      setShowEmailModal(true);
      return;
    }

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
      const newUsage = usage + 1;
      setUsage(newUsage);
      localStorage.setItem("contentflow_usage", newUsage.toString());
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                ContentFlow
              </h1>
              <p className="text-xs text-zinc-500">Transform content in 2 minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Uses: <span className="text-violet-400 font-semibold">{usage}</span>/3 free
            </span>
            <a
              href="https://9245368029329.gumroad.com/l/tnlfjv"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upgrade
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Input</h2>
              
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* YouTube URL */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube URL (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={fetchTranscript}
                    disabled={isFetching || !youtubeUrl}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-lg transition-colors text-sm font-medium"
                  >
                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Note: Only works for videos with captions. For best results, use the <a href="https://chrome.google.com/webstore/detail/glasp-social-web-highligh/blnjnbmcgfdcmhphdhfkcmjfgcgfoclo" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Glasp extension</a> to get transcripts.
                </p>
              </div>

              {/* Transcript */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                  <AlignLeft className="w-4 h-4 text-violet-500" />
                  Transcript
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste your transcript here...

💡 Tip: Use the free Glasp Chrome extension to get transcripts from YouTube videos, then paste here."
                  rows={10}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-600/50 focus:border-violet-600 transition-all resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !transcript.trim()}
                className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Content
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-zinc-500">
                Free: 3 generations per day. <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Upgrade to Pro</a> for unlimited.
              </p>
            </div>
          </div>

          {/* Right: Output */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Output</h2>
            
            {!generatedContent ? (
              <div className="h-[400px] bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500">
                <Zap className="w-12 h-12 mb-4 opacity-30" />
                <p>Generate content to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-lg">
                  {(["blog", "tweets", "shorts"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab
                          ? "bg-violet-600/20 text-violet-400"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {tab === "tweets" ? "Twitter" : tab === "shorts" ? "Shorts" : "Blog"}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  {activeTab === "blog" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400">Blog Post</h3>
                        <button
                          onClick={() => copyToClipboard(generatedContent.blog, "blog")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-md transition-colors"
                        >
                          {copied === "blog" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === "blog" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed max-h-[350px] overflow-y-auto">
                        {generatedContent.blog}
                      </div>
                    </div>
                  )}

                  {activeTab === "tweets" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400">Twitter Thread</h3>
                        <button
                          onClick={() => copyToClipboard(generatedContent.tweets.join("\n\n"), "tweets")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-md transition-colors"
                        >
                          {copied === "tweets" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy All
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {generatedContent.tweets.map((tweet, i) => (
                          <div key={i} className="bg-zinc-800/50 rounded-lg p-3 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-violet-500 font-semibold text-xs">{i + 1}.</span>
                              <p className="flex-1 text-zinc-300">{tweet}</p>
                              <button
                                onClick={() => copyToClipboard(tweet, `tweet-${i}`)}
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                {copied === `tweet-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "shorts" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-400">YouTube Shorts Script</h3>
                        <button
                          onClick={() => copyToClipboard(generatedContent.shorts, "shorts")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-md transition-colors"
                        >
                          {copied === "shorts" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === "shorts" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed max-h-[350px] overflow-y-auto">
                        {generatedContent.shorts}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-violet-500" />
              <h3 className="text-lg font-semibold text-zinc-100">Free Limit Reached</h3>
            </div>
            <p className="text-zinc-400 mb-4 text-sm">
              You&apos;ve used 3 free generations today. Enter your email to continue or upgrade to Pro.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 mb-4 focus:outline-none focus:ring-2 focus:ring-violet-600/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (email.includes("@")) {
                    setShowEmailModal(false);
                    handleGenerate();
                  }
                }}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-4">
              Or <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">upgrade to Pro</a> for unlimited
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
