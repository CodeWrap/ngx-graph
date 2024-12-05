import { Directive, Output, HostListener, EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Mousewheel directive
 * https://github.com/SodhanaLibrary/angular2-examples/blob/master/app/mouseWheelDirective/mousewheel.directive.ts
 *
 * @export
 */
// tslint:disable-next-line: directive-selector
export class MouseWheelDirective {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2Utd2hlZWwuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWdyYXBoL3NyYy9saWIvZ3JhcGgvbW91c2Utd2hlZWwuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsTUFBTSxlQUFlLENBQUM7O0FBRTlFOzs7OztHQUtHO0FBQ0gsK0NBQStDO0FBRS9DLE1BQU0sT0FBTyxtQkFBbUI7SUFFOUIsWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7SUFFbEMsY0FBYyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7SUFHcEMsa0JBQWtCLENBQUMsS0FBVTtRQUMzQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFHRCxtQkFBbUIsQ0FBQyxLQUFVO1FBQzVCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUdELE9BQU8sQ0FBQyxLQUFVO1FBQ2hCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUdELGNBQWMsQ0FBQyxLQUFVO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELGNBQWMsQ0FBQyxLQUFVO1FBQ3ZCLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pCLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDbkgsMEZBQTBGO1FBQzFGLE1BQU0sY0FBYyxHQUFZLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDekUsTUFBTSxnQkFBZ0IsR0FBWSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQzNFLElBQUksY0FBYyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEMsQ0FBQzthQUFNLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsU0FBUztRQUNULEtBQUssQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBRTFCLHlCQUF5QjtRQUN6QixJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN6QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDekIsQ0FBQztJQUNILENBQUM7dUdBaERVLG1CQUFtQjsyRkFBbkIsbUJBQW1COzsyRkFBbkIsbUJBQW1CO2tCQUQvQixTQUFTO21CQUFDLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRTs4QkFHckMsWUFBWTtzQkFEWCxNQUFNO2dCQUdQLGNBQWM7c0JBRGIsTUFBTTtnQkFJUCxrQkFBa0I7c0JBRGpCLFlBQVk7dUJBQUMsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU10QyxtQkFBbUI7c0JBRGxCLFlBQVk7dUJBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBTTFDLE9BQU87c0JBRE4sWUFBWTt1QkFBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBTWpDLGNBQWM7c0JBRGIsWUFBWTt1QkFBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIE91dHB1dCwgSG9zdExpc3RlbmVyLCBFdmVudEVtaXR0ZXIgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBNb3VzZXdoZWVsIGRpcmVjdGl2ZVxuICogaHR0cHM6Ly9naXRodWIuY29tL1NvZGhhbmFMaWJyYXJ5L2FuZ3VsYXIyLWV4YW1wbGVzL2Jsb2IvbWFzdGVyL2FwcC9tb3VzZVdoZWVsRGlyZWN0aXZlL21vdXNld2hlZWwuZGlyZWN0aXZlLnRzXG4gKlxuICogQGV4cG9ydFxuICovXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IGRpcmVjdGl2ZS1zZWxlY3RvclxuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW21vdXNlV2hlZWxdJyB9KVxuZXhwb3J0IGNsYXNzIE1vdXNlV2hlZWxEaXJlY3RpdmUge1xuICBAT3V0cHV0KClcbiAgbW91c2VXaGVlbFVwID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICBAT3V0cHV0KClcbiAgbW91c2VXaGVlbERvd24gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgQEhvc3RMaXN0ZW5lcignbW91c2V3aGVlbCcsIFsnJGV2ZW50J10pXG4gIG9uTW91c2VXaGVlbENocm9tZShldmVudDogYW55KTogdm9pZCB7XG4gICAgdGhpcy5tb3VzZVdoZWVsRnVuYyhldmVudCk7XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdET01Nb3VzZVNjcm9sbCcsIFsnJGV2ZW50J10pXG4gIG9uTW91c2VXaGVlbEZpcmVmb3goZXZlbnQ6IGFueSk6IHZvaWQge1xuICAgIHRoaXMubW91c2VXaGVlbEZ1bmMoZXZlbnQpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignd2hlZWwnLCBbJyRldmVudCddKVxuICBvbldoZWVsKGV2ZW50OiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm1vdXNlV2hlZWxGdW5jKGV2ZW50KTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ29ubW91c2V3aGVlbCcsIFsnJGV2ZW50J10pXG4gIG9uTW91c2VXaGVlbElFKGV2ZW50OiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLm1vdXNlV2hlZWxGdW5jKGV2ZW50KTtcbiAgfVxuXG4gIG1vdXNlV2hlZWxGdW5jKGV2ZW50OiBhbnkpOiB2b2lkIHtcbiAgICBpZiAod2luZG93LmV2ZW50KSB7XG4gICAgICBldmVudCA9IHdpbmRvdy5ldmVudDtcbiAgICB9XG5cbiAgICBjb25zdCBkZWx0YTogbnVtYmVyID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKDEsIGV2ZW50LndoZWVsRGVsdGEgfHwgLWV2ZW50LmRldGFpbCB8fCBldmVudC5kZWx0YVkgfHwgZXZlbnQuZGVsdGFYKSk7XG4gICAgLy8gRmlyZWZveCBkb24ndCBoYXZlIG5hdGl2ZSBzdXBwb3J0IGZvciB3aGVlbCBldmVudCwgYXMgYSByZXN1bHQgZGVsdGEgdmFsdWVzIGFyZSByZXZlcnNlXG4gICAgY29uc3QgaXNXaGVlbE1vdXNlVXA6IGJvb2xlYW4gPSBldmVudC53aGVlbERlbHRhID8gZGVsdGEgPiAwIDogZGVsdGEgPCAwO1xuICAgIGNvbnN0IGlzV2hlZWxNb3VzZURvd246IGJvb2xlYW4gPSBldmVudC53aGVlbERlbHRhID8gZGVsdGEgPCAwIDogZGVsdGEgPiAwO1xuICAgIGlmIChpc1doZWVsTW91c2VVcCkge1xuICAgICAgdGhpcy5tb3VzZVdoZWVsVXAuZW1pdChldmVudCk7XG4gICAgfSBlbHNlIGlmIChpc1doZWVsTW91c2VEb3duKSB7XG4gICAgICB0aGlzLm1vdXNlV2hlZWxEb3duLmVtaXQoZXZlbnQpO1xuICAgIH1cblxuICAgIC8vIGZvciBJRVxuICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG5cbiAgICAvLyBmb3IgQ2hyb21lIGFuZCBGaXJlZm94XG4gICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfVxufVxuIl19