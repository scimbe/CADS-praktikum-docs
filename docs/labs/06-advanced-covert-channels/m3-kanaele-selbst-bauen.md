# Meilenstein 3 von 4 · Kanäle selbst bauen

*06 · Advanced: Covert Channels* · [Übersicht des Blatts](index.md)

Hier baut und decodiert ihr verdeckte Kanäle selbst, in Abfragenamen, TTL, TCP-Sequenznummer und in der Reihenfolge von Verbindungsversuchen.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzwerkschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 7 — Den TTL-Kanal aus Teil 3 wirklich decodieren (`topo01`)

[Teil 3](m1-inspektion-und-tunnel.md#teil-3-verdeckte-kanale-uber-icmp-payload-und-ttl-hping3) hat gezeigt, dass sich ein einzelnes Zeichen über den TTL-Wert eines
IP-Pakets kodieren lässt. In diesem Teil baut ihr das zu einem echten,
mehrzeichigen verdeckten Kanal aus: Ein kurzes Wort wird Zeichen für Zeichen
verschickt (ein `hping3`-Paket pro Zeichen, TTL = ASCII-Code des Zeichens),
und ihr **decodiert es aus einem Mitschnitt zurück** – ohne vorher zu
wissen, was verschickt wurde.

Startet `topo01`, falls nicht mehr aktiv:

```bash
cd ~/rn-practice/topo01
./start-topo01.sh
```

Die Knotenfenster „Node: h1“ und „Node: h2“ öffnen sich beim Start von
selbst. Fehlt eines, tippt am `mininet>`-Prompt (im Fenster, in dem ihr das
Skript gestartet habt) `xterm h1` bzw. `xterm h2`. Hilfe beim Wiederfinden
und Tippen: [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).
Der echte Prompt dort ist `root@…#`; das `h1$` im Blatt gehört nicht zum
Befehl (siehe [Übersicht](index.md)).

1. **Empfänger vorbereiten.** Startet auf `h1` einen Mitschnitt, der nur
    ICMP-Verkehr aufzeichnet:

    ```bash
    h1$ sudo rm -f /tmp/ttlmsg.pcap
    h1$ sudo tcpdump -i any icmp -n -w /tmp/ttlmsg.pcap
    ```

    Die Warnung zum Promiscuous-Modus bei `any` ist harmlos.

2. **Sender:** Wechselt zu `h2` und schickt (ohne `h1` vorher zu verraten,
    was ihr sendet) ein kurzes Wort Zeichen für Zeichen, mit einem
    ASCII-kodierten TTL-Wert pro Zeichen:

    ```bash
    h2$ for c in H I ; do
          ttl=$(printf '%d' "'$c")
          hping3 -1 --ttl "$ttl" -c 1 10.0.1.2
          sleep 1
        done
    ```

    (Ersetzt die Zeichenliste `H I` durch ein eigenes, für euch unbekanntes
    Wort – lasst es euch am besten von jemand anderem vorgeben, damit die
    Decodierung im nächsten Schritt nicht durch Vorwissen verfälscht wird.)

3. **Decodieren.** Beendet den Mitschnitt auf `h1` (++ctrl+c++) und lest die
    *empfangene* TTL jedes eingehenden Pakets aus:

    ```bash
    h1$ tcpdump -r /tmp/ttlmsg.pcap -n -v | grep -B1 'echo request'
    ```

    Achtet nur auf die Pakete mit `ICMP echo request` (Absender `h2`, in
    `topo01` die Adresse `10.0.6.2`) – die dazugehörigen `echo reply`-Pakete
    (Absender `h1`) tragen `h1`s eigenen, unveränderten Standard-TTL-Wert und
    sind für die Decodierung ohne Bedeutung. Bei `-v` steht die TTL **nicht**
    in der `echo request`-Zeile selbst, sondern in der IP-Kopfzeile direkt
    davor (`IP (tos …, ttl 70, id …)`); `grep -B1` gibt deshalb jeweils die
    Zeile davor mit aus. (Ein einfaches `grep 'echo request'` würde die TTL
    verlieren.) Mit `-i any` steht in den Kopfzeilen auch die Richtung
    (`In` oder `Out`): Eingehende Pakete sind die `In`-Zeilen. Falls
    `traceroute` (s. u.) bei laufendem Mitschnitt gelaufen ist, tauchen
    weitere ICMP-Zeilen (z. B. `udp port … unreachable`) auf; die ignoriert
    ihr. Die relevanten Zeilen zeigen euch je einen Wert wie `ttl 70`. Das ist
    **nicht** der von `h2` gesendete Wert, sondern der bereits um die Anzahl
    der durchlaufenen Router verminderte Wert – bestimmt diese Hop-Zahl
    selbst mit `traceroute` (oder `tracepath`) von `h2` zu `h1`
    (`h2$ traceroute -n 10.0.1.2`), bevor ihr
    zurückrechnet. Gemeint ist die Zahl der **Router** auf dem Weg: Die
    Zeilen von `traceroute` minus 1 (die letzte Zeile ist `h1` selbst), hier
    also 2 (`r2` und `r1`). Nur Router vermindern die TTL.

4. **Rückrechnen.** Addiert die ermittelte Router-Zahl auf jeden beobachteten
    TTL-Wert und wandelt das Ergebnis mit der ASCII-Tabelle (oder
    `printf "\x$(printf %x <Zahl>)"`) zurück in ein Zeichen. Reiht die
    Zeichen in der Reihenfolge auf, in der die Pakete eingetroffen sind.

**Aufgabe:** Erklärt, warum ihr die Hop-Zahl vorher separat ermitteln
müsst, statt sie zu raten – und warum ein verdecktes TTL-Signal über einen
Pfad mit *wechselnder* Hop-Zahl (z. B. bei dynamischem Routing wie in
[Aufgabenblatt 03](../03-routing-rip-bgp/index.md)) unzuverlässig würde, selbst wenn
Sender und Empfänger sich vorher auf ein Encoding geeinigt haben.

### Teil 8 – DNS-Kanal ohne `iodine`: der lesbare DNS-Server als Endpunkt (`topo01`)

[Teil 2](m1-inspektion-und-tunnel.md#teil-2-dns-tunneling-mit-iodine) verlangte `iodine`, ein zusätzliches Werkzeug. Diesen verdeckten DNS-Kanal baut ihr hier mit einem
Werkzeug, das im Image bereits liegt und dessen Innenleben ihr lesen könnt:
dem Python-DNS-Server `dns-server.py` aus dem Topologie-Verzeichnis (siehe
[Aufgabenblatt 01, Teil 3](../01-netzwerkgrundlagen-tools/index.md)).

Die Idee eines DNS-Tunnels ist: Nutzdaten werden **in den abgefragten Namen**
kodiert. Der Server muss die Namen gar nicht kennen – schon die *Anfrage*
trägt die Daten über die Leitung.

Startet den Server auf `h1` auf Port 5353 (Port 53 belegt dort bereits
`dnsmasq`) und einen DNS-Mitschnitt auf der Schnittstelle zu `h2`:

```bash
h1$ cd ~/rn-practice/topo01
h1$ python3 dns-server.py 5353 &
h1$ sudo rm -f /tmp/dnschan.pcap
h1$ sudo tcpdump -U -i h1-eth1 -w /tmp/dnschan.pcap udp port 5353 &
```

Der Server druckt gleich nach dem Start eine Meldung in das Fenster; sie kann
die Eingabezeile überschreiben und die nächsten Zeichen zerstückeln. Wartet
kurz, drückt ++enter++ und prüft, dass der Prompt sauber dasteht, bevor ihr
weitertippt.

Kodiert auf `h2` eine kurze Nachricht als Hex und verpackt sie als Subdomain
in eine DNS-Abfrage an den Server:

```bash
h2$ msg=$(printf 'Hallo' | od -An -tx1 | tr -d ' ')   # -> 48616c6c6f
h2$ dig @10.0.1.2 -p 5353 "$msg.exfil.h1"
```

`dig` zeigt `status: NXDOMAIN`. Das ist hier richtig: Der Server kennt den
Namen nicht, aber die Daten sind in der Anfrage schon angekommen.

Beendet den Mitschnitt auf `h1`: `jobs -l` listet zwei Hintergrundjobs, den
Python-Server und `tcpdump`. Wählt die Zeile mit `tcpdump` (dort steht ggf. die
PID von `sudo`; `kill` darauf beendet den Mitschnitt trotzdem) und beendet ihn
mit `kill <PID>`. Lest dann die Abfragenamen aus:

```bash
h1$ tcpdump -r /tmp/dnschan.pcap -n | grep exfil
```

`grep exfil` zeigt nur die Anfrage. Der Mitschnitt enthält zwei Pakete; in der
Antwort (`NXDOMAIN`) steht der Name in dieser Darstellung nicht, deshalb fehlt
sie in der gefilterten Ausgabe.

Beendet danach auch den DNS-Server (`kill <PID>` der Zeile mit `dns-server.py`
aus `jobs -l`). Er belegt sonst weiter Port 5353; Teil 14 startet ihn bei
Bedarf neu.

**Aufgabe:** Der Hex-String steht im Klartext im Abfragenamen. Ein einzelnes
DNS-Label darf höchstens 63 Zeichen lang sein, ein ganzer Name höchstens 255
(RFC 1035, Abschnitt 2.3.4 / 3.1). Rechnet aus, wie viele Nutzbytes euch pro
Abfrage bleiben, wenn ihr hex-kodiert (zwei Zeichen je Byte). Die Daten
dürfen auf mehrere Labels verteilt werden; das Suffix `.exfil.h1` und die
Trennpunkte zählen zum Namen und verbrauchen Platz. Gebt auch an, wie viele
Nutzbytes in ein einzelnes Label passen. Eine Größenordnung für den ganzen
Namen genügt. Woran erkennt
ein Beobachter im Mitschnitt, dass hier kein normales DNS läuft?

!!! quote "Hintergrund: warum ein DNS-Label bei 63 Zeichen endet"
    Ein DNS-Label endet nach höchstens **63** Oktetten, weil die zwei
    höchstwertigen Bits jedes Längen-Oktetts null sein müssen und nur sechs
    Bits für die Länge bleiben – 2⁶−1 = 63 (RFC 1035, Abschnitt 3.1). Der ganze
    Name ist auf 255 Oktette begrenzt (Abschnitt 2.3.4 / 3.1). Als lesbarer
    Text sind nur 253 Zeichen möglich, weil das Längenbyte des ersten Labels
    und das Null-Byte der Root zwei Oktette mehr belegen, als die Punkte
    kosten. Diese knappen Grenzen zwingen einen DNS-Tunnel zu vielen kurzen
    Anfragen – und machen ihn dadurch auffällig.

    - RFC 1035, Abschnitt 2.3.4/3.1 (rfc-editor): <https://www.rfc-editor.org/rfc/rfc1035.html>
    - R. Chen, „What is the real maximum length of a DNS name?": <https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873>

### Teil 9 – Ein Kanal in der TCP-Sequenznummer (`topo01`)

[Teil 3](m1-inspektion-und-tunnel.md#teil-3-verdeckte-kanale-uber-icmp-payload-und-ttl-hping3) hat Daten in der ICMP-Payload und im TTL versteckt. Ein noch
unauffälligeres Versteck ist die **Initial-Sequenznummer** eines
TCP-SYN-Pakets: ein 32-Bit-Feld, das normalerweise zufällig gewählt wird –
also fällt ein hineingeschriebener Wert kaum auf.

Zeichnet auf `h1` TCP auf und schickt von `h2` ein einzelnes SYN mit einer
selbst gewählten Sequenznummer (`hping3 -M`):

```bash
h1$ sudo rm -f /tmp/seqchan.pcap
h1$ sudo tcpdump -i h1-eth1 -w /tmp/seqchan.pcap tcp -c 2 &
h2$ sudo hping3 -c 1 -S -M 305419896 -p 80 10.0.1.2
```

Lest die empfangene Sequenznummer aus dem Mitschnitt zurück:

```bash
h1$ tcpdump -r /tmp/seqchan.pcap -n -v | grep -o 'seq 305419896'
```

Der Mitschnitt hat zwei Pakete (`-c 2` beendet ihn von selbst; die
`Done`-Meldung erscheint ggf. erst beim nächsten ++enter++). Das zweite ist
die Antwort von `h1`: ein `RST` (`Flags [R.]`) mit `seq 0` und
`ack 305419897`, denn Port 80 ist geschlossen. `hping3` zeigt dieselbe
Antwort als `flags=RA seq=0`. Das `ack 305419897` ist die gesendete
Sequenznummer plus 1 und gehört nicht zum Kanal, verrät den Wert einem
Beobachter aber ein zweites Mal.

**Aufgabe:** `305419896` ist dezimal für `0x12345678`. Erklärt, warum die
Sequenznummer ein besonders schwer zu entdeckendes Versteck ist (Stichwort:
ein *zufälliger* Wert ist normal, ein *strukturierter* fällt nur bei genauem
Hinsehen auf). Welche Datenmenge passt pro Paket hinein?

!!! quote "Hintergrund: Craig Rowland versteckte Daten schon 1997 in der Sequenznummer"
    Die Idee, Nutzdaten in Kopffeldern zu verstecken, die eigentlich anderen
    Zwecken dienen, ist alt: Craig H. Rowland beschrieb 1997 in „Covert
    channels in the TCP/IP protocol suite" das Werkzeug `covert_tcp`, das Daten
    byteweise in der **IP-Identification** und in der **TCP-Sequenznummer**
    versteckt. Das 16-Bit-Feld IP-Identification (RFC 791, Abschnitt 3.1) dient
    eigentlich nur dem Zusammensetzen von Fragmenten – RFC 6864, Abschnitt 7,
    stellt ausdrücklich fest, es „can more easily be used as a covert channel".

    - RFC 6864, Abschnitt 7, und RFC 791, Abschnitt 3.1 (rfc-editor): <https://www.rfc-editor.org/rfc/rfc6864.html>
    - C. H. Rowland, „Covert channels in the TCP/IP protocol suite", First Monday 2(5), 1997: <https://firstmonday.org/ojs/index.php/fm/article/view/528>

!!! question "Kurz nachgedacht"
    Ein Beobachter, der nur diesen einen Mitschnitt sieht, ohne von einem
    Kanal zu wissen: Woran müsste er zweifeln, um `seq 305419896` als
    verdächtig einzustufen? Reicht ein einzelner "auffälliger" Wert, oder
    braucht es ein Muster über mehrere Pakete hinweg?

--8<-- "issue-feedback.md"

### Teil 10 – Port-Knocking: Signalisieren, ohne einen Port offen zu haben (`topo01`)

Bisher lag die versteckte Information *in* den Paketen. Beim **Port-Knocking**
steckt die Botschaft in der **Reihenfolge**, in der scheinbar sinnlose
Verbindungsversuche auf geschlossene Ports treffen. Ein Beobachter, der nur
auf offene Dienste achtet, sieht nichts Auffälliges.

Zeichnet auf `h1` alle SYN-Pakete auf und „klopft" von `h2` eine feste
Sequenz auf drei geschlossene Ports:

```bash
h1$ sudo rm -f /tmp/knock.pcap
h1$ sudo tcpdump -i h1-eth1 -w /tmp/knock.pcap tcp -c 6 &
h2$ for p in 7000 8000 9000; do sudo hping3 -c 1 -S -p $p 10.0.1.2; sleep 1; done
```

Lest die Klopf-Sequenz aus dem Mitschnitt zurück:

```bash
h1$ tcpdump -r /tmp/knock.pcap -n | grep -oE '\.(7000|8000|9000):'
```

Der Mitschnitt enthält sechs Pakete (`-c 6`): die drei SYN und die drei
`RST`-Antworten von `h1`, denn alle drei Ports sind geschlossen. `grep`
trifft nur die SYN-Zeilen, weil dort der Zielport mit `:` endet
(`10.0.1.2.7000:`); bei den Antworten steht der Port vor dem `>`. Der
führende Punkt in der Ausgabe (`.7000:`) gehört zur Schreibweise
`<Adresse>.<Port>`.

**Aufgabe:** Die drei Zielports erscheinen in genau der gesendeten
Reihenfolge. Erklärt, warum ein Port-Knock-Daemon (der auf diese Sequenz
hin z. B. eine Firewall-Regel öffnet) für einen einfachen Portscan
unsichtbar bleibt – und was den Kanal trotzdem verrät, wenn jemand den
Gesamtverkehr aufzeichnet.

!!! quote "Hintergrund: Port-Knocking – Authentifizierung über geschlossene Ports"
    Martin Krzywinski prägte den Begriff 2003: „port knocking provides an
    authentication system that works across closed ports". Der Clou: Hinter der
    Firewall lauscht gar kein Port, die Information reist allein in der
    *Reihenfolge* der Verbindungsversuche, die die Firewall ohnehin
    mitprotokolliert. Weil kein Port offen ist, lässt sich mit einem Portscan
    nicht einmal feststellen, dass das Verfahren überhaupt aktiv ist. (Ein RFC
    existiert dafür nicht.)

    - Linux Journal, M. Krzywinski, „Port Knocking" (16.06.2003): <https://www.linuxjournal.com/article/6811>
    - Autorenseite M. Krzywinski, portknocking: <https://mk.bcgsc.ca/portknocking/view/about/summary/>

!!! success "Meilenstein 3 geschafft"
    **Das habt ihr gelernt:**

    - Ein mehrzeichiger TTL-Kanal lässt sich vollständig decodieren; bei DNS stecken die Daten sichtbar in den Abfragenamen.
    - Auch Kopffelder wie die TCP-Initial-Sequenznummer können Daten tragen und fallen wegen ihres zufälligen Charakters kaum auf.
    - Beim Port-Knocking liegt die Information in der Reihenfolge von Verbindungsversuchen auf geschlossene Ports.

    **Was Meilenstein 4 verspricht:** Der letzte Meilenstein erweitert die Träger um ICMP-Timestamp und UDP, zeigt, dass bei TLS der SNI im Klartext bleibt, und dreht die Perspektive: Ihr erkennt einen Kanal an Paketrate und Paketgröße.

    [Weiter zu Meilenstein 4: Weitere Träger und Erkennung](m4-weitere-traeger-und-erkennung.md){ .md-button }
