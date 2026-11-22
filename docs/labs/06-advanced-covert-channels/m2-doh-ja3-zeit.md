# Meilenstein 2 von 4 · DoH, TLS-Fingerprints und die Uhr

*06 · Advanced: Covert Channels* · [Übersicht des Blatts](index.md)

Diese Seite fragt, was bei verschlüsseltem Verkehr noch sichtbar bleibt, und zeigt, wie sehr Sicherheitsmechanismen von der Systemzeit abhängen.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 4 – DNS over HTTPS im Vergleich zu klassischem DNS

**Ziel:** Führt DNS-Anfragen über HTTPS durch und analysiert, was im
Mitschnitt im Vergleich zu klassischem DNS noch sichtbar ist.

Dieser Teil braucht die laufende Topologie `topo01` (`cd ~/rn-practice/topo01`,
`./start-topo01.sh`) und **zwei** `h1`-Fenster: Der Mitschnitt blockiert sein
Fenster, `dig` und `curl` laufen parallel in einem zweiten. Öffnet es mit
++ctrl+shift+t++ im `h1`-Fenster (neuer Tab im selben Knoten) oder mit
`mininet> xterm h1`; Hilfe beim Wiederfinden gibt
[Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).

1. Startet im ersten `h1`-Fenster einen Mitschnitt, der klassisches DNS
    (Port 53) und den DoH-Verkehr (TCP/443 zu `1.1.1.1`) zugleich erfasst:

    ```bash
    h1$ sudo rm -f /tmp/dns_plain.pcap
    h1$ sudo tcpdump -i any -w /tmp/dns_plain.pcap "port 53 or host 1.1.1.1"
    ```

    `tcpdump` meldet dabei `Promiscuous mode not supported on the "any"
    device`: Das ist bei `-i any` normal und harmlos, der Mitschnitt läuft.

2. Löst im zweiten `h1`-Fenster `example.com` klassisch über den
    eingetragenen Resolver auf:

    ```bash
    h1$ dig example.com
    ```

3. Wiederholt dieselbe Abfrage über DNS-over-HTTPS:

    ```bash
    h1$ curl -H "accept: application/dns-json" \
        "https://1.1.1.1/dns-query?name=example.com&type=A"
    ```

    Die Antwort ist ein JSON-Text ohne abschließenden Zeilenumbruch: Der
    nächste Prompt klebt direkt hinter dem letzten `}`. Das ist normal; mit
    `-w '\n'` am Ende des `curl`-Aufrufs bekommt ihr einen Zeilenumbruch.

4. Beendet den Mitschnitt im ersten Fenster mit ++ctrl+c++ und öffnet ihn
    in Wireshark (`h1$ wireshark /tmp/dns_plain.pcap`; alternativ
    `tshark -r /tmp/dns_plain.pcap`). Beachtet: Der Resolver in `h1` ist
    `dnsmasq`. `dig` fragt ihn (Adresse `10.0.1.2`), und er leitet die
    Anfrage selbst weiter (Absender `10.0.5.2`). Deshalb seht ihr für eine
    Abfrage vier statt zwei DNS-Pakete (sofern der Name noch nicht in
    `dnsmasq` zwischengespeichert ist; sonst antwortet er direkt, und es
    bleiben zwei); bei `-i any` erscheinen dieselben
    Pakete ggf. zusätzlich auf mehreren Schnittstellen. Was ist bei der klassischen
    DNS-Anfrage im Klartext sichtbar (Anfragename, Antwort), was ist bei der
    DoH-Anfrage nur noch als TLS-Record erkennbar? Wie unterscheidet sich
    DoH dadurch von klassischem DNS aus Sicht eines mitlesenden Dritten im
    selben Netzsegment?

    In Wireshark sind beim DoH-Teil womöglich viele Zeilen rot oder schwarz
    markiert (`TCP Retransmission`, `Previous segment not captured`). Das
    ist kein Fehler eurer Übung: Mit `-i any` kann dasselbe Paket auf
    mehreren Schnittstellen erscheinen, und Wireshark deutet das als
    Wiederholung. Die Daten sind trotzdem angekommen. Klickt für die
    Auswertung ein DNS-Paket mit der Antwort und ein `Application Data`-Paket
    der TLS-Verbindung an und vergleicht deren Inhalt.

### Teil 5 – TLS-Fingerprinting mit JA3

**Ziel:** Identifiziert Client-Software anhand ihres TLS-`ClientHello`
mittels JA3-Fingerprint.

