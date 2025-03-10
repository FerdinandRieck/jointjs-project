import { g, dia, shapes, util } from '@joint/core';
import { tokensData } from '../src/Tokens/gtoken';
import { Node, Link, Token } from '../src/Tokens/shapes';

const cssLoader = document.querySelector('.loader');
// 7 Days
const processDuration = 7 * 24 * 60 * 60 * 1000;
// Toolbar controls
//const range = document.querySelector('input[type="range"]');

const range = [];
const timer = [];
// 200000 milliseconds / 200 seconds - used to increase/decrease rate of time in animation
const DEFAULT_SPEED = 200000;
let speed = DEFAULT_SPEED;
let reqAnimId = null;
// Start and End time of dataset - all token events start and complete within this time period
range.min = String(tokensData.start);
range.max = String(tokensData.complete + processDuration);
range.value = range.min;

// Tokens - elements with respective path data (x/y positions , start/end points, rotation)
const tokens = [];

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 2000,
    height: 2000,
    model: graph,
    cellViewNamespace: shapes,
    clickThreshold: 5,
    async: true,
    background: { color: '#F5F5F5' },
    highlighting: {
        default: {
            name: 'addClass',
            options: {
                className: 'active'
            }
        }
    },
    interactive: false
        
});

// 3. Erstelle zwei Rechtecke als Komponenten
const component1 = new shapes.standard.Rectangle({
    id:'component1',
    position: { x: 100, y: 150 },
    size: { width: 100, height: 50 },
    attrs: {
        body: { fill: 'lightgray', stroke: 'black', strokeWidth: 2 },
        label: { text: 'Start', fill: 'black' }
    }
});

const component2 = new shapes.standard.Rectangle({
    id:'component2',
    position: { x: 500, y: 250 },
    size: { width: 100, height: 50 },
    attrs: {
        body: { fill: 'lightgray', stroke: 'black', strokeWidth: 2 },
        label: { text: 'Ende', fill: 'black' }
    }
});

const component3 = new shapes.standard.Rectangle({
    id:'component3',
    position: { x: 560, y: 50 },
    size: { width: 100, height: 50 },
    attrs: {
        body: { fill: 'lightgray', stroke: 'black', strokeWidth: 2 },
        label: { text: 'Ende', fill: 'black' }
    }
});

const component4 = new shapes.standard.Rectangle({
    id:'component4',
    position: { x: 660, y: 250 },
    size: { width: 100, height: 50 },
    attrs: {
        body: { fill: 'lightgray', stroke: 'black', strokeWidth: 2 },
        label: { text: 'Ende', fill: 'black' }
    }
});


// 4. Erstelle eine Verbindung zwischen den Komponenten
const tokenLinks = [
    new Link().connect(component1, component2),
    new Link().connect(component3, component4)
];



setVertices(tokenLinks[1])
setVertices(tokenLinks[0])

// 5. Füge Elemente dem Graph hinzu
graph.addCells([component1, component2, component3, component4, tokenLinks]);
setTokens();
paper.unfreeze({
    afterRender: () => {
     //   cssLoader.classList.remove('loader');
        startRangeAnimation();
        paper.unfreeze();
    }
});


function setVertices(link, vertices) {
    vertices = [
        { x: 100, y: 150 },
        {x: 400, y: 200},
        { x: 500, y: 250 }
    ]
    const polyline = new g.Polyline(vertices);
    polyline.simplify({ threshold: 0.001 });
    

    const polylinePoints = polyline.points;
    const numPolylinePoints = polylinePoints.length;

    // Points are used to calculate token x,y positions and rotation
    link.set({
        'points': polylinePoints,
        'vertices': polylinePoints.slice(1, numPolylinePoints - 1)
    });
}


// Animation functions
function startRangeAnimation() {
    if (reqAnimId) {
        return;
    }
    let startTime = Date.now();

    const fn = () => {
        //if (range.value > range.max) {
         //   stopRangeAnimation();
         //   return;
        //}
        // Calculate time passed since animation was started
        let currentTime = Date.now();
        let elapsedTime = currentTime - startTime;
        startTime = currentTime;

        // Elapsed time in milliseconds added to current range value
        range.value = String(Number(range.value) + (speed * elapsedTime));

        tokens.forEach((token) => {
            token.data.move(Number(range.value));
        });

        // updateHeatmap();

        const milliseconds = Number(range.value);
        const dateObject = new Date(milliseconds);
        timer.innerHTML = dateObject.toLocaleString('en-GB');

        reqAnimId = util.nextFrame(fn);
    };
    reqAnimId = util.nextFrame(fn);
}

