'use strict';

export { Alphabet, PlugBoard, Rotor, Reflector, AbstractEnigma, EnigmaI, M4 };

/**
 * 与えられた整数を法とする最小非負剰余を扱う関数群
 * @param modulo 法
 * @returns modulo を法とする加算・減算・合同判定を行うオブジェクト
 */
function mod(modulo: number) {
    return {
        /**
         * modulo を法とする加算
         * @param n
         * @param m
         * @returns modulo を法とする n + m の剰余
         */
        add: (n: number, m: number) => ((n + m) % modulo + modulo) % modulo,

        /**
         * modulo を法とする減算
         * @param n
         * @param m
         * @returns modulo を法とする n - m の剰余
         */
        sub: (n: number, m: number) => ((n - m) % modulo + modulo) % modulo,

        /**
         * modulo を法として合同であるか
         * @param n
         * @param m
         * @returns n と m が modulo を法として合同であるか
         */
        isCongruent: (n: number, m: number) => (n - m) % modulo == 0
    }
}

/**
 * 文字の集合
 */
class Alphabet {
    /**
     * 大文字ラテンアルファベット
     */
    static get capitalLatin() { return new Alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ'); }

    /**
     * いろは
     */
    static get iroha() { return new Alphabet('いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせすん'); }

    /**
     * 使用する文字の配列（重複は排除される）
     */
    private _characters: string[];

    /**
     * 文字から番号への辞書
     */
    private _indices = new Map<string, number>;

    /**
     * 含まれる文字の数
     */
    get size() { return this._characters.length; }

    /**
     * @description characters 内に重複する文字が存在する場合は無視される。例えば 'EBXBD' という文字列が渡された場合 ['E', 'B', 'X', 'D'] が実際に使用されるアルファベットになる。
     */
    constructor(characters: string) {
        this._characters = Array.from(new Set([...characters]));
        this._characters.forEach((c, v) => this._indices.set(c, v));
    }

    /**
     * アルファベット内の特定位置の文字
     * @param index 位置
     * @returns index に位置する文字。範囲外の場合は undefined
     */
    at(index: number) {
        return this._characters[index];
    }

    /**
     * 文字から位置への変換
     * @param char 文字
     * @returns char の位置
     * @throws {Error} char はアルファベット内に含まれていなければならない。
     */
    indexOf(char: string) {
        const index = this._indices.get(char);
        if (index === undefined) {
            throw Error(`${char} is not in alphabet.`);
        }
        return index;
    }

    /**
     * 含まれる文字が順番を含めて同一であるか
     * @param alphabet 比較対象
     * @returns this と alphabet の文字集合が等しいか
     */
    eqauls(alphabet: Alphabet) {
        return this._characters.join('') === alphabet._characters.join('');
    }

    /**
     * アルファベット内に文字が含まれるか検査する
     * @param char 検査する文字
     * @returns 含まれるか否か
     */
    contains(char: string) {
        return this._indices.get(char) !== undefined;
    }
}

/**
 * エニグマのプラグボード
 */
class PlugBoard {
    /**
     * @see {@link alphabet}
     */
    private _alphabet: Alphabet;

    /**
     * @see {@link exchangeTable}
     */
    private _exchangeTable: number[];

    /**
     * 使用するアルファベット
     */
    get alphabet() { return this._alphabet; }

    /**
     * プラグボードによる各文字の交換先のテーブル
     * @example 大文字ラテンアルファベットを用いるとき、A と C が交換される場合 exchangeTable[0] = 2, exchangeTable[2] = 0 となる。
     */
    get exchangeTable() { return this._exchangeTable; }

