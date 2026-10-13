const { buildResult } = require("../sync");

module.exports = async function handler(_req, res) {
  try {
    const body = await buildResult();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(body);
  } catch (_error) {
    res.status(502).json({ error: "sync_failed" });
  }
};
