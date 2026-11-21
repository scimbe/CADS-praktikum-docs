# Meilenstein 1 von 3 · HTTP von Hand: lokal, REST, TLS

*07 · HTTP/REST/QUIC von Hand* · [Übersicht des Blatts](index.md)

Hier sprecht ihr HTTP ohne Browser selbst, lokal, gegen eine echte REST-API und über TLS.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Verbindungsschicht</div>
</div>
</div>

### Teil 1 – Manuelles HTTP gegen die lokale Gegenstelle (topo01)

Bevor ihr gegen einen echten, externen Server sprecht, übt den Ablauf zuerst
gegen die euch bereits aus [Aufgabenblatt 01](../01-netzwerkgrundlagen-tools/index.md)
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

    !!! warning "Prozesse beenden: nie `pkill` oder `killall`"
        Nie `pkill`/`killall` benutzen – die Mininet-Knoten teilen sich die
        Prozessliste mit eurem Desktop; `pkill` kann euren ganzen Desktop
        beenden und euch abmelden. Beendet Prozesse mit ++ctrl+c++ oder
        `kill <PID>`. Den Server oben beendet ihr mit `kill <PID>` (die PID
        zeigt `jobs -l`). Beendet ihn nach Teil 1, wenn
        beim Neustart `Address already in use` erscheint, und wartet notfalls
        etwa eine Minute.

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

    !!! note "Namen h1/h2 und die numerische Adresse"
        `topo01` startet auf `h1` einen DNS-Forwarder, der die Namen `h1` und
        `h2` auflöst; `netcat h1 80` erreicht den Server damit direkt. Ihr
        könnt ebenso die numerische Adresse verwenden, z. B.
        `netcat 10.0.1.2 80`.

    ![Terminalfenster "Node: h2": Ausgabe von netcat 10.0.1.2 80 mit Request (GET / HTTP/1.1, Host: h1) und der kompletten Antwort inkl. Status-Zeile "HTTP/1.0 200 OK", Headern (Cache-Control, Server, Date, Content-Type, Content-Length) und dem Beginn des HTML-Bodys](../../assets/screenshots/07-http-rest-quic/netcat-manual-http.png)
    *Echte, von Hand über `netcat` gesprochene HTTP/1.1-Anfrage gegen den
    lokalen Server auf `h1` – Status-Zeile, Header, Leerzeile und HTML-Body
    sind vollständig sichtbar, genau wie ein Browser sie normalerweise
    verborgen im Hintergrund verarbeitet.*

    Die Statuszeile lautet `HTTP/1.0 200 OK`: Der einfache Python-Server
    antwortet in HTTP/1.0 und schließt danach die Verbindung. Eure Anfrage
    war trotzdem gültiges HTTP/1.1.

4. Alternativ mit `telnet`, falls installiert (optional, `netcat` genügt),
    identisch:

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
    funktioniert bzw. keine sinnvolle Antwort liefert. (Der Start fragt nach
    der Passphrase `mininet`, siehe Teil 3. Beendet den Server danach mit
    ++ctrl+c++.)

    !!! note "Warum das nicht funktioniert"
        Netcat und Telnet sprechen nur rohes TCP, keinen TLS-Handshake. HTTPS
        verlangt aber, dass zuerst eine TLS-Sitzung aufgebaut wird, bevor die
        HTTP-Anfrage im Klartext hineingereicht werden kann. Für eine
        manuelle HTTPS-Anfrage bräuchtet ihr ein Werkzeug, das TLS selbst
        terminiert (z. B. `openssl s_client -connect h1:443`, danach die
        HTTP-Zeilen wie gewohnt eintippen). Das ist ein guter Beleg dafür,
        *warum* HTTP und Transportsicherheit (TLS) getrennte Schichten sind.

!!! question "Kurz nachgedacht"
    Ein Browser blendet Status-Zeile, Header und Leerzeile normalerweise
    komplett aus – ihr habt sie gerade von Hand getippt und gelesen. Welchen
    Teil dieser Anfrage hättet ihr vergessen, wenn ein Browser euch nicht
    automatisch geholfen hätte?

### Teil 2 – Manuelles HTTP/REST gegen die externe OpenWeatherMap-API

