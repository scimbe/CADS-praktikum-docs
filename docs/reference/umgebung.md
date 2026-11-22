# Desktop-/Mininet-Umgebung

Kurzreferenz für Teilnehmer: was läuft wo, und wie kommt man rein.

## Zugang

Die Umgebung ist unter `rn-praktikum.bunsenbrenner.org` erreichbar (für
`riisc.bunsenbrenner.org` siehe die eigene Anleitung
[Remote-Desktop: riisc](remote-desktop-riisc.md)).

1. Browser öffnen, SSO-Login mit dem GitLab-Account der CADS AG (Button
   **„Anmelden mit GitLab“**).
2. Danach öffnet sich der persönliche Desktop im Browser (kein Client-Install
   nötig, WebRTC/WebSocket-Streaming).
3. Der Fortschritt (Home-Verzeichnis) bleibt zwischen Logins erhalten, auch
   wenn der Container zwischenzeitlich aus Ressourcengründen gestoppt und
   entfernt wurde.

Ausführliche Schritt-für-Schritt-Anleitung inklusive Freigabe-Wartezeit und
Logout:
[Remote-Desktop: rn-praktikum](remote-desktop-rn-praktikum.md).

## Terminal

Auf dem Desktop startet ihr Terminals über das Standard-Terminal-Icon
(`xfce4-terminal`) — **nicht** `xterm`. Innerhalb von Mininet bleibt der
dokumentierte Befehl

```text
mininet> xterm h1
```

unverändert nutzbar und öffnet ein Terminalfenster für den Knoten `h1` — im
Hintergrund läuft dabei ebenfalls `xfce4-terminal`, nicht das Programm
`xterm` (siehe `images/desktop/xterm-shim`).

## Fenster wiederfinden und tippen

Nach dem Start einer Topologie öffnen sich Knotenfenster („Node: h1", „Node:
h2", …). Sie liegen oft übereinander oder komplett hinter dem Mininet-Terminal.

- **Leiste:** Gleichartige Fenster fasst die Leiste zu einem Eintrag
  „Xfce4-terminal" zusammen (mit einem Zähler bei mehreren Fenstern). Ein
  Klick darauf holt nicht in jedem Fall das gewünschte Fenster nach vorn; eine
  ausgeklappte Liste mit allen Fenstern dürft ihr nicht erwarten.
- **Auseinanderziehen:** Zieht überlappende Fenster am Titelbalken
  auseinander und klickt dann auf einen sichtbaren Teil des Fensters, das ihr
  braucht. Ein zu großes Fenster (z. B. Wireshark) verkleinert ihr per
  Doppelklick auf die Titelleiste; ein kleines vergrößert derselbe
  Doppelklick.
- **Wo lande ich?** Der Fenstertitel nennt den Knoten, in dem ihr gerade
  tippt („Node: h1", „Node: h2", „Terminal"); die Titelleiste des aktiven
  Fensters ist hervorgehoben.
- **Neues Terminal:** Strg+Umschalt+N im aktiven Terminalfenster oder das
  Terminal-Symbol am Rand. Das Symbol holt ein bereits offenes Fenster nur
  nach vorn, wenn eines existiert und verdeckt wird. Beendet mit `exit` nur
  das Fenster, das ihr meint: Prüft vorher den Fenstertitel.
- **Erst klicken, dann tippen:** Nach einem Fensterwechsel geht der erste
  Buchstabe manchmal verloren (`ingall` statt `pingall`). Klickt zuerst ins
  Fenster, wartet kurz und tippt dann. Fehlt ein Buchstabe, löscht die Zeile
  mit Strg+U und tippt den Befehl neu; „command not found" ist dann meist
  ein Tippfehler, kein Fehler im Blatt.

## Mitschnitte in `/tmp`

Viele Blätter schreiben Mitschnitte in feste Dateien unter `/tmp`. Eine
Datei aus einem früheren Versuch kann dann Ergebnisse vortäuschen oder
`Permission denied` auslösen, weil sie einem anderen Benutzer gehört.
Löscht die Datei deshalb vor jedem Mitschnitt (`rm -f <datei>`, bei Dateien
von `sudo tcpdump` mit `sudo rm -f <datei>`); die Blätter führen das als
ersten Befehl auf.

## Vorinstallierte Werkzeuge

`mininet`, `openvswitch-switch`, `frr` (Routing-Daemons: `zebra`, `ripd`,
`bgpd`, per `vtysh` bedienbar), `iperf`/`iperf3`, `hping3`, `dsniff`,
`tcpdump`, `wireshark`/`tshark` (Mitschnitt als Nutzer über Datei-Capabilities auf `dumpcap`, Gruppe `wireshark`), `nmap`, `whois`, `dnsutils`, `netcat-openbsd`, `iodine`, `faketime`,
`exploitdb`/`searchsploit`, `firefox-esr`.

## Ressourcen-Modell

Ein Container pro Teilnehmer, ephemer (bei jedem Login frisch aus dem
gepinnten Image erzeugt — Prüfungshygiene). Persistenter Zustand liegt in
einem separaten, pro Nutzer benannten Volume und übersteht das Entfernen des
Containers. Inaktive Sessions werden nach einer Idle-Zeit automatisch
gestoppt, um Ressourcen für aktive Teilnehmer freizugeben.
