export default function Sidebar({ filename, pdfInfo, activeTab, onTabChange, onReset }) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarLogo}>
        <span style={{ color: "#6366f1" }}>⬡</span> RAG<span style={{ color: "#6366f1" }}>lens</span>
      </div>

      <div style={styles.navSection}>
        <p style={styles.sidebarLabel}>Navigation</p>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'pdf' ? styles.navBtnActive : {})}}
          onClick={() => onTabChange('pdf')}
        >
          <span style={styles.navIcon}>📥</span> PDF Assistant
        </button>
        <button 
          style={{...styles.navBtn, ...(activeTab === 'image' ? styles.navBtnActive : {})}}
          onClick={() => onTabChange('image')}
        >
          <span style={styles.navIcon}>🎨</span> Image Generator
        </button>
      </div>

      <div style={styles.sidebarDivider} />

      {filename && (
        <div style={styles.pdfCard}>
          <div style={styles.pdfIcon}>📑</div>
          <div>
            <p style={styles.pdfName}>{filename}</p>
            <p style={styles.pdfMeta}>{pdfInfo?.pages} pages · {pdfInfo?.chunks} chunks</p>
          </div>
        </div>
      )}

      <div style={styles.sidebarSection}>
        <p style={styles.sidebarLabel}>Pipeline</p>
        <div style={styles.pipelineStep}><span>🔤</span> HF Embeddings</div>
        <div style={styles.pipelineStep}><span>🗄️</span> ChromaDB</div>
        <div style={styles.pipelineStep}><span>🔍</span> Semantic Search</div>
        <div style={styles.pipelineStep}><span>⚡</span> Groq LLaMA 3</div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    flexShrink: 0,
    background: "#0d1117",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "100vh",
    overflowY: "auto",
  },
  sidebarLogo: {
    fontSize: "1.3rem",
    fontWeight: "800",
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
    marginBottom: "8px",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sidebarLabel: {
    color: "#475569",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 4px",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "transparent",
    border: "1px solid transparent",
    color: "#94a3b8",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    textAlign: "left",
    transition: "all 0.2s",
  },
  navBtnActive: {
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    color: "#6366f1",
  },
  navIcon: {
    fontSize: "1.1rem",
  },
  sidebarDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "8px 0",
  },
  pdfCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
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
  pipelineStep: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748b",
    fontSize: "0.75rem",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.02)",
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
};
