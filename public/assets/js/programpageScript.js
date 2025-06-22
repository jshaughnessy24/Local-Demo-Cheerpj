//Wait for 3 HttpRequests and then load last saved program
settingUp = 4;

//Loads Toolbox XML
var clientToolbox = new XMLHttpRequest();
clientToolbox.open("GET", "./modules/RSM-CodeExecutionModule/blocks/toolbox.xml");
clientToolbox.onload = function () {
	var toolboxTxt = clientToolbox.responseText;
	if (toolboxTxt !== "" && !document.getElementById("toolbox")) {
		toolboxLoaded(toolboxTxt);

		//Loads Default Programs and Eventually Last Saved
		document.getElementById("javaSelect").value = "BlankLinearOpMode";
		sampleProgram(false);
		document.getElementById("blockSelect").value = "BasicAutoOpMode";
		sampleProgram(true);
		setTimeout(displayLastSaved, 100);

		setTimeout(setupCategories, 250);
	}
};
clientToolbox.send();

//---Loading Screen for Unity---
var shouldBeUpdatingLoadingText = true;
var counterForLoadingText = 1;
setTimeout(function () {
	shouldBeUpdatingLoadingText = false;
	document.getElementById("fieldViewiframe").hidden = false;
	document.getElementById("loadingText").style.visibility = "hidden";
	document.getElementById("loadingTextDiv").style.visibility = "hidden";
}, 3000);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const updateLoadingText = async () => {
	while (shouldBeUpdatingLoadingText) {
		if (counterForLoadingText == 1) {
			document.getElementById("loadingText").innerHTML = "Loading Field.";
			if (settingUp != 0) document.getElementById("loadingProgText").innerHTML = "Loading Tools.";
		} else if (counterForLoadingText == 2) {
			document.getElementById("loadingText").innerHTML = "Loading Field..";
			if (settingUp != 0) document.getElementById("loadingProgText").innerHTML = "Loading Tools..";
		} else if (counterForLoadingText == 3) {
			document.getElementById("loadingText").innerHTML = "Loading Field...";
			if (settingUp != 0) document.getElementById("loadingProgText").innerHTML = "Loading Tools...";
			counterForLoadingText = 0;
		}
		counterForLoadingText++;
		await delay(500);
	}
};
updateLoadingText();

//---Resize Screens---

//Electron stretches screen
var resizeMult = 1;
if (navigator.userAgent.toLowerCase().indexOf(" electron/") > -1) {
	resizeMult = 0.8;
}

//Resizing Main Windows
resizeScreens();
var screenSize;
function resizeScreens() {
	screenSize = [0.5 * document.body.clientWidth, window.innerHeight / 2 - 30];
	//Width
	document.getElementById("leftScreen").style.width = screenSize[0] + "px";
	document.getElementById("rightScreen").style.width = screenSize[0] + "px";
	//Height
	document.getElementById("onBotJavaDiv").style.height = window.innerHeight - 43.5 + "px";
	document.getElementById("controlPanel").style.height = screenSize[1] + "px";
	document.getElementById("tabOptions").style.height = screenSize[1] - 82 + "px";
	document.getElementById("fieldView").style.height = screenSize[1] + "px";
	if (settingUp != 0) {
		document.getElementById("programLoading").style.width = screenSize[0] - 5 + "px";
		document.getElementById("programLoading").style.height = window.innerHeight - 43.5 + "px";
	}
}

document.getElementById("middleSlider").addEventListener("mousedown", function () {
	startResize("ew-resize", [resizeMiddle]);
});

document.getElementById("rightSlider").addEventListener("mousedown", function () {
	startResize("ns-resize", [resizeRight]);
});

document.getElementById("multiSlider").addEventListener("mousedown", function () {
	startResize("move", [resizeMiddle, resizeRight]);
});

function resizeMiddle(event) {
	screenSize[0] += event.movementX * resizeMult;
	var xScreenSizeLimit = Math.min(document.body.clientWidth - 10, Math.max(10, screenSize[0]));
	document.getElementById("leftScreen").style.width = xScreenSizeLimit + "px";
	document.getElementById("rightScreen").style.width =
		document.body.clientWidth - xScreenSizeLimit + "px";
	Blockly.svgResize(Blockly.mainWorkspace);
	event.preventDefault();
}

function resizeRight(event) {
	screenSize[1] += event.movementY * resizeMult;
	var yScreenSizeLimit = Math.min(window.innerHeight - 70, Math.max(10, screenSize[1]));
	document.getElementById("controlPanel").style.height = yScreenSizeLimit + "px";
	document.getElementById("tabOptions").style.height = yScreenSizeLimit - 82 + "px";
	document.getElementById("fieldView").style.height =
		window.innerHeight - 60 - yScreenSizeLimit + "px";
	event.preventDefault();
}

//TabOverlay Resizing
var tabPosition = [];
var tabSize = [];
var limitedTabSize = [];
var maxTab = false;
function openTab(src) {
	//Reset Tab
	if (
		document.getElementById("tabOverlay").style.animation !=
		"0.5s ease 0s 1 normal forwards running tabReveal"
	) {
		document.getElementById("tabOverlay").style.animation = "tabReveal .5s ease 1 normal forwards";
		tabPosition = [window.innerWidth / 6, window.innerHeight / 6 - 16.5];
		tabSize = [(window.innerWidth * 2) / 3, (window.innerHeight * 2) / 3];
		limitedTabSize = [tabSize[0], tabSize[1]];
		maxTab = false;
		document.getElementById("tabMaxRestore").firstChild.textContent = "Maximize ";
		document
			.getElementById("tabMaxRestore")
			.firstElementChild.classList.remove("fa-window-restore");
		document.getElementById("tabMaxRestore").firstElementChild.classList.add("fa-window-maximize");
		updateTabDisplay();
	}
	document.getElementById("tabIFrame").src = src;
	document.getElementById("newTab").href = src;
}

function closeTab() {
	document.getElementById("tabOverlay").style.animation = "tabHide .33s ease 1 normal forwards";
}

