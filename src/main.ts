module Insight {
	export class main extends Phaser.Game
	{
		constructor()
		{
			super(800, 480, Phaser.AUTO, "content", null);

			this.state.add("boot", BootState);
			this.state.add("play", PlayState);

			this.state.start("boot");
		}
	}
}

// when the page has finished loading, create our game
window.onload = () => {
	var game = new Insight.main();
}
