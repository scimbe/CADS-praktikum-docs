# Remote-Desktop nutzen: rn-praktikum.bunsenbrenner.org

Schritt-fuer-Schritt-Anleitung fuer den Weg von "Browser oeffnen" bis
"im eigenen Praktikums-Desktop arbeiten" unter
`rn-praktikum.bunsenbrenner.org`. Fuer die technischen Details der
Desktop-Umgebung selbst (vorinstallierte Werkzeuge, Terminal-Hinweis) siehe
[Desktop-/Mininet-Umgebung](umgebung.md). Fuer riisc gilt derselbe Ablauf
mit anderem Login-Anbieter und Branding — siehe
[Remote-Desktop: riisc.bunsenbrenner.org](remote-desktop-riisc.md).

## 1. Login

1. `https://rn-praktikum.bunsenbrenner.org/` im Browser oeffnen.
2. Auf **„Anmelden mit HAW GitLab“** klicken. Der Login ist auf diesem Host
   fest auf den HAW-GitLab-Account verdrahtet (kein Auswahlbildschirm mit
   anderen Anbietern).
3. Nach erfolgreichem SSO-Login geht es automatisch weiter zu `/start`.

## 2. Erstes Mal: auf Freigabe warten

Bevor ein Desktop startet, muss ein Admin die eigene Identitaet einmalig
freischalten. Beim allerersten Login erscheint dafuer eine Wartesseite
statt des Desktops:

- Text sinngemaess: "Warte auf Freigabe durch den Administrator" — die
  Seite aktualisiert sich automatisch alle 30 Sekunden, ein manuelles
  Neuladen ist nicht noetig.
- Das kann **bis zu 24 Stunden** dauern. Der Admin wird bei jeder neuen
  Anfrage automatisch per E-Mail benachrichtigt.
- Ist die Freigabe einmal erteilt, bleibt sie bestehen — ein erneutes
  Warten ist erst wieder noetig, wenn der Admin sie manuell entzieht oder
  sie nach 6 Monaten automatisch abgelaufen ist.

Nach der Freigabe fuehrt derselbe Login-Vorgang direkt zum Desktop, ohne
erneute Wartesseite.

!!! tip "Wenn nach 24 Stunden nichts passiert"
    Kurz beim Admin nachfragen (z. B. per E-Mail) — die Freigabe ist ein
    manueller Schritt, keine automatische Zusage.

## 3. Erster Start des Desktops

Nach der Freigabe braucht der Container beim (jeweils ersten) Start rund
30–45 Sekunden, bis er tatsaechlich einsatzbereit ist (vollstaendige
s6-Init-Kette samt Desktop-Streaming). In dieser Zeit zeigt der Browser eine
"Desktop wird gestartet"-Seite, die sich automatisch alle 5 Sekunden
aktualisiert; ein manuelles Neuladen fuehrt zum selben Ergebnis, ist aber
nicht noetig.

Direkt beim allerersten Start eines Containers werden die Aufgabenblatt-Skripte
automatisch nach `~/rn-practice` kopiert (Mechanismus `init-seed-labs`) —
der Ordner ist danach sofort vorhanden, ein manuelles Auschecken oder
Kopieren ist nicht noetig.
Die Unterordner (`topo01`, `topo02`, `topo03`, `topo-base`, `topoP02`–`topoP04`,
`setup`) entsprechen der Tabelle in
[rn-practice Setup](rn-practice-setup.md).

## 4. Fortschritt & Wiederherstellung

Der Container selbst ist **ephemer**: bei laengerer Inaktivitaet wird er
automatisch gestoppt und beim naechsten Login neu aus dem aktuellen Image
erzeugt (Pruefungshygiene). Das eigene Home-Verzeichnis (`~`, inklusive
`~/rn-practice` und aller eigenen Aenderungen daran) liegt dagegen in einem
separaten, persistenten Volume und uebersteht das Entfernen des Containers
unveraendert. Nach einem erneuten Login ist der eigene Stand — inklusive
selbst bearbeiteter Skripte — wieder da, ohne dass dafuer etwas Besonderes
zu tun ist.

## 5. Orientierung im Desktop

- **Terminal**: Icon in der Taskleiste bzw. Anwendungsmenue startet
  `xfce4-terminal` — **nicht** `xterm` verwenden/erwarten (Hintergrund dazu
  in [Desktop-/Mininet-Umgebung](umgebung.md#terminal)).
- **Wireshark**: ueber das Anwendungsmenue oder per `wireshark` im Terminal
  startbar; ist vorinstalliert, keine separate Installation noetig.
- **Mininet-Topologien**: liegen unter `~/rn-practice/<topoXX>/`, Start je
  per `./start-topoXX.sh` — Details in
  [rn-practice Setup](rn-practice-setup.md#start-eines-labs-kurzform).

## 6. Richtig ausloggen

Am Ende einer Sitzung **im Desktop selbst ueber das Anwendungsmenue
"Log Out" waehlen** — nicht einfach den Browser-Tab schliessen. Nur der
In-Desktop-Logout beendet zuverlaessig auch die SSO-Sitzung im Browser; ein
blosses Schliessen des Tabs laesst die SSO-Sitzung aktiv, sodass ein
erneuter Aufruf der Seite ohne neuen Login direkt wieder in den (ggf. neu
erzeugten) Desktop fuehrt.

!!! warning "Geteilte Geraete"
    Auf einem gemeinsam genutzten Rechner unbedingt ueber "Log Out"
    ausloggen, sonst bleibt die Sitzung fuer die naechste Person am Geraet
    angemeldet.
