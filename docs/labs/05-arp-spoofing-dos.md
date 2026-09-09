# 05 · ARP-Spoofing & Denial-of-Service

[:material-file-pdf-box: Als PDF herunterladen](../pdf/05-arp-spoofing-dos.pdf){ .md-button }

!!! warning "Sicherheits- und Ethikhinweis"
    Dieses Aufgabenblatt behandelt reale Angriffstechniken (ARP-Spoofing,
    SYN-Flood). Diese dürfen **ausschließlich** innerhalb der eigenen,
    isolierten Mininet-Netzwerk-Namespace-Umgebung Ihres Teilnehmer-Containers
    angewendet werden — **niemals** gegen das Host-Netzwerk, die
    HAW-Infrastruktur oder Dritte (siehe auch der Sicherheitshinweis auf der
    [Startseite](../index.md)). Bereits der Versuch gegen fremde Systeme ist
    strafbar und ein Verstoß gegen die Nutzungsbedingungen der Umgebung.

## Lernziele

- Den Mechanismus von ARP-Spoofing (gefälschte, unaufgeforderte ARP-Replies)
  und das daraus resultierende Man-in-the-Middle-Szenario verstehen.
- Nachvollziehen, wie ein MITM-Angreifer HTTP-Inhalte einer Verbindung
  unbemerkt austauschen kann (Content-Swap über einen gefälschten Webserver).
- SYN-Flood als Ressourcenerschöpfungsangriff auf den TCP-Drei-Wege-Handshake
  (halboffene Verbindungen) verstehen und mit `hping3` praktisch
  nachvollziehen.
- Grundlegende Gegenmaßnahmen benennen können (statische ARP-Einträge,
  Dynamic ARP Inspection, SYN-Cookies).

## Aufgaben

### Teil A — ARP-Spoofing als Aufwärmübung (Zwei-Netz-Routing-Topologie)

> Dieser Abschnitt stammt ursprünglich aus `Labor-03-Routing.tex`, Abschnitt
> "Man in the Middle", wurde aber inhaltlich hierher verschoben, da er
> fachlich zu den Angriffstechniken (Lab 05) gehört und nicht zum
> Routing-Thema von [Lab 03](03-routing-rip-bgp.md).

Nutzen Sie die aus Lab 03 bekannte Zwei-Netz-Topologie
(`10.0.0.0/24` mit h1/h2, `20.0.0.0/24` mit h3/h4, verbunden über einen
Router) mit funktionierenden Routen zwischen beiden Netzen.

