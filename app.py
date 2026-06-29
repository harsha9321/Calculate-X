"""Calculate-X: a tiny web app that solves an equation for its missing variable.

Give it something like ``10 + x = 15`` and it returns ``x = 5``. It understands
ordinary arithmetic, powers (``x^2 = 16``), implicit multiplication (``2x + 3 =
11``) and most single-variable algebraic equations, courtesy of SymPy.
"""

from flask import Flask, jsonify, render_template, request

from solver import SolveError, solve_equation

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/solve", methods=["POST"])
def solve():
    data = request.get_json(silent=True) or {}
    equation = (data.get("equation") or "").strip()
    variable = (data.get("variable") or "").strip() or None

    if not equation:
        return jsonify({"error": "Please enter an equation."}), 400

    try:
        result = solve_equation(equation, variable)
    except SolveError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
