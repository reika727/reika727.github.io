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
    private exchangeTable = [...Array(26).keys()];
    constructor(...pairs: [string, string][]) {
        pairs.forEach(
            ([c1, c2]) => {
                const idx1 = c1.charCodeAt(0) - 'A'.charCodeAt(0);
                const idx2 = c2.charCodeAt(0) - 'A'.charCodeAt(0);
                [this.exchangeTable[idx1], this.exchangeTable[idx2]] = [this.exchangeTable[idx2], this.exchangeTable[idx1]];
            }
        );
    }
    pass(n: number) {
        return this.exchangeTable[n];
    }
}

abstract class AbstractWheel {
    protected offsetTable: number[];
    protected reverseOffsetTable = Array(26);
    constructor(offsetTableStr: string) {
        this.offsetTable = [...offsetTableStr].map((v, i) =>  v.charCodeAt(0) - ('A'.charCodeAt(0) + i));
        for (let i = 0; i < 26; ++i) {
            this.reverseOffsetTable[Mod26.add(i, this.offsetTable[i])] = -this.offsetTable[i];
        }
    }
    passInward(n: number) {
        return Mod26.add(n, this.offsetTable[n]);
    }
    passOutward(n: number) {
        return Mod26.add(n, this.reverseOffsetTable[n]);
    }
}

class Wheel extends AbstractWheel {
    private rotationOffset = 0;
    private turnOverOffsets: number[];
    constructor(offsetTableStr: string, ...turnOverChars: string[]) {
        super(offsetTableStr);
        this.turnOverOffsets = turnOverChars.map(v => v.charCodeAt(0) - 'A'.charCodeAt(0));
    }
    rotateRing(inc: number) {
        this.rotationOffset += inc;
    }
    rotate(inc = 1) {
        this.rotationOffset -= inc;
        this.turnOverOffsets = this.turnOverOffsets.map(v => v - inc);
        return this.turnOverOffsets.some(v => Mod26.isCongruent(v, -1));
    }
    override passInward(n: number) {
        return Mod26.add(n, this.offsetTable[Mod26.sub(n, this.rotationOffset)]);
    }
    override passOutward(n: number) {
        return Mod26.add(n, this.reverseOffsetTable[Mod26.sub(n, this.rotationOffset)]);
    }
}

class Reflector extends AbstractWheel {
}

abstract class AbstractEnigma {
    protected plugBoard: PlugBoard;
    protected wheels: Wheel[];
    protected reflector: Reflector;
    constructor(plugBoard: PlugBoard, wheels: Wheel[], reflector: Reflector, ringSetting: string, rotationSetting: string) {
        this.plugBoard = plugBoard;
        this.wheels = wheels;
        this.reflector = reflector;
        wheels.forEach((v, i) => v.rotateRing(ringSetting.charCodeAt(i) - 'A'.charCodeAt(0)));
        wheels.forEach((v, i) => v.rotate(rotationSetting.charCodeAt(i) - 'A'.charCodeAt(0)));
    }
    encrypt(str: string) {
        return [...str].map(char => {
            for (const w of this.wheels) {
                if (!w.rotate()) {
                    break;
                }
            }
            return String.fromCharCode('A'.charCodeAt(0) +
                this.plugBoard.pass(
                    this.wheels.reduceRight(
                        (acc, cur) => cur.passOutward(acc),
                        this.reflector.passOutward(
                            this.wheels.reduce(
                                (acc, cur) => cur.passInward(acc),
                                this.plugBoard.pass(char.charCodeAt(0) - 'A'.charCodeAt(0))
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
        additionalWheel.rotateRing(ringSetting[3].charCodeAt(0) - 'A'.charCodeAt(0));
        additionalWheel.rotate(rotationSetting[3].charCodeAt(0) - 'A'.charCodeAt(0));
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
