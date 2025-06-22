//Load Config File
var robotConfig = null;

var defaultBot = true;

var client = new XMLHttpRequest();
client.open('GET', './config_files/defaultRobot.json');
client.onload = function () {
	var robotConfigTxt = client.responseText;
	if (robotConfigTxt !== '' && robotConfig == null) {
		robotConfig = JSON.parse(robotConfigTxt);

		setTimeout(variableUpdate, 1);
	}
}
client.send();

//Dropdowns for Blocks Programs
function createDcMotorDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["motors"].length; i++)
		CHOICES[i] = [robotConfig["motors"][i]["name"], "dcMotor" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "dcMotor0"];
	return new Blockly.FieldDropdown(CHOICES);
}

function createDcMotorExDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["motors"].length; i++)
		if (robotConfig["motors"][i]["type"] == "extended")
			CHOICES[i] = [robotConfig["motors"][i]["name"], "dcMotor" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "dcMotor0"];
	return new Blockly.FieldDropdown(CHOICES);
}

function createCRServoDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["servos"].length; i++)
		if (robotConfig["servos"][i]["type"] == "continuous")
			CHOICES[CHOICES.length] = [robotConfig["servos"][i]["name"], "servo" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "servo" + robotConfig["servos"].length];
	return new Blockly.FieldDropdown(CHOICES);
}

function createServoDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["servos"].length; i++)
		if (robotConfig["servos"][i]["type"] == "180degrees")
			CHOICES[CHOICES.length] = [robotConfig["servos"][i]["name"], "servo" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "servo" + robotConfig["servos"].length];
	return new Blockly.FieldDropdown(CHOICES);
}

function createDistanceSensorDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["distanceSensor"].length; i++)
		CHOICES[i] = [robotConfig["distanceSensor"][i]["name"], "distanceSensor" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "distanceSensor0"];
	return new Blockly.FieldDropdown(CHOICES);
}

function createBNO055IMUDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["IMU"].length; i++)
		CHOICES[i] = [robotConfig["IMU"][i]["name"], "imu" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "IMU"];
	return new Blockly.FieldDropdown(CHOICES);
}

function createColorRangeSensorDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["colorSensor"].length; i++)
		CHOICES[i] = [robotConfig["colorSensor"][i]["name"], "colorSensor" + i];
	if (CHOICES.length == 0)
		CHOICES[0] = ["<None>", "colorSensor0"];
	return new Blockly.FieldDropdown(CHOICES);
}

function createTouchSensorDropdown() {
	var CHOICES = [];
	for (i = 0; i < robotConfig["touchSensor"].length; i++)
		CHOICES[i] = [robotConfig["touchSensor"][i]["name"], "touchSensor" + i];
	if (CHOICES.length == 0) {
		CHOICES[0] = ["<None>", "touchSensor0"];
	}
	return new Blockly.FieldDropdown(CHOICES);
}

//Other Dropdowns
function createLanguageCodeDropdown() {
	var CHOICES = [
		['en', 'en'],
	];
	return createFieldDropdown(CHOICES);
}

var LANGUAGE_CODE_TOOLTIPS = [
	['en', 'The language code for English.'],
];

function createCountryCodeDropdown() {
	var CHOICES = [
		['US', 'US'],
	];
	return createFieldDropdown(CHOICES);
}

var COUNTRY_CODE_TOOLTIPS = [
	['US', 'The country code for United States.'],
];

//String replacement for named devices
function configNaming(str) {
	for (var i = 0; i < robotConfig["motors"].length; i++)
		str = str.replaceAll("dcMotor" + i, robotConfig["motors"][i].name + "AsDcMotor");
	for (var i = 0; i < robotConfig["servos"].length; i++)
		str = str.replaceAll("servo" + i, robotConfig["servos"][i].name + "AsServo");
	for (var i = 0; i < robotConfig["distanceSensor"].length; i++)
		str = str.replaceAll("distanceSensor" + i, robotConfig["distanceSensor"][i].name + "AsDistanceSensor");
	for (var i = 0; i < robotConfig["IMU"].length; i++)
		str = str.replaceAll("imu" + i, robotConfig["IMU"][i].name + "AsBNO055IMU");
	for (var i = 0; i < robotConfig["colorSensor"].length; i++)
		str = str.replaceAll("colorSensor" + i, robotConfig["colorSensor"][i].name + "AsREVColorRangeSensor");
	for (var i = 0; i < robotConfig["touchSensor"].length; i++)
		str = str.replaceAll("touchSensor" + i, robotConfig["touchSensor"][i].name + "AsTouchSensor");
	return str;
}

