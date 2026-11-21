# Meilenstein 3 von 4 · Rekonvergenz und Protokollspuren messen

*03 · Routing (RIP/BGP)* · [Übersicht des Blatts](index.md)

Auf dieser Seite messt ihr zwei Dinge: wie schnell ein Netz nach einem Ausfall umschaltet und wie viel Verkehr Routing-Protokolle erzeugen.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Anwendungsschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzwerkschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Verbindungsschicht</div>
</div>
</div>

### Teil 3 – Redundanz im RIP-Netz testen: reale Rekonvergenz messen (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt messen, wie lange ein Netz nach dem Ausfall einer
    Verbindung braucht, bis ein Ersatzweg benutzt wird, und begründen, warum
    verschiedene Router dafür unterschiedlich lange brauchen.

    **Wozu?** Verfügbarkeit ist das, woran ein Netz gemessen wird: „Wie lange
    war der Dienst weg, als die Leitung ausfiel?" Netzbetreiber legen solche
    Ausfallzeiten in Verträgen fest (Service Level Agreements). Wer Ausfälle
    nachstellen und die Umschaltzeit selbst messen kann, kann solche Zusagen
    überprüfen und weiß, warum eine Umschaltung mal Sekunden und mal Minuten
    dauert.

    **Vorwissen:** [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) (`vtysh`, `show ip route`, RIP und BGP nebeneinander).

[Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) hat gezeigt, dass `r1` für `192.168.3.0/24`, solange `r2-eth1`
funktioniert, in der Regel nur `r2` als Nexthop kennt – `r4` spielt aus Sicht
von `r1` in diesem Zustand keine Rolle. `r4` bildet aber eine
**Backup-Route**, weil er sowohl am gemeinsamen Switch-Segment von `r1` und
`r2` (`193.1.1.0/26`, `sw2`) als auch am Segment von `r3` (`193.1.2.0/24`,
`sw3`) sitzt; `r1` und `r2` sind seine direkten RIP-Nachbarn. Solange
`r2` direkt mit `r3` verbunden ist, bleibt der Pfad über `r2` die bessere
(kürzere) Route, und `r4` bleibt ungenutzt – bis genau diese
direkte Verbindung ausfällt. Dann ändert sich der Weg nicht nur bei `r2`,
sondern auch bei `r1`.

In diesem Teil legt ihr diese direkte Verbindung lahm und messt, wie
schnell RIP auf den Ersatzpfad über `r4` umschaltet. Startet dafür `topo03`
neu (Beenden und Neustart wie in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) beschrieben: zweimal `exit`, dann
`./start-topo03.sh`), wechselt mit **einem** `exit` in Stufe 2 und wartet etwa
eine Minute, bis BGP und RIP stehen.

**Vorgemacht.** Stellt auf `r2` den funktionierenden Zustand fest:

```bash
mininet> xterm r2
r2$ vtysh -c "show ip route 192.168.3.0/24"
```

Echte Ausgabe (nach etwa einer Minute Laufzeit):

```text
Routing entry for 192.168.3.0/24
  Known via "bgp", distance 20, metric 0, best
  Last update 00:01:17 ago
  * 193.1.2.2, via r2-eth1, weight 1

Routing entry for 192.168.3.0/24
  Known via "rip", distance 120, metric 2
  Last update 00:01:18 ago
    193.1.2.2, via r2-eth1, weight 1
```

Beide Einträge zeigen als Nexthop `193.1.2.2` über `r2-eth1` – die direkte
Verbindung zu `r3`. (In den ersten Sekunden nach dem Start steht dort nur der
RIP-Eintrag: BGP baut seine Sitzungen erst nach RIP auf.)

**Gemeinsam.** Startet auf `r1` einen dauerhaften Ping auf `192.168.3.1` in
einem eigenen Terminal, damit ihr die Auswirkung auf die
Ende-zu-Ende-Konnektivität mitverfolgen könnt:

```bash
mininet> xterm r1
r1$ ping 192.168.3.1
```

