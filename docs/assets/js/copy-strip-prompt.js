/*
 * Kopieren ohne Terminal-Prompt.
 *
 * Problem (gemeldet 2026-11-22): Der Kopieren-Knopf an den Codebloecken (Material
 * "content.code.copy") kopiert den ganzen Blocktext - also auch den vorangestellten
 * Prompt wie "h2$ ", "h1$ ", "mininet> " oder "$ ". Beim Einfuegen ins Terminal muss
 * man den Prompt erst von Hand loeschen, sonst scheitert der Befehl.
 *
 * Loesung: Ein einziger Klick-Listener am document in der CAPTURE-Phase. Trifft der
 * Klick einen Material-Kopierknopf (.md-clipboard), lesen wir den Code selbst aus,
 * entfernen je Zeile nur den FUEHRENDEN Prompt und schreiben das Ergebnis in die
 * Zwischenablage; Material's eigener Handler wird per stopImmediatePropagation
 * uebersprungen. Delegation am document (statt pro Knopf) ist robust, weil Material
 * die Knoepfe erst zur Laufzeit in die Codebloecke einfuegt.
 *
 * Die sichtbaren "h2$"-Markierungen im Blatt bleiben erhalten (sie sagen, in welches
 * Fenster getippt wird) - nur die Kopie ist sauber. Nur fuehrende Prompts werden
 * entfernt; Ausgabe-Zeilen beginnen praktisch nie mit einem dieser Tokens.
 */
(function () {
  "use strict";

  // Fuehrender Prompt am Zeilenanfang: Knotennamen (h0..h9, r1/r2), ein
  // Desktop-Prompt (cads@host:/pfad$), die Mininet-Konsole (mininet>) oder ein
  // nacktes "$ ". Jeweils gefolgt von genau einem Leerzeichen.
  var PROMPT = /^(?:h[0-9]+\$|r[0-9]+\$|cads@[^\s]+|mininet>|\$) /;

  function stripPrompts(text) {
    return text
      .split("\n")
      .map(function (line) {
        return line.replace(PROMPT, "");
      })
      .join("\n");
  }

  // Den zum Knopf gehoerenden Codeblock finden: Material setzt
  // data-clipboard-target auf einen CSS-Selektor (meist "#__code_N > code").
  function codeForButton(btn) {
    var sel = btn.getAttribute("data-clipboard-target");
    if (sel) {
      try {
        var el = document.querySelector(sel);
        if (el) return el;
      } catch (e) {
        /* ungueltiger Selektor - unten weiter versuchen */
      }
    }
    var pre = btn.closest(".highlight, pre");
    return pre ? pre.querySelector("code") || pre : null;
  }

  document.addEventListener(
    "click",
    function (ev) {
      var btn = ev.target && ev.target.closest
        ? ev.target.closest("button.md-clipboard")
        : null;
      if (!btn) return;

      var code = codeForButton(btn);
      if (!code) return; // nichts gefunden -> Material macht sein Ding
      var raw = code.innerText || code.textContent || "";
      var cleaned = stripPrompts(raw);
      if (cleaned === raw) return; // kein Prompt -> Material unveraendert lassen
      if (!(navigator.clipboard && navigator.clipboard.writeText)) return;

      // Material's Klick-Handler NICHT laufen lassen, sonst ueberschreibt er uns.
      ev.stopImmediatePropagation();
      ev.preventDefault();

      navigator.clipboard.writeText(cleaned).then(
        function () {
          // Material zeigt den "kopiert"-Haken ueber eine CSS-Klasse am <pre>.
          var pre = btn.closest(".highlight, pre");
          if (pre) {
            pre.classList.add("md-clipboard--active");
            window.setTimeout(function () {
              pre.classList.remove("md-clipboard--active");
            }, 1500);
          }
        },
        function () {
          /* Schreiben fehlgeschlagen - Prompt bleibt halt drin, kein Abbruch */
        }
      );
    },
    true // Capture-Phase: vor Material's Handler, der am/unter dem Knopf haengt.
  );
})();
