'use strict';

import assert from 'assert';
import { Alphabet, EnigmaI, PlugBoard, AbstractEnigma } from './enigma';

const enigma = new EnigmaI(
    new PlugBoard(Alphabet.capitalLatin, ['A', 'M'], ['F', 'I'], ['N', 'V'], ['P', 'S'], ['T', 'U'], ['W', 'Z']),
    EnigmaI.rotorI,
    EnigmaI.rotorII,
    EnigmaI.rotorIII,
    EnigmaI.reflectorA,
    'AAA',
    'AAA'
);

const enigmaCanvas = document.getElementById('enigmaCanvas') as HTMLCanvasElement;

window.onload = window.onresize = () => { resizeCanvas(enigmaCanvas, enigma); };

setInterval(() => {
    const enigmaContext = enigmaCanvas.getContext('2d');
    assert(enigmaContext);
    enigmaContext.clearRect(0, 0, enigmaCanvas.width, enigmaCanvas.height);
    const char = enigma.alphabet.at(Math.floor(Math.random() * enigma.alphabet.size));
    enigma.encrypt(char);
    drawEnigma(enigmaContext, enigma, char);
}, 300);

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
    constructor(canvas: HTMLCanvasElement, enigma: AbstractEnigma) {
        this._rotorsCount = enigma.rotors.length;
        this._alphabetSize = enigma.alphabet.size;
        const holeRadiusRatioToRotorRadius = Math.sin(2 * Math.PI / this._alphabetSize / 2) * 0.9; /* HACK: 0.9 という倍率にも深い意味はない */
        const boundingSquareSideRatioToRotorRadius = 2 * (1 + holeRadiusRatioToRotorRadius);
        const paddingRatioToRotorRadius = holeRadiusRatioToRotorRadius; /* HACK: とりあえず穴の半径と一緒にしておく */
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
            width: (enigma.rotors.length - 1) * this._boundingSquareSide + (enigma.rotors.length - 2) * this._padding,
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

function resizeCanvas(canvas: HTMLCanvasElement, enigma: AbstractEnigma) {
    /* 幅が最大で画面の 95%、かつ高さが最大で画面の 2/3 を満たしつつなるべく大きくする */
    const maxWidth = document.documentElement.clientWidth * .95;
    const maxHeight = document.documentElement.clientHeight * (2 / 3);
    const dp = new DrawingProperty(canvas, enigma);
    [canvas.width, canvas.height] =
        maxWidth / dp.canvasWidthRatioToHeight <= maxHeight
            ? [maxWidth, maxWidth / dp.canvasWidthRatioToHeight]
            : [maxHeight * dp.canvasWidthRatioToHeight, maxHeight];
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
    const dp = new DrawingProperty(context.canvas, enigma);
    const path = pathChar ? enigma.getPath(pathChar) : null;
    /* draw plugboard */
    context.textAlign = 'center';
    context.textBaseline = 'middle';
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
