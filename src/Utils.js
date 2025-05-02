(function () {
    window.Utils = {
        logDebug: (message, data) => {
            const logEntry = `[ChessAssistant] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
            console.log(logEntry);
        },
        charToNumber: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 }
    };
})();