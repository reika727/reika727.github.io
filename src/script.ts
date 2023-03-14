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

/* ロータの基準円半径に対する穴の半径の比 */
const holeRadiusRatioToRotorRadius = Math.sin(2 * Math.PI / enigma.alphabet.size / 2) * 0.9;

/* ロータの基準円半径に対するバウンディングボックスの幅の比 */
const boundingSquareSideRatioToRotorRadius = 2 * (1 + holeRadiusRatioToRotorRadius);

/* ロータの基準円半径に対するパディングの比 */
const paddingRatioToRotorRadius = Math.sin(2 * Math.PI / enigma.alphabet.size / 2) * 0.9;

/* ロータの基準円半径に対するキャンバスの幅の比 */
const canvasWidthRatioToRotorRadius = enigma.rotors.length * boundingSquareSideRatioToRotorRadius + (enigma.rotors.length + 1) * paddingRatioToRotorRadius;

/* ロータの基準円半径に対するキャンバスの高さの比 */
const canvasHeightRatioToRotorRadius = 2 * boundingSquareSideRatioToRotorRadius + 3 * paddingRatioToRotorRadius;

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

window.onload = window.onresize = () => {
    const canvasWidthRatioToHeight = canvasWidthRatioToRotorRadius / canvasHeightRatioToRotorRadius;
    /* 幅が最大で画面の 95%、かつ高さが最大で画面の 2/3 を満たしつつなるべく大きくする */
    const maxWidth = document.documentElement.clientWidth * .95;
    const maxHeight = document.documentElement.clientHeight * (2 / 3);
    [canvas.width, canvas.height] =
        maxWidth / canvasWidthRatioToHeight <= maxHeight
            ? [maxWidth, maxWidth / canvasWidthRatioToHeight]
            : [maxHeight * canvasWidthRatioToHeight, maxHeight];
};

setInterval(() => {
    const char = enigma.alphabet.at(Math.floor(Math.random() * enigma.alphabet.size));
    enigma.encrypt(char);
    drawEnigma(canvas, enigma, char);
}, 300);

function getDrawingProperty(canvas: HTMLCanvasElement) {
    const rotorRadius = canvas.width / canvasWidthRatioToRotorRadius;
    const rotorInternalRadius = rotorRadius * 0.7; /* HACK: 0.7 という倍率に深い意味はない */
    const holeRadius = rotorRadius * holeRadiusRatioToRotorRadius;
    const boundingSquareSide = rotorRadius * boundingSquareSideRatioToRotorRadius;
    const padding = rotorRadius * paddingRatioToRotorRadius;
    const plugBoardWidth = (enigma.rotors.length - 1) * boundingSquareSide + (enigma.rotors.length - 2) * padding;
    const plugBoardHeight = boundingSquareSide;
    return {
        holeRadius: holeRadius,
        smallHoleRadius: holeRadius * (rotorInternalRadius / rotorRadius),
        absoluteReflectorCenterCoord: {
            x: boundingSquareSide / 2 + padding,
            y: boundingSquareSide * (3 / 2) + padding * 2
        },
        pathWidth: 3, /* HACK: これも深い意味はない */
        getAbsolutePlugCoord: (n: number, inOut: 'in' | 'out') => ({
            x: boundingSquareSide + 2 * padding + plugBoardWidth / 2 + plugBoardWidth * (n / (enigma.alphabet.size - 1) - 0.5),
            y: boundingSquareSide + 2 * padding + plugBoardHeight / 2 + (inOut == 'in' ? 1 : -1) * plugBoardHeight / 2
        }),
        getAbsoluteRotorCenterCoords: (n: number) => ({
            x: ((enigma.rotors.length - 1) - n) * boundingSquareSide + ((enigma.rotors.length - 1) - n + 1) * padding + holeRadius + rotorRadius,
            y: boundingSquareSide / 2 + padding
        }),
        getAbsoluteHoleCoord: (n: number, c: {x: number, y: number}, inOut: 'in' | 'out') => ({
            x: (inOut == 'in' ? rotorInternalRadius : rotorRadius) * Math.cos(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.x,
            y: (inOut == 'in' ? rotorInternalRadius : rotorRadius) * Math.sin(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.y
        }),
        createGradient: (c0: {x: number, y: number}, c1: {x: number, y: number}, lineNumber: number) => {
            const context = canvas.getContext('2d');
            assert(context);
            const linesCount = 4 * enigma.rotors.length + 5;
            const lineargradient = context.createLinearGradient(c0.x, c0.y, c1.x, c1.y);
            lineargradient.addColorStop(0, `hsl(${lineNumber / linesCount}turn, 100%, 50%)`);
            lineargradient.addColorStop(1, `hsl(${(lineNumber + 1) / linesCount}turn, 100%, 50%)`);
            return lineargradient;
        }
    };
};

function drawEnigma(canvas: HTMLCanvasElement, enigma: AbstractEnigma, pathChar: string | null = null) {
    const context = canvas.getContext('2d');
    assert(context);
    const path = pathChar ? enigma.getPath(pathChar) : null;
    const dp = getDrawingProperty(canvas);
    context.clearRect(0, 0, canvas.width, canvas.height);
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
            exchangee == path?.exchangedIn ? [dp.createGradient(from, to, 0), dp.pathWidth] /* 0 */
            : exchangee == path?.rotorsOut[path.rotorsOut.length - 1] ? [dp.createGradient(to, from, 4 * enigma.rotors.length + 4), dp.pathWidth] /* 4 * |rotors| + 4 */
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
            exchangee == path?.exchangedIn ? [dp.createGradient(to, nextRotorCoord, 1), dp.pathWidth] /* 1 */
            : exchangee == path?.rotorsOut[path.rotorsOut.length - 1] ? [dp.createGradient(nextRotorCoord, to, 4 * enigma.rotors.length + 3), dp.pathWidth] /* 4 * |rotors| + 3 */
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
                rotor.passInward(j) == path?.rotorsIn[i] ? [dp.createGradient(holeFrom, holeTo, 2 * i + 2), dp.pathWidth] /* 2, 4, ... , 2 * |rotors| */
                : j == path?.rotorsOut[enigma.rotors.length - 1 - i] ? [dp.createGradient(holeTo, holeFrom, 4 * enigma.rotors.length - 2 * i + 2), dp.pathWidth] /* 4 * |rotors| + 2, 4 * |rotors|, ... , 2 * |rotors| + 4 */
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
                rotor.passInward(j) == path?.rotorsIn[i] ? [dp.createGradient(holeTo, nextHoleCoord, 2 * i + 3), dp.pathWidth] /* 3, 5, ... , |rotors| * 2 + 1 */
                : j == path?.rotorsOut[enigma.rotors.length - 1 - i] ? [dp.createGradient(nextHoleCoord, holeTo, 4 * enigma.rotors.length - 2 * i + 1), dp.pathWidth] /* 4 * |rotors| + 1, 4 * |rotors| - 1, ... , 2 * |rotors| + 3 */
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
            enigma.reflector.pass(i) == path?.reflected ? [dp.createGradient(holeFrom, holeTo, 2 * enigma.rotors.length + 2), dp.pathWidth] /* 2 * |rotors| + 2 */
            : i == path?.reflected ? [dp.createGradient(holeTo, holeFrom, 2 * enigma.rotors.length + 2), dp.pathWidth] /* 2 * |rotors| + 2 */
            : ['black', 1];
        context.stroke();
        context.lineWidth = 1;
        drawns.push(enigma.reflector.pass(i));
    }
}
