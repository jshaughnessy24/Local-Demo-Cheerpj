import { postToMain } from "../worker-code.js";
import { ElapsedTime } from "./ElapsedTime.js";

class TelemetryMessage { // simplified js version
    static get cCountMax() { return 100; }; 
    #data = [];
    
    addData(msg) {
        if (this.#data.length > TelemetryMessage.cCountMax) { // prune if too large
            this.#data.splice(0, this.#data.length - TelemetryMessage.cCountMax);
        }
        this.#data.push(msg);
    }

    hasData() {
        return this.#data.length > 0;
    }

    clearData() {
        this.#data.splice(0);
    }

    transmit() {
        postToMain("TELEMETRY", this.#data);
    }
}

class Value {
    // State
    #format = null;
    #formatArgs = null;
    #value = null;
    #valueProducer = null;
    #composed = null;

    // Construction
    constructor(formatOrFormatOrValueOrValueproducer, ...formatargsOrValueproducerOrNullOrNull) {
        let arg1 = formatOrFormatOrValueOrValueproducer;
        let arg2 = formatargsOrValueproducerOrNullOrNull;
        if (arg2.length > 0) {
            if (typeof arg2[0] != "function") { // Value(String format, Object... formatArgs)
                this.#format = arg1;
                this.#formatArgs = arg2;
            } else { // Value(String format, Func<T> valueProducer)
                this.#format = arg1;
                this.#valueProducer = arg2[0];
            }
        } else {
            if (typeof arg1 != "function") { // Value(Object value)
                this.#value = arg1;
            } else { // Value(Func<T> valueProducer)
                this.#valueProducer = arg1;
            }
        }
    }

