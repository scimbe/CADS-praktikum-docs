# 06 · Advanced: Covert Channels

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/06-advanced-covert-channels.pdf){ .md-button }

!!! warning "Werkzeuge vor dem Start von `topo01` im Desktop-Terminal prüfen"
    Für dieses Aufgabenblatt gibt es kein eigenes Topologie-Skript – ihr
    arbeitet in der bekannten Topologie `topo01`. Benötigt werden `iodine`
    (DNS-Tunneling, Teil 2), `faketime` (Teil 6) sowie `tshark` und `jq`
    (JA3-Fingerprinting, Teil 5). `iodine` und `faketime` gehören zum
    aktuellen Desktop-Image. Prüft im Desktop-Terminal, bevor ihr
    `./start-topo01.sh` startet:

    ```bash
    command -v iodine iodined faketime tshark jq
    ```

    Fehlt eines davon (ältere Abbildversion), installiert es nach:

    ```bash
    sudo apt-get update
    sudo apt-get install -y iodine faketime tshark jq
    ```

    `h1` und `h2` teilen sich das Dateisystem des Desktops (nur die
    Netzwerk-Namensräume unterscheiden sich), also stehen die Programme
    auch in den Knoten bereit. In den Knoten wird nichts installiert;
    installiert wird ausschließlich im Desktop-Terminal.

## Lernziele

- Unverschlüsselten Netzwerkverkehr (DNS, ICMP, HTTP) mit Wireshark/`tcpdump`
  live und aus einem Mitschnitt heraus analysieren, und zwischen
  vertrauenswürdigem und einsehbarem Verkehr im selben lokalen Netz
  unterscheiden.
- Das Prinzip von DNS-Tunneling als verdeckten Datenkanal über
  DNS-Anfragen/-Antworten praktisch mit `iodine` nachvollziehen.
- Verdeckte Kanäle über ICMP-Payload und TTL-Manipulation selbst mit
  `hping3` erzeugen und im Mitschnitt wiedererkennen.
- Klassisches DNS mit DNS-over-HTTPS (DoH) vergleichen: Was bleibt im
  Klartext sichtbar, was nicht?
- Das Prinzip von JA3-Fingerprinting (Fingerabdruck eines TLS-Clients anhand
  charakteristischer Merkmale des `ClientHello`) einordnen können.
- Verstehen, welche Risiken eine Manipulation der Systemzeit für andere
  sicherheitsrelevante Mechanismen hat (insbesondere TLS-Zertifikatsprüfung).
- Einen verdeckten Kanal über DNS auch **ohne** `iodine` bauen – mit einem
  lesbaren Python-DNS-Server, an dem sichtbar wird, dass die Daten in den
  Abfragenamen stecken.
- Verdeckte Kanäle in Protokoll-**Kopffeldern** erzeugen und wiedererkennen:
  TCP-Sequenznummer, ICMP-Timestamp, sowie Port-Knocking als Signalisierung.
- Erkennen, dass selbst bei TLS die Ziel-Domain (SNI) im Klartext übertragen
  wird – ohne `tshark`, nur mit `openssl` und `tcpdump`.
- Einen verdeckten Kanal nicht nur bauen, sondern ihn als Beobachter an
  Paketrate und -größe **erkennen**.

--8<-- "issue-feedback.md"

## Aufgaben

!!! tip "Alte Mitschnitte zuerst löschen"
    Die Mitschnitte in diesem Blatt landen in festen Dateien unter `/tmp`.
    Eine Datei aus einem früheren Versuch löst `Permission denied` aus oder
    täuscht Ergebnisse vor, weil `tcpdump` nicht schreiben kann und `grep`
    die alte Datei liest. Deshalb steht vor jedem Mitschnitt ein
    `rm -f <datei>` (bei `sudo tcpdump` mit `sudo`).