1. `jq` und `tshark` sollten bereits installiert sein (siehe den Werkzeug-
    Kasten am Anfang der [Übersicht](index.md) – prüfen vor dem Start von
    `topo01`, im Desktop-Terminal; in den Knoten wird nichts installiert).

2. Wertet den TLS-Handshake aus einem vorhandenen Mitschnitt aus (z. B. dem
    `dns_plain.pcap`/DoH-Mitschnitt aus Teil 4, sofern er TLS-Verkehr
    enthält):

    ```bash
    h1$ tshark -r /tmp/dns_plain.pcap -Y "tls.handshake.type == 1" \
        -T fields -e ip.src -e tls.handshake.extensions_server_name \
        -e tls.handshake.ciphersuite -e tls.handshake.version
    ```

    Die Spalte mit dem Servernamen (SNI) bleibt hier leer: `curl` hat in
    Teil 4 eine IP-Adresse statt eines Namens angesprochen, also gibt es
    keinen Servernamen zu senden. Die Warnung `Running as user "root" …
    dangerous` kommt daher, dass die Knotenfenster als `root` laufen; für
    diese Übung ist sie harmlos.

3. Notiert Unterschiede zwischen `curl`, `openssl s_client` und Firefox beim
    TLS-Handshake (Cipher-Suite-Liste, TLS-Erweiterungen, Reihenfolge) – das
    ist die Grundlage, auf der ein JA3-Fingerprint einen Client eindeutig
    erkennen kann, ganz ohne den Server-Namen (SNI) auszuwerten. Dafür nehmt ihr eigenen Verkehr auf; nutzt
    wieder zwei `h1`-Fenster (Mitschnitt im ersten, die Clients im zweiten):

    ```bash
    h1$ sudo rm -f /tmp/ja3.pcap
    h1$ sudo tcpdump -U -i any -w /tmp/ja3.pcap "tcp port 443" &
    h1$ curl -sS -o /dev/null https://www.wikipedia.org
    h1$ echo | openssl s_client -connect www.wikipedia.org:443 -servername www.wikipedia.org > /dev/null 2>&1
    h1$ sudo rm -f /tmp/ff.png
    h1$ sudo -u cads env DISPLAY=$DISPLAY HOME=/config firefox-esr --headless --screenshot /tmp/ff.png https://www.wikipedia.org
    ```

    Firefox startet in einem Knotenfenster nicht, wenn ihr ihn direkt als
    `root` aufruft (`Running Firefox as root in a regular user's session is
    not supported`). Der Aufruf über `sudo -u cads` startet ihn als normalen
    Benutzer. Mit sichtbarem Fenster geht es entsprechend:
    `sudo -u cads env DISPLAY=$DISPLAY HOME=/config firefox-esr https://www.wikipedia.org &`
    (dann Seite laden lassen und das Firefox-Fenster wieder schließen).

    Der Hintergrund-`tcpdump` schreibt seine Meldung in die Eingabezeile, und
    die nächsten Befehle sehen dann durcheinander aus. Drückt ++enter++ und
    prüft, dass ein sauberer Prompt dasteht; die Befehle laufen trotzdem.

    Beendet danach den Mitschnitt (`jobs -l` zeigt die PID, dann
    `kill <PID>`; zeigt `jobs -l` die PID von `sudo`, beendet `kill` darauf
    den Mitschnitt ebenfalls) und lest je `ClientHello` den JA3-Hash und
    den Servernamen aus:

    ```bash
    h1$ tshark -r /tmp/ja3.pcap -Y "tls.handshake.type == 1" \
        -T fields -e frame.number -e tls.handshake.extensions_server_name \
        -e tls.handshake.ja3
    ```

    Notiert euch die Hashes von `curl`, `openssl s_client` und Firefox
    nebeneinander: Erst im Vergleich sagen die langen Zeichenketten etwas
    aus. (Firewalls und Bot-Abwehr nutzen solche Fingerabdrücke, um z. B.
    `curl` von einem Browser zu unterscheiden.)

    `-e tls.handshake.ja3_full` zeigt zusätzlich die Zeichenkette, aus der
    der Hash gebildet wird (TLS-Version, Cipher-Suites, Erweiterungen,
    Kurven, Punktformate). Firefox sendet neben der Seite selbst auch
    Verbindungen zu eigenen Diensten (z. B. `mozilla.net`); ordnet die
    Zeilen über den Servernamen zu.

