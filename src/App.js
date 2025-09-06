import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { preprocessImage } from "./utils/preprocess";

function App() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    // Preprocesar imagen antes de OCR
    const preprocessed = await preprocessImage(file);

    const { data: { text } } = await Tesseract.recognize(preprocessed, "spa", {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.- ",
    });

    setResult(text.trim());
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📸 OCR Coltexvideo</h1>
      <input type="file" accept="image/*" capture="environment" onChange={handleOCR} />
      {loading ? <p>Procesando...</p> : <p><b>Texto extraído:</b> {result}</p>}
    </div>
  );
}

export default App;
