import { expect } from 'chai';
import { UniqueSortedList } from '@mm-reducers/utils';

describe('UniqueSortedList', () => {

    describe('with string sortBy', () => {
        it('should add items in sorted order', () => {
            const list = new UniqueSortedList([], new Map(), 'date');
            list.add({ _id: '1', date: 10 });
            list.add({ _id: '3', date: 30 });
            list.add({ _id: '2', date: 20 });

            const result = list.list;
            expect(result.length).to.equal(3);
            expect(result[0]._id).to.equal('3'); // Descending order because of -item[sortBy]
            expect(result[1]._id).to.equal('2');
            expect(result[2]._id).to.equal('1');
        });

        it('should not add item if identity matches existing', () => {
            const list = new UniqueSortedList([], new Map(), 'date');
            list.add({ _id: '1', date: 10 });
            list.add({ _id: '1', date: 20 });

            const result = list.list;
            expect(result.length).to.equal(1);
            expect(result[0].date).to.equal(10);
        });

        it('should remove existing item', () => {
            const list = new UniqueSortedList([], new Map(), 'date');
            const itemToKeep = { _id: '1', date: 10 };
            const itemToRemove = { _id: '2', date: 20 };
            list.add(itemToKeep);
            list.add(itemToRemove);

            list.remove(itemToRemove);

            const result = list.list;
            expect(result.length).to.equal(1);
            expect(result[0]._id).to.equal('1');
        });

        it('should not throw when removing non-existent item', () => {
            const list = new UniqueSortedList([], new Map(), 'date');
            list.add({ _id: '1', date: 10 });

            // Different ID
            list.remove({ _id: '2', date: 10 });

            const result = list.list;
            expect(result.length).to.equal(1);
        });

        it('should remove item when only _id is provided', () => {
            const list = new UniqueSortedList([], new Map(), 'date');
            list.add({ _id: '1', date: 10 });
            list.add({ _id: '2', date: 20 });
            list.remove({ _id: '2' }); // No date property
            expect(list.list.length).to.equal(1);
            expect(list.list[0]._id).to.equal('1');
        });
    });

    describe('with function sortBy', () => {
        // Note: The function sortBy uses a standard ascending order in its implementation
        const sortByFn = (a, b) => a.date - b.date;

        it('should add items in sorted order', () => {
            const list = new UniqueSortedList([], new Map(), sortByFn);
            list.add({ _id: '3', date: 30 });
            list.add({ _id: '1', date: 10 });
            list.add({ _id: '2', date: 20 });

            const result = list.list;
            expect(result.length).to.equal(3);
            expect(result[0]._id).to.equal('1'); // Ascending order
            expect(result[1]._id).to.equal('2');
            expect(result[2]._id).to.equal('3');
        });

        it('should use fast path for appending at the end', () => {
            const list = new UniqueSortedList([], new Map(), sortByFn);
            list.add({ _id: '1', date: 10 });
            list.add({ _id: '2', date: 20 });
            list.add({ _id: '3', date: 30 }); // Should hit fast path

            const result = list.list;
            expect(result.length).to.equal(3);
            expect(result[2]._id).to.equal('3');
        });

        it('should correctly remove item using binary search', () => {
            const list = new UniqueSortedList([], new Map(), sortByFn);
            const itemToKeep1 = { _id: '1', date: 10 };
            const itemToRemove = { _id: '2', date: 20 };
            const itemToKeep2 = { _id: '3', date: 30 };
            list.add(itemToKeep1);
            list.add(itemToKeep2);
            list.add(itemToRemove);

            expect(list.list.length).to.equal(3);

            list.remove(itemToRemove);

            const result = list.list;
            expect(result.length).to.equal(2);
            expect(result[0]._id).to.equal('1');
            expect(result[1]._id).to.equal('3');
        });

        it('should correctly remove item with same sort key but different ID', () => {
            const list = new UniqueSortedList([], new Map(), sortByFn);
            const item1 = { _id: '1', date: 10 };
            const itemToRemove = { _id: '2', date: 10 }; // Same date, different ID
            list.add(item1);
            list.add(itemToRemove);

            expect(list.list.length).to.equal(2);

            list.remove(itemToRemove);

            const result = list.list;
            expect(result.length).to.equal(1);
            expect(result[0]._id).to.equal('1');
        });

        it('should not throw when removing non-existent item (same key)', () => {
            const list = new UniqueSortedList([], new Map(), sortByFn);
            list.add({ _id: '1', date: 10 });

            // Date exists, ID does not
            list.remove({ _id: '2', date: 10 });

            expect(list.list.length).to.equal(1);
        });
    });

});