document.getElementById("tabMovable").addEventListener("mousedown", function () {
	startResize("move", [tabMove]);
});

document.getElementById("leftGrabTab").addEventListener("mousedown", function () {
	startResize("ew-resize", [leftTabResize]);
});

document.getElementById("rightGrabTab").addEventListener("mousedown", function () {
	startResize("ew-resize", [rightTabResize]);
});

document.getElementById("topGrabTab").addEventListener("mousedown", function () {
	startResize("ns-resize", [topTabResize]);
});
document.getElementById("topLeftGrabTab").addEventListener("mousedown", function () {
	startResize("nwse-resize", [topTabResize]);
});
document.getElementById("topRightGrabTab").addEventListener("mousedown", function () {
	startResize("nesw-resize", [topTabResize]);
});

document.getElementById("bottomGrabTab").addEventListener("mousedown", function () {
	startResize("ns-resize", [bottomTabResize]);
});
document.getElementById("bottomLeftGrabTab").addEventListener("mousedown", function () {
	startResize("nesw-resize", [bottomTabResize]);
});
document.getElementById("bottomRightGrabTab").addEventListener("mousedown", function () {
	startResize("nwse-resize", [bottomTabResize]);
});

function tabMove(event) {
	tabPosition[0] += event.movementX * resizeMult;
	tabPosition[1] += event.movementY * resizeMult;
	updateTabDisplay(event, false);
}

function leftTabResize(event) {
	tabSize[0] -= event.movementX * resizeMult;
	if (tabSize[0] > 500) tabPosition[0] += event.movementX * resizeMult;
	updateTabDisplay(event, false);
}

function rightTabResize(event) {
	tabSize[0] += event.movementX * resizeMult;
	updateTabDisplay(event, true);
}

function topTabResize(event) {
	tabSize[1] -= event.movementY * resizeMult;
	if (tabSize[1] > 250) tabPosition[1] += event.movementY * resizeMult;
	updateTabDisplay(event, false);
}

function bottomTabResize(event) {
	tabSize[1] += event.movementY * resizeMult;
	updateTabDisplay(event, true);
}

function updateTabDisplay(event, resizeNoMove) {
	if (maxTab) {
		tabSize = [document.documentElement.clientWidth + 10, window.innerHeight - 52];
		tabPosition = [-5, 27.5];
		restoreMaximizeTab();
		return;
	}
	//Applies Limits
	var limitedTabPosition = [0, 0];
	limitedTabPosition[0] = Math.min(
		Math.max(tabPosition[0], -Math.max(500, tabSize[0]) + 250),
		window.innerWidth - 100
	);
	limitedTabPosition[1] = Math.min(Math.max(tabPosition[1], -5), window.innerHeight - 100);
	if (limitedTabPosition[0] == tabPosition[0]) limitedTabSize[0] = tabSize[0];
	if (limitedTabPosition[1] == tabPosition[1]) limitedTabSize[1] = tabSize[1];
	limitedTabSize[0] = Math.max(500, limitedTabSize[0]);
	limitedTabSize[1] = Math.max(250, limitedTabSize[1]);
	if (resizeNoMove) limitedTabPosition[0] = tabPosition[0];

	//Applies Display to Tab Overlay
	var tabOverlay = document.getElementById("tabOverlay");
	tabOverlay.style.width = limitedTabSize[0] + "px";
	tabOverlay.style.height = limitedTabSize[1] + "px";
	tabOverlay.style.left = limitedTabPosition[0] + "px";
	tabOverlay.style.top = limitedTabPosition[1] + "px";
	document.getElementById("topGrabTab").style.width = limitedTabSize[0] - 40 + "px";
	document.getElementById("bottomGrabTab").style.width = limitedTabSize[0] - 40 + "px";
	if (event) event.preventDefault();
}

function restoreMaximizeTab() {
	if (maxTab) {
		maxTab = false;
		updateTabDisplay();
		document.getElementById("tabMaxRestore").firstChild.textContent = "Maximize ";
		document
			.getElementById("tabMaxRestore")
			.firstElementChild.classList.remove("fa-window-restore");
		document.getElementById("tabMaxRestore").firstElementChild.classList.add("fa-window-maximize");
	} else {
		maxTab = true;
		var tabOverlay = document.getElementById("tabOverlay");
		tabOverlay.style.width = document.documentElement.clientWidth + 10 + "px";
		tabOverlay.style.height = window.innerHeight - 52 + "px";
		tabOverlay.style.left = "-5px";
		tabOverlay.style.top = "27.5px";
		document.getElementById("topGrabTab").style.width = document.body.clientWidth - 40 + "px";
		document.getElementById("bottomGrabTab").style.width = document.body.clientWidth - 40 + "px";
		document.getElementById("tabMaxRestore").firstChild.textContent = "Restore ";
		document
			.getElementById("tabMaxRestore")
			.firstElementChild.classList.remove("fa-window-maximize");
		document.getElementById("tabMaxRestore").firstElementChild.classList.add("fa-window-restore");
	}
}

//General Resize/Move Functions
function startResize(cursorStyle, functions) {
	document.getElementById("resizeOverlay").style.cursor = cursorStyle;
	document.getElementById("resizeOverlay").style.visibility = "visible";
	for (var i = 0; i < functions.length; i++) window.addEventListener("mousemove", functions[i]);
}

window.addEventListener("mouseup", function () {
	document.getElementById("resizeOverlay").style.visibility = "hidden";
	//Reset Screens Info
	screenSize[0] = Math.min(document.body.clientWidth, Math.max(0, screenSize[0]));
	screenSize[1] = Math.min(window.innerHeight - 60, Math.max(0, screenSize[1]));
	//Reset Tab Info
	if (!maxTab) {
		var tabOverlay = document.getElementById("tabOverlay");
		tabSize[0] = parseFloat(tabOverlay.style.width.slice(0, -2));
		tabSize[1] = parseFloat(tabOverlay.style.height.slice(0, -2));
		tabPosition[0] = parseFloat(tabOverlay.style.left.slice(0, -2));
		tabPosition[1] = parseFloat(tabOverlay.style.top.slice(0, -2));
	}
	//Remove Events
	var functions = [
		resizeMiddle,
		resizeRight,
		tabMove,
		leftTabResize,
		rightTabResize,
		topTabResize,
		bottomTabResize,
	];
	for (var i = 0; i < functions.length; i++) window.removeEventListener("mousemove", functions[i]);
});

