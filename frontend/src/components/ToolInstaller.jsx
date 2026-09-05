import { useEffect, useRef, useState } from 'react';
import { installStreamUrl } from '../api/client';
import Button from './Button';
import { IconCheck, IconTools } from './Icons';
import './ToolInstaller.css';

function ToolRow({ tool, installed, onInstalled }) {
  const [status, setStatus] = useState(installed ? 'installed' : 'idle'); // idle | installing | installed | failed
  const [log, setLog] = useState('');
  const [expanded, setExpanded] = useState(false);
  const esRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    return () => esRef.current?.close();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const install = () => {
    setStatus('installing');
    setLog('');
    setExpanded(true);

    const es = new EventSource(installStreamUrl(tool.id, tool.serverId));
    esRef.current = es;

    es.addEventListener('log', (e) => {
      const { line } = JSON.parse(e.data);
      setLog((prev) => prev + line);
    });

    es.addEventListener('done', (e) => {
      const { success } = JSON.parse(e.data);
      setStatus(success ? 'installed' : 'failed');
      if (success) onInstalled?.(tool.id);
      es.close();
    });

    es.onerror = () => {
      setStatus((s) => (s === 'installing' ? 'failed' : s));
      es.close();
    };
  };

  return (
    <div className={`sm-tool ${expanded ? 'sm-tool--expanded' : ''}`}>
      <div className="sm-tool__row">
        <div className="sm-tool__icon">
          <IconTools width={15} height={15} />
        </div>
        <div className="sm-tool__info">
          <span className="sm-tool__name">{tool.name}</span>
          <span className="sm-tool__desc">{tool.description}</span>
        </div>

        {status === 'installed' ? (
          <span className="sm-tool__badge">
            <IconCheck width={13} height={13} /> Installed
          </span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            loading={status === 'installing'}
            onClick={install}
          >
            {status === 'failed' ? 'Retry install' : 'Install'}
          </Button>
        )}

        {log && (
          <button className="sm-tool__toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide log' : 'Show log'}
          </button>
        )}
      </div>

      {expanded && log && (
        <pre className="sm-tool__log mono" ref={logRef}>
          {log}
        </pre>
      )}
    </div>
  );
}

export default function ToolInstaller({ tools, serverId, installedTools = [], onInstalled }) {
  return (
    <div className="sm-tool-list">
      {tools.map((tool) => (
        <ToolRow
          key={tool.id}
          tool={{ ...tool, serverId }}
          installed={installedTools.includes(tool.id)}
          onInstalled={onInstalled}
        />
      ))}
    </div>
  );
}
