import React from "react";

function LabelList({ labels, onEdit, onDelete }) {
  return (
    <div>
      {labels.length === 0 && <p>尚無標記</p>}
      {labels.map((label) => (
        <div key={label.id} style={{ marginBottom: "0.5rem" }}>
          <span>{label.name}</span>
          <button onClick={() => onEdit(label.id)} style={{ marginLeft: "0.5rem" }}>✏️</button>
          <button onClick={() => onDelete(label.id)} style={{ marginLeft: "0.25rem" }}>❌</button>
        </div>
      ))}
    </div>
  );
}

export default LabelList;