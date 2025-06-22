import java.util.concurrent.TimeUnit;


public class JSRobotDemo extends OpModeBase{
    // Native method to run javaScript code
    private DcMotor frontLeft;
    private DcMotor frontRight;

    private DcMotor backLeft;
    private DcMotor backRight;

 
    //public static native void runJSCode(String s);

    



    public void runOpMode() {
     
        frontLeft  = hardwareMap.get(DcMotor.class, "frontLeft");
        frontRight = hardwareMap.get(DcMotor.class, "frontRight");
        
        backLeft = hardwareMap.get(DcMotor.class, "backLeft");
        backRight = hardwareMap.get(DcMotor.class, "backRight");


        frontLeft.setDirection(DcMotor.Direction.FORWARD);
        backLeft.setDirection(DcMotor.Direction.FORWARD);

        frontRight.setDirection(DcMotor.Direction.REVERSE);
        backRight.setDirection(DcMotor.Direction.REVERSE);

       waitForStart();



        frontLeft.setPower(1);
        frontRight.setPower(1);
        backLeft.setPower(1);
        backRight.setPower(1);


        while(frontLeft.getCurrentPosition() < 10000) {  
        }

        frontLeft.setPower(0);
        frontRight.setPower(0);
        backLeft.setPower(0);
        backRight.setPower(0);





    
     
    


   
   

}
}