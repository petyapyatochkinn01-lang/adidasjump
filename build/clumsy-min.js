/* ===== Clumsy Bird + Telegram WebApp FINAL ===== */

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

/* ===== ENTITIES (ORIGINAL) ===== */
/* ... (BirdEntity, PipeEntity, HUD, TitleScreen, PlayScreen) */
/* ⬆️ НІЧОГО НЕ ЗМІНЮВАЛОСЯ */

/* ===== GAME OVER SCREEN (TELEGRAM FIX) ===== */

game.GameOverScreen = me.ScreenObject.extend({

  init: function () {
    this.handler = null;
  },

  onResetEvent: function () {

    me.save.add({ steps: game.data.steps });

    if (!me.save.topSteps) me.save.add({ topSteps: game.data.steps });
    if (game.data.steps > me.save.topSteps) {
      me.save.topSteps = game.data.steps;
      game.data.newHiScore = true;
    }

    me.game.world.addChild(
      new me.Sprite(
        me.game.viewport.width / 2,
        me.game.viewport.height / 2 - 100,
        { image: "gameover" }
      ),
      12
    );

    var bg = new me.Sprite(
      me.game.viewport.width / 2,
      me.game.viewport.height / 2,
      { image: "gameoverbg" }
    );
    me.game.world.addChild(bg, 10);

    this.dialog = new (me.Renderable.extend({
      init: function () {
        this._super(me.Renderable, "init", [0, 0, 100, 100]);
        this.font = new me.Font("gamefont", 40, "black", "left");
      },
      draw: function (r) {
        this.font.draw(
          r,
          "Score: " + game.data.steps,
          me.game.viewport.width / 2 - 120,
          me.game.viewport.height / 2
        );
      }
    }))();

    me.game.world.addChild(this.dialog, 12);

    /* 🔥 ЄДИНИЙ ПРАВИЛЬНИЙ TELEGRAM FLOW */
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();

      Telegram.WebApp.MainButton.setText("Зарахувати результат");
      Telegram.WebApp.MainButton.show();

      Telegram.WebApp.MainButton.onClick(function () {
        Telegram.WebApp.sendData(JSON.stringify({
          game: "clickgame",
          score: Number(game.data.steps) || 0
        }));
        Telegram.WebApp.close();
      });
    }
  },

  onDestroyEvent: function () {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.MainButton.hide();
    }
    me.event.unsubscribe(this.handler);
  }
});
