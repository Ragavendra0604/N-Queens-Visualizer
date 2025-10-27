# N-Queens CSP Visualizer

This is a highly interactive, modern web application that solves and visualizes the N-Queens problem. It's built from the ground up using plain HTML, CSS, and JavaScript, demonstrating how to use a backtracking algorithm to solve a classic Constraint Satisfaction Problem (CSP).

The application is designed to be an educational tool, allowing you to watch the algorithm work in real-time, inspect its decisions, and understand the trade-offs between visualization and computational speed.

<img width="1846" height="1005" alt="image" src="https://github.com/user-attachments/assets/a91e035a-b239-4b98-9ae6-4b2ccbe43693" />


---

## 🚀 Key Features

* **Optimized O(1) Algorithm:** Uses a highly efficient backtracking algorithm with O(1) constraint checking (no more slow board iteration!).
* **Step-by-Step Visualization:** Watch the algorithm place queens, check for conflicts, and backtrack in real-time.
* **Dual "Solve" Modes:**
    * **Find One:** Animates the search for the first possible solution.
    * **Find All:** Animates the search for all possible solutions.
* **Intelligent Animation 🧠:** For large boards (N >= 8), it **animates the first solution** and then **automatically skips animation** to find the rest, preventing the UI from freezing.
* **Full Animation Control:**
    * **Speed Slider:** Control the animation speed from slow and methodical to lightning fast.
    * **Skip Button:** Instantly fast-forward the current animated search.
    * **Stop Button:** Halt the algorithm at any time.
* **Modern 3-Column UI:** A beautiful, responsive, dark-mode "glassmorphism" interface.
    * **Left Panel:** All user controls (N-Size, Speed, Buttons).
    * **Center Panel:** The main chessboard visualizer.
    * **Right Panel:** Contains two separate log boxes:
        * **Algorithm Steps:** A color-coded, live-scrolling log of every decision the algorithm makes (e.g., `Trying`, `Placing`, `Conflict`, `Backtracking`).
        * **Found Solutions:** A clean, persistent list that saves each unique solution as it's found.
* **Smart Warnings:** Automatically warns you if you try to find all solutions for a large `N`, explaining the exponential time complexity.

---

## 🛠️ Tech Stack

* **HTML5:** Semantic structure for the layout.
* **CSS3:** Modern styling, including CSS Grid, Flexbox, custom properties, and a "glassmorphism" dark theme.
* **JavaScript (ES6+):**
    * All the core CSP and backtracking logic.
    * `async/await` and `Promise` to manage the animation loop.
    * DOM manipulation for all interactivity.

---

## 🏃 How to Run

This project is fully self-contained. No frameworks, no build steps, no dependencies.

1.  **Download the Files:** Make sure you have the three files in the same folder:
    * `index.html`
    * `style.css`
    * `script.js`
2.  **Open in Browser:** Simply open the `index.html` file in any modern web browser (like Chrome, Firefox, or Edge).

That's it!

---

## 🧠 The Algorithm: Optimized Backtracking

This project solves the N-Queens problem as a Constraint Satisfaction Problem. The goal is to place $N$ queens on an $N \times N$ chessboard so that no two queens threaten each other.

### The Slow Way (O(N) Check)

A naive backtracking approach would, for every new square, iterate through the entire board ($O(N)$ or $O(N^2)$) to check for conflicts in the same column or on the diagonals. This is visually clear but computationally very slow.

### The Fast Way (O(1) Check)

This application implements a far superior method. Instead of looping, we use **lookup arrays (hash sets)** to store the constraints. This allows us to check if a square is "safe" in constant $O(1)$ time.

* `cols[n]`: A boolean array. `cols[c]` is `true` if column `c` is occupied.
* `diag1[2n-1]`: A boolean array. `diag1[row + col]` is `true` if the main diagonal is occupied.
* `diag2[2n-1]`: A boolean array. `diag2[row - col + (n-1)]` is `true` if the anti-diagonal is occupied.

When the algorithm tries to place a queen at `(row, col)`, it *instantly* checks these three arrays. If all are `false`, the spot is safe.

**Placing a Queen:**
```javascript
// O(1) check
if (!cols[col] && !diag1[row + col] && !diag2[row - col + n - 1]) {
    // Set constraints in O(1)
    cols[col] = true;
    diag1[row + col] = true;
    diag2[row - col + n - 1] = true;
    
    // Recurse...
}
