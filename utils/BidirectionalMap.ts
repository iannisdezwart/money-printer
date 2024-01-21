export class BidirectionalMap<K, V> {
  private forwardMap: Map<K, V>;
  private reverseMap: Map<V, K>;

  constructor(entries: [K, V][] = []) {
    this.forwardMap = new Map(entries);
    this.reverseMap = new Map(entries.map(([k, v]) => [v, k]));
  }

  hasKey(key: K) {
    return this.forwardMap.has(key);
  }

  hasValue(value: V) {
    return this.reverseMap.has(value);
  }

  getValue(key: K): V | undefined {
    return this.forwardMap.get(key);
  }

  getKey(value: V): K | undefined {
    return this.reverseMap.get(value);
  }

  set(key: K, value: V) {
    this.forwardMap.set(key, value);
    this.reverseMap.set(value, key);
  }

  deleteKey(key: K) {
    const value = this.forwardMap.get(key);

    if (value === undefined) {
      return;
    }

    this.forwardMap.delete(key);
    this.reverseMap.delete(value);
  }

  deleteValue(value: V) {
    const key = this.reverseMap.get(value);

    if (key === undefined) {
      return;
    }

    this.forwardMap.delete(key);
    this.reverseMap.delete(value);
  }

  get size() {
    return this.forwardMap.size;
  }

  get keys() {
    return this.forwardMap.keys();
  }

  get values() {
    return this.forwardMap.values();
  }

  get entries() {
    return this.forwardMap.entries();
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void) {
    this.forwardMap.forEach(callbackfn);
  }

  [Symbol.iterator]() {
    return this.forwardMap[Symbol.iterator]();
  }
}
