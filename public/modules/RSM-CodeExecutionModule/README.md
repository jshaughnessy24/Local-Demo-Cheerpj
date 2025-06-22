# RSM-CodeExecutionModule
Submodule for the VRS Electron apps that packages together all the reusable simulator code - blockly, interfaces between unity and javascript, and some example scripts.

# Unity <> Electron Interfaces

## Reset Field
ResetField calls UnityInstance.SendMessage() to call FieldManager.resetField(). 
## Motors
### CurrentPosition
This is set in UPM-RobotConstructorKit, in EncoderActionManager. EAM requires ElectronFunctions.jslib to communicate, which is also in the UPM-RobotConstructorKit.


# Setup on a repo that already uses the package
the first to you clone the repo you will need to run the following commands to get the submodules that the electron repo depends on.
* git submodule init
* git submodule update
# Installation
## How to use this in an electron project
1.	See [this webpage](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
1.	https://docs.google.com/document/d/1OQxWRXHJ3nDUnGVtlwFgg1CBm_6FsthNRcoYBC-R9-A/edit?usp=sharing 
   Instructions:
1.	Open terminal and run: git submodule
	  add https://github.com/Virtual-FTC/RSM-CodeExecutionModule modules/RSM-CodeExecutionModule
1.	Delete from /assets/js/ the following files
        	beautify.js
      	  custom-converter.js
          format4js.js
          java-to-javascript.js (this file won’t be used ever)
          programExecution.js
**1.	(Do not delete programpageScript.js)**
1.	Move the /blocks/fonts folder and the /blocks/lessons folder into /assets
1.	Create a new /assets/images folder and toss all the jpg, png, and webp into it. This is just cleanup while we’re here. Also, the leftover assets/js.zip file can be deleted
1.	Delete the entire /blocks folder
1.	Now to use ctrl+shift+F to find and replace broken file paths
1.	/blocks/fonts —> /assets/fonts
1.	/blocks/lessons —> /assets/lessons
1.	/assets/js/beautify —> /modules/RSM-CodeExecutionModule/src/beautify
1.	/assets/js/custom-converter —> /modules/RSM-CodeExecutionModule/src/custom-converter
1.	/assets/js/format4js —> /modules/RSM-CodeExecutionModule/src/format4js
1.	Nothing should come up for java-to-javascript as it’s been deleted
1.	/assets/js/programExecution —> /modules/RSM-CodeExecutionModule/src/programExecution
1.	./blocks/ —> /modules/RSM-CodeExecutionModule/blocks/
1.	Now to fix the images. Enable regex in the search bar (It looks like .*)
1.	/assets/([\w-]+).png —> /assets/images/$1.png
1.	/assets/([\w-]+).jpg —> /assets/images/$1.jpg
1.	/assets/([\w-]+).webp —> /assets/images/$1.webp
1.	Add <script src="./modules/RSM-CodeExecutionModule/src/javascript-to-blocks-wrapper.js"></script> to the bottom of programpage.html, under …/blocks/procedures.js
1.	//Make sure you have this block code code in programpage.html//

1.	<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
1.	<script src="https://cdnjs.cloudflare.com/ajax/libs/typescript/5.0.4/typescript.min.js"></script>
1.	<script src="./modules/RSM-CodeExecutionModule/src/beautify.js"></script>
39.	<script src="./modules/RSM-CodeExecutionModule/src/custom-converter.js"></script>
40.	<script src="./modules/RSM-CodeExecutionModule/src/format4js.js"></script>

41.	//the important thing is that typescript.min.js (ts is the abbreviation). But double check that format4js.js is also there//