**Aufgabe:** Führen Sie von h4 einen Ping auf h1 aus. Leiten Sie diesen
Request mittels ARP-Spoofing (`arpspoof`) auf h3 um, sodass h3 die Anfragen
abfängt. Überprüfen Sie Ihren Erfolg in Wireshark. Lassen Sie h3 den
abgefangenen Request — irreführenderweise — selbst mit einer Antwort
beantworten, sodass h4 einen scheinbar erfolgreichen Ping von h1 sieht,
obwohl h3 geantwortet hat.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 05 teila
    ```


### Teil B — ARP-Spoofing mit HTTP-Content-Swap (`topo02`)

*(Quelle: `mininet-labs/rn-practice/topo02/` (Code) sowie
`mininet-labs/intro/04-arp-and-more-tex.tex`, "Lab 4: Angriffsvektoren"
(Originaltext) — beide Quellen stimmen im Ablauf überein: `h1` als Server
via `startHTTPD.py`, `h3` als Opfer via `./user-firefox` gegen
`http://10.0.10.11`, `h2` als Angreifer, der zunächst per `traceroute
10.0.10.11` das Gateway `10.0.20.1` identifiziert, es sich per
IP-Alias aneignet und dann `startARP-AttackerOnNodeH2.sh` startet. Der
Originaltext wurde bei einer früheren Konsolidierung nicht erfolgreich aus
Google Drive kopiert; die lokal vendorierte `.tex`-Datei enthält weiterhin
nur einen TODO-Hinweis, der Originalinhalt wurde für dieses Aufgabenblatt
erneut geladen und bestätigt die zuvor allein aus dem Code rekonstruierten
Schritte unten vollständig.)*

`topo02` baut eine Topologie mit zwei Routern und mehreren Hosts auf
(`h0--s1--r1---r2----s2---h3`, mit weiteren Hosts an den Switches), in der
ein regulärer Webserver und ein Angreifer im selben Segment betrieben werden.

```bash
cd ~/rn-practice/topo02
./start-topo02.sh
```

1. **Legitimen Server starten:** Auf dem Server-Host den echten Webserver
   starten (liefert `index.html`, mit deaktiviertem Caching):

   ```bash
   $ python3 startHTTPD.py
   ```

2. **Normalzustand prüfen:** Vom Opfer-Host aus den Server per Browser/`curl`
   aufrufen und den unveränderten Inhalt (`index.html`) bestätigen.

   ![Zwei Terminalfenster "Node: h2" und "Node: h3": h3 fuehrt curl -s http://10.0.10.11/ aus und erhaelt die echte Antwort "Wichtige Informationen von 10.0.10.11 (Node h1)"](../assets/screenshots/05-arp-spoofing-dos/topo02-before-attack.png)
   *Normalzustand vor dem Angriff: `h3` (Opfer) ruft den echten Webserver auf
   `h1` (`10.0.10.11`) auf und erhält den unveränderten Original-Inhalt.*

3. **Angriff starten:** Auf dem Angreifer-Host das Angriffsskript starten:

   ```bash
   $ ./startARP-AttackerOnNodeH2.sh
   ```

   ![Terminalfenster "Node: h2": Ausgabe des laufenden arpspoof-Prozesses mit wiederholten Zeilen "arp reply 10.0.20.1 is-at 0:0:0:0:0:3"](../assets/screenshots/05-arp-spoofing-dos/arpspoof-live.png)
   *Live-Ausgabe von `arpspoof` auf dem Angreifer-Host `h2`: fortlaufend
   gefälschte, unaufgeforderte ARP-Replies, die dem Opfer `h3` vortäuschen,
   die Gateway-Adresse `10.0.20.1` gehöre zur MAC-Adresse `0:0:0:0:0:3` von
   `h2` statt zum echten Router `r2`.*

   Das Skript tut dabei drei Dinge:

   - Es legt einen IP-Alias auf der eigenen Schnittstelle an
     (`ifconfig h2-eth0:0 10.0.10.11 up`), um eine fremde Identität im
     Netzsegment vorzutäuschen.
   - Es startet im Hintergrund `startHTTPD-Attacker.py` — einen zweiten,
     bösartigen Webserver, der anstelle von `index.html` die Datei
     `attack.html` ausliefert (ebenfalls mit deaktiviertem Caching, damit
     der Content-Swap sofort sichtbar wird und nicht durch einen
     Browser-Cache verschleiert bleibt).
   - Es startet `arpspoof -i h2-eth0 -t 10.0.20.11 10.0.20.1` — vergiftet
     damit den ARP-Cache des Ziels `10.0.20.11` mit gefälschten Antworten,
     die die Gateway-Adresse `10.0.20.1` auf die MAC-Adresse des Angreifers
     umleiten (klassisches Gateway-Impersonation-MITM).

4. **Angriff verifizieren:** Opfer-Host den Server erneut aufrufen (ggf.
   vorher lokalen ARP-Cache mit `clear-cache.sh` leeren, siehe unten) und
   beobachten, dass nun `attack.html` statt `index.html` ausgeliefert wird —
   der sichtbare Beweis für den erfolgreichen Content-Swap. Bestätigen Sie in
   Wireshark, dass die ARP-Replies für die Gateway-Adresse von der
   MAC-Adresse des Angreifers stammen, nicht vom echten Gateway.

   ![Zwei Terminalfenster: "Node: h2" zeigt die Zugriffslogs des gefaelschten Webservers ("10.0.20.11 - - GET / HTTP/1.1 200"), "Node: h3" zeigt fuenf curl-Aufrufe, die alle die manipulierte Antwort "Uih, da hat sie der Angreifer aber mit falschen Informationen versorgt" liefern](../assets/screenshots/05-arp-spoofing-dos/content-swap-success.png)
   *Erfolgreicher Content-Swap: Dieselbe Anfrage von `h3` an `10.0.10.11`
   liefert jetzt den Inhalt des Angreifer-Webservers auf `h2` statt der
   echten Antwort von `h1` (vgl. Screenshot oben vor dem Angriff) – die
   Zugriffslogs auf `h2` bestätigen, dass `10.0.20.11` (h3) tatsächlich beim
   Angreifer gelandet ist.*

5. **ARP-Cache zurücksetzen:** Für wiederholbare Demonstrationen den
   Neighbor-Cache aller Hosts leeren:

   ```bash
   $ ./clear-cache.sh   # entspricht: ip -s -s neigh flush all
   ```

6. **Angriff beenden:** Mit `Strg+C` auf dem Angreifer-Terminal — das Skript
   entfernt daraufhin den IP-Alias und beendet den gefälschten Webserver
   automatisch (siehe `trap`-Behandlung im Skript).

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 05 teilb
    ```


