module Insight {
	export class BootState extends Phaser.State {
		preload() {
			this.game.load.image("air", "assets/sprites/blocks/air.png");
			this.game.load.image("grass", "assets/sprites/blocks/grass.png");
			this.game.load.image("dirt", "assets/sprites/blocks/dirt.png");
			this.game.load.image("stone", "assets/sprites/blocks/stone.png");
			this.game.load.image("bedrock", "assets/sprites/blocks/bedrock.png");

			this.game.load.spritesheet("player", "assets/sprites/player.png", 32, 62, 3);

			this.game.load.image("item_slot", "assets/ui/item_slot_frame.png");
			this.game.load.image("item_equip", "assets/ui/item_equip_frame.png");

			this.game.load.image("pickaxe", "assets/sprites/tools/pickaxe.png");
		}

		create() {
			this.input.maxPointers = 1;

			this.game.state.start("play", true, false);
		}
	}
}
