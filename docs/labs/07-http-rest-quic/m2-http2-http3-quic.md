# Meilenstein 2 von 3 · HTTP/2, HTTP/3 und QUIC

*07 · HTTP/REST/QUIC von Hand* · [Übersicht des Blatts](index.md)

Auf dieser Seite macht ihr die drei HTTP-Versionen im Mitschnitt sichtbar und seht, wie QUIC auf UDP aufsetzt.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzwerkschicht</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 4 – Dieselbe Seite über HTTP/1.1 und HTTP/2 (`topo01`)

Bevor ihr QUIC anschaut, macht den Unterschied zwischen den beiden
TCP-basierten HTTP-Versionen sichtbar. Der lokale Server aus dem Skript
`startHTTP3Server.sh` beantwortet dieselbe Seite über **alle drei** Versionen
gleichzeitig – über TCP (HTTP/1.1 und HTTP/2) und über QUIC (HTTP/3, Teil 5).

Startet `topo01`, falls nicht mehr aktiv, und den Server auf `h1`. Beim Start
öffnen sich die Fenster `Node: h1` und `Node: h2`; wie ihr verdeckte Fenster
wiederfindet und sicher tippt, steht unter
[Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).
`h1$` und `h2$` auf dieser Seite bedeuten: Befehl im Fenster `Node: h1` bzw.
`Node: h2`; der Prompt dort lautet `root@…#`.

```bash
cd ~/rn-practice/topo01
./start-topo01.sh
```

```bash
h1$ cd ~/rn-practice/topo01
h1$ ./startHTTP3Server.sh
```

!!! note "Werft einen Blick in das Skript"
    Der Server läuft im Vordergrund und belegt das Fenster `Node: h1`, bis
    ihr ihn am Ende von Teil 7 mit ++ctrl+c++ beendet. Lest das Skript
    deshalb **vor** dem Start oder im Fenster `Node: h2` (beide Knoten
    sehen dasselbe Verzeichnis); alle weiteren Befehle dieser Seite tippt ihr
    in `Node: h2`.

    `cat startHTTP3Server.sh` zeigt euch, dass hier kein Hexenwerk passiert:
    derselbe nginx-`server`-Block hört doppelt – `listen 443 ssl` für TCP
    (HTTP/1.1 und HTTP/2) und `listen 443 quic` für QUIC. Genau diese eine
    Zeile schaltet HTTP/3 ein.

Fragt von `h2` aus dieselbe Seite einmal über HTTP/1.1 und einmal über
HTTP/2 ab und lasst euch von `curl` die tatsächlich ausgehandelte Version
ausgeben:

```bash
h2$ curl -sk --http1.1 -o /dev/null -w 'ausgehandelt: HTTP/%{http_version}\n' https://10.0.1.2/
h2$ curl -sk --http2   -o /dev/null -w 'ausgehandelt: HTTP/%{http_version}\n' https://10.0.1.2/
```

`-s` unterdrückt den Fortschrittsbalken von `curl`, der sonst die Zeile
`ausgehandelt: …` verdeckt.

Zeichnet parallel auf `h2` den TCP-Verkehr mit: Startet den Mitschnitt mit
`&`, führt die beiden `curl`-Befehle aus, wartet kurz (`sleep 1`), beendet
den Mitschnitt (`jobs -l` zeigt die PID, dann `kill <PID>`) und seht ihn euch an:

```bash
h2$ sudo rm -f /tmp/http12.pcap
h2$ sudo tcpdump -i h2-eth0 -w /tmp/http12.pcap tcp port 443 &
```

Wartet, bis `listening on h2-eth0` erscheint, und führt dann die beiden
`curl`-Befehle von oben aus. Beendet danach den Mitschnitt und seht ihn euch
an:

```bash
h2$ sleep 1; jobs -l                # PID ablesen
h2$ kill <PID>
h2$ tcpdump -r /tmp/http12.pcap -n | head
h2$ tcpdump -r /tmp/http12.pcap -n | grep 'Flags \[S\]'
```