### Teil C — SYN-Flood-DoS mit `hping3` (`topo02`, Originaltext)

*(Quelle: `mininet-labs/intro/04-arp-and-more-tex.tex`, "Lab 4:
Angriffsvektoren" — bei einer früheren Konsolidierung war der
Kopiervorgang dieser Datei aus Google Drive fehlgeschlagen; der vollständige
Originalinhalt wurde für dieses Aufgabenblatt erneut aus der Quelle geladen
und ersetzt die zuvor hier stehende, generische Neuentwicklung.)*

Nutzt weiterhin die aus Teil B laufende `topo02`-Topologie.

1. **Ziel-Server starten** (falls nicht mehr aktiv): auf `h1` den
   HTTP-Dienst, der bereits in Teil B verwendet wurde:

   ```bash
   h1$ python3 startHTTPD.py
   ```

2. **Normalverhalten prüfen:** Öffnet auf `h3` Firefox und ruft `http://10.0.10.11`
   auf, um den Dienst zu testen. Schließt Firefox danach wieder, damit sich
   der Effekt des Angriffs im nächsten Schritt klarer beobachten lässt.

3. **SYN-Flood starten:** Als Angreifer agiert `h0` gegen den HTTP-Server
   auf `h1` (`10.0.10.11`):

   ```bash
   h0$ hping3 -c 15000 -d 120 -S -w 64 -p 80 --flood --rand-source 10.0.10.11
   ```

   `-c 15000` sendet 15.000 Pakete à `-d 120` Byte, `-S` setzt das SYN-Flag
   mit TCP-Fenstergröße `-w 64`, `-p 80` richtet den Angriff auf den
   HTTP-Port, `--flood` sendet ohne Rücksicht auf Antworten so schnell wie
   möglich, und `--rand-source` täuscht wechselnde, gefälschte
   Absender-IPs vor – das verschleiert die echte Quelle und verhindert
   zugleich, dass die SYN-ACK-Antworten des Opfers den Angreifer erreichen.

4. **Wirkung beobachten:** Öffnet erneut Firefox auf `h3` und versucht,
   `http://10.0.10.11` erneut aufzurufen. Startet zusätzlich auf `h1` einen
   xterm mit Wireshark und beobachtet die Quelladressen der eingehenden
   SYN-Pakete – das ist IP-Spoofing sichtbar im Mitschnitt. Rechnet damit,
   dass Wireshark unter der Last des Angriffs nicht mehr flüssig läuft.

5. **Angriff beenden** (`Strg+C`) und die Erholung des Ziels bestätigen
   (`http://10.0.10.11` erneut in Firefox aufrufen).

**Aufgabe:** Erklärt, warum `--rand-source` den Angriff wirksamer macht als
ein SYN-Flood von einer einzelnen, festen Quell-IP, und welche Gegenmaßnahme
(SYN-Cookies) der Linux-Kernel dagegen anbietet.

