# 02 · IPv4-Subnetting & ARP

[:material-file-pdf-box: Als PDF herunterladen](../../pdf/02-subnetting-arp.pdf){ .md-button }

## Worum es geht

Stellt euch ein Unternehmen mit vier Abteilungen vor. Jede Abteilung bekommt
ein eigenes Netz, die Netze hängen an drei Routern, und irgendjemand muss
entscheiden, **welche Adressen wohin gehören** und **wie ein Paket seinen Weg
findet**. Genau das machen Netzwerkadministratorinnen und -administratoren
jeden Tag: Adressen planen, Routen setzen, und wenn etwas nicht ankommt,
herausfinden, an welcher Stelle der Kette es hakt.

Dieses Blatt führt euch dabei Schritt für Schritt. Es beginnt mit einer
**Werkzeugeinführung** (Mininet, `ip`, `ping`, `traceroute`, `tcpdump`,
`ip neigh`), die ihr einmal durcharbeitet und später als Nachschlagewerk
benutzt. Danach folgen die Teile 1 bis 11. Die meisten Teile sind so
aufgebaut; die späteren Teile nennen stattdessen Ziel, Vorbedingung und
Schritte:

1. **Auf einen Blick** – Lernziel, Motivation, Vorwissen.
2. **Vorgemacht** – ein Beispiel, das euch vorgerechnet oder vorgeführt wird,
   samt erwarteter Ausgabe und der Anleitung, sie zu lesen.
3. **Gemeinsam** – eine angeleitete Übung mit kleinen Schritten.
4. **Selbst** – eine Aufgabe, die ihr allein löst.
5. **Lösungen** stehen eingeklappt direkt unter der jeweiligen Aufgabe
   (`Lösung`). Versucht es zuerst allein; ein Aufklappen nach einem ehrlichen
   Versuch ist aber ausdrücklich erlaubt, denn Lernen funktioniert über das
   Vergleichen.

## Lernziele

Nach diesem Blatt könnt ihr

- aus Hostzahlen **Subnetze mit passender Präfixlänge ableiten** (VLSM) und
  Netz-, Broadcast- und Hostadressen **berechnen**;
- die Routingtabelle eines Routers **lesen** und für ein Paket **begründen**,
  welche Route gewinnt (längstes Präfix);
- die Konfiguration von Adressen, Routen und Gateways unter Linux
  **selbst durchführen** und als wiederholbares Skript **aufschreiben**;
- **erklären**, warum für jeden Hop eine eigene ARP-Auflösung nötig ist, und
  sie im Mitschnitt **nachweisen**;
- das Lernverhalten eines Switches (Lernen, Fluten, Altern, Überlaufen)
  **messen** und die Folgen für die Sicherheit **einordnen**;
- IPv6-Nachbarn über Link-Local-Adressen und Neighbor Discovery finden
  (Teil 8);
- (Vertiefung, optional) die Auswirkungen einer kleinen MTU auf
  IPv4-Fragmentierung und Paketverlust **beobachten**.

--8<-- "issue-feedback.md"

!!! info "Schreibweise der Befehle (Prompts) – und in welchem Fenster ihr tippt"
    `h1$ ping -c 4 10.0.0.2` heißt: Tippt nur `ping -c 4 10.0.0.2` (ohne das
    `h1$`) in das Fenster mit dem Titel **„Node: h1"**; entsprechend `r1$`,
    `h0$` usw. für „Node: r1", „Node: h0". Diese Knotenfenster öffnen sich
    beim Start der Topologie von selbst oder über `mininet> xterm h1`. Ihre
    Eingabeaufforderung sieht in **allen** Knotenfenstern gleich aus
    (`root@<zufälliger Name>:~/rn-practice/topoXX#`); nur der Fenstertitel
    verrät den Knoten.

    `mininet> …` tippt ihr in das Fenster, in dem ihr das Startskript
    gestartet habt: Dort bleibt der Prompt `mininet>` stehen, solange das Netz
    läuft. Zeilen mit `$` ohne Knotenpräfix gehören in ein normales Terminal
    des Desktops (Prompt `cads@…$`). Der Prompt selbst gehört nie zum Befehl.

## Aufgaben

Das Blatt ist in 4 Meilensteine geteilt. Jeder Meilenstein ist eine eigene Seite und endet mit einer kurzen Zusammenfassung: was ihr gelernt habt und was der nächste Meilenstein bringt. Bearbeitet sie der Reihe nach.

1. [Meilenstein 1: Mininet und die Netzwerkwerkzeuge](m1-werkzeuge.md){ .meilenstein }  
   Diese Seite stellt Mininet und die Werkzeuge vor, mit denen ihr in diesem Blatt die Frage „Was ist hier eingestellt, und kommt etwas an?“ beantwortet.
2. [Meilenstein 2: Adressplan: VLSM, Konfiguration, MTU, Broadcast](m2-adressplan.md){ .meilenstein }  
   Hier lernt ihr, einen Adressblock sinnvoll aufzuteilen, die Konfiguration selbst vorzunehmen und Grenzen eines Subnetzes zu berechnen.
