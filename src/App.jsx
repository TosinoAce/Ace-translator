import { useState } from "react";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState({}); // Track selected language per message

  const handleSend = async () => {
    if (!inputText.trim()) {
      return;
    }

    // handling lsngusge detection
    
    const detectLanguage = async (text) => {
      try {
        const detectorCapabilities = await self.ai.languageDetector.capabilities();
        if (detectorCapabilities.available === "no") {
          return {
            code: "unknown",
            readable: "Language detection API not available",
          };
        }
        const detector = await self.ai.languageDetector.create();
        await detector.ready;
        const detectedLanguages = await detector.detect(text);
        const topLanguage = detectedLanguages.sort((a, b) => b.confidence - a.confidence)[0];
        return {
          code: topLanguage.detectedLanguage,
          readable: new Intl.DisplayNames(["en"], { type: "language" }).of(topLanguage.detectedLanguage) || "Unknown",
          confidence: topLanguage.confidence,
        };
      } catch (error) {
        console.error("Language detection error:", error);
        return {
          code: "unknown",
          readable: "Language detection failed",
        };
      }
    };    

    const detectedLanguage = await detectLanguage(inputText);

    const newMessage = {
      id: Date.now(),
      text: inputText,
      detectedLanguage,
      translation: null,
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  // handling translation 

  const handleTranslate = async (id) => {
    const targetLang = selectedLanguages[id]; 
    if (!targetLang) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, translation: "Please select a language." } : msg
        )
      );
      return;
    }
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === id ? { ...msg, translation: "Translating..." } : msg
      )
    );
    const messageIndex = messages.findIndex((msg) => msg.id === id);
    const message = messages[messageIndex];
  
    if (!message.detectedLanguage || message.detectedLanguage.code === targetLang) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, translation: "Text is already in the target language." } : msg
        )
      );
      return;
    }
  
    // Checking  if translation API is available

    if (!self.ai || !self.ai.translator) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, translation: "Translation API not available." } : msg
        )
      );
      return;
    }
  
    try {
      const translatorCapabilities = await self.ai.translator.capabilities();
      const available = translatorCapabilities.languagePairAvailable(message.detectedLanguage.code, targetLang);
  
      if (available === "no") throw new Error("Unable to translate between selected languages.");
  
      const translator = await self.ai.translator.create({
        sourceLanguage: message.detectedLanguage.code,
        targetLanguage: targetLang,
      });
  
      await translator.ready;
      const result = await translator.translate(message.text);
  
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, translation: result } : msg
        )
      );
    } catch (error) {
      console.error("Translation error:", error);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === id ? { ...msg, translation: `Translation error: ${error.message}` } : msg
        )
      );
    }
  };

  // handling summarization
  
  const handleSummarize = async (id) => {
    const messageIndex = messages.findIndex((msg) => msg.id === id);
    const message = messages[messageIndex];
  
    if (message.detectedLanguage.code !== "en") {
      alert("Summarization is only available for English text.");
      return;
    }
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === id ? { ...msg, summary: "Summarizing..." } : msg
      )
    );
    try {
      const summarizerCapabilities = await self.ai.summarizer.capabilities();
      if (summarizerCapabilities.available === "no") {
        throw new Error("Summarization API not available.");
      }
  
      const summarizer = await self.ai.summarizer.create({
        sharedContext: "This is an English text that needs summarization.",
        type: "key-points",
        format: "markdown",
        length: "short",
      });
  
      await summarizer.ready;
      const result = await summarizer.summarize(message.text, { context: "Summarizing the key points." });
  
      const updatedMessages = [...messages];
      updatedMessages[messageIndex].summary = result;
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Summarization error:", error);
  
      const updatedMessages = [...messages];
      updatedMessages[messageIndex].summary = error.message;
      setMessages(updatedMessages);
    }
  };
  

  return (
    <section>
      <div className="chat-container">
        <div className="chat-box">
          {messages.map((msg) => (
            <div key={msg.id} className="message">
              <p>{msg.text}</p>
              {msg.detectedLanguage && (
                <p className="detected-lang" aria-label={"your text language is" + msg.detectedLanguage.readable}>
                  {msg.detectedLanguage.readable} ({msg.detectedLanguage.code})
                </p>
              )}

              {msg.translation && (
                <div className="reply">
                  <p aria-label={"your translated text is" + msg.translation}>
                    <strong>Translated:</strong> {msg.translation}
                  </p>
                </div>
              )}

               {msg.summary && (
                <div className="reply">
                  <p aria-label={"your summarized text is" + msg.summary}>
                    <strong>Summarized:</strong> {msg.summary}
                  </p>
                </div>
              )}

              <div className="actions">
                <select
                  value={selectedLanguages[msg.id] || ""}
                  onChange={(e) => setSelectedLanguages({ ...selectedLanguages, [msg.id]: e.target.value })}
                  aria-label="click to select language to translate to"
                >
                  <option value="" disabled>
                    Translate to...
                  </option>
                  <option value="en" aria-label="tranlate to English">English</option>
                  <option value="pt" aria-label="tranlate to Portuguese">Portuguese</option>
                  <option value="es" aria-label="tranlate to Spanish">Spanish</option>
                  <option value="ru" aria-label="tranlate to Russian">Russian</option>
                  <option value="tr" aria-label="tranlate to Turkish">Turkish</option>
                  <option value="fr" aria-label="tranlate to French">French</option>
                </select>
                <button onClick={() => handleTranslate(msg.id)} aria-label="click to translate" tabIndex={0}>Translate</button>
                {msg.text.length > 150 && msg.detectedLanguage.code === "en" && (
                  <button onClick={() => handleSummarize(msg.id)} aria-label="click to summarize" tabIndex={0}>Summarize</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="input-area">
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your text..." aria-label="input your text for proccessing here"/>
          <div id="send-btn-container">
            <button onClick={handleSend} tabIndex={0} aria-label="click to send your text for proccessing"><img src="/paper-plane.png" alt="sebd icon" /></button>
            <img src="/logo.png" alt="ai logo image" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