window.addEventListener("resize", function () {
	//Width Consideration
	screenSize[0] = document.getElementById("leftScreen").clientWidth;
	if (screenSize[0] < 10) {
		document.getElementById("leftScreen").style.width = "10px";
		screenSize[0] = 10;
	}
	document.getElementById("rightScreen").style.width =
		document.body.clientWidth - screenSize[0] + "px";
	//Height Consideration
	if (screenSize[1] + 70 > window.innerHeight || screenSize[1] < 10) {
		screenSize[1] = Math.min(window.innerHeight - 70, Math.max(10, screenSize[1]));
		document.getElementById("controlPanel").style.height = screenSize[1] + "px";
		document.getElementById("tabOptions").style.height = screenSize[1] - 82 + "px";
	}
	document.getElementById("fieldView").style.height =
		window.innerHeight - 60 - screenSize[1] + "px";
	document.getElementById("onBotJavaDiv").style.height = window.innerHeight - 50 + "px";
});

//Scroll Features for Lists
document.getElementById("textSelection").addEventListener("wheel", function (event) {
	document.getElementById("textSelection").scrollLeft += (event.deltaY + event.deltaX) * 0.5;
	event.preventDefault();
});
document.getElementById("textSelection").addEventListener("touchstart", function (event) {
	touchStart = event.targetTouches[0].clientX;
});
document.getElementById("textSelection").addEventListener("touchmove", function (event) {
	document.getElementById("textSelection").scrollLeft -=
		event.targetTouches[0].clientX - touchStart;
	touchStart = event.targetTouches[0].clientX;
});

document.getElementById("topMenu").addEventListener("wheel", function (event) {
	document.getElementById("topMenu").scrollLeft += (event.deltaY + event.deltaX) * 0.5;
	event.preventDefault();
});
document.getElementById("topMenu").addEventListener("touchstart", function (event) {
	touchStart = event.targetTouches[0].clientX;
});
document.getElementById("topMenu").addEventListener("touchmove", function (event) {
	document.getElementById("topMenu").scrollLeft -= event.targetTouches[0].clientX - touchStart;
	touchStart = event.targetTouches[0].clientX;
});

//HowToPopUp Instructions
setTimeout(() => {
	if (localStorage.getItem("noPopUp") == null) displayPopUp(true);
}, 750);

function displayPopUp(show) {
	if (show) {
		document.getElementById("howToOverlay").style.animation =
			"showOverlay 1s ease 1 normal forwards";
		document.getElementById("howToIntro").style.animation = "popUpWindow 1s ease forwards";
	} else {
		localStorage.setItem("noPopUp", 1);
		document.getElementById("howToOverlay").style.animation =
			"hideOverlay .5s ease 1 normal forwards";
		document.getElementById("howToIntro").style.animation = "popUpClose .5s ease forwards";
	}
}

