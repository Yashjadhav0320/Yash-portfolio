YASH JADHAV — PORTFOLIO WEBSITE

Start with index.html.
Pages: index.html, about.html, projects.html, skills.html, assignments.html, contact.html.
Lab assignments: assignments.html lists 22 JavaScript lab assignments; each opens a working demo from the assignments/ folder (source code shown on every page).
Project pages: codify.html, hireverse.html, shambhoo-design-studio.html, shetkarisetu.html.

IMAGE LINKS
images/project-1.jpg — CODIFY Quiz System
images/project-2.jpg — Hireverse
images/project-3.jpg — Shambhoo Design Studio
images/project-4.jpg — ShetkariSetu
The HTML files use relative paths such as src="images/project-1.jpg". Keep the images folder alongside the HTML files. Project page images are clickable and open the original image file.

BUTTONS
Project image and View project details buttons open dedicated project pages. Each project page includes All projects, GitHub profile, email enquiry, and Back to home buttons. Main navigation opens separate pages. Contact buttons use the provided email and phone details.

CONTACT
Email: yj64487@gmail.com
Phone: +91 9022041318
GitHub: https://github.com/Yashjadhav0320
LinkedIn: https://www.linkedin.com/in/yash-jadhav-b5680937a

ACCURACY
The write-ups describe concepts and proposed functionality; planned features are not claimed to be live integrations. GitHub buttons open the profile because project-specific repository links were not provided.

RUN
Open the folder in VS Code and run index.html with Live Server, or open index.html directly in a browser.

WHATSAPP + AI CHATBOT
Settings: assets/config.js (WhatsApp number, Ollama model/endpoints).
WhatsApp: shown ONLY on the Contact page (WhatsApp row, message form, floating button).
AI chatbot: "Ask AI" button on every page, powered by Ollama.

EASIEST WAY TO RUN (Windows): double-click start-portfolio.bat
  It starts Ollama, downloads the llama3.2 model (first time only), starts the site and opens http://localhost:3000.
  Requires Ollama (https://ollama.com) and Node.js (https://nodejs.org).
Mac/Linux: ./start-portfolio.sh

IMPORTANT: do not open the pages by double-clicking the .html files for the chatbot - browsers block file:// pages from calling Ollama. Use http://localhost:3000.
Ollama runs on your own computer, so the chatbot only works for visitors if the site is hosted where Ollama is reachable.
