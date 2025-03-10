import * as joint from '@joint/core';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Child, Edge } from '../src/ELK/shapes';
import elkGraph from '../src/ELK/elkGraph.json';

const elk = new ELK();

const graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
const paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    width: 400,
    height: 300,
    model: graph,
    cellViewNamespace: joint.shapes,
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


const mask = joint.highlighters.mask;

paper.on('link:pointerclick', (cellView) => {
    mask.remove(cellView);
    mask.add(cellView, { selector: 'line' }, 'link-highlight', {
        layer: 'back',
        padding: 0.5,
        attrs: {
            'stroke': '#FF4365',
            'stroke-width': 1,
            'stroke-linecap': 'square'
        }
    });
});

paper.on('blank:pointerclick', () => {
    // Remove all Highlighters from all cells
    graph.getCells().forEach(function(cell) {
        mask.remove(cell.findView(paper));
    });
});

paper.on('cell:mouseenter', function(cellView) {
    getCellOutbounds(this.model, cellView.model).forEach(function(cell) {
        cell.findView(this).highlight();
    }, this);
});

paper.on('cell:mouseleave cell:pointerdown', function(cellView) {
    getCellOutbounds(this.model, cellView.model).forEach(function(cell) {
        cell.findView(this).unhighlight();
    }, this);
});

function getCellOutbounds(graph, cell) {
    return [cell].concat(
        graph.getNeighbors(cell, { outbound: true, indirect: true }),
        graph.getConnectedLinks(cell, { outbound: true, indirect: true })
    );
}

const mapPortIdToShapeId = {};

const addChildren = (children, parent) => {
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

const addEdges = (edges, parent) => {
    edges.forEach((link) => {
        const { bendPoints = [] } = link.sections[0];
        const junctionPoints = link.junctionPoints || [];

        if (parent) {
            bendPoints.map(bendPoint => {
                const parentPosition = parent.position();
                bendPoint.x += parentPosition.x;
                bendPoint.y += parentPosition.y;
            });
        }

        junctionPoints.forEach(point => {
            const SIZE = 6;
            const position = {
                x: point.x - SIZE / 2 + (parent ? parent.get('position').x : 0),
                y: point.y - SIZE / 2 + (parent ? parent.get('position').y : 0)
            };
            const junctionPoint = new joint.shapes.standard.Circle({
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
            source: {
                id: sourceElementId,
                port: sourcePortId
            },
            target: {
                id: targetElementId,
                port: targetPortId,
            },
            vertices: bendPoints,
            attrs: {
                line: {
                    stroke: link.color,
                }
            }
        });

        shape.addTo(graph);
    });

};

elk.layout(elkGraph).then(res => {
    const children = res.children || [];
    const edges = res.edges || [];

    addChildren(children);
    addEdges(edges);

    paper.unfreeze();
    paper.fitToContent({ useModelGeometry: true, padding: 100, allowNewOrigin: 'any' });
});

//elk.layout(elkGraph).then(layout => console.log(layout));
