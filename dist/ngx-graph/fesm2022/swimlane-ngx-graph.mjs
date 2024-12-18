import * as i0 from '@angular/core';
import { EventEmitter, Directive, Output, Injectable, HostListener, Component, ViewEncapsulation, ChangeDetectionStrategy, Input, ContentChild, ViewChildren, NgModule } from '@angular/core';
import * as i2 from '@angular/common';
import { CommonModule } from '@angular/common';
import { __decorate } from 'tslib';
import { trigger, transition, style, animate } from '@angular/animations';
import { select } from 'd3-selection';
import * as shape from 'd3-shape';
import * as ease from 'd3-ease';
import 'd3-transition';
import { Subject, Subscription, Observable, of, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { identity, transform, translate, scale, toSVG, smoothMatrix } from 'transformation-matrix';
import { scaleOrdinal } from 'd3-scale';
import * as dagre from 'dagre';
import * as d3Force from 'd3-force';
import { forceSimulation, forceManyBody, forceCollide, forceLink } from 'd3-force';
import { d3adaptor } from 'webcola';
import * as d3Dispatch from 'd3-dispatch';
import * as d3Timer from 'd3-timer';

const cache = {};
/**
 * Generates a short id.
 *
 */
function id() {
    let newId = ('0000' + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(-4);
    newId = `a${newId}`;
    // ensure not already used
    if (!cache[newId]) {
        cache[newId] = true;
        return newId;
    }
    return id();
}

var PanningAxis;
(function (PanningAxis) {
    PanningAxis["Both"] = "both";
    PanningAxis["Horizontal"] = "horizontal";
    PanningAxis["Vertical"] = "vertical";
})(PanningAxis || (PanningAxis = {}));

var MiniMapPosition;
(function (MiniMapPosition) {
    MiniMapPosition["UpperLeft"] = "UpperLeft";
    MiniMapPosition["UpperRight"] = "UpperRight";
})(MiniMapPosition || (MiniMapPosition = {}));

/**
 * Throttle a function
 *
 * @export
 * @param {*}      func
 * @param {number} wait
 * @param {*}      [options]
 * @returns
 */
function throttle(context, func, wait, options) {
    options = options || {};
    let args;
    let result;
    let timeout = null;
    let previous = 0;
    function later() {
        previous = options.leading === false ? 0 : +new Date();
        timeout = null;
        result = func.apply(context, args);
    }
    return function (..._arguments) {
        const now = +new Date();
        if (!previous && options.leading === false) {
            previous = now;
        }
        const remaining = wait - (now - previous);
        args = _arguments;
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            previous = now;
            result = func.apply(context, args);
        }
        else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}
/**
 * Throttle decorator
 *
 *  class MyClass {
 *    throttleable(10)
 *    myFn() { ... }
 *  }
 *
 * @export
 * @param {number} duration
 * @param {*} [options]
 * @returns
 */
function throttleable(duration, options) {
    return function innerDecorator(target, key, descriptor) {
        return {
            configurable: true,
            enumerable: descriptor.enumerable,
            get: function getter() {
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    value: throttle(this, descriptor.value, duration, options)
                });
                return this[key];
            }
        };
    };
}

const colorSets = [
    {
        name: 'vivid',
        selectable: true,
        group: 'Ordinal',
        domain: [
            '#647c8a',
            '#3f51b5',
            '#2196f3',
            '#00b862',
            '#afdf0a',
            '#a7b61a',
            '#f3e562',
            '#ff9800',
            '#ff5722',
            '#ff4514'
        ]
    },
    {
        name: 'natural',
        selectable: true,
        group: 'Ordinal',
        domain: [
            '#bf9d76',
            '#e99450',
            '#d89f59',
            '#f2dfa7',
            '#a5d7c6',
            '#7794b1',
            '#afafaf',
            '#707160',
            '#ba9383',
            '#d9d5c3'
        ]
    },
    {
        name: 'cool',
        selectable: true,
        group: 'Ordinal',
        domain: [
            '#a8385d',
            '#7aa3e5',
            '#a27ea8',
            '#aae3f5',
            '#adcded',
            '#a95963',
            '#8796c0',
            '#7ed3ed',
            '#50abcc',
            '#ad6886'
        ]
    },
    {
        name: 'fire',
        selectable: true,
        group: 'Ordinal',
        domain: ['#ff3d00', '#bf360c', '#ff8f00', '#ff6f00', '#ff5722', '#e65100', '#ffca28', '#ffab00']
    },
    {
        name: 'solar',
        selectable: true,
        group: 'Continuous',
        domain: [
            '#fff8e1',
            '#ffecb3',
            '#ffe082',
            '#ffd54f',
            '#ffca28',
            '#ffc107',
            '#ffb300',
            '#ffa000',
            '#ff8f00',
            '#ff6f00'
        ]
    },
    {
        name: 'air',
        selectable: true,
        group: 'Continuous',
        domain: [
            '#e1f5fe',
            '#b3e5fc',
            '#81d4fa',
            '#4fc3f7',
            '#29b6f6',
            '#03a9f4',
            '#039be5',
            '#0288d1',
            '#0277bd',
            '#01579b'
        ]
    },
    {
        name: 'aqua',
        selectable: true,
        group: 'Continuous',
        domain: [
            '#e0f7fa',
            '#b2ebf2',
            '#80deea',
            '#4dd0e1',
            '#26c6da',
            '#00bcd4',
            '#00acc1',
            '#0097a7',
            '#00838f',
            '#006064'
        ]
    },
    {
        name: 'flame',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#A10A28',
            '#D3342D',
            '#EF6D49',
            '#FAAD67',
            '#FDDE90',
            '#DBED91',
            '#A9D770',
            '#6CBA67',
            '#2C9653',
            '#146738'
        ]
    },
    {
        name: 'ocean',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#1D68FB',
            '#33C0FC',
            '#4AFFFE',
            '#AFFFFF',
            '#FFFC63',
            '#FDBD2D',
            '#FC8A25',
            '#FA4F1E',
            '#FA141B',
            '#BA38D1'
        ]
    },
    {
        name: 'forest',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#55C22D',
            '#C1F33D',
            '#3CC099',
            '#AFFFFF',
            '#8CFC9D',
            '#76CFFA',
            '#BA60FB',
            '#EE6490',
            '#C42A1C',
            '#FC9F32'
        ]
    },
    {
        name: 'horizon',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#2597FB',
            '#65EBFD',
            '#99FDD0',
            '#FCEE4B',
            '#FEFCFA',
            '#FDD6E3',
            '#FCB1A8',
            '#EF6F7B',
            '#CB96E8',
            '#EFDEE0'
        ]
    },
    {
        name: 'neons',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#FF3333',
            '#FF33FF',
            '#CC33FF',
            '#0000FF',
            '#33CCFF',
            '#33FFFF',
            '#33FF66',
            '#CCFF33',
            '#FFCC00',
            '#FF6600'
        ]
    },
    {
        name: 'picnic',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#FAC51D',
            '#66BD6D',
            '#FAA026',
            '#29BB9C',
            '#E96B56',
            '#55ACD2',
            '#B7332F',
            '#2C83C9',
            '#9166B8',
            '#92E7E8'
        ]
    },
    {
        name: 'night',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#2B1B5A',
            '#501356',
            '#183356',
            '#28203F',
            '#391B3C',
            '#1E2B3C',
            '#120634',
            '#2D0432',
            '#051932',
            '#453080',
            '#75267D',
            '#2C507D',
            '#4B3880',
            '#752F7D',
            '#35547D'
        ]
    },
    {
        name: 'nightLights',
        selectable: false,
        group: 'Ordinal',
        domain: [
            '#4e31a5',
            '#9c25a7',
            '#3065ab',
            '#57468b',
            '#904497',
            '#46648b',
            '#32118d',
            '#a00fb3',
            '#1052a2',
            '#6e51bd',
            '#b63cc3',
            '#6c97cb',
            '#8671c1',
            '#b455be',
            '#7496c3'
        ]
    }
];

class ColorHelper {
    scale;
    colorDomain;
    domain;
    customColors;
    constructor(scheme, domain, customColors) {
        if (typeof scheme === 'string') {
            scheme = colorSets.find(cs => {
                return cs.name === scheme;
            });
        }
        this.colorDomain = scheme.domain;
        this.domain = domain;
        this.customColors = customColors;
        this.scale = this.generateColorScheme(scheme, this.domain);
    }
    generateColorScheme(scheme, domain) {
        if (typeof scheme === 'string') {
            scheme = colorSets.find(cs => {
                return cs.name === scheme;
            });
        }
        return scaleOrdinal().range(scheme.domain).domain(domain);
    }
    getColor(value) {
        if (value === undefined || value === null) {
            throw new Error('Value can not be null');
        }
        if (typeof this.customColors === 'function') {
            return this.customColors(value);
        }
        const formattedValue = value.toString();
        let found; // todo type customColors
        if (this.customColors && this.customColors.length > 0) {
            found = this.customColors.find(mapping => {
                return mapping.name.toLowerCase() === formattedValue.toLowerCase();
            });
        }
        if (found) {
            return found.value;
        }
        else {
            return this.scale(value);
        }
    }
}

function calculateViewDimensions({ width, height }) {
    let chartWidth = width;
    let chartHeight = height;
    chartWidth = Math.max(0, chartWidth);
    chartHeight = Math.max(0, chartHeight);
    return {
        width: Math.floor(chartWidth),
        height: Math.floor(chartHeight)
    };
}

/**
 * Visibility Observer
 */
class VisibilityObserver {
    element;
    zone;
    visible = new EventEmitter();
    timeout;
    isVisible = false;
    constructor(element, zone) {
        this.element = element;
        this.zone = zone;
        this.runCheck();
    }
    destroy() {
        clearTimeout(this.timeout);
    }
    onVisibilityChange() {
        // trigger zone recalc for columns
        this.zone.run(() => {
            this.isVisible = true;
            this.visible.emit(true);
        });
    }
    runCheck() {
        const check = () => {
            if (!this.element) {
                return;
            }
            // https://davidwalsh.name/offsetheight-visibility
            const { offsetHeight, offsetWidth } = this.element.nativeElement;
            if (offsetHeight && offsetWidth) {
                clearTimeout(this.timeout);
                this.onVisibilityChange();
            }
            else {
                clearTimeout(this.timeout);
                this.zone.runOutsideAngular(() => {
                    this.timeout = setTimeout(() => check(), 100);
                });
            }
        };
        this.zone.runOutsideAngular(() => {
            this.timeout = setTimeout(() => check());
        });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: VisibilityObserver, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.1.5", type: VisibilityObserver, selector: "visibility-observer", outputs: { visible: "visible" }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: VisibilityObserver, decorators: [{
            type: Directive,
            args: [{
                    // tslint:disable-next-line:directive-selector
                    selector: 'visibility-observer'
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }], propDecorators: { visible: [{
                type: Output
            }] } });

