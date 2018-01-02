window.onload = function () {
    var game = new Phaser.Game(800, 480, Phaser.AUTO, "playArea");

    game.state.add("play", play);

    game.state.start("play");
}
