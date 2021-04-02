
function init_page() {
  setNumbers()
  let inputs = document.getElementsByClassName("input")
  Array.from(inputs).forEach(function(input) {
    input.addEventListener('change', setNumbers);
  });
}

function setNumbers() {
  console.log("foo")
  let rollLength = document.getElementById("rollLengthInput").value
  let rollWidth = document.getElementById("rollWidthInput").value
  let repeatLength = document.getElementById("repeatLengthInput").value
  let wallLength = document.getElementById("wallLengthInput").value
  let wallHeight = document.getElementById("wallHeightInput").value
  document.getElementById("rollLength").innerHTML = rollLength/100;
  document.getElementById("rollWidth").innerHTML = rollWidth;
  document.getElementById("repeatLength").innerHTML = repeatLength;
  document.getElementById("wallLength").innerHTML = wallLength/100;
  document.getElementById("wallHeight").innerHTML = wallHeight/100;
  document.getElementById("total").innerHTML = calculateRollsRequired(rollLength, rollWidth, repeatLength, wallLength, wallHeight);
}

function calculateRollsRequired(rollLength, rollWidth, repeatLength, wallLength, wallHeight) {

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

init_page()