# Meilenstein 1 von 4 · Manuelles Routing

*03 · Routing (RIP/BGP)* · [Übersicht des Blatts](index.md)

Auf dieser Seite verbindet ihr zwei Netze mit einem Router und tragt alle Routen selbst ein.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Anwendungsschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Transportschicht</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzwerkschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 1 – Manuelles Routing zwischen zwei Netzen (`topoP03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt zwei Netze mit einem Router verbinden: Adressen
    vergeben, auf den Hosts je eine Route zum anderen Netz eintragen und mit
    `ping` und `traceroute` prüfen, dass der Weg über den Router führt.

    **Wozu?** Jede Firma, jede Hochschule und jedes Heimnetz besteht aus
    Teilnetzen, die ein Router verbindet. Wenn dort „Abteilung B ist nicht
    erreichbar" gemeldet wird, ist die erste Frage eines Administrators:
    „Kennt der Rechner den Weg dorthin – und kennt das Ziel den Weg zurück?"
    Wer einmal jede Route selbst gesetzt hat, versteht, was Routing-Protokolle
    wie RIP und BGP später automatisch erledigen – und wo sie scheitern
    können.

    **Vorwissen:** IP-Adressen und Subnetze (Blatt 02), `ping` (Blatt 01).

In diesem Teil konfiguriert ihr Routing einmal komplett von Hand. Das schärft
das Verständnis dafür, was RIP und BGP in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) automatisieren.
(Die Teile des Blatts zählen über die Meilensteine hinweg: „Teil 2“ steht
auf der Seite von Meilenstein 2, „Teil 3“ und „Teil 4“ auf der von
Meilenstein 3.)

**Topologie `topoP03`:** Zwei Switches `s1` und `s2`, dazwischen ein Router
`r1` (`r1-eth0` an `s1`, `r1-eth1` an `s2`). An `s1` hängen `h1` und `h2`
(Netz 1), an `s2` hängen `h3` und `h4` (Netz 2). Alle Knoten starten **ohne
IPv4-Adresse**; die Adressierung und die Routen sind eure Aufgabe. Auf `r1`
ist die IP-Weiterleitung bereits eingeschaltet, `r1` darf also Pakete von
einem Netz ins andere weitergeben.

!!! info "Werkzeug: Mininet-Konsole und Knoten-Terminal"
    Mininet baut das Netz aus Hosts, Switches und Routern auf dem einen
    Rechner nach. Nach dem Start landet ihr an der **Mininet-Konsole**
    (`mininet>`). Zwei Wege führen von dort in einen Knoten:

    - `mininet> xterm r1` öffnet ein eigenes Terminalfenster für `r1`
      (`mininet> xterm r1 h1 h3` öffnet mehrere). In diesem Fenster gilt
      alles, was ihr tippt, nur für diesen Knoten.
    - `mininet> h2 ip addr` stellt den Knotennamen vor einen Befehl: Er läuft
      dann einmalig in `h2`, ohne ein Fenster zu öffnen.

    Neue Knotenfenster nehmen den Fokus und liegen oft über oder unter dem
    Mininet-Terminal; auch ein Klick in das Mininet-Terminal holt es nach
    vorn und verdeckt dabei die Knotenfenster. Keine Sorge, kein Fenster ist
    weg: Klickt oben links auf **Xfce4-terminal** (oder auf das Symbol unten
    links), dann zeigt die Liste alle Fenster, und ein Klick auf den Namen
    holt das Fenster nach vorn (✕ schließt es). Die Mininet-Konsole steht dort
    als „Terminal“. Prüft vor dem Tippen den Fenstertitel („Node: r1“ usw.);
    weitere Einzelheiten stehen unter
    [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).
    Geht beim Tippen der erste Buchstabe verloren, löscht die Zeile mit
    ++ctrl+u++ und tippt sie neu; der verlorene Buchstabe steht dann oft im
    Fenster, das vorher den Fokus hatte. Lange Befehle brechen im Fenster um;
    das ist nur die Darstellung, nicht Teil des Befehls. `clear` gibt es nur
    in Knotenfenstern; an der Mininet-Konsole meldet es `Unknown command`.
    ++ctrl+l++ leert dagegen überall den Bildschirm.

    Mit `exit` (gleichbedeutend: `quit`) an der Mininet-Konsole beendet ihr
    die Emulation. Nur in `topo03` ([Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh)) hat `exit` zwei Stufen, siehe dort.
    Beendet `topoP03` immer mit `exit`, bevor ihr `topo03` startet: Das
    Startskript räumt alles auf, was es findet, auch das laufende Netz.

!!! warning "Prozesse nie mit `pkill` oder `killall` beenden"
    Nie `pkill`/`killall` benutzen – die Mininet-Knoten teilen sich die
    Prozessliste mit eurem Desktop; `pkill nc` beendet euren ganzen Desktop
    und meldet euch ab. Beendet Prozesse mit ++ctrl+c++ oder `kill <PID>`
    (die PID zeigt `ps` bzw. bei Hintergrundjobs `jobs -l`; `kill %1` beendet
    den Job Nummer 1).

!!! info "Werkzeug: `ip` – Adressen und Routen anzeigen und setzen"
    `ip` ist das Standardwerkzeug von Linux für die Netzwerkeinstellungen. Es
    arbeitet auf der Vermittlungsschicht (Schicht 3).

    | Aufruf | Bedeutung |
    |---|---|
    | `ip -br addr` | alle Schnittstellen mit ihren Adressen, eine Zeile je Schnittstelle (`-br` = kurz) |
    | `ip addr add 10.0.0.1/24 dev h1-eth0` | Adresse `10.0.0.1` mit Präfixlänge 24 auf die Schnittstelle `h1-eth0` legen |
    | `ip route` | die Routing-Tabelle des Kernels anzeigen |
    | `ip route add 20.0.0.0/24 via 10.0.0.254` | Route eintragen: „Pakete für `20.0.0.0/24` gebe an `10.0.0.254` weiter" |
    | `ip route del 20.0.0.0/24` | die Route wieder löschen |

    Eine echte Ausgabe von `ip -br addr` auf einem Knoten ohne Adresse:

    ```text
    h1$ ip -br addr
    lo               UNKNOWN        127.0.0.1/8 ::1/128
    h1-eth0@if390    UP             fe80::6ced:c9ff:feff:34e/64
    ```

    (Die Zahl nach `@if` und die `fe80::…`-Adresse sind bei euch andere.)

    Erste Spalte: Name der Schnittstelle (`lo` ist die interne Schleife
    des Rechners, `h1-eth0` der Anschluss ans Netz). Zweite Spalte: Zustand
    (`UP` = eingeschaltet). Rest: die Adressen. Hier hat `h1-eth0` nur eine
    **Link-Local-Adresse** `fe80::…` (IPv6, gilt nur im eigenen Segment) und
    noch keine IPv4-Adresse. Typische Fehlermeldung:
    `ping: connect: Network is unreachable` bedeutet „in meiner
    Routing-Tabelle steht für dieses Ziel nichts, nicht einmal ein
    Standard-Gateway".

**Vorgemacht.** Startet die Topologie:

```bash
$ cd ~/rn-practice/topoP03
$ ./start-topoP03.sh
```

Nach etwa zehn Sekunden erscheint `mininet>`. Öffnet Terminals für den Router
und die Hosts `h1` und `h3`:

```bash
mininet> xterm r1 h1 h3
```

Prüft in `h1`, dass noch nichts konfiguriert ist, und versucht einen Ping zu
`h2`, der im selben Netz liegen soll:

```bash
h1$ ip -br addr
h1$ ping -c 1 10.0.0.2
```

Der Ping scheitert mit `ping: connect: Network is unreachable`: `h1` hat keine
Adresse und damit auch kein Netz, in dem `10.0.0.2` liegen könnte. Das ist der
gewünschte Ausgangszustand, kein Fehler von euch; dieselbe Meldung sieht man im
echten Netz auf jedem Rechner, dem das Gateway fehlt.

**Gemeinsam.** Wir vergeben die Adressen nach diesem Plan:

| Knoten | Schnittstelle | Adresse |
|---|---|---|
| `h1` | `h1-eth0` | `10.0.0.1/24` |
| `h2` | `h2-eth0` | `10.0.0.2/24` |
| `r1` | `r1-eth0` | `10.0.0.254/24` |
| `r1` | `r1-eth1` | `20.0.0.254/24` |
| `h3` | `h3-eth0` | `20.0.0.1/24` |
| `h4` | `h4-eth0` | `20.0.0.2/24` |

Beide Schnittstellen von `r1` brauchen eine Adresse aus dem jeweiligen Netz,
sonst kann `r1` nichts weiterleiten. Setzt zuerst `r1` und `h1`:

```bash
r1$ ip addr add 10.0.0.254/24 dev r1-eth0
r1$ ip addr add 20.0.0.254/24 dev r1-eth1
h1$ ip addr add 10.0.0.1/24 dev h1-eth0
h1$ ip route
```

`ip route` zeigt auf `h1` jetzt genau eine Zeile:

```text
10.0.0.0/24 dev h1-eth0 proto kernel scope link src 10.0.0.1
```

Gelesen: „Das Netz `10.0.0.0/24` ist direkt über `h1-eth0` erreichbar; als
Absender benutzt `h1` dabei `10.0.0.1`." `proto kernel` heißt: Der Kernel hat
diese Route selbst angelegt, als ihr die Adresse vergeben habt. Das sind die
**direkt angeschlossenen Netze**; für sie braucht es keine Route von Hand.

**Selbst.**

1. Vergebt die übrigen Adressen aus der Tabelle. Für `h2` und `h4` müsst ihr
    kein Fenster öffnen: `mininet> h2 ip addr add 10.0.0.2/24 dev h2-eth0`.
    Für `h3` nutzt das Terminal von `h3`.
2. Pingt von `h1` aus `h2` (`ping -c 2 10.0.0.2`): Das gelingt, beide stehen
    im selben Netz. Notiert dabei den Wert `ttl=…` in der Ausgabe.
3. Pingt von `h1` aus `h3` (`ping -c 2 20.0.0.1`): Das scheitert mit
    `Network is unreachable`. `h1` kennt kein Netz `20.0.0.0/24`.
4. Tragt auf `h1` und `h2` die Route zum Netz 2 über `r1` ein, auf `h3` und
    `h4` die Route zum Netz 1 (`h2`/`h4` wieder mit `mininet> h2 …`, bzw.
    `mininet> h4 …`):

    ```bash
    h1$ ip route add 20.0.0.0/24 via 10.0.0.254
    h2$ ip route add 20.0.0.0/24 via 10.0.0.254
    h3$ ip route add 10.0.0.0/24 via 20.0.0.254
    h4$ ip route add 10.0.0.0/24 via 20.0.0.254
    ```

5. Prüft mit `ping` und `traceroute` von `h1` zu `h3` und vergleicht die
    Routing-Tabelle von `r1` (`ip route`) mit der von `h1`.

!!! info "Werkzeug: `traceroute` – den Weg eines Pakets sichtbar machen"
    `traceroute` schickt Pakete mit absichtlich kleiner Lebensdauer (TTL).
    Jeder Router, der ein Paket verwirft, weil die TTL abgelaufen ist, meldet
    sich mit seiner Adresse zurück. So seht ihr Hop für Hop, welchen Weg die
    Pakete nehmen (Schicht 3).

    | Aufruf | Bedeutung |
    |---|---|
    | `traceroute -n 20.0.0.1` | Weg zum Ziel; `-n` zeigt Adressen statt Namen (schneller, kein DNS) |
    | `traceroute -n -q 1 20.0.0.1` | nur eine Probe je Hop statt drei |

    Echte Ausgabe auf `h1`:

    ```text
    h1$ traceroute -n 20.0.0.1
    traceroute to 20.0.0.1 (20.0.0.1), 30 hops max, 60 byte packets
     1  10.0.0.254  0.108 ms  0.030 ms  0.022 ms
     2  20.0.0.1  0.055 ms  0.035 ms  0.039 ms
    ```

    Kopfzeile: Ziel, höchstens 30 Hops, 60 Byte große Proben. Danach je Zeile
    ein Hop: Nummer, Adresse des Routers, drei Laufzeiten (eine je Probe).
    Hop 1 ist `r1` (`10.0.0.254`), Hop 2 das Ziel selbst. Ein `*` statt einer
    Laufzeit heißt: Auf diese Probe kam keine Antwort.

Erwartet:

```text
h1$ ping -c 3 20.0.0.1
PING 20.0.0.1 (20.0.0.1) 56(84) bytes of data.
64 bytes from 20.0.0.1: icmp_seq=1 ttl=63 time=1.79 ms
64 bytes from 20.0.0.1: icmp_seq=2 ttl=63 time=0.116 ms
64 bytes from 20.0.0.1: icmp_seq=3 ttl=63 time=0.123 ms

--- 20.0.0.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2022ms
```

`ttl=63` zeigt, dass ein Router dazwischen lag: `h3` startet seine Antwort mit
TTL 64, `r1` zieht eins ab. Beim Ping von `h1` zu `h2` im selben Netz steht
dagegen `ttl=64`, denn dort liegt kein Router dazwischen. Damit habt ihr selbst
bewiesen, dass `r1` das Paket weitergereicht hat, ganz ohne Routing-Protokoll;
den Unterschied zwischen 64 und 63 erkennt ihr künftig in jedem Netz.

![Drei Terminalfenster: oben links "Node: r1" mit den Adressen 10.0.0.254/24 und 20.0.0.254/24 auf r1-eth0 und r1-eth1, oben rechts "Node: h3" mit der Adresse 20.0.0.1/24 und der Route 10.0.0.0/24 via 20.0.0.254, unten "Node: h1" mit der Adresse 10.0.0.1/24, der Route 20.0.0.0/24 via 10.0.0.254, einem erfolgreichen ping von h1 zu 20.0.0.1 mit 0% Verlust und einem traceroute mit zwei Hops](../../assets/screenshots/03-routing-rip-bgp/topoP03-manual-routing.png)
*Von Hand eingetragene Adressierung und Routen in `topoP03`: `r1` bekommt
`10.0.0.254/24` und `20.0.0.254/24`, `h1` und `h3` je eine Route über `r1`. Der
`ping` von `h1` zu `h3` zeigt `ttl=63`, `traceroute` zwei Hops: `r1`, dann das
Ziel.*

!!! question "Nachgedacht: Warum scheitert der Ping, wenn nur eine Richtung stimmt?"
    Löscht auf `h3` die Rückroute (`h3$ ip route del 10.0.0.0/24`) und pingt
    erneut von `h1` aus. Öffnet dazu ein zweites Fenster für `h3` (`mininet> xterm h3`).
    Danach gibt es zwei Fenster mit dem gleichen Titel „Node: h3“: Das
    **neue** Fenster (das zuletzt geöffnete, es liegt vorn; in der Fensterliste
    ist sein Eintrag hervorgehoben) nehmt ihr für
    `tcpdump -n -i h3-eth0 icmp` (siehe Werkzeug-Kasten unten), im **alten**
    löscht ihr die Route. Startet `tcpdump` zuerst und löscht die Route erst
    danach. Schreibt vorher eure Vorhersage auf: Kommen die Anfragen bei `h3`
    an? Kommt eine Antwort bei `h1` an? Setzt die Route danach wieder
    (`h3$ ip route add 10.0.0.0/24 via 20.0.0.254`).

    !!! info "Werkzeug: `tcpdump` – Pakete auf einer Schnittstelle mitlesen"
        `tcpdump` schreibt jedes Paket, das über eine Schnittstelle läuft, als
        eine Zeile auf den Bildschirm (Schichten 2 bis 4; Wireshark in Blatt 01
        macht dasselbe grafisch).

        | Aufruf | Bedeutung |
        |---|---|
        | `tcpdump -n -i h3-eth0 icmp` | auf `h3-eth0` nur ICMP-Pakete (ping) zeigen; `-n` ohne Namensauflösung |
        | ++ctrl+c++ | beendet den Mitschnitt und gibt die Zusammenfassung aus |

        Echte Ausgabe, während `h1` ein `ping` schickt:

        ```text
        h3$ tcpdump -n -i h3-eth0 icmp
        tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
        listening on h3-eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
        00:01:26.730067 IP 10.0.0.1 > 20.0.0.1: ICMP echo request, id 1185, seq 1, length 64
        00:01:27.742507 IP 10.0.0.1 > 20.0.0.1: ICMP echo request, id 1185, seq 2, length 64
        ```

        Je Zeile: Uhrzeit, Absender `>` Empfänger, Art des Pakets (`echo
        request` = Ping-Anfrage), Kennung und laufende Nummer. Die Zeile
        `listening on …` sagt, dass der Mitschnitt läuft. Meldet `tcpdump`
        `No such device exists` oder `You don't have permission to perform this
        capture`, habt ihr den Befehl nicht im Terminal des Knotens getippt
        (`mininet> xterm h3`).

    ??? success druck-zu "Lösung"
        Ergebnis: Der Ping schlägt fehl (`100% packet loss`), obwohl `tcpdump` auf `h3`
        die Anfragen `echo request` sehr wohl zeigt. Es fehlen nur die
        Antworten: `h3` hat keine Route zurück in das Netz `10.0.0.0/24` und
        kann deshalb nicht antworten. (Genau genommen kann Linux die Anfrage nach dem Mitschnitt noch
        verwerfen, weil die Absenderadresse laut Routing-Tabelle nicht
        erreichbar ist, das sogenannte RP-Filtering. `tcpdump` zeigt die
        Anfrage trotzdem, denn er sieht das Paket vorher; davon handelt in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) der
        Abschnitt „RP-Filtering“.) Ein fehlgeschlagener Ping heißt also nicht
        „das Paket kam nicht an", sondern „ich habe keine Antwort gesehen".
        Routing ist **je Richtung** zu betrachten, nicht je Verbindung.

Ihr habt jetzt einen Router, der zwei Netze verbindet, und beide Seiten
vertrauen darauf, dass die Antworten von der richtigen Station kommen. Was
passiert, wenn sich ein dritter Rechner genau in diesen Weg drängt? Das ist
ARP-Spoofing – und dafür gibt es ein eigenes Blatt:
[Lab 05 – ARP-Spoofing & Denial-of-Service](../05-arp-spoofing-dos/index.md).

!!! success "Meilenstein 1 geschafft"
    **Das habt ihr gelernt:**

    - Adressen vergeben und auf den Hosts je eine Route zum anderen Netz mit ip route add eintragen.
    - Mit ping und traceroute prüfen, dass der Weg über den Router führt.
    - Erklären, dass ein Ziel auch den Weg zurück kennen muss.

    **Was Meilenstein 2 verspricht:** Als Nächstes übernehmen RIP und BGP diese Arbeit in einem Netz mit vier Routern. Ihr lest, woher jede Route stammt und welche von mehreren konkurrierenden der Router benutzt.

    [Weiter zu Meilenstein 2: Dynamisches Routing mit RIP und BGP](m2-rip-und-bgp.md){ .md-button }
