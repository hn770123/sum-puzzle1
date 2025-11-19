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
                cell.classList.add('input-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 入力フィールドを作成
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'number-input';
                input.maxLength = 1;
                input.dataset.row = row;
                input.dataset.col = col;
                input.addEventListener('input', (e) => handleInput(e, row, col));
                input.addEventListener('keydown', (e) => handleKeyDown(e));
                
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
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 */
function handleInput(e, row, col) {
    const input = e.target;
    const value = input.value;
    
    // 数字以外は削除
    if (!/^[1-9]$/.test(value)) {
        input.value = '';
        return;
    }
    
    const numValue = parseInt(value);
    const correctValue = puzzleData.solution[row][col];
    const cell = input.closest('.puzzle-cell');
    
    // 既存のクラスをリセット
    cell.classList.remove('correct', 'incorrect');
    
    // 正解チェック
    if (numValue === correctValue) {
        cell.classList.add('correct');
        input.disabled = true;
        
        // すべて正解かチェック
        setTimeout(() => {
            checkCompletion();
        }, 300);
    } else {
        cell.classList.add('incorrect');
        
        // 少し待ってから入力をクリア
        setTimeout(() => {
            input.value = '';
            cell.classList.remove('incorrect');
        }, 500);
    }
}

/**
 * キーボード入力の処理
 * @param {KeyboardEvent} e - キーボードイベント
 */
function handleKeyDown(e) {
    // Enterキーで次の入力欄に移動
    if (e.key === 'Enter') {
        const inputs = Array.from(document.querySelectorAll('.number-input:not([disabled])'));
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
            inputs[currentIndex + 1].focus();
        }
    }
}

/**
 * パズルの完成をチェック
 */
function checkCompletion() {
    const inputCells = document.querySelectorAll('.puzzle-cell.input-cell');
    let allCorrect = true;
    
    for (const cell of inputCells) {
        // 不正解のセルがある、または未入力のセルがある
        if (!cell.classList.contains('correct')) {
            allCorrect = false;
            break;
        }
    }
    
    if (allCorrect && inputCells.length > 0) {
        setTimeout(() => {
            alert('🎉 おめでとうございます！パズルをクリアしました！');
        }, 300);
    }
}
