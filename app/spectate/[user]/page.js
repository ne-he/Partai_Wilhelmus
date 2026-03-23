"use client";
import { use, useState, useEffect } from "react";
import { supabase } from "../../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import PageTransition from "../../../components/PageTransition";
import useBreakpoint from "../../../Lib/hooks/useBreakpoint";

export const dynamic = "force-dynamic";

const statusColors = {
  pending: { color: "#c8a96e", label: "Pending" },
  in_progress: { color: "#64a0c8", label: "In Progress" },
  done: { color: "#64b478", label: "Done" },
};

export default function SpectatePage({ params }) {
  const { user: username } = use(params);
  const [tasks, setTasks] = useState([]);
  const [targetProfile, setTargetProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  useEffect(() => { init(); }, [username]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: myProf } = await supabase.from("users").select("*").eq("id", user.id).single();
    setMyProfile(myProf);
    const { data: target } = await supabase.from("users").select("*").eq("username", username).single();
    if (!target) {
      // try by role
      const { data: byRole } = await supabase.from("users").select("*").eq("role", username).single();
      setTargetProfile(byRole);
      if (byRole) await fetchTasks(byRole.id);
    } else {
      setTargetProfile(target);
      await fetchTasks(target.id);
    }
    setLoading(false);
  }

  async function fetchTasks(uid) {
    const { data } = await supabase
      .from("personal_tasks").select("*")
      .eq("user_id", uid).order("updated_at", { ascending: false });
    setTasks(data || []);
  }

  if (loading) return <LoadingScreen />;

  const done = tasks.filter(t => t.status === "done").length;

  return (
    <PageTransition>
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar user={myProfile} />
      <main style={{ marginLeft: "220px", flex: 1, padding: "2.5rem 3rem", paddingBottom: isMobile ? "5rem" : undefined }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "3px", marginBottom: "6px" }}>SPECTATE</div>
          <h1 style={{ fontSize: "2rem", color: "var(--text-main)", fontWeight: "normal", textTransform: "capitalize" }}>
            {username}'s Tasks
          </h1>
          {targetProfile && (
            <div style={{
              display: "inline-block", marginTop: "0.5rem",
              padding: "3px 12px", background: "rgba(200,169,110,0.1)",
              border: "1px solid rgba(200,169,110,0.3)", borderRadius: "20px",
              fontSize: "0.7rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "2px",
            }}>
              {targetProfile.role}
            </div>
          )}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <StatBadge label="Total" value={tasks.length} />
            <StatBadge label="Done" value={done} accent />
            <StatBadge label="Remaining" value={tasks.length - done} />
          </div>
        </div>

        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "2px", marginBottom: "1rem" }}>
          READ ONLY · {tasks.length} TASKS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", maxWidth: "700px" }}>
          {tasks.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "2rem 0" }}>
              Tidak ada tugas untuk {username} ✦
            </div>
          )}
          {tasks.map(t => {
            const s = statusColors[t.status] || statusColors.pending;
            return (
              <div key={t.id} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "1rem 1.2rem",
                display: "flex", alignItems: "center", gap: "1rem",
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1, color: t.status === "done" ? "var(--text-muted)" : "var(--text-main)", textDecoration: t.status === "done" ? "line-through" : "none", fontSize: "0.95rem" }}>
                  {t.title}
                </div>
                <div style={{
                  padding: "4px 12px", borderRadius: "20px",
                  background: `${s.color}18`, color: s.color,
                  fontSize: "0.72rem", letterSpacing: "1px",
                }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </PageTransition>
  );
}

function StatBadge({ label, value, accent }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "10px", padding: "0.6rem 1.2rem", textAlign: "center",
    }}>
      <div style={{ fontSize: "1.4rem", color: accent ? "var(--accent)" : "var(--text-main)", fontWeight: "bold" }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "1px" }}>{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
      <div style={{ color: "var(--accent)", letterSpacing: "6px", fontSize: "1.8rem", fontFamily: "'Playfair Display', Georgia, serif" }}>Bentar...</div>
    </div>
  );
}