Schaltet auf `r2` die direkte Verbindung zu `r3` ab und messt, wie lange `r2`
braucht, bis es eine Ersatzroute über `193.1.1.4` (`r4`) hat. Die Schleife
fragt jede Sekunde nach und gibt vorher und nachher die Uhrzeit aus; die
Differenz ist eure Messzeit:

```bash
r2$ date +%T; ifconfig r2-eth1 down; until vtysh -c "show ip route 192.168.3.0/24" | grep -q 193.1.1.4; do sleep 1; done; date +%T
```

Echte Ausgabe einer Messung:

```text
00:07:36
00:07:58
```

Hier hat die Umschaltung auf `r2` 22 Sekunden gedauert. Danach sieht `r2`:

```text
r2$ vtysh -c "show ip route 192.168.3.0/24"
Routing entry for 192.168.3.0/24
  Known via "rip", distance 120, metric 3, best
  Last update 00:00:22 ago
  * 193.1.1.4, via r2-eth0, weight 1
```

Beobachtet auch den laufenden Ping auf `r1` und lasst ihn mindestens vier
Minuten laufen. Er bleibt eine ganze Weile stumm und läuft dann von selbst
weiter. Die Pause erkennt ihr an dem Sprung in `icmp_seq`: Der `ping` zählt
jede Sekunde ein Paket weiter, Antworten gibt es aber erst später wieder.

![Zwei Terminalfenster: links "Node: r1" mit einem laufenden ping auf 192.168.3.1, die Antworten springen von icmp_seq=6 auf icmp_seq=177; rechts "Node: r2" mit show ip route 192.168.3.0/24 vor dem Abschalten (bgp und rip über 193.1.2.2 via r2-eth1), dem Befehl ifconfig r2-eth1 down und danach der Route "rip, metric 3" über 193.1.1.4 via r2-eth0](../../assets/screenshots/03-routing-rip-bgp/topo03-ausfall-r2-eth1.png)
*Links der Ping von `r1`: Die Antworten setzen nach `icmp_seq=6` für 170
Sekunden aus. Rechts `r2`: Es hat nach dem Abschalten von `r2-eth1` die
Ersatzroute über `193.1.1.4` (`r4`).*

**Selbst.**

1. Schaltet `r2-eth1` wieder ein (`r2$ ifconfig r2-eth1 up`) und wartet, bis
   `r2$ vtysh -c "show ip route 192.168.3.0/24"` wieder den direkten
   Weg über `193.1.2.2` zeigt (für die Messung genügt die RIP-Zeile;
   die BGP-Zeile mit `best` kann bis zu drei Minuten dauern). Erst dann startet
   ihr die Messschleife erneut: Zeigt `r2` direkt nach dem Einschalten noch
   `193.1.1.4`, endet die Schleife sofort mit „0 Sekunden“ und die Messung ist
   wertlos. Wiederholt die Messung zwei- bis dreimal. Bei der Wiederholung
   genügt die Messschleife auf `r2`; den Ping braucht ihr dazu nicht. Notiert
   jedes Mal die Zeit. Bei uns kamen Messungen zwischen 5 und 37 Sekunden; mehr als
   etwa 40 Sekunden sind unwahrscheinlich.
2. Vergleicht eure Zeiten mit RIPs periodischem Update-Intervall von 30
   Sekunden.
3. Notiert, nach wie vielen Sekunden der Ping auf `r1` wieder Antworten
   bekommt (Sprung in `icmp_seq`, ein Paket je Sekunde).

