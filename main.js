let rollLength = 1000
let rollWidth = 70
let repeatLength = 100
let repeatWidth = 70
let wallLength = 2014
let wallHeight = 236

document.getElementById("rollLength").innerHTML = rollLength/100;
document.getElementById("rollWidth").innerHTML = rollWidth;
document.getElementById("repeatLength").innerHTML = repeatLength;
document.getElementById("wallLength").innerHTML = wallLength/100;
document.getElementById("wallHeight").innerHTML = wallHeight/100;
document.getElementById("total").innerHTML = totalRollsRequired();

function totalRollsRequired() {

  // How many repeats do we need to cover one wall height?
  const repeats = Math.ceil(wallHeight / repeatLength)

  // How long does each strip of paper need to be?
  const lengthPerStrip = repeats * repeatLength

  // How many strips of paper do we need to cover the width of the wall?
  const stripsRequired = Math.ceil(wallLength / rollWidth)

  // How many strips fit into the length of a roll?
  const stripsPerRoll = Math.floor(rollLength/lengthPerStrip)

  // Return the total number of rolls required
  return Math.ceil(stripsRequired/stripsPerRoll)
}

