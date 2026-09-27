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

## Vorinstallierte Werkzeuge

`mininet`, `openvswitch-switch`, `frr` (Routing-Daemons: `zebra`, `ripd`,
`bgpd`, per `vtysh` bedienbar), `iperf`/`iperf3`, `hping3`, `dsniff`,
`tcpdump`, `wireshark`, `nmap`, `whois`, `dnsutils`, `netcat-openbsd`,
`exploitdb`/`searchsploit`, `firefox-esr`.

## Ressourcen-Modell

Ein Container pro Teilnehmer, ephemer (bei jedem Login frisch aus dem
gepinnten Image erzeugt — Prüfungshygiene). Persistenter Zustand liegt in
einem separaten, pro Nutzer benannten Volume und übersteht das Entfernen des
Containers. Inaktive Sessions werden nach einer Idle-Zeit automatisch
gestoppt, um Ressourcen für aktive Teilnehmer freizugeben.
