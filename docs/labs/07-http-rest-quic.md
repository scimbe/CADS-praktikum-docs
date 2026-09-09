# 07 · HTTP/REST/QUIC von Hand

[:material-file-pdf-box: Als PDF herunterladen](../pdf/07-http-rest-quic.pdf){ .md-button }

!!! warning "Titel-Klarstellung: kein QUIC-Inhalt"
    Der Titel dieses Aufgabenblatts (und der Dateiname des zugrundeliegenden
    Originaldokuments, `Labor-05-SCT-QUIC-HTTP-REST.tex`) erwähnt QUIC. Das
    Originaldokument behandelt **ausschließlich manuelle HTTP/REST-Anfragen
    per Netcat/Telnet** – ein QUIC-Übungsteil ist im Original nicht
    vorhanden, weder als Text noch als Aufgabe. Der QUIC-Bezug ist an dieser
    Stelle aspirational (vermutlich für ein zukünftiges, noch nicht
    geschriebenes Vertiefungsblatt vorgesehen) und wird hier bewusst nicht
    vorgetäuscht. Dieses Aufgabenblatt behandelt HTTP/REST; ein eigenständiger
    QUIC-Teil müsste separat nachgezogen werden, sollte er gewünscht sein.

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

## Aufgaben

### Teil 1 – Manuelles HTTP gegen die lokale Gegenstelle (topo01)

Bevor ihr gegen einen echten, externen Server sprecht, übt den Ablauf zuerst
gegen die euch bereits aus [Aufgabenblatt 01](01-netzwerkgrundlagen-tools.md)
bekannten HTTP(S)-Server in der Topologie `topo01` – hier gibt es keine
Rate-Limits, keine Internet-Abhängigkeit und keinen echten API-Schlüssel, der
schiefgehen kann.

1. Startet die Topologie, falls sie nicht schon läuft:

   ```bash
   cd ~/rn-practice/topo01
   ./start-topo01.sh
   ```

2. Startet auf `h1` den einfachen HTTP-Server:

   ```bash
   python3 startHTTPServer.py &
   ```

3. Sprecht von `h2` aus HTTP manuell per Netcat, statt einen Browser zu
   benutzen:

   ```bash
   netcat h1 80
   GET / HTTP/1.1
   Host: h1
   ```

   (Leerzeile am Ende durch zweimaliges Drücken von ++enter++ nicht
   vergessen – das ist das Ende des Headers und bei `HTTP/1.1` mit
   `Host`-Header notwendig, damit der Server antwortet.) Beobachtet die
   Antwort: Status-Zeile, Header, Leerzeile, HTML-Body.

   !!! note "Namensauflösung schlägt ohne laufenden dnsmasq fehl"
       Real getestet: `netcat h1 80` liefert `getaddrinfo for host "h1"
       port 80: Temporary failure in name resolution`, solange kein
       DNS-Forwarder (`dnsmasq`, siehe [Aufgabenblatt 01](01-netzwerkgrundlagen-tools.md))
       läuft, der den Namen `h1` auflöst. Verwendet ersatzweise die
       numerische Adresse, z. B. `netcat 10.0.1.2 80`.

   ![Terminalfenster "Node: h2": Ausgabe von netcat 10.0.1.2 80 mit Request (GET / HTTP/1.1, Host: h1) und der kompletten Antwort inkl. Status-Zeile "HTTP/1.0 200 OK", Headern (Cache-Control, Server, Date, Content-Type, Content-Length) und dem Beginn des HTML-Bodys](../assets/screenshots/07-http-rest-quic/netcat-manual-http.png)
   *Echte, von Hand über `netcat` gesprochene HTTP/1.1-Anfrage gegen den
   lokalen Server auf `h1` – Status-Zeile, Header, Leerzeile und HTML-Body
   sind vollständig sichtbar, genau wie ein Browser sie normalerweise
   verborgen im Hintergrund verarbeitet.*

4. Alternativ mit `telnet`, falls installiert, identisch:

   ```bash
   telnet h1 80
   ```

