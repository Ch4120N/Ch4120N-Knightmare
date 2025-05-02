(function () {
    window.Engine = {
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
                instance.updateStatus(instance.engineStatusDisplay, 'Engine Status: Running', 'running');
                Utils.logDebug('Best Move', { move: bestMove });

                instance.clearHighlights();
                instance.applyHighlights(instance);
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
})();