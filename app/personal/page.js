"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../Lib/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export const dynamic = "force-dynamic";

const statusColors = {
  pending: { bg: "rgba(200,169,110,0.1)", color: "#c8a96e", label: "Pending" },
  in_progress: { bg: "rgba(100,160,200,0.1)", color: "#64a0c8", label: "In Progress" },
  done: { bg: "rgba(100,180,120,0.1)", color: "#64b478", label: "Done" },
};

export default function PersonalTasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUser(user);
    const { data: prof } = await supabase.from("users").select("*").eq("id", user.id).single();
    setProfile(prof);
    await fetchTasks(user.id);
    setLoading(false);
  }

  async function fetchTasks(uid) {
    if (!uid) return;
    const { data } = await supabase
      .from("personal_tasks")
      .select("*")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });
    setTasks(data || []);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    const { error } = await supabase.from("personal_tasks").insert({ user_id: user.id, title: title.trim() });
    if (error) { console.error("Add task error:", error); return; }
    setTitle("");
    fetchTasks(user.id);
  }

  async function updateStatus(id, status) {
    await supabase.from("personal_tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    fetchTasks(user.id);
  }

  async function deleteTask(id) {
    await supabase.from("personal_tasks").delete().eq("id", id);
    fetchTasks(user.id);
  }

  if (loading) return <LoadingScreen />;

  const done = tasks.filter(t => t.status === "done").length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      <Sidebar user={profile} />
      <main style={{ marginLeft: "220px", flex: 1, padding: "2.5rem 3rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "3px", marginBottom: "6px" }}>
            PERSONAL
          </div>
          <h1 style={{ fontSize: "2rem", color: "var(--text-main)", fontWeight: "normal" }}>
            My Tasks
          </h1>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem" }}>
            <Stat label="Total" value={tasks.length} />
            <Stat label="Done" value={done} accent />
            <Stat label="Remaining" value={tasks.length - done} />
          </div>
        </div>

        {/* Add form */}
        <form onSubmit={addTask} style={{ display: "flex", gap: "0.8rem", marginBottom: "2rem", maxWidth: "600px" }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tambah tugas baru..."
            style={{
              flex: 1,
              padding: "0.8rem 1.2rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text-main)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button type="submit" style={{
            padding: "0.8rem 1.5rem",
            background: "var(--accent)",
            border: "none",
            borderRadius: "10px",
            color: "#1a1612",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.85rem",
            letterSpacing: "1px",
          }}>
            + ADD
          </button>
        </form>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", maxWidth: "700px" }}>
          {tasks.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "2rem 0" }}>
              Belum ada tugas. Tambahkan sekarang ✦
            </div>
          )}
          {tasks.map(t => (
            <TaskCard key={t.id} task={t} onStatus={updateStatus} onDelete={deleteTask} />
          ))}
        </div>
      </main>
    </div>
  );
}

function TaskCard({ task, onStatus, onDelete }) {
  const s = statusColors[task.status] || statusColors.pending;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1rem 1.2rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      transition: "border-color 0.2s",
    }}>
      {/* Status dot */}
      <div style={{
        width: "8px", height: "8px", borderRadius: "50%",
        background: s.color, flexShrink: 0,
      }} />

      <div style={{ flex: 1 }}>
        <div style={{
          color: task.status === "done" ? "var(--text-muted)" : "var(--text-main)",
          textDecoration: task.status === "done" ? "line-through" : "none",
          fontSize: "0.95rem",
        }}>
          {task.title}
        </div>
      </div>

      {/* Status selector */}
      <select
        value={task.status}
        onChange={e => onStatus(task.id, e.target.value)}
        style={{
          background: s.bg,
          border: `1px solid ${s.color}40`,
          borderRadius: "20px",
          color: s.color,
          padding: "4px 10px",
          fontSize: "0.75rem",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <button
        onClick={() => onDelete(task.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: "1rem",
          padding: "4px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "0.6rem 1.2rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "1.4rem", color: accent ? "var(--accent)" : "var(--text-main)", fontWeight: "bold" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "1px" }}>{label}</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
      <div style={{ color: "var(--accent)", letterSpacing: "4px", fontSize: "0.8rem" }}>LOADING...</div>
    </div>
  );
}
