##This file will show you how to change the config for the robot.
##In the defaultRobot.json, there are instructions that tell the program which blocks to include and what names of those devices should be called.

{
    #Step 1: Motors
    "motors": [
        {
            #This value will determine the name of the motor in the program
            "name": "frontLeft",

            #This will determine if the motor can use setVelocity
            "type": "extended", ("extended"/"normal")

            #These values determine the conversion from power to velocity
            "maxrpm": 340,
            "encoder": 560
        }
    ],

    #Step 2: Servos
    "servos": [
        {
            #This value will determine the name of the motor in the program
            "name": "fullservo",

            #This determines the type of servo it is
            "type": "continuous" ("continuous"/"180degrees")
        }
    ],

    #Step 3: Sensors
    "distanceSensor": [
        {
            #This value will determine the name of the motor in the program
            "name": "frontDistanceSensor",

            #This value does nothing
            "type": "REV 2M"
        }
    ],

    "IMU": [
        {
            #This value will determine the name of the motor in the program
            "name": "imu",

            #This value does nothing
            "type": "REV Control Hub"
        }
    ],

    "colorSensor": [
        {
            #This value will determine the name of the motor in the program
            "name": "frontColorSensor",

            #This value does nothing
            "type": "REV Color Sensor V3"
        }
    ],

    "touchSensor": [
        {
            #This value will determine the name of the motor in the program
            "name": "frontTouchSensor",

            #This value does nothing
            "type": "REV Touch Sensor"
        }
    ]
}