//Does some string replacement for java programs with defaultBot
function javaNaming(str) {
	if (defaultBot) {
		str = str.replaceAll('"left_drive"', '"frontLeft"');
		str = str.replaceAll('"right_drive"', '"frontRight"');
		str = str.replaceAll('"left_arm"', '"m7-launch"');
		str = str.replaceAll('"sensor_range"', '"frontDistanceSensor"');
	}
	return str;
}

//Converts New Blockly Programs to Naming Convention
var savedStr = "";
var savedSampleProg = false;
function blocklyNaming(str, sampleProg) {
	//First - Changes based off of Default Bot Config
	if (defaultBot) {
		str = str.replaceAll('left_driveAsDcMotor', 'dcMotor0');
		str = str.replaceAll('right_driveAsDcMotor', 'dcMotor1');
		str = str.replaceAll('sensor_colorAsREVColorRangeSensor', 'colorSensor0');
		str = str.replaceAll('sensor_touchAsTouchSensor', 'touchSensor0');
	}
	//Second - Changes any known config naming
	for (var i = 0; i < robotConfig["motors"].length; i++)
		str = str.replaceAll(robotConfig["motors"][i].name + "AsDcMotor", "dcMotor" + i);
	for (var i = 0; i < robotConfig["servos"].length; i++)
		str = str.replaceAll(robotConfig["servos"][i].name + "AsServo", "servo" + i);
	for (var i = 0; i < robotConfig["distanceSensor"].length; i++)
		str = str.replaceAll(robotConfig["distanceSensor"][i].name + "AsDistanceSensor", "distanceSensor" + i);
	for (var i = 0; i < robotConfig["IMU"].length; i++)
		str = str.replaceAll(robotConfig["IMU"][i].name + "AsBNO055IMU", "imu" + i);
	for (var i = 0; i < robotConfig["colorSensor"].length; i++)
		str = str.replaceAll(robotConfig["colorSensor"][i].name + "AsREVColorRangeSensor", "colorSensor" + i);
	for (var i = 0; i < robotConfig["touchSensor"].length; i++)
		str = str.replaceAll(robotConfig["touchSensor"][i].name + "AsTouchSensor", "touchSensor" + i);
	//Third - Asks any remaining unknown names to be named
	var findIndex = 0;
	var configs = [];
	//Removes Previous Selections
	while (document.getElementById('configRenamer').childElementCount > 1)
		document.getElementById('configRenamer').children[1].remove();
	//Checks for "nameAsDevice"
	while (true) {
		findIndex = str.indexOf("As", findIndex + 1);
		if (findIndex == -1)
			break;
		var configName = str.substring(str.lastIndexOf(">", findIndex) + 1, findIndex);
		var deviceType = str.substring(findIndex, str.indexOf("<", findIndex));
		if (!configs.includes(configName)) {
			var newConfigOpt = document.getElementById('configRenamer').firstElementChild.cloneNode(true);
			newConfigOpt.style.display = "flex";
			newConfigOpt.firstElementChild.innerText = configName;
			//Adds Options
			var dropdown = newConfigOpt.lastElementChild.firstElementChild;
			var devices = [];
			var deviceName = "invalid";
			switch (deviceType) {
				case "AsDcMotor":
					devices = robotConfig["motors"];
					deviceName = "dcMotor";
					break;
				case "AsServo":
					devices = robotConfig["servos"];
					deviceName = "servo";
					break;
				case "AsDistanceSensor":
					devices = robotConfig["distanceSensor"];
					deviceName = "distanceSensor";
					break;
				case "AsBNO055IMU":
					devices = robotConfig["IMU"];
					deviceName = "imu";
					break;
				case "AsREVColorRangeSensor":
					devices = robotConfig["colorSensor"];
					deviceName = "colorSensor";
					break;
				case "AsTouchSensor":
					devices = robotConfig["touchSensor"];
					deviceName = "touchSensor";
					break;
			}
			for (var i = 0; i < devices.length; i++) {
				var newOpt = document.createElement('option');
				newOpt.setAttribute('value', deviceName + i);
				newOpt.innerText = devices[i]["name"];
				dropdown.append(newOpt);
			}
			if (deviceName != "invalid") {
				configs.push(configName);
				document.getElementById('configRenamer').append(newConfigOpt);
			}
		}
	}
	overlay(false, 0);
	if (configs.length > 0) {
		savedStr = str;
		savedSampleProg = sampleProg;
		setTimeout(function () { overlay(true, 5); }, 500);
	}
	else
		loadBlocksXML(str, sampleProg);
}

