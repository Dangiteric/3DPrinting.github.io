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
  return [...new Set(items.map(i => i.category))];
}

function renderItems(items, seller) {
  const grid = document.getElementById("grid");
  const status = document.getElementById("status");
  grid.innerHTML = "";

  status.textContent = `${items.length} item(s) • ${seller.location} • Lead time ${seller.leadTime}`;

  for (const item of items) {
    const msg = `Hi! I'm interested in:\n${item.name}\nPickup: ${seller.location}`;
    const wa = buildWhatsAppLink(seller.phoneE164, msg);

    const imageHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" loading="lazy">`
      : `<div class="imgFallback">No image</div>`;

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        ${imageHtml}
        <span class="badge">${item.category}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${item.name}</div>
          <div class="price">${money(item.price)}</div>
        </div>
        <div class="desc">${item.description}</div>
        <div class="actions">
          <a class="btn primary" href="${wa}" target="_blank">Order (WhatsApp)</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

function renderPicks(picks, seller) {
  const grid = document.getElementById("picksGrid");
  grid.innerHTML = "";

  for (const p of picks) {
    const msg =
`Hi! I'd like this model:
${p.name}
${p.url}

Desired size: ______
Color(s): ______
Quantity: ______
Pickup: ${seller.location}`;

    const wa = buildWhatsAppLink(seller.phoneE164, msg);

    const imageHtml = p.image
      ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
      : `<div class="imgFallback">No image</div>`;

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        ${imageHtml}
        <span class="badge">${p.source}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${p.name}</div>
          <div class="price">Pick</div>
        </div>
        <div class="desc">${p.notes || ""}</div>
        <div class="actions">
          <a class="btn" href="${p.url}" target="_blank" rel="noopener">Open Model</a>
          <a class="btn primary" href="${wa}" target="_blank" rel="noopener">Request</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

async function init() {
  const res = await fetch("catalog.json");
  CATALOG = await res.json();

  const seller = CATALOG.seller;

  document.getElementById("waGeneral").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I’m browsing your 3D print catalog.");
  document.getElementById("callGeneral").href =
    buildTelLink(seller.phoneE164);
  document.getElementById("waCustom").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I’d like a custom 3D print quote.");
  document.getElementById("waFromLink").href =
    buildWhatsAppLink(seller.phoneE164, "Hi! I found a model online I’d like printed.");

  const catSelect = document.getElementById("category");
  for (const c of uniqueCategories(CATALOG.items)) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  }

  renderItems(CATALOG.items, seller);
  renderPicks(CATALOG.community_picks || [], seller);
}

init();