Die PID in `jobs -l` gehört zu `sudo`; `kill` auf sie beendet `tcpdump`
trotzdem. Die Zusammenfassung des Mitschnitts erscheint erst nach dem `kill`
und kann zwischen spätere Eingaben rutschen. `head` zeigt nur die ersten
Pakete; die zweite Zeile zählt die Verbindungsaufbauten (Flags `[S]`) – wie
viele sind es?

Beide Abrufe laufen über TCP, Port 443. Anders als HTTP/3 in Teil 5 sind
beide – **TCP**. Ob HTTP/2 mehrere Anfragen gemultiplext in einer Verbindung
überträgt, während HTTP/1.1 sie nacheinander abarbeitet, könnt ihr an diesem
Mitschnitt nicht ablesen: TLS 1.3 verschlüsselt den Inhalt, und ihr habt
je Version nur einen Abruf gemacht. Das ist die Theorie aus dem folgenden
Hintergrundkasten; im Mitschnitt seht ihr die TCP-Verbindungen und die
TLS-Daten.

!!! quote "Hintergrund: HTTP/2 löst nur das halbe Blockier-Problem"
    HTTP/2 ersetzte den Textklartext von HTTP/1.1 durch binäre Frames
    (RFC 9113, Abschnitt 4) und schickt alle Anfragen als parallele Ströme über
    eine einzige TCP-Verbindung (Abschnitt 5). Damit verschwindet das
    Head-of-Line-Blocking auf HTTP-Ebene – aber RFC 9113, Abschnitt 1, hält
    selbst fest: „TCP head-of-line blocking is not addressed by this protocol."
    Genau dieses verbliebene Problem eine Schicht tiefer war der Grund, HTTP/3
    auf QUIC (über UDP) zu stellen.

    - RFC 9113, Abschnitt 1/4/5: <https://www.rfc-editor.org/rfc/rfc9113.html>
    - MDN, „Evolution of HTTP": <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP>

--8<-- "issue-feedback.md"

### Teil 5 – HTTP/3 von Hand beobachten: QUIC ist UDP (`topo01`)

Jetzt der eigentliche QUIC-Teil. HTTP/3 ist HTTP über QUIC (RFC 9114), und
QUIC läuft über **UDP** (RFC 9000) – nicht über TCP. Das macht ihr im eigenen
Netz sichtbar, ohne dass die nach außen gesperrte UDP/443-Regel eine Rolle
spielt.

Der Server aus Teil 4 spricht bereits HTTP/3. Startet auf `h2` einen
Mitschnitt, der **nur UDP auf Port 443** aufzeichnet, und ruft dann die Seite
gezielt über HTTP/3 ab:

```bash
h2$ sudo rm -f /tmp/quic.pcap
h2$ sudo tcpdump -i h2-eth0 -w /tmp/quic.pcap udp port 443 &
h2$ curl -sk --http3-only -o /dev/null -w 'ausgehandelt: HTTP/%{http_version}, Status %{response_code}\n' https://10.0.1.2/
```

`--http3-only` erzwingt HTTP/3 (kein Rückfall auf TCP). Wartet kurz
(`sleep 1`), beendet danach den Mitschnitt (`jobs -l` zeigt die PID, dann `kill <PID>`) und schaut hinein:

```bash
h2$ tcpdump -r /tmp/quic.pcap -n | head
```

**Aufgabe:** Vergleicht diesen Mitschnitt mit dem TCP-Mitschnitt aus Teil 4.
Auf welcher Transportschicht (Protokoll, Port) läuft HTTP/3? Warum sieht ein
Filter wie `tcp port 443` hier **nichts**, obwohl ihr eine „HTTPS"-Seite
abgerufen habt?

