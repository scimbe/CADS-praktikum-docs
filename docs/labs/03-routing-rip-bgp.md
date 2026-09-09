# 03 · Routing (RIP/BGP)

[:material-file-pdf-box: Als PDF herunterladen](../pdf/03-routing-rip-bgp.pdf){ .md-button }

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
- IPv4- und IPv6-Routing als getrennte, parallele Strukturen einordnen
  (separate Tabellen, weil nicht direkt kompatible Adressfamilien).
- RP-Filtering als Schutzmechanismus gegen IP-Spoofing verstehen und
  kontrolliert (für Diagnosezwecke) deaktivieren können.

## Aufgaben

### Teil 1 – Manuelles Routing zwischen zwei Netzen (`topoP03`)

Bevor wir dynamische Routing-Protokolle einsetzen, konfigurieren wir Routing
einmal komplett von Hand – das schärft das Verständnis dafür, was RIP/BGP in
Teil 2 automatisiert übernehmen.

```bash
cd ~/rn-practice/topoP03
./start-topoP03.sh
```

!!! note "Korrektur gegenüber dem Originaldokument"
    Das Originaldokument (`Labor-03-Routing.tex`) verweist im Einleitungstext
    fälschlich auf `start-topoP02.sh`, obwohl es sich inhaltlich und laut
    Verzeichnisangabe (`~/rn-practical/topoP03`) um `topoP03` handelt. Der
    korrekte Aufruf ist `./start-topoP03.sh` im Verzeichnis
    `~/rn-practice/topoP03` (auch hier war `rn-practical` im Original ein
    nicht existierender Pfad).

**Topologie:** Zwei Switches `s1`/`s2`, dazwischen ein Router `r1`. An `s1`
hängen `h1`/`h2` (Netz 1), an `s2` hängen `h3`/`h4` (Netz 2). Anders als bei
`topoP02` sind hier **weder Hosts noch Router-Interfaces vorkonfiguriert** –
das Skript aktiviert auf `r1` lediglich die IP-Weiterleitung
(`echo 1 > /proc/sys/net/ipv4/ip_forward`), alles andere ist eure Aufgabe.

!!! note "Technischer Hinweis zum Skript"
    `topoP03.py` verbindet die Switches mit einem `RemoteController` auf
    `127.0.0.1`. Ist kein separater OpenFlow-Controller-Prozess aktiv, bleibt
    die Controller-Verbindung der Switches ungenutzt – funktional
    unproblematisch, da das Skript beide Switches direkt im Anschluss per
    `ovs-ofctl` auf Normalbetrieb (`fail-mode standalone`,
    `actions=NORMAL`) umschaltet. Ihr könnt das an gelegentlichen
    Verbindungsfehlern in den Mininet-Logs erkennen, die ignoriert werden
    können.

Konfiguriert die Adressierung:

- Netzwerk 1: `10.0.0.0/24` – wählt für `h1` und `h2` je eine Adresse aus
  `10.0.0.1`–`10.0.0.253`.
- Netzwerk 2: `20.0.0.0/24` – wählt für `h3` und `h4` je eine Adresse aus
  `20.0.0.1`–`20.0.0.253`.

```bash
h1$ ip addr add 10.0.0.5/24 dev h1-eth0
```

!!! warning "Router-Interfaces zuerst konfigurieren"
    Bevor Hosts über `r1` kommunizieren können, müsst **ihr** `r1`s beide
    Interfaces (Richtung `s1` bzw. `s2`) mit je einer Adresse aus dem
    entsprechenden Netz versehen – das Skript tut dies nicht automatisch.

Setzt anschließend auf den Hosts die Routen zum jeweils anderen Netz über
`r1`:

```bash
h1, h2$ ip route add 20.0.0.0/24 via 10.0.0.254   # 10.0.0.254 = Adresse von r1 im Netz 1
h3, h4$ ip route add 10.0.0.0/24 via 20.0.0.254   # 20.0.0.254 = Adresse von r1 im Netz 2
```

Prüft die Konnektivität zwischen den beiden Netzen mit `ping` und
`traceroute`, und vergleicht die Routing-Tabelle auf `r1` (`ip route`) mit
der auf den Hosts.

