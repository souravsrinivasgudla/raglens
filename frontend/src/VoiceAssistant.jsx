import { useState } from "react";

const API_BASE = "http://127.0.0.1:8003";

export default function VoiceAssistant() {
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleChat = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch(`${API_BASE}/chat-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setResponse(data.response);
      speak(data.response);
    } catch (err) {
      console.error(err);
      setResponse("Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Voice Assistant</h2>
        <p style={styles.subtitle}>Conversational AI with text-to-speech feedback</p>
      </div>

      <div style={styles.chatBox}>
        <div style={styles.inputWrapper}>
          <textarea
            style={styles.textarea}
            placeholder="Type something to talk to the AI..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
          />
          <button
            style={{
              ...styles.actionBtn,
              ...(loading || !inputText.trim() ? styles.btnDisabled : {}),
            }}
            onClick={handleChat}
            disabled={loading || !inputText.trim()}
          >
            {loading ? "Thinking..." : "Send & Listen 🎙️"}
          </button>
        </div>

        {response && (
          <div style={styles.responseArea}>
            <div style={styles.responseHeader}>
              <span style={styles.aiLabel}>AI Response</span>
              {isSpeaking && <div style={styles.speakingIndicator}>● Speaking...</div>}
              <button 
                onClick={isSpeaking ? stopSpeaking : () => speak(response)} 
                style={styles.speakBtn}
              >
                {isSpeaking ? "⏹ Stop" : "🔊 Replay"}
              </button>
            </div>
            <div style={styles.responseText}>{response}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    height: "100%",
    overflowY: "auto",
  },
  header: { textAlign: "left" },
  title: { color: "#fff", fontSize: "1.8rem", fontWeight: "800", margin: "0 0 8px" },
  subtitle: { color: "#94a3b8", fontSize: "1rem", margin: 0 },
  chatBox: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "24px",
    backdropFilter: "blur(10px)",
  },
  inputWrapper: { display: "flex", flexDirection: "column", gap: "16px" },
  textarea: {
    width: "100%",
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "20px",
    color: "#fff",
    fontSize: "1rem",
    lineHeight: "1.5",
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
  },
  actionBtn: {
    alignSelf: "flex-end",
    padding: "14px 28px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  responseArea: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  responseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  aiLabel: { color: "#6366f1", fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase" },
  responseText: { color: "#e2e8f0", fontSize: "1.1rem", lineHeight: "1.6" },
  speakBtn: {
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    color: "#6366f1",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  speakingIndicator: {
    color: "#4ade80",
    fontSize: "0.85rem",
    fontWeight: "600",
  }
};