    // Operations
    isProducer() { return this.#valueProducer != null; }
    getComposed(recompose) {
        if (recompose || this.#composed == null) {
            this.#composed = this.#compose();
        }
        return this.#composed;
    }
    #compose() {
        if (this.#format != null) {
            if (this.#formatArgs != null) return String.format(this.#format, this.#formatArgs);
            console.log(this.#valueProducer instanceof Array);
            if (this.#valueProducer != null) return String.format(this.#format, this.#valueProducer.call());
        } else {
            if (this.#value != null) return this.#value + "";
            if (this.#valueProducer != null) return this.#valueProducer.call() + "";
        }
        return "";
    }
}

class Lineable {
    constructor() {
        if (this.constructor == Lineable) {
            throw new Error("Interface 'Lineable' can't be instantiated.");
        }
    }
    
    getComposed() { throw new Error("Interface 'Lineable's getComposed() must be implemented"); };
}

class LineableContainer {
    #list = [];
    #onAddDataRef;
    #getItemSeparatorRef;
    #getCaptionValueSeparatorRef;

    constructor(telemetryThis, onAddDataRef, getItemSeparatorRef, getCaptionValueSeparatorRef) { // The original does not have these reference parameters
        this.#onAddDataRef = () => onAddDataRef.call(telemetryThis);
        this.#getItemSeparatorRef = () => getItemSeparatorRef.call(telemetryThis);
        this.#getCaptionValueSeparatorRef = () => getCaptionValueSeparatorRef.call(telemetryThis);
    }
    
    #boundedAddToList(index, data) {
        if (this.#list.length < TelemetryMessage.cCountMax) {
            this.#list.splice(index, 0, data);
        }
    }

    // this is an iterator, unfortunately just for the built-in js loops
    [Symbol.iterator]() {
        return this.#list[Symbol.iterator]();
    }

    // some methods to be more similar to arrays
    forEach(callbackfn) {
        this.#list.forEach(callbackfn);
    }
    map(callbackfn) {
        return this.#list.map(callbackfn);
    }

    addLineAfter(prev, lineCaptionOrCaption, nullOrValue) {
        this.#onAddDataRef.call();

        let result;
        if (nullOrValue == undefined) { // addLineAfter(Lineable prev, String lineCaption)
            result = new Line(lineCaptionOrCaption, this, this.#onAddDataRef, this.#getItemSeparatorRef, this.#getCaptionValueSeparatorRef);
        } else { // addItemAfter(Lineable prev, String caption, Value value)
            result = new Item(this, lineCaptionOrCaption, nullOrValue, this.#getCaptionValueSeparatorRef);
        }

        let index = prev == null ? this.#list.length : this.#list.indexOf(prev) + 1;
        this.#boundedAddToList(index, result);

        return result;
    }

    isEmpty() { return this.#list.length === 0; }
    size() { return this.#list.length; }
    remove(lineable) {
        let index = this.#list.indexOf(lineable);
        if (index >= 0) {
            this.#list.splice(index, 1);
            return true;
        }
        return false;
    }
    removeAllRecurse(predicate) {
        let result = false;
        this.#list = this.#list.filter(cur => {
            if (cur instanceof Line) {
                let line = cur;
                line.lineables.removeAllRecurse(predicate);

                if (line.lineables.isEmpty()) {
                    result = true;
                    return false;
                }
            } else if (cur instanceof Item) {
                let item = cur;
                if (predicate.call(this, item)) {
                    result = true;
                    return false;
                }
            }
            return true;
        });

        return result;
    }
}

class Item extends Lineable {
    // State
    parent;
    #caption  = null;
    #value    = null;
    #retained = null;
    #getCaptionValueSeparatorRef;

    constructor(parent, caption, value, getCaptionValueSeparatorRef) { // The original does not have this getCaptionValueSeparatorRef parameter
        super();
        this.parent = parent;
        this.#caption = caption;
        this.#value = value;
        this.#retained = null;
        this.#getCaptionValueSeparatorRef = getCaptionValueSeparatorRef;
    }

    // Operations
    getComposed(recompose) {
        return String.format("%s%s%s", this.#caption, this.#getCaptionValueSeparatorRef.call(), this.#value.getComposed(recompose));
    }
    getCaption() { return this.#caption; }
    setCaption(caption) { this.#caption = caption; return this; }
    isRetained() { return this.#retained != null ? this.#retained : this.isProducer(); }
    setRetained(retained) { this.#retained = retained; return this; }
    isProducer() { return this.#value.isProducer(); }
    #internalSetValue(value) { this.#value = value; }
    setValue(formatOrValueOrValueproducerOrFormat, ...argsOrValueproducer) {
        // setValue(String format, Object... args)
        // setValue(Object value)
        // setValue(Func<T> valueProducer)
        // setValue(String format, Func<T> valueProducer)
        this.#internalSetValue(...arguments);
        return this;
    }
    addData(caption, formatOrValueOrValueproducerOrFormat, ...argsOrNullOrNullOrValueproducer) {
        // addData(String caption, String format, Object... args)
        // addData(String caption, Object value)
        // addData(String caption, Func<T> valueProducer)
        // addData(String caption, String format, Func<T> valueProducer)
        let arg2 = formatOrValueOrValueproducerOrFormat;
        let arg3 = argsOrNullOrNullOrValueproducer;
        return this.parent.addItemAfter(this, caption, new Value(arg2, ...arg3));
    }
}

class Line extends Lineable {
    // State
    parent;
    #lineCaption;
    lineables;
    #getItemSeparatorRef;
    
    // Construction
    constructor(lineCaption, parent, onAddDataRef, getItemSeparatorRef, getCaptionValueSeparatorRef) {
        super();
        this.parent = parent;
        this.#lineCaption = lineCaption;
        this.lineables = new LineableContainer(this, onAddDataRef, getItemSeparatorRef, getCaptionValueSeparatorRef);

        this.#getItemSeparatorRef = getItemSeparatorRef;
    }

    // Operations
    getComposed(recompose) {
        return this.#lineCaption + this.lineables.map(lineable => 
            lineable.getComposed(recompose)).join(this.#getItemSeparatorRef.call());
    }
    addData(caption, formatOrValueOrValueproducerOrFormat, ...argsOrNullOrNullOrValueproducer) {
        // addData(String caption, String format, Object... args)
        // addData(String caption, Object value)
        // addData(String caption, Func<T> valueProducer)
        // addData(String caption, String format, Func<T> valueProducer)
        let arg2 = formatOrValueOrValueproducerOrFormat;
        let arg3 = argsOrNullOrNullOrValueproducer;
        return this.lineables.addLineAfter(null, caption, new Value(arg2, ...arg3));
    }
}

class Log {
    static DisplayOrder = (function () { // enum DisplayOrder
        function DisplayOrder() { }
        DisplayOrder.NEWEST_FIRST = new DisplayOrder();
        DisplayOrder.OLDEST_FIRST = new DisplayOrder();
        return DisplayOrder;
    }());

    // State
    #entries = [];
    #capacity;
    #displayOrder;
    #isDirty;

    // Construction
    constructor() {
        this.reset();
    }

    // Accessors
    markDirty() { this.#isDirty = true; }
    markClean() { this.#isDirty = false; }
    isDirty() { return this.#isDirty; }

    // Internal Operations
    size() { return this.#entries.length; }
    get(index) { return this.#entries[index]; }
    prune() { this.#entries.splice(0, this.#entries.length - this.#capacity); }
    reset() { 
        this.#entries = [];
        this.#capacity = 9;
        this.#isDirty = false;
        this.#displayOrder = Log.DisplayOrder.OLDEST_FIRST;
    }

    // Public Operations
    getCapacity() { return this.#capacity; }
    setCapacity(capacity) { 
        this.#capacity = capacity; 
        this.prune(); 
    }
    getDisplayOrder() { return this.#displayOrder; }
    setDisplayOrder(displayOrder) { this.#displayOrder = displayOrder; }
    add(entryOrFormat, ...nullOrArgs) {
        if (nullOrArgs.length == 0) { // add(String entry)
            this.add("%s", entryOrFormat);
        } else { // add(String format, Object... args)
            let datum = String.format(entryOrFormat, ...nullOrArgs);
            this.#entries.push(datum);
            this.markDirty();
            this.prune();
        }
    }
    clear() { this.#entries.splice(0); }
}

export class Telemetry {
    static DisplayFormat = (function () { // enum DisplayFormat, for compat, does not change console
        function DisplayFormat() { }
        DisplayFormat.CLASSIC = new DisplayFormat();
        DisplayFormat.MONOSPACE = new DisplayFormat();
        DisplayFormat.HTML = new DisplayFormat();
        return DisplayFormat;
    }());

    // State
    #lines;
    #composedLines;
    #actions;
    #log;
    #transmissionTimer;
    #_isDirty; // Added an underscore due to conflict with function #isDirty()
    #clearOnAdd;
    #opMode;
    #isAutoClear;
    #msTransmissionInterval;
    #captionValueSeparator;
    #itemSeparator;

    // Construction
    constructor(opMode) {
        this.#opMode = opMode;
        this.#log = new Log();
        this.resetTelemetryForOpMode();
    }

    resetTelemetryForOpMode() {
        this.#lines = new LineableContainer(this, this.#onAddData, this.getItemSeparator, this.getCaptionValueSeparator);
        this.#composedLines = [];
        this.#actions = [];
        this.#log.reset();
        this.#transmissionTimer = new ElapsedTime();
        this.#_isDirty = false;
        this.#clearOnAdd = false;
        this.#isAutoClear = true;
        this.#msTransmissionInterval = 250;
        this.#captionValueSeparator = " : ";
        this.#itemSeparator = " | ";
    }

    // Accessors
    #markDirty() { this.#_isDirty = true; }
    #markClean() { this.#_isDirty = false; }
    #isDirty() { return this.#_isDirty; }

    // Updating
    ////getKey(iLine) {} // legacy and unimplemented
    static #UpdateReason = (function () { // enum UpdateReason
        function UpdateReason() { }
        UpdateReason.USER = new UpdateReason();
        UpdateReason.LOG = new UpdateReason();
        UpdateReason.IFDIRTY = new UpdateReason();
        return UpdateReason;
    }());
    update() { return this.#tryUpdate(Telemetry.#UpdateReason.USER); }
    tryUpdateIfDirty() { return this.#tryUpdate(Telemetry.#UpdateReason.IFDIRTY); }
    #tryUpdate(updateReason) {
        let result = false;
        let interValElapsed = this.#transmissionTimer.milliseconds() > this.#msTransmissionInterval;

        let wantToTransmit = updateReason == Telemetry.#UpdateReason.USER
                                || updateReason == Telemetry.#UpdateReason.LOG
                                || (updateReason == Telemetry.#UpdateReason.IFDIRTY && (this.#isDirty() || this.#log.isDirty()));
        
        let recompose = updateReason == Telemetry.#UpdateReason.USER 
                                || this.#isDirty();

        if (interValElapsed && wantToTransmit) {
            this.#actions.forEach(action => action.apply(action));

            let transmitter = new TelemetryMessage();
            this.#saveToTransmitter(recompose, transmitter);

            if (transmitter.hasData()) {
                transmitter.transmit();
            }

            this.#log.markClean();
            this.#markClean();

            this.#transmissionTimer.reset();
            result = true;
        } else if (updateReason == Telemetry.#UpdateReason.USER) {
            this.#markDirty();
        }

        if (updateReason == Telemetry.#UpdateReason.USER) {
            this.#clearOnAdd = this.isAutoClear();
        }

        return result;
    }

    #saveToTransmitter(recompose, transmitter) {
        // transmitter.setSorted(false); // transmitter does not have setSorted and keys implemented, stored by time added

        if (recompose) {
            this.#composedLines = [];
            this.#lines.forEach(lineable => {
                this.#composedLines.push(lineable.getComposed(recompose));
            });
        }
        this.#composedLines.forEach(line => {
            transmitter.addData(line);
        })

        for (let i = 0; i < this.#log.size(); i++) {
            let s = this.#log.getDisplayOrder() == Log.DisplayOrder.OLDEST_FIRST 
                ? this.#log.get(i) 
                : this.#log.get(size-1 -i);
            transmitter.addData(s);
        }
    }

    // Accessors
    log() { return this.#log; }
    isAutoClear() { return this.#isAutoClear; }
    setAutoClear(autoClear) { this.#isAutoClear = autoClear; }
    getMsTransmissionInterval() { return this.#msTransmissionInterval; }
    setMsTransmissionInterval(msTransmissionInterval) { this.#msTransmissionInterval = msTransmissionInterval; }
    getItemSeparator() { return this.#itemSeparator; }
    setItemSeparator(itemSeparator) { this.#itemSeparator = itemSeparator; }
    getCaptionValueSeparator() { return this.#captionValueSeparator; }
    setCaptionValueSeparator(captionValueSeparator) { this.#captionValueSeparator = captionValueSeparator; }
    setDisplayFormat(displayFormat) { throw new Error("telemetry.setDisplayFormat() is not implemented"); }

    // Adding and removing data
    addAction(action) { 
        this.#actions.push(action); 
        return action; 
    }
    removeAction(token) { 
        let index = this.#actions.indexOf(token);
        if (index >= 0) {
            this.#actions.splice(index, 1);
            return true;
        }
        return false;
    }
    addData(caption, formatOrValueOrValueproducerOrFormat, ...argsOrNullOrNullOrValueproducer) {
        // addData(String caption, String format, Object... args)
        // addData(String caption, Object value)
        // addData(String caption, Func<T> valueProducer)
        // addData(String caption, String format, Func<T> valueProducer)
        let arg2 = formatOrValueOrValueproducerOrFormat;
        let arg3 = argsOrNullOrNullOrValueproducer;
        return this.#lines.addLineAfter(null, caption, new Value(arg2, ...arg3))
    }
    addLine(linecaptionOrNull) {
        if (linecaptionOrNull) { // addLine(String lineCaption)
            return this.#lines.addLineAfter(null, linecaptionOrNull);
        } else { // addLine()
            return this.#lines.addLineAfter(null, "");
        }
    }
    removeItem(item) {
        if (item instanceof Item) {
            return item.parent.remove(item);
        }
        return false;
    }
    removeLine(line) {
        if (line instanceof Line) {
            return line.parent.remove(line);
        }
        return false;
    }
    #onAddData() {
        if (this.#clearOnAdd) {
            this.clear();
            this.#clearOnAdd = false;
        }
        this.#markClean();
    }
    clear() {
        this.#clearOnAdd = false;
        this.#markClean();
        this.#lines.removeAllRecurse((item) => {
            return !item.isRetained();
        });
    }
    clearAll() {
        this.#clearOnAdd = false;
        this.#markClean();
        this.#actions.splice(0);
        this.#lines.removeAllRecurse((item) => {
            return true;
        });
    }

    // Text to Speech
    speak(text, nullOrLanguageCode, nullOrCountryCode) { // languageCode is BCP 47 and countryCode is unused in this implementation
        if (nullOrLanguageCode) { // speak(String text, String languageCode, String countryCode)
            postToMain("SPEECH-SYNTHESIS", { 
                text: text, 
                languageCode: nullOrLanguageCode, 
                countryCode: nullOrCountryCode 
            });
        } else { // speak(String text)
            postToMain("SPEECH-SYNTHESIS", { text });
        }
    }    
}