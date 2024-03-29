function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// adapted from jstates
function createState(initialState) {
    let subscribers = [];
    let state = initialState;

    return ({
        subscribers,
        subscribe: (fn) => subscribers.push(fn),
        setState: (newState) => {
            state = newState;
            subscribers.forEach(fn => fn(newState));
        },
        get state() {
            return state;
        },
    });
}

const selectionButtons = document.querySelector('#selection-buttons');
const fieldElement = document.querySelector('#field');

const selectedButton = createState("empty");

const selectionButton = (text, target = selectionButtons) => {
    let rootNode = target.appendChild(document.createElement('div'));
    rootNode.style = "display: flex; flex-direction: row; align-items: center; gap: 5px;";

    let buttonNode = rootNode.appendChild(document.createElement('div'));
    buttonNode.innerText = text;

    let exampleNode = rootNode.appendChild(document.createElement('div'));
    exampleNode.className = text;
    exampleNode.style = "width: 10px; height: 10px;";

    buttonNode.addEventListener('click', () => {
        selectedButton.setState(text);
    });

    const updateButton = (selected) => {
        buttonNode.classList = selected == text ? "selected" : "";
    }

    selectedButton.subscribe(updateButton);
    updateButton(selectedButton.state);
};

// let gridSize = [75, 75];
const gridSize = [75, 75];

const grid = new Array(gridSize[0]);

const initialRender = () => {
    for (let x = 0; x < gridSize[0]; x++) {
        let xNode = fieldElement.appendChild(document.createElement("div"));
        xNode.setAttribute("x-pos", x);
        grid[x] = new Array(gridSize[1]).fill("empty");

        for (let y = 0; y < gridSize[1]; y++) {
            let yNode = xNode.appendChild(document.createElement("div"));
            yNode.classList = "empty";
            yNode.setAttribute("x-pos", x);
            yNode.setAttribute("y-pos", y);
            yNode.setAttribute("element", true);
        }
    }
}

const render = () => {
    let xNode = fieldElement.firstChild;
    while (xNode) {
        let yNode = xNode.firstChild;
        while (yNode) {
            yNode.classList = grid[yNode.getAttribute("x-pos")][yNode.getAttribute("y-pos")];
            yNode = yNode.nextSibling;
        }
        xNode = xNode.nextSibling; // CS 290 has applications ?!?!
    }
}

const types = ["empty", "rock", "sand", "water"];

const WATER_BLOCKING = ["rock", "sand"];
const WATER_MOVABLE = ["empty"];

const SAND_BLOCKING = ["rock", "sand"];
const SAND_MOVABLE = ["empty", "water"];
const SAND_STABILITY_THRESHOLD = 3; // how many sand blocks are needed to be stable

const simulationStep = () => {
    // left-to-right, bottom-to-top
    for (let x = 0; x < gridSize[0]; x++) {
        for (let y = gridSize[1] - 1; y >= 0; y--) {
            let element = grid[x][y];
            if (element == "empty") continue;

            if (element == "sand") {
                if (y + 1 >= gridSize[1]) continue;
                if (SAND_MOVABLE.includes(grid[x][y + 1])) {
                    let temp = grid[x][y + 1];
                    grid[x][y + 1] = "sand";
                    grid[x][y] = temp;
                    continue;
                }

                let stable = true;

                for (let i = x - Math.floor(SAND_STABILITY_THRESHOLD / 2); i <= x + Math.floor(SAND_STABILITY_THRESHOLD / 2); i++) {
                    if (i < 0 || i >= gridSize[0]) continue;
                    if (SAND_BLOCKING.includes(grid[i][y + 1])) continue;
                    stable = false;
                }

                if (stable) continue;

                if (Math.random() > 0.5) {
                    // sand spreads out, right
                    if (x + 1 < gridSize[0] && !SAND_BLOCKING.includes(grid[x + 1]?.[y])) {
                        let temp = grid[x + 1][y];
                        grid[x + 1][y] = "sand";
                        grid[x][y] = temp;
                        continue;
                    }
                } else {

                    // sand spreads out, left
                    if (x - 1 >= 0 && !SAND_BLOCKING.includes(grid[x - 1]?.[y])) {

                        let temp = grid[x - 1][y];
                        grid[x - 1][y] = "sand";
                        grid[x][y] = temp;
                        continue;
                    }
                }
            }

            if (element == "water") {
                // water falls down and spreads out
                if (y + 1 >= gridSize[1]) continue;
                if (WATER_MOVABLE.includes(grid[x][y + 1])) {
                    let temp = grid[x][y + 1];
                    grid[x][y + 1] = "water";
                    grid[x][y] = temp;
                    continue;
                }

                if (Math.random() > 0.5) {
                    // water spreads out, right
                    if (x + 1 < gridSize[0] && !WATER_BLOCKING.includes(grid[x + 1]?.[y])) {
                        let temp = grid[x + 1][y];
                        grid[x + 1][y] = "water";
                        grid[x][y] = temp;
                        continue;
                    }
                } else {

                    // water spreads out, left
                    if (x - 1 >= 0 && !WATER_BLOCKING.includes(grid[x - 1]?.[y])) {

                        let temp = grid[x - 1][y];
                        grid[x - 1][y] = "water";
                        grid[x][y] = temp;
                        continue;
                    }
                }


            }
        }
    }
}

types.forEach(v => selectionButton(v, selectionButtons));


const editRadiusLabel = document.createElement('label');
editRadiusLabel.innerText = "Edit radius";
selectionButtons.appendChild(editRadiusLabel);

