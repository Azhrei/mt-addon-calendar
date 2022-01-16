// Represents a generic "calendar" type for use in the MapTool plugin.
//
// It supports definitions for standard time elements (`round`, `minute`, `hour`, `day`;
// should `round` be `turn` instead?) and it uses those values when performing
// normalization or calculations.  Those metrics are all represented in seconds.
//
// The approach used is to represent all multi-day time periods as "extents".  These
// are simply a starting point and a length.  To simplify initialization for the user,
// they can be specified as `[name: string, length: number]` and the proper internal
// data structures will be built by the constructor.

// This is the type of a single extent.  TS doesn't require you use this actual
// interface as long as your data includes the `name` and `length` fields.
export interface Extent {
  name: string;
  length: number;
}

export interface Metrics {
  [index: string]: number;
}

/**
 These are the options that can be provided to the `Calendar` constructor.
 Most have defaults as defined by the following class, `DefaultCalendarOptions`.
 */
export interface CalendarOptions {
  startYear: number;
  populateExtents: (year: number) => Extent[];
  metrics?: Metrics;
  console?: Console;
  currentDay?: number;
  currentTime?: number;
}

// An instance of this class is created and passed to the `Calendar` constructor if
// the user doesn't provide any parameters.  It defaults to use the Gregorian calendar
// for demonstration purposes.  Because `console` is `undefined`, there will be no
// logging of any intermediate progress (assign it the `console` object and the typical
// `log()`, `warn()`, and `error()` methods will be called, or use your own custom object).
class DefaultCalendarOptions implements CalendarOptions {
  startYear = 0;
  /**
   * Allows the list of extents to change every year.  The callback is invoked any time
   * a new year is needed from adjusting the day either backward or forward.
   * @param year - the year for which extents are being requested
   */
  populateExtents = function (year: number): Extent[] {
    return [
      { name: "Jan", length: 31 },
      {
        name: "Feb",
        length:
          28 + (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 1 : 0),
      },
      { name: "Mar", length: 31 },
      { name: "Apr", length: 30 },
      { name: "May", length: 31 },
      { name: "Jun", length: 30 },
      { name: "Jul", length: 31 },
      { name: "Aug", length: 31 },
      { name: "Sep", length: 30 },
      { name: "Oct", length: 31 },
      { name: "Nov", length: 30 },
      { name: "Dec", length: 31 },
    ];
  };
  metrics: Metrics = {
    second: 1,
    seconds: 1,
    turn: 6,
    turns: 6,
    round: 6,
    rounds: 6,
    minute: 60,
    minutes: 60,
    hour: 3_600,
    hours: 3_600,
    day: 86_400,
    days: 86_400,
  };
  console = undefined;
  currentDay = 0;
  currentTime = 0;
}

/**
 This is used for the internal view of an `Extent`.  It has additional fields
 which are initialized upon first reference, allowing for faster lookup later.
 */
class _InternalExtent {
  startYear: number;
  startDay: number;
  originalExt: Extent;

  constructor(sy: number, sd: number, e: Extent) {
    this.startYear = sy;
    this.startDay = sd;
    this.originalExt = e;
  }

  /**
   * Any type that might be sorted or searched in the future must have a
   * `compare()` method similar to this one.  Whenever a sort or search
   * is about to be performed at runtime, a dynamic lookup of the class
   * is made and this static function is used.
   * @param other - second item of this type to compare
   */
  compare(other: _InternalExtent): -1 | 0 | 1 {
    let rv = this.startYear - other.startYear;
    if (rv != 0) return rv < 0 ? -1 : 1;
    rv = this.startDay - other.startDay;
    if (rv != 0) return rv < 0 ? -1 : 1;
    return 0;
  }
}

interface _ExtentsByStart {
  [year: number]: _InternalExtent[];
}

interface _ExtentsByName {
  [name: string]: { [year: number]: _InternalExtent };
}

export class Calendar {
  private console: Console;
  private readonly populateExtents: (year: number) => Extent[];
  private readonly metrics: Metrics;
  private extentsByStart: _ExtentsByStart = {};
  private extentsByName: _ExtentsByName = {};
  startYear: number = 0;
  totalDays: number = 0;
  // Integer representing the current day of the year `[0, totalDays)`
  currentDay: number = 0;
  // Integer representing the current time of day `[0, metrics["day"])`
  currentTime: number = 0;