function stopRangeAnimation() {
    util.cancelFrame(reqAnimId);
    reqAnimId = null;
}

// Tokens
// Tokens
function setTokens() {
    // Token elements to be added to graph
    const tokenElements = [];

    // Token colors - Each event id in ascending order has its own color
    const eventNumbers = [];
    const eventColors = [
        '#FFFFFF',
        '#EEF0FB',
        '#DEE2F7',
        '#CDD3F3',
        '#BDC4EF',
        '#ACB6EC',
        '#9CA7E8',
        '#8B99E4',
        '#7B8AE0',
        '#6A7BDC',
        '#5064D6',
        '#495ED4',
        '#394FD0'
    ];

    tokensData.listOfEvent.forEach((tokenEvent) => {
        if (!eventNumbers.includes(Number(tokenEvent.eventId))) {
            eventNumbers.push(Number(tokenEvent.eventId));
        }
    });
    eventNumbers.sort((a, b) => a - b);

    //const tokenLinks2 = tokenLinks.slice(1, 2)
    const tokenLinks2 = tokenLinks[0];
    console.log(typeof tokenLinks2);
    console.log(tokenLinks);

    // Create tokens - link source/target compared with token event source/target
    tokenLinks.forEach((tokenLink) => {
        tokensData.listOfEvent.forEach((tokenEvent) => {
            const condition = tokenEvent.source === tokenLink.attributes.source.id.id && 
                                tokenEvent.target === tokenLink.attributes.target.id.id;
            
            console.log("test")
            if ((tokenEvent.complete > tokenEvent.start) && condition ) {
                // Get token color
                const eventColorIndex = eventNumbers.indexOf(Number(tokenEvent.eventId));
                const tokenColor = (eventColorIndex === -1) ? '#394FD0' : eventColors[eventColorIndex];

                // Create token graph element
                const tokenElement = new Token({
                    attrs: { body: { fill: tokenColor }},
                    eventName: tokenEvent.eventName,
                    caseId: tokenEvent.caseId
                });
                //tokenElement.setText(tokenEvent.eventId);
                tokenElements.push(tokenElement);

                // Create token data
                let token = {
                    data: {
                        id: `follow-${tokenEvent.caseId}-${tokenEvent.start}`,
                        currentLutIndex: 0,
                        lut: [],
                        start: tokenEvent.start,
                        end: tokenEvent.complete,
                        element: tokenElement
                    }
                };

                // Move function
                token.data.move = function(value) {
                    if ((value >= this.start) && (value <= this.end)) {
                        let index = this.currentLutIndex;
                        const lut = this.lut[index];
                        if (lut) {
                            this.element.set('hidden', false);
                            const { x, y } = lut;
                            this.element.position(x - 12, y - 8);
                            this.element.rotate(lut.rotation, true);
                        }

                        const position = ((value - this.start) / (this.end - this.start)) * 1000;
                        this.currentLutIndex = Math.round(position);
                    } else {
                        this.element.set('hidden', true);
                    }
                };

                const allPoints = [];

                if (allPoints) {
                    const p = new g.Polyline(tokenLink.get('points'));
                    const l = p.length();
                    // Calculate token x,y positions
                    for (let i = 0; i <= 1; i += 0.001) {
                        const lut = { x: 0, y: 0, rotation: 0 };
                        const point = p.pointAtLength(i * l);
                        lut.x = point.x;
                        lut.y = point.y;
                        allPoints.push(lut);
                    }
                    // Calculate token rotation using x,y positions
                    
                    const length = allPoints.length;
                    for (let i = 0; i < length; i++) {
                        const lut = allPoints[i];
                        const nextLut = allPoints[i + 1];
                        if (nextLut) {
                            const line = new g.Line(lut, nextLut);
                            const angle = Math.round(line.angle());
                            const angleNormalized = g.normalizeAngle(((angle + 90) % 180) - 90);
                            lut.rotation = angleNormalized;
                        } else {
                            lut.rotation = allPoints[i - 1].rotation;
                        }
                    }
                        
                    token.data.lut = allPoints;
                }
                tokens.push(token);
            }
        });
    });
    graph.addCells(tokenElements);
}
