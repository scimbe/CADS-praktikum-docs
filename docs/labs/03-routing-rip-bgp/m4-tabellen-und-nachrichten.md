# Meilenstein 4 von 4 · Tabellen, AS-Pfad, Metrik und Nachrichten lesen

*03 · Routing (RIP/BGP)* · [Übersicht des Blatts](index.md)

Hier lest ihr Tabellen, Metriken und Nachrichten der Routing-Protokolle genau und beantwortet damit die Frage, warum ein Paket seinen Weg nimmt.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Anwendungsschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Transportschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzwerkschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 5 – Drei Tabellen, drei Wahrheiten: Kernel, RIP und BGP nebeneinander (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt für ein einzelnes Präfix zeigen, in welchen der drei
    Tabellen (Kernel, RIP, BGP) es steht, mit welcher Distanz und Metrik, und
    welche Tabelle die Entscheidung trifft.

    **Wozu?** „Warum nimmt das Paket genau diesen Weg?" ist die häufigste
    Frage im Netzbetrieb. Die Antwort steht nie an einer einzigen Stelle: Der
    Kernel kennt nur die Entscheidung, die Protokolle kennen die Kandidaten.
    Wer die drei Ansichten nebeneinander legen kann, findet auch die Route,
    die „eigentlich gewinnen sollte" und es nicht tut.

    **Vorwissen:** [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) (`vtysh`, administrative Distanz).

[Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) hat schon angedeutet, dass es *zwei* Tabellen gibt: die des Kernels
(`ip route`) und die der Routing-Software (`show ip route`). Tatsächlich sind
es sogar drei, denn die Routing-Software hält je Protokoll eine eigene: `show
ip rip` und `show ip bgp` zeigen, was **RIP** bzw. **BGP** jeweils für sich
gelernt haben, bevor die administrative Distanz entscheidet, welcher Eintrag es
in die Kernel-FIB schafft. In diesem Teil legt ihr alle drei nebeneinander und
verfolgt ein einzelnes Präfix durch sie hindurch. Das ist dieselbe
Detektivarbeit wie bei einer Störung im echten Netz: Warum geht der Verkehr
nicht den Weg, den ich erwartet habe?

!!! info "Werkzeug: die drei `show`-Ansichten von `vtysh`"
    `show ip route` ist die **Entscheidung** (was tatsächlich weitergeleitet
    wird, mit Protokoll-Kennbuchstabe und `[Distanz/Metrik]`). `show ip rip` und
    `show ip bgp` sind die **Kandidaten** je Protokoll.

    | Aufruf | Bedeutung |
    |---|---|
    | `show ip route 192.168.3.0/24` | alle Einträge der Routing-Software zu diesem Präfix |
    | `show ip rip` | Tabelle von RIP (Spalten siehe [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh)) |
    | `show ip bgp` | Tabelle von BGP |

    Echte Ausgabe von `show ip bgp` auf `r1` (gekürzt: Vor der Tabelle stehen
    einige Kopfzeilen mit Legende wie `BGP table version`, `Status codes` und
    `Origin codes`, danach die Zeile `Displayed … routes`):

    ```text
         Network          Next Hop            Metric LocPrf Weight Path
     *>  192.168.1.0/24   0.0.0.0                  0         32768 i
     *>  192.168.3.0/24   193.1.1.2                              0 65002 65003 i
     *>  193.1.1.0/26     193.1.1.2                0             0 65002 i
     *>  193.1.2.0/24     193.1.1.2                0             0 65002 i
    ```

    Gelesen: `*>` bedeutet „gültig und beste Route". **Network** das Ziel;
    **Next Hop** der nächste Router (`0.0.0.0` heißt: stammt vom Router
    selbst); **Weight** `32768` markiert Routen, die `r1` selbst ankündigt;
    **Path** der **AS-Pfad**: die Autonomen Systeme, durch die die Route zu
    `r1` kam (`65002 65003` = erst AS 65002, dann AS 65003); `i` am Ende: das
    Präfix wurde im Ursprungs-AS direkt konfiguriert.

    **Typische Fehldeutung:** `show ip rip` als „die aktiven RIP-Routen" zu
    lesen. Es zeigt *alles*, was RIP kennt – auch Routen, die BGP im Wettbewerb
    um die FIB geschlagen hat.

**Vorbedingung:** `topo03` läuft in Stufe 2 und ist frisch gestartet (RIP und
BGP aktiv, siehe [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh)). Habt ihr in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) die BGP-Distanz verändert, startet
die Topologie vorher neu, sonst seht ihr 200 statt 20. Terminal auf `r1`
(`mininet> xterm r1`). Das neue Fenster nimmt den Fokus und liegt oft hinter
anderen Fenstern: Prüft vor dem Tippen den Fenstertitel (Hilfe:
[Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen);
kurz: oben links auf **Xfce4-terminal** klicken und das Fenster in der Liste
wählen). Das Knotenfenster startet klein; ein Doppelklick auf die Titelleiste
vergrößert es, damit lange Ausgaben nicht abgeschnitten werden.

