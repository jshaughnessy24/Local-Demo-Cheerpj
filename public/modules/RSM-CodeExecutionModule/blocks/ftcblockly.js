//Resets Actuator/Sensor Data
function resetProperties() {

	for (i = 0; i < robotConfig["servos"].length; i++) {

		robotConfig["servos"][i]["Direction"] = "FORWARD";
		robotConfig["servos"][i]["Power"] = 0;
		robotConfig["servos"][i]["Position"] = 0;
		robotConfig["servos"][i]["LimitLower"] = 0;
		robotConfig["servos"][i]["LimitUpper"] = 1;
	}

	for (i = 0; i < robotConfig["motors"].length; i++) {
		robotConfig["motors"][i]["Direction"] = "FORWARD";
		//Max Speed is less than pure 1 voltage power to be able to keep a constant velocity
		robotConfig["motors"][i]["MaxSpeed"] = (robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60) * .85;
		robotConfig["motors"][i]["Mode"] = "RUN_WITHOUT_ENCODER";
		robotConfig["motors"][i]["Power"] = 0;
		robotConfig["motors"][i]["TargetPosition"] = 0;
		robotConfig["motors"][i]["TargetPositionTolerance"] = 10;
		robotConfig["motors"][i]["Velocity"] = 0;
		robotConfig["motors"][i]["ZeroPowerBehavior"] = "BRAKE";
		robotConfig["motors"][i]["Enabled"] = true;
		robotConfig["motors"][i]["CurrentAlert"] = 5;
	}

	for (i = 0; i < robotConfig["colorSensor"].length; i++) {
		robotConfig["colorSensor"][i]["Gain"] = 2;
		robotConfig["colorSensor"][i]["I2cAddress7Bit"] = 8;
		robotConfig["colorSensor"][i]["I2cAddress8Bit"] = 16;
	}

	motorPowers = [0, 0, 0, 0, 0, 0, 0, 0];

	document.getElementById('telemetryColor').style.backgroundColor = "";

	telemetryItems.splice(0, telemetryItems.length);
	telemetryLogs.splice(0, telemetryLogs.length);
	telemetryLogCapacity = 9;
	localStorage.setItem("motorResetEncoders", "[false, false, false, false, false, false, false, false]")

}

var programStart = false;
var startTime = performance.now();
var telemetryItems = [];
var telemetryLogs = [];
var telemetryLogCapacity = 9;

const noOp = function () { 
	if (!isUsingBlocks) { // Fail silently for blocks
		throw new Error("Called unsupported method");
	}
}

// set up user code API environment
let linearOpMode = {
	waitForStart: async function () {

		// bail early if the program has been aborted already
		if (programExecController.signal.aborted) {
			return Promise.reject(abortedErrorMsg);
		}

		return new Promise((resolve, reject) => {

			// handle for the interval, so we are able to cancel it
			let interval;

			// when signal arrives, cancel the interval and
			// reject the promise to stop the program
			const abortHandler = () => {
				clearInterval(interval);
				reject(abortedMsg);
				console.log("aborting");
			}
			programExecController.signal.addEventListener('abort', abortHandler);

			// start the interval
			// clean up the event listener when it is over
			interval = setInterval(
				() => {
					if (programStart) {
						resolve();
						programExecController.signal.removeEventListener('abort', abortHandler);
					}
				}, 1);

		});
	},
	idle: async function () { await linearOpMode.sleep(1); },
	sleep: async function (milliseconds) {

		// bail early if the program has been aborted already
		if (programExecController.signal.aborted) {
			return Promise.reject(abortedErrorMsg);
		}

		return new Promise((resolve, reject) => {

			// handle for the timeout, so we are able to cancel it
			let timeout;

			// when signal arrives, cancel the timeout and
			// reject the promise to stop the program
			const abortHandler = () => {
				clearTimeout(timeout);
				reject(abortedMsg);
				console.log("aborting");
			}
			programExecController.signal.addEventListener('abort', abortHandler);

			// start the timeout
			// clean up the event listener when it is over
			timeout = setTimeout(
				() => {
					resolve();
					programExecController.signal.removeEventListener('abort', abortHandler);
				},
				milliseconds);

		});
	},
	opModeIsActive: () => linearOpMode.isStarted() && !linearOpMode.isStopRequested(),
	isStarted: () => programStart || linearOpMode.isStopRequested(),
	isStopRequested: () => false,
	requestOpModeStop: function () { stopProgram(); },
	getRuntime: function () { return Math.floor(performance.now() - startTime) / 1000; },
	resetStartTime: function () { startTime = performance.now(); }
}

let gamepad = {
	boolValue: function (gamepadNum, buttonId, controllerType) {
		if (navigator.getGamepads()[gamepadNum] != null && (controllerType == "Both" || navigator.getGamepads()[gamepadNum].id.startsWith(controllerType))) {
			if (buttonId == -1) {
				var atRest = true;
				for (var i = 0; i < navigator.getGamepads()[gamepadNum].buttons.length; i++)
					if (navigator.getGamepads()[gamepadNum].buttons[i].pressed)
						atRest = false;
				for (var i = 0; i < navigator.getGamepads()[gamepadNum].axes.length; i++)
					if (Math.abs(navigator.getGamepads()[gamepadNum].axes[i]) > .2)
						atRest = false;
				return atRest;
			}
			return navigator.getGamepads()[gamepadNum].buttons[buttonId].pressed;
		}
		return false;
	},
	numberValue: function (gamepadNum, buttonAxis) {
		if (navigator.getGamepads()[gamepadNum] != null) {
			if (buttonAxis < 4)
				return navigator.getGamepads()[gamepadNum].axes[buttonAxis];
			else
				return navigator.getGamepads()[gamepadNum].buttons[buttonAxis].value;
		}
		return 0;
	}
}

