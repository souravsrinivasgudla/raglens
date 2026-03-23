import { useState } from 'react'
import UploadPage from './UploadPage'
import ChatPage from './ChatPage'
import Sidebar from './Sidebar'
import ImageGenerator from './ImageGenerator'

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('pdf');

  const handleUploadSuccess = (filename, metadata) => {
    setPdfFile(filename);
    setPdfInfo(metadata);
    // Stay on 'pdf' tab, it will now show the ChatPage
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfInfo(null);
    setActiveTab('pdf');
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.appLayout}>
        <Sidebar 
          filename={pdfFile} 
          pdfInfo={pdfInfo} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onReset={handleReset} 
        />
        <main style={styles.mainContent}>
          {activeTab === 'pdf' ? (
            !pdfFile ? (
              <UploadPage onUploadSuccess={handleUploadSuccess} />
            ) : (
              <ChatPage filename={pdfFile} pdfInfo={pdfInfo} onReset={handleReset} />
            )
          ) : (
            <ImageGenerator />
          )}
        </main>
      </div>
    </div>
  )
}

const styles = {
  appWrapper: {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    background: '#0a0a0f',
    minHeight: '100vh',
  },
  appLayout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
}

export default App