!!! note "Alternative Beobachtung ohne Browser"
    Wer den Effekt lieber quantitativ statt über den Browser beobachten
    möchte, kann zusätzlich auf `h1` mit `ss -tan state syn-recv | wc -l`
    den Anstieg halboffener Verbindungen zählen und mit `curl`/`nc` prüfen,
    ob eine neue, legitime Verbindung noch rechtzeitig zustande kommt. Das
    steht so nicht im Original (das ausschließlich über Firefox verifiziert),
    ist aber eine naheliegende, faktisch korrekte Ergänzung mit denselben
    bereits vorinstallierten Werkzeugen.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 05 teilc
    ```

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
    Absendern entwickelt. Kombiniert anschließend Teil B und Teil C: Lasst
    den ARP-Spoofing-Angriff aus Teil B weiterlaufen, während ihr den
    SYN-Flood aus Teil C startet – bricht dadurch auch der (weiterhin
    funktionierende) Webserver auf `h1` unter der Last zusammen, oder
    bleibt nur die MITM-Umleitung bestehen? In einem gemeinsam genutzten
    Netz wäre schon der erste Versuch nicht erlaubt gewesen.


### Teil D — Selbst zum Verteidiger werden: ARP-Spoofing als Opfer erkennen (`topo02`)

In Teil B habt ihr den Angriff aus Sicht des Angreifers (`h2`) durchgeführt
und in Wireshark bestätigt. In diesem Teil dreht ihr die Perspektive um:
Ihr seid jetzt das Opfer (`h3`) und müsst den laufenden Angriff **selbst
erkennen**, ohne vorher zu wissen, dass er stattfindet – so, wie es eine
reale Administratorin an ihrem Rechner tun müsste, ohne Wireshark-Mitschnitt
des Angreifers zur Hand zu haben.

Startet `topo02` (falls nicht mehr aktiv) und sorgt zunächst dafür, dass
`h3` eine "saubere" Basis hat, mit der ihr später vergleichen könnt:

```bash
cd ~/rn-practice/topo02
./start-topo02.sh
```

1. **Baseline aufnehmen.** Erzeugt auf `h3` zunächst Verkehr zum Gateway,
   damit dessen Eintrag im Nachbarschafts-Cache steht, und notiert euch die
   dabei angezeigte MAC-Adresse:

   ```bash
   h3$ ping -c 2 10.0.20.1
   h3$ ip neigh show 10.0.20.1
   ```

2. **Angriff im Hintergrund starten**, ohne dass `h3` etwas davon "weiß"
   (in einer echten Übung: bittet eine Kommilitonin/einen Kommilitonen, den
   Angriff für euch zu starten, während ihr nur auf `h3` schaut):

   ```bash
   h2$ ./startARP-AttackerOnNodeH2.sh
   ```

3. **Selbst erkennen, ohne Wireshark.** Prüft auf `h3` erneut denselben
   Nachbarschafts-Eintrag:

   ```bash
   h3$ ping -c 1 10.0.20.1
   h3$ ip neigh show 10.0.20.1
   ```

   **Aufgabe:** Vergleicht die MAC-Adresse mit eurer Notiz aus Schritt 1.
   Eine sich ändernde MAC-Adresse für dieselbe Gateway-IP, ohne dass am
   Gateway selbst etwas getauscht wurde, ist ein starkes Indiz für
   ARP-Spoofing. Bestätigt euren Verdacht, indem ihr auf `h2` die eigene
   Interface-MAC abfragt und mit der "neuen" Gateway-MAC vergleicht:

   ```bash
   h2$ ip link show h2-eth0
   ```

   Stimmen beide MAC-Adressen überein, habt ihr den Angreifer eindeutig
   identifiziert – rein aus der Opfer-Perspektive, ohne den Angriffs-Traffic
   selbst mitgeschnitten zu haben.

!!! success "Real geprüft"
    Auf einem frisch gestarteten Container zeigte `ip neigh show 10.0.20.1`
    auf `h3` vor dem Angriff `lladdr 00:00:00:00:00:06` (die echte MAC von
    `r2`) und nach dem Start von `startARP-AttackerOnNodeH2.sh`
    `lladdr 00:00:00:00:00:03` – exakt die MAC-Adresse, die `ip link show
    h2-eth0` auf `h2` als dessen eigene Interface-Adresse ausweist. Als
    zusätzliches, nicht erwartetes Indiz erschien während des Angriffs beim
    Ping auf `h3` zudem einmalig die Meldung
    `From 10.0.20.10: icmp_seq=1 Redirect Host(New nexthop: 10.0.20.1)` –
    ein ICMP-Redirect, ausgelöst dadurch, dass der Angreifer (`10.0.20.10`)
    kurzzeitig als vermeintlicher Zwischen-Hop auftaucht. Auch das ist ein
    beobachtbares Warnsignal, auch wenn es nicht in jedem Timing-Fenster
    zuverlässig auftritt.

**Aufgabe:** Nennt zwei Gründe, warum diese Erkennungsmethode (manueller
Vergleich der Nachbarschafts-Tabelle) in einem echten, großen Firmennetz
mit hunderten Rechnern nicht praktikabel skaliert, und recherchiert
stichwortartig, wie automatisierte Gegenmaßnahmen wie **Dynamic ARP
Inspection** (auf verwalteten Switches) oder Tools wie **arpwatch** dasselbe
Prinzip (Änderung einer IP-zu-MAC-Zuordnung erkennen) automatisieren.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 05 teild
    ```


