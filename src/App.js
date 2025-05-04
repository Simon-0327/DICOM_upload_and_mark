import React, { useState, useRef, useEffect } from "react";
import { loadDicomFile } from "./DicomLoader";
import { renderDicomImage } from "./DicomImage";
import { LabelManager } from "./LabelManager";
import LabelList from "./LabelList";
import * as fabric from "fabric";

function App() {
  const [file, setFile] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const fabricRef = useRef(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const info = await loadDicomFile(selectedFile);
    setPatientInfo(info);
  };

  useEffect(() => {
    if (file && imageRef.current && overlayRef.current) {
      renderDicomImage(imageRef.current, file).then((image) => {
        const fabricCanvas = new fabric.Canvas(overlayRef.current, {
          selection: false,
        });
        fabricCanvas.setWidth(image.width);
        fabricCanvas.setHeight(image.height);
        fabricRef.current = fabricCanvas;
      });
    }
  }, [file]);

  const { labels, deleteLabel, editLabel } = LabelManager(
    isAddingLabel,
    setIsAddingLabel,
    fabricRef.current
  );

  return (
    <div style={{ display: "flex", padding: "2rem" }}>
      {/* 左側：主畫面 */}
      <div style={{ flex: 1 }}>
        <input type="file" accept=".dcm" onChange={handleFileChange} />

        {patientInfo && (
          <div style={{ marginTop: "1rem" }}>
            <h3>病患資訊：</h3>
            <p>姓名：{patientInfo.name}</p>
            <p>生日：{patientInfo.birthDate}</p>
            <p>年齡：{patientInfo.age}</p>
            <p>性別：{patientInfo.sex}</p>
          </div>
        )}

        {/* 顯示影像與標記 */}
        <div style={{ position: "relative", width: "fit-content", marginTop: "1rem" }}>
          <div
            ref={imageRef}
            style={{
              width: 512,
              height: 512,
              position: "absolute",
              zIndex: 0,
            }}
          />
          <canvas
            ref={overlayRef}
            width={512}
            height={512}
            style={{
              position: "absolute",
              zIndex: 1,
              border: "1px solid #ccc",
            }}
          />
        </div>
      </div>

      {/* 右側：標記工具欄與標記清單 */}
      <div style={{ width: "200px", marginLeft: "2rem" }}>
        <h3>標記工具</h3>
        <button onClick={() => setIsAddingLabel(true)} style={{ marginBottom: "1rem" }}>➕ 新增標記</button>
        <LabelList labels={labels} onEdit={editLabel} onDelete={deleteLabel} />
      </div>
    </div>
  );
}

export default App;
