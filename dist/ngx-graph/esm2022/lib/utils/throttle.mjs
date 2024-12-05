/**
 * Throttle a function
 *
 * @export
 * @param {*}      func
 * @param {number} wait
 * @param {*}      [options]
 * @returns
 */
export function throttle(context, func, wait, options) {
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
export function throttleable(duration, options) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyb3R0bGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9zd2ltbGFuZS9uZ3gtZ3JhcGgvc3JjL2xpYi91dGlscy90aHJvdHRsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUMsT0FBWSxFQUFFLElBQVMsRUFBRSxJQUFZLEVBQUUsT0FBYTtJQUMzRSxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUN4QixJQUFJLElBQVMsQ0FBQztJQUNkLElBQUksTUFBVyxDQUFDO0lBQ2hCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztJQUNuQixJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFFakIsU0FBUyxLQUFLO1FBQ1osUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUN2RCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxPQUFPLFVBQVUsR0FBRyxVQUFpQjtRQUNuQyxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFeEIsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQzNDLFFBQVEsR0FBRyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQztRQUMxQyxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBRWxCLElBQUksU0FBUyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ25CLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QixPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2YsUUFBUSxHQUFHLEdBQUcsQ0FBQztZQUNmLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO2FBQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQ2xELE9BQU8sR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxRQUFnQixFQUFFLE9BQWE7SUFDMUQsT0FBTyxTQUFTLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVU7UUFDcEQsT0FBTztZQUNMLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFVBQVUsRUFBRSxVQUFVLENBQUMsVUFBVTtZQUNqQyxHQUFHLEVBQUUsU0FBUyxNQUFNO2dCQUNsQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7b0JBQy9CLFlBQVksRUFBRSxJQUFJO29CQUNsQixVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVU7b0JBQ2pDLEtBQUssRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQztpQkFDM0QsQ0FBQyxDQUFDO2dCQUVILE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLENBQUM7U0FDRixDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhyb3R0bGUgYSBmdW5jdGlvblxuICpcbiAqIEBleHBvcnRcbiAqIEBwYXJhbSB7Kn0gICAgICBmdW5jXG4gKiBAcGFyYW0ge251bWJlcn0gd2FpdFxuICogQHBhcmFtIHsqfSAgICAgIFtvcHRpb25zXVxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRocm90dGxlKGNvbnRleHQ6IGFueSwgZnVuYzogYW55LCB3YWl0OiBudW1iZXIsIG9wdGlvbnM/OiBhbnkpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGxldCBhcmdzOiBhbnk7XG4gIGxldCByZXN1bHQ6IGFueTtcbiAgbGV0IHRpbWVvdXQgPSBudWxsO1xuICBsZXQgcHJldmlvdXMgPSAwO1xuXG4gIGZ1bmN0aW9uIGxhdGVyKCkge1xuICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiArbmV3IERhdGUoKTtcbiAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICguLi5fYXJndW1lbnRzOiBhbnlbXSkge1xuICAgIGNvbnN0IG5vdyA9ICtuZXcgRGF0ZSgpO1xuXG4gICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSB7XG4gICAgICBwcmV2aW91cyA9IG5vdztcbiAgICB9XG5cbiAgICBjb25zdCByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICBhcmdzID0gX2FyZ3VtZW50cztcblxuICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLyoqXG4gKiBUaHJvdHRsZSBkZWNvcmF0b3JcbiAqXG4gKiAgY2xhc3MgTXlDbGFzcyB7XG4gKiAgICB0aHJvdHRsZWFibGUoMTApXG4gKiAgICBteUZuKCkgeyAuLi4gfVxuICogIH1cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb25cbiAqIEBwYXJhbSB7Kn0gW29wdGlvbnNdXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3R0bGVhYmxlKGR1cmF0aW9uOiBudW1iZXIsIG9wdGlvbnM/OiBhbnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGlubmVyRGVjb3JhdG9yKHRhcmdldCwga2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IGRlc2NyaXB0b3IuZW51bWVyYWJsZSxcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0dGVyKCkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywga2V5LCB7XG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6IGRlc2NyaXB0b3IuZW51bWVyYWJsZSxcbiAgICAgICAgICB2YWx1ZTogdGhyb3R0bGUodGhpcywgZGVzY3JpcHRvci52YWx1ZSwgZHVyYXRpb24sIG9wdGlvbnMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzW2tleV07XG4gICAgICB9XG4gICAgfTtcbiAgfTtcbn1cbiJdfQ==