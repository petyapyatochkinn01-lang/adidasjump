// js/telegram-bridge.js
(function () {
  if (typeof window === "undefined") return;

  function attachBridge() {
    try {
      if (!window.game || !game.GameOverScreen || !game.data) {
        console.log("[bridge] game/GameOverScreen не готові, чекаємо...");
        setTimeout(attachBridge, 300);
        return;
      }

      console.log("[bridge] patching GameOverScreen...");

      var originalOnReset = game.GameOverScreen.prototype.onResetEvent;

      game.GameOverScreen.prototype.onResetEvent = function () {
        // викликаємо оригінальну логіку гри
        if (typeof originalOnReset === "function") {
          originalOnReset.apply(this, arguments);
        }

        if (this._telegramSent) return;
        this._telegramSent = true;

        var score = 0;
        try {
          score = Number(game.data.steps || 0);
        } catch (e) {
          console.log("[bridge] cannot read score:", e);
        }

        console.log("[bridge] GAME OVER, steps =", score);

        // ЩОБ ТИ ТОЧНО БАЧИВ, ЩО КОД СПРАЦЮВАВ
        try {
          alert("Score sent to bot: " + score);
        } catch (e) {
          console.log("[bridge] alert error:", e);
        }

        try {
          if (
            window.Telegram &&
            Telegram.WebApp &&
            typeof Telegram.WebApp.sendData === "function"
          ) {
            var payload = JSON.stringify({
              game: "clickgame",
              score: score
            });

            console.log("[bridge] sending payload to Telegram:", payload);
            Telegram.WebApp.sendData(payload);
          } else {
            console.log(
              "[bridge] Telegram.WebApp.sendData недоступний (браузер? не WebApp?)"
            );
          }
        } catch (err) {
          console.log("[bridge] Telegram WebApp sendData error:", err);
        }
      };

      console.log("[bridge] GameOverScreen successfully patched");
    } catch (e) {
      console.log("[bridge] global bridge error:", e);
    }
  }

  attachBridge();
})();
