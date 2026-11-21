# Meilenstein 2 von 3 · SYN-Flood

*05 · ARP-Spoofing & Denial-of-Service* · [Übersicht des Blatts](index.md)

Hier erzeugt ihr selbst einen SYN-Flood gegen einen eigenen Server und beobachtet, wie halboffene Verbindungen den Dienst blockieren.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Anwendungsschicht</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Netzwerkschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Verbindungsschicht</div>
</div>
</div>

### Teil C — SYN-Flood-DoS mit `hping3` (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt einen SYN-Flood gegen einen eigenen Server
      fahren und beobachten, wie halboffene Verbindungen den Dienst für
      legitime Nutzer:innen blockieren.
    - **Wozu?** – SYN-Flood ist einer der häufigsten Gründe, warum Webserver
      in freier Wildbahn ausfallen. Wer die Mechanik einmal selbst erzeugt
      hat, erkennt sie in echten Logs und Mitschnitten wieder und versteht,
      warum SYN-Cookies ([Teil E](m3-verteidigen.md#teil-e-syn-flood-quantitativ-den-schaden-messen-und-syn-cookies-wirken-sehen-topo02)) die Standardabwehr des Linux-Kernels sind.
    - **Vorwissen** – Der TCP-Drei-Wege-Handshake aus
      [Lab 04](../04-tcp-udp-congestion/index.md), HTTP-Zugriff mit `curl`/Browser aus
      [Lab 01](../01-netzwerkgrundlagen-tools/index.md).

!!! info "Werkzeug: `hping3`"
    Ein Paketgenerator, mit dem sich einzelne TCP/IP-Pakete frei
    zusammenbauen lassen – hier auf der Transportschicht (Schicht 4), um
    reine SYN-Pakete ohne vollständigen Handshake zu verschicken.

    Aufruf-Muster: `hping3 -c <n> -d <bytes> -S -w <fenster> -p <port> --flood --rand-source <ziel>`

    - `-c <n>` – Anzahl der zu sendenden Pakete.
    - `-d <bytes>` – Nutzlast je Paket in Byte.
    - `-S` – setzt nur das SYN-Flag (Verbindungsaufbau, keine Nutzdaten).
    - `-w <fenster>` – TCP-Fenstergröße im SYN-Paket.
    - `-p <port>` – Zielport (hier `80` für HTTP).
    - `--flood` – sendet ohne Rücksicht auf Antworten so schnell wie möglich.
    - `--rand-source` – täuscht für jedes Paket eine andere, zufällige
      Absender-IP vor.

    Echte Ausgabe (Angreifer `h0`, 3 Sekunden Flood gegen `10.0.10.11`,
    beendet mit `Strg+C`):

    ```
    HPING 10.0.10.11 (h0-eth0 10.0.10.11): S set, 40 headers + 120 data bytes
    hping in flood mode, no replies will be shown

    --- 10.0.10.11 hping statistic ---
    181024 packets transmitted, 0 packets received, 100% packet loss
    round-trip min/avg/max = 0.0/0.0/0.0 ms
    ```

    Gelesen: In nur 3 Sekunden wurden 181.024 SYN-Pakete verschickt – `0
    packets received` ist dabei **kein Fehler**, sondern erwartet: `--flood`
    wertet Antworten gar nicht erst aus, und `--rand-source` sorgt zusätzlich
    dafür, dass etwaige Antworten an erfundene Absender-IPs gehen, die
    `h0` nie erreichen.

    **Hintergrund:** `--rand-source` ist kein Detail, sondern der Kern des
    Angriffs. Ohne es käme entweder ein `RST` von der echten festen Quelle
    zurück (das gäbe den halboffenen Slot sofort wieder frei) oder die Quelle
    wäre trivial zu sperren. Dass die vorgetäuschten Absender-IPs im
    Testnetz gar nicht existieren, ist hier unkritisch, zeigt aber zugleich,
    warum echte Netze IP-Spoofing über Ingress-Filterung an der Netzgrenze
    (BCP 38) unterbinden.

[Teil A](m1-arp-spoofing.md#teil-a-arp-spoofing-als-aufwarmubung-zwei-netz-routing-topologie) und B haben gezeigt, wie ein Angreifer im selben Segment den
Datenverkehr eines Opfers umleiten kann (ARP-Spoofing). Dieser Teil
wechselt die Angriffsart: Statt Verkehr umzuleiten, überflutet ihr einen
Server mit halboffenen Verbindungen, bis er keine neuen Clients mehr
annehmen kann (Denial-of-Service). Nutzt weiterhin die aus [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) laufende
`topo02`-Topologie.

1. **Ziel-Server prüfen:** Der HTTP-Dienst aus [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) läuft auf `h1`
    normalerweise noch (er startet automatisch mit der Topologie). Prüft das
    zuerst, statt ihn blind neu zu starten:

    ```bash
    h1$ pgrep -f startHTTPD.py || python3 startHTTPD.py
    ```

2. **Normalverhalten prüfen:** Öffnet im Terminal von `h3` Firefox und ruft
    `http://10.0.10.11` auf, um den Dienst zu testen:

    ```bash
    h3$ firefox-esr http://10.0.10.11 &
    ```

    Schließt Firefox danach wieder, damit sich der Effekt des Angriffs im
    nächsten Schritt klarer beobachten lässt.

3. **SYN-Flood starten:** Als Angreifer agiert `h0` gegen den HTTP-Server
    auf `h1` (`10.0.10.11`):

    ```bash
    h0$ hping3 -c 15000 -d 120 -S -w 64 -p 80 --flood --rand-source 10.0.10.11
    ```

    Siehe Werkzeug-Steckbrief oben für die Bedeutung der Optionen und eine
    echte Beispielausgabe.

4. **Wirkung beobachten:** Öffnet erneut Firefox auf `h3` und versucht,
    `http://10.0.10.11` erneut aufzurufen. Öffnet zusätzlich in der
    Mininet-Konsole ein weiteres Terminal für `h1` (`mininet> xterm h1`,
    siehe [Lab 01](../01-netzwerkgrundlagen-tools/index.md)), startet dort
    `wireshark &` und beobachtet die Quelladressen der eingehenden
    SYN-Pakete – das ist IP-Spoofing sichtbar im Mitschnitt. Rechnet damit,
    dass Wireshark unter der Last des Angriffs nicht mehr flüssig läuft.

5. **Angriff beenden** (`Strg+C` im Terminal von `h0`; der Flood belastet
    sonst die CPU des ganzen Desktops) und die Erholung des Ziels bestätigen
    (`http://10.0.10.11` erneut in Firefox aufrufen).

**Aufgabe:** Erklärt, warum `--rand-source` den Angriff wirksamer macht als
ein SYN-Flood von einer einzelnen, festen Quell-IP, und welche Gegenmaßnahme
(SYN-Cookies) der Linux-Kernel dagegen anbietet.

!!! note "Alternative Beobachtung ohne Browser"
    Wer den Effekt lieber quantitativ statt über den Browser beobachten
    möchte, kann zusätzlich auf `h1` mit `ss -tan state syn-recv | wc -l`
    den Anstieg halboffener Verbindungen zählen und mit `curl`/`nc` prüfen,
    ob eine neue, legitime Verbindung noch rechtzeitig zustande kommt —
    dieselbe Messung, die [Teil E](m3-verteidigen.md#teil-e-syn-flood-quantitativ-den-schaden-messen-und-syn-cookies-wirken-sehen-topo02) im Detail vertieft.

!!! example "Vertiefung (optional): Warum ihr das hier überhaupt dürft"
    ARP-Spoofing und SYN-Flood sind in diesem Aufgabenblatt keine
    Simulation, sondern laufen als echte Angriffe gegen echte Prozesse –
    das ist nur vertretbar, weil jede:r Teilnehmer:in eine eigene, komplett
    isolierte Mininet-Netzwerk-Namespace-Umgebung bekommt, statt sich einen
    gemeinsamen physischen Laborrechner mit anderen zu teilen. Nutzt das
    aus: Wiederholt Teil C, aber startet den SYN-Flood diesmal *ohne*
    `--rand-source` (also von einer festen Quell-IP) und beobachtet mit
    `ss -tan state syn-recv | wc -l` auf `h1`, wie sich die Zahl
    halboffener Verbindungen im Vergleich zum Angriff mit gefälschten
    Absendern entwickelt. Kombiniert anschließend [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) und Teil C: Lasst
    den ARP-Spoofing-Angriff aus [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) weiterlaufen, während ihr den
    SYN-Flood aus Teil C startet – bricht dadurch auch der (weiterhin
    funktionierende) Webserver auf `h1` unter der Last zusammen, oder
    bleibt nur die MITM-Umleitung bestehen? In einem gemeinsam genutzten
    Netz wäre schon der erste Versuch nicht erlaubt gewesen.

!!! success "Meilenstein 2 geschafft"
    **Das habt ihr gelernt:**

    - Ein SYN-Flood erschöpft Ressourcen des Servers durch viele halboffene Verbindungen im TCP-Drei-Wege-Handshake.
    - Mit hping3 lässt sich ein solcher Flood gegen einen eigenen Server erzeugen.
    - Legitime Clients bekommen während des Angriffs keine Verbindung mehr, der Dienst ist für sie praktisch nicht erreichbar.

    **Was Meilenstein 3 verspricht:** Der nächste Meilenstein wechselt die Seite: Ihr erkennt beide Angriffe als Verteidiger, messt ihren Schaden in Zahlen und prüft Gegenmaßnahmen wie SYN-Cookies und feste ARP-Einträge auf ihre tatsächliche Wirkung.

    [Weiter zu Meilenstein 3: Erkennen, messen, verteidigen](m3-verteidigen.md){ .md-button }
