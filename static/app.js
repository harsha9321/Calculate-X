const form = document.getElementById("solver-form");
const equationInput = document.getElementById("equation");
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
  const equation = equationInput.value.trim();
  if (!equation) return;

  const variable = variableInput.value.trim();

  try {
    const data = solveEquation(equation, variable);

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
      equation,
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
    FormulaHistory.record({ equation, variable, error: message });
  }
}

// Clicking a past entry reloads it into the form and re-solves it.
function recall(entry) {
  equationInput.value = entry.equation;
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
    equationInput.value = chip.textContent;
    variableInput.value = "";
    solve();
  });
});

FormulaHistory.init({ onRecall: recall });
