import { useState } from "react";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    if (!inputText.trim()) {
      alert("Please enter some text!");
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: inputText,
      detectedLanguage: "",
      translation: "",
      summary: "",
      showSummarize: false,
      error: null,
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const detectRes = await window.chrome.ai.languageDetection.detectLanguage(
        {
          text: inputText,
        }
      );

      const detectedLanguage = detectRes.languageCode;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                detectedLanguage,
                showSummarize:
                  inputText.length > 150 && detectedLanguage.startsWith("en"),
                error: null,
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Language Detection Error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, error: "Failed to detect language. Please try again." }
            : msg
        )
      );
    }

    setInputText("");
  };

  const handleTranslate = async (id, targetLanguage) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    try {
      const translateRes = await window.chrome.ai.translator.translate({
        text: msg.text,
        sourceLanguage: msg.detectedLanguage || "en",
        targetLanguage,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, translation: translateRes.translation, error: null }
            : m
        )
      );
    } catch (err) {
      console.error("Translation Error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, error: "Translation failed. Please try again." }
            : m
        )
      );
    }
  };

  const handleSummarize = async (id) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;

    try {
      const summaryRes = await window.chrome.ai.summarizer.summarize({
        text: msg.text,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, summary: summaryRes.summary, error: null } : m
        )
      );
    } catch (err) {
      console.error("Summarization Error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, error: "Summarization failed. Please try again." }
            : m
        )
      );
    }
  };

  return (
    <section>
      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              <p>
                <strong>You:</strong> {msg.text}
              </p>
              {msg.detectedLanguage && <p>Language: {msg.detectedLanguage}</p>}
              {msg.translation && (
                <p>
                  <strong>Translation:</strong> {msg.translation}
                </p>
              )}
              {msg.summary && (
                <p>
                  <strong>Summary:</strong> {msg.summary}
                </p>
              )}
              {msg.error && <p className="error">{msg.error}</p>}

              <div className="actions">
                <select
                  onChange={(e) => handleTranslate(msg.id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Translate to...
                  </option>
                  <option value="en">English</option>
                  <option value="pt">Portuguese</option>
                  <option value="es">Spanish</option>
                  <option value="ru">Russian</option>
                  <option value="tr">Turkish</option>
                  <option value="fr">French</option>
                </select>
                <button onClick={() => handleTranslate(msg.id, "en")}>
                  Translate
                </button>

                {msg.showSummarize && (
                  <button onClick={() => handleSummarize(msg.id)}>
                    Summarize
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="input-area">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your text..."
          />
          <div id="send-btn-container">
            <button onClick={handleSend}>Send</button>
            <img src="/logo.png" alt="ai logo image" width={100}/>
          </div>
          
        </div>
      </div>
    </section>
  );
}

export default App;
