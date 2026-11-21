# 04 · TCP/UDP & Congestion Control

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/04-tcp-udp-congestion.pdf){ .md-button }

## Lernziele

- Erklären, wie sich eine Link-Fehlerrate (zufälliger Paketverlust) auf Ping,
  UDP und TCP unterschiedlich auswirkt, und die Größenordnung vorher
  ausrechnen.
- Den Zusammenhang zwischen MTU-Begrenzung, IP-Fragmentierung und
  UDP-Paketverlust im Mitschnitt nachweisen.
- Durchsatz, Latenz und das Zusammenspiel von Pufferung und
  Verbindungskonkurrenz mit `iperf`/`iperf3` messen und die gemessenen Werte
  gegen vorher gebildete Erwartungswerte prüfen.
- Beobachten, wie eine TCP-Verbindung (roher `iperf`-Strom wie auch eine
  SSH-Sitzung) auf eine kurzzeitige Unterbrechung des Pfads reagiert, im
  Unterschied zu einer laufenden `ping`-Messung.
- Das Congestion Window (`cwnd`) einer laufenden Verbindung mit `ss -ti`
  ablesen und Reno und Cubic vergleichen.
- Störungen (Verzögerung, Verlust, Bandbreite) mit `tc`/`netem` selbst
  erzeugen und eine eingestellte Netzeigenschaft gegen den gemessenen Wert
  halten, die Abweichung in Prozent angeben und begründen.

--8<-- "issue-feedback.md"

## So arbeitet ihr an diesem Blatt

Die Aufgaben laufen in zwei Mininet-Topologien. In `topoP04` (Teile A, C, F)
liegt zwischen zwei Hosts ein Link mit Verlust, in `topo02` (Teile B, D, E, G
bis J) ein verlustfreier Link mit 10 Mbit/s zwischen zwei Routern.

Die Teile heißen hier A bis J (nicht 1 bis n). Teil A beginnt gleich unter
„Aufgaben“; im Inhaltsverzeichnis rechts steht er vor Teil B und hat die
Unterpunkte „Die Topologie“ und „Schritt 1“ bis „Schritt 3“.

Ein Präfix vor einem Befehl zeigt, in welchem Fenster ihr ihn tippt. **Das
Präfix selbst tippt ihr nicht mit**; euer Prompt sieht anders aus (zum Beispiel
`root@…:~/rn-practice/topo02#`). Kopiert ihr einen Befehl aus dem Blatt, löscht
das Präfix.

| Präfix | Fenster |
|---|---|
| `h1$`, `h2$`, `h0$`, … | das Terminal des Knotens (Fenstertitel „Node: h1“ usw.) |
| `r1$` | das Terminal des Routers `r1` (Fenstertitel „Node: r1“) |
| `mininet>` | das Fenster, in dem ihr das Start-Skript gestartet habt |
| `$` | ein normales Terminal des Desktops |
| `ssh$` | die SSH-Sitzung, die ihr in einem Knoten-Terminal geöffnet habt |

Ein zusätzliches Terminal für einen Knoten öffnet ihr im Mininet-Fenster mit
`mininet> xterm h2`. Die Knoten-Fenster liegen nach dem Start oft übereinander:
Schaut vor jedem Befehl auf den Fenstertitel („Node: h0“ usw.), sonst läuft er
im falschen Knoten. Verlust ist zufällig: eure Zahlen weichen von den
Beispielwerten ab. Zu jeder Messung nennt das Blatt deshalb die Spannweite, die
ihr erwarten könnt.

!!! warning "Prozesse nie mit `pkill` oder `killall` beenden"
    Nie `pkill`/`killall` benutzen – die Mininet-Knoten teilen sich die
    Prozessliste mit eurem Desktop; `pkill nc` beendet euren ganzen Desktop
    und meldet euch ab. Beendet Prozesse mit ++ctrl+c++ oder `kill <PID>` (die
    PID zeigt `jobs -l` bzw. `ps`; ein Hintergrundjob lässt sich mit
    `kill %1` beenden).

!!! info "Ein Server belegt sein Terminal"
    Ein Server (`iperf -s`, `iperf3 -s`, `nc -l`, `sshd -D`) belegt sein
    Terminal, bis ihr ++ctrl+c++ drückt. Meldet ein Server `Address already in
    use` (bei `iperf3`: `unable to start listener for connections`), läuft er
    schon: Lasst ihn laufen oder beendet ihn mit ++ctrl+c++ und startet ihn neu.
    Mehrere Server gleichzeitig gehen nur in verschiedenen Terminals. Ebenso
    ist ein Dauer-`ping` erst dann beendet, wenn ihr ++ctrl+c++ drückt.

!!! tip "Es läuft immer nur eine Topologie"
    Zum Wechseln beendet ihr die laufende Topologie mit `mininet> exit`, bevor
    ihr die nächste startet. Das Blatt erinnert euch an jedem Wechsel.

## Aufgaben

Das Blatt ist in 4 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: Fehlerrate, MTU und Fragmentierung](m1-fehlerrate-mtu.md){ .meilenstein }  
   Auf dieser Seite untersucht ihr, wie Paketverlust und eine kleine MTU Ping, UDP und TCP beeinflussen.
2. [Meilenstein 2: Durchsatz und Staukontrolle](m2-durchsatz-und-staukontrolle.md){ .meilenstein }  
   Hier messt ihr Durchsatz und Latenz einer Strecke und beobachtet, wie TCP sein Sendefenster anpasst.
3. [Meilenstein 3: Störungen erzeugen und nachmessen](m3-stoerungen-messen.md){ .meilenstein }  
   Auf dieser Seite stellt ihr Störungen selbst her und vergleicht Soll mit Ist.
4. [Meilenstein 4: UDP, Bufferbloat und Algorithmenvergleich](m4-udp-bufferbloat-algorithmen.md){ .meilenstein }  
   Hier betrachtet ihr Dienstgüte jenseits des reinen Durchsatzes: UDP-Qualität, Warteschlangen und die Wahl des Staukontroll-Algorithmus.

## Quellen

- Olivier Bonaventure u. a.: *Computer Networking: Principles, Protocols and
  Practice*, UCLouvain (Université catholique de Louvain), Repository
  `cnp3/ebook`, Lizenz CC BY-SA 3.0. Von dort stammt die Idee zu Teil E, eine
  zugesicherte Netzeigenschaft gegen die Messung zu halten. Es wird kein Text
  und keine Datei aus diesem Werk übernommen.
