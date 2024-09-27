window.Car = class extends window.Rule {
    static doc = "a sports car";
    static parameters = ['door size', 'wheel color'];
    // No constructor needed
}

window.DrivingCar = class extends window.Rule {
    static doc = "a moving sports car with tail flame";
    static parameters = ['door size', 'wheel color'];
    // No constructor needed
}



const myCarRule = new window.Car();

// Generate an object with specific parameter values
const myCarObject = await myCarRule.generateObj('myCarObject', ['20', 'brown']);

const myCarObject_bigwindow = myCarObject.template.createObj('myCarObject_bigwheel', ['80', 'brown'])

const myDriveCarRule = new window.DrivingCar();

// Generate an object with specific parameter values
const myDrivingCarObject = await myDriveCarRule.generateObj('myDrivingCarObject', ['20', 'brown'], context = { objname: 'myCarObject', piecenames: [], pieceprompts: [] });
======

window.Car = class extends window.Rule {
    static doc = "a sports car";
    static parameters = ['wheel size', 'car color'];
    // No constructor needed
}

window.DrivingCar = class extends window.Rule {
    static doc = "a sports car with huge tail flame at the back of car";
    static parameters = ['wheel size', 'car color', 'flame size'];
    // No constructor needed
}


const canvas = new whole_canvas('azure');
const myCarRule = new window.Car();

// Generate an object with specific parameter values
const myCarObject = await myCarRule.generateObj('myCarObject', [20, 'grey']);

const myCarObject_bigwheel = await myCarObject.template.createObj('myCarObject_bigwheel', [80, 'red'])

const myDriveCarRule = new window.DrivingCar();

// Generate an object with specific parameter values
const myDrivingCarObject = await myDriveCarRule.generateObj('myDrivingCarObject', [80, 'red', 10], context = { objname: 'myCarObject_bigwheel', piecenames: [], pieceprompts: [] });

const myDrivingCarObject_largeflame = await myDrivingCarObject.template.createObj('myDrivingCarObject_largeflame', [80, 'red', 60])

myCarObject.placeObj(canvas, {x: 90, y: 50-20}, scale = 0.2)

myCarObject_bigwheel.placeObj(canvas, {x: 90-10, y: 50}, scale = 0.2)

myDrivingCarObject.placeObj(canvas, {x: 90-20, y: 50+20}, scale = 0.2)

myDrivingCarObject_largeflame.placeObj(canvas, {x: 90-40, y: 50+40}, scale = 0.2)

======

window.House = class extends window.Rule {
    static doc = "a Victorian house featuring a wraparound porch";
    static parameters = ['window number', 'roof color'];
    // No constructor needed
}

window.SmokingHouse = class extends window.Rule {
static doc = "a Victorian house featuring a wraparound porch with smoke coming out of chimney";
    static parameters = ['window number', 'roof color', 'smoke height'];
    // No constructor needed
}


const canvas = new whole_canvas('azure');
const house = new window.House();

// Generate an object with specific parameter values
const houseobj = await house.generateObj('houseobj', [2, 'grey']);

const houseobj2 = await houseobj.template.createObj('houseobj2', [6, 'red'])

const smokinghouse = new window.SmokingHouse();

// Generate an object with specific parameter values
const smokinghouseobj = await smokinghouse.generateObj('smokinghouseobj', [5, 'red', 20], context = { objname: 'houseobj2', piecenames: [], pieceprompts: [] });

const smokinghouseobj2 = await smokinghouseobj.template.createObj('smokinghouseobj2', [5, 'red', 40])

houseobj.placeObj(canvas, {x: 90, y: 50-20}, scale = 0.2)

houseobj2.placeObj(canvas, {x: 90-10, y: 50}, scale = 0.2)

smokinghouseobj2.placeObj(canvas, {x: 90-20, y: 50+20}, scale = 0.2)

smokinghouseobj2.placeObj(canvas, {x: 90-40, y: 50+40}, scale = 0.2)

=======
window.House = class extends window.Rule {
    static doc = "a Victorian house sitting on top of a porch";
    static parameters = ['height of the porch', 'roof color'];
    // No constructor needed
}

window.SmokingHouse = class extends window.Rule {
static doc = "a Victorian house sitting on top of a porch with smoke coming out of chimney";
    static parameters = ['height of the porch', 'roof color', 'smoke size'];
    // No constructor needed
}


const canvas = new whole_canvas('azure');
const house = new window.House();

// Generate an object with specific parameter values
const houseobj = await house.generateObj('houseobj', [50, 'grey']);

const houseobj2 = await houseobj.template.createObj('houseobj2', [100, 'red'])

