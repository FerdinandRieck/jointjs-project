//----------- Dynamisches Layout Knoten-Kanten-Modell -----------------------------------------------
// Automatische Positionierung der Komponenten und Routing mit ELK.js
// Signale werden mit Tokens-Beispieldemo dargestellt: https://www.jointjs.com/demos/tokens
//---------------------------------------------------------------------------------------------------
import { g, dia, shapes, util, highlighters } from '@joint/core';
import { signalsData } from '../src/Data/signalsData';
import { Child, Edge, Signal, JunctionPoint } from '../src/Data/shapes';
import ELK from 'elkjs/lib/elk.bundled.js';
import elkGraph from '../src/Data/graphData.json';

const elk = new ELK();

// Toolbar controls and speed
const cssLoader = document.querySelector('.loader');
const range = document.querySelector('input[type="range"]');
const processDuration = 7 * 24 * 60 * 60 * 1000; // 7 Days
range.min = String(signalsData.start);
range.max = String(signalsData.complete + processDuration);
range.value = range.min;
const DEFAULT_SPEED = 200000; // 200000 milliseconds
let speed = DEFAULT_SPEED;
let reqAnimId = null;
const speedInput = document.querySelector('input[type="number"]');
const startButton = document.querySelector('.start');
const stopButton = document.querySelector('.stop');
const timer = document.querySelector('.textTime');

//----------- Diagramm settings ---------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------
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
        },
        'embedding': false
    },
    interactive: false,
    viewport: function(view) {
        return !view.model.attributes.hidden;
    },
});

//----------- HTML-Input ----------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------

// Event Listeners
range.addEventListener('input', (evt) => {
    const target = evt.target;
    range.value = target.value;
    // Update position of signal based on time
    signals.forEach((signal) => {
        signal.data.move(Number(range.value));
    });
    const milliseconds = Number(range.value);
    const dateObject = new Date(milliseconds);
    timer.innerHTML = dateObject.toLocaleString('en-GB');
    if (!reqAnimId) {
        // The animation is stopped.
        reqAnimId = util.nextFrame(() => {
            reqAnimId = null;
        });
    }
});

speedInput.addEventListener('input', (evt) => {
    const target = evt.target;
    
    // Sicherstellen, dass target ein Input-Element ist
    if (target && target.value !== undefined) {
        const value = Number(target.value);

        // Update animation speed
        if (value <= 10 && value >= 0) {
            speed = DEFAULT_SPEED * value;
        } else {
            speed = DEFAULT_SPEED;
            target.value = '1';
        }
    }
});

startButton.addEventListener('click', () => {
    startButton.setAttribute('disabled', '');
    startRangeAnimation();
});

stopButton.addEventListener('click', () => {
    startButton.removeAttribute('disabled');
    stopRangeAnimation();
});


//----------- Highlighting --------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------

// Elemente, Links & Ports markieren beim Mouseover
paper.on('cell:mouseover', function(cellView, evt) {

    // prüfen, ob es einen Port gibt
    const Port = evt.target.closest('[magnet]'); 
    if (!Port) {
        cellView.highlight();  // Falls kein Port vorhanden 
        return;
    }
    else {
    // Falls ein Port gefunden wurde, hebe ihn hervor
    Port.classList.add('hover-port');
    const portColor = cellView.findAttribute('fill', Port);
    Port.style.stroke = portColor
    }
});

paper.on('cell:mouseout', function(cellView, evt) {
    cellView.unhighlight();

    // prüfen, ob es einen Port gibt
    const Port = evt.target.closest('[magnet]');
    if (!Port) return;
    Port.classList.remove('hover-port');
});


// Elemente & Links markieren beim Mausklick
paper.on('cell:pointerclick', function (cellView) {
    let cellEl = cellView.el; // Das echte DOM-Element des Elements oder Links
    if (cellEl.classList.contains('selected')) {
        cellEl.classList.remove('selected'); // Falls markiert, entfernen
    } else {
        cellEl.classList.add('selected'); // Falls nicht markiert, hinzufügen
    }
});

// Nur Ports markieren beim Mausklick
paper.on('element:magnet:pointerclick', function (cellView, evt, magnet) {
    evt.stopPropagation(); // Verhindert, dass das gesamte Element markiert wird
    // Port hervorheben
    magnet.classList.add('selected-port');
    // Aktuelle Port-Farbe auslesen
    const portColor = cellView.findAttribute('fill', magnet);
    magnet.style.stroke = portColor 
});

