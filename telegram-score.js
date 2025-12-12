// telegram-score.js
(function () {
  "use strict";

  // === CONFIG ===
  // Put your bot username here (without @). It must match your real bot.
  var BOT_USERNAME = "adidas2026bot";

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
      el._t = setTimeout(function () { el.style.display = "none"; }, 3500);
    } catch (e) {}
  }

  function safeNumber(x) {
    var n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Preferred: open deep-link to bot with /start score_<N>
   * Fallback: Telegram.WebApp.sendData (if allowed/works)
   */
  function sendScoreToBot(score) {
    score = safeNumber(score);

    if (!window.Telegram || !Telegram.WebApp) {
      console.log("[TG] Telegram.WebApp not found");
      toast("Telegram.WebApp not found");
      return;
    }

    try {
      if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();
    } catch (e) {}

    var payload = "score_" + String(Math.max(0, Math.floor(score)));
    var link = "https://t.me/" + BOT_USERNAME + "?start=" + encodeURIComponent(payload);

    // Visible debug for you
    toast("Sent score: " + score);

    // 1) Deep link (most reliable across Telegram clients)
    if (typeof Telegram.WebApp.openTelegramLink === "function") {
      console.log("[TG] openTelegramLink:", link);
      Telegram.WebApp.openTelegramLink(link);

      // Close after a short delay (gives Telegram time to process the link)
      setTimeout(function () {
        try { Telegram.WebApp.close(); } catch (e) {}
      }, 400);

      return;
    }

    // 2) Fallback: sendData
    if (typeof Telegram.WebApp.sendData === "function") {
      try {
        Telegram.WebApp.sendData(JSON.stringify({
          game: "clickgame",
          score: score,
          ts: Date.now()
        }));
        console.log("[TG] sendData called. score=", score);
      } catch (e) {
        console.log("[TG] sendData error:", e);
      }

      // Close after delay
      setTimeout(function () {
        try { Telegram.WebApp.close(); } catch (e) {}
      }, 400);

      return;
    }

    console.log("[TG] No openTelegramLink/sendData available");
    toast("No Telegram send method");
  }

  // Patch me.state.change to detect GAME_OVER reliably
  function patchStateChange() {
    if (!window.me || !me.state || typeof me.state.change !== "function") return false;
    if (me.state.__tg_patched_change) return true;

    var original = me.state.change;
    me.state.__tg_patched_change = true;

    me.state.change = function (state) {
      var res = original.apply(this, arguments);

      try {
        // GAME_OVER is usually a numeric constant; compare with me.state.GAME_OVER
        if (state === me.state.GAME_OVER) {
          var steps = (window.game && game.data) ? game.data.steps : 0;
          // prevent multiple sends for same game over screen
          if (!me.state.__tg_sent_once) {
            me.state.__tg_sent_once = true;
            sendScoreToBot(steps);
          }
        } else if (state === me.state.PLAY) {
          // reset when a new game starts
          me.state.__tg_sent_once = false;
        }
      } catch (e) {
        console.log("[TG] patch handler error:", e);
      }

      return res;
    };

    console.log("[TG] state.change patched");
    return true;
  }

  // Retry patching for 10s (scripts can load slowly)
  var start = Date.now();
  var t = setInterval(function () {
    if (patchStateChange()) {
      clearInterval(t);
      return;
    }
    if (Date.now() - start > 10000) {
      clearInterval(t);
      console.log("[TG] patch timeout: me.state not ready");
    }
  }, 100);
})();