## Potenzielle Herausforderungen

- **`topo02` (ARP-Spoofing/`hping3`) ist seit 2026-09-09 unter dem
  granularen Capability-Set (`NET_ADMIN`+`NET_RAW`+`SYS_ADMIN`+
  `apparmor:unconfined`, siehe
  [ADR 0002](../adr/0002-capabilities-not-privileged.md)) real verifiziert.**
  `topo02.py` baute vorher wegen eines reinen Skript-Bugs (fehlender
  `controller=`-Parameter) gar nicht — nach dem Fix wurden `arpspoof -i
  h2-eth0 -t ...` und das IP-Aliasing per `ifconfig h2-eth0:0 ... up` real
  getestet: `arpspoof` sendet tatsächlich die gefälschten ARP-Replies
  (`arp reply 10.0.20.1 is-at <MAC von h2>` im Mitschnitt sichtbar), Rohsockets
  über `NET_RAW` funktionieren also wie unter `privileged: true`.
- In `topo02.py` fällt bei genauerem Lesen eine Ungereimtheit in der
  Interface-Benennung auf: mehrere `addLink()`-Aufrufe vergeben für `h1`
  literal den Namen `h0-eth0` statt `h1-eth0` (z. B.
  `addLink(h[1], s[1], intfName1='h0-eth0', ...)`). Das ist zwar
  ungewöhnlich benannt, aber (auf dieser Codebasis real geprüft) harmlos: `h1`
  bekommt dadurch konsequent selbst eine Schnittstelle namens `h0-eth0`
  zugewiesen und alle nachfolgenden Befehle referenzieren denselben Namen,
  sodass kein tatsächlicher Namenskonflikt zwischen verschiedenen Nodes
  entsteht (Interface-Namen sind ohnehin pro Netzwerk-Namespace separat).
  Ein echter, bestätigter Bug lag stattdessen an anderer Stelle, siehe
  nächster Punkt.
- **Nachtrag (2026-09-09):** Nach dem `controller=`-Fix (siehe oben) lief
  `arpspoof`/der HTTP-Content-Swap zwar bereits real, `net.pingAll()` zeigte
  in derselben `topo02`-Topologie aber weiterhin **100 % Paketverlust auf
  allen 30 Host-Paaren**, während einzelne manuell abgesetzte `ping`s
  (inkl. `h0`↔`h1`, `h0`↔`r1`, `h0`↔`h2` über beide Router) fehlerfrei
  funktionierten. Ursache: `topo02.py` setzt alle IP-Adressen per rohem
  `ifconfig` statt über Mininets `Intf.setIP()`-API, wodurch Mininets interne
  IP-Buchführung (von `node.IP()`, das `net.pingAll()` zur Zieladressen-
  Ermittlung verwendet) auf der beim Linkaufbau automatisch vergebenen
  `10.0.0.x`-Adresse stehen blieb, statt die real konfigurierte Adresse zu
  kennen — jeder `pingAll()`-Ping ging dadurch ins Leere. Fix: `topo02.py`
  synchronisiert nach jedem `ifconfig`-Aufruf die betroffene Schnittstelle
  per `Intf.updateIP()`. Auf einem frisch gestarteten, zuvor nie benutzten
  Container real nachgewiesen: `*** Results: 0% dropped (30/30 received)`.
  Für Teil B/C dieses Aufgabenblatts ändert das nichts an den bereits
  bestätigten Ergebnissen (die nutzen gezielte Host-Paare, keinen
  `pingAll()`), stellt aber sicher, dass die volle Netz-Konnektivität der
  Topologie tatsächlich wie im Docstring beschrieben funktioniert.