let motor = {
	setProperty: function (motorNums, property, values) {
		for (var i = 0; i < motorNums.length; i++) {
			//Don't want bad values!
			console.log(motorNums.length);
			console.log(values[i])
			//if (!values[i] && values[i] != 0)
				//throw 'TypeError: Cannot read ' + property.toLowerCase() + ' property of undefined';
			//Translates Power to Velocity
			if (property == 'Power') {
				values[i] = Math.min(1, Math.max(values[i], -1));
				if (robotConfig["motors"][motorNums[i]]["Mode"] == 'STOP_AND_RESET_ENCODER' ) {
					robotConfig["motors"][motorNums[i]]["Power"] = 0 ;
					robotConfig["motors"][motorNums[i]]["Velocity"] = 0;
				} else {
					robotConfig["motors"][motorNums[i]]["Power"] = values[i];
					robotConfig["motors"][motorNums[i]]["Velocity"] = values[i] * robotConfig["motors"][motorNums[i]]["MaxSpeed"];
				}
			}

			else if (property == 'MaxSpeed')
				values[i] = Math.min((robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60), Math.max(values[i], -(robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60)));
			//Translates Velocity to Power

			else if (property == 'Velocity') {
				if (robotConfig["motors"][motorNums[i]]["Mode"] == 'STOP_AND_RESET_ENCODER' ) {
					robotConfig["motors"][motorNums[i]]["Power"] = 0 ;
					robotConfig["motors"][motorNums[i]]["Velocity"] = 0;
				} else {
					robotConfig["motors"][motorNums[i]]["Power"] = Math.min(1, Math.max(values[i] / robotConfig["motors"][motorNums[i]]["MaxSpeed"], -1));
					var maxSpeed = (robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60);
					robotConfig["motors"][motorNums[i]]["Velocity"] = Math.min(maxSpeed, Math.max(values[i], -maxSpeed));
				}
			}

			else if (property == 'Mode') {
				var resetValues = JSON.parse(localStorage.getItem("motorResetEncoders"));
				if ( values[i] == 'STOP_AND_RESET_ENCODER') {
					robotConfig["motors"][motorNums[i]]["Power"] = 0;
					robotConfig["motors"][motorNums[i]]["Velocity"] = 0;
					resetValues[motorNums[i]] = true;
				} else {
					resetValues[motorNums[i]] = false;
				}
				robotConfig["motors"][motorNums[i]]["Mode"] = values[i] ;
				localStorage.setItem("motorResetEncoders", JSON.stringify(resetValues));
			}
			else
				robotConfig["motors"][motorNums[i]][property] = values[i];
		}
		return;
	},
	getProperty: function (motorNum, property) {
		var returnVar;
		if (property == 'PowerFloat') {
			var motorPower = robotConfig["motors"][motorNum]["Power"];
			returnVar = (Math.round(motorPower) != motorPower);
		} else if (property == 'Velocity') {
			returnVar = robotConfig["motors"][motorNum]["CurrVelocity"];
		} else {
			returnVar = robotConfig["motors"][motorNum][property];
		}
		return returnVar;
	},
	isBusy: function (motorNum) {
		if (robotConfig["motors"][motorNum]["Mode"] !== 'RUN_TO_POSITION') {
			return false;
		}
		var motorPosition = robotConfig["motors"][motorNum]["CurrentPosition"];
		var motorTarget = robotConfig["motors"][motorNum]["TargetPosition"];
		var motorTolerance = robotConfig["motors"][motorNum]["TargetPositionTolerance"];
		return (Math.abs(motorPosition - motorTarget) > motorTolerance);
	},
	setVelocity_withAngleUnit: function (motorNum, angle, angleUnit) {
		if (angleUnit == "DEGREES")
			angle /= 360.0;
		else
			angle /= 2 * Math.PI;
		motor.setProperty([motorNum], "Velocity", [angle * robotConfig["motors"][motorNum]["encoder"]]);
	},
	getVelocity_withAngleUnit: function (motorNum, angleUnit) {
		angle = robotConfig["motors"][motorNum]["CurrVelocity"] / robotConfig["motors"][motorNum]["encoder"];
		if (angleUnit == "DEGREES")
			angle *= 360.0;
		else
			angle *= 2 * Math.PI;
		return angle;
	},
	getCurrent: function (motorNum, units) {
		//Stolen from bottom section
		var motorVelocity = robotConfig["motors"][motorNum]["Power"] * (robotConfig["motors"][motorNum]["maxrpm"] * robotConfig["motors"][motorNum]["encoder"] / 60);
		if (robotConfig["motors"][motorNum]["Mode"] == "RUN_USING_ENCODER" || robotConfig["motors"][motorNum]["Mode"] == "RUN_TO_POSITION")
			motorVelocity = robotConfig["motors"][motorNum]["Velocity"];
		if (motorNum == 1 || motorNum == 3)
			motorVelocity *= -1;
		if (robotConfig["motors"][motorNum]["Direction"] == "REVERSE")
			motorVelocity *= -1;
		if (motorVelocity == 0 || robotConfig["motors"][motorNum]["Enabled"] == false)
			return 0;
		else
			return (1 + Math.abs(robotConfig["motors"][motorNum]["CurrVelocity"] - motorVelocity) / (robotConfig["motors"][motorNum]["maxrpm"] * robotConfig["motors"][motorNum]["encoder"] / 60) * 1.5) * (units == "AMPS" ? 1 : 1000);
	},
	getCurrentAlert: function(motorNum, units) {
		return robotConfig["motors"][motorNum]["CurrentAlert"] * (units == "AMPS" ? 1 : 1000);
	},
	setCurrentAlert: function(motorNum, current, units) {
		robotConfig["motors"][motorNum]["CurrentAlert"] = current * (units == "AMPS" ? 1 : 0.001);
	},
	isOverCurrent: function (motorNum) {
		return (motor.getCurrent(motorNum, "AMPS") > robotConfig["motors"][motorNum]["CurrentAlert"]);
	},
	setPIDFCoefficients: noOp,
	getPIDFCoefficients: () => 0,
	setVelocityPIDFCoefficients: noOp,
	setPositionPIDFCoefficients: noOp,
	setMotorEnable: noOp,
	setMotorDisable: noOp,
	isMotorEnabled: noOp,
}

