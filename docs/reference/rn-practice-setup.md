# rn-practice Setup

Die ausführbaren Mininet-Topologien und Helper-Skripte, auf die alle
Aufgabenblätter verweisen, liegen im vendorierten Verzeichnis
`mininet-labs/rn-practice/` (unveränderte Kopie von
[`github.com/scimbe/rn-practice`](https://github.com/scimbe/rn-practice),
`main`-Branch — das Original bleibt unangetastet).

| Verzeichnis | Lab | Inhalt |
|---|---|---|
| `topo01/` | 01, 04 | Ping/Netcat/Dig/Nmap/Wireshark/SSH/HTTP(S)-Server, iperf/iperf3 |
| `topo02/` | 05 | ARP-Spoofing-Angreifer-Setup, HTTP-Attacker |
| `topo03/` | 03 | RIP/BGP-Routing mit vier Routern (`r1`–`r4`, FRR-Configs) |
| `topo-base/` | — | Basis-Topologie-Bausteine |
| `topoP02`–`topoP04/` | 02 | Vertiefungs-Praktika Subnetting/Routing |
| `setup/` | — | Host-seitige Setup-Skripte (Mininet-Installation) |

## Start eines Labs (Kurzform)

```bash
cd mininet-labs/rn-practice/topo01
./start-topo01.sh
```

`start-topo01.sh` ruft zuerst `getIntWithIntenet.sh` auf (erzeugt
`interface.txt`, das `topo01.py` für den NAT-Uplink benötigt), startet dann
`sudo -E python3 topo01.py` und räumt beim Beenden auf.

## Bewusst nicht übernommen

`setup/mininet.ovpn` — enthält einen eingebetteten privaten Schlüssel für ein
internes, laut Originalprojekt nicht mehr unterstütztes VPN-Setup. Kein
produktives Secret, wird aber grundsätzlich nicht committet.

## Verhältnis zu den Aufgabenblättern

Die vorherige 1:1-Struktur (jedes Google-Drive-PDF ein eigenes Dokument) ist
in den [Praktika](../index.md#praktika) zu 7 thematischen Aufgabenblättern
konsolidiert. Die Zuordnung Original → neues Blatt steht in der Tabelle auf
der Startseite.
