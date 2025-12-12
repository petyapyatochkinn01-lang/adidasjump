// telegram-patch.js
(function () {
  // Патч виконується тільки коли все вже є
  if (!window.game || !game.GameOverScreen) {
    console.log("Telegram patch: game.GameOverScreen not found");
    return;
  }

  console.log("Telegram patch: onResetEvent successfully patched");

  // Зберігаємо оригінальний onResetEvent
  var originalOnResetEvent = game.GameOverScreen.prototype.onResetEvent;

  game.GameOverScreen.prototype.onResetEvent = function () {
    // Спочатку відпрацьовує оригінальна логіка Game Over
    originalOnResetEvent.apply(this, arguments);

    // Потім – наша відправка результату в Telegram
    try {
      if (
        window.Telegram &&
        Telegram.WebApp &&
        typeof Telegram.WebApp.sendData === "function"
      ) {
        var score = Number(game.data && game.data.steps) || 0;

        console.log("Telegram patch: sending score =", score);

        Telegram.WebApp.sendData(
          JSON.stringify({
            game: "clickgame",
            score: score,
          })
        );
      } else {
        console.log("Telegram patch: Telegram.WebApp API not available");
      }
    } catch (e) {
      console.log("Telegram patch: error while sending score:", e);
    }
  };
})();
