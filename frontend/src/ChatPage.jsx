import { useState, useRef, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8003";

export default function ChatPage({ filename, pdfInfo, onReset }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `I've analyzed **${filename}** — ${pdfInfo?.pages || "?"} pages, ${pdfInfo?.chunks || "?"} chunks indexed. Ask me anything about it!`,
      matched: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        matched: data.matched,
        page_number: data.page_number,
        line_number: data.line_number,
        context_snippet: data.context_snippet,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to backend. Please check the server.", matched: false },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (msg, i) => {
    const isUser = msg.role === "user";
    return (
      <div key={i} style={{ ...styles.msgRow, ...(isUser ? styles.msgRowUser : {}) }}>
        {!isUser && (
          <div style={styles.avatar}>⬡</div>
        )}
        <div style={{ maxWidth: "75%" }}>
          <div style={{ ...styles.bubble, ...(isUser ? styles.bubbleUser : styles.bubbleAssistant) }}>
            <p style={styles.bubbleText}>
              {msg.content.split("**").map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          </div>

          {/* Source reference badge */}
          {msg.matched && msg.page_number && (
            <div style={styles.sourceBadge}>
              <span style={styles.sourcePill}>📄 Page {msg.page_number}</span>
              {msg.line_number && (
                <span style={styles.sourcePill}>↳ Line {msg.line_number}</span>
              )}
            </div>
          )}

          {/* Context snippet (collapsible) */}
          {msg.matched && msg.context_snippet && (
            <details style={styles.snippet}>
              <summary style={styles.snippetSummary}>View source context</summary>
              <p style={styles.snippetText}>{msg.context_snippet}</p>
            </details>
          )}

          {/* No match badge */}
          {msg.matched === false && msg.role === "assistant" && i > 0 && (
            <div style={styles.noMatch}>⚠ No matching context found in PDF</div>
          )}
        </div>
        {isUser && <div style={styles.avatarUser}>U</div>}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      {/* Chat area */}
      <div style={styles.chatArea}>
        {/* Chat header */}
        <div style={styles.chatHeader}>
          <p style={styles.chatHeaderTitle}>Chat with your PDF</p>
          <p style={styles.chatHeaderSub}>Answers include page & line references from the document</p>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map(renderMessage)}

          {loading && (
            <div style={styles.msgRow}>
              <div style={styles.avatar}>⬡</div>
              <div style={styles.typingBubble}>
                <span style={styles.dot} />
                <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about the PDF..."
            style={styles.textarea}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, ...(loading || !input.trim() ? styles.sendBtnDisabled : {}) }}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
        <p style={styles.hint}>Press Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    height: "100%",
    width: "100%",
    background: "transparent",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: "260px",
    flexShrink: 0,
    background: "#0d1117",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    overflowY: "auto",
  },
  sidebarLogo: {
    fontSize: "1.3rem",
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  pdfCard: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  pdfIcon: { fontSize: "1.4rem", flexShrink: 0 },
  pdfName: {
    color: "#e2e8f0",
    fontSize: "0.82rem",
    fontWeight: "600",
    margin: "0 0 4px",
    wordBreak: "break-all",
  },
  pdfMeta: { color: "#64748b", fontSize: "0.75rem", margin: 0 },
  sidebarSection: { display: "flex", flexDirection: "column", gap: "6px" },
  sidebarLabel: { color: "#475569", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 4px" },
  pipelineStep: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#94a3b8",
    fontSize: "0.8rem",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "8px",
  },
  resetBtn: {
    marginTop: "auto",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#64748b",
    borderRadius: "10px",
    padding: "10px",
    cursor: "pointer",
    fontSize: "0.8rem",
    transition: "all 0.2s",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "20px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
  },
  chatHeaderTitle: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: "1rem",
    margin: "0 0 2px",
  },
  chatHeaderSub: { color: "#475569", fontSize: "0.78rem", margin: 0 },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  msgRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: "32px",
    height: "32px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  avatarUser: {
    width: "32px",
    height: "32px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontSize: "0.75rem",
    fontWeight: "700",
    flexShrink: 0,
  },
  bubble: {
    borderRadius: "14px",
    padding: "12px 16px",
  },
  bubbleAssistant: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderTopLeftRadius: "4px",
  },
  bubbleUser: {
    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
    borderTopRightRadius: "4px",
  },
  bubbleText: {
    color: "#e2e8f0",
    fontSize: "0.9rem",
    lineHeight: "1.6",
    margin: 0,
  },
  sourceBadge: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  sourcePill: {
    background: "rgba(74,222,128,0.12)",
    border: "1px solid rgba(74,222,128,0.25)",
    color: "#4ade80",
    borderRadius: "20px",
    padding: "3px 10px",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  snippet: {
    marginTop: "8px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.78rem",
    color: "#64748b",
  },
  snippetSummary: {
    color: "#6366f1",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: "600",
    userSelect: "none",
  },
  snippetText: {
    marginTop: "8px",
    lineHeight: "1.5",
    fontStyle: "italic",
    margin: "8px 0 0",
  },
  noMatch: {
    marginTop: "8px",
    color: "#f59e0b",
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  typingBubble: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    borderTopLeftRadius: "4px",
    padding: "14px 18px",
    display: "flex",
    gap: "5px",
    alignItems: "center",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#6366f1",
    display: "inline-block",
    animation: "blink 1.2s infinite",
  },
  inputArea: {
    display: "flex",
    gap: "10px",
    padding: "16px 28px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "#e2e8f0",
    fontSize: "0.9rem",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
    maxHeight: "120px",
    overflowY: "auto",
  },
  sendBtn: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1.1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  hint: {
    color: "#334155",
    fontSize: "0.72rem",
    textAlign: "center",
    padding: "0 0 12px",
    margin: 0,
  },
};
