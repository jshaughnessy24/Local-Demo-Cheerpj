import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class OpModeManager extends Thread{

    private static OpModeManager manager;

    private OpModeManager() {}

    public static OpModeManager getInstance() {
        if (manager == null) {
            manager = new OpModeManager();
        }

        return manager;
    }


    @Override
    public void start() {
        File directory = new File("/put path name here");
        List<File> classFiles = findClassFiles(directory);
        URL[] URLFiles = classFiles.stream().map(file -> file.toURI().toURL()).toList().toArray(URL[]::new);
        
        

            
        




        

        waitForStart();
    }


    public Class getOpModeClass() {
        
    }


    public  List<Class<?>> findClassFiles(File directory) {
        List<File> classFiles = new ArrayList<>();
        
        File[] files = directory.listFiles();


        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    classFiles.addAll(findClassFiles(file));
                } else if (file.getName().endsWith(".class")) {
                    String path1 = file.getPath().replace(".class", "");
                }
            }
        }

        return classFiles;
    }

    

    

    public native String getChosenOpMode();

    public class AutonomousClassNotFoundError extends Exception {
        public AutonomousClassNotFoundError() {
            super("Autonomous Class was not found. Check to make sure you used the @Autonomous annnotation");
        }
    }
    public class TeleopClassNotFoundError extends Exception {
        public TeleopClassNotFoundError() {
            super("Teleop Class was not found. Check to make sure you used the @Autonomous annnotation");
        }
    }

    






}
