import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { terminalWsUrl } from '../api/client';
import Button from './Button';
import { IconRefresh } from './Icons';
import './ServerTerminal.css';

export default function ServerTerminal({ serverId }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const wsRef = useRef(null);
  const [connState, setConnState] = useState('connecting'); // connecting | open | closed
  const [reconnectKey, setReconnectKey] = useState(0);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 13.5,
      lineHeight: 1.4,
      theme: {
        background: '#12151a',
        foreground: '#e7e9ec',
        cursor: '#4fd1c5',
        selectionBackground: 'rgba(79, 209, 197, 0.25)',
        black: '#12151a',
        brightBlack: '#5c6472',
      },
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;
    fitRef.current = fitAddon;

    setConnState('connecting');
    const ws = new WebSocket(terminalWsUrl(serverId));
    wsRef.current = ws;

    ws.onopen = () => setConnState('open');
    ws.onmessage = (event) => term.write(event.data);
    ws.onclose = () => setConnState('closed');
    ws.onerror = () => setConnState('closed');

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    const sendResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

    const resizeObserver = new ResizeObserver(() => sendResize());
    resizeObserver.observe(containerRef.current);
    const initialFitTimer = setTimeout(sendResize, 150);

    return () => {
      clearTimeout(initialFitTimer);
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [serverId, reconnectKey]);

  return (
    <div className="sm-terminal">
      <div className="sm-terminal__bar">
        <div className="sm-terminal__dots">
          <span />
          <span />
          <span />
        </div>
        <span className="sm-terminal__title mono">ssh session</span>
        <span className={`sm-terminal__state sm-terminal__state--${connState}`}>
          {connState === 'connecting' && 'Connecting…'}
          {connState === 'open' && 'Connected'}
          {connState === 'closed' && 'Disconnected'}
        </span>
        {connState === 'closed' && (
          <Button
            size="sm"
            variant="ghost"
            icon={<IconRefresh width={13} height={13} />}
            onClick={() => setReconnectKey((k) => k + 1)}
          >
            Reconnect
          </Button>
        )}
      </div>
      <div className="sm-terminal__body" ref={containerRef} />
    </div>
  );
}
