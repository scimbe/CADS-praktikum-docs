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
  // Material <9.6: button.md-clipboard; ab 9.6: button.md-code__button[data-md-type=copy].
  var BUTTONS = "button.md-clipboard, button.md-code__button[data-md-type=\"copy\"]";
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
        ? ev.target.closest(BUTTONS)
        : null;
      if (!btn) return;

      var code = codeForButton(btn);
      if (!code) return; // nichts gefunden -> Material macht sein Ding
      var raw = code.textContent || ""; // textContent: unabhaengig vom Layout der Zeilenknoepfe
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
  // ---------------------------------------------------------------------------
  // Kopierknopf je Befehlszeile (CTO 2026-11-22): In Bloecken mit mehreren
  // Zeilen bekommt jede Zeile, die mit einem Prompt beginnt, am Ende einen
  // kleinen Knopf. Er kopiert nur diesen Befehl ohne Prompt; mit "\" umbrochene
  // Folgezeilen gehoeren dazu. Ausgabezeilen bekommen keinen Knopf.
  // Voraussetzung: pymdownx.highlight mit line_spans (je Zeile ein <span>).
  var LINE_BTN = "cads-line-copy";

  function addStyle() {
    if (document.getElementById("cads-line-copy-style")) return;
    var st = document.createElement("style");
    st.id = "cads-line-copy-style";
    st.textContent =
      "." + LINE_BTN + "{display:inline-block;vertical-align:middle;margin-left:.6em;" +
      "padding:0 .25em;border:0;background:none;cursor:pointer;opacity:.35;" +
      "color:var(--md-default-fg-color--light,#888);font:inherit;line-height:1}" +
      "." + LINE_BTN + ":hover,." + LINE_BTN + ":focus{opacity:1;color:var(--md-accent-fg-color,#536dfe)}" +
      "." + LINE_BTN + " svg{width:1em;height:1em;fill:currentColor;vertical-align:-.15em}" +
      "." + LINE_BTN + ".ok{opacity:1;color:#2e7d32}" +
      "@media print{." + LINE_BTN + "{display:none}}";
    document.head.appendChild(st);
  }

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"/></svg>';
  var ICON_OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 7 9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7Z"/></svg>';

  function lineText(span) {
    // textContent ohne unsere Knoepfe (die enthalten nur ein SVG, also keinen Text)
    return (span.textContent || "").replace(/\n$/, "");
  }

  function decorate() {
    addStyle();
    var codes = document.querySelectorAll("pre > code");
    for (var i = 0; i < codes.length; i++) {
      var code = codes[i];
      if (code.__cadsLines) continue;
      code.__cadsLines = true;
      var spans = code.querySelectorAll(':scope > span[id^="__span-"]');
      if (spans.length < 2) continue;
      for (var j = 0; j < spans.length; j++) {
        var t = lineText(spans[j]);
        if (!PROMPT.test(t)) continue;
        // Befehl samt "\"-Folgezeilen einsammeln
        var parts = [t.replace(PROMPT, "")];
        var k = j;
        while (/\\\s*$/.test(lineText(spans[k])) && k + 1 < spans.length) {
          k++;
          parts.push(lineText(spans[k]));
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = LINE_BTN;
        btn.title = "Nur diese Zeile kopieren";
        btn.setAttribute("aria-label", "Nur diese Zeile kopieren");
        btn.innerHTML = ICON;
        btn.__cadsText = parts.join("\n");
        // vor den Zeilenumbruch der letzten Zeile des Befehls setzen
        var host = spans[k];
        var last = host.lastChild;
        if (last && last.nodeType === 3 && /\n$/.test(last.nodeValue)) {
          last.nodeValue = last.nodeValue.replace(/\n$/, "");
          host.appendChild(btn);
          host.appendChild(document.createTextNode("\n"));
        } else {
          host.appendChild(btn);
        }
      }
    }
  }

  document.addEventListener(
    "click",
    function (ev) {
      var btn = ev.target && ev.target.closest ? ev.target.closest("." + LINE_BTN) : null;
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (!(navigator.clipboard && navigator.clipboard.writeText)) return;
      navigator.clipboard.writeText(btn.__cadsText).then(function () {
        btn.innerHTML = ICON_OK;
        btn.classList.add("ok");
        window.setTimeout(function () {
          btn.innerHTML = ICON;
          btn.classList.remove("ok");
        }, 1200);
      });
    },
    true
  );

  // Material laedt Seiten per Instant-Navigation nach; document$ feuert je Seite.
  if (window.document$ && window.document$.subscribe) {
    window.document$.subscribe(decorate);
  } else if (document.readyState !== "loading") {
    decorate();
  } else {
    document.addEventListener("DOMContentLoaded", decorate);
  }
})();