//Config Renaming Finished
function renameConfig() {
	var parentConfig = document.getElementById('configRenamer');
	while (parentConfig.childElementCount > 1) {
		var replace = parentConfig.children[1].firstElementChild.innerText;
		var index = savedStr.indexOf(replace + "As")
		replace = savedStr.substring(index, savedStr.indexOf("<", index));
		var newStr = parentConfig.children[1].lastElementChild.firstElementChild.value;
		savedStr = savedStr.replaceAll(replace, newStr);
		parentConfig.children[1].remove();
	}
	loadBlocksXML(savedStr, savedSampleProg);
}

//Sets up workspace with actuators/sensors
function setupCategories() {
	settingUp -= 1;

	try {
		var toolbox = Blockly.getMainWorkspace().getToolbox();
	} catch (e) {
		location.reload();
	}

	var crServos = 0;
	for (i = 0; i < robotConfig["servos"].length; i++)
		if (robotConfig["servos"][i]["type"] == "continuous")
			crServos++;

	if (crServos == 0)
		toolbox.getToolboxItemById('CRServo').hide();
	if (robotConfig["servos"].length - crServos == 0)
		toolbox.getToolboxItemById('Servo').hide();

	if (robotConfig["motors"].length == 0)
		toolbox.getToolboxItemById('Motor').hide();
	if (robotConfig["motors"].length < 2)
		toolbox.getToolboxItemById('MotorDual').hide();
	if (robotConfig["motors"].length < 4)
		toolbox.getToolboxItemById('MotorQuad').hide();

	var motorsEx = 0;
	for (i = 0; i < robotConfig["motors"].length; i++)
		if (robotConfig["motors"][i]["type"] == "extended")
			motorsEx++;

	if (motorsEx == 0)
		toolbox.getToolboxItemById('MotorEx').hide();
	if (motorsEx < 2)
		toolbox.getToolboxItemById('MotorExDual').hide();
	if (motorsEx < 4)
		toolbox.getToolboxItemById('MotorExQuad').hide();

	if (robotConfig["motors"].length == 0 && robotConfig["servos"].length == 0)
		toolbox.getToolboxItemById('Actuators').hide();

	if (robotConfig["distanceSensor"].length == 0)
		toolbox.getToolboxItemById('DistanceSensor').hide();

	if (robotConfig["IMU"].length == 0) {
		toolbox.getToolboxItemById('IMUSensor').hide();
		toolbox.getToolboxItemById('IMUParamSensor').hide();
	}

	if (robotConfig["colorSensor"].length == 0)
		toolbox.getToolboxItemById('ColorSensor').hide();

	if (robotConfig["touchSensor"].length == 0)
		toolbox.getToolboxItemById('TouchSensor').hide();

	if (robotConfig["distanceSensor"].length == 0 && robotConfig["IMU"].length == 0 && robotConfig["colorSensor"].length == 0 && robotConfig["touchSensor"].length == 0)
		toolbox.getToolboxItemById('Sensors').hide();
}

//Displays Last Saved Program
function displayLastSaved() {
	if (settingUp > 1)
		setTimeout(displayLastSaved, 100);
	else {
		var lastProgram = localStorage.getItem("Last Program");
		if (!lastProgram)
			switchToBlocks();
		else if (lastProgram.startsWith("Program Name: ")) {
			switchToBlocks();
			document.getElementById("programSelect").value = lastProgram.substring(14);
			if (document.getElementById("programSelect").value == "")
				document.getElementById("programSelect").value = "Load Program";
			else
				loadProgram();
		}
		else {
			switchToOnBotJava();
			document.getElementById("programSelect").value = lastProgram.substring(19);
			if (document.getElementById("programSelect").value == "")
				document.getElementById("programSelect").value = "Load Program";
			else
				loadProgram();
		}
		settingUp = 0;
		document.getElementById('programLoading').remove();
	}
}