    /**
     * @param alphabet 使用するアルファベット
     * @param pairs 交換すべき文字の任意個のペア
     * @example A と C，K と O を交換する場合は ['A', 'C'], ['K', 'O'] を渡す。
     * @description ['A', 'A'] など同じ文字を交換するようにしてもエラー扱いにはならない。
     * @description 厳密には pairs に対し先頭から順にプラグを指しなおすという動作を行う。よって、例えば ['A', 'J'], ['J', 'Q'] が渡された場合には A が J に、J が Q に、Q が A に変換されることになる。
     */
    constructor(alphabet: Alphabet, ...pairs: [string, string][]) {
        this._alphabet = alphabet;
        this._exchangeTable = [...Array(this._alphabet.size).keys()];
        pairs.forEach(
            ([c1, c2]) => {
                const idx1 = this._alphabet.indexOf(c1), idx2 = this._alphabet.indexOf(c2);
                [this._exchangeTable[idx1], this._exchangeTable[idx2]] = [this._exchangeTable[idx2], this._exchangeTable[idx1]];
            }
        );
    }
}

/**
 * エニグマのロータ
 * @description 以下、リングもロータ自体も回転していない状態を「初期設定」と呼ぶ。
 * @description このクラスにおいては「交換を行わないプラグボードにそのロータを接続したときに n 番目の文字の入力信号が入ってくる穴、及びその向かい側の穴」を「n 番目の穴」と呼ぶ。またこの「穴の番号」はその穴自体に固有のものではなく、ロータの回転によって変化することに注意せよ。すなわち、ロータが一文字分の回転を行った場合、回転前には n 番目だった穴は回転後には (n - 1) mod |alphabet| 番目の穴になる。
 * @description このクラスにおいて、「隣のロータに回転を誘発する穴」は 0 番目から |alphabet| - 1 番目に変わるときに回転を誘発するものとする。
 */
class Rotor {
    /**
     * @see {@link alphabet}
     */
    private _alphabet: Alphabet;

    /**
     * 初期設定における i 番目の穴の接続先のオフセット
     * @description 初期設定においてプラグボード側から i 番目の穴に入った信号が j 番目の穴から出てくるとき、i + _initialOffsetTable[i] = j (mod |alphabet|) が成り立つ。
     * @example 初期設定においてプラグボード側から 4 番目の穴に入った信号が 9 番目の穴から出てくる場合 _initialOffsetTable[4] = (|alphabet| を法として 5 と合同な整数) となる。
     */
    private _initialOffsetTable: number[];

    /**
     * _initialOffsetTable の逆テーブル
     * @description 初期設定においてリフレクタ側から i 番目の穴に入った信号が j 番目の穴から出てくるとき、i + _initialReverseOffsetTable[i] = j (mod |alphabet|) が成り立つ。
     * @example 初期設定においてリフレクタ側から 7 番目の穴に入った信号が 3 番目の穴から出てくる場合 _initialReverseOffsetTable[7] = (|alphabet| を法として -4 と合同な整数) となる。
     */
    private _initialReverseOffsetTable: number[];

    /**
     * リングが現在何文字分回転しているか
     * @description リングの回転の向きはロータ自体の回転の向きと逆向きであることに注意する。
     */
    private _ringRotation = 0;

    /**
     * ロータ自体が現在何文字分回転しているか
     */
    private _rotation = 0;

    /**
     * 初期設定における「隣のロータに回転を誘発する穴」の番号の配列
     */
    private _initialTurnOvers: number[];

    /**
     * 剰余演算を行うオブジェクト
     */
    private get mod() { return mod(this._alphabet.size); }

    /**
     * 使用するアルファベット
     */
    get alphabet() { return this._alphabet; }

    /**
     * リングの回転を指定する setter。i 番目の文字を渡すとリングを初期設定から i 文字分回した状態にする。
     * @param char リング設定を表す文字
     */
    set ring(char: string) {
        this._ringRotation = this._alphabet.indexOf(char);
    }

    /**
     * ロータ自体の回転を指定する setter。i 番目の文字を渡すとロータを初期設定から i 文字分回した状態にする。
     * @param char ロータ設定を表す文字
     */
    set rotation(char: string) {
        this._rotation = this._alphabet.indexOf(char);
    }

    /**
     * @param alphabet 使用するアルファベット
     * @param initialOffsetTableStr alphabet 内の全ての文字を一つずつ含む文字列。initialOffsetTableStr[i] = (j 番目の文字) であることは、初期設定においてプラグボード側から i 番目の穴に入った信号が j 番目の穴から出てくることを意味する。
     * @param turnOverChars alphabet 内の任意個の文字。n 番目の文字は初期設定において n 番目の穴が「隣のロータに回転を誘発する穴」であることを意味する。
     * @throws {Error} alphabet の大きさと initialOffsetTableStr の長さは一致していなければならない。
     * @description initialOffsetTableStr が以上の例外条件に抵触せず、なおかつ重複する文字を含んでしまっている場合は未定義。
     */
    constructor(alphabet: Alphabet, initialOffsetTableStr: string, ...turnOverChars: string[]) {
        if (alphabet.size !== initialOffsetTableStr.length) {
            throw Error('|alphabet| must be equal to |initialOffsetTableStr|');
        }
        this._alphabet = alphabet;
        this._initialOffsetTable = [...initialOffsetTableStr].map((initialOffsetChar, i) => this._alphabet.indexOf(initialOffsetChar) - i);
        this._initialReverseOffsetTable = new Array(this._initialOffsetTable.length);
        this._initialOffsetTable.forEach((initialOffset, i) => this._initialReverseOffsetTable[this.mod.add(i, initialOffset)] = -initialOffset);
        this._initialTurnOvers = turnOverChars.map(turnOverChar => this._alphabet.indexOf(turnOverChar));
    }