5. Vergleicht das Ergebnis mit einem Mitschnitt in Wireshark (Filter
   `ip.addr == 10.0.1.2 && tcp`, Interface auf `h2-eth0`) und mit einem
   normalen Browseraufruf von `http://h1` (siehe Aufgabenblatt 01) – der
   Inhalt ist identisch, nur der Weg dorthin unterscheidet sich.

6. Wiederholt den Versuch gegen den HTTPS-Server (`python3
   startHTTPsServer.py` auf `h1`, siehe Aufgabenblatt 01) mit reinem
   Netcat/Telnet auf Port 443. Beobachtet, dass die Anfrage so **nicht**
   funktioniert bzw. keine sinnvolle Antwort liefert.

   !!! note "Warum das nicht funktioniert"
       Netcat und Telnet sprechen nur rohes TCP, keinen TLS-Handshake. HTTPS
       verlangt aber, dass zuerst eine TLS-Sitzung aufgebaut wird, bevor die
       HTTP-Anfrage im Klartext hineingereicht werden kann. Für eine
       manuelle HTTPS-Anfrage bräuchtet ihr ein Werkzeug, das TLS selbst
       terminiert (z. B. `openssl s_client -connect h1:443`, danach die
       HTTP-Zeilen wie gewohnt eintippen). Das ist ein guter Beleg dafür,
       *warum* HTTP und Transportsicherheit (TLS) getrennte Schichten sind.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 07 teil1
    ```


### Teil 2 – Manuelles HTTP/REST gegen die externe OpenWeatherMap-API

Dieser Teil läuft **außerhalb** der Mininet-Topologie, direkt im
Desktop-Terminal (keine Topologie nötig) – ihr braucht einen echten
Internet-Zugriff, keinen NAT-Uplink einer Mininet-Topologie.

!!! note "Voraussetzungen"
    - `netcat` oder `telnet` müssen installiert sein (sind es auf dem
      Kurs-Image bereits).
    - Ein API-Schlüssel für OpenWeatherMap. Für die Veranstaltung nutzt bitte
      den bereitgestellten Schlüssel: `a4a906b6169e02b17c9ef0022802b89b`
      (bei Bedarf könnt ihr auch kostenlos einen eigenen unter
      [openweathermap.org/appid](https://openweathermap.org/appid)
      registrieren).

1. Baut eine rohe TCP-Verbindung zum API-Server auf:

   ```bash
   nc api.openweathermap.org 80
   ```

   oder

   ```bash
   telnet api.openweathermap.org 80
   ```

2. Schickt eine manuelle HTTP-GET-Anfrage (ersetzt `CITY_NAME` und
   `YOUR_API_KEY`):

   ```text
   GET /data/2.5/weather?q=CITY_NAME&appid=YOUR_API_KEY HTTP/1.1
   Host: api.openweathermap.org
   ```

   Bereitet euch die Zeilen am besten vorher in einem Editor vor, damit ihr
   sie zügig einfügen könnt – der Server hat wie jeder produktive Webserver
   ein Timeout für unvollständige Anfragen.

3. Alternativ mit geografischen Koordinaten (`LAT`/`LON`, z. B. per Google
   Maps ermittelt):

   ```text
   GET /data/2.5/weather?lat=LAT&lon=LON&appid=YOUR_API_KEY HTTP/1.1
   Host: api.openweathermap.org
   ```

4. Mit dem `Accept`-Header (bzw. dem Query-Parameter `mode`) lässt sich das
   Antwortformat beeinflussen. Vergleicht JSON- und XML-Antwort:

   ```text
   GET /data/2.5/weather?q=CITY_NAME&appid=YOUR_API_KEY&mode=xml HTTP/1.1
   Host: api.openweathermap.org
   ```

5. Zeichnet den gesamten Vorgang mit Wireshark mit (Filter z. B. auf
   `tcp.port == 80` oder die aufgelöste IP der API) und vergleicht die
   Rohdaten mit der euch angezeigten Konsolenausgabe.

   !!! note "Playwright-Screenshot-Referenz"
       Für den Beleg einer erfolgreichen API-Antwort (z. B. die JSON-Zeile
       mit den Wetterdaten in der Konsole) eignet sich ein
       **Zeilen-/Locator-Screenshot** (siehe
       `tests/e2e/specs/screenshots.spec.ts`, Test "Zeilen-Screenshot")
       besser als ein Fenster-Screenshot: entscheidend ist der Inhalt einer
       einzelnen Ausgabezeile (die HTTP-Statuszeile bzw. der JSON-Body), nicht
       der gesamte sichtbare Terminalzustand.

6. Probiert eigenständig weitere Endpunkte der API aus (Dokumentation:
   [openweathermap.org/current](https://openweathermap.org/current)).

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 07 teil2
    ```