!!! question "Nachgedacht: Warum so verschieden – und warum die lange Pause?"
    1. Erklärt anhand eurer Messung den Unterschied zwischen einem
       *periodischen* Update (RIP sendet ohnehin alle 30 Sekunden seine
       komplette Routing-Tabelle) und einem *ausgelösten* Update (*triggered
       update*: eine Änderung wird sofort, ohne auf den nächsten Zeitzyklus zu
       warten, an die Nachbarn gemeldet): Wer meldet hier sofort etwas, und auf
       wessen Meldung muss `r2` warten?
    2. Erklärt, warum der Ping auf `r1` viel länger aussetzt als die Umstellung
       auf `r2` dauert. Tipp: Schaut während des Aussetzers mit `ip route` auf
       `r3` nach, über welchen Nexthop `r3` die Antworten an `193.1.1.1`
       schickt.

    ??? success druck-zu "Lösung"
        **Auf `r2`:** `r2` meldet den Ausfall sofort weiter (triggered update
        mit Metrik 16, dazu der Rückzug der BGP-Route an `r1`). `r1`
        verwirft die BGP-Route über `r2` deshalb innerhalb weniger Sekunden
        und schaltet auf die RIP-Route über `r4` um. Die
        Ersatzroute über `r4` erscheint auf `r2` dagegen erst mit dem nächsten
        periodischen Update von `r4`: `r4`s eigene Route ist vom Ausfall nicht
        betroffen, er hat also keinen Anlass für ein triggered update. Je
        nachdem, wo im 30-Sekunden-Zyklus von `r4` der Ausfall liegt, dauert das
        etwa 5 bis 40 Sekunden (30 Sekunden mit zufälliger Streuung); die Messwerte streuen deshalb
        zwischen den Wiederholungen.

        **Auf `r1`:** `r1` ist selbst RIP-Nachbar von `r4` und übernimmt die
        Route aus derselben Meldung: Seine Kernel-Route zu `192.168.3.1` zeigt
        dann `via 193.1.1.4 dev r1-eth1`.

        **Der Ping auf `r1`** setzt trotzdem knapp drei Minuten aus (bei uns
        170 und 185 Sekunden). Der Hinweg über `r4` funktioniert, aber der
        Rückweg nicht: `r3`s eigenes Interface bleibt aktiv, `r3` bemerkt den
        Ausfall von `r2-eth1` also nicht direkt. Er behält seine BGP-Route zu
        `193.1.1.0/26` über `193.1.2.1` (`r2`), bis die BGP-Sitzung zu `r2`
        nach Ablauf der Hold Time (180 s ohne Nachricht von `r2`) abgebaut
        wird. Bis dahin verdrängt die BGP-Route (Distanz 20) jede RIP-Route
        (Distanz 120), auch die über `r4`, die `r3` in dieser Zeit lernt. Erst
        nach dem Abbau gilt die RIP-Route. Die direkten Nachbarschaften bleiben die ganze Zeit
        intakt – `r4` erreicht `r2` und `r3` durchgehend ohne Verlust.

        **Der Merksatz dahinter:** Konvergenz ist kein Zeitpunkt, sondern ein
        Verlauf, und verschiedene Knoten erreichen sie zu verschiedenen Zeiten.
        Wer nur an einer Stelle misst, hält die Umstellung für schneller oder
        langsamer, als sie für das Netz als Ganzes ist.

Prüft abschließend, dass die Wiederherstellung ebenso funktioniert:

```bash
r2$ ifconfig r2-eth1 up
r2$ vtysh -c "show ip route 192.168.3.0/24"
```

Die Route wechselt innerhalb von ein bis zwei Sekunden auf den direkten Pfad
über `193.1.2.2` zurück (`Known via "rip", … metric 2`). Die BGP-Sitzung
zwischen `r2` und `r3` braucht danach noch länger, bis sie wieder steht; in
`show ip bgp summary` steht dort bis dahin nicht eine Zahl, sondern `Idle`,
`Active` oder `Connect`. Beendet den Ping auf
`r1` mit ++ctrl+c++.

--8<-- "issue-feedback.md"