// Alle Highlights entfernen, wenn auf den Hintergrund geklickt wird
paper.on('blank:pointerclick', function () {
    document.querySelectorAll('.selected, .selected-port').forEach(el => {
        el.classList.remove('selected');
        el.classList.remove('selected-port');
    });
});



// Tooltip erstellen und zum Body hinzufügen
// Tooltip-Element erstellen
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
document.body.appendChild(tooltip);

// Tooltip für JointJS-Elemente aktivieren
paper.on("cell:mouseover", function (cellView, evt) {
    const model = cellView.model;
    let tooltipContent = "";

    var portId = cellView.findAttribute('port', evt.target);

    if (!model) return;

    // Prüfen, ob es ein Child (Knoten) ist
    if (model.attributes.type == 'Child') {
        if (portId != null){
            tooltipContent = `<strong>Pin</strong><br>ID: ${portId}`;
        }
        else {
            tooltipContent = `<strong>ECU</strong><br>ID: ${model.id}`;
        }
    } 
    else if (model.attributes.type == 'Edge') {
        tooltipContent = `<strong>Leitung</strong><br>Source: ${model.get("source").id}<br>Target: ${model.get("target").id}`;
    } 
    // Prüfen, ob es ein Port ist (nur falls `ports`-Struktur vorhanden ist)
    else if (model.attributes.type == 'Signal') {
        tooltipContent = `<strong>Signal</strong><br>ID: ${model.id}`;
    } 

    // Falls es nicht erkannt wurde, als nichts ausgeben
    else {
        return
    }

    tooltip.innerHTML = tooltipContent;
    tooltip.style.left = evt.pageX + 10 + "px";
    tooltip.style.top = evt.pageY + 10 + "px";
    tooltip.style.display = "block";
});


// Tooltip ausblenden, wenn Maus das Element verlässt
paper.on("cell:mouseout", function () {
    tooltip.style.display = "none";
});

// Tooltip folgt der Mausbewegung
document.addEventListener("mousemove", function (evt) {
    tooltip.style.left = evt.pageX + 10 + "px";
    tooltip.style.top = evt.pageY + 10 + "px";
});


//----------- main ----------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------

const mapPortIdToShapeId = {};
const signals = [];
let signalLinks = [];

elk.layout(elkGraph).then(res => {
    const children = res.children || [];
    const edges = res.edges || [];

    addChildren(children);
    addEdges(edges);

    paper.unfreeze();
    paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });

    setSignals();

    paper.unfreeze({
        afterRender: () => {
            cssLoader.classList.remove('loader');
            startRangeAnimation();
            paper.unfreeze();
        }
    });

  //  
});

//----------- Functions -----------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------

function addChildren(children, parent) {
    children.forEach(child => {

        const { ports = [], children = [], labels = [] } = child;

        const shape = new Child({
            id: child.id,
            position: { x: child.x, y: child.y },
            size: { width: child.width, height: child.height },
            attrs: { label: { text: child.label} },
        });

        ports.forEach(port => {
            const portToAdd = {
                group: 'port',
                args: { x: port.x, y: port.y },
                id: port.id,
                size: { height: port.height || 0, width: port.width || 0 },
                attrs: { portBody: { fill: port.color} }
            };
            shape.addPort(portToAdd);
            mapPortIdToShapeId[port.id] = shape.id;
        });

        shape.addTo(graph);

        if (parent) {
            parent.embed(shape);
            shape.position(child.x, child.y, { parentRelative: true });
        }

        if (children.length > 0) {
            addChildren(children, shape);
        }

        if (child.edges) {
            addEdges(child.edges, shape);
        }


    });
};

function addEdges (edges, parent)  {
    edges.forEach((link) => {
        const { bendPoints = [] } = link.sections[0];
        const { startPoint = [] } = link.sections[0];
        const { endPoint = [] } = link.sections[0];
        const junctionPoints = link.junctionPoints || [];

        var z_order = 1;
        if (parent) {
            z_order = 3;
            bendPoints.map(bendPoint => {
                const parentPosition = parent.position();
                bendPoint.x += parentPosition.x;
                bendPoint.y += parentPosition.y;
            });
        }

        junctionPoints.forEach(point => {
            const SIZE = 4;
            const position = {
                x: point.x - SIZE / 2 + (parent ? parent.get('position').x : 0),
                y: point.y - SIZE / 2 + (parent ? parent.get('position').y : 0)
            };
            const junctionPoint = new JunctionPoint({
                size: { height: SIZE, width: SIZE },
                attrs: {
                    body: {
                        fill: link.color,
                        stroke: link.color,
                    }
                }
            });
            junctionPoint.addTo(graph);
            junctionPoint.position(position.x, position.y);
        });

        const sourcePortId = link.sources[0];
        const targetPortId = link.targets[0];
        const sourceElementId = mapPortIdToShapeId[sourcePortId];
        const targetElementId = mapPortIdToShapeId[targetPortId];

        const shape = new Edge({
            z: z_order,
            source: {
                id: sourceElementId,
                port: sourcePortId
            },
            target: {
                id: targetElementId,
                port: targetPortId,
            },
            vertices: bendPoints,
            points: [startPoint, ...bendPoints, endPoint],
            attrs: {
                line: {
                    stroke: link.color,
                }
            }
        });
        shape.addTo(graph);
  
        signalLinks.push(shape)
    });
};