!!! quote "Hintergrund: „QUIC" ist kein Akronym und läuft absichtlich in UDP"
    QUIC ist kein neues Transportprotokoll neben TCP und UDP, sondern läuft
    *in* UDP-Datagrammen: „QUIC packets are carried in UDP datagrams … to
    better facilitate deployment in existing systems and networks" (RFC 9000,
    Abschnitt 1). Der Grund – NATs und Middleboxen lassen praktisch nur TCP und
    UDP durch – steht in RFC 9308, Abschnitt 2: UDP „permits traversal of
    network middleboxes (including NAT) without requiring updates to existing
    network infrastructure". RFC 9000, Abschnitt 1.2, hält zudem fest „QUIC is
    a name, not an acronym" – die oft gelesene Auflösung „Quick UDP Internet
    Connections" stammt von Googles Vorläuferprotokoll und gilt für den
    IETF-Standard nicht.

    - RFC 9000, Abschnitt 1/1.2, und RFC 9308, Abschnitt 2: <https://www.rfc-editor.org/rfc/rfc9000.html>
    - Cloudflare Blog, „The Road to QUIC": <https://blog.cloudflare.com/the-road-to-quic/>

### Teil 6 – Der QUIC-Handshake im Mitschnitt: das 1200-Byte-Initial (`topo01`)

Schaut euch den Mitschnitt aus Teil 5 genauer an. Die **ersten** Pakete, die
`h2` an `h1` sendet, sind auffällig groß – genau 1200 Byte –, obwohl noch gar
keine Nutzdaten geflossen sind:

```bash
h2$ tcpdump -r /tmp/quic.pcap -n | head -20
```

`h2` hat die Adresse `10.0.6.2`, `h1` die `10.0.1.2`. Zählt die Paketgrößen
der ersten Datagramme vom Client (`10.0.6.2 > 10.0.1.2`) und vergleicht sie
mit den ersten Antworten des Servers. `length` ist die UDP-Nutzlast; mit
`-v` zeigt `tcpdump` zusätzlich die Länge im IP-Header, die um die 28 Byte
von IP- und UDP-Header größer ist.

**Aufgabe:** Die QUIC-Spezifikation (RFC 9000, Abschnitt 14.1) verlangt, dass
der Client sein erstes Paket auf mindestens 1200 Byte **auffüllt** (Padding).
Überlegt: Warum schreibt ein Protokoll ausgerechnet eine *Mindestgröße* für
das erste Paket vor? (Stichwort: Absenderadressen in UDP-Paketen lassen sich
fälschen.) Rechnet dazu die Bytes des Servers bis zur nächsten Client-Nachricht
gegen die Bytes eurer ersten Client-Datagramme auf.

Klappt den Hintergrund erst nach eurer eigenen Überlegung auf.

??? quote "Hintergrund: warum das erste QUIC-Paket auf 1200 Byte aufgefüllt wird"
    Ein QUIC-Client muss jedes UDP-Datagramm, das ein Initial-Paket trägt, mit
    PADDING-Frames auf mindestens 1200 Byte UDP-Nutzlast auffüllen (RFC 9000,
    Abschnitt 14.1). Das dient zwei Zwecken: Es beweist, dass der Pfad Pakete
    dieser Größe trägt, und es dämpft Amplification-Angriffe – denn vor der
    Adressvalidierung darf ein Server höchstens dreimal so viele Bytes senden,
    wie er empfangen hat (RFC 9000, Abschnitt 8.1). Ein Server muss zu kleine
    Initial-Pakete sogar verwerfen, sonst würde er zum Reflektor für gefälschte
    Absenderadressen.

    - RFC 9000, Abschnitt 8.1/14.1: <https://www.rfc-editor.org/rfc/rfc9000.html>
    - „The Illustrated QUIC Connection" (quic.xargs.org): <https://quic.xargs.org/>

!!! question "Kurz nachgedacht"
    Was würde passieren, wenn der Client sein erstes Paket stattdessen winzig
    klein halten dürfte – und wer hätte davon den Schaden?

--8<-- "issue-feedback.md"

### Teil 7 – `Alt-Svc`: wie ein Client von TCP auf HTTP/3 umsteigt (`topo01`)

