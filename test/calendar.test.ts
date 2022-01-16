import {Calendar, CalendarOptions, Extent} from "../Calendar";
// import {List, Set} from 'immutable';
import {expect, should} from 'chai';
// import * as chaiImmutable from 'chai-immutable';

should();

describe('Calendar tests', () => {
    const validExtentsOptionsClass = class implements CalendarOptions {
        startYear: number = 2022;
        // noinspection JSUnusedLocalSymbols
        populateExtents = function (year: number): Extent[] {
            return [
                {name: "Qtr1", length: 31 + 28 + 31},
                {name: "Qtr2", length: 30 + 31 + 30},
                {name: "Qtr3", length: 31 + 31 + 30},
                {name: "Qtr4", length: 31 + 30 + 31}
            ]
        };
    };
    const validExtentsOptions = new validExtentsOptionsClass();
    const invalidExtentsOptionsClass = class implements CalendarOptions {
        startYear: number = 2022;
        // noinspection JSUnusedLocalSymbols
        populateExtents = function (year: number): Extent[] {
            // @ts-ignore Suppressed in order to test JS calls with bad data
            return {name: "Qtr1", length: 31 + 28 + 31};
        };
    };
    const invalidExtentsOptions = new invalidExtentsOptionsClass();

    it('can be created using default constructor', () => {
        let cal = new Calendar();
        expect(cal).to.not.be.null;
    });

    it('will detect invalid extents', () => {
        expect(() => { // @ts-ignore   Ignoring this error is important; see above definition of `invalidExtentOptions`.
            new Calendar(invalidExtentsOptions)
        }).to.throw(TypeError);
    });

    it('can be created with custom extents', () => {
        let cal = new Calendar(validExtentsOptions);
        expect(cal).to.not.be.null;
        expect(cal.totalDays).to.be.eq(365);
        // console.log(cal);
    });

    it('can set current day', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        expect(cal.currentDay).to.be.equal(45);
    });

    it('can adjust current day forward; not into next year', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.adjustDay(50);
        expect(cal.currentDay).to.be.equal(95);
    });
    it('can adjust current day backward; into next year', () => {
        let cal = new Calendar();
        cal.setCurrentDay(350);
        cal.adjustDay(50);
        expect(cal.currentDay).to.be.equal(350 + 50 - 365);
    });

    it('can adjust current day backward; not into previous year', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.adjustDay(-5);
        expect(cal.currentDay).to.be.equal(40);
    });
    it('can adjust current day backward; into previous year', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.adjustDay(-50);
        expect(cal.currentDay).to.be.equal(365 + 45 - 50);
    });

    it('can set current time', () => {
        let cal = new Calendar();
        cal.setCurrentTime(45);
        expect(cal.currentTime).to.be.equal(45);
    });

    it('can adjust current time forward; not into next day', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.setCurrentTime(45);
        cal.adjustTime(50);
        expect(cal.currentDay).to.be.equal(45);
        expect(cal.currentTime).to.be.equal(95);
    });

    it('can adjust current time forward; into next day', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.setCurrentTime(45000);
        cal.adjustTime(50000);
        expect(cal.currentDay).to.be.equal(45 + 1);
        expect(cal.currentTime).to.be.equal(8600);
    });

    it('can adjust current time backward; not into previous day', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.setCurrentTime(45);
        cal.adjustTime(-5);
        expect(cal.currentDay).to.be.equal(45);
        expect(cal.currentTime).to.be.equal(40);
    });

    it('can adjust current time backward; into previous day', () => {
        let cal = new Calendar();
        cal.setCurrentDay(45);
        cal.setCurrentTime(45);
        cal.adjustTime(-50);
        expect(cal.currentDay).to.be.equal(45 - 1);
        expect(cal.currentTime).to.be.equal(86400 + 45 - 50);
    });
});
