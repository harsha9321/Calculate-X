"""Equation solving logic, kept separate from the web layer so it's testable.

The public entry point is :func:`solve_equation`. Everything else is helpers.
"""

from sympy import Eq, Symbol, solveset
from sympy.core.sympify import SympifyError
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)
from sympy.sets.sets import EmptySet

# Allow "2x" -> "2*x" and "x^2" -> "x**2" so input feels natural.
_TRANSFORMS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)


class SolveError(Exception):
    """Raised when an equation can't be parsed or solved sensibly."""


def _parse_side(text, side):
    try:
        return parse_expr(text, transformations=_TRANSFORMS, evaluate=True)
    except (SympifyError, SyntaxError, TypeError, ValueError):
        raise SolveError(f"Could not understand the {side} of the equation: '{text}'")


def _format_solution(value):
    """Render a SymPy value as a clean string, preferring exact then decimal."""
    exact = str(value)
    try:
        numeric = complex(value.evalf())
    except (TypeError, ValueError):
        return exact

    # Real result: also offer a rounded decimal if it differs from the exact form.
    if abs(numeric.imag) < 1e-12:
        real = numeric.real
        rounded = round(real, 6)
        decimal = ("%g" % rounded)
        if decimal != exact:
            return f"{exact} ≈ {decimal}" if "/" in exact or "sqrt" in exact or "**" in exact else exact
        return exact
    return exact


def solve_equation(equation, variable=None):
    """Solve ``equation`` (a string containing ``=``) for its unknown.

    Parameters
    ----------
    equation:
        Something like ``"10 + x = 15"``.
    variable:
        Optional name of the variable to solve for. If omitted, it is
        auto-detected (the equation must then have exactly one variable).

    Returns a dict with the variable name, the input echoed back, and a list
    of solution strings.
    """
    if "=" not in equation:
        raise SolveError("Equation must contain an '=' sign, e.g. 10 + x = 15.")
    if equation.count("=") > 1:
        raise SolveError("Equation should contain exactly one '=' sign.")

    left_text, right_text = equation.split("=")
    left = _parse_side(left_text.strip(), "left side")
    right = _parse_side(right_text.strip(), "right side")

    symbols = sorted((left - right).free_symbols, key=str)

    if variable:
        target = Symbol(variable)
        if target not in symbols:
            raise SolveError(
                f"The variable '{variable}' does not appear in the equation."
            )
    elif len(symbols) == 0:
        # No unknown: it's just a truth check, e.g. "2 + 2 = 4".
        holds = bool(Eq(left, right))
        verdict = "true" if holds else "false"
        return {
            "equation": equation,
            "variable": None,
            "solutions": [],
            "message": f"There is no variable to solve for. The statement is {verdict}.",
        }
    elif len(symbols) == 1:
        target = symbols[0]
    else:
        names = ", ".join(str(s) for s in symbols)
        raise SolveError(
            f"Found multiple variables ({names}). Tell me which one to solve for."
        )

    solution_set = solveset(Eq(left, right), target)

    if solution_set is EmptySet or solution_set == EmptySet:
        return {
            "equation": equation,
            "variable": str(target),
            "solutions": [],
            "message": f"No solution exists for {target}.",
        }

    try:
        values = list(solution_set)
    except TypeError:
        # Infinite / non-iterable solution set (e.g. identities like x = x).
        return {
            "equation": equation,
            "variable": str(target),
            "solutions": [],
            "message": f"{target} has infinitely many solutions: {solution_set}.",
        }

    solutions = [f"{target} = {_format_solution(v)}" for v in values]
    return {
        "equation": equation,
        "variable": str(target),
        "solutions": solutions,
        "message": None,
    }
