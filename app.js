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

// 顯式掛載至 window 作用域，完全相容 index.html 的 inline onclick 觸發
window.inputNum = function(n) { 
    resetIdleTimer(); 
    vibrate(); 
    expr += n; 
    updateLCD(); 
};

window.inputFn = function(fn) { 
    resetIdleTimer(); 
    vibrate(); 
    expr += fn; 
    updateLCD(); 
};

window.clearScreen = function() { 
    resetIdleTimer(); 
    vibrate(); 
    expr = ""; 
    updateLCD("0"); 
};

window.deleteLast = function() { 
    resetIdleTimer(); 
    vibrate(); 
    expr = expr.slice(0, -1); 
    updateLCD(expr || "0"); 
};

async function checkSecret(input) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', enc.encode(input));
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === SECRET_HASH;
}

// 🔧 核心修正：採用「危險字元黑名單阻擋」驗證數學表達式
function safeEvaluate(mathExpr) {
    // 檢查是否包含非數學運算的非法/危險字符 (防範 JavaScript 程式碼注入)
    const dangerous = /[^0-9+\-*/.()\sMath\.PI Math\.sin Math\.cos Math\.tan Math\.log10 Math\.log Math\.sqrt]/;
    if (dangerous.test(mathExpr)) {
        throw new Error('Unsafe Math Expression');
    }
    return Function('"use strict"; return (' + mathExpr + ')')();
}

window.calculate = async function() {
    resetIdleTimer();
    vibrate();
    
    // 1. 驗證暗號
    if (await checkSecret(expr)) {
        document.getElementById('vault-modal').style.display = 'block';
        clearScreen();
        resetIdleTimer();
        return;
    }

    if (!expr) return;

    try {
        // 2. 將界面符號轉為 JS 內部表達式
        let parsed = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'Math.PI')
            .replace(/sin\(/g, '(Math.PI/180)*Math.sin(') // 轉為 Degree 角度運算
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/\^/g, '**');

        let res = safeEvaluate(parsed);

        if (typeof res === 'number' && !isNaN(res)) {
            res = Math.round(res * 1e10) / 1e10; // 消除 JS 浮點數精度誤差
        }

        document.getElementById('lcd-hist').innerText = "Ans = " + expr;
        expr = res.toString();
        updateLCD(expr);
    } catch (e) {
        // 模糊化錯誤訊息，防止洩漏實作細節
        updateLCD("Error");
        expr = "";
    }
};

window.unlockVault = function() {
    resetIdleTimer();
    vibrate();
    if (!document.getElementById('session-key').value) return;
    document.getElementById('auth-box').style.display = 'none';
    document.getElementById('content-box').style.display = 'block';
};

window.addEntry = function() {
    resetIdleTimer();
    vibrate();
    const title = document.getElementById('note-title').value;
    const val = document.getElementById('note-val').value;
    if (!title || !val) return;
    ramVault.push({ title, val });
    document.getElementById('note-title').value = '';
    document.getElementById('note-val').value = '';
    renderList();
};

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

window.purgeAndClose = function() {
    clearTimeout(idleTimer);
    ramVault.forEach(item => { item.title = "00000"; item.val = "00000"; });
    ramVault = [];
    document.getElementById('session-key').value = '';
    document.getElementById('vault-list').innerHTML = '';
    document.getElementById('content-box').style.display = 'none';
    document.getElementById('auth-box').style.display = 'block';
    document.getElementById('vault-modal').style.display = 'none';
};

// 閒置計時器事件監聽
['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
});

// 隱蔽保護：切換至背景/縮小/鎖屏時立刻銷毀 RAM 數據
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        purgeAndClose();
    }
});

window.addEventListener('beforeunload', purgeAndClose);
window.addEventListener('pagehide', purgeAndClose);

// 註冊 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW Registered:', reg.scope))
            .catch(err => console.log('SW Registration Failed:', err));
    });
}
