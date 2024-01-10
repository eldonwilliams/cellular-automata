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

const WATER_BLOCKING = ["water", "rock"];
const WATER_STABILITY_THRESHOLD = 10; // how many water blocks are needed to be stable

const simulationStep = () => {
    // left-to-right, bottom-to-top
    for (let x = 0; x < gridSize[0]; x++) {
        for (let y = gridSize[1] - 1; y >= 0; y--) {
            let element = grid[x][y];
            if (element == "empty") continue;

            if (element == "water") {
                // water falls down and spreads out
                if (y + 1 >= gridSize[1]) continue;
                if (grid[x][y + 1] == "empty") {
                    let temp = grid[x][y + 1];
                    grid[x][y + 1] = "water";
                    grid[x][y] = temp;
                    continue;
                }

                let waterStabilityCheck = grid
                    .slice(x - Math.floor(WATER_STABILITY_THRESHOLD / 2), x + Math.ceil(WATER_STABILITY_THRESHOLD / 2))
                    .map(x => x[y + 1])
                .filter(x => x == "water");

                // If stable, don't spread
                if (waterStabilityCheck.length >= WATER_STABILITY_THRESHOLD) {
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
initialRender();

let loopInterval = createState(0);

const start = () => {
    loopInterval.setState(setInterval(() => {
        simulationStep();
        render();
    }, 1 / 10));
}

const stop = () => {
    clearInterval(loopInterval.state);
    loopInterval.setState(0);
}

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


    grid[element.getAttribute("x-pos")][element.getAttribute("y-pos")] = selectedButton.state;
    render();
});