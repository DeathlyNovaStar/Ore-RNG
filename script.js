let saveData = JSON.parse(localStorage.getItem("saveData")) || {
    cash: 100,
    rollCount: 0,
    inventory: {
        Stone: 0,
        Coal: 0,
        Iron: 0,
        Gold: 0,
        Diamond: 0,
        Void: 0
    },
    lastOre: "None",
    history: ["None", "None", "None"]
};

let playerCash = saveData.cash;
let rollCount = saveData.rollCount;
let oreWallet = saveData.inventory;
let historyList = saveData.history;
let lastOre = saveData.lastOre;

const ores = [
    { name: "Stone", weight: 50, value: 2, color: "hsl(0, 0%, 50%)" },
    { name: "Coal", weight: 30, value: 5, color: "hsl(0, 0%, 35%)" },
    { name: "Iron", weight: 10, value: 15, color: "hsl(0, 100%, 94%)" },
    { name: "Gold", weight: 6, value: 50, color: "hsl(51, 98%, 53%)" },
    { name: "Diamond", weight: 3, value: 100, color: "hsl(199, 98%, 65%)" },
    { name: "Void", weight: 1, value: 250, color: "hsl(253, 100%, 65%)" }
];

const oreColors = Object.fromEntries(ores.map(o => [o.name, o.color]));
const oreMarketValues = Object.fromEntries(ores.map(o => [o.name, o.value]));
const breakingSound = new Audio("Audio/breaking.mp3");
const diamondSound = new Audio("Audio/diamond.mp3");
const epicSound = new Audio("Audio/epic.mp3");
const rolledItem = document.getElementById("ore");
const previousItem = document.getElementById("prevOre");
const rollButton = document.getElementById("button");
const walletDisplay = document.getElementById("wallet");
const mainframeEl = document.getElementById("mainframe");
const sidebarEl = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");

walletDisplay.textContent = `Cash: $${playerCash}`;
document.getElementById("counterDisplay").textContent = `Total Rolls: ${rollCount}`;
previousItem.textContent = `Previous Ore: ${lastOre}`;

document.getElementById("ore1").textContent = `1. ${historyList[0]}`;
document.getElementById("ore2").textContent = `2. ${historyList[1]}`;
document.getElementById("ore3").textContent = `3. ${historyList[2]}`;

updateSidebarUI();

function getRandomOre() {
    let total = ores.reduce((s, o) => s + o.weight, 0);
    let r = Math.random() * total;

    for (let o of ores) {
        if (r < o.weight) return o;
        r -= o.weight;
    }
}

function rollOre() {
    if (playerCash < 5) {
        rollButton.disabled = true;
        rollButton.textContent = "Not enough cash!";
        return;
    }
    breakingSound.currentTime = 0;
    breakingSound.play();

    playerCash -= 5;
    walletDisplay.textContent = `Cash: $${playerCash}`;

    rollButton.disabled = true;
    rollButton.textContent = "Mining...";

    rolledItem.textContent = "Mining...";
    rolledItem.style.color = "white";

    setTimeout(() => {
        const ore = getRandomOre();
        const rolledOre = ore.name;
        breakingSound.pause();
        breakingSound.currentTime = 0;

        lastOre = rolledOre;

        rolledItem.textContent = rolledOre;
        rolledItem.style.color = ore.color;

        previousItem.textContent = `Previous Ore: ${rolledOre}`;

        historyList.unshift(rolledOre);
        historyList.pop();

        document.getElementById("ore1").textContent = `1. ${historyList[0]}`;
        document.getElementById("ore2").textContent = `2. ${historyList[1]}`;
        document.getElementById("ore3").textContent = `3. ${historyList[2]}`;

        document.getElementById("ore1").style.color = oreColors[historyList[0]];
        document.getElementById("ore2").style.color = oreColors[historyList[1]];
        document.getElementById("ore3").style.color = oreColors[historyList[2]];

        oreWallet[rolledOre]++;

        rollCount++;
        document.getElementById("counterDisplay").textContent = `Total Rolls: ${rollCount}`;

        mainframeEl.classList.remove("faint-glow");
        mainframeEl.classList.remove("void-glow");
        void mainframeEl.offsetWidth;

        if (rolledOre === "Void") {
            mainframeEl.classList.add("void-glow");
            epicSound.currentTime = 0;
            epicSound.play();
            rollButton.disabled = true;
            rollButton.textContent = "LOCKED...";

            setTimeout(() => {
                mainframeEl.classList.remove("void-glow");
                rollButton.disabled = playerCash < 5;
                rollButton.textContent = playerCash < 5 ? "Not enough cash!" : "Mine";
            }, 3000);
        } else {
            rollButton.disabled = playerCash < 5;
            rollButton.textContent = playerCash < 5 ? "Not enough cash!" : "Mine";
        }

        if (rolledOre === "Diamond") {
            mainframeEl.style.setProperty('--glow-color', ore.color);
            mainframeEl.style.setProperty('--glow-alpha', "hsla(199, 98%, 65%, 0.4)");
            diamondSound.currentTime = 0;
            diamondSound.play();
            requestAnimationFrame(() => {
                mainframeEl.classList.add("faint-glow");
            });
        }

        walletDisplay.textContent = `Cash: $${playerCash}`;

        updateSidebarUI();
        saveGame();
    }, 1000);
}

function updateSidebarUI() {
    document.getElementById("vaultStone").textContent = oreWallet.Stone;
    document.getElementById("vaultCoal").textContent = oreWallet.Coal;
    document.getElementById("vaultIron").textContent = oreWallet.Iron;
    document.getElementById("vaultGold").textContent = oreWallet.Gold;
    document.getElementById("vaultDiamond").textContent = oreWallet.Diamond;
    document.getElementById("vaultVoid").textContent = oreWallet.Void;
}

function saveGame() {
    localStorage.setItem("saveData", JSON.stringify({
        cash: playerCash,
        rollCount: rollCount,
        inventory: oreWallet,
        lastOre: lastOre,
        history: historyList
    }));
}

function sellCategory(type) {
    const amt = oreWallet[type];
    if (amt <= 0) return;

    playerCash += amt * oreMarketValues[type];
    oreWallet[type] = 0;

    walletDisplay.textContent = `Cash: $${playerCash}`;
    updateSidebarUI();
    saveGame();

    if (playerCash >= 5) {
        rollButton.disabled = false;
        rollButton.textContent = "Mine";
    }
}

function sellAllOres() {
    let earned = 0;

    for (let o in oreWallet) {
        earned += oreWallet[o] * oreMarketValues[o];
        oreWallet[o] = 0;
    }

    if (earned <= 0) return;

    playerCash += earned;

    walletDisplay.textContent = `Cash: $${playerCash}`;
    updateSidebarUI();
    saveGame();

    if (playerCash >= 5) {
        rollButton.disabled = false;
        rollButton.textContent = "Mine";
    }
}

toggleBtn.addEventListener("click", () => {
    const open = sidebarEl.classList.toggle("sidebar-open");
    sidebarEl.classList.toggle("sidebar-hidden", !open);
    toggleBtn.textContent = open ? "◀" : "▶";
});

document.querySelectorAll(".sell-btn").forEach(b => {
    b.addEventListener("click", e => {
        sellCategory(e.target.dataset.ore);
    });
});

document.getElementById("sell-all-btn").addEventListener("click", sellAllOres);
rollButton.addEventListener("click", rollOre);
