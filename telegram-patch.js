// telegram-patch.js
(function () {
  "use strict";

  function toast(msg) {
    try {
      var el = document.getElementById("tg-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "tg-toast";
        el.style.position = "fixed";
        el.style.left = "50%";
        el.style.bottom = "16px";
        el.style.transform = "translateX(-50%)";
        el.style.background = "rgba(0,0,0,0.75)";
        el.style.color = "#fff";
        el.style.padding = "10px 14px";
        el.style.borderRadius = "10px";
        el.style.font = "14px/1.3 sans-serif";
        el.style.zIndex = "999999";
        el.style.maxWidth = "90%";
        el.style.textAlign = "center";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.display = "block";
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.style.display = "none"; }, 4000);
    } catch (e) {}
  }

  function sendScore(score) {
    score = Number(score) || 0;

    try {
      if (window.Telegram && Telegram.WebApp) {
        // recommended by Telegram
        if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();

        // show something visible for debugging
        if (typeof Telegram.WebApp.showAlert === "function") {
          Telegram.WebApp.showAlert("Score: " + score + " (sending to bot)");
        } else {
          toast("Score: " + score + " (sending to bot)");
        }

        if (typeof Telegram.WebApp.sendData === "function") {
          Telegram.WebApp.sendData(JSON.stringify({
            game: "clickgame",
            score: score,
            ts: Date.now()
          }));
          // sendData normally closes the WebApp; if it doesn't, at least we showed the toast/alert.
          console.log("Telegram patch: sendData called, score=", score);
        } else {
          console.log("Telegram patch: Telegram.WebApp.sendData not available");
          toast("Telegram WebApp sendData not available");
        }
      } else {
        console.log("Telegram patch: Telegram.WebApp not found");
      }
    } catch (e) {
      console.log("Telegram patch: sendScore error:", e);
      toast("sendScore error: " + e);
    }
  }

  function patchOnce() {
    if (!window.game || !window.me) return false;
    if (!game.GameOverScreen) return false;

    // Patch prototype
    var proto = game.GameOverScreen.prototype;
    if (proto && !proto.__tg_patched && typeof proto.onResetEvent === "function") {
      var original = proto.onResetEvent;
      proto.__tg_patched = true;

      proto.onResetEvent = function () {
        original.apply(this, arguments);

        // protect from multiple sends during same screen
        if (this.__tg_sent) return;
        this.__tg_sent = true;

        // prefer steps as "coins"
        sendScore(game && game.data ? game.data.steps : 0);
      };

      console.log("Telegram patch: GameOverScreen.prototype patched");
      toast("Telegram patch: GameOver patched");
    }

    // Also patch already-created instance stored in melonJS state (important!)
    try {
      if (me.state && me.state._states && me.state._states[me.state.GAME_OVER]) {
        var inst = me.state._states[me.state.GAME_OVER];
        if (inst && !inst.__tg_patched_inst && typeof inst.onResetEvent === "function") {
          var orig2 = inst.onResetEvent;
          inst.__tg_patched_inst = true;
          inst.onResetEvent = function () {
            orig2.apply(this, arguments);
            if (this.__tg_sent) return;
            this.__tg_sent = true;
            sendScore(game && game.data ? game.data.steps : 0);
          };
          console.log("Telegram patch: GAME_OVER instance patched");
        }
      }
    } catch (e) {}

    return true;
  }

  // Keep trying for up to 10 seconds in case scripts load slowly.
  var start = Date.now();
  var timer = setInterval(function () {
    if (patchOnce()) {
      clearInterval(timer);
      return;
    }
    if (Date.now() - start > 10000) {
      clearInterval(timer);
      console.log("Telegram patch: timeout waiting for game/me/GameOverScreen");
    }
  }, 100);
})();
