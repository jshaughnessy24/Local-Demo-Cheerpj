UnityInstance = null;
this.stopped = true;
window.onmessage = function(e) {
    if (e.data) {
        console.log('unityins recvd');
        console.log(e.data);
        Leaderboard = e.data;
    }
};


Leaderboard = null
var alreadySetPlayMode = false;
var setCourse = false;
function check() {
    if (UnityInstance != null) {

        //window.electronAPI.setUnityInstance(UnityInstance);
        //console.log("TOP");
        //console.log(window.top[1].electronAPI);
        var playMode = localStorage.getItem('playMode');
        var isProgramPage = localStorage.getItem('ProgramPage');
        var courseSelected = localStorage.getItem('CourseName');
        if(courseSelected != "" && !setCourse)
        {
            UnityInstance.SendMessage("VRS Singleton", "SetCourse", courseSelected);
            setCourse = true;
        }
        if (playMode == "Autonomous" && !alreadySetPlayMode) {
            UnityInstance.SendMessage("VRS Singleton", "SetPlaymode", 1);
            UnityInstance.SendMessage("Main Menu", "changeSinglePlayer");
            alreadySetPlayMode = true;
            setTimeout(writeMotorPowers, 1);
        } else if (playMode == "TeleOp" && !alreadySetPlayMode) {
            UnityInstance.SendMessage("VRS Singleton", "SetPlaymode", 2);
            // alert("VRS Multiplayer is optimized with fullscreen mode. Please click on the blue button below the game window.");
            alreadySetPlayMode = true;
        }
        if (playMode == "Autonomous" && isProgramPage && alreadySetPlayMode) {
            //setTimeout(writeMotorPowers, 1);
        }
        if(Leaderboard)
        {
            console.log('sending to unity');
            UnityInstance.SendMessage("VRS Singleton", "GetLeaderboard", JSON.stringify(Leaderboard));
            Leaderboard = null;
        }
        /*if(getLeaderFlag)
        {
            UnityInstance.SendMessage("VRS Singleton", "GetLeaderboard", JSON.stringify(Leaderboard));
            getLeaderFlag = null;
        }*/

        /*if(window.accessToken)
        {
            console.log("setting access token");
            UnityInstance.SendMessage("VRS Singleton", "SetAccessToken", window.accessToken);
        }*/

    } else {
        setTimeout(check, 500);
    }
}

check();

function writeMotorPowers() {
    if (localStorage.getItem('startMatch') == 'true') {
        UnityInstance.SendMessage("FieldManager", "buttonStartGame");
        localStorage.setItem('startMatch', false);
        console.log("StartMatch");
        this.stopped = false;
    } else if (localStorage.getItem('stopMatch') == 'true' && !this.stopped) {
        UnityInstance.SendMessage("FieldManager", "buttonStopGame");
        localStorage.setItem('stopMatch', false);
        setTimeout(disableMotorWrite, 200);
        console.log("StopMatch");
    } if (localStorage.getItem('resetField') == 'true' && localStorage.getItem('ProgramPage') == 'true') {
        UnityInstance.SendMessage("FieldManager", "autoResetFieldToo");
        localStorage.setItem('resetField', false);
        console.log("ResetMatch");
        this.stopped = false;
    }
    if(this.stopped == true)
    {
        console.log("Stopped");
        setTimeout(writeMotorPowers, 1);
        return;
    }

    var motors = JSON.parse(localStorage.getItem('motorPowers'));
    var encoderResets = JSON.parse(localStorage.getItem("motorResetEncoders"));
    var servos = JSON.parse(localStorage.getItem('servoPositions'));
    // for (var i = 0; i < motors.length; i++)
    //     if (!motors[i])
    //         motors[i] = 0;
    for (var i = 0; i < servos.length; i++)
        if (!servos[i])
            servos[i] = 0;

    // localStorage.setItem('motorResetEncoders', "[false, false, false, false, false, false, false, false]");
    //console.log(motors);
    // //Old Code (Lean off of using this)
    // for (var i = 0; i < encoderResets.length; i++)
    //     if (encoderResets[i] == true)
    //         //UnityInstance.SendMessage("PhotonNetworkPlayer(Clone)", "resetEncoders");
    //         encoderResets[i] = false;

    UnityInstance.SendMessage("JSAppIntegration","SetFrontLeft",motors[0]);
    if ( encoderResets[0]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetFrontLeftEncoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetFrontRight",motors[1]);
    if ( encoderResets[1]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetFrontRightEncoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetBackLeft",motors[2]);
    if ( encoderResets[2]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetBackLeftEncoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetBackRight",motors[3]);
    if ( encoderResets[3]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetBackRightEncoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetMotor1",motors[5]);
    if ( encoderResets[5]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetMotor1Encoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetMotor2",motors[4]);
    if ( encoderResets[4]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetMotor2Encoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetMotor3",motors[6]);
    if ( encoderResets[6]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetMotor3Encoder");
    }

    UnityInstance.SendMessage("JSAppIntegration","SetMotor4",motors[7]);
    if ( encoderResets[7]) {
        UnityInstance.SendMessage("JSAppIntegration","ResetMotor4Encoder");
    }

    var command = new Object();
    command.motors = motors;
    command.encoderResets = encoderResets;
    command.servos = servos;
    //To add more use: obj.<name> = array

    //WIP - Unity will need to respond to this one command and set values accordingly
    //UnityInstance.SendMessage("PhotonNetworkPlayer(Clone)", "receiveInfo", JSON.stringify(command));
    //Sends the info: '{"motors":[0,0,0,0,0,0,0,0],"encoderResets":[false,false,false,false,false,false,false,false],"servos":[0,0,0]}'

    //Implement Servos once Unity is ready

    check();
    setTimeout(writeMotorPowers, 1);
}

function disableMotorWrite()
{
    this.stopped = true;
}

function sendToLeaderboard(points,game)
{
    console.log("Game"+game);
    window.top.postMessage({points:points,game:game},'*');
    console.log(points);
}

function requestLeaderboard()
{
    window.top.postMessage({action:"getleader"},'*');
}

