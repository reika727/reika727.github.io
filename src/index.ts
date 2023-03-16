'use strict';

import assert from 'assert';
import { Alphabet, EnigmaI, PlugBoard, AbstractEnigma, Rotor, Reflector } from './enigma';

class EnigmaIHandler {
    private static _availableRotors = [
        EnigmaI.rotorI, EnigmaI.rotorII, EnigmaI.rotorIII, EnigmaI.rotorIV, EnigmaI.rotorV
    ];
    private static _availableReflectors = [
        EnigmaI.reflectorA, EnigmaI.reflectorB, EnigmaI.reflectorC
    ];
    private _plugBoardSetting: [string, string][] = [];
    private _rotorIndices = [2, 1, 0];
    private _reflectorIndex = 0;
    private _ringSetting = 'AAA';
    private _rotationSetting = 'AAA';
    private _canvas = document.getElementById('enigma-canvas') as HTMLCanvasElement;
    private _canvasContext = this._canvas.getContext('2d');
    private _textArea = document.getElementById('enigma-input-textarea') as HTMLTextAreaElement;
    private _resultField = document.getElementById('enigma-result-textarea') as HTMLTextAreaElement;
    private _plugBoardInput = document.getElementById('plugboard-input') as HTMLInputElement;
    private _reflectorSelect = document.getElementById('reflector-select') as HTMLSelectElement;
    private _rotorSelects = [
        document.getElementById('rotor2-select') as HTMLSelectElement,
        document.getElementById('rotor1-select') as HTMLSelectElement,
        document.getElementById('rotor0-select') as HTMLSelectElement
    ];
    private _ringConfigInput = document.getElementById('ring-input') as HTMLInputElement;
    private _rotationConfigInput = document.getElementById('rotation-input') as HTMLInputElement;
    constructor() {
        this._reflectorSelect.options[this._reflectorIndex].selected = true;
        this._rotorSelects.forEach((select, i) => select.options[this._rotorIndices[i]].selected = true);
        this._ringConfigInput.value = this._ringSetting;
        this._rotationConfigInput.value = this._rotationSetting;
        this._textArea.addEventListener('input', () => this.redrawEnigmaWithInputText());
        this._plugBoardInput.addEventListener('input', () => this.resetPlugBoard());
        this._reflectorSelect.addEventListener('change', () => this.resetReflector());
        this._rotorSelects.forEach((select, i) => select.addEventListener('change', () => this.resetRotor(i)));
        this._ringConfigInput.addEventListener('input', () => this.resetRings());
        this._rotationConfigInput.addEventListener('input', () => this.resetRotations());
    }
    createEnigma() {
        return new EnigmaI(
            new PlugBoard(Alphabet.capitalLatin, ...this._plugBoardSetting),
            EnigmaIHandler._availableRotors[this._rotorIndices[0]],
            EnigmaIHandler._availableRotors[this._rotorIndices[1]],
            EnigmaIHandler._availableRotors[this._rotorIndices[2]],
            EnigmaIHandler._availableReflectors[this._reflectorIndex],
            this._ringSetting,
            this._rotationSetting
        );
    }
    redrawEnigmaWithInputText() {
        assert(this._canvasContext);
        const input = this._textArea.value;
        const lastCharacter = input[input.length - 1];
        const enigma = this.createEnigma();
        this._resultField.value = [...input].map(c => enigma.alphabet.contains(c) ? enigma.encrypt(c) : c).join('');
        this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
        drawEnigma(this._canvasContext, enigma, enigma.alphabet.contains(lastCharacter) ? lastCharacter : null);
    }
    resetPlugBoard() {
        if (!this._plugBoardInput.validity.valid) {
            return;
        }
        const input = this._plugBoardInput.value;
        this._plugBoardSetting = input == '' ? [] : input.split(' ').map(s => [s[0].toUpperCase(), s[1].toUpperCase()]);
        this.redrawEnigmaWithInputText();
    }
    resetReflector() {
        this._reflectorIndex = Number(this._reflectorSelect.value);
        this.redrawEnigmaWithInputText();
    }
    resetRotor(n: number) {
        this._rotorIndices[n] = Number(this._rotorSelects[n].value);
        this.redrawEnigmaWithInputText();
    }
    resetRings() {
        if (!this._ringConfigInput.validity.valid) {
            return;
        }
        this._ringSetting = this._ringConfigInput.value.toUpperCase().split('').reverse().join('');
        this.redrawEnigmaWithInputText();
    }
    resetRotations() {
        if (!this._rotationConfigInput.validity.valid) {
            return;
        }
        this._rotationSetting = this._rotationConfigInput.value.toUpperCase().split('').reverse().join('');
        this.redrawEnigmaWithInputText();
    }
    resizeAll() {
        resizeCanvas(this._canvas, 3, Alphabet.capitalLatin.size);
        (document.getElementById('enigmaI') as HTMLDivElement).style.width = this._canvas.style.width;
    }
}

