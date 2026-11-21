# 07 · HTTP/REST/QUIC von Hand

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/07-http-rest-quic.pdf){ .md-button }

!!! info "QUIC läuft hier im eigenen Netz, nicht gegen einen Server im Internet"
    UDP/443 ist nach außen gesperrt; ein Aufruf gegen einen QUIC-Server im
    Internet scheitert deshalb in dieser Umgebung. Die Teile 4–7 nutzen
    stattdessen einen lokalen HTTP/3-Server in `topo01`. Er liegt als lesbares
    Startskript (`startHTTP3Server.sh`) im Topologie-Verzeichnis – ihr seht
    darin, welche nginx-Zeile QUIC einschaltet. Der QUIC-Verkehr wird im
    eigenen Netz mit `tcpdump` als UDP sichtbar.

## Lernziele

- HTTP als textbasiertes, zeilenorientiertes Anwendungsprotokoll von Hand
  sprechen können – ohne Browser oder Bibliothek dazwischen.
- Den Aufbau einer HTTP-Anfrage (Request-Line, Header, Leerzeile, optionaler
  Body) und einer HTTP-Antwort nachvollziehen.
- REST-artige Abfrageparameter (Query-Strings) und den Einfluss des
  `Accept`-Headers auf das Antwortformat (JSON vs. XML) verstehen.
- Den Unterschied zwischen einer lokalen, kontrollierten Gegenstelle
  (topo01-HTTP(S)-Server) und einer echten, externen Web-API
  (OpenWeatherMap) im eigenen Netzwerkverkehr beobachten können.
- Die drei HTTP-Versionen im Mitschnitt auseinanderhalten: HTTP/1.1 und
  HTTP/2 laufen über TCP, HTTP/3 läuft über QUIC und damit über UDP.
- Erkennen, dass QUIC (RFC 9000) bewusst auf UDP aufsetzt statt ein neues
  Transportprotokoll zu sein, und den QUIC-Handshake im Mitschnitt an seinen
  großen Initial-Paketen wiedererkennen.
- Nachvollziehen, wie ein Server einem über TCP verbundenen Client per
  `Alt-Svc`-Header (RFC 7838) mitteilt, dass er auch HTTP/3 spricht.

--8<-- "issue-feedback.md"

## Aufgaben

!!! tip "Alte Mitschnitte zuerst löschen"
    Die Mitschnitte in diesem Blatt landen in festen Dateien unter `/tmp`.
    Eine Datei aus einem früheren Versuch löst `Permission denied` aus oder
    täuscht Ergebnisse vor, weil `tcpdump` nicht schreiben kann und `grep`
    die alte Datei liest. Deshalb steht vor jedem Mitschnitt ein
    `rm -f <datei>` (bei `sudo tcpdump` mit `sudo`).

Das Blatt ist in 3 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: HTTP von Hand: lokal, REST, TLS](m1-http-von-hand.md){ .meilenstein }  
   Hier sprecht ihr HTTP ohne Browser selbst, lokal, gegen eine echte REST-API und über TLS.
2. [Meilenstein 2: HTTP/2, HTTP/3 und QUIC](m2-http2-http3-quic.md){ .meilenstein }  
   Auf dieser Seite macht ihr die drei HTTP-Versionen im Mitschnitt sichtbar und seht, wie QUIC auf UDP aufsetzt.
3. [Meilenstein 3: Site-Cloning und XSS](m3-xss.md){ .meilenstein }  
   Hier seht ihr an einem absichtlich verwundbaren Übungsziel, wie ein ungeprüft übernommener Parameter zu Cross-Site-Scripting führt und wie sich das im Netzwerkverkehr zeigt.

## Potenzielle Herausforderungen

- **QUIC/HTTP-3 (Teile 4–7) läuft ausschließlich lokal.** Ein Aufruf gegen
  einen QUIC-Server im Internet scheitert an dieser Umgebung, weil UDP/443
  nach außen gesperrt ist; im eigenen Mininet-Netz spielt das keine Rolle.
  `nginx -V` zeigt `--with-http_v3_module`, `curl -V` listet `HTTP3`, und
  `curl --http3-only` erreicht den lokalen Server mit HTTP-Status 200 über
  UDP/443.
- **Teil 8 (Site-Cloning/XSS) funktioniert technisch nur gegen das eigene
  Übungsziel.** `h2` hat keine Route ins Internet (`r1`/`r2` bekommen in
  `topo01.py` keine Default-Route mit), und `startXSSLabServer.py` nimmt
  selbst nie eine ausgehende Verbindung auf – ein Aufruf gegen ein Ziel
  außerhalb der Topologie scheitert daher technisch, nicht nur aus Vorsicht.
- **Internet-Zugriff für Teil 2 nur über `h1`.** In `topo01` hat allein `h1`
  über den NAT-Uplink einen Weg nach draußen; `h2` hat keine Route ins
  Internet. Bearbeitet Teil 2 deshalb auf `h1`. Ob der ausgehende Zugriff auf
  `api.openweathermap.org:80` gelingt, hängt zusätzlich von der
  Firewall-/Proxy-Konfiguration des Container-Hosts ab. Schlägt die Verbindung
  trotz laufender Topologie fehl, ist das ein Hinweis auf eine restriktive
  Egress-Regel und kein Anwendungsfehler.
- **Timeouts bei manueller Eingabe.** Wie im Hinweistext oben erwähnt,
  gelten für handgetippte Anfragen dieselben Server-seitigen Timeouts wie
  für einen echten Client – bereitet die Anfragezeilen vorher vor.
- **Rate-Limit des gemeinsamen API-Schlüssels.** Der für die Veranstaltung
  bereitgestellte Schlüssel wird von allen Teilnehmenden gemeinsam genutzt;
  bei einer hohen Anzahl gleichzeitiger Anfragen ist ein Rate-Limit von
  OpenWeatherMap nicht auszuschließen.

## Quellen

- `mininet-labs/vertiefung/Labor-05-SCT-QUIC-HTTP-REST.tex`
- `mininet-labs/rn-practice/topo01/` (lokale HTTP(S)-Server als Vorstufe)
- `mininet-labs/rn-practice/topo01/startHTTP3Server.sh` – der lesbare
  nginx-Startpunkt für HTTP/3 über QUIC (Teile 4–7)
- `mininet-labs/rn-practice/topo01/startXSSLabServer.py` – das absichtlich
  verwundbare Übungsziel für Teil 8
