let CATALOG = null;

// -------------------- Toast (extra clean UX) --------------------
let toastTimer = null;
function showToast(message, ms = 1800) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, ms);
}

// -------------------- Device detection --------------------
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

// -------------------- Icons (inline SVG, no hosting needed) --------------------
function iconWhatsApp() {
  return `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2a9.7 9.7 0 0 0-9.7 9.7c0 1.7.4 3.4 1.2 4.9L2 22l5.6-1.4c1.5.8 3.2 1.2 4.9 1.2A9.7 9.7 0 0 0 22.2 12 9.7 9.7 0 0 0 12 2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3.3.8.9-3.2-.2-.3a7.8 7.8 0 0 1-1.2-4A7.9 7.9 0 0 1 12 4.2 7.9 7.9 0 0 1 19.8 12 7.9 7.9 0 0 1 12 19.7z"/>
    <path fill="currentColor" d="M16.6 14.2c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1l-.6.7c-.2.2-.3.2-.5.1-1.5-.7-2.5-2-2.7-2.3-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.1-.4 0-.1-.1-.3-.1-.4l-.7-1.6c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3z"/>
  </svg>`;
}

function iconSignal() {
  return `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 3c-5 0-9 3.5-9 7.8 0 2.4 1.3 4.6 3.4 6.1L6 21l4-2c.6.1 1.3.2 2 .2 5 0 9-3.5 9-7.8S17 3 12 3zm0 14.5c-.7 0-1.3-.1-1.9-.2l-.4-.1-1.8.9.4-2-.3-.2c-1.9-1.2-3-2.9-3-4.8C5 7.7 8.1 5.5 12 5.5s7 2.2 7 5.6-3.1 6-7 6z"/>
    <circle fill="currentColor" cx="9.3" cy="11.1" r="1"/>
    <circle fill="currentColor" cx="12" cy="11.1" r="1"/>
    <circle fill="currentColor" cx="14.7" cy="11.1" r="1"/>
  </svg>`;
}

