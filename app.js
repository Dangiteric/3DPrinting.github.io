let CATALOG = null;

function buildSmsLink(phoneE164, message) {
  const body = encodeURIComponent(message);
  // iOS/Android behave slightly differently; this format usually works well.
  return `sms:${phoneE164}?&body=${body}`;
}

function buildTelLink(phoneE164) {
  return `tel:${phoneE164}`;
}

function money(price) {
  if (!price || price === 0) return "Quote";
  return `$${price.toFixed(0)}`;
}

function uniqueCategories(items) {
  const set = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

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

    const sms = buildSmsLink(seller.phoneE164, msg);

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
          <a class="btn primary" href="${sms}">Text to Order</a>
          <a class="btn" href="#" data-copy="${item.id}">Copy Item ID</a>
        </div>
      </div>
    `;

    card.querySelector("[data-copy]").addEventListener("click", (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(item.id).then(() => {
        e.target.textContent = "Copied!";
        setTimeout(() => (e.target.textContent = "Copy Item ID"), 900);
      });
    });

    grid.appendChild(card);
  }
}

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
    items.sort((a,b) => (b.featured === true) - (a.featured === true));
  } else if (sort === "priceAsc") {
    items.sort((a,b) => (a.price || 999999) - (b.price || 999999));
  } else if (sort === "priceDesc") {
    items.sort((a,b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "nameAsc") {
    items.sort((a,b) => (a.name || "").localeCompare(b.name || ""));
  }

  render(items, CATALOG.seller);
}

async function init() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  CATALOG = await res.json();

  // Set header buttons
  const generalMsg =
`Hi! I’m looking at your 3D print catalog.
I want to ask about: ______
Pickup: ${CATALOG.seller.location}`;

  document.getElementById("textGeneral").href = buildSmsLink(CATALOG.seller.phoneE164, generalMsg);
  document.getElementById("callGeneral").href = buildTelLink(CATALOG.seller.phoneE164);
  document.getElementById("textCustom").href = buildSmsLink(CATALOG.seller.phoneE164, "Hi! I want a custom 3D print quote. I’m looking for: ______");

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
  document.getElementById("status").textContent = "Failed to load catalog.json. Check your file names and try again.";
});