class IrohaEnigmaHandler {
    private static iroha = new Alphabet('いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせすん');
    private _canvas = document.getElementById('iroha-enigma-canvas') as HTMLCanvasElement;
    private _canvasContext = this._canvas.getContext('2d');
    private _textArea = document.getElementById('iroha-enigma-input-textarea') as HTMLTextAreaElement;
    private _resultField = document.getElementById('iroha-enigma-result-textarea') as HTMLTextAreaElement;
    constructor() {
        this._textArea.addEventListener('input', () => this.redrawEnigmaWithInputText());
    }
    createEnigma() {
        return new class extends AbstractEnigma {} (
            new PlugBoard(
                IrohaEnigmaHandler.iroha,
                /* あめつちの詞、二回目の「え」は「ん」で置き換えた */
                ['あ', 'め'], ['つ', 'ち'], ['ほ', 'し'], ['そ', 'ら'], ['や', 'ま'], ['か', 'は'], ['み', 'ね'], ['た', 'に'],
                ['く', 'も'], ['き', 'り'], ['む', 'ろ'], ['こ', 'け'], ['ひ', 'と'], ['い', 'ぬ'], ['う', 'へ'], ['す', 'ゑ'],
                ['ゆ', 'わ'], ['さ', 'る'], ['お', 'ふ'], ['せ', 'よ'], ['え', 'の'], ['ん', 'を'], ['な', 'れ'], ['ゐ', 'て']
            ),
            [
                /* 大為爾の歌、末尾に「ん」を追加した */
                new Rotor(IrohaEnigmaHandler.iroha, 'たゐにいてなつむわれをそきみめすとあさりおひゆくやましろのうちゑへるこらもはほせよえふねかけぬん', 'い'),
                /* 鳥啼歌 */
                new Rotor(IrohaEnigmaHandler.iroha, 'とりなくこゑすゆめさませみよあけわたるひんかしをそらいろはえておきつへにほふねむれゐぬもやのうち', 'ろ'),
                /* マジック・ザ・ギャザリング "Now I Know My ABC's" の日本語版フレーバーテキスト、「ゐ」「ゑ」を追加した */
                new Rotor(IrohaEnigmaHandler.iroha, 'れきせんへるすはやいくろこおになまけとわあふたちをひらりかみしものぬえむねほめてよつゆさそうゐゑ', 'は')
            ],
            /* 自動生成したものなので特に元ネタはない */
            new Reflector(IrohaEnigmaHandler.iroha, 'わせもねよとへるめえちないまほきおのんにをしゆてくそれゐゑかさすみぬうひけたむりこらやあはろふつ'),
            'やまと',
            'ことは'
        );
    }
    redrawEnigmaWithInputText() {
        assert(this._canvasContext);
        const input = this._textArea.value;
        const lastCharacter = input[input.length - 1];
        const enigma = this.createEnigma();
        this._resultField.value = [...input].map(c => enigma.alphabet.contains(c) ? enigma.encrypt(c) : c).join('');
        this._canvasContext.clearRect(0, 0, this._canvas.width, this._canvas.height);
        drawEnigma(this._canvasContext, enigma, enigma.alphabet.contains(lastCharacter) ? lastCharacter : null);
    }
    resizeAll() {
        resizeCanvas(this._canvas, 3, IrohaEnigmaHandler.iroha.size);
        (document.getElementById('iroha-enigma') as HTMLDivElement).style.width = this._canvas.style.width;
    }
}

const eh1 = new EnigmaIHandler;

