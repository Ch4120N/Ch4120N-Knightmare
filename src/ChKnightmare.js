(function () {
    class ChKnightmare {
        constructor() {
            this.cheatRunning = false;
            this.moveInterval = null;
            this.observer = null;
            this.playerColour = 'w';
            this.strength = CONFIG.moveTime;
            this.highlightEnabled = true;
            this.highlightColor = 'red';
            this.currentFen = '';
            this.lastBestMove = '';
            this.isMinimized = false;
            this.isPanelVisible = true;
            this.moveHistory = []; // Store moves in algebraic notation
            this.highlightColors = {
                green:  { light: '#5affaa', dark: '#2ea043' },
                red:    { light: '#ff5555', dark: '#b71c1c' },
                blue:   { light: '#55aaff', dark: '#01579b' },
                purple: { light: '#c77dff', dark: '#6a1b9a' },
                cyan:   { light: '#76ffff', dark: '#008b8b' },
                orange: { light: '#ffb74d', dark: '#e65100' },
                black:  { light: '#555555', dark: '#000000' }
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
            this.copyFenBtn = document.getElementById('copy-fen-btn');
            this.moveHistoryDisplay = document.getElementById('move-history');
            this.exportPgnBtn = document.getElementById('export-pgn-btn');

            this.updateStatus = UI.updateStatus.bind(UI);
            this.clearHighlights = UI.clearHighlights.bind(UI);
            this.applyHighlights = UI.applyHighlights.bind(UI);

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
            if (this.minimizeBtn) {
                this.minimizeBtn.addEventListener('click', () => this.toggleMinimize());
            } else {
                Utils.logDebug('Minimize button not found');
            }
            if (this.copyFenBtn) {
                this.copyFenBtn.addEventListener('click', () => this.copyFen());
            } else {
                Utils.logDebug('Copy FEN button not found');
            }
            if (this.exportPgnBtn) {
                this.exportPgnBtn.addEventListener('click', () => this.exportPgn());
            } else {
                Utils.logDebug('Export PGN button not found');
            }

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
                this.clearHighlights();
                if (this.highlightEnabled) {
                    this.applyHighlights(this);
                }
                Utils.logDebug('Highlight enabled changed', { enabled: this.highlightEnabled });
            });

            this.highlightColorSelect.addEventListener('change', (e) => {
                this.highlightColor = e.target.value;
                this.clearHighlights();
                this.applyHighlights(this);
                Utils.logDebug('Highlight color changed', { color: this.highlightColor });
            });

            document.addEventListener('keydown', (e) => {
                if (e.shiftKey && e.key.toLowerCase() === 'a') {
                    this.togglePanelVisibility();
                }
            });
        }

        toggleMinimize() {
            if (!this.panelContent) {
                Utils.logDebug('Error: panelContent element not found');
                return;
            }
            this.isMinimized = !this.isMinimized;
            this.panelContent.classList.toggle('minimized', this.isMinimized);
            if (this.isMinimized) {
                this.panelContent.style.display = 'none';
                this.panelContent.style.height = '0';
                this.panelContent.style.overflow = 'hidden';
            } else {
                this.panelContent.style.display = 'block';
                this.panelContent.style.height = '';
                this.panelContent.style.overflow = '';
            }
            Utils.logDebug('Panel minimize toggled', {
                isMinimized: this.isMinimized,
                hasMinimizedClass: this.panelContent.classList.contains('minimized'),
                displayStyle: this.panelContent.style.display,
                computedDisplay: window.getComputedStyle(this.panelContent).display
            });

            if (this.minimizeBtn) {
                const icon = this.minimizeBtn.querySelector('.minimize-icon');
                if (icon) {
                    icon.innerHTML = this.isMinimized
                        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />`
                        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />`;
                } else {
                    Utils.logDebug('Minimize icon not found');
                }
            } else {
                Utils.logDebug('Minimize button not found');
            }
        }

        togglePanelVisibility() {
            this.isPanelVisible = !this.isPanelVisible;
            this.panel.style.display = this.isPanelVisible ? 'block' : 'none';
            if (!this.isPanelVisible) {
                this.clearHighlights();
            } else if (this.highlightEnabled) {
                this.applyHighlights(this);
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

            this.dragHandle.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);

            this.dragHandle.addEventListener('touchstart', startDrag, { passive: false });
            document.addEventListener('touchmove', doDrag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        }

        updateBoardState() {
            const newFen = Board.getFenString(this.playerColour);
            if (newFen !== this.currentFen && newFen) {
                const move = Board.detectMove(this.currentFen, newFen);
                if (move) {
                    this.moveHistory.push(move);
                    UI.updateMoveHistory(this.moveHistoryDisplay, this.moveHistory);
                    Utils.logDebug('Move detected', { move, moveHistory: this.moveHistory });
                }
                this.currentFen = newFen;
                this.fenDisplay.textContent = `FEN: ${this.currentFen}`;
                Engine.updatePosition(this.currentFen, this.strength);
                Utils.logDebug('Board state updated', { fen: newFen });
            } else {
                Utils.logDebug('No FEN change detected', { oldFen: this.currentFen, newFen });
            }
        }

        async copyFen() {
            if (!this.currentFen) {
                this.status.textContent = 'Error: No FEN available';
                Utils.logDebug('No FEN to copy');
                return;
            }
            try {
                await navigator.clipboard.writeText(this.currentFen);
                this.status.textContent = 'FEN copied to clipboard!';
                Utils.logDebug('FEN copied', { fen: this.currentFen });
                setTimeout(() => {
                    this.status.textContent = '';
                }, 2000);
            } catch (error) {
                this.status.textContent = 'Error copying FEN';
                Utils.logDebug('Error copying FEN', { error: error.message });
            }
        }

        exportPgn() {
            if (this.moveHistory.length === 0) {
                this.status.textContent = 'Error: No moves to export';
                Utils.logDebug('No moves to export as PGN');
                return;
            }
            const pgn = this.generatePgn();
            const blob = new Blob([pgn], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ChKnightmare-${new Date().toISOString().split('T')[0]}.pgn`;
            a.click();
            URL.revokeObjectURL(url);
            this.status.textContent = 'PGN exported!';
            Utils.logDebug('PGN exported', { pgn });
            setTimeout(() => {
                this.status.textContent = '';
            }, 2000);
        }

        generatePgn() {
            let pgn = '[Event "Chess.com Game"]\n';
            pgn += '[Site "https://www.chess.com"]\n';
            pgn += `[Date "${new Date().toISOString().split('T')[0]}"]\n`;
            pgn += '[Round "-"]\n';
            pgn += '[White "Player"]\n';
            pgn += '[Black "Opponent"]\n';
            pgn += '[Result "*"]\n\n';
            
            for (let i = 0; i < this.moveHistory.length; i += 2) {
                const moveNumber = Math.floor(i / 2) + 1;
                const whiteMove = this.moveHistory[i] || '';
                const blackMove = this.moveHistory[i + 1] || '';
                pgn += `${moveNumber}. ${whiteMove} ${blackMove} `;
            }
            pgn = pgn.trim() + '\n*';
            return pgn;
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
            this.moveHistory = []; // Reset move history on new game
            UI.updateMoveHistory(this.moveHistoryDisplay, this.moveHistory);
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStrengthSelectState();
            this.status.textContent = 'Initializing cheat...';
            this.updateStatus(this.engineStatusDisplay, 'Engine Status: Initializing', 'initializing');

            try {
                await Engine.initialize();
                Engine.worker.onmessage = (event) => Engine.handleMessage(event, this);
                this.currentFen = Board.getFenString(this.playerColour);
                this.fenDisplay.textContent = `FEN: ${this.currentFen}`;
                Engine.updatePosition(this.currentFen, this.strength);

                this.observer = new MutationObserver(() => {
                    this.updateBoardState();
                });
                this.observer.observe(document.querySelector(CONFIG.chessBoardTag), {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });

                this.moveInterval = setInterval(() => {
                    this.updateBoardState();
                }, CONFIG.checkInterval);

                // this.startBtn.disabled = false;
            } catch (error) {
                this.status.textContent = `Error initializing cheat: ${error.message}`;
                this.updateStatus(this.engineStatusDisplay, 'Engine Status: Stopped', 'stopped');
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
            this.clearHighlights();
            this.cheatRunning = false;
            this.startBtn.disabled = false;
            this.stopBtn.disabled = true;
            this.updateStrengthSelectState();
            this.status.textContent = 'Cheat stopped';
            this.bestMovesDisplay.textContent = 'Best Moves: Not Available';
            this.updateStatus(this.engineStatusDisplay, 'Engine Status: Stopped', 'stopped');
            Utils.logDebug('Cheat stopped');
        }
    }

    // Initialize
    new ChKnightmare();
})();