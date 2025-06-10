    //---Sets up Blockly Interface---
    Blockly.JavaScript.addReservedWords('exit');

    var searchspace = Blockly.inject("searchspace");

    var workspace = Blockly.inject('blocklyDiv', {
      media: './blocks/media/',
      //Temp Toolbox
      toolbox: '<xml><category name="temp"></category></xml>',
      move: {
        scrollbars: true,
        drag: true,
        wheel: false
      },
      theme: {
        'base': Blockly.Themes.Classic,
        'fontStyle': {
          "weight": "bold",
          "size": 12
        },
        'componentStyles': {
          'workspaceBackgroundColour': '#242424',
          "toolboxBackgroundColour": "#333",
          "scrollbarColour": "#424242",
          "toolboxForegroundColour": "#FFFFFF",
          "flyoutBackgroundColour": "#424242",
          "markerColour": "#FFFFFF"
        }
      },
      grid: {
        spacing: 50,
        length: 5,
        colour: '#505050',
      },
      trashcan: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
        pinch: true
      }

    });

    //Some Functions need Toolbox Loaded to Work
    function toolboxLoaded(toolboxTxt) {
      workspace.updateToolbox(toolboxTxt);

      //Sets up Title Category
      workspace.getToolbox().getToolboxItemById('Title').setDisabled('true');

      //Sets up Search Category
      searchInput = document.createElement('input');
      searchInput.type = "text";
      searchInput.placeholder = "Search";
      searchInput.classList.add("searchInput");
      searchInput.addEventListener("input", searchFor);
      searchInput.addEventListener("focus", searchFor);

      document.getElementById('Searcher.label').parentElement.appendChild(searchInput);
      document.getElementById('Searcher.label').parentElement.style.pointerEvents = "all";
    }

    //Search Functions in Work
    var blockList = [];

    //Function called upon input change
    function searchFor() {
      searchItem = searchInput.value;

      blockList = [];

      if (searchItem !== "")
        searchCategory(document.getElementById('toolbox').childNodes, searchItem);
      if (workspace.getToolbox().getSelectedItem())
        workspace.getToolbox().deselectItem_(workspace.getToolbox().getSelectedItem());
      workspace.getToolbox().setSelectedItem(workspace.getToolbox().getToolboxItemById('Searcher'));
    }

    //Searches through all available blocks
    function searchCategory(childNodes, searchItem) {
      searchItem = searchItem.toLowerCase();
      searchItems = searchItem.split(' ');
      categories = workspace.getToolbox().getToolboxItems();

      //Goes through Categories
      for (var c = 0; c < categories.length; c++) {
        //Ensures value is category and not hidden
        if (typeof categories[c].flyoutItems_ != "object" || categories[c].isHidden_ == true)
          continue;

        //Parse through Blocks in Category
        blocks = categories[c].flyoutItems_;
        for (var b = 0; b < blocks.length; b++) {

          //Grabs Tooltip from Block
          blockTip = searchspace.newBlock(blocks[b].type);
          for (var i = 0; i < blocks[b].blockxml.children.length; i++)
            if (blocks[b].blockxml.children[i].tagName == "FIELD")
              blockTip.setFieldValue(blocks[b].blockxml.children[i].innerHTML, blocks[b].blockxml.children[i].attributes[0].value);
          tooltip = blockTip.getTooltip().toLowerCase();
          blockTip.dispose();

          //Adds on bkgd name of block just in case (Matches what is shown on block more)
          tooltip += blocks[b].type.toLowerCase();

          //Checks if all search queries are results
          var match = true;
          for (var i = 0; i < searchItems.length; i++)
            if (tooltip.search(searchItems[i]) == -1)
              match = false;

          //Success! -> Put into List
          if (match)
            blockList.push({
              'kind': 'block',
              'blockxml': blocks[b].blockxml
            });
        }
        //20 or more can cause some lag (Just refine your search)
        if (blockList.length > 20)
          break;
      }
    }

    //Returns array of searched blocks
    var searchFlyout = function(workspace) {
      if (blockList.length == 0) {
        blockList.push({
          'kind': 'label',
          'text': 'No Results Found',
          'web-class': 'noResultsText'
        });
      }
      return blockList;
    };

    //Assigns new Blocks to SearchCategory when opened
    workspace.registerToolboxCategoryCallback(
      'SearchResults', searchFlyout);