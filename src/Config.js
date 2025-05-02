(function () {
    window.CONFIG = {
        boardSelector: '.board',
        chessBoardTag: 'wc-chess-board',
        workerPath: '/bundles/app/js/vendor/jschessengine/stockfish.asm.1abfa10c.js',
        moveTime: 2000,
        threads: navigator.hardwareConcurrency || 4,
        hashSize: 128,
        checkInterval: 200,
        skillLevel: 20,
        contempt: 0
    };
})();