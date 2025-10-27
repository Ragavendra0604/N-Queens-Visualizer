document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const nInput = document.getElementById('n-input');
    const speedSlider = document.getElementById('speed-slider');
    const solveOneBtn = document.getElementById('solve-one-btn');
    const solveAllBtn = document.getElementById('solve-all-btn');
    const skipBtn = document.getElementById('skip-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    const boardContainer = document.getElementById('board-container');
    const statusMsg = document.getElementById('status-message');
    const solutionCountDisplay = document.getElementById('solution-count');
    const logList = document.getElementById('log-list');
    const logContainer = document.getElementById('log-container');
    const solutionsList = document.getElementById('solutions-list');
    const solutionsContainer = document.getElementById('solutions-container');


    // --- State Variables ---
    let n = 8;
    let board = [];
    let isSolving = false;
    let stopSolving = false;
    let skipAnimation = false;
    let solutionCount = 0;

    // --- OPTIMIZATION: Constraint Arrays ---
    // These arrays will store our constraints for O(1) lookups
    let cols;    // Tracks occupied columns
    let diag1;   // Tracks occupied main diagonals (row + col)
    let diag2;   // Tracks occupied anti-diagonals (row - col)


    // --- Helper Functions ---
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const getDelay = () => 500 - speedSlider.value;
    const getCell = (row, col) => 
        document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

    async function animatedSleep() {
        if (skipAnimation) return;
        await sleep(getDelay());
    }

    function addLog(message, type = 'info') {
        const li = document.createElement('li');
        li.textContent = message;
        li.classList.add(`log-${type}`);
        logList.appendChild(li);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function saveSolution(board) {
        const solution = [];
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (board[r][c] === 1) {
                    solution.push(c); // Save the column index for row r
                    break;
                }
            }
        }

        const li = document.createElement('li');
        li.classList.add('solution-entry');
        li.innerHTML = `<strong>Solution ${solutionCount}:</strong> [${solution.join(', ')}]`;
        solutionsList.appendChild(li);
        solutionsContainer.scrollTop = solutionsContainer.scrollHeight;
    }


    // --- Control Functions (Updated) ---
    
    function startSolving() {
        isSolving = true;
        stopSolving = false;
        skipAnimation = false;
        solutionCount = 0;
        solutionCountDisplay.textContent = '0';
        logList.innerHTML = '';
        solutionsList.innerHTML = '';
        addLog('Search started.', 'info');
        
        [solveOneBtn, solveAllBtn, resetBtn, nInput].forEach(el => el.disabled = true);
        [stopBtn, skipBtn].forEach(el => el.disabled = false);
    }

    function stopSolvingProcess() {
        if (isSolving) {
            addLog('Search stopped by user.', 'info');
        }
        isSolving = false;
        stopSolving = true;
        [solveOneBtn, solveAllBtn, resetBtn, nInput].forEach(el => el.disabled = false);
        [stopBtn, skipBtn].forEach(el => el.disabled = true);
    }

    function reset() {
        stopSolvingProcess();
        n = parseInt(nInput.value, 10);
        createBoard(n);
        statusMsg.textContent = 'Idle';
        solutionCount = 0;
        solutionCountDisplay.textContent = '0';
        logList.innerHTML = '';
        solutionsList.innerHTML = '';

        // --- OPTIMIZATION: Initialize constraint arrays ---
        // We need 2*n-1 because that's the number of unique diagonals
        cols = new Array(n).fill(false);
        diag1 = new Array(2 * n - 1).fill(false);
        diag2 = new Array(2 * n - 1).fill(false);
    }

    // --- Board Creation and Drawing ---

    function createBoard(size) {
        n = size;
        board = Array(n).fill(0).map(() => Array(n).fill(0));
        boardContainer.innerHTML = '';
        boardContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

        const boardSize = Math.min(
            boardContainer.clientWidth, 
            boardContainer.clientHeight, 
            window.innerHeight * 0.8
        );
        const cellSize = Math.max(Math.floor(boardSize / n) - 2, 20);
        boardContainer.style.setProperty('--cell-size', `${cellSize}px`);

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', (i + j) % 2 === 0 ? 'light' : 'dark');
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardContainer.appendChild(cell);
            }
        }
    }

    function drawQueen(row, col, place) {
        const cell = getCell(row, col);
        if (cell) {
            cell.textContent = place ? '♕' : '';
            cell.classList.toggle('queen', place);
        }
    }

    async function toggleCellState(row, col, className, add) {
        const cell = getCell(row, col);
        if (cell) {
            cell.classList.toggle(className, add);
            if (add && !skipAnimation) await animatedSleep();
            if (!add) cell.classList.remove(className);
        }
    }

    // --- N-Queens CSP Logic (OPTIMIZED) ---
    // The slow O(N) isSafe() function is GONE!

    /**
     * The main async recursive backtracking function (Optimized)
     * @param {number} row - The current row to solve
     * @param {boolean} findAll - True to find all solutions
     * @returns {boolean} - True if a solution is found (and !findAll)
     */
    async function solveNQueens(row, findAll) {
        if (stopSolving) return false;

        // Base case: All queens are placed
        if (row === n) {
            solutionCount++;
            solutionCountDisplay.textContent = solutionCount;
            addLog(`🎉 Solution ${solutionCount} Found!`, 'solution');
            statusMsg.textContent = `Solution ${solutionCount} found!`;
            
            saveSolution(board); // Save to the list

            if (findAll) {
                if (!skipAnimation) await sleep(1000); // Pause to show solution
                return false; // Force backtrack to find next solution
            }
            return true; // Found one solution, stop
        }
        
        addLog(`Searching in Row ${row}...`, 'info');

        // Try placing a queen in each column of the current row
        for (let col = 0; col < n; col++) {
            if (stopSolving) return false;

            statusMsg.textContent = `Trying [${row}, ${col}]...`;
            addLog(`Trying Queen at (${row}, ${col})`, 'info');
            await toggleCellState(row, col, 'trying', true);

            // --- OPTIMIZED O(1) SAFETY CHECK ---
            const d1 = row + col;
            const d2 = row - col + (n - 1); // Offset to avoid negative indices

            let conflictReason = null;
            if (cols[col]) {
                conflictReason = `column ${col} is occupied.`;
            } else if (diag1[d1]) {
                conflictReason = `diagonal (row+col) is occupied.`;
            } else if (diag2[d2]) {
                conflictReason = `anti-diagonal (row-col) is occupied.`;
            }
            // --- END OF O(1) CHECK ---

            if (conflictReason === null) { // If it's safe
                addLog(`Safe. Placing Queen at (${row}, ${col}).`, 'place');
                board[row][col] = 1;
                
                // --- Place: UPDATE CONSTRAINTS ---
                cols[col] = true;
                diag1[d1] = true;
                diag2[d2] = true;
                
                drawQueen(row, col, true);
                await toggleCellState(row, col, 'trying', false);
                
                statusMsg.textContent = `Placed at [${row}, ${col}]. Recursing...`;

                // Recurse to the next row
                if (await solveNQueens(row + 1, findAll)) {
                    return true; // Solution found and we're stopping
                }

                // --- Backtrack: UNDO CONSTRAINTS ---
                if (stopSolving) return false;
                statusMsg.textContent = `Backtracking from [${row}, ${col}]...`;
                addLog(`Backtracking. Removing Queen from (${row}, ${col}).`, 'remove');
                
                board[row][col] = 0;
                cols[col] = false;
                diag1[d1] = false;
                diag2[d2] = false;
                
                drawQueen(row, col, false);
                await animatedSleep();

            } else { // If it's not safe
                addLog(`Conflict at (${row}, ${col}): ${conflictReason}`, 'conflict');
                await toggleCellState(row, col, 'trying', false);
            }
        }

        // If no column worked in this row, backtrack
        addLog(`No safe spot found in Row ${row}. Backtracking.`, 'remove');
        return false;
    }

    /**
     * Main handler function to start the solving process
     * @param {boolean} findAll - True to find all solutions
     */
    async function startSolver(findAll) {
        // --- NEW: WARNING DIALOG ---
        const nVal = parseInt(nInput.value, 10);
        if (findAll && nVal > 10) {
            if (!confirm(`Finding all solutions for N=${nVal} can take a significant amount of time (it grows exponentially).\n\nAre you sure you want to continue?`)) {
                return; // User clicked "Cancel"
            }
        }

        reset(); // This will set the global n and init constraint arrays
        startSolving();
        
        statusMsg.textContent = findAll ? 'Finding all solutions...' : 'Finding one solution...';
        
        const foundSolution = await solveNQueens(0, findAll);
        
        if (isSolving) {
            if (findAll) {
                statusMsg.textContent = `Found ${solutionCount} solutions.`;
                addLog(`Search complete. Found ${solutionCount} total solutions.`, 'solution');
            } else if (foundSolution) {
                statusMsg.textContent = 'Solution found!';
            } else {
                statusMsg.textContent = `No solution found.`;
                addLog(`No solution exists for N=${n}.`, 'conflict');
            }
        }

        stopSolvingProcess();
    }

    // --- Event Listeners ---
    solveOneBtn.addEventListener('click', () => startSolver(false));
    solveAllBtn.addEventListener('click', () => startSolver(true));
    stopBtn.addEventListener('click', stopSolvingProcess);
    resetBtn.addEventListener('click', reset);
    nInput.addEventListener('change', reset);
    
    skipBtn.addEventListener('click', () => {
        skipAnimation = true;
        skipBtn.disabled = true;
        addLog('--- Animation skipped ---', 'info');
    });
    
    // Initial board setup and resize listener
    reset(); // Use reset to init everything, including constraint arrays
    window.addEventListener('resize', () => createBoard(n));
});