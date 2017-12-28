window.onload = function () {
     // Create the state that will contain the whole game
    var playState = {  
        preload: function() {  
            // Here we preload the assets
            game.load.image("player", "assets/player.png");
            
            game.load.image("wall", "assets/wall.png");
            
            game.load.image("enemy", "assets/enemy.png");
        },
    
        create: function() {  
            // Set the background color to blue
            game.stage.backgroundColor = "#3598db";

            // Start the Arcade physics system (for movements and collisions)
            game.physics.startSystem(Phaser.Physics.ARCADE);

            // Add the physics engine to all game objects
            game.world.enableBody = true;
            
            // Variable to store the arrow key pressed
            this.cursor = game.input.keyboard.createCursorKeys();
            
            // Create the player in the middle of the game
            this.player = game.add.sprite(70, 100, "player");
            
            // Add gravity to make it fall
            this.player.body.gravity.y = 900;
            
            handleLevel(this);
        },
    
        update: function() {  
            handleCollision(this, game);
            
            handleMovement(this);
        },
        
        restart: function() {
            game.state.start("play");
        }
    };
    
    // Initialize the game and start our state
    var game = new Phaser.Game(500, 200);  
    
    game.state.add("play", playState);  
    
    game.state.start("play");
}

function handleMovement(phaser) {
    phaser.player.body.velocity.x = 0;
    
    var movementSpeed = 200;
    var jumpingSpeed = 250;
    
    if (phaser.cursor.left.isDown) {
        phaser.player.body.velocity.x = -movementSpeed;
    } else if (phaser.cursor.right.isDown) {
        phaser.player.body.velocity.x = movementSpeed;
    }

    // Make the player jump if he is touching the ground
    if (phaser.cursor.up.isDown && phaser.player.body.touching.down) 
        phaser.player.body.velocity.y = -jumpingSpeed;
}

function handleLevel(phaser) {
    // Create 3 groups that will contain our objects
    phaser.walls = phaser.add.group();
    phaser.enemies = phaser.add.group();
    
    // Design the level. x = wall, o = coin, ! = lava.
    var level = [
        "xxxxxxxxxxxxxxxxxxxxxx",
        "!         !          x",
        "!                    x",
        "!                    x",
        "!                    x",
        "!         !    x     x",
        "xxxxxxxxxxxxxxxx!!!!!x",
    ];
    
    for (var row = 0; row < level.length; row++) {
        for (var block = 0; block < level[row].length; block++) {
            if (level[row][block] == "x") {
                var wall = phaser.add.sprite(30+16*block, 30+16*row, "wall");
                phaser.walls.add(wall);
                wall.body.immovable = true; 
            } else if (level[row][block] == "!") {
                var enemy = phaser.add.sprite(30+16*block, 30+16*row, "enemy");
                phaser.enemies.add(enemy);
            }
        }
    }
}

function handleCollision(phaser, game) {
    // Make the player and the walls collide
    game.physics.arcade.collide(phaser.player, phaser.walls);
    
    // Call the 'restart' function when the player touches the enemy
    game.physics.arcade.overlap(phaser.player, phaser.enemies, phaser.restart, null, phaser);
}