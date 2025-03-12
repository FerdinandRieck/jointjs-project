import { util } from '@joint/core';
import mermaid from "mermaid";
import { signalsData } from '../src/Data/signalsData';

mermaid.initialize({ startOnLoad: false });

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

const signals = [];

// Mermaid-Diagramm laden
async function loadMermaidDiagram() {
    try {
        const response = await fetch("src/mermaid/diagram1.mmd");
        const diagramText = await response.text();

        document.getElementById("mermaid-container-1").innerHTML = diagramText;

        // Mermaid neu rendern
        await mermaid.run();

        setSignals();
        startRangeAnimation();
    } catch (error) {
        console.error("Fehler beim Laden des Mermaid-Diagramms:", error);
    }
}

// Event Listeners
range.addEventListener('input', (evt) => {
    const target = evt.target;
    range.value = target.value;
    // Update position of signal based on time
    signals.forEach((signal) => {
        signal.data.highlight(Number(range.value), signal);
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


// 🔥 **Vereinfachte Methode: Finde die Linie nach dem passenden Text**
function highlightArrowByText(signalName) {
    const allTexts = document.querySelectorAll(".mermaid svg text"); // Alle Texte im SVG finden

    allTexts.forEach((textElement) => {
        if (textElement.innerHTML.includes(signalName)) {

            // Nächstes Geschwister-Element (`nextElementSibling`) suchen
            let arrowElement = textElement.nextElementSibling;

            if (arrowElement && arrowElement.tagName === "line") {

                // Farbe ändern
                arrowElement.style.stroke = "red";  
                arrowElement.style.strokeWidth = 4;

            }
        }
    });
}

function unhighlightArrowByText(signalName) {
    const allTexts = document.querySelectorAll(".mermaid svg text"); // Alle Texte im SVG finden

    allTexts.forEach((textElement) => {
        if (textElement.innerHTML.includes(signalName)) {

            // Nächstes Geschwister-Element (`nextElementSibling`) suchen
            let arrowElement = textElement.nextElementSibling;

            if (arrowElement && arrowElement.tagName === "line") {

                // Farbe ändern
                arrowElement.style.stroke = "";  
                arrowElement.style.strokeWidth = "";

            }
        }
    });
}

// Mermaid-Diagramm laden
loadMermaidDiagram();

function setSignals() {
    // Signal elements to be added to graph
    const signalElements = [];

    // Create signals - link source/target compared with signal event source/target
    signalsData.listOfEvent.forEach((signalEvent) => {

        if (signalEvent.complete > signalEvent.start) {

            // Create signal data
            let signal = {
                data: {
                    id: signalEvent.eventName,
                    currentLutIndex: 0,
                    lut: [],
                    start: signalEvent.start,
                    end: signalEvent.complete
                }
            };

            // If range time is between signal start/end time, update signal position, if not, hide signal
            signal.data.highlight = function(value, signal) {
                if ((value >= this.start) && (value <= this.end)) {
                    highlightArrowByText(signal.data.id)
                }
                else {
                    unhighlightArrowByText(signal.data.id)
                }
            };
            signals.push(signal);
        }
    });
}

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
        range.value = String(Number(range.value) )//+ (speed * elapsedTime)); Klammer wegnehmen

        signals.forEach((signal) => {
            signal.data.highlight(Number(range.value), signal);
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