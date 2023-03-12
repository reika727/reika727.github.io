'use strict';

export { PlugBoard, Rotor, Reflector, EnigmaI, M4 };

/**
 * 26 を法とする最小非負剰余を扱う関数群
 */
namespace Mod26 {
    /**
     * 26 を法とする剰余
     * @param n 剰余を求める数
     * @returns 26 を法とする n の剰余
     */
    function mod(n: number) {
        return (n % 26 + 26) % 26;
    }

    /**
     * 26 を法とする加算
     * @param n
     * @param m
     * @returns 26 を法とする n + m の剰余
     */
    export function add(n: number, m: number) {
        return mod(n + m);
    }

    /**
     * 26 を法とする減算
     * @param n
     * @param m
     * @returns 26 を法とする n - m の剰余
     */
    export function sub(n: number, m: number) {
        return mod(n - m);
    }

    /**
     * 26 を法として合同であるか
     * @param n
     * @param m
     * @returns n と m が 26 を法として合同であるか
     */
    export function isCongruent(n: number, m: number) {
        return sub(n, m) == 0;
    }
}

/**
 * エニグマのプラグボード
 */
class PlugBoard {
    /**
     * @see {@link exchangeTable}
     */
    private _exchangeTable = [...Array(26).keys()];

    /**
     * プラグボードによる各アルファベットの交換先のテーブル
     * @example A と C が交換される場合 exchangeTable[0] = 2, exchangeTable[2] = 0 となる。
     */
    get exchangeTable() { return this._exchangeTable; }

    /**
     * @param pairs 交換すべき文字の任意個のペア
     * @example A と C，K と O を交換する場合は ['A', 'C'], ['K', 'O'] を渡す。
     * @description ['A', 'A'] など同じ文字を交換するようにしてもエラー扱いにはならないことと、エニグマの実機とは違って交換できる数に上限がないことに注意。
     */
    constructor(...pairs: [string, string][]) {
        pairs.forEach(
            ([c1, c2]) => {
                const idx1 = c1.charCodeAt(0) - 'A'.charCodeAt(0);
                const idx2 = c2.charCodeAt(0) - 'A'.charCodeAt(0);
                [this._exchangeTable[idx1], this._exchangeTable[idx2]] = [this._exchangeTable[idx2], this._exchangeTable[idx1]];
            }
        );
    }
}

/**
 * エニグマのロータ
 * @description 以下、リングもロータ自体も回転していない状態を「初期設定」と呼ぶ。
 * @description このクラスにおいては、「交換を行わないプラグボードにそのロータを接続したときに n 番目のアルファベットの入力信号が入ってくる穴、及びその向かい側の穴」を「n 番目の穴」と呼ぶ。またこの「穴の番号」はその穴自体に固有のものではなく、ロータの回転によって変化することに注意せよ。すなわち、ロータが一文字分の回転を行った場合、回転前には n 番目だった穴は回転後には (n - 1) mod 26 番目の穴になる。
 * @description このクラスにおいて、「隣のロータに回転を誘発する穴」は 0 番目から 25 番目に変わるときに回転を誘発するものとする。
 */
class Rotor {
    /**
     * 初期設定における i 番目の穴の接続先のオフセット
     * @description 初期設定においてプラグボード側から i 番目の穴に入った信号が j 番目の穴から出てくるとき、i + _initialOffsetTable[i] = j (mod 26) が成り立つ。
     * @example 初期設定においてプラグボード側から 4 番目の穴に入った信号が 9 番目の穴から出てくる場合 _initialOffsetTable[4] = (26 を法として 5 と合同な整数) となる。
     */
    private _initialOffsetTable: number[];

    /**
     * _initialOffsetTable の逆テーブル
     * @description 初期設定においてリフレクタ側から i 番目の穴に入った信号が j 番目の穴から出てくるとき、i + _initialReverseOffsetTable[i] = j (mod 26) が成り立つ。
     * @example 初期設定においてリフレクタ側から 7 番目の穴に入った信号が 3 番目の穴から出てくる場合 _initialReverseOffsetTable[7] = (26 を法として -4 と合同な整数) となる。
     */
    private _initialReverseOffsetTable = Array(26);

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
     * リングの回転を指定する setter。i 番目のアルファベットを渡すとリングを初期設定から i 文字分回した状態にする。
     */
    set ring(char: string) { this._ringRotation = char.charCodeAt(0) - 'A'.charCodeAt(0); }