const ieh = new IrohaEnigmaHandler;

window.onload = window.onresize = () => {
    eh1.resizeAll();
    eh1.redrawEnigmaWithInputText();
    ieh.resizeAll();
    ieh.redrawEnigmaWithInputText();
};

class DrawingProperty {
    private _rotorsCount: number;
    private _alphabetSize: number;
    private _rotorRadius: number;
    private _rotorInternalRadius: number;
    private _holeRadius: number;
    private _boundingSquareSide: number;
    private _padding: number;
    private _plugBoardSize: {width: number, height: number};
    private _canvasSize: {width: number, height: number};
    get canvasWidthRatioToHeight() {
        return this._canvasSize.width / this._canvasSize.height;
    }
    get plugBoardSize() {
        return this._plugBoardSize;
    }
    get holeRadius() {
        return this._holeRadius;
    }
    get smallHoleRadius() {
        return this.holeRadius * (this._rotorInternalRadius / this._rotorRadius);
    }
    get absoluteReflectorCenterCoord() {
        return {
            x: this._boundingSquareSide / 2 + this._padding,
            y: this._boundingSquareSide * (3 / 2) + this._padding * 2
        };
    }
    get pathWidth() {
        return 3; /* HACK: この値に深い意味はない */
    }
    constructor(canvas: HTMLCanvasElement, rotorsCount: number, alphabetSize: number) {
        this._rotorsCount = rotorsCount;
        this._alphabetSize = alphabetSize;
        const holeRadiusRatioToRotorRadius = Math.sin(2 * Math.PI / this._alphabetSize / 2) * 0.9; /* HACK: 0.9 という倍率にも深い意味はない */
        const boundingSquareSideRatioToRotorRadius = 2 * (1 + holeRadiusRatioToRotorRadius);
        const paddingRatioToRotorRadius = holeRadiusRatioToRotorRadius * 2; /* HACK: とりあえず穴の直径と一緒にしておく */
        const canvasSizeRatioToRotorRadius = {
            width: this._rotorsCount * boundingSquareSideRatioToRotorRadius + (this._rotorsCount + 1) * paddingRatioToRotorRadius,
            height: 2 * boundingSquareSideRatioToRotorRadius + 3 * paddingRatioToRotorRadius
        };
        this._rotorRadius = Math.min(
            canvas.width / canvasSizeRatioToRotorRadius.width,
            canvas.height / canvasSizeRatioToRotorRadius.height
        );
        this._rotorInternalRadius = this._rotorRadius * 0.7; /* HACK: 0.7 という倍率にも深い意味はない */
        this._holeRadius = this._rotorRadius * holeRadiusRatioToRotorRadius;
        this._boundingSquareSide = this._rotorRadius * boundingSquareSideRatioToRotorRadius;
        this._padding = this._rotorRadius * paddingRatioToRotorRadius;
        this._plugBoardSize = {
            width: (this._rotorsCount - 1) * this._boundingSquareSide + (this._rotorsCount - 2) * this._padding,
            height: this._boundingSquareSide
        };
        this._canvasSize = {
            width: canvasSizeRatioToRotorRadius.width * this._rotorRadius,
            height: canvasSizeRatioToRotorRadius.height * this._rotorRadius,
        };
    }
    getAbsolutePlugCoord(n: number, inOut: 'in' | 'out') {
        return {
            x: this._boundingSquareSide + 2 * this._padding + this._plugBoardSize.width / 2 + this._plugBoardSize.width * (n / (this._alphabetSize - 1) - 0.5),
            y: this._boundingSquareSide + 2 * this._padding + this._plugBoardSize.height / 2 + (inOut == 'in' ? 1 : -1) * this._plugBoardSize.height / 2
        }
    }
    getAbsoluteRotorCenterCoords(n: number) {
        return {
            x: ((this._rotorsCount - 1) - n) * this._boundingSquareSide + ((this._rotorsCount - 1) - n + 1) * this._padding + this.holeRadius + this._rotorRadius,
            y: this._boundingSquareSide / 2 + this._padding
        }
    }
    getAbsoluteHoleCoord(n: number, c: {x: number, y: number}, inOut: 'in' | 'out') {
        return {
            x: (inOut == 'in' ? this._rotorInternalRadius : this._rotorRadius) * Math.cos(2 * Math.PI / this._alphabetSize * n - Math.PI / 2) + c.x,
            y: (inOut == 'in' ? this._rotorInternalRadius : this._rotorRadius) * Math.sin(2 * Math.PI / this._alphabetSize * n - Math.PI / 2) + c.y
        }
    }
}