4. **Erweiterung (optional, Rechercheaufgabe):** Ein Python-Modul wie `pyja3`
    berechnet aus den obigen Feldern direkt den JA3-Hash. Es ist im Image
    nicht installiert und in den Knoten ohne Internet nicht nachladbar;
    recherchiert daher, wie der Hash aus den Feldern zusammengesetzt wird.

!!! example "Vertiefung (optional): Zwei Programme, zwei Fingerabdrücke"
    Nehmt dasselbe Ziel noch einmal auf, aber mit einem **anderen** Programm –
    z. B. einmal mit `curl` und einmal mit `openssl s_client` oder Firefox
    (Befehle siehe Schritt 3). Vergleicht die ClientHello-Felder der
    Mitschnitte nebeneinander.

    Zwei Beobachtungen lohnen die Mühe: Erstens unterscheiden sich die
    Fingerabdrücke verschiedener Programme, obwohl sie *dasselbe* tun – wie
    deutlich, hängt vom Paar ab: `curl` und `openssl s_client` verwenden
    beide OpenSSL und können dieselbe Cipher-Suite-Liste senden, der Hash
    unterscheidet sich dann nur über andere Felder (z. B. Erweiterungen);
    prüft das in `ja3_full`. Zweitens: Steuert dasselbe Programm mehrere
    Ziele an (z. B. `curl` einmal gegen `example.com`, einmal gegen
    `www.wikipedia.org`), und vergleicht die Hashes. Bei Firefox könnt ihr
    beobachten, ob der Hash je nach Ziel gleich bleibt oder wechselt; das
    kann sich zwischen Seite und Firefox-eigenen Diensten unterscheiden.

    Überlegt, was daraus folgt: Der Fingerabdruck verrät nichts über den
    **Inhalt** der Verbindung – aber sehr wohl, **womit** sie aufgebaut
    wurde. Was bedeutet das für jemanden, der verschlüsselten Verkehr
    beobachtet, ihn aber nicht entschlüsseln kann?

### Teil 6 – Zeitabhängige Prüfungen: Wenn die Uhr nicht stimmt

**Ziel:** Ihr beobachtet, dass Zertifikatsprüfung (und jede andere
zeitabhängige Sicherheitsprüfung) stillschweigend voraussetzt, dass die Uhr
stimmt – und was passiert, wenn ein Angreifer (z. B. über einen gefälschten
NTP-Server) die Uhr eines Opfers verstellt. Ihr tut das, **ohne** die
Systemuhr zu verstellen. (Aus demselben Grund blockiert ein Handy mit
falscher Uhr plötzlich viele HTTPS-Seiten.)

!!! info "Warum ihr die Uhr nicht verstellen könnt"
    `date -s` und `timedatectl` scheitern im Container mit `Operation not
    permitted`. Das ist Absicht: Die Wanduhr (`CLOCK_REALTIME`) gehört zu
    keinem Namensraum (Namespace), sie ist für den **gesamten Knoten**
    gemeinsam. Würdet ihr sie im Container verstellen, liefe die Uhr aller
    anderen Sitzungen auf dem Knoten mit falsch – samt deren
    Zertifikatsprüfung. Stattdessen verstellt ihr die Zeit nur **für einen
    einzelnen Prozess**: `faketime` lädt eine Bibliothek, die die
    Zeit-Abfragen genau dieses Programms abfängt. Für das Programm sieht das
    aus wie eine falsche Systemuhr; der Rest des Systems merkt nichts.

    **Arbeitet in einem normalen Desktop-Terminal** (Prompt `cads@…`), nicht
    in einem Knotenfenster: Dort seid ihr `root` (Prompt `root@…`), und
    `~/zeit` würde `root` gehören. Die Befehle brauchen sonst kein `sudo`.
    Der Internet-Test in Schritt 4 läuft ebenfalls dort. (Hilfe beim
    Wiederfinden der Fenster:
    [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).)

    ```bash
    date -s "next monday 10:00"                 # scheitert: Operation not permitted
    date                                        # die echte Zeit
    faketime '2035-01-01 10:00:00' date         # nur dieser Prozess "lebt" 2035
    ```

    `date -s` druckt vor der Fehlermeldung die gewünschte Zeit
    (z. B. `Mon Nov 23 10:00:00 AM UTC 2026`). Das heißt nicht, dass die Uhr
    gesetzt wurde; entscheidend ist die Zeile `cannot set date: Operation
    not permitted`, und `date` zeigt danach weiter die echte Zeit.