let servo = {
	setProperty: function (servoNum, property, value) {
		if (property == "Power")
			value = Math.max(-1, Math.min(1, value));
		if (property == "Position")
			value = Math.max(0, Math.min(1, value));
		return robotConfig["servos"][servoNum][property] = value;
	},
	getProperty: function (servoNum, property) {
		return robotConfig["servos"][servoNum][property];
	},
	scaleRange: function (servoNum, lowerLimit, upperLimit) {
		//Apply New Limits
		robotConfig["servos"][servoNum]["LimitLower"] = Math.max(0, Math.min(.9, lowerLimit));
		robotConfig["servos"][servoNum]["LimitUpper"] = Math.max(robotConfig["servos"][servoNum]["LimitLower"] + .05, Math.min(1, upperLimit));
		return;
	}
}

let navigation = {
	angleUnit_normalize: function (angle, unit) {
		var fullRot = 360.0;
		if (unit == "RADIANS")
			fullRot = Math.PI * 2;
		angle = (angle % fullRot + fullRot) % fullRot;
		if (angle >= fullRot / 2)
			angle -= fullRot;
		return angle;
	},
	angleUnit_convert: function (angle, fromUnit, toUnit) {
		angle = navigation.angleUnit_normalize(angle, fromUnit);
		if (fromUnit == toUnit)
			return angle;
		else if (toUnit == "DEGREES")
			return angle * 360 / (Math.PI * 2);
		else if (toUnit == "RADIANS")
			return angle * (Math.PI * 2) / 360;
	}
}

let acceleration = {
	create: function (units, x, y, z, time) {
		return { "DistanceUnit": units || "CM", "XAccel": x || 0, "YAccel": y || 0, "ZAccel": z || 0, "AcquisitionTime": time || 0,
				 "toString": function() { return acceleration.toText(this);}};
	},
	get: function (property, variable) { 
		return variable[property]; 
	},
	toText: function (variable) { 
		return String.format("(%.3f %.3f %.3f)%s/s^2", variable["XAccel"], variable["YAccel"], variable["ZAccel"], variable["DistanceUnit"].toLowerCase());
	},
	toDistanceUnit: function (variable, newUnit) {
		let newVar = JSON.parse(JSON.stringify(variable));
		if (variable["DistanceUnit"] == newUnit)
			return newVar;
		var conversion = 1;
		//Conversion to CM
		switch (variable["DistanceUnit"]) {
			case "INCH": conversion *= 2.54; break;
			case "METER": conversion *= 100; break;
			case "MM": conversion *= .1; break;
			case "g": conversion *= 981; break;
		}
		//Conversion to new Unit
		switch (newUnit) {
			case "INCH": conversion /= 2.54; break;
			case "METER": conversion /= 100; break;
			case "MM": conversion /= .1; break;
			case "g": conversion /= 981; break;
		}
		newVar.DistanceUnit = newUnit;
		newVar.XAccel *= conversion;
		newVar.YAccel *= conversion;
		newVar.ZAccel *= conversion;
		return newVar;
	}
}

let angularVelocity = {
	create: function (units, x, y, z, time) {
		return { "AngleUnit": units || "DEGREES", "XRotationRate": x || 0, "YRotationRate": y || 0, "ZRotationRate": z || 0, "AcquisitionTime": time || 0,
				 "toString": function () { return angularVelocity.toText(this); } };
	},
	get: function (property, variable) { return variable[property]; },
	getRotationRate: function (variable, axis) { return variable[axis + "RotationRate"]; },
	toText: function (variable) {
		return String.format("{x=%.3f, y=%.3f, z=%.3f (%s)}", variable["XRotationRate"], variable["YRotationRate"], variable["ZRotationRate"], variable["AngleUnit"]);
	},
	toAngleUnit: function (variable, newUnit) {
		var conversion = 1;
		if (variable["AngleUnit"] == newUnit)
			return variable;
		else if (newUnit == "DEGREES")
			conversion = 360 / (Math.PI * 2);
		else if (newUnit == "RADIANS")
			conversion = (Math.PI * 2) / 360;
		let newVar = JSON.parse(JSON.stringify(variable));
		newVar.AngleUnit = newUnit;
		newVar.XRotationRate *= conversion;
		newVar.YRotationRate *= conversion;
		newVar.ZRotationRate *= conversion;
		return newVar;
	},
}

let magneticFlux = {
	create: function (x, y, z, time) {
		return { "X": x || 0, "Y": y || 0, "Z": z || 0, "AcquisitionTime": time || 0,
				 "toString": function () { return magneticFlux.toText(this); } };
	},
	get: function (property, variable) { return variable[property]; },
	toText: function (variable) { return `(${misc.formatNumber(variable["X"] * 1000, 3)} ${misc.formatNumber(variable["Y"] * 1000, 3)} ${misc.formatNumber(variable["Z"] * 1000, 3)})mT`; }
}