![Drei Terminalfenster: "Node: r1" mit ip addr/ip addr add auf beiden Interfaces, "Node: h1" mit ip addr add und ip route add, "Node: h3" mit denselben Befehlen fuer Netz 2; unten ein erfolgreicher ping von h1 (10.0.0.1) zu h3 (20.0.0.1) mit 0% Verlust](../assets/screenshots/03-routing-rip-bgp/topoP03-manual-routing.png)
*Reale, von Hand eingetragene Adressierung und Routen in `topoP03`: `r1`
bekommt `10.0.0.254/24` bzw. `20.0.0.254/24` auf seinen beiden Interfaces,
`h1` und `h3` je eine Route über `r1` zum jeweils anderen Netz. Der
anschließende `ping` von `h1` zu `h3` bestätigt die Konnektivität
(`ttl=63`, ein Hop über `r1`).*

!!! note "ARP-Spoofing-Teil ausgelagert"
    Das Originaldokument (`Labor-03-Routing.tex`) enthält im Anschluss einen
    Abschnitt "Man in the Middle" (ARP-Spoofing mit `arpspoof` zwischen `h3`
    und `h4`). Dieser Teil gehört inhaltlich zu Angriffstechniken, nicht zu
    reinem Routing, und wurde daher nach
    [Lab 05 – ARP-Spoofing & Denial-of-Service](05-arp-spoofing-dos.md)
    verschoben. Er ist hier bewusst nicht enthalten.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 03 teil1
    ```


### Teil 2 – Dynamisches Routing mit RIP und BGP (`topo03`, FRR/`vtysh`)

Anwendungsprotokolle sind nur ein kleiner, sichtbarer Teil eines Netzwerks.
Darunter arbeitet eine komplexe Maschinerie aus Protokollen, Algorithmen und
Hardware zusammen, um Daten effizient und zuverlässig zu übertragen – wie
ein Paket seinen Weg findet, hängt von Routing, Adressierung und
Netzwerklast ab.

**Tipp:** Bei so vielen beteiligten Knoten hilft eine Skizze. Die Topologie
für dieses Experiment:

```text
                    r2
                   /  \
 192.168.1.1 --r1--s2  s3---r3--s4 192.168.3.1
                   \  /
                    r4

          s steht für Switch
          r steht für Vermittlungsknoten (Router)
