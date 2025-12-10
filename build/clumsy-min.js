var game = {
  data: {
    score: 0,
    steps: 0,
    start: false,
    newHiScore: false,
    muted: false
  },

  resources: [
    { name: "bg", type: "image", src: "data/img/bg.png" },
    { name: "clumsy", type: "image", src: "data/img/clumsy.png" },
    { name: "pipe", type: "image", src: "data/img/pipe.png" },
    { name: "logo", type: "image", src: "data/img/logo.png" },
    { name: "ground", type: "image", src: "data/img/ground.png" },
    { name: "gameover", type: "image", src: "data/img/gameover.png" },
    { name: "gameoverbg", type: "image", src: "data/img/gameoverbg.png" },
    { name: "hit", type: "image", src: "data/img/hit.png" },
    { name: "getready", type: "image", src: "data/img/getready.png" },
    { name: "new", type: "image", src: "data/img/new.png" },
    { name: "share", type: "image", src: "data/img/share.png" },
    { name: "tweet", type: "image", src: "data/img/tweet.png" },
    { name: "theme", type: "audio", src: "data/bgm/" },
    { name: "hit", type: "audio", src: "data/sfx/" },
    { name: "lose", type: "audio", src: "data/sfx/" },
    { name: "wing", type: "audio", src: "data/sfx/" }
  ],

  onload: function () {
    if (!me.video.init(900, 600, { wrapper: "screen", scale: "auto", scaleMethod: "fit" })) {
      alert("Your browser does not support HTML5 canvas.");
      return;
    }
    me.audio.init("mp3,ogg");
    me.loader.preload(game.resources, this.loaded.bind(this));
  },

  loaded: function () {
    me.state.set(me.state.MENU, new game.TitleScreen());
    me.state.set(me.state.PLAY, new game.PlayScreen());
    me.state.set(me.state.GAME_OVER, new game.GameOverScreen());

    me.input.bindKey(me.input.KEY.SPACE, "fly", true);
    me.input.bindKey(me.input.KEY.M, "mute", true);
    me.input.bindPointer(me.input.KEY.SPACE);

    me.pool.register("clumsy", game.BirdEntity);
    me.pool.register("pipe", game.PipeEntity, true);
    me.pool.register("hit", game.HitEntity, true);
    me.pool.register("ground", game.Ground, true);

    me.state.change(me.state.MENU);
  }
};

/* ========= GAME OVER SCREEN ========= */

game.GameOverScreen = me.ScreenObject.extend({

  init: function () {
    this.savedData = null;
    this.handler = null;
    this.telegramSent = false; // ✅ захист від подвійної відправки
  },

  onResetEvent: function () {

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

    me.input.bindKey(me.input.KEY.ENTER, "enter", true);
    me.input.bindKey(me.input.KEY.SPACE, "enter", false);
    me.input.bindPointer(me.input.pointer.LEFT, me.input.KEY.ENTER);

    this.handler = me.event.subscribe(me.event.KEYDOWN, function (action) {
      if (action === "enter") {
        me.state.change(me.state.MENU);
      }
    });

    me.game.world.addChild(
      new me.Sprite(me.game.viewport.width / 2, me.game.viewport.height / 2 - 100, { image: "gameover" }), 12
    );

    var bg = new me.Sprite(
      me.game.viewport.width / 2,
      me.game.viewport.height / 2,
      { image: "gameoverbg" }
    );

    me.game.world.addChild(bg, 10);
    me.game.world.addChild(new BackgroundLayer("bg", 1));

    this.ground1 = me.pool.pull("ground", 0, me.game.viewport.height - 96);
    this.ground2 = me.pool.pull("ground", me.game.viewport.width, me.game.viewport.height - 96);
    me.game.world.addChild(this.ground1, 11);
    me.game.world.addChild(this.ground2, 11);

    if (game.data.newHiScore) {
      me.game.world.addChild(new me.Sprite(bg.width / 2, bg.height / 2, { image: "new" }), 12);
    }

    this.dialog = new (me.Renderable.extend({
      init: function () {
        this._super(me.Renderable, "init", [0, 0, me.game.viewport.width / 2, me.game.viewport.height / 2]);
        this.font = new me.Font("gamefont", 40, "black", "left");
        this.steps = "Steps: " + game.data.steps.toString();
        this.topSteps = "Higher Step: " + me.save.topSteps.toString();
      },

      draw: function (renderer) {
        var stepsText = this.font.measureText(renderer, this.steps);
        this.font.draw(renderer, this.steps,
          me.game.viewport.width / 2 - stepsText.width / 2 - 60,
          me.game.viewport.height / 2
        );

        this.font.draw(renderer, this.topSteps,
          me.game.viewport.width / 2 - stepsText.width / 2 - 60,
          me.game.viewport.height / 2 + 50
        );
      }
    }));

    me.game.world.addChild(this.dialog, 12);

    /* ✅✅✅ ЄДИНЕ МІСЦЕ ВІДПРАВКИ В БОТА ✅✅✅ */
    if (!this.telegramSent) {
      this.telegramSent = true;

      try {
        if (window.Telegram &&
            Telegram.WebApp &&
            typeof Telegram.WebApp.sendData === "function") {

          Telegram.WebApp.sendData(JSON.stringify({
            game: "clickgame",
            score: Number(game.data.steps) || 0
          }));

          alert("✅ Score sent to bot: " + game.data.steps);
        } else {
          alert("❌ Telegram WebApp API NOT FOUND");
        }
      } catch (e) {
        alert("❌ Telegram sendData ERROR: " + e);
      }
    }
  },

  onDestroyEvent: function () {
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