//HowToPopUp Text Guide Through
var currStep = 0;
var savedProgram;
var savedSelection;
var wasUsingBlocks;
function runHowTo() {
	if (currStep > 14) {
		stopHowTo();
		return;
	}
	document.getElementById("howToOverlay").style.clipPath = "None";
	document.getElementById("howToText").style.opacity = "0";
	if (currStep == 0) {
		wasUsingBlocks = isUsingBlocks;
		switchToBlocks();
		document.getElementById("howToText").style.display = "inherit";
		document.getElementById("howToIntro").style.animation = "popUpClose .5s ease forwards";
		document.getElementById("textSelection").children[1].click();
		resizeScreens();
		resetProgramExecution();
		resetField();

		savedProgram = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
		savedSelection = document.getElementById("programSelect").value;
		document.getElementById("programSelect").value = "Load Program";
		document.getElementById("programSelect").onchange();

		Blockly.mainWorkspace.setScale(1);
		Blockly.mainWorkspace.scroll(0, 0);

		document.getElementById("howToText").children[2].children[1].disabled = false;
		document.getElementById("howToText").children[2].children[0].style.display = "none";
	}
	var timer;
	switch (currStep) {
		case 0:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 50% 100%, 50% 52.5%, 100% 52.5%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			break;
		case 1:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 62.5% 100%, 62.5% 0%, 90% 0%, 90% 35px, 62.5% 35px, 62.5% 100%, 100% 100%, 100% 0%)";
			timer = setInterval(() => {
				document.getElementById("topMenu").scrollLeft += 5;
			}, 1);
			break;
		case 2:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 50% 100%, 50% 52.5%, 100% 52.5%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			break;
		case 3:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 0% 100%, 0% 40px, 50% 40px, 50% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			resetField();
			document.getElementById("telemetryText").innerText = "-Telemetry Output-";
			break;
		case 4:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 255px 100%, 255px 85px, 49.5% 85px, 49.5% 250px, 255px 250px, 255px 100%, 100% 100%, 100% 0%)";
			sampleProgram("Tutorial1");
			break;
		case 5:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 285px 100%, 285px 202.5px, 49.5% 202.5px, 49.5% 370px, 285px 370px, 285px 100%, 100% 100%, 100% 0%)";
			sampleProgram("Tutorial2");
			break;
		case 6:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 327.5px 100%, 327.5px 260px, 49.5% 260px, 49.5% 515px, 327.5px 515px, 327.5px 100%, 100% 100%, 100% 0%)";
			sampleProgram("Tutorial3");
			break;
		case 7:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 327.5px 100%, 327.5px 370px, 49.5% 370px, 49.5% 485px, 327.5px 485px, 327.5px 100%, 100% 100%, 100% 0%)";
			sampleProgram("BasicAutoOpMode");
			break;
		case 8:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 195px 100%, 195px 40px, 50% 40px, 50% 100%, 195px 100%, 195px 100%, 100% 100%, 100% 0%)";
			document.getElementById("telemetryText").innerText = "-Telemetry Output-";
			break;
		case 9:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 50% 100%, 50% 52.5%, 100% 52.5%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			break;
		case 10:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 0% 100%, 0% 40px, 50% 40px, 50% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			resetField();
			document.getElementById("telemetryText").innerText = "-Telemetry Output-";
			break;
		case 11:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 50% 100%, 50% 52.5%, 100% 52.5%, 100% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%)";
			break;
		case 12:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 400px 100%, 400px 0%, 50% 0%, 50% 40px, 400px 40px, 400px 100%, 100% 100%, 100% 0%)";
			timer = setInterval(() => {
				document.getElementById("topMenu").scrollLeft -= 5;
			}, 1);
			break;
		case 13:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 50% 100%, 50% 40px, 100% 40px, 100% 52.5%, 0% 52.5%, 0% 100%, 100% 100%, 100% 0%)";
			document.getElementById("textSelection").children[5].click();
			break;
		case 14:
			document.getElementById("howToScreen").style.clipPath =
				"polygon(0% 0%, 0% 100%, 90% 100%, 90% 0%, 100% 0%, 100% 40px, 90% 40px, 90% 100%, 100% 100%, 100% 0%)";
			break;
	}
	setTimeout(() => {
		document.getElementById("howToText").firstElementChild.firstElementChild.innerText =
			"Step (" + (currStep + 1) + "/15)";
		switch (currStep) {
			case 0:
				document.getElementById("howToText").children[1].innerText =
					"This here is your robot on an official FTC Field!\n\nLet's learn how to control this robot using simple to use coding!";
				document.getElementById("howToText").style.right = "10%";
				document.getElementById("howToText").style.left = "auto";
				document.getElementById("howToText").style.top = "20%";
				document.getElementById("telemetryText").innerText = "-Telemetry Output-";
				break;
			case 1:
				document.getElementById("howToText").children[1].innerText =
					"These buttons here control your robot on the field.\n\nGo ahead and click initialize then start to run an example program!";
				document.getElementById("howToText").style.right = "10%";
				document.getElementById("howToText").style.top = "10%";
				document.getElementById("howToText").children[2].children[1].disabled = true;
				break;
			case 2:
				document.getElementById("howToText").children[1].innerText =
					"Great! The robot moved!\n\nLet's see how that happened.";
				document.getElementById("howToText").style.right = "10%";
				document.getElementById("howToText").style.top = "20%";
				break;
			case 3:
				document.getElementById("howToText").children[1].innerText =
					'Here is the programming interface that you will be using to control your robot.\n\nWhen you run your program this "runOpMode" Function gets called.\n\nLet\'s break this code up into steps!';
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "30%";
				break;
			case 4:
				document.getElementById("howToText").children[1].innerText =
					"Upon initialization, your robot will prepare itself to run your program.\n\nRight now that includes telling the right motors to reverse their direction.\n\nThis is because motors by default will turn counter-clockwise meaning now when they are all set to +1 Power, they will move the robot forward!";
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "10%";
				break;
			case 5:
				document.getElementById("howToText").children[1].innerText =
					'The rest of the blocks here are standard for any type of program that you will make.\n\nThe program will "waitForStart" and continue execution until the stop button is pressed.\n\nHowever, this "while" loop is not needed for Autonomous as the commands in Autonomous will only run once compared to Driver-Controlled when you want to constantly run the program to update to controller buttons!';
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "17.5%";
				break;
			case 6:
				document.getElementById("howToText").children[1].innerText =
					"Now we get into the meat of it!\n\nFor this program going from top to bottom, we tell the front motors to go full power, wait for a second, and then stop.";
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "30%";
				break;
			case 7:
				document.getElementById("howToText").children[1].innerText =
					"We also want to add these telemetry blocks to store some new data and then immediately update our new data to the telemetry box above.\n\nThis is helpful when figuring out which part of the code is running when.";
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "55%";
				document.getElementById("telemetryText").innerText =
					'This here is the telemetry box!\n\nExample Output:\n"Driving: Forward"';
				break;
			case 8:
				document.getElementById("howToText").children[1].innerText =
					"Now it's your turn!\n\nLet's change the motor power to -1 for the last motor blocks to make the robot reverses back after it has finished.";
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "30%";
				document.getElementById("howToText").children[2].children[0].style.display = "inline-block";
				document.getElementById("howToText").children[2].children[1].disabled = true;
				break;
			case 9:
				document.getElementById("howToText").children[1].innerText =
					"Well that didn't work... The motors immediately turn off when the program ends!";
				document.getElementById("howToText").style.left = "auto";
				document.getElementById("howToText").style.right = "10%";
				document.getElementById("howToText").style.top = "25%";
				document.getElementById("howToText").children[2].children[0].style.display = "none";
				break;
			case 10:
				document.getElementById("howToText").children[1].innerText =
					"Try and use the tabs on the left to find the sleep block to add to the end of the program.";
				document.getElementById("howToText").style.left = "52.5%";
				document.getElementById("howToText").style.top = "35%";
				document.getElementById("howToText").children[2].children[0].style.display = "inline-block";
				document.getElementById("howToText").children[2].children[1].disabled = true;
				break;
			case 11:
				document.getElementById("howToText").children[1].innerText =
					"Ta-da! You have done it!\n\nYour very first program!";
				document.getElementById("howToText").style.left = "auto";
				document.getElementById("howToText").style.right = "10%";
				document.getElementById("howToText").style.top = "25%";
				document.getElementById("howToText").children[2].children[0].style.display = "none";
				break;
			case 12:
				document.getElementById("howToText").children[1].innerText =
					'Now let\'s save the program as something like "FIRST Program!" so you can always come back and edit it again!';
				document.getElementById("howToText").style.left = "2.5%";
				document.getElementById("howToText").style.top = "10%";
				document.getElementById("howToText").children[2].children[1].disabled = true;
				break;
			case 13:
				document.getElementById("howToText").children[1].innerText =
					'You may be wondering where to go from here. Is that all this simulator offers? Just a sandbox robotics programming tool?\n\nWell, if you ever wish to learn or expand your skills, try out our "Lessons" here!';
				document.getElementById("howToText").style.left = "auto";
				document.getElementById("howToText").style.right = "55%";
				document.getElementById("howToText").style.top = "15%";
				break;
			case 14:
				document.getElementById("howToText").children[1].innerText =
					'And that\'s the basic rundown!\n\nIf you wish to come back and view these beautiful text boxes again, you can always click the "How To Use" button in the top right corner.\n\nGood luck and have fun!';
				document.getElementById("howToText").style.right = "auto";
				document.getElementById("howToText").style.top = "auto";
				break;
		}
		currStep += 1;
	}, 500);
	setTimeout(() => {
		if (currStep == 3) {
			programStart = true;
			setTimeout(() => {
				document.getElementById("howToText").style.opacity = "1";
			}, 1250);
		} else if (currStep == 10 || currStep == 12) {
			initProgram("");
			startProgram();
			setTimeout(() => {
				document.getElementById("howToText").style.opacity = "1";
			}, 2000);
		} else document.getElementById("howToText").style.opacity = "1";
		if (currStep == 2) {
			document.getElementById("programInit").style.position = "relative";
			document.getElementById("programInit").style.zIndex = "99";
			document.getElementById("programStartStop").style.position = "relative";
			document.getElementById("programStartStop").style.zIndex = "99";
		}
		//Compare code to correct answer
		if (currStep == 9 || currStep == 11) {
			document.getElementById("howToOverlay").style.clipPath =
				document.getElementById("howToScreen").style.clipPath;
			var client = new XMLHttpRequest();
			client.open(
				"GET",
				"./modules/RSM-CodeExecutionModule/blocks/samples/Tutorial" +
					(currStep == 9 ? 4 : 5) +
					".blk"
			);
			client.onload = function () {
				var content = client.responseText;
				if (content !== "")
					compareProgram = configNaming(content.substring(content.indexOf("><field")));
			};
			client.send();
			setTimeout(testPrograms, 1000);
		}
		if (currStep == 13) {
			document.getElementById("saveAs").style.position = "relative";
			document.getElementById("saveAs").style.zIndex = "99";
		}
		clearInterval(timer);
	}, 1000);
}

