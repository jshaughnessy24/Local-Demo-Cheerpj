// Handy constants for conversion methods
const C0 = 1;
const C1 = C0 * 1000;
const C2 = C1 * 1000;
const C3 = C2 * 1000;
const C4 = C3 * 60;
const C5 = C4 * 60;
const C6 = C5 * 24;

const MAX = Number.MAX_SAFE_INTEGER;

let TimeUnit = (function () {
    function TimeUnit() { }

    function x(d, m, over) {
        if (d > +over) return Number.MAX_SAFE_INTEGER;
        if (d < -over) return Number.MIN_SAFE_INTEGER;
        return d * m;
    }

    // Note that JS does not have a lot of precision to deal with nanoseconds
    TimeUnit.NANOSECONDS = new TimeUnit();
        TimeUnit.NANOSECONDS.toNanos = function(d)   { return d; }
        TimeUnit.NANOSECONDS.toMicros = function(d)  { return d / (C1 / C0); }
        TimeUnit.NANOSECONDS.toMillis = function(d)  { return d / (C2 / C0); }
        TimeUnit.NANOSECONDS.toSeconds = function(d) { return d / (C3 / C0); }
        TimeUnit.NANOSECONDS.toMinutes = function(d) { return d / (C4 / C0); }
        TimeUnit.NANOSECONDS.toHours = function(d)   { return d / (C5 / C0); }
        TimeUnit.NANOSECONDS.toDays = function(d)    { return d / (C6 / C0); }
        TimeUnit.NANOSECONDS.convert = function(d,u) { return u.toNanos(d); }
    
    TimeUnit.MICROSECONDS = new TimeUnit();
        TimeUnit.MICROSECONDS.toNanos = function(d)   { return x(d, C1 / C0, MAX / (C1 / C0)); }
        TimeUnit.MICROSECONDS.toMicros = function(d)  { return d; }
        TimeUnit.MICROSECONDS.toMillis = function(d)  { return d / (C2 / C1); }
        TimeUnit.MICROSECONDS.toSeconds = function(d) { return d / (C3 / C1); }
        TimeUnit.MICROSECONDS.toMinutes = function(d) { return d / (C4 / C1); }
        TimeUnit.MICROSECONDS.toHours = function(d)   { return d / (C5 / C1); }
        TimeUnit.MICROSECONDS.toDays = function(d)    { return d / (C6 / C1); }
        TimeUnit.MICROSECONDS.convert = function(d,u) { return u.toMicros(d); }
    
    TimeUnit.MILLISECONDS = new TimeUnit();
        TimeUnit.MILLISECONDS.toNanos = function(d)   { return x(d, C2 / C0, MAX / (C2 / C0)); }
        TimeUnit.MILLISECONDS.toMicros = function(d)  { return x(d, C2 / C1, MAX / (C2 / C1)); }
        TimeUnit.MILLISECONDS.toMillis = function(d)  { return d; }
        TimeUnit.MILLISECONDS.toSeconds = function(d) { return d / (C3 / C2); }
        TimeUnit.MILLISECONDS.toMinutes = function(d) { return d / (C4 / C2); }
        TimeUnit.MILLISECONDS.toHours = function(d)   { return d / (C5 / C2); }
        TimeUnit.MILLISECONDS.toDays = function(d)    { return d / (C6 / C2); }
        TimeUnit.MILLISECONDS.convert = function(d,u) { return u.toMillis(d); }

    TimeUnit.SECONDS = new TimeUnit();
        TimeUnit.SECONDS.toNanos = function(d)   { return x(d, C3 / C0, MAX / (C3 / C0)); }
        TimeUnit.SECONDS.toMicros = function(d)  { return x(d, C3 / C1, MAX / (C3 / C1)); }
        TimeUnit.SECONDS.toMillis = function(d)  { return x(d, C3 / C2, MAX / (C3 / C2)); }
        TimeUnit.SECONDS.toSeconds = function(d) { return d; }
        TimeUnit.SECONDS.toMinutes = function(d) { return d / (C4 / C3); }
        TimeUnit.SECONDS.toHours = function(d)   { return d / (C5 / C3); }
        TimeUnit.SECONDS.toDays = function(d)    { return d / (C6 / C3); }
        TimeUnit.SECONDS.convert = function(d,u) { return u.toSeconds(d); }

    TimeUnit.MINUTES = new TimeUnit();
        TimeUnit.MINUTES.toNanos = function(d)   { return x(d, C4 / C0, MAX / (C4 / C0)); }
        TimeUnit.MINUTES.toMicros = function(d)  { return x(d, C4 / C1, MAX / (C4 / C1)); }
        TimeUnit.MINUTES.toMillis = function(d)  { return x(d, C4 / C2, MAX / (C4 / C2)); }
        TimeUnit.MINUTES.toSeconds = function(d) { return x(d, C4 / C3, MAX / (C4 / C3)); }
        TimeUnit.MINUTES.toMinutes = function(d) { return d; }
        TimeUnit.MINUTES.toHours = function(d)   { return d / (C5 / C4); }
        TimeUnit.MINUTES.toDays = function(d)    { return d / (C6 / C4); }
        TimeUnit.MINUTES.convert = function(d,u) { return u.toMinutes(d); }
    
    TimeUnit.HOURS = new TimeUnit();
        TimeUnit.HOURS.toNanos = function(d)   { return x(d, C5 / C0, MAX / (C5 / C0)); }
        TimeUnit.HOURS.toMicros = function(d)  { return x(d, C5 / C1, MAX / (C5 / C1)); }
        TimeUnit.HOURS.toMillis = function(d)  { return x(d, C5 / C2, MAX / (C5 / C2)); }
        TimeUnit.HOURS.toSeconds = function(d) { return x(d, C5 / C3, MAX / (C5 / C3)); }
        TimeUnit.HOURS.toMinutes = function(d) { return x(d, C5 / C4, MAX / (C5 / C4)); }
        TimeUnit.HOURS.toHours = function(d)   { return d; }
        TimeUnit.HOURS.toDays = function(d)    { return d / (C6 / C5); }
        TimeUnit.HOURS.convert = function(d,u) { return u.toHours(d); }
    
    TimeUnit.DAYS = new TimeUnit();
        TimeUnit.DAYS.toNanos = function(d)   { return x(d, C6 / C0, MAX / (C6 / C0)); }
        TimeUnit.DAYS.toMicros = function(d)  { return x(d, C6 / C1, MAX / (C6 / C1)); }
        TimeUnit.DAYS.toMillis = function(d)  { return x(d, C6 / C2, MAX / (C6 / C2)); }
        TimeUnit.DAYS.toSeconds = function(d) { return x(d, C6 / C3, MAX / (C6 / C3)); }
        TimeUnit.DAYS.toMinutes = function(d) { return x(d, C6 / C4, MAX / (C6 / C4)); }
        TimeUnit.DAYS.toHours = function(d)   { return x(d, C6 / C5, MAX / (C6 / C5)); }
        TimeUnit.DAYS.toDays = function(d)    { return d; }
        TimeUnit.DAYS.convert = function(d,u) { return u.toDays(d); }

    /* timedWait(), timedJoin(), and sleep() are not implemented */
    
    return TimeUnit;
}());

export { TimeUnit }