### Teil 4 – Protokollspuren vermessen statt anschauen (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt aus einer aufgezeichneten Datei die Zeitkonstanten
    und den Datenaufwand eines Routing-Protokolls ausrechnen: Abstand zweier
    Updates, Pakete und Byte je Minute, getrennt nach RIP und BGP.

    **Wozu?** Wer ein Netz plant oder eine Störung sucht, braucht Zahlen statt
    Bauchgefühl: „Wie viel Verkehr erzeugt das Routing allein, wenn nichts los
    ist?", „In welchem Takt melden sich die Router?" Netzwerkingenieure
    zeichnen dafür eine Spur auf und werten sie hinterher aus – auch dann, wenn
    der Fehler längst vorbei ist und nur die Datei übrig bleibt. Ihr übt genau
    diesen Ablauf.

    **Vorwissen:** [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) (RIP und BGP laufen, `r1-eth1`), `tcpdump` aus [Teil 1](m1-manuelles-routing.md#teil-1-manuelles-routing-zwischen-zwei-netzen-topop03).

In [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) habt ihr den Paketaustausch von RIP und BGP in Wireshark *gesehen*.
Sehen ist aber nicht messen. Ein Routing-Protokoll hat Zeitkonstanten und einen
Preis, und beides steht in keiner Ausgabe: Wie oft meldet sich ein Router, auch
wenn sich gar nichts geändert hat? Was kostet das an Byte je Minute, während
kein einziges Nutzdatenpaket unterwegs ist? In diesem Teil zeichnet ihr eine
Spur auf und rechnet diese Zahlen selbst aus ihr heraus.

Eine Aufzeichnung ist eine Datei, die bleibt: Die Topologie braucht ihr nur
zum Aufnehmen. Die Auswertung könnt ihr danach beliebig oft wiederholen,
verfeinern und mit den Spuren eurer Kommiliton:innen vergleichen – auch in
einer späteren Sitzung, in der nichts mehr läuft. Weil die Spur aus eurer
eigenen Topologie stammt, wisst ihr genau, welche Router gesprochen haben und
wie sie konfiguriert sind.

#### Schritt 1 – Erst rechnen, dann aufzeichnen

Füllt diese Tabelle **bevor** ihr etwas startet. Alles, was ihr für die ersten beiden
Zeilen braucht, steht in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) und 3 dieses Blattes. Bei den übrigen Zeilen
**schätzt** ihr; das Raten ist gewollt, ihr vergleicht danach in Schritt 4.
Tipp zur vierten Zeile: Überlegt, welches der beiden Protokolle Verbindungen
aufbaut.

| Frage | Eure Vorhersage |
|---|---|
| In welchem Abstand sendet ein RIP-Router seine Tabelle, wenn sich nichts ändert? | ? s |
| Wie viele RIP-Nachrichten sind das in 2,5 Minuten, von **einem** Sprecher? | ? |
| Wie viele Router auf `193.1.1.0/26` sprechen überhaupt RIP – und wie viele davon hört `r1` auf `r1-eth1`? | ? |
| Welchen Transportweg nutzt RIP, welchen BGP? | ? |
| Wie viele Byte je Minute kostet RIP auf diesem Segment im Ruhezustand? | ? Byte/min |

Die letzte Zeile ist die interessanteste, weil sie sich nicht erraten lässt:
Ihr braucht die Nachrichtengröße **und** die Häufigkeit. Schätzt trotzdem eine
Größenordnung – zehn, hundert oder tausend Byte je Minute? – und notiert sie.

#### Schritt 2 – Die Spur aufzeichnen

Startet `topo03` wie in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) und bleibt zunächst in **Stufe 1**, also vor dem
ersten `exit`. Die Routing-Dienste laufen dann noch nicht, das Segment ist
still – genau der richtige Zeitpunkt, um mit dem Mitschnitt zu beginnen:

```bash
$ cd ~/rn-practice/topo03
$ ./start-topo03.sh
```

Legt das Verzeichnis für Aufzeichnungen an und startet `tcpdump` auf `r1`:

```bash
mininet> xterm r1
r1$ mkdir -p ~/rn-practice/pcaps
r1$ tcpdump -i r1-eth1 -w ~/rn-practice/pcaps/03-teil4-protokollspuren.pcap -U -n
```