```

#### Einführung in Routing, RIP und BGP

RIP (Routing Information Protocol) ist eines der einfachsten
Routing-Protokolle: Es verwendet eine simple Metrik (Hop-Zählung) und ist
leicht zu konfigurieren – ein guter Einstieg, um Konzepte wie
Routing-Tabellen und Konvergenz (das Zurückkehren zu einem stabilen Zustand
nach einer Änderung) zu verstehen. BGP (Border Gateway Protocol) ist
komplexer, aber das Protokoll, das das Internet zusammenhält: Es ermöglicht
die Kommunikation zwischen unterschiedlichen autonomen Systemen (AS) und
führt in Konzepte wie Pfadvektoren, Routing-Policies und Multi-Homing ein.
Beide Protokolle unterscheiden sich grundlegend darin, wie sie eine Route
"bewerten" und weitergeben – RIP zählt nur Hops, BGP wägt AS-Pfade und
Policies ab.

Startet die Topologie:

```bash
cd ~/rn-practice/topo03
./start-topo03.sh
```

!!! note "Zweistufiger Start"
    `start-topo03.sh` arbeitet in zwei Stufen: Stufe 1 erstellt das
    Szenario *ohne* Routing-Protokolle – ihr landet zunächst auf dem
    `mininet>`-Prompt. Ein einmaliges `exit` an diesem Prompt beendet nicht
    die Emulation, sondern startet die Routing-Dienste (RIP und BGP) auf
    allen vier Routern und öffnet danach erneut den `mininet>`-Prompt
    (Stufe 2). Erst ein *weiteres* `exit` bzw. `quit` beendet die Emulation
    tatsächlich.

Öffnet ein Terminal auf `r1` und schaut euch die konfigurierten Adressen an:

```bash
mininet> xterm r1
r1$ ip a s
```

Notiert die "Dotted Decimal"-Adressen (die vier durch Punkte getrennten
Dezimalzahlen der IPv4-Adresse). Wiederholt das mit den IPv6-Link-Local-
Adressen (`fe80::...`), die automatisch pro Interface vergeben werden – auch
ohne explizite IPv6-Konfiguration, da `ipv6 forwarding` auf allen Routern
aktiv ist.

#### Direkt angeschlossene Netze brauchen keine Route

Für direkt angeschlossene Netze ist kein zusätzlicher Routing-Aufwand nötig.
Öffnet zusätzlich ein Terminal für `r2` und pingt von dort alle IPv4-Adressen
von `r1` an (die Loopback-Adresse `127.0.0.1` könnt ihr ignorieren):

```bash
mininet> xterm r2
r2$ ping -c 1 193.1.1.1
r2$ ping -c 1 192.168.1.1
```

Nur die erste Adresse ist von `r2` aus ohne Weiterleitung erreichbar – sie
liegt im selben `/26`-Netz wie `r2`s eigene Schnittstelle (`193.1.1.0/26`).
Wiederholt den Test mit IPv6 (Link-Local-Adressen benötigen den
Interface-Zusatz, z. B. `ping6 fe80::1%r2-eth0`).

#### Routing-Tabellen im Detail: `topo03` konkret

Die tatsächlich in diesem Repository konfigurierten FRR-Router (`r1`–`r4`,
siehe `mininet-labs/rn-practice/topo03/r*/zebra.conf` etc.):

| Router | Schnittstellen (IPv4) | RIP | BGP (AS) |
|---|---|---|---|
| `r1` | `r1-eth0`=`192.168.1.1/24` (Stub), `r1-eth1`=`193.1.1.1/26` | – | 65001, Nachbar `193.1.1.2` |
| `r2` | `r2-eth0`=`193.1.1.2/26`, `r2-eth1`=`193.1.2.1/24` | ja | 65002, Nachbarn `193.1.1.1` und `193.1.2.2` |
| `r3` | `r3-eth0`=`192.168.3.1/24` (Stub), `r3-eth1`=`193.1.2.2/24` | ja | 65003, Nachbar `193.1.2.1` |
| `r4` | `r4-eth0`=`193.1.1.4/26`, `r4-eth1`=`193.1.2.4/24` | ja | **kein `bgpd.conf`** |

**Wichtig:** `r4` besitzt in diesem Repository keine `bgpd.conf` – er nimmt
also ausschließlich am RIP-Verbund teil, nicht am BGP-Verbund zwischen
`r1`/`r2`/`r3` (AS 65001/65002/65003). Genau das erzeugt später die zwei
konkurrierenden Routen zu `192.168.3.0/24` (einmal über `r2` per BGP, einmal
über `r4` per RIP), die im weiteren Verlauf untersucht werden.

!!! note "Korrektur/Präzisierung gegenüber dem Originaldokument"
    Das Originaldokument spricht durchgehend von "Quagga/FRR". In diesem
    Repository läuft konkret **FRR** (`routertype = 'frr'` als Default in
    `lib/topotest.py`, Konfigurationsverzeichnis `/etc/frr`) – Quagga selbst
    kommt nicht zum Einsatz. Da FRR ein Fork von Quagga mit weitgehend
    kompatibler `vtysh`-Syntax ist, bleiben alle im Original beschriebenen
    Befehle unverändert gültig.

!!! note "Playwright-Screenshot-Referenz"
    Für den Beleg der `vtysh -c "show ip route"`-Ausgabe eignet sich ein
    **Zeilen-/Locator-Screenshot** (siehe `tests/e2e/specs/screenshots.spec.ts`)
    deutlich besser als ein Fenster-Screenshot: Entscheidend ist der Inhalt
    einzelner Zeilen (das führende `B`/`R`/`C` und der Wert vor `via`, siehe
    unten), nicht der gesamte sichtbare Terminalzustand.

Prüft zunächst (noch vor Aktivierung der Routing-Protokolle, also in Stufe 1
direkt nach dem Start) die Routing-Tabelle von `r1` und versucht einen Ping
zu `192.168.3.1` – er schlägt fehl, da noch keine Route existiert:

```bash
mininet> xterm r1
r1$ ip route
r1$ ping -c 1 192.168.3.1
```

Startet Wireshark auf dem Interface `r1-eth1` und wechselt dann auf der
`mininet`-Konsole mit einmaligem `exit` in Stufe 2. Kurz danach beginnt ein
reger Paketaustausch, in dem RIP und BGP versuchen, Konvergenz zu erreichen
– beobachtet, wie sich diese Kommunikation in festen Zeitabständen
wiederholt (typisch für Distance-Vector-Protokolle wie RIP, im Gegensatz zu
Link-State-Protokollen wie OSPF, die nur bei Änderungen senden).

Prüft danach erneut die Routing-Tabelle auf `r1` – zusätzlich zu den beiden
direkt angeschlossenen Netzen sind nun zwei neue Routen sichtbar. Prüft die
Konnektivität zu `192.168.3.1` und verfolgt den Pfad:

```bash
r1$ tracepath 192.168.3.1
r1$ traceroute 192.168.3.1
```

`tracepath` ermittelt automatisch die Pfad-MTU und benötigt keine
Root-Rechte, `traceroute` zeigt zusätzlich die Latenz je Hop und ist hier
das aussagekräftigere Werkzeug. Ihr solltet sehen, dass der Pfad über
`193.1.1.2` (also über `r2`) führt.

#### Administrative Distanz: Warum gewinnt BGP?

Startet `vtysh` auf `r1` und lasst euch die Routing-Tabelle der
Routing-Software anzeigen:

```bash
r1$ vtysh
r1# show ip route
```

Die Tabelle wirkt größer und mit Dopplungen versehen: `192.168.3.0`
erscheint mehrfach – einmal `via 193.1.1.2` (mit vorangestelltem `B` für
BGP), einmal `via 193.1.1.4` (mit vorangestelltem `R` für RIP; `C` markiert
direkt angeschlossene Netze). Der Zahlenwert direkt vor `via` ist die
**administrative Distanz** – je niedriger, desto vertrauenswürdiger die
Quelle für die Auswahl der aktiven Route. BGP gewinnt hier, weil seine
administrative Distanz niedriger ist als die von RIP.

Ändert nun die administrative Distanz von BGP, um es unattraktiver zu
machen:

```bash
r1# configure terminal
r1(config)# router bgp
r1(config-router)# distance bgp 200 200 200
r1(config-router)# end
r1# write memory
```

Ein Fehler beim Anlegen einer Backup-Sicherung kann ignoriert werden. Für
Interessierte: Die drei Werte stehen für eBGP-Routen (von einem anderen
autonomen System gelernt), iBGP-Routen (innerhalb desselben AS gelernt) und
lokal auf dem Router konfigurierte BGP-Routen.

Prüft die Auswirkung auf die Betriebssystem-Routing-Tabelle:

```bash
r1$ traceroute 192.168.3.1
r1$ ip route
```

Der Pfad führt nun über `193.1.1.4` (`r4`, RIP) statt über `193.1.1.2`
(`r2`, BGP) – die niedrigere administrative Distanz gewinnt jetzt bei RIP.

!!! note "Rauschen in der Routing-Tabelle: eine vorkonfigurierte Route ohne Bezug zur Aufgabe"
    In `r3/zebra.conf` findet sich eine statische Route
    `ip route 192.168.2.0/24 192.168.3.10`. Das Netz `192.168.2.0/24`
    taucht in dieser Übung nirgends sonst auf – die Route ist ein Überbleibsel
    aus der ursprünglichen FRR/NetDEF-Testtopologie
    (`test_rip_topo1.py`, siehe Lizenzkopf in `topo03.py`), aus der dieses
    Skript abgeleitet wurde, und für die eigentliche Aufgabe irrelevant.
    Lasst euch von dieser Zeile in `show ip route` nicht verwirren.

#### Lokale Gültigkeit manueller Routen

Diese Routing-Änderungen gelten immer nur lokal auf dem jeweiligen Router.
Öffnet einen xterm für `r3`, startet Wireshark und pingt von `r3` auf
`192.168.1.1`:

```bash
mininet> xterm r3
r3$ ping 192.168.1.1
```

`r3` verwendet dabei `193.1.2.2` als Quelladresse. `r1` antwortet nicht,
weil ihm die Rückroute fehlt. Statt die RIP-Konfiguration zu reparieren,
setzen wir zur Demonstration manuell eine Route auf `r1`:

```bash
r3$ ping 192.168.1.1              # laufen lassen und Fenster im Blick behalten
r1$ ip route add 193.1.2.2/32 via 193.1.1.2
```

Sobald die Route auf `r1` aktiv wird, sollte der Ping von `r3` erfolgreich
werden. Prüft mit `traceroute` beide Wege von `r1` aus:

```bash
r1$ traceroute 192.168.3.1
r1$ traceroute 193.1.2.2
```

#### RP-Filtering: Schutz vor IP-Spoofing

Erzwingt nun, dass `r3` die Adresse `192.168.3.1` als Quelladresse für einen
Ping auf `192.168.1.1` verwendet:

```bash
r3$ ping -I 192.168.3.1 192.168.1.1
```

Überraschenderweise schlägt der Ping fehl. Ursache ist **RP-Filtering**
(Reverse Path Filtering) auf `r4`: ein Schutzmechanismus gegen IP-Spoofing,
der ein Paket verwirft, wenn die Antwort auf dieses Paket laut Routing-
Tabelle nicht über dasselbe Interface zurückkäme, über das es hereinkam.
Deaktiviert RP-Filtering testweise auf `r4`:

```bash
r4$ sysctl -w net.ipv4.conf.all.rp_filter=0
r4$ sysctl -w net.ipv4.conf.r4-eth0.rp_filter=0
```

Danach gelingt der Ping mit der erzwungenen Quelladresse.

#### Ausfall eines Pfads beobachten

Startet einen dauerhaften Ping von `r1` auf `192.168.3.1`, wechselt zu `r4`
und fahrt dort das Interface `r4-eth1` herunter – ihr solltet eine kurze,
vorübergehende Erhöhung der Ping-Latenz sehen, der Ping läuft aber weiter
(Umschwenken auf den alternativen Pfad). Beendet den Ping auf `r1` und
prüft mit `traceroute 192.168.3.1`, welchen Pfad ihr nun seht.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 03 teil2
    ```

