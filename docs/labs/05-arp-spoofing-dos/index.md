# 05 · ARP-Spoofing & Denial-of-Service

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/05-arp-spoofing-dos.pdf){ .md-button }

!!! warning "Sicherheits- und Ethikhinweis"
    Dieses Aufgabenblatt behandelt reale Angriffstechniken (ARP-Spoofing,
    SYN-Flood). Diese dürfen **ausschließlich** innerhalb der eigenen,
    isolierten Mininet-Netzwerk-Namespace-Umgebung eures
    Teilnehmer-Containers angewendet werden — **niemals** gegen das
    Host-Netzwerk, die Infrastruktur des Betreibers oder Dritte (siehe auch
    der Sicherheitshinweis auf der [Startseite](../../index.md)). Bereits der
    Versuch gegen fremde Systeme ist strafbar und ein Verstoß gegen die
    Nutzungsbedingungen der Umgebung.

## Lernziele

- Den Mechanismus von ARP-Spoofing (gefälschte, unaufgeforderte ARP-Replies)
  und das daraus resultierende Man-in-the-Middle-Szenario verstehen.
- Nachvollziehen, wie ein MITM-Angreifer HTTP-Inhalte einer Verbindung
  unbemerkt austauschen kann (Content-Swap über einen gefälschten Webserver).
- SYN-Flood als Ressourcenerschöpfungsangriff auf den TCP-Drei-Wege-Handshake
  (halboffene Verbindungen) verstehen und mit `hping3` praktisch
  nachvollziehen.
- Grundlegende Gegenmaßnahmen benennen können (statische ARP-Einträge,
  Dynamic ARP Inspection, SYN-Cookies).

--8<-- "issue-feedback.md"

## Aufgaben

Das Blatt ist in 3 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: ARP-Spoofing als Angreifer](m1-arp-spoofing.md){ .meilenstein }  
   Auf dieser Seite seht ihr, wie sich ARP ohne Authentifizierung ausnutzen lässt, um den Verkehr eines Hosts im selben Segment umzuleiten.
2. [Meilenstein 2: SYN-Flood](m2-syn-flood.md){ .meilenstein }  
   Hier erzeugt ihr selbst einen SYN-Flood gegen einen eigenen Server und beobachtet, wie halboffene Verbindungen den Dienst blockieren.
3. [Meilenstein 3: Erkennen, messen, verteidigen](m3-verteidigen.md){ .meilenstein }  
   Auf dieser Seite nehmt ihr die Rolle des Verteidigers ein: Angriffe erkennen, ihren Schaden messen und prüfen, welche Gegenmaßnahmen wirklich helfen.

## Quellen

- `mininet-labs/rn-practice/topo02/` (`topo02.py`, `start-topo02.sh`,
  `startARP-AttackerOnNodeH2.sh`, `startHTTPD.py`,
  `startHTTPD-Attacker.py`, `clear-cache.sh`) — Referenzimplementierung für
  Teil B.
- `mininet-labs/intro/04-arp-and-more-tex.tex` ("Lab 4: Angriffsvektoren")
  — fachliche Basis für Teil B (ARP-MitM) und Teil C (SYN-Flood).
- `mininet-labs/vertiefung/Labor-03-Routing.tex`, Abschnitt "Man in the
  Middle" — fachliche Basis für Teil A.
- `docs/reference/umgebung.md` — Überblick über die verwendete Umgebung und
  die vorinstallierten Werkzeuge.
