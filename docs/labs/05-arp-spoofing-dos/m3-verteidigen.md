# Meilenstein 3 von 3 · Erkennen, messen, verteidigen

*05 · ARP-Spoofing & Denial-of-Service* · [Übersicht des Blatts](index.md)

Auf dieser Seite nehmt ihr die Rolle des Verteidigers ein: Angriffe erkennen, ihren Schaden messen und prüfen, welche Gegenmaßnahmen wirklich helfen.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Anwendungsschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzzugriffsschicht · Schwerpunkt</div>
</div>
</div>

### Teil D — Selbst zum Verteidiger werden: ARP-Spoofing als Opfer erkennen (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt ARP-Spoofing als Opfer erkennen, ohne vorher
      zu wissen, dass ein Angriff läuft, und ohne den Angriffstraffic selbst
      mitgeschnitten zu haben.
    - **Wozu?** – Genau das ist die Situation realer Administrator:innen:
      Sie bemerken nur Symptome (Verbindungsabbrüche, falsche Inhalte) und
      müssen ohne fertigen Beweis-Mitschnitt entscheiden, ob ein Angriff
      läuft.
    - **Vorwissen** – Der Angriffsablauf aus [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02), `ip neigh` aus
      [Lab 02](../02-subnetting-arp/index.md).

In [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) habt ihr den Angriff aus Sicht des Angreifers (`h2`) durchgeführt
und in Wireshark bestätigt. In diesem Teil dreht ihr die Perspektive um:
Ihr seid jetzt das Opfer (`h3`) und müsst den laufenden Angriff **selbst
erkennen**, ohne vorher zu wissen, dass er stattfindet – so, wie es eine
reale Administratorin an ihrem Rechner tun müsste, ohne Wireshark-Mitschnitt
des Angreifers zur Hand zu haben.

Startet `topo02` nur, wenn das Fenster mit `mininet>` nicht mehr offen ist –
sonst zerstört der Start die noch laufende Topologie. Sorgt zunächst dafür,
dass `h3` eine "saubere" Basis hat, mit der ihr später vergleichen könnt:

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

    (Beendet den Angriff am Ende mit ++ctrl+c++ im Terminal von `h2`.)

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

    Das Fenster `Node: h2` ist noch durch das laufende Skript belegt. Gebt den
    Befehl dann in der Mininet-Konsole ein: `mininet> h2 ip link show h2-eth0`.

    Stimmen beide MAC-Adressen überein, habt ihr den Angreifer eindeutig
    identifiziert – rein aus der Opfer-Perspektive, ohne den Angriffs-Traffic
    selbst mitgeschnitten zu haben.

!!! info "Was ihr seht"
    Vor dem Angriff zeigt `ip neigh show 10.0.20.1` auf `h3`
    `lladdr 00:00:00:00:00:06` (die echte MAC von `r2`), nach dem Start von
    `startARP-AttackerOnNodeH2.sh` dagegen `lladdr 00:00:00:00:00:03` – genau
    die MAC-Adresse, die `ip link show h2-eth0` auf `h2` als dessen eigene
    Interface-Adresse ausweist. Beim Ping auf `h3` kann während des Angriffs
    zusätzlich die Meldung
    `From 10.0.20.10: icmp_seq=1 Redirect Host(New nexthop: 10.0.20.1)`
    erscheinen – ein ICMP-Redirect, ausgelöst dadurch, dass der Angreifer
    (`10.0.20.10`) kurzzeitig als vermeintlicher Zwischen-Hop auftaucht. Auch
    das ist ein Warnsignal, es tritt aber nicht in jedem Timing-Fenster auf.

**Aufgabe:** Nennt zwei Gründe, warum diese Erkennungsmethode (manueller
Vergleich der Nachbarschafts-Tabelle) in einem echten, großen Firmennetz
mit hunderten Rechnern nicht praktikabel skaliert, und recherchiert
stichwortartig, wie automatisierte Gegenmaßnahmen wie **Dynamic ARP
Inspection** (auf verwalteten Switches) oder Tools wie **arpwatch** dasselbe
Prinzip (Änderung einer IP-zu-MAC-Zuordnung erkennen) automatisieren.

--8<-- "issue-feedback.md"