let orientation = {
	create: function (reference, order, units, x, y, z, time) {
		return {
			"AxesReference": reference || "EXTRINSIC",
			"AxesOrder": order || "XYX",
			"AngleUnit": units || "DEGREES",
			"FirstAngle": x || 0,
			"SecondAngle": y || 0,
			"ThirdAngle": z || 0,
			"AcquisitionTime": time || 0,
			"toString": function () { return orientation.toText(this); }
		};
	},
	get: function (property, variable) {
		return variable[property];
	},
	toText: function (variable) {
		if (variable["AngleUnit"] == "DEGREES")
			return `${variable["AxesReference"]} ${variable["AxesOrder"]} ${Math.round(variable["FirstAngle"])} ${Math.round(variable["SecondAngle"])} ${Math.round(variable["ThirdAngle"])}`;
		else
			return `${variable["AxesReference"]} ${variable["AxesOrder"]} ${misc.formatNumber(variable["FirstAngle"], 3)} ${misc.formatNumber(variable["SecondAngle"], 3)} ${misc.formatNumber(variable["ThirdAngle"], 3)}`;
	},
	toAngleUnit: function (variable, newUnit) {
		var conversion = 1;
		if (variable["AngleUnit"] == newUnit)
			return variable;
		else if (newUnit == "DEGREES")
			conversion = 360 / (Math.PI * 2);
		else if (newUnit == "RADIANS")
			conversion = (Math.PI * 2) / 360;
		let newVar = JSON.parse(JSON.stringify(variable));
		newVar.AngleUnit = newUnit;
		newVar.FirstAngle *= conversion;
		newVar.SecondAngle *= conversion;
		newVar.ThirdAngle *= conversion;
		return newVar;
	}
}

let position = {
	create: function (units, x, y, z, time) {
		return { "DistanceUnit": units || "CM", "X": x || 0, "Y": y || 0, "Z": z || 0, "AcquisitionTime": time || 0, "toString": function () { return position.toText(this); } };
	},
	get: function (property, variable) { return variable[property]; },
	toText: function (variable) { return String.format("(%.3f %.3f %.3f)%s", variable["X"], variable["Y"], variable["Z"], variable["DistanceUnit"].toLowerCase()); },
	toDistanceUnit: function (variable, newUnit) {
		let newVar = JSON.parse(JSON.stringify(variable));
		if (variable["DistanceUnit"] == newUnit)
			return newVar;
		var conversion = convertDistUnits(variable["DistanceUnit"], newUnit);
		newVar.DistanceUnit = newUnit;
		newVar.X *= conversion;
		newVar.Y *= conversion;
		newVar.Z *= conversion;
		return newVar;
	}
}

let velocity = {
	create: function (units, x, y, z, time) {
		return { "DistanceUnit": units || "CM", "XVeloc": x || 0, "YVeloc": y || 0, "ZVeloc": z || 0, "AcquisitionTime": time || 0, "toString": function () { return velocity.toText(this); } };
	},
	get: function (property, variable) { return variable[property]; },
	toText: function (variable) { return `(${misc.formatNumber(variable["XVeloc"], 3)} ${misc.formatNumber(variable["YVeloc"], 3)} ${misc.formatNumber(variable["ZVeloc"], 3)})${variable["DistanceUnit"].toLowerCase()}/s`; },
	toDistanceUnit: function (variable, newUnit) {
		let newVar = JSON.parse(JSON.stringify(variable));
		if (variable["DistanceUnit"] == newUnit)
			return newVar;
		var conversion = convertDistUnits(variable["DistanceUnit"], newUnit);
		newVar.DistanceUnit = newUnit;
		newVar.XVeloc *= conversion;
		newVar.YVeloc *= conversion;
		newVar.Zveloc *= conversion;
		return newVar;
	}
}

let colorSensor = {
	setProperty: function (sensorNum, property, value) {
		robotConfig["colorSensor"][sensorNum][property] = value;
		return;
	},
	getProperty: function (sensorNum, property) {
		var sensorObj = robotConfig["colorSensor"][sensorNum];
		var returnVar;
		if (property == "Alpha" || property == "RawLightDetected")
			returnVar = (sensorObj["Red"] + sensorObj["Green"] + sensorObj["Blue"]) / 3.0;
		else if (property == "LightDetected")
			returnVar = colorSensor.getProperty(sensorNum, "RawLightDetected") / colorSensor.getProperty(sensorNum, "RawLightDetectedMax");
		else if (property == "RawLightDetectedMax")
			returnVar = 255; //Limit currently is 0-255 instead of unscaled
		else if (property == "Argb")
			returnVar = 0;
		else
			returnVar = sensorObj[property];
		//Applies Gain to RGBA Values (Removed since RGBA seem to be scaled correctly already)
		// if (property == "Red" || property == "Green" || property == "Blue" || property == "Alpha")
		// 	returnVar = Math.round(returnVar * (sensorObj["Gain"] / 2.0) * 255.0);
		return returnVar;
	},
	getDistance: function (sensorNum, unit) {
		var conversion = convertDistUnits("CM", unit);
		return robotConfig["colorSensor"][sensorNum]["Distance"] * conversion;
	},
	getNormalizedColors: function (sensorNum) {
		var sensorObj = robotConfig["colorSensor"][sensorNum];
		var [r, g, b, a] = [sensorObj["Red"], sensorObj["Green"], sensorObj["Blue"], colorSensor.getProperty(sensorNum, "RawLightDetected")];
		var magnitude = (r ** 2 + g ** 2 + b ** 2 + a ** 2) ** .5;
		if (magnitude == 0)
			magnitude = 1;
		return '{"Red":' + (r / magnitude) + ',"Green":' + (g / magnitude) + ',"Blue":' + (b / magnitude) + ',"Alpha":' + (a / magnitude) + '}';
	}
}

let distanceSensor = {
	getDistance: function (sensorNum, unit) {
		var conversion = convertDistUnits("CM", unit);
		return robotConfig["distanceSensor"][sensorNum]["Distance"] * conversion;
	}
}


