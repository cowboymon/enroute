"use client";

import { useState } from "react";
import ChapterShell from "./components/ChapterShell";

export default function HomePage() {
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, recipientName, body: message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }
      const data = await res.json();
      setShareLink(`${window.location.origin}/m/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setShareLink(null);
    setSenderName("");
    setRecipientName("");
    setMessage("");
    setCopied(false);
  }

  async function copyLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (shareLink) {
    return (
      <ChapterShell
        stageIndex={0}
        status="Post office open"
        railDispatch={`Sealed for ${recipientName || "them"}`}
      >
        <section className="chapter handoff-chapter">
          <div className="sealed-letter" aria-hidden="true">
            <span />
            <b>{(senderName[0] || "?").toUpperCase()}</b>
          </div>
          <div className="chapter-copy chapter-copy--center">
            <span className="kicker">Message sealed</span>
            <h2>Sealed. {recipientName || "They"} just need the link.</h2>
            <p>
              Enroute doesn&apos;t send real emails in this prototype &mdash; share this
              link with {recipientName || "them"} directly. They&apos;ll pick how it
              travels, and how long they&apos;re willing to wait.
            </p>
            <p className="tiny-proof" style={{ wordBreak: "break-all" }}>
              {shareLink}
            </p>
            <button className="button button--primary" type="button" onClick={copyLink}>
              <span>{copied ? "Copied!" : "Copy the link"}</span>
              <b>{copied ? "✓" : "→"}</b>
            </button>
            <button className="text-button" type="button" onClick={reset}>
              Write another message
            </button>
          </div>
        </section>
      </ChapterShell>
    );
  }

  return (
    <ChapterShell stageIndex={0} status="Post office open" railDispatch="Nothing in the wild yet">
      <section className="chapter compose-chapter">
        <div className="chapter-copy">
          <span className="kicker">From your brain to their inbox, eventually</span>
          <h2>What do you want to say?</h2>
          <p>
            No typing indicators. No read receipts. No opportunity to unsend it in a
            panic.
          </p>
        </div>
        <form className="letter-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Your name
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Mon"
                maxLength={30}
                required
              />
            </label>
            <label>
              Their name
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Olive"
                maxLength={30}
                required
              />
            </label>
          </div>
          <label className="message-label">
            Your message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={280}
              placeholder="Something you mean, something silly, or both."
              required
            />
            <span className="count">
              <b>{message.length}</b>/280
            </span>
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="form-footer">
            <span className="tiny-proof">Sealed until it arrives. Scout&apos;s honour.</span>
            <button className="button button--primary" type="submit" disabled={submitting}>
              <span>{submitting ? "Sealing..." : "Seal the note"}</span>
              <b>&rarr;</b>
            </button>
          </div>
        </form>
      </section>
    </ChapterShell>
  );
}
