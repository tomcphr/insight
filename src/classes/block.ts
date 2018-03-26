module Insight {
    export class Block extends Phaser.Sprite {
        block: string;

        resistance: object = {
            "grass"      :    1,
            "dirt"       :    1,
            "stone"      :    1000,
        };

        constructor (game: Phaser.Game, x: number, y: number, block: string) {
            super(game, x, y, block);

            this.block = block;
        }

        getResistance () {
            if (!(this.block in this.resistance)) {
                return 0;
            }

            return this.resistance[this.block];
        }
    }
}
