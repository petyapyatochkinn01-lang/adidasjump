(function () {
  function sendScoreOnce() {
    if (!window.Telegram || !Telegram.WebApp) {
      alert("Telegram WebApp API not found");
      return;
    }

    Telegram.WebApp.sendData(JSON.stringify({
      game: "clickgame",
      score: game.data.steps
    }));

    Telegram.WebApp.close();
  }

  // додаємо кнопку ТІЛЬКИ коли Game Over
  me.event.subscribe(me.event.STATE_CHANGE, function (state) {
    if (state === me.state.GAME_OVER) {
      setTimeout(() => {
        if (document.getElementById("sendScoreBtn")) return;

        const btn = document.createElement("button");
        btn.id = "sendScoreBtn";
        btn.innerText = "Забрати результат";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.left = "50%";
        btn.style.transform = "translateX(-50%)";
        btn.style.padding = "12px 24px";
        btn.style.fontSize = "18px";
        btn.style.zIndex = 9999;

        btn.onclick = sendScoreOnce;
        document.body.appendChild(btn);
      }, 500);
    }
  });
})();
