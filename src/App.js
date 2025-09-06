import React, { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import * as XLSX from "xlsx";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [rect, setRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [results, setResults] = useState([]);

  useEffect(() => {
    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
    };
    startCamera();
  }, []);

  useEffect(() => {
    const draw = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      if (rect) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      requestAnimationFrame(draw);
    };
    draw();
  }, [rect]);

  const handleStart = (x, y) => {
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMove = (x, y) => {
    if (!isDrawing) return;
    setRect({
      x: Math.min(x, startPos.x),
      y: Math.min(y, startPos.y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });
  };

  const handleEnd = () => setIsDrawing(false);

  const captureAndOCR = async () => {
    if (!rect) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(
      videoRef.current,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height
    );
    tempCanvas.toBlob(async (blob) => {
      const { data: { text } } = await Tesseract.recognize(blob, "spa", {
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.- "
      });
      setResults([...results, { texto: text.trim() }]);
    });
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados OCR");
    XLSX.writeFile(wb, "ocr_resultados.xlsx");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📸 OCR móvil - Coltex</h1>
      <div style={{ position: "relative", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
        <video
          ref={videoRef}
          width="100%"
          height="300"
          autoPlay
          playsInline
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{ position: "absolute", top: 0, left: 0 }}
          onMouseDown={(e) => handleStart(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseMove={(e) => handleMove(e.nativeEvent.offsetX, e.nativeEvent.offsetY)}
          onMouseUp={handleEnd}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            const rectEl = canvasRef.current.getBoundingClientRect();
            handleStart(touch.clientX - rectEl.left, touch.clientY - rectEl.top);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const rectEl = canvasRef.current.getBoundingClientRect();
            handleMove(touch.clientX - rectEl.left, touch.clientY - rectEl.top);
          }}
          onTouchEnd={handleEnd}
        />
      </div>
      <button
        onClick={captureAndOCR}
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "5px",
          width: "100%",
        }}
      >
        📥 Extraer texto del área
      </button>
      {results.length > 0 && (
        <>
          <h2>Resultados:</h2>
          <ul>
            {results.map((r, i) => (
              <li key={i}>{r.texto}</li>
            ))}
          </ul>
          <button
            onClick={downloadExcel}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "green",
              color: "white",
              border: "none",
              borderRadius: "5px",
              width: "100%",
            }}
          >
            📥 Descargar Excel
          </button>
        </>
      )}
    </div>
  );
}

export default App;
