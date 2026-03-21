"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../Lib/supabaseClient";

const navItems = [
  { href: "/home", label: "Home", icon: "✦" },
  { href: "/personal", label: "Personal", icon: "◆" },
  { href: "/family", label: "Family", icon: "⌂" },
  { href: "/summary", label: "Daily Verse", icon: "◈" },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside style={{
      width: "220px",
      minHeight: "100vh",
      background: "var(--bg-card)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "2rem 1.2rem",
      gap: "0.5rem",
      position: "fixed",
      top: 0,
      left: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "1.4rem", color: "var(--accent)", fontWeight: "bold", letterSpacing: "2px" }}>
          PARTAI
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "3px", marginTop: "2px" }}>
          WILHELMUS
        </div>
      </div>

      {/* User info */}
      {user && (
        <div style={{
          background: "var(--bg-card2)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "0.8rem",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "2px", marginBottom: "4px" }}>
            LOGGED IN AS
          </div>
          <div style={{ color: "var(--accent)", fontWeight: "bold", textTransform: "capitalize" }}>
            {user.username || user.email}
          </div>
          {user.role && (
            <div style={{
              display: "inline-block",
              marginTop: "4px",
              fontSize: "0.65rem",
              background: "var(--accent2)",
              color: "#1a1612",
              padding: "2px 8px",
              borderRadius: "20px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              {user.role}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0.7rem 1rem",
              borderRadius: "8px",
              textDecoration: "none",
              color: active ? "var(--accent)" : "var(--text-muted)",
              background: active ? "rgba(200,169,110,0.1)" : "transparent",
              borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: "0.9rem",
              transition: "all 0.2s",
            }}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Spectate section */}
        <div style={{ marginTop: "1rem", marginBottom: "0.3rem", fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "2px", paddingLeft: "1rem" }}>
          SPECTATE
        </div>
        {["papa", "mama", "nemi", "venly"].map((name) => (
          <Link key={name} href={`/spectate/${name}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            textDecoration: "none",
            color: pathname === `/spectate/${name}` ? "var(--accent)" : "var(--text-muted)",
            background: pathname === `/spectate/${name}` ? "rgba(200,169,110,0.1)" : "transparent",
            fontSize: "0.82rem",
            transition: "all 0.2s",
            textTransform: "capitalize",
          }}>
            <span style={{ fontSize: "0.6rem" }}>◉</span>
            {name}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        marginTop: "auto",
        padding: "0.7rem",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        color: "var(--text-muted)",
        cursor: "pointer",
        fontSize: "0.85rem",
        transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-muted)"; }}
      >
        ⎋ Logout
      </button>
    </aside>
  );
}
