


public class DcMotor {

    public int index;

public  DcMotor(String name, String type, int maxrpm, int encoder, int i) {
    index = i;


    
}


public native void setDir(String dir);


public void setDirection(Direction dir) {
    setDir(dir.toString());

  //runJSCode()
}



public native int getCurrentPosition();

public native void setPower(double power);

public enum Direction {
    FORWARD,
    REVERSE
}



}
