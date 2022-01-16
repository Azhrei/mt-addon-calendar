# mt-addon-calendar
TypeScript implementation of generic Calendar (time &amp; event tracking in MapTool)

## Overview

This package attempts to be a generic event and time tracking addon for MapTool v1.11+.

The goal is provide an easy way to create events and place them on a calendar customized for the GM's world system.
This means being able to define the layout of a year.

### Extent - defining calendar periods spanning one or more days

This is done by creating a list of *Extent* objects to represent each period of time within the year.
A typical Gregorian calendar would include an Extent array of:
```
{name: 'Jan', length: 31},
{name: 'Feb', length: 28},
  ...
{name: 'Dec', length: 31}
```
An Extent array is specific to a given year.
This allows different years to have different periods defined, such as the Gregorian calendar sometimes having 29 days in February.
Leap years, for example, can be handled by replacing the number `28` with this formula:

```28 + (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) ? 1 : 0)```

It's possible that custom calendars for game systems may include extra extents.
For example, an extra "Harvestal" week ("harvest" + "festival") that was sandwiched between the months of September and October would be represented as an additional Extent of 7 days between those two months.

### Moment - defining a single point in time

All times on the Calendar are represented by *Moment* objects.
These are tuples of year and second at which the event starts.

### Metrics - defining common short-term time intervals

The time periods within a day can be customized; the default metrics are shown below.
Each one is represented by a count measured in seconds:
```
second: 1,
turn: 6,
round: 6,
minute: 60,
hour: 3_600,
day: 86_400,
```

### Interval - durations between Moments

Related to Moment objects are *Interval* objects.
These objects are the results of subtracting one Moment from another, or can be created and manipulated as integers.

### Event - opaque user-defined objects placed at a specific time on the calendar

Finally, users of this addon can define their own *Event* type.
The addon will treat this as an opaque type (meaning that the contents of it will never be queried).
This allows the user to include any and all information they consider relevant to the event.
Events can be created with a periodicity and repeat count to represent repeating events.
Each Event can be constructed with a callback function specified that is invoked when a time adjustment crosses the start time of the Event.

### Calendar - defined by Extents and functions that manipulate a concept of *now*

The Calendar object maintains state in the form of three variables, *currentYear*, *currentDay*, and *currentTime*.
Those values can be adjusted forward or backward in time using the `adjustYear()`, `adjustDay()`, and `adjustTime()` functions.
As the current state is adjusted, events that are scheduled to occur are returned.
There are two ways this can work.

+ The first is that all events that begin within the spanned time interval are returned in an array, sorted by the start time.
+ The second is that the first event is returned and the adjustment is halted at that event.

The choice of which technique to use can be passed to the adjustment function, but can be overridden be specifying it in the event itself.
