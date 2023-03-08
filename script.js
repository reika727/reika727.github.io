class Mod26 {
    static mod(n) {
        return (n % 26 + 26) % 26;
    }
    static add(n, m) {
        return Mod26.mod(n + m);
    }
    static sub(n, m) {
        return Mod26.mod(n - m);
    }
    static isCongruent(n, m) {
        return Mod26.sub(n, m) == 0;
    }
}

class PlugBoard {
    constructor(...pairs) {
        this.exchangeTable = [...Array(26).keys()];
        pairs.forEach(
            ([c1, c2]) => {
                const idx1 = c1.charCodeAt() - 'A'.charCodeAt();
                const idx2 = c2.charCodeAt() - 'A'.charCodeAt();
                [this.exchangeTable[idx1], this.exchangeTable[idx2]] = [this.exchangeTable[idx2], this.exchangeTable[idx1]];
            }
        );
    }
    pass(n) {
        return this.exchangeTable[n];
    }
}

class AbstractWheel {
    constructor(offsetTableStr) {
        this.offsetTable = [...offsetTableStr].map((v, i) =>  v.charCodeAt() - ('A'.charCodeAt() + i));
        this.reverseOffsetTable = Array(26);
        for (let i = 0; i < 26; ++i) {
            this.reverseOffsetTable[Mod26.add(i, this.offsetTable[i])] = -this.offsetTable[i];
        }
    }
    passInward(n) {
        return Mod26.add(n, this.offsetTable[n]);
    }
    passOutward(n) {
        return Mod26.add(n, this.reverseOffsetTable[n]);
    }
}

class Wheel extends AbstractWheel {
    constructor(offsetTableStr, ...turnOverChars) {
        super(offsetTableStr);
        this.rotationOffset = 0;
        this.turnOverOffsets = turnOverChars.map(v => v.charCodeAt() - 'A'.charCodeAt());
    }
    rotateRing(inc) {
        this.rotationOffset += inc;
    }
    rotate(inc = 1) {
        this.rotationOffset -= inc;
        this.turnOverOffsets = this.turnOverOffsets.map(v => v - inc);
        return this.turnOverOffsets.some(v => Mod26.isCongruent(v, -1));
    }
    passInward(n) {
        return Mod26.add(n, this.offsetTable[Mod26.sub(n, this.rotationOffset)]);
    }
    passOutward(n) {
        return Mod26.add(n, this.reverseOffsetTable[Mod26.sub(n, this.rotationOffset)]);
    }
}

class Reflector extends AbstractWheel {
}

class AbstractEnigma {
    constructor(plugBoard, wheels, reflector, ringSetting, rotationSetting) {
        this.plugBoard = plugBoard;
        this.wheels = wheels;
        this.reflector = reflector;
        wheels.forEach((v, i) => v.rotateRing(ringSetting.charCodeAt(i) - 'A'.charCodeAt()));
        wheels.forEach((v, i) => v.rotate(rotationSetting.charCodeAt(i) - 'A'.charCodeAt()));
    }
    encrypt(string) {
        return [...string].map(char => {
            for (const w of this.wheels) {
                if (!w.rotate()) {
                    break;
                }
            }
            return String.fromCharCode('A'.charCodeAt() +
                this.plugBoard.pass(
                    this.wheels.reduceRight(
                        (acc, cur) => cur.passOutward(acc),
                        this.reflector.passOutward(
                            this.wheels.reduce(
                                (acc, cur) => cur.passInward(acc),
                                this.plugBoard.pass(char.charCodeAt() - 'A'.charCodeAt())
                            )
                        )
                    )
                )
            );
        }).join('');
    }
    decrypt(string) {
        return this.encrypt(string);
    }
}

