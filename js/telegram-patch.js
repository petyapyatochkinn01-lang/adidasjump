(function() {
    // чекаємо, поки все завантажиться
    window.addEventListener("load", function() {
        // перевіряємо, що є глобальний об'єкт гри
        if (!window.game || !game.GameOverScreen) {
            console.log("Telegram patch: game or GameOverScreen not found");
            return;
        }

        var proto = game.GameOverScreen.prototype;

        if (!proto || typeof proto.onResetEvent !== "function") {
            console.log("Telegram patch: onResetEvent not found");
            return;
        }

        var originalOnReset = proto.onResetEvent;

        proto.onResetEvent = function() {
            // спочатку викликаємо оригінальний GameOver
            if (originalOnReset) {
                originalOnReset.apply(this, arguments);
            }

            // тепер відправляємо результат у Telegram
            try {
                var steps = (window.game && game.data && typeof game.data.steps !== "undefined")
                    ? Number(game.data.steps) || 0
                    : 0;

                console.log("Telegram patch: game over, steps =", steps);

                if (window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.sendData === "function") {
                    var payload = {
                        game: "clickgame",
                        score: steps
                    };

                    console.log("Telegram patch: sending data:", payload);

                    Telegram.WebApp.sendData(JSON.stringify(payload));
                } else {
                    console.log("Telegram patch: Telegram.WebApp.sendData not available");
                }
            } catch (e) {
                console.log("Telegram patch: error while sending data:", e);
            }
        };

        console.log("Telegram patch: onResetEvent successfully patched");
    });
})();