**Vorgemacht:**

```bash
r1$ vtysh -c "show ip route 192.168.3.0/24"
```

```text
Routing entry for 192.168.3.0/24
  Known via "bgp", distance 20, metric 0, best
  Last update 00:00:40 ago
  * 193.1.1.2, via r1-eth1, weight 1

Routing entry for 192.168.3.0/24
  Known via "rip", distance 120, metric 3
  Last update 00:00:41 ago
    193.1.1.2, via r1-eth1, weight 1
```

Zwei Einträge für dasselbe Präfix mit demselben Nexthop `193.1.1.2`: BGP mit
Distanz 20 und dem Wort `best` (in die FIB gewählt), RIP mit Distanz 120 und
Metrik 3 (nicht gewählt).

**Selbst:** Legt die drei Ansichten nebeneinander und notiert für
`192.168.3.0/24` je Tabelle, was dort steht:

```bash
r1$ vtysh -c "show ip rip"
r1$ vtysh -c "show ip bgp"
r1$ ip route
```

`ip route` zeigt je Präfix nur den Eintrag, den der Kernel tatsächlich benutzt
(das Wort hinter `proto` nennt die Quelle); die Kandidaten der Protokolle gibt
es nur in der Routing-Software.

!!! question "Nachgedacht: Warum ist `193.1.2.0/24` auch doppelt?"
    Im vollständigen `show ip route` stehen `192.168.3.0/24` und `193.1.2.0/24`
    jeweils als `B>*` und als `R`. Aus welcher Tabelle stammt die RIP-Zeile, und
    warum ist sie nicht im Kernel?

    ??? success druck-zu "Lösung"
        Die RIP-Zeile stammt aus der RIP-Tabelle (`show ip rip`, Metrik 3 bzw.
        2). Die Routing-Software hat beide Kandidaten und wählt anhand der
        administrativen Distanz (BGP 20 < RIP 120) den BGP-Eintrag. Nur dieser
        steht im Kernel (`proto bgp` in `ip route`); der RIP-Eintrag bleibt als
        Reserve in der Routing-Software. Daran erkennt ihr ihn: Seine Zeile
        trägt kein `>*`.

        Im vollständigen `show ip route` steht außerdem
        `B 193.1.1.0/26 … inactive`: BGP kennt auch das Netz, an dem `r1`
        direkt hängt, aber die direkt angeschlossene Route (`C>*`, Distanz 0)
        gewinnt. Der BGP-Eintrag ist deshalb nicht aktiv (`inactive`) und
        kommt nicht in den Kernel.

!!! info "Hintergrund: administrative Distanz ist Konvention, kein Standard"
    Die Zahl vor der Metrik (20 für BGP, 120 für RIP) ist die *administrative
    Distanz*. Sie steht in **keinem** RFC – sie ist eine Hersteller-Konvention
    (ursprünglich von Cisco), die praktisch alle Router übernommen haben, damit
    ein Gerät zwischen mehreren Protokollen, die dieselbe Route kennen,
    reproduzierbar wählt. Die *Metrik* dahinter ist dagegen protokolldefiniert:
    RIPs Hop-Zahl steht in RFC 2453, BGPs Entscheidungsprozess in RFC 4271
    (siehe Teil 6 und 7).

### Teil 6 – BGP-Nachbarschaften und der AS-Pfad lesen (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt an `show ip bgp summary` ablesen, mit wem ein
    Router BGP spricht und wie viele Routen er erhalten hat, und aus dem
    AS-Pfad erkennen, durch welche Netze eine Route gelaufen ist.

    **Wozu?** Zwischen Internetanbietern hängt alles an BGP-Sitzungen. Wenn ein
    Dienst weltweit nicht erreichbar ist, schaut ein Netzbetreiber zuerst:
    „Steht die Sitzung zum Nachbarn, und kommt das Präfix mit dem erwarteten
    Pfad an?" Dieselben zwei Befehle benutzen die Teams großer Anbieter.

    **Vorwissen:** [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) und 5 (`vtysh`, `show ip bgp`).

