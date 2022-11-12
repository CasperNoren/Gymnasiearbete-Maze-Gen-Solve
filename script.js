function removeFromArray(arr, elt) {
	// Removes element from array without knowing position
	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i] == elt) {
			arr.splice(i, 1);
		}
	}
}

function heuristic(a, b) {
	// Gets the absolute distance between two cells
	var d = abs(a.i - b.i) + abs(a.j - b.j);
	return d;
}

let cols = 40;
let rows = 40;
let grid = new Array(cols);
let current;
let openSet = [];
let closedSet = [];
let start;
let end;
let stack = [];
let w, h;
let doOnce = false;
let mazeDone = false;
let extraWallsRemoved = false;
let percentOfWallsToRemove = 0;
let path = [];
let doMaze = false;
let paused = true;

function Cell(i, j) {
	this.i = i;
	this.j = j;
	this.f = 0;
	this.g = 0;
	this.h = 0;
	this.previous = undefined;
	this.visited = false;
	// Walls follow: TOP RIGHT BOTTOM LEFT
	this.walls = [true, true, true, true];

	this.checkNeighbors = function () {
		// Returns a random neighboring cell that hasn't been ...
		// ... visited by the backtrackinger

		var neighbors = [];

		// Checks for edges because they don't have neighbors
		if (j > 0) {
			var top = grid[this.i][this.j - 1];
		} else {
			var top = grid[-1];
		}
		if (i < cols - 1) {
			var right = grid[this.i + 1][this.j];
		} else {
			var right = grid[-1];
		}
		if (j < rows - 1) {
			var bottom = grid[this.i][this.j + 1];
		} else {
			var bottom = grid[-1];
		}
		if (i > 0) {
			var left = grid[this.i - 1][this.j];
		} else {
			var left = grid[-1];
		}

		// Unvisited are but into the array
		if (top && !top.visited) {
			neighbors.push(top);
		}
		if (right && !right.visited) {
			neighbors.push(right);
		}
		if (bottom && !bottom.visited) {
			neighbors.push(bottom);
		}
		if (left && !left.visited) {
			neighbors.push(left);
		}

		if (neighbors.length > 0) {
			var r = floor(random(0, neighbors.length));
			return neighbors[r];
		} else {
			return undefined;
		}
	};

	this.show = function () {
		// Draws the walls of the cell

		var x = this.i * w;
		var y = this.j * h;
		stroke(255);

		// Accounts for size of the cell
		strokeWeight(floor(150 / ((cols + rows) / 2)));

		// Draw the walls
		if (this.walls[0]) {
			line(x, y, x + w, y);
		}
		if (this.walls[1]) {
			line(x + w, y, x + w, y + w);
		}
		if (this.walls[2]) {
			line(x + w, y + w, x, y + w);
		}
		if (this.walls[3]) {
			line(x, y + w, x, y);
		}

		// Only fill with color if visited
		if (this.visited) {
			noStroke();
			fill(255, 0, 255, 100);
			rect(x, y, w, w);
		}
	};

	this.highlight = function () {
		// Highlights this cell in a different color
		// Used for showing the current cell of the backtracker

		var x = this.i * w;
		var y = this.j * w;

		noStroke();
		fill(0, 0, 255, 100);
		rect(x, y, w, w);
	};

	this.getNeighbors = function () {
		// Returns all neighbors not seperated by a wall

		var neighbors = [];
		if (!this.walls[0]) {
			neighbors.push(grid[this.i][this.j - 1]);
		}
		if (!this.walls[1]) {
			neighbors.push(grid[this.i + 1][this.j]);
		}
		if (!this.walls[2]) {
			neighbors.push(grid[this.i][this.j + 1]);
		}
		if (!this.walls[3]) {
			neighbors.push(grid[this.i - 1][this.j]);
		}
		return neighbors;
	};

	this.getNeighborWithWall = function () {
		// Returns a random neighboring cell that is seperated ...
		// ... by a wall

		var neighbors = [];

		// Checks for edges because they don't have neighbors
		var neighbors = [];
		if (j > 0) {
			var top = grid[this.i][this.j - 1];
		} else {
			var top = grid[-1];
		}
		if (i < cols - 1) {
			var right = grid[this.i + 1][this.j];
		} else {
			var right = grid[-1];
		}
		if (j < rows - 1) {
			var bottom = grid[this.i][this.j + 1];
		} else {
			var bottom = grid[-1];
		}
		if (i > 0) {
			var left = grid[this.i - 1][this.j];
		} else {
			var left = grid[-1];
		}

		// Only push if seperated by wall
		if (top && this.walls[0]) {
			neighbors.push(grid[this.i][this.j - 1]);
		}
		if (right && this.walls[1]) {
			neighbors.push(grid[this.i + 1][this.j]);
		}
		if (bottom && this.walls[2]) {
			neighbors.push(grid[this.i][this.j + 1]);
		}
		if (left && this.walls[3]) {
			neighbors.push(grid[this.i - 1][this.j]);
		}

		if (neighbors.length > 0) {
			var r = floor(random(0, neighbors.length));
			return neighbors[r];
		} else {
			return undefined;
		}
	};
}

