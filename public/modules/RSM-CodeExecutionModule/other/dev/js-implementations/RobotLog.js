// super simple RobotLog mock

const RobotLog = {
    v: function(messageOrFormat, ...nullOrArgs) {
        if (nullOrArgs.length == 0) { // RobotLog.v(String message)
            this.internalLog("VERBOSE", "RobotCoreVRS", messageOrFormat);
        } else { // RobotLog.v(String format, Object... args)
            this.v(String.format(messageOrFormat, ...nullOrArgs));
        }
    },
    internalLog: function(priority, tag, messageOrThrowable, nullOrMessage) {
        if (nullOrMessage === undefined) { // RobotLog.internalLog(int priority, String tag, String message)
            console.log(priority, tag, messageOrThrowable);
        } else { // RobotLog.internalLog(int priority, String tag, Throwable throwable, String message)
            this.internalLog(priority, tag, nullOrMessage);
            console.error(messageOrThrowable);
        }
    }
}

export { RobotLog }