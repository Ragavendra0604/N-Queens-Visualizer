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
    let cols;
    let diag1;
    let diag2;


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
                    solution.push(c);
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


    // --- Control Functions ---
    
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
        createBoard();
        statusMsg.textContent = 'Idle';
        solutionCount = 0;
        solutionCountDisplay.textContent = '0';
        logList.innerHTML = '';
        solutionsList.innerHTML = '';

        cols = new Array(n).fill(false);
        diag1 = new Array(2 * n - 1).fill(false);
        diag2 = new Array(2 * n - 1).fill(false);
    }

    // --- Board Creation and Drawing ---
    
    function createBoard() {
        // 'n' is already set by the reset() function
        board = Array(n).fill(0).map(() => Array(n).fill(0));
        boardContainer.innerHTML = '';
        
        // This is the ONLY layout logic JavaScript needs to do.
        // CSS handles all the sizing (width, height, aspect-ratio).
        boardContainer.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

        // --- All the complex 'cellSize' JS logic is GONE! ---
        
        // Create the cell elements
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

    // --- N-Queens CSP Logic (Updated) ---

    async function solveNQueens(row, findAll) {
        if (stopSolving) return false;

        // --- (NEW LOGIC HERE) ---
        // This is the base case: a solution is found
        if (row === n) {
            solutionCount++;
            solutionCountDisplay.textContent = solutionCount;
            addLog(`🎉 Solution ${solutionCount} Found!`, 'solution');
            statusMsg.textContent = `Solution ${solutionCount} found!`;
            saveSolution(board);

            // If this is the FIRST solution, AND we are in "Find All" mode
            // AND N is large, THEN turn on skipAnimation for all future steps.
            if (findAll && solutionCount === 1 && n >= 8) {
                skipAnimation = true;
                skipBtn.disabled = true;
                addLog('--- First solution found. Skipping animation for remaining search. ---', 'info');
            }

            if (findAll) {
                if (!skipAnimation) await sleep(1000); // Pause to show solution (only if N < 8)
                return false; // Force backtrack to find next solution
            }
            return true; // Found one solution, stop
        }
        // --- (END NEW LOGIC) ---
        
        if (!skipAnimation) addLog(`Searching in Row ${row}...`, 'info');

        for (let col = 0; col < n; col++) {
            if (stopSolving) return false;

            if (!skipAnimation) {
                statusMsg.textContent = `Trying [${row}, ${col}]...`;
                addLog(`Trying Queen at (${row}, ${col})`, 'info');
                await toggleCellState(row, col, 'trying', true);
            }

            // O(1) Safety Check
            const d1 = row + col;
            const d2 = row - col + (n - 1);
            let conflictReason = null;
            if (cols[col]) conflictReason = `column ${col} is occupied.`;
            else if (diag1[d1]) conflictReason = `diagonal (row+col) is occupied.`;
            else if (diag2[d2]) conflictReason = `anti-diagonal (row-col) is occupied.`;

            if (conflictReason === null) {
                if (!skipAnimation) addLog(`Safe. Placing Queen at (${row}, ${col}).`, 'place');
                board[row][col] = 1;
                cols[col] = true;
                diag1[d1] = true;
                diag2[d2] = true;
                
                drawQueen(row, col, true);
                if (!skipAnimation) await toggleCellState(row, col, 'trying', false);
                
                if (!skipAnimation) statusMsg.textContent = `Placed at [${row}, ${col}]. Recursing...`;

                if (await solveNQueens(row + 1, findAll)) {
                    return true;
                }

                if (stopSolving) return false;
                if (!skipAnimation) {
                    statusMsg.textContent = `Backtracking from [${row}, ${col}]...`;
                    addLog(`Backtracking. Removing Queen from (${row}, ${col}).`, 'remove');
                }
                
                board[row][col] = 0;
                cols[col] = false;
                diag1[d1] = false;
                diag2[d2] = false;
                drawQueen(row, col, false);
                
                if (!skipAnimation) await animatedSleep();

            } else {
                if (!skipAnimation) {
                    addLog(`Conflict at (${row}, ${col}): ${conflictReason}`, 'conflict');
                    await toggleCellState(row, col, 'trying', false);
                }
            }
        }

        if (!skipAnimation) addLog(`No safe spot found in Row ${row}. Backtracking.`, 'remove');
        return false;
    }

    // --- (Updated) startSolver() ---
    async function startSolver(findAll) {
        const nVal = parseInt(nInput.value, 10);
        if (findAll && nVal > 10) {
            if (!confirm(`Finding all solutions for N=${nVal} can take a significant amount of time (it grows exponentially).\n\nAre you sure you want to continue?`)) {
                return;
            }
        }

        reset(); // This sets global 'n' from the input
        startSolving();
        
        // --- (REMOVED) ---
        // The old auto-skip logic was here. It is now gone
        // and has been replaced by the logic inside solveNQueens.
        // --- (END REMOVED) ---

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
        addLog('--- Animation skipped by user. ---', 'info');
    });
    
    reset();
    window.addEventListener('resize', () => createBoard());
});