'use strict';

import assert from 'assert';
import { EnigmaI, PlugBoard } from './enigma';

const enigma = new EnigmaI(
    new PlugBoard(['A', 'J'], ['P', 'X']),
    EnigmaI.wheelI,
    EnigmaI.wheelII,
    EnigmaI.whellIII,
    EnigmaI.reflectorA,
    'AAA',
    'AAA'
);
const margin = 50;
const wheelRadius = 100;
const wheelInternalRadius = 70;
const holeCoord = (n: number, inOut: 'in' | 'out') => ({
    x: (inOut == 'in' ? wheelInternalRadius : wheelRadius) * Math.cos(2 * Math.PI / 26 * n - Math.PI / 2),
    y: (inOut == 'in' ? wheelInternalRadius : wheelRadius) * Math.sin(2 * Math.PI / 26 * n - Math.PI / 2)
});
const holeRadius = 10;
const smallHoleRadius = 5;
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const context = canvas.getContext('2d');
assert(context);
context.textAlign = 'center';
context.textBaseline = 'middle';
setInterval(() => {
    enigma.encrypt('A');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    /* draw plugboard */
    context.translate(4 * wheelRadius + 2.5 * margin, 3 * wheelRadius + 2 * margin);
    enigma.plugBoard.exchangeTable.forEach((exchangee, i) => {
        const from = {
            x: (4 * wheelRadius + margin) * (i / 25 - 0.5),
            y: wheelRadius
        };
        const to = {
            x: (4 * wheelRadius + margin) * (exchangee / 25 - 0.5),
            y: -wheelRadius
        };
        /* draw characters */
        context.fillText(String.fromCharCode('A'.charCodeAt(0) + i), from.x, from.y);
        context.fillText(String.fromCharCode('A'.charCodeAt(0) + exchangee), to.x, to.y);
        /* draw exchange cables */
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.strokeStyle = exchangee == i ? 'lightgray' : 'black';
        context.stroke();
        /* to next wheel */
        const hole = holeCoord(exchangee, 'out');
        context.beginPath();
        context.moveTo(to.x, to.y);
        context.lineTo(hole.x + wheelRadius + margin / 2, hole.y - (2 * wheelRadius + margin));
        context.strokeStyle = 'lightgray';
        context.stroke();
    });
    /* draw wheels */
    context.translate(wheelRadius + margin / 2, -(2 * wheelRadius + margin));
    enigma.wheels.forEach((wheel, i) => {
        const isLastWheel = i == enigma.wheels.length - 1;
        for (let j = 0; j < 26; ++j) {
            const holeFrom = holeCoord(j, 'out');
            const holeTo = holeCoord(wheel.passInward(j), 'in');
            /* draw hole */
            context.beginPath();
            context.arc(holeFrom.x, holeFrom.y, holeRadius, 0, 2 * Math.PI);
            context.strokeStyle = 'black';
            context.stroke();
            /* draw small hole */
            context.beginPath();
            context.arc(holeTo.x, holeTo.y, smallHoleRadius, 0, 2 * Math.PI);
            context.stroke();
            /* draw connecting line */
            context.beginPath();
            context.moveTo(holeFrom.x, holeFrom.y);
            context.lineTo(holeTo.x, holeTo.y);
            context.stroke();
            /* draw turnover bar */
            context.strokeStyle = 'red';
            wheel.turnOverOffsets.forEach(turnOverOffset => {
                const turnOverHole = holeCoord(turnOverOffset, 'out');
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(turnOverHole.x, turnOverHole.y);
                context.stroke();
            });
            /* to next wheel */
            context.beginPath();
            context.moveTo(holeTo.x, holeTo.y);
            if (isLastWheel) {
                context.lineTo(
                    holeTo.x * (wheelRadius / wheelInternalRadius),
                    holeTo.y * (wheelRadius / wheelInternalRadius) + (2 * wheelRadius + margin)
                );
            } else {
                context.lineTo(
                    holeTo.x * (wheelRadius / wheelInternalRadius) - (2 * wheelRadius + margin),
                    holeTo.y * (wheelRadius / wheelInternalRadius)
                );
            }
            context.strokeStyle = 'lightgray';
            context.stroke();
        }
        if (isLastWheel) {
            context.translate(0, 2 * wheelRadius + margin);
        } else {
            context.translate(-(2 * wheelRadius + margin), 0);
        }
    });
    /* draw reflector */
    context.strokeStyle = 'black';
    for (let i = 0; i < 26; ++i) {
        const holeFrom = holeCoord(i, 'out');
        const holeTo = holeCoord(enigma.reflector.passInward(i), 'out');
        /* draw hole */
        context.beginPath();
        context.arc(holeFrom.x, holeFrom.y, holeRadius, 0, 2 * Math.PI);
        context.stroke();
        /* draw connecting line */
        context.beginPath();
        context.moveTo(holeFrom.x, holeFrom.y);
        context.lineTo(holeTo.x, holeTo.y);
        context.stroke();
    }
    context.restore();
}, 500);
