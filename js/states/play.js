var play = function (game){};

play.prototype = {
    preload: function () {
        this.game.load.image("air", "assets/sprites/blocks/air.png");
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

        this.game.world.setBounds(0, 0, 4000, 4000);

        // Start the Arcade physics system (for movements and collisions)
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Add the physics engine to all game objects
        this.game.world.enableBody = true;

        // Variable to store the arrow key pressed
        this.cursor = this.game.input.keyboard.createCursorKeys();

        this.blockSize = 32;

        // Create the player in the middle of the game
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY - (this.blockSize * 2), "player");
        this.player.animations.add("walk");
        this.player.body.collideWorldBounds = true;
        this.player.anchor.setTo(.5, .5);

        // Add gravity to make it fall
        this.player.body.gravity.y = 2000;

        this.game.camera.follow(this.player);

        this.blocks = this.add.group();

        this.inventory = {
            "fist"  :   {},
        };

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

        this.level = generateLevelInformation(this, this.game);

        renderInventory(this, this.game);

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

        if (this.game.input.activePointer.leftButton.isDown) {
            var object = this.game.input.activePointer.targetObject;
            if (object !== null) {
                if (object.sprite.key == "air" && this.itemEquiped.key) {
                    var blockX = object.sprite.x;
                    var blockY = object.sprite.y;
                    if (!isBlockWithinRadius(this, blockX, blockY)) {
                        return;
                    }

                    if (object.sprite.overlap(this.player)) {
                        return;
                    }

                    var texture = this.itemEquiped.key;
                    if (texture in this.inventory) {
                        var key = blockX + "|" + blockY;

                        this.level[key].block = texture;

                        object.sprite.loadTexture(texture);

                        object.sprite.events.onInputDown.add(removeBlock, {"phaser": this, "game": this.game, "key": key});

                        this.blocks.add(object.sprite);

                        this.inventory[texture]["count"]--;

                        renderInventory(this, this.game);

                        this.game.input.activePointer.leftButton.isDown = false;
                    }
                }
            }
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
    var renderFromPlayerX = game.camera.width;
    var renderFromPlayerY = game.camera.height;

    var startCameraX = phaser.player.x - renderFromPlayerX;
    var endCameraX = phaser.player.x + renderFromPlayerX;

    var startCameraY = phaser.player.y - renderFromPlayerY;
    var endCameraY = phaser.player.y + renderFromPlayerY;

    phaser.renderBoundaries = {
        "xStart"    :   startCameraX + (renderFromPlayerX / 1.8),
        "xEnd"      :   endCameraX - (renderFromPlayerX / 1.8),
        "yStart"    :   startCameraY + (renderFromPlayerY / 1.8),
        "yEnd"      :   endCameraY - (renderFromPlayerY / 1.8),
    };
    phaser.blocks.removeAll();

    var keys = Object.keys(phaser.level);
    $.each(keys, function (index, key) {
        var object = phaser.level[key];

        if (object.x < startCameraX || object.x > endCameraX) {
            if (object.entity) {
                object.entity.kill();
            }
            return;
        }

        if (object.y < startCameraY || object.y > endCameraY) {
            if (object.entity) {
                object.entity.kill();
            }
            return;
        }

        if (object.entity) {
            object.entity.revive();
            if (object.block != "air") {
                phaser.blocks.add(object.entity);
            }
            return;
        }


        var entity = phaser.add.sprite(object.x, object.y, object.block);
        entity.sendToBack();

        entity.body.immovable = true;

        entity.inputEnabled = true;

        // Allow blocks to be destroyed if it isn't bedrock
        if (object.block != "bedrock" && object.block != "air") {
            entity.events.onInputDown.add(removeBlock, {"phaser": phaser, "game": game, "key": key});
        }

        if (object.block != "air") {
            phaser.blocks.add(entity);
        }

        phaser.level[key]["entity"] = entity;
    });
}


/**
 *
 */
function generateLevelInformation(phaser, game)
{
    var worldWidth = game.world.bounds.width;
    var worldHeight = game.world.bounds.height;

    var totalBlocksX = Math.ceil((worldWidth / phaser.blockSize) * 1) / 1;
    var totalBlocksY = Math.ceil((worldHeight / phaser.blockSize) * 1) / 1;

    var levels = {
        "grass"     :   1,
        "dirt"      :   10,
        "stone"     :   15,
        "bedrock"   :   10,
    };

    var localChunkX = phaser.player.x - (worldWidth / 2);
    var localChunkY = game.world.centerY + (phaser.blockSize / 2);

    var data = {};

    var depth = 0;
    for (var level in levels) {
        var rows = levels[level];

        for (var row = 0; row < rows; row++) {
            for (var block = 0; block < totalBlocksX; block++) {
                var blockX = localChunkX + (block * phaser.blockSize);
                var blockY = localChunkY + (depth * phaser.blockSize);

                data[blockX + "|" + blockY] = {
                    "block" :   level,
                    "x"     :   blockX,
                    "y"     :   blockY
                };
            }

            depth++;
        }
    }

    for (var row = 0; row < totalBlocksY; row++) {
        for (var block = 0; block < totalBlocksX; block++) {
            var blockX = (block * phaser.blockSize);
            var blockY = (row * phaser.blockSize);

            var key = blockX + "|" + blockY;
            if (key in data) {
                continue;
            }

            data[blockX + "|" + blockY] = {
                "block" :   "air",
                "x"     :   blockX,
                "y"     :   blockY
            };
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

    var jumpingSpeed = 400 + (phaser.blockSize * 2);

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
 *
 */
function removeBlock(sprite, pointer)
{
    var item = sprite.key;

    // Because the input event can be called later when the level has been changed
    // We want to redo the check to ensure we are not trying to remove an air or bedrock block
    if (item == "bedrock" || item == "air") {
        return;
    }

    if (!isBlockWithinRadius(this.phaser, sprite.x, sprite.y)) {
        return;
    }

    if (!(item in this.phaser.inventory)) {
        this.phaser.inventory[item] = {
            "count" :   0,
        };
    }

    this.phaser.level[this.key].block = "air";

    sprite.loadTexture("air");

    this.phaser.inventory[item]["count"]++;

    renderInventory(this.phaser, this.game);

    this.phaser.blocks.remove(sprite);
    this.game.add.existing(sprite);

    sprite.sendToBack();
}


/**
 *
 */
function isBlockWithinRadius(phaser, x, y)
{
    var playerX = phaser.player.x;
    var blocksAwayX = ((x - playerX) / phaser.blockSize) | 0;

    var playerY = phaser.player.y;
    var blocksAwayY = ((y - playerY) / phaser.blockSize) | 0;

    if (blocksAwayX > 2 || blocksAwayX < -2) {
        return false;
    }

    if (blocksAwayY > 2 || blocksAwayY < -2) {
        return false;
    }

    return true;
}


/**
 *
 */
function renderInventory(phaser, game)
{
    var startX = 10;

    $.each(phaser.inventory, function (item, object) {
        if (object.sprite) {
            object.sprite.frame.destroy();
            object.sprite.item.destroy();
            object.sprite.text.destroy();
        }

        if (object.count == 0) {
            phaser.itemEquiped.loadTexture(null);
            phaser.itemEquipedText.destroy();
            delete phaser.inventory[item];
            startX = 10;
        } else {
            var frame = game.add.image(startX, 10, "item_slot");
            frame.fixedToCamera = true;

            var block = game.add.sprite(startX + 4, 14, item);
            block.fixedToCamera = true;
            block.inputEnabled = true;
            block.events.onInputDown.add(function (sprite) {
                this.itemEquiped.loadTexture(sprite.key);
                this.itemEquipedText.setText(sprite.key);
            }, phaser);

            var text = game.add.text(0, 0, object.count, {
                font: "12px Courier",
                fill: "#fff",
                boundsAlignH: "right",
                boundsAlignV: "middle"
            })
            text.setTextBounds(startX + 4, 32, 30, 20);
            text.fixedToCamera = true;

            phaser.inventory[item]["sprite"] = {
                "frame" :   frame,
                "item"  :   block,
                "text"  :   text,
            };
        }

        startX = startX + (phaser.blockSize * 1.5);
    });
}
