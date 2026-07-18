const GITHUB_CODE_URL = "https://typicode.com"; 

function playSuccessSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }, index * 100);
    });
}

let claimedCodes = JSON.parse(localStorage.getItem('claimedCodes')) || [];
let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || [];

updateInventoryUI();

document.getElementById("btn-claim").addEventListener("click", async function() {
    const inputField = document.getElementById("redeem-input");
    const btnClaim = document.getElementById("btn-claim");
    const msgBox = document.getElementById("notification-message");
    const ecoValSpan = document.getElementById("eco-val");
    const kodeUser = inputField.value.trim().toUpperCase();

    msgBox.style.display = "none";
    msgBox.className = "message";

    if (kodeUser === "") {
        showMsg("Gagal: Kolom kode tidak boleh kosong!", "error");
        return;
    }

    if (claimedCodes.includes(kodeUser)) {
        showMsg("Gagal: Anda sudah pernah mengklaim kode ini!", "error");
        return;
    }

    let cooldownTime = 10;
    btnClaim.disabled = true;
    inputField.disabled = true;
    
    const cooldownInterval = setInterval(() => {
        cooldownTime--;
        btnClaim.innerText = `COOLDOWN (${cooldownTime}S)`;
        if (cooldownTime <= 0) {
            clearInterval(cooldownInterval);
            btnClaim.disabled = false;
            inputField.disabled = false;
            btnClaim.innerText = "KLAIM HADIAH";
        }
    }, 1000);

    showMsg("Memverifikasi kode...", "success");

    try {
        const response = await fetch(GITHUB_CODE_URL);
        if (!response.ok) throw new Error();
        
        const validCodes = await response.json();
        const dataHadiah = validCodes.find(item => item.id === kodeUser);

        if (dataHadiah) {
            if (dataHadiah.ecoBoost && dataHadiah.ecoBoost > 0) {
                let currentEco = parseInt(ecoValSpan.innerText);
                ecoValSpan.innerText = currentEco + dataHadiah.ecoBoost;
            }

            playSuccessSound();
            addRewardToInventory(dataHadiah.reward);

            claimedCodes.push(kodeUser);
            localStorage.setItem('claimedCodes', JSON.stringify(claimedCodes));

            showMsg(`Sukses! Hadiah Berhasil Dikirim:<br><strong>🎁 ${dataHadiah.reward}</strong>`, "success");
            inputField.value = "";
        } else {
            showMsg("Gagal: Kode salah atau sudah kedaluwarsa!", "error");
        }

    } catch (error) {
        if (kodeUser === "SAWITKEREN2045") {
            playSuccessSound();
            addRewardToInventory("1x Nusantara Exo-Suit & 2.045 Golden Seeds");
            claimedCodes.push("SAWITKEREN2045");
            localStorage.setItem('claimedCodes', JSON.stringify(claimedCodes));
            showMsg("Sukses (Mode Cadangan)! Hadiah Berhasil Dikirim:<br><strong>🎁 1x Nusantara Exo-Suit & 2.045 Golden Seeds!</strong>", "success");
            inputField.value = "";
        } else {
            showMsg("Gagal: Kode salah atau periksa koneksi internet Anda!", "error");
        }
    }
});

function showMsg(text, type) {
    const msgBox = document.getElementById("notification-message");
    msgBox.innerHTML = text;
    msgBox.className = `message ${type}`;
    msgBox.style.display = "block";
}

function addRewardToInventory(itemText) {
    playerInventory.push(itemText);
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    updateInventoryUI();
}

function updateInventoryUI() {
    const listContainer = document.getElementById("inventory-list");
    const countSpan = document.getElementById("inv-count");
    
    countSpan.innerText = `(${playerInventory.length})`;

    if (playerInventory.length === 0) {
        listContainer.innerHTML = '<li class="inventory-empty">Belum ada item hadiah yang diklaim.</li>';
        return;
    }

    listContainer.innerHTML = playerInventory.map(item => `
        <li class="inventory-item">📦 ${item}</li>
    `).join('');
}
