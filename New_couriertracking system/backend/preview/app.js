(function previewApp() {
  const app = document.getElementById("app");
  const authStorageKey = "courierflow-preview-auth";
  const themeStorageKey = "courierflow-preview-theme";

  const initialAuth = (() => {
    try {
      return JSON.parse(localStorage.getItem(authStorageKey)) || { token: null, user: null };
    } catch (error) {
      return { token: null, user: null };
    }
  })();

  const state = {
    auth: initialAuth,
    theme: localStorage.getItem(themeStorageKey) || "light",
    route: getRoute(),
    authMode: "login",
    dashboardTab: "book",
    adminTab: "shipments",
    historyQuery: "",
    adminSearch: "",
    adminStatusFilter: "",
    loading: false,
    notice: null,
    tracking: {
      result: null,
      query: "",
      error: ""
    },
    dashboard: {
      shipments: [],
      loaded: false
    },
    admin: {
      metrics: null,
      shipments: [],
      users: [],
      loaded: false
    }
  };

  const statusClassMap = {
    "Order Placed": "status-order",
    "Picked Up": "status-picked",
    "In Transit": "status-transit",
    Delivered: "status-delivered"
  };

  document.body.classList.toggle("theme-dark", state.theme === "dark");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function formatCurrency(value) {
    return `Rs. ${Number(value || 0).toFixed(0)}`;
  }

  function getRoute() {
    const hash = window.location.hash.replace(/^#/, "") || "/";
    const cleaned = hash.startsWith("/") ? hash : `/${hash}`;

    if (cleaned.startsWith("/track/")) {
      return { path: cleaned, type: "track", trackingId: decodeURIComponent(cleaned.split("/")[2] || "") };
    }

    if (cleaned === "/track") {
      return { path: cleaned, type: "track", trackingId: "" };
    }

    if (cleaned === "/auth") {
      return { path: cleaned, type: "auth" };
    }

    if (cleaned === "/dashboard") {
      return { path: cleaned, type: "dashboard" };
    }

    if (cleaned === "/admin/login") {
      return { path: cleaned, type: "admin-login" };
    }

    if (cleaned === "/admin") {
      return { path: cleaned, type: "admin" };
    }

    return { path: "/", type: "home" };
  }

  function setRoute(path) {
    const nextPath = path.startsWith("/") ? path : `/${path}`;
    if (window.location.hash === `#${nextPath}`) {
      state.route = getRoute();
      render();
      ensureRouteData();
      return;
    }
    window.location.hash = nextPath;
  }

  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.auth !== false && state.auth.token
          ? { Authorization: `Bearer ${state.auth.token}` }
          : {})
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.errors?.[0]?.message || payload?.message || "Request failed.";
      throw new Error(message);
    }

    return payload;
  }

  function setNotice(type, text) {
    state.notice = text ? { type, text } : null;
    render();
  }

  function clearNotice() {
    state.notice = null;
  }

  function persistAuth(payload) {
    state.auth = {
      token: payload.token,
      user: payload.user
    };
    localStorage.setItem(authStorageKey, JSON.stringify(state.auth));
  }

  function clearAuth() {
    state.auth = { token: null, user: null };
    localStorage.removeItem(authStorageKey);
    state.dashboard = { shipments: [], loaded: false };
    state.admin = { metrics: null, shipments: [], users: [], loaded: false };
  }

  function toggleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    localStorage.setItem(themeStorageKey, state.theme);
    document.body.classList.toggle("theme-dark", state.theme === "dark");
    render();
  }

  function renderStatusBadge(status) {
    return `
      <span class="status-badge ${statusClassMap[status] || "status-transit"}">
        <span class="status-dot"></span>
        ${escapeHtml(status)}
      </span>
    `;
  }

  function renderNotice() {
    if (!state.notice) {
      return "";
    }

    return `<div class="notice ${state.notice.type}">${escapeHtml(state.notice.text)}</div>`;
  }

  function renderLayout(content) {
    const currentPath = state.route.type;
    const user = state.auth.user;

    return `
      <div class="site-shell">
        <header class="topbar">
          <div class="shell topbar-inner">
            <div class="brand">
              <a href="#/" class="brand">
                <div class="brand-mark">CF</div>
                <div>
                  <div class="brand-title">CourierFlow</div>
                  <div class="brand-subtitle">Smart Dispatch Network</div>
                </div>
              </a>
            </div>
            <nav class="nav-links">
              ${renderNavLink("/", "Home", currentPath === "home")}
              ${renderNavLink("/track", "Track", currentPath === "track")}
              ${
                user?.role === "user"
                  ? renderNavLink("/dashboard", "Dashboard", currentPath === "dashboard")
                  : ""
              }
              ${
                user?.role === "admin"
                  ? renderNavLink("/admin", "Admin", currentPath === "admin")
                  : ""
              }
            </nav>
            <div class="action-links">
              <button class="chip-button" id="theme-toggle" type="button">
                ${state.theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              ${
                user
                  ? `
                    <div class="chip-button">${escapeHtml(user.name)} · ${escapeHtml(user.role)}</div>
                    <a class="button-secondary" href="#/${user.role === "admin" ? "admin" : "dashboard"}">Console</a>
                    <button class="button-secondary" data-logout="true" type="button">Sign out</button>
                  `
                  : `
                    <a class="button-secondary" href="#/admin/login">Admin access</a>
                    <a class="button-primary" href="#/auth">Sign in</a>
                  `
              }
            </div>
          </div>
        </header>
        <main class="site-main">
          ${content}
        </main>
        <footer class="shell footer">
          CourierFlow preview is running from the local Express server, with booking, tracking, and admin tools in one place.
        </footer>
      </div>
    `;
  }

  function renderNavLink(path, label, isActive) {
    return `<a class="nav-link ${isActive ? "active" : ""}" href="#${path}">${label}</a>`;
  }

  function renderHomePage() {
    return `
      <section class="shell hero">
        <div class="hero-grid">
          <div class="stack">
            <div class="eyebrow">End-to-end courier operations</div>
            <h1 class="headline">Book faster, track cleaner, and keep every shipment visible.</h1>
            <p class="subcopy">
              CourierFlow brings customer booking, live delivery tracking, and operations control into one calm, modern workspace.
            </p>
            <form id="home-track-form" class="surface panel stack">
              <div class="split-actions">
                <div class="input-shell">
                  <input name="trackingId" placeholder="Enter tracking ID" />
                </div>
                <button class="button-primary" type="submit">Track now</button>
              </div>
            </form>
            ${renderNotice()}
            <div class="feature-grid">
              ${featureCard("Track every move", "Clear shipment milestones from booking to delivery.")}
              ${featureCard("Secure sign-in", "Separate customer and admin access with JWT-based sessions.")}
              ${featureCard("Dispatch with control", "Update statuses and manage users from one admin console.")}
            </div>
          </div>
          <div class="surface-strong panel stack">
            <div class="page-header">
              <div>
                <div class="muted">Dispatch snapshot</div>
                <h2 class="card-title">Today&apos;s movement</h2>
              </div>
              ${renderStatusBadge("In Transit")}
            </div>
            <div class="surface panel">
              <div class="muted">Priority lane</div>
              <h3 class="card-title" style="margin-top:10px;">Express deliveries</h3>
              <p class="subcopy" style="margin-top:12px; max-width:none;">
                Same booking flow, different service levels. Track high-priority deliveries without losing visibility on the rest.
              </p>
            </div>
            <div class="metric-grid" style="margin-top:0;">
              ${metricCard("Delivery types", "3")}
              ${metricCard("Tracking updates", "Live")}
              ${metricCard("Admin visibility", "Full")}
              ${metricCard("Booking flow", "Fast")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function featureCard(title, copy) {
    return `
      <div class="surface panel">
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <p class="subcopy" style="margin-top:10px; max-width:none;">${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function metricCard(label, value) {
    return `
      <div class="surface panel metric-card">
        <div class="value">${escapeHtml(value)}</div>
        <div class="muted" style="margin-top:8px;">${escapeHtml(label)}</div>
      </div>
    `;
  }

  function renderAuthPage() {
    const isRegister = state.authMode === "register";

    return `
      <section class="shell hero">
        <div class="two-column" style="grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);">
          <div class="surface-strong panel stack">
            <div class="eyebrow">Customer access</div>
            <h1 class="headline" style="font-size:clamp(2rem,3vw,3.5rem);">Track deliveries without losing the human feel.</h1>
            <p class="subcopy">
              Sign in to create shipments, review your order history, and jump from a tracking ID to a full timeline in seconds.
            </p>
          </div>
          <div class="surface panel">
            <div class="page-header">
              <div>
                <div class="muted">Account</div>
                <h2 class="card-title">${isRegister ? "Create your account" : "Welcome back"}</h2>
              </div>
              <div class="tabs">
                <button class="tab ${!isRegister ? "active" : ""}" data-auth-mode="login" type="button">Sign in</button>
                <button class="tab ${isRegister ? "active" : ""}" data-auth-mode="register" type="button">Sign up</button>
              </div>
            </div>
            <form id="auth-form" class="stack section-gap">
              ${
                isRegister
                  ? `
                    <label class="stack">
                      <span>Full name</span>
                      <div class="input-shell"><input name="name" required minlength="2" placeholder="John Doe" /></div>
                    </label>
                  `
                  : ""
              }
              <label class="stack">
                <span>Email address</span>
                <div class="input-shell"><input name="email" type="email" required placeholder="name@example.com" /></div>
              </label>
              <label class="stack">
                <span>Password</span>
                <div class="input-shell"><input name="password" type="password" required minlength="8" placeholder="Minimum 8 characters" /></div>
              </label>
              <button class="button-primary" type="submit">${isRegister ? "Create account" : "Sign in"}</button>
              ${renderNotice()}
            </form>
          </div>
        </div>
      </section>
    `;
  }

  function renderAdminLoginPage() {
    return `
      <section class="shell hero">
        <div class="two-column" style="grid-template-columns:minmax(0,0.9fr) minmax(0,1.1fr);">
          <div class="surface-strong panel stack">
            <div class="eyebrow">Operations control</div>
            <h1 class="headline" style="font-size:clamp(2rem,3vw,3.5rem);">Admin access for shipment visibility and user management.</h1>
            <p class="subcopy">
              Administrators sign in separately so delivery updates and account controls stay where they belong.
            </p>
          </div>
          <div class="surface panel">
            <div class="muted">Administrator sign-in</div>
            <h2 class="card-title" style="margin-top:8px;">Open the control panel</h2>
            <form id="admin-login-form" class="stack section-gap">
              <label class="stack">
                <span>Email address</span>
                <div class="input-shell"><input name="email" type="email" required placeholder="admin@courierflow.com" /></div>
              </label>
              <label class="stack">
                <span>Password</span>
                <div class="input-shell"><input name="password" type="password" required minlength="8" /></div>
              </label>
              <button class="button-primary" type="submit">Enter admin panel</button>
              ${renderNotice()}
            </form>
          </div>
        </div>
      </section>
    `;
  }

  function renderTrackingResult(shipment) {
    if (!shipment) {
      return "";
    }

    const history = [...shipment.statusHistory].reverse();

    return `
      <div class="two-column section-gap" style="grid-template-columns:minmax(0,0.92fr) minmax(0,1.08fr);">
        <div class="surface panel stack">
          <div class="page-header">
            <div>
              <div class="muted">Tracking ID</div>
              <h2 class="card-title">${escapeHtml(shipment.trackingId)}</h2>
            </div>
            ${renderStatusBadge(shipment.status)}
          </div>
          <div class="detail-grid">
            ${detailItem("Delivery type", shipment.deliveryType)}
            ${detailItem("Package weight", `${shipment.packageWeight} kg`)}
            ${detailItem("Estimated delivery", formatDate(shipment.estimatedDelivery))}
            ${detailItem("Booked on", formatDate(shipment.createdAt))}
          </div>
          <div class="field-grid">
            ${addressCard("Sender", shipment.sender)}
            ${addressCard("Receiver", shipment.receiver)}
          </div>
        </div>
        <div class="surface panel">
          <div class="muted">Delivery timeline</div>
          <h2 class="card-title" style="margin-top:8px;">Status history</h2>
          <div class="timeline section-gap">
            ${history.map((entry, index) => timelineItem(entry, index !== history.length - 1)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function detailItem(label, value) {
    return `
      <div class="surface panel">
        <div class="muted">${escapeHtml(label)}</div>
        <div style="margin-top:10px; font-weight:700;">${escapeHtml(value)}</div>
      </div>
    `;
  }

  function addressCard(label, person) {
    return `
      <div class="surface-strong panel">
        <div class="muted">${escapeHtml(label)}</div>
        <h3 class="card-title" style="margin-top:8px;">${escapeHtml(person.name)}</h3>
        <p class="subcopy" style="margin-top:10px; max-width:none;">${escapeHtml(person.address)}</p>
      </div>
    `;
  }

  function timelineItem(entry, hasLine) {
    return `
      <div class="timeline-item">
        <div class="timeline-line">
          <span class="node"></span>
          ${hasLine ? '<span class="line"></span>' : ""}
        </div>
        <div>
          ${renderStatusBadge(entry.status)}
          <div class="muted" style="margin-top:8px;">${escapeHtml(formatDate(entry.timestamp))}</div>
          <div style="margin-top:8px;">${escapeHtml(entry.message)}</div>
          <div class="muted" style="margin-top:6px; text-transform:uppercase; letter-spacing:0.14em; font-size:0.74rem;">
            ${escapeHtml(entry.location || "Origin Hub")}
          </div>
        </div>
      </div>
    `;
  }

  function renderTrackPage() {
    return `
      <section class="shell hero">
        <div class="stack">
          <div class="eyebrow">Public shipment tracking</div>
          <h1 class="headline" style="font-size:clamp(2.1rem,3.2vw,3.8rem);">Find the latest shipment status in seconds.</h1>
          <p class="subcopy">
            Enter a tracking ID to see where the package is, what happened last, and when it is expected to arrive.
          </p>
          <form id="track-form" class="surface panel stack">
            <div class="split-actions">
              <div class="input-shell">
                <input
                  name="trackingId"
                  value="${escapeHtml(state.route.trackingId || state.tracking.query)}"
                  placeholder="Search by tracking ID"
                />
              </div>
              <button class="button-primary" type="submit">${state.loading ? "Checking..." : "Track shipment"}</button>
            </div>
          </form>
          ${
            state.tracking.error
              ? `<div class="notice error">${escapeHtml(state.tracking.error)}</div>`
              : renderNotice()
          }
          ${state.loading ? renderLoader("Fetching shipment details...") : renderTrackingResult(state.tracking.result)}
        </div>
      </section>
    `;
  }

  function renderLoader(label) {
    return `
      <div class="loader-box">
        <div class="surface panel center">
          <div class="muted">${escapeHtml(label)}</div>
        </div>
      </div>
    `;
  }

  function renderUserDashboard() {
    if (!state.auth.user) {
      return renderLockedPage("Please sign in to open your dashboard.", "/auth", "Go to sign in");
    }

    const shipments = [...state.dashboard.shipments];
    const filteredShipments = shipments.filter((shipment) => {
      if (!state.historyQuery.trim()) {
        return true;
      }
      const query = state.historyQuery.trim().toLowerCase();
      return (
        shipment.trackingId.toLowerCase().includes(query) ||
        shipment.sender.name.toLowerCase().includes(query) ||
        shipment.receiver.name.toLowerCase().includes(query)
      );
    });

    const activeCount = shipments.filter((shipment) => shipment.status !== "Delivered").length;
    const deliveredCount = shipments.filter((shipment) => shipment.status === "Delivered").length;

    return `
      <section class="shell hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Customer dashboard</div>
            <h1 class="headline" style="font-size:clamp(2.1rem,3vw,3.6rem);">Welcome, ${escapeHtml(state.auth.user.name)}.</h1>
            <p class="subcopy">
              Create new shipments, keep an eye on delivery progress, and revisit every tracking ID from one place.
            </p>
          </div>
          <div class="tabs">
            <button class="tab ${state.dashboardTab === "book" ? "active" : ""}" data-dashboard-tab="book" type="button">Book courier</button>
            <button class="tab ${state.dashboardTab === "history" ? "active" : ""}" data-dashboard-tab="history" type="button">Order history</button>
          </div>
        </div>
        <div class="metric-grid">
          ${metricCard("Total bookings", String(shipments.length))}
          ${metricCard("Active shipments", String(activeCount))}
          ${metricCard("Delivered", String(deliveredCount))}
          ${metricCard("Tracking IDs", shipments.length ? "Ready" : "Waiting")}
        </div>
        ${renderNotice()}
        ${
          state.dashboardTab === "book"
            ? renderBookingForm()
            : renderHistoryPanel(filteredShipments)
        }
      </section>
    `;
  }

  function renderBookingForm() {
    return `
      <form id="booking-form" class="surface panel section-gap stack">
        <div class="page-header">
          <div>
            <div class="muted">New booking</div>
            <h2 class="card-title">Create a shipment</h2>
          </div>
          <div class="chip-button">Tracking ID auto-generated</div>
        </div>
        <div class="form-grid">
          <div class="stack">
            <h3 class="card-title">Sender details</h3>
            ${renderPartyFields("sender")}
          </div>
          <div class="stack">
            <h3 class="card-title">Receiver details</h3>
            ${renderPartyFields("receiver")}
          </div>
        </div>
        <div class="form-grid">
          <label class="stack">
            <span>Package weight (kg)</span>
            <div class="input-shell"><input name="packageWeight" type="number" min="0.1" step="0.1" required /></div>
          </label>
          <label class="stack">
            <span>Delivery type</span>
            <div class="select-shell">
              <select name="deliveryType">
                <option>Express</option>
                <option>Standard</option>
                <option>Economy</option>
              </select>
            </div>
          </label>
        </div>
        <div class="card-actions">
          <button class="button-primary" type="submit">Create shipment</button>
        </div>
      </form>
    `;
  }

  function renderPartyFields(prefix) {
    return `
      <label class="stack">
        <span>${capitalize(prefix)} name</span>
        <div class="input-shell"><input name="${prefix}Name" required /></div>
      </label>
      <label class="stack">
        <span>Phone number</span>
        <div class="input-shell"><input name="${prefix}Phone" required /></div>
      </label>
      <label class="stack">
        <span>Email address</span>
        <div class="input-shell"><input name="${prefix}Email" type="email" placeholder="optional@example.com" /></div>
      </label>
      <label class="stack">
        <span>${prefix === "sender" ? "Pickup" : "Delivery"} address</span>
        <div class="textarea-shell"><textarea name="${prefix}Address" required></textarea></div>
      </label>
    `;
  }

  function renderHistoryPanel(shipments) {
    return `
      <div class="section-gap stack">
        <div class="surface panel page-header">
          <div>
            <div class="muted">Shipment records</div>
            <h2 class="card-title">Order history</h2>
          </div>
          <div class="input-shell" style="max-width:340px; width:100%;">
            <input id="history-search" value="${escapeHtml(state.historyQuery)}" placeholder="Search by tracking ID or name" />
          </div>
        </div>
        ${
          shipments.length
            ? `<div class="list-stack">${shipments.map(renderShipmentCard).join("")}</div>`
            : renderEmptyState("No shipments match this search", "Create your first courier booking or change the search text to see your delivery history.")
        }
      </div>
    `;
  }

  function renderShipmentCard(shipment) {
    return `
      <div class="surface shipment-card">
        <div class="shipment-header">
          <div>
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h3 class="card-title">${escapeHtml(shipment.trackingId)}</h3>
              ${renderStatusBadge(shipment.status)}
            </div>
            <div class="muted" style="margin-top:10px;">${escapeHtml(shipment.sender.name)} to ${escapeHtml(shipment.receiver.name)}</div>
            <div class="muted" style="margin-top:6px;">${escapeHtml(shipment.deliveryType)} service, ${escapeHtml(shipment.packageWeight)} kg, booked on ${escapeHtml(formatDate(shipment.createdAt))}</div>
          </div>
          <div class="card-actions">
            <a class="button-secondary" href="#/track/${encodeURIComponent(shipment.trackingId)}">Track shipment</a>
            <div class="chip-button">${escapeHtml(formatCurrency(shipment.price))}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminDashboard() {
    if (!state.auth.user || state.auth.user.role !== "admin") {
      return renderLockedPage("Please use the admin login to open the control panel.", "/admin/login", "Go to admin login");
    }

    const metrics = state.admin.metrics || {
      totalShipments: 0,
      activeShipments: 0,
      deliveredShipments: 0,
      totalUsers: 0
    };

    const filteredShipments = state.admin.shipments.filter((shipment) => {
      const matchesStatus = state.adminStatusFilter ? shipment.status === state.adminStatusFilter : true;
      if (!matchesStatus) {
        return false;
      }
      if (!state.adminSearch.trim()) {
        return true;
      }
      const query = state.adminSearch.trim().toLowerCase();
      return (
        shipment.trackingId.toLowerCase().includes(query) ||
        shipment.sender.name.toLowerCase().includes(query) ||
        shipment.receiver.name.toLowerCase().includes(query)
      );
    });

    return `
      <section class="shell hero">
        <div class="page-header">
          <div>
            <div class="eyebrow">Admin console</div>
            <h1 class="headline" style="font-size:clamp(2.1rem,3vw,3.6rem);">Operations control room.</h1>
            <p class="subcopy">
              Review shipments, update delivery milestones, and manage user access without leaving the dashboard.
            </p>
          </div>
          <div class="tabs">
            <button class="tab ${state.adminTab === "shipments" ? "active" : ""}" data-admin-tab="shipments" type="button">Shipments</button>
            <button class="tab ${state.adminTab === "users" ? "active" : ""}" data-admin-tab="users" type="button">Users</button>
          </div>
        </div>
        <div class="metric-grid">
          ${metricCard("Total shipments", String(metrics.totalShipments))}
          ${metricCard("Active shipments", String(metrics.activeShipments))}
          ${metricCard("Delivered", String(metrics.deliveredShipments))}
          ${metricCard("Users", String(metrics.totalUsers))}
        </div>
        ${renderNotice()}
        ${
          state.adminTab === "shipments"
            ? renderAdminShipments(filteredShipments)
            : renderAdminUsers(state.admin.users)
        }
      </section>
    `;
  }

  function renderAdminShipments(shipments) {
    return `
      <div class="section-gap stack">
        <div class="surface panel page-header">
          <div>
            <div class="muted">Shipment operations</div>
            <h2 class="card-title">Monitor every courier</h2>
          </div>
          <div class="toolbar" style="grid-template-columns:minmax(0,1fr) 220px;">
            <div class="input-shell">
              <input id="admin-search" value="${escapeHtml(state.adminSearch)}" placeholder="Search shipments" />
            </div>
            <div class="select-shell">
              <select id="admin-status-filter">
                <option value="">All statuses</option>
                ${["Order Placed", "Picked Up", "In Transit", "Delivered"]
                  .map(
                    (status) =>
                      `<option value="${status}" ${state.adminStatusFilter === status ? "selected" : ""}>${status}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
        </div>
        ${
          shipments.length
            ? `<div class="list-stack">${shipments.map(renderAdminShipmentCard).join("")}</div>`
            : renderEmptyState("No shipments found", "Try another search or status filter to view matching courier records.")
        }
      </div>
    `;
  }

  function renderAdminShipmentCard(shipment) {
    return `
      <div class="surface shipment-card">
        <div class="shipment-header">
          <div>
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h3 class="card-title">${escapeHtml(shipment.trackingId)}</h3>
              ${renderStatusBadge(shipment.status)}
            </div>
            <div class="muted" style="margin-top:10px;">${escapeHtml(shipment.sender.name)} to ${escapeHtml(shipment.receiver.name)}</div>
            <div class="muted" style="margin-top:6px;">
              ${escapeHtml(shipment.deliveryType)} service, booked by ${escapeHtml(shipment.user?.name || "Unknown user")} on ${escapeHtml(formatDate(shipment.createdAt))}
            </div>
          </div>
          <div class="toolbar" style="grid-template-columns:120px 220px;">
            <div class="chip-button">${escapeHtml(formatCurrency(shipment.price))}</div>
            <div class="select-shell">
              <select data-shipment-status="${escapeHtml(shipment._id)}">
                ${["Order Placed", "Picked Up", "In Transit", "Delivered"]
                  .map(
                    (status) =>
                      `<option value="${status}" ${shipment.status === status ? "selected" : ""}>${status}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminUsers(users) {
    return `
      <div class="section-gap list-stack">
        ${
          users.length
            ? users.map(renderAdminUserCard).join("")
            : renderEmptyState("No users available", "Once people create accounts, you will be able to review and manage them here.")
        }
      </div>
    `;
  }

  function renderAdminUserCard(user) {
    return `
      <div class="surface user-card">
        <div class="user-header">
          <div>
            <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <h3 class="card-title">${escapeHtml(user.name)}</h3>
              <span class="chip-button">${escapeHtml(user.role)}</span>
              <span class="chip-button">${user.isActive ? "Active" : "Disabled"}</span>
            </div>
            <div class="muted" style="margin-top:10px;">${escapeHtml(user.email)}</div>
            <div class="muted" style="margin-top:6px;">${escapeHtml(String(user.totalShipments))} shipment(s) created</div>
          </div>
          <div class="toolbar" style="grid-template-columns:160px auto;">
            <div class="select-shell">
              <select data-user-role="${escapeHtml(user._id)}">
                <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
                <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
              </select>
            </div>
            <button class="button-secondary" data-toggle-user="${escapeHtml(user._id)}" type="button">
              ${user.isActive ? "Disable user" : "Enable user"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderLockedPage(copy, href, actionLabel) {
    return `
      <section class="shell hero">
        <div class="surface empty-state">
          <div class="eyebrow">Access needed</div>
          <h2 class="card-title" style="margin-top:18px;">${escapeHtml(copy)}</h2>
          <div style="margin-top:18px;">
            <a class="button-primary" href="#${href}">${escapeHtml(actionLabel)}</a>
          </div>
        </div>
      </section>
    `;
  }

  function renderEmptyState(title, copy) {
    return `
      <div class="surface empty-state">
        <div class="eyebrow">No data yet</div>
        <h3 class="card-title" style="margin-top:18px;">${escapeHtml(title)}</h3>
        <p class="subcopy" style="margin:14px auto 0;">${escapeHtml(copy)}</p>
      </div>
    `;
  }

  function render() {
    let content = renderHomePage();

    if (state.route.type === "auth") {
      content = renderAuthPage();
    } else if (state.route.type === "admin-login") {
      content = renderAdminLoginPage();
    } else if (state.route.type === "track") {
      content = renderTrackPage();
    } else if (state.route.type === "dashboard") {
      content = renderUserDashboard();
    } else if (state.route.type === "admin") {
      content = renderAdminDashboard();
    }

    app.innerHTML = renderLayout(content);
  }

  function readForm(eventTarget) {
    return Object.fromEntries(new FormData(eventTarget).entries());
  }

  async function bootstrapAuth() {
    if (!state.auth.token) {
      return;
    }

    try {
      const response = await apiRequest("/api/auth/me");
      state.auth.user = response.user;
      localStorage.setItem(authStorageKey, JSON.stringify(state.auth));
    } catch (error) {
      clearAuth();
    }
  }

  async function ensureRouteData() {
    if (state.route.type === "track" && state.route.trackingId) {
      await loadTracking(state.route.trackingId);
      return;
    }

    if (state.route.type === "dashboard" && state.auth.user?.role === "user" && !state.dashboard.loaded) {
      await loadDashboardShipments();
      return;
    }

    if (state.route.type === "admin" && state.auth.user?.role === "admin" && !state.admin.loaded) {
      await loadAdminData();
    }
  }

  async function loadTracking(trackingId) {
    state.loading = true;
    state.tracking.error = "";
    state.tracking.query = trackingId;
    render();

    try {
      const response = await apiRequest(`/api/shipments/track/${encodeURIComponent(trackingId)}`, {
        auth: false
      });
      state.tracking.result = response.shipment;
    } catch (error) {
      state.tracking.result = null;
      state.tracking.error = error.message;
    } finally {
      state.loading = false;
      render();
    }
  }

  async function loadDashboardShipments() {
    state.loading = true;
    render();

    try {
      const response = await apiRequest("/api/shipments/mine");
      state.dashboard.shipments = response.shipments;
      state.dashboard.loaded = true;
    } catch (error) {
      setNotice("error", error.message);
    } finally {
      state.loading = false;
      render();
    }
  }

  async function loadAdminData() {
    state.loading = true;
    render();

    try {
      const [dashboardResponse, shipmentsResponse, usersResponse] = await Promise.all([
        apiRequest("/api/admin/dashboard"),
        apiRequest("/api/admin/shipments"),
        apiRequest("/api/admin/users")
      ]);
      state.admin.metrics = dashboardResponse.metrics;
      state.admin.shipments = shipmentsResponse.shipments;
      state.admin.users = usersResponse.users;
      state.admin.loaded = true;
    } catch (error) {
      setNotice("error", error.message);
    } finally {
      state.loading = false;
      render();
    }
  }

  async function handleAuthSubmit(form) {
    clearNotice();
    try {
      const values = readForm(form);
      const response =
        state.authMode === "register"
          ? await apiRequest("/api/auth/register", {
              method: "POST",
              auth: false,
              body: {
                name: values.name,
                email: values.email,
                password: values.password
              }
            })
          : await apiRequest("/api/auth/login", {
              method: "POST",
              auth: false,
              body: {
                email: values.email,
                password: values.password
              }
            });

      persistAuth(response);
      state.dashboard.loaded = false;
      setRoute("/dashboard");
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  async function handleAdminLogin(form) {
    clearNotice();
    try {
      const values = readForm(form);
      const response = await apiRequest("/api/auth/admin/login", {
        method: "POST",
        auth: false,
        body: {
          email: values.email,
          password: values.password
        }
      });
      persistAuth(response);
      state.admin.loaded = false;
      setRoute("/admin");
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  async function handleBookingSubmit(form) {
    clearNotice();
    try {
      const values = readForm(form);
      const response = await apiRequest("/api/shipments", {
        method: "POST",
        body: {
          sender: {
            name: values.senderName,
            phone: values.senderPhone,
            email: values.senderEmail,
            address: values.senderAddress
          },
          receiver: {
            name: values.receiverName,
            phone: values.receiverPhone,
            email: values.receiverEmail,
            address: values.receiverAddress
          },
          packageWeight: Number(values.packageWeight),
          deliveryType: values.deliveryType
        }
      });

      state.dashboard.shipments.unshift(response.shipment);
      state.dashboard.loaded = true;
      state.dashboardTab = "history";
      setNotice("success", `Shipment booked successfully. Tracking ID: ${response.shipment.trackingId}`);
      render();
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  async function handleShipmentStatusUpdate(shipmentId, status) {
    clearNotice();
    try {
      await apiRequest(`/api/admin/shipments/${shipmentId}/status`, {
        method: "PATCH",
        body: {
          status,
          message: `Shipment marked as ${status}.`,
          location: status === "Delivered" ? "Destination Hub" : "Dispatch Network"
        }
      });
      await loadAdminData();
      setNotice("success", "Shipment status updated successfully.");
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  async function handleUserRoleUpdate(userId, role) {
    clearNotice();
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: { role }
      });
      await loadAdminData();
      setNotice("success", "User updated successfully.");
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  async function handleUserToggle(userId) {
    const user = state.admin.users.find((record) => record._id === userId);
    if (!user) {
      return;
    }

    clearNotice();
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: {
          isActive: !user.isActive
        }
      });
      await loadAdminData();
      setNotice("success", "User updated successfully.");
    } catch (error) {
      setNotice("error", error.message);
    }
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  window.addEventListener("hashchange", async () => {
    state.route = getRoute();
    if (state.route.type !== "track") {
      state.tracking.error = "";
    }
    render();
    await ensureRouteData();
  });

  document.addEventListener("click", async (event) => {
    const themeToggle = event.target.closest("#theme-toggle");
    if (themeToggle) {
      toggleTheme();
      return;
    }

    const logoutButton = event.target.closest("[data-logout]");
    if (logoutButton) {
      clearAuth();
      clearNotice();
      setRoute("/");
      return;
    }

    const authModeButton = event.target.closest("[data-auth-mode]");
    if (authModeButton) {
      state.authMode = authModeButton.getAttribute("data-auth-mode");
      clearNotice();
      render();
      return;
    }

    const dashboardTabButton = event.target.closest("[data-dashboard-tab]");
    if (dashboardTabButton) {
      state.dashboardTab = dashboardTabButton.getAttribute("data-dashboard-tab");
      render();
      return;
    }

    const adminTabButton = event.target.closest("[data-admin-tab]");
    if (adminTabButton) {
      state.adminTab = adminTabButton.getAttribute("data-admin-tab");
      render();
      return;
    }

    const userToggleButton = event.target.closest("[data-toggle-user]");
    if (userToggleButton) {
      await handleUserToggle(userToggleButton.getAttribute("data-toggle-user"));
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "history-search") {
      state.historyQuery = event.target.value;
      render();
    }

    if (event.target.id === "admin-search") {
      state.adminSearch = event.target.value;
      render();
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.id === "admin-status-filter") {
      state.adminStatusFilter = event.target.value;
      render();
      return;
    }

    if (event.target.hasAttribute("data-shipment-status")) {
      await handleShipmentStatusUpdate(
        event.target.getAttribute("data-shipment-status"),
        event.target.value
      );
      return;
    }

    if (event.target.hasAttribute("data-user-role")) {
      await handleUserRoleUpdate(event.target.getAttribute("data-user-role"), event.target.value);
    }
  });

  document.addEventListener("submit", async (event) => {
    if (event.target.id === "home-track-form" || event.target.id === "track-form") {
      event.preventDefault();
      const values = readForm(event.target);
      const trackingId = (values.trackingId || "").trim().toUpperCase();
      if (!trackingId) {
        setNotice("error", "Please enter a tracking ID.");
        return;
      }
      clearNotice();
      setRoute(`/track/${encodeURIComponent(trackingId)}`);
      return;
    }

    if (event.target.id === "auth-form") {
      event.preventDefault();
      await handleAuthSubmit(event.target);
      return;
    }

    if (event.target.id === "admin-login-form") {
      event.preventDefault();
      await handleAdminLogin(event.target);
      return;
    }

    if (event.target.id === "booking-form") {
      event.preventDefault();
      await handleBookingSubmit(event.target);
    }
  });

  (async function boot() {
    render();
    await bootstrapAuth();
    render();
    await ensureRouteData();
  })();
})();

