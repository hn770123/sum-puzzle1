/**
 * パズル生成と難易度判定を行うクラス
 * 縦と横の合計が分かっている数独風パズルを生成する
 */
class SumPuzzle {
    /**
     * コンストラクタ
     * @param {number} size - グリッドのサイズ（デフォルト: 4）
     */
    constructor(size = 4) {
        this.size = size; // グリッドサイズ
        this.grid = []; // 完成したグリッド
        this.puzzle = []; // プレイヤーに提示するパズル（空白あり）
        this.rowSums = []; // 各行の合計
        this.colSums = []; // 各列の合計
        this.difficulty = 0; // 難易度スコア
    }

    /**
     * ランダムな数字（1-9）を生成
     * @returns {number} 1から9のランダムな整数
     */
    randomDigit() {
        return Math.floor(Math.random() * 9) + 1;
    }

    /**
     * 完成したグリッドを生成
     * 各セルに1-9のランダムな数字を配置
     */
    generateCompleteGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            const row = [];
            for (let j = 0; j < this.size; j++) {
                row.push(this.randomDigit());
            }
            this.grid.push(row);
        }
    }

    /**
     * 行と列の合計を計算
     */
    calculateSums() {
        // 各行の合計を計算
        this.rowSums = this.grid.map(row => 
            row.reduce((sum, val) => sum + val, 0)
        );

        // 各列の合計を計算
        this.colSums = [];
        for (let col = 0; col < this.size; col++) {
            let sum = 0;
            for (let row = 0; row < this.size; row++) {
                sum += this.grid[row][col];
            }
            this.colSums.push(sum);
        }
    }

    /**
     * パズルを生成（一部のセルを空白にする）
     * @param {number} emptyCells - 空白にするセルの数
     */
    createPuzzle(emptyCells) {
        // グリッドのコピーを作成
        this.puzzle = this.grid.map(row => [...row]);

        // ランダムに空白セルを作成
        const positions = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                positions.push([i, j]);
            }
        }

        // シャッフル
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // 指定された数のセルを空白にする
        for (let i = 0; i < Math.min(emptyCells, positions.length); i++) {
            const [row, col] = positions[i];
            this.puzzle[row][col] = null;
        }
    }

    /**
     * パズルの難易度を推定
     * 空白セルを埋めるのに必要な試行回数をシミュレート
     * @returns {number} 難易度スコア
     */
    estimateDifficulty() {
        const tempPuzzle = this.puzzle.map(row => [...row]);
        let iterations = 0;
        const maxIterations = 100;

        while (iterations < maxIterations) {
            let progress = false;
            iterations++;

            // 各空白セルについて
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    if (tempPuzzle[row][col] !== null) continue;

                    // その行で既知の数字の合計を計算
                    let rowSum = 0;
                    let rowUnknown = 0;
                    for (let c = 0; c < this.size; c++) {
                        if (tempPuzzle[row][c] !== null) {
                            rowSum += tempPuzzle[row][c];
                        } else {
                            rowUnknown++;
                        }
                    }

                    // その列で既知の数字の合計を計算
                    let colSum = 0;
                    let colUnknown = 0;
                    for (let r = 0; r < this.size; r++) {
                        if (tempPuzzle[r][col] !== null) {
                            colSum += tempPuzzle[r][col];
                        } else {
                            colUnknown++;
                        }
                    }

                    // このセルだけが未知の場合、値を決定できる
                    if (rowUnknown === 1) {
                        const value = this.rowSums[row] - rowSum;
                        if (value >= 1 && value <= 9) {
                            tempPuzzle[row][col] = value;
                            progress = true;
                        }
                    } else if (colUnknown === 1) {
                        const value = this.colSums[col] - colSum;
                        if (value >= 1 && value <= 9) {
                            tempPuzzle[row][col] = value;
                            progress = true;
                        }
                    }
                }
            }

            // 進展がなければ終了
            if (!progress) break;

            // すべて埋まったかチェック
            let allFilled = true;
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    if (tempPuzzle[row][col] === null) {
                        allFilled = false;
                        break;
                    }
                }
                if (!allFilled) break;
            }

            if (allFilled) break;
        }

        this.difficulty = iterations;
        return iterations;
    }

    /**
     * 難易度ラベルを取得
     * @returns {string} 難易度ラベル
     */
    getDifficultyLabel() {
        if (this.difficulty <= 3) return '簡単 ⭐';
        if (this.difficulty <= 6) return '普通 ⭐⭐';
        if (this.difficulty <= 10) return '難しい ⭐⭐⭐';
        return '非常に難しい ⭐⭐⭐⭐';
    }

    /**
     * 完全なパズルを生成（進捗コールバック付き）
     * @param {number} emptyCells - 空白にするセルの数
     * @param {function} onProgress - 進捗コールバック（0-100のパーセンテージ）
     * @returns {Promise<void>}
     */
    async generate(emptyCells = 6, onProgress = null) {
        if (onProgress) onProgress(0);
        
        // 完成グリッドを生成
        this.generateCompleteGrid();
        if (onProgress) onProgress(30);
        
        // 合計を計算
        this.calculateSums();
        if (onProgress) onProgress(50);
        
        // パズルを作成
        this.createPuzzle(emptyCells);
        if (onProgress) onProgress(70);
        
        // 難易度を推定
        this.estimateDifficulty();
        if (onProgress) onProgress(100);
    }

    /**
     * パズルデータを取得
     * @returns {object} パズル情報
     */
    getPuzzleData() {
        return {
            size: this.size,
            puzzle: this.puzzle,
            solution: this.grid,
            rowSums: this.rowSums,
            colSums: this.colSums,
            difficulty: this.difficulty,
            difficultyLabel: this.getDifficultyLabel()
        };
    }
}
