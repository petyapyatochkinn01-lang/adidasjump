// telegram-patch.js
(function () {
  "use strict";

  var sentForRun = false; // щоб не відправляти двічі за один програш

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

  function sendScore(score) {
    score = Number(score) || 0;

    try {
      if (!(window.Telegram && Telegram.WebApp)) {
        console.log("[TG] Telegram.WebApp not found");
        toast("[TG] Telegram.WebApp not found");
        return;
      }

      if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();

      if (sentForRun) {
        console.log("[TG] skip duplicate send");
        return;
      }
      sentForRun = true;

      var payload = {
        game: "clickgame",
        score: score,
        ts: Date.now()
      };

      console.log("[TG] sending:", payload);
      toast("[TG] sending score: " + score);

      if (typeof Telegram.WebApp.sendData === "function") {
        Telegram.WebApp.sendData(JSON.stringify(payload));
        console.log("[TG] sendData called");
      } else {
        console.log("[TG] sendData not available");
        toast("[TG] sendData not available");
      }
    } catch (e) {
      console.log("[TG] sendScore error:", e);
      toast("[TG] sendScore error: " + e);
    }
  }

  function patchGameOverPrototype() {
    if (!window.game || !window.me) return false;
    if (!game.GameOverScreen || !game.GameOverScreen.prototype) return false;

    var proto = game.GameOverScreen.prototype;
    if (proto.__tg_patched) return true;

    if (typeof proto.onResetEvent !== "function") return false;

    var original = proto.onResetEvent;
    proto.__tg_patched = true;

    proto.onResetEvent = function () {
      // новий програш = нова відправка
      sentForRun = false;

      original.apply(this, arguments);

      // game.data.steps вже фінальні
      var steps = (game && game.data) ? game.data.steps : 0;
      sendScore(steps);
    };

    console.log("[TG] GameOverScreen.prototype patched");
    toast("[TG] patched: GameOverScreen");
    return true;
  }

  function patchStateChange() {
    if (!window.me || !me.state || typeof me.state.change !== "function") return false;
    if (me.state.__tg_patched_change) return true;

    var origChange = me.state.change;
    me.state.__tg_patched_change = true;

    me.state.change = function (stateId) {
      // якщо йдемо в GAME_OVER — готуємо відправку
      if (stateId === me.state.GAME_OVER) {
        // трошки пізніше, щоб steps точно були встановлені
        setTimeout(function () {
          try {
            var steps = (window.game && game.data) ? game.data.steps : 0;
            // НЕ скидаємо sentForRun тут, бо це може спрацювати разом з onResetEvent.
            // Просто відправимо, якщо ще не відправляли.
            if (!sentForRun) sendScore(steps);
          } catch (e) {}
        }, 50);
      }
      return origChange.apply(this, arguments);
    };

    console.log("[TG] me.state.change patched");
    toast("[TG] patched: state.change");
    return true;
  }

  function initTelegramUi() {
    try {
      if (window.Telegram && Telegram.WebApp) {
        if (typeof Telegram.WebApp.expand === "function") Telegram.WebApp.expand();
        if (typeof Telegram.WebApp.ready === "function") Telegram.WebApp.ready();
      }
    } catch (e) {}
  }

  initTelegramUi();

  var start = Date.now();
  var timer = setInterval(function () {
    patchStateChange();
    if (patchGameOverPrototype()) {
      // залишаємо state.change, але зупиняємо цикл
      clearInterval(timer);
      return;
    }
    if (Date.now() - start > 10000) {
      clearInterval(timer);
      console.log("[TG] patch timeout (game/me not ready)");
      toast("[TG] patch timeout");
    }
  }, 100);
})();
