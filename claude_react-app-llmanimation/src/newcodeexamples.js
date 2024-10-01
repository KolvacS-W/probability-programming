window.House = class extends window.Rule {
    static doc = "a Victorian house in front of hills";
    static qualitative_params = ['height of hill', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

const canvas = new whole_canvas('azure');


setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await houseobj;

renderObj(houseobj, {x: 60, y: 50-20}, scale = 0.3)

renderObj(houseobj2, {x: 60-30, y: 50}, scale = 0.3)
====

window.House = class extends window.Rule {
    static doc = "a Victorian house in front of hills";
    static qualitative_params = ['height of hill', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

setBackground('azure')
// Usage directly with the constructor
setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

renderObj(houseobj, {x: 60, y: 50-20}, scale = 0.3)

renderObj(houseobj2, {x: 60-30, y: 50}, scale = 0.3)
===


window.House = class extends window.Rule {
    static doc = "a Victorian house with chimney";
    static qualitative_params = ['height of chimney', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([20, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await houseobj.modify([40, 'red'], ['random non-rectangle shape'])

const houseobj3 = await houseobj.modify([40, 'red'], ['round shape'])

const houseobj4 = await houseobj.modify([50, 'blue'])

renderObj(houseobj, {x: 20, y: 20}, scale = 0.3)

renderObj(houseobj2, {x: 20, y: 60}, scale = 0.3)

renderObj(houseobj3, {x: 60, y: 20}, scale = 0.3)

===


window.House = class extends window.Rule {
    static doc = "a Victorian house with chimney";
    static qualitative_params = ['height of chimney', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

window.HousewithHill = class extends window.Rule {
    static doc = "a Victorian house with chimney in front of a hill";
    static qualitative_params = ['height of chimney', 'roof color', 'color of hill'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([20, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await window.HousewithHill.generateObj([30, 'red', 'green'], ['triangle shape'], houseobj)

const houseobj3 = await window.HousewithHill.generateObj([40, 'blue', 'orange'], ['diamond shape'], houseobj)



renderObj(houseobj, {x: 20, y: 20}, scale = 0.3)

renderObj(houseobj2, {x: 20, y: 60}, scale = 0.3)

renderObj(houseobj3, {x: 60, y: 60}, scale = 0.3)

===

window.House = class extends window.Rule {
    static doc = "a Victorian house with chimney";
    static qualitative_params = ['height of chimney', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

window.HousewithHill = class extends window.Rule {
    static doc = "a Victorian house with chimney in front of a hill";
    static qualitative_params = ['height of chimney', 'roof color', 'color of hill'];
    static abstract_params = ['color of special brick', 'size of mark']
    // No constructor needed
}

setBackground('azure')
// Usage directly with the constructor
//const houseobj = await window.House.generateObj([20, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await window.HousewithHill.generateObj([30, 'red', 'green'], ['blue', 'bigger'], 'firsthouse')

const houseobj3 = await window.HousewithHill.generateObj([40, 'blue', 'orange'], ['purple', 'smaller'], 'firsthouse')



//renderObj(houseobj, {x: 20, y: 20}, scale = 0.3)

renderObj(houseobj2, {x: 20, y: 60}, scale = 0.3)

renderObj(houseobj3, {x: 60, y: 60}, scale = 0.3)