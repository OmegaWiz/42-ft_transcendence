(() => {
  const urlInput = document.getElementById("url");
  const connectBtn = document.getElementById("connect");
  const disconnectBtn = document.getElementById("disconnect");
  const statusEl = document.getElementById("status");
  const logEl = document.getElementById("log");
  const pingBtn = document.getElementById("ping");
  const chatInput = document.getElementById("chatInput");
  const chatSendBtn = document.getElementById("chatSend");

  let socket = null;

  function log(kind, data) {
    const time = new Date().toLocaleTimeString();
    const pre = document.createElement("pre");
    pre.textContent = `[${time}] ${kind}: ${typeof data === "string" ? data : JSON.stringify(data)}`;
    logEl.appendChild(pre);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setConnected(connected) {
    statusEl.textContent = connected ? "connected" : "disconnected";
    statusEl.style.background = connected ? "#d6ffd6" : "#eee";
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
    pingBtn.disabled = !connected;
    chatSendBtn.disabled = !connected;
  }

  connectBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
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
  });

  disconnectBtn.addEventListener("click", () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "client-initiated");
    }
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
