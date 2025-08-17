

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SketchPicker } from "react-color";
import { jsPDF } from "jspdf";
import { io } from "socket.io-client";


// --- utility: debounce ---
function debounce(fn, wait = 500) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

const TOOL = {
  PEN: "pen",
  ERASER: "eraser",
};

export default function Whiteboard({ roomId, serverUrl = "https://team-collaborations-backend.onrender.com" }) {

  // const [color, setColor] = useState("#111111"); // selected color
  const [showPicker, setShowPicker] = useState(false); // toggle visibility

  // Socket
  const socketRef = useRef(null);

  // Boards & selection (in-memory only)
  const [boards, setBoards] = useState([]); // {id, name, dataPreview}
  const [selectedId, setSelectedId] = useState(null);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const selectedBoard = useMemo(() => boards.find((b) => b.id === selectedId) || null, [boards, selectedId]);

  // Admin & access (server-provided)
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessEnabled, setAccessEnabled] = useState(false);
  const effectiveCanEdit = isAdmin || accessEnabled;
  const effectiveCanEditRef = useRef(effectiveCanEdit);
  useEffect(() => { effectiveCanEditRef.current = effectiveCanEdit; }, [effectiveCanEdit]);

  // Drawing state
  const [tool, setTool] = useState(TOOL.PEN);
  const [strokeSize, setStrokeSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(18);
  const [color, setColor] = useState("#111111");

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Undo/Redo (client-local only)
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const undoStackRef = useRef(undoStack);
  const redoStackRef = useRef(redoStack);
  useEffect(() => { undoStackRef.current = undoStack; }, [undoStack]);
  useEffect(() => { redoStackRef.current = redoStack; }, [redoStack]);

  const prevBoardIdRef = useRef(null);

  // ---------- SOCKET WIRING ----------
  useEffect(() => {
    if (!roomId) return;

    const socket = io(serverUrl, { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;

    socket.emit("join-room", { roomId });

    socket.on("init-boards", (payload) => {
      const serverBoards = Array.isArray(payload?.boards) ? payload.boards : [];
      setBoards(serverBoards);
      setSelectedId(serverBoards[0]?.id || null);
      setAccessEnabled(!!payload?.accessEnabled);
      setIsAdmin(!!payload?.isAdmin);
    });

    socket.on("board-updated", ({ boardId, dataPreview }) => {
      if (!boardId) return;
      const normalized = dataPreview ?? "";

      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, dataPreview: normalized } : b))
      );

      if (boardId === selectedIdRef.current) {
        if (normalized) drawDataUrl(normalized).catch(() => {});
        else {
          const canvas = canvasRef.current;
          const ctx = ctxRef.current;
          if (canvas && ctx) {
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }
      }
    });

    socket.on("boards-list-updated", ({ boards: serverBoards }) => {
      const list = Array.isArray(serverBoards) ? serverBoards : [];
      setBoards(list);
      if (!list.find((b) => b.id === selectedIdRef.current)) {
        setSelectedId(list[0]?.id || null);
      }
    });

    socket.on("access-changed", ({ accessEnabled }) => {
      setAccessEnabled(!!accessEnabled);
    });

    socket.on("action-denied", ({ reason }) => {
      window.alert(reason || "Action denied by server");
    });

    return () => {
      socket.off("init-boards");
      socket.off("board-updated");
      socket.off("boards-list-updated");
      socket.off("access-changed");
      socket.off("action-denied");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, serverUrl]);

  // ---------- Canvas helpers ----------
  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try { return canvas.toDataURL("image/png"); } catch { return null; }
  }, []);

  const drawDataUrl = useCallback((dataUrl) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve();
      if (!dataUrl) {
        const ctx = ctxRef.current;
        if (ctx) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
        return resolve();
      }
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        try {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.width;
          const ih = img.height;
          const scale = Math.min(cw / iw, ch / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        } catch (err) {
          console.error("drawDataUrl error:", err);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl.startsWith("data:image") ? dataUrl : `data:image/png;base64,${dataUrl}`;
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent) return;

    const prev = snapshot();
    const ratio = window.devicePixelRatio || 1;
    const { clientWidth, clientHeight } = parent;

    const w = Math.max(1, clientWidth);
    const h = Math.max(1, clientHeight);

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (prev) drawDataUrl(prev).catch(() => {});
  }, [drawDataUrl, snapshot]);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  // Load selected board into canvas on change
  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !selectedBoard) return;

    if (prevBoardIdRef.current !== selectedBoard.id) {
      setUndoStack([]);
      setRedoStack([]);
      prevBoardIdRef.current = selectedBoard.id;
    }

    if (selectedBoard.dataPreview) {
      drawDataUrl(selectedBoard.dataPreview).catch(() => {});
    } else {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [selectedBoard, drawDataUrl]);

  // ---------- Live persist via socket ----------
  const persistBoard = useCallback(() => {
    if (!selectedId || !effectiveCanEdit) return;
    const dataPreview = snapshot();
    if (!dataPreview) return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("update-board", { roomId, boardId: selectedId, dataPreview });
  }, [roomId, selectedId, effectiveCanEdit, snapshot]);

  const debouncedSave = useMemo(() => debounce(persistBoard, 600), [persistBoard]);

  // ---------- Drawing handlers ----------
  const currentSize = tool === TOOL.PEN ? strokeSize : eraserSize;

  const startStroke = useCallback((x, y) => {
    if (!effectiveCanEdit) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    const snap = snapshot();
    if (snap) setUndoStack((st) => [...st, snap].slice(-50));
    setRedoStack([]);
  }, [snapshot, effectiveCanEdit]);

  const continueStroke = useCallback((x, y) => {
    const ctx = ctxRef.current;
    if (!ctx || !isDrawingRef.current) return;

    ctx.save();
    ctx.globalCompositeOperation = tool === TOOL.ERASER ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === TOOL.ERASER ? "rgba(0,0,0,1)" : color;
    ctx.lineWidth = currentSize;

    const { x: lx, y: ly } = lastPointRef.current;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  }, [tool, color, currentSize]);

  const endStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    debouncedSave();
  }, [debouncedSave]);

  // Pointer conversion
  const getXY = useCallback((evt) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (evt.touches?.length) {
      const t = evt.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }, []);

  // Mouse & touch listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e) => { e.preventDefault(); const { x, y } = getXY(e); startStroke(x, y); };
    const onMove = (e) => { if (!isDrawingRef.current) return; e.preventDefault(); const { x, y } = getXY(e); continueStroke(x, y); };
    const onUp = (e) => { e.preventDefault(); endStroke(); };
    const onLeave = (e) => { if (!isDrawingRef.current) return; e.preventDefault(); endStroke(); };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onLeave);

    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp, { passive: false });
    canvas.addEventListener("touchcancel", onLeave, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onLeave);

      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      canvas.removeEventListener("touchcancel", onLeave);
    };
  }, [startStroke, continueStroke, endStroke, getXY]);

  // ---------- Undo/Redo ----------
  const undo = useCallback(async () => {
    if (!effectiveCanEditRef.current || undoStackRef.current.length === 0) return;

    const prevData = undoStackRef.current[undoStackRef.current.length - 1];
    const snap = snapshot();
    if (snap) setRedoStack((rs) => [...rs, snap].slice(-50));
    setUndoStack(undoStackRef.current.slice(0, -1));

    await drawDataUrl(prevData || "");
    setBoards((prev) =>
      prev.map((b) =>
        b.id === selectedIdRef.current ? { ...b, dataPreview: prevData ?? "" } : b
      )
    );

    const socket = socketRef.current;
    if (socket && effectiveCanEditRef.current) {
      socket.emit("update-board", {
        roomId,
        boardId: selectedIdRef.current,
        dataPreview: prevData ?? "",
      });
    }
  }, [drawDataUrl, snapshot, roomId]);

  const redo = useCallback(async () => {
    if (!effectiveCanEditRef.current || redoStackRef.current.length === 0) return;

    const nextData = redoStackRef.current[redoStackRef.current.length - 1];
    const snap = snapshot();
    if (snap) setUndoStack((st) => [...st, snap].slice(-50));
    setRedoStack(redoStackRef.current.slice(0, -1));

    await drawDataUrl(nextData || "");
    setBoards((prev) =>
      prev.map((b) =>
        b.id === selectedIdRef.current ? { ...b, dataPreview: nextData ?? "" } : b
      )
    );

    const socket = socketRef.current;
    if (socket && effectiveCanEditRef.current) {
      socket.emit("update-board", {
        roomId,
        boardId: selectedIdRef.current,
        dataPreview: nextData ?? "",
      });
    }
  }, [drawDataUrl, snapshot, roomId]);

  // ---------- Admin actions ----------
  const createBoard = useCallback(() => {
    if (!isAdmin) { alert("Only admin can create boards."); return; }
    const name = prompt("Board name:", `Untitled ${boards.length + 1}`);
    if (!name) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("create-board", { roomId, name });
  }, [isAdmin, boards.length, roomId]);

  const removeBoard = useCallback((id) => {
    if (!isAdmin) { alert("Only admin can delete boards."); return; }
    const b = boards.find((x) => x.id === id);
    if (!b) return;
    if (!window.confirm(`Delete board "${b.name}"? This cannot be undone.`)) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("delete-board", { roomId, boardId: id });
  }, [isAdmin, boards, roomId]);

  const toggleAccess = useCallback(() => {
    if (!isAdmin) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("set-access", { roomId, accessEnabled: !accessEnabled });
  }, [isAdmin, accessEnabled, roomId]);

  const clearBoard = useCallback(() => {
    if (!selectedId) return;
    if (!effectiveCanEdit) { alert("You don't have permission to clear this board."); return; }
    if (!window.confirm("Clear current board? This can be undone with Undo.")) return;

    const snap = snapshot();
    if (snap) setUndoStack((st) => [...st, snap].slice(-50));
    setRedoStack([]);

    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    setBoards((prev) => prev.map((b) => (b.id === selectedId ? { ...b, dataPreview: "" } : b)));

    const socket = socketRef.current;
    if (socket) socket.emit("clear-board", { roomId, boardId: selectedId });
  }, [selectedId, effectiveCanEdit, snapshot, roomId]);

  // ---------- Export all boards ----------
  const downloadAllAsPdf = useCallback(async () => {
    if (!boards.length) { alert("No boards to export."); return; }
    const pdf = new jsPDF({ unit: "pt", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;

    for (let i = 0; i < boards.length; i++) {
      const b = boards[i];
      const dataUrl = b.dataPreview?.startsWith("data:image")
        ? b.dataPreview
        : b.dataPreview
        ? `data:image/png;base64,${b.dataPreview}`
        : null;

      if (i > 0) pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(b.name || `Board ${i + 1}`, margin, margin + 10);

      if (dataUrl) {
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = dataUrl;
        });
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2 - 24;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (pageW - dw) / 2;
        const dy = margin + 24;
        pdf.addImage(img, "PNG", dx, dy, dw, dh);
      }
    }

    pdf.save("boards.pdf");
  }, [boards]);
  // ---------- UI ----------
  return (

    <div className="flex flex-col h-screen">
  {/* Boards list at the top */}
  <aside className="flex flex-col bg-gray-100 p-4">
    <ul className="flex overflow-x-auto space-x-2">
      {boards.map((b) => (
        <li
          key={b.id}
          onClick={() => setSelectedId(b.id)}
          className={`flex-shrink-0 flex justify-between items-center p-2 rounded cursor-pointer ${
            selectedId === b.id ? "bg-blue-200" : "bg-white hover:bg-gray-200"
          }`}
          title={b.name}
        >
          <span className="truncate text-center w-full">{b.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeBoard(b.id);
            }}
            className={` px-2 py-1 rounded-full ${
              isAdmin
                ? "text-red-500  hover:text-red-600"
                : "text-gray-300  cursor-not-allowed"
            }`}
            disabled={!isAdmin}
            title={isAdmin ? "Delete board" : "Admin only"}
          >
            X
          </button>
        </li>
      ))}
    </ul>
  </aside>

  {/* Top bar and toolbar */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border-b border-gray-300 gap-2">
    {/* Role & access */}
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="px-2 py-1 rounded bg-gray-100">
        Role: <b>{isAdmin ? "Admin" : "Roommate"}</b>
      </span>
      <span
        className={`px-2 py-1 rounded ${
          effectiveCanEdit
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
        title={isAdmin ? "Admin can always edit" : "Controlled by admin"}
      >
        {effectiveCanEdit ? "Edit Enabled" : "View Only"}
      </span>
    </div>

    {/* Admin toggle */}
    {isAdmin && (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm">Allow roommates to edit</span>
        <button
          onClick={toggleAccess}
          className={`px-3 py-1 rounded ${
            accessEnabled
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
          title="Toggle roommates' edit access"
        >
          {accessEnabled ? "On" : "Off"}
        </button>
      </div>
    )}
  </div>

  {/* Toolbar */}
  <div className="flex flex-wrap items-center p-2 border-b border-gray-300 gap-2 sm:gap-4">
    {/* Tool selector */}
    <div className="flex items-center space-x-2 flex-wrap">
      <button
        onClick={() => setTool(TOOL.PEN)}
        className={`px-2 py-1 rounded ${
          tool === TOOL.PEN ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
        }`}
        disabled={!effectiveCanEdit}
      >
        Pen
      </button>
      <button
        onClick={() => setTool(TOOL.ERASER)}
        className={`px-2 py-1 rounded ${
          tool === TOOL.ERASER ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
        }`}
        disabled={!effectiveCanEdit}
      >
        Eraser
      </button>
    </div>

    {/* Size slider */}
    <div className="flex items-center space-x-2">
      <span>{tool === TOOL.PEN ? `${strokeSize}px` : `${eraserSize}px`}</span>
      <input
        type="range"
        min={tool === TOOL.PEN ? 1 : 6}
        max={tool === TOOL.PEN ? 48 : 64}
        value={tool === TOOL.PEN ? strokeSize : eraserSize}
        onChange={(e) =>
          tool === TOOL.PEN
            ? setStrokeSize(Number(e.target.value))
            : setEraserSize(Number(e.target.value))
        }
        disabled={!effectiveCanEdit}
      />
    </div>

    {/* Color picker */}
    <div className="relative">
      <button
        onClick={() => setShowPicker((prev) => !prev)}
        style={{
          backgroundColor: color,
          color: "#fff",
          padding: "8px 12px",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Color
      </button>
      {showPicker && (
        <div className="absolute z-50 mt-2">
          <SketchPicker
            color={color}
            onChange={(c) => setColor(c.hex)}
            presetColors={["#111111","#ff0000","#00aaff","#22c55e","#f59e0b","#8b5cf6"]}
            width="220px"
            disableAlpha
          />
        </div>
      )}
    </div>

    {/* Actions */}
    <div className="flex flex-wrap ml-auto gap-2">
      <button
        onClick={undo}
        className="bg-gray-300 px-2 py-1 rounded disabled:opacity-50"
        disabled={!undoStack.length || !effectiveCanEdit}
      >
        Undo
      </button>
      <button
        onClick={redo}
        className="bg-gray-300 px-2 py-1 rounded disabled:opacity-50"
        disabled={!redoStack.length || !effectiveCanEdit}
      >
        Redo
      </button>
      <button
        onClick={clearBoard}
        className="bg-red-500 px-2 py-1 rounded text-white hover:bg-red-600 disabled:opacity-50"
        disabled={!effectiveCanEdit || !selectedId}
      >
        Clear
      </button>
      <button
        onClick={createBoard}
        className={`px-2 py-1 rounded ${
          isAdmin ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!isAdmin}
      >
        New
      </button>
      <button
        onClick={downloadAllAsPdf}
        className="bg-gray-300 text-gray-800 px-2 py-1 rounded hover:bg-gray-400"
      >
        Download All
      </button>
    </div>
  </div>

  {/* Canvas */}
  <div ref={containerRef} className="flex-1 relative p-2 min-h-0 ">
  <canvas
    ref={canvasRef}
    className="w-full h-screen border border-gray-300"
  />
  {!effectiveCanEdit && (
    <div className="pointer-events-none absolute top-3 right-3 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs shadow">
      View-only (admin can enable editing)
    </div>
  )}
</div>



</div>



  );
}

/* ---------- helpers ---------- */
function loadImageAsync(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