- `--rand-source` bei `hping3` kann innerhalb der Mininet-Namespaces zu
  ungewöhnlichem ARP-/Routing-Verhalten führen, da die vorgetäuschten
  Quell-IPs im Testnetz nicht existieren. Im isolierten Mininet-Setup ist
  das unkritisch, verdeutlicht aber gleichzeitig, warum echte Netze
  IP-Spoofing üblicherweise per Ingress-Filterung (BCP 38) unterbinden.
- **Teil C nutzt jetzt den originalen Wortlaut** (`04-arp-and-more-tex.tex`,
  erneut aus Google Drive geladen) statt der zuvor hier stehenden,
  generischen Neuentwicklung — der `hping3`-Aufruf und die Verifikation über
  Firefox sind damit direkt aus der Quelle übernommen, nicht mehr erfunden.
  Die lokal vendorierte `.tex`-Datei selbst enthält weiterhin nur einen
  TODO-Hinweis (s. Quellen unten); ein Nachziehen dieser Korrektur dort wird
  empfohlen.

## Playwright-Screenshot-Referenz

In `tests/e2e/specs/screenshots.spec.ts` eignet sich ein
**Fenster-Screenshot** (`captureWindow`) für das geöffnete Wireshark-Fenster
mit den sichtbaren gefälschten ARP-Replies (Teil B) — hier ist der Kontext
mehrerer Pakete relevant. Für den Nachweis des Content-Swaps bzw. des
SYN-Flood-Effekts eignet sich dagegen ein **Zeilen-Screenshot**
(`captureLine`) besser: eine einzelne `arp -a`-Zeile mit der durch Spoofing
veränderten MAC-Adresse, oder (bei der optionalen quantitativen Beobachtung
in Teil C) eine `ss -tan`-Zeile im Zustand `SYN-RECV` während des
Flood-Tests.

## Quellen

- `mininet-labs/rn-practice/topo02/` (`topo02.py`, `start-topo02.sh`,
  `startARP-AttackerOnNodeH2.sh`, `startHTTPD.py`,
  `startHTTPD-Attacker.py`, `clear-cache.sh`) — Referenzimplementierung für
  Teil B, durch den Originaltext (s. u.) inhaltlich bestätigt.
- `mininet-labs/intro/04-arp-and-more-tex.tex` ("Lab 4: Angriffsvektoren")
  — Originaltext für Teil B (ARP-MitM) und Teil C (SYN-Flood). Die lokal
  vendorierte Kopie dieser Datei enthält weiterhin nur einen technischen
  TODO-Hinweis (fehlgeschlagener Google-Drive-Kopiervorgang in einer
  früheren Session); der oben verwendete Originalinhalt wurde für dieses
  Aufgabenblatt erneut aus Google Drive gelesen, aber nicht in die
  vendorierte `.tex`-Datei zurückgeschrieben (außerhalb des Geltungsbereichs
  dieser Konsolidierung) — ein Nachziehen wird empfohlen.
- `mininet-labs/vertiefung/Labor-03-Routing.tex`, Abschnitt "Man in the
  Middle" — Ursprung von Teil A, fachlich hierher verschoben.
- `docs/reference/umgebung.md` — Bestätigung, dass `hping3` im Image
  vorinstalliert ist.
