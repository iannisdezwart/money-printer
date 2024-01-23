export class EventEmitter<T> {
  private listeners = new Set<(event: T) => void>();

  addEventListener(onEvent: (event: T) => void): void {
    this.listeners.add(onEvent);
  }

  removeEventListener(onEvent: (event: T) => void): void {
    this.listeners.delete(onEvent);
  }

  emit(event: T): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
