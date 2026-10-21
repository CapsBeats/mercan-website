/* =========================================================
   Füllt Impressum & Datenschutz mit den Angaben aus content/rechtliches.json und content/kontakt.json (SITE.legal / SITE.contact).
   Fehlende Pflichtangaben erscheinen orange als „[Bitte eintragen: …]“,
   optionale Angaben mit "-" werden samt Zeile ausgeblendet.
   ========================================================= */
SITE.ready.then(() => {
  const { legal, contact } = SITE;
  const values = {
    ...legal,
    businessName: `${SITE.name} ${SITE.subtitle}`,
    street: contact.street,
    city: contact.city,
    phone: contact.phone,
    email: contact.email,
  };

  document.querySelectorAll("[data-legal]").forEach((el) => {
    const key = el.dataset.legal;
    const value = values[key];

    if (value === "-") {
      (el.closest("[data-optional]") || el).remove();
      return;
    }
    if (!value) {
      el.textContent = `[Bitte eintragen: ${el.dataset.label || key}]`;
      el.classList.add("todo");
      return;
    }
    if (key === "email") {
      el.innerHTML = "";
      const a = document.createElement("a");
      a.href = `mailto:${value}`;
      a.textContent = value;
      el.appendChild(a);
    } else if (key === "phone") {
      el.innerHTML = "";
      const a = document.createElement("a");
      a.href = `tel:${contact.phoneLink}`;
      a.textContent = value;
      el.appendChild(a);
    } else {
      el.textContent = value;
    }
    el.classList.remove("todo");
  });
});
