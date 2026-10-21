/* =========================================================
   Cookie-Banner mit Auswahl:
   „Alle akzeptieren“ · „Nur notwendige“ · „Einstellungen“ (einzeln wählen).
   Kategorien: Notwendig (immer aktiv) und Externe Medien (Google Maps).
   Die Website setzt keine Tracking-Cookies – kommt später z. B. Statistik dazu,
   hier eine weitere Kategorie in CATEGORIES ergänzen.
   Die Wahl wird im Browser (localStorage) gespeichert und kann über
   „Cookie-Einstellungen“ im Footer jederzeit geändert werden.
   ========================================================= */
(() => {
  const KEY = "mercan-consent";
  const CATEGORIES = [
    { id: "necessary", title: "Notwendig", locked: true,
      text: "Speichert Ihre Cookie-Auswahl, damit dieses Fenster nicht bei jedem Besuch erscheint. Ohne diese Speicherung funktioniert die Auswahl nicht." },
    { id: "media", title: "Externe Medien",
      text: "Lädt die Karte von Google Maps automatisch. Dabei werden Daten (z. B. Ihre IP-Adresse) an Google übertragen und Google kann Cookies setzen." },
  ];

  const read = () => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "accepted") return { necessary: true, media: true };   // Format der ersten Version
      if (v === "declined") return { necessary: true, media: false };
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };

  window.MercanConsent = { accepted: () => !!read()?.media };

  let root;
  function save(choice) {
    const before = !!read()?.media;
    write({ ...choice, necessary: true, date: new Date().toISOString().slice(0, 10) });
    close();
    if (before !== !!choice.media) {
      document.dispatchEvent(new CustomEvent("consentchange", { detail: choice.media ? "accepted" : "declined" }));
    }
  }

  function open(showSettings = false) {
    if (root) return;
    const current = read() || { media: false };
    root = document.createElement("div");
    root.className = "consent";
    root.innerHTML = `
      <div class="consent__box" role="dialog" aria-modal="true" aria-labelledby="consent-title" aria-describedby="consent-text">
        <h2 class="consent__title" id="consent-title">Wir verwenden Cookies</h2>
        <p class="consent__text" id="consent-text">
          Diese Website verwendet Cookies und ähnliche Technologien. Notwendige sind für den Betrieb erforderlich,
          andere (externe Medien wie Google Maps) nur mit Ihrer Zustimmung. Sie können alle akzeptieren, nur die
          notwendigen erlauben oder selbst auswählen – und Ihre Wahl jederzeit über „Cookie-Einstellungen“ unten auf der Seite ändern.
          Mehr in der <a href="/datenschutz.html">Datenschutzerklärung</a> · <a href="/impressum.html">Impressum</a>.
        </p>
        <div class="consent__settings" hidden>
          ${CATEGORIES.map((c) => `
            <label class="consent__cat">
              <span class="consent__cat-head">
                <span class="consent__cat-title">${c.title}${c.locked ? ' <span class="consent__always">immer aktiv</span>' : ""}</span>
                <input type="checkbox" role="switch" class="consent__switch" data-cat="${c.id}"
                  ${c.locked || current[c.id] ? "checked" : ""} ${c.locked ? "disabled" : ""}>
              </span>
              <span class="consent__cat-text">${c.text}</span>
            </label>`).join("")}
        </div>
        <div class="consent__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-action="settings">Einstellungen</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="save" hidden>Auswahl speichern</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="necessary">Nur notwendige</button>
          <button type="button" class="btn btn--primary btn--sm" data-action="all">Alle akzeptieren</button>
        </div>
      </div>`;

    const $ = (s) => root.querySelector(s);
    const showDetails = () => {
      $(".consent__settings").hidden = false;
      $('[data-action="settings"]').hidden = true;
      $('[data-action="save"]').hidden = false;
      $(".consent__switch:not([disabled])")?.focus();
    };
    root.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;
      if (action === "settings") showDetails();
      if (action === "necessary") save({ media: false });
      if (action === "all") save({ media: true });
      if (action === "save") {
        const choice = {};
        root.querySelectorAll(".consent__switch").forEach((s) => (choice[s.dataset.cat] = s.checked));
        save(choice);
      }
    });
    // Tab-Taste bleibt im Fenster
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const items = [...root.querySelectorAll("a, button:not([hidden]), input:not([disabled])")].filter((el) => el.offsetParent);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    document.body.appendChild(root);
    document.documentElement.classList.add("consent-open");
    if (showSettings) {
      showDetails();
    } else {
      $(".consent__box").setAttribute("tabindex", "-1");
      $(".consent__box").focus({ preventScroll: true });
    }
    requestAnimationFrame(() => root.classList.add("is-visible"));
  }

  function close() {
    root.remove();
    root = null;
    document.documentElement.classList.remove("consent-open");
  }

  // Footer-Link „Cookie-Einstellungen“ öffnet direkt die Auswahl
  document.addEventListener("click", (e) => {
    if (e.target.closest(".js-consent-open")) { e.preventDefault(); open(true); }
  });

  if (!read()) open();
})();
