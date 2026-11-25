
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");

const PORT = 3000;
const OLLAMA_HOST = "127.0.0.1";
const OLLAMA_PORT = 11434;
const MODEL = "llama3.2";

const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

// Check Ollama availability
function checkOllama() {
  return new Promise(resolve => {
    const request = http.get(
      `http://${OLLAMA_HOST}:${OLLAMA_PORT}/`,
      response => {
        response.resume();
        resolve(response.statusCode < 500);
      }
    );

    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => resolve(false));
  });
}

// Start Ollama automatically
async function startOllama() {
  if (await checkOllama()) {
    console.log("Ollama is already running.");
    return;
  }

  console.log("Starting Ollama...");

  const process = spawn("ollama", ["serve"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  process.unref();

  for (let i = 0; i < 40; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (await checkOllama()) {
      console.log("Ollama started successfully.");
      return;
    }
  }

  throw new Error(
    "Could not start Ollama. Check that Ollama is installed and available in PATH."
  );
}

// Proxy requests to Ollama
function proxyToOllama(req, res, apiPath) {
  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: apiPath,
    method: req.method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  const proxy = http.request(options, response => {
    res.writeHead(response.statusCode, {
      "Content-Type":
        response.headers["content-type"] || "application/json"
    });

    response.pipe(res);
  });

  proxy.on("error", error => {
    console.error("Ollama proxy error:", error.message);

    if (!res.headersSent) {
      res.writeHead(502, {
        "Content-Type": "application/json"
      });
    }

    res.end(JSON.stringify({
      error: "Cannot connect to Ollama."
    }));
  });

  req.pipe(proxy);
}

// Create portfolio server
const server = http.createServer((req, res) => {

  // Check installed models
  if (req.method === "GET" && req.url === "/api/tags") {
    proxyToOllama(req, res, "/api/tags");
    return;
  }

  // Chat API
  if (req.method === "POST" && req.url === "/api/chat") {
    proxyToOllama(req, res, "/api/chat");
    return;
  }

  // Only allow GET for website files
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  let requestedPath;

  try {
    requestedPath = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
  } catch {
    res.writeHead(400);
    res.end("Invalid URL");
    return;
  }

  if (requestedPath === "/") {
    requestedPath = "/index.html";
  }

  const filePath = path.resolve(
    ROOT,
    "." + requestedPath
  );

  // Prevent access outside portfolio folder
  if (
    filePath !== ROOT &&
    !filePath.startsWith(ROOT + path.sep)
  ) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, {
        "Content-Type": "text/plain"
      });
      res.end("File not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type":
        MIME_TYPES[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream"
    });

    if (req.method === "HEAD") {
      res.end();
    } else {
      res.end(data);
    }
  });
});

// Start application
async function startApplication() {
  try {
    await startOllama();

    server.listen(PORT, "127.0.0.1", () => {
      console.log("--------------------------------");
      console.log("YASH PORTFOLIO IS READY");
      console.log(`Website: http://localhost:${PORT}`);
      console.log(`AI Model: ${MODEL}`);
      console.log("--------------------------------");

      // Open portfolio automatically on Windows
      if (process.platform === "win32") {
        exec(
          `start "" "http://localhost:${PORT}"`,
          error => {
            if (error) {
              console.log("Open the website manually in your browser.");
            }
          }
        );
      }
    });

    server.on("error", error => {
      console.error("Portfolio server error:", error.message);
    });

  } catch (error) {
    console.error("STARTUP ERROR:", error.message);
    process.exit(1);
  }
}

startApplication();
