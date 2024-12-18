import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Mousewheel directive
 * https://github.com/SodhanaLibrary/angular2-examples/blob/master/app/mouseWheelDirective/mousewheel.directive.ts
 *
 * @export
 */
export declare class MouseWheelDirective {
    mouseWheelUp: EventEmitter<any>;
    mouseWheelDown: EventEmitter<any>;
    onMouseWheelChrome(event: any): void;
    onMouseWheelFirefox(event: any): void;
    onWheel(event: any): void;
    onMouseWheelIE(event: any): void;
    mouseWheelFunc(event: any): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MouseWheelDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<MouseWheelDirective, "[mouseWheel]", never, {}, { "mouseWheelUp": "mouseWheelUp"; "mouseWheelDown": "mouseWheelDown"; }, never, never, false, never>;
}
