
/**************** Utility / Internals ****************/
const VRSJavaInternals = {
    MultiClass: function (...extendedClasses) {
        return class MultiClass {
            #baseClassMap = {};
            constructor(argMap) {
                // Loop through every base class
                extendedClasses.forEach(baseClass => {
                    // Apply args to each base class based on argMap
                    const baseClassArgs = argMap && argMap[baseClass.name];
                    this.#baseClassMap[baseClass.name] = new baseClass(...baseClassArgs || []);

                    // Gather every property until the Object constructor
                    const properties = new Set();
                    let obj = this.#baseClassMap[baseClass.name];
                    while (obj.constructor !== Object) {
                        // console.log(obj);
                        Object.getOwnPropertyNames(obj).forEach(propName => {
                            const propDescriptor = Object.getOwnPropertyDescriptor(obj, propName);
                            if (propDescriptor && (propDescriptor.configurable || typeof propDescriptor.configurable === "undefined") &&
                                (propDescriptor.writable || typeof propDescriptor.writable === "undefined")) {
                                properties.add(propName);
                                // console.log(propName, propDescriptor);
                            }
                        });
                        obj = Object.getPrototypeOf(obj);
                    }

                    // Loop through every property
                    properties.forEach(propName => {
                        // Hoist functions
                        if (typeof this.#baseClassMap[baseClass.name][propName] === "function" && propName !== "constructor") {
                            // console.log("Setup function " + propName);
                            this[propName] = (...args) => this.#baseClassMap[baseClass.name][propName](...args);
                        }
                        // Hoist variables
                        else if (propName !== "constructor" && propName !== "length" && propName !== "prototype") {
                            // console.log("Setup prop " + propName);
                            Object.defineProperty(this, propName, {
                                get: () => this.#baseClassMap[baseClass.name][propName],
                                set: (value) => this.#baseClassMap[baseClass.name][propName] = value
                            });
                        } else {
                            // console.log("Skip prop " + propName);
                        }
                    });
                });
            }
        }
    },
    castObject: function (obj, type) {
        const objTypeName = Object.getPrototypeOf(obj).constructor.name;
        const targetTypeName = type.name;

        if (objTypeName === targetTypeName) return obj;

        const castGroups = [
            [
                DcMotorSimple,
                DcMotor,
                DcMotorEx
            ],
            [
                ColorSensor,
                NormalizedColorSensor,
                LightSensor,
                OpticalDistanceSensor,
                ColorRangeSensor,
                RevColorSensorV3,
                LynxI2cColorRangeSensor,
                DistanceSensor
            ],
            [
                DistanceSensor,
                Rev2mDistanceSensor,
                ModernRoboticsI2cRangeSensor
            ]
        ];

        if (objTypeName === targetTypeName) {
            return obj;
        }

        const group = castGroups.find(castGroup =>
            castGroup.some(groupItem => groupItem.name === objTypeName)
            && castGroup.some(groupItem => groupItem.name === targetTypeName));

        if (group) {
            let targetClass = group.find(groupItem => groupItem.name === targetTypeName);
            if (!obj.__getInternalIndex) {
                throw new Error("Cannot cast object of type '" + objTypeName + "' to type '" + targetTypeName + "'. Missing __getInternalIndex() property.");
            }
            if (group === castGroups[1] && objTypeName === "DistanceSensor") { // Cannot cast DistanceSensor into ColorSensor family, the other way around is fine
                throw new Error("Cannot cast object of type '" + objTypeName + "' to type '" + targetTypeName + "'");
            }
            return new targetClass(obj.__getInternalIndex());
        } else {
            throw new Error("Cannot cast object of type '" + objTypeName + "' to type '" + targetTypeName + "'");
        }

    }
}

/**************** Misc. Implementation ****************/

class ElapsedTime { // copied from js-implementations
    // enum Resolution
    static Resolution = (function () {
        function Resolution() {
            this.toString = function () {
                switch (this) {
                    default:
                    case ElapsedTime.Resolution.SECONDS: return "SECONDS";
                    case ElapsedTime.Resolution.MILLISECONDS: return "MILLISECONDS";
                }
            }
         }
        Resolution.SECONDS = new Resolution();
        Resolution.MILLISECONDS = new Resolution();
        return Resolution;
    }());
    /* Note that we use ms resolution in JS, and things have been renamed to reflect so */
    static get MILLIS_IN_SECOND() { return 1000; }
    static get MILLIS_IN_MILLI() { return 1; }

    #msStartTime;
    #resolution;

    constructor(resolutionOrStarttimeOrNull) {
        let arg1 = resolutionOrStarttimeOrNull;
        if (arg1) {
            if (arg1 instanceof ElapsedTime.Resolution) { // ElapsedTime(Resolution resolution)
                this.reset();
                switch (arg1) {
                    case ElapsedTime.Resolution.SECONDS:
                    default:
                        this.#resolution = ElapsedTime.MILLIS_IN_SECOND;
                        break;
                    case ElapsedTime.Resolution.MILLISECONDS:
                        this.#resolution = ElapsedTime.MILLIS_IN_MILLI;
                        break;
                }
            } else if (typeof arg1 == "number") { // ElapsedTime(long startTime)
                this.#msStartTime = arg1;
                this.#resolution = ElapsedTime.MILLIS_IN_SECOND;
            } else {
                throw new Error("ElapsedTime constructor did not match any overloads")
            }
        } else { // ElapsedTime()
            this.reset();
            this.#resolution = ElapsedTime.MILLIS_IN_SECOND;
        }
    }

