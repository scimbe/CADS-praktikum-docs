# Networking Lab (Rechnernetze-Praktikum)

This site contains the lab sheets of the networking lab. Every sheet can be
read as text and downloaded as a PDF.

## Labs

| # | Topic | Topology |
|---|-------|----------|
| [01](labs/01-netzwerkgrundlagen-tools.md) | Networking fundamentals & tools (ping, netcat, dig, nmap, Wireshark, layer model) | `topo01` |
| [02](labs/02-subnetting-arp.md) | IPv4 subnetting & ARP | `topoP02`, `topoP04`, `topo02`, `topo01` |
| [03](labs/03-routing-rip-bgp.md) | Routing: RIP/BGP with FRR | `topoP03`, `topo03` |
| [04](labs/04-tcp-udp-congestion.md) | TCP/UDP & congestion control | `topoP04`, `topo02` |
| [05](labs/05-arp-spoofing-dos.md) | ARP spoofing & denial-of-service | `topo02` |
| [06](labs/06-advanced-covert-channels.md) | Advanced: DNS tunneling, covert channels, JA3, NTP | `topo01` |
| [07](labs/07-http-rest-quic.md) | HTTP/REST/QUIC by hand (netcat/telnet) | `topo01` |

The topologies are located on the desktop under `~/rn-practice/`.

--8<-- "issue-feedback.en.md"

## Environment & access

The labs run in a browser-based desktop with Mininet, Wireshark and routing
daemons, accessed via single sign-on. Details:
[Desktop/Mininet Environment](reference/umgebung.md) and
[rn-practice setup](reference/rn-practice-setup.md).

!!! warning "Safety notice"
    Labs 05 and 06 cover attack techniques (ARP spoofing, SYN flood, covert
    channels). Use them only inside your own Mininet topology, never against
    other networks or third parties.

--8<-- "issue-feedback.en.md"