  /**
   * Can be called with a `null` or `undefined` value and it will use the default
   * specified above.  If an object is provided, it must have the `extents` field;
   * not including that field throws a `TypeError` exception.  (Which means the only
   * way to get the default Gregorian calendar is to pass no parameter at all, since
   * the `DefaultCalendarOptions` class is not exported.)
   */
  constructor(props: CalendarOptions = new DefaultCalendarOptions()) {
    if (
      typeof props === "undefined" ||
      typeof props.populateExtents !== "function" ||
      props.startYear === undefined
    ) {
      throw new TypeError(`Incorrect type in Calendar constructor`);
    }
    // Because we can be called from JS, ie. a non-type safe language, we're doing
    // extra checks here.
    const defaultOptions = new DefaultCalendarOptions();
    this.console = props?.console || {
      ...console,
      log() {},
      warn() {},
      error() {},
    };
    this.metrics = props?.metrics || defaultOptions.metrics;
    this.startYear = props?.startYear || 2022;
    this.populateExtents =
      props?.populateExtents || defaultOptions.populateExtents;
    this.setCurrentDay(props?.currentDay || defaultOptions.currentDay);
    this.setCurrentTime(props?.currentTime || defaultOptions.currentTime);

    const prevYear = this.extentsByStart[this.startYear];
    const lastExtent = prevYear[prevYear.length - 1];
    let totalDays = lastExtent.startDay + lastExtent.originalExt.length;
    this.console.log(
      `Total of ${prevYear.length} extents spanning ${totalDays} days in year ${this.startYear}.`
    );
  }

  /**
   * Is called whenever a new set of extents is needed for a given year.
   * The results are cached in `extentsByStart`.  This should only ever
   * be called once for a given year.
   *
   * @param year - year of extents to generate
   * @private
   */
  private buildExtents(year: number): void {
    /* Maybe a function constraint should be used here? https://www.typescriptlang.org/docs/handbook/2/functions.html#constraints */
    if (year in this.extentsByStart) {
      throw new Error(
        `buildExtents() called when data is already cached -- shouldn't happen!`
      );
    }
    let ext = this.populateExtents(year);
    if (!Array.isArray(ext)) {
      throw new TypeError(
        `Incorrect type of extents array, should be array: ${typeof ext}`
      );
    }
    let start = 0;
    this.extentsByStart[year] = ext.map((v, index): _InternalExtent => {
      let rv: _InternalExtent;
      if (typeof v !== "object") {
        throw new TypeError(
          `Incorrect type in extents array, index ${index} of ${ext.length}`
        );
      }
      rv = new _InternalExtent(year, start, v);
      if (v.name in this.extentsByName) {
        this.extentsByName[v.name][year] = rv;
      } else {
        this.extentsByName[v.name] = { [year]: rv };
      }
      start += v.length;
      return rv;
    });
  }

  /**
   * Retrieves the extents for a given year if not already cached and calculates
   * the number of days in that year.
   * @param year
   * @private
   */
  private getLengthOfYear(year: number): number {
    if (this.extentsByStart[year] === undefined) {
      this.buildExtents(year);
    }
    const yearExtents = this.extentsByStart[year];
    const lastExtent = yearExtents[yearExtents.length - 1];
    return lastExtent.startDay + lastExtent.originalExt.length;
  }

  /**
   * Sets the current day to the given value.
   * It normalizes the value to `0 <= day < totalDays`.
   * Negative values may roll the year backward and positive values may
   * roll the year forward, causing new extents to be built on the fly.
   * @param n - day number of the year to assign
   */
  setCurrentDay(n: number) {
    // noinspection SuspiciousTypeOfGuard
    if (typeof n !== "number") {
      throw new TypeError(
        `Incorrect type of parameter, parameter "s" is "${typeof n}"`
      );
    }
    // Use temporaries for everything, so if we throw an exception, the Calendar object isn't corrupted.
    let [thisYear, totalDays] = [
      this.startYear,
      this.getLengthOfYear(this.startYear),
    ];
    while (n < 0) {
      thisYear -= 1;
      totalDays = this.getLengthOfYear(thisYear);
      n += totalDays;
    }
    if (n >= totalDays) {
      if (this.startYear != thisYear) {
        throw new Error(
          `day adjusted backward is now being adjust forward -- shouldn't happen!`
        );
      }
      while (n >= totalDays) {
        thisYear += 1;
        totalDays = this.getLengthOfYear(thisYear);
        n -= totalDays;
      }
    }
    [this.currentDay, this.startYear, this.totalDays] = [
      n,
      thisYear,
      totalDays,
    ];
  }

  /**
   *  Sets the current time to the given value.
   *  It normalizes the time to be `0 <= time < metrics["day"]`.
   *  @param n - the time to be set (in seconds since the start of the year)
   */
  setCurrentTime(n: number) {
    while (n < 0) n += this.metrics["day"];
    this.currentTime = n % this.metrics["day"];
  }

  // Adjusts the current day forward or backward by a given amount.
  // The units provided are in days, not in seconds.  The current time is not modified.
  adjustDay(n: number) {
    this.setCurrentDay(this.currentDay + n);
  }

  // Adjusts the current time forward or backward by a given amount.
  // The units provided are in seconds.  The current day will be updated forward or backward as
  // appropriate.
  adjustTime(n: number) {
    let newTime = this.currentTime + n;
    this.setCurrentDay(
      this.currentDay + Math.floor(newTime / this.metrics["day"])
    );
    this.setCurrentTime(newTime);
  }
}
