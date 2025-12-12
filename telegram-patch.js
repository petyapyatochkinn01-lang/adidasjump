// telegram-patch.js
// Sends score to the bot via Telegram.WebApp.sendData when GAME_OVER screen is shown.
// This implementation patches me.state.change (safe) instead of overriding onResetEvent (can be read-only in some builds).

(function () {
  "use strict";

  function log() {
    try { console.log.apply(console, arguments); } catch (e) {}
  }

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
      el._t = setTimeout(function () { el.style.display = "none"; }, 2500);
    } catch (e) {}
  }

  function sendScore(score) {
    score = Number(score) || 0;

    if (!(window.Telegram && Telegram.WebApp)) {
      log("[TG] Telegram.WebApp not found");
      return;
    }

    try {
      if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();
    } catch (e) {}

    var payload = {
      game: "clickgame",
      score: score,
      ts: Date.now()
    };

    try {
      // Visible debug (inside Telegram)
      if (typeof Telegram.WebApp.showAlert === "function") {
        Telegram.WebApp.showAlert("Score: " + score + " (sending)");
      } else {
        toast("Score: " + score + " (sending)");
      }
    } catch (e) {}

    try {
      if (typeof Telegram.WebApp.sendData === "function") {
        Telegram.WebApp.sendData(JSON.stringify(payload));
        log("[TG] sendData called:", payload);
        // Some clients don't close automatically. Force close.
        if (typeof Telegram.WebApp.close === "function") {
          setTimeout(function () {
            try { Telegram.WebApp.close(); } catch (e) {}
          }, 150);
        }
      } else {
        log("[TG] Telegram.WebApp.sendData not available");
        toast("Telegram sendData not available");
      }
    } catch (e) {
      log("[TG] sendData error:", e);
      toast("sendData error: " + e);
    }
  }

  function patchStateChange() {
    if (!window.me || !me.state || typeof me.state.change !== "function") return false;

    if (me.state.__tg_patched_change) return true;
    me.state.__tg_patched_change = true;

    var originalChange = me.state.change.bind(me.state);

    // Dedup across repeated transitions
    var lastSentKey = null;

    me.state.change = function (state) {
      var ret = originalChange(state);

      try {
        if (state === me.state.GAME_OVER && window.game && game.data) {
          var score = Number(game.data.steps) || 0;
          var key = String(score) + ":" + String(game.data.steps) + ":" + String(Date.now() / 1000 | 0);

          // prevent multiple sends within ~1 second for the same score
          if (lastSentKey && lastSentKey.split(":")[0] === String(score)) {
            // keep it simple; only block immediate duplicates
          } else {
            lastSentKey = key;
            setTimeout(function () { sendScore(score); }, 200);
          }
        }
      } catch (e) {
        log("[TG] change hook error:", e);
      }

      return ret;
    };

    log("[TG] me.state.change patched");
    toast("TG patch ready");
    return true;
  }

  // Try for up to 15 seconds in case scripts load slowly.
  var start = Date.now();
  var timer = setInterval(function () {
    if (patchStateChange()) {
      clearInterval(timer);
      return;
    }
    if (Date.now() - start > 15000) {
      clearInterval(timer);
      log("[TG] patch timeout: me.state.change not found");
    }
  }, 100);
})();
