import React, { useState, useRef } from 'react';
// Bạn cần tạo file CSS này hoặc xóa dòng import nếu không dùng.


// URL webhook của bạn
const N8N_WEBHOOK_URL = 'https://n8n.aipencil.ai/webhook/hsk_llm'; 

function App() {
  const [messages, setMessages] = useState([]); // { from: 'user'|'bot', text: string, images?: string[] }
  const [input, setInput] = useState('');
  const [imageFiles, setImageFiles] = useState([]); // Lưu trữ các đối tượng File
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Hàm đọc file và chuyển đổi sang chuỗi Base64.
   * @param {File} file - File ảnh cần chuyển đổi.
   * @returns {Promise<string>} - Một Promise sẽ resolve với chuỗi Base64.
   */
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && imageFiles.length === 0) return;

    // Tạo URL tạm thời cho ảnh để hiển thị ngay lập tức trên UI
    const imageObjectURLs = imageFiles.map(file => URL.createObjectURL(file));

    // Thêm tin nhắn của người dùng vào giao diện
    setMessages(prev => [
      ...prev,
      { from: 'user', text: input, images: imageObjectURLs }
    ]);

    setLoading(true);
    
    // Xóa input và ảnh đã chọn khỏi UI ngay sau khi gửi
    setInput('');
    setImageFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // --- LOGIC GỬI NHIỀU FILE BASE64 ---
    try {
      // Chuyển đổi tất cả các file ảnh đã chọn thành chuỗi Base64
      const imageBase64Strings = await Promise.all(imageFiles.map(toBase64));

      // Chuẩn bị payload dạng JSON để gửi đi
      const payload = {
        text: input,
        // Gửi đi một mảng các chuỗi base64
        images_base64: imageBase64Strings,
      };

      // Gửi request JSON đến webhook
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
        botReply = data.reply || JSON.stringify(data);
      } else {
        botReply = `Lỗi từ server: ${res.status} ${res.statusText}`;
      }
      setMessages(prev => [...prev, { from: 'bot', text: botReply }]);

    } catch (err) {
      console.error("Lỗi khi gửi hoặc xử lý request:", err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra console.' }]);
    }
    // --- KẾT THÚC LOGIC GỬI ---

    setLoading(false);
  };

  const handleFileChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  // Giao diện người dùng
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
          multiple // Cho phép chọn nhiều file
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
