/**
 * Telegram bridge: підключення WebApp і відправка результату гри в бота.
 * Ми НЕ чіпаємо build/clumsy-min.js, усе робимо через прототип GameOverScreen.
 */
(function () {
    function attachBridge() {
        try {
            // чекаємо, поки melonJS і game ініціалізуються
            if (typeof me === "undefined" || typeof game === "undefined") {
                console.log("[bridge] me/game not ready, retry...");
                setTimeout(attachBridge, 500);
                return;
            }

            if (!game || !game.GameOverScreen) {
                console.log("[bridge] GameOverScreen not yet defined, retry...");
                setTimeout(attachBridge, 500);
                return;
            }

            var proto = game.GameOverScreen.prototype;

            // щоб двічі не патчити
            if (proto.__telegramPatched) {
                console.log("[bridge] already patched");
                return;
            }

            console.log("[bridge] patching GameOverScreen.onResetEvent");

            var originalOnReset = proto.onResetEvent;

            proto.onResetEvent = function () {
                // 1) спочатку — оригінальна логіка екрана Game Over
                if (typeof originalOnReset === "function") {
                    originalOnReset.apply(this, arguments);
                }

                // 2) дістаємо результат
                var score = 0;
                if (game && game.data && typeof game.data.steps === "number") {
                    score = game.data.steps;
                }

                // 3) DEBUG: ТИ МАЄШ ПОБАЧИТИ ЦЕ ПОВІДОМЛЕННЯ ПІСЛЯ ПРОГРАШУ
                try {
                    alert("DEBUG: score = " + score);
                } catch (e) {
                    console.log("[bridge] alert failed:", e);
                }

                // 4) ВІДПРАВКА В TELEGRAM
                try {
                    if (window.Telegram &&
                        Telegram.WebApp &&
                        typeof Telegram.WebApp.sendData === "function") {

                        var payload = JSON.stringify({
                            game: "clickgame",
                            score: score
                        });

                        console.log("[bridge] sending to Telegram:", payload);
                        Telegram.WebApp.sendData(payload);
                    } else {
                        console.log("[bridge] Telegram.WebApp.sendData is not available");
                    }
                } catch (err) {
                    console.log("[bridge] error calling Telegram.WebApp.sendData:", err);
                }
            };

            proto.__telegramPatched = true;
        } catch (e) {
            console.log("[bridge] attachBridge error:", e);
        }
    }

    // стартуємо одразу
    attachBridge();
})();
