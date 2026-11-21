# Meilenstein 4 von 4 · UDP, Bufferbloat und Algorithmenvergleich

*04 · TCP/UDP & Congestion Control* · [Übersicht des Blatts](index.md)

Hier betrachtet ihr Dienstgüte jenseits des reinen Durchsatzes: UDP-Qualität, Warteschlangen und die Wahl des Staukontroll-Algorithmus.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Anwendungsschicht</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Netzzugriffsschicht · beteiligt</div>
</div>
</div>

### Teil H — UDP vermessen: Jitter und Verlust mit `iperf3 -u` (`topo02`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr lest in der UDP-Zusammenfassung von `iperf3` Jitter und
    verlorene Datagramme ab und begründet, warum nur die `receiver`-Zeile das
    Ergebnis ist.

    **Wozu?** Für Sprache, Video und Spiele zählt nicht der Durchsatz,
    sondern, wie gleichmäßig und vollständig die Pakete ankommen. Ein
    VoIP-Admin liest genau diese zwei Zahlen (Jitter, Verlust), um zu
    entscheiden, ob eine Strecke für Telefonie taugt.

    **Vorwissen:** `iperf3` aus [Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control), Verlust aus [Teil A](m1-fehlerrate-mtu.md#teil-a-fehlerrate-mtu-und-ip-fragmentierung-topop04).

In [Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control) habt ihr UDP mit `iperf` (Version 2) gemessen. `iperf3` gibt für UDP
zusätzlich Jitter und den Anteil verlorener Datagramme aus. Die Beschreibung
von `iperf3` steht in [Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control), Schritt 7. Bei UDP bestimmt ihr die Rate mit
`-b`, das Protokoll drosselt nicht von selbst. Bei UDP zählt allein die
`receiver`-Zeile, denn nur sie sagt, was tatsächlich ankam.

**Vorgemacht.** `topo02` läuft. `h0` → `h2` über den 10-Mbit/s-Link, zuerst mit
einer Rate unter der Kapazität. Läuft der `iperf3`-Server auf `h2` noch aus dem
vorigen Teil, lasst ihn laufen (sonst `Address already in use`):

```bash
h2$ iperf3 -s
h0$ iperf3 -u -b 8M -t 5 -c 10.0.20.10
```

Echte Ausgabe (die letzten Zeilen):

```text
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-5.00   sec  4.77 MBytes  8.00 Mbits/sec  0.000 ms  0/3454 (0%)  sender
[  5]   0.00-5.00   sec  4.77 MBytes  8.00 Mbits/sec  0.019 ms  0/3454 (0%)  receiver
```

- `Jitter`: beim `sender` steht `0.000 ms`. Den Jitter kann nur der Empfänger
  messen, er beträgt hier 0,019 ms.
- `Lost/Total Datagrams`: `0/3454`, also nichts verloren.

**Selbst.** Wiederholt die Messung mit einer Rate über der Link-Kapazität und
vergleicht die `Lost/Total`-Spalte:

```bash
h0$ iperf3 -u -b 12M -t 10 -c 10.0.20.10
```

??? success "Erwartung und Lösung"
    So sieht die echte Ausgabe aus:

    ```text
    [  5]   0.00-10.00  sec  14.3 MBytes  12.0 Mbits/sec  0.000 ms  0/10360 (0%)  sender
    [  5]   0.00-11.20  sec  13.0 MBytes  9.71 Mbits/sec  0.335 ms  969/10360 (9.4%)  receiver
    ```

    Der Sender behauptet 12 Mbit/s ohne Verlust. Der Empfänger hat 9,71 Mbit/s
    empfangen, 9,4 % der Datagramme fehlen und der Jitter ist auf 0,335 ms
    gestiegen. Ihr habt mehr in die Leitung gedrückt, als sie trägt. Bei sehr
    kurzer Laufzeit (`-t 5`) kann der Verlust noch ausbleiben, weil die
    Warteschlange vor dem Link den Überschuss zunächst auffängt.

!!! question "Nachgedacht: Warum gibt es Jitter und Verlust bei UDP, TCP braucht sie nicht?"
    ??? success "Lösung"
        TCP gleicht Verlust durch Neuübertragung aus und liefert die Daten
        geordnet ab. Die Anwendung sieht nur Verzögerung. UDP liefert, was
        ankommt, wann es ankommt. Die Anwendung selbst muss Verlust und
        Schwankung bewältigen, deshalb sind genau diese Zahlen für sie
        wichtig.

!!! quote "Hintergrund: woher iperf kommt"
    `iperf` entstand am NLANR/DAST (ursprünglich von Mark Gates und Alex
    Warshavsky); `iperf3` ist eine vollständige Neuimplementierung von ESnet /
    Lawrence Berkeley National Laboratory, derselben Institution, aus der auch
    `tcpdump` und die Congestion-Avoidance-Arbeit von 1986 stammen. Beide
    Werkzeuge haben ähnliche Optionen, aber unterschiedliche Interna, etwa die
    getrennte Steuerverbindung von `iperf3`.

    - ESnet iperf3: <https://software.es.net/iperf/>
    - Debian-Manpage iperf (AUTHORS/NLANR): <https://manpages.debian.org/bookworm/iperf/iperf.1.en.html>

    Die drei UDP-Diensteigenschaften (keine Zustellgarantie, mögliche
    Umsortierung, aber Verwerfen beschädigter Datagramme) stehen in **RFC 768**
    (im Abschnitt *Introduction* bzw. *Fields*; RFC 768 hat keine nummerierten
    Abschnitte).

### Teil I — Bufferbloat: warum eine schnelle Leitung träge werden kann (`topo02`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr zeigt, dass ein sättigender Datenstrom die Umlaufzeit
    einer gleichzeitigen `ping`-Messung auf mehrere Sekunden treibt, obwohl
    kein Paket verloren geht, und erklärt, warum eine kleinere Warteschlange
    hilft.

    **Wozu?** „Sobald jemand im Haus einen Film lädt, ruckelt mein
    Videoanruf“ ist ein klassischer Bufferbloat-Fall. Wer als Admin einen
    Router konfiguriert, entscheidet mit der Warteschlangenlänge zwischen
    flüssiger Telefonie und stabilen Downloads.

    **Vorwissen:** `tc netem` aus [Teil D](m3-stoerungen-messen.md#teil-d-storungen-selbst-erzeugen-verzogerung-verlust-und-bandbreite-mit-tc-topo02), `iperf3` aus [Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control).

Bisher habt ihr Verlust und Verzögerung getrennt betrachtet. Dieser Teil
behandelt einen Effekt, der in Heimnetzen häufig auftritt: Eine Leitung wird
unter Last sekundenlang träge, nicht weil Pakete verloren gehen, sondern weil
sie in einer zu großen Warteschlange stehen. Der Name dafür ist *Bufferbloat*.

**Vorgemacht.** `topo02` läuft. Ihr braucht zwei Terminals auf `h0`:

```bash
h0$ tc qdisc add dev h0-eth0 root netem rate 2mbit limit 1000   # kleine Rate, große Queue
h0$ ping -c 3 10.0.20.10                                        # Leerlauf-RTT merken
h2$ iperf3 -s                                                   # nur, wenn noch keiner läuft
h0$ iperf3 -c 10.0.20.10 -t 20 &                                # Leitung sättigen
h0$ sleep 5                                                     # warten, bis die Queue gefüllt ist
h0$ ping -c 5 10.0.20.10                                        # RTT unter Last
h0$ tc qdisc del dev h0-eth0 root                               # aufräumen
```

Echte Ausgabe (gekürzt):

```text
rtt min/avg/max/mdev = 0.702/0.717/0.728/0.011 ms        <- Leerlauf
rtt min/avg/max/mdev = 2776.816/2944.185/3084.044/102.236 ms   <- unter Last, 0 % Verlust
```

Der erste Wert unter Last kann kleiner sein, er steigt, während sich die Queue
füllt; deshalb das `sleep 5`. Die Leerlauf-RTT liegt unter einer Millisekunde. Unter Last steigt sie auf
**fast drei Sekunden**, ohne dass ein `ping`-Paket verloren geht. Die Pakete
warten in der großen Queue.

**Selbst.** Begrenzt jetzt die Wartezeit in der Queue. `tbf` mit `latency 400ms`
hält die Warteschlange so kurz, dass ein Paket höchstens 400 ms wartet, mit
`latency 50ms` nur 50 ms. Messt beide Fälle und zählt danach mit
`tc -s qdisc show dev h0-eth0` die verworfenen Pakete (`dropped`):

Wartet, bis die Ausgabe von `iperf3` beendet ist (20 s), sonst meldet der
Server „server is busy“, und räumt die vorherige Regel vorher mit
`tc qdisc del dev h0-eth0 root` ab.

```bash
h0$ tc qdisc add dev h0-eth0 root tbf rate 2mbit burst 32kbit latency 50ms
h0$ iperf3 -c 10.0.20.10 -t 20 &
h0$ sleep 5
h0$ ping -c 5 10.0.20.10
h0$ tc -s qdisc show dev h0-eth0
h0$ tc qdisc del dev h0-eth0 root
```

Wiederholt das mit `latency 400ms`.

??? success "Erwartung und Lösung"
    Die Messwerte der drei Queue-Varianten:

    | Queue | RTT unter Last (min/avg/max) | `dropped` | Durchsatz (receiver) |
    |---|---|---|---|
    | `netem … limit 1000` (Vorgemacht) | 2,8 / 2,9 / 3,1 s | 0 | 1,9 Mbit/s |
    | `tbf … latency 400ms` | 11 / 168 / 291 ms | 5 | 1,90 Mbit/s |
    | `tbf … latency 50ms` | 19 / 28 / 40 ms | 31 | 1,83 Mbit/s |

    Je kürzer die Queue, desto kürzer die Wartezeit. Dafür verwirft sie Pakete,
    sobald sie voll ist, und TCP wiederholt sie (in der `iperf3`-Ausgabe steigt `Retr` von 5 auf 29).
    Der Durchsatz bleibt praktisch gleich.

!!! question "Nachgedacht: Warum hilft eine kleinere Queue, und was kostet sie?"
    Diese Abwägung ist der Grund, warum Router statt einer einfachen großen
    FIFO-Queue Verfahren wie `fq_codel` verwenden.

    ??? success "Lösung"
        Eine kleinere Queue hält die Wartezeit kurz, verwirft aber Pakete,
        sobald sie voll ist. TCP erkennt den Verlust, verkleinert sein Fenster
        und sendet weniger. Das ist gewünscht, denn so bleibt die Queue kurz.
        Eine zu große Queue verbirgt die Überlast vor TCP, das Fenster wächst
        weiter, und die Latenz steigt (Bufferbloat). `fq_codel` verwirft
        gezielt so früh, dass die Wartezeit klein bleibt.

### Teil J — Zwei Staukontroll-Algorithmen nebeneinander sichtbar machen (`topo02`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr belegt, dass `iperf3 -C reno` Reno benutzt, und lest den
    Algorithmusnamen sowie die MSS in `ss -ti` ab. Ihr erklärt, warum der
    Algorithmus eine Eigenschaft der einzelnen Verbindung ist.

    **Wozu?** Server im Rechenzentrum und Smartphones nutzen
    unterschiedliche Algorithmen (Linux-Standard Cubic, Reno als Klassiker, BBR
    in manchen Rechenzentren); hier vergleicht ihr Reno und Cubic. Wer Durchsatzprobleme
    auf einer Langstrecke untersucht, prüft zuerst, welcher Algorithmus auf
    der Verbindung läuft, denn auf Strecken mit hoher Latenz verhalten sie
    sich sehr verschieden.

    **Vorwissen:** `ss -ti` ([Teil C](m2-durchsatz-und-staukontrolle.md#teil-c-das-tcp-congestion-window-unter-paketverlust-live-beobachten-topop04)), `iperf3` ([Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control), Schritt 7).

[Teil B](m2-durchsatz-und-staukontrolle.md#teil-b-iperfiperf3-in-topo02-durchsatz-latenz-fairness-und-congestion-control), Schritt 7 hat Reno und Cubic am Durchsatz verglichen. In diesem Teil
macht ihr sichtbar, dass jede einzelne Verbindung ihren Algorithmus als
Eigenschaft trägt und dass `ss` ihn benennt.

**Vorgemacht.** `topo02` läuft. Prüft zuerst, welche Algorithmen der Kernel
anbietet:

```bash
h0$ sysctl -n net.ipv4.tcp_available_congestion_control
```

Ausgabe: `reno cubic`. Dann die Messung mit Reno, mit `ss` während der
Übertragung (läuft der Server auf `h2` schon, lasst ihn laufen):

```bash
h2$ iperf3 -s
h0$ iperf3 -C reno -c 10.0.20.10 -t 6 &
h0$ sleep 2; ss -ti dst 10.0.20.10   # während der Transfer läuft
```

Echte Ausgabe (gekürzt):

```text
ESTAB 0  3725424  10.0.10.10:52484  10.0.20.10:5201
     reno wscale:7,7 rto:2113 rtt:1269.83/147.455 mss:1448 … cwnd:2513 …
ESTAB 0  0        10.0.10.10:52474  10.0.20.10:5201
     cubic wscale:7,7 rto:203 rtt:2.506/1.652 … mss:1448 … cwnd:10 …
```

Die Messverbindung (Port 5201, viele Daten in `Send-Q`) trägt `reno`. Die
Steuerverbindung von `iperf3` daneben, ohne Datenverkehr, `cubic`.

**Selbst.** Wartet, bis der erste Lauf beendet ist, und wiederholt die Messung
ohne `-C reno` (System-Standard Cubic). Vergleicht die Algorithmus-Zeile.

??? success "Erwartung und Lösung"
    Beide Verbindungen zeigen jetzt `cubic`. Der Algorithmus ist also keine
    globale Einstellung, sondern eine Eigenschaft je Verbindung. Das sehr
    große `cwnd` (hier 2513 Segmente) kommt von der langen Warteschlange vor
    dem Link (Teil I). Die RTT der Messverbindung liegt dort bei über einer
    Sekunde.

!!! info "Hintergrund: AIMD, und warum Cubic der Standard wurde"
    Beide Algorithmen folgen dem Grundprinzip *Additive Increase, Multiplicative
    Decrease* (AIMD): das Fenster wächst langsam linear und wird bei einem
    Verlust drastisch (multiplikativ) verkleinert. Reno halbiert bei einem
    Verlust und wächst danach um rund ein Segment je Round Trip – auf Strecken
    mit hoher Bandbreite und hoher Latenz braucht es dadurch sehr lange, um
    das Fenster wieder zu füllen. Cubic (Linux-Standard) löst dieses Problem
    mit einer kubischen Wachstumskurve, die sich nach einem Verlust erst
    schnell, dann vorsichtig dem alten Wert nähert. AIMD wird im CNP3-Lehrbuch
    (Kapitel *Congestion control*) erklärt; die konkrete Reno-Regel („bei drei
    doppelten Bestätigungen halbieren“) steht in **RFC 5681, Abschnitt 3.2**.

    Quelle des Konzepts: *Computer Networking: Principles, Protocols and
    Practice*, O. Bonaventure u. a., UCLouvain, Kapitel „Congestion control“
    (CC BY-SA 3.0), <https://beta.computer-networking.info/syllabus/default/protocols/congestion.html>.

!!! question "Nachgedacht: Warum bräuchte man verschiedene Algorithmen?"
    ??? success "Lösung"
        Reno ist einfach und gut verstanden, wächst aber bei hoher Bandbreite
        und Latenz sehr langsam. Cubic wächst schneller zurück zum alten
        Wert. Welcher Algorithmus besser ist, hängt von Strecke und
        Verlustmuster ab, deshalb lässt Linux ihn je Verbindung wählen.

--8<-- "issue-feedback.md"

!!! success "Meilenstein 4 geschafft"
    **Das habt ihr gelernt:**

    - In der iperf3-UDP-Auswertung Jitter und verlorene Datagramme ablesen und erklären, warum nur die receiver-Zeile zählt.
    - Bufferbloat nachweisen: Ein sättigender Strom treibt die Umlaufzeit hoch, obwohl nichts verloren geht; eine kürzere Warteschlange hilft.
    - Reno und Cubic vergleichen und erklären, dass der Algorithmus eine Eigenschaft der einzelnen Verbindung ist.

    **Wie es weitergeht:** Blatt 05 (ARP-Spoofing und Denial-of-Service) wendet das Wissen aus den Blättern 02 und 04 auf Angriffe an: Ihr vergiftet ARP-Caches für Man-in-the-Middle und seht, wie ein SYN-Flood den TCP-Handshake ausnutzt.

    [Weiter zu Blatt 05 · ARP-Spoofing & Denial-of-Service](../05-arp-spoofing-dos/index.md){ .md-button }
