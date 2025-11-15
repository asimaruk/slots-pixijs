import { Strings } from './Strings';
import en from './en.json';

export class DefaultStrings implements Strings {
    get(key: string): string {
        return this.isTranslationKey(key, en) ? en[key] : key;
    }

    private isTranslationKey<T extends object>(key: string, strings: T): key is Extract<keyof T, string> {
        return key in strings;
    }
}