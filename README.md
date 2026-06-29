# Calculate-X

A tiny web app that takes an equation with one unknown and solves for the
missing variable.

```
10 + x = 15   →   x = 5
```

It's powered by [SymPy](https://www.sympy.org/), so it handles far more than
simple addition:

| You type            | You get            |
| ------------------- | ------------------ |
| `10 + x = 15`       | `x = 5`            |
| `2x + 3 = 11`       | `x = 4`            |
| `x^2 = 16`          | `x = -4`, `x = 4`  |
| `(y - 4) / 2 = 5`   | `y = 14`           |
| `3x = 10`           | `x = 10/3 ≈ 3.33`  |

Niceties:

- **Implicit multiplication** — `2x` means `2*x`.
- **Powers with `^`** — `x^2` means `x**2`.
- **Auto-detects the variable** when there's exactly one; otherwise you can name
  the one to solve for.

## Running it

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then open <http://localhost:5000>.

## Project layout

| File                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `app.py`               | Flask app and HTTP routes                        |
| `solver.py`            | Equation parsing/solving (no web dependencies)   |
| `templates/index.html` | The single page                                  |
| `static/style.css`     | Styling                                          |
| `static/script.js`     | Talks to the `/solve` endpoint                   |

## How it works

The browser POSTs `{"equation": "...", "variable": "..."}` to `/solve`. The
server splits on `=`, parses each side with SymPy (allowing `2x` and `x^2`
shorthand), then calls `solveset` for the unknown and returns the solution(s)
as JSON. `solver.py` has no Flask imports, so the solving logic can be reused or
tested on its own.