// -------------------- Link builders --------------------
function buildWhatsAppLink(phoneE164, message) {
  const clean = (phoneE164 || "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}

// Signal deep link works best on mobile; desktop is inconsistent.
// We’ll still provide a best-effort desktop contact link.
function buildSignalLink(phoneE164, message) {
  const text = encodeURIComponent(message);
  if (isMobileDevice()) {
    return `sgnl://send?phone=${phoneE164}&text=${text}`;
  }
  return `https://signal.me/#p/${encodeURIComponent(phoneE164)}`;
}

function buildTelLink(phoneE164) {
  return `tel:${phoneE164}`;
}

// -------------------- Helpers --------------------
function money(price) {
  if (!price || price === 0) return "Quote";
  return `$${price.toFixed(0)}`;
}

function uniqueCategories(items) {
  const set = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Signal button click behavior:
 * - Copies the message to clipboard (always useful on desktop)
 * - Tries to open Signal (deep link on mobile)
 * - After a short delay, opens WhatsApp as fallback (in a new tab)
 */
function attachSignalFallback(anchorEl, signalUrl, waUrl, messageToCopy) {
  if (!anchorEl) return;

  anchorEl.addEventListener("click", async (e) => {
    e.preventDefault();

    const copied = await copyToClipboard(messageToCopy);
    if (copied) showToast("Message copied. Opening Signal…");
    else showToast("Opening Signal…");

    // Try Signal first
    window.location.href = signalUrl;

    // Fallback to WhatsApp if Signal doesn't open
    setTimeout(() => {
      showToast("If Signal didn’t open, WhatsApp is opening…", 2200);
      window.open(waUrl, "_blank", "noopener");
    }, 950);
  });
}

// -------------------- Render --------------------
function render(items, seller) {
  const grid = document.getElementById("grid");
  const status = document.getElementById("status");
  grid.innerHTML = "";

  status.textContent = `${items.length} item(s) shown • ${seller.location} • Typical lead time: ${seller.leadTime}`;

  if (items.length === 0) {
    grid.innerHTML = `<div class="status">No matches. Try a different search or category.</div>`;
    return;
  }

  for (const item of items) {
    const msg =
`Hi! I want to order: ${item.name}
Category: ${item.category}
Material: ${item.material}
Size: ${item.size}
Requested color(s): ______
Quantity: ____
Pickup: ${seller.location}`;

    const wa = buildWhatsAppLink(seller.phoneE164, msg);
    const signal = buildSignalLink(seller.phoneE164, msg);

    const card = document.createElement("article");
    card.className = "card";

    const badgeText = item.featured ? "Popular" : item.category;

    card.innerHTML = `
      <div class="thumb">
        <span class="badge">${badgeText}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${item.name}</div>
          <div class="price">${money(item.price)}</div>
        </div>
        <div class="desc">${item.description}</div>
        <div class="meta">
          <span class="pill">${item.category}</span>
          <span class="pill">${item.material}</span>
          <span class="pill">${item.size}</span>
          <span class="pill">${item.leadTimeDays} day(s)</span>
        </div>
        <div class="actions">
          <a class="btn primary" href="${wa}" target="_blank" rel="noopener">
            ${iconWhatsApp()}<span class="label">WhatsApp</span>
          </a>
          <a class="btn" href="${signal}" data-signal="1">
            ${iconSignal()}<span class="label">Signal</span>
          </a>
        </div>
      </div>
    `;

    // Add fallback behavior to Signal button
    const signalBtn = card.querySelector('[data-signal="1"]');
    attachSignalFallback(signalBtn, signal, wa, msg);

    grid.appendChild(card);
  }
}

// -------------------- Filters --------------------
function applyFilters() {
  const search = (document.getElementById("search").value || "").toLowerCase().trim();
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let items = [...CATALOG.items];

  if (category !== "all") {
    items = items.filter(i => i.category === category);
  }

  if (search) {
    items = items.filter(i => {
      const hay = [
        i.name, i.category, i.description,
        ...(i.tags || []),
        i.material, i.size, i.id
      ].join(" ").toLowerCase();
      return hay.includes(search);
    });
  }

  if (sort === "featured") {
    items.sort((a, b) => (b.featured === true) - (a.featured === true));
  } else if (sort === "priceAsc") {
    items.sort((a, b) => (a.price || 999999) - (b.price || 999999));
  } else if (sort === "priceDesc") {
    items.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "nameAsc") {
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  render(items, CATALOG.seller);
}

// -------------------- Init --------------------
async function init() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  CATALOG = await res.json();

  const phone = CATALOG.seller.phoneE164;

  // General message
  const generalMsg =
`Hi! I’m browsing your 3D print catalog.
I want to ask about: ______
Pickup: ${CATALOG.seller.location}`;

  // Custom quote message
  const customMsg =
`Hi! I want a custom 3D print quote.
What I want: ______
Reference link/photo: ______
Desired size: ______
Color(s): ______
Quantity: ______
Pickup: ${CATALOG.seller.location}`;

  // Model-link quote message
  const linkMsg =
`Hi! I found a model online and want a quote.
Model link: ______
Site: Printables / MakerWorld
Desired size (approx): ______
Color(s): ______
Quantity: ______
Pickup: ${CATALOG.seller.location}`;

  // Header buttons
  const waGeneralEl = document.getElementById("waGeneral");
  const signalGeneralEl = document.getElementById("signalGeneral");
  const callGeneralEl = document.getElementById("callGeneral");

  const waGeneralUrl = buildWhatsAppLink(phone, generalMsg);
  const signalGeneralUrl = buildSignalLink(phone, generalMsg);

  if (waGeneralEl) {
    waGeneralEl.href = waGeneralUrl;
    waGeneralEl.innerHTML = `${iconWhatsApp()}<span class="label">WhatsApp</span>`;
    waGeneralEl.target = "_blank";
    waGeneralEl.rel = "noopener";
  }

  if (signalGeneralEl) {
    signalGeneralEl.href = signalGeneralUrl;
    signalGeneralEl.innerHTML = `${iconSignal()}<span class="label">Signal</span>`;
    attachSignalFallback(signalGeneralEl, signalGeneralUrl, waGeneralUrl, generalMsg);
  }

  if (callGeneralEl) callGeneralEl.href = buildTelLink(phone);

  // Community model buttons
  const waFromLinkEl = document.getElementById("waFromLink");
  const signalFromLinkEl = document.getElementById("signalFromLink");

  const waFromLinkUrl = buildWhatsAppLink(phone, linkMsg);
  const signalFromLinkUrl = buildSignalLink(phone, linkMsg);

  if (waFromLinkEl) {
    waFromLinkEl.href = waFromLinkUrl;
    waFromLinkEl.innerHTML = `${iconWhatsApp()}<span class="label">Send Model Link</span>`;
    waFromLinkEl.target = "_blank";
    waFromLinkEl.rel = "noopener";
  }

  if (signalFromLinkEl) {
    signalFromLinkEl.href = signalFromLinkUrl;
    signalFromLinkEl.innerHTML = `${iconSignal()}<span class="label">Send via Signal</span>`;
    attachSignalFallback(signalFromLinkEl, signalFromLinkUrl, waFromLinkUrl, linkMsg);
  }

  // Custom quote buttons
  const waCustomEl = document.getElementById("waCustom");
  const signalCustomEl = document.getElementById("signalCustom");

  const waCustomUrl = buildWhatsAppLink(phone, customMsg);
  const signalCustomUrl = buildSignalLink(phone, customMsg);

  if (waCustomEl) {
    waCustomEl.href = waCustomUrl;
    waCustomEl.innerHTML = `${iconWhatsApp()}<span class="label">Custom Quote</span>`;
    waCustomEl.target = "_blank";
    waCustomEl.rel = "noopener";
  }

  if (signalCustomEl) {
    signalCustomEl.href = signalCustomUrl;
    signalCustomEl.innerHTML = `${iconSignal()}<span class="label">Signal Quote</span>`;
    attachSignalFallback(signalCustomEl, signalCustomUrl, waCustomUrl, customMsg);
  }

  // Populate categories
  const catSelect = document.getElementById("category");
  for (const c of uniqueCategories(CATALOG.items)) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  }

  // Wire controls
  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("category").addEventListener("change", applyFilters);
  document.getElementById("sort").addEventListener("change", applyFilters);

  applyFilters();

  // Helpful toast for desktop users
  if (!isMobileDevice()) {
    showToast("Tip: On desktop, Signal may copy the message and open WhatsApp as backup.", 2600);
  }
}

init().catch(err => {
  console.error(err);
  const status = document.getElementById("status");
  if (status) status.textContent = "Failed to load catalog.json. Check your file names and try again.";
});
