(function () {
  if (!window.me || !window.game) return;

  const originalChange = me.state.change;

  me.state.change = function (state) {
    if (state === me.state.GAME_OVER) {
      const score = Number(game?.data?.steps || 0);

      if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify({
          game: "clickgame",
          score: score
        }));

        console.log("[TG] score sent:", score);

        // 🔴 КРИТИЧНО: закриваємо WebApp
        setTimeout(() => {
          Telegram.WebApp.close();
        }, 300);
      }
    }

    return originalChange.apply(this, arguments);
  };

  console.log("[TG] state.change patched");
})();
