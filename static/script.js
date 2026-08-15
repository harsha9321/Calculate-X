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

async function solve() {
  const equation = equationInput.value.trim();
  if (!equation) return;

  showResult("Calculating…", "");

  try {
    const response = await fetch("/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equation,
        variable: variableInput.value.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showResult(escapeHtml(data.error || "Something went wrong."), "err");
      return;
    }

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
  } catch (err) {
    showResult("Could not reach the server. Is it running?", "err");
  }
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
