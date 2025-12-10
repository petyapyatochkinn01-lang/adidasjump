/* ========= GAME OVER SCREEN ========= */

game.GameOverScreen = me.ScreenObject.extend({

  init: function () {
    this.savedData = null;
    this.handler = null;
  },

  onResetEvent: function () {
    // ---------- збереження результату ----------
    this.savedData = {
      score: game.data.score,
      steps: game.data.steps
    };
    me.save.add(this.savedData);

    if (!me.save.topSteps) {
      me.save.add({ topSteps: game.data.steps });
    }
    if (game.data.steps > me.save.topSteps) {
      me.save.topSteps = game.data.steps;
      game.data.newHiScore = true;
    }

    // ---------- клавіші ----------
    me.input.bindKey(me.input.KEY.ENTER, "enter", true);
    me.input.bindKey(me.input.KEY.SPACE, "enter", false);
    me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

    var self = this;
    this.handler = me.event.subscribe(me.event.KEYDOWN, function (action) {
      if (action === "enter") {
        me.state.change(me.state.MENU);
      }
    });

    // ---------- спрайт GAME OVER ----------
    me.game.world.addChild(
      new me.Sprite(
        me.game.viewport.width / 2,
        me.game.viewport.height / 2 - 100,
        { image: "gameover" }
      ),
      12
    );

    // ---------- фонове вікно ----------
    var gameOverBG = new me.Sprite(
      me.game.viewport.width / 2,
      me.game.viewport.height / 2,
      { image: "gameoverbg" }
    );
    me.game.world.addChild(gameOverBG, 10);

    // бекграунд + земля
    me.game.world.addChild(new BackgroundLayer("bg", 1));

    this.ground1 = me.pool.pull("ground", 0, me.game.viewport.height - 96);
    this.ground2 = me.pool.pull(
      "ground",
      me.game.viewport.width,
      me.video.renderer.getHeight() - 96
    );
    me.game.world.addChild(this.ground1, 11);
    me.game.world.addChild(this.ground2, 11);

    // NEW HI-SCORE бейдж
    if (game.data.newHiScore) {
      var newRect = new me.Sprite(
        gameOverBG.width / 2,
        gameOverBG.height / 2,
        { image: "new" }
      );
      me.game.world.addChild(newRect, 12);
    }

    // ---------- текст з результатами ----------
    this.dialog = new (me.Renderable.extend({
      init: function () {
        this._super(
          me.Renderable,
          "init",
          [0, 0, me.game.viewport.width / 2, me.game.viewport.height / 2]
        );
        this.font = new me.Font("gamefont", 40, "black", "left");
        this.steps = "Steps: " + game.data.steps.toString();
        this.topSteps = "Higher Step: " + me.save.topSteps.toString();
      },

      draw: function (renderer) {
        var stepsText = this.font.measureText(renderer, this.steps);
        var topStepsText = this.font.measureText(renderer, this.topSteps);

        // поточні кроки
        this.font.draw(
          renderer,
          this.steps,
          me.game.viewport.width / 2 - stepsText.width / 2 - 60,
          me.game.viewport.height / 2
        );

        // рекорд
        this.font.draw(
          renderer,
          this.topSteps,
          me.game.viewport.width / 2 - topStepsText.width / 2 - 60,
          me.game.viewport.height / 2 + 50
        );
      }
    }))();
    me.game.world.addChild(this.dialog, 12);

    // ---------- ЄДИНА ВІДПРАВКА РЕЗУЛЬТАТУ В TELEGRAM ----------
    try {
      if (window.Telegram &&
          Telegram.WebApp &&
          typeof Telegram.WebApp.sendData === "function") {

        var scoreToSend = Number(game.data.steps) || 0;

        // В браузері побачиш alert, у Telegram може не показатися – це нормально.
        // Головне - sendData.
        alert("DEBUG: sending score to bot: " + scoreToSend);

        Telegram.WebApp.sendData(JSON.stringify({
          game: "clickgame",
          score: scoreToSend
        }));

        console.log("Score sent to Telegram:", scoreToSend);
      } else {
        console.log("Telegram.WebApp API not found - probably not in WebApp");
      }
    } catch (e) {
      console.log("Telegram sendData error:", e);
    }
  },

  onDestroyEvent: function () {
    // прибираємо обробники
    me.event.unsubscribe(this.handler);
    me.input.unbindKey(me.input.KEY.ENTER);
    me.input.unbindKey(me.input.KEY.SPACE);
    me.input.unbindPointer(me.input.pointer.LEFT);

    this.ground1 = null;
    this.ground2 = null;
    this.font = null;
    me.audio.stop("theme");
  }
});
