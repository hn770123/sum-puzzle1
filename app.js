/**
 * メインアプリケーションロジック
 * UIの制御とPWA機能の管理
 */

// グローバル変数
let currentPuzzle = null; // 現在のパズルインスタンス
let puzzleData = null; // 現在のパズルデータ
let deferredPrompt = null; // PWAインストールプロンプト
let selectedCell = null; // 現在選択されているセル

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
    
    // 数字ボタンのイベントリスナーを設定
    setupNumberButtons();
    
    // オーバーレイの閉じるボタンを設定
    document.getElementById('closeOverlayBtn').addEventListener('click', () => {
        hideCongratsOverlay();
        generateNewPuzzle();
    });
    
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
 * 数字ボタンの設定
 */
function setupNumberButtons() {
    const numberButtons = document.querySelectorAll('.number-btn');
    numberButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedCell) {
                const number = parseInt(btn.dataset.number);
                handleNumberSelection(number);
            }
        });
    });
}

/**
 * 新しいパズルを生成
 */
async function generateNewPuzzle() {
    // 選択をリセット
    selectedCell = null;
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
                // 空白セル - クリック可能な要素として作成
                cell.classList.add('input-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.cursor = 'pointer';
                
                // クリックイベントを追加
                cell.addEventListener('click', () => {
                    selectCell(cell, row, col);
                });
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
 * セルを選択
 * @param {HTMLElement} cell - セル要素
 * @param {number} row - 行インデックス
 * @param {number} col - 列インデックス
 */
function selectCell(cell, row, col) {
    // 既に正解済みのセルは選択できない
    if (cell.classList.contains('correct')) {
        return;
    }
    
    // 以前の選択を解除
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    
    // 新しいセルを選択
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

/**
 * 数字が選択された時の処理
 * @param {number} number - 選択された数字
 */
function handleNumberSelection(number) {
    if (!selectedCell) return;
    
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    const correctValue = puzzleData.solution[row][col];
    
    // 既存のクラスをリセット
    selectedCell.classList.remove('incorrect');
    
    // 正解チェック
    if (number === correctValue) {
        selectedCell.textContent = number;
        selectedCell.classList.add('correct', 'filled');
        selectedCell.classList.remove('selected');
        selectedCell.style.cursor = 'default';
        
        // イベントリスナーを削除
        const newCell = selectedCell.cloneNode(true);
        selectedCell.parentNode.replaceChild(newCell, selectedCell);
        selectedCell = null;
        
        // すべて正解かチェック
        setTimeout(() => {
            checkCompletion();
        }, 300);
    } else {
        selectedCell.classList.add('incorrect');
        
        // 少し待ってから不正解表示をクリア
        setTimeout(() => {
            if (selectedCell) {
                selectedCell.classList.remove('incorrect');
            }
        }, 500);
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
            showCongratsOverlay();
        }, 300);
    }
}

/**
 * お祝いオーバーレイを表示
 */
function showCongratsOverlay() {
    const overlay = document.getElementById('congratsOverlay');
    overlay.style.display = 'flex';
    
    // 紙吹雪を開始
    startConfetti();
}

/**
 * お祝いオーバーレイを非表示
 */
function hideCongratsOverlay() {
    const overlay = document.getElementById('congratsOverlay');
    overlay.style.display = 'none';
    
    // 紙吹雪を停止
    stopConfetti();
}

/**
 * 紙吹雪アニメーション
 */
let confettiAnimationId = null;
let confettiParticles = [];

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    
    // キャンバスサイズを設定
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 紙吹雪の色
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    
    // パーティクルを作成
    confettiParticles = [];
    for (let i = 0; i < 150; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * 150 + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }
    
    // アニメーションループ
    function updateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confettiParticles.forEach((p, index) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.d);
            p.tilt = Math.sin(p.tiltAngle - (index / 3)) * 15;
            
            if (p.y > canvas.height) {
                confettiParticles[index] = {
                    x: Math.random() * canvas.width,
                    y: -20,
                    r: p.r,
                    d: p.d,
                    color: p.color,
                    tilt: p.tilt,
                    tiltAngleIncremental: p.tiltAngleIncremental,
                    tiltAngle: p.tiltAngle
                };
            }
            
            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();
        });
        
        confettiAnimationId = requestAnimationFrame(updateConfetti);
    }
    
    updateConfetti();
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    confettiParticles = [];
    
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
