// telegram-patch.js
(function () {
  "use strict";

  let sent = false;

  function sendScoreOnce() {
    if (sent) return;
    sent = true;

    const score =
      window.game && game.data && typeof game.data.steps === "number"
        ? game.data.steps
        : 0;

    try {
      if (window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.sendData === "function") {
        Telegram.WebApp.ready();
        Telegram.WebApp.sendData(JSON.stringify({
          game: "clickgame",
          score: score
        }));
        console.log("[TG] score sent:", score);
      } else {
        console.log("[TG] WebApp not available");
      }
    } catch (e) {
      console.error("[TG] sendData error:", e);
    }
  }

  function patchStateChange() {
    if (!window.me || !me.state || !me.state.change) return false;

    const originalChange = me.state.change;

    me.state.change = function (state) {
      if (state === me.state.GAME_OVER) {
        // дати грі завершити підрахунок
        setTimeout(sendScoreOnce, 200);
      }
      return originalChange.apply(this, arguments);
    };

    console.log("[TG] state.change patched");
    return true;
  }

  // чекати поки melonJS завантажиться
  const t = setInterval(function () {
    if (patchStateChange()) {
      clearInterval(t);
    }
  }, 50);
})();
