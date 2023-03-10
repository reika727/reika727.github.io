'use strict';

import assert from 'assert';
import { EnigmaI, PlugBoard } from './enigma';

const enigma = new EnigmaI(
    new PlugBoard(['A', 'M'], ['F', 'I'], ['N', 'V'], ['P', 'S'], ['T', 'U'], ['W', 'Z']),
    EnigmaI.wheelI,
    EnigmaI.wheelII,
    EnigmaI.whellIII,
    EnigmaI.reflectorA,
    'AAA',
    'AAA'
);

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

window.onload = window.onresize = () => {
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    if (clientWidth / 16 * 11 <= clientHeight * 2 / 3) {
        canvas.width = clientWidth;
        canvas.height = canvas.width / 16 * 11;
    } else {
        canvas.height = clientHeight * 2 / 3;
        canvas.width = canvas.height / 11 * 16;
    }
    canvas.width *= .95;
    canvas.height *= .95;
};

const getDrawingProperty = () => {
    const padding = canvas.width / 16;
    const holeRadius = padding / 5;
    const smallHoleRadius = holeRadius / 2;
    const wheelRadius = padding * 2;
    const wheelInternalRadius = wheelRadius * 0.7;
    return {
        padding: padding,
        holeRadius: holeRadius,
        smallHoleRadius: smallHoleRadius,
        wheelRadius: wheelRadius,
        wheelInternalRadius: wheelInternalRadius,
        holeCoord: (n: number, inOut: 'in' | 'out') => ({
            x: (inOut == 'in' ? wheelInternalRadius : wheelRadius) * Math.cos(2 * Math.PI / 26 * n - Math.PI / 2),
            y: (inOut == 'in' ? wheelInternalRadius : wheelRadius) * Math.sin(2 * Math.PI / 26 * n - Math.PI / 2)
        })
    };
};

const context = canvas.getContext('2d');
assert(context);

const createGradient = (x0: number, y0: number, x1: number, y1: number, hue: number) => {
    const lineargradient = context.createLinearGradient(x0, y0, x1, y1);
    lineargradient.addColorStop(0, `hsl(${hue}turn, 100%, 50%)`);
    lineargradient.addColorStop(1, `hsl(${hue + 1 / 17}turn, 100%, 50%)`);
    return lineargradient;
};

