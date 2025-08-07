import React, { useState, useRef } from 'react';
import './App.css';

// URL webhook của bạn
const N8N_WEBHOOK_URL = 'https://n8n.aipencil.ai/webhook/hsk_llm'; 

function App() {
  const [messages, setMessages] = useState([]); // { from: 'user'|'bot', text: string, images?: string[] }
  const [input, setInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]); // Lưu trữ các đối tượng File
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && imageFiles.length === 0) return;

    // Tạo URL tạm thời cho ảnh để hiển thị ngay lập tức
    const imageObjectURLs = imageFiles.map(file => URL.createObjectURL(file));

    // Thêm tin nhắn của người dùng vào giao diện
    setMessages(prev => [
      ...prev,
      { from: 'user', text: input, images: imageObjectURLs }
    ]);

    // Xóa input và ảnh đã chọn
    setInput('');
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setLoading(true);

    // Chuẩn bị dữ liệu để gửi đi
    const formData = new FormData();
    formData.append('text', input);
    imageFiles.forEach((file, index) => {
      // Quan trọng: đặt tên key cho file, ví dụ 'image0', 'image1',...
      formData.append(`image${index}`, file);
    });

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      let botReply = 'Lỗi: Không nhận được phản hồi hợp lệ.';

      // <-- THAY ĐỔI CHÍNH BẮT ĐẦU TỪ ĐÂY
      if (res.ok) {
        // Kiểm tra xem n8n trả về JSON hay chỉ là text
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          // Lấy nội dung từ key 'reply' hoặc 'message', hoặc bất kỳ key nào bạn định nghĩa trong n8n
          botReply = data.reply || data.message || JSON.stringify(data);
        } else {
          // Nếu n8n trả về text thuần túy
          botReply = await res.text();
        }
      } else {
        botReply = `Lỗi từ server: ${res.status} ${res.statusText}`;
      }
      // <-- KẾT THÚC THAY ĐỔI CHÍNH

      setMessages(prev => [
        ...prev,
        { from: 'bot', text: botReply }
      ]);

    } catch (err) {
      console.error("Fetch Error:", err);
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra console.' }
      ]);
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
            {msg.text && <div className="msg-text">{msg.text}</div>}
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
          style={{ display: 'none' }} // Ẩn input file gốc
          id="file-upload"
        />
        {/* Nút để mở hộp thoại chọn file */}
        <label htmlFor="file-upload" className="file-upload-label">📎</label>
        <button type="submit" disabled={loading || (!input.trim() && imageFiles.length === 0)}>Gửi</button>
      </form>
    </div>
  );
}

export default App;
