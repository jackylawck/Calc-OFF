let expr = "";
let ramVault = [];
let idleTimer = null;

const SECRET_HASH = "8f31920ef1e83f06850d536c4b9b736b1d402e60472e3a0937b8d147413d8a57";
const IDLE_TIMEOUT = 5 * 60 * 1000;

function vibrate() {
    if (navigator.vibrate) navigator.vibrate(10);
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    if (document.getElementById('vault-modal') && document.getElementById('vault-modal').style.display === 'block') {
        idleTimer = setTimeout(() => {
            purgeAndClose();
        }, IDLE_TIMEOUT);
    }
}

function updateLCD(val) {
    document.getElementById('lcd-val').innerText = val || expr || "0";
    document.getElementById('lcd-hist').innerText = expr ? "DEG  " + expr : "DEG";
}

window.inputNum = function(n) { resetIdleTimer(); vibrate(); expr += n; updateLCD(); };
window.inputFn = function(fn) { resetIdleTimer(); vibrate(); expr += fn; updateLCD(); };
window.clearScreen = function() { resetIdleTimer(); vibrate(); expr = ""; updateLCD("0"); };
window.deleteLast = function() { resetIdleTimer(); vibrate(); expr = expr.slice(0, -1); updateLCD(expr || "0"); };

async function checkSecret(input) {
    try {
        const enc = new TextEncoder();
        const hash = await crypto.subtle.digest('SHA-256', enc.encode(input));
        const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex === SECRET_HASH;
    } catch (e) {
        return false;
    }
}

// 徹底修復：穩健且絕對安全的數學表達式求值器
function safeEvaluate(mathExpr) {
    // 嚴格阻擋潛在危險字元 (字母只能出現 Math, sin, cos, tan, log10, log, sqrt, PI)
    const sanitized = mathExpr.replace(/Math\.(sin|cos|tan|log10|log|sqrt|PI)/g, '');
    if (/[a-zA-Z_$]/.test(sanitized)) {
        throw new Error('Unsafe Identifier');
    }
    
    // 安全執行數學表達式
    return Function('"use strict"; return (' + mathExpr + ')')();
}

window.calculate = async function() {
    resetIdleTimer();
    vibrate();
    
    // 1. 驗證解鎖暗號
    if (await checkSecret(expr)) {
        document.getElementById('vault-modal').style.display = 'block';
        clearScreen();
        resetIdleTimer();
        return;
    }

    if (!expr) return;

    try {
        let parsed = expr;

        // 2. 轉換乘除與科學運算符號
        parsed = parsed
            .replace(/×/gi, '*')
            .replace(/÷/gi, '/')
            .replace(/x/gi, '*')
            .replace(/π/g, 'Math.PI')
            .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
            .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
            .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/\^/g, '**');

        // 3. 自動補全省略乘號 (例: 9Math.PI -> 9*Math.PI, 9( -> 9*()
        parsed = parsed.replace(/(\d)(Math\.|\()/g, '$1*$2');
        parsed = parsed.replace(/(\))(\d|Math\.)/g, '$1*$2');

        // 4. 自動補齊未關閉的括號
        let openBrackets = (parsed.match(/\(/g) || []).length;
        let closeBrackets = (parsed.match(/\)/g) || []).length;
        while (openBrackets > closeBrackets) {
            parsed += ')';
            openBrackets--;
        }

        // 5. 執行求值
        let res = safeEvaluate(parsed);

        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
            res = Math.round(res * 1e10) / 1e10; // 消除 JS 浮點數微小誤差
        } else {
            throw new Error("Invalid result");
        }

        document.getElementById('lcd-hist').innerText = "Ans = " + expr;
        expr = res.toString();
        updateLCD(expr);
    } catch (e) {
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
    if (document.getElementById('session-key')) document.getElementById('session-key').value = '';
    if (document.getElementById('vault-list')) document.getElementById('vault-list').innerHTML = '';
    if (document.getElementById('content-box')) document.getElementById('content-box').style.display = 'none';
    if (document.getElementById('auth-box')) document.getElementById('auth-box').style.display = 'block';
    if (document.getElementById('vault-modal')) document.getElementById('vault-modal').style.display = 'none';
};

['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer);
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