setInterval(() => {
    const char = String.fromCharCode('A'.charCodeAt(0) + Math.floor(Math.random() * 26));
    enigma.encrypt(char);
    const path = enigma.getPath(char);
    const dp = getDrawingProperty();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    /* draw plugboard */
    context.translate(4 * dp.wheelRadius + 2.5 * dp.padding, 3 * dp.wheelRadius + 2 * dp.padding);
    /* なんか setInterval の外で設定すると反映されない */
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    enigma.plugBoard.exchangeTable.forEach((exchangee, i) => {
        const from = {
            x: (4 * dp.wheelRadius + dp.padding) * (i / 25 - 0.5),
            y: dp.wheelRadius
        };
        const to = {
            x: (4 * dp.wheelRadius + dp.padding) * (exchangee / 25 - 0.5),
            y: -dp.wheelRadius
        };
        /* draw characters */
        context.fillText(String.fromCharCode('A'.charCodeAt(0) + i), from.x, from.y);
        //context.fillText(String.fromCharCode('A'.charCodeAt(0) + exchangee), to.x, to.y);
        /* draw exchange cables */
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle =
            exchangee == path.exchangedIn ? createGradient(from.x, from.y, to.x, to.y, 0 / 17) /* 0 */
            : exchangee == path.exchangedOut ? createGradient(to.x, to.y, from.x, from.y, 16 / 17) /* 16 */
            : exchangee == i ? 'lightgray'
            : 'black';
        context.stroke();
        /* to next wheel */
        const hole = dp.holeCoord(exchangee, 'out');
        const nextWheel = {
            x: hole.x + dp.wheelRadius + dp.padding / 2,
            y: hole.y - (2 * dp.wheelRadius + dp.padding)
        };
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(nextWheel.x, nextWheel.y);
        context.strokeStyle =
            exchangee == path.exchangedIn ? createGradient(to.x, to.y, nextWheel.x, nextWheel.y, 1 / 17) /* 1 */
            : exchangee == path.exchangedOut ? createGradient(nextWheel.x, nextWheel.y, to.x, to.y, 15 / 17) /* 15 */
            : 'lightgray';
        context.stroke();
    });
    /* draw wheels */
    context.translate(dp.wheelRadius + dp.padding / 2, -(2 * dp.wheelRadius + dp.padding));
    enigma.wheels.forEach((wheel, i) => {
        const isLastWheel = i == enigma.wheels.length - 1;
        for (let j = 0; j < 26; ++j) {
            const holeFrom = dp.holeCoord(j, 'out');
            const holeTo = dp.holeCoord(wheel.passInward(j), 'in');
            /* draw hole */
            context.beginPath();
            context.arc(holeFrom.x, holeFrom.y, dp.holeRadius, 0, 2 * Math.PI);
            if (wheel.turnOverOffsets.includes(j)) {
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
                wheel.passInward(j) == path.wheelsIn[i] ? createGradient(holeFrom.x, holeFrom.y, holeTo.x, holeTo.y, (i + 1) * 2 / 17) /* 2, 4, 6 */
                : j == path.wheelsOut[2 - i] ? createGradient(holeTo.x, holeTo.y, holeFrom.x, holeFrom.y, (7 - i) * 2 / 17) /* 14, 12, 10 */
                : 'black';
            context.stroke();
            /* to next wheel */
            context.beginPath();
            context.moveTo(holeTo.x, holeTo.y);
            const nextWheel = isLastWheel ? {
                x: holeTo.x * (dp.wheelRadius / dp.wheelInternalRadius),
                y: holeTo.y * (dp.wheelRadius / dp.wheelInternalRadius) + (2 * dp.wheelRadius + dp.padding)
            } : {
                x: holeTo.x * (dp.wheelRadius / dp.wheelInternalRadius) - (2 * dp.wheelRadius + dp.padding),
                y: holeTo.y * (dp.wheelRadius / dp.wheelInternalRadius)
            };
            context.lineTo(nextWheel.x, nextWheel.y);
            context.strokeStyle =
                wheel.passInward(j) == path.wheelsIn[i] ? createGradient(holeTo.x, holeTo.y, nextWheel.x, nextWheel.y, ((i + 1) * 2 + 1) / 17) /* 3, 5, 7 */
                : j == path.wheelsOut[2 - i] ? createGradient(nextWheel.x, nextWheel.y, holeTo.x, holeTo.y, ((6 - i) * 2 + 1) / 17) /* 13, 11, 9 */
                : 'lightgray';
            context.stroke();
        }
        if (isLastWheel) {
            context.translate(0, 2 * dp.wheelRadius + dp.padding);
        } else {
            context.translate(-(2 * dp.wheelRadius + dp.padding), 0);
        }
    });
    /* draw reflector */
    const drawns = Array<number>();
    for (let i = 0; i < 26; ++i) {
        const holeFrom = dp.holeCoord(i, 'out');
        const holeTo = dp.holeCoord(enigma.reflector.passInward(i), 'out');
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
            enigma.reflector.passInward(i) == path.reflected ? createGradient(holeFrom.x, holeFrom.y, holeTo.x, holeTo.y, 8 / 17) /* 8 */
            : i == path.reflected ? createGradient(holeTo.x, holeTo.y, holeFrom.x, holeFrom.y, 8 / 17) /* 8 */
            : 'black';
        context.stroke();
        drawns.push(enigma.reflector.passInward(i));
    }
    context.restore();
}, 300);
