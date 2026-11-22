# 03 · Routing (RIP/BGP)

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/03-routing-rip-bgp.pdf){ .md-button }

## Lernziele

- Das Grundprinzip von Routing-Tabellen verstehen: direkt angeschlossene
  Netze werden automatisch eingetragen, entfernte Netze benötigen eine
  Route (statisch oder dynamisch gelernt).
- Routing zwischen zwei Netzen manuell mit `ip route add` konfigurieren –
  ganz ohne Routing-Protokoll.
- RIP (Distance Vector) und BGP (Path Vector) im gleichzeitigen Einsatz auf
  denselben Routern beobachten und ihr Konvergenzverhalten (periodischer
  Nachrichtenaustausch) im Wireshark-Mitschnitt erkennen.
- `vtysh`/FRR als Konfigurations- und Diagnosewerkzeug für Routing-Software
  bedienen (`show ip route`, `configure terminal`, Protokoll-Module).
- Administrative Distanz als Auswahlkriterium zwischen konkurrierenden
  Routing-Quellen verstehen und gezielt verändern.
- IPv6-Link-Local-Adressen (`fe80::…%Schnittstelle`) anwenden und verstehen,
  warum IPv6 neben IPv4 eine eigene, getrennte Adressfamilie mit eigener
  Tabelle ist.
- RP-Filtering als Schutzmechanismus gegen IP-Spoofing verstehen und
  kontrolliert (für Diagnosezwecke) deaktivieren können.
- Die Zeitkonstanten und den Protokoll-Overhead eines Routing-Protokolls aus
  einer eigenen Aufzeichnung selbst berechnen, statt sie aus einem Lehrbuch zu
  übernehmen (Nachrichten je Minute, Byte je Minute, Abstand zweier Updates).

--8<-- "issue-feedback.md"

## So lest ihr die Befehle in diesem Blatt

Ihr tippt Befehle an verschiedenen Stellen. Das Wort vor dem Dollar- oder
Rautenzeichen sagt euch, **wo**:

| Präfix | Wo ihr tippt | Beispiel |
|---|---|---|
| `$` | im normalen Terminal des Desktops | `./start-topo03.sh` |
| `mininet>` | an der Mininet-Konsole, die nach dem Start der Topologie im selben Terminal erscheint | `mininet> xterm r1` |
| `r1$`, `h1$`, … | in dem Terminalfenster, das `mininet> xterm r1` (bzw. `h1`) geöffnet hat; es gehört zu diesem einen Knoten | `r1$ ip route` |
| `r1#` | in `vtysh`, der Konsole der Routing-Software auf `r1` | `r1# show ip route` |

Nur der Text **nach** dem Präfix wird getippt, das Präfix selbst nicht. Auf dem
Bildschirm sieht es anders aus: In jedem Knoten-Fenster (Titel `Node: r1`)
steht `root@<Zahlen-Buchstaben>:~/rn-practice/topo03#` (in Meilenstein 1
heißt das Verzeichnis `topoP03` statt `topo03`). Das ist die
**Linux-Shell** des Knotens (`r1$` im Blatt), obwohl die Zeile mit `#` endet.
Erst nach `vtysh` ändert sich die Eingabezeile; ihr verlasst `vtysh` mit
`exit`. Der Prompt von `vtysh` zeigt ebenfalls die Container-Kennung statt
`r1`.

!!! tip "Fenster verloren? Nicht kaputt, nur verdeckt"
    Jedes neue Knotenfenster nimmt den Fokus, und ein Klick in ein Fenster holt
    es nach vorn und verdeckt dabei andere. Fenster verschwinden dadurch nicht:
    Klickt oben links auf **Xfce4-terminal** (oder auf das Symbol unten links),
    dann zeigt die Liste alle Fenster; ein Klick auf den Namen holt das
    Fenster nach vorn, ✕ schließt es. Die Mininet-Konsole steht dort als
    „Terminal“, `Launch New Instance` öffnet ein normales Terminal. Tippt
    einen `xterm`-Befehl immer an der Mininet-Konsole: Nach `xterm r2` hat das
    neue Knotenfenster den Fokus, also klickt vor dem nächsten `xterm` wieder
    in die Mininet-Konsole. Einzelheiten:
    [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).

## Aufgaben

Das Blatt ist in 4 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: Manuelles Routing](m1-manuelles-routing.md){ .meilenstein }  
   Auf dieser Seite verbindet ihr zwei Netze mit einem Router und tragt alle Routen selbst ein.
2. [Meilenstein 2: Dynamisches Routing mit RIP und BGP](m2-rip-und-bgp.md){ .meilenstein }  
   Hier laufen RIP und BGP gleichzeitig auf denselben Routern, und ihr lest mit vtysh und ip route, was sie gelernt haben.
3. [Meilenstein 3: Rekonvergenz und Protokollspuren messen](m3-rekonvergenz-und-spuren.md){ .meilenstein }  
   Auf dieser Seite messt ihr zwei Dinge: wie schnell ein Netz nach einem Ausfall umschaltet und wie viel Verkehr Routing-Protokolle erzeugen.
4. [Meilenstein 4: Tabellen, AS-Pfad, Metrik und Nachrichten lesen](m4-tabellen-und-nachrichten.md){ .meilenstein }  
   Hier lest ihr Tabellen, Metriken und Nachrichten der Routing-Protokolle genau und beantwortet damit die Frage, warum ein Paket seinen Weg nimmt.

## Quellen

- `mininet-labs/intro/03-Deep-Network.tex`
- `mininet-labs/vertiefung/Labor-03-Routing.tex` (Routing-Teil; ARP-Spoofing
  und MitM siehe [Lab 05](../05-arp-spoofing-dos/index.md))
- `mininet-labs/rn-practice/topoP03/` (`topoP03.py`, `start-topoP03.sh`) –
  für Teil 1
- `mininet-labs/rn-practice/topo03/` (`topo03.py`, `start-topo03.sh`,
  `tryping.sh`, FRR-Configs `r1`–`r4` (`zebra.conf`, `ripd.conf`,
  `bgpd.conf`), `lib/topotest.py`, `lib/topolog.py`) – für die Teile 2 bis 8 (Teil 2 in Meilenstein 2,
  Teile 3 und 4 in Meilenstein 3, Teile 5 bis 8 in Meilenstein 4)
- Olivier Bonaventure u. a.: *Computer Networking: Principles, Protocols and
  Practice*, UCLouvain (Université catholique de Louvain), Repository
  `cnp3/ebook`, Verzeichnis `exercises/traces/` – Lizenz CC BY-SA 3.0.
  Von dort stammt die Idee zu Teil 4, Zeitkonstanten und Overhead aus
  Protokollspuren selbst zu berechnen. Es wird keine Datei aus diesem Werk
  verwendet; die Spur in Teil 4 entsteht in der eigenen Topologie.
