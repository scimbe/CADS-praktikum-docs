# 04 · TCP/UDP & Congestion Control

[:material-file-pdf-box: Als PDF herunterladen](../pdf/04-tcp-udp-congestion.pdf){ .md-button }

## Lernziele

- Verstehen, wie sich eine Link-Fehlerrate (zufälliger Paketverlust) auf Ping,
  UDP und TCP unterschiedlich auswirkt.
- Den Zusammenhang zwischen MTU-Begrenzung, IP-Fragmentation und
  UDP-Paketverlust nachvollziehen können — inklusive der Gründe, warum
  moderne Netze IP-Fragmentation heute eher vermeiden.
- Durchsatz, Latenz und das Zusammenspiel von Bufferung und
  Verbindungskonkurrenz mit `iperf`/`iperf3` praktisch messen und die
  gemessenen Werte gegen vorher gebildete Erwartungswerte prüfen.
- Beobachten, wie eine TCP-Verbindung (roher `iperf`-Strom wie auch eine
  SSH-Sitzung) auf eine kurzzeitige Unterbrechung des Pfads reagiert – im
  Unterschied zu einer laufenden `ping`-Messung.
- Grundverständnis von TCP Congestion Control (Reno vs. Cubic) durch
  praktische `iperf3`-Messungen mit `-C reno`/`-C cubic` und Abgleich der
  verfügbaren Algorithmen über `sysctl` gewinnen.

## Aufgaben

### Teil A — Fehlerrate, MTU und IP-Fragmentation

*(Quelle: `Labor-04-TCP-UDP.tex`, vollständig erhalten — dies ist die
fachlich verlässliche Basis dieses Aufgabenblatts.)*

Starten Sie Ihr Setup durch Wechsel in das Aufgabenverzeichnis und Aufruf des
Start-Skripts:

```bash
cd ~/rn-practice/topoP04
./start-topoP04.sh
```

!!! note "Korrektur gegenüber dem Originaldokument"
    Das Originaldokument verweist mit `cd ~/rn-practical/topoP04` auf ein
    nicht existierendes Verzeichnis `rn-practical`. Der tatsächliche, in
    diesem Repository vorhandene Pfad ist `~/rn-practice/topoP04` (mit *c*
    statt *ic*, siehe `docs/reference/rn-practice-setup.md` und die gleiche
    Korrektur in [Lab 02](02-subnetting-arp.md)).

Die Topologie besteht aus zwei Hosts und einem Switch. Die Verbindung ist auf
eine Bandbreite von 10 Mbit/s, eine MTU von 500 Byte und eine Fehlerrate von
10 % begrenzt.

#### Herausforderung der Fehlerrate

Die Fehlerrate von 10 % auf der Verbindung führt zu zufälligen
Paketverlusten. Beobachten Sie dies mit einem fortlaufenden Ping zwischen den
Hosts:

```bash
h1$ ping -c 20 10.0.0.2
h1$ ping -c 20 -D 10.0.0.2
```

Einige der Ping-Anfragen werden fehlschlagen — das spiegelt die Fehlerrate
der Verbindung wider. Die zusätzlichen Flags erleichtern es, Verluste zu
erkennen. Dieser Verlust wird durch den fehlerbehafteten Link ausgelöst und
muss von TCP durch Retransmission ausgeglichen werden.

**Aufgabe:** Versuchen Sie zu erklären, warum `ping` Ihnen häufig eine
Verlustrate *über* 10 % meldet, obwohl der Link nominell nur 10 % Fehlerrate
hat. (Hinweis: Ein ICMP-Echo besteht aus zwei Richtungen — Request *und*
Reply müssen den fehlerbehafteten Link jeweils unabhängig überstehen.)