var Orientation;
(function (Orientation) {
    Orientation["LEFT_TO_RIGHT"] = "LR";
    Orientation["RIGHT_TO_LEFT"] = "RL";
    Orientation["TOP_TO_BOTTOM"] = "TB";
    Orientation["BOTTOM_TO_TOM"] = "BT";
})(Orientation || (Orientation = {}));
var Alignment;
(function (Alignment) {
    Alignment["CENTER"] = "C";
    Alignment["UP_LEFT"] = "UL";
    Alignment["UP_RIGHT"] = "UR";
    Alignment["DOWN_LEFT"] = "DL";
    Alignment["DOWN_RIGHT"] = "DR";
})(Alignment || (Alignment = {}));
class DagreLayout {
    defaultSettings = {
        orientation: Orientation.LEFT_TO_RIGHT,
        marginX: 20,
        marginY: 20,
        edgePadding: 100,
        rankPadding: 100,
        nodePadding: 50,
        multigraph: true,
        compound: true
    };
    settings = {};
    dagreGraph;
    dagreNodes;
    dagreEdges;
    run(graph) {
        this.createDagreGraph(graph);
        dagre.layout(this.dagreGraph);
        graph.edgeLabels = this.dagreGraph._edgeLabels;
        for (const dagreNodeId in this.dagreGraph._nodes) {
            const dagreNode = this.dagreGraph._nodes[dagreNodeId];
            const node = graph.nodes.find(n => n.id === dagreNode.id);
            node.position = {
                x: dagreNode.x,
                y: dagreNode.y
            };
            node.dimension = {
                width: dagreNode.width,
                height: dagreNode.height
            };
        }
        return graph;
    }
    updateEdge(graph, edge) {
        const sourceNode = graph.nodes.find(n => n.id === edge.source);
        const targetNode = graph.nodes.find(n => n.id === edge.target);
        // determine new arrow position
        const dir = sourceNode.position.y <= targetNode.position.y ? -1 : 1;
        const startingPoint = {
            x: sourceNode.position.x,
            y: sourceNode.position.y - dir * (sourceNode.dimension.height / 2)
        };
        const endingPoint = {
            x: targetNode.position.x,
            y: targetNode.position.y + dir * (targetNode.dimension.height / 2)
        };
        // generate new points
        edge.points = [startingPoint, endingPoint];
        return graph;
    }
    createDagreGraph(graph) {
        const settings = Object.assign({}, this.defaultSettings, this.settings);
        this.dagreGraph = new dagre.graphlib.Graph({ compound: settings.compound, multigraph: settings.multigraph });
        this.dagreGraph.setGraph({
            rankdir: settings.orientation,
            marginx: settings.marginX,
            marginy: settings.marginY,
            edgesep: settings.edgePadding,
            ranksep: settings.rankPadding,
            nodesep: settings.nodePadding,
            align: settings.align,
            acyclicer: settings.acyclicer,
            ranker: settings.ranker,
            multigraph: settings.multigraph,
            compound: settings.compound
        });
        // Default to assigning a new object as a label for each new edge.
        this.dagreGraph.setDefaultEdgeLabel(() => {
            return {
            /* empty */
            };
        });
        this.dagreNodes = graph.nodes.map(n => {
            const node = Object.assign({}, n);
            node.width = n.dimension.width;
            node.height = n.dimension.height;
            node.x = n.position.x;
            node.y = n.position.y;
            return node;
        });
        this.dagreEdges = graph.edges.map(l => {
            const newLink = Object.assign({}, l);
            if (!newLink.id) {
                newLink.id = id();
            }
            return newLink;
        });
        for (const node of this.dagreNodes) {
            if (!node.width) {
                node.width = 20;
            }
            if (!node.height) {
                node.height = 30;
            }
            // update dagre
            this.dagreGraph.setNode(node.id, node);
        }
        // update dagre
        for (const edge of this.dagreEdges) {
            if (settings.multigraph) {
                this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
            }
            else {
                this.dagreGraph.setEdge(edge.source, edge.target);
            }
        }
        return this.dagreGraph;
    }
}

class DagreClusterLayout {
    defaultSettings = {
        orientation: Orientation.LEFT_TO_RIGHT,
        marginX: 20,
        marginY: 20,
        edgePadding: 100,
        rankPadding: 100,
        nodePadding: 50,
        multigraph: true,
        compound: true
    };
    settings = {};
    dagreGraph;
    dagreNodes;
    dagreClusters;
    dagreEdges;
    run(graph) {
        this.createDagreGraph(graph);
        dagre.layout(this.dagreGraph);
        graph.edgeLabels = this.dagreGraph._edgeLabels;
        const dagreToOutput = node => {
            const dagreNode = this.dagreGraph._nodes[node.id];
            return {
                ...node,
                position: {
                    x: dagreNode.x,
                    y: dagreNode.y
                },
                dimension: {
                    width: dagreNode.width,
                    height: dagreNode.height
                }
            };
        };
        graph.clusters = (graph.clusters || []).map(dagreToOutput);
        graph.nodes = graph.nodes.map(dagreToOutput);
        return graph;
    }
    updateEdge(graph, edge) {
        const sourceNode = graph.nodes.find(n => n.id === edge.source);
        const targetNode = graph.nodes.find(n => n.id === edge.target);
        // determine new arrow position
        const dir = sourceNode.position.y <= targetNode.position.y ? -1 : 1;
        const startingPoint = {
            x: sourceNode.position.x,
            y: sourceNode.position.y - dir * (sourceNode.dimension.height / 2)
        };
        const endingPoint = {
            x: targetNode.position.x,
            y: targetNode.position.y + dir * (targetNode.dimension.height / 2)
        };
        // generate new points
        edge.points = [startingPoint, endingPoint];
        return graph;
    }
    createDagreGraph(graph) {
        const settings = Object.assign({}, this.defaultSettings, this.settings);
        this.dagreGraph = new dagre.graphlib.Graph({ compound: settings.compound, multigraph: settings.multigraph });
        this.dagreGraph.setGraph({
            rankdir: settings.orientation,
            marginx: settings.marginX,
            marginy: settings.marginY,
            edgesep: settings.edgePadding,
            ranksep: settings.rankPadding,
            nodesep: settings.nodePadding,
            align: settings.align,
            acyclicer: settings.acyclicer,
            ranker: settings.ranker,
            multigraph: settings.multigraph,
            compound: settings.compound
        });
        // Default to assigning a new object as a label for each new edge.
        this.dagreGraph.setDefaultEdgeLabel(() => {
            return {
            /* empty */
            };
        });
        this.dagreNodes = graph.nodes.map((n) => {
            const node = Object.assign({}, n);
            node.width = n.dimension.width;
            node.height = n.dimension.height;
            node.x = n.position.x;
            node.y = n.position.y;
            return node;
        });
        this.dagreClusters = graph.clusters || [];
        this.dagreEdges = graph.edges.map(l => {
            const newLink = Object.assign({}, l);
            if (!newLink.id) {
                newLink.id = id();
            }
            return newLink;
        });
        for (const node of this.dagreNodes) {
            this.dagreGraph.setNode(node.id, node);
        }
        for (const cluster of this.dagreClusters) {
            this.dagreGraph.setNode(cluster.id, cluster);
            cluster.childNodeIds.forEach(childNodeId => {
                this.dagreGraph.setParent(childNodeId, cluster.id);
            });
        }
        // update dagre
        for (const edge of this.dagreEdges) {
            if (settings.multigraph) {
                this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
            }
            else {
                this.dagreGraph.setEdge(edge.source, edge.target);
            }
        }
        return this.dagreGraph;
    }
}

const DEFAULT_EDGE_NAME = '\x00';
const GRAPH_NODE = '\x00';
const EDGE_KEY_DELIM = '\x01';
class DagreNodesOnlyLayout {
    defaultSettings = {
        orientation: Orientation.LEFT_TO_RIGHT,
        marginX: 20,
        marginY: 20,
        edgePadding: 100,
        rankPadding: 100,
        nodePadding: 50,
        curveDistance: 20,
        multigraph: true,
        compound: true
    };
    settings = {};
    dagreGraph;
    dagreNodes;
    dagreEdges;
    run(graph) {
        this.createDagreGraph(graph);
        dagre.layout(this.dagreGraph);
        graph.edgeLabels = this.dagreGraph._edgeLabels;
        for (const dagreNodeId in this.dagreGraph._nodes) {
            const dagreNode = this.dagreGraph._nodes[dagreNodeId];
            const node = graph.nodes.find(n => n.id === dagreNode.id);
            node.position = {
                x: dagreNode.x,
                y: dagreNode.y
            };
            node.dimension = {
                width: dagreNode.width,
                height: dagreNode.height
            };
        }
        for (const edge of graph.edges) {
            this.updateEdge(graph, edge);
        }
        return graph;
    }
    updateEdge(graph, edge) {
        const sourceNode = graph.nodes.find(n => n.id === edge.source);
        const targetNode = graph.nodes.find(n => n.id === edge.target);
        const rankAxis = this.settings.orientation === 'BT' || this.settings.orientation === 'TB' ? 'y' : 'x';
        const orderAxis = rankAxis === 'y' ? 'x' : 'y';
        const rankDimension = rankAxis === 'y' ? 'height' : 'width';
        // determine new arrow position
        const dir = sourceNode.position[rankAxis] <= targetNode.position[rankAxis] ? -1 : 1;
        const startingPoint = {
            [orderAxis]: sourceNode.position[orderAxis],
            [rankAxis]: sourceNode.position[rankAxis] - dir * (sourceNode.dimension[rankDimension] / 2)
        };
        const endingPoint = {
            [orderAxis]: targetNode.position[orderAxis],
            [rankAxis]: targetNode.position[rankAxis] + dir * (targetNode.dimension[rankDimension] / 2)
        };
        const curveDistance = this.settings.curveDistance || this.defaultSettings.curveDistance;
        // generate new points
        edge.points = [
            startingPoint,
            {
                [orderAxis]: startingPoint[orderAxis],
                [rankAxis]: startingPoint[rankAxis] - dir * curveDistance
            },
            {
                [orderAxis]: endingPoint[orderAxis],
                [rankAxis]: endingPoint[rankAxis] + dir * curveDistance
            },
            endingPoint
        ];
        const edgeLabelId = `${edge.source}${EDGE_KEY_DELIM}${edge.target}${EDGE_KEY_DELIM}${DEFAULT_EDGE_NAME}`;
        const matchingEdgeLabel = graph.edgeLabels[edgeLabelId];
        if (matchingEdgeLabel) {
            matchingEdgeLabel.points = edge.points;
        }
        return graph;
    }
    createDagreGraph(graph) {
        const settings = Object.assign({}, this.defaultSettings, this.settings);
        this.dagreGraph = new dagre.graphlib.Graph({ compound: settings.compound, multigraph: settings.multigraph });
        this.dagreGraph.setGraph({
            rankdir: settings.orientation,
            marginx: settings.marginX,
            marginy: settings.marginY,
            edgesep: settings.edgePadding,
            ranksep: settings.rankPadding,
            nodesep: settings.nodePadding,
            align: settings.align,
            acyclicer: settings.acyclicer,
            ranker: settings.ranker,
            multigraph: settings.multigraph,
            compound: settings.compound
        });
        // Default to assigning a new object as a label for each new edge.
        this.dagreGraph.setDefaultEdgeLabel(() => {
            return {
            /* empty */
            };
        });
        this.dagreNodes = graph.nodes.map(n => {
            const node = Object.assign({}, n);
            node.width = n.dimension.width;
            node.height = n.dimension.height;
            node.x = n.position.x;
            node.y = n.position.y;
            return node;
        });
        this.dagreEdges = graph.edges.map(l => {
            const newLink = Object.assign({}, l);
            if (!newLink.id) {
                newLink.id = id();
            }
            return newLink;
        });
        for (const node of this.dagreNodes) {
            if (!node.width) {
                node.width = 20;
            }
            if (!node.height) {
                node.height = 30;
            }
            // update dagre
            this.dagreGraph.setNode(node.id, node);
        }
        // update dagre
        for (const edge of this.dagreEdges) {
            if (settings.multigraph) {
                this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
            }
            else {
                this.dagreGraph.setEdge(edge.source, edge.target);
            }
        }
        return this.dagreGraph;
    }
}

