'use strict';

export { PlugBoard, Rotor, Reflector, EnigmaI, M4 };

namespace Mod26 {
    function mod(n: number) {
        return (n % 26 + 26) % 26;
    }
    export function add(n: number, m: number) {
        return mod(n + m);
    }
    export function sub(n: number, m: number) {
        return mod(n - m);
    }
    export function isCongruent(n: number, m: number) {
        return sub(n, m) == 0;
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
}

abstract class AbstractRotor {
    protected _offsetTable: number[];
    protected _reverseOffsetTable = Array(26);
    constructor(offsetTableStr: string) {
        this._offsetTable = [...offsetTableStr].map((offsetChar, i) =>  offsetChar.charCodeAt(0) - ('A'.charCodeAt(0) + i));
        this._offsetTable.forEach((offset, i) => this._reverseOffsetTable[Mod26.add(i, offset)] = -offset);
    }
    passInward(n: number) {
        return Mod26.add(n, this._offsetTable[n]);
    }
    passOutward(n: number) {
        return Mod26.add(n, this._reverseOffsetTable[n]);
    }
}

class Rotor extends AbstractRotor {
    private _ringRotationOffset = 0;
    private _rotationOffset = 0;
    private _turnOverOffsets: number[];
    set ring(char: string) { this._ringRotationOffset = char.charCodeAt(0) - 'A'.charCodeAt(0); }
    set rotation(char: string) { this._rotationOffset = -(char.charCodeAt(0) - 'A'.charCodeAt(0)); }
    constructor(offsetTableStr: string, ...turnOverChars: string[]) {
        super(offsetTableStr);
        this._turnOverOffsets = turnOverChars.map(turnOverChar => turnOverChar.charCodeAt(0) - 'A'.charCodeAt(0));
    }
    isTurnOver(n: number) {
        return this._turnOverOffsets.some(turnOverOffset => Mod26.isCongruent(Mod26.add(turnOverOffset, this._rotationOffset), n));
    }
    rotate() {
        --this._rotationOffset;
        return this.isTurnOver(-1);
    }
    override passInward(n: number) {
        return Mod26.add(n, this._offsetTable[Mod26.sub(n, this._ringRotationOffset + this._rotationOffset)]);
    }
    override passOutward(n: number) {
        return Mod26.add(n, this._reverseOffsetTable[Mod26.sub(n, this._ringRotationOffset + this._rotationOffset)]);
    }
}

class Reflector extends AbstractRotor {
}

abstract class AbstractEnigma {
    protected _plugBoard: PlugBoard;
    protected _rotors: Rotor[];
    protected _reflector: Reflector;
    get plugBoard() { return this._plugBoard; }
    get rotors() { return this._rotors; }
    get reflector() { return this._reflector; }
    constructor(plugBoard: PlugBoard, rotors: Rotor[], reflector: Reflector, ringSetting: string, rotationSetting: string) {
        this._plugBoard = plugBoard;
        this._rotors = rotors;
        this._reflector = reflector;
        rotors.forEach((rotor, i) => rotor.ring = ringSetting.charAt(i));
        rotors.forEach((rotor, i) => rotor.rotation = rotationSetting.charAt(i));
    }
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
        const reflected = this.reflector.passInward(rotorsIn[rotorsIn.length - 1]);
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
    decrypt(str: string) {
        return this.encrypt(str);
    }
}

class EnigmaI extends AbstractEnigma {
    static get rotorI() { return new Rotor('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'); }
    static get rotorII() { return new Rotor('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'); }
    static get rotorIII() { return new Rotor('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'); }
    static get rotorIV() { return new Rotor('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'); }
    static get rotorV() { return new Rotor('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'); }
    static get reflectorA() { return new Reflector('EJMZALYXVBWFCRQUONTSPIKHGD'); }
    static get reflectorB() { return new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT'); }
    static get reflectorC() { return new Reflector('FVPJIAOYEDRZXWGCTKUQSBNMHL'); }
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
                    i => String.fromCharCode('A'.charCodeAt(0) + additionalRotor.passOutward(reflector.passInward(additionalRotor.passInward(i))))
                ).join('')
            ),
            ringSetting,
            rotationSetting
        );
    }
}
