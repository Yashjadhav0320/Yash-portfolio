
(function () {
  "use strict";

  const C = window.PORTFOLIO_CONFIG || {};

  const MODEL = C.ollamaModel || "llama3.2";
  const CHAT_ENDPOINT = "/api/chat";
  const TAGS_ENDPOINT = C.tagsEndpoint || "/api/tags";

  const SYSTEM = [
    "You are the AI assistant on Yash Jadhav's portfolio website.",
    "Answer visitors briefly and in a friendly way, using 2-4 sentences.",
    "Use ONLY the facts below.",
    "Never invent experience, employers, certifications or integrations.",
    "If information is unavailable, say so and suggest contacting Yash.",
    "",
    "FACTS:",
    "- Yash Jadhav is an MCA student at IMED, Pune.",
    "- He is interested in software development, Java and practical web applications.",
    "- His goal is to become a software engineer.",
    "- Skills: Java, Python, JavaScript, HTML, CSS, responsive layouts, SQL, MySQL, GitHub, VS Code and NetBeans.",
    "- CODIFY Quiz System: coding quiz platform for computer science students.",
    "- Hireverse: recruitment web application concept for candidates and recruiters.",
    "- Shambhoo Design Studio: creative studio website concept.",
    "- ShetkariSetu: farmer-support platform concept.",
    "- These projects are concepts or works in progress, not necessarily live products.",
    "- Yash is open to connecting with developers and discussing entry-level opportunities.",
    "- Email: yj64487@gmail.com",
    "- Phone/WhatsApp: +91 9022041318",
    "- GitHub: github.com/Yashjadhav0320",
    "- LinkedIn: linkedin.com/in/yash-jadhav-b5680937a",
    "- Portfolio pages: about.html, projects.html, skills.html and contact.html."
  ].join("\n");

  let history = [
    { role: "system", content: SYSTEM }
  ];

  let busy = false;

  // Create chatbot button
  const toggle = document.createElement("button");

  toggle.className = "cb-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open AI chat");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '💬 <span>Ask AI</span>';

  // Create chatbot panel
  const panel = document.createElement("div");

  panel.className = "cb-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "AI chatbot");

  panel.innerHTML =
    '<div class="cb-head">' +
      '<div>' +
        '<strong>Ask about Yash</strong>' +
        '<small>Powered by Ollama AI</small>' +
      '</div>' +
      '<button type="button" aria-label="Close chat">✕</button>' +
    '</div>' +
    '<div class="cb-msgs" aria-live="polite"></div>' +
    '<div class="cb-sugg"></div>' +
    '<form class="cb-form">' +
      '<input type="text" placeholder="Type your question..." ' +
        'aria-label="Your message" autocomplete="off" maxlength="500">' +
      '<button type="submit">Send</button>' +
    '</form>';

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  const msgs = panel.querySelector(".cb-msgs");
  const form = panel.querySelector(".cb-form");
  const input = form.querySelector("input");
  const send = form.querySelector("button");
  const sugg = panel.querySelector(".cb-sugg");

  // Add messages
  function add(cls, text) {
    const element = document.createElement("div");

    element.className = "cb-msg " + cls;
    element.textContent = text;

    msgs.appendChild(element);
    msgs.scrollTop = msgs.scrollHeight;

    return element;
  }

  add(
    "bot",
    "Hi! 👋 I'm Yash's AI assistant. Ask me about his projects, skills or how to contact him."
  );

  // Suggested questions
  [
    "What projects has Yash built?",
    "What are his skills?",
    "How can I contact him?"
  ].forEach(question => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = question;

    button.onclick = () => ask(question);

    sugg.appendChild(button);
  });

  // Open and close chatbot
  function setOpen(open) {
    panel.classList.toggle("open", open);

    toggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    if (open) input.focus();
  }

  toggle.onclick = () => {
    setOpen(!panel.classList.contains("open"));
  };

  panel.querySelector(".cb-head button").onclick = () => {
    setOpen(false);
    toggle.focus();
  };

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      panel.classList.contains("open")
    ) {
      setOpen(false);
    }
  });

  // Stream Ollama response
  async function streamResponse(response, element) {
    if (!response.body) {
      throw new Error("Streaming is not supported by this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let fullResponse = "";

    async function processLine(line) {
      if (!line.trim()) return;

      const data = JSON.parse(line);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.message && data.message.content) {
        fullResponse += data.message.content;

        element.textContent = fullResponse;
        msgs.scrollTop = msgs.scrollHeight;
      }

      if (data.done === true && !fullResponse.trim()) {
        throw new Error("The AI returned an empty response.");
      }
    }

    while (true) {
      const result = await reader.read();

      buffer += decoder.decode(
        result.value || new Uint8Array(),
        { stream: !result.done }
      );

      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        await processLine(line);
      }

      if (result.done) break;
    }

    if (buffer.trim()) {
      await processLine(buffer);
    }

    return fullResponse.trim();
  }

  // Call Node.js backend
  async function callOllama(element) {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: history,
        stream: true
      })
    });

    if (!response.ok) {
      let details = "";

      try {
        details = await response.text();
      } catch (_) {}

      if (
        response.status === 404 &&
        /not found/i.test(details)
      ) {
        throw new Error("MODEL");
      }

      throw new Error(
        "AI server returned HTTP " + response.status
      );
    }

    return await streamResponse(response, element);
  }

  // Diagnose connection
  async function diagnose() {
    if (window.location.protocol === "file:") {
      return "cors";
    }

    try {
      const response = await fetch(TAGS_ENDPOINT);

      if (!response.ok) {
        return "off";
      }

      const data = await response.json();

      const models = (data.models || []).map(
        model => model.name
      );

      const installed = models.some(name =>
        name === MODEL ||
        name.split(":")[0] === MODEL.split(":")[0]
      );

      return installed ? "other" : "model";

    } catch (_) {
      return "off";
    }
  }

  const MESSAGES = {
    off:
      "Cannot connect to Ollama. Please check that your portfolio server and Ollama are running.",

    cors:
      "Please open your portfolio through http://localhost:3000 instead of opening index.html directly.",

    model:
      "The model " + MODEL + " is not installed. Install it using: ollama pull " + MODEL,

    other:
      "Something went wrong connecting to the AI. Please restart your portfolio server and try again."
  };

  // Send question
  async function ask(text) {
    if (busy || !text.trim()) return;

    busy = true;
    send.disabled = true;
    sugg.style.display = "none";

    add("user", text);

    history.push({
      role: "user",
      content: text
    });

    // Keep recent conversation
    if (history.length > 13) {
      history.splice(1, history.length - 13);
    }

    const element = add("bot", "Thinking...");

    try {
      const answer = await callOllama(element);

      if (!answer) {
        element.textContent =
          "Sorry, I didn't receive an answer. Please try again.";
      } else {
        history.push({
          role: "assistant",
          content: answer
        });
      }

    } catch (error) {
      console.error("Chatbot error:", error);

      // Remove unanswered user message
      history.pop();

      element.className = "cb-msg err";

      let reason = "other";

      if (error.message === "MODEL") {
        reason = "model";
      } else {
        reason = await diagnose();
      }

      element.textContent =
        MESSAGES[reason] || MESSAGES.other;

    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  // Form submit
  form.addEventListener("submit", event => {
    event.preventDefault();

    const value = input.value.trim();

    if (!value) return;

    input.value = "";
    ask(value);
  });

})();