function toD3Node(maybeNode) {
    if (typeof maybeNode === 'string') {
        return {
            id: maybeNode,
            x: 0,
            y: 0
        };
    }
    return maybeNode;
}
class D3ForceDirectedLayout {
    defaultSettings = {
        force: forceSimulation().force('charge', forceManyBody().strength(-150)).force('collide', forceCollide(5)),
        forceLink: forceLink()
            .id(node => node.id)
            .distance(() => 100)
    };
    settings = {};
    inputGraph;
    outputGraph;
    d3Graph;
    outputGraph$ = new Subject();
    draggingStart;
    run(graph) {
        this.inputGraph = graph;
        this.d3Graph = {
            nodes: [...this.inputGraph.nodes.map(n => ({ ...n }))],
            edges: [...this.inputGraph.edges.map(e => ({ ...e }))]
        };
        this.outputGraph = {
            nodes: [],
            edges: [],
            edgeLabels: []
        };
        this.outputGraph$.next(this.outputGraph);
        this.settings = Object.assign({}, this.defaultSettings, this.settings);
        if (this.settings.force) {
            this.settings.force
                .nodes(this.d3Graph.nodes)
                .force('link', this.settings.forceLink.links(this.d3Graph.edges))
                .alpha(0.5)
                .restart()
                .on('tick', () => {
                this.outputGraph$.next(this.d3GraphToOutputGraph(this.d3Graph));
            });
        }
        return this.outputGraph$.asObservable();
    }
    updateEdge(graph, edge) {
        const settings = Object.assign({}, this.defaultSettings, this.settings);
        if (settings.force) {
            settings.force
                .nodes(this.d3Graph.nodes)
                .force('link', settings.forceLink.links(this.d3Graph.edges))
                .alpha(0.5)
                .restart()
                .on('tick', () => {
                this.outputGraph$.next(this.d3GraphToOutputGraph(this.d3Graph));
            });
        }
        return this.outputGraph$.asObservable();
    }
    d3GraphToOutputGraph(d3Graph) {
        this.outputGraph.nodes = this.d3Graph.nodes.map((node) => ({
            ...node,
            id: node.id || id(),
            position: {
                x: node.x,
                y: node.y
            },
            dimension: {
                width: (node.dimension && node.dimension.width) || 20,
                height: (node.dimension && node.dimension.height) || 20
            },
            transform: `translate(${node.x - ((node.dimension && node.dimension.width) || 20) / 2 || 0}, ${node.y - ((node.dimension && node.dimension.height) || 20) / 2 || 0})`
        }));
        this.outputGraph.edges = this.d3Graph.edges.map(edge => ({
            ...edge,
            source: toD3Node(edge.source).id,
            target: toD3Node(edge.target).id,
            points: [
                {
                    x: toD3Node(edge.source).x,
                    y: toD3Node(edge.source).y
                },
                {
                    x: toD3Node(edge.target).x,
                    y: toD3Node(edge.target).y
                }
            ]
        }));
        this.outputGraph.edgeLabels = this.outputGraph.edges;
        return this.outputGraph;
    }
    onDragStart(draggingNode, $event) {
        this.settings.force.alphaTarget(0.3).restart();
        const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
        if (!node) {
            return;
        }
        this.draggingStart = { x: $event.x - node.x, y: $event.y - node.y };
        node.fx = $event.x - this.draggingStart.x;
        node.fy = $event.y - this.draggingStart.y;
    }
    onDrag(draggingNode, $event) {
        if (!draggingNode) {
            return;
        }
        const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
        if (!node) {
            return;
        }
        node.fx = $event.x - this.draggingStart.x;
        node.fy = $event.y - this.draggingStart.y;
    }
    onDragEnd(draggingNode, $event) {
        if (!draggingNode) {
            return;
        }
        const node = this.d3Graph.nodes.find(d3Node => d3Node.id === draggingNode.id);
        if (!node) {
            return;
        }
        this.settings.force.alphaTarget(0);
        node.fx = undefined;
        node.fy = undefined;
    }
}

function toNode(nodes, nodeRef) {
    if (typeof nodeRef === 'number') {
        return nodes[nodeRef];
    }
    return nodeRef;
}
class ColaForceDirectedLayout {
    defaultSettings = {
        force: d3adaptor({
            ...d3Dispatch,
            ...d3Force,
            ...d3Timer
        })
            .linkDistance(150)
            .avoidOverlaps(true),
        viewDimensions: {
            width: 600,
            height: 600
        }
    };
    settings = {};
    inputGraph;
    outputGraph;
    internalGraph;
    outputGraph$ = new Subject();
    draggingStart;
    run(graph) {
        this.inputGraph = graph;
        if (!this.inputGraph.clusters) {
            this.inputGraph.clusters = [];
        }
        this.internalGraph = {
            nodes: [
                ...this.inputGraph.nodes.map(n => ({
                    ...n,
                    width: n.dimension ? n.dimension.width : 20,
                    height: n.dimension ? n.dimension.height : 20
                }))
            ],
            groups: [
                ...this.inputGraph.clusters.map((cluster) => ({
                    padding: 5,
                    groups: cluster.childNodeIds
                        .map(nodeId => this.inputGraph.clusters.findIndex(node => node.id === nodeId))
                        .filter(x => x >= 0),
                    leaves: cluster.childNodeIds
                        .map(nodeId => this.inputGraph.nodes.findIndex(node => node.id === nodeId))
                        .filter(x => x >= 0)
                }))
            ],
            links: [
                ...this.inputGraph.edges
                    .map(e => {
                    const sourceNodeIndex = this.inputGraph.nodes.findIndex(node => e.source === node.id);
                    const targetNodeIndex = this.inputGraph.nodes.findIndex(node => e.target === node.id);
                    if (sourceNodeIndex === -1 || targetNodeIndex === -1) {
                        return undefined;
                    }
                    return {
                        ...e,
                        source: sourceNodeIndex,
                        target: targetNodeIndex
                    };
                })
                    .filter(x => !!x)
            ],
            groupLinks: [
                ...this.inputGraph.edges
                    .map(e => {
                    const sourceNodeIndex = this.inputGraph.nodes.findIndex(node => e.source === node.id);
                    const targetNodeIndex = this.inputGraph.nodes.findIndex(node => e.target === node.id);
                    if (sourceNodeIndex >= 0 && targetNodeIndex >= 0) {
                        return undefined;
                    }
                    return e;
                })
                    .filter(x => !!x)
            ]
        };
        this.outputGraph = {
            nodes: [],
            clusters: [],
            edges: [],
            edgeLabels: []
        };
        this.outputGraph$.next(this.outputGraph);
        this.settings = Object.assign({}, this.defaultSettings, this.settings);
        if (this.settings.force) {
            this.settings.force = this.settings.force
                .nodes(this.internalGraph.nodes)
                .groups(this.internalGraph.groups)
                .links(this.internalGraph.links)
                .alpha(0.5)
                .on('tick', () => {
                if (this.settings.onTickListener) {
                    this.settings.onTickListener(this.internalGraph);
                }
                this.outputGraph$.next(this.internalGraphToOutputGraph(this.internalGraph));
            });
            if (this.settings.viewDimensions) {
                this.settings.force = this.settings.force.size([
                    this.settings.viewDimensions.width,
                    this.settings.viewDimensions.height
                ]);
            }
            if (this.settings.forceModifierFn) {
                this.settings.force = this.settings.forceModifierFn(this.settings.force);
            }
            this.settings.force.start();
        }
        return this.outputGraph$.asObservable();
    }
    updateEdge(graph, edge) {
        const settings = Object.assign({}, this.defaultSettings, this.settings);
        if (settings.force) {
            settings.force.start();
        }
        return this.outputGraph$.asObservable();
    }
    internalGraphToOutputGraph(internalGraph) {
        this.outputGraph.nodes = internalGraph.nodes.map(node => ({
            ...node,
            id: node.id || id(),
            position: {
                x: node.x,
                y: node.y
            },
            dimension: {
                width: (node.dimension && node.dimension.width) || 20,
                height: (node.dimension && node.dimension.height) || 20
            },
            transform: `translate(${node.x - ((node.dimension && node.dimension.width) || 20) / 2 || 0}, ${node.y - ((node.dimension && node.dimension.height) || 20) / 2 || 0})`
        }));
        this.outputGraph.edges = internalGraph.links
            .map(edge => {
            const source = toNode(internalGraph.nodes, edge.source);
            const target = toNode(internalGraph.nodes, edge.target);
            return {
                ...edge,
                source: source.id,
                target: target.id,
                points: [
                    source.bounds.rayIntersection(target.bounds.cx(), target.bounds.cy()),
                    target.bounds.rayIntersection(source.bounds.cx(), source.bounds.cy())
                ]
            };
        })
            .concat(internalGraph.groupLinks.map(groupLink => {
            const sourceNode = internalGraph.nodes.find(foundNode => foundNode.id === groupLink.source);
            const targetNode = internalGraph.nodes.find(foundNode => foundNode.id === groupLink.target);
            const source = sourceNode || internalGraph.groups.find(foundGroup => foundGroup.id === groupLink.source);
            const target = targetNode || internalGraph.groups.find(foundGroup => foundGroup.id === groupLink.target);
            return {
                ...groupLink,
                source: source.id,
                target: target.id,
                points: [
                    source.bounds.rayIntersection(target.bounds.cx(), target.bounds.cy()),
                    target.bounds.rayIntersection(source.bounds.cx(), source.bounds.cy())
                ]
            };
        }));
        this.outputGraph.clusters = internalGraph.groups.map((group, index) => {
            const inputGroup = this.inputGraph.clusters[index];
            return {
                ...inputGroup,
                dimension: {
                    width: group.bounds ? group.bounds.width() : 20,
                    height: group.bounds ? group.bounds.height() : 20
                },
                position: {
                    x: group.bounds ? group.bounds.x + group.bounds.width() / 2 : 0,
                    y: group.bounds ? group.bounds.y + group.bounds.height() / 2 : 0
                }
            };
        });
        this.outputGraph.edgeLabels = this.outputGraph.edges;
        return this.outputGraph;
    }
    onDragStart(draggingNode, $event) {
        const nodeIndex = this.outputGraph.nodes.findIndex(foundNode => foundNode.id === draggingNode.id);
        const node = this.internalGraph.nodes[nodeIndex];
        if (!node) {
            return;
        }
        this.draggingStart = { x: node.x - $event.x, y: node.y - $event.y };
        node.fixed = 1;
        this.settings.force.start();
    }
    onDrag(draggingNode, $event) {
        if (!draggingNode) {
            return;
        }
        const nodeIndex = this.outputGraph.nodes.findIndex(foundNode => foundNode.id === draggingNode.id);
        const node = this.internalGraph.nodes[nodeIndex];
        if (!node) {
            return;
        }
        node.x = this.draggingStart.x + $event.x;
        node.y = this.draggingStart.y + $event.y;
    }
    onDragEnd(draggingNode, $event) {
        if (!draggingNode) {
            return;
        }
        const nodeIndex = this.outputGraph.nodes.findIndex(foundNode => foundNode.id === draggingNode.id);
        const node = this.internalGraph.nodes[nodeIndex];
        if (!node) {
            return;
        }
        node.fixed = 0;
    }
}

const layouts = {
    dagre: DagreLayout,
    dagreCluster: DagreClusterLayout,
    dagreNodesOnly: DagreNodesOnlyLayout,
    d3ForceDirected: D3ForceDirectedLayout,
    colaForceDirected: ColaForceDirectedLayout
};
class LayoutService {
    getLayout(name) {
        if (layouts[name]) {
            return new layouts[name]();
        }
        else {
            throw new Error(`Unknown layout type '${name}'`);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: LayoutService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: LayoutService });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: LayoutService, decorators: [{
            type: Injectable
        }] });

