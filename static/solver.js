/* Equation-solving logic that runs entirely in the browser.
 *
 * This is the client-side port of the old Python `solver.py`. It leans on
 * nerdamer (loaded globally before this file) for the symbolic heavy lifting:
 * parsing, implicit multiplication (`2x`, `2(x+1)`), `^` powers, and solving.
 *
 * Public entry point: `solveEquation(equation, variable)`.
 * On bad input it throws a `SolveError` whose message is safe to show a user.
 */
(function (global) {
  "use strict";

  function SolveError(message) {
    this.name = "SolveError";
    this.message = message;
  }
  SolveError.prototype = Object.create(Error.prototype);
  SolveError.prototype.constructor = SolveError;

  // List the distinct variable names in an expression, sorted for stable output.
  function variablesOf(expr) {
    try {
      return nerdamer(expr).variables().slice().sort();
    } catch (e) {
      throw new SolveError("Could not understand the equation: '" + expr + "'.");
    }
  }

  // Render one solution: exact form, plus a rounded decimal when it isn't an
  // integer (so `10/3` shows as `10/3 ≈ 3.33333`, but `5` just shows `5`).
  function formatSolution(raw) {
    var exact;
    try {
      exact = nerdamer(raw).toString();
    } catch (e) {
      exact = String(raw);
    }

    var looksInexact = /[\/]|sqrt|\^|\*\*|root/i.test(exact);
    if (!looksInexact) return exact;

    var decimalText;
    try {
      decimalText = nerdamer(raw).evaluate().text("decimals");
    } catch (e) {
      return exact;
    }

    var num = Number(decimalText);
    if (!isFinite(num)) return exact; // complex/symbolic — leave exact as-is.

    // ~6 significant digits, trailing zeros trimmed, matching the old %g output.
    var rounded = Number(num.toPrecision(6));
    if (String(rounded) === exact) return exact;
    return exact + " ≈ " + rounded;
  }

  // Split nerdamer's "[a,b,...]" result into individual solution strings,
  // respecting any parentheses so commas inside an expression don't split it.
  function splitSolutions(solveResult) {
    if (solveResult && solveResult.symbol && solveResult.symbol.elements) {
      return solveResult.symbol.elements.map(function (e) {
        return e.toString();
      });
    }
    var text = solveResult.toString().trim().replace(/^\[/, "").replace(/\]$/, "");
    if (text === "") return [];
    var parts = [];
    var depth = 0;
    var current = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (ch === "," && depth === 0) {
        parts.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current !== "") parts.push(current);
    return parts;
  }

  /**
   * Solve `equation` (a string containing `=`) for its unknown.
   *
   * @param {string} equation  e.g. "10 + x = 15"
   * @param {string} [variable] optional variable to solve for; auto-detected
   *                            when there's exactly one.
   * @returns {{equation:string, variable:?string, solutions:string[], message:?string}}
   */
  function solveEquation(equation, variable) {
    equation = (equation || "").trim();
    variable = (variable || "").trim();

    if (equation.indexOf("=") === -1) {
      throw new SolveError("Equation must contain an '=' sign, e.g. 10 + x = 15.");
    }
    if ((equation.match(/=/g) || []).length > 1) {
      throw new SolveError("Equation should contain exactly one '=' sign.");
    }

    var sides = equation.split("=");
    var left = sides[0].trim();
    var right = sides[1].trim();
    if (left === "" || right === "") {
      throw new SolveError("Both sides of the '=' need an expression.");
    }

    var diff = "(" + left + ")-(" + right + ")";
    var symbols = variablesOf(diff);

    var target;
    if (variable) {
      if (symbols.indexOf(variable) === -1) {
        throw new SolveError(
          "The variable '" + variable + "' does not appear in the equation."
        );
      }
      target = variable;
    } else if (symbols.length === 0) {
      // No unknown: it's just a truth check, e.g. "2 + 2 = 4".
      var holds;
      try {
        holds = nerdamer(diff).evaluate().toString() === "0";
      } catch (e) {
        throw new SolveError("Could not evaluate the equation.");
      }
      return {
        equation: equation,
        variable: null,
        solutions: [],
        message:
          "There is no variable to solve for. The statement is " +
          (holds ? "true" : "false") +
          ".",
      };
    } else if (symbols.length === 1) {
      target = symbols[0];
    } else {
      throw new SolveError(
        "Found multiple variables (" +
          symbols.join(", ") +
          "). Tell me which one to solve for."
      );
    }

    var result;
    try {
      result = nerdamer.solve(equation, target);
    } catch (e) {
      throw new SolveError("I couldn't solve that equation for " + target + ".");
    }

    var rawSolutions = splitSolutions(result);
    if (rawSolutions.length === 0) {
      return {
        equation: equation,
        variable: target,
        solutions: [],
        message: "No solution exists for " + target + ".",
      };
    }

    var solutions = rawSolutions.map(function (s) {
      return target + " = " + formatSolution(s);
    });

    return {
      equation: equation,
      variable: target,
      solutions: solutions,
      message: null,
    };
  }

  global.SolveError = SolveError;
  global.solveEquation = solveEquation;
})(typeof window !== "undefined" ? window : this);
