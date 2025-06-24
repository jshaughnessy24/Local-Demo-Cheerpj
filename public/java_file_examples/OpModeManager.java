public class OpModeManager {

    private static OpModeManager manager;

    private OpModeManager() {}

    public static OpModeManager getInstance() {
        if (manager == null) {
            manager = new OpModeManager();
        }

        return manager;
    }

    

    public native String getChosenOpMode() {}
}