/**
 * Mousewheel directive
 * https://github.com/SodhanaLibrary/angular2-examples/blob/master/app/mouseWheelDirective/mousewheel.directive.ts
 *
 * @export
 */
// tslint:disable-next-line: directive-selector
class MouseWheelDirective {
    mouseWheelUp = new EventEmitter();
    mouseWheelDown = new EventEmitter();
    onMouseWheelChrome(event) {
        this.mouseWheelFunc(event);
    }
    onMouseWheelFirefox(event) {
        this.mouseWheelFunc(event);
    }
    onWheel(event) {
        this.mouseWheelFunc(event);
    }
    onMouseWheelIE(event) {
        this.mouseWheelFunc(event);
    }
    mouseWheelFunc(event) {
        if (window.event) {
            event = window.event;
        }
        const delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail || event.deltaY || event.deltaX));
        // Firefox don't have native support for wheel event, as a result delta values are reverse
        const isWheelMouseUp = event.wheelDelta ? delta > 0 : delta < 0;
        const isWheelMouseDown = event.wheelDelta ? delta < 0 : delta > 0;
        if (isWheelMouseUp) {
            this.mouseWheelUp.emit(event);
        }
        else if (isWheelMouseDown) {
            this.mouseWheelDown.emit(event);
        }
        // for IE
        event.returnValue = false;
        // for Chrome and Firefox
        if (event.preventDefault) {
            event.preventDefault();
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: MouseWheelDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "18.1.5", type: MouseWheelDirective, selector: "[mouseWheel]", outputs: { mouseWheelUp: "mouseWheelUp", mouseWheelDown: "mouseWheelDown" }, host: { listeners: { "mousewheel": "onMouseWheelChrome($event)", "DOMMouseScroll": "onMouseWheelFirefox($event)", "wheel": "onWheel($event)", "onmousewheel": "onMouseWheelIE($event)" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: MouseWheelDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[mouseWheel]' }]
        }], propDecorators: { mouseWheelUp: [{
                type: Output
            }], mouseWheelDown: [{
                type: Output
            }], onMouseWheelChrome: [{
                type: HostListener,
                args: ['mousewheel', ['$event']]
            }], onMouseWheelFirefox: [{
                type: HostListener,
                args: ['DOMMouseScroll', ['$event']]
            }], onWheel: [{
                type: HostListener,
                args: ['wheel', ['$event']]
            }], onMouseWheelIE: [{
                type: HostListener,
                args: ['onmousewheel', ['$event']]
            }] } });

