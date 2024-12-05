export declare class ColorHelper {
    scale: any;
    colorDomain: any[];
    domain: any;
    customColors: any;
    constructor(scheme: any, domain: any, customColors?: any);
    generateColorScheme(scheme: any, domain: any): import("d3-scale").ScaleOrdinal<string, unknown, never>;
    getColor(value: any): any;
}