function setup() {
	createCanvas(650, 650);
	startValuesInit();

	// Makes it so pressing enter on the input starts the program
	var wallsInput = document.getElementById("formWalls");
	wallsInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			startProgram();
		}
	});
}

function draw() {
	// Runs every frame when not paused
	// Runs the correct function for the frame

	// This should be done with states
	if (!mazeDone) {
		// Generate the maze until it's done
		mazeGen();
	} else {
		// Draw all the cells
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				grid[i][j].show();
			}
		}
		if (!extraWallsRemoved) {
			removeExtraWalls();
			// Only runs once
			extraWallsRemoved = true;
		} else {
			// The pathfinding algorithm
			aStar();
		}
	}
}

function startValuesInit() {
	// Set all values to the starting ones and clear canvas
	clear();

	w = width / cols;
	h = height / rows;
	closedSet = [];
	openSet = [];
	stack = [];
	doOnce = false;
	mazeDone = false;
	extraWallsRemoved = false;
	percentOfWallsToRemove = 0;
	path = [];
	doMaze = false;
	paused = true;

	// Make the array 2D
	for (var i = 0; i < cols; i++) {
		grid[i] = new Array(rows);
	}

	// Add cell to every spot in the grid
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			grid[i][j] = new Cell(i, j);
		}
	}

	// Start and end cells
	start = grid[0][0];
	end = grid[cols - 1][rows - 1];
	openSet.push(start);
	current = start;
	noLoop();
}

function addStartOptions() {
	// Might not exists so check is necessary
	if (document.getElementById("pauseBtn")) {
		document.getElementById("pauseBtn").remove();
	}
	if (document.getElementById("resetBtn")) {
		document.getElementById("resetBtn").remove();
	}

	// The elements aren't removed so they just need to be set to visible
	document.getElementById("mazeText").style.visibility = "visible";
	document.getElementById("wallsText").style.visibility = "visible";
	document.getElementById("formWalls").style.visibility = "visible";
	document.getElementById("formWalls").value = "";
	document.getElementById("showMaze").style.visibility = "visible";
	document.getElementById("startBtn").style.visibility = "visible";
}

function aStar() {
	// Pathfinding algorithm

	if (openSet.length > 0) {
		// Choose the cell with best chance of being the correct next step
		var winner = 0;
		for (var i = 0; i < openSet.length; i++) {
			if (openSet[i].f < openSet[winner].f) {
				winner = i;
			}
		}
		current = openSet[winner];

		if (current == end) {
			// SHORTEST PATH FOUND!
			console.log("SOLVED");
			document.getElementById("pauseBtn").remove();
			noLoop();
		}

		// Cell has now been stepped through
		removeFromArray(openSet, current);
		closedSet.push(current);

		// Goes through all available neighbors
		// Available being without a wall and not closed
		var neighbors = current.getNeighbors();
		for (var i = 0; i < neighbors.length; i++) {
			var neighbor = neighbors[i];

			var newPath = false;
			if (!closedSet.includes(neighbor) && !neighbor.wall) {
				// Setting how many steps it takes to reach neighbor from the starting cell
				var tempG = current.g + 1;
				if (openSet.includes(neighbor)) {
					// Another cell might already have a shorter path to the cell ...
					// ... so check before setting the new
					if (tempG < neighbor.g) {
						neighbor.g = tempG;
						newPath = true;
					}
				} else {
					neighbor.g = tempG;
					newPath = true;
					openSet.push(neighbor);
				}
				if (newPath) {
					// How good a cell is for the path considers both steps taken from the starting cell ...
					// ... including walking around walls and the absolute distance to the end not considering walls
					neighbor.h = heuristic(neighbor, end);
					neighbor.f = neighbor.g + neighbor.h;
					// Remembers that the path to it is from the current one so the path can be drawn later
					neighbor.previous = current;
				}
			}
		}
	} else {
		// Failsafe in case an unsolvable maze is created
		// Should never happen unless there is a bug
		console.log("No Solution");
		document.getElementById("pauseBtn").remove();
		noLoop();
	}

	// Find the path
	path = [];
	var temp = current;
	path.push(temp);
	while (temp.previous) {
		path.push(temp.previous);
		temp = temp.previous;
	}

	noFill();
	if (current === end) {
		stroke(0, 255, 0);
	} else {
		stroke(0, 0, 255);
	}
	strokeWeight(floor(150 / ((cols + rows) / 2)));
	beginShape();
	for (var i = 0; i < path.length; i++) {
		vertex(path[i].i * w + w / 2, path[i].j * h + h / 2);
	}
	endShape();
}

