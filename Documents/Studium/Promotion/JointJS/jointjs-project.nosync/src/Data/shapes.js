import { dia, shapes } from '@joint/core';

export const Child = shapes.standard.Rectangle.define('Child', {
    z: 3,
    attrs: {
        body: {
            fill: 'rgba(70,101,229,0.15)',
            stroke: '#4665E5',
            strokeWidth: 1,
            rx: 2,
            ry: 2,
        },
        label: {
            class: 'inner-label',
            fontFamily: 'sans-serif',
            textWrap: {
                width: -10
            },
            fontSize: 12
        }
    },
    ports: {
        groups: {
            port: {
                z:9,
                position: {
                    name: 'absolute'
                },
                attrs: {
                    portBody: {
                        width: 'calc(w)',
                        height: 'calc(h)',
                        fill: 'gray'
                    }
                },
                markup: [{
                    tagName: 'rect',
                    selector: 'portBody',
                    attributes: {
                         magnet: 'passive'
                     }
                }]
            }
        }
    }
});


export const Edge = shapes.standard.Link.define('Edge', {
    z: 1,
    attrs: {
        root: {
            cursor: 'pointer'
        },
        line: {
            fill: 'none',
            connection: true,
            stroke: '#464454',
                strokeWidth: 1,
                //targetMarker: { d: 'M 5 2.5 0 0 5 -2.5 Z' },
                targetMarker: 'null',

        }
    },
    connector: {
        name: "jumpover",
        args: { 
            jump: "gap",
            radius: 0,
            size: 3
        }
    },
});



export const Signal = shapes.standard.Rectangle.define('Signal', {
    type: 'Signal',
    z: 4,
    size: { width: 24, height: 16 },
    position: { x: 250, y: 10 },
    hidden: true,
    attrs: {
        body: {
            width: 'calc(w)',
            height: 'calc(h)',
            fill: '#FFFFFF',
            stroke: '#A0A0A0',
            strokeWidth: 1
        },
        label: {
            x: 'calc(0.5 * w)',
            y: 'calc(0.5 * h)',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fontSize: 14,
            fill: '#303740'
        }
    },
}, {
    markup: [ 
        {
            tagName: 'rect',
            selector: 'body',
            attributes: {
                cursor: 'pointer',
            }
        },
        {
            tagName: 'text',
            selector: 'label',
            attributes: {
                cursor: 'pointer',
            }
        }
    ]
});


export const JunctionPoint = shapes.standard.Circle.define('JunctionPoint', {
    z: 1,
});