let imu = {
	//orderOfIMUSensorObjects ["x", "y", "z", "angularX", "angularY", "angularZ", "positionX", "positionY", "positionZ"] // add more, to match the block option

	initialize: function(parameters) {
		
	},
	get: function (property) {
		if (property == "Acceleration") {
			return acceleration.create("MM", robotConfig["IMU"][0]["x"], robotConfig["IMU"][0]["y"], robotConfig["IMU"][0]["z"], -1);
		} else if (property == "AngularVelocity") {
			return angularVelocity.create("DEGREES", robotConfig["IMU"][0]["angularX"], robotConfig["IMU"][0]["angularY"], robotConfig["IMU"][0]["angularZ"], -1);
		} else if (property == "AngularOrientation") {
			return orientation.create(undefined, undefined, "DEGREES", robotConfig["IMU"][0]["orientationX"], robotConfig["IMU"][0]["orientationY"], robotConfig["IMU"][0]["orientationZ"], -1);
		} else if (property == "Position") {
			return position.create("MM", robotConfig["IMU"][0]["posX"], robotConfig["IMU"][0]["posY"], robotConfig["IMU"][0]["posZ"], -1);
		} else if (property == "CalibrationStatus") {
			return "IMU Calibration Status : s3 g3 a3 m3" ;
		} else if (property == "SystemStatus") {
			return "Operational" ;
		}
		return -1;
	},
	is: function(property){
		if (property == "SystemCalibrated") {
			return true ;
		}
		return -1 ;
	},
	getAngularOrientation: function() {
		return imu.get("AngularOrientation");
	}
}


let imuParameters = {
	create: function() {
		return {    
				"AccelUnit": "METERS_PERSEC_PERSEC", 
		 		"AccelerationIntegrationAlgorithm" : "NAIVE",
				"AngelUnit" : "",
				"CalibrationDataFile" : "" ,
				"I2cAddress7Bit" : 0 ,
				"I2cAddress8Bit" : 0 ,
				"LoggingEnabled" : false ,
				"LoggingTag" : "" ,
				"SensorMode" : "ACCONLY" ,
				"TempUnit" : "CELSIUS" 
				};


	},

	get: function (property, variable) {
		if ( property == "AccelUnit")
			return variable[property] ;
		else {
			return "" ;
		}
	},

	// getAccelUnit: function(variable) {
	// 	return variable["AccelUnit"] ;
	// }

	// setProperty: function (variable, property, value) {
	// 	variable[property] = value ;
	// 	return;
	// },

	set: function (property, variable, value) {
		variable[property] = value ;
		return;
	},



}



let touchSensor = {
	getProperty: function (sensorNum, property) {
		return robotConfig["touchSensor"][sensorNum][property];
	}
}


let colorUtil = {
	rgbToColor: function (r, g, b, a) {
		//RGBA to Integer Hex
		r = Math.round(Math.min(Math.max(r, 0), 255));
		g = Math.round(Math.min(Math.max(g, 0), 255));
		b = Math.round(Math.min(Math.max(b, 0), 255));
		a = Math.round(Math.min(Math.max(a, 0), 255));
		return ((a || 0) * 256 * 256 * 256) + (r * 256 * 256) + (g * 256) + (b);
	},
	hsvToColor: function (h, s, v, a) {
		var c = v * s;
		var x = c * (1 - Math.abs((h / 60.0) % 2 - 1));
		var m = v - c;
		var r = g = b = 0;
		if (h < 60) {
			r = c;
			g = x;
		}
		else if (h < 120) {
			r = x;
			g = c;
		}
		else if (h < 180) {
			g = c;
			b = x;
		}
		else if (h < 240) {
			g = x;
			b = c;
		}
		else if (h < 300) {
			r = x;
			b = c;
		}
		else if (h < 360) {
			r = c;
			b = x;
		}
		return colorUtil.rgbToColor(r, g, b, a);
	},
	textToColor: function (text) {
		var r = g = b = 0;
		var a = 255;
		switch (text.toLowerCase()) {
			case "red": r = 255; break;
			case "green": g = 255; break;
			case "blue": b = 255; break;
			case "yellow": r = 255; g = 255; break;
			case "purple": r = 128; b = 128; break;
			case "cyan": g = 255; b = 255; break;
			case "white": r = g = b = 255; break;
			default:
				if (!text.startsWith('#') || text.length > 9)
					break;
				return parseInt(text.substring(1), 16);
		}
		return colorUtil.rgbToColor(r, g, b, a);
	},
	get: function (property, variable) {
		var hexColor = ("00000000" + variable.toString(16)).slice(-8);
		if (property == "Hue" || property == "Saturation" || property == "Value")
			return colorUtil.rgbTo(property, parseInt(hexColor.substring(2, 4), 16), parseInt(hexColor.substring(4, 6), 16), parseInt(hexColor.substring(6, 8), 16));
		if (property == "Red")
			return parseInt(hexColor.substring(2, 4), 16);
		if (property == "Green")
			return parseInt(hexColor.substring(4, 6), 16);
		if (property == "Blue")
			return parseInt(hexColor.substring(6, 8), 16);
		if (property == "Alpha")
			return parseInt(hexColor.substring(0, 2), 16);
	},
	toText: function (variable) {
		var hexColor = ("00000000" + variable.toString(16)).slice(-8);
		if (hexColor.startsWith("00"))
			return "#" + hexColor.substring(2);
		return "#" + hexColor;
	},
	rgbTo: function (type, r, g, b) {
		r /= 255.0;
		g /= 255.0;
		b /= 255.0;
		maxColor = Math.max(r, g, b);
		minColor = Math.min(r, g, b);
		diff = maxColor - minColor;
		if (type == "Hue") {
			if (diff == 0)
				return 0;
			else if (maxColor == r)
				return 60 * (((g - b) / diff) % 6);
			else if (maxColor == g)
				return 60 * (((b - r) / diff) + 2);
			else
				return 60 * (((r - g) / diff) + 4);
		}
		else if (type == "Saturation") {
			if (maxColor == 0)
				return 0;
			else
				return diff / maxColor;
		}
		else if (type == "Value")
			return maxColor;
	},
	showColor: function (variable) {
		document.getElementById('telemetryColor').style.backgroundColor = '#' + ("000000" + variable.toString(16)).slice(-6);
		return;
	},
	normalized: function (property, variable) {
		if (property == "Color")
			return colorUtil.rgbToColor(variable["Red"] * 255, variable["Green"] * 255, variable["Blue"] * 255, variable["Alpha"] * 255);
		return variable[property];
	}
}