function mazeGen() {
	// Backtracker that generates the maze

	// Highlights current cell for visibility
	current.visited = true;
	current.highlight();
	if (doMaze) {
		current.show();
	}

	// Gets random unvisited neighbor
	var next = current.checkNeighbors();
	if (next) {
		// Makes cell visited
		next.visited = true;
		stack.push(current);
		removeWalls(current, next);
		// Next iteration will use "next" cell which has now been set to visited
		current = next;
	} else if (stack.length > 0) {
		// Sets current to the cell visited before the current one
		current = stack.pop();
	}
	if (current == start) {
		// Because it backtracks it will always go back to the start
		mazeDone = true;
	}
}

function removeExtraWalls() {
	var amountOfWalls = getAmountOfWalls();

	// Removes one wall every loop unless the failsafe is hit
	for (var i = 0; i < amountOfWalls * (percentOfWallsToRemove * 0.01); i++) {
		var a = grid[floor(random(0, cols))][floor(random(0, rows))];
		var b = a.getNeighborWithWall();
		if (b) {
			removeWalls(a, b);
		} else {
			// Fail safe incase the function returns undefined
			// Will happen when a cell doesn't have neighbors
			i--;
		}
	}
}

function removeWalls(a, b) {
	// Removes the two walls (making up a single wall) between two cells

	// Because they are only 1 (abs) apart direction can be gotten this way:
	var x = a.i - b.i;
	if (x === 1) {
		a.walls[3] = false;
		b.walls[1] = false;
	} else if (x === -1) {
		a.walls[1] = false;
		b.walls[3] = false;
	}

	// Because they are only 1 (abs) apart direction can be gotten this way:
	var y = a.j - b.j;
	if (y === 1) {
		a.walls[0] = false;
		b.walls[2] = false;
	} else if (y === -1) {
		a.walls[2] = false;
		b.walls[0] = false;
	}
}

function getAmountOfWalls() {
	// Gets all walls not counting edges

	var amountOfWalls = 0;

	// Check all walls of every cell
	for (gridX in grid) {
		gridRow = grid[gridX];
		for (gridY in gridRow) {
			for (cellWall in grid[gridX][gridY].walls) {
				if (grid[gridX][gridY].walls[cellWall]) {
					amountOfWalls++;
				}
			}
		}
	}

	// Edge walls can't be used for anything so they get ignored
	var amountOfEdgeWalls = cols * 2 + rows * 2 + 4;
	amountOfWalls -= amountOfEdgeWalls;

	// Every non-edge "wall" is made up of two walls, one for each of the cells it is between
	amountOfWalls = floor(amountOfWalls / 2);

	return amountOfWalls;
}

function startProgram() {
	// Fixes all the HTML elements and gets their values before starting the program

	var percentOfWalls = document.getElementById("formWalls").value;
	// Check for user error
	if (isNaN(percentOfWalls)) {
		document.getElementById("form1").reset();
		alert("Error: Please input a valid number");
		return undefined;
	}
	// In case of floats
	percentOfWallsToRemove = parseInt(percentOfWalls);
	if (document.getElementById("showMaze").checked == true) {
		doMaze = true;
	}

	// Hide all options
	document.getElementById("mazeText").style.visibility = "hidden";
	document.getElementById("wallsText").style.visibility = "hidden";
	document.getElementById("formWalls").style.visibility = "hidden";
	document.getElementById("showMaze").style.visibility = "hidden";
	document.getElementById("startBtn").style.visibility = "hidden";

	let optionsForm = document.getElementById("formDiv");

	// Add reset and pause buttons
	let resetBtn = document.createElement("button");
	resetBtn.id = "resetBtn";
	resetBtn.addEventListener(
		"click",
		function () {
			resetProject();
		},
		false
	);
	resetBtn.innerHTML = "Reset";

	// Because the other element are hidden they look nicer as the first elements
	// Will be the second element because it's added first
	document
		.getElementById("formDiv")
		.insertBefore(resetBtn, optionsForm.firstChild);

	let pBtn = document.createElement("button");
	pBtn.id = "pauseBtn";
	pBtn.addEventListener(
		"click",
		function () {
			doPause();
		},
		false
	);
	pBtn.innerHTML = "Pause";

	// Because the other element are hidden it looks nicer as the first element
	document.getElementById("formDiv").insertBefore(pBtn, optionsForm.firstChild);

	// Start running
	paused = false;
	loop();
}

function doPause() {
	// Switch between paused and unpaused

	if (paused) {
		loop();
		paused = false;
	} else {
		noLoop();
		paused = true;
	}
}

function resetProject() {
	// Refreshing without refreshing page

	startValuesInit();
	addStartOptions();
}
