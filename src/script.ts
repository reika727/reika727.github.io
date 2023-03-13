'use strict';

import assert from 'assert';
import { Alphabet, EnigmaI, PlugBoard } from './enigma';

const enigma = new EnigmaI(
    new PlugBoard(Alphabet.capitalLatin, ['A', 'M'], ['F', 'I'], ['N', 'V'], ['P', 'S'], ['T', 'U'], ['W', 'Z']),
    EnigmaI.rotorI,
    EnigmaI.rotorII,
    EnigmaI.rotorIII,
    EnigmaI.reflectorA,
    'AAA',
    'AAA'
);

const canvasWidthRatioToHeight = (enigma.rotors.length * 5 + 1) / 11;

const linesCount = 4 * enigma.rotors.length + 5;

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

window.onload = window.onresize = () => {
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    if (clientWidth / canvasWidthRatioToHeight <= clientHeight * 2 / 3) {
        canvas.width = clientWidth;
        canvas.height = canvas.width / canvasWidthRatioToHeight;
    } else {
        canvas.height = clientHeight * 2 / 3;
        canvas.width = canvas.height * canvasWidthRatioToHeight;
    }
    canvas.width *= .95;
    canvas.height *= .95;
};

const getDrawingProperty = () => {
    const padding = canvas.width / (enigma.rotors.length * 5 + 1);
    const rotorRadius = padding * 2;
    const rotorInternalRadius = rotorRadius * 0.7;
    const holeRadius = rotorRadius * Math.sin(2 * Math.PI / enigma.alphabet.size / 2) * 0.9;
    const smallHoleRadius = rotorInternalRadius * (holeRadius / rotorRadius);
    return {
        padding: padding,
        rotorRadius: rotorRadius,
        rotorInternalRadius: rotorInternalRadius,
        holeRadius: holeRadius,
        smallHoleRadius: smallHoleRadius,
        plugBoardSize: {
            width:  2 * (enigma.rotors.length - 1) * rotorRadius + (enigma.rotors.length - 2) * padding,
            height: 2 * rotorRadius
        },
        absolutePlugBoardCenterCoord: {
            x: (enigma.rotors.length + 1) * rotorRadius + (enigma.rotors.length + 2) / 2 * padding,
            y: 3 * rotorRadius + 2 * padding
        },
        absoluteReflectorCenterCoord: {
            x: rotorRadius + padding,
            y: 3 * rotorRadius + 2 * padding
        },
        getAbsoluteRotorCenterCoords: (n: number) => ({
            x: ((enigma.rotors.length - (n + 1)) * 2 + 1) * rotorRadius + (enigma.rotors.length - n) * padding,
            y: rotorRadius + padding
        }),
        getAbsoluteHoleCoord: (n: number, c: {x: number, y: number}, inOut: 'in' | 'out') => ({
            x: (inOut == 'in' ? rotorInternalRadius : rotorRadius) * Math.cos(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.x,
            y: (inOut == 'in' ? rotorInternalRadius : rotorRadius) * Math.sin(2 * Math.PI / enigma.alphabet.size * n - Math.PI / 2) + c.y
        })
    };
};

const context = canvas.getContext('2d');
assert(context);

const createGradient = (x0: number, y0: number, x1: number, y1: number, hue: number) => {
    const lineargradient = context.createLinearGradient(x0, y0, x1, y1);
    lineargradient.addColorStop(0, `hsl(${hue}turn, 100%, 50%)`);
    lineargradient.addColorStop(1, `hsl(${hue + 1 / linesCount}turn, 100%, 50%)`);
    return lineargradient;
};

setInterval(() => {
    const char = enigma.alphabet.at(Math.floor(Math.random() * enigma.alphabet.size));
    enigma.encrypt(char);
    const path = enigma.getPath(char);
    const dp = getDrawingProperty();
    context.clearRect(0, 0, canvas.width, canvas.height);
    /* draw plugboard */
    /* なんか setInterval の外で設定すると反映されない */
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    enigma.plugBoard.exchangeTable.forEach((exchangee, i) => {
        const from = {
            x: dp.absolutePlugBoardCenterCoord.x + dp.plugBoardSize.width * (i / (enigma.alphabet.size - 1) - 0.5),
            y: dp.absolutePlugBoardCenterCoord.y + dp.plugBoardSize.height / 2
        };
        const to = {
            x: dp.absolutePlugBoardCenterCoord.x + dp.plugBoardSize.width * (exchangee / (enigma.alphabet.size - 1) - 0.5),
            y: dp.absolutePlugBoardCenterCoord.y - dp.plugBoardSize.height / 2
        };
        /* draw characters */
        context.fillText(enigma.alphabet.at(i), from.x, from.y);
        //context.fillText(String.fromCharCode('A'.charCodeAt(0) + exchangee), to.x, to.y);
        /* draw exchange cables */
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle =
            exchangee == path.exchangedIn ? createGradient(from.x, from.y, to.x, to.y, 0 / linesCount) /* 0 */
            : exchangee == path.rotorsOut[path.rotorsOut.length - 1] ? createGradient(to.x, to.y, from.x, from.y, (linesCount - 1) / linesCount) /* linesCount - 1 */
            : exchangee == i ? 'lightgray'
            : 'black';
        context.stroke();
        /* to next rotor */
        const nextRotorCoord = dp.getAbsoluteHoleCoord(exchangee, dp.getAbsoluteRotorCenterCoords(0), 'out');
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(nextRotorCoord.x, nextRotorCoord.y);
        context.strokeStyle =
            exchangee == path.exchangedIn ? createGradient(to.x, to.y, nextRotorCoord.x, nextRotorCoord.y, 1 / linesCount) /* 1 */
            : exchangee == path.rotorsOut[path.rotorsOut.length - 1] ? createGradient(nextRotorCoord.x, nextRotorCoord.y, to.x, to.y, (linesCount - 2) / linesCount) /* linesCount - 2 */
            : 'lightgray';
        context.stroke();
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
            context.strokeStyle =
                rotor.passInward(j) == path.rotorsIn[i] ? createGradient(holeFrom.x, holeFrom.y, holeTo.x, holeTo.y, (2 * i + 2) / linesCount) /* 2, 4, ... , 2 * |rotors| */
                : j == path.rotorsOut[enigma.rotors.length - 1 - i] ? createGradient(holeTo.x, holeTo.y, holeFrom.x, holeFrom.y, (linesCount - (2 * i + 3)) / linesCount) /* linesCount - 3, linesCount - 5, ... , linesCount - (2 * |rotors| + 1) */
                : 'black';
            context.stroke();
            /* to next rotor */
            context.beginPath();
            context.moveTo(holeTo.x, holeTo.y);
            const nextHoleCoord = dp.getAbsoluteHoleCoord(
                rotor.passInward(j),
                i == enigma.rotors.length - 1 ? dp.absoluteReflectorCenterCoord : dp.getAbsoluteRotorCenterCoords(i + 1),
                'out'
            );
            context.lineTo(nextHoleCoord.x, nextHoleCoord.y);
            context.strokeStyle =
                rotor.passInward(j) == path.rotorsIn[i] ? createGradient(holeTo.x, holeTo.y, nextHoleCoord.x, nextHoleCoord.y, (2 * i + 3) / linesCount) /* 3, 5, ... , |rotors| * 2 + 1 */
                : j == path.rotorsOut[enigma.rotors.length - 1 - i] ? createGradient(nextHoleCoord.x, nextHoleCoord.y, holeTo.x, holeTo.y, (linesCount - (2 * i + 4)) / linesCount) /* linesCount - 4, linesCount - 2, ... , linesCount - |rotors| * 2 - 2 */
                : 'lightgray';
            context.stroke();
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
        context.strokeStyle =
            enigma.reflector.pass(i) == path.reflected ? createGradient(holeFrom.x, holeFrom.y, holeTo.x, holeTo.y, ((linesCount - 1) / 2) / linesCount) /* (linesCount - 1) / 2 */
            : i == path.reflected ? createGradient(holeTo.x, holeTo.y, holeFrom.x, holeFrom.y, ((linesCount - 1) / 2) / linesCount) /* (linesCount - 1) / 2 */
            : 'black';
        context.stroke();
        drawns.push(enigma.reflector.pass(i));
    }
}, 300);
