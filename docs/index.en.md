# Networking Lab (Rechnernetze-Praktikum)

This page summarizes the lab sheets of the modernized networking lab
environment ("Rechnernetze-Praktikum") of CADS AG. It replaces the
scattered Google Drive PDFs and short URLs (`t1p.de/...`) with a
consolidated, continuously maintained version inside the repository itself —
every lab sheet is readable here as text **and** downloadable as a PDF.

## What's new here

- **Consolidated:** the previous 11 separate documents (6 introductory labs +
  5 advanced blocks) have been merged into 7 thematically self-contained lab
  sheets (see below). Duplicates (e.g. ARP spoofing appeared in two
  documents) have been resolved, and missing sections (previously pure
  TODO placeholders) have been newly written out.
- **Corrected:** known errors/ambiguities in the original texts have been
  fixed and, where technically relevant, given a short justification.
- **Challenges called out:** every lab sheet now explicitly names known
  pitfalls (environment-related and subject-matter pitfalls) — each in the
  "Potenzielle Herausforderungen" section at the end of the lab sheet.
- **Verified, not just claimed:** where a statement has been confirmed via a
  Playwright screenshot or an actual script test in this environment, that
  is noted (see [Desktop/Mininet Environment](reference/umgebung.md)).

## Labs

| # | Topic | Based on (original) | Topology script |
|---|-------|------------------------|-------------------|
| [01](labs/01-netzwerkgrundlagen-tools.md) | Networking fundamentals & tools (ping, netcat, dig, nmap, Wireshark, layer model) | Lab 1 + Labor-01 | `rn-practice/topo01` |
| [02](labs/02-subnetting-arp.md) | IPv4 subnetting & ARP | Labor-02 | `rn-practice/topoP02`–`topoP04` |
| [03](labs/03-routing-rip-bgp.md) | Routing: RIP/BGP with FRR | Lab 3 + Labor-03 | `rn-practice/topo03` |
| [04](labs/04-tcp-udp-congestion.md) | TCP/UDP & congestion control | Lab 2 + Labor-04 | `rn-practice/topo01` (iperf/iperf3) |
| [05](labs/05-arp-spoofing-dos.md) | ARP spoofing & denial-of-service | Lab 4 | `rn-practice/topo02` |
| [06](labs/06-advanced-covert-channels.md) | Advanced: DNS tunneling, covert channels, JA3, NTP | Lab 5 | *(no script yet, see Challenges)* |
| [07](labs/07-http-rest-quic.md) | HTTP/REST/QUIC by hand (netcat/telnet) | Labor-05 | `rn-practice/topo01` (HTTP(S) server) |

## Environment & access

The labs run in a browser-based desktop (Selkies/KasmVNC) with Mininet,
Wireshark and routing daemons — access via single sign-on. Which login
button appears on which host is documented in the environment reference.
Details: [Desktop/Mininet Environment](reference/umgebung.md) and
[rn-practice setup](reference/rn-practice-setup.md).

!!! warning "Safety notice"
    Labs 05 and 06 cover attack techniques (ARP spoofing, SYN flood, covert
    channels). These run **exclusively** inside the isolated Mininet network
    namespace environment of each participant's container — never against
    the host network or third parties.
