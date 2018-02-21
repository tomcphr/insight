module Insight {
	export class Player extends Phaser.Sprite {
        game: Phaser.Game;
        drop: object = {};
        dropThreshold: number = 5;

        constructor (game: Phaser.Game, x: number, y: number) {
            super(game, x, y, "player");

            this.animations.add("walk", [1, 2, 3], 7, true);

            this.anchor.setTo(.5, .5);

            this.game = game;
        }

        startDrop () {
            this.drop[0] = this.y;
        }

        endDrop () {
            this.drop[1] = this.y;
        }

        getDrop (type: number) {
            var keys = Object.keys(this.drop);
            if (!keys.length) {
                return false;
            }

            return this.drop[type];
        }

        resetDrop () {
            this.drop = {};
        }
	}
}
