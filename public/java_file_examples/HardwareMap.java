

import java.io.IOError;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

public class HardwareMap {
    private final Map<String, Object> devices = new HashMap<>();

    public static native void runJSCode(String s);


    public HardwareMap() {
        try {
        String jsonText = new String(Files.readAllBytes(Paths.get("/public/config_files/defaultRobot.json")));
        JSONObject json = new JSONObject(jsonText);

         JSONArray motors = json.getJSONArray("motors");
        for (int i = 0; i < motors.length(); i++) {
            JSONObject m = motors.getJSONObject(i);
            String name = m.getString("name");
            String type = m.getString("type");
            int maxrpm = m.getInt("maxrpm");
            int encoder = m.getInt("encoder");

            DcMotor motor = new DcMotor(name, type, maxrpm, encoder, i);
            devices.put(name, motor);

        
         }
        }

         catch (IOException exception) {
            runJSCode("console.log('File not found :/')");

         }

    
}



public <T> T get(java.lang.Class<? extends T> classOrInterface,
                 java.lang.String deviceName) {

                    Object device = devices.get(deviceName);
                    if (classOrInterface.isInstance(device)) {
                        return classOrInterface.cast(device);
                    }
                    throw new IllegalArgumentException("No device of type " + classOrInterface + " with name '" + deviceName + "'");
                }


                 }




