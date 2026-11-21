# Meilenstein 3 von 3 · Dienste selbst betreiben und belauschen

*01 · Netzwerkgrundlagen & Tools* · [Übersicht des Blatts](index.md)

Diese Seite dreht die Perspektive um: Ihr betreibt Dienste selbst und seht im Mitschnitt, was auf der Leitung passiert.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#c5cae9;color:#1a237e;border:1px solid #9fa8da">Netzwerkschicht · beteiligt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Verbindungsschicht</div>
</div>
</div>

### Teil 3 – Namensauflösung selbst betreiben: ein lesbarer DNS-Server (`topo01`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr startet einen eigenen kleinen DNS-Server, fragt ihn mit
    `dig`, `nslookup` und `host` ab und erklärt anhand der Antwort Flags
    (`qr aa`) und Statuscode (`NXDOMAIN`).

    **Wozu?** DNS ist das Telefonbuch des Internets – und ein beliebtes
    Angriffsziel: Wer falsche Antworten einschleust, leitet Nutzer auf
    gefälschte Seiten um. Admins, die in einem Störfall „der Name geht
    nicht" hören, müssen eine DNS-Antwort lesen können, um zu sehen, ob der
    Server nicht antwortet, den Namen nicht kennt oder eine falsche Adresse
    liefert. Wer selbst einen Server gebaut hat, versteht diese Ausgaben.

    **Vorwissen:** [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01), Aufgabe 5 (`dig`) und die Topologie `topo01`.

In [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01) habt ihr `dig` benutzt, um Namen aufzulösen. In diesem Teil betreibt
ihr selbst einen kleinen, lesbaren DNS-Server (`dns-server.py`, nur
Standardbibliothek: `socketserver` und `struct`) und seht, wie eine
DNS-Antwort aufgebaut ist.

Das Netz `topo01` muss laufen. Habt ihr es in [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01) mit `quit` beendet,
startet es wie dort (`cd ~/rn-practice/topo01`, dann `./start-topo01.sh`;
zwei Knoten-Fenster öffnen sich); läuft es noch, macht ihr einfach weiter.
Beendet vor jedem Start einer *anderen* Topologie die laufende mit
`exit`/`quit`. Wechselt in das Fenster „Node: h1" und werft zuerst einen Blick
in das Skript:

```bash
h1$ cd ~/rn-practice/topo01
h1$ cat dns-server.py
```

Achtet auf die Funktion `encode_name` (ein Label = ein Längen-Byte plus die
Zeichen, abgeschlossen mit einem Null-Byte) und auf den Header mit seinen
Flags (`QR`, `AA`). Port 53 auf `h1` ist bereits vom DNS-Dienst der Topologie
belegt; startet den eigenen Server deshalb auf Port 5353:

```bash
h1$ python3 dns-server.py 5353
```

Der Server meldet sich:

```text
Autoritativer Mini-DNS-Server laeuft auf UDP-Port 5353.
Zone: becke.net, example.com, h1, h2
```

