/**
 Implements various utility operations needed by the Calendar and supporting classes.

 <p style="margin-top: 10pt">
 For JS sorting by nested key, see
 {@link https://stackoverflow.com/questions/5073799/how-to-sort-a-javascript-array-of-objects-by-nested-object-property}
 (doesn't cover multikey sorting, but we should be able to create our data structures to avoid that requirement).
 Also, perhaps {@link https://github.com/cosimochellini/sort-es} is an option.

 <p style="margin-top: 10pt">
 For a deep equality check, use {@link https://blog.jmorbegoso.com/post/check-objects-deep-equality-in-typescript/}.
 */

type Comparator = <Type>(a: Type, b: Type) => -1 | 0 | 1;

/**
 * Acts as a namespace for various utility functions.
 */
export class Utils {
  /**
   * Performs a binary search on the given array.  Obviously, elements in the array
   * must already be in sorted order per the passed in `compare` function`.  See this page for
   * a description of `compare`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
   * The `Type` is constrained to be something that contains a `compare` property, but it's
   * optional and if not provided, the `compare()` defined herein will be used (although
   * it'll fail if the parameters are not comparable using `<` and `===`).
   */
  static bsearch<Type extends { compare?: Comparator }>(
    ary: Type[],
    value: Type,
    compare?: Comparator
  ): number {
    if (!Array.isArray(ary)) {
      throw new TypeError(
        `First parameter to 'bsearch()' must be an array, got ${typeof ary}.`
      );
    }
    let low = 0,
      high = ary.length - 1,
      mid = 0;
    if (high < 0) {
      throw new TypeError(`First parameter to 'bsearch()' must not be empty.`);
    }
    let compareFn: Comparator;
    if (compare instanceof Function) {
      compareFn = compare;
    } else if (value.compare instanceof Function) {
      compareFn = (a, b) => (value.compare as Function)(b);
    } else {
      compareFn = (a, b) => (a < b ? -1 : a === b ? 0 : 1);
    }
    while (low <= high) {
      mid = Math.floor((low + high) / 2);
      let comparison = compareFn(value, ary[mid]);
      switch (comparison) {
        case -1:
          high = mid - 1;
          break; // Value is less than the midpoint
        case 0:
          return mid;
        case 1:
          low = mid + 1;
          break; // Value is greater than the midpoint
        default:
          throw new RangeError(
            `comparison function in 'bsearch()' returned invalid value: ${comparison}.`
          );
      }
    }
    // Value not found; use negated insertion point
    return -mid;
  }
}