    /**
     * ロータ自体の回転を指定する setter。i 番目のアルファベットを渡すとロータを初期設定から i 文字分回した状態にする。
     */
    set rotation(char: string) { this._rotation = char.charCodeAt(0) - 'A'.charCodeAt(0); }

    /**
     * @param initialOffsetTableStr 全ての大文字アルファベットを一つずつ含む文字列。initialOffsetTableStr[i] = (j 番目のアルファベット) であることは、初期設定においてプラグボード側から i 番目の穴に入った信号が j 番目の穴から出てくることを意味する。
    　* @param turnOverChars 任意個の大文字アルファベット。n 番目のアルファベットは初期設定において n 番目の穴が「隣のロータに回転を誘発する穴」であることを意味する。
     */
    constructor(initialOffsetTableStr: string, ...turnOverChars: string[]) {
        this._initialOffsetTable = [...initialOffsetTableStr].map((initialOffsetChar, i) =>  initialOffsetChar.charCodeAt(0) - ('A'.charCodeAt(0) + i));
        this._initialOffsetTable.forEach((initialOffset, i) => this._initialReverseOffsetTable[Mod26.add(i, initialOffset)] = -initialOffset);
        this._initialTurnOvers = turnOverChars.map(turnOverChar => turnOverChar.charCodeAt(0) - 'A'.charCodeAt(0));
    }

    /**
     * ある穴が「隣のロータに回転を誘発する穴」であるか判定する
     * @param n 穴の番号、もしくは 26 を法としてそれと合同な数
     * @returns 現時点で n 番目の穴が「隣のロータに回転を誘発する穴」であるか否か
     */
    isTurnOver(n: number) {
        return this._initialTurnOvers.some(initialTurnOver => Mod26.isCongruent(n + this._rotation, initialTurnOver));
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
     * @param n 穴の番号（あるいは 26 を法としてそれと合同な数）
     * @returns 出口となる穴の番号（0 以上 26 未満）
     */
    passInward(n: number) {
        return Mod26.add(n, this._initialOffsetTable[Mod26.sub(n + this._rotation, this._ringRotation)]);
    }

    /**
     * リフレクタ側から入ってきた信号の行き先
     * @param n 穴の番号（あるいは 26 を法としてそれと合同な数）
     * @returns 出口となる穴の番号（0 以上 26 未満）
     */
    passOutward(n: number) {
        return Mod26.add(n, this._initialReverseOffsetTable[Mod26.sub(n + this._rotation, this._ringRotation)]);
    }
}

/**
 * エニグマのリフレクタ
 * @description エニグマの実機ではリフレクタをプラグボードに直接接続することはないものの、ここでも「穴の番号」はロータと同様に定める。
 */
class Reflector {
    /**
     * i 番目の穴の接続先のオフセット
     */
    private _offsetTable: number[];

    /**
     * @param offsetTableStr 全ての大文字アルファベットを一つずつ含む文字列。offsetTableStr[i] = (j 番目のアルファベット) であることは、i 番目の穴に入った信号が j 番目の穴から出てくることを意味する。
     */
    constructor(offsetTableStr: string) {
        this._offsetTable = [...offsetTableStr].map((offsetChar, i) => offsetChar.charCodeAt(0) - ('A'.charCodeAt(0) + i));
    }

    /**
     * 入ってきた信号の行き先
     * @param n 穴の番号（あるいは 26 を法としてそれと合同な数）
     * @returns 出口となる穴の番号（0 以上 26 未満）
     */
    pass(n: number) {
        return Mod26.add(n, this._offsetTable[n]);
    }
}

/**
 * 各エニグマ機の親となる抽象クラス
 */
abstract class AbstractEnigma {
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
     * @param ringSetting 大文字アルファベットからなる文字列。i 文字目が j 番目のアルファベットであることは i 番目のロータのリングを j 文字分回転させてから使うことを意味する。
     * @param rotationSetting 大文字アルファベットからなる文字列。i 文字目が j 番目のアルファベットであることは i 番目のロータを j 文字分回転させてから使うことを意味する。
     */
    constructor(plugBoard: PlugBoard, rotors: Rotor[], reflector: Reflector, ringSetting: string, rotationSetting: string) {
        this._plugBoard = plugBoard;
        this._rotors = rotors;
        this._reflector = reflector;
        rotors.forEach((rotor, i) => rotor.ring = ringSetting.charAt(i));
        rotors.forEach((rotor, i) => rotor.rotation = rotationSetting.charAt(i));
    }