let dbgLog = {
	msg: function (text) { alert("MESSAGE:\n" + text); },
	error: function (text) { alert("ERROR:\n" + text); },
}

let pidf = {
	create: function (p, i, d, f, algorithm) {
		return { "P": p || 0, "I": i || 0, "D": d || 0, "F": f || 0, "Algorithm": algorithm || "PIDF", "toString": function () { return pidf.toText(this); } };
	},
	create_withPIDFCoefficients: function (variable) {
		return JSON.parse(JSON.stringify(variable));
	},
	get: function (property, variable) { return variable[property]; },
	set: function (property, variable, value) { variable[property] = value; },
	toText: function (variable) { return `PIDFCoefficients(p=${variable["P"]} i=${variable["I"]} d=${variable["D"]} f=${variable["F"]} alg=${variable["Algorithm"]})`; }
}

let quaternion = {
	create: function (w, x, y, z, time) {
		return { "W": w || 0, "X": x || 0, "Y": y || 0, "Z": z || 0, "AcquisitionTime": time || 0 };
	},
	get: function (property, variable) {
		if (property == "Magnitude")
			return (variable.W ** 2 + variable.X ** 2 + variable.Y ** 2 + variable.Z ** 2) ** .5;
		return variable[property];
	},
	normalized: function (variable) {
		var magn = quaternion.get("Magnitude", variable);
		let newVar = JSON.parse(JSON.stringify(variable));
		newVar.W /= magn;
		newVar.X /= magn;
		newVar.Y /= magn;
		newVar.Z /= magn;
		return newVar;
	},
	congugate: function (variable) {
		let newVar = JSON.parse(JSON.stringify(variable));
		newVar.X *= -1;
		newVar.Y *= -1;
		newVar.Z *= -1;
		return newVar;
	}
}

let range = {
	scale: function (number, prevMin, prevMax, newMin, newMax) {
		number -= prevMin;
		number /= (prevMax - prevMin);
		number *= (newMax - newMin);
		return number + newMin;
	},
	clip: function (number, min, max) {
		return Math.min(Math.max(number, min), max);
	}
}

let telemetry = {
	addData: function (key, data, ...formatArgs) {
		if (formatArgs && formatArgs.length > 0) data = String.format(data, ...formatArgs);
		return telemetryItems[telemetryItems.push(key + ": " + data) - 1];
	},
	addLine: function (line = "") {
		telemetryItems.push(line);
		return;
	},
	clear: function () {
		telemetryItems.splice(0, telemetryItems.length);
		return;
	},
	clearAll: function () {
		telemetryItems.splice(0, telemetryItems.length);
		telemetryLogs.splice(0, telemetryLogs.length);
		document.getElementById("telemetryText").innerText = "\n\n";
		return;
	},
	log: function () {
		return {
			add: function (entry, ...formatArgs) {
				if (formatArgs && formatArgs.length > 0) entry = String.format(entry, ...formatArgs);
				telemetryLogs.unshift(entry);
				if (telemetryLogs.length > telemetryLogCapacity)
					telemetryLogs.splice(telemetryLogCapacity, telemetryLogs.length - telemetryLogCapacity);
				return;
			},
			clear: function () {
				telemetryLogs.splice(0, telemetryLogs.length);
				return;
			},
			setCapacity: function (capacity) {
				telemetryLogCapacity = capacity;
				return;
			},
			getCapacity: function () {
				return telemetryLogCapacity;
			}
		};
	},
	update: function () {
		document.getElementById("telemetryText").innerText = telemetryItems.join("\n") + "\n\n" + telemetryLogs.join("\n");
		telemetryItems.splice(0, telemetryItems.length);
		return;
	},
	speak: noOp,
	setDisplayFormat: noOp,
}

let temperature = {
	create: function (unit, temp, time) {
		return { "TempUnit": unit || "CELSIUS", "Temperature": temp || 0, "AcquisitionTime": time || 0 };
	},
	get: function (property, variable) { return variable[property]; },
	toTempUnit: function (variable, newUnit) {
		let newVar = JSON.parse(JSON.stringify(variable));
		if (variable["TempUnit"] == newUnit)
			return newVar;
		newVar.TempUnit = newUnit;
		//Convert to Celcius
		switch (variable["TempUnit"]) {
			case "FARENHEIT": newVar.Temperature = (newVar.Temperature - 32) * (5 / 9.0); break;
			case "KELVIN": newVar.Temperature -= 273.15; break;
		}
		//Convert to NewUnit
		switch (newUnit) {
			case "FARENHEIT": newVar.Temperature = (newVar.Temperature * (9.0 / 5)) + 32; break;
			case "KELVIN": newVar.Temperature += 273.15; break;
		}
		return newVar;
	}
}

let elapsedTime = {
	create: function (time, resolution) {
		return { "StartTime": time || system.nanoTime(), "Resolution": resolution || "SECONDS", "toString": function () { return elapsedTime.toText(this); } };
	},
	get: function (property, variable) {
		if (property == "StartTime")
			return Math.floor(variable.StartTime / ((variable.Resolution == "SECONDS") ? 10000000 : 10000)) / 100;
		else if ((property == "Time" && variable.Resolution == "SECONDS") || property == "Seconds")
			return Math.floor((system.nanoTime() - variable.StartTime) / 10000000) / 100;
		else if ((property == "Time" && variable.Resolution == "MILLISECONDS") || property == "Milliseconds")
			return Math.floor((system.nanoTime() - variable.StartTime) / 10000) / 100;
		return variable[property];
	},
	toText: function (variable) { return `${misc.formatNumber(elapsedTime.get("Time", variable), 4)} ${variable["Resolution"].toLowerCase()}`; },
	reset: function (variable) { variable.StartTime = system.nanoTime(); }
}

