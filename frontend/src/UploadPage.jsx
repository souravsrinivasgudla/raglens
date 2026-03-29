import { useState, useRef } from "react";

const API_BASE = "http://www.ssgudl.shop/api";

export default function UploadPage({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setProgress(40);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      setProgress(80);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }
      const data = await res.json();
      setProgress(100);
      setTimeout(() => onUploadSuccess(file.name, data), 400);
    } catch (err) {
      setError(err.message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>RAG<span style={styles.logoAccent}>lens</span></span>
          </div>
          <p style={styles.tagline}>Upload a PDF. Ask anything. Get precise answers with page & line references.</p>
        </div>

        {/* Drop Zone */}
        <div
          style={{
            ...styles.dropzone,
            ...(dragging ? styles.dropzoneDragging : {}),
            ...(file ? styles.dropzoneHasFile : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {!file ? (
            <>
              <div style={styles.dropIcon}>📄</div>
              <p style={styles.dropTitle}>Drop your PDF here</p>
              <p style={styles.dropSubtitle}>or <span style={styles.browseLink}>browse files</span></p>
              <p style={styles.dropHint}>Supports PDF up to 50MB</p>
            </>
          ) : (
            <div style={styles.filePreview}>
              <div style={styles.fileIconWrap}>📑</div>
              <div style={styles.fileInfo}>
                <p style={styles.fileName}>{file.name}</p>
                <p style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button style={styles.removeBtn} onClick={(e) => { e.stopPropagation(); setFile(null); }}>✕</button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <p style={styles.progressLabel}>
              {progress < 40 ? "Uploading..." : progress < 80 ? "Processing PDF..." : "Building vector index..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Upload Button */}
        <button
          style={{
            ...styles.uploadBtn,
            ...(!file || uploading ? styles.uploadBtnDisabled : {}),
          }}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Processing..." : "Analyze PDF →"}
        </button>

        {/* Features */}
        <div style={styles.features}>
          {[
            { icon: "🔍", label: "Semantic Search", desc: "HuggingFace embeddings" },
            { icon: "🗄️", label: "Vector DB", desc: "ChromaDB storage" },
            { icon: "⚡", label: "Fast Answers", desc: "Groq LLaMA 3 inference" },
            { icon: "📍", label: "Source Tracking", desc: "Page & line references" },
          ].map((f) => (
            <div key={f.label} style={styles.featureCard}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <span style={styles.featureLabel}>{f.label}</span>
              <span style={styles.featureDesc}>{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100%",
    background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0d1117 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "60px 24px",
    overflowY: "auto",
  },
  container: {
    width: "100%",
    maxWidth: "580px",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  logo: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#fff",
    letterSpacing: "-1px",
    marginBottom: "12px",
  },
  logoIcon: {
    marginRight: "8px",
    color: "#6366f1",
  },
  logoText: {
    color: "#f1f5f9",
  },
  logoAccent: {
    color: "#6366f1",
  },
  tagline: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    margin: 0,
  },
  dropzone: {
    border: "2px dashed #2d3748",
    borderRadius: "16px",
    padding: "48px 32px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "rgba(255,255,255,0.02)",
    marginBottom: "20px",
  },
  dropzoneDragging: {
    borderColor: "#6366f1",
    background: "rgba(99,102,241,0.08)",
  },
  dropzoneHasFile: {
    borderStyle: "solid",
    borderColor: "#4ade80",
    background: "rgba(74,222,128,0.04)",
    cursor: "default",
  },
  dropIcon: {
    fontSize: "3rem",
    marginBottom: "16px",
  },
  dropTitle: {
    color: "#e2e8f0",
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: "0 0 8px",
  },
  dropSubtitle: {
    color: "#94a3b8",
    margin: "0 0 8px",
    fontSize: "0.9rem",
  },
  browseLink: {
    color: "#6366f1",
    textDecoration: "underline",
    cursor: "pointer",
  },
  dropHint: {
    color: "#475569",
    fontSize: "0.8rem",
    margin: 0,
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  fileIconWrap: {
    fontSize: "2rem",
  },
  fileInfo: {
    flex: 1,
    textAlign: "left",
  },
  fileName: {
    color: "#e2e8f0",
    fontWeight: "600",
    margin: "0 0 4px",
    fontSize: "0.95rem",
    wordBreak: "break-all",
  },
  fileSize: {
    color: "#64748b",
    fontSize: "0.8rem",
    margin: 0,
  },
  removeBtn: {
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrap: {
    marginBottom: "16px",
  },
  progressBar: {
    height: "4px",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: "4px",
    transition: "width 0.4s ease",
    marginBottom: "8px",
  },
  progressLabel: {
    color: "#94a3b8",
    fontSize: "0.8rem",
    textAlign: "center",
    margin: 0,
  },
  error: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "0.85rem",
    marginBottom: "16px",
  },
  uploadBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "all 0.2s ease",
    marginBottom: "32px",
  },
  uploadBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  featureIcon: {
    fontSize: "1.2rem",
    marginBottom: "4px",
  },
  featureLabel: {
    color: "#e2e8f0",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  featureDesc: {
    color: "#64748b",
    fontSize: "0.75rem",
  },
};
