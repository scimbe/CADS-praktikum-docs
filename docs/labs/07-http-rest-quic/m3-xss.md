# Meilenstein 3 von 3 · Site-Cloning und XSS

*07 · HTTP/REST/QUIC von Hand* · [Übersicht des Blatts](index.md)

Hier seht ihr an einem absichtlich verwundbaren Übungsziel, wie ein ungeprüft übernommener Parameter zu Cross-Site-Scripting führt und wie sich das im Netzwerkverkehr zeigt.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 8 – Site-Cloning und eingeschleustes Skript: XSS im lokalen Übungsziel (`topo01`)

!!! danger "Nur gegen das eigene Übungsziel in dieser Topologie"
    Dieser Teil übt Werkzeuge, die man von Kali Linux kennt (Site-Cloning,
    Cross-Site-Scripting) – ausschließlich gegen einen absichtlich
    verwundbaren Server, den ihr selbst in `topo01` startet. `h2`, von wo aus
    ihr in diesem Teil arbeitet, **kommt nicht ins Internet** (anders als
    `h1`, das für [Teil 2](m1-http-von-hand.md#teil-2-manuelles-httprest-gegen-die-externe-openweathermap-api) eine NAT-Route nach draußen braucht) – ein Aufruf
    gegen ein externes Ziel scheitert von hier aus technisch, nicht nur aus
    Vorsicht. Warum genau, seht ihr in der Gegenprobe in Schritt 6. Übertragt nichts davon auf ein Ziel außerhalb dieser Topologie.

HTTP/REST-Anfragen von Hand zu sprechen (Teile 1–3) heißt auch: zu sehen, was
mit den Daten passiert, die eine Anfrage mitbringt – zum Beispiel ein
Suchbegriff in einer Query-String. Wenn ein Server diesen Wert ungeprüft in
seine HTML-Antwort einbaut, kann die Antwort selbst ausführbaren Code
enthalten: Cross-Site-Scripting (XSS). Dieser Teil zeigt den Netzwerkeffekt
davon – wie ein solcher Payload über die Leitung geht und im Mitschnitt
sichtbar bleibt – nicht Web-Sicherheit als Selbstzweck.

1. Startet `topo01`, falls nicht mehr aktiv, und auf `h1` das absichtlich
   verwundbare Übungsziel (Port 8080, unabhängig vom Server aus [Teil 1](m1-http-von-hand.md#teil-1-manuelles-http-gegen-die-lokale-gegenstelle-topo01) auf
   Port 80):

    ```bash
    cd ~/rn-practice/topo01
    ./start-topo01.sh
    ```

    ```bash
    h1$ cd ~/rn-practice/topo01
    h1$ python3 startXSSLabServer.py &
    ```

    Es erscheint `[uebungsziel] hoert auf Port 8080`.
    Die Fenster `Node: h1` und `Node: h2` liegen nach dem Start übereinander;
    wie ihr sie wiederfindet und sicher tippt, steht unter
    [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).
    `h1$` und `h2$` bedeuten: Befehl im Fenster `Node: h1` bzw. `Node: h2`
    (Prompt `root@…#`).

2. Findet von `h2` aus die reflektierte Lücke in `/suche`: der Parameter `q`
   landet unescaped in der Antwort.

    ```bash
    h2$ curl -s 'http://10.0.1.2:8080/suche?q=<script>alert(1)</script>'
    ```

    Prüft in der Ausgabe: steht `<script>alert(1)</script>` unverändert
    (nicht als `&lt;script&gt;`) im HTML? Genau das ist die Lücke – jeder
    Browser, der diese Antwort rendert, würde das Skript ausführen.

3. Schreibt einen Eintrag ins Gästebuch, der beim nächsten Abruf durch jeden
   Besucher erneut ausgeführt würde (gespeichertes XSS) – als Payload einen
   harmlosen, rein internen Cookie-Mitschnitt statt eines externen Aufrufs:

    ```bash
    h2$ curl -s 'http://10.0.1.2:8080/gaestebuch?name=Angreifer&text=<script>fetch("/sammler?c="%2Bdocument.cookie)</script>'
    h2$ curl -s 'http://10.0.1.2:8080/gaestebuch'
    ```

    Das `+` für die Verkettung steht hier als `%2B`: Der Server liest ein
    rohes `+` in der URL als Leerzeichen, das gespeicherte Skript wäre dann
    syntaktisch ungültig. Das Gästebuch nimmt Einträge per `GET` an (das
    Formular nutzt `method="get"`); deshalb genügt ein Aufruf mit `curl`.
    Einträge bleiben erhalten – wiederholt ihr den Schritt später, steht
    der Eintrag mehrfach in der Seite.

    Der zweite Aufruf zeigt, dass der Eintrag jetzt **dauerhaft** in der
    Seite steht – anders als bei der reflektierten Lücke aus Schritt 2, die
    nur in der eigenen Antwort auftaucht.

4. Simuliert, was ein Browser täte, der diese Seite lädt: er würde das
   eingeschleuste `fetch(...)` ausführen und `document.cookie` an `/sammler`
   schicken. Ruft testweise dieselbe URL wie im Payload direkt auf:

    ```bash
    h2$ curl -s 'http://10.0.1.2:8080/sammler?c=sitzung=demo-uebungswert-42'
    h2$ curl -s 'http://10.0.1.2:8080/sammler/log'
    ```

    `/sammler` ist bewusst derselbe interne Server – der "Diebstahl" bleibt
    innerhalb von `topo01`, es wird nichts exfiltriert. Wer einen grafischen
    Browser zur Hand hat, kann die Seiten stattdessen wirklich öffnen und
    beobachten, dass das eingeschleuste Skript ohne weiteres Zutun feuert.
    Startet den Browser im Fenster `Node: h2` (der Aufruf `h2 firefox-esr …`
    in der Mininet-Konsole startet bei Tests kein Fenster, weil Firefox dort
    als `root` nicht unterstützt wird). Öffnet zuerst `/`, damit das
    Demo-Cookie gesetzt ist, danach das Gästebuch:

    ```bash
    h2$ sudo -u cads env DISPLAY=$DISPLAY HOME=/config firefox-esr http://10.0.1.2:8080/ &
    h2$ sudo -u cads env DISPLAY=$DISPLAY HOME=/config firefox-esr http://10.0.1.2:8080/gaestebuch &
    ```

    Der `fetch`-Aufruf zeigt keinen Dialog; ob er gefeuert hat, seht ihr in
    `/sammler/log`, wo danach neue Einträge stehen. Die reflektierte Lücke
    aus Schritt 2 zeigt dagegen den `alert(1)`-Dialog, wenn ihr
    `http://10.0.1.2:8080/suche?q=<script>alert(1)</script>` öffnet.

5. Schneidet die Strecke zwischen `h1` und `h2` mit, während ihr Schritt 2–4
   wiederholt, und sucht den Payload im Klartext:

    ```bash
    h2$ sudo rm -f /tmp/teil8-xss.pcap
    h2$ sudo tcpdump -i h2-eth0 -w /tmp/teil8-xss.pcap -U &
    # Schritte 2-4 wiederholen
    h2$ sleep 1; jobs -l; kill <PID>
    h2$ tcpdump -n -r /tmp/teil8-xss.pcap -A | grep -E 'script|sammler'
    ```

    Ruft ihr die Seite im Browser auf, kodiert er Sonderzeichen in der URL:
    Aus `<script>` wird `%3Cscript%3E`. Mit `curl` geht der Text so über die
    Leitung, wie ihr ihn tippt. Sucht im Mitschnitt deshalb ggf. auch nach der
    kodierten Form.

    Wartet nach dem Start des Mitschnitts, bis `listening on h2-eth0`
    erscheint, bevor ihr weitertippt; sonst geht der Anfang eurer Eingabe
    verloren. Die `<PID>` lest ihr aus der Ausgabe von `jobs -l` ab (Zahl
    hinter `[1]+`); sie gehört zu `sudo`, `kill` darauf beendet `tcpdump`
    trotzdem. `-n` beim Lesen verhindert, dass `tcpdump` Port 8080 als
    `http-alt` beschriftet.

    **Aufgabe:** Findet im Mitschnitt (a) die Anfrage mit dem reflektierten
    Payload, (b) die Anfrage, die den gespeicherten Payload einträgt, und (c)
    die Anfrage an `/sammler`, die den Cookie-Wert überträgt. Alle drei
    stehen im Klartext auf der Leitung – HTTP verschlüsselt nichts. Was würde
    sich ändern, wenn der Server stattdessen HTTPS spräche (vgl. [Teil 3](m1-http-von-hand.md#teil-3-manuelles-http-uber-tls-mit-openssl-s_client-topo01))?

6. Klont das Übungsziel mit `httrack`, dem Site-Cloning-Werkzeug – dem
   Werkzeug, mit dem man z. B. eine Phishing-Kopie einer Seite erzeugt:

    ```bash
    h2$ mkdir -p ~/rn-practice/topo01/clone-uebungsziel
    h2$ httrack "http://10.0.1.2:8080/" -O ~/rn-practice/topo01/clone-uebungsziel -%v -r1
    h2$ ls ~/rn-practice/topo01/clone-uebungsziel
    ```

    `httrack` braucht etwa eine halbe Minute; tippt den `ls`-Befehl erst, wenn
    der Prompt zurück ist. Die Warnung, dass `httrack` als `root` läuft, könnt
    ihr hier ignorieren.

    **Aufgabe (Gegenprobe):** Versucht denselben Befehl gegen ein Ziel
    außerhalb der Topologie, z. B. `httrack "http://1.1.1.1/" -O /tmp/clone-extern`.
    Vergleicht `ip route` auf `h2` mit dem auf `h1` (`h2$ ip route`, dann
    `h1$ ip route`) und erklärt, warum der zweite Aufruf technisch scheitert,
    während der erste funktioniert. Erwartet keine Fehlermeldung im Klartext:
    `httrack` meldet nur `Done.1.1.1.1/ (0 bytes) - -4`, also null geladene
    Byte und den Fehlercode `-4` (Verbindung fehlgeschlagen). Mehr zeigt
    `ping 1.1.1.1` auf `h2`. Achtet darauf, **wer** den Fehler meldet. `h2`
    hat sehr wohl eine Default-Route; schaut, wohin sie führt, und wer auf
    dem Weg antwortet.

--8<-- "issue-feedback.md"

!!! success "Meilenstein 3 geschafft"
    **Das habt ihr gelernt:**

    - Baut ein Server einen Parameter unescaped in die Antwort ein, entsteht reflektiertes XSS.
    - Beim gespeicherten XSS wird der Payload abgelegt und bei jedem Abruf erneut ausgeliefert.
    - Der Payload geht als normaler HTTP-Verkehr über die Leitung und bleibt im Mitschnitt sichtbar.

    **Abschluss:** Damit schließt das Praktikum: Ihr habt Netzwerke von der Netzzugriffsschicht bis zur Anwendungsschicht selbst aufgebaut und beobachtet und könnt Protokolle im Mitschnitt lesen. Die Verteidigerrolle hattet ihr in [Blatt 05](../05-arp-spoofing-dos/m3-verteidigen.md); Teil 8 hat nur die Angriffsseite gezeigt.

    **Aufräumen:** Beendet den Server mit `kill <PID>` (die PID zeigt `jobs -l` im Fenster `Node: h1`) und die Topologie mit `exit` in der Mininet-Konsole.
