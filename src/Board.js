(function () {
    window.Board = {
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
        },
        detectMove: (oldFen, newFen) => {
            if (!oldFen || !newFen || oldFen === newFen) return null;
            try {
                // Simplified move detection: Compare FENs and extract move
                // Ideally, use a chess library like chess.js for accurate move parsing
                // For now, use a basic heuristic based on board changes
                const oldBoard = Board.fenToBoard(oldFen);
                const newBoard = Board.fenToBoard(newFen);
                let fromPos, toPos, piece;

                for (let row = 1; row <= 8; row++) {
                    for (let col = 1; col <= 8; col++) {
                        const pos = `${col}${row}`;
                        const oldPiece = oldBoard[pos];
                        const newPiece = newBoard[pos];
                        if (oldPiece && !newPiece) {
                            fromPos = pos;
                            piece = oldPiece;
                        } else if (!oldPiece && newPiece) {
                            toPos = pos;
                        }
                    }
                }

                if (fromPos && toPos && piece) {
                    const fileMap = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h' };
                    const fromFile = fileMap[parseInt(fromPos[0])];
                    const fromRank = fromPos[1];
                    const toFile = fileMap[parseInt(toPos[0])];
                    const toRank = toPos[1];
                    const pieceMap = {
                        P: '', p: '', N: 'N', n: 'N', B: 'B', b: 'B',
                        R: 'R', r: 'R', Q: 'Q', q: 'Q', K: 'K', k: 'K'
                    };
                    const move = `${pieceMap[piece] || ''}${fromFile}${fromRank}-${toFile}${toRank}`;
                    return move;
                }
                return null;
            } catch (error) {
                Utils.logDebug('Error detecting move', { error: error.message });
                return null;
            }
        },
        fenToBoard: (fen) => {
            const board = {};
            const [position] = fen.split(' ');
            const rows = position.split('/');
            for (let row = 8; row >= 1; row--) {
                let col = 1;
                for (const char of rows[8 - row]) {
                    if (/\d/.test(char)) {
                        col += parseInt(char);
                    } else {
                        board[`${col}${row}`] = char;
                        col++;
                    }
                }
            }
            return board;
        }
    };
})();