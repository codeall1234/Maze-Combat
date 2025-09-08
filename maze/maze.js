const GRID_SIZE = 96;
let playerPosition = 0;

window.addEventListener("DOMContentLoaded", () => {
  createMazeGrid();
});

function createMazeGrid() {
  const maze = document.getElementById("maze");
  maze.innerHTML = "";

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const div = document.createElement("div");
      div.classList.add("mazeSpot");
      div.dataset.row = r;
      div.dataset.col = c;
      maze.appendChild(div);
    }
  }
}

const idx = (r, c) => r * GRID_SIZE + c;
const cell = (r, c) => document.getElementById("maze").children[idx(r, c)];

function generateMaze() {
  // Reset all walls
  document.querySelectorAll(".mazeSpot").forEach(el => el.className = "mazeSpot");

  // Guarantee a path from start (0,0) to center (mid, mid)
  const mid = GRID_SIZE / 2;
  let r = 0, c = 0;
  cell(r, c).classList.add("path");

  // Mark the direct path as visited
  const visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
  visited[r][c] = true;
  while (r < mid) {
    r++;
    cell(r, c).classList.add("path");
    visited[r][c] = true;
  }
  while (c < mid) {
    c++;
    cell(r, c).classList.add("path");
    visited[r][c] = true;
  }

  // Recursive backtracker
  function carve(r, c) {
    visited[r][c] = true;
    cell(r, c).classList.add("path");
    const dirs = shuffle([[0, 1], [1, 0], [0, -1], [-1, 0]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr * 2, nc = c + dc * 2;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited[nr][nc]) {
        cell(r + dr, c + dc).classList.add("path"); // carve connection
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);

  // Carve special rooms (with guaranteed connection corridors)
  carveRoom(0, 0, 6, 6, ["right", "down"]); // top-left (2 entrances)
  carveRoom(0, GRID_SIZE - 6, 6, 6, ["left", "down"]); // top-right (2 entrances)
  carveRoom(GRID_SIZE - 6, 0, 6, 6, ["up", "right"]); // bottom-left (2 entrances)
  carveRoom(GRID_SIZE - 6, GRID_SIZE - 6, 6, 6, ["up", "left"]); // bottom-right (2 entrances)

  // Midpoint rooms (3 entrances each)
  carveRoom(0, mid - 2, 5, 5, ["down", "left", "right"]);    // top midpoint
  carveRoom(GRID_SIZE - 5, mid - 2, 5, 5, ["up", "left", "right"]); // bottom midpoint
  carveRoom(mid - 2, 0, 5, 5, ["up", "down", "right"]);   // left midpoint
  carveRoom(mid - 2, GRID_SIZE - 5, 5, 5, ["up", "down", "left"]); // right midpoint

  // Center room (4 entrances)
  carveRoom(mid - 5, mid - 5, 10, 10, ["up", "down", "left", "right"], true);

  // Reset player to start
  playerPosition = 0;
  const board = document.getElementById("maze");
  const playerElement = document.querySelector(".player") || document.createElement("div");
  playerElement.className = "player";
  board.children[playerPosition].appendChild(playerElement);

  // Tag start/end
  cell(0, 0).classList.add("start");
  cell(mid, mid).classList.add("end");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Carve room + guaranteed outward corridors to connect to the maze
function carveRoom(r0, c0, h, w, exits, isCenter = false) {
  // Carve room interior
  for (let r = r0; r < r0 + h; r++) {
    for (let c = c0; c < c0 + w; c++) {
      if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
        cell(r, c).classList.add("path");
      }
    }
  }

  // Fill boundaries except for exits
  for (let r = r0; r < r0 + h; r++) {
    // Left boundary
    if (!exits.includes("left") || r !== Math.floor(r0 + h / 2)) {
      if (c0 > 0) cell(r, c0 - 1).classList.remove("path");
    }
    // Right boundary
    if (!exits.includes("right") || r !== Math.floor(r0 + h / 2)) {
      if (c0 + w < GRID_SIZE) cell(r, c0 + w).classList.remove("path");
    }
  }
  for (let c = c0; c < c0 + w; c++) {
    // Top boundary
    if (!exits.includes("up") || c !== Math.floor(c0 + w / 2)) {
      if (r0 > 0) cell(r0 - 1, c).classList.remove("path");
    }
    // Bottom boundary
    if (!exits.includes("down") || c !== Math.floor(c0 + w / 2)) {
      if (r0 + h < GRID_SIZE) cell(r0 + h, c).classList.remove("path");
    }
  }

  // Helper: dig corridor until it connects with an existing maze path outside
  function dig(r, c, dr, dc) {
    while (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
      cell(r, c).classList.add("path");
      // stop if at least one adjacent is already a carved path outside the room
      if (
        !(r >= r0 && r < r0 + h && c >= c0 && c < c0 + w) &&
        cell(r, c).classList.contains("path")
      ) {
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // Open exits (with guaranteed connections)
  if (exits.includes("up") && r0 > 0) {
    let cx = Math.floor(c0 + w / 2);
    dig(r0 - 1, cx, -1, 0);
  }
  if (exits.includes("down") && r0 + h < GRID_SIZE) {
    let cx = Math.floor(c0 + w / 2);
    dig(r0 + h, cx, 1, 0);
  }
  if (exits.includes("left") && c0 > 0) {
    let ry = Math.floor(r0 + h / 2);
    dig(ry, c0 - 1, 0, -1);
  }
  if (exits.includes("right") && c0 + w < GRID_SIZE) {
    let ry = Math.floor(r0 + h / 2);
    dig(ry, c0 + w, 0, 1);
  }
}

// Movement
document.addEventListener("keydown", (e) => {
  const board = document.getElementById("maze");
  const player = document.querySelector(".player");
  let newPos = playerPosition;

  if (e.key === "w") newPos -= GRID_SIZE;
  else if (e.key === "s") newPos += GRID_SIZE;
  else if (e.key === "a") newPos -= 1;
  else if (e.key === "d") newPos += 1;
  else return;

  const target = board.children[newPos];
  if (!target || (!target.classList.contains("path") &&
                  !target.classList.contains("start") &&
                  !target.classList.contains("end"))) return;

  playerPosition = newPos;
  target.appendChild(player)
    e.preventDefault()});