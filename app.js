let CATALOG = null;

function buildWhatsAppLink(phone, message) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function buildTelLink(phone) {
  return `tel:${phone}`;
}

function money(price) {
  if (!price || price === 0) return "Quote";
  return `$${price}`;
}

function uniqueCategories(items) {
  return [...new Set(items.map(i => i.category).filter(Boolean))].sort((a,b) => a.localeCompare(b));
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildOrderMessage(item, seller, selections = {}) {
  const lines = [];
  lines.push(`Hi! I'm interested in:`);
  lines.push(`${item.name}`);
  lines.push("");

  if (item.options && typeof item.options === "object") {
    lines.push("Selections:");
    for (const key of Object.keys(item.options)) {
      const chosen = selections[key] || "";
      lines.push(`- ${key}: ${chosen || "______"}`);
    }
    lines.push("");
  }

  lines.push(`Desired size: ______`);
  lines.push(`Color(s): ______`);
  lines.push(`Quantity: ______`);
  lines.push(`Pickup: ${seller.location}`);
  return lines.join("\n");
}

function renderThumbImages(item) {
  const imgs = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);

  if (!imgs.length) return `<div class="imgFallback">No image</div>`;

  if (imgs.length === 1) {
    return `<img src="${imgs[0]}" alt="${item.name}" loading="lazy">`;
  }

  return `
    <div class="carousel" aria-label="Images for ${item.name}">
      ${imgs.map((src, idx) =>
        `<img src="${src}" alt="${item.name} image ${idx + 1}" loading="lazy">`
      ).join("")}
    </div>
  `;
}

function renderItems(items, seller) {
  const grid = document.getElementById("grid");
  const status = document.getElementById("status");
  grid.innerHTML = "";

  status.textContent = `${items.length} item(s) • ${seller.location} • Typical lead time: ${seller.leadTime}`;

  for (const item of items) {
    const badgeText = item.featured ? "Popular" : (item.category || "Item");
    const imageHtml = renderThumbImages(item);

    const card = document.createElement("article");
    card.className = "card";

    // Build option selects (if any)
    let optionsHtml = "";
    if (item.options && typeof item.options === "object") {
      const optionKeys = Object.keys(item.options);
      if (optionKeys.length) {
        optionsHtml += `<div class="optionsWrap">`;
        for (const key of optionKeys) {
          const id = `opt-${slugify(item.id)}-${slugify(key)}`;
          const values = Array.isArray(item.options[key]) ? item.options[key] : [];
          optionsHtml += `
            <label class="optLabel" for="${id}">${key}</label>
            <select class="optSelect" id="${id}" data-itemid="${item.id}" data-optkey="${key}">
              <option value="">Choose ${key}…</option>
              ${values.map(v => `<option value="${String(v).replace(/"/g, "&quot;")}">${v}</option>`).join("")}
            </select>
          `;
        }
        optionsHtml += `</div>`;
      }
    }

    const initialMsg = buildOrderMessage(item, seller, {});
    const initialWa = buildWhatsAppLink(seller.phoneE164, initialMsg);

    card.innerHTML = `
      <div class="thumb">
        ${imageHtml}
        <span class="badge">${badgeText}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${item.name}</div>
          <div class="price">${money(item.price)}</div>
        </div>

        <div class="desc">${item.description || ""}</div>

        ${optionsHtml}

        <div class="actions">
          <a class="btn primary" data-orderbtn="1" href="${initialWa}" target="_blank" rel="noopener">
            Order (WhatsApp)
          </a>
        </div>
      </div>
    `;

    // If item has options, wire up select(s)
    if (item.options && typeof item.options === "object") {
      const orderBtn = card.querySelector('[data-orderbtn="1"]');
      const selects = card.querySelectorAll(".optSelect");
      const selections = {}; // key -> value

      function refreshOrderLink() {
        selects.forEach(sel => {
          const key = sel.getAttribute("data-optkey");
          selections[key] = sel.value;
        });

        const msg = buildOrderMessage(item, seller, selections);
        orderBtn.href = buildWhatsAppLink(seller.phoneE164, msg);

        const allChosen = Object.keys(item.options).every(k => (selections[k] || "").trim().length > 0);
        if (!allChosen) orderBtn.classList.add("disabled");
        else orderBtn.classList.remove("disabled");
      }

      selects.forEach(sel => sel.addEventListener("change", refreshOrderLink));
      refreshOrderLink();
    }

    grid.appendChild(card);
  }
}

function applyFilters() {
  const search = (document.getElementById("search").value || "").toLowerCase().trim();
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let items = [...CATALOG.items];

  if (category !== "all") items = items.filter(i => i.category === category);

  if (search) {
    items = items.filter(i => {
      const optionText = i.options ? Object.values(i.options).flat().join(" ") : "";
      const hay = [
        i.name, i.category, i.description,
        ...(i.tags || []),
        i.material, i.size, i.id,
        optionText
      ].join(" ").toLowerCase();
      return hay.includes(search);
    });
  }

  if (sort === "featured") {
    items.sort((a,b) => (b.featured === true) - (a.featured === true));
  } else if (sort === "priceAsc") {
    items.sort((a,b) => (a.price || 9999) - (b.price || 9999));
  } else if (sort === "priceDesc") {
    items.sort((a,b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "nameAsc") {
    items.sort((a,b) => (a.name || "").localeCompare(b.name || ""));
  }

  renderItems(items, CATALOG.seller);
}

async function init() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  CATALOG = await res.json();

  const seller = CATALOG.seller;

  document.getElementById("waGeneral").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I'm browsing your 3D print catalog.");
  document.getElementById("callGeneral").href =
    buildTelLink(seller.phoneE164);
  document.getElementById("waCustom").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I’d like a custom 3D print quote.");
  document.getElementById("waFromLink").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I found a model online I’d like printed. Link: ______");

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
}

init().catch(err => {
  console.error(err);
  const status = document.getElementById("status");
  if (status) status.textContent = "Failed to load catalog.json. Check JSON formatting and file names.";
});
