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

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

window.onload = window.onresize = () => {
    /* 幅が最大で画面の 95%、かつ高さが最大で画面の 2/3 を満たしつつなるべく大きくする */
    const maxWidth = document.documentElement.clientWidth * .95;
    const maxHeight = document.documentElement.clientHeight * (2 / 3);
    [canvas.width, canvas.height] =
        maxWidth / DrawingProperty.canvasWidthRatioToHeight <= maxHeight
            ? [maxWidth, maxWidth / DrawingProperty.canvasWidthRatioToHeight]
            : [maxHeight * DrawingProperty.canvasWidthRatioToHeight, maxHeight];
};

setInterval(() => {
    const char = enigma.alphabet.at(Math.floor(Math.random() * enigma.alphabet.size));
    enigma.encrypt(char);
    drawEnigma(canvas, enigma, char);
}, 300);

class DrawingProperty {
    /* ロータの基準円半径に対する穴の半径の比 */
    private static _holeRadiusRatioToRotorRadius = Math.sin(2 * Math.PI / enigma.alphabet.size / 2) * 0.9;
    /* ロータの基準円半径に対するバウンディングボックスの幅の比 */
    private static _boundingSquareSideRatioToRotorRadius = 2 * (1 + this._holeRadiusRatioToRotorRadius);
    /* ロータの基準円半径に対するパディングの比 */
    private static _paddingRatioToRotorRadius = Math.sin(2 * Math.PI / enigma.alphabet.size / 2) * 0.9;
    /* ロータの基準円半径に対するキャンバスの幅の比 */
    private static get _canvasWidthRatioToRotorRadius() {
        return enigma.rotors.length * this._boundingSquareSideRatioToRotorRadius + (enigma.rotors.length + 1) * this._paddingRatioToRotorRadius;
    }
    /* ロータの基準円半径に対するキャンバスの高さの比 */
    private static get _canvasHeightRatioToRotorRadius() {
        return 2 * this._boundingSquareSideRatioToRotorRadius + 3 * this._paddingRatioToRotorRadius;
    }
    static get canvasWidthRatioToHeight() {
        return this._canvasWidthRatioToRotorRadius / this._canvasHeightRatioToRotorRadius;
    }
    private _rotorRadius: number;
    private _rotorInternalRadius: number;
    private _boundingSquareSide: number;
    private _padding: number;
    private _plugBoardWidth: number;
    private _plugBoardHeight: number;
    get holeRadius() {
        return this._rotorRadius * DrawingProperty._holeRadiusRatioToRotorRadius;
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
    constructor(canvas: HTMLCanvasElement) {
        this._rotorRadius = canvas.width / DrawingProperty._canvasWidthRatioToRotorRadius;
        this._rotorInternalRadius = this._rotorRadius * 0.7; /* HACK: 0.7 という倍率にも深い意味はない */
        this._boundingSquareSide = this._rotorRadius * DrawingProperty._boundingSquareSideRatioToRotorRadius;
        this._padding = this._rotorRadius * DrawingProperty._paddingRatioToRotorRadius;
        this._plugBoardWidth = (enigma.rotors.length - 1) * this._boundingSquareSide + (enigma.rotors.length - 2) * this._padding;
        this._plugBoardHeight = this._boundingSquareSide;
    }
    getAbsolutePlugCoord(n: number, inOut: 'in' | 'out') {
        return {
            x: this._boundingSquareSide + 2 * this._padding + this._plugBoardWidth / 2 + this._plugBoardWidth * (n / (enigma.alphabet.size - 1) - 0.5),
            y: this._boundingSquareSide + 2 * this._padding + this._plugBoardHeight / 2 + (inOut == 'in' ? 1 : -1) * this._plugBoardHeight / 2
        }
    }
    getAbsoluteRotorCenterCoords(n: number) {
        return {
            x: ((enigma.rotors.length - 1) - n) * this._boundingSquareSide + ((enigma.rotors.length - 1) - n + 1) * this._padding + this.holeRadius + this._rotorRadius,
            y: this._boundingSquareSide / 2 + this._padding
        }
    }
    getAbsoluteHoleCoord(n: number, c: {x: number, y: number}, inOut: 'in' | 'out') {
        return {
            x: (inOut == 'in' ? this._rotorInternalRadius : this._rotorRadius) * Math.cos(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.x,
            y: (inOut == 'in' ? this._rotorInternalRadius : this._rotorRadius) * Math.sin(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.y
        }
    }
}

function drawEnigma(canvas: HTMLCanvasElement, enigma: AbstractEnigma, pathChar: string | null = null) {
    const context = canvas.getContext('2d');
    assert(context);
    const path = pathChar ? enigma.getPath(pathChar) : null;
    const dp = new DrawingProperty(canvas);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const createGradient = (c0: {x: number, y: number}, c1: {x: number, y: number}, lineNumber: number) => {
        const linesCount = 4 * enigma.rotors.length + 5;
        const lineargradient = context.createLinearGradient(c0.x, c0.y, c1.x, c1.y);
        lineargradient.addColorStop(0, `hsl(${lineNumber / linesCount}turn, 100%, 50%)`);
        lineargradient.addColorStop(1, `hsl(${(lineNumber + 1) / linesCount}turn, 100%, 50%)`);
        return lineargradient;
    };
    /* draw plugboard */
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    enigma.plugBoard.exchangeTable.forEach((exchangee, i) => {
        const from = dp.getAbsolutePlugCoord(i, 'in'), to = dp.getAbsolutePlugCoord(exchangee, 'out');
        /* draw characters */
        context.fillText(enigma.alphabet.at(i), from.x, from.y);
        /* draw exchange cables */
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        [context.strokeStyle, context.lineWidth] =
            exchangee == path?.exchangedIn ? [createGradient(from, to, 0), dp.pathWidth] /* 0 */
            : exchangee == path?.rotorsOut[path.rotorsOut.length - 1] ? [createGradient(to, from, 4 * enigma.rotors.length + 4), dp.pathWidth] /* 4 * |rotors| + 4 */
            : exchangee == i ? ['lightgray', 1]
            : ['black', 1];
        context.stroke();
        context.lineWidth = 1;
        /* to next rotor */
        const nextRotorCoord = dp.getAbsoluteHoleCoord(exchangee, dp.getAbsoluteRotorCenterCoords(0), 'out');
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(nextRotorCoord.x, nextRotorCoord.y);
        [context.strokeStyle, context.lineWidth] =
            exchangee == path?.exchangedIn ? [createGradient(to, nextRotorCoord, 1), dp.pathWidth] /* 1 */
            : exchangee == path?.rotorsOut[path.rotorsOut.length - 1] ? [createGradient(nextRotorCoord, to, 4 * enigma.rotors.length + 3), dp.pathWidth] /* 4 * |rotors| + 3 */
            : ['lightgray', 1];
        context.stroke();
        context.lineWidth = 1;
    });
    /* draw rotors */
    enigma.rotors.forEach((rotor, i) => {
        for (let j = 0; j < enigma.alphabet.size; ++j) {
            const holeFrom = dp.getAbsoluteHoleCoord(j, dp.getAbsoluteRotorCenterCoords(i), 'out');
            const holeTo = dp.getAbsoluteHoleCoord(rotor.passInward(j), dp.getAbsoluteRotorCenterCoords(i), 'in');
            /* draw hole */
            context.beginPath();
            context.arc(holeFrom.x, holeFrom.y, dp.holeRadius, 0, 2 * Math.PI);
            if (rotor.isTurnOver(j)) {
                context.fillStyle = 'lightgray';
                context.fill();
            } else {
                context.strokeStyle = 'black';
                context.stroke();
            }
            /* draw small hole */
            context.beginPath();
            context.arc(holeTo.x, holeTo.y, dp.smallHoleRadius, 0, 2 * Math.PI);
            context.strokeStyle = 'black';
            context.stroke();
            /* draw connecting line */
            context.beginPath();
            context.moveTo(holeFrom.x, holeFrom.y);
            context.lineTo(holeTo.x, holeTo.y);
            [context.strokeStyle, context.lineWidth] =
                rotor.passInward(j) == path?.rotorsIn[i] ? [createGradient(holeFrom, holeTo, 2 * i + 2), dp.pathWidth] /* 2, 4, ... , 2 * |rotors| */
                : j == path?.rotorsOut[enigma.rotors.length - 1 - i] ? [createGradient(holeTo, holeFrom, 4 * enigma.rotors.length - 2 * i + 2), dp.pathWidth] /* 4 * |rotors| + 2, 4 * |rotors|, ... , 2 * |rotors| + 4 */
                : ['black', 1];
            context.stroke();
            context.lineWidth = 1;
            /* to next rotor */
            context.beginPath();
            context.moveTo(holeTo.x, holeTo.y);
            const nextHoleCoord = dp.getAbsoluteHoleCoord(
                rotor.passInward(j),
                i == enigma.rotors.length - 1 ? dp.absoluteReflectorCenterCoord : dp.getAbsoluteRotorCenterCoords(i + 1),
                'out'
            );
            context.lineTo(nextHoleCoord.x, nextHoleCoord.y);
            [context.strokeStyle, context.lineWidth] =
                rotor.passInward(j) == path?.rotorsIn[i] ? [createGradient(holeTo, nextHoleCoord, 2 * i + 3), dp.pathWidth] /* 3, 5, ... , |rotors| * 2 + 1 */
                : j == path?.rotorsOut[enigma.rotors.length - 1 - i] ? [createGradient(nextHoleCoord, holeTo, 4 * enigma.rotors.length - 2 * i + 1), dp.pathWidth] /* 4 * |rotors| + 1, 4 * |rotors| - 1, ... , 2 * |rotors| + 3 */
                : ['lightgray', 1];
            context.stroke();
            context.lineWidth = 1;
        }
    });
    /* draw reflector */
    const drawns = Array<number>();
    for (let i = 0; i < enigma.alphabet.size; ++i) {
        const holeFrom = dp.getAbsoluteHoleCoord(i, dp.absoluteReflectorCenterCoord, 'out');
        const holeTo = dp.getAbsoluteHoleCoord(enigma.reflector.pass(i), dp.absoluteReflectorCenterCoord, 'out');
        /* draw hole */
        context.beginPath();
        context.arc(holeFrom.x, holeFrom.y, dp.holeRadius, 0, 2 * Math.PI);
        context.strokeStyle = 'black';
        context.stroke();
        /* draw connecting line */
        if (drawns.includes(i)) {
            continue;
        }
        context.beginPath();
        context.moveTo(holeFrom.x, holeFrom.y);
        context.lineTo(holeTo.x, holeTo.y);
        [context.strokeStyle, context.lineWidth] =
            enigma.reflector.pass(i) == path?.reflected ? [createGradient(holeFrom, holeTo, 2 * enigma.rotors.length + 2), dp.pathWidth] /* 2 * |rotors| + 2 */
            : i == path?.reflected ? [createGradient(holeTo, holeFrom, 2 * enigma.rotors.length + 2), dp.pathWidth] /* 2 * |rotors| + 2 */
            : ['black', 1];
        context.stroke();
        context.lineWidth = 1;
        drawns.push(enigma.reflector.pass(i));
    }
}
