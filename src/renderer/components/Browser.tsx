import React, { useState, useEffect, useRef } from 'react';
import './Browser.css';

interface BrowserProps {
  initialUrl?: string;
}

interface UrlLoadResult {
  success: boolean;
  content?: string;
  error?: string;
}

const Browser: React.FC<BrowserProps> = ({ initialUrl = 'https://browser.engineering/' }) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on('url-loaded', (result: unknown) => {
      setLoading(false);
      
      const typedResult = result as UrlLoadResult;
      
      if (typedResult.success && typedResult.content) {
        setContent(typedResult.content);
        setError(null);

        if (historyIndex === history.length - 1) {
          setHistory([...history, url]);
          setHistoryIndex(history.length);
        } else {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(url);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      } else {
        setError(typedResult.error || 'Unknown error occurred');
      }
    });

    return () => {
      removeListener();
    };
  }, [history, historyIndex, url]);

  const loadUrl = (urlToLoad: string) => {
    setLoading(true);
    setUrl(urlToLoad);
    setInputUrl(urlToLoad);
    window.electron.ipcRenderer.sendMessage('load-url', urlToLoad);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let urlToLoad = inputUrl;
    if (!urlToLoad.match(/^[a-zA-Z]+:\/\//)) {
      urlToLoad = `https://${urlToLoad}`;
      setInputUrl(urlToLoad);
    }
    
    loadUrl(urlToLoad);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadUrl(history[newIndex]);
    }
  };

  const viewSource = () => {
    loadUrl(`view-source:${url}`);
  };

  const refresh = () => {
    loadUrl(url);
  };

  useEffect(() => {
    if (initialUrl) {
      loadUrl(initialUrl);
    }
  }, []);

  useEffect(() => {
    if (contentRef.current && content) {
      if (url.startsWith('view-source:')) {
        contentRef.current.innerHTML = `<pre>${content}</pre>`;
      } else {
        const iframe = document.createElement('iframe');
        iframe.sandbox.add('allow-same-origin');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        contentRef.current.innerHTML = '';
        contentRef.current.appendChild(iframe);
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(content);
          iframeDoc.close();
        }
      }
    }
  }, [content, url]);

  return (
    <div className="browser">
      <div className="browser-toolbar">
        <button 
          onClick={goBack} 
          disabled={historyIndex <= 0}
          className="browser-button"
        >
          ←
        </button>
        <button 
          onClick={goForward} 
          disabled={historyIndex >= history.length - 1}
          className="browser-button"
        >
          →
        </button>
        <button 
          onClick={refresh}
          className="browser-button"
        >
          ↻
        </button>
        <form onSubmit={handleSubmit} className="url-form">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="url-input"
            placeholder="Enter URL..."
          />
          <button type="submit" className="browser-button">Go</button>
        </form>
        <button 
          onClick={viewSource}
          className="browser-button"
        >
          &lt;/&gt;
        </button>
      </div>
      
      {loading && (
        <div className="loading-indicator">Loading...</div>
      )}
      
      {error && (
        <div className="error-message">
          <h3>Error Loading Page</h3>
          <p>{error}</p>
        </div>
      )}
      
      <div className="browser-content" ref={contentRef}></div>
    </div>
  );
};

export default Browser; 