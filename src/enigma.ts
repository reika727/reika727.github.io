'use strict';

export { PlugBoard, Wheel, Reflector, EnigmaI, M4 };

class Mod26 {
    static mod(n: number) {
        return (n % 26 + 26) % 26;
    }
    static add(n: number, m: number) {
        return Mod26.mod(n + m);
    }
    static sub(n: number, m: number) {
        return Mod26.mod(n - m);
    }
    static isCongruent(n: number , m: number) {
        return Mod26.sub(n, m) === 0;
    }
}

class PlugBoard {
    private _exchangeTable = [...Array(26).keys()];
    get exchangeTable() { return this._exchangeTable; }
    constructor(...pairs: [string, string][]) {
        pairs.forEach(
            ([c1, c2]) => {
                const idx1 = c1.charCodeAt(0) - 'A'.charCodeAt(0);
                const idx2 = c2.charCodeAt(0) - 'A'.charCodeAt(0);
                [this._exchangeTable[idx1], this._exchangeTable[idx2]] = [this._exchangeTable[idx2], this._exchangeTable[idx1]];
            }
        );
    }
    pass(n: number) {
        return this._exchangeTable[n];
    }
}

abstract class AbstractWheel {
    protected _offsetTable: number[];
    protected _reverseOffsetTable = Array(26);
    constructor(offsetTableStr: string) {
        this._offsetTable = [...offsetTableStr].map((v, i) =>  v.charCodeAt(0) - ('A'.charCodeAt(0) + i));
        for (let i = 0; i < 26; ++i) {
            this._reverseOffsetTable[Mod26.add(i, this._offsetTable[i])] = -this._offsetTable[i];
        }
    }
    passInward(n: number) {
        return Mod26.add(n, this._offsetTable[n]);
    }
    passOutward(n: number) {
        return Mod26.add(n, this._reverseOffsetTable[n]);
    }
}

class Wheel extends AbstractWheel {
    private _rotationOffset = 0;
    private _turnOverOffsets: number[];
    get turnOverOffsets() { return this._turnOverOffsets; }
    constructor(offsetTableStr: string, ...turnOverChars: string[]) {
        super(offsetTableStr);
        this._turnOverOffsets = turnOverChars.map(v => v.charCodeAt(0) - 'A'.charCodeAt(0));
    }
    rotateRing(inc: number) {
        this._rotationOffset += inc;
    }
    rotate(inc = 1) {
        this._rotationOffset -= inc;
        this._turnOverOffsets = this._turnOverOffsets.map(v => v - inc);
        return this._turnOverOffsets.some(v => Mod26.isCongruent(v, -1));
    }
    override passInward(n: number) {
        return Mod26.add(n, this._offsetTable[Mod26.sub(n, this._rotationOffset)]);
    }
    override passOutward(n: number) {
        return Mod26.add(n, this._reverseOffsetTable[Mod26.sub(n, this._rotationOffset)]);
    }
}

class Reflector extends AbstractWheel {
}

abstract class AbstractEnigma {
    protected _plugBoard: PlugBoard;
    protected _wheels: Wheel[];
    protected _reflector: Reflector;
    get plugBoard() { return this._plugBoard; }
    get wheels() { return this._wheels; }
    get reflector() { return this._reflector; }
    constructor(plugBoard: PlugBoard, wheels: Wheel[], reflector: Reflector, ringSetting: string, rotationSetting: string) {
        this._plugBoard = plugBoard;
        this._wheels = wheels;
        this._reflector = reflector;
        wheels.forEach((v, i) => v.rotateRing(ringSetting.charCodeAt(i) - 'A'.charCodeAt(0)));
        wheels.forEach((v, i) => v.rotate(rotationSetting.charCodeAt(i) - 'A'.charCodeAt(0)));
    }
    encrypt(str: string) {
        return [...str].map(char => {
            for (const w of this._wheels) {
                if (!w.rotate()) {
                    break;
                }
            }
            return String.fromCharCode('A'.charCodeAt(0) +
                this._plugBoard.pass(
                    this._wheels.reduceRight(
                        (acc, cur) => cur.passOutward(acc),
                        this._reflector.passOutward(
                            this._wheels.reduce(
                                (acc, cur) => cur.passInward(acc),
                                this._plugBoard.pass(char.charCodeAt(0) - 'A'.charCodeAt(0))
                            )
                        )
                    )
                )
            );
        }).join('');
    }
    decrypt(str: string) {
        return this.encrypt(str);
    }
}

class EnigmaI extends AbstractEnigma {
    static get wheelI() { return new Wheel('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'); }
    static get wheelII() { return new Wheel('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'); }
    static get whellIII() { return new Wheel('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'); }
    static get wheelIV() { return new Wheel('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'); }
    static get wheelV() { return new Wheel('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'); }
    static get reflectorA() { return new Reflector('EJMZALYXVBWFCRQUONTSPIKHGD'); }
    static get reflectorB() { return new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT'); }
    static get reflectorC() { return new Reflector('FVPJIAOYEDRZXWGCTKUQSBNMHL'); }
    constructor(
        plugBoard: PlugBoard,
        wheel1: Wheel, wheel2: Wheel, wheel3: Wheel,
        reflector: Reflector,
        ringSetting: string,
        rotationSetting: string
    ) {
        super(plugBoard, [wheel1, wheel2, wheel3], reflector, ringSetting, rotationSetting);
    }
}

class M4 extends AbstractEnigma {
    static get wheelI() { return EnigmaI.wheelI; }
    static get wheelII() { return EnigmaI.wheelII; }
    static get wheelIII() { return EnigmaI.whellIII; }
    static get wheelIV() { return EnigmaI.wheelIV; }
    static get wheelV() { return EnigmaI.wheelV; }
    static get wheelVI() { return new Wheel('JPGVOUMFYQBENHZRDKASXLICTW', 'Z', 'M'); }
    static get wheelVII() { return new Wheel('NZJHGRCXMYSWBOUFAIVLPEKQDT', 'Z', 'M'); }
    static get wheelVIII() { return new Wheel('FKQHTLXOCBJSPDZRAMEWNIUYGV', 'Z', 'M'); }
    static get wheelBeta() { return new Wheel('LEYJVCNIXWPBQMDRTAKZGFUHOS'); }
    static get wheelGumma() { return new Wheel('FSOKANUERHMBTIYCWLQPZXVGJD'); }
    static get reflectorB() { return new Reflector('ENKQAUYWJICOPBLMDXZVFTHRGS'); }
    static get reflectorC() { return new Reflector('RDOBJNTKVEHMLFCWZAXGYIPSUQ'); }
    constructor(
        plugBoard: PlugBoard,
        wheel1: Wheel, wheel2: Wheel, wheel3: Wheel,
        additionalWheel: Wheel, reflector: Reflector,
        ringSetting: string,
        rotationSetting: string
    ) {
        additionalWheel.rotateRing(ringSetting.charCodeAt(3) - 'A'.charCodeAt(0));
        additionalWheel.rotate(rotationSetting.charCodeAt(3) - 'A'.charCodeAt(0));
        super(
            plugBoard,
            [wheel1, wheel2, wheel3],
            new Reflector(
                [...Array(26).keys()].map(
                    i => String.fromCharCode('A'.charCodeAt(0) + additionalWheel.passOutward(reflector.passInward(additionalWheel.passInward(i))))
                ).join('')
            ),
            ringSetting,
            rotationSetting
        );
    }
}
