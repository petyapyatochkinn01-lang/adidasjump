/**
 * Telegram WebApp bridge for melonJS game.
 * Strategy: patch me.state.change so we can detect transition to GAME_OVER
 * and immediately Telegram.WebApp.sendData({game:'clickgame', score: steps}).
 *
 * This avoids brittle patching of GameOverScreen implementations.
 */
(function () {
  "use strict";

  var sentForRound = false;
  var lastScoreSent = null;

  function tgAvailable() {
    return (
      window.Telegram &&
      Telegram.WebApp &&
      typeof Telegram.WebApp.sendData === "function"
    );
  }

  function tgReady() {
    if (window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.ready === "function") {
      try { Telegram.WebApp.ready(); } catch (e) {}
    }
    if (window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.expand === "function") {
      try { Telegram.WebApp.expand(); } catch (e) {}
    }
  }

  function getScore() {
    var s = 0;
    try {
      s = Number(window.game && game.data && game.data.steps) || 0;
    } catch (e) {
      s = 0;
    }
    return s;
  }

  function sendScore(reason) {
    if (!tgAvailable()) {
      console.log("Telegram patch: Telegram.WebApp API not available");
      return;
    }

    var score = getScore();

    // do not spam: send once per round; also avoid sending same score twice
    if (sentForRound && score === lastScoreSent) {
      return;
    }

    sentForRound = true;
    lastScoreSent = score;

    console.log("Telegram patch: sending score =", score, "reason =", reason);

    try {
      Telegram.WebApp.sendData(
        JSON.stringify({
          game: "clickgame",
          score: score
        })
      );
    } catch (e) {
      console.log("Telegram patch: error while sending score:", e);
    }
  }

  function install() {
    if (!window.me || !me.state || typeof me.state.change !== "function") return false;

    tgReady();

    var originalChange = me.state.change.bind(me.state);

    me.state.change = function (state) {
      // If a new round starts, allow sending again
      try {
        if (state === me.state.PLAY) {
          sentForRound = false;
          lastScoreSent = null;
        }
      } catch (e) {}

      var result = originalChange(state);

      // Send score when entering GAME_OVER
      try {
        if (state === me.state.GAME_OVER) {
          // slight delay to ensure game.data.steps is final
          setTimeout(function () { sendScore("state_change_GAME_OVER"); }, 50);
        }
      } catch (e) {}

      return result;
    };

    console.log("Telegram patch: me.state.change patched");
    return true;
  }

  // Wait until melonJS is ready
  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    if (install() || tries > 200) {
      clearInterval(timer);
      if (tries > 200) {
        console.log("Telegram patch: failed to patch (me.state not ready)");
      }
    }
  }, 50);

  // Extra safety: when WebApp is being closed, attempt to send once if not already.
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      // only send if we ended a round and haven't sent yet
      // (if user closes at GAME_OVER screen, this is a last chance)
      if (!sentForRound) {
        // if score is 0 we still send 0; bot will treat it as a game played.
        sendScore("visibility_hidden");
      }
    }
  });
})();
