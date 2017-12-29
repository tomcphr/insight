window.onload = function () {
    var playState = {
        preload: function () {
            game.load.image("grass", "assets/sprites/grass.png");
            game.load.image("dirt", "assets/sprites/dirt.png");
            game.load.image("stone", "assets/sprites/stone.png");
            game.load.image("bedrock", "assets/sprites/bedrock.png");

            game.load.image("player", "assets/sprites/player.png");
            game.load.image("enemy", "assets/sprites/enemy.png");

            game.time.advancedTiming = true;
        },

        create: function () {
            game.stage.backgroundColor = "#87CEFA";

            game.world.setBounds(0, 0, 2000, 1000);

            // Start the Arcade physics system (for movements and collisions)
            game.physics.startSystem(Phaser.Physics.ARCADE);

            // Add the physics engine to all game objects
            game.world.enableBody = true;

            // Variable to store the arrow key pressed
            this.cursor = game.input.keyboard.createCursorKeys();

            // Create the player in the middle of the game
            this.player = game.add.sprite(game.world.centerX, game.world.centerY, "player");
            this.player.body.collideWorldBounds = true;

            // Add gravity to make it fall
            this.player.body.gravity.y = 900;

            game.camera.follow(this.player);

            this.blocks = this.add.group();

            handleLevel(this, game);
        },

        update: function () {
            handleCollision(this, game);

            handleMovement(this, game);

            game.world.wrap(this.player, 0, true);
        },

        restart: function () {
            game.state.start("play");
        },

        render: function () {
            game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
        }
    };

    var width = 480;
    var height = 320;

    var game = new Phaser.Game(width, height, Phaser.CANVAS);

    game.state.add("play", playState);

    game.state.start("play");
}


function handleMovement(phaser, game)
{
    var movementSpeed = 200;

    phaser.player.body.velocity.x = 0;

    if (phaser.cursor.left.isDown) {
        phaser.player.body.velocity.x = -movementSpeed;
    } else if (phaser.cursor.right.isDown) {
        phaser.player.body.velocity.x = movementSpeed;
    }

    var jumpingSpeed = 250;

    // Make the player jump if he is touching the ground
    if (phaser.cursor.up.isDown && phaser.player.body.touching.down) {
        phaser.player.body.velocity.y = -jumpingSpeed;
    }
}


function handleLevel(phaser, game)
{
    var levels = {
        "grass"     :   1,
        "dirt"      :   10,
        "stone"     :   15,
        "bedrock"   :   10,
    };

    var worldWidth = game.world.bounds.width;

    var localChunkX = phaser.player.x - (worldWidth / 2);
    var localChunkY = game.world.centerY + 32;

    var blockSize = 16;

    var totalBlocks = Math.ceil((worldWidth / blockSize) * 1) / 1;

    var depth = 0;
    for (var level in levels) {
        var rows = levels[level];

        for (var row = 0; row < rows; row++) {
            for (var block = 0; block < totalBlocks; block++) {
                var blockX = localChunkX + (block * blockSize);
                var blockY = localChunkY + (depth * blockSize);

                // Ensure that no block already exists at the X and Y coords
                if (!getBlockInformation(phaser, blockX, blockY)) {
                    var sprite = phaser.add.sprite(blockX, blockY, level);
                    sprite.body.immovable = true;
                    // Allow blocks to be destroyed if it isn't bedrock
                    if (level != "bedrock") {
                        sprite.inputEnabled = true;
                        sprite.events.onInputDown.add(function (sprite) {
                            phaser.blocks.remove(sprite);
                            sprite.destroy();
                        }, this);
                    }
                    phaser.blocks.add(sprite);
                }
            }

            depth++;
        }
    }
}


function handleCollision(phaser, game)
{
    game.physics.arcade.collide(phaser.player, phaser.blocks);
}


/**
 * Check if a block sprite exists at a x and y placement.
 */
function getBlockInformation(phaser, x, y)
{
    var data = false;
    for (var i = 0; i < phaser.blocks.length; i++) {
        var element = phaser.blocks.getAt(i).body;
        if (element.x != x || element.y != y) {
            continue;
        }
        data = true;
    }

    return data;
}
