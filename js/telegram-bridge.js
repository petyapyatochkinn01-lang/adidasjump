// js/telegram-bridge.js
(function () {
  // чекаємо, поки все завантажиться
  if (typeof window === "undefined") return;

  function attachBridge() {
    try {
      // перевіряємо, що об'єкт game і екран GameOver існують
      if (!window.game || !game.GameOverScreen || !game.data) {
        console.log("[bridge] game/GameOverScreen не готові, чекаємо...");
        setTimeout(attachBridge, 300);
        return;
      }

      console.log("[bridge] patching GameOverScreen...");

      // запамʼятовуємо оригінальний метод
      var originalOnReset = game.GameOverScreen.prototype.onResetEvent;

      // підміняємо onResetEvent, але спочатку викликаємо оригінал
      game.GameOverScreen.prototype.onResetEvent = function () {
        // викликаємо стару логіку (гра поводиться як раніше)
        if (typeof originalOnReset === "function") {
          originalOnReset.apply(this, arguments);
        }

        // відправляємо результат тільки 1 раз на екземпляр
        if (this._telegramSent) {
          return;
        }
        this._telegramSent = true;

        var score = 0;
        try {
          score = Number(game.data.steps || 0);
        } catch (e) {
          console.log("[bridge] cannot read score:", e);
        }

        console.log("[bridge] game over, steps =", score);

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
            console.log("[bridge] Telegram.WebApp.sendData недоступний (браузер? не WebApp?)");
          }
        } catch (err) {
          console.log("[bridge] Telegram WebApp sendData error:", err);
        }
      };

      console.log("[bridge] GameOverScreen successfully patched");
    } catch (e) {
      console.log("[bridge] global error:", e);
    }
  }

  // запускаємо патч
  attachBridge();
})();