Ein Browser spricht einen Server zuerst fast immer über TCP an (HTTP/1.1 oder
HTTP/2). Woher weiß er dann, dass er auf das schnellere HTTP/3 über QUIC
wechseln kann? Der Server sagt es ihm – mit dem **`Alt-Svc`**-Header
(*Alternative Services*, RFC 7838).

Fragt den Server aus Teil 4/5 über TCP an und lasst euch nur die Kopfzeilen
zeigen:

```bash
h2$ curl -k -I https://10.0.1.2/
```

Achtet in der Ausgabe auf die Zeile `alt-svc: h3=":443"; ma=86400` (bei
HTTP/2 schreibt `curl` Header-Namen klein; die erste Zeile zeigt, welche
Version `curl` hier ausgehandelt hat). Sie sagt
dem Client: „Denselben Dienst gibt es auch als HTTP/3 (`h3`) auf Port 443,
und du darfst dir das 86400 Sekunden lang merken (`ma`)."

**Aufgabe:** Erklärt die Reihenfolge, in der ein realer Browser vorgeht:
erster Kontakt über TCP, `Alt-Svc` empfangen, danach Wechsel auf QUIC. Warum
kann HTTP/3 nicht einfach „von Anfang an" benutzt werden, ohne dass der Client
den Server vorher kennt? (Stichwort: Der Client weiß vor dem `Alt-Svc`-Hinweis
nicht, ob der Server QUIC überhaupt spricht – und ein blindes UDP/443 könnte
unterwegs gesperrt sein, wie in dieser Umgebung nach außen.)

!!! quote "Hintergrund: `Alt-Svc` und die DNS-Alternative"
    Ein über HTTP/1.1 oder HTTP/2 verbundener Client erfährt von HTTP/3 durch
    das Antwort-Header-Feld `Alt-Svc` (RFC 7838, Abschnitt 3), z. B.
    `Alt-Svc: h3=":443"`. Welche Version dann tatsächlich gesprochen wird,
    klärt der ALPN-Token im TLS-Handshake: „h3" steht für HTTP/3 (RFC 9114,
    Abschnitt 3.1). Ein weiterer Weg ist der HTTPS/SVCB-Eintrag im DNS
    (RFC 9460), über den der Client schon vor dem ersten Kontakt erfährt, dass
    ein Dienst HTTP/3 anbietet.

!!! question "Kurz nachgedacht"
    Der Client musste den Server erst über TCP erreichen, bevor er von
    `Alt-Svc` erfuhr. Warum kann ein Browser nicht einfach beim allerersten
    Kontakt zu einem unbekannten Server direkt QUIC probieren?

!!! tip "Aufräumen"
    Beendet den Server im Fenster `Node: h1` mit ++ctrl+c++ und prüft, dass
    nichts mehr auf Port 443 lauscht (keine Ausgabe heißt: beendet):

    ```bash
    h1$ ss -tlpn | grep 443
    h1$ ss -ulpn | grep 443
    ```

    Beendet dann die Topologie mit `exit` in der Mininet-Konsole (Fenster
    `Terminal`, Prompt `mininet>`). Laufende Mitschnitte beendet ihr wie
    oben mit `kill <PID>`.

!!! success "Meilenstein 2 geschafft"
    **Das habt ihr gelernt:**

    - HTTP/1.1 und HTTP/2 laufen über TCP, HTTP/3 läuft über QUIC und damit über UDP.
    - QUIC (RFC 9000) setzt bewusst auf UDP auf; der Handshake zeigt sich in großen Initial-Paketen von 1200 Byte UDP-Nutzlast.
    - Ein Server kündigt per Alt-Svc-Header (RFC 7838) an, dass er auch HTTP/3 spricht; der Client wechselt dann von TCP um.

    **Was Meilenstein 3 verspricht:** Der letzte Meilenstein zeigt, was passiert, wenn ein Server Eingaben ungeprüft in die HTML-Antwort einbaut: Reflektiertes und gespeichertes XSS gegen ein absichtlich verwundbares Übungsziel, mit Blick auf den Netzwerkverkehr.

    [Weiter zu Meilenstein 3: Site-Cloning und XSS](m3-xss.md){ .md-button }
