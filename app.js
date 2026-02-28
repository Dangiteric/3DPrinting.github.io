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
    const msg =
`Hi! I'm interested in:
${item.name}

Desired size: ______
Color(s): ______
Quantity: ______
Pickup: ${seller.location}`;

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
          <a class="btn primary" href="${wa}" target="_blank" rel="noopener">
            Order (WhatsApp)
          </a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

function applyFilters() {
  const search = document.getElementById("search").value.toLowerCase();
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let items = [...CATALOG.items];

  if (category !== "all") {
    items = items.filter(i => i.category === category);
  }

  if (search) {
    items = items.filter(i =>
      `${i.name} ${i.description} ${(i.tags || []).join(" ")}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (sort === "featured") {
    items.sort((a, b) => (b.featured === true) - (a.featured === true));
  } else if (sort === "priceAsc") {
    items.sort((a, b) => (a.price || 9999) - (b.price || 9999));
  } else if (sort === "priceDesc") {
    items.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "nameAsc") {
    items.sort((a, b) => a.name.localeCompare(b.name));
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
    buildWhatsAppLink(seller.phoneE164, "Hi! I found a model online I’d like printed.");

  const catSelect = document.getElementById("category");
  for (const c of uniqueCategories(CATALOG.items)) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  }

  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("category").addEventListener("change", applyFilters);
  document.getElementById("sort").addEventListener("change", applyFilters);

  applyFilters();
}

init();