!!! example "Stretch Goal (optional): Euer eigener HTTP-Client"
    Ihr habt HTTP jetzt zweimal von Hand getippt – gegen `h1` in Teil 1 und
    gegen eine echte API in Teil 2. Schreibt als freiwilliges Stretch-Goal
    ein kleines Skript (Bash mit `netcat` reicht, Python geht auch), das
    Host, Pfad und Query-Parameter als Argumente entgegennimmt, daraus eine
    korrekte HTTP/1.1-Anfrage inklusive `Host`-Header und abschließender
    Leerzeile zusammensetzt und über `netcat` verschickt. Prüft euer Skript
    gegen beide Gegenstellen aus diesem Aufgabenblatt. Das ist – anders als
    die Pflichtaufgaben oben – kein Teil des regulären Bewertungspfads; wer
    es umsetzt, kann das für die eigene Übersicht separat vermerken:

    ```bash
    ~/rn-practice/mark-done.sh 07 stretch
    ```


## Potenzielle Herausforderungen

- **QUIC ist im Original nicht enthalten.** Wie oben bereits vermerkt,
  behandelt die Quelle ausschließlich HTTP/REST über TCP. Wer QUIC/HTTP-3
  unterrichten möchte, braucht dafür eigenes, neu zu erstellendes Material
  (z. B. `curl --http3` oder ein QUIC-fähiger Server) – das ist nicht Teil
  dieses Aufgabenblatts.
- **Internetzugriff für Teil 2 läuft nicht über den Mininet-NAT-Uplink.**
  Das Originaldokument weist bereits selbst darauf hin, dass für die
  OpenWeatherMap-Übung keine Topologie gestartet werden muss – die Anfragen
  laufen direkt vom Desktop-Terminal (Container-Host-Netzwerk) aus, nicht
  über den NAT-Uplink von `topo01` (der wiederum von `getIntWithIntenet.sh`
  ermittelt wird, siehe [Aufgabenblatt 01](01-netzwerkgrundlagen-tools.md)).
  Ob der Container selbst uneingeschränkten ausgehenden Internetzugriff auf
  `api.openweathermap.org:80` hat, hängt von der Firewall-/Proxy-Konfiguration
  des produktiven Container-Hosts ab. **Verifiziert (2026-09-09):** im real
  getesteten Container ist ausgehender HTTP-Zugriff auf
  `api.openweathermap.org` uneingeschränkt möglich (produktive
  Container-Hosts können abweichend konfiguriert sein, s. u.). Schlägt die
  Verbindung in Teil 2 fehl, obwohl Teil 1 (rein lokal in `topo01`)
  funktioniert, ist
  das ein Hinweis auf eine restriktive Egress-Regel und kein
  Anwendungsfehler.
- **Timeouts bei manueller Eingabe.** Wie im Hinweistext oben erwähnt,
  gelten für handgetippte Anfragen dieselben Server-seitigen Timeouts wie
  für einen echten Client – bereitet die Anfragezeilen vorher vor.
- **Rate-Limit des gemeinsamen API-Schlüssels.** Der für die Veranstaltung
  bereitgestellte Schlüssel wird von allen Teilnehmenden gemeinsam genutzt;
  bei einer hohen Anzahl gleichzeitiger Anfragen ist ein Rate-Limit von
  OpenWeatherMap nicht auszuschließen (nicht verifiziert, da abhängig von
  aktueller Teilnehmerzahl und OpenWeatherMap-Tarif).

## Quellen

- `mininet-labs/vertiefung/Labor-05-SCT-QUIC-HTTP-REST.tex`
- `mininet-labs/rn-practice/topo01/` (lokale HTTP(S)-Server als Vorstufe)
