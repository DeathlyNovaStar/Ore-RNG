//=========================
//       SAVE DATA
//=========================

let saveData;

try {
    saveData = JSON.parse(localStorage.getItem("saveData"));
} catch (error) {
    console.warn("Save data was corrupted. Starting a fresh save.", error);
    saveData = null;
}

saveData ||= {
    cash: 100,
    rollCount: 0,

    inventory: {
        Dirt: 0,
        CoarseDirt: 0,
        Stone: 0,
        Granite: 0,
        Andesite: 0,
        Diorite: 0,
        Coal: 0
    },
    
    history: Array(20).fill("None"),
    lastOre: "None",
    currentPickaxeIndex: 0
};

let playerCash = saveData.cash;
let rollCount = saveData.rollCount;
let oreWallet = saveData.inventory;
let historyList = saveData.history;
let lastOre = saveData.lastOre;
let dioriteGlowTimeout;
let canRoll = true;
let currentPickaxeIndex = saveData.currentPickaxeIndex || 0;


//=========================
//      ORE DATABASE
//=========================

const ores = [
    {
        name: "Dirt",
        weight: 150,
        value: 5,
        tier: 0,
        color: "hsl(27, 61%, 38%)"
    },
    {
        name: "CoarseDirt",
        weight: 75,
        value: 10,
        tier: 0,
        color: "hsl(19, 70%, 21%)"
    },
    {
        name: "Stone",
        weight: 50,
        value: 25,
        tier: 1,
        color: "hsl(0, 0%, 48%)"
    },
    {
        name: "Granite",
        weight: 15,
        value: 50,
        tier: 2,
        color: "hsl(352, 50%, 38%)"
    },
    {
        name: "Andesite",
        weight: 6,
        value: 100,
        tier: 3,
        color: "hsl(0, 0%, 26%)"
    },
    {
        name: "Diorite",
        weight: 3,
        value: 200,
        tier: 4,
        color: "hsl(0, 0%, 100%)"
    },
    {
        name: "Coal",
        weight: 1,
        value: 500,
        tier: 5,
        color: "hsl(0, 0%, 0%)"
    }
];

const oreColors = Object.fromEntries (ores.map(o => [o.name, o.color]));
const oreMarketValues = Object.fromEntries(ores.map(o => [o.name, o.value]));
for (const ore of ores) {
    if (!Number.isFinite(oreWallet[ore.name])) {
        oreWallet[ore.name] = 0;
    }
}
for (const key of Object.keys(oreWallet)) {
    if (!ores.some(ore => ore.name === key)) {
        delete oreWallet[key];
    }
}

//=========================
//     PICKAXE SYSTEM
//=========================

const pickaxeDisplay = document.getElementById("pickaxe");
const pickaxes = [
    {
        name:"Bare Hands",
        price:0,
        luck:100,
        speed:4000,
        color:"hsl(30,54%,61%)",
        description:"Technically not a pickaxe... but it works! Barely..."
    },
    {
        name: "Wooden Pickaxe",
        price: 500,
        luck: 125,
        speed: 2500,
        color: "hsl(30, 92%, 15%)",
        description: "A wooden handle plus a wooden head. Not the best, but it gets the job done."
    },
    {
        name: "Stone Pickaxe",
        price: 2000,
        luck: 150,
        speed: 2000,
        color: "hsl(0, 0%, 50%)",
        description: "Ever heard of stone vs stone? Somehow... it works."
    },
    {
        name: "Iron Pickaxe",
        price: 5000,
        luck: 200,
        speed: 1000,
        color: "hsl(0, 0%, 84%)",
        description: "Finally, a pickaxe worthy enough to mine with."
    },
    {
        name: "Diamond Pickaxe",
        price: 10000,
        luck: 400,
        speed: 500,
        color: "hsl(180,100%,50%)",
        description: "A legendary pickaxe that makes rare ores tremble."
    }
]
let currentPickaxe = pickaxes[currentPickaxeIndex];
//=========================
//        AUDIO
//=========================

const breakingSound = new Audio("Audio/breaking.mp3");
const diamondSound = new Audio("Audio/diamond.mp3");
const epicSound = new Audio("Audio/epic.mp3");


//=========================
//      DOM ELEMENTS
//=========================

const rolledItem = document.getElementById("ore");
const previousItem = document.getElementById("prevOre");
const walletDisplay = document.getElementById("wallet");
const rollButton = document.getElementById("button");
const counterDisplay = document.getElementById("counterDisplay");
const sidebarEl = document.getElementById("sidebar");
const sellAllBtn = document.getElementById("sell-all-btn");
const resetBtn = document.getElementById("resetBtn");
const toggleBtn = document.getElementById("sidebar-toggle");
const mainframeEl = document.getElementById("mainframe");
const historyDisplay = document.getElementById("historyList");
const upgradePick = document.getElementById("upgradePickBtn");
const upgradePickCost = document.getElementById("upgradePickCost");
const pickaxePopup = document.getElementById("pickaxePopup");
const popupPickaxeName = document.getElementById("popupPickaxeName");
const popupLuck = document.getElementById("popupLuck");
const popupSpeed = document.getElementById("popupSpeed");
const popupDescription = document.getElementById("popupDescription");
const pickaxeLuck = document.getElementById("luck");
const oreChanceElements = {
    Dirt: document.getElementById("dirt"),
    CoarseDirt: document.getElementById("CoarseDirt"),
    Stone: document.getElementById("stone"),
    Granite: document.getElementById("granite"),
    Andesite: document.getElementById("andesite"),
    Diorite: document.getElementById("diorite"),
    Coal: document.getElementById("coal")
};

//=========================
//     INITIALIZATION
//=========================

walletDisplay.textContent = `Cash: $${playerCash}`;
pickaxeDisplay.style.color = currentPickaxe.color;
pickaxeDisplay.textContent = pickaxes[currentPickaxeIndex].name;
upgradePickCost.textContent = `Cost: $${pickaxes[currentPickaxeIndex + 1]?.price || "MAX"}`;
pickaxeLuck.textContent = `${(pickaxes[currentPickaxeIndex + 1]?.luck || 500)}% luck`;

counterDisplay.textContent = `Total Rolls: ${rollCount}`;
previousItem.textContent = `Previous Ore: ${lastOre}`;
if (lastOre !== "None") {
    rolledItem.textContent = lastOre;
    rolledItem.style.color = oreColors[lastOre];
}

updateAllUI();
checkStuck();


//=========================
//      RNG FUNCTIONS
//=========================

function getRandomOre() {

    const luckMultiplier = currentPickaxe.luck / 100;

    const modifiedOres = ores.map(ore => {

        let weight = ore.weight;

        if (ore.tier <= 1) {
            weight /= luckMultiplier;
        }

        if (ore.tier >= 2) {
            weight *= luckMultiplier;
        }

        return {
            ...ore,
            weight
        };
    });


    let total = modifiedOres.reduce((sum, ore) => sum + ore.weight, 0);

    let roll = Math.random() * total;

    for (const ore of modifiedOres) {
        if (roll < ore.weight) {
            return ore;
        }

        roll -= ore.weight;
    }
}

//=========================
//    GAMEPLAY FUNCTIONS
//=========================

function rollOre() {
    
    if (!canRoll) return;
    if (playerCash < 10) {
        rollButton.disabled = true;
        rollButton.textContent = "Not enough cash!";
        return;
    }

    canRoll = false;


    playerCash -= 10;

    if (historyList.length > 20) {
        historyList.pop();
    }

    saveGame();

    walletDisplay.textContent =
        `Cash: $${playerCash}`;

    
    breakingSound.currentTime = 0;
    breakingSound.play();
    rollButton.disabled = true;
    rolledItem.textContent = "Mining...";
    rollButton.textContent = "Mining...";

    setTimeout(() => {
        const ore = getRandomOre();
        const rolledOre = ore.name;
        oreWallet[rolledOre]++;
        lastOre = rolledOre;
        rollCount++;
        historyList.unshift(rolledOre);

        rolledItem.textContent = rolledOre;
        rolledItem.style.color = ore.color;
        previousItem.textContent = `Previous Ore: ${rolledOre}`;
        handleRareEffects(rolledOre, ore);
        updateAllUI();
        saveGame();
        checkStuck();
        breakingSound.pause();
        breakingSound.currentTime = 0;
        updateMineButton();

    }, currentPickaxe.speed);
}

function showCoalReveal() {
    const reveal = document.getElementById("coalReveal");

    reveal.classList.remove("active");

    void reveal.offsetWidth;

    reveal.classList.add("active");

    setTimeout(() => {
        reveal.classList.remove("active");
    }, 4000);
}