class EnigmaI extends AbstractEnigma {
    static get wheelI() { return new Wheel('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q') }
    static get wheelII() { return new Wheel('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E') }
    static get whellIII() { return new Wheel('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V') }
    static get wheelIV() { return new Wheel('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J') }
    static get wheelV() { return new Wheel('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z') }
    static get reflectorA() { return new Reflector('EJMZALYXVBWFCRQUONTSPIKHGD') }
    static get reflectorB() { return new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT') }
    static get reflectorC() { return new Reflector('FVPJIAOYEDRZXWGCTKUQSBNMHL') }
    constructor(plugBoard, wheel1, wheel2, wheel3, reflector, ringSetting, rotationSetting) {
        super(plugBoard, [wheel1, wheel2, wheel3], reflector, ringSetting, rotationSetting);
    }
}

class M4 extends AbstractEnigma {
    static get wheelI() { return EnigmaI.wheelI }
    static get wheelII() { return EnigmaI.wheelII }
    static get wheelIII() { return EnigmaI.whellIII }
    static get wheelIV() { return EnigmaI.wheelIV }
    static get wheelV() { return EnigmaI.wheelV }
    static get wheelVI() { return new Wheel('JPGVOUMFYQBENHZRDKASXLICTW', 'Z', 'M') }
    static get wheelVII() { return new Wheel('NZJHGRCXMYSWBOUFAIVLPEKQDT', 'Z', 'M') }
    static get wheelVIII() { return new Wheel('FKQHTLXOCBJSPDZRAMEWNIUYGV', 'Z', 'M') }
    static get wheelBeta() { return new Wheel('LEYJVCNIXWPBQMDRTAKZGFUHOS') }
    static get wheelGumma() { return new Wheel('FSOKANUERHMBTIYCWLQPZXVGJD') }
    static get reflectorB() { return new Reflector('ENKQAUYWJICOPBLMDXZVFTHRGS') }
    static get reflectorC() { return new Reflector('RDOBJNTKVEHMLFCWZAXGYIPSUQ') }
    constructor(plugBoard, wheel1, wheel2, wheel3, additionalWheel, reflector, ringSetting, rotationSetting) {
        additionalWheel.rotateRing(ringSetting[3].charCodeAt() - 'A'.charCodeAt());
        additionalWheel.rotate(rotationSetting[3].charCodeAt() - 'A'.charCodeAt());
        super(
            plugBoard,
            [wheel1, wheel2, wheel3],
            new Reflector(
                [...Array(26).keys()].map(
                    i => String.fromCharCode('A'.charCodeAt() + additionalWheel.passOutward(reflector.passInward(additionalWheel.passInward(i))))
                )
            ),
            ringSetting,
            rotationSetting
        );
    }
}

console.log(
    new M4(
        new PlugBoard(['A', 'T'], ['B', 'L'], ['D', 'F'], ['G', 'J'], ['H', 'M'], ['N', 'W'], ['O', 'P'], ['Q', 'Y'], ['R', 'Z'], ['V', 'X']),
        M4.wheelI,
        M4.wheelIV,
        M4.wheelII,
        M4.wheelBeta,
        M4.reflectorB,
        'VAAA',
        'ANJV'
    ).decrypt(
        'NCZWVUSXPNYMINHZXMQXSFWXWLKJAHSHNMCOCCAKUQPMKCSMHKSEINJUSBLKIOSXCKUBHMLLXCSJUSRRDVKOHULXWCCBGVLIYXEOAHXRHKKFVDREWEZLXOBAFGYUJQUKGRTVUKAMEURBVEKSUHHVOYHABCJWMAKLFKLMYFVNRIZRVVRTKOFDANJMOLBGFFLEOPRGTFLVRHOWOPBEKVWMUQFMPWPARMFHAGKXIIBG'
    )
);

console.log(
    new M4(
        new PlugBoard(['A', 'T'], ['C', 'L'], ['D', 'H'], ['E', 'P'], ['F', 'G'], ['I', 'O'], ['J', 'N'], ['K', 'Q'], ['M', 'U'], ['R', 'X']),
        M4.wheelI,
        M4.wheelIV,
        M4.wheelII,
        M4.wheelBeta,
        M4.reflectorB,
        'VNAA',
        'FSCM'
    ).decrypt(
        'TMKFNWZXFFIIYXUTIHWMDHXIFZEQVKDVMQSWBQNDYOZFTIWMJHXHYRPACZUGRREMVPANWXGTKTHNRLVHKZPGMNMVSECVCKHOINPLHHPVPXKMBHOKCCPDPEVXVVHOZZQBIYIEOUSEZNHJKWHYDAGTXDJDJKJPKCSDSUZTQCXJDVLPAMGQKKSHPHVKSVPCBUWZFIZPFUUP'
    )
);

console.log(
    new M4(
        new PlugBoard(['B', 'Q'], ['C', 'R'], ['D', 'I'], ['E', 'J'], ['K', 'W'], ['M', 'T'], ['O', 'S'], ['P', 'X'], ['U', 'Z'], ['G', 'H']),
        M4.wheelIII,
        M4.wheelI,
        M4.wheelVI,
        M4.wheelBeta,
        M4.reflectorB,
        'GTZZ',
        'LHBN'
    ).decrypt(
        'HCEYZTCSOPUPPZDICQRDLWXXFACTTJMBRDVCJJMMZRPYIKHZAWGLYXWTMJPQUEFSZBOTVRLALZXWVXTSLFFFAUDQFBWRRYAPSBOWJMKLDUYUPFUQDOWVHAHCDWAUARSWTKOFVOYFPUFHVZFDGGPOOVGRMBPXXZCANKMONFHXPCKHJZBUMXJWXKAUODXZUCVCXPFT'
    )
);

/*const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');
let phase = 0;
setInterval(() => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(200, 200);
    for (let i = 0; i < 26; ++i) {
        context.fillText(
            String.fromCharCode('A'.charCodeAt() + i),
            100 * Math.cos(2 * Math.PI / 26 * i + phase),
            100 * Math.sin(2 * Math.PI / 26 * i + phase)
        );
    }
    context.translate(300, 0);
    for (let i = 0; i < 26; ++i) {
        context.fillText(
            //String.fromCharCode('A'.charCodeAt() + i),
            WHEEL1.pass(String.fromCharCode('A'.charCodeAt() + i)),
            100 * Math.cos(2 * Math.PI / 26 * i + phase),
            100 * Math.sin(2 * Math.PI / 26 * i + phase)
        );
    }
    context.restore();
    phase += 0.01;
}, 25);*/
