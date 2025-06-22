import { TimeUnit } from "./TimeUnit.js";
import { RobotLog } from "./RobotLog.js";

export class ElapsedTime {
    // Types and constants
    static Resolution = (function () { // enum Resolution
        function Resolution() { }
        Resolution.SECONDS = new Resolution();
        Resolution.MILLISECONDS = new Resolution();
        return Resolution;
    }());
    /* Note that we use ms resolution in JS, and things have been renamed to reflect so */
    static get MILLIS_IN_SECOND() { return 1000; }
    static get MILLIS_IN_MILLI() { return 1; }

    // State
    #msStartTime;
    #resolution;

    // Construction
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

    // Operations
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
            return (this.#msNow() - this.#msStartTime) / this.#resolution; // time()
        return unit.convert(this.milliseconds(), TimeUnit.MILLISECONDS); // time(unit)
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

    // Utility
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