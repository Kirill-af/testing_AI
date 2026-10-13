const http = require("http");
const { buildResult } = require("./sync");

const port = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET") {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  try {
    const body = await buildResult();
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "sync_failed" }));
  }
});

server.listen(port, () => {
  console.log(`orders sync listening on ${port}`);
});
