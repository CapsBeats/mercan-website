#!/bin/bash
# Startet die Website lokal und öffnet sie im Browser.
# Per Doppelklick im Finder startbar. Beenden: dieses Fenster schließen oder Ctrl+C.

cd "$(dirname "$0")/website" || exit 1

# Läuft schon ein Server auf Port 8080? Dann nur den Browser öffnen.
if curl -s -o /dev/null "http://localhost:8080/"; then
  echo "== Website läuft bereits unter http://localhost:8080 =="
  open "http://localhost:8080"
  exit 0
fi

echo "== MERCAN Website läuft unter http://localhost:8080 =="
echo "Zum Beenden dieses Fenster schließen oder Ctrl+C drücken."
(sleep 1 && open "http://localhost:8080") &

# Python 3 bevorzugt; fehlt es (keine Xcode-Entwicklerwerkzeuge), das mitgelieferte Ruby nutzen
# (/usr/bin/python3 ist ohne Entwicklerwerkzeuge nur ein Platzhalter, der ein Installationsfenster öffnet)
py="$(command -v python3)"
if [ -n "$py" ] && { [ "$py" != "/usr/bin/python3" ] || xcode-select -p >/dev/null 2>&1; }; then
  python3 -m http.server 8080
else
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 /usr/bin/ruby -E UTF-8 -run -e httpd . -p 8080
fi
