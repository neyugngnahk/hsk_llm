import React, { useState, useRef } from 'react';
import './App.css';

const N8N_WEBHOOK_URL = 'https://n8n.aipencil.ai/webhook/hsk_llm'; // <-- Thay bằng webhook thực tế của bạn

function App() {
  const [messages, setMessages] = useState([]); // {from: 'user'|'bot', text: string, image?: string}
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]); // File[]
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input && images.length === 0) return;
    // Hiển thị tin nhắn người dùng
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: input, images: images.map(f => URL.createObjectURL(f)) }
    ]);
    setLoading(true);
    // Chuẩn bị form data
    const formData = new FormData();
    formData.append('text', input);
    images.forEach((img, idx) => {
      formData.append('image' + idx, img);
    });
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: data.reply || 'Không nhận được phản hồi.' }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Lỗi gửi hoặc nhận phản hồi.' }
      ]);
    }
    setInput('');
    setImages([]);
    fileInputRef.current.value = '';
    setLoading(false);
  };

  const handleFileChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-msg ${msg.from}`}> 
            {msg.text && <div className="msg-text">{msg.text}</div>}
            {msg.images && msg.images.map((img, i) => (
              <img key={i} src={img} alt="upload" className="msg-img" />
            ))}
          </div>
        ))}
        {loading && <div className="chat-msg bot"><div className="msg-text">Đang xử lý...</div></div>}
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading}
        />
        <button type="submit" disabled={loading || (!input && images.length === 0)}>Gửi</button>
      </form>
    </div>
  );
}

export default App;
