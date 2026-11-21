# Meilenstein 2 von 4 · DoH, TLS-Fingerprints und die Uhr

*06 · Advanced: Covert Channels* · [Übersicht des Blatts](index.md)

Diese Seite fragt, was bei verschlüsseltem Verkehr noch sichtbar bleibt, und zeigt, wie sehr Sicherheitsmechanismen von der Systemzeit abhängen.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Verbindungsschicht</div>
</div>
</div>

### Teil 4 – DNS over HTTPS im Vergleich zu klassischem DNS

**Ziel:** Führt DNS-Anfragen über HTTPS durch und analysiert, was im
Mitschnitt im Vergleich zu klassischem DNS noch sichtbar ist.

1. Startet auf `h1` einen Mitschnitt, der klassisches DNS (Port 53) und den
    DoH-Verkehr (TCP/443 zu `1.1.1.1`) zugleich erfasst:

    ```bash
    h1$ sudo rm -f /tmp/dns_plain.pcap
    h1$ sudo tcpdump -i any -w /tmp/dns_plain.pcap "port 53 or host 1.1.1.1"
    ```

2. Löst `example.com` klassisch über den eingetragenen Resolver auf:

    ```bash
    h1$ dig example.com
    ```

3. Wiederholt dieselbe Abfrage über DNS-over-HTTPS:

    ```bash
    h1$ curl -H "accept: application/dns-json" \
        "https://1.1.1.1/dns-query?name=example.com&type=A"
    ```

4. Öffnet den Mitschnitt in Wireshark: Was ist bei der klassischen
    DNS-Anfrage im Klartext sichtbar (Anfragename, Antwort), was ist bei der
    DoH-Anfrage nur noch als TLS-Record erkennbar? Wie unterscheidet sich
    DoH dadurch von klassischem DNS aus Sicht eines mitlesenden Dritten im
    selben Netzsegment?

### Teil 5 – TLS-Fingerprinting mit JA3

**Ziel:** Identifiziert Client-Software anhand ihres TLS-`ClientHello`
mittels JA3-Fingerprint.

1. `jq` und `tshark` sollten bereits installiert sein (siehe Hinweis oben –
    vor dem Start von `topo01`, im Desktop-Terminal; in den Knoten wird nichts
    installiert).

2. Wertet den TLS-Handshake aus einem vorhandenen Mitschnitt aus (z. B. dem
    `dns_plain.pcap`/DoH-Mitschnitt aus Teil 4, sofern er TLS-Verkehr
    enthält):

    ```bash
    h1$ tshark -r /tmp/dns_plain.pcap -Y "tls.handshake.type == 1" \
        -T fields -e ip.src -e tls.handshake.extensions_server_name \
        -e tls.handshake.ciphersuite -e tls.handshake.version
    ```

3. Notiert Unterschiede zwischen `curl`, `wget` und Firefox beim
    TLS-Handshake (Cipher-Suite-Liste, TLS-Erweiterungen, Reihenfolge) – das
    ist die Grundlage, auf der ein JA3-Fingerprint einen Client eindeutig
    erkennen kann, ganz ohne den Server-Namen (SNI) auszuwerten.

4. **Erweiterung (optional, Rechercheaufgabe):** Ein Python-Modul wie `pyja3`
    berechnet aus den obigen Feldern direkt den JA3-Hash. Es ist im Image
    nicht installiert und in den Knoten ohne Internet nicht nachladbar;
    recherchiert daher, wie der Hash aus den Feldern zusammengesetzt wird.

!!! example "Vertiefung (optional): Zwei Programme, zwei Fingerabdrücke"
    Nehmt dasselbe Ziel noch einmal auf, aber mit einem **anderen** Programm –
    z. B. einmal mit `curl` und einmal mit `openssl s_client` oder `wget`.
    Vergleicht die ClientHello-Felder beider Mitschnitte nebeneinander.

    Zwei Beobachtungen lohnen die Mühe: Erstens unterscheiden sich die
    Fingerabdrücke deutlich, obwohl beide Programme *dasselbe* tun. Zweitens
    bleibt der Fingerabdruck eines Programms gleich, egal welche Seite ihr
    ansteuert.

    Überlegt, was daraus folgt: Der Fingerabdruck verrät nichts über den
    **Inhalt** der Verbindung – aber sehr wohl, **womit** sie aufgebaut
    wurde. Was bedeutet das für jemanden, der verschlüsselten Verkehr
    beobachtet, ihn aber nicht entschlüsseln kann?

