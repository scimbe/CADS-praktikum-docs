# Rechnernetze-Praktikum

Diese Seite fasst die Praktikumsaufgaben der modernisierten
Rechnernetze-Praktikumsumgebung (HAW Hamburg) zusammen. Sie ersetzt die
verstreuten Google-Drive-PDFs und Kurz-URLs (`t1p.de/...`) durch eine
konsolidierte, kontinuierlich gepflegte Fassung im Repository selbst —
jede Aufgabe ist hier als Text lesbar **und** als PDF herunterladbar.

## Was hier neu ist

- **Konsolidiert:** die bisherigen 11 Einzeldokumente (6 Einführungslabore +
  5 Vertiefungsblöcke) sind zu 7 thematisch geschlossenen Aufgabenblättern
  zusammengeführt (siehe unten). Doppelungen (z. B. ARP-Spoofing kam in zwei
  Dokumenten vor) sind aufgelöst, fehlende Abschnitte (vormals reine
  TODO-Platzhalter) sind neu ausgearbeitet.
- **Korrigiert:** bekannte Fehler/Unklarheiten in den Originaltexten sind
  behoben und, wo fachlich relevant, mit einer kurzen Begründung versehen.
- **Herausforderungen:** jedes Aufgabenblatt nennt jetzt explizit bekannte
  Stolperfallen (Environment- und fachliche Fallstricke) — siehe auch die
  zusammenfassende Seite [Potenzielle Herausforderungen](challenges.md).
- **Verifiziert statt behauptet:** wo eine Aussage per Playwright-Screenshot
  oder per realem Skript-Test in diesem Environment nachvollzogen wurde,
  ist das vermerkt (siehe [Desktop-/Mininet-Umgebung](reference/umgebung.md)).

## Praktika

| # | Thema | Basiert auf (Original) | Topologie-Skript |
|---|-------|------------------------|-------------------|
| [01](labs/01-netzwerkgrundlagen-tools.md) | Netzwerkgrundlagen & Tools (ping, netcat, dig, nmap, Wireshark, Schichtenmodell) | Lab 1 + Labor-01 | `rn-practice/topo01` |
| [02](labs/02-subnetting-arp.md) | IPv4-Subnetting & ARP | Labor-02 | `rn-practice/topoP02`–`topoP04` |
| [03](labs/03-routing-rip-bgp.md) | Routing: RIP/BGP mit FRR | Lab 3 + Labor-03 | `rn-practice/topo03` |
| [04](labs/04-tcp-udp-congestion.md) | TCP/UDP & Congestion Control | Lab 2 + Labor-04 | `rn-practice/topo01` (iperf/iperf3) |
| [05](labs/05-arp-spoofing-dos.md) | ARP-Spoofing & Denial-of-Service | Lab 4 | `rn-practice/topo02` |
| [06](labs/06-advanced-covert-channels.md) | Advanced: DNS-Tunneling, Covert Channels, JA3, NTP | Lab 5 | *(noch kein Skript, siehe Herausforderungen)* |
| [07](labs/07-http-rest-quic.md) | HTTP/REST/QUIC von Hand (netcat/telnet) | Labor-05 | `rn-practice/topo01` (HTTP(S)-Server) |

## Umgebung & Zugang

Die Labore laufen in einem browserbasierten Desktop (Selkies/KasmVNC) mit
Mininet, Wireshark und Routing-Daemons — Zugang per SSO über HAW-GitLab.
Details: [Desktop-/Mininet-Umgebung](reference/umgebung.md) und
[rn-practice Setup](reference/rn-practice-setup.md).

!!! warning "Sicherheitshinweis"
    Die Labore 05 und 06 behandeln Angriffstechniken (ARP-Spoofing,
    SYN-Flood, Covert Channels). Diese laufen **ausschließlich** in der
    isolierten Mininet-Netzwerk-Namespace-Umgebung des jeweiligen
    Teilnehmer-Containers — niemals gegen das Host-Netzwerk oder Dritte.
