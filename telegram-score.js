// telegram-score.js
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

  function canUseTelegram() {
    return !!(window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.sendData === "function");
  }

  function sendScoreOnce(score) {
    score = Number(score) || 0;

    // Avoid duplicates in same WebView session
    if (window.__tg_score_sent_for_steps === score && window.__tg_score_sent_ts && (Date.now() - window.__tg_score_sent_ts) < 3000) {
      return;
    }
    window.__tg_score_sent_for_steps = score;
    window.__tg_score_sent_ts = Date.now();

    try {
      if (!canUseTelegram()) {
        log("[TG] Telegram.WebApp.sendData not available");
        toast("Telegram WebApp API not available");
        return;
      }

      // Recommended lifecycle call (no-op if already ready)
      if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();

      var payload = { game: "clickgame", score: score, ts: Date.now() };
      Telegram.WebApp.sendData(JSON.stringify(payload));

      // NOTE: sendData may auto-close the WebApp. Do NOT call Telegram.WebApp.close() here.
      log("[TG] score sent:", score);
      toast("Score sent: " + score);
    } catch (e) {
      log("[TG] sendScore error:", e);
      toast("sendScore error: " + e);
    }
  }

  function patchStateChange() {
    if (!window.me || !me.state || !window.game) return false;

    var orig = me.state.change;
    if (orig && !orig.__tg_patched) {
      me.state.change = function (state) {
        // call original first: the engine may mutate game.data.steps during transition
        var r = orig.apply(this, arguments);

        try {
          if (state === me.state.GAME_OVER) {
            // Prefer steps as "score"
            var steps = (game && game.data) ? game.data.steps : 0;
            sendScoreOnce(steps);
          }
        } catch (e) {
          log("[TG] state.change hook error:", e);
        }
        return r;
      };
      me.state.change.__tg_patched = true;
      log("[TG] state.change patched");
      return true;
    }
    return false;
  }

  // Wait up to 10s for melonJS + game to be ready
  var start = Date.now();
  var t = setInterval(function () {
    if (patchStateChange()) {
      clearInterval(t);
      return;
    }
    if (Date.now() - start > 10000) {
      clearInterval(t);
      log("[TG] patch timeout: me/game not ready");
    }
  }, 100);
})();