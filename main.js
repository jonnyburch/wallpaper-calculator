const url = window.location.search
const urlParamNames = {
  "rol": "rollLength",
  "row": "rollWidth",
  "repl": "repeatLength",
  "wl": "wallLength",
  "wh": "wallHeight"
}
const rollLength = document.getElementById("rollLengthInput").value
const rollWidth = document.getElementById("rollWidthInput").value
const repeatLength = document.getElementById("repeatLengthInput").value
const wallLength = document.getElementById("wallLengthInput").value
const wallHeight = document.getElementById("wallHeightInput").value

function init_page() {
  setEventListeners()
  setNumbers()
  updateFromUrlParams()
  updateUrl()
}

function setNumbers() {
  const rollLength = document.getElementById("rollLengthInput").value
  const rollWidth = document.getElementById("rollWidthInput").value
  const repeatLength = document.getElementById("repeatLengthInput").value
  const wallLength = document.getElementById("wallLengthInput").value
  const wallHeight = document.getElementById("wallHeightInput").value
  const calc = calculateRollsRequired(rollLength, rollWidth, repeatLength, wallLength, wallHeight)
  document.getElementById("stripLength").innerHTML = calc[0];
  document.getElementById("stripsToCover").innerHTML = calc[1];
  document.getElementById("stripsPerRoll").innerHTML = calc[2];
  document.getElementById("total").innerHTML = calc[3];
}

function setEventListeners() {
  const inputs = document.getElementsByClassName("input")
  Array.from(inputs).forEach(function(input) {
    input.addEventListener('change', setNumbers)
    input.addEventListener('change', updateUrl)
  });
}

function updateUrl() {
  const baseurl = window.location.href.split('?')[0]
  console.log(rollLength)
  const queryString = `?rol=${rollLength}&row=${rollWidth}&repl=${repeatLength}&wl=${wallLength}&wh=${wallHeight}`
  const queryUrl = `<a class="underline" href="${baseurl}${queryString}">${baseurl}${queryString}</a>`
  const newUrl = [queryString, queryUrl]
  document.getElementById("shareUrl").innerHTML = newUrl[1]
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

  const total = Math.ceil(stripsRequired/stripsPerRoll)

  function pluralise(strips) {
    return strips == 1 ? `${strips} strip` : `${strips} strips`
  }
  // Return the total number of rolls required
  return [lengthPerStrip, pluralise(stripsRequired), pluralise(stripsPerRoll), `${total} ${total === 1 ? "roll" : "rolls"}`]
}

function updateFromUrlParams() {
  const urlParams = getAllUrlParams(url)
  console.log(urlParams)
  if (!isEmpty(urlParams)) {
    document.getElementById("rollLengthInput").value = parseInt(urlParams.rol)
    document.getElementById("rollWidthInput").value = parseInt(urlParams.row)
    document.getElementById("repeatLengthInput").value = parseInt(urlParams.repl)
    document.getElementById("wallLengthInput").value = parseInt(urlParams.wl)
    document.getElementById("wallHeightInput").value = parseInt(urlParams.wh)
  }
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
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

init_page()