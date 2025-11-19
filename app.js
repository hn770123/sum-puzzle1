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
 * 正解に近い選択肢を生成
 * @param {number} correctAnswer - 正解の数値
 * @returns {Array<number>} 正解を含む4つの選択肢
 */
function generateChoices(correctAnswer) {
    const choices = [correctAnswer];
    const used = new Set([correctAnswer]);
    
    // 正解に近い3つの不正解を生成
    while (choices.length < 4) {
        // 正解から±1〜3の範囲でランダムに生成
        const offset = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
        const direction = Math.random() < 0.5 ? -1 : 1; // ±
        let candidate = correctAnswer + (offset * direction);
        
        // 1〜9の範囲内で、まだ使われていない数字のみ追加
        if (candidate >= 1 && candidate <= 9 && !used.has(candidate)) {
            choices.push(candidate);
            used.add(candidate);
        }
    }
    
    // 配列をシャッフル
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    
    return choices;
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
                // 空白セル - 4択ボタンを作成
                cell.classList.add('choice-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 正解の数値を取得
                const correctAnswer = data.solution[row][col];
                
                // 選択肢を生成
                const choices = generateChoices(correctAnswer);
                
                // 4択ボタンを作成
                const choicesContainer = document.createElement('div');
                choicesContainer.className = 'choices-container';
                
                choices.forEach(choice => {
                    const button = document.createElement('button');
                    button.className = 'choice-btn';
                    button.textContent = choice;
                    button.dataset.value = choice;
                    button.addEventListener('click', () => handleChoice(button, row, col, choice));
                    choicesContainer.appendChild(button);
                });
                
                cell.appendChild(choicesContainer);
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
 * 選択肢ボタンのクリック処理
 * @param {HTMLElement} button - クリックされたボタン
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 * @param {number} value - 選択された値
 */
function handleChoice(button, row, col, value) {
    const cell = button.closest('.puzzle-cell');
    const correctValue = puzzleData.solution[row][col];
    
    // すでに選択されているセルは無視
    if (cell.classList.contains('selected')) {
        return;
    }
    
    // 選択状態にする
    cell.classList.add('selected');
    
    // 選択肢ボタンを無効化
    const buttons = cell.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
    
    // クリックされたボタンを選択状態にする
    button.classList.add('selected');
    
    // 正解チェック
    if (value === correctValue) {
        cell.classList.add('correct');
        button.classList.add('correct');
        
        // すべて正解かチェック
        setTimeout(() => {
            checkCompletion();
        }, 300);
    } else {
        cell.classList.add('incorrect');
        button.classList.add('incorrect');
        
        // 正解のボタンを表示
        buttons.forEach(btn => {
            if (parseInt(btn.dataset.value) === correctValue) {
                btn.classList.add('correct-answer');
            }
        });
    }
}

/**
 * パズルの完成をチェック
 */
function checkCompletion() {
    const choiceCells = document.querySelectorAll('.puzzle-cell.choice-cell');
    let allCorrect = true;
    
    for (const cell of choiceCells) {
        // まだ選択されていないセルがある
        if (!cell.classList.contains('selected')) {
            allCorrect = false;
            break;
        }
        
        // 不正解のセルがある
        if (cell.classList.contains('incorrect')) {
            allCorrect = false;
            break;
        }
    }
    
    if (allCorrect && choiceCells.length > 0) {
        setTimeout(() => {
            alert('🎉 おめでとうございます！パズルをクリアしました！');
        }, 300);
    }
}
