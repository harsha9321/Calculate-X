/* In-memory history of the formulas the user has solved this session.
 *
 * By design this keeps NOTHING on disk and talks to NO backend: entries live
 * only in the `entries` array below, so a page refresh (which reloads this
 * script and resets the array) wipes the history — exactly the requested
 * behaviour. localStorage/sessionStorage are deliberately not used because
 * both survive a refresh.
 *
 * Public API (attached as `window.FormulaHistory`):
 *   init({ onRecall })  wire up the DOM and optional recall callback
 *   record(entry)       add one solve result to the history
 *   clear()             empty the history
 */
(function (global) {
  "use strict";

  var entries = []; // session-only; intentionally not persisted anywhere.
  var listEl = null;
  var emptyEl = null;
  var clearBtn = null;
  var onRecall = null;

  // Reduce a recorded entry to a single display string + status kind.
  function summarize(entry) {
    if (entry.error) return { text: entry.error, kind: "err" };
    if (entry.solutions && entry.solutions.length) {
      return { text: entry.solutions.join(",  "), kind: "ok" };
    }
    if (entry.message) return { text: entry.message, kind: "ok" };
    return { text: "No result.", kind: "err" };
  }

  function timeLabel(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = "";

    var has = entries.length > 0;
    if (emptyEl) emptyEl.classList.toggle("hidden", has);
    if (clearBtn) clearBtn.disabled = !has;

    // Newest first.
    for (var i = entries.length - 1; i >= 0; i--) {
      var entry = entries[i];
      var res = summarize(entry);

      var li = document.createElement("li");
      li.className = "history-item " + res.kind;

      // The whole row is a button so it can be clicked to reload the equation.
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-recall";
      btn.title = "Load this equation";

      var eq = document.createElement("span");
      eq.className = "history-eq";
      eq.textContent = entry.equation; // textContent => user input can't inject HTML.

      var out = document.createElement("span");
      out.className = "history-res";
      out.textContent = res.text;

      btn.appendChild(eq);
      btn.appendChild(out);

      var when = document.createElement("span");
      when.className = "history-time";
      when.textContent = timeLabel(entry.at);

      li.appendChild(btn);
      li.appendChild(when);

      (function (captured) {
        btn.addEventListener("click", function () {
          if (typeof onRecall === "function") onRecall(captured);
        });
      })(entry);

      listEl.appendChild(li);
    }
  }

  function record(entry) {
    if (!entry || !entry.equation) return;
    entries.push({
      equation: entry.equation, // display string (may combine two equations)
      eq1: entry.eq1 || entry.equation, // for recall
      eq2: entry.eq2 || "",
      variable: entry.variable || "",
      solutions: entry.solutions || [],
      message: entry.message || null,
      error: entry.error || null,
      at: Date.now(),
    });
    render();
  }

  function clear() {
    entries.length = 0;
    render();
  }

  function init(opts) {
    opts = opts || {};
    onRecall = opts.onRecall || null;
    listEl = document.getElementById("history-list");
    emptyEl = document.getElementById("history-empty");
    clearBtn = document.getElementById("history-clear");
    if (clearBtn) clearBtn.addEventListener("click", clear);
    render();
  }

  global.FormulaHistory = { init: init, record: record, clear: clear };
})(typeof window !== "undefined" ? window : this);
