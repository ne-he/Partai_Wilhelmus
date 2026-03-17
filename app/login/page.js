"use client";
import { useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const EMAIL_ROLE_MAP = {
  "papa@example.com":   { username: "Papa",  role: "papa" },
  "mama@example.com":  { username: "Mama",  role: "mama" },
  "nemi@example.com": { username: "Nemi",  role: "nemi" },
  "venly@example.com":  { username: "Venly", role: "venly" },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Pastikan row di tabel users ada
    const user = data.user;
    const { data: existing } = await supabase.from("users").select("id").eq("id", user.id).single();
    if (!existing) {
      const info = EMAIL_ROLE_MAP[user.email] || { username: user.email.split("@")[0], role: "nemi" };
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        username: info.username,
        role: info.role,
      });
    }

    router.push("/home");
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-main)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", border: "1px solid rgba(200,169,110,0.08)", top: "-100px", right: "-100px" }} />
      <div style={{ position: "absolute", width: "300px", height: "300px", borderRadius: "50%", border: "1px solid rgba(200,169,110,0.05)", bottom: "-80px", left: "-80px" }} />

      <div style={{
        width: "100%", maxWidth: "420px",
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "20px", padding: "3rem 2.5rem", position: "relative",
      }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "2rem", color: "var(--accent)", letterSpacing: "4px", fontWeight: "bold" }}>PARTAI</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "4px", marginTop: "4px" }}>WILHELMUS</div>
          <div style={{ width: "40px", height: "1px", background: "var(--accent)", margin: "1.2rem auto 0" }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required
              style={{ width: "100%", padding: "0.8rem 1rem", background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-main)", fontSize: "0.9rem", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: "100%", padding: "0.8rem 1rem", background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-main)", fontSize: "0.9rem", outline: "none" }} />
          </div>

          {error && (
            <div style={{ padding: "0.7rem 1rem", background: "rgba(180,60,60,0.15)", border: "1px solid rgba(180,60,60,0.3)", borderRadius: "8px", color: "#e07070", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: "0.5rem", padding: "0.9rem",
            background: loading ? "var(--bg-card2)" : "var(--accent)",
            border: "none", borderRadius: "10px",
            color: loading ? "var(--text-muted)" : "#1a1612",
            fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "2px",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "MASUK..." : "MASUK"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Papa · Mama · Nemi · Venly
        </div>
      </div>
    </div>
  );
}
