export interface Tween {
    update(dt: number): void;
    complete(): Promise<void>;
    isComplete(): boolean;
}

export interface TweenSystem {
    tweenTo<T extends object, K extends keyof T = keyof T>(
        target: T,
        to: Pick<T, K>,
        duration: number,
        options?: {
            easing?: (t: number) => number,
            onUpdate?: (dt:number, value: T, prev: Pick<T, K>) => void,
        },
    ): Tween;
    update(dt: number): void;
}