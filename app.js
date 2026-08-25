/**
 * App Controller for Scientific Calculator Pro
 * Handles Scientific Calculator, Graphing Calculator, and Matrix Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Engines
  const mathEngine = new MathEngine();
  let graphingEngine = null;
  const matrixEngine = new MatrixEngine();

  // App State
  let activeTool = 'scientific'; // 'scientific', 'graphing', 'matrix'
  let currentExpression = '';
  let history = [];
  let currentSciTab = 'main';
  let isDarkMode = true;

  // DOM Elements - Navigation & Headers
  const mathToolsMenuBtn = document.getElementById('mathToolsMenuBtn');
  const mathToolsDropdown = document.getElementById('mathToolsDropdown');
  const currentToolName = document.getElementById('currentToolName');
  const navToolOptions = document.querySelectorAll('.nav-tool-option');
  const quickToolTabs = document.querySelectorAll('.quick-tool-tab');

  const toolScientificContainer = document.getElementById('toolScientificContainer');
  const toolGraphingContainer = document.getElementById('toolGraphingContainer');
  const toolMatrixContainer = document.getElementById('toolMatrixContainer');
  const sciHeaderControls = document.getElementById('sciHeaderControls');

  // Scientific Calculator Elements
  const displayText = document.getElementById('displayText');
  const resultPreview = document.getElementById('resultPreview');
  const modeDisplayBadge = document.getElementById('modeDisplayBadge');
  const ansIndicator = document.getElementById('ansIndicator');
  const statusMessage = document.getElementById('statusMessage');
  const degBtn = document.getElementById('degBtn');
  const radBtn = document.getElementById('radBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const clearBtn = document.getElementById('clearBtn');
  const backspaceBtn = document.getElementById('backspaceBtn');
  const equalsBtn = document.getElementById('equalsBtn');
  const historyList = document.getElementById('historyList');
  const emptyHistoryNotice = document.getElementById('emptyHistoryNotice');
  const clearHistoryOnlyBtn = document.getElementById('clearHistoryOnlyBtn');
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
  const historyBadge = document.getElementById('historyBadge');
  const historyPanel = document.getElementById('historyPanel');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  const tabMainSci = document.getElementById('tabMainSci');
  const tabInvSci = document.getElementById('tabInvSci');
  const tabExtraSci = document.getElementById('tabExtraSci');

  // Graphing Elements
  const equationsList = document.getElementById('equationsList');
  const addEquationBtn = document.getElementById('addEquationBtn');
  const resetGraphViewBtn = document.getElementById('resetGraphViewBtn');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');

  // Matrix Elements
  const rowsASelect = document.getElementById('rowsA');
  const colsASelect = document.getElementById('colsA');
  const rowsBSelect = document.getElementById('rowsB');
  const colsBSelect = document.getElementById('colsB');
  const matrixGridA = document.getElementById('matrixGridA');
  const matrixGridB = document.getElementById('matrixGridB');
  const matrixResultGrid = document.getElementById('matrixResultGrid');
  const matrixScalarResult = document.getElementById('matrixScalarResult');
  const matrixErrorNotice = document.getElementById('matrixErrorNotice');
  const matrixOpBadge = document.getElementById('matrixOpBadge');

  // Math Tools Navigation Switcher
  mathToolsMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mathToolsDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    mathToolsDropdown.classList.add('hidden');
  });

  function switchTool(tool) {
    activeTool = tool;
    mathToolsDropdown.classList.add('hidden');

    toolScientificContainer.classList.add('hidden');
    toolGraphingContainer.classList.add('hidden');
    toolMatrixContainer.classList.add('hidden');

    // Update quick tabs highlight
    quickToolTabs.forEach(tab => {
      const targetTool = tab.getAttribute('data-tool');
      if (targetTool === tool) {
        tab.className = 'quick-tool-tab px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 shadow transition-all cursor-pointer';
      } else {
        tab.className = 'quick-tool-tab px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer';
      }
    });

    if (tool === 'scientific') {
      currentToolName.textContent = 'Calculator Pro';
      toolScientificContainer.classList.remove('hidden');
      toolScientificContainer.classList.add('grid');
      sciHeaderControls.classList.remove('hidden');
    } else if (tool === 'graphing') {
      currentToolName.textContent = 'Graphing';
      toolGraphingContainer.classList.remove('hidden');
      toolGraphingContainer.classList.add('grid');
      sciHeaderControls.classList.add('hidden');

      if (!graphingEngine) {
        graphingEngine = new GraphingEngine('graphCanvas', mathEngine);
        renderEquationsUI();
      } else {
        setTimeout(() => {
          graphingEngine.resizeCanvas();
          graphingEngine.render();
        }, 50);
      }
    } else if (tool === 'matrix') {
      currentToolName.textContent = 'Matrix';
      toolMatrixContainer.classList.remove('hidden');
      toolMatrixContainer.classList.add('grid');
      sciHeaderControls.classList.add('hidden');
      renderMatrixInputs();
      executeMatrixOp('mul');
    }
  }

  navToolOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const tool = opt.getAttribute('data-tool');
      if (tool) switchTool(tool);
    });
  });

  quickToolTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tool = tab.getAttribute('data-tool');
      if (tool) switchTool(tool);
    });
  });

  // LocalStorage Preferences
  function loadLocalStorage() {
    try {
      const savedHistory = localStorage.getItem('desmos_calc_history');
      if (savedHistory) {
        history = JSON.parse(savedHistory);
        renderHistory();
      }

      const savedMode = localStorage.getItem('desmos_calc_mode');
      if (savedMode && (savedMode === 'DEG' || savedMode === 'RAD')) {
        setAngleMode(savedMode);
      }

      const savedTheme = localStorage.getItem('desmos_calc_theme');
      if (savedTheme === 'light') {
        setTheme('light');
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem('desmos_calc_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // DEG / RAD Angle Mode
  function setAngleMode(mode) {
    mathEngine.setAngleMode(mode);
    modeDisplayBadge.textContent = mode;
    localStorage.setItem('desmos_calc_mode', mode);

    if (mode === 'DEG') {
      degBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-cyan-500 text-slate-950 shadow-md';
      radBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all duration-200';
    } else {
      radBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-cyan-500 text-slate-950 shadow-md';
      degBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all duration-200';
    }

    updateDisplay();
  }

  degBtn.addEventListener('click', () => setAngleMode('DEG'));
  radBtn.addEventListener('click', () => setAngleMode('RAD'));

  // Theme Switcher
  function setTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
      themeIcon.className = 'fa-solid fa-sun text-amber-400';
      isDarkMode = false;
      localStorage.setItem('desmos_calc_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      themeIcon.className = 'fa-solid fa-moon text-indigo-400';
      isDarkMode = true;
      localStorage.setItem('desmos_calc_theme', 'dark');
    }

    if (graphingEngine) graphingEngine.render();
  }

  themeToggleBtn.addEventListener('click', () => setTheme(isDarkMode ? 'light' : 'dark'));

  // Scientific Sub-Tabs Switcher
  function setSciTab(tab) {
    currentSciTab = tab;
    const mainElements = document.querySelectorAll('.main-sci');
    const invElements = document.querySelectorAll('.inv-sci');
    const extraElements = document.querySelectorAll('.extra-sci');

    tabMainSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all';
    tabInvSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all';
    tabExtraSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all';

    if (tab === 'main') {
      tabMainSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm transition-all';
      mainElements.forEach(el => el.classList.remove('hidden'));
      invElements.forEach(el => el.classList.add('hidden'));
      extraElements.forEach(el => el.classList.add('hidden'));
      updateTrigButtonInserts('sin(', 'cos(', 'tan(');
    } else if (tab === 'inv') {
      tabInvSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm transition-all';
      mainElements.forEach(el => el.classList.add('hidden'));
      invElements.forEach(el => el.classList.remove('hidden'));
      extraElements.forEach(el => el.classList.add('hidden'));
      updateTrigButtonInserts('sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(');
    } else if (tab === 'extra') {
      tabExtraSci.className = 'flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm transition-all';
      mainElements.forEach(el => el.classList.add('hidden'));
      invElements.forEach(el => el.classList.add('hidden'));
      extraElements.forEach(el => el.classList.remove('hidden'));
      updateTrigButtonInserts('sinh(', 'cosh(', 'tanh(');
    }
  }

  function updateTrigButtonInserts(sinVal, cosVal, tanVal) {
    const trigBtns = document.querySelectorAll('.calc-btn.btn-func');
    if (trigBtns.length >= 3) {
      trigBtns[0].setAttribute('data-insert', sinVal);
      trigBtns[1].setAttribute('data-insert', cosVal);
      trigBtns[2].setAttribute('data-insert', tanVal);
    }
  }

  tabMainSci.addEventListener('click', () => setSciTab('main'));
  tabInvSci.addEventListener('click', () => setSciTab('inv'));
  tabExtraSci.addEventListener('click', () => setSciTab('extra'));

  // Input Handling
  function insertToken(token) {
    if (token === '(-)') currentExpression += '-';
    else currentExpression += token;
    updateDisplay();
  }

  function handleBackspace() {
    if (currentExpression.length === 0) return;
    const multiTokens = ['sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(', 'sinh(', 'cosh(', 'tanh(', 'nroot(', 'sqrt(', 'sin(', 'cos(', 'tan(', 'abs(', 'log(', '10^(', 'e^(', 'Ans'];
    let removed = false;
    for (const tok of multiTokens) {
      if (currentExpression.endsWith(tok)) {
        currentExpression = currentExpression.slice(0, -tok.length);
        removed = true;
        break;
      }
    }
    if (!removed) currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
  }

  function clearCurrentLine() {
    currentExpression = '';
    updateDisplay();
  }

  function clearAll() {
    currentExpression = '';
    mathEngine.setAns(0);
    ansIndicator.textContent = 'Ans = 0';
    statusMessage.textContent = 'Cleared All';
    updateDisplay();
  }

  function updateDisplay() {
    displayText.textContent = currentExpression;
    if (currentExpression.trim() === '') {
      resultPreview.textContent = '0';
      resultPreview.className = 'font-mono-math text-lg sm:text-xl font-semibold text-slate-500 truncate max-w-[80%] text-right';
      statusMessage.textContent = 'Ready';
      return;
    }
    const evalResult = mathEngine.calculate(currentExpression);
    if (evalResult.success) {
      resultPreview.textContent = evalResult.result;
      resultPreview.className = 'font-mono-math text-lg sm:text-xl font-semibold text-cyan-400 truncate max-w-[80%] text-right';
      statusMessage.textContent = 'Valid Expression';
    } else {
      resultPreview.textContent = '—';
      resultPreview.className = 'font-mono-math text-lg sm:text-xl font-semibold text-rose-400/80 truncate max-w-[80%] text-right';
      statusMessage.textContent = evalResult.error || 'Incomplete Syntax';
    }
  }

  function executeCalculation() {
    if (!currentExpression || currentExpression.trim() === '') return;
    const evalResult = mathEngine.calculate(currentExpression);
    if (evalResult.success) {
      const finalResultStr = evalResult.result;
      mathEngine.setAns(evalResult.numeric);
      ansIndicator.textContent = `Ans = ${finalResultStr}`;

      const historyItem = {
        id: Date.now(),
        expression: currentExpression,
        result: finalResultStr,
        mode: mathEngine.angleMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      history.unshift(historyItem);
      if (history.length > 50) history.pop();
      saveHistory();
      renderHistory();

      currentExpression = finalResultStr;
      updateDisplay();
      statusMessage.textContent = 'Calculated';
    } else {
      statusMessage.textContent = evalResult.error || 'Syntax Error';
      resultPreview.textContent = evalResult.error || 'Syntax Error';
      resultPreview.className = 'font-mono-math text-lg sm:text-xl font-semibold text-rose-500 truncate max-w-[80%] text-right animate-pulse';
    }
  }

  function renderHistory() {
    historyBadge.textContent = history.length;
    if (history.length === 0) {
      emptyHistoryNotice.classList.remove('hidden');
      historyList.querySelectorAll('.history-card').forEach(el => el.remove());
      return;
    }
    emptyHistoryNotice.classList.add('hidden');
    historyList.querySelectorAll('.history-card').forEach(el => el.remove());

    history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/90 hover:border-cyan-500/30 p-3 rounded-xl cursor-pointer transition-all duration-150 group flex flex-col gap-1';
      card.innerHTML = `
        <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span class="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">${item.mode}</span>
          <span>${item.timestamp}</span>
        </div>
        <div class="font-mono text-sm text-slate-300 group-hover:text-cyan-300 truncate">${item.expression}</div>
        <div class="font-mono text-base font-bold text-cyan-400 text-right">= ${item.result}</div>
      `;
      card.addEventListener('click', () => {
        currentExpression = item.expression;
        updateDisplay();
      });
      historyList.appendChild(card);
    });
  }

  clearHistoryOnlyBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  clearAllBtn.addEventListener('click', clearAll);
  clearBtn.addEventListener('click', clearCurrentLine);
  backspaceBtn.addEventListener('click', handleBackspace);
  equalsBtn.addEventListener('click', executeCalculation);

  document.querySelectorAll('.calc-btn[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => {
      const insertVal = btn.getAttribute('data-insert');
      if (insertVal) insertToken(insertVal);
    });
  });

  toggleHistoryBtn.addEventListener('click', () => {
    const isLg = window.innerWidth >= 1024;
    if (isLg) {
      historyPanel.classList.toggle('hidden');
      historyPanel.classList.toggle('flex');
    } else {
      historyPanel.classList.toggle('mobile-visible');
    }
  });

  // ----------------------------------------------------
  // GRAPHING CALCULATOR UI LOGIC
  // ----------------------------------------------------
  function renderEquationsUI() {
    if (!graphingEngine) return;
    equationsList.innerHTML = '';

    graphingEngine.equations.forEach((eq, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800';
      row.innerHTML = `
        <button class="toggle-eq-btn w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white transition-opacity cursor-pointer" style="background-color: ${eq.color}; opacity: ${eq.enabled ? 1 : 0.3}">
          ${index + 1}
        </button>
        <span class="font-mono text-xs font-bold text-slate-400">y =</span>
        <input type="text" value="${eq.expr}" class="eq-input flex-1 bg-slate-950 text-slate-100 border border-slate-800 focus:border-cyan-500/50 rounded-lg px-2.5 py-1 font-mono text-xs outline-none transition-all">
        <button class="remove-eq-btn text-xs text-rose-400/70 hover:text-rose-400 p-1 cursor-pointer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      const input = row.querySelector('.eq-input');
      const toggleBtn = row.querySelector('.toggle-eq-btn');
      const removeBtn = row.querySelector('.remove-eq-btn');

      input.addEventListener('input', (e) => {
        eq.expr = e.target.value;
        graphingEngine.render();
      });

      toggleBtn.addEventListener('click', () => {
        eq.enabled = !eq.enabled;
        toggleBtn.style.opacity = eq.enabled ? '1' : '0.3';
        graphingEngine.render();
      });

      removeBtn.addEventListener('click', () => {
        graphingEngine.equations = graphingEngine.equations.filter(eItem => eItem.id !== eq.id);
        renderEquationsUI();
        graphingEngine.render();
      });

      equationsList.appendChild(row);
    });
  }

  addEquationBtn.addEventListener('click', () => {
    if (!graphingEngine) return;
    const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const nextColor = colors[graphingEngine.equations.length % colors.length];
    graphingEngine.equations.push({
      id: Date.now(),
      expr: 'x',
      color: nextColor,
      enabled: true
    });
    renderEquationsUI();
    graphingEngine.render();
  });

  resetGraphViewBtn.addEventListener('click', () => graphingEngine && graphingEngine.resetView());
  zoomInBtn.addEventListener('click', () => graphingEngine && graphingEngine.zoomIn());
  zoomOutBtn.addEventListener('click', () => graphingEngine && graphingEngine.zoomOut());

  // ----------------------------------------------------
  // MATRIX CALCULATOR UI LOGIC
  // ----------------------------------------------------
  function renderMatrixInputs() {
    matrixEngine.rowsA = parseInt(rowsASelect.value);
    matrixEngine.colsA = parseInt(colsASelect.value);
    matrixEngine.rowsB = parseInt(rowsBSelect.value);
    matrixEngine.colsB = parseInt(colsBSelect.value);

    matrixEngine.matrixA = matrixEngine.createEmpty(matrixEngine.rowsA, matrixEngine.colsA);
    matrixEngine.matrixB = matrixEngine.createEmpty(matrixEngine.rowsB, matrixEngine.colsB);

    if (matrixEngine.rowsA === 2 && matrixEngine.colsA === 2) matrixEngine.matrixA = [[1, 2], [3, 4]];
    if (matrixEngine.rowsB === 2 && matrixEngine.colsB === 2) matrixEngine.matrixB = [[2, 0], [1, 3]];

    renderGrid(matrixGridA, matrixEngine.rowsA, matrixEngine.colsA, matrixEngine.matrixA);
    renderGrid(matrixGridB, matrixEngine.rowsB, matrixEngine.colsB, matrixEngine.matrixB);
  }

  function renderGrid(container, rows, cols, matrixData) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.value = matrixData[r][c] !== undefined ? matrixData[r][c] : 0;
        input.className = 'w-12 h-9 bg-slate-950 text-center font-mono text-xs text-cyan-300 font-bold border border-slate-700/80 rounded-lg focus:border-cyan-400 outline-none shadow-inner';

        input.addEventListener('input', (e) => {
          matrixData[r][c] = parseFloat(e.target.value) || 0;
        });

        container.appendChild(input);
      }
    }
  }

  rowsASelect.addEventListener('change', renderMatrixInputs);
  colsASelect.addEventListener('change', renderMatrixInputs);
  rowsBSelect.addEventListener('change', renderMatrixInputs);
  colsBSelect.addEventListener('change', renderMatrixInputs);

  function executeMatrixOp(op) {
    matrixResultGrid.classList.add('hidden');
    matrixScalarResult.classList.add('hidden');
    matrixErrorNotice.classList.add('hidden');

    const opNames = {
      add: 'A + B',
      sub: 'A - B',
      mul: 'A × B',
      detA: 'det(A)',
      detB: 'det(B)',
      invA: 'A⁻¹',
      invB: 'B⁻¹',
      transA: 'Aᵀ',
      transB: 'Bᵀ'
    };

    matrixOpBadge.textContent = opNames[op] || op;

    try {
      let res;
      if (op === 'add') {
        res = matrixEngine.add(matrixEngine.matrixA, matrixEngine.matrixB);
        renderMatrixResultGrid(res);
      } else if (op === 'sub') {
        res = matrixEngine.subtract(matrixEngine.matrixA, matrixEngine.matrixB);
        renderMatrixResultGrid(res);
      } else if (op === 'mul') {
        res = matrixEngine.multiply(matrixEngine.matrixA, matrixEngine.matrixB);
        renderMatrixResultGrid(res);
      } else if (op === 'detA') {
        const d = matrixEngine.determinant(matrixEngine.matrixA);
        renderScalarResult(d);
      } else if (op === 'detB') {
        const d = matrixEngine.determinant(matrixEngine.matrixB);
        renderScalarResult(d);
      } else if (op === 'invA') {
        res = matrixEngine.inverse(matrixEngine.matrixA);
        renderMatrixResultGrid(res);
      } else if (op === 'invB') {
        res = matrixEngine.inverse(matrixEngine.matrixB);
        renderMatrixResultGrid(res);
      } else if (op === 'transA') {
        res = matrixEngine.transpose(matrixEngine.matrixA);
        renderMatrixResultGrid(res);
      } else if (op === 'transB') {
        res = matrixEngine.transpose(matrixEngine.matrixB);
        renderMatrixResultGrid(res);
      }
    } catch (err) {
      matrixErrorNotice.textContent = err.message;
      matrixErrorNotice.classList.remove('hidden');
    }
  }

  function renderMatrixResultGrid(matrix) {
    const formatted = matrixEngine.formatMatrix(matrix);
    const rows = formatted.length;
    const cols = formatted[0].length;

    matrixResultGrid.innerHTML = '';
    matrixResultGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    formatted.forEach(row => {
      row.forEach(val => {
        const cell = document.createElement('div');
        cell.className = 'px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-bold text-cyan-400 min-w-[40px] shadow-sm';
        cell.textContent = val;
        matrixResultGrid.appendChild(cell);
      });
    });

    matrixResultGrid.classList.remove('hidden');
  }

  function renderScalarResult(val) {
    matrixScalarResult.textContent = `= ${parseFloat(val.toFixed(6))}`;
    matrixScalarResult.classList.remove('hidden');
  }

  document.querySelectorAll('.matrix-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.getAttribute('data-op');
      if (op) executeMatrixOp(op);
    });
  });

  // Keyboard Navigation Support
  document.addEventListener('keydown', (e) => {
    if (activeTool !== 'scientific') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    const key = e.key;
    if (key >= '0' && key <= '9') insertToken(key);
    else if (key === '.') insertToken('.');
    else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '^' || key === '(' || key === ')' || key === '!') {
      e.preventDefault();
      const opMap = { '*': '×', '/': '÷' };
      insertToken(opMap[key] || key);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      executeCalculation();
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (key === 'Escape' || key === 'Delete') {
      e.preventDefault();
      clearCurrentLine();
    }
  });

  // Initialization
  loadLocalStorage();
  updateDisplay();
});