Fragt den Server von `h2` aus mit allen drei Standard-Werkzeugen ab (`dig`
kennt ihr aus [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01); `nslookup` aus [Teil 1](m1-schichten-im-echten-verkehr.md#teil-1-das-tcpip-schichtenmodell-in-echtem-verkehr-auerhalb-von-mininet); `host` ist die Kurzform für
dasselbe):

```bash
h2$ dig @10.0.1.2 -p 5353 h2
h2$ nslookup -port=5353 h1 10.0.1.2
h2$ host -p 5353 becke.net 10.0.1.2
```

So sieht die Antwort (gekürzt) auf die erste Frage aus; zum Vergleich mit Aufgabe 5
steht diesmal `flags: qr aa` ohne `rd`/`ra`:

```text
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 8028
;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

;; ANSWER SECTION:
h2.			60	IN	A	10.0.6.2

;; SERVER: 10.0.1.2#5353(10.0.1.2) (UDP)
```

`nslookup` meldet `Name: h1`, `Address: 10.0.1.2`; `host` meldet
`becke.net has address 185.199.108.153`.

Vergleicht die Adresse, die euer Server für `becke.net` liefert
(`185.199.108.153`), mit der Antwort von `dig becke.net` (ohne `@`, also über
den DNS-Dienst der Topologie). Was folgt daraus für das Vertrauen in
DNS-Antworten?

??? success "Lösung"
    `dig becke.net` liefert über den DNS-Dienst der Topologie eine andere
    Adresse (bei uns `81.169.145.66`). Euer Server hat **eine selbst
    erfundene Antwort** gegeben, und `dig`/`nslookup`/`host` haben sie
    anstandslos angezeigt: DNS prüft in der Grundform nicht, ob eine Antwort
    echt ist. Wer euren Resolver (oder die Verbindung dorthin) kontrolliert,
    kann euch falsche Adressen unterschieben. Schutz bieten erst
    Erweiterungen wie DNSSEC.

Fragt zuletzt einen Namen ab, den der Server nicht kennt, und schaut euch
den Statuscode an:

```bash
h2$ dig @10.0.1.2 -p 5353 gibtsnicht.invalid +noall +comments
```

```text
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 1353
;; flags: qr aa; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
```

!!! question "Aufgabe: Flags und Statuscode"
    In der `dig`-Ausgabe stehen die Flags `qr aa`. Was bedeuten sie
    (Antwort? autoritativ?), und wo im Skript werden sie gesetzt? Welchen
    `status`-Wert liefert die letzte, unbekannte Abfrage (`NOERROR` oder
    `NXDOMAIN`?), und welche Zeile im Skript (`rcode = ...`) entscheidet darüber?

    ??? success "Lösung"
        `qr` (Query/Response) = „das ist eine Antwort, keine Frage"; `aa`
        (Authoritative Answer) = „ich bin für diese Zone zuständig und
        antworte aus eigenen Daten". Beide werden im Skript in der Zeile
        `flags = 0x8400 | rcode` gesetzt (`0x8000` ist `QR`, `0x0400` ist
        `AA`). Der unbekannte Name liefert **`NXDOMAIN`** (Name existiert
        nicht); darüber entscheidet die Zeile
        `rcode = 0 if (ip or qtype != 1) else 3`: Findet der Server keine
        Adresse zum Namen, ist der Statuscode 3 (`NXDOMAIN`), sonst 0
        (`NOERROR`). Findet beides mit `grep -n -E "flags|rcode" dns-server.py`.

Beendet den DNS-Server auf `h1` mit `Strg+C`.

!!! quote "Hintergrund: DNS ist kaum jünger als das Internet-Protokoll selbst"
    Paul Mockapetris entwarf das DNS 1983 am Information Sciences Institute der
    USC, weil die zentrale Datei `HOSTS.TXT` nicht mehr skalierte. Die
    Erstfassung steht in RFC 882 und RFC 883 (November 1983); 1987 ersetzten
    RFC 1034 und RFC 1035 sie (Kopf: „Obsoletes: RFCs 882, 883, 973").

    - RFC 1035 (rfc-editor): <https://www.rfc-editor.org/rfc/rfc1035.html>
    - Internet Hall of Fame, Paul Mockapetris: <https://www.internethalloffame.org/inductee/paul-mockapetris/>

### Teil 4 – Offene Ports finden: `ss` statt `netstat` (`topo01`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr öffnet selbst einen Dienst, findet ihn mit `ss` als
    lauschenden Port wieder und lest Zustand, Adresse, Port und Prozess aus
    der Ausgabe.

    **Wozu?** „Läuft der Dienst überhaupt, und auf welchem Port?" ist die
    erste Frage bei fast jeder Serverstörung. Ebenso wichtig für die
    Sicherheit: Jeder offene Port ist eine Tür; wer Server betreibt, prüft
    regelmäßig mit `ss`, ob nur die Dienste lauschen, die dort hingehören
    (und nicht ein vergessener Testdienst oder Schlimmeres).

    **Vorwissen:** [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01), Aufgabe 9 (`netstat`).

Das Netz `topo01` muss laufen (Start wie in [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01), Aufgabe 1: `cd ~/rn-practice/topo01`,
`./start-topo01.sh`; läuft es schon, macht ihr einfach weiter). Alle Befehle
mit `h1$` tippt ihr im Fenster „Node: h1".

In [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01) (Aufgabe 9) habt ihr `netstat -tulnp` benutzt. `netstat` gilt als
veraltet und ist auf vielen Distributionen nicht mehr vorinstalliert; sein
Nachfolger aus dem `iproute2`-Paket ist `ss`. In diesem Teil öffnet ihr
selbst einen Dienst und findet ihn wieder.

!!! info "Werkzeug: `ss` und `socat`"
    **Was sie tun:** `ss` listet Netzwerkverbindungen und lauschende Ports
    (Transportschicht). `socat` (*SOcket CAT*) ist ein vielseitigeres
    Werkzeug als `netcat`: Es verbindet zwei beliebige Datenströme, hier ein
    TCP-Port mit dem Programm `cat`, das alles Empfangene zurückschickt – ein
    einfacher Echo-Dienst.

    **Aufruf:**

    - `ss -tlnp` – `t` TCP, `l` nur Lauschende, `n` Zahlen statt Namen,
      `p` zugehöriges Programm.
    - `ss -tlnp 'sport = :8080'` – nur Einträge mit lokalem Port 8080.
    - `socat TCP-LISTEN:8080,reuseaddr,fork EXEC:/bin/cat &` – Echo-Dienst auf
      Port 8080; `fork` bedient mehrere Verbindungen, `&` schickt ihn in den
      Hintergrund.

    **Beispielausgabe auf `h1`, Zeile für Zeile gelesen:**

    ```text
    h1$ ss -tlnp
    State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
    LISTEN 0      32          10.0.1.2:53        0.0.0.0:*    users:(("dnsmasq",pid=51907,fd=5))
    LISTEN 0      5            0.0.0.0:8080      0.0.0.0:*    users:(("socat",pid=56649,fd=7))
    ```

    `State` ist der Zustand (`LISTEN` = wartet auf Verbindungen). `Local
    Address:Port` ist die lauschende Adresse: `0.0.0.0` heißt „auf allen
    Adressen dieses Rechners", `10.0.1.2` nur auf dieser. `Peer` bleibt leer
    (`0.0.0.0:*`), weil noch niemand verbunden ist. `Process` nennt Programm
    und Prozessnummer. Die erste Zeile ist der DNS-Dienst der Topologie, die
    zweite euer `socat`.

    **Typische Fehlermeldung:** `socat: E bind(…, {AF=2 0.0.0.0:8080}):
    Address already in use` – der Port ist schon belegt (oft von einem
    vorherigen, noch laufenden Start).

Öffnet auf `h1` einen einfachen TCP-Echo-Dienst auf Port 8080:

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

!!! question "Aufgabe: Spalten lesen"
    Welche Spalten zeigt `ss` (Zustand, lokale Adresse:Port, Prozess)? Was
    bedeutet `LISTEN`? Beendet den Dienst danach wieder (`jobs -l` zeigt die
    Prozessnummer, `kill <PID>` beendet ihn) und prüft mit `ss -tlnp`, dass der
    Port verschwunden ist.

    ??? success "Lösung"
        `ss` zeigt `State`, `Recv-Q`/`Send-Q` (Warteschlangen), `Local
        Address:Port`, `Peer Address:Port` und `Process`. `LISTEN` bedeutet:
        Ein Programm wartet auf eingehende Verbindungen. Nach dem `kill` fehlt
        die `8080`-Zeile; es bleibt nur der DNS-Dienst auf Port 53. `netstat
        -tlnp` zeigt dieselbe Information in anderen Spalten
        (`0.0.0.0:8080 … LISTEN 56649/socat`).

### Teil 5 – Eine Verbindung von Hand aufbauen und ihren Klartext sehen (`topo01`)

!!! abstract "Auf einen Blick"
    **Lernziel:** Ihr baut eine TCP-Verbindung von Hand auf, schneidet sie mit
    `tcpdump` mit und findet euren Text im Klartext im Mitschnitt wieder.

    **Wozu?** So sieht ein Angreifer (oder ein neugieriger Betreiber eines
    WLANs) Passwörter und Formulareingaben mit, wenn eine Anwendung keine
    Transportverschlüsselung nutzt. Wer verstanden hat, wie leicht das
    geht, bestellt künftig HTTP nur noch mit „s" und versteht, warum
    Telnet und FTP aus dem Betrieb verschwunden sind.

    **Vorwissen:** [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01), Aufgaben 4 (`netcat`) und 9 (SSH/SCP), Teil 4
    (`socat`, `ss`).

!!! quote "Hintergrund: das „TCP/IP swiss army knife""
    `netcat` wurde 1995 von einem Autor unter dem Pseudonym „Hobbit"
    veröffentlicht, die letzte Originalfassung („v1.10") stammt vom
    20. März 1996. Hobbit nannte das Werkzeug „my tcp/ip swiss army knife".
    `socat` greift dieselbe Idee auf und erweitert sie.

    - Original-README von „Hobbit" (nc110): <https://nc110.sourceforge.io/>
    - SecTools.org (Nmap-Projekt), Eintrag Netcat: <https://sectools.org/tool/netcat/>

In [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01) (Aufgabe 4) habt ihr mit `netcat` einen UDP-Listener angesprochen.
Hier baut ihr eine TCP-Verbindung zwischen den beiden Hosts auf und weist
nach, dass ihr Inhalt im Klartext übertragen wird, im Gegensatz zur
SSH-Verbindung aus Aufgabe 9.

!!! info "Werkzeug: `tcpdump`"
    **Was es tut:** `tcpdump` ist das Kommandozeilen-Gegenstück zu Wireshark:
    Es schneidet Pakete auf einer Schnittstelle mit und schreibt sie auf den
    Bildschirm oder in eine Datei. Es braucht Administratorrechte – in den
    Knoten-Terminals seid ihr `root`.

    **Aufruf:**

    - `-i h1-eth1` – auf dieser Schnittstelle mitschneiden.
    - `-w <datei>` – in eine Datei schreiben (später lesbar mit `-r`).
    - `-A` – Paketinhalt als lesbaren Text (ASCII) anzeigen (beim Lesen
      mit `-r`; beim Schreiben mit `-w` hat es keine Wirkung).
    - `tcp port 8080` – nur TCP-Pakete mit Port 8080 (der **Aufzeichnungsfilter**).
    - `-r <datei>` – eine gespeicherte Datei anzeigen.

    **Beispielausgabe** nach dem Beenden eines Mitschnitts:

    ```text
    tcpdump: listening on h1-eth1, link-type EN10MB (Ethernet), snapshot length 262144 bytes
    10 packets captured
    10 packets received by filter
    0 packets dropped by kernel
    ```

    `listening on …` bestätigt den Start (`EN10MB` = Ethernet). Danach: Wie
    viele Pakete der Filter erfasst hat (`captured`), wie viele den Filter
    erreicht haben (`received by filter`) und wie viele der Kernel
    verworfen hat (`dropped`, idealerweise 0).

    **Typische Fehlermeldungen:** `tcpdump: h2-eth9: No such device exists` –
    die Schnittstelle gibt es nicht (Tippfehler; `ip -br a` listet die
    vorhandenen). `You don't have permission to perform this capture on that
    device` – ihr seid nicht `root` (z. B. in einem normalen Terminal statt
    im Knoten-Terminal).

Das Netz `topo01` muss laufen (Start wie in [Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01), Aufgabe 1; läuft es schon,
macht ihr einfach weiter). Startet auf `h1` den Echo-Dienst aus Teil 4 erneut,
falls er nicht mehr läuft (ihr habt ihn dort beendet; läuft er noch, überspringt
den Befehl):

```bash
h1$ socat TCP-LISTEN:8080,reuseaddr,fork EXEC:/bin/cat &
```

Startet dann auf `h1` einen Mitschnitt auf der Schnittstelle Richtung `r1` (`h1-eth1`; über
`h1-eth0` läuft nur der Internet-Uplink) und schickt von `h2` eine Zeile durch:

```bash
h1$ mkdir -p ~/rn-practice/pcaps
h1$ tcpdump -i h1-eth1 -w ~/rn-practice/pcaps/01-klartext.pcap tcp port 8080 &
h2$ printf 'GEHEIM: passwort123\n' | socat -T2 - TCP:10.0.1.2:8080
```

Der Echo-Dienst schickt dieselbe Zeile zurück. Beendet den Mitschnitt auf
`h1` wie mit `Strg+C`: `jobs -l` zeigt die Prozessnummer von `tcpdump`,
`kill -INT <PID>` beendet ihn sauber (ein hartes Abbrechen kann die Datei
beschädigen). Sucht dann euren Text darin:

```bash
h1$ jobs -l
h1$ kill -INT <PID>
```


```bash
h1$ tcpdump -r ~/rn-practice/pcaps/01-klartext.pcap -A | grep GEHEIM
```

Die Ausgabe enthält die Zeile (zweimal: Hin- und Rückweg), vor den Zeichen
stehen ein paar unlesbare Bytes aus den Paketköpfen:

```text
.,.t	Uc.GEHEIM: passwort123
	Uc..,.tGEHEIM: passwort123
```

Der Mitschnitt liegt in eurem Home-Verzeichnis und bleibt über das Ende der
Sitzung hinaus erhalten. Löscht ihn, sobald ihr die Aufgabe beantwortet habt –
er enthält das „Passwort" im Klartext:

```bash
h1$ rm ~/rn-practice/pcaps/01-klartext.pcap
```

Beendet auch den Echo-Dienst: `jobs -l` zeigt seine Prozessnummer, `kill <PID>`
beendet ihn.

!!! question "Aufgabe: Klartext oder nicht?"
    Der Text `GEHEIM: passwort123` steht unverschlüsselt im
    Mitschnitt. Vergleicht das mit dem SCP/SSH-Verkehr aus Aufgabe 9 ([Teil 2](m2-werkzeuge-in-topo01.md#teil-2-werkzeuge-in-der-emulierten-topologie-topo01)):
    Warum ist dort der Inhalt **nicht** lesbar, hier aber schon? Was bedeutet das
    für Anwendungsprotokolle, die – wie klassisches HTTP, Telnet oder FTP – ohne
    Transportverschlüsselung arbeiten?

    ??? success "Lösung"
        `socat` und der Echo-Dienst schicken die Bytes unverändert über TCP;
        auf dem Weg sind sie lesbar, und jeder, der an einer Leitung, einem Hub
        oder einem gespiegelten Switch-Port mitschneidet, sieht sie. SSH dagegen verschlüsselt den
        Inhalt, bevor er auf die Leitung kommt; im Mitschnitt stehen nur
        „Encrypted packet" und Metadaten. Klassisches HTTP, Telnet und FTP
        übertragen Zugangsdaten und Inhalte im Klartext und gelten daher
        als unsicher; ihre verschlüsselten Nachfolger sind HTTPS, SSH und
        SFTP/FTPS.

--8<-- "issue-feedback.md"

!!! success "Meilenstein 3 geschafft"
    **Das habt ihr gelernt:**

    - Einen kleinen DNS-Server starten und in der dig-Antwort Flags (qr, aa) und den Status NXDOMAIN deuten.
    - Mit ss lauschende Ports samt Zustand, Adresse und Prozess finden.
    - Eine TCP-Verbindung von Hand aufbauen und ihren Klartext mit tcpdump im Mitschnitt wiederfinden.

    **Wie es weitergeht:** Blatt 02 (Subnetting und ARP) befasst sich mit den Adressen unter diesen Verbindungen: Ihr berechnet Subnetze, konfiguriert Adressen und Routen selbst und seht, wie ARP auf der Sicherungsschicht Adressen auflöst.

    [Weiter zu Blatt 02 · IPv4-Subnetting & ARP](../02-subnetting-arp/index.md){ .md-button }