BGP ist das Protokoll, das das Internet zusammenhält (siehe die Hintergrundbox
in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh)). In `topo03` seht ihr es im Kleinen: drei autonome Systeme
(65001/65002/65003), die einander Präfixe ankündigen. In diesem Teil lest ihr
die Nachbarschaftstabelle und den AS-Pfad – die beiden Dinge, an denen sich in
einem echten Betrieb entscheidet, ob eine Route geglaubt wird.

**Vorbedingung:** `topo03` in Stufe 2, Terminal auf `r1`.

**Vorgemacht:**

```bash
r1$ vtysh -c "show ip bgp summary"
```

Echte Ausgabe:

```text
IPv4 Unicast Summary:
BGP router identifier 193.1.1.1, local AS number 65001 VRF default vrf-id 0
BGP table version 4
RIB entries 7, using 896 bytes of memory
Peers 1, using 23 KiB of memory

Neighbor        V         AS   MsgRcvd   MsgSent   TblVer  InQ OutQ  Up/Down State/PfxRcd   PfxSnt Desc
193.1.1.2       4      65002         6         6        4    0    0 00:00:41            3        4 N/A

Total number of neighbors 1
```

Zeile für Zeile: `local AS number 65001` ist die eigene AS-Nummer von `r1`;
`Peers 1` die Zahl der Nachbarn. In der Nachbarzeile steht `193.1.1.2` (die
Adresse von `r2`) mit **AS** 65002; **MsgRcvd/MsgSent** zählen die
ausgetauschten BGP-Nachrichten; **Up/Down** nennt, wie lange die Sitzung steht
(`00:00:41` = 41 Sekunden); **State/PfxRcd** ist entweder ein Zustandswort
(`Idle`, `Active`: die Sitzung steht nicht) oder, wenn die Sitzung steht, die
Zahl der empfangenen Präfixe (hier 3); **PfxSnt** die Zahl der gesendeten (hier 4).
Eine Zahl in `State/PfxRcd` ist also das Zeichen für eine gesunde Sitzung.
Damit habt ihr gerade das geprüft, was Netzbetreiber bei Internet-Störungen
als Erstes ansehen.

Schaut nun auf den AS-Pfad zu `192.168.3.0/24`:

```bash
r1$ vtysh -c "show ip bgp 192.168.3.0/24"
```

```text
BGP routing table entry for 192.168.3.0/24, version 2
Paths: (1 available, best #1, table default)
  Advertised to non peer-group peers:
  193.1.1.2
  65002 65003
    193.1.1.2 from 193.1.1.2 (193.1.1.2)
      Origin IGP, valid, external, best (First path received)
      Last update: Sun Oct 25 23:02:05 2026
```

`65002 65003` ist der **AS-Pfad**: Die Route entstand in AS 65003 (`r3`), lief
durch AS 65002 (`r2`) und kam so zu `r1` (AS 65001). `external` heißt: Sie
kam von einem Router in einem anderen AS (eBGP). Versionsnummer und
Zeitstempel in der Ausgabe weichen bei euch ab.

**Selbst:** Vergleicht den AS-Pfad zu `192.168.3.0/24` mit dem zu
`193.1.2.0/24` (`show ip bgp 193.1.2.0/24`) und notiert, warum der zweite Pfad
kürzer ist. Tipp: In welchem AS liegt das Netz `193.1.2.0/24`?

!!! question "Nachgedacht: Was verhindert Schleifen in BGP?"
    RIP schützt sich vor Count-to-Infinity mit der Grenze 16. Wie erkennt BGP
    eine Schleife, ohne zu zählen?

    ??? success druck-zu "Lösung"
        Der AS-Pfad zeigt jedes durchlaufene AS. **RFC 4271, Abschnitt 9.1.2**
        schreibt vor, dass ein Router eine Route verwirft, deren AS-Pfad seine
        eigene AS-Nummer schon enthält – eine Schleife ist damit sofort
        erkennbar.