!!! example "Vertiefung (optional): Routing wirklich kaputt machen"
    Der letzte Schritt oben hat nur ein einzelnes Interface kurz
    deaktiviert. Weil eure Topologie in einer komplett eigenen, isolierten
    Mininet-Instanz läuft – niemand sonst teilt sich diese vier Router mit
    euch –, könnt ihr hier deutlich weiter gehen, als es in einem gemeinsam
    genutzten physischen Laborraum vertretbar wäre: Deaktiviert testweise
    den RIP-Dienst auf `r2` *und* `r4` gleichzeitig
    (`vtysh -c "configure terminal" -c "no router rip" -c "end"` auf jedem
    der beiden) und prüft, ob `192.168.3.0/24` von `r1` aus überhaupt noch
    erreichbar ist, obwohl BGP weiterläuft. Setzt anschließend zusätzlich
    `distance bgp 200 200 200` (wie oben gezeigt) auf allen drei
    BGP-Routern gleichzeitig und beobachtet, ob das Netz komplett
    auseinanderfällt oder eine Restkonnektivität übrig bleibt. Startet die
    Topologie danach einfach neu – ein zerschossenes Routing-Setup ist hier
    ein Lernmoment, kein Vorfall, den ihr euren Kommiliton:innen erklären
    müsstet.


