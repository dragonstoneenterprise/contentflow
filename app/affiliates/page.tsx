import "../globals.css";

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .hero-title { font-family: 'Syne', sans-serif; }
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
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-2px); border-color: rgba(245, 158, 11, 0.3); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease forwards; }
        .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.2s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.3s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* ─── AMBIENT BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[120px]" style={{ background: '#f59e0b' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]" style={{ background: '#f97316' }} />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-white/[0.06]" style={{ background: 'rgba(8,8,8,0.85)' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ textAlign: 'center' }}>
              <div>
                <span style={{ color: '#ff4500', fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>SNIP</span>
                <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>FLOW</span>
              </div>
              <div style={{ color: '#888888', fontSize: '11px', letterSpacing: '2px', marginTop: '5px' }}>BY DRAGONSTONE</div>
            </div>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="/#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <a href="/affiliates" className="text-sm text-white transition-colors font-medium">Affiliates</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <a href="mailto:affiliates@dragonstoneenterprises.com"
              className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-full transition-all">
              Apply Now
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">

        {/* ─── HERO ─── */}
        <section className="pt-36 pb-20 px-5 text-center relative">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs font-mono text-amber-400 mb-8 fade-up fade-up-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Snipflow Affiliate Program
            </div>

            <h1 className="hero-title text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] mb-6 fade-up fade-up-2">
              Share Snipflow,<br />
              <span className="gradient-text">get paid.</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed fade-up fade-up-3">
              Make content about Snipflow, drop your link, and earn 30% every time someone you refer pays. No posting schedules, no minimum videos. Your content, your way.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 fade-up fade-up-4">
              <a href="mailto:affiliates@dragonstoneenterprises.com"
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all text-sm shadow-lg shadow-amber-500/25">
                Apply Now
              </a>
              <a href="/"
                className="px-8 py-3.5 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium rounded-full transition-all text-sm">
                See Snipflow in action
              </a>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "30%", label: "Recurring commission" },
              { value: "12 months", label: "Per referred customer" },
              { value: "60 days", label: "Cookie window" },
              { value: "Monthly", label: "Payouts · $25 minimum" },
            ].map((stat) => (
              <div key={stat.label} className="card-hover bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
                <div className="hero-title text-3xl sm:text-4xl font-extrabold gradient-text mb-2">{stat.value}</div>
                <div className="text-xs text-zinc-500 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WHAT YOU EARN ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 sm:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">What you earn</div>
              <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-6">
                30% of every payment.<br />
                <span className="gradient-text">For a full year.</span>
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-8">
                Every paying customer you refer earns you 30% of their subscription for 12 months — not just the first payment. Snipflow Pro is $19/month, so a single active referral puts <span className="text-white font-semibold">$68.40</span> in your pocket over the year. Refer 10 people and you&apos;re looking at <span className="text-white font-semibold">$684/year</span> from content you already made.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 text-left">
                {[
                  { label: "1 referral", monthly: "$5.70/mo", yearly: "$68.40/yr" },
                  { label: "10 referrals", monthly: "$57/mo", yearly: "$684/yr" },
                  { label: "50 referrals", monthly: "$285/mo", yearly: "$3,420/yr" },
                ].map((row) => (
                  <div key={row.label} className="bg-amber-500/[0.05] border border-amber-500/10 rounded-xl p-4">
                    <div className="text-xs font-mono text-amber-400/70 mb-2">{row.label}</div>
                    <div className="text-xl font-extrabold text-white hero-title">{row.monthly}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{row.yearly}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="text-center mb-10">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">How it works</div>
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold">Four steps to your first payout</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", icon: "✉️", title: "Apply", desc: "Email us at affiliates@dragonstoneenterprises.com with a link to your content and a sentence about your audience." },
              { step: "02", icon: "🔗", title: "Get your link", desc: "We'll set you up with a unique referral link within 48 hours. Share it anywhere — bio, video description, pinned tweet." },
              { step: "03", icon: "📣", title: "Create content", desc: "Make a video, post, thread, or review about Snipflow. Drop your link. No templates, no approval process." },
              { step: "04", icon: "💸", title: "Get paid", desc: "Commissions are tracked automatically. We pay out every month via PayPal or Stripe once you hit the $25 minimum." },
            ].map((s) => (
              <div key={s.step} className="card-hover bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                <div className="text-[10px] font-mono text-amber-500/60 mb-3">{s.step}</div>
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-sm font-semibold text-white mb-2">{s.title}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WHO IT'S FOR ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="text-center mb-10">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">Who it&apos;s for</div>
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold">If you have an audience, you qualify</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🎥",
                title: "Content creators",
                desc: "YouTubers, TikTokers, podcasters, Instagram creators — if you make content and your audience creates content too, this is a natural fit. Review it, use it on camera, let your audience see it work.",
              },
              {
                icon: "⚡",
                title: "Snipflow users",
                desc: "Already using Snipflow? You&apos;re the best affiliate we could ask for. Show your real workflow, share your real results, and earn every time someone follows your lead.",
              },
              {
                icon: "📢",
                title: "Anyone with an audience",
                desc: "Newsletter writers, Twitter/X accounts, Discord communities, LinkedIn creators. If people trust your recommendations and you work in the content or creator space, you&apos;re a great fit.",
              },
            ].map((item) => (
              <div key={item.title} className="card-hover bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className="text-base font-semibold text-white mb-2">{item.title}</div>
                <div className="text-sm text-zinc-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── NO STRINGS ATTACHED ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 sm:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3">No strings attached</div>
              <h2 className="hero-title text-3xl font-extrabold mb-8">Simple rules. No gotchas.</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: "✓", text: "No minimum posting requirements — make one video or fifty, it doesn't matter" },
                  { icon: "✓", text: "No approval needed for each piece of content you create" },
                  { icon: "✓", text: "No exclusivity — promote other tools too, we don't mind" },
                  { icon: "✓", text: "No complicated dashboards — we track everything and report clearly" },
                  { icon: "✓", text: "Cookie window is 60 days — your referrals are protected even if they don't buy immediately" },
                  { icon: "✓", text: "Cancel anytime — no lock-in, no contracts, just email us" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-amber-400 font-bold text-lg leading-snug">{item.icon}</span>
                    <span className="text-sm text-zinc-400 leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="hero-title text-3xl sm:text-4xl font-extrabold mb-4">Ready to earn with Snipflow?</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed max-w-xl mx-auto">
              Send us a quick email with a link to your content and a sentence about your audience. We&apos;ll get back to you within 48 hours.
            </p>
            <a href="mailto:affiliates@dragonstoneenterprises.com"
              className="inline-block px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all text-sm shadow-lg shadow-amber-500/25">
              Apply Now — affiliates@dragonstoneenterprises.com
            </a>
            <p className="text-xs text-zinc-600 mt-4">We review every application personally. Usually hear back within 48 hours.</p>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div style={{ textAlign: 'center' }}>
            <div>
              <span style={{ color: '#ff4500', fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>SNIP</span>
              <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold', letterSpacing: '3px' }}>FLOW</span>
            </div>
            <div style={{ color: '#888888', fontSize: '11px', letterSpacing: '2px', marginTop: '5px' }}>BY DRAGONSTONE</div>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="/#features" className="hover:text-zinc-300 transition-colors">Features</a>
            <a href="/#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a>
            <a href="/affiliates" className="hover:text-zinc-300 transition-colors">Affiliates</a>
            <a href="https://9245368029329.gumroad.com/l/tnlfjv" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Go Pro</a>
          </div>
          <span className="text-xs text-zinc-600">by Dragonstone Enterprises</span>
        </div>
      </footer>
    </div>
  );
}