!!! info "Werkzeug: `tcpdump -w` – in eine Datei mitschneiden"
    Das Werkzeug kennt ihr aus [Teil 1](m1-manuelles-routing.md#teil-1-manuelles-routing-zwischen-zwei-netzen-topop03); hier schreibt es keine Zeilen auf den
    Bildschirm, sondern speichert die Pakete in einer `pcap`-Datei, die ihr
    später auswertet (oder in Wireshark öffnet).

    | Option | Bedeutung |
    |---|---|
    | `-i r1-eth1` | die Schnittstelle zum gemeinsamen Segment mit `r2` und `r4` |
    | `-w datei.pcap` | in diese Datei schreiben statt auf den Bildschirm |
    | `-U` | jedes Paket sofort schreiben (ohne `-U` verliert ein abgebrochener Mitschnitt den letzten Puffer) |
    | `-n` | keine Namensauflösung |

    Echte Ausgabe nach dem Beenden mit ++ctrl+c++:

    ```text
    tcpdump: listening on r1-eth1, link-type EN10MB (Ethernet), snapshot length 262144 bytes
    82 packets captured
    83 packets received by filter
    0 packets dropped by kernel
    ```

    `82 packets captured`: so viele Pakete sind in der Datei. `received by
    filter`: so viele hat der Kernel an `tcpdump` übergeben; der Unterschied
    sind Pakete, die beim Beenden noch nicht verarbeitet waren. Wichtig ist
    `0 packets dropped`: Es ging nichts verloren.

Wechselt nun an der Mininet-Konsole mit einmaligem `exit` in **Stufe 2**
(RIP und BGP starten) und lasst den Mitschnitt **mindestens 2,5 Minuten**
laufen. Diese Dauer ist kein Zufall: Ihr braucht mehrere Abstände zwischen
periodischen Updates, um aus ihnen einen Mittelwert bilden zu können – bei
einem einzigen Abstand wäre jede Aussage über die Streuung erfunden. Beendet
`tcpdump` danach mit ++ctrl+c++ und prüft, dass die Datei wirklich gefüllt ist:

```bash
r1$ ls -l ~/rn-practice/pcaps/03-teil4-protokollspuren.pcap
```

Die Dateigröße liegt bei etwa 7 bis 8 Kilobyte. Eure Werte weichen um einige
Prozent von den Beispielwerten unten ab; die Größenordnung zählt.

#### Schritt 3 – Die Zahlen aus der Datei holen

Legt euch den Pfad in eine Variable, damit die folgenden Befehle kurz bleiben:

```bash
r1$ P=~/rn-practice/pcaps/03-teil4-protokollspuren.pcap
```

!!! info "Werkzeug: `capinfos` – die Eckdaten einer Aufzeichnung"
    `capinfos` liest eine `pcap`-Datei und gibt Kennzahlen aus, ohne einzelne
    Pakete anzuzeigen.

    | Option | Bedeutung |
    |---|---|
    | `-c` | Zahl der Pakete |
    | `-d` | Summe der Paketgrößen in Byte (komplette Rahmen mit Ethernet-, IP- und UDP/TCP-Kopf) |
    | `-u` | Dauer der Aufzeichnung in Sekunden |

    Echte Ausgabe für die ganze Datei:

    ```text
    r1$ capinfos -c -d -u "$P"
    File name:           /config/rn-practice/pcaps/03-teil4-protokollspuren.pcap
    Number of packets:   82
    Data size:           6,130 bytes
    Capture duration:    141.339753 seconds
    ```

    Gelesen: 82 Pakete mit zusammen 6.130 Byte in 141,3 Sekunden (das Komma in
    `6,130` ist ein Tausendertrenner).

**Das Ganze zuerst.** Aus den drei Zahlen berechnet ihr den Overhead je Minute
selbst – nicht ausrechnen lassen, sondern ausrechnen:

```text
Byte je Minute = Data size / Capture duration * 60
```

Für die ganze Datei: 6130 / 141,3 · 60 ≈ 2.600 Byte je Minute.

Das ist **nicht** nur Routing: Die Datei enthält auch ARP und
IPv6-Nachbarschaftspakete. Prüft das mit
`tcpdump -r "$P" -n not udp port 520 and not tcp port 179 | head`. Die
Aufteilung nach Protokoll kommt gleich.

**Dann je Protokoll.** Dieselbe Rechnung wird erst aussagekräftig, wenn ihr RIP
und BGP getrennt betrachtet. `tcpdump` kann eine Datei lesen (`-r`) und
gefiltert in eine neue schreiben (`-w`). RIP läuft über UDP-Port 520, BGP über
TCP-Port 179:

```bash
r1$ rm -f /tmp/rip.pcap
r1$ tcpdump -r "$P" -w /tmp/rip.pcap udp port 520
r1$ capinfos -c -d -u /tmp/rip.pcap
r1$ rm -f /tmp/bgp.pcap
r1$ tcpdump -r "$P" -w /tmp/bgp.pcap tcp port 179
r1$ capinfos -c -d -u /tmp/bgp.pcap
```

Die Zeile `reading from file …` von `tcpdump -r` ist nur eine Statusmeldung.
Echte Ergebnisse:

```text
RIP:  Number of packets:   14
      Data size:           1,104 bytes
      Capture duration:    139.212571 seconds
BGP:  Number of packets:   28
      Data size:           2,554 bytes
      Capture duration:    120.002807 seconds
```

**Und schließlich die Zeitkonstante.** Der Abstand zweier Updates steckt in den
Zeitstempeln. `-tt` gibt sie als reine Sekundenzahl aus, `awk` bildet die
Differenz zur Vorzeile:

```bash
r1$ tcpdump -tt -n -r "$P" 'udp port 520 and src 193.1.1.2' \
      | awk '{if (p != "") printf "%.2f s\n", $1-p; p=$1}'
```

Beachtet die Einschränkung auf **einen** Sprecher (`src 193.1.1.2`, also `r2`).
Ohne sie mischt ihr die Zeitreihen mehrerer Router und erhaltet Abstände, die
kein einzelner Router je eingehalten hat. Echte Ausgabe:

```text
1.00 s
1.06 s
23.96 s
35.00 s
28.02 s
36.02 s
```

Wiederholt den Aufruf mit `src 193.1.1.4` (`r4`) und vergleicht (bei uns
`1.00`, `36.01`, `31.01`, `37.01`, `31.01 s`).

Dasselbe für BGP. Hier interessieren nur die Nachrichten mit Inhalt, nicht die
reinen TCP-Bestätigungen. Eine leere Bestätigung ist ein 66 Byte großer Rahmen,
alles mit Inhalt ist größer; `greater 80` filtert die leeren Bestätigungen
heraus. Betrachtet wieder nur einen Sprecher (`r2`):

```bash
r1$ tcpdump -tt -n -r "$P" 'tcp port 179 and src 193.1.1.2 and greater 80' \
      | awk '{if (p != "") printf "%.1f s\n", $1-p; p=$1}'
```

```text
0.0 s
1.1 s
0.1 s
58.8 s
60.0 s
```

Die ersten drei Abstände (0,0 s, 1,1 s und 0,1 s) stammen aus dem
Verbindungsaufbau direkt nach dem Start der Dienste; bei RIP sind es die ersten ein bis
zwei Sekunden. Für die Zeitkonstanten zählen die Abstände danach: BGP sendet
alle 60 Sekunden ein Lebenszeichen (`Keepalive`). Für den **Ruhezustand**
zählen nur die Pakete nach dem Verbindungsaufbau, etwa ab zehn Sekunden nach
dem ersten `OPEN`: ein `Keepalive` je Sprecher und Minute (Rahmen 85 Byte),
dazu je eine reine Bestätigung (66 Byte).

#### Schritt 4 – Auswerten

**Aufgabe:** Vergleicht jede Zeile eurer Vorhersage aus Schritt 1 mit dem
gemessenen Wert und begründet jede Abweichung.

!!! question "Nachgedacht: Drei Fragen zur Messung"
    1. **Die Abstände sind nicht alle gleich.** RIP nennt 30 Sekunden, ihr messt
       Werte darunter und darüber. Das ist kein Messfehler: RIP versieht seinen
       Zeitgeber absichtlich mit einer Zufallsschwankung. Überlegt, was
       passieren würde, wenn alle Router eines Segments ihre Tabelle *exakt*
       gleichzeitig senden würden – und warum die Schwankung damit kein
       Schönheitsfehler, sondern eine Notwendigkeit ist.
    2. **Zwei Werte für BGP.** Rechnet BGP zweimal: über die ganze Datei und
       nur über die Keepalives nach dem Verbindungsaufbau (`greater 80`, nur
       Abstände von etwa 60 s, je Keepalive 85 Byte plus eine 66-Byte-
       Bestätigung). Warum unterscheiden sich die beiden Werte so stark, und
       welcher davon ist der Ruhezustand?
    3. **Der Preis des Ruhezustands.** Rechnet euren RIP-Wert auf eine Woche
       hoch und stellt ihn der Nutzlast eines einzigen Bildes im Browser
       gegenüber. Formuliert in einem Satz, warum dieser Aufwand trotzdem
       gerechtfertigt ist.

    ??? success druck-zu "Lösung"
        Eure Zahlen weichen im Detail ab; die Größenordnungen sollten passen.
        Bei rund 140 Sekunden Aufzeichnung auf `r1-eth1`:

        | Größe | Typischer Wert |
        |---|---|
        | Pakete gesamt | etwa 80 |
        | RIP (UDP/520) | 14 Pakete, 1.104 Byte, über 139 s |
        | BGP (TCP/179) | 28 Pakete, 2.554 Byte, über 120 s (inkl. Verbindungsaufbau) |
        | Abstände der RIP-Updates eines Sprechers | zwischen etwa 24 und 37 s |
        | Abstand der BGP-Keepalives | 60 s |

        Daraus ergeben sich über die ganze Aufzeichnung für RIP rund 480 Byte
        je Minute (1104 / 139,2 · 60). Für BGP gilt 2554 / 120 · 60 ≈ 1.280 Byte
        je Minute, aber diese Zahl ist **nicht** der Ruhezustand: Sie enthält
        den einmaligen Verbindungsaufbau (TCP-Handshake, `Open`, `Keepalive`,
        `Update`, rund 2.000 Byte). Im Ruhezustand schickt jeder BGP-Nachbar
        nur alle 60 Sekunden einen `Keepalive` (85 Byte Rahmen), dazu je eine
        66-Byte-Bestätigung: zusammen etwa 300 Byte je Minute – weniger als
        RIP, weil RIP die ganze Tabelle alle 30 Sekunden neu sendet, BGP aber
        nach dem Aufbau nur noch Lebenszeichen. RIP sprechen auf dem Segment `r1`, `r2` und `r4`; `r1` hört
        periodische Updates von `r2` und `r4` und sendet selbst nur eine
        Anfrage beim Start. Die RIP-Nachrichten sind 24 Byte (Anfrage, Antwort
        mit einer Route) bzw. 44 Byte (Antwort mit zwei Routen) groß, die
        Ethernet-Rahmen 66 bzw. 86 Byte.

        Zu 1: Würden alle Router gleichzeitig senden, entstünden regelmäßige
        Lastspitzen, in denen Pakete kollidieren oder Warteschlangen
        überlaufen; die Zufallsschwankung verteilt die Updates über die Zeit.
        Zu 3: 480 Byte/min ergeben rund 4,8 MB je Woche, etwa so viel wie ein
        einziges Foto. Dafür kennt jeder Router jederzeit den aktuellen
        Zustand des Netzes und reagiert von selbst auf einen Ausfall.

--8<-- "issue-feedback.md"

!!! success "Meilenstein 3 geschafft"
    **Das habt ihr gelernt:**

    - Die Umschaltzeit nach dem Ausfall einer Verbindung messen und erklären, warum Router unterschiedlich lange brauchen.
    - Aus einer aufgezeichneten Datei den Abstand zweier Updates sowie Pakete und Byte je Minute berechnen, getrennt nach RIP und BGP.

    **Was Meilenstein 4 verspricht:** Als Nächstes legt ihr Kernel-, RIP- und BGP-Tabelle nebeneinander, lest AS-Pfade und RIP-Metriken und erkennt Nachrichtentypen im Mitschnitt. Damit erklärt ihr, warum ein Paket genau seinen Weg nimmt.

    [Weiter zu Meilenstein 4: Tabellen, AS-Pfad, Metrik und Nachrichten lesen](m4-tabellen-und-nachrichten.md){ .md-button }
