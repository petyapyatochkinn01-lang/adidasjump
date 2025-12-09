game.GameOverScreen = me.ScreenObject.extend({
    init: function () {
        this.savedData = null;
        this.handler = null;

        // ✅ ЗАХИСТ ВІД ПОВТОРНОЇ ВІДПРАВКИ
        this.telegramSent = false;
    },

    onResetEvent: function () {
        // save section
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

        // GAME OVER спрайт
        me.game.world.addChild(new me.Sprite(
            me.game.viewport.width / 2,
            me.game.viewport.height / 2 - 100,
            { image: "gameover" }
        ), 12);

        var gameOverBG = new me.Sprite(
            me.game.viewport.width / 2,
            me.game.viewport.height / 2,
            { image: "gameoverbg" }
        );
        me.game.world.addChild(gameOverBG, 10);

        me.game.world.addChild(new BackgroundLayer("bg", 1));

        // ground
        this.ground1 = me.pool.pull("ground", 0, me.game.viewport.height - 96);
        this.ground2 = me.pool.pull(
            "ground",
            me.game.viewport.width,
            me.video.renderer.getHeight() - 96
        );
        me.game.world.addChild(this.ground1, 11);
        me.game.world.addChild(this.ground2, 11);

        // NEW HI-SCORE
        if (game.data.newHiScore) {
            var newRect = new me.Sprite(
                gameOverBG.width / 2,
                gameOverBG.height / 2,
                { image: "new" }
            );
            me.game.world.addChild(newRect, 12);
        }

        // Діалог з результатами
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

                this.font.draw(
                    renderer,
                    this.steps,
                    me.game.viewport.width / 2 - stepsText.width / 2 - 60,
                    me.game.viewport.height / 2
                );

                this.font.draw(
                    renderer,
                    this.topSteps,
                    me.game.viewport.width / 2 - topStepsText.width / 2 - 60,
                    me.game.viewport.height / 2 + 50
                );
            }
        }));
        me.game.world.addChild(this.dialog, 12);

        // ✅✅✅ ГАРАНТОВАНИЙ РЕДІРЕКТ У БОТА З SCORE ✅✅✅
        if (!this.telegramSent) {
            this.telegramSent = true;

            var score = Number(game.data.steps) || 0;

            var botUrl = "https://t.me/adidas2026bot?start=score_" + score;

            console.log("✅ Redirect to bot with score:", score);
            window.location.href = botUrl;
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
