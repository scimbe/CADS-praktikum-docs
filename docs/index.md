# Rechnernetze-Praktikum

Moin moin,

hier stehen die Aufgabenblätter des Rechnernetze-Praktikums. Jedes Blatt ist
als Text lesbar und als PDF herunterladbar.

## Praktika

| # | Thema | Topologie |
|---|-------|-----------|
| [01](labs/01-netzwerkgrundlagen-tools.md) | Netzwerkgrundlagen & Tools (ping, netcat, dig, nmap, Wireshark, Schichtenmodell) | `topo01` |
| [02](labs/02-subnetting-arp.md) | IPv4-Subnetting & ARP | `topoP02`, `topoP04`, `topo02`, `topo01` |
| [03](labs/03-routing-rip-bgp.md) | Routing: RIP/BGP mit FRR | `topoP03`, `topo03` |
| [04](labs/04-tcp-udp-congestion.md) | TCP/UDP & Congestion Control | `topoP04`, `topo02` |
| [05](labs/05-arp-spoofing-dos.md) | ARP-Spoofing & Denial-of-Service | `topo02` |
| [06](labs/06-advanced-covert-channels.md) | Advanced: DNS-Tunneling, Covert Channels, JA3, NTP | `topo01` |
| [07](labs/07-http-rest-quic.md) | HTTP/REST/QUIC von Hand (netcat/telnet) | `topo01` |

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
