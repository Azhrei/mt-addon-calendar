import {Utils} from '../utils';
import {expect, should} from 'chai';

should();

describe('Utils tests', () => {
    const arrayOfInt = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    it('can find integer in an array of integers', () => {
        let search_for = 50;
        let result = Utils.bsearch(arrayOfInt, search_for, Utils.compare)
        expect(result).to.be.equal(4);
    });

    it('can find first integer in an array of integers', () => {
        let search_for = 10;
        let result = Utils.bsearch(arrayOfInt, search_for, Utils.compare)
        expect(result).to.be.equal(0);
    });

    it('can find last integer in an array of integers', () => {
        let search_for = 100;
        let result = Utils.bsearch(arrayOfInt, search_for, Utils.compare)
        expect(result).to.be.equal(9);
    });

    it('can determine insertion point for new value', () => {
        let search_for = 55;
        let result = Utils.bsearch(arrayOfInt, search_for, Utils.compare);
        // Negative return value means 'not found'.  Absolute value is insertion point.
        expect(result).to.be.equal(-5);
    });

    type Extent = { start: number, name: string, length: number };
    const arrayOfExt: Extent[] = [
        {start: 0, name: "Jan", length: 31},
        {start: 31, name: "Feb", length: 28},
        {start: 59, name: "Mar", length: 31}
    ];
    let extentCompare = function (a: Extent, b: Extent): -1 | 0 | 1 {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;
        // for (let i in ["start", "name", "length"]) {
        //     if (a[i] < b[i]) return -1;
        //     if (a[i] > b[i]) return 1;
        // }
        return 0;
    };

    it('can sort extents using extentCompare()', () => {
        let newArray = Array.from(arrayOfExt);
        // Ensure the array is NOT in order.
        newArray.push(newArray[0]);
        newArray.shift();

        newArray.sort(extentCompare);
        expect(newArray[0].start).to.be.equal(0);
        expect(newArray[1].start).to.be.equal(31);
        expect(newArray[2].start).to.be.equal(59);
    });

    it('can find extent in an array of extents', () => {
        let result = Utils.bsearch(arrayOfExt, {start: 31, name: "", length: 0}, extentCompare);
        // Negative return value means 'not found'.  Absolute value is insertion point.
        expect(result).to.be.equal(1);
    });

    // Check code coverage to see if all lines are being tested properly
});
