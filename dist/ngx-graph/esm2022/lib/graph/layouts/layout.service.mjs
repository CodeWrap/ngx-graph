import { Injectable } from '@angular/core';
import { DagreLayout } from './dagre';
import { DagreClusterLayout } from './dagreCluster';
import { DagreNodesOnlyLayout } from './dagreNodesOnly';
import { D3ForceDirectedLayout } from './d3ForceDirected';
import { ColaForceDirectedLayout } from './colaForceDirected';
import * as i0 from "@angular/core";
const layouts = {
    dagre: DagreLayout,
    dagreCluster: DagreClusterLayout,
    dagreNodesOnly: DagreNodesOnlyLayout,
    d3ForceDirected: D3ForceDirectedLayout,
    colaForceDirected: ColaForceDirectedLayout
};
export class LayoutService {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9zd2ltbGFuZS9uZ3gtZ3JhcGgvc3JjL2xpYi9ncmFwaC9sYXlvdXRzL2xheW91dC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFM0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUN0QyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUN4RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMxRCxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQzs7QUFFOUQsTUFBTSxPQUFPLEdBQUc7SUFDZCxLQUFLLEVBQUUsV0FBVztJQUNsQixZQUFZLEVBQUUsa0JBQWtCO0lBQ2hDLGNBQWMsRUFBRSxvQkFBb0I7SUFDcEMsZUFBZSxFQUFFLHFCQUFxQjtJQUN0QyxpQkFBaUIsRUFBRSx1QkFBdUI7Q0FDM0MsQ0FBQztBQUdGLE1BQU0sT0FBTyxhQUFhO0lBQ3hCLFNBQVMsQ0FBQyxJQUFZO1FBQ3BCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDbEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQzdCLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0gsQ0FBQzt1R0FQVSxhQUFhOzJHQUFiLGFBQWE7OzJGQUFiLGFBQWE7a0JBRHpCLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBMYXlvdXQgfSBmcm9tICcuLi8uLi9tb2RlbHMvbGF5b3V0Lm1vZGVsJztcbmltcG9ydCB7IERhZ3JlTGF5b3V0IH0gZnJvbSAnLi9kYWdyZSc7XG5pbXBvcnQgeyBEYWdyZUNsdXN0ZXJMYXlvdXQgfSBmcm9tICcuL2RhZ3JlQ2x1c3Rlcic7XG5pbXBvcnQgeyBEYWdyZU5vZGVzT25seUxheW91dCB9IGZyb20gJy4vZGFncmVOb2Rlc09ubHknO1xuaW1wb3J0IHsgRDNGb3JjZURpcmVjdGVkTGF5b3V0IH0gZnJvbSAnLi9kM0ZvcmNlRGlyZWN0ZWQnO1xuaW1wb3J0IHsgQ29sYUZvcmNlRGlyZWN0ZWRMYXlvdXQgfSBmcm9tICcuL2NvbGFGb3JjZURpcmVjdGVkJztcblxuY29uc3QgbGF5b3V0cyA9IHtcbiAgZGFncmU6IERhZ3JlTGF5b3V0LFxuICBkYWdyZUNsdXN0ZXI6IERhZ3JlQ2x1c3RlckxheW91dCxcbiAgZGFncmVOb2Rlc09ubHk6IERhZ3JlTm9kZXNPbmx5TGF5b3V0LFxuICBkM0ZvcmNlRGlyZWN0ZWQ6IEQzRm9yY2VEaXJlY3RlZExheW91dCxcbiAgY29sYUZvcmNlRGlyZWN0ZWQ6IENvbGFGb3JjZURpcmVjdGVkTGF5b3V0XG59O1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTGF5b3V0U2VydmljZSB7XG4gIGdldExheW91dChuYW1lOiBzdHJpbmcpOiBMYXlvdXQge1xuICAgIGlmIChsYXlvdXRzW25hbWVdKSB7XG4gICAgICByZXR1cm4gbmV3IGxheW91dHNbbmFtZV0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGxheW91dCB0eXBlICcke25hbWV9J2ApO1xuICAgIH1cbiAgfVxufVxuIl19