module Insight {
    export class PlayState extends Phaser.State {
        cursor: Phaser.CursorKeys;
        player: Player;
        plain: Plain;
        level: object;
        blocks: Phaser.Group;
        blockSize: number;
        interface: Interface;

        bounds: object = {
            "x"    :     {
                "start"    :      0,
                "end"      :      0,
            },
            "y"    :     {
                "start"    :      0,
                "end"      :      0,
            }
        };

        preload () {}

        create () {
            this.game.world.setBounds(0, 0, 4000, 4000);

            this.game.physics.startSystem(Phaser.Physics.ARCADE);

            this.game.world.enableBody = true;

            this.cursor = this.game.input.keyboard.createCursorKeys();

            this.player = new Player(this.game, this.game.world.centerX, this.game.world.centerY  - 64);
            this.game.add.existing(this.player);
            this.player.bringToTop();
            this.player.body.collideWorldBounds = true;
            this.player.body.gravity.y = 2000;
            this.game.camera.follow(this.player);

            this.blocks = this.add.group();

            this.blockSize = 32;
            this.plain = new Plain(this.game, this.blockSize);
            this.level = this.plain.generate();

            this.bounds["x"] = this.plain.getRenderX(this.player);
            this.bounds["y"] = this.plain.getRenderY(this.player);

            this.interface = new Interface(this.game, this.blockSize);
            this.interface.renderInventory();
            this.interface.renderLifeforce();

            this.game.time.advancedTiming = true;

            this.generate();
        }

        update () {
            this.collision();

            this.movement();

            var xMatch = this.player.x < this.bounds["x"].start || this.player.x > this.bounds["x"].end;
            var yMatch = this.player.y < this.bounds["y"].start || this.player.y > this.bounds["y"].end;
            if (xMatch || yMatch) {
                this.generate();

                this.bounds["x"] = this.plain.getRenderX(this.player);
                this.bounds["y"] = this.plain.getRenderY(this.player);
            }
        }

        generate () {
            var startCameraX = this.plain.getBoundsX(this.player).start;
            var endCameraX = this.plain.getBoundsX(this.player).end;

            var startCameraY = this.plain.getBoundsY(this.player).start;
            var endCameraY = this.plain.getBoundsY(this.player).end;

            this.blocks.removeAll();

            for (let levelKey in this.level) {
                let object = this.level[levelKey];

                if (object.x < startCameraX || object.x > endCameraX) {
                    if (object.entity) {
                        object.entity.kill();
                    }
                    continue;
                }

                if (object.y < startCameraY || object.y > endCameraY) {
                    if (object.entity) {
                        object.entity.kill();
                    }
                    continue;
                }

                if (object.entity) {
                    object.entity.revive();
                    if (object.block != "air") {
                        this.blocks.add(object.entity);
                    }
                    continue;
                }

                var entity = new Block(this.game, object.x, object.y, object.block);
                this.game.add.existing(entity);
                entity.body.immovable = true;
                entity.inputEnabled = true;
                entity.sendToBack();

                // Allow blocks to be destroyed if it isn't bedrock
                if (object.block != "bedrock") {
                    entity.events.onInputDown.add(this.click, this);
                }

                if (object.block != "air") {
                    this.blocks.add(entity);
                }

                this.level[levelKey]["entity"] = entity;
            };
        }

        collision () {
            this.game.physics.arcade.collide(this.player, this.blocks);

            // If we are not touching the some ground, we want to start to process fall damage.
            var dropStart = this.player.getDrop(0);

            if (!this.player.body.touching.down) {
                // If we haven't processed a drop before or the player's Y is increasing, log the current Y coord
                if (!dropStart || this.player.y < dropStart) {
                    this.player.startDrop();
                }
            } else {
                // If there has been a drop when it is touching the ground, apply damage.
                if (dropStart) {
                    this.player.endDrop();

                    var dropEnd = this.player.getDrop(1);

                    // Calculate the drop distance and convert it to a number of blocks fallen.
                    var fallDistance = dropEnd - dropStart;
                    var blocksFallen = Math.ceil((fallDistance / this.blockSize));

                    // We are going to allow a five block threshold before we take damage
                    var dropThreshold = this.player.dropThreshold;
                    if (blocksFallen > dropThreshold) {
                        // Then we are going to take 3% damage of the total health for every 2 blocks after that.
                        var damagePercent = (Math.ceil((blocksFallen - dropThreshold) / 2)) * dropThreshold;

                        var totalHealth = this.interface.getLifeforce().getMax();

                        var damageValue = (totalHealth / 100) * damagePercent;

                        this.interface.getLifeforce().damage(damageValue);

                        this.interface.renderLifeforce();
                    }

                    this.player.resetDrop();
                }
            }
        }

        movement () {
            var movementSpeed = 400;

            this.player.body.velocity.x = 0;

            var movement = false;
            if (this.cursor.left.isDown) {
                this.player.animations.play("walk", 7, true);
                this.player.body.velocity.x = -movementSpeed;
                this.player.scale.x = -1;
                movement = true;
            } else if (this.cursor.right.isDown) {
                this.player.animations.play("walk", 7, true);
                this.player.body.velocity.x = movementSpeed;
                this.player.scale.x = 1;
                movement = true;
            }

            var jumpingSpeed = 465;

            // Make the player jump if he is touching the ground
            if (this.cursor.up.isDown && this.player.body.touching.down) {
                this.player.body.velocity.y = -jumpingSpeed;
            }

            if (!movement) {
                this.player.animations.stop(null, true);
            }
        }

        click (sprite: Phaser.Sprite, pointer: Phaser.Pointer) {
            var key = sprite.x + "|" + sprite.y;

            var item = sprite.key;

            // Because the input event can be called later when the level has been changed
            // We want to redo the check to ensure we are not trying to amend a bedrock block
            if (item == "bedrock") {
                return;
            }

            var blocksAwayX = ((sprite.x - this.player.x) / this.blockSize) | 0;
            var blocksAwayY = ((sprite.y - this.player.y) / this.blockSize) | 0;

            if (blocksAwayX > 3 || blocksAwayX < -3) {
                return;
            }

            if (blocksAwayY > 3 || blocksAwayY < -3) {
                return;
            }

            var inventory = this.interface.getInventory();

            var currentItem = inventory.getCurrentItem();

            if (currentItem == "blank" && item != "air") {
                this.level[key].block = "air";
                sprite.loadTexture("air");
                this.game.add.existing(sprite);
                this.blocks.remove(sprite);
                inventory.addItem(item, 1);
            } else if (currentItem != "blank"  && item == "air") {
                if (sprite.overlap(this.player)) {
                    return;
                }
                this.level[key].block = currentItem;
                sprite.loadTexture(currentItem);
                sprite.events.onInputDown.add(this.click, this);
                this.game.add.existing(sprite);
                this.blocks.add(sprite);
                inventory.removeItem(currentItem, 1);
            }

            this.player.bringToTop();

            this.interface.renderInventory();
        }
    }
}