1. **Ein Zertifikat mit kurzer Lebensdauer erzeugen.** Legt ein
    selbstsigniertes Zertifikat an, das einen Tag gültig ist, und lest das
    Gültigkeitsfenster aus:

    ```bash
    sudo rm -rf ~/zeit; mkdir ~/zeit && cd ~/zeit
    openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
      -keyout k.pem -out c.pem -subj /CN=localhost \
      -addext subjectAltName=DNS:localhost -days 1
    openssl x509 -in c.pem -noout -subject -dates
    ```

    Prüft mit `-checkend` (Sekunden ab jetzt), ob das Zertifikat dann noch
    gilt:

    ```bash
    openssl x509 -in c.pem -noout -checkend 0;      echo "Rückgabe: $?"
    openssl x509 -in c.pem -noout -checkend 172800; echo "Rückgabe: $?"
    ```

    *Erwartet:* `Certificate will not expire` (Rückgabe 0) und
    `Certificate will expire` (Rückgabe 1) – in 48 Stunden ist das
    Zertifikat abgelaufen.

    Das `rm -rf` am Anfang räumt Reste aus früheren Versuchen weg: Ein
    altes `~/zeit` kann `root` gehören oder ein altes `c.pem` enthalten
    (dann gäbe es `Permission denied` bzw. falsche Datumswerte). Merkt euch
    außerdem die Bedeutung von `-checkend`: Es fragt, ob das Zertifikat in
    der angegebenen Zeit **nicht mehr gültig** ist, und meldet
    `Certificate will expire` auch dann, wenn es **schon abgelaufen** ist.

2. **Dieselbe Prüfung zu einem anderen Zeitpunkt.** `openssl verify` kennt
    dafür `-attime` (Unix-Zeit):

    ```bash
    openssl verify -CAfile c.pem c.pem
    openssl verify -attime $(date -d '+3 days' +%s) -CAfile c.pem c.pem
    ```

    *Erwartet:* `c.pem: OK`, dann `error 10 … certificate has expired`.

3. **Eine echte TLS-Verbindung bei „falscher Uhr".** Startet einen lokalen
    TLS-Server mit diesem Zertifikat im Hintergrund und verbindet euch mit
    dem Client – einmal mit der echten Zeit, einmal drei Tage in der
    Zukunft, einmal zwei Tage in der Vergangenheit:

    ```bash
    openssl s_server -accept 8443 -cert c.pem -key k.pem -www -quiet >/dev/null 2>&1 &
    echo | openssl s_client -connect localhost:8443 -CAfile c.pem -verify_return_error 2>&1 | grep -E "Verification|Verify return"
    echo | faketime -f '+3d' openssl s_client -connect localhost:8443 -CAfile c.pem -verify_return_error 2>&1 | grep -E "Verification|Verify return"
    echo | faketime -f '-2d' openssl s_client -connect localhost:8443 -CAfile c.pem -verify_return_error 2>&1 | grep -E "Verification|Verify return"
    ```

    *Erwartet:* `Verification: OK`, dann `Verification error: certificate
    has expired` (Code 10), dann `Verification error: certificate is not yet
    valid` (Code 9); je nach OpenSSL-Version steht daneben auch die Zeile
    `Verify return code: <Code> (…)`. Das ist derselbe Server und dasselbe Zertifikat – nur
    die Uhr des **Clients** unterscheidet sich. Eine Uhr in der Zukunft
    macht das Zertifikat „nicht mehr gültig“ (abgelaufen), eine Uhr in der
    Vergangenheit „noch nicht gültig“.

    Dasselbe mit `curl` (hier ist der Rückgabecode 60 der Beleg):

    ```bash
    curl -sS -o /dev/null -w '%{http_code}\n' --cacert c.pem https://localhost:8443/; echo "Exit: $?"
    faketime -f '+3d' curl -sS -o /dev/null -w '%{http_code}\n' --cacert c.pem https://localhost:8443/; echo "Exit: $?"
    ```

    *Erwartet:* beim ersten Aufruf `200` und `Exit: 0`. Beim zweiten Aufruf
    (Uhr drei Tage vor) die Meldung `curl: (60) SSL certificate problem:
    certificate has expired`, danach ein längerer Hilfetext von `curl`, dann
    `000` (keine Antwort) und `Exit: 60`.

    Beendet den Server danach: `jobs -l` zeigt seine PID, dann `kill <PID>`.

