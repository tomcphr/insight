var play = function (game){};

play.prototype = {
    preload: function () {
        this.game.load.image("grass", "assets/sprites/blocks/grass.png");
        this.game.load.image("dirt", "assets/sprites/blocks/dirt.png");
        this.game.load.image("stone", "assets/sprites/blocks/stone.png");
        this.game.load.image("bedrock", "assets/sprites/blocks/bedrock.png");

        //this.game.load.image("player", "assets/sprites/player.png");
        this.game.load.spritesheet('player', 'assets/sprites/player.png', 32, 62, 3);

        this.game.load.image("enemy", "assets/sprites/enemy.png");

        this.game.load.image("item_slot", "assets/ui/item_slot_frame.png");
        this.game.load.image("item_equip", "assets/ui/item_equip_frame.png");

        this.game.load.image("blade", "assets/sprites/tools/blade.png");

        this.game.time.advancedTiming = true;
    },

    create: function () {
        this.game.stage.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        this.game.stage.backgroundColor = "#87CEFA";

        this.game.world.setBounds(0, 0, 4000, 4000);

        // Start the Arcade physics system (for movements and collisions)
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Add the physics engine to all game objects
        this.game.world.enableBody = true;

        // Variable to store the arrow key pressed
        this.cursor = this.game.input.keyboard.createCursorKeys();

        // Create the player in the middle of the game
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, "player");
        this.player.animations.add("walk");
        this.player.body.collideWorldBounds = true;
        this.player.anchor.setTo(.5, .5);

        // Add gravity to make it fall
        this.player.body.gravity.y = 950;

        this.game.camera.follow(this.player);

        this.blocks = this.add.group();

        this.blockSize = 32;

        this.inventory = {};

        this.itemSlots = {};

        var itemEquipFrame = this.game.add.sprite(this.game.camera.width - 90, 10, "item_equip");
        itemEquipFrame.fixedToCamera = true;

        this.itemEquiped = this.game.add.sprite(this.game.camera.width - 82, 18);
        this.itemEquiped.fixedToCamera = true;
        this.itemEquiped.scale.setTo(2, 2);

        this.itemEquipedText = this.game.add.text(0, 0, "", {
            font: "14px Courier",
            fill: "#000",
            boundsAlignH: "center",
            boundsAlignV: "middle"
        });
        this.itemEquipedText.setTextBounds(this.game.camera.width - 90, 50, 80, 20);
        this.itemEquipedText.fixedToCamera = true;

        this.healthBar = new HealthBar(this.game, {
            x: itemEquipFrame.x - 75,
            y: 25,
            width: 150,
            height: 20,
            flipped: true,
            bg: {
                color: "#e5e5e5",
            },
            bar: {
                color: "#e60000",
            },
            border: {
                width: 2,
            }
        });
        this.healthBar.setFixedToCamera(true);

        renderViewPort(this, this.game);
    },

    update: function () {
        handleCollision(this, this.game);

        handleMovement(this, this.game);

        var xMatch = this.player.x < this.renderBoundaries.xStart || this.player.x > this.renderBoundaries.xEnd;
        var yMatch = this.player.y < this.renderBoundaries.yStart || this.player.y > this.renderBoundaries.yEnd;

        if (xMatch || yMatch) {
            renderViewPort(this, this.game);
        }
    },

    render: function () {
        this.game.debug.text(this.game.time.fps || '--', 5, this.game.camera.height - 10, "#00ff00");
    }
};

/**
 *
 */
