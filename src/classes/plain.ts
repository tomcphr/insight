module Insight {
    export class Plain {
        game: Phaser.Game;

        blockSize: number;
        generated: object;

        constructor (game: Phaser.Game, blockSize: number) {
            this.game = game;

            this.blockSize = blockSize;
        }

        generate () {
            if (this.generated) {
                return this.generated;
            }

            var worldW = this.game.world.bounds.width;
            var worldH = this.game.world.bounds.height;

            var totalBlocksX = Math.ceil((worldW / this.blockSize) * 1) / 1;
            var totalBlocksY = Math.ceil((worldH / this.blockSize) * 1) / 1;

            var blockStartX = 0;
            var blockStartY = this.game.world.centerY + (this.blockSize / 2);

            var generation = {};
            var depth = 0;

            var levels = {
                "grass"     :   1,
                "dirt"      :   10,
                "stone"     :   15,
                "bedrock"   :   10,
            };
            for (var type in levels) {
                var rows = levels[type];

                for (var row = 0; row < rows; row++) {
                    for (var block = 0; block < totalBlocksX; block++) {
                        var blockX = blockStartX + (block * this.blockSize);
                        var blockY = blockStartY + (depth * this.blockSize);

                        var key = blockX + "|" + blockY;
                        generation[key] = {
                            "block" :   type,
                            "x"     :   blockX,
                            "y"     :   blockY
                        };
                    }

                    depth++;
                }
            }

            for (var row = 0; row < totalBlocksY; row++) {
                for (var block = 0; block < totalBlocksX; block++) {
                    var blockX = (block * this.blockSize);
                    var blockY = (row * this.blockSize);

                    var key = blockX + "|" + blockY;
                    if (generation.hasOwnProperty(key)) {
                        continue;
                    }

                    generation[key] = {
                        "block" :   "air",
                        "x"     :   blockX,
                        "y"     :   blockY
                    };
                }
            }

            this.generated = generation;

            return generation;
        }

        getBoundsX (player: Player) {
            var cameraWidth = this.game.camera.width;

            return {
                "start"    :    player.x - cameraWidth,
                "end"      :    player.x + cameraWidth,
            };
        }

        getBoundsY (player: Player) {
            var cameraHeight = this.game.camera.height;

            return {
                "start"    :    player.y - cameraHeight,
                "end"      :    player.y + cameraHeight,
            };
        }

        getRenderX (player: Player) {
            var boundsStart = this.getBoundsX(player).start;
            var boundsEnd = this.getBoundsX(player).end;

            var extraRender = this.game.camera.width * 0.8;

            return {
                "start"    :    boundsStart + extraRender,
                "end"      :    boundsEnd - extraRender,
            };
        }

        getRenderY (player: Player) {
            var boundsStart = this.getBoundsY(player).start;
            var boundsEnd = this.getBoundsY(player).end;

            var extraRender = this.game.camera.height * 0.8;

            return {
                "start"    :    boundsStart + extraRender,
                "end"      :    boundsEnd - extraRender,
            };
        }
    }
}
