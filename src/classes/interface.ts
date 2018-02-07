module Insight {
	export class Interface {
        game: Phaser.Game;
        blockSize: number;

        inventory: Inventory;
        lifeforce: Lifeforce;

        inv_created: boolean = false;
        inv_frame: Phaser.Sprite;
        inv_equipped: Phaser.Sprite;
        inv_text: Phaser.Text;

        life_sprites: object = {};

        constructor (game: Phaser.Game, blockSize: number) {
            this.game = game;

            this.blockSize = blockSize;

            this.inventory = new Inventory();

            this.lifeforce = new Lifeforce();
        }

        getInventory () {
            return this.inventory;
        }

        renderInventory () {
            if (!this.inv_created) {
                this.inv_frame = this.game.add.sprite(this.game.camera.width - 90, 10, "item_equip");
                this.inv_frame.fixedToCamera = true;

                this.inv_equipped = this.game.add.sprite(this.game.camera.width - 82, 18, "pickaxe");
                this.inv_equipped.fixedToCamera = true;
                this.inv_equipped.scale.setTo(2, 2);

                this.inv_text = this.game.add.text(0, 0, "pickaxe", {
                    font: "14px Courier",
                    fill: "#000",
                    boundsAlignH: "center",
                    boundsAlignV: "middle"
                });
                this.inv_text.setTextBounds(this.game.camera.width - 90, 50, 80, 20);
                this.inv_text.fixedToCamera = true;

                this.inv_created = true;
            }

            var startX = 10;

            var inventory = this.getInventory().getItems();

            for (var item in inventory) {
                var object = inventory[item];

                if (object.sprite) {
                    object.sprite.frame.destroy();
                    object.sprite.item.destroy();
                    object.sprite.text.destroy();
                }

                if (object.count == 0) {
                    this.getInventory().setCurrentItem("pickaxe");
                    this.inv_equipped.loadTexture("pickaxe");
                    this.inv_text.setText("pickaxe");
                    startX = 10;
                } else {
                    var frame = this.game.add.image(startX, 10, "item_slot");
                    frame.fixedToCamera = true;

                    var block = this.game.add.sprite(startX + 4, 14, item);
                    block.fixedToCamera = true;
                    block.inputEnabled = true;
                    block.events.onInputDown.add(function (sprite) {
                        this.inv_equipped.loadTexture(sprite.key);
                        this.inv_text.setText(sprite.key);
                        this.getInventory().setCurrentItem(sprite.key);
                    }, this);

                    var text = this.game.add.text(0, 0, object.count, {
                        font: "12px Courier",
                        fill: "#fff",
                        boundsAlignH: "right",
                        boundsAlignV: "middle"
                    })
                    text.setTextBounds(startX + 4, 32, 30, 20);
                    text.fixedToCamera = true;

                    inventory[item]["sprite"] = {
                        "frame" :   frame,
                        "item"  :   block,
                        "text"  :   text,
                    };
                }

                startX = startX + (this.blockSize * 1.5);
            }
        }

        getLifeforce () {
            return this.lifeforce;
        }

        renderLifeforce () {
            if (Object.keys(this.life_sprites).length) {
                for (var key in this.life_sprites) {
                    var sprite = this.life_sprites[key];
                    sprite.destroy();
                }
            }

            var width = 150;
            var height = 20;
            var border = 4;

            var x = ((this.game.camera.width - 85) - (width / 2));
            var y = 25;

            this.life_sprites = {
                "border"        :   this.drawBar((x - border), y, (width + border), (height + border), "#000000"),
                "background"    :   this.drawBar(x - border, y, width, height, "#e5e5e5"),
                "health"        :   this.drawBar((x + (width / 2)) - border, y, width, height, "#e60000"),
            };
            this.life_sprites["health"].anchor.x = 1;

            var currentLifeforce = this.lifeforce.getCurrent();
            if (currentLifeforce != 100) {
                var maxLifeforce = this.lifeforce.getMax();

                var damagePercent = ((currentLifeforce / maxLifeforce) * 100);

                var damageBarWidth = (width / 100) * damagePercent;

                this.game.add.tween(this.life_sprites["health"]).to({width: damageBarWidth}, 200, Phaser.Easing.Linear.None, true);
            }
        }

        drawBar (x: number, y: number, width: number, height: number, color: string) {
            var data = this.game.add.bitmapData(width, height);
            data.ctx.fillStyle = color;
            data.ctx.beginPath();
            data.ctx.rect(0, 0, width, height);
            data.ctx.fill();
            data.update();

            var sprite = this.game.add.sprite(x, y, data);
            sprite.anchor.set(0.5);
            sprite.fixedToCamera = true;

            return sprite;
        };
	}
}
