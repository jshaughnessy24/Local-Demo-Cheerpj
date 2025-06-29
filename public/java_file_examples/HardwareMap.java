



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

  public static native String getJSON();
    
   //public static native void print(String s);


    public HardwareMap() {
        String jsonText;
        JSONObject json = new JSONObject();

        
       
        
        // jsonText = new String(Files.readAllBytes(Paths.get("public/config_files/defaultRobot.json")));
        jsonText = getJSON();
         json = new JSONObject(jsonText);
         
         System.out.println(jsonText);
    
    
         
          //  print(e.toString());

            

        

        
         JSONArray motors = json.getJSONArray("motors");
        for (int i = 0; i < motors.length(); i++) {
            JSONObject m = motors.getJSONObject(i);
            String name = m.getString("name");
            String type = m.getString("type");
            int maxrpm = m.getInt("maxrpm");
            int encoder = m.getInt("encoder");

            DcMotor motor = new DcMotor(name, type, maxrpm, encoder, i);
            devices.put(name, motor);
            System.out.println(name);
          // print(name);

        
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




