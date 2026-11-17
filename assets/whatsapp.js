(function(){
  var c = window.PORTFOLIO_CONFIG, num = c.whatsappNumber;
  function link(text){ return "https://wa.me/" + num + "?text=" + encodeURIComponent(text || c.whatsappDefaultText); }
  window.openWhatsApp = function(text){ window.open(link(text), "_blank", "noopener"); };

  // Any element with data-whatsapp becomes a WhatsApp link
  document.querySelectorAll("a[data-whatsapp]").forEach(function(a){
    a.href = link(a.getAttribute("data-whatsapp") || ""); a.target = "_blank"; a.rel = "noopener noreferrer";
  });

  // Contact form -> opens WhatsApp chat with the message prefilled
  var f = document.getElementById("waForm");
  if (f) f.addEventListener("submit", function(e){
    e.preventDefault();
    var n = f.name.value.trim(), m = f.message.value.trim();
    if (!n || !m) return;
    window.openWhatsApp("Hi Yash, I'm " + n + ".\n\n" + m + "\n\n(Sent from your portfolio)");
  });

  // Floating WhatsApp button
  var b = document.createElement("a");
  b.className = "wa-fab"; b.setAttribute("aria-label", "Chat on WhatsApp");
  b.href = link(); b.target = "_blank"; b.rel = "noopener noreferrer";
  b.innerHTML = '<svg viewBox="0 0 32 32" width="26" height="26" fill="#fff" aria-hidden="true"><path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2c1.8 1 3.7 1.500 5.700 1.500 6.900 0 12.500-5.600 12.500-12.500S22.900 3 16 3zm0 22.800c-1.800 0-3.600-.5-5.100-1.400l-.4-.2-4.400 1.200 1.200-4.300-.3-.4a10.200 10.200 0 0 1-1.600-5.500C5.400 9.700 10.200 5 16 5s10.600 4.700 10.600 10.500S21.800 25.800 16 25.800zm5.800-7.600c-.3-.2-1.900-.9-2.200-1-.3-.1-.5-.2-.7.200-.2.300-.8 1-1 1.200-.2.200-.4.200-.7.100-.3-.2-1.400-.5-2.600-1.600-1-.9-1.600-1.900-1.800-2.300-.2-.3 0-.5.200-.7l.5-.6c.2-.2.200-.3.300-.5.100-.2.100-.4 0-.6l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.100-.9.400-.3.300-1.200 1.200-1.200 2.800s1.200 3.300 1.400 3.500c.2.200 2.400 3.700 5.800 5.100.8.400 1.500.6 2 .8.800.3 1.600.2 2.200.1.700-.1 1.900-.8 2.200-1.500.3-.8.300-1.400.2-1.500-.1-.2-.3-.3-.6-.4z"/></svg>';
  document.body.appendChild(b);
})();
