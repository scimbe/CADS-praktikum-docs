# Meilenstein 4 von 4 · Weitere Träger und Erkennung

*06 · Advanced: Covert Channels* · [Übersicht des Blatts](index.md)

Auf dieser Seite lernt ihr weitere Träger für verdeckte Kanäle kennen und wechselt dann auf die Seite des Verteidigers, der sie erkennt.

<div class="schichtenbild" style="max-width:20rem;margin:0 0 1.2em 0;font-size:.72rem;line-height:1.5">
<div style="margin-bottom:.3em;color:#757575">In diesen Schichten des TCP/IP-Modells bewegt ihr euch hier:</div>
<div style="display:grid;gap:3px">
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Anwendungsschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Transportschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;background:#3f51b5;color:#fff;font-weight:600;border:1px solid #3f51b5">Netzwerkschicht · Schwerpunkt</div>
<div style="padding:.2em .7em;border-radius:3px;color:#9e9e9e;border:1px dashed #9e9e9e">Netzzugriffsschicht</div>
</div>
</div>

### Teil 11 – Ein ungewöhnlicher Träger: die ICMP-Timestamp-Nachricht (`topo01`)

[Teil 3](m1-inspektion-und-tunnel.md#teil-3-verdeckte-kanale-uber-icmp-payload-und-ttl-hping3) nutzte die Nutzlast von ICMP-**Echo** (Typ 8) – der klassische,
dokumentierte ICMP-Kanal (siehe Hintergrund unten). ICMP kennt aber weitere
Typen, die kaum je auftauchen und einem einfachen Regelwerk deshalb selten
auffallen – etwa die **Timestamp**-Nachricht (Typ 13/14, RFC 792, Abschnitt
„Timestamp or Timestamp Reply Message"). Hier beobachtet ihr zunächst nur,
dass sich ein solcher Typ überhaupt erzeugen und im Mitschnitt wiedererkennen
lässt.

Dieser Meilenstein läuft wieder in `topo01` (Start wie in Meilenstein 3). Die
Fenster „Node: h1“ und „Node: h2“ öffnen sich beim Start von selbst, weitere
Fenster mit `mininet> xterm h1`; Hilfe beim Wiederfinden gibt
[Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).

Zeichnet ICMP auf `h1` auf und schickt von `h2` eine Timestamp-Anfrage:

```bash
h1$ sudo rm -f /tmp/icmpts.pcap
h1$ sudo tcpdump -i h1-eth1 -v -w /tmp/icmpts.pcap icmp -c 2 &
h2$ sudo hping3 --icmp-ts -c 1 10.0.1.2
```

Schaut euch die Nachrichtentypen im Mitschnitt an:

```bash
h1$ tcpdump -r /tmp/icmpts.pcap -v -n | grep -i 'time stamp'
```

(`tcpdump -c 2` beendet sich nach zwei Paketen von selbst; Meldungen wie
`2 packets captured` oder `Done` erscheinen dabei mitten im Prompt. Drückt
einfach ++enter++.) `hping3` und `tcpdump` zeigen die Zeitfelder als
Millisekunden seit Mitternacht UTC bzw. als Uhrzeit; `org 15:44:39.569`
entspricht `Originate=56679569`.

**Aufgabe:** Ihr solltet `time stamp query` und `time stamp reply` sehen –
nicht das gewohnte `echo request`. Die Timestamp-Nachricht trägt drei
sender­bestimmte 32-Bit-Zeitfelder (RFC 792). Überlegt (als Denkaufgabe, nicht
als belegte Praxis): warum wären diese drei Felder *strukturell* geeignet, um
Daten zu transportieren, und warum ist ein selten genutzter, aber völlig
legitimer ICMP-Typ schwerer zu bemerken als offensichtlicher Sonderverkehr?

!!! quote "Hintergrund: der dokumentierte ICMP-Kanal ist die Echo-Nutzlast (Project Loki, 1996)"
    Der klassische, tatsächlich dokumentierte verdeckte ICMP-Kanal steckt nicht
    in der Timestamp-, sondern in der **Echo**-Nachricht: „Project Loki"
    (Phrack 49, 1996) zeigte, dass „arbitrary information can be tunneled in
    the data portion of ICMP_ECHO and ICMP_ECHOREPLY packets". Die
    Timestamp-Nachricht aus diesem Teil hat mit ihren drei senderbestimmten
    32-Bit-Feldern (RFC 792) dieselbe strukturelle Eignung – das bleibt aber
    eine Folgerung, kein dokumentierter Angriff.

    - „Project Loki", Phrack 49, File 06 (1996): <https://phrack.org/issues/49/project-loki-icmp-tunneling.html>
    - RFC 792, Abschnitt „Timestamp or Timestamp Reply Message" (rfc-editor): <https://www.rfc-editor.org/rfc/rfc792.html>

### Teil 12 – Klartext trotz TLS: die Ziel-Domain (SNI) mitlesen (`topo01`)

Ein Kernpunkt von TLS-Fingerprinting ([Teil 5](m2-doh-ja3-zeit.md#teil-5-tls-fingerprinting-mit-ja3)) lässt sich auch ganz **ohne**
`tshark` zeigen, nur mit `openssl` und `tcpdump`: Der Name des Servers, zu dem sich ein Client verbindet, wird als
*Server Name Indication* (SNI) im TLS-`ClientHello` übertragen (definiert in
RFC 6066, Abschnitt 3) – und zwar **im Klartext**, noch bevor irgendetwas
verschlüsselt wird (RFC 8744, Abschnitt 2: „The SNI extension is carried in
cleartext in the TLS 'ClientHello' message.").

Startet auf `h1` einen TLS-fähigen Server (der HTTP/3-Server aus
[Aufgabenblatt 07](../07-http-rest-quic/index.md) bringt auch TLS über TCP mit) und
einen Mitschnitt:

```bash
h1$ cd ~/rn-practice/topo01
h1$ ./startHTTP3Server.sh &
h1$ sudo rm -f /tmp/sni.pcap
h1$ sudo tcpdump -U -i h1-eth1 -A -w /tmp/sni.pcap tcp port 443 &
```

Der Server meldet sich mit mehreren Zeilen (u. a. einem Testhinweis für
`curl --http3-only`, also QUIC über UDP). Diese Ausgabe kann die Eingabezeile
zerstückeln: Wartet kurz, drückt ++enter++ und tippt erst bei sauberem Prompt
weiter. Hier nutzt ihr nicht QUIC, sondern den TLS-Port TCP/443, auf dem der
Server ebenfalls lauscht. Prüft vor dem Verbindungsaufbau mit `jobs -l`,
dass beide Hintergrundjobs laufen (`Running`): Ging beim Tippen ein Zeichen
verloren (z. B. `udo` statt `sudo`), läuft der Mitschnitt nicht, und die
Datei bleibt leer.

Baut von `h2` eine TLS-Verbindung mit einem frei gewählten Servernamen auf:

```bash
h2$ echo | openssl s_client -connect 10.0.1.2:443 -servername geheim.example.org
```

Beendet den Mitschnitt auf `h1` (`jobs -l`, die Zeile mit `tcpdump`,
`kill <PID>`) und sucht erst danach den Servernamen im Mitschnitt. Liest ihr
die Datei, solange `tcpdump` noch läuft, meldet `tcpdump -r` ggf. `truncated
dump file`; der Treffer kann trotzdem erscheinen. Jede TLS-Verbindung hat
ein eigenes `ClientHello`: Rechnet mit etwa einer Trefferzeile je
`openssl`-Aufruf; ruft ihr ihn zweimal auf, erscheinen entsprechend mehr.

```bash
h1$ tcpdump -r /tmp/sni.pcap -A | grep -a geheim.example.org
```

Den HTTP/3-Server (Zeile mit `startHTTP3Server.sh` in `jobs -l`) lasst ihr
für Teil 14 laufen und beendet ihn dort mit `kill <PID>`.

**Aufgabe:** Der Name `geheim.example.org` steht im Klartext im Mitschnitt,
obwohl die Verbindung TLS-verschlüsselt ist. Erklärt, warum die SNI
notwendigerweise unverschlüsselt gesendet wird (der Server muss vor dem
Handshake wissen, für welchen Namen er ein Zertifikat vorlegen soll) – und
was das für einen Beobachter bedeutet, der den Inhalt zwar nicht entschlüsseln
kann, aber sehr wohl sieht, **welche** Seiten ihr ansteuert. (Genau das ist
die Motivation hinter *Encrypted ClientHello*, ECH.)

!!! quote "Hintergrund: die SNI im Klartext – und ihr RFC-Gegenspieler"
    Die Ziel-Domain reist unverschlüsselt, weil der Server erst *aus* der SNI
    erfährt, welches Zertifikat er überhaupt vorlegen soll (RFC 6066, Abschnitt
    3, definiert die Erweiterung; RFC 8744, Abschnitt 2, hält die
    Klartext-Eigenschaft fest). RFC 6066, Abschnitt 11.1, bewertete
    `server_name` noch als „no significant security issues". Dieses Leck
    adressiert *Encrypted ClientHello* (RFC 9849), das die Klartext-SNI
    „perhaps the most sensitive information left unencrypted in TLS 1.3"
    nennt.

    - RFC 6066, Abschnitt 3, und RFC 9849, Abschnitt 1 (rfc-editor): <https://www.rfc-editor.org/rfc/rfc9849.html>
    - Cloudflare Blog, „Encrypted Client Hello" (29.09.2023): <https://blog.cloudflare.com/announcing-encrypted-client-hello/>

!!! question "Kurz nachgedacht"
    ECH verschlüsselt die SNI selbst. Was bleibt für einen Beobachter auf dem
    Übertragungsweg trotzdem sichtbar (Stichwort: Ziel-IP-Adresse,
    Paketgrößen, Zeitpunkt der Verbindung) – und warum ist "die Domain ist
    jetzt verschlüsselt" allein noch keine vollständige Anonymität?

--8<-- "issue-feedback.md"

### Teil 13 – Nutzdaten ganz ohne Kopffeld: UDP mit `socat` – und warum das auffällt (`topo01`)

Die bisherigen Kanäle versteckten Daten in Feldern, die andere Zwecke haben.
Der ehrlichste – und zugleich am leichtesten erkennbare – „Kanal" ist einfach
eine UDP-Nutzlast. Das baut ihr mit `socat` (im Image vorhanden) und stellt es
den raffinierteren Verstecken gegenüber.

Dafür braucht `h1` **zwei Fenster**, weil `socat` im Vordergrund läuft und sein
Fenster blockiert: Fenster 1 ist das bisherige `h1`-Fenster (Mitschnitt),
Fenster 2 öffnet ihr mit `mininet> xterm h1`. Beide heißen „Node: h1“;
kennzeichnet sie am besten, indem ihr in jedem zuerst z. B. `echo FENSTER-1`
bzw. `echo FENSTER-2` tippt, und wechselt über die Fensterliste (siehe
[Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen)).

Startet einen UDP-Empfänger und einen Mitschnitt, sendet von `h2`:

```bash
h1$ sudo rm -f /tmp/udpchan.pcap                                           # Fenster 1
h1$ sudo tcpdump -U -i h1-eth1 -A -w /tmp/udpchan.pcap udp port 9999 &     # Fenster 1
h1$ socat -u UDP-RECV:9999 -                                               # Fenster 2 (blockiert)
h2$ echo 'EXFIL_UDP' | socat - UDP-SENDTO:10.0.1.2:9999
```

Beendet `socat` in Fenster 2 mit ++ctrl+c++. Beendet den Mitschnitt in
Fenster 1: `jobs -l` zeigt die PID von `tcpdump` (ggf. die von `sudo`), dann
`kill <PID>`. Erst danach lest ihr die Datei, sonst ist sie ggf.
unvollständig.

Prüft, dass die Nutzlast im Mitschnitt steht:

```bash
h1$ tcpdump -r /tmp/udpchan.pcap -A | grep -a EXFIL_UDP
```

Als Absender erscheint im Mitschnitt `10.0.6.2`; das ist die Adresse von `h2`
(wie in Teil 7).

**Aufgabe:** `EXFIL_UDP` steht sofort im Klartext im Paket. Vergleicht diesen
Kanal mit dem DNS-Kanal aus [Teil 8](m3-kanaele-selbst-bauen.md#teil-8-dns-kanal-ohne-iodine-der-lesbare-dns-server-als-endpunkt-topo01) und dem Sequenznummer-Kanal aus [Teil 9](m3-kanaele-selbst-bauen.md#teil-9-ein-kanal-in-der-tcp-sequenznummer-topo01):
Welcher überträgt am meisten pro Paket? Welcher fällt einem Beobachter am
schnellsten auf? Was ist der Zielkonflikt jedes verdeckten Kanals
(Bandbreite gegen Unauffälligkeit)?

### Teil 14 – Die andere Seite: einen verdeckten Kanal erkennen (`topo01`)

Alle bisherigen Teile haben Kanäle **gebaut**. Zum Abschluss nehmt ihr die
Rolle des Verteidigers ein: Ein verdeckter Kanal verrät sich fast immer durch
sein *statistisches* Verhalten, auch wenn kein einzelnes Paket verdächtig
aussieht.

Nehmt einen der Mitschnitte aus den Teilen 8, 11 oder 13 (`/tmp/dnschan.pcap`,
`/tmp/icmpts.pcap`, `/tmp/udpchan.pcap`) und einen Mitschnitt von normalem
Verkehr und vergleicht Paketzahl, -größe und Rate. Die Mitschnitte liegen in `/tmp`
und sind nach einem Neustart der Topologie weg; fehlt `dnschan.pcap`, wiederholt
Teil 8 (Server und Mitschnitt starten, `dig` senden, beides beenden). Den
Mitschnitt von normalem Verkehr erzeugt ihr mit dem noch laufenden
HTTP/3-Server aus Teil 12 (sonst startet ihn wie dort neu):

```bash
h1$ sudo rm -f /tmp/normal.pcap
h1$ sudo tcpdump -U -i h1-eth1 -w /tmp/normal.pcap tcp port 443 &
h2$ curl -sk https://10.0.1.2/
```

Die Antwortseite behauptet, sie sei „über HTTP/3“ gekommen. Das ist nur ein
fester Text des Übungsservers: Euer `curl` hat hier TLS über TCP/443
gesprochen (Teil 12), und genau diesen TCP-Verkehr zeichnet der Mitschnitt
auf. Für die Statistik spielt der Text keine Rolle.

Beendet den Mitschnitt (`jobs -l`, `kill <PID>`) und den HTTP/3-Server
(`kill <PID>`). Vergleicht dann:

```bash
h1$ capinfos /tmp/dnschan.pcap
h1$ capinfos /tmp/udpchan.pcap
h1$ capinfos /tmp/normal.pcap
```

`capinfos` (im Image vorhanden) fasst pro Mitschnitt Paketzahl, Dauer,
durchschnittliche Paketgröße und Datenrate zusammen. Beachtet: Ein
Mitschnitt aus Teil 8 oder 13 enthält nur ein bis zwei Pakete, und
Datenrate und Durchschnitt sind bei so wenigen Paketen nicht
aussagekräftig. Für eine Statistik braucht ihr mehr Verkehr. Erwartet beim
Vergleich der Paketgrößen keine „auffällig großen“ Pakete: Die
Tunnel-ähnlichen Kanäle bestehen aus kleinen Paketen (grob 50 bis 120 Byte),
der normale TLS-Verkehr kommt im Mittel auf mehrere hundert Byte. Worauf es
ankommt, zeigt die Schleife unten. Startet den
DNS-Server wie in Teil 8 neu und schickt von `h2` mehrere Abfragen mit
unterschiedlichen langen Hex-Namen (hier 20 Stück) in einer Schleife. Jetzt
seid ihr der Verteidiger: 20 Pakete in kurzer Zeit zählen mehr als ein
einzelnes Wort. Die Schleife gibt absichtlich nichts aus (`+short` und
`NXDOMAIN`: es gibt nie einen Treffer), sie ist also nicht fehlgeschlagen.

```bash
h1$ sudo rm -f /tmp/dnsmenge.pcap
h1$ sudo tcpdump -U -i h1-eth1 -w /tmp/dnsmenge.pcap udp port 5353 &
h2$ for i in $(seq 20); do dig @10.0.1.2 -p 5353 +short +time=1 +tries=1 "$(head -c 20 /dev/urandom | od -An -tx1 | tr -d ' \n').exfil.h1"; done
```

Beendet Mitschnitt und Server und lest `capinfos /tmp/dnsmenge.pcap`. Zählt
ergänzend die Pakete im Mitschnitt. Beachtet, dass `wc -l` Anfragen **und**
Antworten zählt, also zwei Zeilen je Abfrage; die Zeile `reading from file …`
geht auf die Fehlerausgabe und wird nicht mitgezählt:

```bash
h1$ tcpdump -r /tmp/dnsmenge.pcap -n | wc -l
```

**Aufgabe:** DNS-Tunneling erzeugt auffällig **viele** DNS-Anfragen mit
auffällig **langen** Namen; ein normaler Client fragt selten und kurz. Nennt
zwei messbare Merkmale (z. B. Anfragerate, mittlere Namenslänge, Anteil der
`NXDOMAIN`-Antworten – der Server antwortet zwar, aber nie mit einem
Treffer), an denen ein Verteidiger einen der vorherigen
Kanäle erkennen könnte – **ohne** eine einzige Nutzlast zu entschlüsseln.

--8<-- "issue-feedback.md"

!!! success "Meilenstein 4 geschafft"
    **Das habt ihr gelernt:**

    - Seltene ICMP-Typen wie Timestamp eignen sich als unauffälliger Träger, weil einfache Regelwerke sie kaum beachten.
    - Bei TLS wird die Ziel-Domain (SNI) im ClientHello im Klartext übertragen und lässt sich mit openssl und tcpdump mitlesen.
    - Eine UDP-Nutzlast ohne Kopffeld-Trick ist der einfachste Kanal und fällt zugleich am leichtesten auf.
    - Verdeckte Kanäle verraten sich meist durch statistisches Verhalten wie Paketrate und -größe, nicht durch einzelne Pakete.

    Ihr habt in diesem Blatt Kanäle gebaut und erkannt – beide Rollen gehören zusammen: Wer einen Kanal bauen kann, versteht, woran man ihn findet.

    **Wie es weitergeht:** Blatt 07 wechselt zur Anwendungsschicht: Ihr sprecht HTTP von Hand, auch über TLS, und beobachtet im Mitschnitt HTTP/2 sowie HTTP/3 über QUIC. Die Mitschnitt-Auswertung aus diesem Blatt hilft euch dabei.

    [Weiter zu Blatt 07 · HTTP/REST/QUIC von Hand](../07-http-rest-quic/index.md){ .md-button }
