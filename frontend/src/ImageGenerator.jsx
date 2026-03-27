import { useState, useEffect, useRef } from "react";

const API_BASE = "http://127.0.0.1:8003";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach((track) => track.stop());

          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          try {
            const res = await fetch(`${API_BASE}/transcribe`, {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setPrompt(data.text.trim());
              }
            } else {
              console.error("Transcription error");
            }
          } catch (err) {
            console.error("Transcription failed:", err);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone access error:", err);
      }
    }
  };
  const [style, setStyle] = useState("Technical Architecture Diagram");
  const [theme, setTheme] = useState("Professional");
  const [color, setColor] = useState("Vibrant");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [savedName, setSavedName] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/list-images`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setImage(null);
    setSavedName("");

    try {
      const res = await fetch(`${API_BASE}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, theme, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate image");
      }

      const data = await res.json();
      setImage(data.image);
      setSavedName(data.filename);
      fetchHistory(); // Refresh gallery
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewPastImage = (filename) => {
    setImage(`${API_BASE}/images/${filename}`);
    setSavedName(filename);
    // Scroll to top to see the image
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteImage = async (e, filename) => {
    e.stopPropagation(); // Prevent viewing when clicking delete
    // Temporarily disabled confirm for debugging
    // if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      console.log(`Attempting to delete: ${filename}`);
      const res = await fetch(`${API_BASE}/delete-image/${filename}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete image");
      }

      console.log(`Successfully deleted: ${filename}`);
      // Update UI
      setHistory((prev) => prev.filter((f) => f !== filename));
      if (savedName === filename) {
        setImage(null);
        setSavedName("");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      alert(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Visual Explanations</h2>
        <p style={styles.subtitle}>AI-powered illustrations of complex concepts from your content</p>
      </div>

      <div style={styles.generatorBox}>
        <div style={styles.variationSection}>
          <div>
            <label style={styles.label}>Visualization Style</label>
            <select style={styles.select} value={style} onChange={(e) => setStyle(e.target.value)}>
              <option>Technical Architecture Diagram</option>
              <option>Minimalist Infographic</option>
              <option>3D Conceptual Model</option>
              <option>Hand-drawn Sketch</option>
              <option>Flat Design Illustration</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Theme</label>
            <select style={styles.select} value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option>Professional</option>
              <option>Futuristic/Sci-Fi</option>
              <option>Corporate Blue</option>
              <option>Dark Mode Modern</option>
              <option>Cyberpunk Neon</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Color Palette</label>
            <select style={styles.select} value={color} onChange={(e) => setColor(e.target.value)}>
              <option>Vibrant</option>
              <option>Monochrome</option>
              <option>Pastel Soft</option>
              <option>High Contrast</option>
              <option>Earth Tones</option>
            </select>
          </div>
        </div>

        <div style={styles.inputWrapper}>
          <div style={{ position: "relative", width: "100%" }}>
            <textarea
              style={{ ...styles.textarea, paddingRight: "50px" }}
              placeholder="Describe the concept you want to visualize... (e.g., 'Kubernetes Pod Lifecycle')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
            />
            <button
              onClick={toggleListening}
              style={{
                position: "absolute",
                right: "12px",
                top: "12px",
                background: isListening ? "rgba(239, 68, 68, 0.1)" : "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                color: isListening ? "#ef4444" : "#94a3b8",
                padding: "8px",
                borderRadius: "50%",
                transition: "all 0.2s"
              }}
              title={isListening ? "Stop listening" : "Dictate prompt"}
            >
              {isListening ? "⏹️" : "🎤"}
            </button>
          </div>
          <button
            style={{
              ...styles.generateBtn,
              ...(loading || !prompt.trim() ? styles.btnDisabled : {}),
            }}
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Picturizing..." : "Generate Concept →"}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.displayArea}>
          {!image && !loading && (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>🎨</div>
              <p>Your generated visual will appear here</p>
            </div>
          )}

          {loading && (
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>The AI is dreaming up your visual...</p>
            </div>
          )}

          {image && (
            <div style={styles.imageWrapper}>
              <img src={image} alt="Generated concept" style={styles.image} />
              <div style={styles.imageActions}>
                <div style={styles.saveBadge}>
                  <span style={{ fontSize: "0.8rem" }}>💾 Saved as {savedName}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteImage(e, savedName)}
                  style={styles.deleteBtn}
                  title="Delete Image"
                >
                  Delete
                </button>
                <a href={image} download={savedName} style={styles.downloadBtn}>
                  Download PNG
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div style={styles.historySection}>
          <h3 style={styles.historyTitle}>Previous Visuals</h3>
          <div style={styles.gallery}>
            {history.map((filename) => (
              <div 
                key={filename} 
                style={styles.thumbnailWrapper}
                onClick={() => viewPastImage(filename)}
              >
                <img 
                  src={`${API_BASE}/images/${filename}`} 
                  alt={filename} 
                  style={styles.thumbnail} 
                />
                <div style={styles.thumbnailOverlay}>
                  <span>View</span>
                </div>
                <button 
                  style={styles.thumbDeleteBtn} 
                  onClick={(e) => handleDeleteImage(e, filename)}
                  title="Delete from history"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    height: "100%",
    overflowY: "auto",
  },
  header: {
    textAlign: "left",
  },
  title: {
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "800",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "1rem",
    margin: 0,
  },
  generatorBox: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "24px",
    backdropFilter: "blur(10px)",
  },
  variationSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    background: "rgba(255,255,255,0.03)",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  label: {
    color: "#94a3b8",
    fontSize: "0.85rem",
    marginBottom: "8px",
    display: "block",
    fontWeight: "600",
  },
  select: {
    width: "100%",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px",
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
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
    fontFamily: "inherit",
    transition: "all 0.2s",
    boxSizing: "border-box",
  },
  generateBtn: {
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
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#fca5a5",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "0.9rem",
  },
  displayArea: {
    width: "100%",
    aspectRatio: "16 / 9",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  placeholder: {
    textAlign: "center",
    color: "#475569",
  },
  placeholderIcon: {
    fontSize: "4rem",
    marginBottom: "16px",
    opacity: 0.5,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "16px",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    objectFit: "contain",
  },
  imageActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  saveBadge: {
    background: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    color: "#4ade80",
    padding: "8px 12px",
    borderRadius: "8px",
  },
  downloadBtn: {
    backgroundColor: "#6366f1",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#4f46e5",
    },
  },
  deleteBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
    },
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(99, 102, 241, 0.1)",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  historySection: {
    marginTop: "48px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  historyTitle: {
    color: "#fff",
    fontSize: "1.4rem",
    fontWeight: "700",
    margin: 0,
  },
  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px",
  },
  thumbnailWrapper: {
    position: "relative",
    aspectRatio: "1/1",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "transform 0.2s, border-color 0.2s",
    "&:hover": {
      transform: "scale(1.02)",
      borderColor: "#6366f1",
    },
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(99,102,241,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: "700",
    opacity: 0,
    transition: "opacity 0.2s",
    "&:hover": {
      opacity: 1,
    },
  },
  thumbDeleteBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    color: "#fff",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
    lineHeight: 1,
    zIndex: 100,
    pointerEvents: "auto",
    transition: "transform 0.2s",
  },
};

// Add keyframes for spinner in a style tag if needed, or assume it's in index.css
