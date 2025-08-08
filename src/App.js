import React, { useState, useRef } from 'react';
// Bạn cần tạo file CSS này hoặc xóa dòng import nếu không dùng.
import './App.css'; 

// URL webhook của bạn
const N8N_WEBHOOK_URL = 'https://n8n.aipencil.ai/webhook/hsk_llm'; 

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Hàm chuyển đổi file thành base64
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && imageFiles.length === 0) return;

    const imageObjectURLs = imageFiles.map(file => URL.createObjectURL(file));

    setMessages(prev => [
      ...prev,
      { from: 'user', text: input, images: imageObjectURLs }
    ]);

    setLoading(true);

    setInput('');
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Chuyển đổi ảnh thành base64
      const imageBase64Strings = await Promise.all(imageFiles.map(toBase64));
      
      // Tạo payload JSON với binarycheck
      const payload = {
        text: input,
        images_base64: imageBase64Strings,
        binarycheck: imageFiles.length > 0 // true nếu có ảnh, false nếu không có
      };

      console.log('Payload gửi đi:', payload);

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      let botReply = 'Lỗi: Không nhận được phản hồi hợp lệ.';

      if (res.ok) {
        const data = await res.json();
        
        // Lấy nội dung trả lời chính
        botReply = data.reply || data.response || JSON.stringify(data);

        // Kiểm tra trường 'binarycheck' từ response và thêm thông báo
        if (data.binarycheck === true) {
          botReply += "\n(✅ Đã nhận diện có ảnh đính kèm.)";
        } else if (data.binarycheck === false) {
          botReply += "\n(ℹ️ Không có ảnh đính kèm.)";
        }
      } else {
        botReply = `Lỗi từ server: ${res.status} ${res.statusText}`;
      }

      setMessages(prev => [...prev, { from: 'bot', text: botReply }]);

    } catch (err) {
      console.error("Lỗi khi gửi request:", err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Đã xảy ra lỗi kết nối.' }]);
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-msg ${msg.from}`}>
            <div className="msg-text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            {msg.images && msg.images.length > 0 && (
              <div className="msg-images">
                {msg.images.map((img, i) => (
                  <img key={i} src={img} alt={`upload-${i}`} className="msg-img" />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg bot"><div className="msg-text">Bot đang xử lý...</div></div>}
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
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="file-upload-label">📎</label>
        <button type="submit" disabled={loading || (!input.trim() && imageFiles.length === 0)}>Gửi</button>
      </form>
    </div>
  );
}

export default App;