![Terminalfenster "Node: h1": ping -c 20 10.0.0.2 mit sichtbaren Luecken in icmp_seq (2, 5, 7, ... fehlen) und Abschlussstatistik "20 packets transmitted, 13 received, 35% packet loss"](../assets/screenshots/04-tcp-udp-congestion/ping-loss-topoP04.png)
*Realer Mitschnitt gegen die absichtlich verlustbehaftete `topoP04`-Verbindung
(10 % Fehlerrate je Richtung): 35 % Gesamtverlust bei Hin- und Rückweg
zusammen liegt sehr nahe am rechnerisch erwarteten Wert
`1 - 0.9⁴ ≈ 34,4 %` für zwei unabhängig verlustbehaftete Teilstrecken
(Request und Reply je einmal über den Link) – ein direkter, messbarer Beleg
für die Aufgabenstellung oben.*

#### Fehlerrate bei UDP und TCP

Untersuchen Sie den Einfluss der Fehlerrate auf UDP und TCP. Wir senden auf
dem 10-MBit/s-Link:

Einmal für UDP:

```bash
h1$ iperf -i 10 -s -u
h2$ iperf -t 300 -i 10 -c 10.0.0.1 -u -b 20M
```

![Zwei Terminalfenster: "Node: h1" als iperf-UDP-Server, "Node: h2" als Client mit Zwischenberichten (8.39/8.38 Mbit/s gesendet) und Server Report mit "Lost/Total Datagrams: 827/4282 (0%)"-Zeile sowie tatsaechlicher Bandbreite von 6.77 Mbit/s](../assets/screenshots/04-tcp-udp-congestion/iperf-udp-loss.png)
*Realer `iperf`-UDP-Test über denselben verlustbehafteten Link (verkürzt auf
6 statt 300 Sekunden für die Demonstration): der Client sendet mit
konstanter Rate (~8,4 Mbit/s), doch der Server-Report zeigt 827 von 4282
Datagrammen verloren – UDP bemerkt den Verlust nicht selbst und kompensiert
ihn nicht, im Gegensatz zu TCP.*

Einmal für TCP:

```bash
h1$ iperf -i 10 -s
h2$ iperf -t 300 -i 10 -c 10.0.0.1
```

**Aufgabe:** Passen diese Messwerte zu Ihren Erwartungen? Erklären Sie die
Daten. Wie schätzen Sie eine Paketfehlerrate von 10 % auf dem Link bezüglich
der Performance von TCP im Vergleich zu UDP ein?

#### Zu große MTU bei UDP

Da die MTU auf 500 Byte begrenzt ist, werden Pakete, die größer als diese
Grenze sind, in IP-Fragmente aufgeteilt (oder verworfen, falls die
Fragmentierung nicht gelingt). Beobachten Sie dies, indem Sie größere
UDP-Nachrichten senden. Damit der Text nicht selbst eingetippt werden muss,
kann eine vorbereitete Textdatei genutzt werden.

Einmal mit einem kürzeren Text:

```bash
h1$ nc -lu 5000
h2$ nc -u 10.0.0.1 5000 < MehrAls500ByteText.txt
```

Einmal mit einem längeren Text:

```bash
h1$ nc -lu 5000
h2$ nc -u 10.0.0.1 5000 < MehrAls1500ByteText.txt
```

Beobachten Sie auf beiden Systemen bei beiden Nachrichten den Verkehr mit
Wireshark. IP-Fragmentation tritt bei UDP auf, sobald Pakete größer als die
MTU sind und in kleinere Segmente aufgeteilt werden müssen; ob diese
transportiert werden, hängt vom Netzwerk ab.

**Hintergrund:** IP-Fragmentierung wird in modernen Netzwerken aus mehreren
Gründen oft vermieden oder deaktiviert:

- **Leistungsprobleme:** Fragmentierung und Reassemblierung erfordern
  zusätzliche Verarbeitung durch Router und Endgeräte und können die
  Netzwerkleistung beeinträchtigen.
- **Sicherheitsbedenken:** Fragmentierte Pakete können missbraucht werden, um
  Firewalls und Intrusion-Detection-Systeme zu umgehen oder zu überlasten.
- **Komplexität:** Die Handhabung fragmentierter Pakete erhöht die
  Komplexität von Netzwerkgeräten und -protokollen; Implementierungs- oder
  Konfigurationsfehler können zu verlorenen oder unvollständigen Paketen
  führen.