Diesen Teil bearbeitet ihr auf `h1` in `topo01`: Nur `h1` hat über den
NAT-Uplink einen Weg ins Internet, und der DNS-Forwarder auf `h1` löst auch
externe Namen wie `api.openweathermap.org` auf. `h2` hat keine Route nach
draußen. Startet `topo01` wie in Teil 1 und arbeitet im Terminal von `h1`.

!!! note "Voraussetzungen"
    - `netcat` ist installiert; `telnet` ist optional.
    - Ein API-Schlüssel für OpenWeatherMap. Den Schlüssel für die
      Veranstaltung bekommt ihr zu Beginn des Termins von den Lehrenden; er
      steht bewusst nicht in diesem öffentlichen Blatt. Setzt ihn überall
      dort ein, wo unten `YOUR_API_KEY` steht
      (bei Bedarf könnt ihr auch kostenlos einen eigenen unter
      [openweathermap.org/appid](https://openweathermap.org/appid)
      registrieren).

1. Baut von `h1` aus eine rohe TCP-Verbindung zum API-Server auf:

    ```bash
    h1$ nc api.openweathermap.org 80
    ```

    oder

    ```bash
    h1$ telnet api.openweathermap.org 80
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

4. Bei dieser API wählt der Query-Parameter `mode` das Antwortformat
    (`mode=xml`); ohne `mode` kommt JSON. Vergleicht JSON- und XML-Antwort:

    ```text
    GET /data/2.5/weather?q=CITY_NAME&appid=YOUR_API_KEY&mode=xml HTTP/1.1
    Host: api.openweathermap.org
    ```

    Probiert zusätzlich eine Anfrage mit der Zeile `Accept: application/xml`
    und vergleicht, ob sich etwas ändert.

5. Zeichnet den gesamten Vorgang mit Wireshark mit (Filter z. B. auf
    `tcp.port == 80` oder die aufgelöste IP der API) und vergleicht die
    Rohdaten mit der euch angezeigten Konsolenausgabe.

6. Probiert eigenständig weitere Endpunkte der API aus (Dokumentation:
    [openweathermap.org/current](https://openweathermap.org/current)).

!!! example "Vertiefung (optional): Wenn die API nein sagt"
    Bisher habt ihr nur den Erfolgsfall gesehen – ein Programm, das nur den
    Rumpf ausgibt, zeigt ohnehin keine Statuszeile. Wiederholt eure Abfrage mit `curl -i`, damit
    Statuszeile und Kopfzeilen sichtbar werden.

    Provoziert dann Fehler und schaut euch jeweils **beides** an, Status und
    Rumpf: ein absichtlich falscher API-Schlüssel, ein Ort, den es nicht
    gibt, ein Parameter, den ihr weglasst. Notiert, welcher Statuscode
    jeweils kommt.

    Achtet zuletzt auf Kopfzeilen, die etwas über Grenzen sagen (Namen mit
    `RateLimit` oder `Retry-After`). Ein Programm, das nur den Rumpf liest
    und den Status wegwirft, hält eine Fehlermeldung für ein Ergebnis –
    REST ist HTTP, und der Statuscode ist Teil der Antwort.

!!! example "Stretch Goal (optional): Euer eigener HTTP-Client"
    Ihr habt HTTP jetzt zweimal von Hand getippt – gegen `h1` in Teil 1 und
    gegen eine echte API in Teil 2. Schreibt als freiwilliges Stretch-Goal
    ein kleines Skript (Bash mit `netcat` reicht, Python geht auch), das
    Host, Pfad und Query-Parameter als Argumente entgegennimmt, daraus eine
    korrekte HTTP/1.1-Anfrage inklusive `Host`-Header und abschließender
    Leerzeile zusammensetzt und über `netcat` verschickt. Prüft euer Skript
    gegen beide Gegenstellen aus diesem Aufgabenblatt. Das ist – anders als
    die Pflichtaufgaben oben – kein Teil des regulären Bewertungspfads.

### Teil 3 – Manuelles HTTP *über TLS* mit `openssl s_client` (`topo01`)

Teil 1 hat gezeigt, dass reines Netcat/Telnet gegen den HTTPS-Server nicht
funktioniert, weil beide keinen TLS-Handshake sprechen. In diesem Teil holt
ihr genau das nach: `openssl s_client` übernimmt den TLS-Handshake für
euch und reicht euch danach eine ganz normale, unverschlüsselte Textleitung
weiter, auf der ihr – wie in Teil 1, nur jetzt tatsächlich über HTTPS – die
HTTP-Anfrage von Hand eintippt.

Startet `topo01`, falls nicht mehr aktiv:

```bash
cd ~/rn-practice/topo01
./start-topo01.sh
```

Startet auf `h1` denselben HTTPS-Server, den ihr schon aus
[Aufgabenblatt 01](../01-netzwerkgrundlagen-tools/index.md) kennt:

```bash
h1$ python3 startHTTPsServer.py
```

Der HTTPS-Server läuft im Vordergrund. Beendet ihn mit ++ctrl+c++, bevor ihr
[Teil 4](m2-http2-http3-quic.md#teil-4-dieselbe-seite-uber-http11-und-http2-topo01) startet: Er und `startHTTP3Server.sh` brauchen beide TCP-Port 443,
sonst bricht nginx mit `Address already in use` ab.

!!! warning "PEM-Passphrase erforderlich"
    Der Server fragt beim Start interaktiv nach einer Passphrase für
    `key.pem`, bevor er auf Port 443 lauscht. Die
    Passphrase ist **`mininet`**. Ohne sie bleibt der Server hängen und
    öffnet nie einen Port – dieselbe Voraussetzung gilt auch für den
    bereits bestehenden HTTPS-Schritt in
    [Aufgabenblatt 01, Teil 2, Aufgabe 10](../01-netzwerkgrundlagen-tools/m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01).

Baut von `h2` aus eine TLS-Verbindung zu `h1` auf:

```bash
h2$ openssl s_client -connect 10.0.1.2:443
```

Beobachtet zunächst den ausgegebenen Zertifikats-Handshake, **bevor** ihr
irgendetwas eintippt – ihr solltet dieselben unsinnigen Zertifikatsangaben
(`CN=noway`, `O=Not your buisness`) sehen, die euch in
[Aufgabenblatt 01, Aufgabe 10](../01-netzwerkgrundlagen-tools/index.md) bereits im
Browser als Warnung begegnet sind, sowie eine Zeile
`verify error:num=18:self-signed certificate`. Tippt dann direkt die
HTTP-Anfrage von Hand ein (analog zu Teil 1, inklusive der abschließenden
Leerzeile):

```text
GET / HTTP/1.1
Host: h1
Connection: close

```

**Aufgabe:** Vergleicht die Antwort mit der aus Teil 1 (reines HTTP gegen
denselben Server auf Port 80). Ist der HTTP-Teil der Antwort (Status-Zeile,
Header, Body) identisch? Was genau hat `openssl s_client` für euch
übernommen, das bei purem `netcat`/`telnet` fehlte?

!!! question "Kurz nachgedacht"
    `openssl s_client` hat den TLS-Handshake übernommen, die HTTP-Zeilen
    danach habt ihr wieder selbst getippt. Was genau bleibt an HTTP
    unverändert, egal ob es über reines TCP (Teil 1) oder über TLS (dieser
    Teil) läuft – und was ändert TLS wirklich?

!!! success "Meilenstein 1 geschafft"
    **Das habt ihr gelernt:**

    - HTTP ist ein textbasiertes Protokoll: Request-Line, Header, Leerzeile, optionaler Body; die Antwort ist ähnlich aufgebaut.
    - Query-Strings und der Accept-Header steuern bei REST-Abfragen Inhalt und Format der Antwort, etwa JSON oder XML.
    - Mit openssl s_client übernimmt ein Werkzeug den TLS-Handshake, danach sprecht ihr wieder normales Klartext-HTTP.

    **Was Meilenstein 2 verspricht:** Der nächste Meilenstein vergleicht die HTTP-Versionen: HTTP/1.1 und HTTP/2 über TCP, HTTP/3 über QUIC und damit UDP. Das HTTP-Grundwissen von hier ist dafür die Voraussetzung.

    [Weiter zu Meilenstein 2: HTTP/2, HTTP/3 und QUIC](m2-http2-http3-quic.md){ .md-button }