### Teil 6 – Zeitabhängige Prüfungen: Wenn die Uhr nicht stimmt

**Ziel:** Ihr beobachtet, dass Zertifikatsprüfung (und jede andere
zeitabhängige Sicherheitsprüfung) stillschweigend voraussetzt, dass die Uhr
stimmt – und was passiert, wenn ein Angreifer (z. B. über einen gefälschten
NTP-Server) die Uhr eines Opfers verstellt. Ihr tut das, **ohne** die
Systemuhr zu verstellen.

!!! info "Warum ihr die Uhr nicht verstellen könnt"
    `date -s` und `timedatectl` scheitern im Container mit `Operation not
    permitted`. Das ist Absicht: Die Wanduhr (`CLOCK_REALTIME`) gehört zu
    keinem Namensraum (Namespace), sie ist für den **gesamten Knoten**
    gemeinsam. Würdet ihr sie im Container verstellen, liefe die Uhr aller
    anderen Sitzungen auf dem Knoten mit falsch – samt deren
    Zertifikatsprüfung. Stattdessen verstellt ihr die Zeit nur **für einen
    einzelnen Prozess**: `faketime` lädt eine Bibliothek, die die
    Zeit-Abfragen genau dieses Programms abfängt. Für das Programm sieht das
    aus wie eine falsche Systemuhr; der Rest des Systems merkt nichts. Alle
    Befehle laufen als normaler Benutzer, ohne `sudo`.

    ```bash
    date -s "next monday 10:00"                 # scheitert: Operation not permitted
    date                                        # die echte Zeit
    faketime '2035-01-01 10:00:00' date         # nur dieser Prozess "lebt" 2035
    ```

1. **Ein Zertifikat mit kurzer Lebensdauer erzeugen.** Legt ein
    selbstsigniertes Zertifikat an, das einen Tag gültig ist, und lest das
    Gültigkeitsfenster aus:

    ```bash
    mkdir -p ~/zeit && cd ~/zeit
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

    *Erwartet:* `Verification: OK`, dann `certificate has expired` (Code 10),
    dann `certificate is not yet valid` (Code 9). Das ist derselbe Server und
    dasselbe Zertifikat – nur die Uhr des **Clients** unterscheidet sich.

    Dasselbe mit `curl` (hier ist der Rückgabecode 60 der Beleg):

    ```bash
    curl -sS -o /dev/null -w '%{http_code}\n' --cacert c.pem https://localhost:8443/; echo "Exit: $?"
    faketime -f '+3d' curl -sS -o /dev/null -w '%{http_code}\n' --cacert c.pem https://localhost:8443/; echo "Exit: $?"
    ```

    *Erwartet:* beim ersten Aufruf `200` und `Exit: 0`. Beim zweiten Aufruf
    (Uhr drei Tage vor) `000` (keine Antwort), die Meldung `curl: (60) SSL
    certificate problem: certificate has expired` und `Exit: 60`.

    Beendet den Server danach: `jobs -l` zeigt seine PID, dann `kill <PID>`.

4. **Ein echter Server im Internet** (nur wenn euer Knoten das Internet
    erreicht, z. B. `h1`):

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
    `Certificate will expire`, Rückgabe 1.

6. **Erweiterung (Denkaufgabe):** Ein Angreifer, der einem Client einen
    gefälschten NTP-Server unterschiebt, verstellt dessen Uhr genau so wie
    `faketime` die Uhr eines Prozesses. Welche der Beobachtungen aus 3 und 4
    entspricht einem Angriff, der ein **abgelaufenes, gestohlenes**
    Zertifikat wieder „gültig" machen soll – Zukunft oder Vergangenheit? Und
    warum bringt es einem Angreifer nichts, die Uhr in die Zukunft zu
    stellen, wenn er ein *noch nicht gültiges* Zertifikat benutzen will?

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