//Resets Code
function howToReset() {
	if (currStep == 9) sampleProgram("BasicAutoOpMode");
	if (currStep == 11) sampleProgram("Tutorial4");
}

//Testing if code matches other code
var compareProgram = "";
function testPrograms() {
	if (currStep != 9 && currStep != 11) return;
	//Blockly to XML to String
	var codeString = new XMLSerializer()
		.serializeToString(
			new DOMParser().parseFromString(
				configNaming(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace))),
				"text/xml"
			)
		)
		.replace(/xmlns=\"(.*?)\"/g, "");
	codeString = codeString.substring(codeString.indexOf("><field"));
	var codeSubstring = codeString;
	if (codeString.includes('"N0hPNU69sXYu0Q%1!,.4"><field name="NUM">-1'))
		//This is due to new blocks having different id's
		codeSubstring = codeString.substring(
			0,
			codeString.indexOf('"N0hPNU69sXYu0Q%1!,.4"><field name="NUM">-1')
		);

	if (
		codeSubstring ==
			compareProgram.substring(
				0,
				compareProgram.indexOf('"N0hPNU69sXYu0Q%1!,.4"><field name="NUM">-1')
			) &&
		codeString.length == compareProgram.length &&
		(currStep == 9 || codeString.split("1000").length == 3)
	)
		document.getElementById("howToText").children[2].children[1].disabled = false;
	else document.getElementById("howToText").children[2].children[1].disabled = true;
	setTimeout(testPrograms, 500);
}

//Resets Everything to previous state
function stopHowTo() {
	currStep = 0;
	document.getElementById("howToOverlay").style.clipPath = "None";
	document.getElementById("howToText").style.opacity = "0";
	document.getElementById("howToOverlay").style.animation =
		"hideOverlay .5s ease 1 normal forwards";
	document.getElementById("textSelection").children[1].click();

	document.getElementById("programInit").style.position = "inherit";
	document.getElementById("programInit").style.zIndex = "inherit";
	document.getElementById("programStartStop").style.position = "inherit";
	document.getElementById("programStartStop").style.zIndex = "inherit";
	document.getElementById("saveAs").style.position = "inherit";
	document.getElementById("saveAs").style.zIndex = "inherit";

	document.getElementById("programSelect").value = savedSelection;
	document.getElementById("programSelect").onchange();
	Blockly.mainWorkspace.clear();
	Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, savedProgram);
	document.getElementById("telemetryText").innerText = "-Telemetry Output-";
	if (!wasUsingBlocks) switchToOnBotJava();

	setTimeout(() => {
		document.getElementById("howToScreen").style.clipPath =
			"polygon(0% 0%, 0% 100%, 75% 100%, 75% 75%, 75% 75%, 75% 75%, 75% 75%, 75% 100%, 100% 100%, 100% 0%)";
		document.getElementById("howToText").style.opacity = "0";
	}, 1000);
}