function handleRareEffects(rolledOre, ore) {

    mainframeEl.style.setProperty("--ore-color", ore.color);

    canRoll = false;

    const luckMultiplier = currentPickaxe.luck / 100;

    const modifiedOres = ores.map(o => {
        let weight = o.weight;

        if (o.tier <= 1) {
            weight /= luckMultiplier;
        }

        if (o.tier >= 2) {
            weight *= luckMultiplier;
        }

        return {
            ...o,
            weight
        };
    });

    const totalWeight = modifiedOres.reduce(
        (sum, o) => sum + o.weight,
        0
    );

    const chance = totalWeight / ore.weight;

    console.log(`${rolledOre}: 1 / ${chance}`);

    if (chance < 100) {
        canRoll = true;
        updateMineButton();
        return;
    }

    if (chance <= 500) {

        diamondSound.currentTime = 0;
        diamondSound.play();

        mainframeEl.classList.remove("faint-glow");

        requestAnimationFrame(() => {
            mainframeEl.classList.add("faint-glow");
        });

        setTimeout(() => {
            canRoll = true;
            updateMineButton();
        }, 1500);

        return;
    }

    if (chance <= 1000) {

        epicSound.currentTime = 0;
        epicSound.play();

        mainframeEl.classList.remove("diorite-glow");

        requestAnimationFrame(() => {
            mainframeEl.classList.add("diorite-glow");
        });

        clearTimeout(dioriteGlowTimeout);

        dioriteGlowTimeout = setTimeout(() => {
            mainframeEl.classList.remove("diorite-glow");

            canRoll = true;
            updateMineButton();
        }, 2000);

        return;
    }
}

function sellCategory(oreName) {

    const amount = oreWallet[oreName];
    
    if (amount <= 0) return;

    const value = oreMarketValues[oreName];
    const earned = amount * value;

    playerCash += earned;

    oreWallet[oreName] = 0;

    walletDisplay.textContent = `Cash: $${playerCash}`;

    updateAllUI();
    saveGame();
    checkStuck();
}

function sellAllOres() {

    let earned = 0;

    for (const ore of ores) {
        earned += oreWallet[ore.name] * ore.value;
        oreWallet[ore.name] = 0;
    }

    if (earned <= 0) return;

    playerCash += earned;
    walletDisplay.textContent = `Cash: $${playerCash}`;

    updateAllUI();
    saveGame();
    checkStuck();
}

function upgradePickaxe() {
    const nextPickaxeIndex = currentPickaxeIndex + 1;
    if (nextPickaxeIndex >= pickaxes.length) {
        upgradePick.disabled = true;
        upgradePick.textContent = "MAX";
        return;
    }
    if (playerCash < pickaxes[nextPickaxeIndex].price) {
        upgradePick.disabled = true;
            upgradePick.textContent = "Not enough cash!";
        setTimeout(() => {
            upgradePick.disabled = false;
            upgradePick.textContent = "Upgrade Pickaxe";
        }, 2000);
        return;
    }
    playerCash -= pickaxes[nextPickaxeIndex].price;
    
    currentPickaxe = pickaxes[currentPickaxeIndex];
    upgradePickCost.textContent = `Cost: $${pickaxes[nextPickaxeIndex].price}`;
    pickaxeLuck.textContent = `${(pickaxes[nextPickaxeIndex]?.luck)}% luck`;
    if (pickaxes[nextPickaxeIndex]) {
        pickaxeLuck.textContent =
        `${pickaxes[nextPickaxeIndex].luck}% luck`;
    }
    else {
        pickaxeLuck.textContent = "MAX";
    }
    pickaxeDisplay.textContent = pickaxes[nextPickaxeIndex].name;
    currentPickaxeIndex = nextPickaxeIndex;
    currentPickaxe = pickaxes[currentPickaxeIndex];
    pickaxeDisplay.style.color = currentPickaxe.color;
    updateAllUI();
    saveGame();
}

//=========================
//      UI FUNCTIONS
//=========================

function updateWalletUI() {

    walletDisplay.textContent = `Cash: $${playerCash}`;
}

function updateRollCounterUI() {
    counterDisplay.textContent = `Total Rolls: ${rollCount}`;
}