4. **Ein echter Server im Internet** (nur wenn euer Rechner das Internet
    erreicht; im Desktop-Terminal ist das der Fall). Der Aufruf mit
    `faketime` dauert einige Sekunden:

    ```bash
    curl -sS -o /dev/null -w '%{http_code}\n' https://example.com
    faketime '2035-01-01 10:00:00' curl -sS -o /dev/null -w '%{http_code}\n' https://example.com
    faketime '2001-01-01 10:00:00' curl -sS -o /dev/null -w '%{http_code}\n' https://example.com
    ```

    *Erwartet:* `200`; dann `curl: (60) SSL certificate problem: certificate
    has expired`; dann `… certificate is not yet valid`. Das Serverzertifikat
    ist gültig und unverändert – nur die Uhr, mit der es geprüft wird, ist
    verstellt.

5. **Ein Zertifikat, das schon abgelaufen ist.** Erzeugt eines „aus der
    Vergangenheit": `faketime` lässt `openssl` glauben, es sei vor zehn Tagen,
    und das Zertifikat gilt sieben Tage:

    ```bash
    faketime '-10 days' openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
      -nodes -keyout k2.pem -out c2.pem -subj /CN=alt -days 7 2>/dev/null
    openssl x509 -in c2.pem -noout -dates
    openssl x509 -in c2.pem -noout -checkend 0; echo "Rückgabe: $?"
    ```

    *Erwartet:* `notBefore` vor zehn Tagen, `notAfter` vor drei Tagen,
    `Certificate will expire`, Rückgabe 1. Das Zertifikat ist bereits
    abgelaufen; `-checkend 0` meldet auch dann „will expire“ (siehe
    Schritt 1).

6. **Erweiterung (Denkaufgabe):** Überlegt zuerst, welche der beiden
    Gültigkeitsgrenzen (`notBefore`, `notAfter`) in den Beobachtungen oben
    jeweils verletzt war. Ein Angreifer, der einem Client einen
    gefälschten NTP-Server unterschiebt, verstellt dessen Uhr genau so wie
    `faketime` die Uhr eines Prozesses. Welche der Beobachtungen aus
    Schritt 3 und 4 (`faketime -f '+3d'` und `'-2d'` bzw. die Jahre 2035 und
    2001) entspricht einem Angriff, der ein **abgelaufenes, gestohlenes**
    Zertifikat wieder „gültig" machen soll – Uhr in der Zukunft oder in der
    Vergangenheit? Und in welche Richtung müsste er die Uhr stellen, wenn er
    ein *noch nicht gültiges* Zertifikat benutzen will (dessen `notBefore`
    in der Zukunft liegt) – und welche Grenze setzt ihm dabei `notAfter`?

!!! question "Kurz nachgedacht"
    Zertifikate prüfen ein Gültigkeitsfenster mit zwei Grenzen (nicht davor,
    nicht danach). Was bedeutet eine Uhr deutlich in der **Vergangenheit**
    für dieselbe Prüfung? Welche anderen Mechanismen hängen ebenfalls von
    einer korrekten Uhr ab (z. B. TOTP-Einmalcodes, die Gültigkeit von
    DNSSEC-Signaturen, Kerberos-Tickets)? Und warum darf ein Programm, das
    die Zeit selbst „anfragen" kann, trotzdem nie der alleinige Garant für
    die Uhrzeit sein?

--8<-- "issue-feedback.md"

!!! success "Meilenstein 2 geschafft"
    **Das habt ihr gelernt:**

    - Bei klassischem DNS sind die Anfragen im Klartext sichtbar, bei DNS over HTTPS nicht mehr.
    - Ein JA3-Fingerprint kennzeichnet einen TLS-Client anhand charakteristischer Merkmale seines ClientHello.
    - Die Zertifikatsprüfung setzt eine korrekte Uhr voraus; wer die Systemzeit manipuliert, unterläuft zeitabhängige Prüfungen.

    **Was Meilenstein 3 verspricht:** Der nächste Meilenstein wechselt von Beobachten zu Selbstbauen: Ihr decodiert den TTL-Kanal vollständig und baut einen DNS-Kanal ohne iodine. Dabei wird sichtbar, wo genau die Daten stecken.

    [Weiter zu Meilenstein 3: Kanäle selbst bauen](m3-kanaele-selbst-bauen.md){ .md-button }
