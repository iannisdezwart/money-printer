export const binarySearch = <T>(array: T[], bound: (v: T) => boolean) => {
  let low = 0;
  let high = array.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const midValue = array[mid];
    if (bound(midValue)) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return low;
};