function updateHistoryUI() {

    historyDisplay.innerHTML = "";

    historyList.forEach((ore, index) => {
        const historyLine = document.createElement("p");
        historyLine.textContent = ore;
        historyLine.classList.add("history-line");
        if (oreColors[ore]) {
            historyLine.style.color = oreColors[ore];
        } else {
            historyLine.style.color = "white";
        }
        historyDisplay.appendChild(historyLine);
    });

}

function updateInventoryUI() {
    const inventoryList = document.getElementById("inventoryList")
    inventoryList.innerHTML = "";
    ores.forEach(ore => {
        const row = document.createElement("p");
        row.innerHTML = `
            <span style="color:${ore.color}">
                ${ore.name}: ${oreWallet[ore.name]}
            </span>
            <button
                class="sell-btn"
                data-ore="${ore.name}">
                Sell
            </button>`;
        inventoryList.appendChild(row);
    });
}

function updateMineButton() {
    const canAffordRoll = playerCash >= 10;
    const canMineNow = canRoll && canAffordRoll;

    rollButton.disabled = !canMineNow;

    if (canRoll) {
        rollButton.textContent = canAffordRoll
            ? "Mine"
            : "Not enough cash!";
    }
}

function updateOreChancesUI() {

    const luckMultiplier = currentPickaxe.luck / 100;

    const modifiedOres = ores.map(ore => {

        let weight = ore.weight;

        if (ore.tier <= 1) {
            weight /= luckMultiplier;
        }

        if (ore.tier >= 2) {
            weight *= luckMultiplier;
        }

        return {
            ...ore,
            weight
        };
    });

    const totalWeight = modifiedOres.reduce(
        (sum, ore) => sum + ore.weight,
        0
    );

    modifiedOres.forEach(ore => {
        const chance = totalWeight / ore.weight;

        oreChanceElements[ore.name].innerHTML =
            `<b>${ore.name}: 1 / ${Math.round(chance)}</b>`;
    });
}

function updateAllUI() {
    updateWalletUI();
    updateRollCounterUI();
    updateHistoryUI();
    updateInventoryUI();
    updateMineButton();
    updateOreChancesUI();
}

function checkStuck() {

    const stuck = playerCash < 10 && Object.values(oreWallet).every(v => v === 0);
    resetBtn.style.display = stuck ? "block" : "none";
}


//=========================
//      SAVE SYSTEM
//=========================

function saveGame() {

    localStorage.setItem( "saveData", JSON.stringify({
        cash: playerCash,
        rollCount: rollCount,
        inventory: oreWallet,
        history: historyList,
        lastOre: lastOre,
        currentPickaxeIndex: currentPickaxeIndex
    }));
}


//=========================
//      RESET SYSTEM
//=========================

function resetGame() {

    const confirmReset = confirm( "Are you sure you want to reset all progress?" );

    if (!confirmReset) return;

    localStorage.removeItem( "saveData");
    location.reload();
};


//=========================
//     EVENT LISTENERS
//=========================

rollButton.addEventListener("click", rollOre);
sellAllBtn.addEventListener("click", sellAllOres);
resetBtn.addEventListener("click", resetGame);
upgradePick.addEventListener("click", upgradePickaxe);
pickaxeDisplay.addEventListener("click", ()=>{

    const pickaxe = currentPickaxe;

        popupPickaxeName.textContent = pickaxe.name;
        popupLuck.textContent =
        `Luck: ${pickaxe.luck}%`;

        popupSpeed.textContent =
        `Mining Speed: ${pickaxe.speed}ms`;

        popupDescription.textContent =
        pickaxe.description;

        pickaxePopup.classList.add("show");

    });

document.getElementById("closePopup").addEventListener("click", ()=>{
    pickaxePopup.classList.remove("show");
});


document.getElementById("inventoryList").addEventListener("click", e => {
    if (!e.target.classList.contains("sell-btn")) return;
    sellCategory(e.target.dataset.ore);
});


toggleBtn.addEventListener("click", () => {
    const hidden = sidebarEl.classList.contains("sidebar-hidden");
    sidebarEl.classList.toggle("sidebar-hidden", !hidden);
    toggleBtn.textContent = hidden ? "◀" : "▶";
});

sidebarEl.classList.add("sidebar-hidden");
toggleBtn.textContent = "▶";

//=========================
//      GAME STARTUP
//=========================

updateAllUI();
checkStuck();
saveGame();

