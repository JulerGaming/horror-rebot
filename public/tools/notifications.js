(() => {
  const DEFAULT_TIMEOUT_MS = 3200;
  const MAX_VISIBLE = 3;

  /** @type {HTMLElement | null} */
  let container = null;

  /** @type {Map<string, { el: HTMLElement, timeoutId: number | null, startedAt: number, remainingMs: number | null }>} */
  const live = new Map();

  function ensureContainer() {
    if (container) return container;
    container = document.createElement("div");
    container.className = "hr-toast-container";
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-relevant", "additions text");
    document.body.appendChild(container);
    return container;
  }

  function makeId() {
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function iconSvg(type) {
    // Inline SVG so we don't depend on any icon set.
    const common = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    if (type === "success") {
      return `<svg class="hr-toast__icon" viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M20 6 9 17l-5-5"/></svg>`;
    }
    if (type === "error") {
      return `<svg class="hr-toast__icon" viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M18 6 6 18M6 6l12 12"/></svg>`;
    }
    if (type === "warning") {
      return `<svg class="hr-toast__icon" viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 9v4m0 4h.01"/><path ${common} d="M10.3 4.3 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/></svg>`;
    }
    return `<svg class="hr-toast__icon" viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M12 16v-5m0-3h.01"/><path ${common} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/></svg>`;
  }

  function normalizeArgs(message, typeOrOptions, maybeOptions) {
    const base = { type: "info", timeoutMs: DEFAULT_TIMEOUT_MS, dismissible: true };
    if (typeof typeOrOptions === "string") {
      return { ...base, message: String(message ?? ""), type: typeOrOptions || "info", ...maybeOptions };
    }
    if (typeOrOptions && typeof typeOrOptions === "object") {
      return { ...base, message: String(message ?? ""), ...typeOrOptions };
    }
    return { ...base, message: String(message ?? "") };
  }

  function startTimer(id, timeoutMs) {
    const entry = live.get(id);
    if (!entry) return;
    if (!timeoutMs || timeoutMs <= 0) return;

    entry.startedAt = Date.now();
    entry.remainingMs = timeoutMs;
    entry.timeoutId = window.setTimeout(() => dismiss(id), timeoutMs);
  }

  function pauseTimer(id) {
    const entry = live.get(id);
    if (!entry) return;
    if (entry.timeoutId == null) return;
    window.clearTimeout(entry.timeoutId);
    entry.timeoutId = null;
    if (entry.remainingMs != null) {
      const elapsed = Date.now() - entry.startedAt;
      entry.remainingMs = Math.max(0, entry.remainingMs - elapsed);
    }
  }

  function resumeTimer(id) {
    const entry = live.get(id);
    if (!entry) return;
    if (entry.remainingMs == null) return;
    if (entry.remainingMs <= 0) {
      dismiss(id);
      return;
    }
    entry.startedAt = Date.now();
    entry.timeoutId = window.setTimeout(() => dismiss(id), entry.remainingMs);
  }

  function dismiss(id) {
    const entry = live.get(id);
    if (!entry) return;
    if (entry.timeoutId != null) window.clearTimeout(entry.timeoutId);
    entry.timeoutId = null;
    entry.el.classList.remove("hr-toast__enter");
    entry.el.classList.add("hr-toast__exit");
    const el = entry.el;
    live.delete(id);
    window.setTimeout(() => {
      el.remove();
    }, 200);
  }

  function enforceMaxVisible() {
    // Remove oldest toasts first.
    const ids = Array.from(live.keys());
    if (ids.length <= MAX_VISIBLE) return;
    const overflow = ids.slice(0, ids.length - MAX_VISIBLE);
    for (const id of overflow) dismiss(id);
  }

  function notify(message, typeOrOptions, maybeOptions) {
    const opts = normalizeArgs(message, typeOrOptions, maybeOptions);
    const type = ["success", "error", "warning", "info"].includes(opts.type) ? opts.type : "info";
    const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;
    const id = opts.id || makeId();

    const root = ensureContainer();

    const toast = document.createElement("div");
    toast.className = "hr-toast hr-toast__enter";
    toast.dataset.type = type;
    toast.tabIndex = 0;
    toast.setAttribute("role", type === "error" ? "alert" : "status");

    const messageEl = document.createElement("div");
    messageEl.className = "hr-toast__message";
    messageEl.textContent = opts.message;

    const actions = document.createElement("div");
    actions.className = "hr-toast__actions";

    if (opts.actionLabel && typeof opts.onAction === "function") {
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "hr-toast__btn";
      actionBtn.textContent = opts.actionLabel;
      actionBtn.addEventListener("click", () => {
        try {
          opts.onAction();
        } finally {
          dismiss(id);
        }
      });
      actions.appendChild(actionBtn);
    }

    if (opts.dismissible !== false) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "hr-toast__btn hr-toast__close";
      closeBtn.setAttribute("aria-label", "Dismiss notification");
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", () => dismiss(id));
      actions.appendChild(closeBtn);
    }

    toast.innerHTML = iconSvg(type);
    toast.appendChild(messageEl);
    toast.appendChild(actions);

    root.appendChild(toast);
    live.set(id, { el: toast, timeoutId: null, startedAt: Date.now(), remainingMs: null });

    toast.addEventListener("pointerenter", () => pauseTimer(id));
    toast.addEventListener("pointerleave", () => resumeTimer(id));
    toast.addEventListener("keydown", (e) => {
      if (e.key === "Escape") dismiss(id);
    });

    startTimer(id, timeoutMs);
    enforceMaxVisible();

    return { id, dismiss: () => dismiss(id) };
  }

  // Expose global API (and keep legacy name).
  window.sendNotification = notify;
  window.createNotification = notify;

  // Drain any queued calls from an early stub.
  const queued = window.__queuedNotifications;
  if (Array.isArray(queued) && queued.length) {
    for (const args of queued) {
      try {
        notify(...args);
      } catch {
        // Best-effort: don't crash page if one bad queued entry exists.
      }
    }
  }
  window.__queuedNotifications = [];
})();

