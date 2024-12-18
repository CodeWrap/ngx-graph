import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, OnInit, QueryList, TemplateRef, NgZone, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import 'd3-transition';
import { Observable, Subscription } from 'rxjs';
import { Layout } from '../models/layout.model';
import { LayoutService } from './layouts/layout.service';
import { Edge } from '../models/edge.model';
import { Node, ClusterNode, CompoundNode } from '../models/node.model';
import { Graph } from '../models/graph.model';
import { PanningAxis } from '../enums/panning.enum';
import { MiniMapPosition } from '../enums/mini-map-position.enum';
import { ColorHelper } from '../utils/color.helper';
import { ViewDimensions } from '../utils/view-dimensions.helper';
import { VisibilityObserver } from '../utils/visibility-observer';
import * as i0 from "@angular/core";
/**
 * Matrix
 */
export interface Matrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}
export interface NgxGraphZoomOptions {
    autoCenter?: boolean;
    force?: boolean;
}
export declare enum NgxGraphStates {
    Init = "init",
    Subscribe = "subscribe",
    Transform = "transform",
    Output = "output"
}
export interface NgxGraphStateChangeEvent {
    state: NgxGraphStates;
}
export declare class GraphComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    private el;
    zone: NgZone;
    cd: ChangeDetectorRef;
    private layoutService;
    nodes: Node[];
    clusters: ClusterNode[];
    compoundNodes: CompoundNode[];
    links: Edge[];
    activeEntries: any[];
    curve: any;
    draggingEnabled: boolean;
    nodeHeight: number;
    nodeMaxHeight: number;
    nodeMinHeight: number;
    nodeWidth: number;
    nodeMinWidth: number;
    nodeMaxWidth: number;
    panningEnabled: boolean;
    panningAxis: PanningAxis;
    enableZoom: boolean;
    zoomSpeed: number;
    minZoomLevel: number;
    maxZoomLevel: number;
    autoZoom: boolean;
    panOnZoom: boolean;
    animate?: boolean;
    autoCenter: boolean;
    update$: Observable<any>;
    center$: Observable<any>;
    zoomToFit$: Observable<NgxGraphZoomOptions>;
    panToNode$: Observable<any>;
    layout: string | Layout;
    layoutSettings: any;
    enableTrackpadSupport: boolean;
    showMiniMap: boolean;
    miniMapMaxWidth: number;
    miniMapMaxHeight: number;
    miniMapPosition: MiniMapPosition;
    view: [number, number];
    scheme: any;
    customColors: any;
    deferDisplayUntilPosition: boolean;
    centerNodesOnPositionChange: boolean;
    enablePreUpdateTransform: boolean;
    select: EventEmitter<any>;
    activate: EventEmitter<any>;
    deactivate: EventEmitter<any>;
    zoomChange: EventEmitter<number>;
    clickHandler: EventEmitter<MouseEvent>;
    stateChange: EventEmitter<NgxGraphStateChangeEvent>;
    linkTemplate: TemplateRef<any>;
    nodeTemplate: TemplateRef<any>;
    clusterTemplate: TemplateRef<any>;
    defsTemplate: TemplateRef<any>;
    miniMapNodeTemplate: TemplateRef<any>;
    nodeElements: QueryList<ElementRef>;
    linkElements: QueryList<ElementRef>;
    chartWidth: any;
    private isMouseMoveCalled;
    graphSubscription: Subscription;
    colors: ColorHelper;
    dims: ViewDimensions;
    seriesDomain: any;
    transform: string;
    isPanning: boolean;
    isDragging: boolean;
    draggingNode: Node;
    initialized: boolean;
    graph: Graph;
    graphDims: any;
    _oldLinks: Edge[];
    oldNodes: Set<string>;
    oldClusters: Set<string>;
    oldCompoundNodes: Set<string>;
    transformationMatrix: Matrix;
    _touchLastX: any;
    _touchLastY: any;
    minimapScaleCoefficient: number;
    minimapTransform: string;
    minimapOffsetX: number;
    minimapOffsetY: number;
    isMinimapPanning: boolean;
    minimapClipPathId: string;
    width: number;
    height: number;
    resizeSubscription: any;
    visibilityObserver: VisibilityObserver;
    private destroy$;
    constructor(el: ElementRef, zone: NgZone, cd: ChangeDetectorRef, layoutService: LayoutService);
    groupResultsBy: (node: any) => string;
    /**
     * Get the current zoom level
     */
    get zoomLevel(): number;
    /**
     * Set the current zoom level
     */
    set zoomLevel(level: number);
    /**
     * Get the current `x` position of the graph
     */
    get panOffsetX(): number;
    /**
     * Set the current `x` position of the graph
     */
    set panOffsetX(x: number);
    /**
     * Get the current `y` position of the graph
     */
    get panOffsetY(): number;
    /**
     * Set the current `y` position of the graph
     */
    set panOffsetY(y: number);
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    setLayout(layout: string | Layout): void;
    setLayoutSettings(settings: any): void;
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngOnDestroy(): void;
    /**
     * Angular lifecycle event
     *
     *
     * @memberOf GraphComponent
     */
    ngAfterViewInit(): void;
    /**
     * Base class update implementation for the dag graph
     *
     * @memberOf GraphComponent
     */
    update(): void;
    /**
     * Creates the dagre graph engine
     *
     * @memberOf GraphComponent
     */
    createGraph(): void;
    /**
     * Draws the graph using dagre layouts
     *
     *
     * @memberOf GraphComponent
     */
    draw(): void;
    tick(): void;
    getMinimapTransform(): string;
    updateGraphDims(): void;
    updateMinimap(): void;
    /**
     * Measures the node element and applies the dimensions
     *
     * @memberOf GraphComponent
     */
    applyNodeDimensions(): void;
    /**
     * Redraws the lines when dragged or viewport updated
     *
     * @memberOf GraphComponent
     */
    redrawLines(_animate?: boolean): void;
    /**
     * Calculate the text directions / flipping
     *
     * @memberOf GraphComponent
     */
    calcDominantBaseline(link: any): void;
    /**
     * Generate the new line path
     *
     * @memberOf GraphComponent
     */
    generateLine(points: any): any;
    /**
     * Zoom was invoked from event
     *
     * @memberOf GraphComponent
     */
    onZoom($event: WheelEvent, direction: string): void;
    /**
     * Pan by x/y
     *
     * @param x
     * @param y
     */
    pan(x: number, y: number, ignoreZoomLevel?: boolean): void;
    /**
     * Pan to a fixed x/y
     *
     */
    panTo(x: number, y: number): void;
    /**
     * Zoom by a factor
     *
     */
    zoom(factor: number): void;
    /**
     * Zoom to a fixed level
     *
     */
    zoomTo(level: number): void;
    /**
     * Drag was invoked from an event
     *
     * @memberOf GraphComponent
     */
    onDrag(event: MouseEvent): void;
    redrawEdge(edge: Edge): void;
    /**
     * Update the entire view for the new pan position
     *
     *
     * @memberOf GraphComponent
     */
    updateTransform(): void;
    /**
     * Node was clicked
     *
     *
     * @memberOf GraphComponent
     */
    onClick(event: any): void;
    /**
     * Node was focused
     *
     *
     * @memberOf GraphComponent
     */
    onActivate(event: any): void;
    /**
     * Node was defocused
     *
     * @memberOf GraphComponent
     */
    onDeactivate(event: any): void;
    /**
     * Get the domain series for the nodes
     *
     * @memberOf GraphComponent
     */
    getSeriesDomain(): any[];
    /**
     * Tracking for the link
     *
     *
     * @memberOf GraphComponent
     */
    trackLinkBy(index: number, link: Edge): any;
    /**
     * Tracking for the node
     *
     *
     * @memberOf GraphComponent
     */
    trackNodeBy(index: number, node: Node): any;
    /**
     * Sets the colors the nodes
     *
     *
     * @memberOf GraphComponent
     */
    setColors(): void;
    /**
     * On mouse move event, used for panning and dragging.
     *
     * @memberOf GraphComponent
     */
    onMouseMove($event: MouseEvent): void;
    onMouseDown(event: MouseEvent): void;
    graphClick(event: MouseEvent): void;
    /**
     * On touch start event to enable panning.
     *
     * @memberOf GraphComponent
     */
    onTouchStart(event: any): void;
    /**
     * On touch move event, used for panning.
     *
     */
    onTouchMove($event: any): void;
    /**
     * On touch end event to disable panning.
     *
     * @memberOf GraphComponent
     */
    onTouchEnd(): void;
    /**
     * On mouse up event to disable panning/dragging.
     *
     * @memberOf GraphComponent
     */
    onMouseUp(event: MouseEvent): void;
    /**
     * On node mouse down to kick off dragging
     *
     * @memberOf GraphComponent
     */
    onNodeMouseDown(event: MouseEvent, node: any): void;
    /**
     * On minimap drag mouse down to kick off minimap panning
     *
     * @memberOf GraphComponent
     */
    onMinimapDragMouseDown(): void;
    /**
     * On minimap pan event. Pans the graph to the clicked position
     *
     * @memberOf GraphComponent
     */
    onMinimapPanTo(event: MouseEvent): void;
    /**
     * Center the graph in the viewport
     */
    center(): void;
    /**
     * Zooms to fit the entire graph
     */
    zoomToFit(zoomOptions?: NgxGraphZoomOptions): void;
    /**
     * Pans to the node
     * @param nodeId
     */
    panToNodeId(nodeId: string): void;
    getCompoundNodeChildren(ids: Array<string>): Node[];
    private panWithConstraints;
    private updateMidpointOnEdge;
    private _calcMidPointElk;
    basicUpdate(): void;
    getContainerDims(): any;
    /**
     * Checks if the graph has dimensions
     */
    hasGraphDims(): boolean;
    /**
     * Checks if all nodes have dimension
     */
    hasNodeDims(): boolean;
    /**
     * Checks if all compound nodes have dimension
     */
    hasCompoundNodeDims(): boolean;
    /**
     * Checks if all clusters have dimension
     */
    hasClusterDims(): boolean;
    /**
     * Checks if the graph and all nodes have dimension.
     */
    hasDims(): boolean;
    protected unbindEvents(): void;
    private bindWindowResizeEvent;
    static ɵfac: i0.ɵɵFactoryDeclaration<GraphComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<GraphComponent, "ngx-graph", never, { "nodes": { "alias": "nodes"; "required": false; }; "clusters": { "alias": "clusters"; "required": false; }; "compoundNodes": { "alias": "compoundNodes"; "required": false; }; "links": { "alias": "links"; "required": false; }; "activeEntries": { "alias": "activeEntries"; "required": false; }; "curve": { "alias": "curve"; "required": false; }; "draggingEnabled": { "alias": "draggingEnabled"; "required": false; }; "nodeHeight": { "alias": "nodeHeight"; "required": false; }; "nodeMaxHeight": { "alias": "nodeMaxHeight"; "required": false; }; "nodeMinHeight": { "alias": "nodeMinHeight"; "required": false; }; "nodeWidth": { "alias": "nodeWidth"; "required": false; }; "nodeMinWidth": { "alias": "nodeMinWidth"; "required": false; }; "nodeMaxWidth": { "alias": "nodeMaxWidth"; "required": false; }; "panningEnabled": { "alias": "panningEnabled"; "required": false; }; "panningAxis": { "alias": "panningAxis"; "required": false; }; "enableZoom": { "alias": "enableZoom"; "required": false; }; "zoomSpeed": { "alias": "zoomSpeed"; "required": false; }; "minZoomLevel": { "alias": "minZoomLevel"; "required": false; }; "maxZoomLevel": { "alias": "maxZoomLevel"; "required": false; }; "autoZoom": { "alias": "autoZoom"; "required": false; }; "panOnZoom": { "alias": "panOnZoom"; "required": false; }; "animate": { "alias": "animate"; "required": false; }; "autoCenter": { "alias": "autoCenter"; "required": false; }; "update$": { "alias": "update$"; "required": false; }; "center$": { "alias": "center$"; "required": false; }; "zoomToFit$": { "alias": "zoomToFit$"; "required": false; }; "panToNode$": { "alias": "panToNode$"; "required": false; }; "layout": { "alias": "layout"; "required": false; }; "layoutSettings": { "alias": "layoutSettings"; "required": false; }; "enableTrackpadSupport": { "alias": "enableTrackpadSupport"; "required": false; }; "showMiniMap": { "alias": "showMiniMap"; "required": false; }; "miniMapMaxWidth": { "alias": "miniMapMaxWidth"; "required": false; }; "miniMapMaxHeight": { "alias": "miniMapMaxHeight"; "required": false; }; "miniMapPosition": { "alias": "miniMapPosition"; "required": false; }; "view": { "alias": "view"; "required": false; }; "scheme": { "alias": "scheme"; "required": false; }; "customColors": { "alias": "customColors"; "required": false; }; "deferDisplayUntilPosition": { "alias": "deferDisplayUntilPosition"; "required": false; }; "centerNodesOnPositionChange": { "alias": "centerNodesOnPositionChange"; "required": false; }; "enablePreUpdateTransform": { "alias": "enablePreUpdateTransform"; "required": false; }; "groupResultsBy": { "alias": "groupResultsBy"; "required": false; }; "zoomLevel": { "alias": "zoomLevel"; "required": false; }; "panOffsetX": { "alias": "panOffsetX"; "required": false; }; "panOffsetY": { "alias": "panOffsetY"; "required": false; }; }, { "select": "select"; "activate": "activate"; "deactivate": "deactivate"; "zoomChange": "zoomChange"; "clickHandler": "clickHandler"; "stateChange": "stateChange"; }, ["linkTemplate", "nodeTemplate", "clusterTemplate", "defsTemplate", "miniMapNodeTemplate"], ["*"], false, never>;
}
