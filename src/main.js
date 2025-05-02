(function () {
    const ChessComCheat = (() => {
        // Configuration constants
        const CONFIG = {
            boardSelector: '.board',
            chessBoardTag: 'wc-chess-board',
            workerPath: '/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js',
            moveTime: 1000,
            threads: navigator.hardwareConcurrency || 4,
            hashSize: 128,
            checkInterval: 100,
            skillLevel: 20,
            contempt: 0
        };

        // Utility functions
        const Utils = {
            logDebug: (message, data) => {
                const logEntry = `[ChessAssistant] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
                console.log(logEntry);
            },
            charToNumber: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }
        };

        // UI Management
        const UI = {
            createPanel: () => {
                const panel = document.createElement('div');
                panel.id = 'chess-cheat-panel';
                panel.innerHTML = `
                    <style>
                        #chess-cheat-panel {
                            position: absolute;
                            z-index: 1000;
                            user-select: none;
                            font-family: Arial, sans-serif;
                        }
                        .panel {
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                            overflow: hidden;
                            transition: all 0.3s ease;
                        }
                        .drag-handle {
                            background: linear-gradient(135deg, #4a90e2, #50c9c3);
                            padding: 10px;
                            cursor: move;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            pointer-events: auto;
                            color: white;
                            border-top-left-radius: 8px;
                            border-top-right-radius: 8px;
                        }
                        .panel-content {
                            padding: 15px;
                            display: block;
                            transition: opacity 0.3s ease, max-height 0.3s ease;
                        }
                        .panel-content.minimized {
                            max-height: 0;
                            opacity: 0;
                            padding: 0;
                            overflow: hidden;
                        }
                        .button-group {
                            display: flex;
                            gap: 10px;
                        }
                        .icon-btn {
                            background: none;
                            border: none;
                            cursor: pointer;
                            padding: 5px;
                            transition: transform 0.2s ease, background 0.2s ease;
                        }
                        .minimize-btn {
                            background: rgba(255, 255, 255, 0.2);
                            border-radius: 50%;
                            padding: 8px;
                        }
                        .minimize-btn:hover {
                            background: rgba(255, 255, 255, 0.4);
                            transform: scale(1.1);
                        }
                        .minimize-btn:active {
                            transform: scale(0.95);
                        }
                        select, button {
                            padding: 5px;
                            margin: 5px 0;
                            width: 100%;
                            border-radius: 4px;
                            border: 1px solid #ccc;
                        }
                        .checkbox-label {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        }
                        .disabled {
                            opacity: 0.5;
                            pointer-events: none;
                        }
                    </style>
                    <div class="panel fade-in">
                        <div class="drag-handle" id="drag-handle">
                            <h2>Ch4120N Knightmare</h2>
                            <div class="button-group">
                                <button id="minimize-btn" class="icon-btn minimize-btn">
                                    <svg class="w-5 h-5 minimize-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div id="panel-content" class="panel-content">
                            <div>
                                <label for="player-colour">Player Color</label>
                                <select id="player-colour">
                                    <option value="white">White</option>
                                    <option value="black">Black</option>
                                </select>
                            </div>
                            <div>
                                <label for="strength">Engine Strength</label>
                                <select id="strength">
                                    <option value="500">Fast (500ms)</option>
                                    <option value="1000" selected>Strong (1000ms)</option>
                                    <option value="2000">Very Strong (2000ms)</option>
                                    <option value="20">Max Depth (Depth 20)</option>
                                    <option value="30">Ultra Deep (Depth 30)</option>
                                </select>
                            </div>
                            <div>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="highlight-enabled" checked>
                                    <span>Enable Board Highlights</span>
                                </label>
                            </div>
                            <div>
                                <label for="highlight-color">Highlight Color</label>
                                <select id="highlight-color">
                                    <option value="green">Green</option>
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                </select>
                            </div>
                            <div class="button-group">
                                <button id="start-btn">Start Cheat</button>
                                <button id="stop-btn" disabled>Stop Cheat</button>
                            </div>
                            <div id="engine-status" class="stopped">Engine Status: Stopped</div>
                            <div id="best-moves">Best Moves: Not Available</div>
                            <div id="fen-string">FEN: Not Available</div>
                            <div id="status"></div>
                        </div>
                        <div class="copyright">
                            Powered By <strong>Ch4120N</strong> with ❤️
                        </div>
                    </div>
                `;
                return panel;
            },
            updateStatus: (element, text, className = '') => {
                element.textContent = text;
                element.className = className;
            },
            createHighlight: (position, color) => {
                const highlight = document.createElement('div');
                highlight.className = `highlight cheat-highlight square-${position}`;
                highlight.style.cssText = `background:${color};opacity:0.5;border-radius:4px;box-shadow:0 0 8px ${color}`;
                return highlight;
            },
            clearHighlights: () => {
                document.querySelectorAll('.cheat-highlight').forEach(el => el.remove());
            },
            applyHighlights: (instance) => {
                if (!instance.highlightEnabled || !instance.lastBestMove || !instance.isPanelVisible) return;
                try {
                    const [fromFile, fromRank, toFile, toRank] = instance.lastBestMove.split('');
                    const fromPos = `${Utils.charToNumber[fromFile]}${fromRank}`;
                    const toPos = `${Utils.charToNumber[toFile]}${toRank}`;
                    const colors = instance.highlightColors[instance.highlightColor];
                    const board = document.querySelector(CONFIG.chessBoardTag);
                    if (board) {
                        board.appendChild(UI.createHighlight(fromPos, colors.light));
                        board.appendChild(UI.createHighlight(toPos, colors.dark));
                    } else {
                        Utils.logDebug('Board element not found for highlights');
                    }
                } catch (error) {
                    Utils.logDebug('Error applying highlights', { error: error.message });
                }
            }
        };

        // Board state management
        const Board = {
            getElement: () => document.querySelector(CONFIG.boardSelector),
            isValid: (board) => board && board.tagName,
            getFenString: (playerColour) => {
                try {
                    let fen = '';
                    for (let row = 8; row >= 1; row--) {
                        let emptyCount = 0;
                        for (let col = 1; col <= 8; col++) {
                            if (col === 1 && row !== 8) fen += '/';
                            const position = `${col}${row}`;
                            const piece = document.querySelector(`.piece.square-${position}`);
                            const pieceClass = piece?.classList;

                            if (!pieceClass) {
                                emptyCount++;
                                continue;
                            }

                            if (emptyCount > 0) {
                                fen += emptyCount;
                                emptyCount = 0;
                            }

                            const pieceType = Array.from(pieceClass).find(cls => cls.length === 2);
                            if (pieceType) {
                                const [color, type] = pieceType.split('');
                                fen += color === 'w' ? type.toUpperCase() : type;
                            } else {
                                Utils.logDebug('No valid piece type found', { position });
                                emptyCount++;
                            }
                        }
                        if (emptyCount > 0) fen += emptyCount;
                    }
                    const fenString = `${fen} ${playerColour}`;
                    Utils.logDebug('FEN generated', { fen: fenString });
                    return fenString;
                } catch (error) {
                    Utils.logDebug('Error generating FEN', { error: error.message });
                    return '';
                }
            }
        };

        // Engine Management
        const Engine = {
            worker: null,
            initialize: () => {
                return new Promise((resolve, reject) => {
                    if (Engine.worker) {
                        resolve(Engine.worker);
                        return;
                    }
                    Engine.worker = new Worker(CONFIG.workerPath);
                    Engine.worker.onmessage = (event) => {
                        if (event.data === 'ready') {
                            Engine.worker.postMessage(`setoption name Threads value ${CONFIG.threads}`);
                            Engine.worker.postMessage(`setoption name Hash value ${CONFIG.hashSize}`);
                            Engine.worker.postMessage(`setoption name Skill Level value ${CONFIG.skillLevel}`);
                            Engine.worker.postMessage(`setoption name Contempt value ${CONFIG.contempt}`);
                            resolve(Engine.worker);
                        } else if (event.data.startsWith('bestmove')) {
                            Engine.handleMessage(event);
                        }
                    };
                    Engine.worker.onerror = (error) => {
                        reject(new Error(`Failed to initialize engine: ${error.message}`));
                    };
                    Engine.worker.postMessage('uci');
                });
            },
            handleMessage: (event, instance) => {
                if (event.data.startsWith('bestmove')) {
                    const bestMove = event.data.split(' ')[1];
                    instance.lastBestMove = bestMove;
                    instance.bestMovesDisplay.textContent = `Best Move: ${bestMove || 'Not Available'}`;
                    instance.status.textContent = 'Analysis running';
                    UI.updateStatus(instance.engineStatusDisplay, 'Engine Status: Running', 'running');
                    Utils.logDebug('Best Move', { move: bestMove });

                    UI.clearHighlights();
                    UI.applyHighlights(instance);
                }
            },
            updatePosition: (fen, strength) => {
                Engine.worker.postMessage(`position fen ${fen}`);
                if (strength <= 2000) {
                    Engine.worker.postMessage(`go movetime ${strength}`);
                } else {
                    Engine.worker.postMessage(`go depth ${strength}`);
                }
            }
        };

        // Main class
        class ChessComCheat {
            constructor() {
                this.cheatRunning = false;
                this.moveInterval = null;
                this.observer = null;
                this.playerColour = 'w';
                this.strength = CONFIG.moveTime;
                this.highlightEnabled = true;
                this.highlightColor = 'green';
                this.currentFen = '';
                this.lastBestMove = '';
                this.isMinimized = false;
                this.isPanelVisible = true;
                this.highlightColors = {
                    green: { light: '#5affaa', dark: '#2ea043' },
                    red: { light: '#ff5555', dark: '#b71c1c' },
                    blue: { light: '#55aaff', dark: '#01579b' }
                };

                // Initialize UI
                document.body.appendChild(UI.createPanel());
                this.panel = document.getElementById('chess-cheat-panel');
                this.dragHandle = document.getElementById('drag-handle');
                this.panelContent = document.getElementById('panel-content');
                this.minimizeBtn = document.getElementById('minimize-btn');
                this.startBtn = document.getElementById('start-btn');
                this.stopBtn = document.getElementById('stop-btn');
                this.status = document.getElementById('status');
                this.engineStatusDisplay = document.getElementById('engine-status');
                this.bestMovesDisplay = document.getElementById('best-moves');
                this.fenDisplay = document.getElementById('fen-string');
                this.playerColourSelect = document.getElementById('player-colour');
                this.strengthSelect = document.getElementById('strength');
                this.highlightCheckbox = document.getElementById('highlight-enabled');
                this.highlightColorSelect = document.getElementById('highlight-color');

                this.initializeEventListeners();
                this.makeDraggable();
                Engine.initialize().catch((error) => {
                    Utils.logDebug('Failed to pre-initialize engine', { error: error.message });
                });
                Utils.logDebug('Chess.com Cheat initialized');
            }

            initializeEventListeners() {
                this.startBtn.addEventListener('click', () => this.startCheat());
                this.stopBtn.addEventListener('click', () => this.stopCheat());
                this.minimizeBtn.addEventListener('click', () => this.toggleMinimize());

                this.playerColourSelect.addEventListener('change', (e) => {
                    this.playerColour = e.target.value.charAt(0);
                    Utils.logDebug('Player colour changed', { colour: this.playerColour });
                    if (this.cheatRunning) {
                        this.updateBoardState();
                    }
                });

                this.strengthSelect.addEventListener('change', (e) => {
                    this.strength = parseInt(e.target.value);
                    Utils.logDebug('Strength changed', { strength: this.strength });
                    if (this.cheatRunning) {
                        this.updateBoardState();
                    }
                });

                this.highlightCheckbox.addEventListener('change', (e) => {
                    this.highlightEnabled = e.target.checked;
                    UI.clearHighlights();
                    if (this.highlightEnabled) {
                        UI.applyHighlights(this);
                    }
                    Utils.logDebug('Highlight enabled changed', { enabled: this.highlightEnabled });
                });

                this.highlightColorSelect.addEventListener('change', (e) => {
                    this.highlightColor = e.target.value;
                    UI.clearHighlights();
                    UI.applyHighlights(this);
                    Utils.logDebug('Highlight color changed', { color: this.highlightColor });
                });

                // Toggle panel visibility with Shift + A
                document.addEventListener('keydown', (e) => {
                    if (e.shiftKey && e.key.toLowerCase() === 'a') {
                        this.togglePanelVisibility();
                    }
                });
            }

            toggleMinimize() {
                this.isMinimized = !this.isMinimized;
                this.panelContent.classList.toggle('minimized', this.isMinimized);
                const icon = this.minimizeBtn.querySelector('.minimize-icon');
                icon.innerHTML = this.isMinimized
                    ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`
                    : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />`;
                Utils.logDebug('Panel minimized', { isMinimized: this.isMinimized });
            }

            togglePanelVisibility() {
                this.isPanelVisible = !this.isPanelVisible;
                this.panel.style.display = this.isPanelVisible ? 'block' : 'none';
                if (!this.isPanelVisible) {
                    UI.clearHighlights();
                } else if (this.highlightEnabled) {
                    UI.applyHighlights(this);
                }
                Utils.logDebug('Panel visibility toggled', { isVisible: this.isPanelVisible });
            }

            updateStrengthSelectState() {
                this.strengthSelect.disabled = this.cheatRunning;
                this.strengthSelect.classList.toggle('disabled', this.cheatRunning);
            }

            makeDraggable() {
                let isDragging = false;
                let xOffset = 0;
                let yOffset = 0;

                // Initialize panel position
                const initX = window.innerWidth - this.panel.offsetWidth - 20;
                const initY = 20;
                this.panel.style.left = `${initX}px`;
                this.panel.style.top = `${initY}px`;

                const startDrag = (e) => {
                    isDragging = true;
                    const clientX = e.clientX || e.touches[0].clientX;
                    const clientY = e.clientY || e.touches[0].clientY;
                    const rect = this.panel.getBoundingClientRect();
                    xOffset = clientX - rect.left;
                    yOffset = clientY - rect.top;
                    e.preventDefault();
                    Utils.logDebug('Drag started', { clientX, clientY, xOffset, yOffset });
                };

                const doDrag = (e) => {
                    if (!isDragging) return;
                    const clientX = e.clientX || e.touches[0].clientX;
                    const clientY = e.clientY || e.touches[0].clientY;
                    const newX = clientX - xOffset;
                    const newY = clientY - yOffset;
                    this.panel.style.left = `${newX}px`;
                    this.panel.style.top = `${newY}px`;
                    this.panel.style.right = 'auto';
                    e.preventDefault();
                    Utils.logDebug('Dragging', { newX, newY });
                };

                const stopDrag = () => {
                    isDragging = false;
                    Utils.logDebug('Drag stopped');
                };

                // Mouse events
                this.dragHandle.addEventListener('mousedown', startDrag);
                document.addEventListener('mousemove', doDrag);
                document.addEventListener('mouseup', stopDrag);

                // Touch events
                this.dragHandle.addEventListener('touchstart', startDrag, { passive: false });
                document.addEventListener('touchmove', doDrag, { passive: false });
                document.addEventListener('touchend', stopDrag);
            }

            updateBoardState() {
                const newFen = Board.getFenString(this.playerColour);
                if (newFen !== this.currentFen && newFen) {
                    this.currentFen = newFen;
                    this.fenDisplay.textContent = `FEN: ${this.currentFen}`;
                    Engine.updatePosition(this.currentFen, this.strength);
                    Utils.logDebug('Board state updated', { fen: newFen });
                } else {
                    Utils.logDebug('No FEN change detected', { oldFen: this.currentFen, newFen });
                }
            }

            async startCheat() {
                if (this.cheatRunning) {
                    Utils.logDebug('Cheat already running');
                    return;
                }

                const board = Board.getElement();
                if (!Board.isValid(board)) {
                    this.status.textContent = 'Error: Please ensure you are in a game.';
                    Utils.logDebug('Cannot start cheat: Not in a game');
                    return;
                }

                this.cheatRunning = true;
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
                this.updateStrengthSelectState();
                this.status.textContent = 'Initializing cheat...';
                UI.updateStatus(this.engineStatusDisplay, 'Engine Status: Initializing', 'initializing');

                try {
                    await Engine.initialize();
                    Engine.worker.onmessage = (event) => Engine.handleMessage(event, this);
                    this.currentFen = Board.getFenString(this.playerColour);
                    this.fenDisplay.textContent = `FEN: ${this.currentFen}`;
                    Engine.updatePosition(this.currentFen, this.strength);

                    // Use MutationObserver for board state updates
                    this.observer = new MutationObserver(() => {
                        this.updateBoardState();
                    });
                    this.observer.observe(document.querySelector(CONFIG.chessBoardTag), {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['class']
                    });

                    // Fallback interval for additional reliability
                    this.moveInterval = setInterval(() => {
                        this.updateBoardState();
                    }, CONFIG.checkInterval);

                    this.startBtn.disabled = false;
                } catch (error) {
                    this.status.textContent = `Error initializing cheat: ${error.message}`;
                    UI.updateStatus(this.engineStatusDisplay, 'Engine Status: Stopped', 'stopped');
                    this.stopCheat();
                    Utils.logDebug('Error starting cheat', { error: error.message });
                }
            }

            stopCheat() {
                if (!this.cheatRunning) {
                    Utils.logDebug('No cheat to stop');
                    return;
                }

                if (this.observer) {
                    this.observer.disconnect();
                }
                if (this.moveInterval) {
                    clearInterval(this.moveInterval);
                }
                UI.clearHighlights();
                this.cheatRunning = false;
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.updateStrengthSelectState();
                this.status.textContent = 'Cheat stopped';
                this.bestMovesDisplay.textContent = 'Best Moves: Not Available';
                UI.updateStatus(this.engineStatusDisplay, 'Engine Status: Stopped', 'stopped');
                Utils.logDebug('Cheat stopped');
            }
        }

        // Initialize
        return new ChessComCheat();
    })();
})();