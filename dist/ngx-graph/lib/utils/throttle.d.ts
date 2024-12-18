/**
 * Throttle a function
 *
 * @export
 * @param {*}      func
 * @param {number} wait
 * @param {*}      [options]
 * @returns
 */
export declare function throttle(context: any, func: any, wait: number, options?: any): (..._arguments: any[]) => any;
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
export declare function throttleable(duration: number, options?: any): (target: any, key: any, descriptor: any) => {
    configurable: boolean;
    enumerable: any;
    get: () => any;
};
