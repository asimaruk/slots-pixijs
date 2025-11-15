import { Tween, TweenSystem } from './tween';

function extractKeys<
    T extends object, 
    K extends keyof T = keyof T
>(
    source: T, 
    keys: K[],
): Pick<T, K> {
    return keys.reduce((res, key) => {
        res[key] = source[key];
        return res;
    }, {} as Pick<T, K>);
};

export class SimpleTween<
    T extends object, 
    K extends keyof T = keyof T,
> implements Tween {

    private time = 0;
    private from: Pick<T, K> | null = null;
    private resolveComplete: () => void = null!;
    private completePromise: Promise<void> = new Promise((res, _) => {
        this.resolveComplete = res;
    })

    constructor(
        private readonly target: T,
        private readonly to: Pick<T, K>,
        private readonly duration: number,
        private readonly easing: (t: number) => number,
        private readonly onUpdate?: (dt:number, value: T, prev: Pick<T, K>) => void,
    ) {}

    update(dt: number): void {
        if (this.time >= this.duration) {
            return;
        }

        this.from ??= extractKeys(this.target, Object.keys(this.to) as K[]);
        this.time += dt;
        const normalTime = Math.min(this.time / this.duration, 1);
        const t = this.easing(normalTime);
        const lerped = lerp(this.from, this.to, t);
        const prev = extractKeys(this.target, Object.keys(this.to) as K[]);
        Object.assign(this.target, lerped);
        this.onUpdate?.(dt, this.target, prev);

        if (this.isComplete()) {
            this.resolveComplete();
        }
    }

    complete(): Promise<void> {
        return this.completePromise;
    }

    isComplete(): boolean {
        return this.time >= this.duration;
    }
}

export class SimpleTweenSystem implements TweenSystem {

    private tweens: Tween[] = [];
    
    tweenTo<T extends object, K extends keyof T = keyof T>(
        target: T,
        to: Pick<T, K>,
        duration: number,
        options?: {
            easing?: (t: number) => number,
            onUpdate?: (dt:number, value: T, prev: Pick<T, K>) => void,
        },
    ): Tween {
        const tween = new SimpleTween(
            target,
            to,
            duration,
            options?.easing ?? SimpleTweenSystem.Easing.linear,
            options?.onUpdate,
        );
        this.tweens.push(tween);
        return tween;
    }

    update(dt: number): void {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            this.tweens[i].update(dt);
            if (this.tweens[i].isComplete()) {
                this.tweens.splice(i, 1);
            }
        }
    }
}

function lerp(a1: number, a2: number, t: number): number;
function lerp<T>(a1: T, a2: T, t: number): T;
function lerp(a1: unknown, a2: unknown, t: number): unknown {
    if (typeof a1 === 'number' && typeof a2 === 'number') {
        return a1 + (a2 - a1) * t;
    }

    if (Array.isArray(a1) && Array.isArray(a2)) {
        const result = [];
        for (let i = 0; i < a1.length; i++) {
            result.push(lerp(a1[i], a2[i], t));
        }
        return result;
    }

    if (typeof a1 === 'object' && typeof a2 === 'object' && a2 !== null) {
        const result: { [key: string]: unknown } = {};
        for (const key in a1) {
            if (key in a2) {
                result[key] = lerp((a1 as { [key: string]: unknown })[key], (a2 as { [key: string]: unknown })[key], t);
            }
        }
        return result;
    }
    
    return t > 0.5 ? a2 : a1;
}

export namespace SimpleTweenSystem {
    // https://easings.net
    export namespace Easing {
        export function linear(t: number): number {
            return t;
        }
        export function backout(amount: number): (t: number) => number {
            return (t: number) => 1 + (amount + 1) * Math.pow(t - 1, 3) + amount * Math.pow(t - 1, 2);
        }
        export function easeOutElastic(x: number): number {
            const c4 = (2 * Math.PI) / 3;

            return x === 0
                 ? 0
                 : x === 1
                 ? 1
                 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
        }
        export function easeInOutSine(x: number): number {
            return -(Math.cos(Math.PI * x) - 1) / 2;
        }
    }
}
