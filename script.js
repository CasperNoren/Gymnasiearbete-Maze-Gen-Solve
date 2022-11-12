function removeFromArray(arr, elt) {
	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i] == elt) {
			arr.splice(i, 1);
		}
	}
}

function heuristic(a, b) {
	//var d = dist(a.i, a.j, b.i, b.j)
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
	this.walls = [true, true, true, true]; //TOP RIGHT BOTTOM LEFT

	this.checkNeighbors = function () {
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
		var x = this.i * w;
		var y = this.j * h;
		stroke(255);
		//strokeWeight(1);

		strokeWeight(floor(150 / ((cols + rows) / 2)));
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

		if (this.visited) {
			noStroke();
			fill(255, 0, 255, 100);
			rect(x, y, w, w);
		}
	};
	this.highlight = function () {
		var x = this.i * w;
		var y = this.j * w;
		noStroke();
		fill(0, 0, 255, 100);
		rect(x, y, w, w);
	};

	this.getNeighbors = function () {
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
	var wallsInput = document.getElementById("formWalls");
	wallsInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			startProgram();
		}
	});
}

function draw() {
	if (!mazeDone) {
		mazeGen();
	} else {
		for (let i = 0; i < cols; i++) {
			for (let j = 0; j < rows; j++) {
				grid[i][j].show();
			}
		}
		if (!extraWallsRemoved) {
			removeExtraWalls();
			extraWallsRemoved = true;
		} else {
			aStar();
		}
	}
}

function startValuesInit() {
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

	for (var i = 0; i < cols; i++) {
		grid[i] = new Array(rows);
	}
	for (var i = 0; i < cols; i++) {
		for (var j = 0; j < rows; j++) {
			grid[i][j] = new Cell(i, j);
		}
	}
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

	document.getElementById("mazeText").style.visibility = "visible";
	document.getElementById("wallsText").style.visibility = "visible";
	document.getElementById("formWalls").style.visibility = "visible";
	document.getElementById("formWalls").value = "";
	document.getElementById("showMaze").style.visibility = "visible";
	document.getElementById("startBtn").style.visibility = "visible";
}

function aStar() {
	if (openSet.length > 0) {
		var winner = 0;
		for (var i = 0; i < openSet.length; i++) {
			if (openSet[i].f < openSet[winner].f) {
				winner = i;
			}
		}
		current = openSet[winner];

		if (current == end) {
			console.log("SOLVED");
			document.getElementById("pauseBtn").remove();
			noLoop();
		}

		removeFromArray(openSet, current);
		closedSet.push(current);

		var neighbors = current.getNeighbors();
		for (var i = 0; i < neighbors.length; i++) {
			var neighbor = neighbors[i];

			var newPath = false;
			if (!closedSet.includes(neighbor) && !neighbor.wall) {
				var tempG = current.g + 1;
				if (openSet.includes(neighbor)) {
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
					neighbor.h = heuristic(neighbor, end);
					neighbor.f = neighbor.g + neighbor.h;
					neighbor.previous = current;
				}
			}
		}
	} else {
		console.log("No Solution");
		document.getElementById("pauseBtn").remove();
		noLoop();
	}

	//Find the path
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
	current.visited = true;
	current.highlight();
	if (doMaze) {
		current.show();
	}

	var next = current.checkNeighbors();
	if (next) {
		next.visited = true;
		stack.push(current);
		removeWalls(current, next);
		current = next;
	} else if (stack.length > 0) {
		current = stack.pop();
	}
	if (current == start) {
		mazeDone = true;
	}
}

function removeExtraWalls() {
	var amountOfWalls = getAmountOfWalls();

	for (var i = 0; i < amountOfWalls * (percentOfWallsToRemove * 0.01); i++) {
		var a = grid[floor(random(0, cols))][floor(random(0, rows))];
		var b = a.getNeighborWithWall();
		if (b) {
			removeWalls(a, b);
		} else {
			//Fail safe incase the function returns undefined
			i--;
		}
	}
}

function removeWalls(a, b) {
	var x = a.i - b.i;
	if (x === 1) {
		a.walls[3] = false;
		b.walls[1] = false;
	} else if (x === -1) {
		a.walls[1] = false;
		b.walls[3] = false;
	}
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
	var percentOfWalls = document.getElementById("formWalls").value;

	if (isNaN(percentOfWalls)) {
		document.getElementById("form1").reset();
		alert("Error: Please input a valid number");
		return undefined;
	}
	percentOfWallsToRemove = parseInt(percentOfWalls);
	if (document.getElementById("showMaze").checked == true) {
		doMaze = true;
	}

	document.getElementById("mazeText").style.visibility = "hidden";
	document.getElementById("wallsText").style.visibility = "hidden";
	document.getElementById("formWalls").style.visibility = "hidden";
	document.getElementById("showMaze").style.visibility = "hidden";
	document.getElementById("startBtn").style.visibility = "hidden";

	let optionsForm = document.getElementById("formDiv");

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

	// Because the other element are hidden it looks nicer as the first element
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

	paused = false;
	loop();
}

function doPause() {
	if (paused) {
		loop();
		paused = false;
	} else {
		noLoop();
		paused = true;
	}
}

function resetProject() {
	startValuesInit();
	addStartOptions();
}