## Potenzielle Herausforderungen

!!! success "topoP03 (Teil 1) verifiziert (2026-09-09)"
    `topoP03` hatte einen eigenständigen Skript-Bug (`net.cmd(...)` in
    `topoP03.py` – `Mininet`-Objekte haben keine `cmd()`-Methode, harter
    `AttributeError` direkt nach dem Switch-Start, noch vor dem ersten
    CLI-Prompt), unabhängig vom Capability-Set. Nach Fix (`quietRun(...)`
    statt `net.cmd(...)`) läuft Teil 1 real gegen einen echten Container:
    manuelle Adressierung, Routen über `r1` und Ping zwischen den beiden
    Netzen wurden nachgestellt und funktionieren wie oben beschrieben
    (inklusive des anfänglich hohen ersten Ping-RTTs durch MAC-Lernen der
    beiden im Skript bereits auf `standalone` gesetzten Switches).

!!! info "topo03 (Teil 2, vier FRR-Router): FRR-10.x-Ladeproblem behoben, RIP/BGP konvergieren real"
    `topo03` hatte zunächst zwei reine Skript-Bugs, unabhängig vom
    Capability-Set: einen toten `import pytest` (Modul nicht installiert,
    Absturz schon beim Parsen der Datei) und einen harten `assert` beim
    Setzen mehrerer Sysctls (`net.ipv4.ip_forward` u. a.), die unter dem
    granularen Capability-Set
    (`NET_ADMIN`+`NET_RAW`+`SYS_ADMIN`+`apparmor:unconfined`, siehe
    [ADR 0002](../adr/0002-capabilities-not-privileged.md)) mit "permission
    denied" abgelehnt werden – beide behoben (siehe `topo03.py` und
    `lib/topotest.py`). Danach zeigte sich ein **tieferes Problem**: das im
    Container installierte FRR (`10.3-3+deb13u1`) lehnte beim Start von
    `zebra` über `--config_file` die vendorierten `interface <name>` /
    `ip address ...`-Blöcke in `zebra.conf` mit "No such command" ab – keiner
    der vier Router bekam dadurch je eine IP-Adresse zugewiesen. Ursache: das
    aus `test_rip_topo1.py` (NetDEF) vendorierte Test-Framework startete nie
    `mgmtd`, das seit FRR's Northbound-Umstellung (nach 8.x) neben
    `zebra`/`staticd` immer mitlaufen muss, damit `interface`/`ip
    address`-Konfiguration angewendet werden kann. **Behoben** in
    `lib/topotest.py`: `mgmtd` wird jetzt mitgestartet, und `zebra`
    bekommt sein `zebra.conf` – wie schon zuvor bei `ripd` – per `vtysh -f`
    zugestellt statt per `--config_file`. Real gegen einen aus dem aktuellen
    Image gebauten Container verifiziert: alle vier Router bekommen ihre
    IP-Adressen, RIP- und BGP-Routen erscheinen in `show ip route`, und ein
    echter `ping`/`traceroute` zwischen den beiden nicht direkt verbundenen
    Testnetzen (`192.168.1.0/24` bei `r1` und `192.168.3.0/24` bei `r3`)
    funktioniert. Details und Belege siehe
    [ADR 0002](../adr/0002-capabilities-not-privileged.md).