- **Unzuverlässigkeit:** Geht ein Fragment verloren, muss das gesamte
  ursprüngliche Paket erneut gesendet werden — selbst wenn andere Fragmente
  bereits erfolgreich übertragen wurden.
- **Path MTU Discovery:** Statt Fragmentierung zuzulassen, ermitteln viele
  Netzwerke heute per Path MTU Discovery die maximale Übertragungseinheit
  entlang des Pfades, sodass Endgeräte von vornherein passend große Pakete
  senden.
- **IPv6:** Bei IPv6 ist Fragmentierung durch Zwischenrouter nicht mehr
  erlaubt — Endgeräte sind selbst dafür verantwortlich, Pakete in
  akzeptabler Größe zu senden.
- **Quality of Service:** Fragmentierte Pakete können die QoS beeinträchtigen,
  da Reihenfolge und Vollständigkeit nicht garantiert sind.

Die Vermeidung von IP-Fragmentierung führt zu einem einfacheren, sichereren
und effizienteren Netzwerkbetrieb — erfordert im Gegenzug aber, dass
Endgeräte und Anwendungen sorgfältig konfiguriert werden, um Pakete
innerhalb der Pfad-MTU zu senden.

**Aufgabe:** Wiederholen Sie das gesamte Experiment mit TCP. Sie werden
feststellen, dass die Bytestream-basierte Übertragung dieses Verhalten so
nicht zeigt — TCP segmentiert selbst passend zur MSS, statt ein
übergroßes Paket abzusetzen.

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 04 teila
    ```


### Teil B — iperf/iperf3 in `topo02`: Durchsatz, Latenz, Fairness und Congestion Control

*(Quelle: `mininet-labs/intro/02-TCP-IP-Suite.tex`, "Lab 2: TCP/IP Suite –
Ein Start" — bei einer früheren Konsolidierung war der Kopiervorgang dieser
Datei aus Google Drive fehlgeschlagen, sie lag nur als technischer
TODO-Hinweis vor; der vollständige Originalinhalt wurde für dieses
Aufgabenblatt erneut aus der Quelle geladen und ist jetzt hier korrekt
wiedergegeben, statt wie zuvor durch eine Neuentwicklung ersetzt zu sein.)*

!!! note "topo02, nicht topo01"
    Anders als eine frühere Fassung dieses Abschnitts annahm, nutzt das
    Original für Durchsatz-/Latenzmessungen **`topo02`** (dieselbe
    Vier-Host-Topologie `h0--s1--r1---r2----s2---h3`, die auch in
    [Lab 05](05-arp-spoofing-dos.md) für ARP-Spoofing verwendet wird), nicht
    `topo01`. Startet sie mit:

    ```bash
    cd ~/rn-practice/topo02
    ./start-topo02.sh
    ```

1. **Erwartungswert bilden, dann Durchsatz messen.** Die Verbindung erlaubt
   nominell 10 Mbit/s. Überschlagt vorab, wie viele Daten sich in 5 Minuten
   übertragen lassen sollten. Startet dann auf `h2` einen Iperf-TCP-Server
   und auf `h0` den zugehörigen Client:

   ```bash
   h2$ iperf -i 10 -s
   h0$ iperf -t 300 -i 10 -c 10.0.20.10
   ```

   Vergleicht das Messergebnis mit eurem Erwartungswert. Wiederholt die
   Messung mit einer auf 536 Byte reduzierten maximalen Segmentgröße:

   ```bash
   h0$ iperf -M 536 -l 1 -t 300 -i 10 -c 10.0.20.10
   ```

   Bildet vorher eine These, wie sich die kleinere Segmentgröße auf den
   Durchsatz auswirken sollte, und gleicht sie mit dem Ergebnis ab.

2. **Latenz und der Effekt einer konkurrierenden Übertragung.** Startet auf
   `h1` einen fortlaufenden `ping` zu `h3` (und optional umgekehrt):

   ```bash
   h1$ ping 10.0.20.11
   h3$ ping 10.0.10.11
   ```

   Beurteilt anhand der gemessenen Round-Trip-Time, ob eine Telefonkonferenz
   über diese Verbindung praktikabel wäre (Richtwert: unter 150–200 ms).
   Bildet dann eine Annahme, wie stark sich die Latenz verändert, wenn `h0`
   gleichzeitig einen `iperf`-Strom zu `h2` startet (Stichwort: Bufferung
   auf gemeinsam genutzten Verbindungen):

   ```bash
   h0$ iperf -t 300 -i 10 -c 10.0.20.10
   ```

   Prüft eure Annahme anhand der laufenden `ping`-Ausgabe auf `h1`/`h3`.

3. **TCP vs. UDP im direkten Vergleich.** Lasst die TCP-Server-Instanz auf
   `h2` weiterlaufen und startet zusätzlich auf `h3` einen UDP-Server:

   ```bash
   h3$ iperf -u -i 10 -s
   ```

   Sendet von `h0` UDP-Verkehr mit steigender Rate zu `h3`, während `h1`
   weiterhin `h3` anpingt, und beobachtet jeweils Durchsatz auf `h3` sowie
   Latenz auf `h1`:

   ```bash
   h0$ iperf -u -b 8.6M -t 300 -i 10 -c 10.0.20.11
   h0$ iperf -u -b 9.8M -t 300 -i 10 -c 10.0.20.11
   h0$ iperf -u -b 100M -t 300 -i 10 -c 10.0.20.11
   ```

   Bei `-b 100M` überschreitet ihr die nominelle Link-Kapazität von 10
   Mbit/s deutlich – beobachtet insbesondere die Client- und
   Server-Ausgabe von `iperf` (Sendevolumen vs. tatsächlich beim Empfänger
   angekommenes Volumen). Vereinzelte "Out of Order"-Pakete bei UDP sind
   dabei normal und kein Fehler.

4. **Pfadunterbrechung während einer laufenden TCP-Übertragung.** Startet
   erneut eine TCP-Messung `h0` → `h2` und beobachtet parallel `h1$ ping
   10.0.20.10`. Deaktiviert dann für 20–30 Sekunden das Interface des
   Routers `r1` in Richtung `h2` und aktiviert es danach wieder:

   ```bash
   r1$ ifconfig r1-eth0 down
   # 20-30 Sekunden warten, Client-/Server-/Ping-Ausgabe beobachten
   r1$ ifconfig r1-eth0 up
   ```

   Haltet fest, wie sich Iperf-Client (`h0`), Iperf-Server (`h2`) und der
   `ping` auf `h1` jeweils während der Unterbrechung und nach der
   Wiederherstellung verhalten.

5. **Dieselbe Unterbrechung mit einer Anwendung (SSH) statt einem rohen
   Iperf-Strom.** Startet auf `h2` den SSH-Server und verbindet euch von
   `h0` aus:

   ```bash
   h2$ /usr/sbin/sshd -D -f sshd.conf
   h0$ ssh mininet@10.0.20.10
   h0$ /sbin/ifconfig   # zur Bestätigung: Interfaces mit "h2-" sichtbar?
   ```

   Bildet eine Erwartung, wie sich die SSH-Sitzung bei derselben
   Pfadunterbrechung verhalten sollte, unterbrecht dann erneut `r1-eth0` wie
   in Schritt 4, wiederholt `/sbin/ifconfig` auf `h0` und stellt den Pfad
   danach wieder her. Beendet die Sitzung anschließend mit `exit`.

6. **Fairness zwischen zwei gleichzeitigen Verbindungen.** Startet
   Iperf-TCP-Server auf `h2` und `h3` (`&` damit ihr das Terminal
   weiterverwenden könnt):

   ```bash
   h2$ iperf -i 10 -s
   h3$ iperf -i 10 -s &
   ```

   Startet zunächst nur `h0` → `h2`, wartet bis sich der Durchsatz
   stabilisiert hat, und startet dann zusätzlich `h1` → `h3`:

   ```bash
   h0$ iperf -t 300 -i 10 -c 10.0.20.10
   h1$ iperf -t 300 -i 10 -c 10.0.20.11
   ```

   Wiederholt den Versuch mit einem TCP-Strom (`h0` → `h2`) neben einem
   *unlimitierten* UDP-Strom mit 100 Mbit/s (`h1` → `h3`, ohne dass dafür
   ein eigener UDP-Server läuft):

   ```bash
   h0$ iperf -t 300 -i 10 -c 10.0.20.10
   h1$ iperf -u -b 100M -t 300 -i 10 -c 10.0.20.11
   ```

   Vergleicht, wie fair sich TCP gegenüber einem konkurrierenden TCP-Strom
   verhält – und wie es sich gegenüber einem unkooperativen UDP-Strom
   verhält, der keine Rücksicht auf Überlast nimmt.

7. **Reno vs. Cubic mit iperf3.** Prüft zunächst, welche
   Congestion-Control-Algorithmen der Kernel anbietet:

   ```bash
   h0$ sysctl -A | grep tcp | grep congestion
   ```

   Startet auf `h3` einen Iperf3-Server und vergleicht zwei gleichzeitige
   Iperf3-Client-Verbindungen mit unterschiedlicher Congestion Control –
   einmal mit der System-Standardeinstellung (typischerweise Cubic) von
   `h0` zu `h2`, einmal explizit mit Reno von `h1` zu `h3`:

   ```bash
   h3$ iperf3 -i 10 -s
   h0$ iperf -t 300 -i 10 -c 10.0.20.10
   h1$ iperf3 -C reno -t 300 -i 10 -c 10.0.20.11
   ```

   Beobachtet den Durchsatzverlauf über die gesamte Laufzeit. Führt danach
   zum Vergleich dieselbe Messung mit `-C cubic` statt `-C reno` durch.

**Aufgabe:** Fasst zusammen, wie TCP auf Konkurrenz durch einen weiteren
TCP-Strom reagiert (Fairness) und wie es sich gegenüber einem unlimitierten
UDP-Strom verhält, der selbst keine Überlastkontrolle betreibt – und welche
Konsequenz das für Anwendungen hat, die UDP direkt nutzen (z. B. eigene
Verlustbehandlung, Rate-Limiting auf Anwendungsebene).

!!! tip "Fortschritt festhalten (optional)"
    Diesen Teil geschafft? Optional fuer die Admin-Uebersicht vermerken
    (rein lokal, keine Netzwerkverbindung):

    ```bash
    ~/rn-practice/mark-done.sh 04 teilb
    ```

!!! example "Vertiefung (optional): TCP-Retransmission-Timeout und Backoff selbst vermessen"
    Schritt 4 hat gezeigt, dass eine laufende TCP-Übertragung eine
    Pfadunterbrechung übersteht. Schaut euch mit einem echten Mitschnitt
    genauer an, *wie* TCP das tut: Startet auf `h0` `sudo tcpdump -i
    h0-eth0 -w /tmp/rto.pcap`, dazu eine TCP-Übertragung `h0` → `h2` wie in
    Schritt 1, und deaktiviert währenddessen erneut `r1-eth0` für etwa eine
    Minute. Öffnet den Mitschnitt anschließend in Wireshark und filtert auf
    `tcp.analysis.retransmission`. Vergleicht die Zeitabstände zwischen
    aufeinanderfolgenden Retransmissionen desselben Segments – sie sollten
    sich näherungsweise verdoppeln (exponentieller Backoff des
    Retransmission-Timeout). Im Lehrbuch ist das eine Behauptung; hier ist
    es eine Zeitstempel-Spalte in eurem eigenen Mitschnitt.


## Potenzielle Herausforderungen

- **`topoP04` (Teil A) und `topo02` (Teil B) sind seit 2026-09-09 real
  verifiziert** unter dem granularen Capability-Set
  (`NET_ADMIN`+`NET_RAW`+`SYS_ADMIN`+`apparmor:unconfined`, siehe
  [ADR 0002](../adr/0002-capabilities-not-privileged.md)). Beide bauten vorher
  wegen eines reinen Skript-Bugs (fehlender `controller=`-Parameter bzw. ein
  nicht im Image vorhandenes Controller-Binary) gar nicht — nach dem Fix
  liefen die Fehlerraten-Beobachtung in Teil A sowie ein `iperf`-Durchsatztest
  in Teil B (9,6 Mbit/s auf dem nominell 10-Mbit/s-Link zwischen `h0` und
  `h2`) wie im Aufgabenblatt beschrieben.
- Die in Teil A beobachtete Ping-Verlustrate kann durch die
  bidirektionale Natur von ICMP Echo/Reply höher als die nominelle
  Link-Fehlerrate ausfallen — das ist kein Environment-Fehler, sondern
  Teil der Lernaufgabe (siehe Erklärung oben).
- **Anrede uneinheitlich zwischen Teil A und Teil B:** Teil A behält die
  formelle "Sie"-Anrede des Originaldokuments (`Labor-04-TCP-UDP.tex`) bei,
  Teil B verwendet die persönliche "ihr"-Anrede wie [Lab 01](01-netzwerkgrundlagen-tools.md)
  und [Lab 05](05-arp-spoofing-dos.md), obwohl auch das zugrundeliegende
  Original (`02-TCP-IP-Suite.tex`) durchgehend "Sie" verwendet. Eine
  redaktionelle Vereinheitlichung auf einen Ton für das gesamte Aufgabenblatt
  steht noch aus.
- Schritt 6 (Fairness) setzt voraus, dass die Iperf-Server-Instanzen aus
  Schritt 1/3 noch laufen bzw. neu gestartet werden – im Original nicht
  explizit klargestellt, aus dem Kontext aber eindeutig.

## Playwright-Screenshot-Referenz

Für die Verifikation eignet sich in `tests/e2e/specs/screenshots.spec.ts` am
ehesten ein **Zeilen-Screenshot** (`captureLine`) einer `iperf`/`iperf3`-
Zusammenfassungszeile (Durchsatzwert am Ende einer Messung) — hier geht es um
einen einzelnen, gut abgrenzbaren Messwert, kein ganzes Fenster. Ein
**Fenster-Screenshot** (`captureWindow`) passt dagegen besser für die
Wireshark-Ansicht der IP-Fragmentierung in Teil A, da dort das
Zusammenspiel mehrerer Pakete im Kontext sichtbar sein muss.

## Quellen

- `mininet-labs/vertiefung/Labor-04-TCP-UDP.tex` — vollständig erhalten,
  fachliche Basis für Teil A.
- `mininet-labs/intro/02-TCP-IP-Suite.tex` ("Lab 2: TCP/IP Suite – Ein
  Start") — fachliche Basis für Teil B. Die lokal vendorierte Kopie dieser
  Datei enthält weiterhin nur einen technischen TODO-Hinweis (fehlgeschlagener
  Google-Drive-Kopiervorgang in einer früheren Session); der oben verwendete
  Originalinhalt wurde für dieses Aufgabenblatt erneut aus Google Drive
  gelesen, aber **nicht** in die vendorierte `.tex`-Datei zurückgeschrieben
  (außerhalb des Geltungsbereichs dieser Konsolidierung, die sich auf
  `docs/labs/` und `docs/reference/` beschränkt) — siehe
  [Potenzielle Herausforderungen](#potenzielle-herausforderungen) in
  Lab 01 für die analoge Einschränkung. Ein Nachziehen dieser Korrektur in
  `mininet-labs/intro/02-TCP-IP-Suite.tex` selbst wird empfohlen.
- `mininet-labs/rn-practice/topo02/` — Referenztopologie für Teil B (`h0`–`h3`,
  Adressen `10.0.10.x`/`10.0.20.x`), dieselbe Topologie wie in
  [Lab 05](05-arp-spoofing-dos.md).
