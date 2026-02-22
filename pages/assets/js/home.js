// Variables
const hasil = document.querySelector("#hasil");
const resultText = document.querySelector("#resultText");

function validation() {
    const kodeSaham = document.querySelector("#namaSaham").value;
    const hargaBeli = parseFloat(document.querySelector("#hargaBeli").value);
    const hargaJual = parseFloat(document.querySelector("#hargaJual").value);
    const lot = parseFloat(document.querySelector("#lot").value);
    const komisiBeli = parseFloat(document.querySelector("#komisiBeli").value);
    const komisiJual = parseFloat(document.querySelector("#komisiJual").value);

    const resultNum = rumus(hargaBeli, hargaJual, lot, komisiBeli, komisiJual);
    const loseNum = rumusLose(hargaBeli, hargaJual, lot, komisiBeli, komisiJual);
    let totalTuku = (hargaBeli*100*lot)+((hargaBeli*100*lot)*(komisiBeli/100));
    let formattedTotalTuku = "Rp." + totalTuku.toLocaleString("id-ID");
    let totalDol = (hargaJual*100*lot)-((hargaJual*100*lot)*(komisiJual/100));
    let formattedTotalDol= "Rp." + totalDol.toLocaleString("id-ID");

    let text = "";
    if (loseNum > 0) {
        text = `Perhitungan profit/loos pada saham ${kodeSaham} dengan total pembelian ${formattedTotalTuku} dan total penjualan ${formattedTotalDol} adalah <b class="text-success">${resultNum}</b> dengan persentase profit/loss <b class="text-success">${loseNum}%</b>`;
        display(text);
    } else {
        text = `Perhitungan profit/loos pada saham ${kodeSaham} dengan total pembelian ${formattedTotalTuku} dan total penjualan ${formattedTotalDol} adalah <b class="text-danger">${resultNum}</b> dengan persentase profit/loss <b class="text-danger">${loseNum}%</b>`;
        display(text);
    }
}

function display(text) {
    return resultText.innerHTML = text;
}

function rumus(hargaBeli, hargaJual, lot, komisiBeli, komisiJual) {
    let totalBuy = (hargaBeli*100*lot)+((hargaBeli*100*lot)*(komisiBeli/100));
    let totalSell = (hargaJual*100*lot)-((hargaJual*100*lot)*(komisiJual/100));
    let profitLoss = totalSell - totalBuy;
    let formattedProfitLoss = "Rp." + profitLoss.toLocaleString("id-ID");
    return formattedProfitLoss;
}

function rumusLose(hargaBeli, hargaJual, lot, komisiBeli, komisiJual) {
    let totalBuy = (hargaBeli*100*lot)+((hargaBeli*100*lot)*(komisiBeli/100));
    let totalSell = (hargaJual*100*lot)-((hargaJual*100*lot)*(komisiJual/100));
    let profitLoss = totalSell - totalBuy;
    let profitLossPercent = (profitLoss/totalBuy)*100;
    profitLossPercent = Math.round(profitLossPercent * 100) / 100;
    return profitLossPercent;
}

// Main
window.addEventListener("load", init);

function init() {
    load();
    eventListener();
}

function load() {
    checkLS();
    welcomeMsg();
}

function eventListener() {
    hasil.addEventListener("click", res);
}