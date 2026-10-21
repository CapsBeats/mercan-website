/* =========================================================
   MERCAN Gemüse Döner – Inhalte der Website.
   Die änderbaren Inhalte (Speisekarte, Öffnungszeiten, Kontakt, Bewertungen,
   Startseite, Rechtsangaben) liegen in content/*.json und werden im
   Admin-Bereich (/admin/) bearbeitet. Hier stehen nur feste Werte und der Loader.
   ========================================================= */

const SITE = {
  url: "https://mercan-gemuese-doener.de",
  name: "MERCAN",
  subtitle: "Gemüse Döner",
  claim: "Potsdams Gemüse Döner",

  contact: {
    district: "Am Bassinplatz · Innenstadt",
    lat: 52.4003628,
    lng: 13.0595617,
  },

  links: {
    googleMaps: "https://www.google.com/maps/place/MERCAN+Gem%C3%BCse+D%C3%B6ner/@52.4003628,13.0595617,17z/data=!4m6!3m5!1s0x47a8f5002a5911dd:0xe06f9bbb875f98f2!8m2!3d52.4003628!4d13.0595617",
    // Google-Bewertung schreiben (Place ID von MERCAN Gemüse Döner, geprüft 21.10.2026)
    review: "https://search.google.com/local/writereview?placeid=ChIJ3RFZKgD1qEcR8phfh7ubb-A",
    route: "https://www.google.com/maps/dir/?api=1&destination=MERCAN+Gem%C3%BCse+D%C3%B6ner,+Am+Bassin+12a,+14467+Potsdam",
    mapEmbed: "https://www.google.com/maps?q=MERCAN+Gem%C3%BCse+D%C3%B6ner,+Am+Bassin+12a,+14467+Potsdam&z=17&output=embed",
  },
};

// content/*.json laden und in SITE einfügen. main.js und legal.js warten auf SITE.ready.
SITE.ready = Promise.all(
  ["kontakt", "oeffnungszeiten", "speisekarte", "startseite", "bewertungen", "rechtliches"].map((f) =>
    fetch(`content/${f}.json`, { cache: "no-cache" }).then((r) => r.json())
  )
).then((parts) => {
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      SITE[key] = SITE[key] && !Array.isArray(value) ? { ...SITE[key], ...value } : value;
    }
  }
  // Telefonnummer für tel:-Links, z. B. "0163 7973185" → "+491637973185"
  SITE.contact.phoneLink = SITE.contact.phone.replace(/[^\d+]/g, "").replace(/^0/, "+49");
  return SITE;
});
