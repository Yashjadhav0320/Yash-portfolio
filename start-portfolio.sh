#!/bin/sh
export OLLAMA_ORIGINS="*"
pgrep -x ollama >/dev/null || (ollama serve >/dev/null 2>&1 &)
ollama pull llama3.2
(sleep 1; xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000) &
node server.js