function renderViewPort(phaser, game)
{
    if (!phaser.level) {
        phaser.level = getLevelInformation(phaser, game);
    }

    var startCameraX = phaser.player.x - game.camera.width;
    var endCameraX = phaser.player.x + game.camera.width;

    var startCameraY = phaser.player.y - game.camera.height;
    var endCameraY = phaser.player.y + game.camera.height;

    phaser.renderBoundaries = {
        "xStart"    :   startCameraX + (game.camera.width / 2),
        "xEnd"      :   endCameraX - (game.camera.width / 2),
        "yStart"    :   startCameraY + (game.camera.height / 2),
        "yEnd"      :   endCameraY - (game.camera.height / 2),
    };

    $.each(phaser.level, function (key, object) {
        if (object.x < startCameraX || object.x > endCameraX) {
            if (object.sprite) {
                object.sprite.kill();
            }
            return;
        }

        if (object.y < startCameraY || object.y > endCameraY) {
            if (object.sprite) {
                object.sprite.kill();
            }
            return;
        }

        if (object.sprite) {
            object.sprite.revive();
            return;
        }

        var sprite = phaser.add.sprite(object.x, object.y, object.level);

        sprite.body.immovable = true;

        sprite.inputEnabled = true;

        sprite.input.useHandCursor = true;

        // Allow blocks to be destroyed if it isn't bedrock
        if (object.level != "bedrock") {
            sprite.events.onInputDown.add(function (sprite, pointer) {
                var blockX = sprite.x;
                var playerX = phaser.player.x;
                var blocksAwayX = ((blockX - playerX) / phaser.blockSize) | 0;

                var blockY = sprite.y;
                var playerY = phaser.player.y;
                var blocksAwayY = ((blockY - playerY) / phaser.blockSize) | 0;

                if (blocksAwayX > 2 || blocksAwayX < -2) {
                    return;
                }

                if (blocksAwayY > 2 || blocksAwayY < -2) {
                    return;
                }

                var item = sprite.key;
                if (!(item in phaser.inventory)) {
                    phaser.inventory[item] = 0;

                    var startX = 10;

                    var positions = [];

                    $.each(phaser.itemSlots, function (key, object) {
                        positions.push(object.startX);
                    });

                    if (positions.length > 0) {
                        var maxPos = Math.max.apply(Math, positions);
                        startX = maxPos + (phaser.blockSize) + 20;
                    }

                    phaser.itemSlots[item] = {
                        "frame"     :   game.add.image(startX, 10, "item_slot"),
                        "item"      :   game.add.sprite(startX + 4, 14, item),
                        "text"      :   game.add.text(0, 0, phaser.inventory[item], {
                            font: "12px Courier",
                            fill: "#fff",
                            boundsAlignH: "right",
                            boundsAlignV: "middle"
                        }),
                        "startX"    :   startX,
                    };

                    phaser.itemSlots[item]["frame"].fixedToCamera = true;

                    phaser.itemSlots[item]["item"].fixedToCamera = true;
                    phaser.itemSlots[item]["item"].inputEnabled = true;
                    phaser.itemSlots[item]["item"].events.onInputDown.add(function (sprite) {
                        phaser.itemEquiped.loadTexture(sprite.key);
                        phaser.itemEquipedText.setText(sprite.key);
                    }, this);

                    phaser.itemSlots[item]["text"].setTextBounds(startX + 4, 32, 30, 20);
                    phaser.itemSlots[item]["text"].fixedToCamera = true;
                }

                phaser.inventory[item]++;

                phaser.itemSlots[item]["text"].setText(phaser.inventory[item]);

                sprite.destroy();

                console.log(blockExistsAt(phaser, blockX, blockY));
            }, this);
        }

        phaser.blocks.add(sprite);

        phaser.level[key]["sprite"] = sprite;
    });
}


/**
 *
 */
function getLevelInformation(phaser, game)
{
    var data = [];

    var levels = {
        "grass"     :   1,
        "dirt"      :   10,
        "stone"     :   15,
        "bedrock"   :   10,
    };

    var worldWidth = game.world.bounds.width;

    var localChunkX = phaser.player.x - (worldWidth / 2);
    var localChunkY = game.world.centerY + (phaser.blockSize * 2);

    var totalBlocks = Math.ceil((worldWidth / phaser.blockSize) * 1) / 1;

    var depth = 0;
    for (var level in levels) {
        var rows = levels[level];

        for (var row = 0; row < rows; row++) {
            for (var block = 0; block < totalBlocks; block++) {
                var blockX = localChunkX + (block * phaser.blockSize);
                var blockY = localChunkY + (depth * phaser.blockSize);

                // Ensure that no block already exists at the X and Y coords
                if (!blockExistsAt(phaser, blockX, blockY)) {
                    data.push({
                        "level" :   level,
                        "x"     :   blockX,
                        "y"     :   blockY
                    });
                }
            }

            depth++;
        }
    }

    return data;
}


/**
 *
 */
function handleMovement(phaser, game)
{
    var movementSpeed = 400;

    phaser.player.body.velocity.x = 0;

    var movement = false;
    if (phaser.cursor.left.isDown) {
        phaser.player.animations.play("walk", 7, true);
        phaser.player.body.velocity.x = -movementSpeed;
        phaser.player.scale.x = -1;
        movement = true;
    } else if (phaser.cursor.right.isDown) {
        phaser.player.animations.play("walk", 7, true);
        phaser.player.body.velocity.x = movementSpeed;
        phaser.player.scale.x = 1;
        movement = true;
    }

    var jumpingSpeed = 250 + (phaser.blockSize * 2);

    // Make the player jump if he is touching the ground
    if (phaser.cursor.up.isDown && phaser.player.body.touching.down) {
        phaser.player.body.velocity.y = -jumpingSpeed;
    }

    if (!movement) {
        phaser.player.animations.stop(null, true);
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
function blockExistsAt(phaser, x, y)
{
    var blockRangeStartX = Math.floor((x / phaser.blockSize)) * phaser.blockSize;
    var blockRangeEndX = Math.ceil((x / phaser.blockSize)) * phaser.blockSize;

    var blockRangeStartY = Math.floor((y / phaser.blockSize)) * phaser.blockSize;
    var blockRangeEndY = Math.ceil((y / phaser.blockSize)) * phaser.blockSize;

    var data = false;
    for (var i = 0; i < phaser.blocks.length; i++) {
        var element = phaser.blocks.getAt(i).body;
        if ((element.x < blockRangeStartX || element.x > blockRangeEndX) || (element.y < blockRangeStartY || element.y > blockRangeEndY)) {
            continue;
        }

        data = true;
    }

    return data;
}
