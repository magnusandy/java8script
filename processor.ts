import { Transformer, Predicate, BiPredicate } from "./functions";
import { Optional } from "./optional";

/**
 * A Processor describes a operation to be applied to a given input to transform it
 * into a given output, the number of outputs can be 0-many for any given input.
 * 
 * The processor class is intended to be a lazy processing node, computations
 * should only be undertaken when an output is actually called for (i.e. when getNext is called)
 * for stateless operations, this means that every input should only be processed when its consumed
 * for stateful operations, all inputs will be processed on the first call to getNext()
 * 
 * stateful operations should be given ALL the inputs for a desired computation, where as 
 * stateless operations should support being given individual inputs at a time. and being
 * processed one a a time;
 * 
 */
export interface Processor<Input, Output> {
    /**
     * returns true is there is still elements waiting to be processed and/or
     * fetched from the given processor. if false is returned, the processor is
     * currently exhausted.
     */
    hasNext(): boolean;
    
    /**
     * returns a processed value if this function returns
     * Optional.empty() this is NOT an indication that the processor
     * is exhausted, hasNext will accurately return if there is more
     * values;
     */
    processAndGetNext(): Optional<Output>;

    /**
     * Adds an item to the processing queue, this function should NOT
     * process the value when its added.
     * @param input item to add to the processing queue
     */
    add(input: Input): void;

    /**
     * returns true if the given processor is a stateless operation
     */
    isStateless(): boolean;
}

export const Processor = {
    mapProcessor: <I, O>(transformer: Transformer<I, O>): Processor<I, O> => new MapProcessor<I, O>(transformer),
    filterProcessor: <I>(predicate: Predicate<I>): Processor<I, I> => new FilterProcessor<I>(predicate),
    listFlatMapProcessor: <I, O>(transformer: Transformer<I, O[]>): Processor<I, O> => new ListFlatMapProcessor(transformer),
    distinctProcessor: <I>(comparator: BiPredicate<I, I>): Processor<I, I> => new DistinctProcessor<I>(comparator),
}

/**
 * Abstract processor that implements the storage and retrieval of items from 
 * the processing queue.
 */
abstract class AbstractProcessor<Input, Output> implements Processor<Input, Output> {
    protected inputs: Input[];

    constructor() {
        this.inputs = [];
    }

    public add(input: Input): void {
        this.inputs.push(input);
    }

    protected takeNextInput(): Optional<Input> {
        return Optional.ofNullable(this.inputs.shift());
    }

    public hasNext(): boolean {
        return this.inputs ? this.inputs.length > 0 : false;
    }

    abstract processAndGetNext(): Optional<Output>;
    abstract isStateless(): boolean;
}

/**
 * This is a stateful processor, that will return distinct elements provided all 
 * the inputs are given at the start, and no elements are injected mid processing
 */
class DistinctProcessor<Input> extends AbstractProcessor<Input, Input> {

    private comparator: BiPredicate<Input, Input>;
    private distinctList: Optional<Input[]>;

    constructor(comparator: BiPredicate<Input, Input>) {
        super();
        this.comparator = comparator;
        this.distinctList = Optional.empty();
    }

    public isStateless(): boolean {
        return false;
    }

    public hasNext(): boolean {
        const distinctListExistsAndHasValues = this.distinctList.isPresent() ? this.distinctList.get().length > 0 : false;
        return this.inputs.length > 0 || distinctListExistsAndHasValues;
    }

    public processAndGetNext(): Optional<Input> {
        if (!this.distinctList.isPresent()) {
            this.processValues();
            return this.processAndGetNext();
        } else {
            return Optional.ofNullable(this.distinctList.get().shift());
        }
    }

    private processValues(): void {
        let distinctList: Input[] = [];
        this.inputs.forEach(item => {
            //compare the current Item with the given value
            const doesMatchItem = (distinct: Input): boolean => this.comparator(item, distinct);
            const matchingItems = distinctList.filter(doesMatchItem);
            if (matchingItems.length === 0) {
                distinctList.push(item)
            }
        });
        this.inputs = [];
        this.distinctList = Optional.of(distinctList);
    }

}

/**
 * Implemention of a Processor for value mapping, lazily transforms values
 * when returned from the processor. 
 */
class MapProcessor<Input, Output> extends AbstractProcessor<Input, Output> {

    private transformer: Transformer<Input, Output>;

    public constructor(transformer: Transformer<Input, Output>) {
        super();
        this.transformer = transformer;
    }

    //pull values off the start
    public processAndGetNext(): Optional<Output> {
        return this.takeNextInput().map(this.transformer);
    }

    public isStateless(): boolean {
        return true;
    }
}

/**
 * Stateless process, filters input items against a given predicated, only
 * returning those who match against the given predicate.
 */
class FilterProcessor<Input> extends AbstractProcessor<Input, Input> {
    private predicate: Predicate<Input>;

    public constructor(predicate: Predicate<Input>) {
        super();
        this.predicate = predicate;
    }

    public processAndGetNext(): Optional<Input> {
        return this.takeNextInput().filter(this.predicate);
    }

    public isStateless(): boolean {
        return true;
    }
}

/**
 * returns a one to many mapping of elements, transforms input elements into
 * a list of output elements, returning the values off the output lists, one list
 * at a time, lazily transforming inputs only when the previous list is exhausted.
 */
class ListFlatMapProcessor<Input, Output> extends AbstractProcessor<Input, Output> {
    private outputList: Output[];
    private transformer: Transformer<Input, Output[]>;

    constructor(transformer: Transformer<Input, Output[]>) {
        super();
        this.transformer = transformer;
        this.outputList = [];
    }

    public hasNext(): boolean {
        return (this.outputList.length > 0 || this.inputs.length > 0);
    }

    //todo test recursive
    public processAndGetNext(): Optional<Output> {
        if (this.outputList.length > 0) {
            return Optional.ofNullable(this.outputList.shift());
        } else if (this.inputs.length > 0) {
            const nextSource: Optional<Input> = this.takeNextInput();
            if (nextSource.isPresent()) {
                this.outputList = this.transformer(nextSource.get());
                return this.processAndGetNext();
            }
        }
        return Optional.empty();
    }

    public isStateless(): boolean {
        return true;
    }
}