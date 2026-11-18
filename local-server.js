
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const saveContact = require("./routes/contact");

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

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(data));
}
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

  let child;

  try {
    child = spawn("ollama", ["serve"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
    });
  } catch (error) {
    throw new Error(
      "Could not start Ollama. Check that Ollama is installed and available in PATH."
    );
  }

  child.on("error", error => {
    console.error("Ollama process error:", error.message);
  });
  child.unref();

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
      sendJSON(res, 502, {
        error: "Cannot connect to Ollama."
      });
    } else {
      res.end();
    }
  });

  req.pipe(proxy);
}

// Supabase contact API
async function handleContact(req, res) {
  let body = "";
  let bodySize = 0;
  let tooLarge = false;

  req.on("data", chunk => {
    bodySize += chunk.length;

    if (bodySize > 1024 * 1024) {
      tooLarge = true;
      body = "";
      return;
    }

    if (!tooLarge) {
      body += chunk.toString("utf8");
    }
  });

  req.on("end", async () => {
    if (tooLarge) {
      sendJSON(res, 413, {
        success: false,
        message: "Request is too large."
      });
      return;
    }

    let data;

    try {
      data = JSON.parse(body);
    } catch {
      sendJSON(res, 400, {
        success: false,
        message: "Invalid JSON request."
      });
      return;
    }

    try {
      const result = await saveContact(data);
      sendJSON(res, 201, result);
    } catch (error) {
      console.error("Contact API error:", error.message);

      sendJSON(res, error.statusCode || 500, {
        success: false,
        message: error.message
      });
    }
  });
}

// Create portfolio server
const server = http.createServer((req, res) => {
  let pathname;

  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    res.writeHead(400);
    res.end("Invalid URL");
    return;
  }

  // Supabase contact form
  if (req.method === "POST" && pathname === "/api/contact") {
    handleContact(req, res);
    return;
  }

  // Check installed Ollama models
  if (req.method === "GET" && pathname === "/api/tags") {
    proxyToOllama(req, res, "/api/tags");
    return;
  }

  // Ollama AI chat
  if (req.method === "POST" && pathname === "/api/chat") {
    proxyToOllama(req, res, "/api/chat");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  let requestedPath;

  try {
    requestedPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400);
    res.end("Invalid URL");
    return;
  }

  if (requestedPath === "/") {
    requestedPath = "/index.html";
  }

  const filePath = path.resolve(ROOT, "." + requestedPath);
  const relativePath = path.relative(ROOT, filePath);
  const firstSegment = relativePath.split(path.sep)[0];

  // Prevent access outside portfolio folder
  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Never expose backend files, environment files or dependencies
  const protectedFiles = [
    "local-server.js",
    "server.js",
    "package.json",
    "package-lock.json"
  ];

  const protectedFolders = [
    "api",
    "config",
    "routes",
    "node_modules",
    ".git",
    ".vscode"
  ];

  if (
    relativePath.split(path.sep).some(part => part.startsWith(".")) ||
    protectedFiles.includes(relativePath) ||
    protectedFolders.includes(firstSegment)
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
      console.log("Supabase contact API: Configured if environment variables are set");
      console.log("--------------------------------");

      // Automatically open portfolio on Windows
      if (process.platform === "win32") {
        exec(
          `start "" "http://localhost:${PORT}"`,
          error => {
            if (error) {
              console.log(
                "Open the website manually in your browser."
              );
            }
          }
        );
      }
    });

    server.on("error", error => {
      console.error(
        "Portfolio server error:",
        error.message
      );
    });

  } catch (error) {
    console.error("STARTUP ERROR:", error.message);
    process.exit(1);
  }
}

startApplication();
