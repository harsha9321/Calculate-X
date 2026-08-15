# Calculate-X

A tiny web app that takes an equation with one unknown and solves for the
missing variable — **entirely in your browser**. No backend, no install, no
build step.

```
10 + x = 15   →   x = 5
```

It's powered by [nerdamer](https://github.com/jiggzson/nerdamer), a symbolic
math library, so it handles far more than simple addition:

| You type            | You get            |
| ------------------- | ------------------ |
| `10 + x = 15`       | `x = 5`            |
| `2x + 3 = 11`       | `x = 4`            |
| `x^2 = 16`          | `x = 4`, `x = -4`  |
| `(y - 4) / 2 = 5`   | `y = 14`           |
| `2(x + 1) = 10`     | `x = 4`            |
| `3x = 10`           | `x = 10/3 ≈ 3.33`  |

Niceties:

- **Implicit multiplication** — `2x` and `2(x+1)` work without typing `*`.
- **Parentheses & nesting** — fully supported, including factored forms.
- **Powers with `^`** — `x^2` means `x` squared.
- **Auto-detects the variable** when there's exactly one; otherwise you name
  the one to solve for.

## Running it

There's nothing to run — just open `index.html` in any browser
(double-click it, or `file://` it). Everything executes locally.

If you'd rather serve it over HTTP (e.g. to share on a LAN):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

| File                                | Purpose                                       |
| ----------------------------------- | --------------------------------------------- |
| `index.html`                        | The single page                               |
| `static/solver.js`                  | Equation parsing/solving (UI-free, testable)  |
| `static/app.js`                     | Wires the form to the solver                  |
| `static/style.css`                  | Styling                                       |
| `static/vendor/nerdamer.all.min.js` | Vendored symbolic-math engine (MIT)           |

## How it works

When you submit, `app.js` calls `solveEquation()` in `static/solver.js`. That
splits the input on `=`, parses each side with nerdamer (which understands
`2x`, `x^2`, and parentheses natively), auto-detects the unknown, then solves
and formats the result — adding a rounded decimal alongside exact fractions
like `10/3`. It also handles the edge cases gracefully: no-variable statements
(`2 + 2 = 4` → "true"), multiple variables (asks which to solve for), and
unsolvable input.

The whole thing is static files, so it works offline and can be hosted anywhere
that serves HTML — GitHub Pages, an S3 bucket, or just your filesystem.
