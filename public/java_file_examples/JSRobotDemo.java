import java.util.concurrent.TimeUnit;

public class JSRobotDemo {
    // Native method to run javaScript code
    public static native void runJSCode(String s);
    public static native double encoderVal(int id);


    public JSRobotDemo() {

    }

    public static void main(String[] args) {

       // System.out.println("Hello");
          runJSCode("""
    
        async function runOpMode() {
motor.setProperty([1], 'Direction', ['REVERSE']);
motor.setProperty([3], 'Direction', ['REVERSE']);
await linearOpMode.waitForStart();

}
await runOpMode();

             
        """);

        runJSCode("""
        if (linearOpMode.opModeIsActive()) {
motor.setProperty([0, 1], 'Power', [1, 1]);
telemetry.addData('Driving', 'Forward');
telemetry.update();



}

        
        
        """);

while(true) {
    double val = encoderVal(0);
    if (val > 10000) {
        break;
    }

    
    
}


runJSCode("""
motor.setProperty([0, 1], 'Power', [0, 0]);
console.log('ended at 10000 encoder rotations');
     
        """);
    }
}