    /**
     * @summary 文字を入力されたことによる信号が通過することになる穴の一覧を返却する。
     * @param char 入力する文字
     * @returns 信号が通過する穴の番号の一覧 (exchangedIn: プラグボードから出た信号が入っていく穴 / rotorsIn: 各ロータからリフレクタ側に向かって出ていった信号が入っていく穴 / reflected: リフレクタから出た信号が入っていく穴 / rotorsOut: 各ロータからプラグボード側に向かって出ていった信号が入っていく穴 / exchangedOut: プラグボードのどこから出てくるか)
     */
    getPath(char: string) {
        const exchangedIn = this._plugBoard.exchangeTable[char.charCodeAt(0) - 'A'.charCodeAt(0)];
        const rotorsIn = Array<number>();
        for (const rotor of this.rotors) {
            rotorsIn.push(
                rotor.passInward(
                    rotorsIn.length ? rotorsIn[rotorsIn.length - 1] : exchangedIn
                )
            );
        }
        const reflected = this.reflector.pass(rotorsIn[rotorsIn.length - 1]);
        const rotorsOut = Array<number>();
        for (let i = this._rotors.length - 1; i >= 0; --i) {
            rotorsOut.push(
                this._rotors[i].passOutward(
                    rotorsOut.length ? rotorsOut[rotorsOut.length - 1] : reflected
                )
            );
        }
        return {
            exchangedIn: exchangedIn,
            rotorsIn: rotorsIn,
            reflected: reflected,
            rotorsOut: rotorsOut,
            exchangedOut: this._plugBoard.exchangeTable[rotorsOut[rotorsOut.length - 1]]
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
            return String.fromCharCode('A'.charCodeAt(0) + this.getPath(char).exchangedOut);
        }).join('');
    }

    /**
     * 文字列を復号する
     * @param str 復号する文字列
     * @returns 復号された文字列
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
    static get rotorI() { return new Rotor('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'); }
    static get rotorII() { return new Rotor('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'); }
    static get rotorIII() { return new Rotor('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'); }
    static get rotorIV() { return new Rotor('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'); }
    static get rotorV() { return new Rotor('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'); }
    static get reflectorA() { return new Reflector('EJMZALYXVBWFCRQUONTSPIKHGD'); }
    static get reflectorB() { return new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT'); }
    static get reflectorC() { return new Reflector('FVPJIAOYEDRZXWGCTKUQSBNMHL'); }

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
    static get rotorVI() { return new Rotor('JPGVOUMFYQBENHZRDKASXLICTW', 'Z', 'M'); }
    static get rotorVII() { return new Rotor('NZJHGRCXMYSWBOUFAIVLPEKQDT', 'Z', 'M'); }
    static get rotorVIII() { return new Rotor('FKQHTLXOCBJSPDZRAMEWNIUYGV', 'Z', 'M'); }
    static get rotorBeta() { return new Rotor('LEYJVCNIXWPBQMDRTAKZGFUHOS'); }
    static get rotorGumma() { return new Rotor('FSOKANUERHMBTIYCWLQPZXVGJD'); }
    static get reflectorB() { return new Reflector('ENKQAUYWJICOPBLMDXZVFTHRGS'); }
    static get reflectorC() { return new Reflector('RDOBJNTKVEHMLFCWZAXGYIPSUQ'); }

    /**
     * @param plugBoard see {@link AbstractEnigma.constructor}
     * @param rotor1 プラグボード側のロータ
     * @param rotor2 真ん中のロータ
     * @param rotor3 リフレクタ側のロータ
     * @param additionalRotor リフレクタにくっつく追加ロータ
     * @param reflector see {@link AbstractEnigma.constructor}
     * @param ringSetting see {@link AbstractEnigma.constructor}
     * @param rotationSetting see {@link AbstractEnigma.constructor}
     */
    constructor(
        plugBoard: PlugBoard,
        rotor1: Rotor, rotor2: Rotor, rotor3: Rotor,
        additionalRotor: Rotor, reflector: Reflector,
        ringSetting: string,
        rotationSetting: string
    ) {
        additionalRotor.ring = ringSetting.charAt(3);
        additionalRotor.rotation = rotationSetting.charAt(3);
        super(
            plugBoard,
            [rotor1, rotor2, rotor3],
            new Reflector(
                [...Array(26).keys()].map(
                    i => String.fromCharCode('A'.charCodeAt(0) + additionalRotor.passOutward(reflector.pass(additionalRotor.passInward(i))))
                ).join('')
            ),
            ringSetting,
            rotationSetting
        );
    }
}
