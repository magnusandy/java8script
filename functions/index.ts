import * as hash from 'js-hash-code';

/**
 * Functional Type: 
 * defines a function that takes a single argument and returns a boolean
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Functional Type: 
 * Defines a function takes two arguments of types T and U and returns a boolean, general usages
 * as a equality test (see BiPredicate.defaultEquality as an example)
 */
export type BiPredicate<T, U> = (t: T, u: U) => boolean;

/**
 * Functional Type: 
 * Defines a function that consumes a given passed in value, but does not return anything
 */
export type Consumer<T> = (value: T) => void;

/**
 * Functional Type: 
 * Defines a function that takes a single argument of type T, and returns a value of a different type U
 */
export type Function<T, U> = (value: T) => U;

/**
 * Functional Type: 
 * Alias of Function
 * Defines a function that takes a single argument of type T, and returns a value of a different type U
 */
export type Transformer<T, U> = Function<T, U>;

/**
 * Functional Type: 
 * Defines a function that takes no arguments but when called, returns a value of type T
 * See CheckedSupplier for an extension of this type
 */
export type Supplier<T> = () => T;

/**
 * Functional Type: 
 * Defines a function that takes two arguments of types T and U, that consumes the given values 
 * and returns nothing.
 */
export type BiConsumer<T, U> = (t: T, u: U) => void;

/**
 * Functional Type: 
 * Defines a function that takes two arguments, both of type T, and returns a value
 * also of type T.
 */
export type BiFunction<T> = (t1: T, t2: T) => T;

/**
 * Functional Type: 
 * Alias of BiFunction,
 * Defines a function that takes two arguments, both of type T, and returns a value
 * also of type T.
 */
export type BiTransformer<T> = BiFunction<T>;

/**
 * Function that: Compares its two arguments for order. Returns a negative integer, zero,
 * or a positive integer as the first argument is less than, equal to, or greater than the second.
 */
export type Comparator<T> = (t1: T, t2: T) => number;

/**
 * defines a supplier function interface, with the added ability of checking if the supplier 
 * still contains values or not.
 */

export const Consumer = {

    /**
     * returns a consumer that takes in an element and does nothing
     */
    sink<T>(): Consumer<T> {
        return i => { };
    },

    /**
     * returns a consumer logs the value given to the console
     */
    logger<T>(): Consumer<T> {
        return i => console.log(i);
    }
}

export const Function = {

    /**
     * returns Function that when passed an argument, will return the given argument
     */
    identity<T>(): Function<T, T> {
        return i => i;
    },

    /**
     * returns a Function logs the given value to the console and then returns the value
     */
    logger<T>(): Function<T, T> {
        return (i: T) => {
            console.log(i);
            return i;
        }
    }
}

export const Transformer = Function;

export const BiPredicate = {

    /**
     * returns a BiPredicate that takes two values of the same type, and returns true if 
     * i1 === i2
     */
    defaultEquality<T>(): BiPredicate<T, T> {
        return (i1: T, i2: T): boolean => i1 === i2
    },

    /**
     * utilizes a object hashing function to compare equality, more accurate object equality
     * as compared to === when a more value based equality is desired. That is objects with the 
     * same fields and values will have the same hash, and thus be equal.
     * 
     * Note: this method of equality will be slower, especially for large objects
     */
    hashEquality<T>(): BiPredicate<T, T> {
        return (i1:T, i2:T) => hash(i1) === hash(i2);
    },
}

export const Comparator = {

    /**
     * Returns a Comparator that compares the given values with the < and > operators, returns
     * -1 if i1 less that i2, +1 if i1 is greater, and 0 if they are equal.
     */
    default<T>(): Comparator<T> {
        return (i1: T, i2: T): number => {
            if (i1 < i2) {
                return -1;
            } else if (i1 > i2) {
                return 1;
            } else {
                return 0;
            }
        }
    },
}