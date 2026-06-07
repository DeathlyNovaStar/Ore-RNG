//consts
let rollCount = 0; 
let playerCash = 100;
let historyList = ["None", "None", "None"];

let oreWallet = {
    Stone: 0,
    Coal: 0,
    Iron: 0,
    Gold: 0,
    Diamond: 0,
    Void: 0
};

const oreMarketValues = {
    Stone: 2,
    Coal: 5,
    Iron: 15,
    Gold: 50,
    Diamond: 100,
    Void: 250
};

const previousItem = document.getElementById("prevOre");
const rolledItem = document.getElementById("ore");
const rollButton = document.getElementById("button");
const walletDisplay = document.getElementById("wallet");
const sidebarEl = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");
const mainframeEl = document.getElementById("mainframe");

walletDisplay.textContent = `Cash: $${playerCash}`;

function rollOre() {
    if (playerCash < 10) {
        rollButton.disabled = true;
        rollButton.textContent = "BROKE!";
        return;
    }

    playerCash -= 10;
    walletDisplay.textContent = `Cash: $${playerCash}`;

    const randomNum = Math.random() * 100;
    let rolledOre = "";

    if (randomNum < 50) {
        rolledOre = "Stone";
        rolledItem.textContent = "Stone";
        rolledItem.style.color = "hsl(0, 0%, 50%)";
    } else if (randomNum < 80) {
        rolledOre = "Coal";
        rolledItem.textContent = "Coal";
        rolledItem.style.color = "hsl(0, 0%, 35%)";
    } else if (randomNum < 90) {
        rolledOre = "Iron";
        rolledItem.textContent = "Iron";
        rolledItem.style.color = "hsl(0, 100%, 94%)";
    } else if (randomNum < 96) {
        rolledOre = "Gold";
        rolledItem.textContent = "Gold";
        rolledItem.style.color = "hsl(51, 98%, 53%)";
    } else if (randomNum < 99) {
        rolledOre = "Diamond";
        rolledItem.textContent = "Diamond";
        rolledItem.style.color = "hsl(199, 98%, 65%)";
    } else {
        rolledOre = "Void";
        rolledItem.textContent = "Void";
        rolledItem.style.color = "hsl(253, 100%, 65%)";
    }
    
    oreWallet[rolledOre]++;
    updateSidebarUI();

    previousItem.textContent = `Previous Ore: ${rolledOre}`;
    
    rollCount++;
    const counterEl = document.getElementById("counterDisplay");
    if (counterEl) {
        counterEl.textContent = `Total Rolls: ${rollCount}`;
    }
    
    historyList.unshift(rolledOre);
    historyList.pop();
    
    function getOreColor(oreName) {
        if (oreName === "Stone") return "hsl(0, 0%, 50%)";
        if (oreName === "Coal") return "hsl(0, 0%, 35%)";
        if (oreName === "Iron") return "hsl(0, 100%, 94%)";
        if (oreName === "Gold") return "hsl(51, 98%, 53%)";
        if (oreName === "Diamond") return "hsl(199, 98%, 65%)";
        if (oreName === "Void") return "hsl(253, 100%, 65%)";
        return "white";
    }

    const o1 = document.getElementById("ore1");
    const o2 = document.getElementById("ore2");
    const o3 = document.getElementById("ore3");

    o1.textContent = `1. ${historyList[0]}`;
    o2.textContent = `2. ${historyList[1]}`;
    o3.textContent = `3. ${historyList[2]}`;

    o1.style.color = getOreColor(historyList[0]);
    o2.style.color = getOreColor(historyList[1]);
    o3.style.color = getOreColor(historyList[2]);

    mainframeEl.classList.remove("faint-glow");
    mainframeEl.classList.remove("void-glow");
    void mainframeEl.offsetWidth;

    if (rolledOre === "Void") {
        mainframeEl.classList.add("void-glow");
        rollButton.disabled = true;
        rollButton.textContent = "LOCKED...";
        setTimeout(() => {
            mainframeEl.classList.remove("void-glow");
            if (playerCash >= 10) {
                rollButton.disabled = false;
                rollButton.textContent = "Roll";
            } else {
                rollButton.textContent = "BROKE!";
            }
        }, 3000);
    } else if (rolledOre === "Diamond") {
        const diamondColor = "hsl(199, 98%, 65%)";
        const diamondAlpha = "hsla(199, 98%, 65%, 0.4)";
        mainframeEl.style.setProperty('--glow-color', diamondColor);
        mainframeEl.style.setProperty('--glow-alpha', diamondAlpha);
        mainframeEl.classList.add("faint-glow");
    }

    if (playerCash < 10 && rolledOre !== "Void") {
        rollButton.disabled = true;
        rollButton.textContent = "BROKE!";
    }
}

function updateSidebarUI() {
    document.getElementById("vaultStone").textContent = oreWallet.Stone;
    document.getElementById("vaultCoal").textContent = oreWallet.Coal;
    document.getElementById("vaultIron").textContent = oreWallet.Iron;
    document.getElementById("vaultGold").textContent = oreWallet.Gold;
    document.getElementById("vaultDiamond").textContent = oreWallet.Diamond;
    document.getElementById("vaultVoid").textContent = oreWallet.Void;
}

toggleBtn.addEventListener("click", () => {
    if (sidebarEl.classList.contains("sidebar-hidden")) {
        sidebarEl.classList.remove("sidebar-hidden");
        sidebarEl.classList.add("sidebar-open");
        toggleBtn.textContent = "◀";
    } else {
        sidebarEl.classList.remove("sidebar-open");
        sidebarEl.classList.add("sidebar-hidden");
        toggleBtn.textContent = "▶";
    }
});

function sellCategory(oreType) {
    const totalItems = oreWallet[oreType];
    if (totalItems <= 0) return;

    const cashEarned = totalItems * oreMarketValues[oreType];
    playerCash += cashEarned;
    
    oreWallet[oreType] = 0;

    walletDisplay.textContent = `Cash: $${playerCash}`;
    updateSidebarUI();
    
    if (playerCash >= 10 && !mainframeEl.classList.contains("void-glow")) {
        rollButton.disabled = false;
        rollButton.textContent = "Roll";
    }
}

function sellAllOres() {
    let totalCashEarned = 0;

    for (let ore in oreWallet) {
        totalCashEarned += oreWallet[ore] * oreMarketValues[ore];
        oreWallet[ore] = 0; // Wipe counter value
    }

    if (totalCashEarned <= 0) return;

    playerCash += totalCashEarned;
    walletDisplay.textContent = `Cash: $${playerCash}`;
    updateSidebarUI();

    if (playerCash >= 10 && !mainframeEl.classList.contains("void-glow")) {
        rollButton.disabled = false;
        rollButton.textContent = "Roll";
    }
}

document.querySelectorAll(".sell-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const targetOre = e.target.getAttribute("data-ore");
        sellCategory(targetOre);
    });
});

document.getElementById("sell-all-btn").addEventListener("click", sellAllOres);
rollButton.addEventListener("click", rollOre);
