import { NgModule } from '@angular/core';
import { GraphComponent } from './graph.component';
import { MouseWheelDirective } from './mouse-wheel.directive';
import { LayoutService } from './layouts/layout.service';
import { CommonModule } from '@angular/common';
import { VisibilityObserver } from '../utils/visibility-observer';
import * as i0 from "@angular/core";
export { GraphComponent, LayoutService };
export class GraphModule {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGgubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWdyYXBoL3NyYy9saWIvZ3JhcGgvZ3JhcGgubW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sOEJBQThCLENBQUM7O0FBQ2xFLE9BQU8sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLENBQUM7QUFRekMsTUFBTSxPQUFPLFdBQVc7dUdBQVgsV0FBVzt3R0FBWCxXQUFXLGlCQUpQLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsYUFENUQsWUFBWSxhQUVaLGNBQWMsRUFBRSxtQkFBbUI7d0dBR2xDLFdBQVcsYUFGWCxDQUFDLGFBQWEsQ0FBQyxZQUhoQixZQUFZOzsyRkFLWCxXQUFXO2tCQU52QixRQUFRO21CQUFDO29CQUNSLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQztvQkFDdkIsWUFBWSxFQUFFLENBQUMsY0FBYyxFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDO29CQUN2RSxPQUFPLEVBQUUsQ0FBQyxjQUFjLEVBQUUsbUJBQW1CLENBQUM7b0JBQzlDLFNBQVMsRUFBRSxDQUFDLGFBQWEsQ0FBQztpQkFDM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgR3JhcGhDb21wb25lbnQgfSBmcm9tICcuL2dyYXBoLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBNb3VzZVdoZWVsRGlyZWN0aXZlIH0gZnJvbSAnLi9tb3VzZS13aGVlbC5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgTGF5b3V0U2VydmljZSB9IGZyb20gJy4vbGF5b3V0cy9sYXlvdXQuc2VydmljZSc7XG5pbXBvcnQgeyBDb21tb25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgVmlzaWJpbGl0eU9ic2VydmVyIH0gZnJvbSAnLi4vdXRpbHMvdmlzaWJpbGl0eS1vYnNlcnZlcic7XG5leHBvcnQgeyBHcmFwaENvbXBvbmVudCwgTGF5b3V0U2VydmljZSB9O1xuXG5ATmdNb2R1bGUoe1xuICBpbXBvcnRzOiBbQ29tbW9uTW9kdWxlXSxcbiAgZGVjbGFyYXRpb25zOiBbR3JhcGhDb21wb25lbnQsIE1vdXNlV2hlZWxEaXJlY3RpdmUsIFZpc2liaWxpdHlPYnNlcnZlcl0sXG4gIGV4cG9ydHM6IFtHcmFwaENvbXBvbmVudCwgTW91c2VXaGVlbERpcmVjdGl2ZV0sXG4gIHByb3ZpZGVyczogW0xheW91dFNlcnZpY2VdXG59KVxuZXhwb3J0IGNsYXNzIEdyYXBoTW9kdWxlIHt9XG4iXX0=