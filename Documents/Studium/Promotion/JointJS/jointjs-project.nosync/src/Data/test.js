import { dia, shapes, linkTools } from '@joint/core';

const namespace = shapes;
const graph = new dia.Graph({}, { cellNamespace: namespace });

const paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 650,
    height: 200,
    gridSize: 1,
    model: graph,
    background: { color: '#F5F5F5' },
    cellViewNamespace: namespace,
    linkPinning: false, // Prevent link being dropped in blank paper area
});

const portsIn = {
    position: {
        name: 'left'
    },
    attrs: {
        portBody: {
            magnet: false,
            r: 10,
            fill: '#023047',
            stroke: '#023047'
        }
    },
    label: {
        position: {
            name: 'left',
            args: { y: 6 }
        },
        markup: [{
            tagName: 'text',
            selector: 'label',
            className: 'label-text'
        }]
    },
    markup: [{
        tagName: 'circle',
        selector: 'portBody'
    }]
};

const portsOut = {
    position: {
        name: 'right'
    },
    attrs: {
        portBody: {
            magnet: true,
            r: 10,
            fill: '#E6A502',
            stroke: '#023047'
        }
    },
    label: {
        position: {
            name: 'right',
            args: { y: 6 }
        },
        markup: [{
            tagName: 'text',
            selector: 'label',
            className: 'label-text'
        }]
    },
    markup: [{
        tagName: 'circle',
        selector: 'portBody'
    }]
};

const model = new shapes.standard.Rectangle({
    position: { x: 125, y: 50 },
    size: { width: 90, height: 90 },
    attrs: {
        root: {
            magnet: false
        },
        body: {
            fill: '#8ECAE6',
        },
        label: {
            text: 'Model',
            fontSize: 16,
            y: -10
        }
    },
    ports: {
        groups: {
            'in': portsIn,
            'out': portsOut
        }
    }
});

model.addPorts([
    {
        group: 'in',
        id: 'in1',
        attrs: { label: { text: 'in1' } }
    },
    {
        group: 'in',
        id: 'in2',
        attrs: { label: { text: 'in2' } }
    },
    {
        group: 'out',
        id: 'out',
        attrs: { label: { text: 'out' } }
    }
]);

const model2 = model.clone().translate(300, 0).attr('label/text', 'Model 2');

graph.addCells(model, model2);