//---Miscellaneous Functions---
//Goes through program Modified Check First
//0 - Back Button, 1 - New Program, 2 - Dropdown, 3 - Switch to Blocks, 4 - Switch to Java
resultAfterModified = -1;
nextLoadProgram = "";
function checkModified(nextResult) {
	if (nextResult == 2) {
		nextLoadProgram = document.getElementById("programSelect").value;
		document.getElementById("programSelect").value = isUsingBlocks
			? currentProjectName
			: javaProjectName;
	}
	if (lastSaved) {
		var currProgram = null;
		var compareProg = lastSaved;
		if (isUsingBlocks) {
			const serializer = new XMLSerializer();
			currProgram = serializer.serializeToString(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
			compareProg = serializer.serializeToString(compareProg);
			document.getElementById("SaveReminderText").childNodes[0].textContent = "Your Block Program";
			document.getElementById("SaveReminderText").childNodes[2].textContent =
				'"' + currentProjectName + '"';
		} else {
			document.getElementById("SaveReminderText").childNodes[0].textContent = "Your Java Program";
			document.getElementById("SaveReminderText").childNodes[2].textContent =
				'"' + javaProjectName + '"';
			currProgram = editor.getValue();
		}
		if (currProgram != compareProg) {
			overlay(true, 6);
			resultAfterModified = nextResult;
			return;
		}
	}
	switch (nextResult) {
		case 0:
			goBack();
			break;
		case 1:
			overlay(true, 4);
			break;
		case 2:
			document.getElementById("programSelect").value = nextLoadProgram;
			loadProgram();
			break;
		case 3:
			switchToBlocks();
			break;
		case 4:
			switchToOnBotJava();
			break;
	}
}

//0 - Discard, 1 - Save, 2 - SaveAs, 3 - SavingAs
function modifiedResult(decision) {
	if (decision < 3) overlay(false, 4);
	if (decision == 1) autoSave();
	if (decision != 2) {
		var nextResult = resultAfterModified;
		setTimeout(function () {
			switch (nextResult) {
				case 0:
					goBack();
					break;
				case 1:
					overlay(true, 4);
					break;
				case 2:
					document.getElementById("programSelect").value = nextLoadProgram;
					loadProgram();
					break;
				case 3:
					switchToBlocks();
					break;
				case 4:
					switchToOnBotJava();
					break;
			}
		}, 500);
	} else {
		setTimeout(function () {
			overlay(true, 0);
		}, 500);
	}
}

//Overlay
function overlay(show, activity) {
	if (show) {
		document.getElementById("overlay").style.animation = "showOverlay .25s ease 1 normal forwards";
		document.getElementById("overlayInfo").style.animation =
			"showOverlayInfo .5s ease 1 normal forwards";
		switch (activity) {
			case 0:
				document.getElementById("saveProgramName").value = "";
				document.getElementById("overlayName").innerHTML = "Save Program";
				break;
			case 1:
				document.getElementById("overlayName").innerHTML = "Delete Program?";
				break;
			case 2:
				document.getElementById("newVariableName").value = "";
				document.getElementById("overlayName").innerHTML = "Create Variable";
				break;
			case 3:
				document.getElementById("changedVariableName").value = "";
				document.getElementById("overlayName").innerHTML = "Rename Variable";
				break;
			case 4:
				document.getElementById("blockSelect").value = "";
				document.getElementById("javaSelect").value = "";
				document.getElementById("overlayName").innerHTML = "New Program";
				document.getElementById("blockjavaConvert").disabled = !isUsingBlocks;
				break;
			case 5:
				document.getElementById("overlayName").innerHTML = "Rename Config";
				break;
			case 6:
				document.getElementById("overlayName").innerHTML = "Save Reminder";
				break;
		}
		for (var i = 0; i < document.getElementById("overlayType").children.length; i++)
			document.getElementById("overlayType").children[i].style.display = "none";
		document.getElementById("overlayType").children[activity].style.display = "inherit";
	} else if (document.getElementById("overlay").style.animation !== "") {
		document.getElementById("overlay").style.animation = "hideOverlay .25s ease 1 normal forwards";
		document.getElementById("overlayInfo").style.animation =
			"hideOverlayInfo .5s ease 1 normal forwards";
		if (activity == 0) overlayReturned = -1;
		else if (activity == 1) overlayReturned = document.getElementById("newVariableName").value;
		else if (activity == 2) overlayReturned = document.getElementById("changedVariableName").value;
		else if (activity == 3) renameConfig();
		if (document.getElementById("overlayType").children[5].style.display == "inherit")
			cancelConfig();
		if (activity != 4) resultAfterModified = -1;
	}
}

function cancelConfig() {
	currentProjectName = document.getElementById("programSelect").value;
	if (currentProjectName == "Load Program") currentProjectName = "program";
}

//(re)loads dropdown of saved programs
isUsingBlocks = true;
function prepareUiToLoadProgram() {
	var keys = Object.keys(localStorage).sort();

	document.getElementById("programSelect").options.length = 1;

	for (var i = 0; i < keys.length; i++) {
		console.log(keys[i]);
		if (keys[i].startsWith("Program Name: ") && isUsingBlocks) {
			var option = document.createElement("option");
			option.value = keys[i].replace("Program Name: ", "");
			option.text = keys[i].replace("Program Name: ", "");
			document.getElementById("programSelect").appendChild(option);
		} else if (keys[i].startsWith("Java Program Name: ") && !isUsingBlocks) {
			var option = document.createElement("option");
			option.value = keys[i].replace("Java Program Name: ", "");
			option.text = keys[i].replace("Java Program Name: ", "");
			document.getElementById("programSelect").appendChild(option);
		}
	}

	var projectName = isUsingBlocks ? currentProjectName : javaProjectName;

	document.getElementById("save").disabled = projectName == "program";
	document.getElementById("delete").disabled = projectName == "program";
	document.getElementById("download").disabled = projectName == "program";
	document.getElementById("programSelect").value =
		projectName == "program" ? "Load Program" : projectName;
}

//---Switch Between Top Right Tabs---
var prevTabButton = document.getElementById("firstTab");

function switchTab(button, tabNum) {
	if (button.className == "textNormal") {
		for (var i = 0; i < document.getElementById("tabOptions").children.length; i++)
			document.getElementById("tabOptions").children[i].style.display = "none";
		document.getElementById("tabOptions").children[tabNum].style.display = "inherit";
		prevTabButton.classList.add("textNormal");
		button.classList.remove("textNormal");
		prevTabButton = button;
	}
}

//---Load Beginner Lessons---
function loadNoviceLesson() {
	document.getElementById("lessonButtonsNovice").style.display = "flex";
	document.getElementById("lessonTextNovice").parentElement.style.height = "75%";
	switch (document.getElementById("lessonSelectNovice").value) {
		case "0":
			document.getElementById("lessonTextNovice").innerText =
				"Difficulty: Easy\n" +
				'In this first lesson, you will need to power the Front Left and Front Right Wheels for a certain amount of time in order to get the robot on the White Line for +5 Points during Autonomous. Press the "Show the Task" button to see what you need to do or "Video Hint" for an introduction.' +
				"\n\nYou'll Learn:\nBasic Motor Powering\nMovement Timing";
			break;
		case "1":
			document.getElementById("lessonTextNovice").innerText =
				"Difficulty: Easy\n" +
				"The next stage will now be to add power to all 4 Wheels in your program. This will require a bit more precision, but will benefit with the added Torque and Speed the motors will provide. Your robot can have a max of 8 motors and 12 servos for full movement!" +
				"\n\nYou'll Learn:\nBalance between Speed and Reliability\nMore Motor Control";
			break;
		case "2":
			document.getElementById("lessonTextNovice").innerText =
				"Difficulty: Easy\n" +
				"For this lesson, we will be adding more than just forwards and backwards and introducing rotation! This may require alot more precision than you initially think. If only there was a way of consistently moving..." +
				"\n\nYou'll Learn:\nThe Limits to using Timing\nRotation Basics";
			break;

		default:
			document.getElementById("lessonButtonsNovice").style.display = "none";
			document.getElementById("lessonTextNovice").innerText = "Select a Lesson to begin Learning!";
			document.getElementById("lessonTextNovice").parentElement.style.height = "";
			break;
	}
}

//---Load Advanced Lessons---
function loadAdvancedLesson() {
	document.getElementById("lessonButtonsAdvanced").style.display = "flex";
	document.getElementById("lessonTextAdvanced").parentElement.style.height = "75%";
	switch (document.getElementById("lessonSelectAdvanced").value) {
		case "3":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Medium\n" +
				"Let's make the robot go along the path of the strongest shape: the Square! Or was it the triangle? Either way it may be useful to use loops for this program so the code looks cleaner and changes can be made faster. Maybe using a sensor for reliable rotation may be in order!" +
				"\n\nYou'll Learn:\nThe Joys of Clean Code\nUsing Loop Blocks & the IMU Sensor";
			break;
		case "4":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Medium\n" +
				"Are those mecanum wheels on your robot there? Great! That means you have another mode of movement called strafing where the robot can move directly left and right without turning. The wheels just need to spin a certain way..." +
				"\n\nYou'll Learn:\nThe Art of Expirementing\nStrafing Movement";
			break;
		case "5":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Medium\n" +
				"Alright, now let's start getting some actual autonomous points. First off, let's put the wobble goal in the first position earning +15 points. For right now, we can stick to timing but we can see it becomes a bit more unreliable the more we move." +
				"\n\nYou'll Learn:\nHow to Handle Large Amounts of Code\nComplex Movement";
			break;
		case "6":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Hard\n" +
				"Moving onto the next wobble goal position, we know we need a different system of navigation. Let's try out using motor encoders which can tell us the wheel's current position. Motor Encoders: 560 Ticks per Revolution, Wheels' Circumfrence: 4π Inches" +
				"\n\nYou'll Learn:\nMotor Encoders\nVariables";
			break;
		case "7":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Hard\n" +
				"Great, we have cracked the code for motor encoders! But... the code looks all messy and complicated and would be a pain to make slight changes to. Let's try and compact the 3 movements the robot can make into 3 functions we can call from the main runOpMode function." +
				"\n\nYou'll Learn:\nKeeping Code Simple\nFunctions";
			break;
		case "8":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Hard\n" +
				'Looks like the engineering team has just slapped a shooting mechanism onto your robot. Time to learn how that works. It seems they have wired in a new "m6-pixel" and "m7-launch" motor. Maybe you could even drop off a wobble goal into one of the positions in the same program!' +
				"\n\nYou'll Learn:\nHandling Multiple Tasks\nComplex Motors";
			break;
		case "9":
			document.getElementById("lessonTextAdvanced").innerText =
				"Difficulty: Extreme!\n" +
				"You're Driving Team isn't looking too good during TeleOp. Looks like you'll have to step in to earn those extra points during autonomous! Try and shoot at each powershot while either rotating or strafing to change trajectory. Get as many points as possible with *correct* wobble goal position included!" +
				"\n\nYou'll Learn:\nScoring Big with Extra Sensors\nHow to Code! (hopefully...)";
			break;
		default:
			document.getElementById("lessonButtonsAdvanced").style.display = "none";
			document.getElementById("lessonTextAdvanced").innerText =
				"Select a Lesson to begin Learning!";
			document.getElementById("lessonTextAdvanced").parentElement.style.height = "";
			break;
	}
}

function runNoviceLessonCode() {
	var lessonName = "";
	switch (document.getElementById("lessonSelectNovice").value) {
		case "0":
			lessonName = "WhiteLine2Motors";
			break;
		case "1":
			lessonName = "WhiteLine4Motors";
			break;
		case "2":
			lessonName = "DriveRotate90";
			break;
	}
	stopProgram();
	resetField();
	//Load Lesson Code to Run
	var client = new XMLHttpRequest();
	client.open("GET", "./assets/lessons/" + lessonName + ".ftccode");
	client.onload = function () {
		var lessonCode = client.responseText;
		if (lessonCode !== "") initProgram(lessonCode);
		startProgram();
	};
	client.send();
}

function runAdvancedLessonCode() {
	var lessonName = "";
	switch (document.getElementById("lessonSelectAdvanced").value) {
		case "3":
			lessonName = "DriveRotateSquare";
			break;
		case "4":
			lessonName = "DriveStrafeSquare";
			break;
		case "5":
			lessonName = "WobblePos1";
			break;
		case "6":
			lessonName = "WobblePos2";
			break;
		case "7":
			lessonName = "WobblePos3";
			break;
		case "8":
			lessonName = "ShootHighGoal";
			break;
		case "9":
			lessonName = "ShootPowerShots";
			break;
	}
	stopProgram();
	resetField();
	//Load Lesson Code to Run
	var client = new XMLHttpRequest();
	client.open("GET", "./assets/lessons/" + lessonName + ".ftccode");
	client.onload = function () {
		var lessonCode = client.responseText;
		if (lessonCode !== "") initProgram(lessonCode);
		startProgram();
	};
	client.send();
}

function playNoviceVideo(videoType) {
	link = "";
	//videoType: 0 = howTo, 1 = hint, 2 = solution
	if (videoType == 1) {
		switch (document.getElementById("lessonSelectNovice").value) {
			case "0":
				link = "https://www.youtube.com/embed/x7BokrnYRVQ?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "1":
				link = "https://www.youtube.com/embed/c4eEeLBST9A?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "2":
				link = "https://www.youtube.com/embed/Mwt1i6DcoAw?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
		}
	} else if (videoType == 2) {
		switch (document.getElementById("lessonSelectNovice").value) {
			case "0":
				link = "https://www.youtube.com/embed/ZgVQHswMonk?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "1":
				link = "https://www.youtube.com/embed/Q-C3vVFQS10?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "2":
				link = "https://www.youtube.com/embed/nx4PnIYA7ns?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
		}
	} else link = "https://www.youtube.com/embed/HvywykxdrBU?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
	openTab(link);
}

function playAdvancedVideo(videoType) {
	link = "";
	//videoType: 0 = howTo, 1 = hint, 2 = solution
	if (videoType == 1) {
		switch (document.getElementById("lessonSelectAdvanced").value) {
			case "3":
				link = "https://www.youtube.com/embed/T7qsSIdD1d4?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "4":
				link = "https://www.youtube.com/embed/GrotP67WXic?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "5":
				link = "https://www.youtube.com/embed/9jmv3Qa42sQ?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "6":
				link = "https://www.youtube.com/embed/Bks7X4O9m84?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "7":
				link = "https://www.youtube.com/embed/aqcV63eJp5M?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "8":
				link = "https://www.youtube.com/embed/t43pUXOM0Xk?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "9":
				link = "https://www.youtube.com/embed/SEw5JmZKjJQ?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
		}
	} else if (videoType == 2) {
		switch (document.getElementById("lessonSelectAdvanced").value) {
			case "3":
				link = "https://www.youtube.com/embed/MXjoF2XXLAE?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "4":
				link = "https://www.youtube.com/embed/IGs1DomVS3w?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "5":
				link = "https://www.youtube.com/embed/j7tnpOZ_xDw?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "6":
				link = "https://www.youtube.com/embed/iCbP_eR3QAU?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "7":
				link = "https://www.youtube.com/embed/qqN5xwUKk3M?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "8":
				link = "https://www.youtube.com/embed/VwxFRgVVlGs?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
			case "9":
				link = "https://www.youtube.com/embed/THkZypgWRhg?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
				break;
		}
	} else link = "https://www.youtube.com/embed/HvywykxdrBU?list=PLszFVnnZcmarYReNB-qCSZLiu2l3Mvlvz";
	openTab(link);
}

// Resize Window Section

let modeFullScreen = false;
let fullScreenPath = "./assets/icons/fullScreen.png";
let halfScreenPath = "./assets/icons/halfScreen.png";
document.getElementById("fieldViewiframe").width = "100%";
document.getElementById("fullScreenIcon").src = fullScreenPath;

function toggleFullScreen() {
	modeFullScreen = !modeFullScreen;
	if (modeFullScreen) document.getElementById("fullScreenIcon").src = halfScreenPath;
	if (!modeFullScreen) document.getElementById("fullScreenIcon").src = fullScreenPath;

	changeVisibilityLoading(true);
	document.getElementById("fullScreenIcon").style.display = "none";

	setTimeout(() => {
		changeVisibilityLoading(false);
		document.getElementById("fullScreenIcon").style.display = "block";
	}, 500);
}
const changeVisibilityLoading = (bool) => {
	console.log(
		document.getElementById("fieldViewiframe"),
		document.getElementById("loadingText"),
		document.getElementById("loadingTextDiv")
	);
	shouldBeUpdatingLoadingText = bool;

	document.getElementById("firstTab").style.visibility = !bool ? "visible" : "hidden";
	document.getElementById("telemtryOutput").style.visibility = !bool ? "visible" : "hidden";
	document.getElementById("fieldViewiframe").hidden = bool ? true : false;
	document.getElementById("loadingText").style.visibility = bool ? "visible" : "hidden";
	document.getElementById("loadingTextDiv").style.visibility = bool ? "visible" : "hidden";
	document.getElementById("fieldViewiframe").style.display = bool ? "none" : "flex";

	// For Just True
	if (bool) document.getElementById("fieldView").classList.toggle("openFullScreen");
};

// Get references to the modal and the button
var modal = document.getElementById("myModal");
var openModalBtn = document.getElementById("openModalBtn");
console.log("modal", modal);
// Function to open the modal
function openModal() {
	switchTab(document.getElementById('firstTab'),1)
	modal.style.display = "flex";
}

// Function to close the modal
function closeModal() {
	modal.style.display = "none";
}

// Add a click event listener to the button
openModalBtn.addEventListener("click", openModal);

// Add a click event listener to the modal to close it when clicking outside the content
modal.addEventListener("click", function (event) {
	if (event.target === modal) {
		closeModal();
	}
});

// // Add a close button to the modal content
// var closeButton = document.createElement("span");
// closeButton.innerHTML = "&times;";
// closeButton.className = "close";
// closeButton.addEventListener("click", closeModal);
// document.querySelector(".modal-content").appendChild(closeButton);
