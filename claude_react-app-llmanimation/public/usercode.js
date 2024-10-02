console.log('in user.js')
setBackground('azure')
// Usage directly with the constructor
const houseobj = await window.House.generateObj([50, 'grey'], ['random non-rectangle shape']);

const houseobj2 = await houseobj.modify([100, 'red'], ['random non-rectangle shape']);

const houseobj3 = await houseobj.modify([100, 'red'], ['round shape']);

const houseobj4 = await houseobj.modify([200, 'blue'], ['same as original svg']);

renderObj(houseobj, {x: 20, y: 20}, scale = 0.3);

renderObj(houseobj2, {x: 20, y: 60}, scale = 0.3);

renderObj(houseobj3, {x: 60, y: 20}, scale = 0.3);

renderObj(houseobj4, {x: 60, y: 60}, scale = 0.3);