// Animation functions
function startRangeAnimation() {

    if (reqAnimId) {
        return;
    }
    let startTime = Date.now();

    const fn = () => {
        if (range.value > range.max) {
            stopRangeAnimation();
            return;
        }
        // Calculate time passed since animation was started
        let currentTime = Date.now();
        let elapsedTime = currentTime - startTime;
        startTime = currentTime;

        // Elapsed time in milliseconds added to current range value
        range.value = String(Number(range.value) + (speed * elapsedTime));

        signals.forEach((signal) => {
            signal.data.move(Number(range.value));
        });

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

function setSignals() {
    // Signal elements to be added to graph
    const signalElements = [];

    // Signal colors - Each event id in ascending order has its own color
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

    signalsData.listOfEvent.forEach((signalEvent) => {
        if (!eventNumbers.includes(Number(signalEvent.eventId))) {
            eventNumbers.push(Number(signalEvent.eventId));
        }
    });
    eventNumbers.sort((a, b) => a - b);

    // Create signals - link source/target compared with signal event source/target
    signalLinks.forEach((signalLink) => {
        signalsData.listOfEvent.forEach((signalEvent) => {
            const condition = signalEvent.source === signalLink.attributes.source.port && 
                                signalEvent.target === signalLink.attributes.target.port;

            if ((signalEvent.complete > signalEvent.start) && condition) {
                // Get signal color
                const eventColorIndex = eventNumbers.indexOf(Number(signalEvent.eventId));
                const signalColor = (eventColorIndex === -1) ? '#394FD0' : eventColors[eventColorIndex];

                // Create signal graph element
                const signalElement = new Signal({
                    id: signalEvent.eventName,
                    attrs: { body: { fill: signalColor }, label: { text: signalEvent.eventId}},
                    eventName: signalEvent.eventName,
                    caseId: signalEvent.caseId
                });
                signalElements.push(signalElement);

                // Create signal data
                let signal = {
                    data: {
                        id: signalElement.id,
                        currentLutIndex: 0,
                        lut: [],
                        start: signalEvent.start,
                        end: signalEvent.complete,
                        element: signalElement
                    }
                };

                // If range time is between signal start/end time, update signal position, if not, hide signal
                signal.data.move = function(value) {
                    if ((value >= this.start) && (value <= this.end)) {
                        let index = this.currentLutIndex;
                        const lut = this.lut[index];
                        if (lut) {
                            this.element.set('hidden', false);
                            const { x, y } = lut;
                            // Update position, and centre signal on path (Minus half of signal width and height)
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
                    const p = new g.Polyline(signalLink.attributes.points);
                    const l = p.length();
                    // Calculate signal x,y positions
                    for (let i = 0; i <= 1; i += 0.001) {
                        const lut = { x: 0, y: 0, rotation: 0 };
                        const point = p.pointAtLength(i * l);
                        lut.x = point.x;
                        lut.y = point.y;
                        allPoints.push(lut);
                    }
                    // Calculate signal rotation using x,y positions
                    
                    const length = allPoints.length;
                    for (let i = 0; i < length; i++) {
                        const lut = allPoints[i];
                        const nextLut = allPoints[i + 1];
                        if (nextLut) {
                            // Calculate angle of line between pair of x,y points
                            const line = new g.Line(lut, nextLut);
                            const angle = Math.round(line.angle());
                            const angleNormalized = g.normalizeAngle(((angle + 90) % 180) - 90);
                            lut.rotation = angleNormalized;
                        } else {
                            // Set rotation for last x,y position
                            lut.rotation = allPoints[i - 1].rotation;
                        }
                    }
                        
                    signal.data.lut = allPoints;
                }
                signals.push(signal);
            }
        });
    });
    graph.addCells(signalElements);
}

//---------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------

