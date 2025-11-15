export type Observer<T> = (value: T) => void;
export type Observable<T> = {
    get(): T,
    set(value: T): void,
    subscribe(callback: Observer<T>): () => void;
}

export function observable<T>(initialValue: T): Observable<T> {
    let value = initialValue;
    const observers: Observer<T>[] = [];

    return {
        get(): T {
            return value;
        },

        set(v: T): void {
            value = v;
            observers.forEach(sub => sub(value));
        },

        subscribe(callback: Observer<T>): () => void {
            observers.push(callback);
            callback(value);

            return () => {
                const index = observers.indexOf(callback);
                if (index > -1) {
                    observers.splice(index, 1);
                }
            };
        }
    };
}

export class Subscriber {
    private unsubscribeCallbacks: (() => void)[] = [];

    subscribe<T>(observable: Observable<T>, callback: (value: T) => void) {
        const unsubscribe = observable.subscribe(callback);
        this.unsubscribeCallbacks.push(unsubscribe);
    }

    unsubscribe() {
        this.unsubscribeCallbacks.forEach(cb => cb());
    }
}