### Teil E — SYN-Flood quantitativ: den Schaden messen und SYN-Cookies wirken sehen (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt den Schaden eines SYN-Floods in Zahlen fassen
      (Anzahl halboffener Verbindungen, Erfolg/Misserfolg einer legitimen
      Verbindung) und die Gegenmaßnahme SYN-Cookies aktivieren und ihre
      Wirkung messen.
    - **Wozu?** – „Ich glaube, der Angriff wirkt" reicht in der Praxis
      nicht: Monitoring und Incident-Response verlangen Zahlen – wie viele
      halboffene Verbindungen, wie viele legitime Anfragen scheitern –
      vor und nach dem Schalten einer Gegenmaßnahme.
    - **Vorwissen** – [Teil C](m2-syn-flood.md#teil-c-syn-flood-dos-mit-hping3-topo02) (SYN-Flood mit `hping3`), `ss` kennt ihr bereits
      aus [Lab 01](../01-netzwerkgrundlagen-tools/index.md) und
      [Lab 04](../04-tcp-udp-congestion/index.md); hier nutzt ihr den Filter
      `state syn-recv`.

[Teil C](m2-syn-flood.md#teil-c-syn-flood-dos-mit-hping3-topo02) hat den SYN-Flood *gestartet* und über den Browser beobachtet. Das ist
ein qualitativer Eindruck („die Seite lädt nicht mehr"). Jetzt messt ihr den
Angriff in Zahlen – wie viele halboffene Verbindungen er erzeugt und ob eine
legitime Verbindung noch durchkommt – und schaltet die eigentliche
Gegenmaßnahme des Linux-Kernels ein: **SYN-Cookies**.

!!! info "Werkzeug: `ss -tan state syn-recv` – was es zählt"
    Ein TCP-Server, der ein `SYN` empfängt, antwortet mit `SYN-ACK` und wartet
    auf das dritte Paket des Handshakes. Bis es kommt, steht die Verbindung
    **halboffen** im Zustand `SYN-RECV`. `ss -tan state syn-recv` listet genau
    diese. **Was es misst:** wie viele Handshakes gerade in der Schwebe hängen.
    **Typische Fehldeutung:** eine kleine Zahl für „harmlos" zu halten – die Zahl
    ist durch die **Backlog-Größe** des Servers gedeckelt, und genau dieser
    kleine Vorrat ist die knappe Ressource, die der Angriff erschöpft.

**Ziel:** Zeigen, dass ein SYN-Flood eine legitime Verbindung verhindert, und
dass SYN-Cookies sie zurückholen.

**Vorbedingung:** `topo02` läuft, der HTTP-Server auf `h1` (`10.0.10.11`)
läuft bereits (prüft mit `h1$ pgrep -f startHTTPD.py`). Angreifer ist `h0`, ein unbeteiligter
legitimer Client ist `h3`.

!!! warning "`sysctl -w` allein schlägt hier fehl"
    `/proc/sys` ist in diesem Container schreibgeschützt; ein direktes
    `sysctl -w net.ipv4.tcp_syncookies=0` bricht mit `sysctl: permission
    denied on key "net.ipv4.tcp_syncookies"` ab.
    Da `tcp_syncookies` eine Eigenschaft je Netzwerk-Namespace ist, genügt ein
    auf den eigenen Host beschränkter Umweg über eine neue Sicht auf
    `/proc/sys`:

    ```bash
    h1$ unshare -m sh -c 'mount -o remount,rw /proc/sys && sysctl -w net.ipv4.tcp_syncookies=0'
    ```

    Der Kernelwert bleibt danach für diesen Host gesetzt, auch wenn jeder
    weitere Befehl wieder in der ursprünglichen, weiterhin schreibgeschützten
    Sicht läuft — bestätigen lässt sich das mit einem anschließenden einfachen
    `sysctl net.ipv4.tcp_syncookies` (ohne `unshare`), das den neuen Wert zeigt.

**Schritte:**

```bash
# 1. Legitimer Zugriff im Normalzustand:
h3$ curl -s -o /dev/null -w '%{http_code}\n' http://10.0.10.11/
# 2. SYN-Cookies AUS, dann fluten und waehrenddessen messen:
h1$ unshare -m sh -c 'mount -o remount,rw /proc/sys && sysctl -w net.ipv4.tcp_syncookies=0'
h0$ hping3 -S -p 80 --flood --rand-source 10.0.10.11 &
h1$ ss -tan state syn-recv | grep -c :80      # halboffene Verbindungen
h3$ curl -s -o /dev/null -m 3 -w '%{http_code}\n' http://10.0.10.11/   # legitim?
# 3. SYN-Cookies AN; der Flood aus Schritt 2 laeuft weiter. Legitim testen:
h1$ unshare -m sh -c 'mount -o remount,rw /proc/sys && sysctl -w net.ipv4.tcp_syncookies=1'
h3$ curl -s -o /dev/null -m 3 -w '%{http_code}\n' http://10.0.10.11/
```

Beendet den Flood danach mit `h0$ jobs -l` und `h0$ kill <PID>` (oder holt
ihn mit `fg` zurück und drückt ++ctrl+c++).

Zusätzlich zählt der Kernel verworfene SYN mit. Lest den Zähler auf `h1` vor
dem Flood (vor dem `hping3`-Aufruf) und nach dem Flood ab. Notiert den Wert
vorher und nachher; die Differenz zählt:

```bash
h1$ nstat -az TcpExtListenDrops
```

**Erwartete Ausgabe:** Im Normalzustand liefert `curl` den Statuscode `200`.
`nstat -az` zeigt Zählerstände seit dem Start der Topologie; vergleicht deshalb
immer den Wert vorher mit dem Wert nachher. Unter Flood mit `syncookies=0`
steht in `ss … syn-recv` nur eine kleine Zahl halboffener Verbindungen (der
Server-Backlog ist begrenzt) und der Zähler `TcpExtListenDrops` wächst stark
an.

!!! warning "Das Ergebnis von `curl` hängt vom Kernel ab"
    Ob der legitime `curl` unter Flood tatsächlich mit `000` scheitert, hängt
    vom Kernel des Hosts ab. Es kommt vor, dass `curl` trotz laufendem Flood
    und `syncookies=0` weiter `200` liefert, obwohl `ss` volle halboffene
    Slots und `TcpExtListenDrops` verworfene SYN zeigen. Der Angriff wirkt
    dann trotzdem (SYN werden verworfen), der Unterschied ist nur nicht am
    `curl`-Code ablesbar. Verlasst euch deshalb auf die Zähler (`ss`,
    `TcpExtListenDrops`) und wiederholt den `curl` mehrmals, statt nur einen
    einzelnen Abruf zu werten. Notiert, was ihr tatsächlich seht.

!!! info "Was ihr seht"
    Der legitime `curl` von `h3` liefert vor dem Angriff `200`. Unter Flood mit
    `net.ipv4.tcp_syncookies=0` zählt `ss … syn-recv` nur wenige halboffene
    Verbindungen (so viele wie der kleine Listen-Backlog des Python-Servers)
    und `TcpExtListenDrops` steigt. Je nach Kernel scheitert der legitime
    `curl` dabei mit `000` oder liefert trotzdem `200` (siehe Kasten oben).
    Das Prinzip der SYN-Cookies: Sie halten für die Flut keinen Zustand vor,
    sondern kodieren ihn in die Sequenznummer – der Backlog läuft gar nicht
    erst voll.

!!! info "Hintergrund: warum `--rand-source` den Angriff erst wirksam macht"
    `--rand-source` fälscht für jedes SYN eine andere Absender-IP. Dadurch (a)
    verschleiert es die Quelle und (b) sorgt dafür, dass die `SYN-ACK`-Antworten
    ins Leere gehen und der Handshake nie abgeschlossen wird – jede Verbindung
    bleibt halboffen. Ohne `--rand-source` käme entweder ein `RST` der echten
    Quelle zurück (der den Slot sofort freigäbe) oder die Quelle wäre trivial zu
    sperren. Deshalb ist die randomisierte Quelle kein Detail, sondern der Kern
    des Angriffs – und der Grund, warum eine Abwehr, die auf der Quell-IP
    aufsetzt, scheitert (siehe Teil F).

### Teil F — Eine naheliegende Gegenmaßnahme, die scheitert: die nft-Ratenbegrenzung (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt eine naheliegende, aber wirkungslose
      Gegenmaßnahme (SYN-Ratenbegrenzung per Firewall) selbst bauen, ihre
      Wirkung messen und begründen, warum sie scheitert.
    - **Wozu?** – In der Praxis greifen Teams oft zuerst zur Firewall-Regel,
      bevor sie verstehen, warum diese bei gefälschten Absenderadressen
      nicht hilft. Dieser Teil zeigt das am eigenen gemessenen Fehlschlag,
      nicht nur in der Theorie – eine wichtige Erfahrung, bevor man Budget
      für die falsche Lösung ausgibt.
    - **Vorwissen** – Teil E (SYN-Flood, `ss`), Grundbegriff Paketfilter/
      Firewall-Regel.

Bevor man zur richtigen Lösung (SYN-Cookies, Teil E) greift, liegt eine andere
nahe: „Dann begrenze ich eben die SYN-Rate mit der Firewall." In diesem Teil
baut ihr genau das mit `nft` und **messt, dass es die legitime Verbindung nicht
rettet** – ein Lehrstück darüber, warum eine plausible Maßnahme trotzdem falsch
sein kann.

!!! info "Werkzeug: `nft` (nftables) – was die Regel tut"
    `nftables` ist der moderne Nachfolger von `iptables`. Eine Regel wie
    `tcp flags syn limit rate 20/second` lässt die ersten 20 SYN je Sekunde
    durch und verwirft (per zweiter Regel `drop`) den Rest. **Was sie tut:** die
    *Gesamtzahl* eingehender SYN begrenzen. **Was sie nicht kann:** zwischen dem
    SYN eines Angreifers und dem eines legitimen Clients unterscheiden – beide
    sind nur SYN-Pakete auf Port 80.

**Ziel:** Eine SYN-Ratenbegrenzung bauen, unter Flood messen und feststellen,
dass sie den Angriff nicht entschärft – und begründen, warum.

**Vorbedingung:** wie Teil E; `syncookies` zunächst wieder auf `0` setzen, damit
ihr die Wirkung der Firewall-Regel isoliert seht.

**Schritte:**

```bash
h1$ unshare -m sh -c 'mount -o remount,rw /proc/sys && sysctl -w net.ipv4.tcp_syncookies=0'
h1$ nft add table ip fw
h1$ nft add chain ip fw input '{ type filter hook input priority 0; }'
h1$ nft add rule ip fw input tcp dport 80 tcp flags syn limit rate 20/second burst 20 packets accept
h1$ nft add rule ip fw input tcp dport 80 tcp flags syn drop
h1$ nstat -az TcpExtListenDrops   # Wert vorher notieren
h0$ hping3 -S -p 80 --flood --rand-source 10.0.10.11 &
h3$ curl -s -o /dev/null -m 3 -w '%{http_code}\n' http://10.0.10.11/
h1$ nstat -az TcpExtListenDrops   # Wert nachher; die Differenz zaehlt
h1$ nft flush ruleset          # aufraeumen
h0$ jobs -l                    # PID des hping3 ablesen
h0$ kill <PID>                 # Flood beenden
h1$ unshare -m sh -c 'mount -o remount,rw /proc/sys && sysctl -w net.ipv4.tcp_syncookies=1'   # Ausgangszustand
```

**Erwartete Ausgabe:** Die Firewall-Regel ändert nichts Entscheidendes: Der
legitime `curl` verhält sich wie ohne Regel (je nach Kernel `000` oder `200`,
siehe Hinweis in Teil E). Vergleicht auch den Zähler `TcpExtListenDrops` mit
dem aus Teil E und haltet fest, ob die Regel etwas daran ändert.

!!! info "Was ihr seht"
    Der legitime `curl` von `h3` verhält sich unter Flood auch mit der
    `nft`-SYN-Ratenbegrenzung genau wie ohne Regel (zur kernelabhängigen
    Ausgabe siehe Teil E). Der Grund: Die
    Ratenbegrenzung verwirft SYN-Pakete ohne Ansehen der Quelle. Während der
    Flut ist das 20/s-Budget von den Angreifer-SYN aufgebraucht, bevor das eine
    legitime SYN von `h3` an die Reihe kommt – die Regel trifft Freund und Feind
    gleich. Erst SYN-Cookies (Teil E), die nichts verwerfen, sondern ohne
    Zustand auskommen, lösen das Problem.

!!! question "Zum Weiterdenken"
    Überlegt, unter welchen Umständen die Ratenbegrenzung *doch* helfen würde –
    und warum diese Umstände bei einem Flood mit `--rand-source` gerade nicht
    gegeben sind. (Hinweis: Was bräuchtet ihr, um Angreifer-SYN von legitimen
    zu *unterscheiden*, und warum nimmt euch `--rand-source` genau das?)

### Teil G — Der feste ARP-Eintrag als gemessene Gegenmaßnahme (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt einen festen (`nud permanent`) ARP-Eintrag
      als Gegenmaßnahme setzen und messen, dass er den Angriff aus Teil D
      tatsächlich abwehrt.
    - **Wozu?** – Bevor man eine zentrale Lösung wie Dynamic ARP Inspection
      einführt, muss man zeigen können, dass die einfache Variante
      technisch funktioniert – und anschließend begründen, warum sie
      trotzdem im großen Netz nicht eingesetzt wird (siehe Vertiefungsbox).
    - **Vorwissen** – [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02)/D, `ip neigh replace` kennt ihr bereits aus der
      Vertiefungsbox in [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02).

In [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02)/D habt ihr gesehen, dass ARP jeder Antwort glaubt – auch einer
unaufgeforderten. Die Vertiefungsbox zu [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02) hat einen festen ARP-Eintrag als
Gegenmaßnahme vorgeschlagen. Jetzt messt ihr, dass er wirklich hält: Mit einem
`permanent`-Eintrag prallt der Angriff aus Teil D ab.

**Ziel:** Zeigen, dass ein `nud permanent`-Nachbarschaftseintrag durch
`arpspoof` nicht mehr umgebogen werden kann – und dass genau derselbe Angriff
ohne ihn (Teil D) die MAC-Adresse tauscht.

**Vorbedingung:** `topo02` läuft. Opfer ist `h3` (`10.0.20.11`), Gateway `r2`
(`10.0.20.1`), Angreifer `h2` — dieselben drei Rollen wie in [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02)/D, denn
`startARP-AttackerOnNodeH2.sh` greift fest verdrahtet `10.0.20.11` über
`10.0.20.1` an (siehe Skriptinhalt in [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02)). `h1`/`r1` liegen auf der
anderen Seite der Topologie und werden von diesem Skript gar nicht erreicht.

**Schritte:**

```bash
# 1. echte Gateway-MAC lernen und FEST eintragen:
h3$ ip neigh flush all; ping -c1 10.0.20.1
h3$ ip neigh show 10.0.20.1                      # echte MAC merken
h3$ ip neigh replace 10.0.20.1 lladdr <echte-MAC> dev h3-eth0 nud permanent
# 2. Angriff starten und Eintrag erneut prüfen:
h2$ ./startARP-AttackerOnNodeH2.sh &
h3$ ip neigh show 10.0.20.1                      # unveraendert?
# 3. Angriff beenden (das Skript raeumt Alias und gefaelschten Webserver auf):
h2$ fg                       # Skript in den Vordergrund holen ...
                             # ... und dann Strg+C druecken
# 4. festen Eintrag wieder entfernen (sonst wirkt er in spaeteren Teilen weiter):
h3$ ip neigh del 10.0.20.1 dev h3-eth0
```

Ein im Hintergrund (`&`) gestartetes Skript holt ihr mit `fg` in den
Vordergrund und beendet es dann mit ++ctrl+c++. Ein `kill -INT <PID>` reicht bei
diesem Skript nicht: Es läuft danach weiter. Beendet den Angriff immer, sonst
bleibt die Vergiftung für alle folgenden Versuche bestehen.

**Erwartete Ausgabe:** Nach dem `permanent`-Eintrag bleibt die MAC-Adresse für
`10.0.20.1` trotz laufendem `arpspoof` unverändert die **echte** MAC des
Gateways – anders als in Teil D, wo sie auf die MAC des Angreifers umsprang.

!!! info "Was ihr seht"
    Nach `ip neigh flush all` + `ping` lernt `h3` die echte Gateway-MAC von
    `r2` (`00:00:00:00:00:06`). Nach dem Setzen als `permanent` und dem Start
    von `arpspoof` auf `h2` bleibt `ip neigh show 10.0.20.1` unverändert bei
    `00:00:00:00:00:06` – der Angriff, der in Teil D die MAC tauscht, läuft ins
    Leere.

!!! warning "Kontrolliert, dass der Angriff wirklich euer Segment trifft"
    Ein unveränderter Eintrag beweist die Abwehr nur, wenn in diesem Moment
    tatsächlich ein Angriff auf **dieses** Segment läuft. Prüft das an `h2`s
    eigener Ausgabe (`arp reply 10.0.20.1 is-at ...`) und nicht nur am
    Ergebnis auf `h3` – ein Eintrag, der sich nicht ändert, weil der Angriff
    ein ganz anderes Segment trifft, sieht identisch aus wie ein Eintrag, der
    sich dank `nud permanent` nicht ändern *lässt*, belegt aber nichts.

!!! example "Vertiefung: warum das trotzdem selten eingesetzt wird"
    Ihr habt eine Maßnahme gefunden, die technisch **funktioniert**. Rechnet nun
    den Betriebsaufwand: In einem Netz mit 500 Rechnern und je einem
    Gateway-Eintrag – wie viele feste Zuordnungen sind das, und wer pflegt sie,
    wenn ein Gerät planmäßig eine neue Netzwerkkarte bekommt? Genau diese
    Skalierungsfrage ist der Grund, warum in echten Netzen stattdessen *Dynamic
    ARP Inspection* auf verwalteten Switches eingesetzt wird (siehe Teil D) –
    dieselbe Idee, aber zentral und automatisch statt von Hand auf jedem Host.

### Teil H — Den Angriff forensisch festhalten: gefälschte ARP-Replies mitschneiden und zählen (`topo02`)

!!! abstract "Auf einen Blick"
    - **Lernziel** – Ihr könnt einen laufenden Angriff mit `tcpdump`
      aufzeichnen und die Aufzeichnung ohne grafische Oberfläche mit
      `capinfos`/`editcap` auswerten und ein Beweis-Artefakt sichern.
    - **Wozu?** – Ein Sicherheitsvorfall ist für Kolleg:innen oder in einem
      Bericht nur nachvollziehbar, wenn es einen Mitschnitt gibt, den man
      zählen, auswerten und ausschneiden kann – genau das macht ihr hier,
      die Grundlage jeder forensischen Analyse bzw. Incident-Response.
    - **Vorwissen** – `tcpdump` aus [Lab 03](../03-routing-rip-bgp/index.md), der
      Angriffsablauf aus [Teil B](m1-arp-spoofing.md#teil-b-arp-spoofing-mit-http-content-swap-topo02)/D (woher die ARP-Replies kommen).

Die bisherigen Teile haben den Angriff *live* beobachtet. Ein Mitschnitt ist
etwas anderes: ein **dauerhaftes Artefakt**, das man auch nach dem Angriff noch
auswerten, zählen und vorlegen kann – die Grundlage jeder Incident-Analyse. In
diesem Teil zeichnet ihr die gefälschten ARP-Replies auf und wertet sie auch
ohne grafische Oberfläche mit `tcpdump` und den `pcap`-Werkzeugen aus.

!!! info "Werkzeug: `capinfos` und `editcap` – die pcap-Werkzeuge für die Kommandozeile"
    Wireshark bringt eine ganze Kommandozeilen-Familie mit, die **auch ohne die
    grafische Oberfläche** funktioniert: `capinfos` fasst eine
    Datei zusammen (Paketzahl, Dauer), `editcap` schneidet einen Bereich heraus,
    `mergecap` fügt Dateien zusammen. **Typische Fehldeutung:** anzunehmen, eine
    `pcap`-Datei sei ohne Wireshark-Oberfläche nicht auswertbar. Für Zählen,
    Zuschneiden und Zusammenführen genügen diese Werkzeuge.

**Ziel:** Die gefälschten ARP-Replies eines laufenden Angriffs mitschneiden, ihre
Zahl bestimmen und einen Ausschnitt als Beweis-Artefakt sichern.

**Vorbedingung:** `topo02` läuft. Opfer `h3` (`10.0.20.11`), Angreifer `h2`.

**Schritte:**

```bash
h3$ mkdir -p ~/rn-practice/pcaps
h3$ tcpdump -i h3-eth0 -n arp -w ~/rn-practice/pcaps/05-teilh-arpspoof.pcap &
h2$ ./startARP-AttackerOnNodeH2.sh &
# einige Sekunden laufen lassen, dann beenden (Angriff zuerst):
h2$ fg                                                # Skript in den Vordergrund, dann Strg+C; es raeumt Alias/Webserver auf
h3$ jobs -l; kill <PID>                               # PID von tcpdump; beendet und schreibt die Datei fertig
h3$ P=~/rn-practice/pcaps/05-teilh-arpspoof.pcap
h3$ capinfos -c "$P"                                  # wie viele Pakete?
h3$ tcpdump -r "$P" -n | grep -c is-at                # wie viele gefaelschte Replies?
h3$ tcpdump -r "$P" -n | grep is-at | head -1         # Beispiel: is-at <Angreifer-MAC>
h3$ editcap -r "$P" ~/rn-practice/pcaps/05-teilh-auszug.pcap 1-3   # Beweis-Ausschnitt
```

**Erwartete Ausgabe:** `capinfos` nennt die Gesamtzahl der ARP-Pakete;
`grep -c is-at` zählt alle Replies – überwiegend die gefälschten, dazu
einige wenige mit der **echten** Gateway-MAC, die das Skript beim Beenden
sendet, um die Caches wieder zu reparieren. Die Beispielzeile zeigt eine
`is-at`-Zuordnung auf die MAC des Angreifers `h2`.

!!! info "Was ihr seht"
    `capinfos -c` meldet die Zahl der mitgeschnittenen ARP-Pakete, `grep -c
    is-at` zählt die gefälschten Replies der Form
    `ARP, Reply 10.0.20.1 is-at <MAC von h2>`, und `editcap -r … 1-3` schneidet
    daraus ein kleines Beweis-Artefakt heraus (per `capinfos` prüfbar). Eure
    Zahlen hängen davon ab, wie lange ihr aufzeichnet – die Zahl der gefälschten
    Replies wächst mit der Angriffsdauer.

!!! quote "Hintergrund: woher `tcpdump` und `pcap` stammen"
    `tcpdump` – und damit das `pcap`-Dateiformat, das alle diese Werkzeuge lesen
    – stammt von Van Jacobson, Craig Leres und Steven McCanne am Lawrence
    Berkeley Laboratory; eine Manpage ist auf Juni 1989 datiert, das erste
    öffentliche Release (2.0) auf Januar 1991. `libpcap` wurde später aus
    `tcpdump` herausgelöst und erschien erstmals im Juni 1994. Fast alle
    Netzwerk-Analysewerkzeuge – auch Wireshark – bauen bis heute auf diesem
    Format auf.

    - tcpdump-Manpage (AUTHORS): <https://www.tcpdump.org/manpages/tcpdump.1.html>
    - tcpdump CHANGES (v2.0, Jan 1991): <https://raw.githubusercontent.com/the-tcpdump-group/tcpdump/master/CHANGES>

--8<-- "issue-feedback.md"

!!! success "Meilenstein 3 geschafft"
    **Das habt ihr gelernt:**

    - ARP-Spoofing lässt sich als Opfer erkennen, auch ohne vorher zu wissen, dass ein Angriff läuft.
    - Den Schaden eines SYN-Floods könnt ihr in Zahlen fassen; SYN-Cookies halten legitime Verbindungen messbar am Leben.
    - Eine Ratenbegrenzung per Firewall hilft nicht, weil sie Angreifer-SYN und legitime SYN nicht unterscheiden kann.
    - Ein fester ARP-Eintrag wehrt den Angriff ab; mit tcpdump, capinfos und editcap lässt er sich als Beweis sichern.

    **Wie es weitergeht:** Blatt 06 behandelt verdeckte Kanäle: Ihr untersucht Verkehr passiv und versteckt Daten in Protokollen wie DNS und ICMP. Die Mitschnitt-Auswertung aus diesem Blatt braucht ihr dort wieder.

    [Weiter zu Blatt 06 · Advanced: Covert Channels](../06-advanced-covert-channels/index.md){ .md-button }
