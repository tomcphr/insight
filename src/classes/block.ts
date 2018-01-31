module Insight {
	export class Block extends Phaser.Sprite {
        constructor (game: Phaser.Game, x: number, y: number, type: string) {
            super(game, x, y, type);
        }
	}
}
