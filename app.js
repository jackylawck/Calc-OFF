let expr = "";
let ramVault = [];
let idleTimer = null;

// 暗號 SHA-256 雜湊 (對應 "3650" 的 SHA-256)
const SECRET_HASH = "8f31920ef1e83f06850d536c4b9b736b1d402e60472e3a0937b8d147413d8a57";
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分鐘無操作自動鎖定

function vibrate() {
    if (navigator.vibrate) navigator.vibrate(10);
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (document.getElementById('vault-modal').style.display === 'block') {
        idleTimer = setTimeout(() => {
            purgeAndClose();
        }, IDLE_TIMEOUT);
    }
}

function updateLCD(val) {
    document.getElementById('lcd-val').innerText = val || expr || "0";
    document.getElementById('lcd-hist').innerText = expr ? "DEG  " + expr : "DEG";
}

function inputNum(n) { resetIdleTimer(); vibrate(); expr += n; updateLCD(); }
function inputFn(fn) { resetIdleTimer(); vibrate(); expr += fn; updateLCD(); }
function clearScreen() { resetIdleTimer(); vibrate(); expr = ""; updateLCD("0"); }
function deleteLast() { resetIdleTimer(); vibrate(); expr = expr.slice(0, -1); updateLCD(expr || "0"); }

async function checkSecret(input) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(input));
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === SECRET_HASH;
}

function safeEvaluate(mathExpr) {
    const allowed = /^[\d+\-*/.()Math\.PI Math\.sin Math\.cos Math\.tan Math\.log10 Math\.log Math\.sqrt \s]+$/;
    if (!allowed.test(mathExpr)) {
        throw new Error('Unsafe Math Expression');
    }
    return Function('"use strict"; return (' + mathExpr + ')')();
}

async function calculate() {
    resetIdleTimer();
    vibrate();
    
    if (await checkSecret(expr)) {
        document.getElementById('vault-modal').style.display = 'block';
        clearScreen();
        resetIdleTimer();
        return;
    }

    if (!expr) return;

    try {
        let parsed = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'Math.PI')
            .replace(/sin\(/g, '(Math.PI/180)*Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/\^/g, '**');

        let res = safeEvaluate(parsed);

        if (typeof res === 'number' && !isNaN(res)) {
            res = Math.round(res * 1e10) / 1e10;
        }

        document.getElementById('lcd-hist').innerText = "Ans = " + expr;
        expr = res.toString();
        updateLCD(expr);
    } catch (e) {
        // 通用錯誤訊息，防實作細節洩漏
        updateLCD("Error");
        expr = "";
    }
}

function unlockVault() {
    resetIdleTimer();
    vibrate();
    if (!document.getElementById('session-key').value) return;
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('content-box').style.display = 'block';
}

function addEntry() {
    resetIdleTimer();
    vibrate();
    const title = document.getElementById('note-title').value;
    const val = document.getElementById('note-val').value;
    if (!title || !val) return;
    ramVault.push({ title, val });
    document.getElementById('note-title').value = '';
    document.getElementById('note-val').value = '';
    renderList();
}

function renderList() {
    const container = document.getElementById('vault-list');
    container.innerHTML = '';
    ramVault.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = "background:#1e293b; padding:8px; margin-top:6px; border-radius:4px;";
        div.innerHTML = `<strong>${item.title}:</strong> <code>${item.val}</code>`;
        container.appendChild(div);
    });
}

function purgeAndClose() {
    clearTimeout(idleTimer);
    ramVault.forEach(item => { item.title = "00000"; item.val = "00000"; });
    ramVault = [];
    document.getElementById('session-key').value = '';
    document.getElementById('vault-list').innerHTML = '';
    document.getElementById('content-box').style.display = 'none';
    document.getElementById('auth-box').style.display = 'block';
    document.getElementById('vault-modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => inputNum(btn.getAttribute('data-num')));
    });

    document.querySelectorAll('[data-fn]').forEach(btn => {
        btn.addEventListener('click', () => inputFn(btn.getAttribute('data-fn')));
    });

    document.getElementById('btn-clear').addEventListener('click', clearScreen);
    document.getElementById('btn-del').addEventListener('click', deleteLast);
    document.getElementById('btn-calc').addEventListener('click', calculate);
    document.getElementById('btn-unlock').addEventListener('click', unlockVault);
    document.getElementById('btn-add-entry').addEventListener('click', addEntry);
    document.getElementById('btn-purge').addEventListener('click', purgeAndClose);

    ['click', 'keydown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer);
    });
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        purgeAndClose();
    }
});

window.addEventListener('beforeunload', purgeAndClose);
window.addEventListener('pagehide', purgeAndClose);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered:', reg.scope))
            .catch(err => console.log('SW Registration Failed:', err));
    });
}
