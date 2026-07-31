"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DELIVERY_METHODS, getDeliveryMethod } from "@/lib/deliveryMethods";

type MessageData = {
  id: string;
  status: "PENDING_CHOICE" | "IN_TRANSIT" | "ARRIVED";
  chosenMethod: string | null;
  arrivalAt: string | null;
  createdAt: string;
  readAt: string | null;
  body: string | null;
};

export default function MessageView({ id }: { id: string }) {
  const [data, setData] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [revealing, setRevealing] = useState(false);

  const fetchMessage = useCallback(async () => {
    const res = await fetch(`/api/messages/${id}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Message not found.");
    }
    const json: MessageData = await res.json();
    setData(json);
    return json;
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchMessage()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [fetchMessage]);

  // Tick every second while in transit, purely client-side against arrivalAt.
  useEffect(() => {
    if (!data || data.status !== "IN_TRANSIT") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [data]);

  const arrivalTime = data?.arrivalAt ? new Date(data.arrivalAt).getTime() : null;
  const hasArrived = data?.status === "IN_TRANSIT" && arrivalTime !== null && now >= arrivalTime;

  // Once the client-side countdown determines arrival, re-fetch from server
  // (server is the source of truth) and trigger the reveal animation.
  useEffect(() => {
    if (!hasArrived) return;
    let cancelled = false;
    setRevealing(true);
    fetchMessage().then((json) => {
      if (cancelled) return;
      if (json.status === "ARRIVED") {
        fetch(`/api/messages/${id}/read`, { method: "POST" }).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArrived]);

  useEffect(() => {
    if (data?.status === "ARRIVED" && !data.readAt) {
      fetch(`/api/messages/${id}/read`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json) setData((prev) => (prev ? { ...prev, ...json } : prev));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  async function handleChoose(methodId: string) {
    setChoosing(methodId);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${id}/choose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to choose delivery method.");
      }
      await fetchMessage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChoosing(null);
    }
  }

  const progress = useMemo(() => {
    if (!data?.arrivalAt) return null;
    const arrival = new Date(data.arrivalAt).getTime();
    const created = new Date(data.createdAt).getTime();
    // We don't know the exact "chosen at" time client-side, but arrival -
    // duration is a reasonable proxy since choose happens right before.
    const total = Math.max(arrival - created, 1);
    const elapsed = Math.min(Math.max(now - created, 0), total);
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const remainingMs = Math.max(arrival - now, 0);
    return { pct, remainingMs };
  }, [data, now]);

  if (loading) {
    return <p className="muted">Loading...</p>;
  }

  if (error && !data) {
    return (
      <div className="card">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (data.status === "PENDING_CHOICE") {
    return (
      <div className="card">
        <h1 className="section-title">A message is on its way to you</h1>
        <p className="muted">
          Choose how you&apos;d like it delivered. The content stays sealed
          until it arrives.
        </p>
        {error && <p className="error-text">{error}</p>}
        <div className="method-grid">
          {DELIVERY_METHODS.map((method) => (
            <button
              key={method.id}
              className="method-card"
              disabled={choosing !== null}
              onClick={() => handleChoose(method.id)}
            >
              <div className="method-icon" aria-hidden />
              <span className="method-label stamp">{method.label}</span>
              <span className="method-desc">{method.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (data.status === "IN_TRANSIT" && !hasArrived) {
    const method = data.chosenMethod ? getDeliveryMethod(data.chosenMethod) : undefined;
    const pct = progress?.pct ?? 0;
    return (
      <>
        <div
          className="delivery-scene"
          style={
            method
              ? ({ ["--scene-bg" as string]: `var(--scene-${method.id})` } as React.CSSProperties)
              : undefined
          }
        />
        <div className="delivery-scene-content">
          <span className="scene-method-label">
            Traveling by {method?.label ?? data.chosenMethod}
          </span>
          <div className="scene-countdown">
            {progress ? formatRemaining(progress.remainingMs) : "..."}
          </div>
          <div className="scene-bar-wrap">
            <span
              className="scene-bar-marker"
              style={{ left: `${pct}%` }}
              aria-hidden
            >
              {method?.icon ?? "📦"}
            </span>
            <div className="scene-bar-track">
              <div className="scene-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <p className="scene-hint">
            Come back anytime &mdash; your message will be waiting when it
            arrives.
          </p>
        </div>
      </>
    );
  }

  // ARRIVED (or client-detected arrival while server catches up)
  return (
    <div className="card">
      <h1 className="section-title">It&apos;s arrived!</h1>
      {revealing && !data.body && (
        <div className="seal-wrap">
          <div className="seal">OPENING</div>
        </div>
      )}
      {data.body && <p className="message-body">{data.body}</p>}
      {!data.body && !revealing && <p className="muted">Unsealing your message...</p>}
    </div>
  );
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
