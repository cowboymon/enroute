"use client";

import { useEffect, useState } from "react";
import { CARRIER_TRIVIA } from "@/lib/carrierTrivia";
import { pickNoRepeat } from "@/lib/noRepeatPicker";

const ROTATE_MS = 7000;
const LOW_VOLUME_THRESHOLD = 3;

const ALL_TRIVIA = Object.values(CARRIER_TRIVIA).flat();

type StatsResponse = {
  todaySendCount: number;
};

/**
 * Small, compact line in the story-rail: a real "N messages sent today"
 * stat when there's something worth saying, otherwise rotating carrier
 * trivia. Never fabricates a number — only shows real counts.
 */
export default function StatsTeaser() {
  const [todaySendCount, setTodaySendCount] = useState<number | null>(null);
  const [trivia, setTrivia] = useState<{ text: string; recent: string[] }>({ text: "", recent: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<StatsResponse>) : null))
      .then((json) => {
        if (!cancelled && json) setTodaySendCount(json.todaySendCount);
      })
      .catch(() => {
        // Stats are decorative — fail quietly.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showTrivia = todaySendCount !== null && todaySendCount < LOW_VOLUME_THRESHOLD;

  useEffect(() => {
    if (!showTrivia) return;
    const pick = () => {
      setTrivia((prev) => {
        const { value, updatedRecentIds } = pickNoRepeat(ALL_TRIVIA, prev.recent, 3);
        return { text: value, recent: updatedRecentIds };
      });
    };
    pick();
    const interval = setInterval(pick, ROTATE_MS);
    return () => clearInterval(interval);
  }, [showTrivia]);

  if (todaySendCount === null) return null;

  return (
    <p className="stats-teaser">
      {showTrivia
        ? trivia.text
        : `${todaySendCount} message${todaySendCount === 1 ? "" : "s"} sent today.`}
    </p>
  );
}
