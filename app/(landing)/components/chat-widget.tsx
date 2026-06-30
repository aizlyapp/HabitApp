'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

export default function ChatWidget() {
  const { t, lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    historyRef.current.push({ role: 'user', content: text });
    setLoading(true);

    try {
      const res = await fetch('https://app.roomy.com.ar/api/landing-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyRef.current.slice(-10),
        }),
      });
      const data = await res.json();
      const reply =
        data.reply ||
        (lang === 'pt'
          ? 'Não entendi. Pode reformular?'
          : 'No entendí. ¿Podés reformular?');

      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      historyRef.current.push({ role: 'assistant', content: reply });
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: t('landing.chat_error') }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, lang, t]);

  return (
    <>
      <button
        className={`chat-btn${open ? ' hide' : ''}`}
        id="chatBtn"
        onClick={() => setOpen(true)}
        aria-label="Abrir chat"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>

      <div className={`chat-panel${open ? ' open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">R</div>
            <div>
              <div className="chat-header-title">Roomy Bot</div>
              <div className="chat-header-sub">{t('landing.chat_sub')}</div>
            </div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="chat-messages" id="chatMessages">
          {messages.length === 0 && (
            <div className="chat-welcome" dangerouslySetInnerHTML={{
              __html: t('landing.chat_welcome').replace('\n', '<br>'),
            }} />
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>{msg.text}</div>
          ))}
          {loading && (
            <div className="chat-msg typing">{t('landing.chat_typing')}</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-bar">
          <input
            className="chat-input"
            placeholder={t('landing.chat_placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            autoComplete="off"
          />
          <button
            className="chat-send"
            disabled={!input.trim() || loading}
            onClick={sendMessage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      {/* Chat widget styles */}
      <style jsx>{`
        .chat-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          width: 56px;
          height: 56px;
          background: var(--accent, #38bdf8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(56,189,248,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          animation: chatBounce 0.6s ease-out;
        }
        .chat-btn:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(56,189,248,0.55); }
        .chat-btn svg { width: 26px; height: 26px; color: #000; }
        .chat-btn.hide { display: none; }
        @keyframes chatBounce {
          0% { transform: translateY(100px) scale(0); opacity: 0; }
          50% { transform: translateY(-10px) scale(1.05); opacity: 1; }
          70% { transform: translateY(5px) scale(0.95); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .chat-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          width: 360px;
          height: 500px;
          max-height: calc(100vh - 140px);
          background: var(--bg-card, #161616);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 20px;
          display: none;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          animation: panelIn 0.25s ease-out;
        }
        .chat-panel.open { display: flex; }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-secondary, #0f1a2e);
        }
        .chat-header-info { display: flex; align-items: center; gap: 12px; }
        .chat-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--accent, #38bdf8); display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 16px; color: #000;
        }
        .chat-header-title { font-size: 15px; font-weight: 700; color: var(--text-primary, #fff); }
        .chat-header-sub { font-size: 12px; color: var(--text-muted, #71717a); }
        .chat-close {
          width: 32px; height: 32px; border-radius: 50%; border: none;
          background: transparent; color: var(--text-muted, #71717a); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; transition: all 0.2s;
        }
        .chat-close:hover { background: rgba(255,255,255,0.08); color: var(--text-primary, #fff); }
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 16px 18px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .chat-msg {
          max-width: 85%; padding: 10px 14px; border-radius: 14px;
          font-size: 14px; line-height: 1.5; word-wrap: break-word;
          animation: msgIn 0.2s ease-out;
          color: var(--text-primary, #fff);
        }
        @keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .chat-msg.user {
          align-self: flex-end; background: var(--accent, #38bdf8); color: #000;
          border-bottom-right-radius: 4px;
        }
        .chat-msg.bot {
          align-self: flex-start; background: rgba(255,255,255,0.06);
          border-bottom-left-radius: 4px;
        }
        .chat-msg.typing {
          align-self: flex-start; background: rgba(255,255,255,0.06);
          font-style: italic; font-size: 13px;
        }
        .chat-input-bar {
          display: flex; gap: 8px; padding: 12px 14px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-card, #161616);
        }
        .chat-input {
          flex: 1; padding: 10px 14px; border-radius: 10px;
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: rgba(255,255,255,0.03); color: var(--text-primary, #fff);
          font-size: 14px; font-family: inherit; outline: none; transition: border 0.2s;
        }
        .chat-input:focus { border-color: var(--accent, #38bdf8); }
        .chat-input::placeholder { color: var(--text-muted, #71717a); }
        .chat-send {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          background: var(--accent, #38bdf8); color: #000; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .chat-send:hover { background: var(--accent-hover, #0ea5e9); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .chat-send svg { width: 18px; height: 18px; }
        .chat-welcome {
          text-align: center; color: var(--text-muted, #71717a); font-size: 13px;
          padding: 20px 10px; line-height: 1.6;
        }
        @media (max-width: 480px) {
          .chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 16px; }
          .chat-btn { right: 16px; bottom: 16px; }
        }
      `}</style>
    </>
  );
}