    /**
     * ある穴が「隣のロータに回転を誘発する穴」であるか判定する
     * @param n 穴の番号、もしくは |alphabet| を法としてそれと合同な数
     * @returns 現時点で n 番目の穴が「隣のロータに回転を誘発する穴」であるか否か
     */
    isTurnOver(n: number) {
        return this._initialTurnOvers.some(initialTurnOver => this.mod.isCongruent(n + this._rotation, initialTurnOver));
    }

    /**
     * ロータを回転する
     * @returns 隣のロータに回転を誘発した直後であるか否か
     */
    rotate() {
        ++this._rotation;
        return this.isTurnOver(-1);
    }

    /**
     * プラグボード側から入ってきた信号の行き先
     * @param n 穴の番号、もしくは |alphabet| を法としてそれと合同な数
     * @returns 出口となる穴の番号（0 以上 |alphabet| 未満）
     */
    passInward(n: number) {
        return this.mod.add(n, this._initialOffsetTable[this.mod.sub(n + this._rotation, this._ringRotation)]);
    }

    /**
     * リフレクタ側から入ってきた信号の行き先
     * @param n 穴の番号、もしくは |alphabet| を法としてそれと合同な数
     * @returns 出口となる穴の番号（0 以上 |alphabet| 未満）
     */
    passOutward(n: number) {
        return this.mod.add(n, this._initialReverseOffsetTable[this.mod.sub(n + this._rotation, this._ringRotation)]);
    }
}

/**
 * エニグマのリフレクタ
 * @description エニグマの実機ではリフレクタをプラグボードに直接接続することはないものの、ここでも「穴の番号」はロータと同様に定める。
 */
class Reflector {
    /**
     * @see {@link alphabet}
     */
    private _alphabet: Alphabet;

    /**
     * i 番目の穴の接続先のオフセット
     */
    private _offsetTable: number[];

    /**
     * 剰余演算を行うオブジェクト
     */
    private get mod() { return mod(this._alphabet.size); }

    /**
     * 使用するアルファベット
     */
    get alphabet() { return this._alphabet; }

    /**
     * @param offsetTableStr alphabet 内の全ての文字を一つずつ含む文字列。offsetTableStr[i] = (j 番目の文字) であることは、i 番目の穴に入った信号が j 番目の穴から出てくることを意味する。
     * @throws {Error} alphabet の大きさと offsetTableStr の長さは一致していなければならない。
     * @description offsetTableStr が以上の例外条件に抵触せず、なおかつ重複する文字を含んでしまっている場合は未定義。
     */
    constructor(alphabet: Alphabet, offsetTableStr: string) {
        if (alphabet.size !== offsetTableStr.length) {
            throw Error('|alphabet| must be equal to |offsetTableStr|');
        }
        this._alphabet = alphabet;
        this._offsetTable = [...offsetTableStr].map((offsetChar, i) => this._alphabet.indexOf(offsetChar) - i);
    }

    /**
     * 入ってきた信号の行き先
     * @param n 穴の番号、もしくは |alphabet| を法としてそれと合同な数
     * @returns 出口となる穴の番号（0 以上 |alphabet| 未満）
     */
    pass(n: number) {
        return this.mod.add(n, this._offsetTable[n]);
    }
}

/**
 * 各エニグマ機の親となる抽象クラス
 */
abstract class AbstractEnigma {
    /**
     * @see {@link alphabet}
     */
    protected _alphabet: Alphabet;

    /**
     * @see {@link plugBoard}
     */
    protected _plugBoard: PlugBoard;

    /**
     * @see {@link rotor}
     */
    protected _rotors: Rotor[];

    /**
     * @see {@link reflector}
     */
    protected _reflector: Reflector;

    /**
     * 使用するアルファベット
     */
    get alphabet() { return this._alphabet; }

    /**
     * プラグボード
     */
    get plugBoard() { return this._plugBoard; }

    /**
     * ロータの配列（プラグボードに近い順）
     */
    get rotors() { return this._rotors; }

    /**
     * リフレクタ
     */
    get reflector() { return this._reflector; }

