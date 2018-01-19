var play = function (game){};

play.prototype = {
    preload: function () {
        this.game.load.image("air", "assets/sprites/blocks/air.png");
        this.game.load.image("grass", "assets/sprites/blocks/grass.png");
        this.game.load.image("dirt", "assets/sprites/blocks/dirt.png");
        this.game.load.image("stone", "assets/sprites/blocks/stone.png");
        this.game.load.image("bedrock", "assets/sprites/blocks/bedrock.png");

        this.game.load.spritesheet('player', 'assets/sprites/player.png', 32, 62, 3);

        this.game.load.image("enemy", "assets/sprites/enemy.png");

        this.game.load.image("item_slot", "assets/ui/item_slot_frame.png");
        this.game.load.image("item_equip", "assets/ui/item_equip_frame.png");

        this.game.load.image("blank", "assets/sprites/tools/blank.png");
        this.game.load.image("blade", "assets/sprites/tools/blade.png");

        this.game.time.advancedTiming = true;
    },

    create: function () {
        this.game.stage.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        this.game.world.setBounds(0, 0, 4000, 4000);

        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.game.world.enableBody = true;

        this.cursor = this.game.input.keyboard.createCursorKeys();

        this.blockSize = 32;

        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY - (this.blockSize * 2), "player");
        this.player.animations.add("walk");
        this.player.body.collideWorldBounds = true;
        this.player.anchor.setTo(.5, .5);

        this.player.body.gravity.y = 2000;

        this.game.camera.follow(this.player);

        this.blocks = this.add.group();

        this.dropThreshold = 5;

        this.inventory = {
            "blank" :   {},
        };

        var itemEquipFrame = this.game.add.sprite(this.game.camera.width - 90, 10, "item_equip");
        itemEquipFrame.fixedToCamera = true;

        this.itemEquiped = this.game.add.sprite(this.game.camera.width - 82, 18, "blank");
        this.itemEquiped.fixedToCamera = true;
        this.itemEquiped.scale.setTo(2, 2);

        this.itemEquipedText = this.game.add.text(0, 0, "blank", {
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

        this.playerHealth = 100;

        this.level = generateLevelInformation(this, this.game);

        renderInventory(this, this.game);

        renderViewPort(this, this.game);

        // Because the timer calls the callback on first run, we want to start this variable on the night state.
        this.dayState = 0;
        this.dayTimer = this.game.time.create(false);
        this.dayTimer.loop(Phaser.Timer.MINUTE * 5, function () {
            this.dayState = !this.dayState;
        }, this);
        this.dayTimer.start();
    },

    update: function () {
        if (this.playerHealth <= 0) {
            this.game.state.start(this.game.state.current);
        }

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
    $.each(keys, function (index, levelKey) {
        var object = phaser.level[levelKey];

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

        // Allow blocks to be destroyed if it isn't air or bedrock
        if (object.block != "bedrock") {
            entity.events.onInputDown.add(blockClick, {"phaser": phaser, "game": game, "levelKey": levelKey});
        }

        if (object.block != "air") {
            phaser.blocks.add(entity);
        }

        phaser.level[levelKey]["entity"] = entity;
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

    // If we are not touching the some ground, we want to process fall damage.
    if (!phaser.player.body.touching.down) {
        // If we haven't processed a drop before or the player's Y is increasing, log the current Y coord
        if (!phaser.dropStartY || (phaser.player.y < phaser.dropStartY)) {
            phaser.dropStartY = phaser.player.y;
        }
    } else {
        // If there has been a drop when it is touching the ground, apply damage.
        if (phaser.dropStartY) {
            phaser.dropEndY = phaser.player.y;

            // Calculate the drop distance and convert it to a number of blocks fallen.
            var fallDistance = (phaser.dropEndY - phaser.dropStartY);

            var blocksFallen = Math.ceil((fallDistance / phaser.blockSize));

            // We are going to allow a five block threshold before we take damage
            if (blocksFallen > phaser.dropThreshold) {
                // Then we are going to take 5% damage for every 2 blocks after that.
                var healthDamagePercent = (Math.ceil((blocksFallen - phaser.dropThreshold) / 2)) * phaser.dropThreshold;

                phaser.playerHealth -= healthDamagePercent;

                phaser.healthBar.setPercent(phaser.playerHealth);
            }

            // Reset the drop variables so the next drop starts off fresh.
            phaser.dropStartY = null;
            phaser.dropEndY = null;
        }
    }
}


/**
 *
 */
function blockClick(sprite, pointer)
{
    var item = sprite.key;

    // Because the input event can be called later when the level has been changed
    // We want to redo the check to ensure we are not trying to amend a bedrock block
    if (item == "bedrock") {
        return;
    }

    if (!isBlockWithinRadius(this.phaser, sprite.x, sprite.y)) {
        return;
    }

    if (this.phaser.itemEquiped.key == "blank") {
        if (item != "air") {
            removeBlock(this.phaser, this.game, this.levelKey, item, sprite);
        }
    } else {
        if (item == "air") {
            placeBlock(this.phaser, this.game, this.levelKey, sprite);
        }
    }
}


/**
 *
 */
function isBlockWithinRadius(phaser, x, y)
{
    var radius = 3;

    var playerX = phaser.player.x;
    var blocksAwayX = ((x - playerX) / phaser.blockSize) | 0;

    var playerY = phaser.player.y;
    var blocksAwayY = ((y - playerY) / phaser.blockSize) | 0;

    if (blocksAwayX > radius || blocksAwayX < -radius) {
        return false;
    }

    if (blocksAwayY > radius || blocksAwayY < -radius) {
        return false;
    }

    return true;
}


/**
 *
 */
function removeBlock(phaser, game, levelKey, item, sprite)
{
    if (!(item in phaser.inventory)) {
        phaser.inventory[item] = {
            "count" :   0,
        };
    }

    phaser.level[levelKey].block = "air";

    sprite.loadTexture("air");

    phaser.inventory[item]["count"]++;

    renderInventory(phaser, game);

    phaser.blocks.remove(sprite);
    game.add.existing(sprite);

    sprite.sendToBack();
}


/**
 *
 */
function placeBlock(phaser, game, levelKey, sprite)
{
    if (sprite.overlap(phaser.player)) {
        return;
    }

    var texture = phaser.itemEquiped.key;
    if (texture in phaser.inventory) {
        phaser.level[levelKey].block = texture;

        sprite.loadTexture(texture);

        sprite.events.onInputDown.add(blockClick, {"phaser": phaser, "game": game, "levelKey": levelKey});

        phaser.blocks.add(sprite);

        phaser.inventory[texture]["count"]--;

        renderInventory(phaser, game);
    }
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
            phaser.itemEquiped.loadTexture("blank");
            phaser.itemEquipedText.setText("blank");
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
