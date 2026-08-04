"use client";

import { useState } from "react";
import ChapterShell from "./components/ChapterShell";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactType = "email";

function ContactField({
  label,
  hint,
  value,
  onValueChange,
  showError,
}: {
  label: string;
  hint: string;
  value: string;
  onValueChange: (v: string) => void;
  showError: boolean;
}) {
  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && EMAIL_RE.test(trimmed);
  return (
    <label>
      <span className="field-label-row">
        {label}
        <span className="field-hint field-hint--inline">{hint}</span>
      </span>
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="e.g. name@example.com"
        inputMode="email"
        required
      />
      <span className="field-error-slot">
        {showError && !isValid && <span className="error-text">Enter a valid email address.</span>}
      </span>
    </label>
  );
}

export default function HomePage() {
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const recipientContactType: ContactType = "email";
  const [recipientContact, setRecipientContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [senderLink, setSenderLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [senderCopied, setSenderCopied] = useState(false);

  function isContactValid(value: string): boolean {
    return EMAIL_RE.test(value.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!isContactValid(recipientContact)) {
      setError("Enter a valid email for them before sealing the note.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          recipientName,
          body: message,
          recipientContactType,
          recipientContact: recipientContact.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }
      const data = await res.json();
      setShareLink(`${window.location.origin}/m/${data.id}`);
      setSenderLink(`${window.location.origin}/m/${data.id}?as=sender`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setShareLink(null);
    setSenderLink(null);
    setSenderName("");
    setRecipientName("");
    setMessage("");
    setRecipientContact("");
    setTouched(false);
    setCopied(false);
    setSenderCopied(false);
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

  async function copySenderLink() {
    if (!senderLink) return;
    try {
      await navigator.clipboard.writeText(senderLink);
      setSenderCopied(true);
    } catch {
      setSenderCopied(false);
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
          <i
            className="postal-stamp atlas-two badge-handle handoff-badge"
            aria-hidden="true"
          />
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
            {senderLink && (
              <>
                <p className="tiny-proof" style={{ marginTop: "1rem" }}>
                  Want to watch the journey yourself? Here&apos;s your own link (you
                  can&apos;t re-pick their delivery method from it):
                </p>
                <p className="tiny-proof" style={{ wordBreak: "break-all" }}>
                  {senderLink}
                </p>
                <button className="button" type="button" onClick={copySenderLink}>
                  <span>{senderCopied ? "Copied!" : "Copy your link"}</span>
                  <b>{senderCopied ? "✓" : "→"}</b>
                </button>
              </>
            )}
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
            <div className="field-group">
              <span className="field-group__label">From</span>
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
            </div>
            <div className="field-group">
              <span className="field-group__label">To</span>
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
              <ContactField
                label="Email address"
                hint="Just for the link."
                value={recipientContact}
                onValueChange={setRecipientContact}
                showError={touched}
              />
            </div>
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
          <div className="form-error-slot">{error && <p className="error-text">{error}</p>}</div>
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