    /**
     * @param plugBoard プラグボード
     * @param rotors ロータの配列（プラグボードに近い順）
     * @param reflector リフレクタ
     * @param ringSetting アルファベット内の文字からなる文字列。i 文字目がアルファベット内の j 番目の文字であることは i 番目のロータのリングを j 文字分回転させてから使うことを意味する。使用するロータの数と同じ長さでなければならない。
     * @param rotationSetting アルファベット内の文字からなる文字列。i 文字目がアルファベット内の j 番目の文字であることは i 番目のロータを j 文字分回転させてから使うことを意味する。使用するロータの数と同じ長さでなければならない。
     * @throws {Error} plugBoard, rotors, reflector の使用しているアルファベットはすべて同一でなければならない。
     * @throws {Error} ringSetting と rotationSetting の長さはロータの数と一致しなければならない。
     */
    constructor(plugBoard: PlugBoard, rotors: Rotor[], reflector: Reflector, ringSetting: string, rotationSetting: string) {
        if (![...rotors.map(rotor => rotor.alphabet), reflector.alphabet].every(alphabet => alphabet.eqauls(plugBoard.alphabet))) {
            throw Error('alphabets of plugBoard, rotors, and reflector must be much.');
        }
        if (rotors.length != ringSetting.length || rotors.length != rotationSetting.length) {
            throw Error('count of rotors and lengths of ringSetting and rotationSetting must be much.');
        }
        this._alphabet = plugBoard.alphabet;
        this._plugBoard = plugBoard;
        this._rotors = rotors;
        this._reflector = reflector;
        rotors.forEach((rotor, i) => rotor.ring = ringSetting.charAt(i));
        rotors.forEach((rotor, i) => rotor.rotation = rotationSetting.charAt(i));
    }

    /**
     * @summary 文字を入力されたことによる信号が通過することになる穴の一覧を返却する。
     * @param char 入力する文字
     * @returns 信号が通過する穴の番号の一覧 (plugToRotor: 入力信号がプラグボードのどの穴から出ていくか / holesToNext: プラグボード側からの信号が各ロータのどの穴から出ていくか / reflectorHoleToPrev: プラグボード側からの信号がリフレクタのどの穴から出ていくか / holesToPrev: リフレクタ側からの信号が各ロータのどの穴から出ていくか / plugToOut: 最終的にプラグボードのどの穴から出ていくか)
     */
    getPath(char: string) {
        const plugToRotor = this._plugBoard.exchangeTable[this.alphabet.indexOf(char)];
        const holesToNext = Array<number>();
        for (const rotor of this.rotors) {
            holesToNext.push(
                rotor.passInward(
                    holesToNext.length ? holesToNext[holesToNext.length - 1] : plugToRotor
                )
            );
        }
        const reflectorHoleToPrev = this.reflector.pass(holesToNext[holesToNext.length - 1]);
        const holesToPrev = Array<number>();
        for (let i = this._rotors.length - 1; i >= 0; --i) {
            holesToPrev.push(
                this._rotors[i].passOutward(
                    holesToPrev.length ? holesToPrev[holesToPrev.length - 1] : reflectorHoleToPrev
                )
            );
        }
        return {
            plugToRotor: plugToRotor,
            holesToNext: holesToNext,
            reflectorHoleToPrev: reflectorHoleToPrev,
            holesToPrev: holesToPrev,
            plugToOut: this._plugBoard.exchangeTable[holesToPrev[holesToPrev.length - 1]]
        };
    }

    /**
     * 文字列を暗号化する
     * @param str 暗号化する文字列
     * @returns 暗号化された文字列
     */
    encrypt(str: string) {
        return [...str].map(char => {
            for (const rotor of this._rotors) {
                if (!rotor.rotate()) {
                    break;
                }
            }
            return this.plugBoard.alphabet.at(this.getPath(char).plugToOut);
        }).join('');
    }

