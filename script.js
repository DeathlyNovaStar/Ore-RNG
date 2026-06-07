//consts
let historyList = ["None", "None", "None"];
const previousItem = document.getElementById("prevOre");
const rolledItem = document.getElementById("ore");
const rollButton = document.getElementById("button");

//variables
let rollCount = 0; 

function rollOre() {
    const randomNum = Math.random() * 100;
    let rolledOre = "";
    if (randomNum < 50) {
        rolledOre = "Stone";
        rolledItem.textContent = "Stone";
        rolledItem.style.color = "hsl(0, 0%, 50%)";
    } else if (randomNum < 80) {
        rolledOre = "Coal";
        rolledItem.textContent = "Coal";
        rolledItem.style.color = "hsl(0, 0%, 0%)";
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
        if (oreName === "Coal") return "hsl(0, 0%, 0%)";
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

    const mainframeEl = document.getElementById("mainframe");

    mainframeEl.classList.remove("faint-glow");
    void mainframeEl.offsetWidth;

    if (rolledOre === "Void") {
        mainframeEl.classList.add("void-glow");
        rollButton.disabled = true;
        rollButton.textContent = "LOCKED...";

        setTimeout(() => {
            mainframeEl.classList.remove("void-glow");
            rollButton.disabled = false;
            rollButton.textContent = "Roll";
        }, 3000);
        
    } else if (rolledOre === "Diamond") {
        const diamondColor = "hsl(199, 98%, 65%)";
        const diamondAlpha = "hsla(199, 98%, 65%, 0.4)";
        mainframeEl.style.setProperty('--glow-color', diamondColor);
        mainframeEl.style.setProperty('--glow-alpha', diamondAlpha);
        mainframeEl.classList.add("faint-glow");
    }
}

rollButton.addEventListener("click", rollOre);