const smokinghouse = new window.SmokingHouse();

// Generate an object with specific parameter values
const smokinghouseobj = await smokinghouse.generateObj('smokinghouseobj', [200, 'red', 20], context = { objname: 'houseobj2', piecenames: [], pieceprompts: [] });

const smokinghouseobj2 = await smokinghouseobj.template.createObj('smokinghouseobj2', [200, 'red', 80])

houseobj.placeObj(canvas, {x: 90, y: 50-20}, scale = 0.2)

houseobj2.placeObj(canvas, {x: 90-10, y: 50}, scale = 0.2)

smokinghouseobj.placeObj(canvas, {x: 90-20, y: 50+20}, scale = 0.2)

smokinghouseobj2.placeObj(canvas, {x: 90-40, y: 50+40}, scale = 0.2)

======
window.Tree = class extends window.Rule {
    static doc = "a dense tree with random shape";
    static parameters = ['size of the leaves', 'number of the branches', 'leave color'];
    // No constructor needed
}

function divideCanvasIntoBlocks(canvasWidth = 100, canvasHeight = 100, numBlocks = 7) {
    // Create arrays to store the x and y coordinates of the dividing lines
    let xLines = [0, canvasWidth];
    let yLines = [0, canvasHeight];
  
    // Generate random dividing lines
    for (let i = 0; i < numBlocks - 2; i++) {
      if (i % 2 === 0) {
        xLines.push(Math.floor(Math.random() * canvasWidth));
      } else {
        yLines.push(Math.floor(Math.random() * canvasHeight));
      }
    }
  
    // Sort the lines
    xLines.sort((a, b) => a - b);
    yLines.sort((a, b) => a - b);
  
    // Generate blocks with four corner coordinates
    let blocks = [];
    for (let i = 0; i < xLines.length - 1; i++) {
      for (let j = 0; j < yLines.length - 1; j++) {
        blocks.push({
          topLeft: { x: xLines[i], y: yLines[j] },
          topRight: { x: xLines[i+1], y: yLines[j] },
          bottomLeft: { x: xLines[i], y: yLines[j+1] },
          bottomRight: { x: xLines[i+1], y: yLines[j+1] }
        });
      }
    }
  
    // Convert block coordinates to the requested format (0-100 range)
    let coordinates = blocks.map(block => ({
      topLeft: { 
        x: Math.floor(block.topLeft.x / canvasWidth * 100),
        y: Math.floor(block.topLeft.y / canvasHeight * 100)
      },
      topRight: { 
        x: Math.floor(block.topRight.x / canvasWidth * 100),
        y: Math.floor(block.topRight.y / canvasHeight * 100)
      },
      bottomLeft: { 
        x: Math.floor(block.bottomLeft.x / canvasWidth * 100),
        y: Math.floor(block.bottomLeft.y / canvasHeight * 100)
      },
      bottomRight: { 
        x: Math.floor(block.bottomRight.x / canvasWidth * 100),
        y: Math.floor(block.bottomRight.y / canvasHeight * 100)
      }
    }));
  
    return coordinates;
  }
  
  // Usage
  let blockCoordinates = divideCanvasIntoBlocks();
  
  // Array of colors to choose from
  const treeColors = [
    "#228B22", // ForestGreen
    "#006400", // DarkGreen
    "#8B4513", // SaddleBrown
    "#556B2F", // DarkOliveGreen
    "#6B8E23", // OliveDrab
    "#2E8B57", // SeaGreen
    "#8FBC8F", // DarkSeaGreen
    "#A0522D", // Sienna
    "#8B7765", // RosyBrown
    "#D2691E", // Chocolate
  ];
  
  const canvas = new whole_canvas('azure');
  const tree = new window.Tree();
  
  // Wrap the asynchronous operations in an async function
  async function placeObjects() {
    // Generate an object with specific parameter values
    const treeobj = await tree.generateObj('treeobj', [50, 50, 'green']);
    
    for (let idx = 0; idx < blockCoordinates.length; idx++) {
      const block = blockCoordinates[idx];
      const specifictreeobj = await treeobj.template.createObj('specifictreeobj' + idx.toString(), [
        Math.random() * (100 - 20) + 20,
        Math.random() * (100 - 20) + 20,
      treeColors[Math.floor(Math.random() * treeColors.length)]
      ]);
      
      specifictreeobj.placeObj(canvas, null, 1, block.topLeft, block.topRight, block.bottomLeft, block.bottomRight);
    }
  
  }
  
  // Call the async function
  placeObjects().catch(error => console.error('Error:', error));
  