let vectorF = {
	create: function (length) { return Array(length).fill(0); },
	get: function (property, variable) {
		if (property == "Length")
			return variable.length;
		if (property == "Magnitude") {
			var magnitude = 0;
			variable.forEach(function (item) { magnitude += item ** 2; })
			return magnitude ** .5;
		}
	},
	getIndex: function (variable, index) { return variable[index]; },
	put: function (variable, index, value) { variable[index] = value; },
	toText: function (variable) {
		let text = "{";
		for (let i = 0; i < variable.length; i++) {
			if (i > 0) text += " ";
			text += misc.formatNumber(variable[i], 2);
		}
		return text + "}";
	},
	normalized3D: function (variable) {
		var newVar = [];
		for (var i = 0; i < 3; i++)
			newVar[i] = variable[i] || 0;
		var magnitude = vectorF.get("Magnitude", newVar);
		for (var i = 0; i < 3; i++)
			newVar[i] /= magnitude;
		return newVar;
	},
	dotProduct: function (var1, var2) {
		var product = 0;
		var minLength = Math.min(var1.length, var2.length);
		for (var i = 0; i < minLength; i++)
			product += var1[i] * var2[i];
		return product;
	},
	add_withVector: function (returnVar, var1, var2) {
		var maxLength = Math.max(var1.length, var2.length);
		var newVar = [];
		for (var i = 0; i < maxLength; i++)
			newVar[i] = (var1[i] || 0) + (var2[i] || 0);
		if (returnVar)
			return newVar;
		for (var i = 0; i < maxLength; i++)
			var1[i] = newVar[i];
	},
	subtract_withVector: function (returnVar, var1, var2) {
		var maxLength = Math.max(var1.length, var2.length);
		var newVar = [];
		for (var i = 0; i < maxLength; i++)
			newVar[i] = (var1[i] || 0) - (var2[i] || 0);
		if (returnVar)
			return newVar;
		for (var i = 0; i < maxLength; i++)
			var1[i] = newVar[i];
	},
	multiply_withScale: function (returnVar, var1, scale) {
		var newVar = [];
		for (var i = 0; i < var1.length; i++)
			newVar[i] = var1[i] * scale;
		if (returnVar)
			return newVar;
		for (var i = 0; i < var1.length; i++)
			var1[i] = newVar[i];
	}
}

let misc = {
	getNull: () => null,
	isNull: (value) => null == value,
	isNotNull: (value) => null !== value,
	formatNumber: function (number, precision) {
		var string = "" + Math.round((number + Number.EPSILON) * (10 ** precision)) / (10 ** precision);
		if (precision > 0) {
			if (!string.includes('.'))
				string += '.';
			string += (10 ** (precision - string.split('.')[1].length)).toString().substring(1);
		}
		return string;
	},
	roundDecimal: function (number, precision) {
		return Math.round((number + Number.EPSILON) * (10 ** precision)) / (10 ** precision);
	}
}

let system = {
	nanoTime: function () { return Math.floor((performance.now() - startTime) * 1000000) }
}

function convertDistUnits(currUnits, newUnits) {
	var conversion = 1;
	//Conversion to CM
	switch (currUnits) {
		case "INCH": conversion *= 2.54; break;
		case "METER": conversion *= 100; break;
		case "MM": conversion *= .1; break;
	}
	//Conversion to new Unit
	switch (newUnits) {
		case "INCH": conversion /= 2.54; break;
		case "METER": conversion /= 100; break;
		case "MM": conversion /= .1; break;
	}
	return conversion;
}

var lastTime = 0;
var motorPowers = [0, 0, 0, 0, 0, 0, 0, 0];
localStorage.setItem("motorResetEncoders", "[false, false, false, false, false, false, false, false]")

