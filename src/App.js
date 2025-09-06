import React, { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import * as XLSX from "xlsx";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [rect, setRect] = useState({ x: 100, y: 80, width: 200, height: 100 });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Activar cámara
  useEffect(() => {
    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      videoRef.current.srcObject = stream;
    };
    startCamera();
  }, []);

  // Dibujar video + rectángulo en canvas
  useEffect(() => {
    const draw = () => {
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      requestAnimationFrame(draw);
    };
    draw();
  }, [rect]);

  // Extraer texto del rectángulo
  const captureAndOCR = () => {
    setLoading(true);
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
      const { data: { text } } = await Tesseract.recognize(blob, "spa");
      setResults([...results, { texto: text.trim() }]);
      setLoading(false);
    });
  };

  // Descargar Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados OCR");
    XLSX.writeFile(wb, "ocr_resultados.xlsx");
  };

  return (
    <div style={{ padding: "10px", textAlign: "center" }}>
      <h2>📸 OCR con Cámara - Coltex</h2>

      <canvas ref={canvasRef} width={400} height={300} style={{ border: "1px solid #ccc" }} />
      <video ref={videoRef} width="400" height="300" autoPlay playsInline hidden />

      <div>
        <button onClick={captureAndOCR} style={{ background: "#1976d2", color: "white" }}>
          {loading ? "Procesando..." : "📥 Extraer texto"}
        </button>
      </div>

      {results.length > 0 && (
        <>
          <h3>Resultados:</h3>
          <ul>
            {results.map((r, i) => (
              <li key={i}>{r.texto}</li>
            ))}
          </ul>
          <button onClick={downloadExcel} style={{ background: "green", color: "white" }}>
            📊 Descargar Excel
          </button>
        </>
      )}
    </div>
  );
}

export default App;
