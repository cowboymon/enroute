"use client";

import { useState } from "react";

export default function HomePage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }
      const data = await res.json();
      const link = `${window.location.origin}/m/${data.id}`;
      setShareLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (shareLink) {
    return (
      <div className="card">
        <h1 className="section-title">Sent!</h1>
        <p>
          Your message is on its way. Since Enroute doesn&apos;t send real
          emails in this prototype, share this link with your recipient
          directly &mdash; it&apos;s exactly what they&apos;d receive:
        </p>
        <p className="share-link">{shareLink}</p>
        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => {
            setShareLink(null);
            setRecipientEmail("");
            setBody("");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="section-title">Send a message</h1>
      <p className="muted">
        Your recipient chooses how it travels &mdash; and how long it takes
        to arrive.
      </p>
      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div className="field">
          <label htmlFor="recipientEmail">Recipient email</label>
          <input
            id="recipientEmail"
            className="input"
            type="email"
            required
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="friend@example.com"
          />
        </div>
        <div className="field">
          <label htmlFor="body">Message</label>
          <textarea
            id="body"
            className="textarea"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write what's on your mind..."
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
