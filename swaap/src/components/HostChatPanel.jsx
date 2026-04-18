"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue, push } from "firebase/database";
import { rtdb } from "@/lib/firebase-app";
import { eventPairMessagesPath, pairMessagesPath } from "@/lib/pair-messages";

/**
 * In-app 1:1 messaging via Firebase Realtime Database.
 * With `eventId`, messages live under `event_pair_messages/...` (host ↔ guest per event).
 * Otherwise `pair_messages/...`. Rules should restrict read/write to the two participant uids.
 */
export function HostChatPanel({ myUid, peerUid, peerLabel, title = "Message", eventId = null }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const path = useMemo(() => {
    if (!myUid || !peerUid || myUid === peerUid) return null;
    if (eventId) return eventPairMessagesPath(eventId, myUid, peerUid);
    return pairMessagesPath(myUid, peerUid);
  }, [myUid, peerUid, eventId]);

  useEffect(() => {
    if (!path) return undefined;
    setError("");
    const r = ref(rtdb, path);
    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val();
        const list = v
          ? Object.entries(v)
              .map(([id, m]) => ({ id, ...m }))
              .sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0))
          : [];
        setMessages(list);
      },
      (err) => {
        setError(err?.message || "Could not load messages. Check Realtime Database URL and rules.");
      }
    );
    return () => unsub();
  }, [path]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = text.trim();
    if (!trimmed || !path || !myUid) return;
    setSending(true);
    try {
      await push(ref(rtdb, path), {
        text: trimmed,
        senderId: myUid,
        createdAt: Date.now(),
      });
      setText("");
    } catch (err) {
      setError(err?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (!myUid) {
    return (
      <p className="text-sm text-neutral-600">
        Sign in to exchange messages with {peerLabel || "this member"}.
      </p>
    );
  }

  if (myUid === peerUid) {
    return <p className="text-sm text-neutral-500">You are the host for this event.</p>;
  }

  if (!path) {
    return null;
  }

  return (
    <div className="flex max-h-[min(420px,55vh)] flex-col rounded-xl border border-[color-mix(in_srgb,var(--swaap-primary)_14%,white)] bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-sm font-semibold text-[var(--swaap-ink)]">{title}</p>
        <p className="text-xs text-neutral-500">Chat is stored in Firebase Realtime Database.</p>
      </div>
      <div className="min-h-[200px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myUid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-[var(--swaap-primary)] text-white"
                      : "border border-neutral-200 bg-neutral-50 text-neutral-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {error ? <p className="px-4 text-xs text-red-600">{error}</p> : null}
      <form onSubmit={send} className="flex gap-2 border-t border-neutral-100 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-[var(--swaap-ink)] focus:border-[var(--swaap-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--swaap-primary)_22%,transparent)]"
          maxLength={4000}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-xl bg-[var(--swaap-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
