# Rechnernetze-Praktikum

Moin moin,

hier stehen die Aufgabenblätter des Rechnernetze-Praktikums. Jedes Blatt ist
als Text lesbar und als PDF herunterladbar.

## Praktika

| # | Thema | Topologie |
|---|-------|-----------|
| [01](labs/01-netzwerkgrundlagen-tools/index.md) | Netzwerkgrundlagen & Tools (ping, netcat, dig, nmap, Wireshark, Schichtenmodell) | `topo01` |
| [02](labs/02-subnetting-arp/index.md) | IPv4-Subnetting & ARP | `topoP02`, `topoP04`, `topo02`, `topo01` |
| [03](labs/03-routing-rip-bgp/index.md) | Routing: RIP/BGP mit FRR | `topoP03`, `topo03` |
| [04](labs/04-tcp-udp-congestion/index.md) | TCP/UDP & Congestion Control | `topoP04`, `topo02` |
| [05](labs/05-arp-spoofing-dos/index.md) | ARP-Spoofing & Denial-of-Service | `topo02` |
| [06](labs/06-advanced-covert-channels/index.md) | Advanced: DNS-Tunneling, Covert Channels, JA3, NTP | `topo01` |
| [07](labs/07-http-rest-quic/index.md) | HTTP/REST/QUIC von Hand (netcat/telnet) | `topo01` |

Jedes Blatt ist in drei bis vier Meilensteine geteilt, jeder auf einer eigenen Seite. Am Ende
jedes Meilensteins steht, was ihr gelernt habt und was der nächste bringt; eine kleine Grafik zeigt,
in welchen Schichten des TCP/IP-Modells ihr euch gerade bewegt. Das PDF enthält das ganze Blatt.

Die Topologien liegen auf dem Desktop unter `~/rn-practice/`.

--8<-- "issue-feedback.md"

## Umgebung & Zugang

Die Labore laufen in einem browserbasierten Desktop mit Mininet, Wireshark und
Routing-Daemons, Zugang per Single-Sign-on. Details:
[Desktop-/Mininet-Umgebung](reference/umgebung.md) und
[rn-practice Setup](reference/rn-practice-setup.md).

!!! warning "Sicherheitshinweis"
    Die Labore 05 und 06 behandeln Angriffstechniken (ARP-Spoofing,
    SYN-Flood, Covert Channels). Wendet sie ausschließlich in eurer eigenen
    Mininet-Topologie an, nie gegen andere Netze oder Dritte.

--8<-- "issue-feedback.md"
