import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { chatsAPI } from '../api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { i18n } from '../i18n.ts';

export const ChatWidget: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch conversation
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversation();
    }
  }, [isOpen, isAuthenticated]);

  const loadConversation = async () => {
    try {
      const res = await chatsAPI.initConversation();
      if (res.success && res.data) {
        setConversation(res.data);
        loadMessages(res.data.id);
      }
    } catch (err) {
      console.error('Chat init error', err);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await chatsAPI.getMessages(convId);
      if (res.success && res.data) {
        setMessages(res.data);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to load chat messages', err);
    }
  };

  // Poll for replies when chat is open
  useEffect(() => {
    if (!isOpen || !conversation) return;
    const interval = setInterval(() => {
      loadMessages(conversation.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để bắt đầu trò chuyện cùng nhân viên hỗ trợ', 'warning');
      return;
    }

    if (!conversation) {
      await loadConversation();
    }

    const text = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const res = await chatsAPI.sendMessage(conversation.id, text);
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      showToast('Lỗi gửi tin: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Hide widget if admin or employee
  if (currentUser?.role === 'ADMIN' || currentUser?.role === 'EMPLOYEE') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 990 }}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
            }}
            title="Chat hỗ trợ khách hàng"
          >
            <MessageSquare size={26} />
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            width: 360,
            height: 480,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0',
            zIndex: 995,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#1e293b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Hỗ Trợ Stationery Shop</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Trực tuyến (24/7)</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '12px 12px 12px 2px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.4,
              }}
            >
              👋 Xin chào quý khách! Bạn cần tư vấn về danh mục bút viết, giấy in văn phòng hay mã giảm giá nào hôm nay?
            </div>

            {messages.map(m => {
              const isMe = m.senderId === currentUser?.id;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: isMe ? '#2563eb' : '#ffffff',
                      color: isMe ? '#ffffff' : '#334155',
                      border: isMe ? 'none' : '1px solid #e2e8f0',
                      fontSize: 13,
                      lineHeight: 1.4,
                    }}
                  >
                    {m.message}
                  </div>
                  <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    {i18n.formatDate(m.createdAt)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: 12,
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              placeholder={isAuthenticated ? "Nhập câu hỏi của bạn..." : "Vui lòng đăng nhập để chat..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isAuthenticated || loading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!isAuthenticated || loading || !inputText.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isAuthenticated && inputText.trim() ? 'pointer' : 'not-allowed',
                opacity: isAuthenticated && inputText.trim() ? 1 : 0.6,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
