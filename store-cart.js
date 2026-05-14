/**
 * Side Table store cart (localStorage). Checkout is placeholder until Square links are wired.
 */
(function () {
  const STORAGE_KEY = "sideTableStoreCart";

  const CATALOG = {
    "gift-50": {
      name: "$50 gift card (pay $45 — 10% off)",
      priceCents: 4500,
      image: "./store-gift-card-50.png",
    },
    hat: {
      name: "Side Table Canvas Hat",
      priceCents: 2800,
      image: "https://picsum.photos/seed/sidetablehat/400/400.jpg",
    },
    coffee: {
      name: "House Blend Coffee (12 oz)",
      priceCents: 1800,
      image: "https://picsum.photos/seed/sidetablecoffee/400/400.jpg",
    },
    tea: {
      name: "Loose-Leaf Tea Canister",
      priceCents: 2200,
      image: "https://picsum.photos/seed/sidetabletea/400/400.jpg",
    },
  };

  const drawer = document.getElementById("storeCartDrawer");
  const toggle = document.getElementById("storeCartToggle");
  const badge = document.getElementById("storeCartBadge");
  const linesEl = document.getElementById("storeCartLines");
  const totalEl = document.getElementById("storeCartTotal");
  const closeBtn = document.getElementById("storeCartClose");
  const backdrop = document.getElementById("storeCartBackdrop");
  const checkoutBtn = document.getElementById("storeCheckoutBtn");

  if (!drawer || !linesEl || !totalEl) {
    return;
  }

  function isStorePage() {
    return /(?:^|\/)store\.html$/i.test(window.location.pathname);
  }

  function isDesktopWide() {
    return window.matchMedia("(min-width: 641px)").matches;
  }

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
      if (Object.prototype.hasOwnProperty.call(parsed, "gift-25")) {
        const legacy = parseInt(String(parsed["gift-25"]), 10) || 0;
        delete parsed["gift-25"];
        if (legacy > 0) {
          parsed["gift-50"] = (parseInt(String(parsed["gift-50"]), 10) || 0) + legacy;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      const out = {};
      Object.keys(parsed).forEach((id) => {
        if (!CATALOG[id]) return;
        const q = parseInt(String(parsed[id]), 10);
        if (q > 0) out[id] = q;
      });
      return out;
    } catch {
      return {};
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function setQty(id, qty) {
    const cart = loadCart();
    const q = Math.max(0, parseInt(String(qty), 10) || 0);
    if (q <= 0) delete cart[id];
    else cart[id] = q;
    saveCart(cart);
    render();
  }

  function addQty(id, delta) {
    const cart = loadCart();
    const cur = cart[id] || 0;
    const next = cur + delta;
    setQty(id, next);
  }

  function addToCart(id, qtyToAdd) {
    const add = Math.max(1, parseInt(String(qtyToAdd), 10) || 1);
    const cart = loadCart();
    cart[id] = (cart[id] || 0) + add;
    saveCart(cart);
    render();
    openDrawer();
  }

  function itemCount(cart) {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }

  function totalCents(cart) {
    return Object.entries(cart).reduce((sum, [id, q]) => {
      const p = CATALOG[id]?.priceCents || 0;
      return sum + p * q;
    }, 0);
  }

  function updateBadge(cart) {
    const n = itemCount(cart);
    const countLabel = n > 99 ? "99+" : String(n);
    if (badge) {
      badge.textContent = countLabel;
      badge.hidden = n === 0;
    }
    document.querySelectorAll(".site-nav-order-badge").forEach((el) => {
      el.textContent = countLabel;
      el.hidden = n === 0;
    });
    const cartAria = n ? `Shopping cart, ${countLabel} items` : "Shopping cart, empty";
    if (toggle) {
      toggle.setAttribute("aria-label", cartAria);
    }
    const orderItemPhrase = n === 1 ? "1 item" : `${countLabel} items`;
    const orderAria = n === 0 ? "Store, shopping cart empty" : `Store, ${orderItemPhrase} in cart`;
    document.querySelectorAll("a.site-nav-store, a.site-nav-order-now").forEach((el) => {
      el.setAttribute("aria-label", orderAria);
    });
  }

  function render() {
    const cart = loadCart();
    updateBadge(cart);

    linesEl.innerHTML = "";
    const ids = Object.keys(cart).filter((id) => cart[id] > 0);

    if (ids.length === 0) {
      const empty = document.createElement("li");
      empty.className = "store-cart-empty";
      empty.textContent = "Your cart is empty.";
      linesEl.appendChild(empty);
    } else {
      ids.forEach((id) => {
        const item = CATALOG[id];
        const qty = cart[id];
        const li = document.createElement("li");
        li.className = "store-cart-line";
        li.dataset.id = id;

        const thumb = document.createElement("img");
        thumb.className = "store-cart-line-img";
        thumb.src = item.image;
        thumb.alt = "";
        thumb.width = 56;
        thumb.height = 56;
        thumb.loading = "lazy";

        const mid = document.createElement("div");
        mid.className = "store-cart-line-mid";
        const title = document.createElement("div");
        title.className = "store-cart-line-title";
        title.textContent = item.name;

        const controls = document.createElement("div");
        controls.className = "store-cart-line-controls";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.className = "store-cart-qty-btn";
        minus.setAttribute("aria-label", "Decrease quantity");
        minus.textContent = "−";
        minus.addEventListener("click", () => addQty(id, -1));

        const qSpan = document.createElement("span");
        qSpan.className = "store-cart-qty-val";
        qSpan.textContent = String(qty);

        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "store-cart-qty-btn";
        plus.setAttribute("aria-label", "Increase quantity");
        plus.textContent = "+";
        plus.addEventListener("click", () => addQty(id, 1));

        controls.append(minus, qSpan, plus);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "store-cart-remove";
        remove.setAttribute("aria-label", "Remove " + item.name);
        remove.textContent = "×";
        remove.addEventListener("click", () => setQty(id, 0));

        mid.append(title, controls);

        const price = document.createElement("div");
        price.className = "store-cart-line-price";
        price.textContent = money.format((item.priceCents * qty) / 100);

        li.append(thumb, mid, price, remove);
        linesEl.appendChild(li);
      });
    }

    totalEl.textContent = money.format(totalCents(cart) / 100);
  }

  let previouslyFocused = null;

  function openDrawer() {
    previouslyFocused = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "true");
    }
    document.documentElement.classList.add("store-cart-open");
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    }
    document.documentElement.classList.remove("store-cart-open");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  }

  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "storeCartDrawer");
    toggle.addEventListener("click", () => {
      if (drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.site-nav-store, a.site-nav-order-now");
    if (!link) return;
    if (!isDesktopWide()) return;
    if (!isStorePage()) return;
    e.preventDefault();
    if (drawer.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  document.querySelectorAll("[data-store-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-store-add");
      const wrap = btn.closest("[data-store-product]");
      const sel = wrap ? wrap.querySelector("[data-store-qty]") : null;
      const qty = sel ? parseInt(String(sel.value), 10) || 1 : 1;
      if (id && CATALOG[id]) addToCart(id, qty);
    });
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = loadCart();
      const ids = Object.keys(cart).filter((id) => cart[id] > 0);
      if (ids.length === 0) {
        if (typeof showSideTableMessage === "function") {
          showSideTableMessage("Your cart is empty. Add something tasty first.");
        }
        return;
      }
      const total = money.format(totalCents(cart) / 100);
      const summary = ids
        .map((id) => `${cart[id]}× ${CATALOG[id].name}`)
        .join(" · ");
      const msg =
        "Total " +
        total +
        ": " +
        summary +
        ". <br /><br />Unfortunately, Online checkout is not live yet. Please email hello@sidetablecoffee.com to purchase.";
      if (typeof showSideTableMessage === "function") {
        showSideTableMessage(msg);
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      render();
    }
  });

  render();
})();
