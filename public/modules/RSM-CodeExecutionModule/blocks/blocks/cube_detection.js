Blockly.Blocks["cubedetection_getProperty"] = {
  init: function () {
    var PROPERTY_CHOICES = [
      ["Position", "Position"],
      ["Location", "Location"],
      [("PosX1", "PosX1")],
      ["PosY1", "PosY1"],
      ["PosX2", "PosX2"],
      ["PosY2", "PosY2"],
      ["Center", "Center"],
      ["Left", "Left"],
      ["Right", "Right"],
    ];
    this.setOutput(true, "Number"); // no type, for compatibility
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(PROPERTY_CHOICES),
      "PROP"
    );
    this.setColour(propertyColorCubeDetection);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    var TOOLTIPS = [
      ["Position", "Returns X1, X2, Y1, Y2"],
      ["Location", "Return either of three Locations (center, left, right)"],
    ];
    this.setTooltip(function () {
      var key = thisBlock.getFieldValue("PROP");
      for (var i = 0; i < TOOLTIPS.length; i++) {
        if (TOOLTIPS[i][0] == key) {
          return TOOLTIPS[i][1];
        }
      }
      return "";
    });
  },
};

//Called on Init Program
Blockly.JavaScript["cubedetection_getProperty"] = function (block) {
  var property = block.getFieldValue("PROP");

  //Inputs in javascript string call to function
  var code = "cubeDetection.getProperty(\"" + property + "\")";
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];

  /*var valueToReturn = -1;

  // code = `alert('Position Value: [x1: 208, y1:429, x2: 258, y2:479 ]')`;

  let detectionBoxObj = JSON.parse(
    localStorage.getItem("cubeDetectionResults")
  )["detections"][0];

  let locationValue = detectionBoxObj["location"];

  if (property == "PosX1") {
    valueToReturn = detectionBoxObj["x1"];
  } else if (property == "PosX2") {
    valueToReturn = detectionBoxObj["x2"];
  } else if (property == "PosY1") {
    valueToReturn = detectionBoxObj["y1"];
  } else if (property == "PosY2") {
    valueToReturn = detectionBoxObj["y2"];
  } else if (property == "Center") {
    valueToReturn = locationValue == "center" ? 1 : 0;
  } else if (property == "Right") {
    valueToReturn = locationValue == "right" ? 1 : 0;
  } else if (property == "Left") {
    valueToReturn = locationValue == "left" ? 1 : 0;
  } else {
    valueToReturn = -1;
  }

  // var code = identifier + '.get("' + property + '")';

  code = valueToReturn;
  console.log({
    property,
    msg: "newCubeDetection; Generated Code",
    code,
    identifier,
    detectionBoxObj,
  });

  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];*/
};

// Blockly.FtcJava["cubedetection_getProperty"] = function (block) {
//   // var identifier = Blockly.FtcJava.importDeclareAssign_(
//   //   block,
//   //   "IDENTIFIER",
//   //   "CUBEDETECTOR"
//   // );
//   var identifier = "CUBEDETECTOR";
//   var property = block.getFieldValue("PROP");
//   var code = identifier + ".get" + property + "()";
//   return [code, Blockly.FtcJava.ORDER_FUNCTION_CALL];
// };

//Called within built javascript code
let cubeDetection = {
  getProperty: function(property) {

    //Get Properties
    let detectionBoxObj = JSON.parse(
      localStorage.getItem("cubeDetectionResults")
    )["detections"][0];
  
    let locationValue = detectionBoxObj["location"];
  
    //Returns Correct Property
    if (property == "PosX1") {
      valueToReturn = detectionBoxObj["x1"];
    } else if (property == "PosX2") {
      valueToReturn = detectionBoxObj["x2"];
    } else if (property == "PosY1") {
      valueToReturn = detectionBoxObj["y1"];
    } else if (property == "PosY2") {
      valueToReturn = detectionBoxObj["y2"];
    } else if (property == "Center") {
      valueToReturn = locationValue == "center" ? 1 : 0;
    } else if (property == "Right") {
      valueToReturn = locationValue == "right" ? 1 : 0;
    } else if (property == "Left") {
      valueToReturn = locationValue == "left" ? 1 : 0;
    } else {
      valueToReturn = -1;
    }

    return valueToReturn;
  }
}

Blockly.Blocks["cubedetection_getProperty_Position"] = {
  init: function () {
    var PROPERTY_CHOICES = [
      ["PosX1", "PosX1"],
      ["PosY1", "PosY1"],
      ["PosX2", "PosX2"],
      ["PosY2", "PosY2"],
    ];
    this.setOutput(true, "Number");
    this.appendDummyInput()
      .appendField("CubeDetection.")
      .appendField("Position", "IDENTIFIER")
      .appendField(".")
      .appendField(new Blockly.FieldDropdown(PROPERTY_CHOICES), "PROP");
    this.setColour(propertyColorCubeDetection);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    var TOOLTIPS = [
      ["X1", "X1 Description"],
      ["Y1", "Y1 Description"],
      ["X2", "X2 Description"],
      ["Y2", "Y2 Description"],
    ];
    this.setTooltip(function () {
      var key = thisBlock.getFieldValue("PROP");
      for (var i = 0; i < TOOLTIPS.length; i++) {
        if (TOOLTIPS[i][0] == key) {
          return TOOLTIPS[i][1];
        }
      }
      return "";
    });
  },
};

Blockly.JavaScript["cubedetection_getProperty_Position"] =
  Blockly.JavaScript["cubedetection_getProperty"];

// Blockly.FtcJava["cubedetection_getProperty_Position"] =
//   Blockly.FtcJava["cubedetection_getProperty"];

Blockly.Blocks["cubedetection_getProperty_Location"] = {
  init: function () {
    var PROPERTY_CHOICES = [
      ["Center", "Center"],
      ["Left", "Left"],
      ["Right", "Right"],
    ];
    this.setOutput(true, "Number");
    this.appendDummyInput()
      .appendField("CubeDetection.")
      .appendField("Location", "IDENTIFIER")
      .appendField(".")
      .appendField(new Blockly.FieldDropdown(PROPERTY_CHOICES), "PROP");
    this.setColour(propertyColorCubeDetection);
    // Assign 'this' to a variable for use in the tooltip closure below.
    var thisBlock = this;
    var TOOLTIPS = [
      ["Center", "Center Description"],
      ["Left", "Left Description"],
      ["Right", "Right Description"],
    ];
    this.setTooltip(function () {
      var key = thisBlock.getFieldValue("PROP");
      for (var i = 0; i < TOOLTIPS.length; i++) {
        if (TOOLTIPS[i][0] == key) {
          return TOOLTIPS[i][1];
        }
      }
      return "";
    });
  },
};

Blockly.JavaScript["cubedetection_getProperty_Location"] =
  Blockly.JavaScript["cubedetection_getProperty"];

// Blockly.FtcJava["cubedetection_getProperty_Location"] =
//   Blockly.FtcJava["cubedetection_getProperty"];
