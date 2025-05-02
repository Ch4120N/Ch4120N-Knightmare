(function () {
    window.UI = {
        createPanel: () => {
            const panel = document.createElement('div');
            panel.id = 'chess-cheat-panel';
            panel.innerHTML = `
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
                            <p class="info-up-panel">Show/Hide Cheat Panel With <span style="color: yellow;">SHIFT+A</span></p>
                        </div>
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
                                <option value="1000">Strong (1000ms)</option>
                                <option value="2000" selected>Very Strong (2000ms)</option>
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
                                <option value="red" selected>Red</option>
                                <option value="blue">Blue</option>
                                <option value="purple">Purple</option>
                                <option value="cyan">Cyan</option>
                                <option value="orange">Orange</option>
                                <option value="black">Black</option>
                            </select>
                        </div>
                        <div class="button-group">
                            <button id="start-btn">Start Cheat</button>
                            <button id="stop-btn" disabled>Stop Cheat</button>
                        </div>
                        <div id="engine-status" class="stopped">Engine Status: Stopped</div>
                        <div id="best-moves">Best Moves: Not Available</div>
                        <div class="move-history-container">
                            <label>Move History</label>
                            <div id="move-history">No moves yet</div>
                        </div>
                        <div class="fen-container">
                            <div id="fen-string">FEN: Not Available</div>
                            <button id="copy-fen-btn">Copy FEN</button>
                        </div>
                        <div class="button-group">
                            <button id="export-pgn-btn">Export PGN</button>
                        </div>
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
            highlight.style.cssText = `background:${color};opacity:0.6;border-radius:8px;box-shadow:0 0 8px ${color}`;
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
        },
        updateMoveHistory: (element, moves) => {
            if (moves.length === 0) {
                element.innerHTML = 'No moves yet';
                return;
            }
            let html = '';
            for (let i = 0; i < moves.length; i += 2) {
                const moveNumber = Math.floor(i / 2) + 1;
                const whiteMove = moves[i] || '';
                const blackMove = moves[i + 1] || '';
                html += `<div>${moveNumber}. ${whiteMove} ${blackMove}</div>`;
            }
            element.innerHTML = html;
        }
    };
})();