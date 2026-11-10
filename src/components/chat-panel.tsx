"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { fetcher } from "@/lib/api";

type Message = {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName?: string;
};

export default function ChatPanel({
  requestId,
  currentUserId,
  currentUserRole,
  providerName,
  userName,
  onMessagesRead,
}: {
  requestId: string;
  currentUserId: string;
  currentUserRole: string;
  providerName?: string;
  userName?: string;
  onMessagesRead?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const isTyping = useRef(false);
  const historyLoadedFor = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatPartnerName =
    currentUserRole === "Provider"
      ? userName || "Customer"
      : providerName || "Service Provider";

  // Load chat history
  useEffect(() => {
    if (historyLoadedFor.current === requestId) return;
    let alive = true;
    (async () => {
      try {
        const history = await fetcher<Message[]>(`/chat/${requestId}`);
        if (alive) {
          setMessages(history);
          historyLoadedFor.current = requestId;
          if (onMessagesRead) onMessagesRead();
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [requestId, onMessagesRead]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join_request_room", { requestId });

    const onMessage = (msg: unknown) => {
      const incoming = msg as Message;
      setMessages((prev) => {
        if (prev.find((m) => m.id === incoming.id)) return prev;
        const temp = prev.find(
          (m) =>
            m.id.startsWith("temp-") &&
            m.content === incoming.content &&
            m.senderId === incoming.senderId,
        );
        if (temp) return prev.map((m) => (m.id === temp.id ? incoming : m));
        return [...prev, incoming];
      });
      setTyping(false);
    };

    const onTyping = () => {
      if (!isTyping.current) {
        setTyping(true);
        isTyping.current = true;
        setTimeout(() => {
          isTyping.current = false;
          setTyping(false);
        }, 3000);
      }
    };

    socket.on("chat_message", onMessage);
    socket.on("user_typing", onTyping);

    return () => {
      socket.off("chat_message", onMessage);
      socket.off("user_typing", onTyping);
    };
  }, [requestId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;

    setNewMessage("");
    setSending(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      requestId,
      senderId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await fetcher(`/chat/${requestId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-brand px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 font-extrabold text-white">
            {chatPartnerName.charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand bg-emerald-400" />
          </span>
          <div>
            <p className="font-bold text-white">{chatPartnerName}</p>
            <p className="text-xs text-teal-100">
              {currentUserRole === "Provider" ? "Customer" : "Provider"} &bull; chat for request {requestId}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-96 space-y-4 overflow-y-auto bg-canvas/40 p-5"
      >
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-12 w-2/3" />
            <div className="skeleton ml-auto h-12 w-1/2" />
            <div className="skeleton h-12 w-3/5" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Send size={22} />
            </span>
            <p className="mt-4 font-bold text-ink">Start the conversation</p>
            <p className="mt-1 text-sm text-ink-mute">
              Send a message to {chatPartnerName.toLowerCase()}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMe
                        ? "rounded-br-md bg-brand text-white"
                        : "rounded-bl-md border border-line bg-surface text-ink"
                    }`}
                  >
                    <p className="break-words text-sm leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-[11px] ${isMe ? "text-teal-100" : "text-ink-faint"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex items-center gap-1 pl-1 text-sm text-ink-faint">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:300ms]" />
                </span>
                <span>{chatPartnerName} is typing...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => void handleSend(e)}
        className="flex items-center gap-2 border-t border-line bg-surface p-4"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value.length > 0) {
              getSocket().emit("typing", { requestId });
            }
          }}
          placeholder="Type your message..."
          className="input"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          aria-label="Send message"
          className="btn btn-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