var NgxGraphStates;
(function (NgxGraphStates) {
    NgxGraphStates["Init"] = "init";
    NgxGraphStates["Subscribe"] = "subscribe";
    NgxGraphStates["Transform"] = "transform";
    /* eslint-disable @typescript-eslint/no-shadow */
    NgxGraphStates["Output"] = "output";
})(NgxGraphStates || (NgxGraphStates = {}));
class GraphComponent {
    el;
    zone;
    cd;
    layoutService;
    nodes = [];
    clusters = [];
    compoundNodes = [];
    links = [];
    activeEntries = [];
    curve;
    draggingEnabled = true;
    nodeHeight;
    nodeMaxHeight;
    nodeMinHeight;
    nodeWidth;
    nodeMinWidth;
    nodeMaxWidth;
    panningEnabled = true;
    panningAxis = PanningAxis.Both;
    enableZoom = true;
    zoomSpeed = 0.1;
    minZoomLevel = 0.1;
    maxZoomLevel = 4.0;
    autoZoom = false;
    panOnZoom = true;
    animate = false;
    autoCenter = false;
    update$;
    center$;
    zoomToFit$;
    panToNode$;
    layout;
    layoutSettings;
    enableTrackpadSupport = false;
    showMiniMap = false;
    miniMapMaxWidth = 100;
    miniMapMaxHeight;
    miniMapPosition = MiniMapPosition.UpperRight;
    view;
    scheme = 'cool';
    customColors;
    deferDisplayUntilPosition = false;
    centerNodesOnPositionChange = true;
    enablePreUpdateTransform = true;
    select = new EventEmitter();
    activate = new EventEmitter();
    deactivate = new EventEmitter();
    zoomChange = new EventEmitter();
    clickHandler = new EventEmitter();
    stateChange = new EventEmitter();
    linkTemplate;
    nodeTemplate;
    clusterTemplate;
    defsTemplate;
    miniMapNodeTemplate;
    nodeElements;
    linkElements;
    chartWidth;
    isMouseMoveCalled = false;
    graphSubscription = new Subscription();
    colors;
    dims;
    seriesDomain;
    transform;
    isPanning = false;
    isDragging = false;
    draggingNode;
    initialized = false;
    graph;
    graphDims = { width: 0, height: 0 };
    _oldLinks = [];
    oldNodes = new Set();
    oldClusters = new Set();
    oldCompoundNodes = new Set();
    transformationMatrix = identity();
    _touchLastX = null;
    _touchLastY = null;
    minimapScaleCoefficient = 3;
    minimapTransform;
    minimapOffsetX = 0;
    minimapOffsetY = 0;
    isMinimapPanning = false;
    minimapClipPathId;
    width;
    height;
    resizeSubscription;
    visibilityObserver;
    destroy$ = new Subject();
    constructor(el, zone, cd, layoutService) {
        this.el = el;
        this.zone = zone;
        this.cd = cd;
        this.layoutService = layoutService;
    }
    groupResultsBy = node => node.label;
    /**
     * Get the current zoom level
     */
    get zoomLevel() {
        return this.transformationMatrix.a;
    }
    /**
     * Set the current zoom level
     */
    set zoomLevel(level) {
        this.zoomTo(Number(level));
    }
    /**
     * Get the current `x` position of the graph
     */
    get panOffsetX() {
        return this.transformationMatrix.e;
    }
    /**
     * Set the current `x` position of the graph
     */
    set panOffsetX(x) {
        this.panTo(Number(x), null);
    }
    /**
     * Get the current `y` position of the graph
     */
    get panOffsetY() {
        return this.transformationMatrix.f;
    }
    /**
     * Set the current `y` position of the graph
     */
    set panOffsetY(y) {
        this.panTo(null, Number(y));
    }
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngOnInit() {
        if (this.update$) {
            this.update$.pipe(takeUntil(this.destroy$)).subscribe(() => {
                this.update();
            });
        }
        if (this.center$) {
            this.center$.pipe(takeUntil(this.destroy$)).subscribe(() => {
                this.center();
            });
        }
        if (this.zoomToFit$) {
            this.zoomToFit$.pipe(takeUntil(this.destroy$)).subscribe(options => {
                this.zoomToFit(options ? options : {});
            });
        }
        if (this.panToNode$) {
            this.panToNode$.pipe(takeUntil(this.destroy$)).subscribe((nodeId) => {
                this.panToNodeId(nodeId);
            });
        }
        this.minimapClipPathId = `minimapClip${id()}`;
        this.stateChange.emit({ state: NgxGraphStates.Subscribe });
    }
    ngOnChanges(changes) {
        this.basicUpdate();
        const { layoutSettings } = changes;
        this.setLayout(this.layout);
        if (layoutSettings) {
            this.setLayoutSettings(this.layoutSettings);
        }
        if (this.layout && this.nodes && this.links) {
            this.update();
        }
    }
    setLayout(layout) {
        this.initialized = false;
        if (!layout) {
            layout = 'dagre';
        }
        if (typeof layout === 'string') {
            this.layout = this.layoutService.getLayout(layout);
            this.setLayoutSettings(this.layoutSettings);
        }
    }
    setLayoutSettings(settings) {
        if (this.layout && typeof this.layout !== 'string') {
            this.layout.settings = settings;
        }
    }
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngOnDestroy() {
        this.unbindEvents();
        if (this.visibilityObserver) {
            this.visibilityObserver.visible.unsubscribe();
            this.visibilityObserver.destroy();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngAfterViewInit() {
        this.bindWindowResizeEvent();
        // listen for visibility of the element for hidden by default scenario
        this.visibilityObserver = new VisibilityObserver(this.el, this.zone);
        this.visibilityObserver.visible.subscribe(this.update.bind(this));
        setTimeout(() => this.update());
    }
    /**
     * Base class update implementation for the dag graph
     *
     * @memberOf GraphComponent
     */
    update() {
        this.basicUpdate();
        if (!this.curve) {
            this.curve = shape.curveBundle.beta(1);
        }
        this.zone.run(() => {
            this.dims = calculateViewDimensions({
                width: this.width,
                height: this.height
            });
            this.seriesDomain = this.getSeriesDomain();
            this.setColors();
            this.createGraph();
            this.updateTransform();
            if (!this.initialized) {
                this.stateChange.emit({ state: NgxGraphStates.Init });
            }
            this.initialized = true;
        });
    }
    /**
     * Creates the dagre graph engine
     *
     * @memberOf GraphComponent
     */
    createGraph() {
        this.graphSubscription.unsubscribe();
        this.graphSubscription = new Subscription();
        const initializeNode = (n) => {
            if (!n.meta) {
                n.meta = {};
            }
            if (!n.id) {
                n.id = id();
            }
            if (!n.dimension) {
                n.dimension = {
                    width: this.nodeWidth ? this.nodeWidth : 30,
                    height: this.nodeHeight ? this.nodeHeight : 30
                };
                n.meta.forceDimensions = false;
            }
            else {
                n.meta.forceDimensions = n.meta.forceDimensions === undefined ? true : n.meta.forceDimensions;
            }
            if (!n.position) {
                n.position = {
                    x: 0,
                    y: 0
                };
                if (this.deferDisplayUntilPosition) {
                    n.hidden = true;
                }
            }
            n.data = n.data ? n.data : {};
            return n;
        };
        const initializeEdge = (e) => {
            if (!e.id) {
                e.id = id();
            }
            return e;
        };
        this.graph = {
            nodes: this.nodes.map(n => initializeNode(n)),
            clusters: this.clusters.map(n => initializeNode(n)),
            compoundNodes: this.compoundNodes.map(n => initializeNode(n)),
            edges: this.links.map(e => initializeEdge(e))
        };
        requestAnimationFrame(() => this.draw());
    }
    /**
     * Draws the graph using dagre layouts
     *
     *
     * @memberOf GraphComponent
     */
    draw() {
        // Recalculate the layout
        const result = this.layout.run(this.graph);
        const result$ = result instanceof Observable ? result : of(result);
        this.graphSubscription.add(result$.subscribe(graph => {
            this.graph = graph;
            this.tick();
        }));
    }
    tick() {
        // Transposes view options to the node
        const oldNodes = new Set();
        const oldClusters = new Set();
        const oldCompoundNodes = new Set();
        this.graph.nodes.forEach(n => {
            n.transform = `translate(${n.position.x - (this.centerNodesOnPositionChange ? n.dimension.width / 2 : 0) || 0}, ${n.position.y - (this.centerNodesOnPositionChange ? n.dimension.height / 2 : 0) || 0})`;
            if (!n.data) {
                n.data = {};
            }
            n.data.color = this.colors.getColor(this.groupResultsBy(n));
            if (this.deferDisplayUntilPosition) {
                n.hidden = false;
            }
            oldNodes.add(n.id);
        });
        (this.graph.clusters || []).forEach(n => {
            n.transform = `translate(${n.position.x - (this.centerNodesOnPositionChange ? n.dimension.width / 2 : 0) || 0}, ${n.position.y - (this.centerNodesOnPositionChange ? n.dimension.height / 2 : 0) || 0})`;
            if (!n.data) {
                n.data = {};
            }
            n.data.color = this.colors.getColor(this.groupResultsBy(n));
            if (this.deferDisplayUntilPosition) {
                n.hidden = false;
            }
            oldClusters.add(n.id);
        });
        (this.graph.compoundNodes || []).forEach(n => {
            n.transform = `translate(${n.position.x - (this.centerNodesOnPositionChange ? n.dimension.width / 2 : 0) || 0}, ${n.position.y - (this.centerNodesOnPositionChange ? n.dimension.height / 2 : 0) || 0})`;
            if (!n.data) {
                n.data = {};
            }
            n.data.color = this.colors.getColor(this.groupResultsBy(n));
            if (this.deferDisplayUntilPosition) {
                n.hidden = false;
            }
            oldCompoundNodes.add(n.id);
        });
        // Prevent animations on new nodes
        setTimeout(() => {
            this.oldNodes = oldNodes;
            this.oldClusters = oldClusters;
            this.oldCompoundNodes = oldCompoundNodes;
        }, 500);
        // Update the labels to the new positions
        const newLinks = [];
        for (const edgeLabelId in this.graph.edgeLabels) {
            const edgeLabel = this.graph.edgeLabels[edgeLabelId];
            const normKey = edgeLabelId.replace(/[^\w-]*/g, '');
            const isMultigraph = this.layout && typeof this.layout !== 'string' && this.layout.settings && this.layout.settings.multigraph;
            let oldLink = isMultigraph
                ? this._oldLinks.find(ol => `${ol.source}${ol.target}${ol.id}` === normKey)
                : this._oldLinks.find(ol => `${ol.source}${ol.target}` === normKey);
            const linkFromGraph = isMultigraph
                ? this.graph.edges.find(nl => `${nl.source}${nl.target}${nl.id}` === normKey)
                : this.graph.edges.find(nl => `${nl.source}${nl.target}` === normKey);
            if (!oldLink) {
                oldLink = linkFromGraph || edgeLabel;
            }
            else if (oldLink.data &&
                linkFromGraph &&
                linkFromGraph.data &&
                JSON.stringify(oldLink.data) !== JSON.stringify(linkFromGraph.data)) {
                // Compare old link to new link and replace if not equal
                oldLink.data = linkFromGraph.data;
            }
            oldLink.oldLine = oldLink.line;
            const points = edgeLabel.points;
            const line = this.generateLine(points);
            const newLink = Object.assign({}, oldLink);
            newLink.line = line;
            newLink.points = points;
            this.updateMidpointOnEdge(newLink, points);
            const textPos = points[Math.floor(points.length / 2)];
            if (textPos) {
                newLink.textTransform = `translate(${textPos.x || 0},${textPos.y || 0})`;
            }
            newLink.textAngle = 0;
            if (!newLink.oldLine) {
                newLink.oldLine = newLink.line;
            }
            this.calcDominantBaseline(newLink);
            newLinks.push(newLink);
        }
        this.graph.edges = newLinks;
        // Map the old links for animations
        if (this.graph.edges) {
            this._oldLinks = this.graph.edges.map(l => {
                const newL = Object.assign({}, l);
                newL.oldLine = l.line;
                return newL;
            });
        }
        this.applyNodeDimensions();
        this.redrawLines();
        this.updateMinimap();
        requestAnimationFrame(() => {
            this.applyNodeDimensions();
            this.redrawLines();
            this.updateMinimap();
            if (this.autoZoom) {
                this.zoomToFit({ autoCenter: this.autoCenter ? this.autoCenter : false });
            }
            else if (this.autoCenter) {
                // Auto-center when rendering
                this.center();
            }
            this.stateChange.emit({ state: NgxGraphStates.Output });
        });
        this.cd.markForCheck();
    }
    getMinimapTransform() {
        switch (this.miniMapPosition) {
            case MiniMapPosition.UpperLeft: {
                return '';
            }
            case MiniMapPosition.UpperRight: {
                return 'translate(' + (this.dims.width - this.graphDims.width / this.minimapScaleCoefficient) + ',' + 0 + ')';
            }
            default: {
                return '';
            }
        }
    }
    updateGraphDims() {
        let minX = +Infinity;
        let maxX = -Infinity;
        let minY = +Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < this.graph.nodes.length; i++) {
            const node = this.graph.nodes[i];
            minX = node.position.x < minX ? node.position.x : minX;
            minY = node.position.y < minY ? node.position.y : minY;
            maxX = node.position.x + node.dimension.width > maxX ? node.position.x + node.dimension.width : maxX;
            maxY = node.position.y + node.dimension.height > maxY ? node.position.y + node.dimension.height : maxY;
        }
        minX -= 100;
        minY -= 100;
        maxX += 100;
        maxY += 100;
        this.graphDims.width = maxX - minX;
        this.graphDims.height = maxY - minY;
        this.minimapOffsetX = minX;
        this.minimapOffsetY = minY;
    }
    updateMinimap() {
        // Calculate the height/width total, but only if we have any nodes
        if (this.graph.nodes && this.graph.nodes.length) {
            this.updateGraphDims();
            if (this.miniMapMaxWidth) {
                this.minimapScaleCoefficient = this.graphDims.width / this.miniMapMaxWidth;
            }
            if (this.miniMapMaxHeight) {
                this.minimapScaleCoefficient = Math.max(this.minimapScaleCoefficient, this.graphDims.height / this.miniMapMaxHeight);
            }
            this.minimapTransform = this.getMinimapTransform();
        }
    }
    /**
     * Measures the node element and applies the dimensions
     *
     * @memberOf GraphComponent
     */
    applyNodeDimensions() {
        if (this.nodeElements && this.nodeElements.length) {
            this.nodeElements.forEach(elem => {
                const nativeElement = elem.nativeElement;
                const node = this.graph.nodes.find(n => n.id === nativeElement.id);
                if (!node) {
                    return;
                }
                // calculate the height
                let dims;
                try {
                    dims = nativeElement.getBBox();
                    if (!dims.width || !dims.height) {
                        return;
                    }
                }
                catch (ex) {
                    // Skip drawing if element is not displayed - Firefox would throw an error here
                    return;
                }
                if (this.nodeHeight) {
                    node.dimension.height =
                        node.dimension.height && node.meta.forceDimensions ? node.dimension.height : this.nodeHeight;
                }
                else {
                    node.dimension.height =
                        node.dimension.height && node.meta.forceDimensions ? node.dimension.height : dims.height;
                }
                if (this.nodeMaxHeight) {
                    node.dimension.height = Math.max(node.dimension.height, this.nodeMaxHeight);
                }
                if (this.nodeMinHeight) {
                    node.dimension.height = Math.min(node.dimension.height, this.nodeMinHeight);
                }
                if (this.nodeWidth) {
                    node.dimension.width =
                        node.dimension.width && node.meta.forceDimensions ? node.dimension.width : this.nodeWidth;
                }
                else {
                    // calculate the width
                    if (nativeElement.getElementsByTagName('text').length) {
                        let maxTextDims;
                        try {
                            for (const textElem of nativeElement.getElementsByTagName('text')) {
                                const currentBBox = textElem.getBBox();
                                if (!maxTextDims) {
                                    maxTextDims = currentBBox;
                                }
                                else {
                                    if (currentBBox.width > maxTextDims.width) {
                                        maxTextDims.width = currentBBox.width;
                                    }
                                    if (currentBBox.height > maxTextDims.height) {
                                        maxTextDims.height = currentBBox.height;
                                    }
                                }
                            }
                        }
                        catch (ex) {
                            // Skip drawing if element is not displayed - Firefox would throw an error here
                            return;
                        }
                        node.dimension.width =
                            node.dimension.width && node.meta.forceDimensions ? node.dimension.width : maxTextDims.width + 20;
                    }
                    else {
                        node.dimension.width =
                            node.dimension.width && node.meta.forceDimensions ? node.dimension.width : dims.width;
                    }
                }
                if (this.nodeMaxWidth) {
                    node.dimension.width = Math.max(node.dimension.width, this.nodeMaxWidth);
                }
                if (this.nodeMinWidth) {
                    node.dimension.width = Math.min(node.dimension.width, this.nodeMinWidth);
                }
            });
        }
    }
    /**
     * Redraws the lines when dragged or viewport updated
     *
     * @memberOf GraphComponent
     */
    redrawLines(_animate = this.animate) {
        this.linkElements.forEach(linkEl => {
            const edge = this.graph.edges.find(lin => lin.id === linkEl.nativeElement.id);
            if (edge) {
                const linkSelection = select(linkEl.nativeElement).select('.line');
                linkSelection
                    .attr('d', edge.oldLine)
                    .transition()
                    .ease(ease.easeSinInOut)
                    .duration(_animate ? 500 : 0)
                    .attr('d', edge.line);
                const textPathSelection = select(this.el.nativeElement).select(`#${edge.id}`);
                textPathSelection
                    .attr('d', edge.oldTextPath)
                    .transition()
                    .ease(ease.easeSinInOut)
                    .duration(_animate ? 500 : 0)
                    .attr('d', edge.textPath);
                this.updateMidpointOnEdge(edge, edge.points);
            }
        });
    }
    /**
     * Calculate the text directions / flipping
     *
     * @memberOf GraphComponent
     */
    calcDominantBaseline(link) {
        const firstPoint = link.points[0];
        const lastPoint = link.points[link.points.length - 1];
        link.oldTextPath = link.textPath;
        if (lastPoint.x < firstPoint.x) {
            link.dominantBaseline = 'text-before-edge';
            // reverse text path for when its flipped upside down
            link.textPath = this.generateLine([...link.points].reverse());
        }
        else {
            link.dominantBaseline = 'text-after-edge';
            link.textPath = link.line;
        }
    }
    /**
     * Generate the new line path
     *
     * @memberOf GraphComponent
     */
    generateLine(points) {
        const lineFunction = shape
            .line()
            .x(d => d.x)
            .y(d => d.y)
            .curve(this.curve);
        return lineFunction(points);
    }
    /**
     * Zoom was invoked from event
     *
     * @memberOf GraphComponent
     */
    onZoom($event, direction) {
        if (this.enableTrackpadSupport && !$event.ctrlKey) {
            this.pan($event.deltaX * -1, $event.deltaY * -1);
            return;
        }
        const zoomFactor = 1 + (direction === 'in' ? this.zoomSpeed : -this.zoomSpeed);
        // Check that zooming wouldn't put us out of bounds
        const newZoomLevel = this.zoomLevel * zoomFactor;
        if (newZoomLevel <= this.minZoomLevel || newZoomLevel >= this.maxZoomLevel) {
            return;
        }
        // Check if zooming is enabled or not
        if (!this.enableZoom) {
            return;
        }
        if (this.panOnZoom === true && $event) {
            // Absolute mouse X/Y on the screen
            const mouseX = $event.clientX;
            const mouseY = $event.clientY;
            // Transform the mouse X/Y into a SVG X/Y
            const svg = this.el.nativeElement.querySelector('svg');
            const svgGroup = svg.querySelector('g.chart');
            const point = svg.createSVGPoint();
            point.x = mouseX;
            point.y = mouseY;
            const svgPoint = point.matrixTransform(svgGroup.getScreenCTM().inverse());
            // Panzoom
            this.pan(svgPoint.x, svgPoint.y, true);
            this.zoom(zoomFactor);
            this.pan(-svgPoint.x, -svgPoint.y, true);
        }
        else {
            this.zoom(zoomFactor);
        }
    }
    /**
     * Pan by x/y
     *
     * @param x
     * @param y
     */
    pan(x, y, ignoreZoomLevel = false) {
        const zoomLevel = ignoreZoomLevel ? 1 : this.zoomLevel;
        this.transformationMatrix = transform(this.transformationMatrix, translate(x / zoomLevel, y / zoomLevel));
        this.updateTransform();
    }
    /**
     * Pan to a fixed x/y
     *
     */
    panTo(x, y) {
        if (x === null || x === undefined || isNaN(x) || y === null || y === undefined || isNaN(y)) {
            return;
        }
        const panX = -this.panOffsetX - x * this.zoomLevel + this.dims.width / 2;
        const panY = -this.panOffsetY - y * this.zoomLevel + this.dims.height / 2;
        this.transformationMatrix = transform(this.transformationMatrix, translate(panX / this.zoomLevel, panY / this.zoomLevel));
        this.updateTransform();
    }
    /**
     * Zoom by a factor
     *
     */
    zoom(factor) {
        this.transformationMatrix = transform(this.transformationMatrix, scale(factor, factor));
        this.zoomChange.emit(this.zoomLevel);
        this.updateTransform();
    }
    /**
     * Zoom to a fixed level
     *
     */
    zoomTo(level) {
        this.transformationMatrix.a = isNaN(level) ? this.transformationMatrix.a : Number(level);
        this.transformationMatrix.d = isNaN(level) ? this.transformationMatrix.d : Number(level);
        this.zoomChange.emit(this.zoomLevel);
        if (this.enablePreUpdateTransform) {
            this.updateTransform();
        }
        this.update();
    }
    /**
     * Drag was invoked from an event
     *
     * @memberOf GraphComponent
     */
    onDrag(event) {
        if (!this.draggingEnabled) {
            return;
        }
        const node = this.draggingNode;
        if (this.layout && typeof this.layout !== 'string' && this.layout.onDrag) {
            this.layout.onDrag(node, event);
        }
        node.position.x += event.movementX / this.zoomLevel;
        node.position.y += event.movementY / this.zoomLevel;
        // move the node
        const x = node.position.x - (this.centerNodesOnPositionChange ? node.dimension.width / 2 : 0);
        const y = node.position.y - (this.centerNodesOnPositionChange ? node.dimension.height / 2 : 0);
        node.transform = `translate(${x}, ${y})`;
        for (const link of this.graph.edges) {
            if (link.target === node.id ||
                link.source === node.id ||
                link.target.id === node.id ||
                link.source.id === node.id) {
                if (this.layout && typeof this.layout !== 'string') {
                    const result = this.layout.updateEdge(this.graph, link);
                    const result$ = result instanceof Observable ? result : of(result);
                    this.graphSubscription.add(result$.subscribe(graph => {
                        this.graph = graph;
                        this.redrawEdge(link);
                    }));
                }
            }
        }
        this.redrawLines(false);
        this.updateMinimap();
    }
    redrawEdge(edge) {
        const line = this.generateLine(edge.points);
        this.calcDominantBaseline(edge);
        edge.oldLine = edge.line;
        edge.line = line;
    }
    /**
     * Update the entire view for the new pan position
     *
     *
     * @memberOf GraphComponent
     */
    updateTransform() {
        this.transform = toSVG(smoothMatrix(this.transformationMatrix, 100));
        this.stateChange.emit({ state: NgxGraphStates.Transform });
    }
    /**
     * Node was clicked
     *
     *
     * @memberOf GraphComponent
     */
    onClick(event) {
        this.select.emit(event);
    }
    /**
     * Node was focused
     *
     *
     * @memberOf GraphComponent
     */
    onActivate(event) {
        if (this.activeEntries.indexOf(event) > -1) {
            return;
        }
        this.activeEntries = [event, ...this.activeEntries];
        this.activate.emit({ value: event, entries: this.activeEntries });
    }
    /**
     * Node was defocused
     *
     * @memberOf GraphComponent
     */
    onDeactivate(event) {
        const idx = this.activeEntries.indexOf(event);
        this.activeEntries.splice(idx, 1);
        this.activeEntries = [...this.activeEntries];
        this.deactivate.emit({ value: event, entries: this.activeEntries });
    }
    /**
     * Get the domain series for the nodes
     *
     * @memberOf GraphComponent
     */
    getSeriesDomain() {
        return this.nodes
            .map(d => this.groupResultsBy(d))
            .reduce((nodes, node) => (nodes.indexOf(node) !== -1 ? nodes : nodes.concat([node])), [])
            .sort();
    }
    /**
     * Tracking for the link
     *
     *
     * @memberOf GraphComponent
     */
    trackLinkBy(index, link) {
        return link.id;
    }
    /**
     * Tracking for the node
     *
     *
     * @memberOf GraphComponent
     */
    trackNodeBy(index, node) {
        return node.id;
    }
    /**
     * Sets the colors the nodes
     *
     *
     * @memberOf GraphComponent
     */
    setColors() {
        this.colors = new ColorHelper(this.scheme, this.seriesDomain, this.customColors);
    }
    /**
     * On mouse move event, used for panning and dragging.
     *
     * @memberOf GraphComponent
     */
    onMouseMove($event) {
        this.isMouseMoveCalled = true;
        if ((this.isPanning || this.isMinimapPanning) && this.panningEnabled) {
            this.panWithConstraints(this.panningAxis, $event);
        }
        else if (this.isDragging && this.draggingEnabled) {
            this.onDrag($event);
        }
    }
    onMouseDown(event) {
        this.isMouseMoveCalled = false;
    }
    graphClick(event) {
        if (!this.isMouseMoveCalled)
            this.clickHandler.emit(event);
    }
    /**
     * On touch start event to enable panning.
     *
     * @memberOf GraphComponent
     */
    onTouchStart(event) {
        this._touchLastX = event.changedTouches[0].clientX;
        this._touchLastY = event.changedTouches[0].clientY;
        this.isPanning = true;
    }
    /**
     * On touch move event, used for panning.
     *
     */
    onTouchMove($event) {
        if (this.isPanning && this.panningEnabled) {
            const clientX = $event.changedTouches[0].clientX;
            const clientY = $event.changedTouches[0].clientY;
            const movementX = clientX - this._touchLastX;
            const movementY = clientY - this._touchLastY;
            this._touchLastX = clientX;
            this._touchLastY = clientY;
            this.pan(movementX, movementY);
        }
    }
    /**
     * On touch end event to disable panning.
     *
     * @memberOf GraphComponent
     */
    onTouchEnd() {
        this.isPanning = false;
    }
    /**
     * On mouse up event to disable panning/dragging.
     *
     * @memberOf GraphComponent
     */
    onMouseUp(event) {
        this.isDragging = false;
        this.isPanning = false;
        this.isMinimapPanning = false;
        if (this.layout && typeof this.layout !== 'string' && this.layout.onDragEnd) {
            this.layout.onDragEnd(this.draggingNode, event);
        }
    }
    /**
     * On node mouse down to kick off dragging
     *
     * @memberOf GraphComponent
     */
    onNodeMouseDown(event, node) {
        if (!this.draggingEnabled) {
            return;
        }
        this.isDragging = true;
        this.draggingNode = node;
        if (this.layout && typeof this.layout !== 'string' && this.layout.onDragStart) {
            this.layout.onDragStart(node, event);
        }
    }
    /**
     * On minimap drag mouse down to kick off minimap panning
     *
     * @memberOf GraphComponent
     */
    onMinimapDragMouseDown() {
        this.isMinimapPanning = true;
    }
    /**
     * On minimap pan event. Pans the graph to the clicked position
     *
     * @memberOf GraphComponent
     */
    onMinimapPanTo(event) {
        const x = event.offsetX - (this.dims.width - (this.graphDims.width + this.minimapOffsetX) / this.minimapScaleCoefficient);
        const y = event.offsetY + this.minimapOffsetY / this.minimapScaleCoefficient;
        this.panTo(x * this.minimapScaleCoefficient, y * this.minimapScaleCoefficient);
        this.isMinimapPanning = true;
    }
    /**
     * Center the graph in the viewport
     */
    center() {
        this.panTo(this.graphDims.width / 2, this.graphDims.height / 2);
    }
    /**
     * Zooms to fit the entire graph
     */
    zoomToFit(zoomOptions) {
        this.dims = calculateViewDimensions({
            width: this.width,
            height: this.height
        });
        this.updateGraphDims();
        const heightZoom = this.dims.height / this.graphDims.height;
        const widthZoom = this.dims.width / this.graphDims.width;
        let zoomLevel = Math.min(heightZoom, widthZoom, 1);
        if (zoomLevel < this.minZoomLevel) {
            zoomLevel = this.minZoomLevel;
        }
        if (zoomLevel > this.maxZoomLevel) {
            zoomLevel = this.maxZoomLevel;
        }
        if (zoomOptions?.force === true || zoomLevel !== this.zoomLevel) {
            this.zoomLevel = zoomLevel;
            if (zoomOptions?.autoCenter !== true) {
                this.updateTransform();
            }
            if (zoomOptions?.autoCenter === true) {
                this.center();
            }
            this.zoomChange.emit(this.zoomLevel);
        }
    }
    /**
     * Pans to the node
     * @param nodeId
     */
    panToNodeId(nodeId) {
        const node = this.graph.nodes.find(n => n.id === nodeId);
        if (!node) {
            return;
        }
        this.panTo(node.position.x, node.position.y);
    }
    getCompoundNodeChildren(ids) {
        return this.nodes.filter(node => ids.includes(node.id));
    }
    panWithConstraints(key, event) {
        let x = event.movementX;
        let y = event.movementY;
        if (this.isMinimapPanning) {
            x = -this.minimapScaleCoefficient * x * this.zoomLevel;
            y = -this.minimapScaleCoefficient * y * this.zoomLevel;
        }
        switch (key) {
            case PanningAxis.Horizontal:
                this.pan(x, 0);
                break;
            case PanningAxis.Vertical:
                this.pan(0, y);
                break;
            default:
                this.pan(x, y);
                break;
        }
    }
    updateMidpointOnEdge(edge, points) {
        if (!edge || !points) {
            return;
        }
        if (points.length % 2 === 1) {
            edge.midPoint = points[Math.floor(points.length / 2)];
        }
        else {
            // Checking if the current layout is Elk
            if (this.layout?.settings?.properties?.['elk.direction']) {
                this._calcMidPointElk(edge, points);
            }
            else {
                const _first = points[points.length / 2];
                const _second = points[points.length / 2 - 1];
                edge.midPoint = {
                    x: (_first.x + _second.x) / 2,
                    y: (_first.y + _second.y) / 2
                };
            }
        }
    }
    _calcMidPointElk(edge, points) {
        let _firstX = null;
        let _secondX = null;
        let _firstY = null;
        let _secondY = null;
        const orientation = this.layout.settings?.properties['elk.direction'];
        const hasBend = orientation === 'RIGHT' ? points.some(p => p.y !== points[0].y) : points.some(p => p.x !== points[0].x);
        if (hasBend) {
            // getting the last two points
            _firstX = points[points.length - 1];
            _secondX = points[points.length - 2];
            _firstY = points[points.length - 1];
            _secondY = points[points.length - 2];
        }
        else {
            if (orientation === 'RIGHT') {
                _firstX = points[0];
                _secondX = points[points.length - 1];
                _firstY = points[points.length / 2];
                _secondY = points[points.length / 2 - 1];
            }
            else {
                _firstX = points[points.length / 2];
                _secondX = points[points.length / 2 - 1];
                _firstY = points[0];
                _secondY = points[points.length - 1];
            }
        }
        edge.midPoint = {
            x: (_firstX.x + _secondX.x) / 2,
            y: (_firstY.y + _secondY.y) / 2
        };
    }
    basicUpdate() {
        if (this.view) {
            this.width = this.view[0];
            this.height = this.view[1];
        }
        else {
            const dims = this.getContainerDims();
            if (dims) {
                this.width = dims.width;
                this.height = dims.height;
            }
        }
        // default values if width or height are 0 or undefined
        if (!this.width) {
            this.width = 600;
        }
        if (!this.height) {
            this.height = 400;
        }
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        if (this.cd) {
            this.cd.markForCheck();
        }
    }
    getContainerDims() {
        let width;
        let height;
        const hostElem = this.el.nativeElement;
        if (hostElem.parentNode !== null) {
            // Get the container dimensions
            const dims = hostElem.parentNode.getBoundingClientRect();
            width = dims.width;
            height = dims.height;
        }
        if (width && height) {
            return { width, height };
        }
        return null;
    }
    /**
     * Checks if the graph has dimensions
     */
    hasGraphDims() {
        return this.graphDims.width > 0 && this.graphDims.height > 0;
    }
    /**
     * Checks if all nodes have dimension
     */
    hasNodeDims() {
        return this.graph.nodes?.every(node => node.dimension.width > 0 && node.dimension.height > 0);
    }
    /**
     * Checks if all compound nodes have dimension
     */
    hasCompoundNodeDims() {
        return this.graph.compoundNodes?.every(node => node.dimension.width > 0 && node.dimension.height > 0);
    }
    /**
     * Checks if all clusters have dimension
     */
    hasClusterDims() {
        return this.graph.clusters?.every(node => node.dimension.width > 0 && node.dimension.height > 0);
    }
    /**
     * Checks if the graph and all nodes have dimension.
     */
    hasDims() {
        return (this.hasGraphDims() &&
            this.hasNodeDims() &&
            ((this.compoundNodes?.length ? this.hasCompoundNodeDims() : true) ||
                (this.clusters?.length ? this.hasClusterDims() : true)));
    }
    unbindEvents() {
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }
    bindWindowResizeEvent() {
        const source = fromEvent(window, 'resize');
        const subscription = source.pipe(debounceTime(200)).subscribe(e => {
            this.update();
            if (this.cd) {
                this.cd.markForCheck();
            }
        });
        this.resizeSubscription = subscription;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphComponent, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: LayoutService }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.1.5", type: GraphComponent, selector: "ngx-graph", inputs: { nodes: "nodes", clusters: "clusters", compoundNodes: "compoundNodes", links: "links", activeEntries: "activeEntries", curve: "curve", draggingEnabled: "draggingEnabled", nodeHeight: "nodeHeight", nodeMaxHeight: "nodeMaxHeight", nodeMinHeight: "nodeMinHeight", nodeWidth: "nodeWidth", nodeMinWidth: "nodeMinWidth", nodeMaxWidth: "nodeMaxWidth", panningEnabled: "panningEnabled", panningAxis: "panningAxis", enableZoom: "enableZoom", zoomSpeed: "zoomSpeed", minZoomLevel: "minZoomLevel", maxZoomLevel: "maxZoomLevel", autoZoom: "autoZoom", panOnZoom: "panOnZoom", animate: "animate", autoCenter: "autoCenter", update$: "update$", center$: "center$", zoomToFit$: "zoomToFit$", panToNode$: "panToNode$", layout: "layout", layoutSettings: "layoutSettings", enableTrackpadSupport: "enableTrackpadSupport", showMiniMap: "showMiniMap", miniMapMaxWidth: "miniMapMaxWidth", miniMapMaxHeight: "miniMapMaxHeight", miniMapPosition: "miniMapPosition", view: "view", scheme: "scheme", customColors: "customColors", deferDisplayUntilPosition: "deferDisplayUntilPosition", centerNodesOnPositionChange: "centerNodesOnPositionChange", enablePreUpdateTransform: "enablePreUpdateTransform", groupResultsBy: "groupResultsBy", zoomLevel: "zoomLevel", panOffsetX: "panOffsetX", panOffsetY: "panOffsetY" }, outputs: { select: "select", activate: "activate", deactivate: "deactivate", zoomChange: "zoomChange", clickHandler: "clickHandler", stateChange: "stateChange" }, host: { listeners: { "document:mousemove": "onMouseMove($event)", "document:mousedown": "onMouseDown($event)", "document:click": "graphClick($event)", "document:touchmove": "onTouchMove($event)", "document:mouseup": "onMouseUp($event)" } }, queries: [{ propertyName: "linkTemplate", first: true, predicate: ["linkTemplate"], descendants: true }, { propertyName: "nodeTemplate", first: true, predicate: ["nodeTemplate"], descendants: true }, { propertyName: "clusterTemplate", first: true, predicate: ["clusterTemplate"], descendants: true }, { propertyName: "defsTemplate", first: true, predicate: ["defsTemplate"], descendants: true }, { propertyName: "miniMapNodeTemplate", first: true, predicate: ["miniMapNodeTemplate"], descendants: true }], viewQueries: [{ propertyName: "nodeElements", predicate: ["nodeElement"], descendants: true }, { propertyName: "linkElements", predicate: ["linkElement"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"ngx-graph-outer\"\n  [style.width.px]=\"width\"\n  [@animationState]=\"'active'\"\n  [@.disabled]=\"!animate\"\n  (mouseWheelUp)=\"onZoom($event, 'in')\"\n  (mouseWheelDown)=\"onZoom($event, 'out')\"\n  mouseWheel\n>\n  <svg:svg class=\"ngx-graph\" [attr.width]=\"width\" [attr.height]=\"height\">\n    <svg:g\n      *ngIf=\"initialized && graph\"\n      [attr.transform]=\"transform\"\n      (touchstart)=\"onTouchStart($event)\"\n      (touchend)=\"onTouchEnd()\"\n      class=\"graph chart\"\n    >\n      <defs>\n        <ng-container *ngIf=\"defsTemplate\" [ngTemplateOutlet]=\"defsTemplate\"></ng-container>\n        <svg:path\n          class=\"text-path\"\n          *ngFor=\"let link of graph.edges\"\n          [attr.d]=\"link.textPath\"\n          [attr.id]=\"link.id\"\n        ></svg:path>\n      </defs>\n\n      <svg:rect\n        class=\"panning-rect\"\n        [attr.width]=\"dims.width * 100\"\n        [attr.height]=\"dims.height * 100\"\n        [attr.transform]=\"'translate(' + (-dims.width || 0) * 50 + ',' + (-dims.height || 0) * 50 + ')'\"\n        (mousedown)=\"isPanning = true\"\n      />\n\n      <ng-content></ng-content>\n\n      <svg:g class=\"clusters\">\n        <svg:g\n          #clusterElement\n          *ngFor=\"let node of graph.clusters; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldClusters.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n        >\n          <ng-container\n            *ngIf=\"clusterTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"clusterTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!clusterTemplate\" class=\"node cluster\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"compound-nodes\">\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.compoundNodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldCompoundNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!nodeTemplate\" class=\"node compound-node\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"links\">\n        <svg:g #linkElement *ngFor=\"let link of graph.edges; trackBy: trackLinkBy\" class=\"link-group\" [id]=\"link.id\">\n          <ng-container\n            *ngIf=\"linkTemplate\"\n            [ngTemplateOutlet]=\"linkTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: link }\"\n          ></ng-container>\n          <svg:path *ngIf=\"!linkTemplate\" class=\"edge\" [attr.d]=\"link.line\" />\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"nodes\" #nodeGroup>\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:circle\n            *ngIf=\"!nodeTemplate\"\n            r=\"10\"\n            [attr.cx]=\"node.dimension.width / 2\"\n            [attr.cy]=\"node.dimension.height / 2\"\n            [attr.fill]=\"node.data?.color\"\n          />\n        </svg:g>\n      </svg:g>\n    </svg:g>\n\n    <svg:clipPath [attr.id]=\"minimapClipPathId\">\n      <svg:rect\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n      ></svg:rect>\n    </svg:clipPath>\n\n    <svg:g\n      class=\"minimap\"\n      *ngIf=\"showMiniMap\"\n      [attr.transform]=\"minimapTransform\"\n      [attr.clip-path]=\"'url(#' + minimapClipPathId + ')'\"\n    >\n      <svg:rect\n        class=\"minimap-background\"\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n        (mousedown)=\"onMinimapPanTo($event)\"\n      ></svg:rect>\n\n      <svg:g\n        [style.transform]=\"\n          'translate(' +\n          -minimapOffsetX / minimapScaleCoefficient +\n          'px,' +\n          -minimapOffsetY / minimapScaleCoefficient +\n          'px)'\n        \"\n      >\n        <svg:g class=\"minimap-nodes\" [style.transform]=\"'scale(' + 1 / minimapScaleCoefficient + ')'\">\n          <svg:g\n            #nodeElement\n            *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n            class=\"node-group\"\n            [class.old-node]=\"animate && oldNodes.has(node.id)\"\n            [id]=\"node.id\"\n            [attr.transform]=\"node.transform\"\n          >\n            <ng-container\n              *ngIf=\"miniMapNodeTemplate\"\n              [ngTemplateOutlet]=\"miniMapNodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <ng-container\n              *ngIf=\"!miniMapNodeTemplate && nodeTemplate\"\n              [ngTemplateOutlet]=\"nodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <svg:circle\n              *ngIf=\"!nodeTemplate && !miniMapNodeTemplate\"\n              r=\"10\"\n              [attr.cx]=\"node.dimension.width / 2 / minimapScaleCoefficient\"\n              [attr.cy]=\"node.dimension.height / 2 / minimapScaleCoefficient\"\n              [attr.fill]=\"node.data?.color\"\n            />\n          </svg:g>\n        </svg:g>\n\n        <svg:rect\n          [attr.transform]=\"\n            'translate(' +\n            panOffsetX / zoomLevel / -minimapScaleCoefficient +\n            ',' +\n            panOffsetY / zoomLevel / -minimapScaleCoefficient +\n            ')'\n          \"\n          class=\"minimap-drag\"\n          [class.panning]=\"isMinimapPanning\"\n          [attr.width]=\"width / minimapScaleCoefficient / zoomLevel\"\n          [attr.height]=\"height / minimapScaleCoefficient / zoomLevel\"\n          (mousedown)=\"onMinimapDragMouseDown()\"\n        ></svg:rect>\n      </svg:g>\n    </svg:g>\n  </svg:svg>\n</div>\n", styles: [".minimap .minimap-background{fill:#0000001a}.minimap .minimap-drag{fill:#0003;stroke:#fff;stroke-width:1px;stroke-dasharray:2px;stroke-dashoffset:2px;cursor:pointer}.minimap .minimap-drag.panning{fill:#0000004d}.minimap .minimap-nodes{opacity:.5;pointer-events:none}.graph{-webkit-user-select:none;user-select:none}.graph .edge{stroke:#666;fill:none}.graph .edge .edge-label{stroke:none;font-size:12px;fill:#251e1e}.graph .panning-rect{fill:#0000;cursor:move}.graph .node-group.old-node{transition:transform .5s ease-in-out}.graph .node-group .node:focus{outline:none}.graph .compound-node rect{opacity:.5}.graph .cluster rect{opacity:.2}\n"], dependencies: [{ kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: MouseWheelDirective, selector: "[mouseWheel]", outputs: ["mouseWheelUp", "mouseWheelDown"] }], animations: [
            trigger('animationState', [
                transition(':enter', [style({ opacity: 0 }), animate('500ms 100ms', style({ opacity: 1 }))])
            ])
        ], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
__decorate([
    throttleable(500)
], GraphComponent.prototype, "updateMinimap", null);
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-graph', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, animations: [
                        trigger('animationState', [
                            transition(':enter', [style({ opacity: 0 }), animate('500ms 100ms', style({ opacity: 1 }))])
                        ])
                    ], template: "<div\n  class=\"ngx-graph-outer\"\n  [style.width.px]=\"width\"\n  [@animationState]=\"'active'\"\n  [@.disabled]=\"!animate\"\n  (mouseWheelUp)=\"onZoom($event, 'in')\"\n  (mouseWheelDown)=\"onZoom($event, 'out')\"\n  mouseWheel\n>\n  <svg:svg class=\"ngx-graph\" [attr.width]=\"width\" [attr.height]=\"height\">\n    <svg:g\n      *ngIf=\"initialized && graph\"\n      [attr.transform]=\"transform\"\n      (touchstart)=\"onTouchStart($event)\"\n      (touchend)=\"onTouchEnd()\"\n      class=\"graph chart\"\n    >\n      <defs>\n        <ng-container *ngIf=\"defsTemplate\" [ngTemplateOutlet]=\"defsTemplate\"></ng-container>\n        <svg:path\n          class=\"text-path\"\n          *ngFor=\"let link of graph.edges\"\n          [attr.d]=\"link.textPath\"\n          [attr.id]=\"link.id\"\n        ></svg:path>\n      </defs>\n\n      <svg:rect\n        class=\"panning-rect\"\n        [attr.width]=\"dims.width * 100\"\n        [attr.height]=\"dims.height * 100\"\n        [attr.transform]=\"'translate(' + (-dims.width || 0) * 50 + ',' + (-dims.height || 0) * 50 + ')'\"\n        (mousedown)=\"isPanning = true\"\n      />\n\n      <ng-content></ng-content>\n\n      <svg:g class=\"clusters\">\n        <svg:g\n          #clusterElement\n          *ngFor=\"let node of graph.clusters; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldClusters.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n        >\n          <ng-container\n            *ngIf=\"clusterTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"clusterTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!clusterTemplate\" class=\"node cluster\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"compound-nodes\">\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.compoundNodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldCompoundNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!nodeTemplate\" class=\"node compound-node\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"links\">\n        <svg:g #linkElement *ngFor=\"let link of graph.edges; trackBy: trackLinkBy\" class=\"link-group\" [id]=\"link.id\">\n          <ng-container\n            *ngIf=\"linkTemplate\"\n            [ngTemplateOutlet]=\"linkTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: link }\"\n          ></ng-container>\n          <svg:path *ngIf=\"!linkTemplate\" class=\"edge\" [attr.d]=\"link.line\" />\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"nodes\" #nodeGroup>\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:circle\n            *ngIf=\"!nodeTemplate\"\n            r=\"10\"\n            [attr.cx]=\"node.dimension.width / 2\"\n            [attr.cy]=\"node.dimension.height / 2\"\n            [attr.fill]=\"node.data?.color\"\n          />\n        </svg:g>\n      </svg:g>\n    </svg:g>\n\n    <svg:clipPath [attr.id]=\"minimapClipPathId\">\n      <svg:rect\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n      ></svg:rect>\n    </svg:clipPath>\n\n    <svg:g\n      class=\"minimap\"\n      *ngIf=\"showMiniMap\"\n      [attr.transform]=\"minimapTransform\"\n      [attr.clip-path]=\"'url(#' + minimapClipPathId + ')'\"\n    >\n      <svg:rect\n        class=\"minimap-background\"\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n        (mousedown)=\"onMinimapPanTo($event)\"\n      ></svg:rect>\n\n      <svg:g\n        [style.transform]=\"\n          'translate(' +\n          -minimapOffsetX / minimapScaleCoefficient +\n          'px,' +\n          -minimapOffsetY / minimapScaleCoefficient +\n          'px)'\n        \"\n      >\n        <svg:g class=\"minimap-nodes\" [style.transform]=\"'scale(' + 1 / minimapScaleCoefficient + ')'\">\n          <svg:g\n            #nodeElement\n            *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n            class=\"node-group\"\n            [class.old-node]=\"animate && oldNodes.has(node.id)\"\n            [id]=\"node.id\"\n            [attr.transform]=\"node.transform\"\n          >\n            <ng-container\n              *ngIf=\"miniMapNodeTemplate\"\n              [ngTemplateOutlet]=\"miniMapNodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <ng-container\n              *ngIf=\"!miniMapNodeTemplate && nodeTemplate\"\n              [ngTemplateOutlet]=\"nodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <svg:circle\n              *ngIf=\"!nodeTemplate && !miniMapNodeTemplate\"\n              r=\"10\"\n              [attr.cx]=\"node.dimension.width / 2 / minimapScaleCoefficient\"\n              [attr.cy]=\"node.dimension.height / 2 / minimapScaleCoefficient\"\n              [attr.fill]=\"node.data?.color\"\n            />\n          </svg:g>\n        </svg:g>\n\n        <svg:rect\n          [attr.transform]=\"\n            'translate(' +\n            panOffsetX / zoomLevel / -minimapScaleCoefficient +\n            ',' +\n            panOffsetY / zoomLevel / -minimapScaleCoefficient +\n            ')'\n          \"\n          class=\"minimap-drag\"\n          [class.panning]=\"isMinimapPanning\"\n          [attr.width]=\"width / minimapScaleCoefficient / zoomLevel\"\n          [attr.height]=\"height / minimapScaleCoefficient / zoomLevel\"\n          (mousedown)=\"onMinimapDragMouseDown()\"\n        ></svg:rect>\n      </svg:g>\n    </svg:g>\n  </svg:svg>\n</div>\n", styles: [".minimap .minimap-background{fill:#0000001a}.minimap .minimap-drag{fill:#0003;stroke:#fff;stroke-width:1px;stroke-dasharray:2px;stroke-dashoffset:2px;cursor:pointer}.minimap .minimap-drag.panning{fill:#0000004d}.minimap .minimap-nodes{opacity:.5;pointer-events:none}.graph{-webkit-user-select:none;user-select:none}.graph .edge{stroke:#666;fill:none}.graph .edge .edge-label{stroke:none;font-size:12px;fill:#251e1e}.graph .panning-rect{fill:#0000;cursor:move}.graph .node-group.old-node{transition:transform .5s ease-in-out}.graph .node-group .node:focus{outline:none}.graph .compound-node rect{opacity:.5}.graph .cluster rect{opacity:.2}\n"] }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: i0.ChangeDetectorRef }, { type: LayoutService }], propDecorators: { nodes: [{
                type: Input
            }], clusters: [{
                type: Input
            }], compoundNodes: [{
                type: Input
            }], links: [{
                type: Input
            }], activeEntries: [{
                type: Input
            }], curve: [{
                type: Input
            }], draggingEnabled: [{
                type: Input
            }], nodeHeight: [{
                type: Input
            }], nodeMaxHeight: [{
                type: Input
            }], nodeMinHeight: [{
                type: Input
            }], nodeWidth: [{
                type: Input
            }], nodeMinWidth: [{
                type: Input
            }], nodeMaxWidth: [{
                type: Input
            }], panningEnabled: [{
                type: Input
            }], panningAxis: [{
                type: Input
            }], enableZoom: [{
                type: Input
            }], zoomSpeed: [{
                type: Input
            }], minZoomLevel: [{
                type: Input
            }], maxZoomLevel: [{
                type: Input
            }], autoZoom: [{
                type: Input
            }], panOnZoom: [{
                type: Input
            }], animate: [{
                type: Input
            }], autoCenter: [{
                type: Input
            }], update$: [{
                type: Input
            }], center$: [{
                type: Input
            }], zoomToFit$: [{
                type: Input
            }], panToNode$: [{
                type: Input
            }], layout: [{
                type: Input
            }], layoutSettings: [{
                type: Input
            }], enableTrackpadSupport: [{
                type: Input
            }], showMiniMap: [{
                type: Input
            }], miniMapMaxWidth: [{
                type: Input
            }], miniMapMaxHeight: [{
                type: Input
            }], miniMapPosition: [{
                type: Input
            }], view: [{
                type: Input
            }], scheme: [{
                type: Input
            }], customColors: [{
                type: Input
            }], deferDisplayUntilPosition: [{
                type: Input
            }], centerNodesOnPositionChange: [{
                type: Input
            }], enablePreUpdateTransform: [{
                type: Input
            }], select: [{
                type: Output
            }], activate: [{
                type: Output
            }], deactivate: [{
                type: Output
            }], zoomChange: [{
                type: Output
            }], clickHandler: [{
                type: Output
            }], stateChange: [{
                type: Output
            }], linkTemplate: [{
                type: ContentChild,
                args: ['linkTemplate']
            }], nodeTemplate: [{
                type: ContentChild,
                args: ['nodeTemplate']
            }], clusterTemplate: [{
                type: ContentChild,
                args: ['clusterTemplate']
            }], defsTemplate: [{
                type: ContentChild,
                args: ['defsTemplate']
            }], miniMapNodeTemplate: [{
                type: ContentChild,
                args: ['miniMapNodeTemplate']
            }], nodeElements: [{
                type: ViewChildren,
                args: ['nodeElement']
            }], linkElements: [{
                type: ViewChildren,
                args: ['linkElement']
            }], groupResultsBy: [{
                type: Input
            }], zoomLevel: [{
                type: Input,
                args: ['zoomLevel']
            }], panOffsetX: [{
                type: Input,
                args: ['panOffsetX']
            }], panOffsetY: [{
                type: Input,
                args: ['panOffsetY']
            }], updateMinimap: [], onMouseMove: [{
                type: HostListener,
                args: ['document:mousemove', ['$event']]
            }], onMouseDown: [{
                type: HostListener,
                args: ['document:mousedown', ['$event']]
            }], graphClick: [{
                type: HostListener,
                args: ['document:click', ['$event']]
            }], onTouchMove: [{
                type: HostListener,
                args: ['document:touchmove', ['$event']]
            }], onMouseUp: [{
                type: HostListener,
                args: ['document:mouseup', ['$event']]
            }] } });

class GraphModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.1.5", ngImport: i0, type: GraphModule, declarations: [GraphComponent, MouseWheelDirective, VisibilityObserver], imports: [CommonModule], exports: [GraphComponent, MouseWheelDirective] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphModule, providers: [LayoutService], imports: [CommonModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule],
                    declarations: [GraphComponent, MouseWheelDirective, VisibilityObserver],
                    exports: [GraphComponent, MouseWheelDirective],
                    providers: [LayoutService]
                }]
        }] });

class NgxGraphModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: NgxGraphModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "18.1.5", ngImport: i0, type: NgxGraphModule, imports: [CommonModule], exports: [GraphModule] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: NgxGraphModule, imports: [CommonModule, GraphModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: NgxGraphModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule],
                    exports: [GraphModule]
                }]
        }] });

/*
 * Public API Surface of ngx-graph
 */

/**
 * Generated bundle index. Do not edit.
 */

export { Alignment, ColaForceDirectedLayout, D3ForceDirectedLayout, DagreClusterLayout, DagreLayout, DagreNodesOnlyLayout, GraphComponent, GraphModule, LayoutService, MiniMapPosition, MouseWheelDirective, NgxGraphModule, NgxGraphStates, Orientation, PanningAxis, toD3Node, toNode };
//# sourceMappingURL=swimlane-ngx-graph.mjs.map
