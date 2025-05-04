import { useState, useEffect, useRef } from "react";
import * as fabric from "fabric";

export function LabelManager(isAddingLabel, setIsAddingLabel, canvas) {
  const [labels, setLabels] = useState([]);
  const labelCounter = useRef(1); // 用來產生連號 Label 名稱

  useEffect(() => {
    if (!isAddingLabel || !canvas) return;

    let points = [];
    let lines = [];
    let previewPolygon;
    let isDrawing = false;

    const onMouseDown = (opt) => {
      const pointer = canvas.getPointer(opt.e);

      // 拖曳起始點
      if (!isDrawing) {
        points.push(pointer);
        isDrawing = true;
        return;
      }

      // 點擊第三點以後的行為：加線 + 頂點 or 結束
      if (isDrawing && points.length >= 2) {
        const dx = pointer.x - points[0].x;
        const dy = pointer.y - points[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
          finishPolygon();
          return;
        }

        const lastPoint = points[points.length - 1];
        const line = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
          stroke: "blue",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
        lines.push(line);
        points.push(pointer);
      }
    };

    const onMouseUp = (opt) => {
      const pointer = canvas.getPointer(opt.e);
      if (points.length === 1) {
        points.push(pointer);

        const line = new fabric.Line(
          [points[0].x, points[0].y, points[1].x, points[1].y],
          {
            stroke: "blue",
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }
        );
        canvas.add(line);
        lines.push(line);
      }
    };

    const onMouseMove = (opt) => {
      if (!isDrawing || points.length < 2) return;
      const pointer = canvas.getPointer(opt.e);
      const tempPoints = [...points, pointer];

      if (previewPolygon) canvas.remove(previewPolygon);
      previewPolygon = new fabric.Polygon(tempPoints, {
        fill: "rgba(0,255,0,0.2)",
        stroke: "green",
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(previewPolygon);
      canvas.renderAll();
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter" && isDrawing && points.length >= 3) {
        finishPolygon();
      }
    };

    const finishPolygon = () => {
      isDrawing = false;
      lines.forEach((l) => canvas.remove(l));
      if (previewPolygon) canvas.remove(previewPolygon);

      const finalPolygon = new fabric.Polygon(points, {
        fill: "rgba(0,255,0,0.3)",
        stroke: "green",
        strokeWidth: 2,
        objectCaching: false,
        transparentCorners: false,
        cornerColor: "blue",
        selectable: false,
        evented: false,
      });

      canvas.add(finalPolygon);
      canvas.renderAll();

      const id = Date.now();
      const newLabel = {
        id,
        name: `Label ${labelCounter.current++}`,
        polygon: finalPolygon,
      };

      setLabels((prev) => [...prev, newLabel]);

      points = [];
      lines = [];
      previewPolygon = null;
      setIsAddingLabel(false);
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:up", onMouseUp);
    canvas.on("mouse:move", onMouseMove);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:up", onMouseUp);
      canvas.off("mouse:move", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAddingLabel, setIsAddingLabel, canvas]);

  const deleteLabel = (id) => {
    setLabels((prev) => {
      const label = prev.find((l) => l.id === id);
      if (
        label &&
        label.polygon &&
        typeof label.polygon.canvas?.remove === "function"
      ) {
        label.polygon.canvas.remove(label.polygon);
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  const editLabel = (id) => {
    labels.forEach((label) => {
      if (label.polygon) {
        label.polygon.selectable = false;
        label.polygon.evented = false;
      }
    });

    const label = labels.find((l) => l.id === id);
    if (!label || !label.polygon || !label.polygon.canvas) return;

    const polygon = label.polygon;
    const canvas = polygon.canvas;

    polygon.selectable = true;
    polygon.evented = true;
    polygon.hasBorders = false;
    polygon.hasControls = true;
    polygon.edit = true;

    polygon.controls = {};
    polygon.points.forEach((point, index) => {
      polygon.controls[`p${index}`] = new fabric.Control({
        positionHandler: function (dim, finalMatrix, fabricObject) {
          const x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x;
          const y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
          return fabric.util.transformPoint(
            { x, y },
            fabric.util.multiplyTransformMatrices(
              fabricObject.canvas.viewportTransform,
              fabricObject.calcTransformMatrix()
            )
          );
        },
        actionHandler: function (eventData, transform, x, y) {
          const polygon = transform.target;
          const anchorIndex = this.pointIndex;
          const localPoint = fabric.util.transformPoint(
            new fabric.Point(x, y),
            fabric.util.invertTransform(polygon.calcTransformMatrix())
          );
          polygon.points[anchorIndex] = {
            x: localPoint.x + polygon.pathOffset.x,
            y: localPoint.y + polygon.pathOffset.y
          };
          polygon.dirty = true;
          polygon.setCoords();
          return true;
        },
        render: function (ctx, left, top, styleOverride, fabricObject) {
  ctx.beginPath();
  ctx.arc(left, top, this.cornerSize / 2, 0, 2 * Math.PI, false);
  ctx.fillStyle = this.fill || 'rgba(0,0,255,0.5)';
  ctx.fill();
  ctx.strokeStyle = 'blue';
  ctx.stroke();
},
        cornerSize: 6,
        pointIndex: index,
      });
    });

    canvas.setActiveObject(polygon);
    canvas.requestRenderAll();
  };

  return {
    labels,
    deleteLabel,
    editLabel,
  };
}
