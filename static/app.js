const form = document.getElementById("solver-form");
const equationInput = document.getElementById("equation");
const equation2Input = document.getElementById("equation2");
const variableInput = document.getElementById("variable");
const resultBox = document.getElementById("result");

function showResult(html, kind) {
  resultBox.className = `result ${kind}`;
  resultBox.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function solve() {
  const eq1 = equationInput.value.trim();
  if (!eq1) return;

  const eq2 = equation2Input.value.trim();
  const variable = variableInput.value.trim();

  // A second equation means "solve the system"; the "solve for" field only
  // applies to a single equation (picking which variable to isolate).
  const displayEquation = eq2 ? `${eq1};  ${eq2}` : eq1;

  try {
    const data = eq2
      ? solveSystem([eq1, eq2])
      : solveEquation(eq1, variable);

    if (data.solutions && data.solutions.length) {
      const answers = data.solutions
        .map((s) => `<div class="answer">${escapeHtml(s)}</div>`)
        .join("");
      showResult(answers, "ok");
    } else if (data.message) {
      showResult(escapeHtml(data.message), "ok");
    } else {
      showResult("No result.", "err");
    }

    FormulaHistory.record({
      equation: displayEquation,
      eq1,
      eq2,
      variable,
      solutions: data.solutions,
      message: data.message,
    });
  } catch (err) {
    const message =
      err && err.name === "SolveError"
        ? err.message
        : "Something went wrong solving that equation.";
    showResult(escapeHtml(message), "err");
    FormulaHistory.record({ equation: displayEquation, eq1, eq2, variable, error: message });
  }
}

// Clicking a past entry reloads it (both equations) into the form and re-solves.
function recall(entry) {
  equationInput.value = entry.eq1 || entry.equation || "";
  equation2Input.value = entry.eq2 || "";
  variableInput.value = entry.variable || "";
  solve();
  equationInput.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  solve();
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    // System chips carry both equations in data attributes; plain chips use
    // their text as the single equation.
    equationInput.value = chip.dataset.eq1 || chip.textContent.trim();
    equation2Input.value = chip.dataset.eq2 || "";
    variableInput.value = "";
    solve();
  });
});

FormulaHistory.init({ onRecall: recall });