    #msNow() {
        return performance.now();
    }
    now(unit) {
        return unit.convert(this.#msNow(), TimeUnit.MILLISECONDS);
    }
    reset() {
        this.#msStartTime = this.#msNow();
    }
    startTime() {
        return this.#msStartTime / this.#resolution;
    }
    startTimeNanoseconds() { // Kept for compatibility
        return TimeUnit.NANOSECONDS.convert(this.#msStartTime, TimeUnit.MILLISECONDS);
    }
    startTimeMilliseconds() { // Added due to working in ms
        return this.#msStartTime;
    }
    time(unit) {
        if (arguments.length == 0)
            return (this.#msNow() - this.#msStartTime) / this.#resolution;
        return unit.convert(this.milliseconds(), TimeUnit.MILLISECONDS);
    }
    seconds() {
        return this.milliseconds() / ElapsedTime.MILLIS_IN_SECOND;
    }
    milliseconds() {
        return (this.#msNow() - this.#msStartTime);
    }
    nanoseconds() {
        return this.milliseconds() * 1e6;
    }
    getResolution() {
        if (this.#resolution == ElapsedTime.MILLIS_IN_MILLI)
            return ElapsedTime.Resolution.MILLISECONDS;
        else
            return ElapsedTime.Resolution.SECONDS;
    }

    #resolutionStr() {
        if (this.#resolution == ElapsedTime.MILLIS_IN_SECOND)
            return "seconds";
        else if (this.#resolution == ElapsedTime.MILLIS_IN_MILLI)
            return "milliseconds";
        else
            return "unknown units";
    }
    log(label) {
        RobotLog.v("TIMER: %20s - %1.3f %s", label, this.time(), this.#resolutionStr());
    }
    toString() {
        return String.format("%1.4f %s", this.time(), this.#resolutionStr());
    }
}

class JavaUtil { // Note that this is the class that provides the utility methods from blocks in normal onbotjava
    // enum AtMode
    static AtMode = (function () {
        function AtMode() {
            this.toString = function () {
                switch (this) {
                    default:
                    case JavaUtil.AtMode.FIRST: return "FIRST";
                    case JavaUtil.AtMode.LAST: return "LAST";
                    case JavaUtil.AtMode.FROM_START: return "FROM_START";
                    case JavaUtil.AtMode.FROM_END: return "FROM_END";
                    case JavaUtil.AtMode.RANDOM: return "RANDOM";
                }
            }
        }
        AtMode.FIRST = new AtMode();
        AtMode.LAST = new AtMode();
        AtMode.FROM_START = new AtMode();
        AtMode.FROM_END = new AtMode();
        AtMode.RANDOM = new AtMode();
        return AtMode;
    }());

    static #getIndex(str, atMode, i) {
        switch (atMode) {
            case JavaUtil.AtMode.FIRST:
                return 0;
            case JavaUtil.AtMode.LAST:
                return str.length - 1;
            case JavaUtil.AtMode.FROM_START:
                return i;
            case JavaUtil.AtMode.FROM_END:
                return str.length - 1 - i;
            case JavaUtil.AtMode.RANDOM:
                return Math.floor(Math.random() * str.length);
            default:
                throw new Error("JavaUtil.#getIndex() parameter 'atMode' must be one of the following: 'JavaUtil.AtMode.FIRST', 'JavaUtil.AtMode.LAST', 'JavaUtil.AtMode.FROM_START', 'JavaUtil.AtMode.FROM_END', or 'JavaUtil.AtMode.RANDOM'");
        }
    }

    static inTextGetLetter(str, atMode, i) {
        if (typeof str !== "string") throw new Error("JavaUtil.inTextGetLetter() parameter 'str' must be a string");
        if (typeof atMode !== "AtMode") throw new Error("JavaUtil.inTextGetLetter() parameter 'atMode' must be one of the following: 'JavaUtil.AtMode.FIRST', 'JavaUtil.AtMode.LAST', 'JavaUtil.AtMode.FROM_START', 'JavaUtil.AtMode.FROM_END', or 'JavaUtil.AtMode.RANDOM'");
        if (typeof i !== "number") throw new Error("JavaUtil.inTextGetLetter() parameter 'i' must be a number");
        return str.charAt(JavaUtil.#getIndex(str, atMode, i));
    }

    static inTextGetSubstring(str, atMode1, i1, atMode2, i2) {
        if (typeof str !== "string") throw new Error("JavaUtil.inTextGetSubstring() parameter 'str' must be a string");
        if (typeof atMode1 !== "AtMode") throw new Error("JavaUtil.inTextGetSubstring() parameter 'atMode1' must be  one of the following: 'JavaUtil.AtMode.FIRST', 'JavaUtil.AtMode.LAST', 'JavaUtil.AtMode.FROM_START', 'JavaUtil.AtMode.FROM_END', or 'JavaUtil.AtMode.RANDOM'");
        if (typeof i1 !== "AtMode") throw new Error("JavaUtil.inTextGetSubstring() parameter 'i1' must be a number");
        if (typeof atMode2 !== "AtMode") throw new Error("JavaUtil.inTextGetSubstring() parameter 'atMode2' must be  one of the following: 'JavaUtil.AtMode.FIRST', 'JavaUtil.AtMode.LAST', 'JavaUtil.AtMode.FROM_START', 'JavaUtil.AtMode.FROM_END', or 'JavaUtil.AtMode.RANDOM'");
        if (typeof i2 !== "AtMode") throw new Error("JavaUtil.inTextGetSubstring() parameter 'i2' must be a number");
        return str.substring(JavaUtil.#getIndex(str, atMode1, i1), JavaUtil.#getIndex(str, atMode2, i2) + 1);
    }

    static toTitleCase(str) {
        if (typeof str !== "string") throw new Error("JavaUtil.toTitleCase() parameter 'str' must be a string");
        let words = str.split(/((?<=\s)|(?=\s+))/);
        for (var i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        }
        return words.join("");
    }

    static TrimMode = (function () {
        function TrimMode() {
            this.toString = function () {
                switch (this) {
                    default:
                    case JavaUtil.TrimMode.LEFT: return "LEFT";
                    case JavaUtil.TrimMode.RIGHT: return "RIGHT";
                    case JavaUtil.TrimMode.BOTH: return "BOTH";
                }
            }
        }
        TrimMode.LEFT = new TrimMode();
        TrimMode.RIGHT = new TrimMode();
        TrimMode.BOTH = new TrimMode();
        return TrimMode;
    }());

    static textTrim(str, trimMode) {
        if (typeof str !== "string") throw new Error("JavaUtil.textTrim() parameter 'str' must be a string");
        if (typeof trimMode !== "TrimMode") throw new Error("JavaUtil.textTrim() parameter 'trimMode' must be one of the following: 'JavaUtil.TrimMode.LEFT', 'JavaUtil.TrimMode.RIGHT', or 'JavaUtil.TrimMode.BOTH'");
        switch (trimMode) {
            case JavaUtil.TrimMode.LEFT:
                return str.trimStart();
            case JavaUtil.TrimMode.RIGHT:
                return str.trimEnd();
            case JavaUtil.TrimMode.BOTH:
                return str.trim();
            default:
                throw new Error("JavaUtil.textTrim() parameter 'trimMode' must be one of the following: 'JavaUtil.TrimMode.LEFT', 'JavaUtil.TrimMode.RIGHT', or 'JavaUtil.TrimMode.BOTH'");
        }
    }

    static formatNumber(number, precisionOrWidth, nullOrPrecision) {
        if (typeof number !== "number") throw new Error("JavaUtil.formatNumber() parameter 'number' must be a number");
        if (arguments.length === 2) { // String formatNumber(double number, int precision)
            let precision = precisionOrWidth;
            if (typeof precision !== "number") throw new Error("JavaUtil.formatNumber() parameter 'precision' must be a number");
            precision = Math.max(0, precision);
            number += Math.pow(10, -precision - 1); // Fixes rounding issues so 1.0005 rounds up to 1.001 not 1.000
            let width = (precision == 0) ? 1 : precision;
            let format = "%" + width + "." + precision + "f";
            return String.format(format, number);
        } else if (arguments.length === 3) { // String formatNumber(double number, int width, int precision)
            let width = precisionOrWidth;
            let precision = nullOrPrecision;
            if (typeof width !== "number") throw new Error("JavaUtil.formatNumber() parameter 'width' must be a number");
            if (typeof precision !== "number") throw new Error("JavaUtil.formatNumber() parameter 'precision' must be a number");
            precision = Math.max(0, precision);
            number += Math.pow(10, -precision - 1); // Fixes rounding issues so 1.0005 rounds up to 1.001 not 1.000
            width = Math.max(1, width);
            let format = "%" + width + "." + precision + "f";
            return String.format(format, number);
        } else { // Unknown overload
            throw new Error("JavaUtil.formatNumber() encountered unknown overload call. Must be JavaUtil.formatNumber(number, precision) or JavaUtil.formatNumber(number, width, precision)");
        }
    }

    static isPrime(d) {
        if (typeof d !== "number") throw new Error("JavaUtil.isPrime() parameter 'd' must be a number");

        if (isNaN(d) || !isFinite(d) || d % 1 || d < 2) return false;
        if (d === JavaUtil.#primeHelperLeastFactor(d)) return true;
        return false;
    }

    static #primeHelperLeastFactor(d) { // helper for fast isPrime(), see https://flexiple.com/javascript/isprime-javascript/
        if (isNaN(d) || !isFinite(d)) return NaN;
        if (d == 0) return 0;
        if (d % 1 || d * d < 2) return 1;
        if (d % 2 == 0) return 2;
        if (d % 3 == 0) return 3;
        if (d % 5 == 0) return 5;
        var m = Math.sqrt(d);
        for (var i = 7; i <= m; i += 30) {
            if (d % i == 0) return i;
            if (d % (i + 4) == 0) return i + 4;
            if (d % (i + 6) == 0) return i + 6;
            if (d % (i + 10) == 0) return i + 10;
            if (d % (i + 12) == 0) return i + 12;
            if (d % (i + 16) == 0) return i + 16;
            if (d % (i + 22) == 0) return i + 22;
            if (d % (i + 24) == 0) return i + 24;
        }
        return d;
    }
    
    static sumOfList(list) {
        if (list === null || list === undefined) return 0;
        if (!Array.isArray(list)) throw new Error("JavaUtil.sumOfList() parameter 'list' must be an array");
        let sum = 0;
        list.forEach(item => sum += (typeof item === "number" ? item : 0));
        return sum;
    }

    static minOfList(list) {
        if (list === null || list === undefined) return Number.MAX_VALUE;
        if (!Array.isArray(list)) throw new Error("JavaUtil.minOfList() parameter 'list' must be an array");
        let min = Number.MAX_VALUE;
        list.forEach(item => min = Math.min(min, (typeof item === "number" ? item : min)));
        return min;
    }

    static maxOfList(list) {
        if (list === null || list === undefined) return Number.MIN_VALUE;
        if (!Array.isArray(list)) throw new Error("JavaUtil.maxOfList() parameter 'list' must be an array");
        let max = Number.MIN_VALUE;
        list.forEach(item => max = Math.max(max, (typeof item === "number" ? item : max)));
        return max;
    }

    static averageOfList(list) {
        if (list === null || list === undefined) return 0;
        if (!Array.isArray(list)) throw new Error("JavaUtil.averageOfList() parameter 'list' must be an array");
        return JavaUtil.sumOfList(list) / list.length;
    }

    static medianOfList(list) {
        if (list === null || list === undefined) return 0;
        if (!Array.isArray(list)) throw new Error("JavaUtil.medianOfList() parameter 'list' must be an array");
        let localList = list.filter(item => typeof item === "number").sort((a, b) => a - b);
        if (localList.length === 0) return 0;
        if (localList.length % 2 === 0) {
            return (localList[localList.length / 2 - 1] + localList[localList.length / 2]) / 2;
        } else {
            return localList[Math.floor((localList.length - 1) / 2)];
        }
    }

    static modesOfList(list) {
        if (list === null || list === undefined) return [];
        if (!Array.isArray(list)) throw new Error("JavaUtil.modesOfList() parameter 'list' must be an array");
        if (list.length === 0) return [];
        let modes = [];
        let counts = new Map();
        let maxCount = 0;
        list.forEach(item => {
            let count = counts.has(item) ? counts.get(item) + 1 : 1;
            counts.set(item, count);
            maxCount = Math.max(maxCount, count);
        });
        counts.forEach((item, count) => {
            if (count === maxCount) {
                modes.push(item);
            }
        });
        return modes;
    }

    static standardDeviationOfList(list) {
        if (list === null || list === undefined) return 0;
        if (!Array.isArray(list)) throw new Error("JavaUtil.standardDeviationOfList() parameter 'list' must be an array");
        if (list.length === 0) return 0;
        let mean = JavaUtil.averageOfList(list);
        let variance = 0;
        list.forEach(item => variance += (typeof item === "number" ? Math.pow(item - mean, 2) : 0));
        return Math.sqrt(variance / list.length);
    }

    static randomItemOfList(list) { // TODO: Allow null
        if (list === null || list === undefined) return null;
        if (!Array.isArray(list)) throw new Error("JavaUtil.randomItemOfList() parameter 'list' must be an array");
        if (list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)];
    }

    static randomInt(a, b) {
        if (typeof a !== "number") throw new Error("JavaUtil.randomInt() parameter 'a' must be a number");
        if (typeof b !== "number") throw new Error("JavaUtil.randomInt() parameter 'b' must be a number");
        if (a > b) {
            let swap = a;
            a = b;
            b = swap;
        }
        return Math.floor(Math.random() * (b - a + 1) + a);
    }

    static createListWith(...elements) {
        return [...elements];
    }

    static createListWithItemRepeated(element, n) {
        if (typeof n !== "number") throw new Error("JavaUtil.createListWithItemRepeated() parameter 'n' must be a number");
        let list = [];
        for (let i = 0; i < n; i++) {
            list.push(element);
        }
        return list;
    }

    static listLength(o) {
        if (Array.isArray(o)) return o.length;
        return 0;
    }

    static listIsEmpty(o) {
        if (Array.isArray(o)) return o.length;
        return false;
    }

    static getIndex(list, atMode, i) {
        if (!Array.isArray(list)) throw new Error("JavaUtil.getIndex() parameter 'list' must be an array");
        if (typeof i !== "number") throw new Error("JavaUtil.getIndex() parameter 'i' must be a number");
        switch (atMode) {
            case JavaUtil.AtMode.FIRST:
                return 0;
            case JavaUtil.AtMode.LAST:
                return list.length - 1;
            case JavaUtil.AtMode.FROM_START:
                return i;
            case JavaUtil.AtMode.FROM_END:
                return list.length - 1 - i;
            case JavaUtil.AtMode.RANDOM:
                return Math.floor(Math.random() * list.length);
            default:
                throw new Error("JavaUtil.getIndex() parameter 'atMode' must be one of the following: JavaUtil.AtMode.FIRST, JavaUtil.AtMode.LAST, JavaUtil.AtMode.FROM_START, JavaUtil.AtMode.FROM_END, JavaUtil.AtMode.RANDOM");
        }
    }

    static inListGet(list, atMode, i, remove) {
        if (list === null || list === undefined) return null;
        if (!Array.isArray(list)) throw new Error("JavaUtil.inListGet() parameter 'list' must be an array");
        if (typeof i !== "number") throw new Error("JavaUtil.inListGet() parameter 'i' must be a number");
        if (typeof remove !== "boolean") throw new Error("JavaUtil.inListGet() parameter 'remove' must be a boolean");
        switch (atMode) {
            case JavaUtil.AtMode.FIRST:
            case JavaUtil.AtMode.LAST:
            case JavaUtil.AtMode.FROM_START:
            case JavaUtil.AtMode.FROM_END:
            case JavaUtil.AtMode.RANDOM:
                i = JavaUtil.getIndex(list, atMode, i);
                if (remove) {
                    return list.splice(i, 1)[0];
                } else {
                    return list[i];
                }
            default:
                throw new Error("JavaUtil.inListGet() parameter 'atMode' must be one of the following: JavaUtil.AtMode.FIRST, JavaUtil.AtMode.LAST, JavaUtil.AtMode.FROM_START, JavaUtil.AtMode.FROM_END, JavaUtil.AtMode.RANDOM");
        }
    }

    static inListSet(list, atMode, i, insert, value) {
        if (list === null || list === undefined) return;
        if (!Array.isArray(list)) throw new Error("JavaUtil.inListSet() parameter 'list' must be an array");
        if (typeof i !== "number") throw new Error("JavaUtil.inListSet() parameter 'i' must be a number");
        if (typeof insert !== "boolean") throw new Error("JavaUtil.inListSet() parameter 'insert' must be a boolean");
        switch (atMode) {
            case JavaUtil.AtMode.FIRST:
            case JavaUtil.AtMode.LAST:
            case JavaUtil.AtMode.FROM_START:
            case JavaUtil.AtMode.FROM_END:
            case JavaUtil.AtMode.RANDOM:
                i = JavaUtil.getIndex(list, atMode, i);
                if (insert) {
                    list.splice(i, 0, value);
                } else {
                    list[i] = value;
                }
                return;
            default:
                throw new Error("JavaUtil.inListSet() parameter 'atMode' must be one of the following: JavaUtil.AtMode.FIRST, JavaUtil.AtMode.LAST, JavaUtil.AtMode.FROM_START, JavaUtil.AtMode.FROM_END, JavaUtil.AtMode.RANDOM");
        }
    }

    static inListGetSublist(list, atMode1, i1, atMode2, i2) {
        if (list === null || list === undefined) return null;
        if (!Array.isArray(list)) throw new Error("JavaUtil.inListGetSublist() parameter 'list' must be an array");
        if (typeof i1 !== "number") throw new Error("JavaUtil.inListGetSublist() parameter 'i1' must be a number");
        if (typeof i2 !== "number") throw new Error("JavaUtil.inListGetSublist() parameter 'i2' must be a number");
        if (atMode1 instanceof AtMode) throw new Error("JavaUtil.inListGetSublist() parameter 'atMode1' must be an AtMode");
        if (atMode2 instanceof AtMode) throw new Error("JavaUtil.inListGetSublist() parameter 'atMode2' must be an AtMode");
        
        return list.slice(JavaUtil.getIndex(list, atMode1, i1), JavaUtil.getIndex(list, atMode2, i2) + 1);
    }

    static SortType = (function () {
        function SortType() {
            this.toString = function () {
                switch (this) {
                    default:
                    case JavaUtil.SortType.NUMERIC: return "NUMERIC";
                    case JavaUtil.SortType.TEXT: return "TEXT";
                    case JavaUtil.SortType.IGNORE_CASE: return "IGNORE_CASE";
                }
            }
        }
        SortType.NUMERIC = new SortType();
        SortType.TEXT = new SortType();
        SortType.IGNORE_CASE = new SortType();
        return SortType;
    }());

    static SortDirection = (function () {
        function SortDirection() {
            this.toString = function () {
                switch (this) {
                    default:
                    case JavaUtil.SortDirection.ASCENDING: return "ASCENDING";
                    case JavaUtil.SortDirection.DESCENDING: return "DESCENDING";
                }
            }
        }
        SortDirection.ASCENDING = new SortDirection();
        SortDirection.DESCENDING = new SortDirection();
        return SortDirection;
    }());

    static sort(list, sortType, sortDirection) {
        if (list === null || list === undefined) return;
        if (!Array.isArray(list)) throw new Error("JavaUtil.sort() parameter 'list' must be an array");
        if (sortType instanceof JavaUtil.SortType) throw new Error("JavaUtil.sort() parameter 'sortType' must be a JavaUtil.SortType");
        if (sortDirection instanceof JavaUtil.SortDirection) throw new Error("JavaUtil.sort() parameter 'sortDirection' must be a JavaUtil.SortDirection");
        
        let copy = list.slice();

        switch (sortType) {
            case JavaUtil.SortType.NUMERIC:
                copy.sort((o1, o2) => {
                    let d1 = 0;
                    if (typeof o1 === "number") {
                        d1 = o1;
                    } else {
                        d1 = Number.parseFloat(o1) || 0;
                    }
                    let d2 = 0;
                    if (typeof o2 === "number") {
                        d2 = o2;
                    } else {
                        d2 = Number.parseFloat(o2) || 0;
                    }
                    return sortDirection === JavaUtil.SortDirection.ASCENDING ? Math.sign(d1 - d2) : Math.sign(d2 - d1);
                });
                break;
            case JavaUtil.SortType.TEXT:
                copy.sort((o1, o2) => {
                    if (o1 === null || o1 === undefined) throw new Error("JavaUtil.sort() array contains a null or undefined value");
                    if (o2 === null || o2 === undefined) throw new Error("JavaUtil.sort() array contains a null or undefined value");
                    return sortDirection === JavaUtil.SortDirection.ASCENDING 
                                ? o1.toString().localeCompare(o2.toString())
                                : o2.toString().localeCompare(o1.toString());
                });
                break;
            case JavaUtil.SortType.IGNORE_CASE:
                copy.sort((o1, o2) => {
                    if (o1 === null || o1 === undefined) throw new Error("JavaUtil.sort() array contains a null or undefined value");
                    if (o2 === null || o2 === undefined) throw new Error("JavaUtil.sort() array contains a null or undefined value");
                    return sortDirection === JavaUtil.SortDirection.ASCENDING 
                                ? o1.toString().toLowerCase().localeCompare(o2.toString().toLowerCase())
                                : o2.toString().toLowerCase().localeCompare(o1.toString().toLowerCase());
                });
                break;
            default:
                throw new Error("JavaUtil.sort() parameter 'sortType' must be one of the following: JavaUtil.SortType.NUMERIC, JavaUtil.SortType.TEXT, JavaUtil.SortType.IGNORE_CASE");
        }
        return copy;
    }

    static makeTextFromList(list, delimiter) {
        if (list === null || list === undefined || delimiter === null || delimiter === undefined) return "";
        if (!Array.isArray(list)) throw new Error("JavaUtil.makeTextFromList() parameter 'list' must be an array");
        if (typeof delimiter !== "string") throw new Error("JavaUtil.makeTextFromList() parameter 'delimiter' must be a string");
        return list.join(delimiter);
    }

    static makeListFromText(text, delimiter) {
        if (text === null || text === undefined || delimiter === null || delimiter === undefined) return [];
        if (typeof delimiter !== "string") throw new Error("JavaUtil.makeListFromText() parameter 'delimiter' must be a string");
        return text.split(delimiter);
    }

    static colorToHSV(color) {
        if (typeof color !== "number") throw new Error("JavaUtil.colorToHSV() parameter 'color' must be a ColorInt number");
        
        let r = (color >> 16) & 0xFF;
        let g = (color >> 8) & 0xFF;
        let b = color & 0xFF;
        
        return JavaUtil.rgbToHSV(r, g, b);
    }

    static colorToHue(color) {
        if (typeof color !== "number") throw new Error("JavaUtil.colorToHue() parameter 'color' must be a ColorInt number");
        return JavaUtil.colorToHSV(color)[0];
    }

    static colorToSaturation(color) {
        if (typeof color !== "number") throw new Error("JavaUtil.colorToSaturation() parameter 'color' must be a ColorInt number");
        return JavaUtil.colorToHSV(color)[1];
    }

    static colorToValue(color) {
        if (typeof color !== "number") throw new Error("JavaUtil.colorToValue() parameter 'color' must be a ColorInt number");
        return JavaUtil.colorToHSV(color)[2];
    }

    static hsvToColor(hue, saturation, value) {
        if (typeof hue !== "number") throw new Error("JavaUtil.hsvToColor() parameter 'hue' must be a number");
        if (typeof saturation !== "number") throw new Error("JavaUtil.hsvToColor() parameter 'saturation' must be a number");
        if (typeof value !== "number") throw new Error("JavaUtil.hsvToColor() parameter 'value' must be a number");
        let h = hue;
        let s = saturation;
        let v = value;
        // See https://stackoverflow.com/a/54024653
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        let rgb = [f(5), f(3), f(1)];

        return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    }

    static ahsvToColor(alpha, hue, saturation, value) {
        if (typeof alpha !== "number") throw new Error("JavaUtil.ahsvToColor() parameter 'alpha' must be a number");
        if (typeof hue !== "number") throw new Error("JavaUtil.ahsvToColor() parameter 'hue' must be a number");
        if (typeof saturation !== "number") throw new Error("JavaUtil.ahsvToColor() parameter 'saturation' must be a number");
        if (typeof value !== "number") throw new Error("JavaUtil.ahsvToColor() parameter 'value' must be a number");
        return (alpha << 24) | JavaUtil.hsvToColor(hue, saturation, value);
    }

    static rgbToHSV(red, green, blue) {
        if (typeof red !== "number") throw new Error("JavaUtil.rgbToHSV() parameter 'red' must be a number");
        if (typeof green !== "number") throw new Error("JavaUtil.rgbToHSV() parameter 'green' must be a number");
        if (typeof blue !== "number") throw new Error("JavaUtil.rgbToHSV() parameter 'blue' must be a number");

        let r = red;
        let g = green;
        let b = blue;

        // See https://stackoverflow.com/a/54070620
        let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
        let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));
        return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
    }

    static rgbToHue(red, green, blue) {
        if (typeof red !== "number") throw new Error("JavaUtil.rgbToHue() parameter 'red' must be a number");
        if (typeof green !== "number") throw new Error("JavaUtil.rgbToHue() parameter 'green' must be a number");
        if (typeof blue !== "number") throw new Error("JavaUtil.rgbToHue() parameter 'blue' must be a number");
        return JavaUtil.rgbToHSV(red, green, blue)[0];
    }

    static rgbToSaturation(red, green, blue) {
        if (typeof red !== "number") throw new Error("JavaUtil.rgbToSaturation() parameter 'red' must be a number");
        if (typeof green !== "number") throw new Error("JavaUtil.rgbToSaturation() parameter 'green' must be a number");
        if (typeof blue !== "number") throw new Error("JavaUtil.rgbToSaturation() parameter 'blue' must be a number");
        return JavaUtil.rgbToHSV(red, green, blue)[1];
    }

    static rgbToValue(red, green, blue) {
        if (typeof red !== "number") throw new Error("JavaUtil.rgbToValue() parameter 'red' must be a number");
        if (typeof green !== "number") throw new Error("JavaUtil.rgbToValue() parameter 'green' must be a number");
        if (typeof blue !== "number") throw new Error("JavaUtil.rgbToValue() parameter 'blue' must be a number");
        return JavaUtil.rgbToHSV(red, green, blue)[2];
    }

    static colorToText(color) {
        if (typeof color !== "number") throw new Error("JavaUtil.colorToText() parameter 'color' must be a ColorInt number");
        let hex = String.format("%08X", color);
        if (hex.startsWith("FF")) {
            hex = hex.substring(2);
        }
        return "#" + hex;
    }

    static showColor(appContext, color) {
        colorUtil.showColor(color);
    }

    static makeIntegerList(unboxed) {
        if (!Array.isArray(unboxed)) throw new Error("JavaUtil.makeIntegerList() parameter 'unboxed' must be an array");
        return unboxed.slice();
    }
}

class Color { // incomplete Color class
    static parseColor(text) {
        if (typeof text !== "string") throw new Error("JavaUtil.parseColor() parameter 'text' must be a string representing a hex value or a color name");
        if (text.charAt(0) === "#") {
            let color = parseInt(text.substring(1), 16);
            if (text.length === 7) {
                color |= 0xFF000000;
            } else if (text.length !== 9) {
                throw new Error("JavaUtil.parseColor() encountered invalid hex color. Parameter 'text' must be a string representing a hex value or a color name");
            }
            return color;
        } else {
            switch (text) {
                case "black": return 0xFF000000
                case "darkgray": return 0xFF444444
                case "gray": return 0xFF888888
                case "lightgray": return 0xFFCCCCCC
                case "white": return 0xFFFFFFFF
                case "red": return 0xFFFF0000
                case "green": return 0xFF00FF00
                case "blue": return 0xFF0000FF
                case "yellow": return 0xFFFFFF00
                case "cyan": return 0xFF00FFFF
                case "magenta": return 0xFFFF00FF
                case "aqua": return 0xFF00FFFF
                case "fuchsia": return 0xFFFF00FF
                case "darkgrey": return 0xFF444444
                case "grey": return 0xFF888888
                case "lightgrey": return 0xFFCCCCCC
                case "lime": return 0xFF00FF00
                case "maroon": return 0xFF800000
                case "navy": return 0xFF000080
                case "olive": return 0xFF808000
                case "purple": return 0xFF800080
                case "silver": return 0xFFC0C0C0
                case "teal": return 0xFF008080
            }
            throw new Error("JavaUtil.parseColor() encountered invalid color name. Parameter 'text' must be a string representing a hex value or a color name");
        }
    }

    static argb(alpha, red, green, blue) {
        if (typeof alpha !== "number") throw new Error("JavaUtil.argb() parameter 'alpha' must be a number");
        if (typeof red !== "number") throw new Error("JavaUtil.argb() parameter 'red' must be a number");
        if (typeof green !== "number") throw new Error("JavaUtil.argb() parameter 'green' must be a number");
        if (typeof blue !== "number") throw new Error("JavaUtil.argb() parameter 'blue' must be a number");
        return (alpha << 24) | (red << 16) | (green << 8) | (blue);
    }
}

class NormalizedRGBA {
    red;
    green;
    blue;
    alpha;

    toColor() {
        return Color.argb(
            Math.max(0, Math.min(255, this.alpha * 256)),
            Math.max(0, Math.min(255, this.red * 256)),
            Math.max(0, Math.min(255, this.green * 256)),
            Math.max(0, Math.min(255, this.blue * 256))
        );
    }
}

class I2cAddr {
    #i2cAddr7Bit;

    constructor(i2cAddr7Bit) {
        this.#i2cAddr7Bit = Math.floor(i2cAddr7Bit) & 0x7F;
    }

    static zero() { return create7Bit(0); }
    static create7Bit(i2cAddr7Bit) { return new I2cAddr(i2cAddr7Bit); }
    static create8Bit(i2cAddr8Bit) { return new I2cAddr(i2cAddr8Bit / 2); }

    get8Bit() { return this.#i2cAddr7Bit * 2; }
    get7Bit() { return this.#i2cAddr7Bit; }
}

/**************** Unit Implementation ****************/

// enum AngleUnit
const AngleUnit = (function () {
    function AngleUnit() {
        this.fromDegrees = function (degrees) {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return this.normalize(degrees / 180.0 * Math.PI);
                case AngleUnit.DEGREES: return this.normalize(degrees);
            }
        };
        this.fromRadians = function (radians) {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return this.normalize(radians);
                case AngleUnit.DEGREES: return this.normalize(radians / Math.PI * 180.0);
            }
        };
        this.fromUnit = function (them, theirs) {
            switch (them) {
                default:
                case AngleUnit.RADIANS: return this.fromRadians(theirs);
                case AngleUnit.DEGREES: return this.fromDegrees(theirs);
            }
        };
        this.toDegrees = function (inOurUnits) {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return AngleUnit.DEGREES.fromRadians(inOurUnits);
                case AngleUnit.DEGREES: return AngleUnit.DEGREES.fromDegrees(inOurUnits);
            }
        };
        this.toRadians = function (inOurUnits) {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return AngleUnit.RADIANS.fromRadians(inOurUnits);
                case AngleUnit.DEGREES: return AngleUnit.RADIANS.fromDegrees(inOurUnits);
            }
        };
        this.normalize = function (mine) {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return AngleUnit.normalizeRadians(mine);
                case AngleUnit.DEGREES: return AngleUnit.normalizeDegrees(mine);
            }
        };
        this.getUnnormalized = function () {
            throw new Error("getUnnormalized() is not supported");
        };
        this.toString = function () {
            switch (this) {
                default:
                case AngleUnit.RADIANS: return "RADIANS";
                case AngleUnit.DEGREES: return "DEGREES";
            }
        }
    }
    AngleUnit.DEGREES = new AngleUnit();
    AngleUnit.RADIANS = new AngleUnit();
    AngleUnit.normalizeDegrees = function (degrees) {
        while (degrees >= 180.0) degrees -= 360.0;
        while (degrees < -180.0) degrees += 360.0;
        return degrees;
    };
    AngleUnit.normalizeRadians = function (radians) {
        while (radians >= Math.PI) radians -= 2.0 * Math.PI;
        while (radians < -Math.PI) radians += 2.0 * Math.PI;
        return radians;
    }
    return AngleUnit;
}());
window.AngleUnitRef = AngleUnit; // Attach to global for IMU conflict resolution

// enum CurrentUnit
const CurrentUnit = (function () {
    function CurrentUnit(ampsPerUnit) {
        this.toAmps = function (value) { return value * ampsPerUnit / 1.0; }
        this.toMilliAmps = function (value) { return value * ampsPerUnit / 0.001; }
        if (this === CurrentUnit.AMPS) this.convert = function (value, unit) { return unit.toAmps(value); }
        else if (this === CurrentUnit.MILLIAMPS) this.convert = function (value, unit) { return unit.toMilliAmps(value); }
        else this.convert = function () { throw new Error("CurrentUnit.[UNIT].convert() parameter 'unit' must be either 'CurrentUnit.AMPS' or 'CurrentUnit.MILLIAMPS'"); }
        this.toString = function () {
            switch (this) {
                default:
                case CurrentUnit.AMPS: return "AMPS";
                case CurrentUnit.MILLIAMPS: return "MILLIAMPS";
            }
        }
    }
    CurrentUnit.AMPS = new CurrentUnit(1.0);
    CurrentUnit.MILLIAMPS = new CurrentUnit(0.001);
    return CurrentUnit;
}());

// enum DistanceUnit
const DistanceUnit = (function () {
    function DistanceUnit(bVal) {
        this.bVal = bVal;
        this.fromMeters = function (meters) {
            if (meters === DistanceUnit.infinity) return DistanceUnit.infinity;
            switch (this) {
                default:
                case DistanceUnit.METER: return meters;
                case DistanceUnit.CM: return meters * 100;
                case DistanceUnit.MM: return meters * 1000;
                case DistanceUnit.INCH: return meters / DistanceUnit.mPerInch;
            }
        }
        this.fromInches = function (inches) {
            if (inches === DistanceUnit.infinity) return DistanceUnit.infinity;
            switch (this) {
                default:
                case DistanceUnit.METER: return inches * DistanceUnit.mPerInch;
                case DistanceUnit.CM: return inches * DistanceUnit.mPerInch * 100;
                case DistanceUnit.MM: return inches * DistanceUnit.mPerInch * 1000;
                case DistanceUnit.INCH: return inches;
            }
        }
        this.fromCm = function (cm) {
            if (cm === DistanceUnit.infinity) return DistanceUnit.infinity;
            switch (this) {
                default:
                case DistanceUnit.METER: return cm / 100;
                case DistanceUnit.CM: return cm;
                case DistanceUnit.MM: return cm * 10;
                case DistanceUnit.INCH: return this.fromMeters(DistanceUnit.METER.fromCm(cm));
            }
        }
        this.fromMm = function (mm) {
            if (mm === DistanceUnit.infinity) return DistanceUnit.infinity;
            switch (this) {
                default:
                case DistanceUnit.METER: return mm / 1000;
                case DistanceUnit.CM: return mm / 10;
                case DistanceUnit.MM: return mm;
                case DistanceUnit.INCH: return this.fromMeters(DistanceUnit.METER.fromMm(mm));
            }
        }
        this.fromUnit = function (him, his) {
            switch (him) {
                default:
                case DistanceUnit.METER: return this.fromMeters(his);
                case DistanceUnit.CM: return this.fromCm(his);
                case DistanceUnit.MM: return this.fromMm(his);
                case DistanceUnit.INCH: return this.fromInches(his);
            }
        }
        this.toMeters = function (inOurUnits) {
            switch (this) {
                default:
                case DistanceUnit.METER: return DistanceUnit.METER.fromMeters(inOurUnits);
                case DistanceUnit.CM: return DistanceUnit.METER.fromCm(inOurUnits);
                case DistanceUnit.MM: return DistanceUnit.METER.fromMm(inOurUnits);
                case DistanceUnit.INCH: return DistanceUnit.METER.fromInches(inOurUnits);
            }
        }
        this.toInches = function (inOurUnits) {
            switch (this) {
                default:
                case DistanceUnit.METER: return DistanceUnit.INCH.fromMeters(inOurUnits);
                case DistanceUnit.CM: return DistanceUnit.INCH.fromCm(inOurUnits);
                case DistanceUnit.MM: return DistanceUnit.INCH.fromMm(inOurUnits);
                case DistanceUnit.INCH: return DistanceUnit.INCH.fromInches(inOurUnits);
            }
        }
        this.toCm = function (inOurUnits) {
            switch (this) {
                default:
                case DistanceUnit.METER: return DistanceUnit.CM.fromMeters(inOurUnits);
                case DistanceUnit.CM: return DistanceUnit.CM.fromCm(inOurUnits);
                case DistanceUnit.MM: return DistanceUnit.CM.fromMm(inOurUnits);
                case DistanceUnit.INCH: return DistanceUnit.CM.fromInches(inOurUnits);
            }
        }
        this.toMm = function (inOurUnits) {
            switch (this) {
                default:
                case DistanceUnit.METER: return DistanceUnit.MM.fromMeters(inOurUnits);
                case DistanceUnit.CM: return DistanceUnit.MM.fromCm(inOurUnits);
                case DistanceUnit.MM: return DistanceUnit.MM.fromMm(inOurUnits);
                case DistanceUnit.INCH: return DistanceUnit.MM.fromInches(inOurUnits);
            }
        }
        this.toString = function (inOurUnits) {
            if (arguments.length === 0) {
                switch (this) { // toString()
                    default:
                    case DistanceUnit.METER: return "m";
                    case DistanceUnit.CM: return "cm";
                    case DistanceUnit.MM: return "mm";
                    case DistanceUnit.INCH: return "in";
                }
            } else { // toString(double inOurUnits)
                switch (this) {
                    default:
                    case DistanceUnit.METER: return String.format("%.3fm", inOurUnits);
                    case DistanceUnit.CM: return String.format("%.1fcm", inOurUnits);
                    case DistanceUnit.MM: return String.format("%.0fmm", inOurUnits);
                    case DistanceUnit.INCH: return String.format("%.2fin", inOurUnits);
                }
            }
        }
    }
    DistanceUnit.METER = new DistanceUnit(0);
    DistanceUnit.CM = new DistanceUnit(1);
    DistanceUnit.MM = new DistanceUnit(2);
    DistanceUnit.INCH = new DistanceUnit(3);
    DistanceUnit.infinity = Number.MAX_VALUE;
    DistanceUnit.mmPerInch = 25.4;
    DistanceUnit.mPerInch = DistanceUnit.mmPerInch * 0.001;
    return DistanceUnit;
}());

/**************** DcMotor Implementations ****************/

class DcMotorSimple {
    // enum Direction
    static Direction = (function () {
        function Direction() {
            this.inverted = function () { return this === DcMotorSimple.Direction.FORWARD ? DcMotorSimple.Direction.REVERSE : DcMotorSimple.Direction.FORWARD; }
            this.toString = function () {
                switch (this) {
                    default:
                    case DcMotorSimple.Direction.FORWARD: return "FORWARD";
                    case DcMotorSimple.Direction.REVERSE: return "REVERSE";
                }
            }
        }
        Direction.FORWARD = new Direction();
        Direction.REVERSE = new Direction();
        return Direction;
    }());

    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }

    setDirection(direction) {
        switch (direction) {
            case DcMotorSimple.Direction.FORWARD:
                motor.setProperty([this.#internalIndex], "Direction", ["FORWARD"]);
                break;
            case DcMotorSimple.Direction.REVERSE:
                motor.setProperty([this.#internalIndex], "Direction", ["REVERSE"]);
                break;
            default:
                throw new Error("setDirection() parameter 'Direction' must be either 'DcMotorSimple.Direction.FORWARD' or 'DcMotorSimple.Direction.REVERSE'");
        }
    }

    getDirection() {
        switch (motor.getProperty(this.#internalIndex, "Direction")) {
            case "FORWARD":
                return DcMotorSimple.Direction.FORWARD;
            case "REVERSE":
                return DcMotorSimple.Direction.REVERSE;
            default:
                throw new Error("Something went wrong with internal motor.getDirection()");
        }
    }

    setPower(power) {
        if (typeof power === "number") {
            motor.setProperty([this.#internalIndex], "Power", [power]);
        } else {
            throw new Error("setPower() parameter 'power' must be a number");
        }
    }

    getPower() {
        let power = motor.getProperty(this.#internalIndex, "Power");
        if (typeof power === "number") {
            return power;
        } else {
            throw new Error("Something went wrong with internal motor.getPower()");
        }
    }
}

class DcMotor extends DcMotorSimple {
    // enum ZeroPowerBehavior
    static ZeroPowerBehavior = (function () {
        function ZeroPowerBehavior() {
            this.toString = function () {
                switch (this) {
                    default:
                    case DcMotor.ZeroPowerBehavior.BRAKE: return "BRAKE";
                    case DcMotor.ZeroPowerBehavior.FLOAT: return "FLOAT";
                }
            }
        }
        ZeroPowerBehavior.BRAKE = new ZeroPowerBehavior();
        ZeroPowerBehavior.FLOAT = new ZeroPowerBehavior();
        return ZeroPowerBehavior;
    }());

    // enum RunMode
    static RunMode = (function () {
        function RunMode() {
            this.isPIDMode = function () { return this === DcMotor.RunMode.RUN_USING_ENCODER || this === DcMotor.RunMode.RUN_TO_POSITION; }
            this.toString = function () {
                switch (this) {
                    default:
                    case DcMotor.RunMode.RUN_WITHOUT_ENCODER: return "RUN_WITHOUT_ENCODER";
                    case DcMotor.RunMode.RUN_USING_ENCODER: return "RUN_USING_ENCODER";
                    case DcMotor.RunMode.RUN_TO_POSITION: return "RUN_TO_POSITION";
                    case DcMotor.RunMode.STOP_AND_RESET_ENCODER: return "STOP_AND_RESET_ENCODER";
                }
            }
        }
        RunMode.RUN_WITHOUT_ENCODER = new RunMode();
        RunMode.RUN_USING_ENCODER = new RunMode();
        RunMode.RUN_TO_POSITION = new RunMode();
        RunMode.STOP_AND_RESET_ENCODER = new RunMode();
        return RunMode;
    })();

    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex);
        this.#internalIndex = internalIndex;
    }

    setZeroPowerBehavior(zeroPowerBehavior) {
        switch (zeroPowerBehavior) {
            case DcMotor.ZeroPowerBehavior.BRAKE:
                motor.setProperty([this.#internalIndex], "ZeroPowerBehavior", ["BRAKE"]);
                break;
            case DcMotor.ZeroPowerBehavior.FLOAT:
                motor.setProperty([this.#internalIndex], "ZeroPowerBehavior", ["FLOAT"]);
                break;
            default:
                throw new Error("setZeroPowerBehavior() parameter 'ZeroPowerBehavior' must be either 'DcMotor.ZeroPowerBehavior.BRAKE' or 'DcMotor.ZeroPowerBehavior.FLOAT'");
        }
    }

    getZeroPowerBehavior() {
        switch (motor.getProperty(this.#internalIndex, "ZeroPowerBehavior")) {
            case "BRAKE":
                return DcMotor.ZeroPowerBehavior.BRAKE;
            case "FLOAT":
                return DcMotor.ZeroPowerBehavior.FLOAT;
            default:
                throw new Error("Something went wrong with internal motor.getZeroPowerBehavior()");
        }
    }

    getPowerFloat() {
        let isPowerFloat = motor.getProperty(this.#internalIndex, "PowerFloat");
        if (typeof isPowerFloat === "boolean") {
            return isPowerFloat;
        } else {
            throw new Error("Something went wrong with internal motor.getPowerFloat()");
        }
    }

    setTargetPosition(targetPosition) {
        if (typeof targetPosition === "number") {
            motor.setProperty([this.#internalIndex], "TargetPosition", [targetPosition]);
        } else {
            throw new Error("setTargetPosition() parameter 'targetPosition' must be a number");
        }
    }

    getTargetPosition() {
        let targetPosition = motor.getProperty(this.#internalIndex, "TargetPosition");
        if (typeof targetPosition === "number") {
            return targetPosition;
        } else {
            throw new Error("Something went wrong with internal motor.getTargetPosition()");
        }
    }

    isBusy() {
        let isBusy = motor.isBusy(this.#internalIndex);
        if (typeof isBusy === "boolean") {
            return isBusy;
        } else {
            throw new Error("Something went wrong with internal motor.isBusy()");
        }
    }

    getCurrentPosition() {
        let currentPosition = motor.getProperty(this.#internalIndex, "CurrentPosition");
        if (typeof currentPosition === "number") {
            return currentPosition;
        } else {
            throw new Error("Something went wrong with internal motor.getCurrentPosition()");
        }
    }

    setMode(mode) {
        switch (mode) {
            case DcMotor.RunMode.RUN_WITHOUT_ENCODER:
                motor.setProperty([this.#internalIndex], "Mode", ["RUN_WITHOUT_ENCODER"]);
                break;
            case DcMotor.RunMode.RUN_USING_ENCODER:
                motor.setProperty([this.#internalIndex], "Mode", ["RUN_USING_ENCODER"]);
                break;
            case DcMotor.RunMode.RUN_TO_POSITION:
                motor.setProperty([this.#internalIndex], "Mode", ["RUN_TO_POSITION"]);
                break;
            case DcMotor.RunMode.STOP_AND_RESET_ENCODER:
                motor.setProperty([this.#internalIndex], "Mode", ["STOP_AND_RESET_ENCODER"]);
                break;
            default:
                throw new Error("setMode() parameter 'mode' must be one of the following: 'DcMotor.RunMode.RUN_WITHOUT_ENCODER', 'DcMotor.RunMode.RUN_USING_ENCODER', 'DcMotor.RunMode.RUN_TO_POSITION', 'DcMotor.RunMode.STOP_AND_RESET_ENCODER'");
        }
    }

    getMode() {
        switch (motor.getProperty(this.#internalIndex, "Mode")) {
            case "RUN_WITHOUT_ENCODER":
                return DcMotor.RunMode.RUN_WITHOUT_ENCODER;
            case "RUN_USING_ENCODER":
                return DcMotor.RunMode.RUN_USING_ENCODER;
            case "RUN_TO_POSITION":
                return DcMotor.RunMode.RUN_TO_POSITION;
            case "STOP_AND_RESET_ENCODER":
                return DcMotor.RunMode.STOP_AND_RESET_ENCODER;
            default:
                throw new Error("Something went wrong with internal motor.getMode()");
        }
    }
}

class DcMotorEx extends DcMotor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex);
        this.#internalIndex = internalIndex;
    }

    setMotorEnable() {
        motor.setMotorEnable(this.#internalIndex);
    }

    setMotorDisable() {
        motor.setMotorDisable(this.#internalIndex);
    }

    isMotorEnabled() {
        motor.isMotorEnabled(this.#internalIndex);
    }

    setVelocity(angularRate, unit) {
        if (typeof angularRate === "number") {
            switch (unit) {
                case undefined:
                    motor.setProperty([this.#internalIndex], "Velocity", [angularRate]);
                    break;
                case AngleUnit.DEGREES:
                    motor.setVelocity_withAngleUnit(this.#internalIndex, angularRate, "DEGREES");
                    break;
                case AngleUnit.RADIANS:
                    motor.setVelocity_withAngleUnit(this.#internalIndex, angularRate, "RADIANS");
                    break;
                default:
                    throw new Error("setVelocity() parameter 'unit' must be one of the following: be left empty, 'AngleUnit.DEGREES', 'AngleUnit.RADIANS'");
            }
        } else {
            throw new Error("setVelocity() parameter 'angularRate' must be a number");
        }
    }

    getVelocity(unit) {
        let angularRate;
        switch (unit) {
            case undefined:
                angularRate = motor.getProperty(this.#internalIndex, "Velocity");
                break;
            case AngleUnit.DEGREES:
                angularRate = motor.getVelocity_withAngleUnit(this.#internalIndex, "DEGREES");
                break;
            case AngleUnit.RADIANS:
                angularRate = motor.getVelocity_withAngleUnit(this.#internalIndex, "RADIANS");
                break;
            default:
                throw new Error("getVelocity() parameter 'unit' must be one of the following: be left empty, 'AngleUnit.DEGREES', 'AngleUnit.RADIANS'");
        }

        if (typeof angularRate === "number") {
            return angularRate;
        } else {
            throw new Error("Something went wrong with internal motor.getVelocity()");
        }
    }

    setPIDFCoefficients(mode, pidfCoefficients) {
        throw new Error("setPIDFCoefficients() is not supported");
    }

    setVelocityPIDFCoefficients(p, i, d, f) {
        throw new Error("setVelocityPIDFCoefficients() is not supported");
    }

    setPositionPIDFCoefficients(p) {
        throw new Error("setPositionPIDFCoefficients() is not supported");
    }

    getPIDFCoefficients(mode) {
        throw new Error("getPIDFCoefficients() is not supported");
    }

    setTargetPositionTolerance(tolerance) {
        if (typeof tolerance === "number") {
            motor.setProperty([this.#internalIndex], "TargetPositionTolerance", [tolerance]);
        } else {
            throw new Error("setTargetPositionTolerance() parameter 'tolerance' must be a number");
        }
    }

    getTargetPositionTolerance() {
        let tolerance = motor.getProperty(this.#internalIndex, "TargetPositionTolerance");
        if (typeof tolerance === "number") {
            return tolerance;
        } else {
            throw new Error("Something went wrong with internal motor.getTargetPositionTolerance()");
        }
    }

    getCurrent(unit) {
        switch (unit) {
            case CurrentUnit.AMPS:
                return motor.getCurrent(this.#internalIndex, "AMPS");
            case CurrentUnit.MILLIAMPS:
                return motor.getCurrent(this.#internalIndex, "MILLIAMPS");
            default:
                throw new Error("getCurrent() parameter 'unit' must be either 'CurrentUnit.AMPS' or 'CurrentUnit.MILLIAMPS'");
        }
    }

    getCurrentAlert(unit) {
        switch (unit) {
            case CurrentUnit.AMPS:
                return motor.getCurrentAlert(this.#internalIndex, "AMPS");
            case CurrentUnit.MILLIAMPS:
                return motor.getCurrentAlert(this.#internalIndex, "MILLIAMPS");
            default:
                throw new Error("getCurrentAlert() parameter 'unit' must be either 'CurrentUnit.AMPS' or 'CurrentUnit.MILLIAMPS'");
        }
    }

    setCurrentAlert(current, unit) {
        if (typeof current === "number") {
            switch (unit) {
                case CurrentUnit.AMPS:
                    motor.setCurrentAlert(this.#internalIndex, current, "AMPS");
                    break;
                case CurrentUnit.MILLIAMPS:
                    motor.setCurrentAlert(this.#internalIndex, current, "MILLIAMPS");
                    break;
                default:
                    throw new Error("setCurrentAlert() parameter 'unit' must be either 'CurrentUnit.AMPS' or 'CurrentUnit.MILLIAMPS'");
            }
        } else {
            throw new Error("setCurrentAlert() parameter 'current' must be a number");
        }
    }

    isOverCurrent() {
        let isOverCurrent = motor.isOverCurrent(this.#internalIndex);
        if (typeof isOverCurrent === "boolean") {
            return isOverCurrent;
        } else {
            throw new Error("Something went wrong with internal motor.isOverCurrent()");
        }
    }
}

/**************** DistanceSensor Implementations ****************/

class DistanceSensor {
    #internalIndex;
    #internalIsColorSensor;
    #globalAccessor;
    constructor(internalIndex, internalIsColorSensor = false) {
        this.#internalIndex = internalIndex;
        this.#internalIsColorSensor = internalIsColorSensor;
        if (internalIsColorSensor) {
            this.#globalAccessor = colorSensor;
        } else {
            this.#globalAccessor = distanceSensor;
        }
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }
    __getInternalIsColorSensor() {
        return this.#internalIsColorSensor;
    }

    getDistance(unit) {
        switch (unit) {
            case DistanceUnit.METER:
                return this.#globalAccessor.getDistance(this.#internalIndex, "METER");
            case DistanceUnit.CM:
                return this.#globalAccessor.getDistance(this.#internalIndex, "CM");
            case DistanceUnit.MM:
                return this.#globalAccessor.getDistance(this.#internalIndex, "MM");
            case DistanceUnit.INCH:
                return this.#globalAccessor.getDistance(this.#internalIndex, "INCH");
            default:
                throw new Error("getDistance() parameter 'unit' must be one of the following: 'DistanceUnit.METER', 'DistanceUnit.CM', 'DistanceUnit.MM', 'DistanceUnit.INCH'");
        }
    }

    distanceOutOfRange = DistanceUnit.infinity;
}

class Rev2mDistanceSensor extends DistanceSensor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex, false);
        this.#internalIndex = internalIndex;
    }
}

class ModernRoboticsI2cRangeSensor extends DistanceSensor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex, false);
        this.#internalIndex = internalIndex;
    }
}

/**************** ColorSensor Implementations ****************/

class ColorSensor {
    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }

    red() {
        let value = colorSensor.getProperty(this.#internalIndex, "Red");
        if (typeof value === "number") {
            return value;
        } else {
            throw new Error("Something went wrong with internal colorSensor.red()");
        }
    }

    green() {
        let value = colorSensor.getProperty(this.#internalIndex, "Green");
        if (typeof value === "number") {
            return value;
        } else {
            throw new Error("Something went wrong with internal colorSensor.green()");
        }
    }

    blue() {
        let value = colorSensor.getProperty(this.#internalIndex, "Blue");
        if (typeof value === "number") {
            return value;
        } else {
            throw new Error("Something went wrong with internal colorSensor.blue()");
        }
    }

    alpha() {
        let value = colorSensor.getProperty(this.#internalIndex, "Alpha");
        if (typeof value === "number") {
            return value;
        } else {
            throw new Error("Something went wrong with internal colorSensor.alpha()");
        }
    }

    argb() {
        let value = colorSensor.getProperty(this.#internalIndex, "Argb");
        if (typeof value === "number") {
            return value;
        } else {
            throw new Error("Something went wrong with internal colorSensor.argb()");
        }
    }

    enableLed(enable) {
        throw new Error("enableLed() is not supported");
    }

    setI2cAddress(address) {
        throw new Error("setI2cAddress() is not supported");
    }

    getI2cAddress() {
        throw new Error("getI2cAddress() is not supported");
    }
}

class NormalizedColorSensor {
    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }

    getNormalizedColors() {
        let rawNormalizedColors = JSON.parse(colorSensor.getNormalizedColors(this.#internalIndex));
        if (typeof rawNormalizedColors === "object") {
            let normalizedColors = new NormalizedRGBA();
            normalizedColors.alpha = rawNormalizedColors.Alpha;
            normalizedColors.red = rawNormalizedColors.Red;
            normalizedColors.green = rawNormalizedColors.Green;
            normalizedColors.blue = rawNormalizedColors.Blue;
            return normalizedColors;
        } else {
            throw new Error("Something went wrong with internal colorSensor.getNormalizedColors()");
        }
    }

    getGain() {
        let gain = colorSensor.getProperty(this.#internalIndex, "Gain");
        if (typeof gain === "number") {
            return gain;
        } else {
            throw new Error("Something went wrong with internal colorSensor.getGain()");
        }
    }

    setGain(newGain) {
        if (typeof newGain === "number") {
            colorSensor.setProperty(this.#internalIndex, "Gain", newGain);
        } else {
            throw new Error("setGain() parameter 'newGain' must be a number");
        }
    }
}

class LightSensor {
    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }

    getLightDetected() {
        let lightDetected = colorSensor.getProperty(this.#internalIndex, "LightDetected");
        if (typeof lightDetected === "number") {
            return lightDetected;
        } else {
            throw new Error("Something went wrong with internal colorSensor.getLightDetected()");
        }
    }

    getRawLightDetected() {
        let rawLightDetected = colorSensor.getProperty(this.#internalIndex, "RawLightDetected");
        if (typeof rawLightDetected === "number") {
            return rawLightDetected;
        } else {
            throw new Error("Something went wrong with internal colorSensor.getRawLightDetected()");
        }
    }

    getRawLightDetectedMax() {
        let rawLightDetectedMax = colorSensor.getProperty(this.#internalIndex, "RawLightDetectedMax");
        if (typeof rawLightDetectedMax === "number") {
            return rawLightDetectedMax;
        } else {
            throw new Error("Something went wrong with internal colorSensor.getRawLightDetectedMax()");
        }
    }

    enableLed(enable) {
        throw new Error("enableLed() is not supported");
    }

    status() {
        throw new Error("status() is not supported");
    }
}

class OpticalDistanceSensor extends LightSensor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex);
        this.#internalIndex = internalIndex;
    }
}

class ColorRangeSensor extends VRSJavaInternals.MultiClass(ColorSensor, NormalizedColorSensor, DistanceSensor, OpticalDistanceSensor, LightSensor) {
    #internalIndex;
    constructor(internalIndex) {
        super({
            "ColorSensor": [internalIndex],
            "NormalizedColorSensor": [internalIndex],
            "DistanceSensor": [internalIndex, true],
            "OpticalDistanceSensor": [internalIndex],
            "LightSensor": [internalIndex]
        });
        this.#internalIndex = internalIndex;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }
}

class RevColorSensorV3 extends ColorRangeSensor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex);
        this.#internalIndex = internalIndex;
    }
}

class LynxI2cColorRangeSensor extends ColorRangeSensor {
    #internalIndex;
    constructor(internalIndex) {
        super(internalIndex);
        this.#internalIndex = internalIndex;
    }
}

/**************** IMU Implementation ****************/

// enum Axis
const Axis = (function () {
    function Axis(index) {
        this.index = index;
        this.toString = function () {
            switch (this) {
                default:
                case Axis.X: return "X";
                case Axis.Y: return "Y";
                case Axis.Z: return "Z";
                case Axis.UNKNOWN: return "UNKNOWN";
            }
        }
    }
    Axis.X = new Axis(0);
    Axis.Y = new Axis(1);
    Axis.Z = new Axis(2);
    Axis.UNKNOWN = new Axis(-1);
    Axis.fromIndex = function (index) {
        switch (index) {
            case 0: return Axis.X;
            case 1: return Axis.Y;
            case 2: return Axis.Z;
            default: return Axis.UNKNOWN;
        }
    }
    return Axis;
}());

// enum AxesReference
const AxesReference = (function () {
    function AxesReference() {
        this.reverse = function () {
            switch (this) {
                default:
                case AxesReference.EXTRINSIC: return AxesReference.INTRINSIC;
                case AxesReference.INTRINSIC: return AxesReference.EXTRINSIC;
            }
        }
        this.toString = function () {
            switch (this) {
                default:
                case AxesReference.EXTRINSIC: return "EXTRINSIC";
                case AxesReference.INTRINSIC: return "INTRINSIC";
            }
        }
    }
    AxesReference.EXTRINSIC = new AxesReference();
    AxesReference.INTRINSIC = new AxesReference();
    return AxesReference;
}());

// enum AxesOrder
const AxesOrder = (function () {
    function AxesOrder(indices) {
        this.indices = function () {
            return indices;
        };
        this.axes = function () {
            return [Axis.fromIndex(indices[0]), Axis.fromIndex(indices[1]), Axis.fromIndex(indices[2])];
        };
        this.reverse = function () {
            switch (this) {
                default:
                case AxesOrder.XZX: return AxesOrder.XZX;
                case AxesOrder.XYX: return AxesOrder.XYX;
                case AxesOrder.YXY: return AxesOrder.YXY;
                case AxesOrder.YZY: return AxesOrder.YZY;
                case AxesOrder.ZYZ: return AxesOrder.ZYZ;
                case AxesOrder.ZXZ: return AxesOrder.ZXZ;
                case AxesOrder.XZY: return AxesOrder.YZX;
                case AxesOrder.XYZ: return AxesOrder.ZYX;
                case AxesOrder.YXZ: return AxesOrder.ZXY;
                case AxesOrder.YZX: return AxesOrder.XZY;
                case AxesOrder.ZYX: return AxesOrder.XYZ;
                case AxesOrder.ZXY: return AxesOrder.YXZ;
            }
        }
        this.toString = function () {
            switch (this) {
                default:
                case AxesOrder.XZX: return "XZX";
                case AxesOrder.XYX: return "XYX";
                case AxesOrder.YXY: return "YXY";
                case AxesOrder.YZY: return "YZY";
                case AxesOrder.ZYZ: return "YZZ";
                case AxesOrder.ZXZ: return "ZXZ";
                case AxesOrder.XZY: return "XZY";
                case AxesOrder.XYZ: return "XYZ";
                case AxesOrder.YXZ: return "YXZ";
                case AxesOrder.YZX: return "YZX";
                case AxesOrder.ZYX: return "ZYX";
                case AxesOrder.ZXY: return "ZXY";
            }
        }
    }
    AxesOrder.XZX = new AxesOrder([0, 2, 0]);
    AxesOrder.XYX = new AxesOrder([0, 1, 0]);
    AxesOrder.YXY = new AxesOrder([1, 0, 1]);
    AxesOrder.YZY = new AxesOrder([1, 2, 1]);
    AxesOrder.ZYZ = new AxesOrder([2, 1, 2]);
    AxesOrder.ZXZ = new AxesOrder([2, 0, 2]);
    AxesOrder.XZY = new AxesOrder([0, 2, 1]);
    AxesOrder.XYZ = new AxesOrder([0, 1, 2]);
    AxesOrder.YXZ = new AxesOrder([1, 0, 2]);
    AxesOrder.YZX = new AxesOrder([1, 2, 0]);
    AxesOrder.ZYX = new AxesOrder([2, 1, 0]);
    AxesOrder.ZXY = new AxesOrder([2, 0, 1]);
    return AxesOrder;
}());

class Orientation {
    axesReference;
    axesOrder;
    angleUnit;
    firstAngle;
    secondAngle;
    thirdAngle;
    acquisitionTime;

    constructor(axesReference, axesOrder, angleUnit, firstAngle, secondAngle, thirdAngle, acquisitionTime) {
        if (arguments.length === 0) { // new Orientation()
            this(AxesReference.EXTRINSIC, AxesOrder.XYZ, AngleUnit.RADIANS, 0, 0, 0, 0);
        } else {
            this.axesReference = axesReference;
            this.axesOrder = axesOrder;
            this.angleUnit = angleUnit;
            this.firstAngle = firstAngle;
            this.secondAngle = secondAngle;
            this.thirdAngle = thirdAngle;
            this.acquisitionTime = acquisitionTime;
        }
    }

    toAngleUnit(angleUnit) {
        if (angleUnit !== this.angleUnit) {
            return new Orientation(this.axesReference, this.axesOrder, angleUnit,
                angleUnit.fromUnit(this.angleUnit, this.firstAngle),
                angleUnit.fromUnit(this.angleUnit, this.secondAngle),
                angleUnit.fromUnit(this.angleUnit, this.thirdAngle),
                this.acquisitionTime);
        }
        return this;
    }

    toAxesReference(axesReference) {
        if (this.axesReference !== axesReference) {
            if (axesReference !== this.axesReference.reverse()) {
                console.log("Something went wrong with Orientation.toAxesReference()");
            };
            return new Orientation(this.axesReference.reverse(), this.axesOrder.reverse(), this.angleUnit,
                this.thirdAngle, this.secondAngle, this.firstAngle, this.acquisitionTime);
        }
        return this;
    }

    toAxesOrder(axesOrder) {
        if (this.axesOrder !== axesOrder) {
            throw new Error("toAxesOrder() is not supported");
            return Orientation.getOrientation(this.getRotationMatrix(), this.axesReference, axesOrder, this.angleUnit);
        }
        return this;
    }

    toString() {
        if (this.angleUnit == AngleUnit.DEGREES)
            return String.format("{%s %s %.0f %.0f %.0f}", this.axesReference.toString(), this.axesOrder.toString(), this.firstAngle, this.secondAngle, this.thirdAngle);
        else
            return String.format("{%s %s %.3f %.3f %.3f}", this.axesReference.toString(), this.axesOrder.toString(), this.firstAngle, this.secondAngle, this.thirdAngle);
    }

    getRotationMatrix() {
        return Orientation.getRotationMatrix(this.axesReference, this.axesOrder, this.angleUnit, this.firstAngle, this.secondAngle, this.thirdAngle);
    }

    static getRotationMatrix() {
        throw new Error("getRotationMatrix() is not supported");
    }

    static getOrientation(rot, axesReference, axesOrder, unit) {
        throw new Error("getOrientation() is not supported");
    }

    static AngleSet = (function () { // used in static getOrientation() except it's not implemented
        function AngleSet() { }
        AngleSet.THEONE = new AngleSet();
        AngleSet.THEOTHER = new AngleSet();
        return AngleSet;
    }());
}

class AngularVelocity {
    unit;
    xRotationRate;
    yRotationRate;
    zRotationRate;
    acquisitionTime;

    constructor(unit, xRotationRate, yRotationRate, zRotationRate, acquisitionTime) {
        if (arguments.length === 0) { // new AngularVelocity()
            this(AngleUnit.DEGREES, 0, 0, 0, 0);
        } else { // new AngularVelocity(AngleUnit unit, float xRotationRate, float yRotationRate, float zRotationRate, long acquisitionTime)
            this.unit = unit;
            this.xRotationRate = xRotationRate;
            this.yRotationRate = yRotationRate;
            this.zRotationRate = zRotationRate;
            this.acquisitionTime = acquisitionTime;
        }
    }

    toAngleUnit(unit) {
        if (unit !== this.unit) {
            return new AngularVelocity(unit,
                unit.fromUnit(this.unit, this.xRotationRate),
                unit.fromUnit(this.unit, this.yRotationRate),
                unit.fromUnit(this.unit, this.zRotationRate),
                this.acquisitionTime);
        }
        return this;
    }

    toString() {
        return String.format("{x=%.3f, y=%.3f, z=%.3f (%s)}", this.xRotationRate, this.yRotationRate, this.zRotationRate, this.unit)
    }
}

class Position {
    unit;
    x;
    y;
    z;
    acquisitionTime;

    constructor(unit, x, y, z, acquisitionTime) {
        if (arguments.length === 0) { // new Position()
            this(DistanceUnit.MM, 0, 0, 0, 0);
        } else { // new Position(DistanceUnit unit, double x, double y, double z, long acquisitionTime)
            this.unit = unit;
            this.x = x;
            this.y = y;
            this.z = z;
            this.acquisitionTime = acquisitionTime;
        }
    }

    toUnit(distanceUnit) {
        if (distanceUnit !== this.unit) {
            return new Position(distanceUnit,
                distanceUnit.fromUnit(this.unit, this.x),
                distanceUnit.fromUnit(this.unit, this.y),
                distanceUnit.fromUnit(this.unit, this.z),
                this.acquisitionTime);
        }
        return this;
    }

    toString() {
        return String.format("(%.3f %.3f %.3f)%s", this.x, this.y, this.z, this.unit.toString())
    }
}

class Acceleration {
    static get earthGravity() { return 9.80665; }
    unit;
    xAccel;
    yAccel;
    zAccel;
    acquisitionTime;

    constructor(unit, xAccel, yAccel, zAccel, acquisitionTime) {
        if (arguments.length === 0) {
            this(DistanceUnit.MM, 0, 0, 0, 0);
        } else {
            this.unit = unit;
            this.xAccel = xAccel;
            this.yAccel = yAccel;
            this.zAccel = zAccel;
            this.acquisitionTime = acquisitionTime;
        }
    }

    static fromGravity(gx, gy, gz, acquisitionTime) {
        return new Acceleration(DistanceUnit.METER, gx * Acceleration.earthGravity, gy * Acceleration.earthGravity, gz * Acceleration.earthGravity, acquisitionTime);
    }

    toUnit(distanceUnit) {
        if (distanceUnit !== this.unit) {
            return new Acceleration(distanceUnit,
                distanceUnit.fromUnit(this.unit, this.xAccel),
                distanceUnit.fromUnit(this.unit, this.yAccel),
                distanceUnit.fromUnit(this.unit, this.zAccel),
                this.acquisitionTime);
        }
        return this;
    }

    toString() {
        return String.format("(%.3f %.3f %.3f)%s/s^2", this.xAccel, this.yAccel, this.zAccel, this.unit.toString());
    }
}

class BNO055IMU { // Surprisingly, still an incomplete implementation
    #parameters;
    get #defaultParameters() {
        let result = new BNO055IMU.Parameters();
        result.mode = BNO055IMU.SensorMode.DISABLED;
        return result;
    }

    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
        this.#parameters = this.#defaultParameters;
    }
    __getInternalIndex() {
        return this.#internalIndex;
    }

    initialize(parameters) {
        if (!parameters instanceof BNO055IMU.Parameters) throw new Error("initialize() parameter 'parameters' must be an instance of BNO055IMU.Parameters");
        if (parameters.mode === BNO055IMU.SensorMode.DISABLED) return true;
        this.#parameters = parameters.clone();
    }

    getParameters() {
        return this.#parameters;
    }

    static Parameters = class Parameters {
        i2cAddr = I2cAddr.create7Bit(0x28);
        mode = BNO055IMU.SensorMode.IMU;
        useExternalCrystal = true;
        temperatureUnit = BNO055IMU.TempUnit.CELSIUS;
        angleUnit = BNO055IMU.AngleUnit.RADIANS;
        accelUnit = BNO055IMU.AccelUnit.METERS_PERSEC_PERSEC;
        pitchMode = BNO055IMU.PitchMode.ANDROID;
        accelRange = BNO055IMU.AccelRange.G4;
        accelBandwidth = BNO055IMU.AccelBandwidth.HZ62_5;
        accelPowerMode = BNO055IMU.AccelPowerMode.NORMAL;
        gyroRange = BNO055IMU.GyroRange.DPS2000;
        gyroBandwidth = BNO055IMU.GyroBandwidth.HZ32;
        gyroPowerMode = BNO055IMU.GyroPowerMode.NORMAL;
        magRate = BNO055IMU.MagRate.HZ10;
        magOpMode = BNO055IMU.MagOpMode.REGULAR;
        magPowerMode = BNO055IMU.MagPowerMode.NORMAL;
        calibrationData = null;
        calibrationDataFile = null;
        accelerationIntegrationAlgorithm = null;
        loggingEnabled = false;
        loggingTag = "BNO055IMU";
        constructor() {
            this.clone = function () {
                let result = new BNO055IMU.Parameters();
                Object.assign(result, this);
                return result;
            }
        }
    }

    close() {
        throw new Error("close() is not supported");
    }

    #throwIfNotInitialized() {
        if (this.#parameters.mode === BNO055IMU.SensorMode.DISABLED) throw new Error("The IMU was not initialized. Remember to call imu.initialize(new BNO055IMU.Parameters())");
    }

    getAngularOrientation(reference, order, angleUnit) {
        this.#throwIfNotInitialized();
        if (arguments.length === 0) { // getAngularOrientation()
            let vector = imu.get("AngularOrientation");
            let angleUnit = this.#parameters.angleUnit.toAngleUnit();
            return new Orientation(AxesReference.EXTRINSIC, AxesOrder.ZYX, angleUnit,
                angleUnit.normalize(vector["FirstAngle"]),
                angleUnit.normalize(vector["SecondAngle"]),
                angleUnit.normalize(vector["ThirdAngle"]));
        } else { // getAngularOrientation(AxesReference reference, AxesOrder order, AngleUnit angleUnit)
            throw new Error("getAngularOrientation(reference, order, angleUnit) is not supported. Use getAngularOrientation() instead");
            return getAngularOrientation().toAxesReference(reference).toAxesOrder(order).toAngleUnit(angleUnit);
        }
    }

    getOverallAcceleration() {
        this.#throwIfNotInitialized();
        throw new Error("getOverallAcceleration() is not supported. Use getAcceleration() instead");
    }

    getAngularVelocity(unit) {
        this.#throwIfNotInitialized();
        if (arguments.length === 0) { // getAngularVelocity()
            return this.getAngularVelocity(this.#parameters.angleUnit.toAngleUnit());
        } else { // getAngularVelocity(AngleUnit unit)
            let rawAngularVelocity = angularVelocity.toAngleUnit(imu.get("AngularVelocity"), unit.toString());
            switch (unit) {
                case AngleUnit.DEGREES:
                case AngleUnit.RADIANS:
                    return new AngularVelocity(unit, rawAngularVelocity["XRotationRate"], rawAngularVelocity["YRotationRate"], rawAngularVelocity["ZRotationRate"], rawAngularVelocity["AcquisitionTime"]);
                default:
                    throw new Error("getAngularVelocity() parameter 'unit' must be one of the following: be left empty, 'AngleUnit.DEGREES', 'AngleUnit.RADIANS'");
            }
        }
    }

    getLinearAcceleration() {
        this.#throwIfNotInitialized();
        throw new Error("getLinearAcceleration() is not supported. Use getAcceleration() instead");
    }

    getGravity() {
        this.#throwIfNotInitialized();
        throw new Error("getGravity() is not supported");
    }

    getTemperature() {
        this.#throwIfNotInitialized();
        throw new Error("getTemperature() is not supported");
    }

    getMagneticFieldStrength() {
        this.#throwIfNotInitialized();
        throw new Error("getMagneticFieldStrength() is not supported");
    }

    getQuaternionOrientation() {
        this.#throwIfNotInitialized();
        throw new Error("getQuaternionOrientation() is not supported");
    }

    getPosition() {
        this.#throwIfNotInitialized();
        let result = imu.get("Position");
        return new Position(DistanceUnit.METER, result["X"], result["Y"], result["Z"], result["AcquisitionTime"]);
    }

    getVelocity() {
        this.#throwIfNotInitialized();
        throw new Error("getVelocity() is not supported");
    }

    getAcceleration() {
        this.#throwIfNotInitialized();
        let result = imu.get("Acceleration");
        return new Acceleration(DistanceUnit.METER, result["XAccel"], result["YAccel"], result["ZAccel"], result["AcquisitionTime"]);
    }

    startAccelerationIntegration(initialPosition, initialVelocity, msPollInterval) {
        this.#throwIfNotInitialized();
        throw new Error("startAccelerationIntegration() is not supported. You may directly use getAcceleration()");
    }

    stopAccelerationIntegration() {
        this.#throwIfNotInitialized();
        throw new Error("stopAccelerationIntegration() is not supported");
    }

    static get I2CADDR_UNSPECIFIED() { return I2cAddr.zero(); }
    static get I2CADDR_DEFAULT() { return I2cAddr.create7Bit(0x28); }
    static get I2CADDR_ALTERNATE() { return I2cAddr.create7Bit(0x29); }



    static TempUnit = (function () {
        function TempUnit(i) {
            this.bVal = i;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.TempUnit.CELSIUS: return "CELSIUS";
                    case BNO055IMU.TempUnit.FARENHEIT: return "FARENHEIT";
                }
            }
        }
        TempUnit.CELSIUS = new TempUnit(0);
        TempUnit.FARENHEIT = new TempUnit(1);
        return TempUnit;
    }());
    static AngleUnit = (function () {
        function AngleUnit(i) {
            this.bVal = i;
            this.toAngleUnit = function () { return this === BNO055IMU.AngleUnit.DEGREES ? window.AngleUnitRef.DEGREES : window.AngleUnitRef.RADIANS; }
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.AngleUnit.DEGREES: return "DEGREES";
                    case BNO055IMU.AngleUnit.RADIANS: return "RADIANS";
                }
            }
        }
        AngleUnit.DEGREES = new AngleUnit(0);
        AngleUnit.RADIANS = new AngleUnit(1);
        AngleUnit.fromAngleUnit = function (globalAngleUnit) {
            switch (globalAngleUnit) {
                case window.AngleUnitRef.DEGREES: return BNO055IMU.AngleUnit.DEGREES;
                case window.AngleUnitRef.RADIANS: return BNO055IMU.AngleUnit.RADIANS;
                default: throw new Error("fromAngleUnit() parameter 'angleUnit' must be 'AngleUnit.DEGREES' or 'AngleUnit.RADIANS'");
            }
        }
        return AngleUnit;
    }());
    static AccelUnit = (function () {
        function AccelUnit(i) {
            this.bVal = i;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.AccelUnit.METERS_PERSEC_PERSEC: return "METERS_PERSEC_PERSEC";
                    case BNO055IMU.AccelUnit.MILLI_EARTH_GRAVITY: return "MILLI_EARTH_GRAVITY";
                }
            }
        }
        AccelUnit.METERS_PERSEC_PERSEC = new AccelUnit(0);
        AccelUnit.MILLI_EARTH_GRAVITY = new AccelUnit(1);
        return AccelUnit;
    }());
    static PitchMode = (function () {
        function PitchMode(i) {
            this.bVal = i;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.PitchMode.WINDOWS: return "WINDOWS";
                    case BNO055IMU.PitchMode.ANDROID: return "ANDROID";
                }
            }
        }
        PitchMode.WINDOWS = new PitchMode(0);
        PitchMode.ANDROID = new PitchMode(1);
        return PitchMode;
    }());
    static GyroRange = (function () {
        function GyroRange(i) {
            this.bVal = i << 0;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.GyroRange.DPS2000: return "DPS2000";
                    case BNO055IMU.GyroRange.DPS1000: return "DPS1000";
                    case BNO055IMU.GyroRange.DPS500: return "DPS500";
                    case BNO055IMU.GyroRange.DPS250: return "DPS250";
                    case BNO055IMU.GyroRange.DPS125: return "DPS125";
                }
            }
        }
        GyroRange.DPS2000 = new GyroRange(0);
        GyroRange.DPS1000 = new GyroRange(1);
        GyroRange.DPS500 = new GyroRange(2);
        GyroRange.DPS250 = new GyroRange(3);
        GyroRange.DPS125 = new GyroRange(4);
        return GyroRange;
    }());
    static GyroBandwidth = (function () {
        function GyroBandwidth(i) {
            this.bVal = i << 3;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.GyroBandwidth.HZ523: return "HZ523";
                    case BNO055IMU.GyroBandwidth.HZ230: return "HZ230";
                    case BNO055IMU.GyroBandwidth.HZ116: return "HZ116";
                    case BNO055IMU.GyroBandwidth.HZ47: return "HZ47";
                    case BNO055IMU.GyroBandwidth.HZ23: return "HZ23";
                    case BNO055IMU.GyroBandwidth.HZ12: return "HZ12";
                    case BNO055IMU.GyroBandwidth.HZ64: return "HZ64";
                    case BNO055IMU.GyroBandwidth.HZ32: return "HZ32";
                }
            }
        }
        GyroBandwidth.HZ523 = new GyroBandwidth(0);
        GyroBandwidth.HZ230 = new GyroBandwidth(1);
        GyroBandwidth.HZ116 = new GyroBandwidth(2);
        GyroBandwidth.HZ47 = new GyroBandwidth(3);
        GyroBandwidth.HZ23 = new GyroBandwidth(4);
        GyroBandwidth.HZ12 = new GyroBandwidth(5);
        GyroBandwidth.HZ64 = new GyroBandwidth(6);
        GyroBandwidth.HZ32 = new GyroBandwidth(7);
        return GyroBandwidth;
    }());
    static GyroPowerMode = (function () {
        function GyroPowerMode(i) {
            this.bVal = i << 0;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.GyroPowerMode.NORMAL: return "NORMAL";
                    case BNO055IMU.GyroPowerMode.FAST: return "FAST";
                    case BNO055IMU.GyroPowerMode.DEEP: return "DEEP";
                    case BNO055IMU.GyroPowerMode.SUSPEND: return "SUSPEND";
                    case BNO055IMU.GyroPowerMode.ADVANCED: return "ADVANCED";
                }
            }
        }
        GyroPowerMode.NORMAL = new GyroPowerMode(0);
        GyroPowerMode.FAST = new GyroPowerMode(1);
        GyroPowerMode.DEEP = new GyroPowerMode(2);
        GyroPowerMode.SUSPEND = new GyroPowerMode(3);
        GyroPowerMode.ADVANCED = new GyroPowerMode(4);
        return GyroPowerMode;
    }());
    static AccelRange = (function () {
        function AccelRange(i) {
            this.bVal = i << 0;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.AccelRange.G2: return "G2";
                    case BNO055IMU.AccelRange.G4: return "G4";
                    case BNO055IMU.AccelRange.G8: return "G8";
                    case BNO055IMU.AccelRange.G16: return "G16";
                }
            }
        }
        AccelRange.G2 = new AccelRange(0);
        AccelRange.G4 = new AccelRange(1);
        AccelRange.G8 = new AccelRange(2);
        AccelRange.G16 = new AccelRange(3);
        return AccelRange;
    }());
    static AccelBandwidth = (function () {
        function AccelBandwidth(i) {
            this.bVal = i << 2;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.AccelBandwidth.HZ7_81: return "HZ7_81";
                    case BNO055IMU.AccelBandwidth.HZ15_63: return "HZ15_63";
                    case BNO055IMU.AccelBandwidth.HZ31_25: return "HZ31_25";
                    case BNO055IMU.AccelBandwidth.HZ62_5: return "HZ62_5";
                    case BNO055IMU.AccelBandwidth.HZ125: return "HZ125";
                    case BNO055IMU.AccelBandwidth.HZ250: return "HZ250";
                    case BNO055IMU.AccelBandwidth.HZ500: return "HZ500";
                    case BNO055IMU.AccelBandwidth.HZ1000: return "HZ1000";
                }
            }
        }
        AccelBandwidth.HZ7_81 = new AccelBandwidth(0);
        AccelBandwidth.HZ15_63 = new AccelBandwidth(1);
        AccelBandwidth.HZ31_25 = new AccelBandwidth(2);
        AccelBandwidth.HZ62_5 = new AccelBandwidth(3);
        AccelBandwidth.HZ125 = new AccelBandwidth(4);
        AccelBandwidth.HZ250 = new AccelBandwidth(5);
        AccelBandwidth.HZ500 = new AccelBandwidth(6);
        AccelBandwidth.HZ1000 = new AccelBandwidth(7);
        return AccelBandwidth;
    }());
    static AccelPowerMode = (function () {
        function AccelPowerMode(i) {
            this.bVal = i << 5;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.AccelPowerMode.NORMAL: return "NORMAL";
                    case BNO055IMU.AccelPowerMode.SUSPEND: return "SUSPEND";
                    case BNO055IMU.AccelPowerMode.LOW1: return "LOW1";
                    case BNO055IMU.AccelPowerMode.STANDBY: return "STANDBY";
                    case BNO055IMU.AccelPowerMode.LOW2: return "LOW2";
                    case BNO055IMU.AccelPowerMode.DEEP: return "DEEP";
                }
            }
        }
        AccelPowerMode.NORMAL = new AccelPowerMode(0);
        AccelPowerMode.SUSPEND = new AccelPowerMode(1);
        AccelPowerMode.LOW1 = new AccelPowerMode(2);
        AccelPowerMode.STANDBY = new AccelPowerMode(3);
        AccelPowerMode.LOW2 = new AccelPowerMode(4);
        AccelPowerMode.DEEP = new AccelPowerMode(5);
        return AccelPowerMode;
    }());
    static MagRate = (function () {
        function MagRate(i) {
            this.bVal = i << 0;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.MagRate.HZ2: return "HZ2";
                    case BNO055IMU.MagRate.HZ6: return "HZ6";
                    case BNO055IMU.MagRate.HZ8: return "HZ8";
                    case BNO055IMU.MagRate.HZ10: return "HZ10";
                    case BNO055IMU.MagRate.HZ15: return "HZ15";
                    case BNO055IMU.MagRate.HZ20: return "HZ20";
                    case BNO055IMU.MagRate.HZ25: return "HZ25";
                    case BNO055IMU.MagRate.HZ30: return "HZ30";
                }
            }
        }
        MagRate.HZ2 = new MagRate(0);
        MagRate.HZ6 = new MagRate(1);
        MagRate.HZ8 = new MagRate(2);
        MagRate.HZ10 = new MagRate(3);
        MagRate.HZ15 = new MagRate(4);
        MagRate.HZ20 = new MagRate(5);
        MagRate.HZ25 = new MagRate(6);
        MagRate.HZ30 = new MagRate(7);
        return MagRate;
    }());
    static MagOpMode = (function () {
        function MagOpMode(i) {
            this.bVal = i << 3;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.MagOpMode.LOW: return "LOW";
                    case BNO055IMU.MagOpMode.REGULAR: return "REGULAR";
                    case BNO055IMU.MagOpMode.ENHANCED: return "ENHANCED";
                    case BNO055IMU.MagOpMode.HIGH: return "HIGH";
                }
            }
        }
        MagOpMode.LOW = new MagOpMode(0);
        MagOpMode.REGULAR = new MagOpMode(1);
        MagOpMode.ENHANCED = new MagOpMode(2);
        MagOpMode.HIGH = new MagOpMode(3);
        return MagOpMode;
    }());
    static MagPowerMode = (function () {
        function MagPowerMode(i) {
            this.bVal = i << 5;
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.MagPowerMode.NORMAL: return "NORMAL";
                    case BNO055IMU.MagPowerMode.SLEEP: return "SLEEP";
                    case BNO055IMU.MagPowerMode.SUSPEND: return "SUSPEND";
                    case BNO055IMU.MagPowerMode.FORCE: return "FORCE";
                }
            }
        }
        MagPowerMode.NORMAL = new MagPowerMode(0);
        MagPowerMode.SLEEP = new MagPowerMode(1);
        MagPowerMode.SUSPEND = new MagPowerMode(2);
        MagPowerMode.FORCE = new MagPowerMode(3);
        return MagPowerMode;
    }());
    static SystemStatus = (function () {
        function SystemStatus(value) {
            this.bVal = value;
            // some methods not implemented
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.SystemStatus.UNKNOWN: return "UNKNOWN";
                    case BNO055IMU.SystemStatus.IDLE: return "IDLE";
                    case BNO055IMU.SystemStatus.SYSTEM_ERROR: return "SYSTEM_ERROR";
                    case BNO055IMU.SystemStatus.INITIALIZING_PERIPHERALS: return "INITIALIZING_PERIPHERALS";
                    case BNO055IMU.SystemStatus.SYSTEM_INITIALIZATION: return "SYSTEM_INITIALIZATION";
                    case BNO055IMU.SystemStatus.SELF_TEST: return "SELF_TEST";
                    case BNO055IMU.SystemStatus.RUNNING_FUSION: return "RUNNING_FUSION";
                    case BNO055IMU.SystemStatus.RUNNING_NO_FUSION: return "RUNNING_NO_FUSION";
                }
            }
        }
        SystemStatus.UNKNOWN = new SystemStatus(-1);
        SystemStatus.IDLE = new SystemStatus(0);
        SystemStatus.SYSTEM_ERROR = new SystemStatus(1);
        SystemStatus.INITIALIZING_PERIPHERALS = new SystemStatus(2);
        SystemStatus.SYSTEM_INITIALIZATION = new SystemStatus(3);
        SystemStatus.SELF_TEST = new SystemStatus(4);
        SystemStatus.RUNNING_FUSION = new SystemStatus(5);
        SystemStatus.RUNNING_NO_FUSION = new SystemStatus(6);
        return SystemStatus;
    }());
    static SystemError = (function () {
        function SystemError(value) {
            this.bVal = value;
            // some methods not implemented
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.SystemError.UNKNOWN: return "UNKNOWN";
                    case BNO055IMU.SystemError.NO_ERROR: return "NO_ERROR";
                    case BNO055IMU.SystemError.PERIPHERAL_INITIALIZATION_ERROR: return "PERIPHERAL_INITIALIZATION_ERROR";
                    case BNO055IMU.SystemError.SYSTEM_INITIALIZATION_ERROR: return "SYSTEM_INITIALIZATION_ERROR";
                    case BNO055IMU.SystemError.SELF_TEST_FAILED: return "SELF_TEST_FAILED";
                    case BNO055IMU.SystemError.REGISTER_MAP_OUT_OF_RANGE: return "REGISTER_MAP_OUT_OF_RANGE";
                    case BNO055IMU.SystemError.REGISTER_MAP_ADDRESS_OUT_OF_RANGE: return "REGISTER_MAP_ADDRESS_OUT_OF_RANGE";
                    case BNO055IMU.SystemError.REGISTER_MAP_WRITE_ERROR: return "REGISTER_MAP_WRITE_ERROR";
                    case BNO055IMU.SystemError.LOW_POWER_MODE_NOT_AVAILABLE: return "LOW_POWER_MODE_NOT_AVAILABLE";
                    case BNO055IMU.SystemError.ACCELEROMETER_POWER_MODE_NOT_AVAILABLE: return "ACCELEROMETER_POWER_MODE_NOT_AVAILABLE";
                    case BNO055IMU.SystemError.FUSION_CONFIGURATION_ERROR: return "FUSION_CONFIGURATION_ERROR";
                    case BNO055IMU.SystemError.SENSOR_CONFIGURATION_ERROR: return "SENSOR_CONFIGURATION_ERROR";
                }
            }
        }
        SystemError.UNKNOWN = new SystemError(-1);
        SystemError.NO_ERROR = new SystemError(0);
        SystemError.PERIPHERAL_INITIALIZATION_ERROR = new SystemError(1);
        SystemError.SYSTEM_INITIALIZATION_ERROR = new SystemError(2);
        SystemError.SELF_TEST_FAILED = new SystemError(3);
        SystemError.REGISTER_MAP_OUT_OF_RANGE = new SystemError(4);
        SystemError.REGISTER_MAP_ADDRESS_OUT_OF_RANGE = new SystemError(5);
        SystemError.REGISTER_MAP_WRITE_ERROR = new SystemError(6);
        SystemError.LOW_POWER_MODE_NOT_AVAILABLE = new SystemError(7);
        SystemError.ACCELEROMETER_POWER_MODE_NOT_AVAILABLE = new SystemError(8);
        SystemError.FUSION_CONFIGURATION_ERROR = new SystemError(9);
        SystemError.SENSOR_CONFIGURATION_ERROR = new SystemError(10);
        return SystemError;
    }());
    static CalibrationStatus = class CalibrationStatus {
        #calibrationStatus;
        get calibrationStatus() { return this.#calibrationStatus; }

        constructor(calibrationStatus) {
            this.#calibrationStatus = calibrationStatus;
        }

        toString() {
            return String.format("s%d g%d a%d m%d", (this.#calibrationStatus >> 6) & 0x03, (this.#calibrationStatus >> 4) & 0x03, (this.#calibrationStatus >> 2) & 0x03, (this.#calibrationStatus >> 0) & 0x03);
        }
    };
    static SensorMode = (function () {
        function SensorMode(i) {
            this.bVal = i;
            // some methods not implemented
            this.toString = function () {
                switch (this) {
                    default:
                    case BNO055IMU.SensorMode.CONFIG: return "CONFIG";
                    case BNO055IMU.SensorMode.ACCONLY: return "ACCOPTONLY";
                    case BNO055IMU.SensorMode.MAGONLY: return "MAGONLY";
                    case BNO055IMU.SensorMode.GYRONLY: return "GYRONLY";
                    case BNO055IMU.SensorMode.ACCMAG: return "ACCMAG";
                    case BNO055IMU.SensorMode.ACCGYRO: return "ACCGYRO";
                    case BNO055IMU.SensorMode.MAGGYRO: return "MAGGYRO";
                    case BNO055IMU.SensorMode.AMG: return "AMG";
                    case BNO055IMU.SensorMode.IMU: return "IMU";
                    case BNO055IMU.SensorMode.COMPASS: return "COMPASS";
                    case BNO055IMU.SensorMode.M4G: return "M4G";
                    case BNO055IMU.SensorMode.NDOF_FMC_OFF: return "NDOF_FMC_OFF";
                    case BNO055IMU.SensorMode.NDOF: return "NDOF";
                    case BNO055IMU.SensorMode.DISABLED: return "DISABLED";
                }
            }
        }
        SensorMode.CONFIG = new SensorMode(0x00);
        SensorMode.ACCONLY = new SensorMode(0x01);
        SensorMode.MAGONLY = new SensorMode(0x02);
        SensorMode.GYRONLY = new SensorMode(0x03);
        SensorMode.ACCMAG = new SensorMode(0x04);
        SensorMode.ACCGYRO = new SensorMode(0x05);
        SensorMode.MAGGYRO = new SensorMode(0x06);
        SensorMode.AMG = new SensorMode(0x07);
        SensorMode.IMU = new SensorMode(0x08);
        SensorMode.COMPASS = new SensorMode(0x09);
        SensorMode.M4G = new SensorMode(0x0A);
        SensorMode.NDOF_FMC_OFF = new SensorMode(0x0B);
        SensorMode.NDOF = new SensorMode(0x0C);
        SensorMode.DISABLED = new SensorMode(-1);
        return SensorMode;
    }());

    static CalibrationData = class CalibrationData {
        dxAccel; dyAccel; dzAccel;
        dxMag; dyMag; dzMag;
        dxGyro; dyGyro; dzGyro;
        radiusAccel; radiusMag;

        serialize() {
            return JSON.stringify(this);
        }
        static deserialize(data) {
            return JSON.parse(data);
        }
        clone() {
            let result = new BNO055IMU.CalibrationData();
            Object.assign(result, this);
            return result;
        }
    }
}

/**************** Not yet implemented Hardware ****************/

class TouchSensor {
    constructor() { throw new Error("TouchSensor is not yet implemented"); }
}

class Servo {
    constructor() { throw new Error("Servo is not yet implemented"); }
}

/**************** Gamepad Implementation ****************/

class Gamepad { // Note that this is a shallow interface
    #internalIndex;
    constructor(internalIndex) {
        this.#internalIndex = internalIndex;
    }

    get a() {
        return gamepad.boolValue(this.#internalIndex, 0, "Both");
    }
	atRest() {
        return gamepad.boolValue(this.#internalIndex, -1, "Both");
    }
	get b() {
        return gamepad.boolValue(this.#internalIndex, 1, "Both");
    }
	get back() {
        return gamepad.boolValue(this.#internalIndex, 8, "Both");
    }
	get circle() {
        return gamepad.boolValue(this.#internalIndex, 1, "P");
    }
	get cross() {
        return gamepad.boolValue(this.#internalIndex, 0, "P");
    }
	get dpad_down() {
        return gamepad.boolValue(this.#internalIndex, 13, "Both");
    }
	get dpad_left() {
        return gamepad.boolValue(this.#internalIndex, 14, "Both");
    }
	get dpad_right() {
        return gamepad.boolValue(this.#internalIndex, 15, "Both");
    }
	get dpad_up() {
        return gamepad.boolValue(this.#internalIndex, 12, "Both");
    }
	get guide() {
        return gamepad.boolValue(this.#internalIndex, 16, "Xbox");
    }
	get left_bumper() {
        return gamepad.boolValue(this.#internalIndex, 4, "Both");
    }
	get left_stick_button() {
        return gamepad.boolValue(this.#internalIndex, 10, "Both");
    }
	get left_stick_x() {
        return gamepad.numberValue(this.#internalIndex, 0);
    }
	get left_stick_y() {
        return gamepad.numberValue(this.#internalIndex, 1);
    }
	get left_trigger() {
        return gamepad.numberValue(this.#internalIndex, 6);
    }
	get options() {
        return gamepad.boolValue(this.#internalIndex, 9, "P");
    }
	get ps() {
        return gamepad.boolValue(this.#internalIndex, 16, "P");
    }
	get right_bumper() {
        return gamepad.boolValue(this.#internalIndex, 5, "Both");
    }
	get right_stick_button() {
        return gamepad.boolValue(this.#internalIndex, 11, "Both");
    }
	get right_stick_x() {
        return gamepad.numberValue(this.#internalIndex, 2);
    }
	get right_stick_y() {
        return gamepad.numberValue(this.#internalIndex, 3);
    }
	get right_trigger() {
        return gamepad.numberValue(this.#internalIndex, 7);
    }
	get share() {
        return gamepad.boolValue(this.#internalIndex, 8, "P");
    }
	get square() {
        return gamepad.boolValue(this.#internalIndex, 2, "P");
    }
	get start() {
        return gamepad.boolValue(this.#internalIndex, 9, "Both");
    }
	get touchpad() {
        return gamepad.boolValue(this.#internalIndex, 17, "P");
    }
	get triangle() {
        return gamepad.boolValue(this.#internalIndex, 3, "P");
    }
	get x() {
        return gamepad.boolValue(this.#internalIndex, 2, "Both");
    }
	get y() {
        return gamepad.boolValue(this.#internalIndex, 3, "Both");
    }
}

/**************** HardwareMap Implementation ****************/

const hardwareMap = {
    get: function (deviceType, deviceName) {
        switch (deviceType) {
            case DcMotorSimple:
            case DcMotor:
            case DcMotorEx:
                let motorIndex = robotConfig["motors"].findIndex(motor => motor.name === deviceName);

                if (motorIndex === -1) {
                    let validMotors = robotConfig["motors"].map(motor => "'" + motor.name + "'");
                    throw new Error("There is no device with name '" + deviceName + "' and type '" + deviceType.name + ".class' in the hardware configuration.\n"
                        + "The config includes the following motors: " + validMotors.join(", "));
                } else {
                    switch (deviceType) {
                        case DcMotorSimple:
                            return new DcMotorSimple(motorIndex);
                        case DcMotor:
                            return new DcMotor(motorIndex);
                        case DcMotorEx:
                            return new DcMotorEx(motorIndex);
                        default:
                            throw new Error("Something went wrong with internal hardwareMap.get(DcMotorVariant)");
                    }
                }
            case ColorSensor:
            case NormalizedColorSensor:
            case LightSensor:
            case OpticalDistanceSensor:
            case ColorRangeSensor:
            case RevColorSensorV3:
            case LynxI2cColorRangeSensor:
                let colorSensorIndex = robotConfig["colorSensor"].findIndex(colorSensor => colorSensor.name === deviceName);

                if (colorSensorIndex === -1) {
                    let validColorSensors = robotConfig["colorSensor"].map(colorSensor => "'" + colorSensor.name + "'");
                    throw new Error("There is no device with name '" + deviceName + "' and type '" + deviceType.name + ".class' in the hardware configuration.\n"
                        + "The config includes the following color sensors: " + validColorSensors.join(", "));
                } else {
                    switch (deviceType) {
                        case ColorSensor:
                            return new ColorSensor(colorSensorIndex);
                        case NormalizedColorSensor:
                            return new NormalizedColorSensor(colorSensorIndex);
                        case LightSensor:
                            return new LightSensor(colorSensorIndex);
                        case OpticalDistanceSensor:
                            return new OpticalDistanceSensor(colorSensorIndex);
                        case ColorRangeSensor:
                            return new ColorRangeSensor(colorSensorIndex);
                        case RevColorSensorV3:
                            return new RevColorSensorV3(colorSensorIndex);
                        case LynxI2cColorRangeSensor:
                            return new LynxI2cColorRangeSensor(colorSensorIndex);
                        default:
                            throw new Error("Something went wrong with internal hardwareMap.get(ColorSensorVariant)");
                    }
                }
            case DistanceSensor:
            case Rev2mDistanceSensor:
            case ModernRoboticsI2cRangeSensor:
                let distanceSensorIndex = robotConfig["distanceSensor"].findIndex(distanceSensor => distanceSensor.name === deviceName);

                if (distanceSensorIndex === -1) {
                    let validDistanceSensors = robotConfig["distanceSensor"].map(distanceSensor => "'" + distanceSensor.name + "'");
                    throw new Error("There is no device with name '" + deviceName + "' and type '" + deviceType.name + ".class' in the hardware configuration.\n"
                        + "The config includes the following distance sensors: " + validDistanceSensors.join(", "));
                } else {
                    switch (deviceType) {
                        case DistanceSensor:
                            return new DistanceSensor(distanceSensorIndex, false);
                        case Rev2mDistanceSensor:
                            return new Rev2mDistanceSensor(distanceSensorIndex);
                        case ModernRoboticsI2cRangeSensor:
                            return new ModernRoboticsI2cRangeSensor(distanceSensorIndex);
                        default:
                            throw new Error("Something went wrong with internal hardwareMap.get(DistanceSensorVariant)");
                    }
                }
            case BNO055IMU:
                let bno055imuIndex = robotConfig["IMU"].findIndex(imu => imu.name === deviceName);

                if (bno055imuIndex === -1) {
                    let validIMUs = robotConfig["IMU"].map(imu => "'" + imu.name + "'");
                    throw new Error("There is no device with name '" + deviceName + "' and type '" + deviceType.name + ".class' in the hardware configuration.\n"
                        + "The config includes the following IMUs: " + validIMUs.join(", "));
                } else {
                    switch (deviceType) {
                        case BNO055IMU:
                            return new BNO055IMU(bno055imuIndex);
                        default:
                            throw new Error("Something went wrong with internal hardwareMap.get(BNO055IMU)");
                    }
                }
            case TouchSensor:
            case Servo:
                throw new Error("Hardware configuration device type '" + deviceType.name + "' is not yet supported at this time");
            default:
                throw new Error("Hardware configuration device type '" + deviceType.name + "' is not supported");
        }
    }
}