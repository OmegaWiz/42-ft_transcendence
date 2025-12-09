(() => {
  const urlInput = document.getElementById("url");
  const connectBtn = document.getElementById("connect");
  const disconnectBtn = document.getElementById("disconnect");
  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const pingBtn = document.getElementById("ping");
  const chatInput = document.getElementById("chatInput");
  const chatSendBtn = document.getElementById("chatSend");
  const roomInput = document.getElementById("room");
  const switchRoomBtn = document.getElementById("switchRoom");

  let socket = null;

  function log(kind, data) {
    const time = new Date().toLocaleTimeString();
    const pre = document.createElement("pre");
    pre.textContent = `[${time}] ${kind}: ${typeof data === "string" ? data : JSON.stringify(data)}`;
    logEl.appendChild(pre);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setConnected(connected) {
    const room = roomInput.value.trim() || "default";
    statusEl.textContent = connected ? `connected (${room})` : "disconnected";
    statusEl.style.background = connected ? "#d6ffd6" : "#eee";
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    pingBtn.disabled = !connected;
    chatSendBtn.disabled = !connected;
    switchRoomBtn.disabled = !connected;
  }

  function openSocket() {
    const base = urlInput.value.trim().replace(/\?.*$/, "");
    const roomId = roomInput.value.trim() || "default";
    const url = `${base}?roomId=${encodeURIComponent(roomId)}`;
    try {
      socket = new WebSocket(url);
    } catch (e) {
      log("error", e.message || String(e));
      return;
    }

    log("info", `Connecting to ${url}...`);

    socket.addEventListener("open", () => {
      log("open", "Connection established");
      setConnected(true);
    });

    socket.addEventListener("message", (event) => {
      let payload = event.data;
      try {
        payload = JSON.parse(payload);
      } catch {
        // keep as string
      }
      log("message", payload);
    });

    socket.addEventListener("close", () => {
      log("close", "Connection closed");
      setConnected(false);
    });

    socket.addEventListener("error", (event) => {
      log("error", event?.message ?? "Unknown WebSocket error");
    });
  }

  connectBtn.addEventListener("click", () => {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    openSocket();
  });

  disconnectBtn.addEventListener("click", () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "client-initiated");
    }
  });

  switchRoomBtn.addEventListener("click", () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    // Close current and reconnect to new room
    const newRoom = roomInput.value.trim() || "default";
    log("info", `Switching to room '${newRoom}'...`);
    socket.addEventListener("close", function handleClose() {
      socket.removeEventListener("close", handleClose);
      openSocket();
    });
    socket.close(1000, "switch-room");
  });

  pingBtn.addEventListener("click", () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const msg = { type: "ping" };
    socket.send(JSON.stringify(msg));
    log("send", msg);
  });

  chatSendBtn.addEventListener("click", () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const text = chatInput.value.trim();
    if (!text) return;
    const msg = { type: "chat", message: text };
    socket.send(JSON.stringify(msg));
    log("send", msg);
    chatInput.value = "";
  });
})();