!!! info "Schreibweise der Befehle (Prompts) und Fenster"
    `h1$ ping -c 4 10.0.1.2` heißt: Tippt nur `ping -c 4 10.0.1.2` (ohne das
    `h1$`) in das Fenster mit dem Titel „Node: h1“; entsprechend `h2$` für
    „Node: h2“. Der echte Prompt in allen Knotenfenstern sieht gleich aus
    (`root@<zufälliger Name>:~/rn-practice/topo01#`); nur der Fenstertitel
    verrät den Knoten, und in den Knotenfenstern seid ihr `root`. Das
    `sudo` vor einigen Befehlen ist dort überflüssig, aber harmlos. Zeilen
    ohne Knotenpräfix gehören in ein normales Desktop-Terminal (Prompt
    `cads@…`). Wenn ihr Fenster nicht findet oder das erste Zeichen
    verschluckt wird, hilft
    [Fenster wiederfinden und tippen](../../reference/umgebung.md#fenster-wiederfinden-und-tippen).

!!! tip "Mitschnitte im Hintergrund: `-U`, `jobs -l`, erst beenden, dann lesen"
    Mehrere Teile starten `tcpdump` mit `&` im Hintergrund. Drei Dinge
    gelten dann immer:

    - Gebt `tcpdump -U` an (Paket für Paket in die Datei schreiben). Ohne
      `-U` puffert `tcpdump` und eine mit `kill` beendete Aufnahme kann als
      leere Datei (24 Byte) enden.
    - `jobs -l` zeigt bei `sudo tcpdump …` oft die PID von `sudo`, nicht die
      von `tcpdump`. `kill <PID>` auf diese PID beendet den Mitschnitt
      trotzdem; achtet darauf, die Zeile mit `tcpdump` zu wählen und nicht
      die eines anderen Hintergrundjobs.
    - Lest die Datei erst, wenn der Mitschnitt beendet ist. Bei einem noch
      laufenden Mitschnitt meldet `tcpdump -r` ggf. `truncated dump file`.

Das Blatt ist in 4 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: Verkehr inspizieren, erste verdeckte Kanäle](m1-inspektion-und-tunnel.md){ .meilenstein }  
   Hier lernt ihr, Verkehr passiv mitzulesen, und baut die ersten verdeckten Kanäle über DNS und ICMP.
2. [Meilenstein 2: DoH, TLS-Fingerprints und die Uhr](m2-doh-ja3-zeit.md){ .meilenstein }  
   Diese Seite fragt, was bei verschlüsseltem Verkehr noch sichtbar bleibt, und zeigt, wie sehr Sicherheitsmechanismen von der Systemzeit abhängen.
3. [Meilenstein 3: Kanäle selbst bauen](m3-kanaele-selbst-bauen.md){ .meilenstein }  
   Hier baut und decodiert ihr verdeckte Kanäle selbst, in Abfragenamen, TTL, TCP-Sequenznummer und in der Reihenfolge von Verbindungsversuchen.
4. [Meilenstein 4: Weitere Träger und Erkennung](m4-weitere-traeger-und-erkennung.md){ .meilenstein }  
   Auf dieser Seite lernt ihr weitere Träger für verdeckte Kanäle kennen und wechselt dann auf die Seite des Verteidigers, der sie erkennt.

## Potenzielle Herausforderungen

- **Fehlende Werkzeuge** (`iodine`, `faketime`, `tshark`, `jq`): Das
  aktuelle Image enthält diese Werkzeuge. Bei einer älteren Abbildversion
  müssen sie vor dem Start von `topo01` im Desktop-Terminal nachinstalliert
  werden (siehe Hinweis am Blattanfang). In den Knoten wird nichts
  installiert.
- **`date -s` und `timedatectl` scheitern** (`Operation not permitted`,
  bzw. `System has not been booted with systemd …`). Das ist Absicht: Die
  Wanduhr ist nicht namespaced, sie gilt für den ganzen Knoten. Teil 6 nutzt
  deshalb `faketime`, das die Uhr nur für den gestarteten Prozess verstellt.
- **Kein dediziertes `topoXX`-Skript für dieses Lab** – alle Übungen laufen
  in der bekannten `topo01`-Topologie. Dort löst `dnsmasq` auf `h1` die
  Namen für `h1` und `h2` auf.

## Quellen

- `mininet-labs/intro/05-advanced.tex` ("Lab 5: Sicherheitsanalyse und
  verdeckte Kanäle in Netzwerken")
- `docs/reference/umgebung.md` — Abgleich der vorinstallierten Werkzeuge
  (Stand der Werkzeuge: `iodine`, `faketime`, `tshark`, s. o.)
- `mininet-labs/rn-practice/topo01/` — Topologie, in der alle Teilaufgaben
  dieses Labs stattfinden, inklusive `dns-server.py` (Teil 8)
