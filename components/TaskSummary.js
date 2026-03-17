"use client";
import { useEffect, useState } from "react";
import { supabase } from "../Lib/supabaseClient";

export default function TaskSummary({ userId, router }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchTasks();
  }, [userId]);

  async function fetchTasks() {
    setLoading(true);
    setError(false);
    const { data, error: err } = await supabase
      .from("personal_tasks")
      .select("status")
      .eq("user_id", userId);

    if (err) {
      setError(true);
      setLoading(false);
      return;
    }

    const total = data.length;
    const done = data.filter((t) => t.status === "done").length;
    const remaining = data.filter((t) => t.status !== "done").length;
    setStats({ total, done, remaining });
    setLoading(false);
  }

  return (
    <div
      onClick={() => router.push("/personal")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(0,0,0,0.2)",
        border: `1px solid ${hovered ? "rgba(var(--accent-rgb, 200,169,110),0.3)" : "rgba(255,255,255,0.05)"}`,
        borderRadius: "16px",
        padding: "1rem 1.5rem",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          letterSpacing: "3px",
          marginBottom: "0.75rem",
        }}
      >
        TUGAS HARI INI
      </div>

      {/* Stats row */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Memuat tugas...
        </div>
      ) : error ? (
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Gagal memuat tugas
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1.2rem" }}>
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Done" value={stats.done} accent />
          <StatBox label="Remaining" value={stats.remaining} />
        </div>
      )}

      {/* Footer arrow */}
      <div
        style={{
          textAlign: "right",
          fontSize: "0.65rem",
          color: "var(--text-muted)",
          marginTop: "0.6rem",
        }}
      >
        → Lihat semua
      </div>
    </div>
  );
}

function StatBox({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "1.6rem",
          fontWeight: "bold",
          color: accent ? "var(--accent)" : "var(--text-main)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          letterSpacing: "1px",
          marginTop: "3px",
        }}
      >
        {label}
      </div>
    </div>
  );
}