function variableUpdate() {
	//Sets Amount of Times to run
	times = performance.now() - lastTime;
	lastTime = performance.now();
	for (var t = 0; t < times; t++) {
		//Sends Motor Powers
		try {
			for (i = 0; i < robotConfig["motors"].length; i++) {

				//Converts Raw Motor Power Inputs for Wheels to correct power according to Mode & other settings

				//Sets Power/Velocity to Variable
				var motorPower = robotConfig["motors"][i]["Power"];
				// if (robotConfig["motors"][i]["Mode"] == "RUN_USING_ENCODER" || robotConfig["motors"][i]["Mode"] == "RUN_TO_POSITION")
				// 	motorPower = robotConfig["motors"][i]["Velocity"] / (robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60);

				// if (robotConfig["motors"][i]["Mode"] == "RUN_USING_ENCODER")
				// 	motorPower = robotConfig["motors"][i]["Velocity"] / (robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60);

				// if (robotConfig["motors"][i]["Mode"] == "RUN_TO_POSITION") {
				// 	//var desiredVel = robotConfig["motors"][i]["Velocity"]
				// 	motorPower = robotConfig["motors"][i]["Velocity"] / (robotConfig["motors"][i]["maxrpm"] * robotConfig["motors"][i]["encoder"] / 60);
				// }
				

				if (isNaN(motorPower) && document.getElementById('programInit').style.display == "none") {
					throw "TypeError: Cannot read a motor property of improper type";
				}


				// wpk - does this really need to be done here? Or can we just look at the reverse status of the motor?

				//Implements Realistic Reversed Motors on Right Side
				if (i == 1 || i == 3)
					motorPower *= -1;
				//Implements REVERSE feature
				if (robotConfig["motors"][i]["Direction"] == "REVERSE")
					motorPower *= -1;

				//If Disabled, no power
				if (robotConfig["motors"][i]["Enabled"] == false) {
					//motorPowers[i] = motorPowers[i] * .958;
					motorPower = 0 ;
				} 				

				if (robotConfig["motors"][i]["Mode"] == "RUN_TO_POSITION") {
					if (motor.isBusy(i)) {
						// implement proportional power input based on error from target value
						var positionError = robotConfig["motors"][i]["TargetPosition"] - robotConfig["motors"][i]["CurrentPosition"] ;
						var kP = 0.25 ;
						var desiredPower = positionError * kP ;
						motorPowers[i] = Math.min( Math.abs(robotConfig["motors"][i]["Power"], Math.abs(desiredPower) )) * Math.sign(positionError) ;
					}
					else
						motorPowers[i] = 0;
				} else {
					// if the power is so small that the motor would be stopped...
					if ( Math.abs(motorPower) < 0.01 ) {
						if (robotConfig["motors"][i]["ZeroPowerBehavior"] == "FLOAT") {
							// factor is some amount of current motor power to simulate a drop off in speed based on the decay value ;
							motorPowers[i] = motorPowers[i] * .95 + motorPower * .05;
						} else {
							motorPowers[i] = 0.0 ;
						}
					} else {
						motorPowers[i] = motorPower ;
					}
				}
			}

			localStorage.setItem("motorPowers", JSON.stringify(motorPowers));

			// wpk not sure what this is for...
			// motorPowers[6] /= 1.015;
		} catch (err) {
			document.getElementById("telemetryText").innerText = "<Program has stopped!>\n" + err;
			resetProgramExecution();
			throw err;
		}
	}

	//Sends Servo Info
	var servoPositions = [];
	for (var i = 0; i < robotConfig["servos"].length; i++) {
		servoPositions[i] = robotConfig["servos"][i]["Position"];
		//Applys lower and upper limits
		servoPositions[i] = servoPositions[i] * (robotConfig["servos"][i]["LimitUpper"] - robotConfig["servos"][i]["LimitLower"]) + robotConfig["servos"][i]["LimitLower"];
		//Reverse if set in reverse
		if (robotConfig["servos"][i]["Direction"] == "REVERSE")
			if (robotConfig["servos"][i]["type"] == "continous")
				servoPositions[i] *= -1;
			else
				servoPositions[i] = 1 - servoPositions[i];
	}
	localStorage.setItem("servoPositions", JSON.stringify(servoPositions));

	//Receives Motor Positions
	var motorPositions = JSON.parse(localStorage.getItem("motorCurrentPositions"));
	for (i = 0; i < robotConfig["motors"].length; i++) {
		//Converts change in position to returned velocity
		if (motorPositions[i] - robotConfig["motors"][i]["CurrentPosition"] != 0)
			robotConfig["motors"][i]["CurrVelocity"] = Math.round((motorPositions[i] - robotConfig["motors"][i]["CurrentPosition"]) / .0002) / 100;
		else if (motorPowers[i] == 0)
			robotConfig["motors"][i]["CurrVelocity"] = 0;
		//Saves Current Position
		robotConfig["motors"][i]["CurrentPosition"] = motorPositions[i];
	}

	//Receives Color Sensor Data
	var colorSensorReadings = JSON.parse(localStorage.getItem("colorSensorReadings"));
	var orderOfColorSensorDataObjects = ["Red", "Green", "Blue", "Distance"] // add more, to match the block option
	// ASSUMUNG FORMAT OF COLOR SENSORS: [sensor: ["alpha, etc..."], sensor2: [...], ...]
	for (i = 0; i < robotConfig["colorSensor"].length; i++) {
		for (j = 0; j < colorSensorReadings[i].length; j++) {
			robotConfig["colorSensor"][i][orderOfColorSensorDataObjects[j]] = colorSensorReadings[i][j];
		}
	}

	//Receives Touch Sensor Data
	var touchSensorReadings = JSON.parse(localStorage.getItem("touchSensorReadings"));
	var orderOfTouchSensorObjects = ["IsPressed"] // add more, to match the block option
	// ASSUMUNG FORMAT OF COLOR SENSORS: [sensor: ["alpha, etc..."], sensor2: [...], ...]
	for (i = 0; i < robotConfig["touchSensor"].length; i++) {
		for (j = 0; j < touchSensorReadings[i].length; j++) {
			robotConfig["touchSensor"][i][orderOfTouchSensorObjects[j]] = touchSensorReadings[i][j];
		}
	}

	//Receives Distance Sensor Data
	var distanceSensorReadings = JSON.parse(localStorage.getItem("distanceSensorReadings"));
	var orderOfDistanceSensorObjects = ["Distance"] // add more, to match the block option
	// ASSUMUNG FORMAT OF COLOR SENSORS: [sensor: ["alpha, etc..."], sensor2: [...], ...]
	for (i = 0; i < robotConfig["distanceSensor"].length; i++) {
		for (j = 0; j < distanceSensorReadings[i].length; j++) {
			robotConfig["distanceSensor"][i][orderOfDistanceSensorObjects[j]] = distanceSensorReadings[i][j];
		}
	}


	//Receives IMU Sensor Data
	var imuSensorReadings = JSON.parse(localStorage.getItem("imuSensorReadings"));
	var orderOfIMUSensorObjects = ["x", "y", "z", "angularX", "angularY", "angularZ", "posX", "posY", "posZ", "orientationX", "orientationY", "orientationZ"] // add more, to match the block option
	for (i = 0; i < robotConfig["IMU"].length; i++) {
		for (j = 0; j < imuSensorReadings[i].length; j++) {
			robotConfig["IMU"][i][orderOfIMUSensorObjects[j]] = imuSensorReadings[i][j];
		}
	}
	//Do it again
	setTimeout(variableUpdate, 1);
}