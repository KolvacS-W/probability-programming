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