3. [Meilenstein 3: Switch und ARP](m3-switch-und-arp.md){ .meilenstein }  
   Auf dieser Seite untersucht ihr, wie ein Switch Rahmen weiterleitet und wie ARP IP- in MAC-Adressen auflöst.
4. [Meilenstein 4: Vertiefung: Präfixe, IPv6, Flutung, Verschnitt](m4-vertiefung.md){ .meilenstein }  
   Diese Seite vertieft das Blatt: Ihr entscheidet Adress- und Routenfragen zuerst selbst, bevor ihr sie am System prüft, und messt offene Behauptungen nach.

## Potenzielle Herausforderungen

- **`topoP04` öffnet `Node: h1` und `Node: h2` selbst**, das zuletzt
  geöffnete Fenster hat den Fokus. `bash: h1: command not found` heißt: Ihr
  habt `h1 …` in ein Knoten-Fenster getippt – dort ohne Knotennamen
  eingeben, oder in die Mininet-Kommandozeile wechseln.
- **Prozesse nie mit `pkill` oder `killall` beenden.** Mininet-Knoten teilen
  sich die Prozessliste mit eurem Desktop; `pkill nc` beendet euren ganzen
  Desktop und meldet euch ab. Beendet Programme mit `Strg+C` im jeweiligen
  Fenster, Hintergrundprozesse mit `kill <PID>` (PID aus `jobs -l` bzw. `ps`).
- **Übungsvariante starten:** `topoP02-self` startet ihr mit
  `sudo python3 topoP02-self.py` (im Verzeichnis `~/rn-practice/topoP02`).
- **`topo02` öffnet seine Terminalfenster selbst** (`r1`, `h0`, `h1`, `h2`,
  `h3`) – sie liegen anfangs übereinander. Zieht sie auseinander, statt
  mit `xterm` weitere zu öffnen.
- **`mininet> xterm <knoten>`** öffnet ein Terminalfenster mit dem Titel
  `Node: <knoten>`, in dem ihr als root im Namensraum des Knotens arbeitet.
- **OVS-Befehle im Desktop-Terminal brauchen `sudo`** (`ovs-appctl`,
  `ovs-vsctl`), sonst meldet das Werkzeug `Permission denied`.
- **Teil 5 nutzt `topo02`, nicht `topoP02`.** `topoP02` hat keinen Switch
  (nur direkte Host-Router-Verbindungen), `topoP04` nur einen Switch mit zwei
  Hosts und 10 % künstlichem Paketverlust – damit lassen sich geflutete
  Rahmen nicht sauber zählen.
- **Teil 6: `ip neigh`-Zustände** wie `STALE` sind kein Fehler, sondern der
  normale Alterungszyklus.
- **Teil 8: Link-Local-Ziele brauchen auf Knoten mit mehreren
  Schnittstellen den Zusatz `%<schnittstelle>`**, sonst wählt der Kernel
  womöglich die falsche Schnittstelle.
- **Teil 7/10: `ip route get` ist die Kontrolle, nicht der Anfang.** Erst
  rechnen (welches Präfix ist länger?), dann prüfen.
- **Teil 9: drei Fenster, jedes mit fester Aufgabe** (Lauscher `h1`,
  Sender `h0`, Desktop-Terminal für den Switch). Fehlende Ausgabe heißt fast
  immer: Befehl im falschen Fenster.

## Quellen

- Topologie-Skripte in `~/rn-practice`: `topoP02/` (`topoP02.py`,
  `topoP02-self.py`, `start-topoP02.sh`), `topoP04/` (`topoP04.py`,
  `start-topoP04.sh`, `MehrAls500ByteText.txt`, `MehrAls1500ByteText.txt`),
  `topo02/` (`topo02.py`, `start-topo02.sh`, dieselbe Topologie wie in
  [Lab 04](../04-tcp-udp-congestion/index.md) und [Lab 05](../05-arp-spoofing-dos/index.md)),
  `topo01/` (`topo01.py`, `start-topo01.sh`)
- Olivier Bonaventure u. a.: *Computer Networking: Principles, Protocols and
  Practice*, UCLouvain, <https://www.computer-networking.info>, Lizenz
  CC BY-SA 3.0. Die Idee zu Teil 5 (Ethernet-Lernen, Fluten und Alterung
  selbst messen) stammt aus den dortigen Übungen.
- Didaktischer Aufbau: M. D. Merrill, *First Principles of Instruction*
  (Problem – Aktivierung – Demonstration – Anwendung – Integration);
  Lernzielformulierung mit Handlungsverben nach der Taxonomie von Bloom
  (revidiert von Anderson & Krathwohl); gestufte Beispiele zur Begrenzung der
  kognitiven Last (Sweller, Cognitive-Load-Theorie). Die Wireshark-Labs von
  Kurose und Ross („Computer Networking: A Top-Down Approach") dienten als
  Vorbild für Aufgaben, die erst eine Messung vorführen und dann selbst
  durchführen lassen.
