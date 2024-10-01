window.House = class extends window.Rule {
    static doc = "a Victorian house in front of hills";
    static qualitative_params = ['height of hill', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

const canvas = new whole_canvas('azure');


// Usage directly with the constructor
const houseobj = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

const houseobj2 = houseobj

houseobj.placeObj(canvas, {x: 90, y: 50-20}, scale = 0.2)

houseobj2.placeObj(canvas, {x: 90-10, y: 50}, scale = 0.2)

====

window.House = class extends window.Rule {
    static doc = "a Victorian house in front of hills";
    static qualitative_params = ['height of hill', 'roof color'];
    static abstract_params = ['shape of windows']
    // No constructor needed
}

const canvas = new whole_canvas('azure');


const canvas = new whole_canvas('azure');

setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

renderObj(houseobj, {x: 60, y: 50-20}, scale = 0.2)

renderObj(houseobj2{x: 60-30, y: 50}, scale = 0.2)

===

