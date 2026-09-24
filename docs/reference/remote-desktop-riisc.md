# Remote-Desktop nutzen: riisc.bunsenbrenner.org

Schritt-fuer-Schritt-Anleitung fuer den Weg von "Browser oeffnen" bis
"im eigenen Praktikums-Desktop arbeiten" unter `riisc.bunsenbrenner.org`.

`riisc.bunsenbrenner.org` und `rn-praktikum.bunsenbrenner.org` fuehren zum
**selben Backend, demselben Container-Modell und derselben Desktop-Umgebung**
— es gibt hier **kein separates Deployment**. Die einzigen tatsaechlichen
Unterschiede sind Landing-Page-Branding und Login-Anbieter (siehe Schritt 1
unten). Alles ab dem Login — Freigabe-Wartezeit, erster Start,
Skript-Seeding, persistenter
Fortschritt, Logout, Terminal/Wireshark/Mininet-Orientierung — verlaeuft
**identisch** zu rn-praktikum. Diese Seite fasst den Ablauf trotzdem
vollstaendig zusammen, damit riisc-Teilnehmer:innen nicht zwischen zwei
Dokumenten hin- und herspringen muessen; die ausfuehrlichere Fassung mit
denselben Inhalten steht unter
[Remote-Desktop: rn-praktikum.bunsenbrenner.org](remote-desktop-rn-praktikum.md).

## 1. Login (host-spezifischer Unterschied)

1. `https://riisc.bunsenbrenner.org/` im Browser oeffnen. Die Seite zeigt
   das RIISC-eigene Branding (an `riisc.de` angenaehnte Farb-/Typografie-
   Sprache), nicht das CADS-Branding von rn-praktikum.
2. Auf den Login-Button klicken. Hier gibt es **keinen erzwungenen
   HAW-GitLab-Login** — stattdessen zeigt Keycloak seinen eigenen
   Provider-Auswahlbildschirm mit Google, GitHub oder E-Mail/Passwort als
   Optionen. Einen der angebotenen Anbieter waehlen und dort anmelden.
3. Nach erfolgreichem Login geht es automatisch weiter zu `/start` — ab
   hier gilt exakt derselbe Ablauf wie bei rn-praktikum.

!!! note "Eigene, getrennte Sitzung"
    Session-Cookies sind pro Hostname isoliert: eine Anmeldung bei
    rn-praktikum meldet nicht automatisch auch bei riisc an (und umgekehrt).
    Fuer beide Hosts ist ggf. ein eigener Login-Vorgang noetig, auch wenn es
    sich um dieselbe Person/denselben Zugriff auf das Backend handelt.

## 2. Erstes Mal: auf Freigabe warten

Identisch zu rn-praktikum: die eigene Identitaet muss vom Admin einmalig
freigeschaltet werden. Beim ersten Login erscheint die Wartesseite
("Warte auf Freigabe", Auto-Refresh alle 30 Sekunden), das kann **bis zu
24 Stunden** dauern. Die Freigabe gilt danach, bis der Admin sie entzieht
oder sie nach 6 Monaten automatisch ablaeuft.

## 3. Erster Start des Desktops

Identisch zu rn-praktikum: nach der Freigabe dauert der erste Start rund
30–45 Sekunden (Wartesseite mit Auto-Refresh alle 5 Sekunden). Die
Aufgabenblatt-Skripte werden automatisch nach `~/rn-practice` kopiert
(`init-seed-labs`) — siehe [rn-practice Setup](rn-practice-setup.md) fuer
die Ordnerstruktur.

## 4. Fortschritt & Wiederherstellung

Identisch zu rn-praktikum: der Container ist ephemer und wird bei
Inaktivitaet automatisch entfernt und beim naechsten Login neu erzeugt; das
persistente Home-Verzeichnis (`~/rn-practice` inklusive eigener
Aenderungen) bleibt
davon unberuehrt und ist nach jedem erneuten Login unveraendert wieder da.

## 5. Orientierung im Desktop

Identisch zu rn-praktikum — dieselbe Desktop-Umgebung, dieselben
vorinstallierten Werkzeuge:

- **Terminal**: Taskleisten-/Menue-Icon startet `xfce4-terminal`, nicht
  `xterm` (siehe [Desktop-/Mininet-Umgebung](umgebung.md#terminal)).
- **Wireshark**: vorinstalliert, ueber Anwendungsmenue oder `wireshark` im
  Terminal.
- **Mininet-Topologien**: unter `~/rn-practice/<topoXX>/`, Start per
  `./start-topoXX.sh` ([rn-practice Setup](rn-practice-setup.md#start-eines-labs-kurzform)).

## 6. Richtig ausloggen

Identisch zu rn-praktikum: im Desktop ueber das Anwendungsmenue "Log Out"
waehlen, nicht nur den Browser-Tab schliessen — nur so wird auch die
SSO-Sitzung im Browser sauber beendet.
