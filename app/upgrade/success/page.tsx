"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function upgrade() {
      try {
        const res = await fetch("/api/upgrade", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          setTimeout(() => router.push("/"), 4000);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }
    upgrade();
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "20px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "24px",
        padding: "60px 48px",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        backdropFilter: "blur(20px)",
      }}>

        {status === "loading" && (
          <>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "3px solid rgba(99, 102, 241, 0.3)",
              borderTop: "3px solid #6366f1",
              animation: "spin 1s linear infinite",
              margin: "0 auto 32px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "0 0 12px" }}>
              Activating your Pro account{dots}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", margin: 0 }}>
              This will only take a second
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 32px",
              fontSize: "32px",
            }}>
              ✓
            </div>
            <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 800, margin: "0 0 12px" }}>
              You're Pro now 🎉
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 32px" }}>
              Unlimited generations unlocked. Redirecting you to the app...
            </p>
            <div style={{
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "left",
            }}>
              {["Unlimited content transformations", "Blog posts, Twitter threads & Shorts", "AI humanizer on every output", "Priority processing"].map((feature) => (
                <div key={feature} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "14px",
                  marginBottom: "10px",
                }}>
                  <span style={{ color: "#6366f1", fontWeight: 700 }}>✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 32px",
              fontSize: "32px",
            }}>
              ⚠️
            </div>
            <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "0 0 12px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", margin: "0 0 24px" }}>
              Email us and we'll activate your account manually within the hour.
            </p>
            <a href="mailto:contact@dragonstone.online" style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "15px",
            }}>
              Contact Support
            </a>
          </>
        )}

      </div>
    </div>
  );
}