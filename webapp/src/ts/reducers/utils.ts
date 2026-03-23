import { sortedIndexBy as _sortedIndexBy } from 'lodash-es';

export class UniqueSortedList {
  list;
  listById;
  sortBy;
  identityProperty;

  constructor(list, listById: Map<any, any>, sortBy, identityProperty = '_id') {
    this.list = list;
    this.listById = listById;
    this.sortBy = sortBy;
    this.identityProperty = identityProperty;
  }

  add(item) {
    if (!item[this.identityProperty] || this.listById.has(item[this.identityProperty])) {
      return;
    }

    let idx;
    if (typeof (this.sortBy) === 'function') {
      // Fast path: check if item belongs at the end (most common for append scenarios)
      if (!this.list.length || this.sortBy(item, this.list[this.list.length - 1]) >= 0) {
        idx = this.list.length;
      } else {
        // Binary search for the correct insertion index
        let lo = 0;
        let hi = this.list.length;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (this.sortBy(item, this.list[mid]) < 0) {
            hi = mid;
          } else {
            lo = mid + 1;
          }
        }
        idx = lo;
      }
    } else {
      idx = _sortedIndexBy(this.list, item, item => -item[this.sortBy]);
    }
    this.list.splice(idx, 0, item);
    this.listById.set(item[this.identityProperty], item);
  }

  remove(item) {
    const fullItem = item && item[this.identityProperty] ? this.listById.get(item[this.identityProperty]) : null;
    if (!fullItem) {
      return;
    }
    item = fullItem; // Use the full item so we have the sortBy property

    let idx = -1;
    if (typeof (this.sortBy) === 'function') {
      // Binary search to find the insertion boundary, then scan back within equal-sort-key items
      let lo = 0;
      let hi = this.list.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (this.sortBy(item, this.list[mid]) < 0) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      // Scan backwards from insertion point to find identity match within equal-sort-key items
      for (let i = lo - 1; i >= 0 && this.sortBy(item, this.list[i]) === 0; i--) {
        if (this.list[i][this.identityProperty] === item[this.identityProperty]) {
          idx = i;
          break;
        }
      }
    } else {
      // For string sortBy, we use negated values to sort descending.
      // _sortedIndexBy returns the first index at which item could be inserted.
      idx = _sortedIndexBy(this.list, item, i => -i[this.sortBy]);
      // Scan forward through all items with the same sort key to find the one with the matching identity
      while (idx < this.list.length && this.list[idx][this.sortBy] === item[this.sortBy]) {
        if (this.list[idx][this.identityProperty] === item[this.identityProperty]) {
          break;
        }
        idx++;
      }
      // If we ran past the end or the current item doesn't match ID, we didn't find it.
      // Note: the check this.list[idx][this.sortBy] === item[this.sortBy] in the while loop
      // covers the case where we move to a different sort key block.
      if (idx >= this.list.length || this.list[idx][this.identityProperty] !== item[this.identityProperty]) {
        idx = -1;
      }
    }


    if (idx !== -1) {
      this.list.splice(idx, 1);
    }
    this.listById.delete(item[this.identityProperty]);
  }


}