- **Falscher Skriptname im Original** (`start-topoP02.sh` statt
  `start-topoP03.sh`, s. o.) sowie ein nicht existierender Pfad
  (`rn-practical` statt `rn-practice`).
- **`RemoteController`-Abhängigkeit in `topoP03.py`** – ohne laufenden
  Controller-Prozess funktional unproblematisch (Fail-Mode `standalone`),
  kann aber zu Verbindungsfehlern in den Logs führen.
- **Rauschen in der Routing-Tabelle**: die statische Route
  `192.168.2.0/24 via 192.168.3.10` in `r3/zebra.conf` stammt aus der
  ursprünglichen FRR/NetDEF-Testtopologie und ist für die Aufgabe
  irrelevant (s. o.).
- **`r4` läuft ohne BGP** (keine `bgpd.conf`) – das ist kein Fehler, sondern
  die Grundlage für die Administrative-Distanz-Übung (zwei konkurrierende
  Routen aus RIP und BGP).
- **"Quagga/FRR"**: Diese Umgebung nutzt konkret FRR, nicht Quagga (s. o.);
  die `vtysh`-Bedienung ist davon nicht betroffen.
- **Zweistufiger Start** von `start-topo03.sh`: ein `exit` am
  `mininet>`-Prompt beendet die Emulation *nicht* sofort, sondern startet
  erst die Routing-Dienste (s. o.) – leicht mit einem Abbruch zu verwechseln.
- **`mininet> xterm <node>` funktioniert weiterhin**, öffnet aber intern
  `xfce4-terminal` statt eines echten `xterm` (Shim, siehe
  [Lab 01](01-netzwerkgrundlagen-tools.md#potenzielle-herausforderungen)).

## Quellen

- `mininet-labs/intro/03-Deep-Network.tex`
- `mininet-labs/vertiefung/Labor-03-Routing.tex` (nur der reine
  Routing-Teil; der ARP-Spoofing-/MitM-Teil wurde nach
  [Lab 05](05-arp-spoofing-dos.md) verschoben)
- `mininet-labs/rn-practice/topoP03/` (`topoP03.py`, `start-topoP03.sh`) –
  für Teil 1
- `mininet-labs/rn-practice/topo03/` (`topo03.py`, `start-topo03.sh`,
  `tryping.sh`, FRR-Configs `r1`–`r4` (`zebra.conf`, `ripd.conf`,
  `bgpd.conf`), `lib/topotest.py`, `lib/topolog.py`) – für Teil 2
