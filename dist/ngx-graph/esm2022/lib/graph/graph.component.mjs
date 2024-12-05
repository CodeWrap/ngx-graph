import { __decorate } from "tslib";
// rename transition due to conflict with d3 transition
import { animate, style, transition as ngTransition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, HostListener, Input, Output, ViewChildren, ViewEncapsulation } from '@angular/core';
import { select } from 'd3-selection';
import * as shape from 'd3-shape';
import * as ease from 'd3-ease';
import 'd3-transition';
import { Observable, Subscription, of, fromEvent as observableFromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { identity, scale, smoothMatrix, toSVG, transform, translate } from 'transformation-matrix';
import { id } from '../utils/id';
import { PanningAxis } from '../enums/panning.enum';
import { MiniMapPosition } from '../enums/mini-map-position.enum';
import { throttleable } from '../utils/throttle';
import { ColorHelper } from '../utils/color.helper';
import { calculateViewDimensions } from '../utils/view-dimensions.helper';
import { VisibilityObserver } from '../utils/visibility-observer';
import * as i0 from "@angular/core";
import * as i1 from "./layouts/layout.service";
import * as i2 from "@angular/common";
import * as i3 from "./mouse-wheel.directive";
export var NgxGraphStates;
(function (NgxGraphStates) {
    NgxGraphStates["Init"] = "init";
    NgxGraphStates["Subscribe"] = "subscribe";
    NgxGraphStates["Transform"] = "transform";
    /* eslint-disable @typescript-eslint/no-shadow */
    NgxGraphStates["Output"] = "output";
})(NgxGraphStates || (NgxGraphStates = {}));
export class GraphComponent {
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
        const source = observableFromEvent(window, 'resize');
        const subscription = source.pipe(debounceTime(200)).subscribe(e => {
            this.update();
            if (this.cd) {
                this.cd.markForCheck();
            }
        });
        this.resizeSubscription = subscription;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "18.1.5", ngImport: i0, type: GraphComponent, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: i0.ChangeDetectorRef }, { token: i1.LayoutService }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "18.1.5", type: GraphComponent, selector: "ngx-graph", inputs: { nodes: "nodes", clusters: "clusters", compoundNodes: "compoundNodes", links: "links", activeEntries: "activeEntries", curve: "curve", draggingEnabled: "draggingEnabled", nodeHeight: "nodeHeight", nodeMaxHeight: "nodeMaxHeight", nodeMinHeight: "nodeMinHeight", nodeWidth: "nodeWidth", nodeMinWidth: "nodeMinWidth", nodeMaxWidth: "nodeMaxWidth", panningEnabled: "panningEnabled", panningAxis: "panningAxis", enableZoom: "enableZoom", zoomSpeed: "zoomSpeed", minZoomLevel: "minZoomLevel", maxZoomLevel: "maxZoomLevel", autoZoom: "autoZoom", panOnZoom: "panOnZoom", animate: "animate", autoCenter: "autoCenter", update$: "update$", center$: "center$", zoomToFit$: "zoomToFit$", panToNode$: "panToNode$", layout: "layout", layoutSettings: "layoutSettings", enableTrackpadSupport: "enableTrackpadSupport", showMiniMap: "showMiniMap", miniMapMaxWidth: "miniMapMaxWidth", miniMapMaxHeight: "miniMapMaxHeight", miniMapPosition: "miniMapPosition", view: "view", scheme: "scheme", customColors: "customColors", deferDisplayUntilPosition: "deferDisplayUntilPosition", centerNodesOnPositionChange: "centerNodesOnPositionChange", enablePreUpdateTransform: "enablePreUpdateTransform", groupResultsBy: "groupResultsBy", zoomLevel: "zoomLevel", panOffsetX: "panOffsetX", panOffsetY: "panOffsetY" }, outputs: { select: "select", activate: "activate", deactivate: "deactivate", zoomChange: "zoomChange", clickHandler: "clickHandler", stateChange: "stateChange" }, host: { listeners: { "document:mousemove": "onMouseMove($event)", "document:mousedown": "onMouseDown($event)", "document:click": "graphClick($event)", "document:touchmove": "onTouchMove($event)", "document:mouseup": "onMouseUp($event)" } }, queries: [{ propertyName: "linkTemplate", first: true, predicate: ["linkTemplate"], descendants: true }, { propertyName: "nodeTemplate", first: true, predicate: ["nodeTemplate"], descendants: true }, { propertyName: "clusterTemplate", first: true, predicate: ["clusterTemplate"], descendants: true }, { propertyName: "defsTemplate", first: true, predicate: ["defsTemplate"], descendants: true }, { propertyName: "miniMapNodeTemplate", first: true, predicate: ["miniMapNodeTemplate"], descendants: true }], viewQueries: [{ propertyName: "nodeElements", predicate: ["nodeElement"], descendants: true }, { propertyName: "linkElements", predicate: ["linkElement"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div\n  class=\"ngx-graph-outer\"\n  [style.width.px]=\"width\"\n  [@animationState]=\"'active'\"\n  [@.disabled]=\"!animate\"\n  (mouseWheelUp)=\"onZoom($event, 'in')\"\n  (mouseWheelDown)=\"onZoom($event, 'out')\"\n  mouseWheel\n>\n  <svg:svg class=\"ngx-graph\" [attr.width]=\"width\" [attr.height]=\"height\">\n    <svg:g\n      *ngIf=\"initialized && graph\"\n      [attr.transform]=\"transform\"\n      (touchstart)=\"onTouchStart($event)\"\n      (touchend)=\"onTouchEnd()\"\n      class=\"graph chart\"\n    >\n      <defs>\n        <ng-container *ngIf=\"defsTemplate\" [ngTemplateOutlet]=\"defsTemplate\"></ng-container>\n        <svg:path\n          class=\"text-path\"\n          *ngFor=\"let link of graph.edges\"\n          [attr.d]=\"link.textPath\"\n          [attr.id]=\"link.id\"\n        ></svg:path>\n      </defs>\n\n      <svg:rect\n        class=\"panning-rect\"\n        [attr.width]=\"dims.width * 100\"\n        [attr.height]=\"dims.height * 100\"\n        [attr.transform]=\"'translate(' + (-dims.width || 0) * 50 + ',' + (-dims.height || 0) * 50 + ')'\"\n        (mousedown)=\"isPanning = true\"\n      />\n\n      <ng-content></ng-content>\n\n      <svg:g class=\"clusters\">\n        <svg:g\n          #clusterElement\n          *ngFor=\"let node of graph.clusters; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldClusters.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n        >\n          <ng-container\n            *ngIf=\"clusterTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"clusterTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!clusterTemplate\" class=\"node cluster\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"compound-nodes\">\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.compoundNodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldCompoundNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!nodeTemplate\" class=\"node compound-node\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"links\">\n        <svg:g #linkElement *ngFor=\"let link of graph.edges; trackBy: trackLinkBy\" class=\"link-group\" [id]=\"link.id\">\n          <ng-container\n            *ngIf=\"linkTemplate\"\n            [ngTemplateOutlet]=\"linkTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: link }\"\n          ></ng-container>\n          <svg:path *ngIf=\"!linkTemplate\" class=\"edge\" [attr.d]=\"link.line\" />\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"nodes\" #nodeGroup>\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:circle\n            *ngIf=\"!nodeTemplate\"\n            r=\"10\"\n            [attr.cx]=\"node.dimension.width / 2\"\n            [attr.cy]=\"node.dimension.height / 2\"\n            [attr.fill]=\"node.data?.color\"\n          />\n        </svg:g>\n      </svg:g>\n    </svg:g>\n\n    <svg:clipPath [attr.id]=\"minimapClipPathId\">\n      <svg:rect\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n      ></svg:rect>\n    </svg:clipPath>\n\n    <svg:g\n      class=\"minimap\"\n      *ngIf=\"showMiniMap\"\n      [attr.transform]=\"minimapTransform\"\n      [attr.clip-path]=\"'url(#' + minimapClipPathId + ')'\"\n    >\n      <svg:rect\n        class=\"minimap-background\"\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n        (mousedown)=\"onMinimapPanTo($event)\"\n      ></svg:rect>\n\n      <svg:g\n        [style.transform]=\"\n          'translate(' +\n          -minimapOffsetX / minimapScaleCoefficient +\n          'px,' +\n          -minimapOffsetY / minimapScaleCoefficient +\n          'px)'\n        \"\n      >\n        <svg:g class=\"minimap-nodes\" [style.transform]=\"'scale(' + 1 / minimapScaleCoefficient + ')'\">\n          <svg:g\n            #nodeElement\n            *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n            class=\"node-group\"\n            [class.old-node]=\"animate && oldNodes.has(node.id)\"\n            [id]=\"node.id\"\n            [attr.transform]=\"node.transform\"\n          >\n            <ng-container\n              *ngIf=\"miniMapNodeTemplate\"\n              [ngTemplateOutlet]=\"miniMapNodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <ng-container\n              *ngIf=\"!miniMapNodeTemplate && nodeTemplate\"\n              [ngTemplateOutlet]=\"nodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <svg:circle\n              *ngIf=\"!nodeTemplate && !miniMapNodeTemplate\"\n              r=\"10\"\n              [attr.cx]=\"node.dimension.width / 2 / minimapScaleCoefficient\"\n              [attr.cy]=\"node.dimension.height / 2 / minimapScaleCoefficient\"\n              [attr.fill]=\"node.data?.color\"\n            />\n          </svg:g>\n        </svg:g>\n\n        <svg:rect\n          [attr.transform]=\"\n            'translate(' +\n            panOffsetX / zoomLevel / -minimapScaleCoefficient +\n            ',' +\n            panOffsetY / zoomLevel / -minimapScaleCoefficient +\n            ')'\n          \"\n          class=\"minimap-drag\"\n          [class.panning]=\"isMinimapPanning\"\n          [attr.width]=\"width / minimapScaleCoefficient / zoomLevel\"\n          [attr.height]=\"height / minimapScaleCoefficient / zoomLevel\"\n          (mousedown)=\"onMinimapDragMouseDown()\"\n        ></svg:rect>\n      </svg:g>\n    </svg:g>\n  </svg:svg>\n</div>\n", styles: [".minimap .minimap-background{fill:#0000001a}.minimap .minimap-drag{fill:#0003;stroke:#fff;stroke-width:1px;stroke-dasharray:2px;stroke-dashoffset:2px;cursor:pointer}.minimap .minimap-drag.panning{fill:#0000004d}.minimap .minimap-nodes{opacity:.5;pointer-events:none}.graph{-webkit-user-select:none;user-select:none}.graph .edge{stroke:#666;fill:none}.graph .edge .edge-label{stroke:none;font-size:12px;fill:#251e1e}.graph .panning-rect{fill:#0000;cursor:move}.graph .node-group.old-node{transition:transform .5s ease-in-out}.graph .node-group .node:focus{outline:none}.graph .compound-node rect{opacity:.5}.graph .cluster rect{opacity:.2}\n"], dependencies: [{ kind: "directive", type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i3.MouseWheelDirective, selector: "[mouseWheel]", outputs: ["mouseWheelUp", "mouseWheelDown"] }], animations: [
            trigger('animationState', [
                ngTransition(':enter', [style({ opacity: 0 }), animate('500ms 100ms', style({ opacity: 1 }))])
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
                            ngTransition(':enter', [style({ opacity: 0 }), animate('500ms 100ms', style({ opacity: 1 }))])
                        ])
                    ], template: "<div\n  class=\"ngx-graph-outer\"\n  [style.width.px]=\"width\"\n  [@animationState]=\"'active'\"\n  [@.disabled]=\"!animate\"\n  (mouseWheelUp)=\"onZoom($event, 'in')\"\n  (mouseWheelDown)=\"onZoom($event, 'out')\"\n  mouseWheel\n>\n  <svg:svg class=\"ngx-graph\" [attr.width]=\"width\" [attr.height]=\"height\">\n    <svg:g\n      *ngIf=\"initialized && graph\"\n      [attr.transform]=\"transform\"\n      (touchstart)=\"onTouchStart($event)\"\n      (touchend)=\"onTouchEnd()\"\n      class=\"graph chart\"\n    >\n      <defs>\n        <ng-container *ngIf=\"defsTemplate\" [ngTemplateOutlet]=\"defsTemplate\"></ng-container>\n        <svg:path\n          class=\"text-path\"\n          *ngFor=\"let link of graph.edges\"\n          [attr.d]=\"link.textPath\"\n          [attr.id]=\"link.id\"\n        ></svg:path>\n      </defs>\n\n      <svg:rect\n        class=\"panning-rect\"\n        [attr.width]=\"dims.width * 100\"\n        [attr.height]=\"dims.height * 100\"\n        [attr.transform]=\"'translate(' + (-dims.width || 0) * 50 + ',' + (-dims.height || 0) * 50 + ')'\"\n        (mousedown)=\"isPanning = true\"\n      />\n\n      <ng-content></ng-content>\n\n      <svg:g class=\"clusters\">\n        <svg:g\n          #clusterElement\n          *ngFor=\"let node of graph.clusters; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldClusters.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n        >\n          <ng-container\n            *ngIf=\"clusterTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"clusterTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!clusterTemplate\" class=\"node cluster\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"compound-nodes\">\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.compoundNodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldCompoundNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:g *ngIf=\"!nodeTemplate\" class=\"node compound-node\">\n            <svg:rect\n              [attr.width]=\"node.dimension.width\"\n              [attr.height]=\"node.dimension.height\"\n              [attr.fill]=\"node.data?.color\"\n            />\n            <svg:text alignment-baseline=\"central\" [attr.x]=\"10\" [attr.y]=\"node.dimension.height / 2\">\n              {{ node.label }}\n            </svg:text>\n          </svg:g>\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"links\">\n        <svg:g #linkElement *ngFor=\"let link of graph.edges; trackBy: trackLinkBy\" class=\"link-group\" [id]=\"link.id\">\n          <ng-container\n            *ngIf=\"linkTemplate\"\n            [ngTemplateOutlet]=\"linkTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: link }\"\n          ></ng-container>\n          <svg:path *ngIf=\"!linkTemplate\" class=\"edge\" [attr.d]=\"link.line\" />\n        </svg:g>\n      </svg:g>\n\n      <svg:g class=\"nodes\" #nodeGroup>\n        <svg:g\n          #nodeElement\n          *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n          class=\"node-group\"\n          [class.old-node]=\"animate && oldNodes.has(node.id)\"\n          [id]=\"node.id\"\n          [attr.transform]=\"node.transform\"\n          (click)=\"onClick(node)\"\n          (mousedown)=\"onNodeMouseDown($event, node)\"\n        >\n          <ng-container\n            *ngIf=\"nodeTemplate && !node.hidden\"\n            [ngTemplateOutlet]=\"nodeTemplate\"\n            [ngTemplateOutletContext]=\"{ $implicit: node }\"\n          ></ng-container>\n          <svg:circle\n            *ngIf=\"!nodeTemplate\"\n            r=\"10\"\n            [attr.cx]=\"node.dimension.width / 2\"\n            [attr.cy]=\"node.dimension.height / 2\"\n            [attr.fill]=\"node.data?.color\"\n          />\n        </svg:g>\n      </svg:g>\n    </svg:g>\n\n    <svg:clipPath [attr.id]=\"minimapClipPathId\">\n      <svg:rect\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n      ></svg:rect>\n    </svg:clipPath>\n\n    <svg:g\n      class=\"minimap\"\n      *ngIf=\"showMiniMap\"\n      [attr.transform]=\"minimapTransform\"\n      [attr.clip-path]=\"'url(#' + minimapClipPathId + ')'\"\n    >\n      <svg:rect\n        class=\"minimap-background\"\n        [attr.width]=\"graphDims.width / minimapScaleCoefficient\"\n        [attr.height]=\"graphDims.height / minimapScaleCoefficient\"\n        (mousedown)=\"onMinimapPanTo($event)\"\n      ></svg:rect>\n\n      <svg:g\n        [style.transform]=\"\n          'translate(' +\n          -minimapOffsetX / minimapScaleCoefficient +\n          'px,' +\n          -minimapOffsetY / minimapScaleCoefficient +\n          'px)'\n        \"\n      >\n        <svg:g class=\"minimap-nodes\" [style.transform]=\"'scale(' + 1 / minimapScaleCoefficient + ')'\">\n          <svg:g\n            #nodeElement\n            *ngFor=\"let node of graph.nodes; trackBy: trackNodeBy\"\n            class=\"node-group\"\n            [class.old-node]=\"animate && oldNodes.has(node.id)\"\n            [id]=\"node.id\"\n            [attr.transform]=\"node.transform\"\n          >\n            <ng-container\n              *ngIf=\"miniMapNodeTemplate\"\n              [ngTemplateOutlet]=\"miniMapNodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <ng-container\n              *ngIf=\"!miniMapNodeTemplate && nodeTemplate\"\n              [ngTemplateOutlet]=\"nodeTemplate\"\n              [ngTemplateOutletContext]=\"{ $implicit: node }\"\n            ></ng-container>\n            <svg:circle\n              *ngIf=\"!nodeTemplate && !miniMapNodeTemplate\"\n              r=\"10\"\n              [attr.cx]=\"node.dimension.width / 2 / minimapScaleCoefficient\"\n              [attr.cy]=\"node.dimension.height / 2 / minimapScaleCoefficient\"\n              [attr.fill]=\"node.data?.color\"\n            />\n          </svg:g>\n        </svg:g>\n\n        <svg:rect\n          [attr.transform]=\"\n            'translate(' +\n            panOffsetX / zoomLevel / -minimapScaleCoefficient +\n            ',' +\n            panOffsetY / zoomLevel / -minimapScaleCoefficient +\n            ')'\n          \"\n          class=\"minimap-drag\"\n          [class.panning]=\"isMinimapPanning\"\n          [attr.width]=\"width / minimapScaleCoefficient / zoomLevel\"\n          [attr.height]=\"height / minimapScaleCoefficient / zoomLevel\"\n          (mousedown)=\"onMinimapDragMouseDown()\"\n        ></svg:rect>\n      </svg:g>\n    </svg:g>\n  </svg:svg>\n</div>\n", styles: [".minimap .minimap-background{fill:#0000001a}.minimap .minimap-drag{fill:#0003;stroke:#fff;stroke-width:1px;stroke-dasharray:2px;stroke-dashoffset:2px;cursor:pointer}.minimap .minimap-drag.panning{fill:#0000004d}.minimap .minimap-nodes{opacity:.5;pointer-events:none}.graph{-webkit-user-select:none;user-select:none}.graph .edge{stroke:#666;fill:none}.graph .edge .edge-label{stroke:none;font-size:12px;fill:#251e1e}.graph .panning-rect{fill:#0000;cursor:move}.graph .node-group.old-node{transition:transform .5s ease-in-out}.graph .node-group .node:focus{outline:none}.graph .compound-node rect{opacity:.5}.graph .cluster rect{opacity:.2}\n"] }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: i0.ChangeDetectorRef }, { type: i1.LayoutService }], propDecorators: { nodes: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGguY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWdyYXBoL3NyYy9saWIvZ3JhcGgvZ3JhcGguY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWdyYXBoL3NyYy9saWIvZ3JhcGgvZ3JhcGguY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLElBQUksWUFBWSxFQUFFLE9BQU8sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQzFGLE9BQU8sRUFFTCx1QkFBdUIsRUFDdkIsU0FBUyxFQUNULFlBQVksRUFFWixZQUFZLEVBQ1osWUFBWSxFQUNaLEtBQUssRUFHTCxNQUFNLEVBR04sWUFBWSxFQUNaLGlCQUFpQixFQUtsQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3RDLE9BQU8sS0FBSyxLQUFLLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sS0FBSyxJQUFJLE1BQU0sU0FBUyxDQUFDO0FBQ2hDLE9BQU8sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxTQUFTLElBQUksbUJBQW1CLEVBQUUsT0FBTyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9GLE9BQU8sRUFBUyxZQUFZLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDaEUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFNbkcsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNqQyxPQUFPLEVB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QW9CLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBNkI5QyxTQUFTO3NCQURSLFlBQVk7dUJBQUMsa0JBQWtCLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyByZW5hbWUgdHJhbnNpdGlvbiBkdWUgdG8gY29uZmxpY3Qgd2l0aCBkMyB0cmFuc2l0aW9uXG5pbXBvcnQgeyBhbmltYXRlLCBzdHlsZSwgdHJhbnNpdGlvbiBhcyBuZ1RyYW5zaXRpb24sIHRyaWdnZXIgfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcbmltcG9ydCB7XG4gIEFmdGVyVmlld0luaXQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDb21wb25lbnQsXG4gIENvbnRlbnRDaGlsZCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0TGlzdGVuZXIsXG4gIElucHV0LFxuICBPbkRlc3Ryb3ksXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGRyZW4sXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBOZ1pvbmUsXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBPbkNoYW5nZXMsXG4gIFNpbXBsZUNoYW5nZXNcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBzZWxlY3QgfSBmcm9tICdkMy1zZWxlY3Rpb24nO1xuaW1wb3J0ICogYXMgc2hhcGUgZnJvbSAnZDMtc2hhcGUnO1xuaW1wb3J0ICogYXMgZWFzZSBmcm9tICdkMy1lYXNlJztcbmltcG9ydCAnZDMtdHJhbnNpdGlvbic7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBTdWJzY3JpcHRpb24sIG9mLCBmcm9tRXZlbnQgYXMgb2JzZXJ2YWJsZUZyb21FdmVudCwgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZmlyc3QsIGRlYm91bmNlVGltZSwgdGFrZVVudGlsIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgaWRlbnRpdHksIHNjYWxlLCBzbW9vdGhNYXRyaXgsIHRvU1ZHLCB0cmFuc2Zvcm0sIHRyYW5zbGF0ZSB9IGZyb20gJ3RyYW5zZm9ybWF0aW9uLW1hdHJpeCc7XG5pbXBvcnQgeyBMYXlvdXQgfSBmcm9tICcuLi9tb2RlbHMvbGF5b3V0Lm1vZGVsJztcbmltcG9ydCB7IExheW91dFNlcnZpY2UgfSBmcm9tICcuL2xheW91dHMvbGF5b3V0LnNlcnZpY2UnO1xuaW1wb3J0IHsgRWRnZSB9IGZyb20gJy4uL21vZGVscy9lZGdlLm1vZGVsJztcbmltcG9ydCB7IE5vZGUsIENsdXN0ZXJOb2RlLCBDb21wb3VuZE5vZGUgfSBmcm9tICcuLi9tb2RlbHMvbm9kZS5tb2RlbCc7XG5pbXBvcnQgeyBHcmFwaCB9IGZyb20gJy4uL21vZGVscy9ncmFwaC5tb2RlbCc7XG5pbXBvcnQgeyBpZCB9IGZyb20gJy4uL3V0aWxzL2lkJztcbmltcG9ydCB7IFBhbm5pbmdBeGlzIH0gZnJvbSAnLi4vZW51bXMvcGFubmluZy5lbnVtJztcbmltcG9ydCB7IE1pbmlNYXBQb3NpdGlvbiB9IGZyb20gJy4uL2VudW1zL21pbmktbWFwLXBvc2l0aW9uLmVudW0nO1xuaW1wb3J0IHsgdGhyb3R0bGVhYmxlIH0gZnJvbSAnLi4vdXRpbHMvdGhyb3R0bGUnO1xuaW1wb3J0IHsgQ29sb3JIZWxwZXIgfSBmcm9tICcuLi91dGlscy9jb2xvci5oZWxwZXInO1xuaW1wb3J0IHsgVmlld0RpbWVuc2lvbnMsIGNhbGN1bGF0ZVZpZXdEaW1lbnNpb25zIH0gZnJvbSAnLi4vdXRpbHMvdmlldy1kaW1lbnNpb25zLmhlbHBlcic7XG5pbXBvcnQgeyBWaXNpYmlsaXR5T2JzZXJ2ZXIgfSBmcm9tICcuLi91dGlscy92aXNpYmlsaXR5LW9ic2VydmVyJztcblxuLyoqXG4gKiBNYXRyaXhcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXRyaXgge1xuICBhOiBudW1iZXI7XG4gIGI6IG51bWJlcjtcbiAgYzogbnVtYmVyO1xuICBkOiBudW1iZXI7XG4gIGU6IG51bWJlcjtcbiAgZjogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5neEdyYXBoWm9vbU9wdGlvbnMge1xuICBhdXRvQ2VudGVyPzogYm9vbGVhbjtcbiAgZm9yY2U/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZW51bSBOZ3hHcmFwaFN0YXRlcyB7XG4gIEluaXQgPSAnaW5pdCcsXG4gIFN1YnNjcmliZSA9ICdzdWJzY3JpYmUnLFxuICBUcmFuc2Zvcm0gPSAndHJhbnNmb3JtJyxcbiAgLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXNoYWRvdyAqL1xuICBPdXRwdXQgPSAnb3V0cHV0J1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5neEdyYXBoU3RhdGVDaGFuZ2VFdmVudCB7XG4gIHN0YXRlOiBOZ3hHcmFwaFN0YXRlcztcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnbmd4LWdyYXBoJyxcbiAgc3R5bGVVcmxzOiBbJy4vZ3JhcGguY29tcG9uZW50LnNjc3MnXSxcbiAgdGVtcGxhdGVVcmw6ICdncmFwaC5jb21wb25lbnQuaHRtbCcsXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICBhbmltYXRpb25zOiBbXG4gICAgdHJpZ2dlcignYW5pbWF0aW9uU3RhdGUnLCBbXG4gICAgICBuZ1RyYW5zaXRpb24oJzplbnRlcicsIFtzdHlsZSh7IG9wYWNpdHk6IDAgfSksIGFuaW1hdGUoJzUwMG1zIDEwMG1zJywgc3R5bGUoeyBvcGFjaXR5OiAxIH0pKV0pXG4gICAgXSlcbiAgXVxufSlcbmV4cG9ydCBjbGFzcyBHcmFwaENvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIEFmdGVyVmlld0luaXQge1xuICBASW5wdXQoKSBub2RlczogTm9kZVtdID0gW107XG4gIEBJbnB1dCgpIGNsdXN0ZXJzOiBDbHVzdGVyTm9kZVtdID0gW107XG4gIEBJbnB1dCgpIGNvbXBvdW5kTm9kZXM6IENvbXBvdW5kTm9kZVtdID0gW107XG4gIEBJbnB1dCgpIGxpbmtzOiBFZGdlW10gPSBbXTtcbiAgQElucHV0KCkgYWN0aXZlRW50cmllczogYW55W10gPSBbXTtcbiAgQElucHV0KCkgY3VydmU6IGFueTtcbiAgQElucHV0KCkgZHJhZ2dpbmdFbmFibGVkID0gdHJ1ZTtcbiAgQElucHV0KCkgbm9kZUhlaWdodDogbnVtYmVyO1xuICBASW5wdXQoKSBub2RlTWF4SGVpZ2h0OiBudW1iZXI7XG4gIEBJbnB1dCgpIG5vZGVNaW5IZWlnaHQ6IG51bWJlcjtcbiAgQElucHV0KCkgbm9kZVdpZHRoOiBudW1iZXI7XG4gIEBJbnB1dCgpIG5vZGVNaW5XaWR0aDogbnVtYmVyO1xuICBASW5wdXQoKSBub2RlTWF4V2lkdGg6IG51bWJlcjtcbiAgQElucHV0KCkgcGFubmluZ0VuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBwYW5uaW5nQXhpczogUGFubmluZ0F4aXMgPSBQYW5uaW5nQXhpcy5Cb3RoO1xuICBASW5wdXQoKSBlbmFibGVab29tID0gdHJ1ZTtcbiAgQElucHV0KCkgem9vbVNwZWVkID0gMC4xO1xuICBASW5wdXQoKSBtaW5ab29tTGV2ZWwgPSAwLjE7XG4gIEBJbnB1dCgpIG1heFpvb21MZXZlbCA9IDQuMDtcbiAgQElucHV0KCkgYXV0b1pvb20gPSBmYWxzZTtcbiAgQElucHV0KCkgcGFuT25ab29tID0gdHJ1ZTtcbiAgQElucHV0KCkgYW5pbWF0ZT8gPSBmYWxzZTtcbiAgQElucHV0KCkgYXV0b0NlbnRlciA9IGZhbHNlO1xuICBASW5wdXQoKSB1cGRhdGUkOiBPYnNlcnZhYmxlPGFueT47XG4gIEBJbnB1dCgpIGNlbnRlciQ6IE9ic2VydmFibGU8YW55PjtcbiAgQElucHV0KCkgem9vbVRvRml0JDogT2JzZXJ2YWJsZTxOZ3hHcmFwaFpvb21PcHRpb25zPjtcbiAgQElucHV0KCkgcGFuVG9Ob2RlJDogT2JzZXJ2YWJsZTxhbnk+O1xuICBASW5wdXQoKSBsYXlvdXQ6IHN0cmluZyB8IExheW91dDtcbiAgQElucHV0KCkgbGF5b3V0U2V0dGluZ3M6IGFueTtcbiAgQElucHV0KCkgZW5hYmxlVHJhY2twYWRTdXBwb3J0ID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNob3dNaW5pTWFwOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIG1pbmlNYXBNYXhXaWR0aDogbnVtYmVyID0gMTAwO1xuICBASW5wdXQoKSBtaW5pTWFwTWF4SGVpZ2h0OiBudW1iZXI7XG4gIEBJbnB1dCgpIG1pbmlNYXBQb3NpdGlvbjogTWluaU1hcFBvc2l0aW9uID0gTWluaU1hcFBvc2l0aW9uLlVwcGVyUmlnaHQ7XG4gIEBJbnB1dCgpIHZpZXc6IFtudW1iZXIsIG51bWJlcl07XG4gIEBJbnB1dCgpIHNjaGVtZTogYW55ID0gJ2Nvb2wnO1xuICBASW5wdXQoKSBjdXN0b21Db2xvcnM6IGFueTtcbiAgQElucHV0KCkgZGVmZXJEaXNwbGF5VW50aWxQb3NpdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjZW50ZXJOb2Rlc09uUG9zaXRpb25DaGFuZ2UgPSB0cnVlO1xuICBASW5wdXQoKSBlbmFibGVQcmVVcGRhdGVUcmFuc2Zvcm0gPSB0cnVlO1xuXG4gIEBPdXRwdXQoKSBzZWxlY3QgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIEBPdXRwdXQoKSBhY3RpdmF0ZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIEBPdXRwdXQoKSBkZWFjdGl2YXRlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgQE91dHB1dCgpIHpvb21DaGFuZ2U6IEV2ZW50RW1pdHRlcjxudW1iZXI+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAT3V0cHV0KCkgY2xpY2tIYW5kbGVyOiBFdmVudEVtaXR0ZXI8TW91c2VFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIEBPdXRwdXQoKSBzdGF0ZUNoYW5nZTogRXZlbnRFbWl0dGVyPE5neEdyYXBoU3RhdGVDaGFuZ2VFdmVudD4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgQENvbnRlbnRDaGlsZCgnbGlua1RlbXBsYXRlJykgbGlua1RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAQ29udGVudENoaWxkKCdub2RlVGVtcGxhdGUnKSBub2RlVGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBDb250ZW50Q2hpbGQoJ2NsdXN0ZXJUZW1wbGF0ZScpIGNsdXN0ZXJUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcbiAgQENvbnRlbnRDaGlsZCgnZGVmc1RlbXBsYXRlJykgZGVmc1RlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBAQ29udGVudENoaWxkKCdtaW5pTWFwTm9kZVRlbXBsYXRlJykgbWluaU1hcE5vZGVUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICBAVmlld0NoaWxkcmVuKCdub2RlRWxlbWVudCcpIG5vZGVFbGVtZW50czogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuICBAVmlld0NoaWxkcmVuKCdsaW5rRWxlbWVudCcpIGxpbmtFbGVtZW50czogUXVlcnlMaXN0PEVsZW1lbnRSZWY+O1xuXG4gIHB1YmxpYyBjaGFydFdpZHRoOiBhbnk7XG5cbiAgcHJpdmF0ZSBpc01vdXNlTW92ZUNhbGxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGdyYXBoU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIGNvbG9yczogQ29sb3JIZWxwZXI7XG4gIGRpbXM6IFZpZXdEaW1lbnNpb25zO1xuICBzZXJpZXNEb21haW46IGFueTtcbiAgdHJhbnNmb3JtOiBzdHJpbmc7XG4gIGlzUGFubmluZyA9IGZhbHNlO1xuICBpc0RyYWdnaW5nID0gZmFsc2U7XG4gIGRyYWdnaW5nTm9kZTogTm9kZTtcbiAgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgZ3JhcGg6IEdyYXBoO1xuICBncmFwaERpbXM6IGFueSA9IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuICBfb2xkTGlua3M6IEVkZ2VbXSA9IFtdO1xuICBvbGROb2RlczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gIG9sZENsdXN0ZXJzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcbiAgb2xkQ29tcG91bmROb2RlczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gIHRyYW5zZm9ybWF0aW9uTWF0cml4OiBNYXRyaXggPSBpZGVudGl0eSgpO1xuICBfdG91Y2hMYXN0WCA9IG51bGw7XG4gIF90b3VjaExhc3RZID0gbnVsbDtcbiAgbWluaW1hcFNjYWxlQ29lZmZpY2llbnQ6IG51bWJlciA9IDM7XG4gIG1pbmltYXBUcmFuc2Zvcm06IHN0cmluZztcbiAgbWluaW1hcE9mZnNldFg6IG51bWJlciA9IDA7XG4gIG1pbmltYXBPZmZzZXRZOiBudW1iZXIgPSAwO1xuICBpc01pbmltYXBQYW5uaW5nID0gZmFsc2U7XG4gIG1pbmltYXBDbGlwUGF0aElkOiBzdHJpbmc7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICByZXNpemVTdWJzY3JpcHRpb246IGFueTtcbiAgdmlzaWJpbGl0eU9ic2VydmVyOiBWaXNpYmlsaXR5T2JzZXJ2ZXI7XG4gIHByaXZhdGUgZGVzdHJveSQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgZWw6IEVsZW1lbnRSZWYsXG4gICAgcHVibGljIHpvbmU6IE5nWm9uZSxcbiAgICBwdWJsaWMgY2Q6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByaXZhdGUgbGF5b3V0U2VydmljZTogTGF5b3V0U2VydmljZVxuICApIHt9XG5cbiAgQElucHV0KClcbiAgZ3JvdXBSZXN1bHRzQnk6IChub2RlOiBhbnkpID0+IHN0cmluZyA9IG5vZGUgPT4gbm9kZS5sYWJlbDtcblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IHpvb20gbGV2ZWxcbiAgICovXG4gIGdldCB6b29tTGV2ZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXguYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGN1cnJlbnQgem9vbSBsZXZlbFxuICAgKi9cbiAgQElucHV0KCd6b29tTGV2ZWwnKVxuICBzZXQgem9vbUxldmVsKGxldmVsKSB7XG4gICAgdGhpcy56b29tVG8oTnVtYmVyKGxldmVsKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IGB4YCBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhcbiAgICovXG4gIGdldCBwYW5PZmZzZXRYKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LmU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjdXJyZW50IGB4YCBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhcbiAgICovXG4gIEBJbnB1dCgncGFuT2Zmc2V0WCcpXG4gIHNldCBwYW5PZmZzZXRYKHgpIHtcbiAgICB0aGlzLnBhblRvKE51bWJlcih4KSwgbnVsbCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IGB5YCBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhcbiAgICovXG4gIGdldCBwYW5PZmZzZXRZKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LmY7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjdXJyZW50IGB5YCBwb3NpdGlvbiBvZiB0aGUgZ3JhcGhcbiAgICovXG4gIEBJbnB1dCgncGFuT2Zmc2V0WScpXG4gIHNldCBwYW5PZmZzZXRZKHkpIHtcbiAgICB0aGlzLnBhblRvKG51bGwsIE51bWJlcih5KSk7XG4gIH1cblxuICAvKipcbiAgICogQW5ndWxhciBsaWZlY3ljbGUgZXZlbnRcbiAgICpcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy51cGRhdGUkKSB7XG4gICAgICB0aGlzLnVwZGF0ZSQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jZW50ZXIkKSB7XG4gICAgICB0aGlzLmNlbnRlciQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2VudGVyKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy56b29tVG9GaXQkKSB7XG4gICAgICB0aGlzLnpvb21Ub0ZpdCQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpLnN1YnNjcmliZShvcHRpb25zID0+IHtcbiAgICAgICAgdGhpcy56b29tVG9GaXQob3B0aW9ucyA/IG9wdGlvbnMgOiB7fSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYW5Ub05vZGUkKSB7XG4gICAgICB0aGlzLnBhblRvTm9kZSQucGlwZSh0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpLnN1YnNjcmliZSgobm9kZUlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGhpcy5wYW5Ub05vZGVJZChub2RlSWQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5taW5pbWFwQ2xpcFBhdGhJZCA9IGBtaW5pbWFwQ2xpcCR7aWQoKX1gO1xuICAgIHRoaXMuc3RhdGVDaGFuZ2UuZW1pdCh7IHN0YXRlOiBOZ3hHcmFwaFN0YXRlcy5TdWJzY3JpYmUgfSk7XG4gIH1cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgdGhpcy5iYXNpY1VwZGF0ZSgpO1xuICAgIGNvbnN0IHsgbGF5b3V0U2V0dGluZ3MgfSA9IGNoYW5nZXM7XG4gICAgdGhpcy5zZXRMYXlvdXQodGhpcy5sYXlvdXQpO1xuICAgIGlmIChsYXlvdXRTZXR0aW5ncykge1xuICAgICAgdGhpcy5zZXRMYXlvdXRTZXR0aW5ncyh0aGlzLmxheW91dFNldHRpbmdzKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubGF5b3V0ICYmIHRoaXMubm9kZXMgJiYgdGhpcy5saW5rcykge1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBzZXRMYXlvdXQobGF5b3V0OiBzdHJpbmcgfCBMYXlvdXQpOiB2b2lkIHtcbiAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgaWYgKCFsYXlvdXQpIHtcbiAgICAgIGxheW91dCA9ICdkYWdyZSc7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGF5b3V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5sYXlvdXQgPSB0aGlzLmxheW91dFNlcnZpY2UuZ2V0TGF5b3V0KGxheW91dCk7XG4gICAgICB0aGlzLnNldExheW91dFNldHRpbmdzKHRoaXMubGF5b3V0U2V0dGluZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHNldExheW91dFNldHRpbmdzKHNldHRpbmdzOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5sYXlvdXQgJiYgdHlwZW9mIHRoaXMubGF5b3V0ICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5sYXlvdXQuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5ndWxhciBsaWZlY3ljbGUgZXZlbnRcbiAgICpcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnVuYmluZEV2ZW50cygpO1xuICAgIGlmICh0aGlzLnZpc2liaWxpdHlPYnNlcnZlcikge1xuICAgICAgdGhpcy52aXNpYmlsaXR5T2JzZXJ2ZXIudmlzaWJsZS51bnN1YnNjcmliZSgpO1xuICAgICAgdGhpcy52aXNpYmlsaXR5T2JzZXJ2ZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICB0aGlzLmRlc3Ryb3kkLm5leHQoKTtcbiAgICB0aGlzLmRlc3Ryb3kkLmNvbXBsZXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQW5ndWxhciBsaWZlY3ljbGUgZXZlbnRcbiAgICpcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgdGhpcy5iaW5kV2luZG93UmVzaXplRXZlbnQoKTtcblxuICAgIC8vIGxpc3RlbiBmb3IgdmlzaWJpbGl0eSBvZiB0aGUgZWxlbWVudCBmb3IgaGlkZGVuIGJ5IGRlZmF1bHQgc2NlbmFyaW9cbiAgICB0aGlzLnZpc2liaWxpdHlPYnNlcnZlciA9IG5ldyBWaXNpYmlsaXR5T2JzZXJ2ZXIodGhpcy5lbCwgdGhpcy56b25lKTtcbiAgICB0aGlzLnZpc2liaWxpdHlPYnNlcnZlci52aXNpYmxlLnN1YnNjcmliZSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGUoKSk7XG4gIH1cblxuICAvKipcbiAgICogQmFzZSBjbGFzcyB1cGRhdGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBkYWcgZ3JhcGhcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICB1cGRhdGUoKTogdm9pZCB7XG4gICAgdGhpcy5iYXNpY1VwZGF0ZSgpO1xuICAgIGlmICghdGhpcy5jdXJ2ZSkge1xuICAgICAgdGhpcy5jdXJ2ZSA9IHNoYXBlLmN1cnZlQnVuZGxlLmJldGEoMSk7XG4gICAgfVxuXG4gICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICB0aGlzLmRpbXMgPSBjYWxjdWxhdGVWaWV3RGltZW5zaW9ucyh7XG4gICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5zZXJpZXNEb21haW4gPSB0aGlzLmdldFNlcmllc0RvbWFpbigpO1xuICAgICAgdGhpcy5zZXRDb2xvcnMoKTtcblxuICAgICAgdGhpcy5jcmVhdGVHcmFwaCgpO1xuICAgICAgdGhpcy51cGRhdGVUcmFuc2Zvcm0oKTtcbiAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLnN0YXRlQ2hhbmdlLmVtaXQoeyBzdGF0ZTogTmd4R3JhcGhTdGF0ZXMuSW5pdCB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhlIGRhZ3JlIGdyYXBoIGVuZ2luZVxuICAgKlxuICAgKiBAbWVtYmVyT2YgR3JhcGhDb21wb25lbnRcbiAgICovXG4gIGNyZWF0ZUdyYXBoKCk6IHZvaWQge1xuICAgIHRoaXMuZ3JhcGhTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmdyYXBoU3Vic2NyaXB0aW9uID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuICAgIGNvbnN0IGluaXRpYWxpemVOb2RlID0gKG46IE5vZGUpID0+IHtcbiAgICAgIGlmICghbi5tZXRhKSB7XG4gICAgICAgIG4ubWV0YSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCFuLmlkKSB7XG4gICAgICAgIG4uaWQgPSBpZCgpO1xuICAgICAgfVxuICAgICAgaWYgKCFuLmRpbWVuc2lvbikge1xuICAgICAgICBuLmRpbWVuc2lvbiA9IHtcbiAgICAgICAgICB3aWR0aDogdGhpcy5ub2RlV2lkdGggPyB0aGlzLm5vZGVXaWR0aCA6IDMwLFxuICAgICAgICAgIGhlaWdodDogdGhpcy5ub2RlSGVpZ2h0ID8gdGhpcy5ub2RlSGVpZ2h0IDogMzBcbiAgICAgICAgfTtcbiAgICAgICAgbi5tZXRhLmZvcmNlRGltZW5zaW9ucyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbi5tZXRhLmZvcmNlRGltZW5zaW9ucyA9IG4ubWV0YS5mb3JjZURpbWVuc2lvbnMgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBuLm1ldGEuZm9yY2VEaW1lbnNpb25zO1xuICAgICAgfVxuICAgICAgaWYgKCFuLnBvc2l0aW9uKSB7XG4gICAgICAgIG4ucG9zaXRpb24gPSB7XG4gICAgICAgICAgeDogMCxcbiAgICAgICAgICB5OiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLmRlZmVyRGlzcGxheVVudGlsUG9zaXRpb24pIHtcbiAgICAgICAgICBuLmhpZGRlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG4uZGF0YSA9IG4uZGF0YSA/IG4uZGF0YSA6IHt9O1xuICAgICAgcmV0dXJuIG47XG4gICAgfTtcblxuICAgIGNvbnN0IGluaXRpYWxpemVFZGdlID0gKGU6IEVkZ2UpID0+IHtcbiAgICAgIGlmICghZS5pZCkge1xuICAgICAgICBlLmlkID0gaWQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlO1xuICAgIH07XG5cbiAgICB0aGlzLmdyYXBoID0ge1xuICAgICAgbm9kZXM6IHRoaXMubm9kZXMubWFwKG4gPT4gaW5pdGlhbGl6ZU5vZGUobikpLFxuICAgICAgY2x1c3RlcnM6IHRoaXMuY2x1c3RlcnMubWFwKG4gPT4gaW5pdGlhbGl6ZU5vZGUobikpLFxuICAgICAgY29tcG91bmROb2RlczogdGhpcy5jb21wb3VuZE5vZGVzLm1hcChuID0+IGluaXRpYWxpemVOb2RlKG4pKSxcbiAgICAgIGVkZ2VzOiB0aGlzLmxpbmtzLm1hcChlID0+IGluaXRpYWxpemVFZGdlKGUpKVxuICAgIH07XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gdGhpcy5kcmF3KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERyYXdzIHRoZSBncmFwaCB1c2luZyBkYWdyZSBsYXlvdXRzXG4gICAqXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgZHJhdygpOiB2b2lkIHtcbiAgICAvLyBSZWNhbGN1bGF0ZSB0aGUgbGF5b3V0XG4gICAgY29uc3QgcmVzdWx0ID0gKHRoaXMubGF5b3V0IGFzIExheW91dCkucnVuKHRoaXMuZ3JhcGgpO1xuICAgIGNvbnN0IHJlc3VsdCQgPSByZXN1bHQgaW5zdGFuY2VvZiBPYnNlcnZhYmxlID8gcmVzdWx0IDogb2YocmVzdWx0KTtcbiAgICB0aGlzLmdyYXBoU3Vic2NyaXB0aW9uLmFkZChcbiAgICAgIHJlc3VsdCQuc3Vic2NyaWJlKGdyYXBoID0+IHtcbiAgICAgICAgdGhpcy5ncmFwaCA9IGdyYXBoO1xuICAgICAgICB0aGlzLnRpY2soKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHRpY2soKSB7XG4gICAgLy8gVHJhbnNwb3NlcyB2aWV3IG9wdGlvbnMgdG8gdGhlIG5vZGVcbiAgICBjb25zdCBvbGROb2RlczogU2V0PHN0cmluZz4gPSBuZXcgU2V0KCk7XG4gICAgY29uc3Qgb2xkQ2x1c3RlcnM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IG9sZENvbXBvdW5kTm9kZXM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXG4gICAgdGhpcy5ncmFwaC5ub2Rlcy5mb3JFYWNoKG4gPT4ge1xuICAgICAgbi50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7bi5wb3NpdGlvbi54IC0gKHRoaXMuY2VudGVyTm9kZXNPblBvc2l0aW9uQ2hhbmdlID8gbi5kaW1lbnNpb24ud2lkdGggLyAyIDogMCkgfHwgMH0sICR7XG4gICAgICAgIG4ucG9zaXRpb24ueSAtICh0aGlzLmNlbnRlck5vZGVzT25Qb3NpdGlvbkNoYW5nZSA/IG4uZGltZW5zaW9uLmhlaWdodCAvIDIgOiAwKSB8fCAwXG4gICAgICB9KWA7XG4gICAgICBpZiAoIW4uZGF0YSkge1xuICAgICAgICBuLmRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIG4uZGF0YS5jb2xvciA9IHRoaXMuY29sb3JzLmdldENvbG9yKHRoaXMuZ3JvdXBSZXN1bHRzQnkobikpO1xuICAgICAgaWYgKHRoaXMuZGVmZXJEaXNwbGF5VW50aWxQb3NpdGlvbikge1xuICAgICAgICBuLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgb2xkTm9kZXMuYWRkKG4uaWQpO1xuICAgIH0pO1xuXG4gICAgKHRoaXMuZ3JhcGguY2x1c3RlcnMgfHwgW10pLmZvckVhY2gobiA9PiB7XG4gICAgICBuLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHtuLnBvc2l0aW9uLnggLSAodGhpcy5jZW50ZXJOb2Rlc09uUG9zaXRpb25DaGFuZ2UgPyBuLmRpbWVuc2lvbi53aWR0aCAvIDIgOiAwKSB8fCAwfSwgJHtcbiAgICAgICAgbi5wb3NpdGlvbi55IC0gKHRoaXMuY2VudGVyTm9kZXNPblBvc2l0aW9uQ2hhbmdlID8gbi5kaW1lbnNpb24uaGVpZ2h0IC8gMiA6IDApIHx8IDBcbiAgICAgIH0pYDtcbiAgICAgIGlmICghbi5kYXRhKSB7XG4gICAgICAgIG4uZGF0YSA9IHt9O1xuICAgICAgfVxuICAgICAgbi5kYXRhLmNvbG9yID0gdGhpcy5jb2xvcnMuZ2V0Q29sb3IodGhpcy5ncm91cFJlc3VsdHNCeShuKSk7XG4gICAgICBpZiAodGhpcy5kZWZlckRpc3BsYXlVbnRpbFBvc2l0aW9uKSB7XG4gICAgICAgIG4uaGlkZGVuID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBvbGRDbHVzdGVycy5hZGQobi5pZCk7XG4gICAgfSk7XG5cbiAgICAodGhpcy5ncmFwaC5jb21wb3VuZE5vZGVzIHx8IFtdKS5mb3JFYWNoKG4gPT4ge1xuICAgICAgbi50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7bi5wb3NpdGlvbi54IC0gKHRoaXMuY2VudGVyTm9kZXNPblBvc2l0aW9uQ2hhbmdlID8gbi5kaW1lbnNpb24ud2lkdGggLyAyIDogMCkgfHwgMH0sICR7XG4gICAgICAgIG4ucG9zaXRpb24ueSAtICh0aGlzLmNlbnRlck5vZGVzT25Qb3NpdGlvbkNoYW5nZSA/IG4uZGltZW5zaW9uLmhlaWdodCAvIDIgOiAwKSB8fCAwXG4gICAgICB9KWA7XG4gICAgICBpZiAoIW4uZGF0YSkge1xuICAgICAgICBuLmRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIG4uZGF0YS5jb2xvciA9IHRoaXMuY29sb3JzLmdldENvbG9yKHRoaXMuZ3JvdXBSZXN1bHRzQnkobikpO1xuICAgICAgaWYgKHRoaXMuZGVmZXJEaXNwbGF5VW50aWxQb3NpdGlvbikge1xuICAgICAgICBuLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgb2xkQ29tcG91bmROb2Rlcy5hZGQobi5pZCk7XG4gICAgfSk7XG5cbiAgICAvLyBQcmV2ZW50IGFuaW1hdGlvbnMgb24gbmV3IG5vZGVzXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLm9sZE5vZGVzID0gb2xkTm9kZXM7XG4gICAgICB0aGlzLm9sZENsdXN0ZXJzID0gb2xkQ2x1c3RlcnM7XG4gICAgICB0aGlzLm9sZENvbXBvdW5kTm9kZXMgPSBvbGRDb21wb3VuZE5vZGVzO1xuICAgIH0sIDUwMCk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGxhYmVscyB0byB0aGUgbmV3IHBvc2l0aW9uc1xuICAgIGNvbnN0IG5ld0xpbmtzID0gW107XG4gICAgZm9yIChjb25zdCBlZGdlTGFiZWxJZCBpbiB0aGlzLmdyYXBoLmVkZ2VMYWJlbHMpIHtcbiAgICAgIGNvbnN0IGVkZ2VMYWJlbCA9IHRoaXMuZ3JhcGguZWRnZUxhYmVsc1tlZGdlTGFiZWxJZF07XG5cbiAgICAgIGNvbnN0IG5vcm1LZXkgPSBlZGdlTGFiZWxJZC5yZXBsYWNlKC9bXlxcdy1dKi9nLCAnJyk7XG5cbiAgICAgIGNvbnN0IGlzTXVsdGlncmFwaCA9XG4gICAgICAgIHRoaXMubGF5b3V0ICYmIHR5cGVvZiB0aGlzLmxheW91dCAhPT0gJ3N0cmluZycgJiYgdGhpcy5sYXlvdXQuc2V0dGluZ3MgJiYgdGhpcy5sYXlvdXQuc2V0dGluZ3MubXVsdGlncmFwaDtcblxuICAgICAgbGV0IG9sZExpbmsgPSBpc011bHRpZ3JhcGhcbiAgICAgICAgPyB0aGlzLl9vbGRMaW5rcy5maW5kKG9sID0+IGAke29sLnNvdXJjZX0ke29sLnRhcmdldH0ke29sLmlkfWAgPT09IG5vcm1LZXkpXG4gICAgICAgIDogdGhpcy5fb2xkTGlua3MuZmluZChvbCA9PiBgJHtvbC5zb3VyY2V9JHtvbC50YXJnZXR9YCA9PT0gbm9ybUtleSk7XG5cbiAgICAgIGNvbnN0IGxpbmtGcm9tR3JhcGggPSBpc011bHRpZ3JhcGhcbiAgICAgICAgPyB0aGlzLmdyYXBoLmVkZ2VzLmZpbmQobmwgPT4gYCR7bmwuc291cmNlfSR7bmwudGFyZ2V0fSR7bmwuaWR9YCA9PT0gbm9ybUtleSlcbiAgICAgICAgOiB0aGlzLmdyYXBoLmVkZ2VzLmZpbmQobmwgPT4gYCR7bmwuc291cmNlfSR7bmwudGFyZ2V0fWAgPT09IG5vcm1LZXkpO1xuXG4gICAgICBpZiAoIW9sZExpbmspIHtcbiAgICAgICAgb2xkTGluayA9IGxpbmtGcm9tR3JhcGggfHwgZWRnZUxhYmVsO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgb2xkTGluay5kYXRhICYmXG4gICAgICAgIGxpbmtGcm9tR3JhcGggJiZcbiAgICAgICAgbGlua0Zyb21HcmFwaC5kYXRhICYmXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KG9sZExpbmsuZGF0YSkgIT09IEpTT04uc3RyaW5naWZ5KGxpbmtGcm9tR3JhcGguZGF0YSlcbiAgICAgICkge1xuICAgICAgICAvLyBDb21wYXJlIG9sZCBsaW5rIHRvIG5ldyBsaW5rIGFuZCByZXBsYWNlIGlmIG5vdCBlcXVhbFxuICAgICAgICBvbGRMaW5rLmRhdGEgPSBsaW5rRnJvbUdyYXBoLmRhdGE7XG4gICAgICB9XG5cbiAgICAgIG9sZExpbmsub2xkTGluZSA9IG9sZExpbmsubGluZTtcblxuICAgICAgY29uc3QgcG9pbnRzID0gZWRnZUxhYmVsLnBvaW50cztcbiAgICAgIGNvbnN0IGxpbmUgPSB0aGlzLmdlbmVyYXRlTGluZShwb2ludHMpO1xuXG4gICAgICBjb25zdCBuZXdMaW5rID0gT2JqZWN0LmFzc2lnbih7fSwgb2xkTGluayk7XG4gICAgICBuZXdMaW5rLmxpbmUgPSBsaW5lO1xuICAgICAgbmV3TGluay5wb2ludHMgPSBwb2ludHM7XG5cbiAgICAgIHRoaXMudXBkYXRlTWlkcG9pbnRPbkVkZ2UobmV3TGluaywgcG9pbnRzKTtcblxuICAgICAgY29uc3QgdGV4dFBvcyA9IHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGggLyAyKV07XG4gICAgICBpZiAodGV4dFBvcykge1xuICAgICAgICBuZXdMaW5rLnRleHRUcmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7dGV4dFBvcy54IHx8IDB9LCR7dGV4dFBvcy55IHx8IDB9KWA7XG4gICAgICB9XG5cbiAgICAgIG5ld0xpbmsudGV4dEFuZ2xlID0gMDtcbiAgICAgIGlmICghbmV3TGluay5vbGRMaW5lKSB7XG4gICAgICAgIG5ld0xpbmsub2xkTGluZSA9IG5ld0xpbmsubGluZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jYWxjRG9taW5hbnRCYXNlbGluZShuZXdMaW5rKTtcbiAgICAgIG5ld0xpbmtzLnB1c2gobmV3TGluayk7XG4gICAgfVxuXG4gICAgdGhpcy5ncmFwaC5lZGdlcyA9IG5ld0xpbmtzO1xuXG4gICAgLy8gTWFwIHRoZSBvbGQgbGlua3MgZm9yIGFuaW1hdGlvbnNcbiAgICBpZiAodGhpcy5ncmFwaC5lZGdlcykge1xuICAgICAgdGhpcy5fb2xkTGlua3MgPSB0aGlzLmdyYXBoLmVkZ2VzLm1hcChsID0+IHtcbiAgICAgICAgY29uc3QgbmV3TCA9IE9iamVjdC5hc3NpZ24oe30sIGwpO1xuICAgICAgICBuZXdMLm9sZExpbmUgPSBsLmxpbmU7XG4gICAgICAgIHJldHVybiBuZXdMO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBseU5vZGVEaW1lbnNpb25zKCk7XG4gICAgdGhpcy5yZWRyYXdMaW5lcygpO1xuICAgIHRoaXMudXBkYXRlTWluaW1hcCgpO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMuYXBwbHlOb2RlRGltZW5zaW9ucygpO1xuICAgICAgdGhpcy5yZWRyYXdMaW5lcygpO1xuICAgICAgdGhpcy51cGRhdGVNaW5pbWFwKCk7XG5cbiAgICAgIGlmICh0aGlzLmF1dG9ab29tKSB7XG4gICAgICAgIHRoaXMuem9vbVRvRml0KHsgYXV0b0NlbnRlcjogdGhpcy5hdXRvQ2VudGVyID8gdGhpcy5hdXRvQ2VudGVyIDogZmFsc2UgfSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYXV0b0NlbnRlcikge1xuICAgICAgICAvLyBBdXRvLWNlbnRlciB3aGVuIHJlbmRlcmluZ1xuICAgICAgICB0aGlzLmNlbnRlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy5zdGF0ZUNoYW5nZS5lbWl0KHsgc3RhdGU6IE5neEdyYXBoU3RhdGVzLk91dHB1dCB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICBnZXRNaW5pbWFwVHJhbnNmb3JtKCk6IHN0cmluZyB7XG4gICAgc3dpdGNoICh0aGlzLm1pbmlNYXBQb3NpdGlvbikge1xuICAgICAgY2FzZSBNaW5pTWFwUG9zaXRpb24uVXBwZXJMZWZ0OiB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cbiAgICAgIGNhc2UgTWluaU1hcFBvc2l0aW9uLlVwcGVyUmlnaHQ6IHtcbiAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh0aGlzLmRpbXMud2lkdGggLSB0aGlzLmdyYXBoRGltcy53aWR0aCAvIHRoaXMubWluaW1hcFNjYWxlQ29lZmZpY2llbnQpICsgJywnICsgMCArICcpJztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZUdyYXBoRGltcygpIHtcbiAgICBsZXQgbWluWCA9ICtJbmZpbml0eTtcbiAgICBsZXQgbWF4WCA9IC1JbmZpbml0eTtcbiAgICBsZXQgbWluWSA9ICtJbmZpbml0eTtcbiAgICBsZXQgbWF4WSA9IC1JbmZpbml0eTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ncmFwaC5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuZ3JhcGgubm9kZXNbaV07XG4gICAgICBtaW5YID0gbm9kZS5wb3NpdGlvbi54IDwgbWluWCA/IG5vZGUucG9zaXRpb24ueCA6IG1pblg7XG4gICAgICBtaW5ZID0gbm9kZS5wb3NpdGlvbi55IDwgbWluWSA/IG5vZGUucG9zaXRpb24ueSA6IG1pblk7XG4gICAgICBtYXhYID0gbm9kZS5wb3NpdGlvbi54ICsgbm9kZS5kaW1lbnNpb24ud2lkdGggPiBtYXhYID8gbm9kZS5wb3NpdGlvbi54ICsgbm9kZS5kaW1lbnNpb24ud2lkdGggOiBtYXhYO1xuICAgICAgbWF4WSA9IG5vZGUucG9zaXRpb24ueSArIG5vZGUuZGltZW5zaW9uLmhlaWdodCA+IG1heFkgPyBub2RlLnBvc2l0aW9uLnkgKyBub2RlLmRpbWVuc2lvbi5oZWlnaHQgOiBtYXhZO1xuICAgIH1cbiAgICBtaW5YIC09IDEwMDtcbiAgICBtaW5ZIC09IDEwMDtcbiAgICBtYXhYICs9IDEwMDtcbiAgICBtYXhZICs9IDEwMDtcbiAgICB0aGlzLmdyYXBoRGltcy53aWR0aCA9IG1heFggLSBtaW5YO1xuICAgIHRoaXMuZ3JhcGhEaW1zLmhlaWdodCA9IG1heFkgLSBtaW5ZO1xuICAgIHRoaXMubWluaW1hcE9mZnNldFggPSBtaW5YO1xuICAgIHRoaXMubWluaW1hcE9mZnNldFkgPSBtaW5ZO1xuICB9XG5cbiAgQHRocm90dGxlYWJsZSg1MDApXG4gIHVwZGF0ZU1pbmltYXAoKSB7XG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBoZWlnaHQvd2lkdGggdG90YWwsIGJ1dCBvbmx5IGlmIHdlIGhhdmUgYW55IG5vZGVzXG4gICAgaWYgKHRoaXMuZ3JhcGgubm9kZXMgJiYgdGhpcy5ncmFwaC5ub2Rlcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMudXBkYXRlR3JhcGhEaW1zKCk7XG5cbiAgICAgIGlmICh0aGlzLm1pbmlNYXBNYXhXaWR0aCkge1xuICAgICAgICB0aGlzLm1pbmltYXBTY2FsZUNvZWZmaWNpZW50ID0gdGhpcy5ncmFwaERpbXMud2lkdGggLyB0aGlzLm1pbmlNYXBNYXhXaWR0aDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm1pbmlNYXBNYXhIZWlnaHQpIHtcbiAgICAgICAgdGhpcy5taW5pbWFwU2NhbGVDb2VmZmljaWVudCA9IE1hdGgubWF4KFxuICAgICAgICAgIHRoaXMubWluaW1hcFNjYWxlQ29lZmZpY2llbnQsXG4gICAgICAgICAgdGhpcy5ncmFwaERpbXMuaGVpZ2h0IC8gdGhpcy5taW5pTWFwTWF4SGVpZ2h0XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWluaW1hcFRyYW5zZm9ybSA9IHRoaXMuZ2V0TWluaW1hcFRyYW5zZm9ybSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNZWFzdXJlcyB0aGUgbm9kZSBlbGVtZW50IGFuZCBhcHBsaWVzIHRoZSBkaW1lbnNpb25zXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgYXBwbHlOb2RlRGltZW5zaW9ucygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5ub2RlRWxlbWVudHMgJiYgdGhpcy5ub2RlRWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLm5vZGVFbGVtZW50cy5mb3JFYWNoKGVsZW0gPT4ge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZWxlbS5uYXRpdmVFbGVtZW50O1xuICAgICAgICBjb25zdCBub2RlID0gdGhpcy5ncmFwaC5ub2Rlcy5maW5kKG4gPT4gbi5pZCA9PT0gbmF0aXZlRWxlbWVudC5pZCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgaGVpZ2h0XG4gICAgICAgIGxldCBkaW1zO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRpbXMgPSBuYXRpdmVFbGVtZW50LmdldEJCb3goKTtcbiAgICAgICAgICBpZiAoIWRpbXMud2lkdGggfHwgIWRpbXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgIC8vIFNraXAgZHJhd2luZyBpZiBlbGVtZW50IGlzIG5vdCBkaXNwbGF5ZWQgLSBGaXJlZm94IHdvdWxkIHRocm93IGFuIGVycm9yIGhlcmVcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubm9kZUhlaWdodCkge1xuICAgICAgICAgIG5vZGUuZGltZW5zaW9uLmhlaWdodCA9XG4gICAgICAgICAgICBub2RlLmRpbWVuc2lvbi5oZWlnaHQgJiYgbm9kZS5tZXRhLmZvcmNlRGltZW5zaW9ucyA/IG5vZGUuZGltZW5zaW9uLmhlaWdodCA6IHRoaXMubm9kZUhlaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub2RlLmRpbWVuc2lvbi5oZWlnaHQgPVxuICAgICAgICAgICAgbm9kZS5kaW1lbnNpb24uaGVpZ2h0ICYmIG5vZGUubWV0YS5mb3JjZURpbWVuc2lvbnMgPyBub2RlLmRpbWVuc2lvbi5oZWlnaHQgOiBkaW1zLmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGVNYXhIZWlnaHQpIHtcbiAgICAgICAgICBub2RlLmRpbWVuc2lvbi5oZWlnaHQgPSBNYXRoLm1heChub2RlLmRpbWVuc2lvbi5oZWlnaHQsIHRoaXMubm9kZU1heEhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubm9kZU1pbkhlaWdodCkge1xuICAgICAgICAgIG5vZGUuZGltZW5zaW9uLmhlaWdodCA9IE1hdGgubWluKG5vZGUuZGltZW5zaW9uLmhlaWdodCwgdGhpcy5ub2RlTWluSGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGVXaWR0aCkge1xuICAgICAgICAgIG5vZGUuZGltZW5zaW9uLndpZHRoID1cbiAgICAgICAgICAgIG5vZGUuZGltZW5zaW9uLndpZHRoICYmIG5vZGUubWV0YS5mb3JjZURpbWVuc2lvbnMgPyBub2RlLmRpbWVuc2lvbi53aWR0aCA6IHRoaXMubm9kZVdpZHRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgd2lkdGhcbiAgICAgICAgICBpZiAobmF0aXZlRWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dCcpLmxlbmd0aCkge1xuICAgICAgICAgICAgbGV0IG1heFRleHREaW1zOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRleHRFbGVtIG9mIG5hdGl2ZUVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3RleHQnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRCQm94ID0gdGV4dEVsZW0uZ2V0QkJveCgpO1xuICAgICAgICAgICAgICAgIGlmICghbWF4VGV4dERpbXMpIHtcbiAgICAgICAgICAgICAgICAgIG1heFRleHREaW1zID0gY3VycmVudEJCb3g7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50QkJveC53aWR0aCA+IG1heFRleHREaW1zLndpZHRoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1heFRleHREaW1zLndpZHRoID0gY3VycmVudEJCb3gud2lkdGg7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEJCb3guaGVpZ2h0ID4gbWF4VGV4dERpbXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1heFRleHREaW1zLmhlaWdodCA9IGN1cnJlbnRCQm94LmhlaWdodDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgIC8vIFNraXAgZHJhd2luZyBpZiBlbGVtZW50IGlzIG5vdCBkaXNwbGF5ZWQgLSBGaXJlZm94IHdvdWxkIHRocm93IGFuIGVycm9yIGhlcmVcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZS5kaW1lbnNpb24ud2lkdGggPVxuICAgICAgICAgICAgICBub2RlLmRpbWVuc2lvbi53aWR0aCAmJiBub2RlLm1ldGEuZm9yY2VEaW1lbnNpb25zID8gbm9kZS5kaW1lbnNpb24ud2lkdGggOiBtYXhUZXh0RGltcy53aWR0aCArIDIwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLmRpbWVuc2lvbi53aWR0aCA9XG4gICAgICAgICAgICAgIG5vZGUuZGltZW5zaW9uLndpZHRoICYmIG5vZGUubWV0YS5mb3JjZURpbWVuc2lvbnMgPyBub2RlLmRpbWVuc2lvbi53aWR0aCA6IGRpbXMud2lkdGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubm9kZU1heFdpZHRoKSB7XG4gICAgICAgICAgbm9kZS5kaW1lbnNpb24ud2lkdGggPSBNYXRoLm1heChub2RlLmRpbWVuc2lvbi53aWR0aCwgdGhpcy5ub2RlTWF4V2lkdGgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm5vZGVNaW5XaWR0aCkge1xuICAgICAgICAgIG5vZGUuZGltZW5zaW9uLndpZHRoID0gTWF0aC5taW4obm9kZS5kaW1lbnNpb24ud2lkdGgsIHRoaXMubm9kZU1pbldpZHRoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZHJhd3MgdGhlIGxpbmVzIHdoZW4gZHJhZ2dlZCBvciB2aWV3cG9ydCB1cGRhdGVkXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgcmVkcmF3TGluZXMoX2FuaW1hdGUgPSB0aGlzLmFuaW1hdGUpOiB2b2lkIHtcbiAgICB0aGlzLmxpbmtFbGVtZW50cy5mb3JFYWNoKGxpbmtFbCA9PiB7XG4gICAgICBjb25zdCBlZGdlID0gdGhpcy5ncmFwaC5lZGdlcy5maW5kKGxpbiA9PiBsaW4uaWQgPT09IGxpbmtFbC5uYXRpdmVFbGVtZW50LmlkKTtcblxuICAgICAgaWYgKGVkZ2UpIHtcbiAgICAgICAgY29uc3QgbGlua1NlbGVjdGlvbjogYW55ID0gc2VsZWN0KGxpbmtFbC5uYXRpdmVFbGVtZW50KS5zZWxlY3QoJy5saW5lJyk7XG4gICAgICAgIGxpbmtTZWxlY3Rpb25cbiAgICAgICAgICAuYXR0cignZCcsIGVkZ2Uub2xkTGluZSlcbiAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgLmVhc2UoZWFzZS5lYXNlU2luSW5PdXQpXG4gICAgICAgICAgLmR1cmF0aW9uKF9hbmltYXRlID8gNTAwIDogMClcbiAgICAgICAgICAuYXR0cignZCcsIGVkZ2UubGluZSk7XG5cbiAgICAgICAgY29uc3QgdGV4dFBhdGhTZWxlY3Rpb246IGFueSA9IHNlbGVjdCh0aGlzLmVsLm5hdGl2ZUVsZW1lbnQpLnNlbGVjdChgIyR7ZWRnZS5pZH1gKTtcbiAgICAgICAgdGV4dFBhdGhTZWxlY3Rpb25cbiAgICAgICAgICAuYXR0cignZCcsIGVkZ2Uub2xkVGV4dFBhdGgpXG4gICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5lYXNlKGVhc2UuZWFzZVNpbkluT3V0KVxuICAgICAgICAgIC5kdXJhdGlvbihfYW5pbWF0ZSA/IDUwMCA6IDApXG4gICAgICAgICAgLmF0dHIoJ2QnLCBlZGdlLnRleHRQYXRoKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZU1pZHBvaW50T25FZGdlKGVkZ2UsIGVkZ2UucG9pbnRzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgdGhlIHRleHQgZGlyZWN0aW9ucyAvIGZsaXBwaW5nXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgY2FsY0RvbWluYW50QmFzZWxpbmUobGluazogYW55KTogdm9pZCB7XG4gICAgY29uc3QgZmlyc3RQb2ludCA9IGxpbmsucG9pbnRzWzBdO1xuICAgIGNvbnN0IGxhc3RQb2ludCA9IGxpbmsucG9pbnRzW2xpbmsucG9pbnRzLmxlbmd0aCAtIDFdO1xuICAgIGxpbmsub2xkVGV4dFBhdGggPSBsaW5rLnRleHRQYXRoO1xuXG4gICAgaWYgKGxhc3RQb2ludC54IDwgZmlyc3RQb2ludC54KSB7XG4gICAgICBsaW5rLmRvbWluYW50QmFzZWxpbmUgPSAndGV4dC1iZWZvcmUtZWRnZSc7XG5cbiAgICAgIC8vIHJldmVyc2UgdGV4dCBwYXRoIGZvciB3aGVuIGl0cyBmbGlwcGVkIHVwc2lkZSBkb3duXG4gICAgICBsaW5rLnRleHRQYXRoID0gdGhpcy5nZW5lcmF0ZUxpbmUoWy4uLmxpbmsucG9pbnRzXS5yZXZlcnNlKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaW5rLmRvbWluYW50QmFzZWxpbmUgPSAndGV4dC1hZnRlci1lZGdlJztcbiAgICAgIGxpbmsudGV4dFBhdGggPSBsaW5rLmxpbmU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHRoZSBuZXcgbGluZSBwYXRoXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgZ2VuZXJhdGVMaW5lKHBvaW50czogYW55KTogYW55IHtcbiAgICBjb25zdCBsaW5lRnVuY3Rpb24gPSBzaGFwZVxuICAgICAgLmxpbmU8YW55PigpXG4gICAgICAueChkID0+IGQueClcbiAgICAgIC55KGQgPT4gZC55KVxuICAgICAgLmN1cnZlKHRoaXMuY3VydmUpO1xuICAgIHJldHVybiBsaW5lRnVuY3Rpb24ocG9pbnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBab29tIHdhcyBpbnZva2VkIGZyb20gZXZlbnRcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvblpvb20oJGV2ZW50OiBXaGVlbEV2ZW50LCBkaXJlY3Rpb246IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLmVuYWJsZVRyYWNrcGFkU3VwcG9ydCAmJiAhJGV2ZW50LmN0cmxLZXkpIHtcbiAgICAgIHRoaXMucGFuKCRldmVudC5kZWx0YVggKiAtMSwgJGV2ZW50LmRlbHRhWSAqIC0xKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB6b29tRmFjdG9yID0gMSArIChkaXJlY3Rpb24gPT09ICdpbicgPyB0aGlzLnpvb21TcGVlZCA6IC10aGlzLnpvb21TcGVlZCk7XG5cbiAgICAvLyBDaGVjayB0aGF0IHpvb21pbmcgd291bGRuJ3QgcHV0IHVzIG91dCBvZiBib3VuZHNcbiAgICBjb25zdCBuZXdab29tTGV2ZWwgPSB0aGlzLnpvb21MZXZlbCAqIHpvb21GYWN0b3I7XG4gICAgaWYgKG5ld1pvb21MZXZlbCA8PSB0aGlzLm1pblpvb21MZXZlbCB8fCBuZXdab29tTGV2ZWwgPj0gdGhpcy5tYXhab29tTGV2ZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB6b29taW5nIGlzIGVuYWJsZWQgb3Igbm90XG4gICAgaWYgKCF0aGlzLmVuYWJsZVpvb20pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYW5Pblpvb20gPT09IHRydWUgJiYgJGV2ZW50KSB7XG4gICAgICAvLyBBYnNvbHV0ZSBtb3VzZSBYL1kgb24gdGhlIHNjcmVlblxuICAgICAgY29uc3QgbW91c2VYID0gJGV2ZW50LmNsaWVudFg7XG4gICAgICBjb25zdCBtb3VzZVkgPSAkZXZlbnQuY2xpZW50WTtcblxuICAgICAgLy8gVHJhbnNmb3JtIHRoZSBtb3VzZSBYL1kgaW50byBhIFNWRyBYL1lcbiAgICAgIGNvbnN0IHN2ZyA9IHRoaXMuZWwubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcbiAgICAgIGNvbnN0IHN2Z0dyb3VwID0gc3ZnLnF1ZXJ5U2VsZWN0b3IoJ2cuY2hhcnQnKTtcblxuICAgICAgY29uc3QgcG9pbnQgPSBzdmcuY3JlYXRlU1ZHUG9pbnQoKTtcbiAgICAgIHBvaW50LnggPSBtb3VzZVg7XG4gICAgICBwb2ludC55ID0gbW91c2VZO1xuICAgICAgY29uc3Qgc3ZnUG9pbnQgPSBwb2ludC5tYXRyaXhUcmFuc2Zvcm0oc3ZnR3JvdXAuZ2V0U2NyZWVuQ1RNKCkuaW52ZXJzZSgpKTtcblxuICAgICAgLy8gUGFuem9vbVxuICAgICAgdGhpcy5wYW4oc3ZnUG9pbnQueCwgc3ZnUG9pbnQueSwgdHJ1ZSk7XG4gICAgICB0aGlzLnpvb20oem9vbUZhY3Rvcik7XG4gICAgICB0aGlzLnBhbigtc3ZnUG9pbnQueCwgLXN2Z1BvaW50LnksIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnpvb20oem9vbUZhY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhbiBieSB4L3lcbiAgICpcbiAgICogQHBhcmFtIHhcbiAgICogQHBhcmFtIHlcbiAgICovXG4gIHBhbih4OiBudW1iZXIsIHk6IG51bWJlciwgaWdub3JlWm9vbUxldmVsOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcbiAgICBjb25zdCB6b29tTGV2ZWwgPSBpZ25vcmVab29tTGV2ZWwgPyAxIDogdGhpcy56b29tTGV2ZWw7XG4gICAgdGhpcy50cmFuc2Zvcm1hdGlvbk1hdHJpeCA9IHRyYW5zZm9ybSh0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LCB0cmFuc2xhdGUoeCAvIHpvb21MZXZlbCwgeSAvIHpvb21MZXZlbCkpO1xuXG4gICAgdGhpcy51cGRhdGVUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYW4gdG8gYSBmaXhlZCB4L3lcbiAgICpcbiAgICovXG4gIHBhblRvKHg6IG51bWJlciwgeTogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHggPT09IG51bGwgfHwgeCA9PT0gdW5kZWZpbmVkIHx8IGlzTmFOKHgpIHx8IHkgPT09IG51bGwgfHwgeSA9PT0gdW5kZWZpbmVkIHx8IGlzTmFOKHkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGFuWCA9IC10aGlzLnBhbk9mZnNldFggLSB4ICogdGhpcy56b29tTGV2ZWwgKyB0aGlzLmRpbXMud2lkdGggLyAyO1xuICAgIGNvbnN0IHBhblkgPSAtdGhpcy5wYW5PZmZzZXRZIC0geSAqIHRoaXMuem9vbUxldmVsICsgdGhpcy5kaW1zLmhlaWdodCAvIDI7XG5cbiAgICB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4ID0gdHJhbnNmb3JtKFxuICAgICAgdGhpcy50cmFuc2Zvcm1hdGlvbk1hdHJpeCxcbiAgICAgIHRyYW5zbGF0ZShwYW5YIC8gdGhpcy56b29tTGV2ZWwsIHBhblkgLyB0aGlzLnpvb21MZXZlbClcbiAgICApO1xuXG4gICAgdGhpcy51cGRhdGVUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBab29tIGJ5IGEgZmFjdG9yXG4gICAqXG4gICAqL1xuICB6b29tKGZhY3RvcjogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy50cmFuc2Zvcm1hdGlvbk1hdHJpeCA9IHRyYW5zZm9ybSh0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LCBzY2FsZShmYWN0b3IsIGZhY3RvcikpO1xuICAgIHRoaXMuem9vbUNoYW5nZS5lbWl0KHRoaXMuem9vbUxldmVsKTtcbiAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFpvb20gdG8gYSBmaXhlZCBsZXZlbFxuICAgKlxuICAgKi9cbiAgem9vbVRvKGxldmVsOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LmEgPSBpc05hTihsZXZlbCkgPyB0aGlzLnRyYW5zZm9ybWF0aW9uTWF0cml4LmEgOiBOdW1iZXIobGV2ZWwpO1xuICAgIHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXguZCA9IGlzTmFOKGxldmVsKSA/IHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXguZCA6IE51bWJlcihsZXZlbCk7XG4gICAgdGhpcy56b29tQ2hhbmdlLmVtaXQodGhpcy56b29tTGV2ZWwpO1xuICAgIGlmICh0aGlzLmVuYWJsZVByZVVwZGF0ZVRyYW5zZm9ybSkge1xuICAgICAgdGhpcy51cGRhdGVUcmFuc2Zvcm0oKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEcmFnIHdhcyBpbnZva2VkIGZyb20gYW4gZXZlbnRcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvbkRyYWcoZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmdFbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSB0aGlzLmRyYWdnaW5nTm9kZTtcbiAgICBpZiAodGhpcy5sYXlvdXQgJiYgdHlwZW9mIHRoaXMubGF5b3V0ICE9PSAnc3RyaW5nJyAmJiB0aGlzLmxheW91dC5vbkRyYWcpIHtcbiAgICAgIHRoaXMubGF5b3V0Lm9uRHJhZyhub2RlLCBldmVudCk7XG4gICAgfVxuXG4gICAgbm9kZS5wb3NpdGlvbi54ICs9IGV2ZW50Lm1vdmVtZW50WCAvIHRoaXMuem9vbUxldmVsO1xuICAgIG5vZGUucG9zaXRpb24ueSArPSBldmVudC5tb3ZlbWVudFkgLyB0aGlzLnpvb21MZXZlbDtcblxuICAgIC8vIG1vdmUgdGhlIG5vZGVcbiAgICBjb25zdCB4ID0gbm9kZS5wb3NpdGlvbi54IC0gKHRoaXMuY2VudGVyTm9kZXNPblBvc2l0aW9uQ2hhbmdlID8gbm9kZS5kaW1lbnNpb24ud2lkdGggLyAyIDogMCk7XG4gICAgY29uc3QgeSA9IG5vZGUucG9zaXRpb24ueSAtICh0aGlzLmNlbnRlck5vZGVzT25Qb3NpdGlvbkNoYW5nZSA/IG5vZGUuZGltZW5zaW9uLmhlaWdodCAvIDIgOiAwKTtcbiAgICBub2RlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4fSwgJHt5fSlgO1xuXG4gICAgZm9yIChjb25zdCBsaW5rIG9mIHRoaXMuZ3JhcGguZWRnZXMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgbGluay50YXJnZXQgPT09IG5vZGUuaWQgfHxcbiAgICAgICAgbGluay5zb3VyY2UgPT09IG5vZGUuaWQgfHxcbiAgICAgICAgKGxpbmsudGFyZ2V0IGFzIGFueSkuaWQgPT09IG5vZGUuaWQgfHxcbiAgICAgICAgKGxpbmsuc291cmNlIGFzIGFueSkuaWQgPT09IG5vZGUuaWRcbiAgICAgICkge1xuICAgICAgICBpZiAodGhpcy5sYXlvdXQgJiYgdHlwZW9mIHRoaXMubGF5b3V0ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMubGF5b3V0LnVwZGF0ZUVkZ2UodGhpcy5ncmFwaCwgbGluayk7XG4gICAgICAgICAgY29uc3QgcmVzdWx0JCA9IHJlc3VsdCBpbnN0YW5jZW9mIE9ic2VydmFibGUgPyByZXN1bHQgOiBvZihyZXN1bHQpO1xuICAgICAgICAgIHRoaXMuZ3JhcGhTdWJzY3JpcHRpb24uYWRkKFxuICAgICAgICAgICAgcmVzdWx0JC5zdWJzY3JpYmUoZ3JhcGggPT4ge1xuICAgICAgICAgICAgICB0aGlzLmdyYXBoID0gZ3JhcGg7XG4gICAgICAgICAgICAgIHRoaXMucmVkcmF3RWRnZShsaW5rKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmVkcmF3TGluZXMoZmFsc2UpO1xuICAgIHRoaXMudXBkYXRlTWluaW1hcCgpO1xuICB9XG5cbiAgcmVkcmF3RWRnZShlZGdlOiBFZGdlKSB7XG4gICAgY29uc3QgbGluZSA9IHRoaXMuZ2VuZXJhdGVMaW5lKGVkZ2UucG9pbnRzKTtcbiAgICB0aGlzLmNhbGNEb21pbmFudEJhc2VsaW5lKGVkZ2UpO1xuICAgIGVkZ2Uub2xkTGluZSA9IGVkZ2UubGluZTtcbiAgICBlZGdlLmxpbmUgPSBsaW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgZW50aXJlIHZpZXcgZm9yIHRoZSBuZXcgcGFuIHBvc2l0aW9uXG4gICAqXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgdXBkYXRlVHJhbnNmb3JtKCk6IHZvaWQge1xuICAgIHRoaXMudHJhbnNmb3JtID0gdG9TVkcoc21vb3RoTWF0cml4KHRoaXMudHJhbnNmb3JtYXRpb25NYXRyaXgsIDEwMCkpO1xuICAgIHRoaXMuc3RhdGVDaGFuZ2UuZW1pdCh7IHN0YXRlOiBOZ3hHcmFwaFN0YXRlcy5UcmFuc2Zvcm0gfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9kZSB3YXMgY2xpY2tlZFxuICAgKlxuICAgKlxuICAgKiBAbWVtYmVyT2YgR3JhcGhDb21wb25lbnRcbiAgICovXG4gIG9uQ2xpY2soZXZlbnQ6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0LmVtaXQoZXZlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vZGUgd2FzIGZvY3VzZWRcbiAgICpcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvbkFjdGl2YXRlKGV2ZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRW50cmllcy5pbmRleE9mKGV2ZW50KSA+IC0xKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlRW50cmllcyA9IFtldmVudCwgLi4udGhpcy5hY3RpdmVFbnRyaWVzXTtcbiAgICB0aGlzLmFjdGl2YXRlLmVtaXQoeyB2YWx1ZTogZXZlbnQsIGVudHJpZXM6IHRoaXMuYWN0aXZlRW50cmllcyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb2RlIHdhcyBkZWZvY3VzZWRcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvbkRlYWN0aXZhdGUoZXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBpZHggPSB0aGlzLmFjdGl2ZUVudHJpZXMuaW5kZXhPZihldmVudCk7XG5cbiAgICB0aGlzLmFjdGl2ZUVudHJpZXMuc3BsaWNlKGlkeCwgMSk7XG4gICAgdGhpcy5hY3RpdmVFbnRyaWVzID0gWy4uLnRoaXMuYWN0aXZlRW50cmllc107XG5cbiAgICB0aGlzLmRlYWN0aXZhdGUuZW1pdCh7IHZhbHVlOiBldmVudCwgZW50cmllczogdGhpcy5hY3RpdmVFbnRyaWVzIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgZG9tYWluIHNlcmllcyBmb3IgdGhlIG5vZGVzXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgZ2V0U2VyaWVzRG9tYWluKCk6IGFueVtdIHtcbiAgICByZXR1cm4gdGhpcy5ub2Rlc1xuICAgICAgLm1hcChkID0+IHRoaXMuZ3JvdXBSZXN1bHRzQnkoZCkpXG4gICAgICAucmVkdWNlKChub2Rlczogc3RyaW5nW10sIG5vZGUpOiBhbnlbXSA9PiAobm9kZXMuaW5kZXhPZihub2RlKSAhPT0gLTEgPyBub2RlcyA6IG5vZGVzLmNvbmNhdChbbm9kZV0pKSwgW10pXG4gICAgICAuc29ydCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZvciB0aGUgbGlua1xuICAgKlxuICAgKlxuICAgKiBAbWVtYmVyT2YgR3JhcGhDb21wb25lbnRcbiAgICovXG4gIHRyYWNrTGlua0J5KGluZGV4OiBudW1iZXIsIGxpbms6IEVkZ2UpOiBhbnkge1xuICAgIHJldHVybiBsaW5rLmlkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYWNraW5nIGZvciB0aGUgbm9kZVxuICAgKlxuICAgKlxuICAgKiBAbWVtYmVyT2YgR3JhcGhDb21wb25lbnRcbiAgICovXG4gIHRyYWNrTm9kZUJ5KGluZGV4OiBudW1iZXIsIG5vZGU6IE5vZGUpOiBhbnkge1xuICAgIHJldHVybiBub2RlLmlkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNvbG9ycyB0aGUgbm9kZXNcbiAgICpcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBzZXRDb2xvcnMoKTogdm9pZCB7XG4gICAgdGhpcy5jb2xvcnMgPSBuZXcgQ29sb3JIZWxwZXIodGhpcy5zY2hlbWUsIHRoaXMuc2VyaWVzRG9tYWluLCB0aGlzLmN1c3RvbUNvbG9ycyk7XG4gIH1cblxuICAvKipcbiAgICogT24gbW91c2UgbW92ZSBldmVudCwgdXNlZCBmb3IgcGFubmluZyBhbmQgZHJhZ2dpbmcuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6bW91c2Vtb3ZlJywgWyckZXZlbnQnXSlcbiAgb25Nb3VzZU1vdmUoJGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5pc01vdXNlTW92ZUNhbGxlZCA9IHRydWU7XG4gICAgaWYgKCh0aGlzLmlzUGFubmluZyB8fCB0aGlzLmlzTWluaW1hcFBhbm5pbmcpICYmIHRoaXMucGFubmluZ0VuYWJsZWQpIHtcbiAgICAgIHRoaXMucGFuV2l0aENvbnN0cmFpbnRzKHRoaXMucGFubmluZ0F4aXMsICRldmVudCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmlzRHJhZ2dpbmcgJiYgdGhpcy5kcmFnZ2luZ0VuYWJsZWQpIHtcbiAgICAgIHRoaXMub25EcmFnKCRldmVudCk7XG4gICAgfVxuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZG9jdW1lbnQ6bW91c2Vkb3duJywgWyckZXZlbnQnXSlcbiAgb25Nb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLmlzTW91c2VNb3ZlQ2FsbGVkID0gZmFsc2U7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdkb2N1bWVudDpjbGljaycsIFsnJGV2ZW50J10pXG4gIGdyYXBoQ2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VzZU1vdmVDYWxsZWQpIHRoaXMuY2xpY2tIYW5kbGVyLmVtaXQoZXZlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIE9uIHRvdWNoIHN0YXJ0IGV2ZW50IHRvIGVuYWJsZSBwYW5uaW5nLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgR3JhcGhDb21wb25lbnRcbiAgICovXG4gIG9uVG91Y2hTdGFydChldmVudDogYW55KTogdm9pZCB7XG4gICAgdGhpcy5fdG91Y2hMYXN0WCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFg7XG4gICAgdGhpcy5fdG91Y2hMYXN0WSA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFk7XG5cbiAgICB0aGlzLmlzUGFubmluZyA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogT24gdG91Y2ggbW92ZSBldmVudCwgdXNlZCBmb3IgcGFubmluZy5cbiAgICpcbiAgICovXG4gIEBIb3N0TGlzdGVuZXIoJ2RvY3VtZW50OnRvdWNobW92ZScsIFsnJGV2ZW50J10pXG4gIG9uVG91Y2hNb3ZlKCRldmVudDogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaXNQYW5uaW5nICYmIHRoaXMucGFubmluZ0VuYWJsZWQpIHtcbiAgICAgIGNvbnN0IGNsaWVudFggPSAkZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIGNvbnN0IGNsaWVudFkgPSAkZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WTtcbiAgICAgIGNvbnN0IG1vdmVtZW50WCA9IGNsaWVudFggLSB0aGlzLl90b3VjaExhc3RYO1xuICAgICAgY29uc3QgbW92ZW1lbnRZID0gY2xpZW50WSAtIHRoaXMuX3RvdWNoTGFzdFk7XG4gICAgICB0aGlzLl90b3VjaExhc3RYID0gY2xpZW50WDtcbiAgICAgIHRoaXMuX3RvdWNoTGFzdFkgPSBjbGllbnRZO1xuXG4gICAgICB0aGlzLnBhbihtb3ZlbWVudFgsIG1vdmVtZW50WSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9uIHRvdWNoIGVuZCBldmVudCB0byBkaXNhYmxlIHBhbm5pbmcuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgb25Ub3VjaEVuZCgpIHtcbiAgICB0aGlzLmlzUGFubmluZyA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIE9uIG1vdXNlIHVwIGV2ZW50IHRvIGRpc2FibGUgcGFubmluZy9kcmFnZ2luZy5cbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBASG9zdExpc3RlbmVyKCdkb2N1bWVudDptb3VzZXVwJywgWyckZXZlbnQnXSlcbiAgb25Nb3VzZVVwKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgdGhpcy5pc1Bhbm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmlzTWluaW1hcFBhbm5pbmcgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5sYXlvdXQgJiYgdHlwZW9mIHRoaXMubGF5b3V0ICE9PSAnc3RyaW5nJyAmJiB0aGlzLmxheW91dC5vbkRyYWdFbmQpIHtcbiAgICAgIHRoaXMubGF5b3V0Lm9uRHJhZ0VuZCh0aGlzLmRyYWdnaW5nTm9kZSwgZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPbiBub2RlIG1vdXNlIGRvd24gdG8ga2ljayBvZmYgZHJhZ2dpbmdcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvbk5vZGVNb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQsIG5vZGU6IGFueSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kcmFnZ2luZ0VuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmRyYWdnaW5nTm9kZSA9IG5vZGU7XG5cbiAgICBpZiAodGhpcy5sYXlvdXQgJiYgdHlwZW9mIHRoaXMubGF5b3V0ICE9PSAnc3RyaW5nJyAmJiB0aGlzLmxheW91dC5vbkRyYWdTdGFydCkge1xuICAgICAgdGhpcy5sYXlvdXQub25EcmFnU3RhcnQobm9kZSwgZXZlbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPbiBtaW5pbWFwIGRyYWcgbW91c2UgZG93biB0byBraWNrIG9mZiBtaW5pbWFwIHBhbm5pbmdcbiAgICpcbiAgICogQG1lbWJlck9mIEdyYXBoQ29tcG9uZW50XG4gICAqL1xuICBvbk1pbmltYXBEcmFnTW91c2VEb3duKCk6IHZvaWQge1xuICAgIHRoaXMuaXNNaW5pbWFwUGFubmluZyA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogT24gbWluaW1hcCBwYW4gZXZlbnQuIFBhbnMgdGhlIGdyYXBoIHRvIHRoZSBjbGlja2VkIHBvc2l0aW9uXG4gICAqXG4gICAqIEBtZW1iZXJPZiBHcmFwaENvbXBvbmVudFxuICAgKi9cbiAgb25NaW5pbWFwUGFuVG8oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCB4ID1cbiAgICAgIGV2ZW50Lm9mZnNldFggLSAodGhpcy5kaW1zLndpZHRoIC0gKHRoaXMuZ3JhcGhEaW1zLndpZHRoICsgdGhpcy5taW5pbWFwT2Zmc2V0WCkgLyB0aGlzLm1pbmltYXBTY2FsZUNvZWZmaWNpZW50KTtcbiAgICBjb25zdCB5ID0gZXZlbnQub2Zmc2V0WSArIHRoaXMubWluaW1hcE9mZnNldFkgLyB0aGlzLm1pbmltYXBTY2FsZUNvZWZmaWNpZW50O1xuXG4gICAgdGhpcy5wYW5Ubyh4ICogdGhpcy5taW5pbWFwU2NhbGVDb2VmZmljaWVudCwgeSAqIHRoaXMubWluaW1hcFNjYWxlQ29lZmZpY2llbnQpO1xuICAgIHRoaXMuaXNNaW5pbWFwUGFubmluZyA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2VudGVyIHRoZSBncmFwaCBpbiB0aGUgdmlld3BvcnRcbiAgICovXG4gIGNlbnRlcigpOiB2b2lkIHtcbiAgICB0aGlzLnBhblRvKHRoaXMuZ3JhcGhEaW1zLndpZHRoIC8gMiwgdGhpcy5ncmFwaERpbXMuaGVpZ2h0IC8gMik7XG4gIH1cblxuICAvKipcbiAgICogWm9vbXMgdG8gZml0IHRoZSBlbnRpcmUgZ3JhcGhcbiAgICovXG4gIHpvb21Ub0ZpdCh6b29tT3B0aW9ucz86IE5neEdyYXBoWm9vbU9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmRpbXMgPSBjYWxjdWxhdGVWaWV3RGltZW5zaW9ucyh7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHRcbiAgICB9KTtcbiAgICB0aGlzLnVwZGF0ZUdyYXBoRGltcygpO1xuICAgIGNvbnN0IGhlaWdodFpvb20gPSB0aGlzLmRpbXMuaGVpZ2h0IC8gdGhpcy5ncmFwaERpbXMuaGVpZ2h0O1xuICAgIGNvbnN0IHdpZHRoWm9vbSA9IHRoaXMuZGltcy53aWR0aCAvIHRoaXMuZ3JhcGhEaW1zLndpZHRoO1xuICAgIGxldCB6b29tTGV2ZWwgPSBNYXRoLm1pbihoZWlnaHRab29tLCB3aWR0aFpvb20sIDEpO1xuXG4gICAgaWYgKHpvb21MZXZlbCA8IHRoaXMubWluWm9vbUxldmVsKSB7XG4gICAgICB6b29tTGV2ZWwgPSB0aGlzLm1pblpvb21MZXZlbDtcbiAgICB9XG5cbiAgICBpZiAoem9vbUxldmVsID4gdGhpcy5tYXhab29tTGV2ZWwpIHtcbiAgICAgIHpvb21MZXZlbCA9IHRoaXMubWF4Wm9vbUxldmVsO1xuICAgIH1cblxuICAgIGlmICh6b29tT3B0aW9ucz8uZm9yY2UgPT09IHRydWUgfHwgem9vbUxldmVsICE9PSB0aGlzLnpvb21MZXZlbCkge1xuICAgICAgdGhpcy56b29tTGV2ZWwgPSB6b29tTGV2ZWw7XG5cbiAgICAgIGlmICh6b29tT3B0aW9ucz8uYXV0b0NlbnRlciAhPT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVRyYW5zZm9ybSgpO1xuICAgICAgfVxuICAgICAgaWYgKHpvb21PcHRpb25zPy5hdXRvQ2VudGVyID09PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuY2VudGVyKCk7XG4gICAgICB9XG4gICAgICB0aGlzLnpvb21DaGFuZ2UuZW1pdCh0aGlzLnpvb21MZXZlbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhbnMgdG8gdGhlIG5vZGVcbiAgICogQHBhcmFtIG5vZGVJZFxuICAgKi9cbiAgcGFuVG9Ob2RlSWQobm9kZUlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBub2RlID0gdGhpcy5ncmFwaC5ub2Rlcy5maW5kKG4gPT4gbi5pZCA9PT0gbm9kZUlkKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnBhblRvKG5vZGUucG9zaXRpb24ueCwgbm9kZS5wb3NpdGlvbi55KTtcbiAgfVxuXG4gIGdldENvbXBvdW5kTm9kZUNoaWxkcmVuKGlkczogQXJyYXk8c3RyaW5nPikge1xuICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbHRlcihub2RlID0+IGlkcy5pbmNsdWRlcyhub2RlLmlkKSk7XG4gIH1cblxuICBwcml2YXRlIHBhbldpdGhDb25zdHJhaW50cyhrZXk6IHN0cmluZywgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBsZXQgeCA9IGV2ZW50Lm1vdmVtZW50WDtcbiAgICBsZXQgeSA9IGV2ZW50Lm1vdmVtZW50WTtcbiAgICBpZiAodGhpcy5pc01pbmltYXBQYW5uaW5nKSB7XG4gICAgICB4ID0gLXRoaXMubWluaW1hcFNjYWxlQ29lZmZpY2llbnQgKiB4ICogdGhpcy56b29tTGV2ZWw7XG4gICAgICB5ID0gLXRoaXMubWluaW1hcFNjYWxlQ29lZmZpY2llbnQgKiB5ICogdGhpcy56b29tTGV2ZWw7XG4gICAgfVxuXG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgUGFubmluZ0F4aXMuSG9yaXpvbnRhbDpcbiAgICAgICAgdGhpcy5wYW4oeCwgMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQYW5uaW5nQXhpcy5WZXJ0aWNhbDpcbiAgICAgICAgdGhpcy5wYW4oMCwgeSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5wYW4oeCwgeSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlTWlkcG9pbnRPbkVkZ2UoZWRnZTogRWRnZSwgcG9pbnRzOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIWVkZ2UgfHwgIXBvaW50cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChwb2ludHMubGVuZ3RoICUgMiA9PT0gMSkge1xuICAgICAgZWRnZS5taWRQb2ludCA9IHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGggLyAyKV07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENoZWNraW5nIGlmIHRoZSBjdXJyZW50IGxheW91dCBpcyBFbGtcbiAgICAgIGlmICgodGhpcy5sYXlvdXQgYXMgTGF5b3V0KT8uc2V0dGluZ3M/LnByb3BlcnRpZXM/LlsnZWxrLmRpcmVjdGlvbiddKSB7XG4gICAgICAgIHRoaXMuX2NhbGNNaWRQb2ludEVsayhlZGdlLCBwb2ludHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgX2ZpcnN0ID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLyAyXTtcbiAgICAgICAgY29uc3QgX3NlY29uZCA9IHBvaW50c1twb2ludHMubGVuZ3RoIC8gMiAtIDFdO1xuICAgICAgICBlZGdlLm1pZFBvaW50ID0ge1xuICAgICAgICAgIHg6IChfZmlyc3QueCArIF9zZWNvbmQueCkgLyAyLFxuICAgICAgICAgIHk6IChfZmlyc3QueSArIF9zZWNvbmQueSkgLyAyXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2FsY01pZFBvaW50RWxrKGVkZ2U6IEVkZ2UsIHBvaW50czogYW55KTogdm9pZCB7XG4gICAgbGV0IF9maXJzdFggPSBudWxsO1xuICAgIGxldCBfc2Vjb25kWCA9IG51bGw7XG4gICAgbGV0IF9maXJzdFkgPSBudWxsO1xuICAgIGxldCBfc2Vjb25kWSA9IG51bGw7XG4gICAgY29uc3Qgb3JpZW50YXRpb24gPSAodGhpcy5sYXlvdXQgYXMgTGF5b3V0KS5zZXR0aW5ncz8ucHJvcGVydGllc1snZWxrLmRpcmVjdGlvbiddO1xuICAgIGNvbnN0IGhhc0JlbmQgPVxuICAgICAgb3JpZW50YXRpb24gPT09ICdSSUdIVCcgPyBwb2ludHMuc29tZShwID0+IHAueSAhPT0gcG9pbnRzWzBdLnkpIDogcG9pbnRzLnNvbWUocCA9PiBwLnggIT09IHBvaW50c1swXS54KTtcblxuICAgIGlmIChoYXNCZW5kKSB7XG4gICAgICAvLyBnZXR0aW5nIHRoZSBsYXN0IHR3byBwb2ludHNcbiAgICAgIF9maXJzdFggPSBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgX3NlY29uZFggPSBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDJdO1xuICAgICAgX2ZpcnN0WSA9IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV07XG4gICAgICBfc2Vjb25kWSA9IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMl07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ1JJR0hUJykge1xuICAgICAgICBfZmlyc3RYID0gcG9pbnRzWzBdO1xuICAgICAgICBfc2Vjb25kWCA9IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV07XG4gICAgICAgIF9maXJzdFkgPSBwb2ludHNbcG9pbnRzLmxlbmd0aCAvIDJdO1xuICAgICAgICBfc2Vjb25kWSA9IHBvaW50c1twb2ludHMubGVuZ3RoIC8gMiAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2ZpcnN0WCA9IHBvaW50c1twb2ludHMubGVuZ3RoIC8gMl07XG4gICAgICAgIF9zZWNvbmRYID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLyAyIC0gMV07XG4gICAgICAgIF9maXJzdFkgPSBwb2ludHNbMF07XG4gICAgICAgIF9zZWNvbmRZID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlZGdlLm1pZFBvaW50ID0ge1xuICAgICAgeDogKF9maXJzdFgueCArIF9zZWNvbmRYLngpIC8gMixcbiAgICAgIHk6IChfZmlyc3RZLnkgKyBfc2Vjb25kWS55KSAvIDJcbiAgICB9O1xuICB9XG5cbiAgcHVibGljIGJhc2ljVXBkYXRlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnZpZXcpIHtcbiAgICAgIHRoaXMud2lkdGggPSB0aGlzLnZpZXdbMF07XG4gICAgICB0aGlzLmhlaWdodCA9IHRoaXMudmlld1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGltcyA9IHRoaXMuZ2V0Q29udGFpbmVyRGltcygpO1xuICAgICAgaWYgKGRpbXMpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IGRpbXMud2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gZGltcy5oZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCB2YWx1ZXMgaWYgd2lkdGggb3IgaGVpZ2h0IGFyZSAwIG9yIHVuZGVmaW5lZFxuICAgIGlmICghdGhpcy53aWR0aCkge1xuICAgICAgdGhpcy53aWR0aCA9IDYwMDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaGVpZ2h0KSB7XG4gICAgICB0aGlzLmhlaWdodCA9IDQwMDtcbiAgICB9XG5cbiAgICB0aGlzLndpZHRoID0gTWF0aC5mbG9vcih0aGlzLndpZHRoKTtcbiAgICB0aGlzLmhlaWdodCA9IE1hdGguZmxvb3IodGhpcy5oZWlnaHQpO1xuXG4gICAgaWYgKHRoaXMuY2QpIHtcbiAgICAgIHRoaXMuY2QubWFya0ZvckNoZWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGdldENvbnRhaW5lckRpbXMoKTogYW55IHtcbiAgICBsZXQgd2lkdGg7XG4gICAgbGV0IGhlaWdodDtcbiAgICBjb25zdCBob3N0RWxlbSA9IHRoaXMuZWwubmF0aXZlRWxlbWVudDtcblxuICAgIGlmIChob3N0RWxlbS5wYXJlbnROb2RlICE9PSBudWxsKSB7XG4gICAgICAvLyBHZXQgdGhlIGNvbnRhaW5lciBkaW1lbnNpb25zXG4gICAgICBjb25zdCBkaW1zID0gaG9zdEVsZW0ucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHdpZHRoID0gZGltcy53aWR0aDtcbiAgICAgIGhlaWdodCA9IGRpbXMuaGVpZ2h0O1xuICAgIH1cblxuICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcbiAgICAgIHJldHVybiB7IHdpZHRoLCBoZWlnaHQgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlIGdyYXBoIGhhcyBkaW1lbnNpb25zXG4gICAqL1xuICBwdWJsaWMgaGFzR3JhcGhEaW1zKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdyYXBoRGltcy53aWR0aCA+IDAgJiYgdGhpcy5ncmFwaERpbXMuaGVpZ2h0ID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYWxsIG5vZGVzIGhhdmUgZGltZW5zaW9uXG4gICAqL1xuICBwdWJsaWMgaGFzTm9kZURpbXMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ3JhcGgubm9kZXM/LmV2ZXJ5KG5vZGUgPT4gbm9kZS5kaW1lbnNpb24ud2lkdGggPiAwICYmIG5vZGUuZGltZW5zaW9uLmhlaWdodCA+IDApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbGwgY29tcG91bmQgbm9kZXMgaGF2ZSBkaW1lbnNpb25cbiAgICovXG4gIHB1YmxpYyBoYXNDb21wb3VuZE5vZGVEaW1zKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdyYXBoLmNvbXBvdW5kTm9kZXM/LmV2ZXJ5KG5vZGUgPT4gbm9kZS5kaW1lbnNpb24ud2lkdGggPiAwICYmIG5vZGUuZGltZW5zaW9uLmhlaWdodCA+IDApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbGwgY2x1c3RlcnMgaGF2ZSBkaW1lbnNpb25cbiAgICovXG4gIHB1YmxpYyBoYXNDbHVzdGVyRGltcygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5ncmFwaC5jbHVzdGVycz8uZXZlcnkobm9kZSA9PiBub2RlLmRpbWVuc2lvbi53aWR0aCA+IDAgJiYgbm9kZS5kaW1lbnNpb24uaGVpZ2h0ID4gMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBncmFwaCBhbmQgYWxsIG5vZGVzIGhhdmUgZGltZW5zaW9uLlxuICAgKi9cbiAgcHVibGljIGhhc0RpbXMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuaGFzR3JhcGhEaW1zKCkgJiZcbiAgICAgIHRoaXMuaGFzTm9kZURpbXMoKSAmJlxuICAgICAgKCh0aGlzLmNvbXBvdW5kTm9kZXM/Lmxlbmd0aCA/IHRoaXMuaGFzQ29tcG91bmROb2RlRGltcygpIDogdHJ1ZSkgfHxcbiAgICAgICAgKHRoaXMuY2x1c3RlcnM/Lmxlbmd0aCA/IHRoaXMuaGFzQ2x1c3RlckRpbXMoKSA6IHRydWUpKVxuICAgICk7XG4gIH1cblxuICBwcm90ZWN0ZWQgdW5iaW5kRXZlbnRzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5yZXNpemVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRXaW5kb3dSZXNpemVFdmVudCgpOiB2b2lkIHtcbiAgICBjb25zdCBzb3VyY2UgPSBvYnNlcnZhYmxlRnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHNvdXJjZS5waXBlKGRlYm91bmNlVGltZSgyMDApKS5zdWJzY3JpYmUoZSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgaWYgKHRoaXMuY2QpIHtcbiAgICAgICAgdGhpcy5jZC5tYXJrRm9yQ2hlY2soKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbiA9IHN1YnNjcmlwdGlvbjtcbiAgfVxufVxuIiwiPGRpdlxuICBjbGFzcz1cIm5neC1ncmFwaC1vdXRlclwiXG4gIFtzdHlsZS53aWR0aC5weF09XCJ3aWR0aFwiXG4gIFtAYW5pbWF0aW9uU3RhdGVdPVwiJ2FjdGl2ZSdcIlxuICBbQC5kaXNhYmxlZF09XCIhYW5pbWF0ZVwiXG4gIChtb3VzZVdoZWVsVXApPVwib25ab29tKCRldmVudCwgJ2luJylcIlxuICAobW91c2VXaGVlbERvd24pPVwib25ab29tKCRldmVudCwgJ291dCcpXCJcbiAgbW91c2VXaGVlbFxuPlxuICA8c3ZnOnN2ZyBjbGFzcz1cIm5neC1ncmFwaFwiIFthdHRyLndpZHRoXT1cIndpZHRoXCIgW2F0dHIuaGVpZ2h0XT1cImhlaWdodFwiPlxuICAgIDxzdmc6Z1xuICAgICAgKm5nSWY9XCJpbml0aWFsaXplZCAmJiBncmFwaFwiXG4gICAgICBbYXR0ci50cmFuc2Zvcm1dPVwidHJhbnNmb3JtXCJcbiAgICAgICh0b3VjaHN0YXJ0KT1cIm9uVG91Y2hTdGFydCgkZXZlbnQpXCJcbiAgICAgICh0b3VjaGVuZCk9XCJvblRvdWNoRW5kKClcIlxuICAgICAgY2xhc3M9XCJncmFwaCBjaGFydFwiXG4gICAgPlxuICAgICAgPGRlZnM+XG4gICAgICAgIDxuZy1jb250YWluZXIgKm5nSWY9XCJkZWZzVGVtcGxhdGVcIiBbbmdUZW1wbGF0ZU91dGxldF09XCJkZWZzVGVtcGxhdGVcIj48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPHN2ZzpwYXRoXG4gICAgICAgICAgY2xhc3M9XCJ0ZXh0LXBhdGhcIlxuICAgICAgICAgICpuZ0Zvcj1cImxldCBsaW5rIG9mIGdyYXBoLmVkZ2VzXCJcbiAgICAgICAgICBbYXR0ci5kXT1cImxpbmsudGV4dFBhdGhcIlxuICAgICAgICAgIFthdHRyLmlkXT1cImxpbmsuaWRcIlxuICAgICAgICA+PC9zdmc6cGF0aD5cbiAgICAgIDwvZGVmcz5cblxuICAgICAgPHN2ZzpyZWN0XG4gICAgICAgIGNsYXNzPVwicGFubmluZy1yZWN0XCJcbiAgICAgICAgW2F0dHIud2lkdGhdPVwiZGltcy53aWR0aCAqIDEwMFwiXG4gICAgICAgIFthdHRyLmhlaWdodF09XCJkaW1zLmhlaWdodCAqIDEwMFwiXG4gICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCIndHJhbnNsYXRlKCcgKyAoLWRpbXMud2lkdGggfHwgMCkgKiA1MCArICcsJyArICgtZGltcy5oZWlnaHQgfHwgMCkgKiA1MCArICcpJ1wiXG4gICAgICAgIChtb3VzZWRvd24pPVwiaXNQYW5uaW5nID0gdHJ1ZVwiXG4gICAgICAvPlxuXG4gICAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG5cbiAgICAgIDxzdmc6ZyBjbGFzcz1cImNsdXN0ZXJzXCI+XG4gICAgICAgIDxzdmc6Z1xuICAgICAgICAgICNjbHVzdGVyRWxlbWVudFxuICAgICAgICAgICpuZ0Zvcj1cImxldCBub2RlIG9mIGdyYXBoLmNsdXN0ZXJzOyB0cmFja0J5OiB0cmFja05vZGVCeVwiXG4gICAgICAgICAgY2xhc3M9XCJub2RlLWdyb3VwXCJcbiAgICAgICAgICBbY2xhc3Mub2xkLW5vZGVdPVwiYW5pbWF0ZSAmJiBvbGRDbHVzdGVycy5oYXMobm9kZS5pZClcIlxuICAgICAgICAgIFtpZF09XCJub2RlLmlkXCJcbiAgICAgICAgICBbYXR0ci50cmFuc2Zvcm1dPVwibm9kZS50cmFuc2Zvcm1cIlxuICAgICAgICAgIChjbGljayk9XCJvbkNsaWNrKG5vZGUpXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ0lmPVwiY2x1c3RlclRlbXBsYXRlICYmICFub2RlLmhpZGRlblwiXG4gICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldF09XCJjbHVzdGVyVGVtcGxhdGVcIlxuICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInsgJGltcGxpY2l0OiBub2RlIH1cIlxuICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8c3ZnOmcgKm5nSWY9XCIhY2x1c3RlclRlbXBsYXRlXCIgY2xhc3M9XCJub2RlIGNsdXN0ZXJcIj5cbiAgICAgICAgICAgIDxzdmc6cmVjdFxuICAgICAgICAgICAgICBbYXR0ci53aWR0aF09XCJub2RlLmRpbWVuc2lvbi53aWR0aFwiXG4gICAgICAgICAgICAgIFthdHRyLmhlaWdodF09XCJub2RlLmRpbWVuc2lvbi5oZWlnaHRcIlxuICAgICAgICAgICAgICBbYXR0ci5maWxsXT1cIm5vZGUuZGF0YT8uY29sb3JcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDxzdmc6dGV4dCBhbGlnbm1lbnQtYmFzZWxpbmU9XCJjZW50cmFsXCIgW2F0dHIueF09XCIxMFwiIFthdHRyLnldPVwibm9kZS5kaW1lbnNpb24uaGVpZ2h0IC8gMlwiPlxuICAgICAgICAgICAgICB7eyBub2RlLmxhYmVsIH19XG4gICAgICAgICAgICA8L3N2Zzp0ZXh0PlxuICAgICAgICAgIDwvc3ZnOmc+XG4gICAgICAgIDwvc3ZnOmc+XG4gICAgICA8L3N2ZzpnPlxuXG4gICAgICA8c3ZnOmcgY2xhc3M9XCJjb21wb3VuZC1ub2Rlc1wiPlxuICAgICAgICA8c3ZnOmdcbiAgICAgICAgICAjbm9kZUVsZW1lbnRcbiAgICAgICAgICAqbmdGb3I9XCJsZXQgbm9kZSBvZiBncmFwaC5jb21wb3VuZE5vZGVzOyB0cmFja0J5OiB0cmFja05vZGVCeVwiXG4gICAgICAgICAgY2xhc3M9XCJub2RlLWdyb3VwXCJcbiAgICAgICAgICBbY2xhc3Mub2xkLW5vZGVdPVwiYW5pbWF0ZSAmJiBvbGRDb21wb3VuZE5vZGVzLmhhcyhub2RlLmlkKVwiXG4gICAgICAgICAgW2lkXT1cIm5vZGUuaWRcIlxuICAgICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJub2RlLnRyYW5zZm9ybVwiXG4gICAgICAgICAgKGNsaWNrKT1cIm9uQ2xpY2sobm9kZSlcIlxuICAgICAgICAgIChtb3VzZWRvd24pPVwib25Ob2RlTW91c2VEb3duKCRldmVudCwgbm9kZSlcIlxuICAgICAgICA+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nSWY9XCJub2RlVGVtcGxhdGUgJiYgIW5vZGUuaGlkZGVuXCJcbiAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIm5vZGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldENvbnRleHRdPVwieyAkaW1wbGljaXQ6IG5vZGUgfVwiXG4gICAgICAgICAgPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgIDxzdmc6ZyAqbmdJZj1cIiFub2RlVGVtcGxhdGVcIiBjbGFzcz1cIm5vZGUgY29tcG91bmQtbm9kZVwiPlxuICAgICAgICAgICAgPHN2ZzpyZWN0XG4gICAgICAgICAgICAgIFthdHRyLndpZHRoXT1cIm5vZGUuZGltZW5zaW9uLndpZHRoXCJcbiAgICAgICAgICAgICAgW2F0dHIuaGVpZ2h0XT1cIm5vZGUuZGltZW5zaW9uLmhlaWdodFwiXG4gICAgICAgICAgICAgIFthdHRyLmZpbGxdPVwibm9kZS5kYXRhPy5jb2xvclwiXG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPHN2Zzp0ZXh0IGFsaWdubWVudC1iYXNlbGluZT1cImNlbnRyYWxcIiBbYXR0ci54XT1cIjEwXCIgW2F0dHIueV09XCJub2RlLmRpbWVuc2lvbi5oZWlnaHQgLyAyXCI+XG4gICAgICAgICAgICAgIHt7IG5vZGUubGFiZWwgfX1cbiAgICAgICAgICAgIDwvc3ZnOnRleHQ+XG4gICAgICAgICAgPC9zdmc6Zz5cbiAgICAgICAgPC9zdmc6Zz5cbiAgICAgIDwvc3ZnOmc+XG5cbiAgICAgIDxzdmc6ZyBjbGFzcz1cImxpbmtzXCI+XG4gICAgICAgIDxzdmc6ZyAjbGlua0VsZW1lbnQgKm5nRm9yPVwibGV0IGxpbmsgb2YgZ3JhcGguZWRnZXM7IHRyYWNrQnk6IHRyYWNrTGlua0J5XCIgY2xhc3M9XCJsaW5rLWdyb3VwXCIgW2lkXT1cImxpbmsuaWRcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdJZj1cImxpbmtUZW1wbGF0ZVwiXG4gICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldF09XCJsaW5rVGVtcGxhdGVcIlxuICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInsgJGltcGxpY2l0OiBsaW5rIH1cIlxuICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICA8c3ZnOnBhdGggKm5nSWY9XCIhbGlua1RlbXBsYXRlXCIgY2xhc3M9XCJlZGdlXCIgW2F0dHIuZF09XCJsaW5rLmxpbmVcIiAvPlxuICAgICAgICA8L3N2ZzpnPlxuICAgICAgPC9zdmc6Zz5cblxuICAgICAgPHN2ZzpnIGNsYXNzPVwibm9kZXNcIiAjbm9kZUdyb3VwPlxuICAgICAgICA8c3ZnOmdcbiAgICAgICAgICAjbm9kZUVsZW1lbnRcbiAgICAgICAgICAqbmdGb3I9XCJsZXQgbm9kZSBvZiBncmFwaC5ub2RlczsgdHJhY2tCeTogdHJhY2tOb2RlQnlcIlxuICAgICAgICAgIGNsYXNzPVwibm9kZS1ncm91cFwiXG4gICAgICAgICAgW2NsYXNzLm9sZC1ub2RlXT1cImFuaW1hdGUgJiYgb2xkTm9kZXMuaGFzKG5vZGUuaWQpXCJcbiAgICAgICAgICBbaWRdPVwibm9kZS5pZFwiXG4gICAgICAgICAgW2F0dHIudHJhbnNmb3JtXT1cIm5vZGUudHJhbnNmb3JtXCJcbiAgICAgICAgICAoY2xpY2spPVwib25DbGljayhub2RlKVwiXG4gICAgICAgICAgKG1vdXNlZG93bik9XCJvbk5vZGVNb3VzZURvd24oJGV2ZW50LCBub2RlKVwiXG4gICAgICAgID5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdJZj1cIm5vZGVUZW1wbGF0ZSAmJiAhbm9kZS5oaWRkZW5cIlxuICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRdPVwibm9kZVRlbXBsYXRlXCJcbiAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ICRpbXBsaWNpdDogbm9kZSB9XCJcbiAgICAgICAgICA+PC9uZy1jb250YWluZXI+XG4gICAgICAgICAgPHN2ZzpjaXJjbGVcbiAgICAgICAgICAgICpuZ0lmPVwiIW5vZGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICByPVwiMTBcIlxuICAgICAgICAgICAgW2F0dHIuY3hdPVwibm9kZS5kaW1lbnNpb24ud2lkdGggLyAyXCJcbiAgICAgICAgICAgIFthdHRyLmN5XT1cIm5vZGUuZGltZW5zaW9uLmhlaWdodCAvIDJcIlxuICAgICAgICAgICAgW2F0dHIuZmlsbF09XCJub2RlLmRhdGE/LmNvbG9yXCJcbiAgICAgICAgICAvPlxuICAgICAgICA8L3N2ZzpnPlxuICAgICAgPC9zdmc6Zz5cbiAgICA8L3N2ZzpnPlxuXG4gICAgPHN2ZzpjbGlwUGF0aCBbYXR0ci5pZF09XCJtaW5pbWFwQ2xpcFBhdGhJZFwiPlxuICAgICAgPHN2ZzpyZWN0XG4gICAgICAgIFthdHRyLndpZHRoXT1cImdyYXBoRGltcy53aWR0aCAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50XCJcbiAgICAgICAgW2F0dHIuaGVpZ2h0XT1cImdyYXBoRGltcy5oZWlnaHQgLyBtaW5pbWFwU2NhbGVDb2VmZmljaWVudFwiXG4gICAgICA+PC9zdmc6cmVjdD5cbiAgICA8L3N2ZzpjbGlwUGF0aD5cblxuICAgIDxzdmc6Z1xuICAgICAgY2xhc3M9XCJtaW5pbWFwXCJcbiAgICAgICpuZ0lmPVwic2hvd01pbmlNYXBcIlxuICAgICAgW2F0dHIudHJhbnNmb3JtXT1cIm1pbmltYXBUcmFuc2Zvcm1cIlxuICAgICAgW2F0dHIuY2xpcC1wYXRoXT1cIid1cmwoIycgKyBtaW5pbWFwQ2xpcFBhdGhJZCArICcpJ1wiXG4gICAgPlxuICAgICAgPHN2ZzpyZWN0XG4gICAgICAgIGNsYXNzPVwibWluaW1hcC1iYWNrZ3JvdW5kXCJcbiAgICAgICAgW2F0dHIud2lkdGhdPVwiZ3JhcGhEaW1zLndpZHRoIC8gbWluaW1hcFNjYWxlQ29lZmZpY2llbnRcIlxuICAgICAgICBbYXR0ci5oZWlnaHRdPVwiZ3JhcGhEaW1zLmhlaWdodCAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50XCJcbiAgICAgICAgKG1vdXNlZG93bik9XCJvbk1pbmltYXBQYW5UbygkZXZlbnQpXCJcbiAgICAgID48L3N2ZzpyZWN0PlxuXG4gICAgICA8c3ZnOmdcbiAgICAgICAgW3N0eWxlLnRyYW5zZm9ybV09XCJcbiAgICAgICAgICAndHJhbnNsYXRlKCcgK1xuICAgICAgICAgIC1taW5pbWFwT2Zmc2V0WCAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50ICtcbiAgICAgICAgICAncHgsJyArXG4gICAgICAgICAgLW1pbmltYXBPZmZzZXRZIC8gbWluaW1hcFNjYWxlQ29lZmZpY2llbnQgK1xuICAgICAgICAgICdweCknXG4gICAgICAgIFwiXG4gICAgICA+XG4gICAgICAgIDxzdmc6ZyBjbGFzcz1cIm1pbmltYXAtbm9kZXNcIiBbc3R5bGUudHJhbnNmb3JtXT1cIidzY2FsZSgnICsgMSAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50ICsgJyknXCI+XG4gICAgICAgICAgPHN2ZzpnXG4gICAgICAgICAgICAjbm9kZUVsZW1lbnRcbiAgICAgICAgICAgICpuZ0Zvcj1cImxldCBub2RlIG9mIGdyYXBoLm5vZGVzOyB0cmFja0J5OiB0cmFja05vZGVCeVwiXG4gICAgICAgICAgICBjbGFzcz1cIm5vZGUtZ3JvdXBcIlxuICAgICAgICAgICAgW2NsYXNzLm9sZC1ub2RlXT1cImFuaW1hdGUgJiYgb2xkTm9kZXMuaGFzKG5vZGUuaWQpXCJcbiAgICAgICAgICAgIFtpZF09XCJub2RlLmlkXCJcbiAgICAgICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJub2RlLnRyYW5zZm9ybVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdJZj1cIm1pbmlNYXBOb2RlVGVtcGxhdGVcIlxuICAgICAgICAgICAgICBbbmdUZW1wbGF0ZU91dGxldF09XCJtaW5pTWFwTm9kZVRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRDb250ZXh0XT1cInsgJGltcGxpY2l0OiBub2RlIH1cIlxuICAgICAgICAgICAgPjwvbmctY29udGFpbmVyPlxuICAgICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgICAqbmdJZj1cIiFtaW5pTWFwTm9kZVRlbXBsYXRlICYmIG5vZGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIm5vZGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0Q29udGV4dF09XCJ7ICRpbXBsaWNpdDogbm9kZSB9XCJcbiAgICAgICAgICAgID48L25nLWNvbnRhaW5lcj5cbiAgICAgICAgICAgIDxzdmc6Y2lyY2xlXG4gICAgICAgICAgICAgICpuZ0lmPVwiIW5vZGVUZW1wbGF0ZSAmJiAhbWluaU1hcE5vZGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIHI9XCIxMFwiXG4gICAgICAgICAgICAgIFthdHRyLmN4XT1cIm5vZGUuZGltZW5zaW9uLndpZHRoIC8gMiAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50XCJcbiAgICAgICAgICAgICAgW2F0dHIuY3ldPVwibm9kZS5kaW1lbnNpb24uaGVpZ2h0IC8gMiAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50XCJcbiAgICAgICAgICAgICAgW2F0dHIuZmlsbF09XCJub2RlLmRhdGE/LmNvbG9yXCJcbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9zdmc6Zz5cbiAgICAgICAgPC9zdmc6Zz5cblxuICAgICAgICA8c3ZnOnJlY3RcbiAgICAgICAgICBbYXR0ci50cmFuc2Zvcm1dPVwiXG4gICAgICAgICAgICAndHJhbnNsYXRlKCcgK1xuICAgICAgICAgICAgcGFuT2Zmc2V0WCAvIHpvb21MZXZlbCAvIC1taW5pbWFwU2NhbGVDb2VmZmljaWVudCArXG4gICAgICAgICAgICAnLCcgK1xuICAgICAgICAgICAgcGFuT2Zmc2V0WSAvIHpvb21MZXZlbCAvIC1taW5pbWFwU2NhbGVDb2VmZmljaWVudCArXG4gICAgICAgICAgICAnKSdcbiAgICAgICAgICBcIlxuICAgICAgICAgIGNsYXNzPVwibWluaW1hcC1kcmFnXCJcbiAgICAgICAgICBbY2xhc3MucGFubmluZ109XCJpc01pbmltYXBQYW5uaW5nXCJcbiAgICAgICAgICBbYXR0ci53aWR0aF09XCJ3aWR0aCAvIG1pbmltYXBTY2FsZUNvZWZmaWNpZW50IC8gem9vbUxldmVsXCJcbiAgICAgICAgICBbYXR0ci5oZWlnaHRdPVwiaGVpZ2h0IC8gbWluaW1hcFNjYWxlQ29lZmZpY2llbnQgLyB6b29tTGV2ZWxcIlxuICAgICAgICAgIChtb3VzZWRvd24pPVwib25NaW5pbWFwRHJhZ01vdXNlRG93bigpXCJcbiAgICAgICAgPjwvc3ZnOnJlY3Q+XG4gICAgICA8L3N2ZzpnPlxuICAgIDwvc3ZnOmc+XG4gIDwvc3ZnOnN2Zz5cbjwvZGl2PlxuIl19