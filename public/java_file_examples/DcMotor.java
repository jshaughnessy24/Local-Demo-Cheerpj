


public class DcMotor {

    int index;

public  DcMotor(String name, String type, int maxrpm, int encoder, int i) {
    index = i;


    
}



public native int getCurrentPosition();

public native void setDirection(Direction dir);

public native void setPower(double power);

public enum Direction {
    FORWARD,
    REVERSE
}



}