!!! quote "Hintergrund: das Zwei-Servietten-Protokoll"
    BGP wurde **1989** von Kirk Lougheed (Cisco) und Yakov Rekhter (IBM) bei
    einem IETF-Treffen auf Papierservietten skizziert – daher der Spitzname
    „two-napkin protocol". Die Servietten selbst sind verloren; im Cisco Archive
    des Computer History Museum liegen nur Fotokopien (3 Seiten). Ob es zwei oder
    drei Servietten waren, ist widersprüchlich überliefert – Rekhter selbst
    spricht von drei.

    - Computer History Museum, „The Two-Napkin Protocol": <https://computerhistory.org/blog/the-two-napkin-protocol/>
    - Cisco Archive / CHM Katalog (Identifier 2014-57-001, „3 pages"): <http://ciscoarchive.lunaimaging.com/luna/servlet/detail/CHMC~4~4~265~943>

### Teil 7 – Die RIP-Metrik und die Grenze bei 16 selbst ablesen (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt aus `show ip rip` die Hop-Zahl jeder Route ablesen
    und erklären, warum RIP bei 16 „unendlich" sagt.

    **Wozu?** Eine Metrik ist die Antwort auf „wie weit ist das Ziel?". Wer sie
    lesen kann, erkennt sofort, ob ein Router einen langen Umweg nimmt oder ob
    ein Ziel kurz vor der Unerreichbarkeit steht. Bei RIP bedeutet die Zahl 16:
    „Route ist ausgefallen" – ein Wert, den ihr in Störungen oft zuerst seht.

    **Vorwissen:** [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) (`show ip rip`), [Teil 3](m3-rekonvergenz-und-spuren.md#teil-3-redundanz-im-rip-netz-testen-reale-rekonvergenz-messen-topo03) (Rekonvergenz).

Laut der Hintergrundbox in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh) kann RIP nur bis 15 zählen, und 16 bedeutet
„unerreichbar". Jetzt lest ihr die Metrik direkt aus `show ip rip` und
verbindet die Zahl mit dem, was ihr in [Teil 3](m3-rekonvergenz-und-spuren.md#teil-3-redundanz-im-rip-netz-testen-reale-rekonvergenz-messen-topo03) über Rekonvergenz gemessen habt.

**Vorbedingung:** `topo03` in Stufe 2, Terminal auf `r1`.

**Vorgemacht:**

```bash
r1$ vtysh -c "show ip rip"
```

```text
     Network            Next Hop         Metric From            Tag Time
R(n) 192.168.3.0/24     193.1.1.2             3 193.1.1.2         0 02:46
C(i) 193.1.1.0/26       0.0.0.0               1 self              0
R(n) 193.1.2.0/24       193.1.1.2             2 193.1.1.2         0 02:46
```

Gelesen: Direkt angeschlossene Netze haben Metrik 1 (`C(i)`); jeder Router, den
die Meldung auf dem Weg zu `r1` durchläuft, zählt eins dazu. `192.168.3.0/24`
steht mit Metrik **3** da: `r3` kennt das Netz direkt (1), `r2` meldet es mit 2,
`r1` lernt es von `r2` mit 3. `193.1.2.0/24` liegt mit Metrik 2 eine Station
näher.

**Selbst:** Schreibt zuerst auf, was ihr erwartet: Über welchen Nexthop und
mit welcher Metrik kennt `r1` das Netz `192.168.3.0/24` nach einem Ausfall von
`r2-eth1`? Öffnet dann ein Fenster für `r2` (`mininet> xterm r2`; vorher in die
Mininet-Konsole klicken, die Fensterliste oben links hilft beim Wechseln) und
startet **zuerst** auf `r1` die Schleife, die euch das Wiederholen abnimmt:
`r1$ while true; do date +%T; vtysh -c "show ip rip" | grep 192.168.3; sleep 5; done`
(Ende mit ++ctrl+c++). Schaltet erst danach in `r2` ab (`r2$ ifconfig r2-eth1 down`)
und beobachtet etwa eine Minute lang: Die Metrik 16 ist nur kurz sichtbar und
entgeht euch leicht, wenn die Schleife erst nach dem Abschalten läuft. Über
welchen Nexthop und mit welcher Metrik kennt `r1` das Netz danach? Warum hat sich die Metrik nicht
verändert, obwohl der Weg ein anderer ist? Schaltet `r2-eth1` danach wieder
ein und beobachtet weiter: Springt `r1` zum alten Nexthop zurück? Wenn nicht,
woran könnte das liegen?

??? success druck-zu "Lösung zur Selbst-Aufgabe"
    Nach etwa 20 bis 35 Sekunden steht in `show ip rip` auf `r1`
    `192.168.3.0/24` mit Next Hop `193.1.1.4` (`r4`) und Metrik **3**. Davor
    seht ihr die alte Route über `193.1.1.2` mit Metrik **16**, bei uns rund
    20 bis 30 Sekunden lang (die Spalte **Time** zählt dabei herunter): So markiert RIP
    eine ausgefallene Route als unerreichbar, bevor sie ersetzt wird. Der Weg
    `r1` → `r4` → `r3` hat genauso viele Zählschritte wie vorher `r1` → `r2` →
    `r3`: `r3` kennt das Netz direkt (1), `r4` meldet es mit 2, `r1` lernt es
    mit 3. RIP kennt nur diese Zahl, nicht die Strecke oder die Bandbreite
    dahinter. Es ist wie ein Navi, das nur Kreuzungen zählt, nicht Kilometer
    oder Stau.

    Nach dem Wiedereinschalten von `r2-eth1` bleibt `r1` in der Regel
    beim Nexthop `193.1.1.4`: Die Route über `r4` hat dieselbe Metrik 3, und
    RIP wechselt bei gleicher Metrik nicht zurück, solange die bekannte Route
    gültig bleibt. Das ist kein Fehler.

!!! question "Nachgedacht: Warum 15 und nicht 255?"
    Die Obergrenze von RIP ist 15 Hops, die Zahl 16 bedeutet „unerreichbar".
    Warum ist eine so kleine Grenze sinnvoll?

    ??? success druck-zu "Lösung"
        Die niedrige Grenze ist die Bremse gegen das *Count-to-Infinity*-Problem
        aus der Hintergrundbox in [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh): Je kleiner „unendlich", desto
        schneller endet das gegenseitige Hochzählen nach einem Ausfall. Der
        Preis ist die Reichweite: Netze mit mehr als 15 Hops lassen sich mit RIP
        nicht betreiben.

!!! quote "Hintergrund: RFC 2453 und die Ports"
    RIP ist auf Pfade von höchstens **15** Hops begrenzt; der Metrikwert **16**
    bedeutet „unerreichbar" (RFC 2453).

    - RFC 2453 (rfc-editor): <https://www.rfc-editor.org/rfc/rfc2453.txt>
    - Cisco, „An unreachable network has a metric of 16": <https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_rip/configuration/15-mt/irr-15-mt-book/irr-cfg-info-prot.html>

    Zum Port: Klassisches RIP über IPv4 nutzt UDP-Port **520** (RFC 2453), wie
    in eurer Aufzeichnung aus [Teil 4](m3-rekonvergenz-und-spuren.md#teil-4-protokollspuren-vermessen-statt-anschauen-topo03); Port **521** gehört zu RIPng für IPv6
    (RFC 2080). Manche Quellen verwechseln die beiden.

### Teil 8 – Nachrichtentypen lesen: `tcpdump` dekodiert RIP und BGP selbst (`topo03`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr könnt in einer Aufzeichnung RIP-Anfragen von
    RIP-Antworten und BGP-`Open`-, `Update`- und `Keepalive`-Nachrichten
    unterscheiden, ohne ein grafisches Werkzeug zu öffnen.

    **Wozu?** Auf einem entfernten Router, auf den ihr nur per Textkonsole
    zugreift, gibt es kein Wireshark-Fenster. Dort liest ein Admin den
    Mitschnitt mit `tcpdump` direkt im Terminal und erkennt am Nachrichtentyp,
    ob ein Nachbar gerade „Hallo" sagt (`Open`), Routen verteilt (`Update`) oder
    nur noch lebt (`Keepalive`).

    **Vorwissen:** [Teil 4](m3-rekonvergenz-und-spuren.md#teil-4-protokollspuren-vermessen-statt-anschauen-topo03) (die `pcap`-Datei und `tcpdump -r`).

[Teil 4](m3-rekonvergenz-und-spuren.md#teil-4-protokollspuren-vermessen-statt-anschauen-topo03) hat die Protokollspur *vermessen* (wie viele Byte, wie oft). Jetzt schaut
ihr in die Nachrichten **hinein**. `tcpdump` bringt eigene Dekoder für RIP und
BGP mit und benennt jeden Nachrichtentyp im Klartext.

!!! info "Werkzeug: `tcpdump -v` als Protokoll-Dekoder"
    Mit `-v` (verbose) wertet `tcpdump` den Inhalt bekannter Protokolle aus,
    nicht nur die Header. Für RIP druckt es `RIPv2, Request/Response, length: …`,
    für BGP `Open Message (1)`, `Update Message (2)`, `Keepalive Message (4)`.

    | Aufruf | Bedeutung |
    |---|---|
    | `tcpdump -r "$P" -v -n udp port 520` | die RIP-Pakete der Datei mit Inhaltsangabe |
    | `grep RIPv2` hinter einem senkrechten Strich | behält nur die Zeilen mit dem RIP-Nachrichtentyp (der Strich `\|` reicht die Ausgabe an `grep` weiter) |

    Was es kann: die Nachrichtentypen benennen. Was es nicht ersetzt: die
    tiefe, feldweise Zerlegung und Statistik von Wireshark – für das Erkennen
    der Typen genügt es aber vollständig.

**Vorbedingung:** Die `pcap`-Datei aus [Teil 4](m3-rekonvergenz-und-spuren.md#teil-4-protokollspuren-vermessen-statt-anschauen-topo03)
(`~/rn-practice/pcaps/03-teil4-protokollspuren.pcap`) oder eine frische
Aufzeichnung von `r1-eth1` (siehe [Teil 4](m3-rekonvergenz-und-spuren.md#teil-4-protokollspuren-vermessen-statt-anschauen-topo03), Schritt 2).

**Vorgemacht:**

```bash
r1$ P=~/rn-practice/pcaps/03-teil4-protokollspuren.pcap
r1$ tcpdump -r "$P" -v -n udp port 520 | grep RIPv2
```

```text
	RIPv2, Request, length: 24, routes: 1 or less
	RIPv2, Request, length: 24, routes: 1 or less
	RIPv2, Response, length: 24, routes: 1 or less
	RIPv2, Response, length: 24, routes: 1 or less
	RIPv2, Request, length: 24, routes: 1 or less
	RIPv2, Response, length: 44, routes: 2 or less
	RIPv2, Response, length: 44, routes: 2 or less
	...
```

Gelesen: Zuerst fragen die Router mit `Request` (24 Byte) „schick mir deine
Tabelle", dann antworten sie mit `Response`. Die Antworten werden länger
(`44` statt `24` Byte), sobald sie zwei Routen tragen.

**Selbst:** Dieselbe Auswertung für BGP:

```bash
r1$ tcpdump -r "$P" -v -n tcp port 179 | grep Message
```

```text
	Open Message (1), length: 99
	Open Message (1), length: 99
	Keepalive Message (4), length: 19
	Keepalive Message (4), length: 19
	Update Message (2), length: 60
	Update Message (2), length: 23
	Update Message (2), length: 55
	...
	Keepalive Message (4), length: 19
```

Die Längen der `Update`-Nachrichten und ihre Zahl können bei euch abweichen;
zwischen den `Open`-Zeilen kann auch eine `Notification` stehen (Verbindungskollision, siehe unten).

Notiert, in welcher Reihenfolge die Typen auftreten, und vergleicht das mit
dem Wireshark-Mitschnitt aus [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh). Teil 2 zeigt dazu nur ein Bild;
wollt ihr den Mitschnitt selbst vergleichen, erzeugt ihn neu: `topo03` neu
starten, in Stufe 1 `wireshark -i r1-eth1 -k &` aufrufen und mit `exit` in
Stufe 2 wechseln (Wireshark schließt ihr wieder mit **File > Quit**; im Dialog wählt ihr
**Stop and Quit without Saving**. Wireshark deckt das Knotenfenster zu: Über
die Fensterliste oben links kommt ihr zurück). Ob zusätzliche `OPEN`- und `NOTIFICATION`-Nachrichten vom gleichzeitigen
Verbindungsaufbau (Verbindungskollision) auftauchen, hängt vom Lauf ab: Mal
stehen sie in der Datei aus Teil 4, mal im frischen Mitschnitt, mal in keinem
von beiden. Beides ist normal und kein Fehler: Beide Router haben gleichzeitig
eine Verbindung aufgebaut, und eine wurde automatisch wieder abgebaut.
Vergleicht also die Grundreihenfolge (`Open`, `Keepalive`, `Update`,
`Keepalive`) und nicht die genaue Zeilenzahl. Wireshark fasst
außerdem mehrere `UPDATE`-Nachrichten in einem TCP-Segment oft in einer Zeile
zusammen, `tcpdump` zeigt jede einzeln.

!!! question "Nachgedacht: Warum ist die Antwort länger als die Anfrage?"
    Eine RIP-Anfrage hat 24 Byte, eine Antwort mit zwei Routen 44 Byte. Woher
    kommt der Unterschied von 20 Byte?

    ??? success druck-zu "Lösung"
        Jede RIP-Nachricht hat 4 Byte Kopf und je Eintrag 20 Byte. Die
        *Anfrage* („schick mir deine Tabelle") trägt genau einen Eintrag (Wert
        „ganze Tabelle"): 4 + 20 = 24 Byte. Die *Antwort* trägt einen Eintrag je
        Route – deshalb wächst ihre Länge mit der Zahl der Routen (im
        Mitschnitt: 24 Byte für eine Route, 44 Byte für zwei). Das RIP-Nachrichtenformat mit genau
        diesen Feldern steht in RFC 2453, Abschnitt 3.6.

--8<-- "issue-feedback.md"

## Fazit

Ihr habt Routing in dieser Übung von zwei Seiten kennengelernt. In [Teil 1](m1-manuelles-routing.md#teil-1-manuelles-routing-zwischen-zwei-netzen-topop03)
habt ihr jede Route selbst eingetragen und dabei gesehen, dass ein Netz ohne
Routing-Wissen nicht weiter reicht als bis zum eigenen Switch – und dass
Routing **je Richtung** zu betrachten ist, nicht je Verbindung. In [Teil 2](m2-rip-und-bgp.md#teil-2-dynamisches-routing-mit-rip-und-bgp-topo03-frrvtysh)
haben RIP und BGP dieselbe Arbeit selbstständig übernommen, und an der
administrativen Distanz konntet ihr nachvollziehen, wie ein Router zwischen
zwei Quellen für dasselbe Ziel entscheidet – und dass eine veränderte
Tabelle nicht automatisch einen veränderten Weg bedeutet. [Teil 3](m3-rekonvergenz-und-spuren.md#teil-3-redundanz-im-rip-netz-testen-reale-rekonvergenz-messen-topo03) hat
gezeigt, dass Konvergenz kein Zeitpunkt ist, sondern ein Verlauf, den
verschiedene Knoten zu verschiedenen Zeiten erreichen.

In den Teilen 4 bis 8 habt ihr die Spur selbst vermessen (Teil 4), die drei
Tabellen verglichen, AS-Pfad und Metrik gelesen und die Nachrichtentypen
erkannt (Teile 5 bis 8).

Damit habt ihr vier Werkzeuge in der Hand, mit denen in echten Netzen
gearbeitet wird: `ip route` für den Kernel, `vtysh` für die
Routing-Software, `traceroute` für den tatsächlich genommenen Weg und
Wireshark bzw. `tcpdump` für die Frage, wer eigentlich mit wem spricht. Wer
diese beherrscht, kann in einem fremden Netz begründen, *warum* ein Paket den
Weg nimmt, den es nimmt.

In der Vorlesung werden die Konzepte dahinter vertieft: Distance Vector
gegen Link State, das Count-to-Infinity-Problem und seine Gegenmittel,
autonome Systeme, und die Frage, warum ein Netz von der Größe des Internets
überhaupt mit einem Protokoll wie BGP zusammenhält.

!!! success "Meilenstein 4 geschafft"
    **Das habt ihr gelernt:**

    - Für ein Präfix zeigen, in welchen Tabellen (Kernel, RIP, BGP) es steht und welche die Entscheidung trifft.
    - An show ip bgp summary die Nachbarn ablesen und aus dem AS-Pfad erkennen, durch welche Netze eine Route lief.
    - Die RIP-Metrik als Hop-Zahl lesen und erklären, warum 16 „unerreichbar“ bedeutet.
    - Mit tcpdump RIP-Anfragen und -Antworten sowie BGP-Open, -Update und -Keepalive unterscheiden.

    **Wie es weitergeht:** Blatt 04 (TCP/UDP und Congestion Control) wechselt auf die Transportschicht: Ihr messt, wie sich Fehlerrate, Verzögerung und Bandbreite auf Durchsatz und Stauverhalten von TCP und UDP auswirken.

    [Weiter zu Blatt 04 · TCP/UDP & Congestion Control](../04-tcp-udp-congestion/index.md){ .md-button }
