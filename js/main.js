/* =========================================================
   MERCAN Gemüse Döner – Interaktion & Rendering
   Inhalte kommen aus js/data.js (SITE) bzw. content/*.json
   ========================================================= */
SITE.ready.then(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Links & Kontakt ---------- */
  const { contact, links, social } = SITE;
  $$(".js-order").forEach((a) => (a.href = links.lieferando));
  $$(".js-wolt").forEach((a) => (a.href = links.wolt));
  $$(".js-maps").forEach((a) => (a.href = links.googleMaps));
  $$(".js-route").forEach((a) => (a.href = links.route));
  $$(".js-review").forEach((a) => (a.href = links.review));
  $$(".js-tel").forEach((a) => (a.href = `tel:${contact.phoneLink}`));
  $$(".js-phone").forEach((el) => (el.textContent = contact.phone));
  $$(".js-street").forEach((el) => (el.textContent = contact.street));
  $$(".js-city").forEach((el) => (el.textContent = contact.city));
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  const mailCard = $(".js-mail");
  if (contact.email) {
    mailCard.href = `mailto:${contact.email}`;
    $(".js-email").textContent = contact.email;
  } else {
    mailCard.remove();
  }

  /* ---------- Social Icons ---------- */
  const icons = {
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 3.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8zm0 10.6a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm6.6-12.3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.4a2.9 2.9 0 1 1-2-2.7V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8.2 8.2 0 0 0 4.8 1.5V6.8l-1-.1z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z"/></svg>',
  };
  const socialHtml = Object.entries(social)
    .filter(([, url]) => url)
    .map(([k, url]) => `<a class="social-icon" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${k}">${icons[k]}</a>`)
    .join("");
  $$(".js-social").forEach((el) => (el.innerHTML = socialHtml));
  if (!socialHtml) $(".follow")?.remove();

  /* ---------- Öffnungszeiten & Live-Status ---------- */
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmt = (t) => (t === "24:00" ? "00:00" : t);

  function status(now = new Date()) {
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = SITE.hours[day];
    const open = toMin(today.open), close = toMin(today.close);
    if (mins >= open && mins < close) {
      const left = close - mins;
      return { open: true, text: left <= 60 ? `Jetzt geöffnet · schließt um ${fmt(today.close)} Uhr` : `Jetzt geöffnet · bis ${fmt(today.close)} Uhr` };
    }
    if (mins < open) return { open: false, text: `Geschlossen · öffnet heute um ${today.open} Uhr` };
    const next = SITE.hours[(day + 1) % 7];
    return { open: false, text: `Geschlossen · öffnet morgen um ${next.open} Uhr` };
  }

  function renderStatus() {
    const s = status();
    $$(".js-status").forEach((el) => {
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
      $("b", el).textContent = s.text;
    });
  }
  renderStatus();
  setInterval(renderStatus, 60_000);

  // Montag zuerst anzeigen
  const order = [1, 2, 3, 4, 5, 6, 0];
  const todayIdx = new Date().getDay();
  $(".js-hours").innerHTML = order
    .map((i) => {
      const h = SITE.hours[i];
      return `<tr class="${i === todayIdx ? "is-today" : ""}"><td>${h.day}${i === todayIdx ? " · heute" : ""}</td><td>${h.open} – ${fmt(h.close)} Uhr</td></tr>`;
    })
    .join("");

  // Öffnungszeiten im Google-Datenblock (JSON-LD) aktuell halten – Tage mit gleichen Zeiten zusammenfassen
  const ld = $('script[type="application/ld+json"]');
  if (ld) {
    const en = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const groups = {};
    SITE.hours.forEach((h, i) => {
      const close = h.close === "24:00" ? "23:59" : h.close;
      (groups[`${h.open}-${close}`] ||= { "@type": "OpeningHoursSpecification", dayOfWeek: [], opens: h.open, closes: close }).dayOfWeek.push(en[i]);
    });
    const data = JSON.parse(ld.textContent);
    data.openingHoursSpecification = Object.values(groups);
    ld.textContent = JSON.stringify(data, null, 2);
  }

  /* ---------- Highlights ---------- */
  $(".js-highlights").innerHTML = SITE.highlights
    .map((h, i) => `
      <article class="card reveal" style="transition-delay:${i * 0.1}s">
        <div class="card__img"><img src="${h.img}" alt="${esc(h.title)}" loading="lazy"${h.pos ? ` style="--pos:${h.pos}"` : ""}><span class="card__price">${h.price}</span></div>
        <div class="card__body"><h3>${esc(h.title)}${h.veggie ? ' <span class="veg-badge" title="vegetarisch">V</span>' : ""}</h3><p>${esc(h.text)}</p></div>
      </article>`)
    .join("");

  /* ---------- Menü ---------- */
  const tabs = $(".js-tabs");
  const menuEl = $(".js-menu");
  tabs.innerHTML = SITE.menu
    .map((c, i) => `<button class="tab" role="tab" id="tab-${i}" aria-selected="${i === 0}" data-i="${i}">${esc(c.cat)}</button>`)
    .join("");

  function renderMenu(i) {
    const c = SITE.menu[i];
    menuEl.setAttribute("aria-labelledby", `tab-${i}`);
    menuEl.innerHTML = `
      <div class="menu__head${c.img ? " menu__head--img" : ""}">
        <div><h3>${esc(c.cat)}</h3>${c.note ? `<p>${esc(c.note)}</p>` : ""}</div>
        ${c.img ? `<img class="menu__hero" src="${esc(c.img)}" alt="" loading="lazy">` : ""}
      </div>
      <ul class="menu__list">
        ${c.items
          .map(({ name, desc, price, veggie: v, img }, j) => `
          <li class="menu__item${img ? " menu__item--img" : ""}" style="animation-delay:${j * 0.03}s">
            ${img ? `<img class="menu__thumb" src="${esc(img)}" alt="" loading="lazy">` : ""}
            <span><span class="menu__name">${esc(name)}${v ? ' <span class="veg-badge" title="vegetarisch">V</span>' : ""}</span>${desc ? `<span class="menu__desc">${esc(desc)}</span>` : ""}</span>
            <span class="menu__dots"></span>
            <span class="menu__price">${esc(price)}</span>
          </li>`)
          .join("")}
      </ul>`;
  }
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    $$(".tab", tabs).forEach((t) => t.setAttribute("aria-selected", t === btn));
    btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    renderMenu(+btn.dataset.i);
  });
  // Pfeiltasten-Navigation zwischen Tabs (ARIA Tabs Pattern)
  tabs.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const all = $$(".tab", tabs);
    const i = all.indexOf(document.activeElement);
    const n = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length;
    e.preventDefault();
    all[n].focus();
    all[n].click();
  });
  renderMenu(0);

  /* ---------- Hintergrund-Videos: nur abspielen, wenn sichtbar ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData); // Datensparmodus: nur Standbild
  const videos = $$(".js-bgvideo");
  if (reduceMotion || saveData) {
    videos.forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
  } else {
    const vio = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) { v.autoplay = true; v.play().catch(() => {}); } else { v.pause(); }
      }),
      { threshold: 0.1 }
    );
    videos.forEach((v) => vio.observe(v));
  }

  /* ---------- Auch von uns: kleine Karten unter der Überschrift → springen zu den großen Karten weiter unten ---------- */
  const shops = SITE.shops || [];
  $(".js-shops-mini").innerHTML = shops
    .map((x, i) => `
      <a href="#laden-${i}" class="minishop">
        <img src="${x.img}" alt="" width="56" height="56">
        <span class="minishop__body">
          <span class="minishop__name">${esc(x.name)}</span>
          <span class="minishop__text">${esc(x.text)}</span>
        </span>
      </a>`)
    .join("");
  $(".js-shops").innerHTML = shops
    .map((x, i) => `
      <article class="card reveal" id="laden-${i}" style="transition-delay:${i * 0.1}s">
        <div class="card__img card__img--wide"><img src="${x.img}" alt="${esc(x.name)}" loading="lazy"></div>
        <div class="card__body">
          <h3>${esc(x.name)}</h3>
          <p>${esc(x.text)}</p>
          ${x.address ? `<p class="card__meta">${esc(x.address)}</p>` : ""}
          ${x.link ? `<p class="card__meta"><a href="${esc(x.link)}" target="_blank" rel="noopener">Mehr erfahren →</a></p>` : ""}
        </div>
      </article>`)
    .join("");
  if (!shops.length) { $(".hero__shops")?.remove(); $("#auch-von-uns")?.remove(); }

  /* ---------- Galerie ---------- */
  $(".js-gallery").innerHTML = SITE.gallery
    .map((g) => `<figure><img src="${g.src}" alt="${esc(g.alt)}" loading="lazy"></figure>`)
    .join("");

  /* ---------- Bewertungen ---------- */
  $(".js-score").textContent = SITE.rating.score.toLocaleString("de-DE");
  $(".js-count").textContent = `${SITE.rating.count} Bewertungen auf Google`;
  $$(".js-rating-asof").forEach((el) => (el.textContent = SITE.rating.asOf));

  const gLogo = '<svg class="review__g" viewBox="0 0 48 48" aria-label="Google"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const track = $(".js-reviews");
  track.innerHTML = SITE.reviews
    .map((r) => `
      <article class="review">
        <div class="stars" aria-label="${r.stars} von 5 Sternen">${"★".repeat(r.stars)}<span class="off">${"★".repeat(5 - r.stars)}</span></div>
        <blockquote>${esc(r.text)}</blockquote>
        <footer>
          <span class="review__avatar">${esc(r.name[0])}</span>
          <span><span class="review__name">${esc(r.name)}</span><br><span class="review__when">${esc(r.when)}</span></span>
          ${gLogo}
        </footer>
      </article>`)
    .join("");

  const cards = $$(".review", track);
  const dots = $(".js-dots");
  const perView = () => Math.max(1, Math.round(track.clientWidth / cards[0].offsetWidth));
  const pages = () => Math.max(1, cards.length - perView() + 1);
  const current = () => Math.round(track.scrollLeft / (cards[0].offsetWidth + 24));
  const go = (i) => {
    const n = pages();
    i = ((i % n) + n) % n;
    track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft });
  };
  function renderDots() {
    dots.innerHTML = Array.from({ length: pages() }, (_, i) => `<button aria-label="Bewertung ${i + 1}"></button>`).join("");
    updateDots();
  }
  function updateDots() {
    const c = current();
    $$("button", dots).forEach((d, i) => d.classList.toggle("is-active", i === c));
  }
  dots.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) go($$("button", dots).indexOf(b)); });
  $(".reviews__nav--prev").addEventListener("click", () => go(current() - 1));
  $(".reviews__nav--next").addEventListener("click", () => go(current() + 1));
  track.addEventListener("scroll", () => requestAnimationFrame(updateDots), { passive: true });
  window.addEventListener("resize", renderDots);
  renderDots();

  let auto = setInterval(() => go(current() + 1), 6000);
  const reviewsBox = $(".reviews");
  ["mouseenter", "touchstart", "focusin"].forEach((ev) => reviewsBox.addEventListener(ev, () => clearInterval(auto), { passive: true }));

  /* ---------- Karte (erst nach Zustimmung: Klick oder „Akzeptieren“ im Cookie-Banner) ---------- */
  const loadMap = () => {
    const placeholder = $(".js-map-consent");
    if (placeholder) placeholder.outerHTML = `<iframe src="${links.mapEmbed}" title="Karte: MERCAN Gemüse Döner, Am Bassin 12a, Potsdam" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  };
  $(".js-map-load").addEventListener("click", loadMap);
  if (window.MercanConsent?.accepted()) loadMap();
  document.addEventListener("consentchange", (e) => {
    if (e.detail === "accepted") loadMap();
    else if (!$(".js-map-consent")) location.reload(); // Widerruf: geladene Karte wieder entfernen
  });

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggleMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    navLinks.classList.toggle("is-open", open);
    nav.classList.toggle("menu-open", open);
  };
  burger.addEventListener("click", () => toggleMenu(burger.getAttribute("aria-expanded") !== "true"));
  navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) toggleMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });

  /* ---------- Scroll-Reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => io.observe(el));
});
