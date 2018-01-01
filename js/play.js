window.onload = function () {
    var playState = {
        preload: function () {
            game.load.image("grass", "assets/sprites/grass.png");
            game.load.image("dirt", "assets/sprites/dirt.png");
            game.load.image("stone", "assets/sprites/stone.png");
            game.load.image("bedrock", "assets/sprites/bedrock.png");

            game.load.image("player", "assets/sprites/player.png");
            game.load.image("enemy", "assets/sprites/enemy.png");

            game.load.image("item_slot", "assets/ui/item_slot_frame.png");

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
            this.player.body.gravity.y = 950;

            game.camera.follow(this.player);

            this.blocks = this.add.group();

            this.inventory = {};

            this.itemSlots = {};

            handleLevel(this, game);
        },

        update: function () {
            handleCollision(this, game);

            handleMovement(this, game);
        },

        render: function () {
            game.debug.text(game.time.fps || '--', 5, height - 10, "#00ff00");
        }
    };

    var width = 480;
    var height = 320;

    var game = new Phaser.Game(width, height, Phaser.CANVAS);

    game.state.add("play", playState);

    game.state.start("play");
}


/**
 *
 */
function handleMovement(phaser, game)
{
    var movementSpeed = 250;

    phaser.player.body.velocity.x = 0;

    if (phaser.cursor.left.isDown) {
        phaser.player.body.velocity.x = -movementSpeed;
    } else if (phaser.cursor.right.isDown) {
        phaser.player.body.velocity.x = movementSpeed;
    }

    var jumpingSpeed = 280;

    // Make the player jump if he is touching the ground
    if (phaser.cursor.up.isDown && phaser.player.body.touching.down) {
        phaser.player.body.velocity.y = -jumpingSpeed;
    }
}


/**
 *
 */
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
                        sprite.events.onInputDown.add(function (sprite, pointer) {
                            var blockX = sprite.x;
                            var playerX = phaser.player.x;
                            var blocksAwayX = ((blockX - playerX) / 16) | 0;

                            var blockY = sprite.y;
                            var playerY = phaser.player.y;
                            var blocksAwayY = ((blockY - playerY) / 16) | 0;

                            if (blocksAwayX > 1 || blocksAwayX < -1) {
                                return;
                            }

                            if (blocksAwayY > 1 || blocksAwayY < -1) {
                                return;
                            }

                            phaser.blocks.remove(sprite);

                            var item = sprite.key;
                            if (!(item in phaser.inventory)) {
                                phaser.inventory[item] = 0;

                                var startX = 5;

                                var positions = [];

                                $.each(phaser.itemSlots, function (key, object) {
                                    positions.push(object.startX);
                                });

                                if (positions.length > 0) {
                                    var maxPos = Math.max.apply(Math, positions);
                                    startX = maxPos + 45;
                                }

                                phaser.itemSlots[item] = {
                                    "frame"     :   game.add.sprite(startX, 5, "item_slot"),
                                    "item"      :   game.add.sprite(startX + 4, 9, item),
                                    "text"      :   game.add.text(0, 0, phaser.inventory[item], {
                                        font: "12px Courier",
                                        fill: "#fff",
                                        boundsAlignH: "right",
                                        boundsAlignV: "middle"
                                    }),
                                    "startX"    :   startX,
                                };

                                phaser.itemSlots[item]["frame"].fixedToCamera = true;
                                phaser.itemSlots[item]["frame"].scale.setTo(2, 2);

                                phaser.itemSlots[item]["item"].fixedToCamera = true;
                                phaser.itemSlots[item]["item"].scale.setTo(2, 2);

                                phaser.itemSlots[item]["text"].setTextBounds(startX + 4, 26, 30, 20);
                                phaser.itemSlots[item]["text"].fixedToCamera = true;
                            }

                            phaser.inventory[item]++;

                            phaser.itemSlots[item]["text"].setText(phaser.inventory[item]);

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


/**
 *
 */
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


/**
 *
 */
function updateInventory(phaser, game)
{
    var frameX = 5;
    $.each(phaser.inventory, function (key, value) {
        if (!(key in phaser.itemSlots)) {
            phaser.itemSlots[key] = {
                "frame"     :   game.add.sprite(frameX, 5, "item_slot"),
                "item"      :   game.add.sprite(frameX + 4, 9, key),
                "text"      :   game.add.text(0, 0, value, {
                    font: "12px Courier",
                    fill: "#fff",
                    boundsAlignH: "right",
                    boundsAlignV: "middle"
                }),
            };

            phaser.itemSlots[key]["frame"].fixedToCamera = true;
            phaser.itemSlots[key]["frame"].scale.setTo(2, 2);

            phaser.itemSlots[key]["item"].fixedToCamera = true;
            phaser.itemSlots[key]["item"].scale.setTo(2, 2);

            phaser.itemSlots[key]["text"].setTextBounds(frameX + 4, 26, 30, 20);
            phaser.itemSlots[key]["text"].fixedToCamera = true;
        } else {
            phaser.itemSlots[key]["text"].setText(value);
        }

        frameX += 45;
    });
}
