function init_page() {
  getUrlParams()
  setNumbers()
  setEventListeners()
}

function setNumbers() {
  let rollLength = document.getElementById("rollLengthInput").value
  let rollWidth = document.getElementById("rollWidthInput").value
  let repeatLength = document.getElementById("repeatLengthInput").value
  let wallLength = document.getElementById("wallLengthInput").value
  let wallHeight = document.getElementById("wallHeightInput").value
  const calc = calculateRollsRequired(rollLength, rollWidth, repeatLength, wallLength, wallHeight)
  document.getElementById("stripLength").innerHTML = calc[0];
  document.getElementById("stripsToCover").innerHTML = calc[1];
  document.getElementById("stripsPerRoll").innerHTML = calc[2];
  document.getElementById("total").innerHTML = calc[3];
}

function setEventListeners() {
  let inputs = document.getElementsByClassName("input")
  Array.from(inputs).forEach(function(input) {
    input.addEventListener('change', setNumbers);
  });
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
  return [lengthPerStrip, stripsRequired, stripsPerRoll, Math.ceil(stripsRequired/stripsPerRoll)]
}

function getUrlParams() {
  const url = window.location.search
  const urlParams = getAllUrlParams(url)
  console.log(urlParams.rol)
  document.getElementById("rollLengthInput").value = parseInt(urlParams.rol)
  document.getElementById("rollWidthInput").value = parseInt(urlParams.row)
  document.getElementById("repeatLengthInput").value = parseInt(urlParams.repl)
  document.getElementById("wallLengthInput").value = parseInt(urlParams.wl)
  document.getElementById("wallHeightInput").value = parseInt(urlParams.wh)
}

function getAllUrlParams(url) {

  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {

    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');

      // set parameter name and value (use 'true' if empty)
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

      // if the paramName ends with square brackets, e.g. colors[] or colors[2]
      if (paramName.match(/\[(\d+)?\]$/)) {

        // create key if it doesn't exist
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        // if it's an indexed array e.g. colors[2]
        if (paramName.match(/\[\d+\]$/)) {
          // get the index value and add the entry at the appropriate position
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          // otherwise add the value to the end of the array
          obj[key].push(paramValue);
        }
      } else {
        // we're dealing with a string
        if (!obj[paramName]) {
          // if it doesn't exist, create property
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string'){
          // if property does exist and it's a string, convert it to an array
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          // otherwise add the property
          obj[paramName].push(paramValue);
        }
      }
    }
  }

  return obj;
}

init_page()