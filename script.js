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

class AbstructEnigma {
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

class EnigmaI extends AbstructEnigma {
    static get WHEEL_I() { return new Wheel('EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q') }
    static get WHEEL_II() { return new Wheel('AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E') }
    static get WHEEL_III() { return new Wheel('BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V') }
    static get WHEEL_IV() { return new Wheel('ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J') }
    static get WHEEL_V() { return new Wheel('VZBRGITYUPSDNHLXAWMJQOFECK', 'Z') }
    static get REFLECTOR_A() { return new Reflector('EJMZALYXVBWFCRQUONTSPIKHGD') }
    static get REFLECTOR_B() { return new Reflector('YRUHQSLDPXNGOKMIEBFZCWVJAT') }
    static get REFLECTOR_C() { return new Reflector('FVPJIAOYEDRZXWGCTKUQSBNMHL') }
    constructor(plugBoard, wheel1, wheel2, wheel3, reflector, ringSetting, rotationSetting) {
        super(plugBoard, [wheel1, wheel2, wheel3], reflector, ringSetting, rotationSetting);
    }
}

class M4 extends AbstructEnigma {
    static get WHEEL_I() { return EnigmaI.WHEEL_I }
    static get WHEEL_II() { return EnigmaI.WHEEL_II }
    static get WHEEL_III() { return EnigmaI.WHEEL_III }
    static get WHEEL_IV() { return EnigmaI.WHEEL_IV }
    static get WHEEL_V() { return EnigmaI.WHEEL_V }
    static get WHEEL_VI() { return new Wheel('JPGVOUMFYQBENHZRDKASXLICTW', 'Z', 'M') }
    static get WHEEL_VII() { return new Wheel('NZJHGRCXMYSWBOUFAIVLPEKQDT', 'Z', 'M') }
    static get WHEEL_VIII() { return new Wheel('FKQHTLXOCBJSPDZRAMEWNIUYGV', 'Z', 'M') }
    static get WHEEL_B() { return new Wheel('LEYJVCNIXWPBQMDRTAKZGFUHOS') }
    static get WHEEL_G() { return new Wheel('FSOKANUERHMBTIYCWLQPZXVGJD') }
    static get REFLECTOR_B() { return new Reflector('ENKQAUYWJICOPBLMDXZVFTHRGS') }
    static get REFLECTOR_C() { return new Reflector('RDOBJNTKVEHMLFCWZAXGYIPSUQ') }
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
        M4.WHEEL_I,
        M4.WHEEL_IV,
        M4.WHEEL_II,
        M4.WHEEL_B,
        M4.REFLECTOR_B,
        'VAAA',
        'ANJV'
    ).decrypt(
        'NCZWVUSXPNYMINHZXMQXSFWXWLKJAHSHNMCOCCAKUQPMKCSMHKSEINJUSBLKIOSXCKUBHMLLXCSJUSRRDVKOHULXWCCBGVLIYXEOAHXRHKKFVDREWEZLXOBAFGYUJQUKGRTVUKAMEURBVEKSUHHVOYHABCJWMAKLFKLMYFVNRIZRVVRTKOFDANJMOLBGFFLEOPRGTFLVRHOWOPBEKVWMUQFMPWPARMFHAGKXIIBG'
    )
);

console.log(
    new M4(
        new PlugBoard(['A', 'T'], ['C', 'L'], ['D', 'H'], ['E', 'P'], ['F', 'G'], ['I', 'O'], ['J', 'N'], ['K', 'Q'], ['M', 'U'], ['R', 'X']),
        M4.WHEEL_I,
        M4.WHEEL_IV,
        M4.WHEEL_II,
        M4.WHEEL_B,
        M4.REFLECTOR_B,
        'VNAA',
        'FSCM'
    ).decrypt(
        'TMKFNWZXFFIIYXUTIHWMDHXIFZEQVKDVMQSWBQNDYOZFTIWMJHXHYRPACZUGRREMVPANWXGTKTHNRLVHKZPGMNMVSECVCKHOINPLHHPVPXKMBHOKCCPDPEVXVVHOZZQBIYIEOUSEZNHJKWHYDAGTXDJDJKJPKCSDSUZTQCXJDVLPAMGQKKSHPHVKSVPCBUWZFIZPFUUP'
    )
);

console.log(
    new M4(
        new PlugBoard(['B', 'Q'], ['C', 'R'], ['D', 'I'], ['E', 'J'], ['K', 'W'], ['M', 'T'], ['O', 'S'], ['P', 'X'], ['U', 'Z'], ['G', 'H']),
        M4.WHEEL_III,
        M4.WHEEL_I,
        M4.WHEEL_VI,
        M4.WHEEL_B,
        M4.REFLECTOR_B,
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