    /**
     * @see {@link encrypt}
     * @description エニグマによる復号の手順は暗号化の手順と同じ（つまりある文字列を同じ設定で二回暗号化すると元に戻る）ため、この関数はただの encrypt() のラッパである。
     */
    decrypt(str: string) {
        return this.encrypt(str);
    }
}

/**
 * エニグマ I の実装
 */
class EnigmaI extends AbstractEnigma {
    static get rotorI() { return new Rotor(Alphabet.capitalLatin, 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'); }
    static get rotorII() { return new Rotor(Alphabet.capitalLatin, 'AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'); }
    static get rotorIII() { return new Rotor(Alphabet.capitalLatin, 'BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'); }
    static get rotorIV() { return new Rotor(Alphabet.capitalLatin, 'ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'); }
    static get rotorV() { return new Rotor(Alphabet.capitalLatin, 'VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'); }
    static get reflectorA() { return new Reflector(Alphabet.capitalLatin, 'EJMZALYXVBWFCRQUONTSPIKHGD'); }
    static get reflectorB() { return new Reflector(Alphabet.capitalLatin, 'YRUHQSLDPXNGOKMIEBFZCWVJAT'); }
    static get reflectorC() { return new Reflector(Alphabet.capitalLatin, 'FVPJIAOYEDRZXWGCTKUQSBNMHL'); }

    /**
     * @param plugBoard see {@link AbstractEnigma.constructor}
     * @param rotor1 プラグボード側のロータ
     * @param rotor2 真ん中のロータ
     * @param rotor3 リフレクタ側のロータ
     * @param reflector see {@link AbstractEnigma.constructor}
     * @param ringSetting see {@link AbstractEnigma.constructor}
     * @param rotationSetting see {@link AbstractEnigma.constructor}
     */
    constructor(
        plugBoard: PlugBoard,
        rotor1: Rotor, rotor2: Rotor, rotor3: Rotor,
        reflector: Reflector,
        ringSetting: string,
        rotationSetting: string
    ) {
        super(plugBoard, [rotor1, rotor2, rotor3], reflector, ringSetting, rotationSetting);
    }
}

/**
 * M4 の実装
 */
class M4 extends AbstractEnigma {
    static get rotorI() { return EnigmaI.rotorI; }
    static get rotorII() { return EnigmaI.rotorII; }
    static get rotorIII() { return EnigmaI.rotorIII; }
    static get rotorIV() { return EnigmaI.rotorIV; }
    static get rotorV() { return EnigmaI.rotorV; }
    static get rotorVI() { return new Rotor(Alphabet.capitalLatin, 'JPGVOUMFYQBENHZRDKASXLICTW', 'Z', 'M'); }
    static get rotorVII() { return new Rotor(Alphabet.capitalLatin, 'NZJHGRCXMYSWBOUFAIVLPEKQDT', 'Z', 'M'); }
    static get rotorVIII() { return new Rotor(Alphabet.capitalLatin, 'FKQHTLXOCBJSPDZRAMEWNIUYGV', 'Z', 'M'); }
    static get rotorBeta() { return new Rotor(Alphabet.capitalLatin, 'LEYJVCNIXWPBQMDRTAKZGFUHOS'); }
    static get rotorGumma() { return new Rotor(Alphabet.capitalLatin, 'FSOKANUERHMBTIYCWLQPZXVGJD'); }
    static get reflectorB() { return new Reflector(Alphabet.capitalLatin, 'ENKQAUYWJICOPBLMDXZVFTHRGS'); }
    static get reflectorC() { return new Reflector(Alphabet.capitalLatin, 'RDOBJNTKVEHMLFCWZAXGYIPSUQ'); }

    /**
     * @param plugBoard see {@link AbstractEnigma.constructor}
     * @param rotor1 プラグボード側のロータ
     * @param rotor2 真ん中のロータ
     * @param rotor3 リフレクタ側のロータ
     * @param additionalRotor リフレクタにくっつく追加ロータ
     * @param reflector see {@link AbstractEnigma.constructor}
     * @param ringSetting see {@link AbstractEnigma.constructor}
     * @param rotationSetting see {@link AbstractEnigma.constructor}
     * @throws {Error} ringSetting と rotationSetting の長さは 4 でなければならない。
     */
    constructor(
        plugBoard: PlugBoard,
        rotor1: Rotor, rotor2: Rotor, rotor3: Rotor,
        additionalRotor: Rotor, reflector: Reflector,
        ringSetting: string,
        rotationSetting: string
    ) {
        if (ringSetting.length != 4 || rotationSetting.length != 4) {
            throw Error('length of ringSetting and rotationSetting must be 4.');
        }
        additionalRotor.ring = ringSetting.charAt(3);
        additionalRotor.rotation = rotationSetting.charAt(3);
        super(
            plugBoard,
            [rotor1, rotor2, rotor3],
            new Reflector(
                Alphabet.capitalLatin,
                [...Array(plugBoard.alphabet.size).keys()].map(
                    i => plugBoard.alphabet.at(additionalRotor.passOutward(reflector.pass(additionalRotor.passInward(i))))
                ).join('')
            ),
            ringSetting.slice(0, 3),
            rotationSetting.slice(0, 3)
        );
    }
}