const editRadius = document.createElement('input');
editRadius.type = "number";
editRadius.min = 1;
editRadius.max = 10;
editRadius.value = 1;
selectionButtons.appendChild(editRadius);

// add a square and a circle brush
const brushTypes = ["square", "circle"];
const brushType = createState(brushTypes[0]);

const brushTypeButton = (text, target = selectionButtons) => {
    let rootNode = target.appendChild(document.createElement('div'));
    rootNode.style = "display: flex; flex-direction: row; align-items: center; gap: 5px;";

    let buttonNode = rootNode.appendChild(document.createElement('div'));
    buttonNode.innerText = text;

    buttonNode.addEventListener('click', () => {
        brushType.setState(text);
    });

    const updateButton = (selected) => {
        buttonNode.classList = selected == text ? "selected" : "";
    }

    brushType.subscribe(updateButton);
    updateButton(brushType.state);
};

brushTypes.forEach(v => brushTypeButton(v, selectionButtons));

const clearButton = selectionButtons.appendChild(document.createElement('button'));
clearButton.innerText = "clear";

clearButton.addEventListener('click', () => {
    for (let x = 0; x < gridSize[0]; x++) {
        for (let y = 0; y < gridSize[1]; y++) {
            grid[x][y] = "empty";
        }
    }
    render();
});

let saved = null;

const saveButton = selectionButtons.appendChild(document.createElement('button'));
saveButton.innerText = "save";

const loadButton = selectionButtons.appendChild(document.createElement('button'));
loadButton.innerText = "load";

const simulationSpeedLabel = document.createElement('label');
simulationSpeedLabel.innerText = "Simulation speed (10)";
selectionButtons.appendChild(simulationSpeedLabel);

const simulationSpeed = document.createElement('input');
simulationSpeed.type = "range";
simulationSpeed.min = 1;
simulationSpeed.max = 100;
simulationSpeed.value = 10;
simulationSpeed.labe = "simulationSpeed";

selectionButtons.appendChild(simulationSpeed);

const stepSimulationButton = selectionButtons.appendChild(document.createElement('button'));
stepSimulationButton.innerText = "step";

initialRender();

let loopInterval = createState(0);

const start = () => {
    loopInterval.setState(setInterval(() => {
        simulationStep();
        render();
    }, 1 / simulationSpeed.valueAsNumber * 1000));
}

const stop = () => {
    clearInterval(loopInterval.state);
    loopInterval.setState(0);
}

stepSimulationButton.addEventListener('click', () => {
    if (loopInterval.state != 0) return; // don't step if running
    simulationStep();
    render();
});

simulationSpeed.addEventListener('input', () => {
    simulationSpeedLabel.innerText = `Simulation speed (${simulationSpeed.value})`;
    if (loopInterval.state != 0) {
        stop();
        start();
    }
});

const save = () => {
    let copiedGrid = new Array(gridSize[0]);

    for (let x = 0; x < gridSize[0]; x++) {
        copiedGrid[x] = new Array(gridSize[1]);
        for (let y = 0; y < gridSize[1]; y++) {
            copiedGrid[x][y] = grid[x][y];
        }
    }

    saved = {
        grid: copiedGrid,
    }

    saveButton.innerText = "saved";
    setTimeout(() => saveButton.innerText = "save", 1000);
}

const load = () => {
    if (saved == null) return;
    // gridSize = saved.gridSize;
    // initialRender();
    loadButton.innerText = "loaded";
    let restart = false;
    if (loopInterval.state != 0) {
        restart = true;
        stop();
    }

    for (let x = 0; x < gridSize[0]; x++) {
        for (let y = 0; y < gridSize[1]; y++) {
            grid[x][y] = saved.grid[x][y];
        }
    }

    render();
    if (restart) start();

    setTimeout(() => loadButton.innerText = "load", 1000);
}

saveButton.addEventListener('click', save);
loadButton.addEventListener('click', load);

let startStopButton = selectionButtons.appendChild(document.createElement('button'));
loopInterval.subscribe((state) => {
    startStopButton.innerText = state == 0 ? "start" : "stop";
    startStopButton.removeEventListener('click', state == 0 ? stop : start);
    startStopButton.addEventListener('click', state == 0 ? start : stop);
});
loopInterval.setState(0);

window.addEventListener('mousemove', (e) => {
    if ((e.buttons & 1) < 1) return;

    let element = e.target;
    if (element == null) return;
    if (!element.getAttribute("element")) return;

    let center = [parseInt(element.getAttribute("x-pos")), parseInt(element.getAttribute("y-pos"))];
    let radius = parseInt(editRadius.value);

    switch (brushType.state) {
        case "square":
            for (let x = center[0] - radius; x <= center[0] + radius; x++) {
                for (let y = center[1] - radius; y <= center[1] + radius; y++) {
                    if (x < 0 || x >= gridSize[0]) continue;
                    if (y < 0 || y >= gridSize[1]) continue;
                    grid[x][y] = selectedButton.state;
                }
            }
            break;
        case "circle":
            for (let x = center[0] - radius; x <= center[0] + radius; x++) {
                for (let y = center[1] - radius; y <= center[1] + radius; y++) {
                    if (x < 0 || x >= gridSize[0]) continue;
                    if (y < 0 || y >= gridSize[1]) continue;
                    if (Math.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2) > radius) continue;
                    grid[x][y] = selectedButton.state;
                }
            }
            break;
    }

    render();
});