function resizeCanvas(canvas: HTMLCanvasElement, rotorsCount: number, alphabetSize: number) {
    /* 幅が最大で画面の 95%、かつ高さが最大で画面の 2/3 を満たしつつなるべく大きくする */
    const maxWidth = document.documentElement.clientWidth * .95;
    const maxHeight = document.documentElement.clientHeight * (2 / 3);
    const dp = new DrawingProperty(canvas, rotorsCount, alphabetSize);
    [canvas.width, canvas.height] =
        maxWidth / dp.canvasWidthRatioToHeight <= maxHeight
            ? [maxWidth, maxWidth / dp.canvasWidthRatioToHeight]
            : [maxHeight * dp.canvasWidthRatioToHeight, maxHeight];
    /* 高解像度ディスプレイ対応 */
    canvas.width *= window.devicePixelRatio;
    canvas.height *= window.devicePixelRatio;
    canvas.style.width = `${canvas.width / window.devicePixelRatio}px`;
    canvas.style.height = `${canvas.height / window.devicePixelRatio}px`;
}

function drawEnigma(context: CanvasRenderingContext2D, enigma: AbstractEnigma, pathChar: string | null = null) {
    const drawLine = (from: {x: number, y: number}, to: {x: number, y: number}, strokeStyle: typeof context.strokeStyle, lineWidth: number) => {
        context.save();
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
        context.stroke();
        context.restore();
    };
    const drawCircle = (center: {x: number, y: number}, radius: number, color: string, style: 'stroke' | 'fill') => {
        context.save();
        context.beginPath();
        context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        if (style == 'stroke') {
            context.strokeStyle = color;
            context.stroke();
        } else {
            context.fillStyle = color;
            context.fill();
        }
        context.restore();
    };
    const createGradient = (from: {x: number, y: number}, to: {x: number, y: number}, lineNumber: number) => {
        const linesCount = 4 * enigma.rotors.length + 5;
        const lineargradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
        lineargradient.addColorStop(0, `hsl(${lineNumber / linesCount}turn, 100%, 50%)`);
        lineargradient.addColorStop(1, `hsl(${(lineNumber + 1) / linesCount}turn, 100%, 50%)`);
        return lineargradient;
    };
    const dp = new DrawingProperty(context.canvas, enigma.rotors.length, enigma.alphabet.size);
    const path = pathChar ? enigma.getPath(pathChar) : null;
    /* draw plugboard */
    context.font = `bold ${dp.plugBoardSize.width / enigma.alphabet.size}px 'メイリオ'`;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    enigma.plugBoard.exchangeTable.forEach((plugToRotor, charIndex) => {
        const from = dp.getAbsolutePlugCoord(charIndex, 'in'), to = dp.getAbsolutePlugCoord(plugToRotor, 'out');
        /* draw characters */
        context.fillText(enigma.alphabet.at(charIndex), from.x, from.y);
        /* draw exchange cables */
        if (plugToRotor == path?.plugToRotor) {
            drawLine(from, to, createGradient(from, to, 0), dp.pathWidth) /* 0 */
        } else if (plugToRotor == path?.holesToPrev[path.holesToPrev.length - 1]) {
            drawLine(from, to, createGradient(to, from, 4 * enigma.rotors.length + 4), dp.pathWidth) /* 4 * |rotors| + 4 */
        } else if (plugToRotor == charIndex) {
            drawLine(from, to, 'lightgray', 1);
        } else {
            drawLine(from, to, 'black', 1);
        }
        /* to next rotor */
        const nextRotorCoord = dp.getAbsoluteHoleCoord(plugToRotor, dp.getAbsoluteRotorCenterCoords(0), 'out');
        if (plugToRotor == path?.plugToRotor) {
            drawLine(to, nextRotorCoord, createGradient(to, nextRotorCoord, 1), dp.pathWidth); /* 1 */
        } else if (plugToRotor == path?.holesToPrev[path.holesToPrev.length - 1]) {
            drawLine(to, nextRotorCoord, createGradient(nextRotorCoord, to, 4 * enigma.rotors.length + 3), dp.pathWidth); /* 4 * |rotors| + 3 */
        } else {
            drawLine(to, nextRotorCoord, 'lightgray', 1);
        }
    });
    /* draw rotors */
    enigma.rotors.forEach((rotor, i) => {
        for (let j = 0; j < enigma.alphabet.size; ++j) {
            const holeFrom = dp.getAbsoluteHoleCoord(j, dp.getAbsoluteRotorCenterCoords(i), 'out');
            const holeTo = dp.getAbsoluteHoleCoord(rotor.passInward(j), dp.getAbsoluteRotorCenterCoords(i), 'in');
            /* draw hole */
            if (rotor.isTurnOver(j)) {
                drawCircle(holeFrom, dp.holeRadius, 'lightgray', 'fill');
            } else {
                drawCircle(holeFrom, dp.holeRadius, 'black', 'stroke');
            }
            /* draw small hole */
            drawCircle(holeTo, dp.smallHoleRadius, 'black', 'stroke');
            /* draw connecting line */
            if (rotor.passInward(j) == path?.holesToNext[i]) {
                drawLine(holeFrom, holeTo, createGradient(holeFrom, holeTo, 2 * i + 2), dp.pathWidth); /* 2, 4, ... , 2 * |rotors| */
            } else if (j == path?.holesToPrev[enigma.rotors.length - 1 - i]) {
                drawLine(holeFrom, holeTo, createGradient(holeTo, holeFrom, 4 * enigma.rotors.length - 2 * i + 2), dp.pathWidth); /* 4 * |rotors| + 2, 4 * |rotors|, ... , 2 * |rotors| + 4 */
            } else {
                drawLine(holeFrom, holeTo, 'black', 1);
            }
            /* to next rotor */
            const nextHoleCoord = dp.getAbsoluteHoleCoord(
                rotor.passInward(j),
                i == enigma.rotors.length - 1 ? dp.absoluteReflectorCenterCoord : dp.getAbsoluteRotorCenterCoords(i + 1),
                'out'
            );
            if (rotor.passInward(j) == path?.holesToNext[i]) {
                drawLine(holeTo, nextHoleCoord, createGradient(holeTo, nextHoleCoord, 2 * i + 3), dp.pathWidth); /* 3, 5, ... , |rotors| * 2 + 1 */
            } else if (j == path?.holesToPrev[enigma.rotors.length - 1 - i]) {
                drawLine(holeTo, nextHoleCoord, createGradient(nextHoleCoord, holeTo, 4 * enigma.rotors.length - 2 * i + 1), dp.pathWidth); /* 4 * |rotors| + 1, 4 * |rotors| - 1, ... , 2 * |rotors| + 3 */
            } else {
                drawLine(holeTo, nextHoleCoord, 'lightgray', 1);
            }
        }
    });
    /* draw reflector */
    for (let i = 0; i < enigma.alphabet.size; ++i) {
        const holeFrom = dp.getAbsoluteHoleCoord(i, dp.absoluteReflectorCenterCoord, 'out');
        const holeTo = dp.getAbsoluteHoleCoord(enigma.reflector.pass(i), dp.absoluteReflectorCenterCoord, 'out');
        /* draw hole */
        drawCircle(holeFrom, dp.holeRadius, 'black', 'stroke');
        /* draw connecting line */
        if (enigma.reflector.pass(i) < i) {
            continue; /* 二重に描画すると若干太くなってしまう */
        }
        if (enigma.reflector.pass(i) == path?.reflectorHoleToPrev) {
            drawLine(holeFrom, holeTo, createGradient(holeFrom, holeTo, 2 * enigma.rotors.length + 2), dp.pathWidth); /* 2 * |rotors| + 2 */
        } else if (i == path?.reflectorHoleToPrev) {
            drawLine(holeTo, holeFrom, createGradient(holeTo, holeFrom, 2 * enigma.rotors.length + 2), dp.pathWidth); /* 2 * |rotors| + 2 */
        } else {
            drawLine(holeFrom, holeTo, 'black', 1);
        }
    }
}
