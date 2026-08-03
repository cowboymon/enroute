"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DELIVERY_METHODS, getDeliveryMethod } from "@/lib/deliveryMethods";
import { CARRIER_SIZES, journeyPosition } from "@/lib/journeyPaths";
import ChapterShell from "@/app/components/ChapterShell";
import CarrierSprite from "@/app/components/CarrierSprite";

type MessageData = {
  id: string;
  status: "PENDING_CHOICE" | "IN_TRANSIT" | "ARRIVED";
  senderName: string;
  recipientName: string;
  chosenMethod: string | null;
  arrivalAt: string | null;
  createdAt: string;
  readAt: string | null;
  body: string | null;
};

function formatRemaining(ms: number): string {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  if (mins < 60) return `About ${mins} min${mins === 1 ? "" : "s"}`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return `About ${hours} hr${hours === 1 ? "" : "s"}${rest ? ` ${rest} min` : ""}`;
}

export default function MessageView({ id }: { id: string }) {
  const [data, setData] = useState<MessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchMessage = useCallback(async () => {
    const res = await fetch(`/api/messages/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Message not found.");
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

  // Tick every second while in transit, purely for the visual countdown —
  // arrival is still determined by the server's arrivalAt.
  useEffect(() => {
    if (!data || data.status !== "IN_TRANSIT") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [data]);

  const arrivalTime = data?.arrivalAt ? new Date(data.arrivalAt).getTime() : null;
  const hasArrived = data?.status === "IN_TRANSIT" && arrivalTime !== null && now >= arrivalTime;

  // Once the client-side countdown determines arrival, re-fetch from the
  // server (source of truth) and mark it read.
  useEffect(() => {
    if (!hasArrived) return;
    let cancelled = false;
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

  async function handleDispatch() {
    if (!selected) return;
    setChoosing(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${id}/choose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodId: selected }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to choose delivery method.");
      }
      await fetchMessage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChoosing(false);
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
    const pct = Math.min(1, Math.max(0, elapsed / total));
    const remainingMs = Math.max(arrival - now, 0);
    return { pct, remainingMs };
  }, [data, now]);

  if (loading) {
    return (
      <ChapterShell stageIndex={0} status="Post office open" railDispatch="Loading...">
        <section className="chapter">
          <p className="muted">Loading...</p>
        </section>
      </ChapterShell>
    );
  }

  if (error && !data) {
    return (
      <ChapterShell stageIndex={0} status="Post office open" railDispatch="Nothing found">
        <section className="chapter">
          <p className="error-text">{error}</p>
        </section>
      </ChapterShell>
    );
  }

  if (!data) return null;

  const method = data.chosenMethod ? getDeliveryMethod(data.chosenMethod) : undefined;
  const railDispatch = method ? `${method.label} · ${data.recipientName}` : "Nothing in the wild yet";

  // ---------------- choose ----------------
  if (data.status === "PENDING_CHOICE") {
    const chosenPreview = selected ? getDeliveryMethod(selected) : undefined;
    return (
      <ChapterShell stageIndex={1} status="Post office open" railDispatch={railDispatch}>
        <section className="chapter choose-chapter">
          <div className="chapter-copy choose-heading">
            <span className="kicker">
              A message for <b>{data.recipientName}</b>
            </span>
            <h2>Pick your messenger.</h2>
            <p>Fast isn&apos;t better. It&apos;s just less dramatic.</p>
          </div>

          <div className="carrier-scroller">
            <div className="carrier-grid" role="list" aria-label="Choose a messenger" ref={gridRef}>
              {DELIVERY_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="carrier-card"
                  style={{ ["--card" as string]: m.color }}
                  aria-pressed={selected === m.id}
                  onClick={() => setSelected(m.id)}
                >
                  <div className="carrier-visual">
                    <CarrierSprite src={m.sprite} colorKey label={`${m.label} sprite`} />
                  </div>
                  <div className="carrier-meta">
                    <strong>{m.label}</strong>
                    <span>{m.speed}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="scroller-controls" aria-label="Browse messengers">
              <button
                type="button"
                className="scroller-button"
                aria-label="Previous messengers"
                onClick={() =>
                  gridRef.current?.scrollBy({
                    left: -Math.min(gridRef.current.clientWidth * 0.82, 440),
                    behavior: "smooth",
                  })
                }
              >
                ←
              </button>
              <span>Drag or scroll to browse</span>
              <button
                type="button"
                className="scroller-button"
                aria-label="Next messengers"
                onClick={() =>
                  gridRef.current?.scrollBy({
                    left: Math.min(gridRef.current.clientWidth * 0.82, 440),
                    behavior: "smooth",
                  })
                }
              >
                →
              </button>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="selection-dock">
            <div>
              <span>Your choice</span>
              <strong>{chosenPreview?.label ?? "Nobody yet"}</strong>
            </div>
            <p>{chosenPreview?.copy ?? "Pick the creature or contraption that feels right."}</p>
            <button
              className="button button--dark"
              type="button"
              disabled={!selected || choosing}
              onClick={handleDispatch}
            >
              <span>
                {choosing
                  ? "Sending..."
                  : chosenPreview
                  ? `Send them on their way`
                  : "Send them on their way"}
              </span>
              <b>&rarr;</b>
            </button>
          </div>
        </section>
      </ChapterShell>
    );
  }

  // ---------------- transit ----------------
  if (data.status === "IN_TRANSIT" && !hasArrived && method) {
    const pct = progress?.pct ?? 0;
    let oddityIndex = 0;
    method.events.forEach((threshold, index) => {
      if (pct >= threshold) oddityIndex = index;
    });
    const progressNote = method.progress[pct < 0.18 ? 0 : pct < 0.78 ? 1 : 2];
    const [x, y, scale, rotate] = journeyPosition(method.id, pct);
    const isObserving = method.events.some((point) => Math.abs(pct - point) < 0.018);
    const arrivalLabel = arrivalTime
      ? new Date(arrivalTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : "";

    return (
      <ChapterShell stageIndex={2} status="One message in the wild" railDispatch={railDispatch}>
        <section className="chapter transit-chapter" style={{ padding: 0 }}>
          <div className="scene" style={{ backgroundImage: `url('${method.scene}')` }}>
            <div
              className={`traveller${method.air ? " is-air" : " is-ground"}${isObserving ? " is-observing" : ""}`}
              style={
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  ["--journey-scale" as string]: scale,
                  ["--journey-rotate" as string]: `${rotate}deg`,
                  ["--carrier-size" as string]: `${CARRIER_SIZES[method.id] ?? 200}px`,
                } as React.CSSProperties
              }
            >
              <CarrierSprite
                src={method.sprite}
                frame={isObserving ? 2 : 1}
                colorKey
                label={`${method.label} carrying the message`}
              />
            </div>
            <div className="scene-caption">
              <span>
                Expected around {arrivalLabel} · {method.label}
              </span>
              <b>{progress ? formatRemaining(progress.remainingMs) : "A little while"}</b>
            </div>
          </div>
          <div className="transit-panel">
            <div>
              <span className="kicker">Currently somewhere out there</span>
              <h2>{method.headline}</h2>
              <p>{method.copy}</p>
              <div className="field-note">
                <div className="field-note__meta">
                  <span>Unscheduled character event</span>
                  <b>{String(oddityIndex + 1).padStart(2, "0")}</b>
                </div>
                <div className="field-note__body">
                  <p key={oddityIndex} style={{ animation: "note-in .42s var(--ease)" }}>
                    {method.oddities[oddityIndex]}
                  </p>
                </div>
              </div>
            </div>
            <div className="progress-wrap">
              <div className="progress-copy">
                <span>{progressNote}</span>
                <b>{Math.floor(pct * 100)}%</b>
              </div>
              <div className="progress-track">
                <i style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          </div>
        </section>
      </ChapterShell>
    );
  }

  // ---------------- reveal ----------------
  return (
    <ChapterShell stageIndex={3} status="Delivery complete" railDispatch={railDispatch}>
      <section className="chapter reveal-chapter">
        {method && (
          <i
            className={`postal-stamp atlas-three ${method.deliveredBadgeClass} reveal-badge`}
            aria-hidden="true"
          />
        )}
        <div className="arrival-stamp">Delivered, against the odds</div>
        <div className="open-letter">
          <span className="kicker">
            A note from <b>{data.senderName}</b>
          </span>
          <blockquote>{data.body ? `"${data.body}"` : "Unsealing your message..."}</blockquote>
          <div className="signature">Carried by {method?.label ?? data.chosenMethod}</div>
        </div>
        <div className="reveal-actions">
          <a className="button button--primary" href="/">
            <span>Send one back</span>
            <b>&#8599;</b>
          </a>
        </div>
      </section>
    </ChapterShell>
  );
}
