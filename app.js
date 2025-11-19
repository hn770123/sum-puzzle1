/**
 * メインアプリケーションロジック
 * UIの制御とPWA機能の管理
 */

// グローバル変数
let currentPuzzle = null; // 現在のパズルインスタンス
let puzzleData = null; // 現在のパズルデータ
let deferredPrompt = null; // PWAインストールプロンプト

/**
 * DOMの初期化が完了したら実行
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    // ボタンのイベントリスナーを設定
    document.getElementById('regenerateBtn').addEventListener('click', generateNewPuzzle);
    
    // PWAインストールの設定
    setupPWA();
    
    // 最初のパズルを生成
    generateNewPuzzle();
}

/**
 * PWA（Progressive Web App）の設定
 * インストールボタンの表示とイベント処理
 */
function setupPWA() {
    const installBtn = document.getElementById('installBtn');
    
    // インストールプロンプトを保存
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'inline-block';
    });
    
    // インストールボタンのクリック処理
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWAがインストールされました');
        }
        
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
    
    // インストール完了後
    window.addEventListener('appinstalled', () => {
        console.log('PWAインストール完了');
        deferredPrompt = null;
    });
}

/**
 * 新しいパズルを生成
 */
async function generateNewPuzzle() {
    const progressBar = document.getElementById('progressBar');
    const progressFill = progressBar.querySelector('.progress-bar-fill');
    const regenerateBtn = document.getElementById('regenerateBtn');
    
    // UIを更新
    progressBar.style.display = 'block';
    regenerateBtn.disabled = true;
    
    // パズルインスタンスを作成
    currentPuzzle = new SumPuzzle(5);
    
    // 進捗コールバック
    const onProgress = (percent) => {
        progressFill.style.width = `${percent}%`;
    };
    
    try {
        // パズルを生成（空白セルは10個）
        await currentPuzzle.generate(10, onProgress);
        
        // わずかな待機（UIの更新を見せるため）
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // パズルデータを取得
        puzzleData = currentPuzzle.getPuzzleData();
        
        // パズルを描画
        renderPuzzle(puzzleData);
        
        // 難易度を表示
        document.getElementById('difficultyLevel').textContent = puzzleData.difficultyLabel;
        
    } catch (error) {
        console.error('パズル生成エラー:', error);
        alert('パズルの生成に失敗しました。もう一度お試しください。');
    } finally {
        // UIをリセット
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
        regenerateBtn.disabled = false;
    }
}

/**
 * パズルをHTMLに描画
 * @param {object} data - パズルデータ
 */
function renderPuzzle(data) {
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = '';
    
    // グリッドを作成
    const grid = document.createElement('div');
    grid.className = 'puzzle-grid';
    grid.style.gridTemplateColumns = `repeat(${data.size + 1}, 50px)`;
    
    // 左上の角（空白）
    const corner = document.createElement('div');
    corner.className = 'puzzle-cell corner';
    grid.appendChild(corner);
    
    // 列の合計ヘッダー
    for (let col = 0; col < data.size; col++) {
        const cell = document.createElement('div');
        cell.className = 'puzzle-cell header';
        cell.textContent = data.colSums[col];
        grid.appendChild(cell);
    }
    
    // グリッドの各行
    for (let row = 0; row < data.size; row++) {
        // 行の合計ヘッダー
        const rowHeader = document.createElement('div');
        rowHeader.className = 'puzzle-cell header';
        rowHeader.textContent = data.rowSums[row];
        grid.appendChild(rowHeader);
        
        // 各セル
        for (let col = 0; col < data.size; col++) {
            const cell = document.createElement('div');
            cell.className = 'puzzle-cell';
            
            if (data.puzzle[row][col] === null) {
                // 空白セル - 入力フィールドを作成
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;
                
                // 入力イベント
                input.addEventListener('input', handleInput);
                input.addEventListener('keydown', handleKeyDown);
                
                cell.appendChild(input);
            } else {
                // 埋まっているセル
                cell.textContent = data.puzzle[row][col];
                cell.classList.add('filled');
            }
            
            grid.appendChild(cell);
        }
    }
    
    container.appendChild(grid);
}

/**
 * 入力フィールドの入力処理
 * @param {Event} e - 入力イベント
 */
function handleInput(e) {
    const input = e.target;
    const value = input.value;
    
    // 数字のみを許可（1-9）
    if (value && !/^[1-9]$/.test(value)) {
        input.value = '';
        return;
    }
    
    // 入力があれば検証
    if (value) {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const numValue = parseInt(value);
        
        validateInput(input, row, col, numValue);
        
        // 次の入力フィールドに自動フォーカス
        focusNextInput(input);
    }
}

/**
 * キーボード操作の処理
 * @param {Event} e - キーイベント
 */
function handleKeyDown(e) {
    const input = e.target;
    
    // 矢印キーで移動
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        navigateInputs(input, e.key);
    }
}

/**
 * 入力値を検証
 * @param {HTMLElement} input - 入力要素
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 * @param {number} value - 入力値
 */
function validateInput(input, row, col, value) {
    const cell = input.parentElement;
    const correctValue = puzzleData.solution[row][col];
    
    // 正解チェック
    if (value === correctValue) {
        cell.classList.remove('incorrect');
        cell.classList.add('correct');
        
        // アニメーション後にクラスを削除
        setTimeout(() => {
            cell.classList.remove('correct');
        }, 500);
        
        // すべて正解かチェック
        checkCompletion();
    } else {
        cell.classList.remove('correct');
        cell.classList.add('incorrect');
        
        setTimeout(() => {
            cell.classList.remove('incorrect');
        }, 500);
    }
}

/**
 * パズルの完成をチェック
 */
function checkCompletion() {
    const inputs = document.querySelectorAll('.puzzle-cell input');
    let allCorrect = true;
    
    for (const input of inputs) {
        if (!input.value) {
            allCorrect = false;
            break;
        }
        
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const value = parseInt(input.value);
        
        if (value !== puzzleData.solution[row][col]) {
            allCorrect = false;
            break;
        }
    }
    
    if (allCorrect) {
        setTimeout(() => {
            alert('🎉 おめでとうございます！パズルをクリアしました！');
        }, 300);
    }
}

/**
 * 次の入力フィールドにフォーカス
 * @param {HTMLElement} currentInput - 現在の入力要素
 */
function focusNextInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll('.puzzle-cell input'));
    const currentIndex = inputs.indexOf(currentInput);
    
    if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
    }
}

/**
 * 矢印キーでの入力フィールド間の移動
 * @param {HTMLElement} input - 現在の入力要素
 * @param {string} direction - 方向キー
 */
function navigateInputs(input, direction) {
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    let newRow = row;
    let newCol = col;
    
    switch (direction) {
        case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
        case 'ArrowDown':
            newRow = Math.min(puzzleData.size - 1, row + 1);
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
        case 'ArrowRight':
            newCol = Math.min(puzzleData.size - 1, col + 1);
            break;
    }
    
    // 新しい位置の入力フィールドを探す
    const newInput = document.querySelector(
        `.puzzle-cell input[data-row="${newRow}"][data-col="${newCol}"]`
    );
    
    if (newInput) {
        newInput.focus();
    }
}
