const url = window.location.search
const urlParamNames = {
  "rol": "rollLength",
  "row": "rollWidth",
  "repl": "repeatLength",
  "product": "productHandle"
}

// Array to store multiple walls
let walls = []
let wallIdCounter = 0

// Shopify configuration from environment variables
const SHOPIFY_CONFIG = {
  storeDomain: import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || '',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '',
  collectionHandle: import.meta.env.VITE_SHOPIFY_COLLECTION_HANDLE || 'wallpaper'
}

const CACHE_KEY = 'wallpaper_presets'
const CACHE_TIMESTAMP_KEY = 'wallpaper_presets_timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

async function init_page() {
  setupTabSwitching()
  setEventListeners()
  updateFromUrlParams()
  await loadWallpaperPresets()
  initializeWalls()
  // setNumbers() will be called by handlePresetSelection after presets load
}

function initializeWalls() {
  // Add first wall with default values from URL or defaults
  const urlParams = getAllUrlParams(url)
  const defaultLength = urlParams.wl ? parseInt(urlParams.wl) : 600
  const defaultHeight = urlParams.wh ? parseInt(urlParams.wh) : 250

  addWall(defaultLength, defaultHeight)

  // Set up add wall button
  const addWallBtn = document.getElementById('addWallBtn')
  if (addWallBtn) {
    addWallBtn.addEventListener('click', () => addWall())
  }
}

function addWall(length = 600, height = 250) {
  const wallId = wallIdCounter++
  walls.push({ id: wallId, length, height })
  renderWalls()
  setNumbers()
}

function removeWall(wallId) {
  walls = walls.filter(w => w.id !== wallId)
  renderWalls()
  setNumbers()
}

function updateWall(wallId, field, value) {
  const wall = walls.find(w => w.id === wallId)
  if (wall) {
    wall[field] = parseInt(value) || 0
    setNumbers()
  }
}

function renderWalls() {
  const container = document.getElementById('wallsContainer')
  if (!container) return

  container.innerHTML = walls.map((wall, index) => `
    <div class="flex gap-3 py-2" data-wall-id="${wall.id}">
      <div class="flex-1">
        <label class="block text-sm font-medium text-lq-textbeige mb-2">
          Wall ${index + 1} - Length
        </label>
        <div class="flex rounded-md shadow-sm">
          <input type="number" class="wall-input focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md border-gray-300 p-2"
                  value="${wall.length}"
                  data-wall-id="${wall.id}"
                  data-field="length">
          <span class="inline-flex items-center px-3 rounded-r bg-lq-darkbeige text-gray-500 p-2">
            cm
          </span>
        </div>
      </div>
      <div class="flex-1">
        <label class="block text-sm font-medium text-lq-textbeige mb-2">
          Wall ${index + 1} - Height
        </label>
        <div class="flex rounded-md shadow-sm">
          <input type="number" class="wall-input focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none ${walls.length > 1 ? 'rounded-l-md' : 'rounded-l-md rounded-r-md'} border-gray-300 p-2"
                  value="${wall.height}"
                  data-wall-id="${wall.id}"
                  data-field="height">
          ${walls.length > 1 ? `
            <button type="button" class="remove-wall-btn inline-flex items-center px-3 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-r" data-wall-id="${wall.id}">
              ×
            </button>
          ` : `
            <span class="inline-flex items-center px-3 rounded-r bg-lq-darkbeige text-gray-500 p-2">
              cm
            </span>
          `}
        </div>
      </div>
    </div>
  `).join('')

  // Add event listeners to inputs
  container.querySelectorAll('.wall-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const wallId = parseInt(e.target.dataset.wallId)
      const field = e.target.dataset.field
      updateWall(wallId, field, e.target.value)
    })
  })

  // Add event listeners to remove buttons
  container.querySelectorAll('.remove-wall-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wallId = parseInt(e.target.dataset.wallId)
      removeWall(wallId)
    })
  })
}

function setNumbers() {
  const rollLengthInput = document.getElementById("rollLengthInput")
  const rollWidthInput = document.getElementById("rollWidthInput")
  const repeatLengthInput = document.getElementById("repeatLengthInput")

  if (!rollLengthInput || !rollWidthInput || !repeatLengthInput) return

  const rollLength = rollLengthInput.value
  const rollWidth = rollWidthInput.value
  const repeatLength = repeatLengthInput.value

  // Check if we're using a preset with A/B set (only if wallpaper panel is visible)
  let isABSet = false
  let productHandle = null
  const wallpaperPanel = document.getElementById("wallpaperPanel")
  const presetSelect = document.getElementById("presetSelect")

  if (wallpaperPanel && !wallpaperPanel.classList.contains('hidden') && presetSelect && presetSelect.value) {
    try {
      const preset = JSON.parse(presetSelect.value)
      isABSet = preset.isABSet || false
      productHandle = preset.handle || null
    } catch (e) {
      // Not a preset, ignore
    }
  }

  // Group walls by height and sum their lengths
  const wallGroups = {}
  walls.forEach(wall => {
    const height = wall.height
    if (!wallGroups[height]) {
      wallGroups[height] = 0
    }
    wallGroups[height] += wall.length
  })

  // Calculate rolls needed for each height group and sum the totals
  let totalRolls = 0
  Object.entries(wallGroups).forEach(([height, totalLength]) => {
    const calc = calculateRollsRequired(rollLength, rollWidth, repeatLength, totalLength, height, isABSet)
    totalRolls += calc.rollsCount
  })

  // Display the total
  const unitText = isABSet
    ? (totalRolls === 1 ? "set" : "sets")
    : (totalRolls === 1 ? "roll" : "rolls")

  document.getElementById("total").innerHTML = `${totalRolls} ${unitText}`

  // Update URL with first wall dimensions for sharing
  const firstWall = walls[0] || { length: 600, height: 250 }
  updateUrl(rollLength, rollWidth, repeatLength, firstWall.length, firstWall.height, productHandle)
}

function setEventListeners() {
  // Add preset selector listener
  const presetSelect = document.getElementById("presetSelect")
  if (presetSelect) {
    presetSelect.addEventListener('change', handlePresetSelection)
  }

  // Custom dimension inputs
  const customInputs = ['rollLengthInput', 'rollWidthInput', 'repeatLengthInput']
  customInputs.forEach(id => {
    const input = document.getElementById(id)
    if (input) {
      input.addEventListener('change', setNumbers)
    }
  })
}

function setupTabSwitching() {
  const wallpaperTab = document.getElementById('wallpaperTab')
  const customTab = document.getElementById('customTab')
  const wallpaperPanel = document.getElementById('wallpaperPanel')
  const customPanel = document.getElementById('customPanel')

  if (!wallpaperTab || !customTab || !wallpaperPanel || !customPanel) return

  wallpaperTab.addEventListener('click', () => {
    // Switch to wallpaper tab
    wallpaperTab.classList.add('preset-tab-active', 'border-lq-darkgreen')
    wallpaperTab.classList.remove('border-lq-darkbeige', 'hover:border-lq-darkgreen')
    customTab.classList.remove('preset-tab-active', 'border-lq-darkgreen')
    customTab.classList.add('border-lq-darkbeige', 'hover:border-lq-darkgreen')

    wallpaperPanel.classList.remove('hidden')
    customPanel.classList.add('hidden')

    // Restore the selected preset
    const presetSelect = document.getElementById('presetSelect')
    if (presetSelect && presetSelect.value) {
      handlePresetSelection({ target: presetSelect })
    }
  })

  customTab.addEventListener('click', () => {
    // Switch to custom tab
    customTab.classList.add('preset-tab-active', 'border-lq-darkgreen')
    customTab.classList.remove('border-lq-darkbeige', 'hover:border-lq-darkgreen')
    wallpaperTab.classList.remove('preset-tab-active', 'border-lq-darkgreen')
    wallpaperTab.classList.add('border-lq-darkbeige', 'hover:border-lq-darkgreen')

    customPanel.classList.remove('hidden')
    wallpaperPanel.classList.add('hidden')

    // Clear background image and hide buy link
    const background = document.getElementById('wallpaperBackground')
    if (background) {
      background.style.backgroundImage = ''
      background.classList.remove('opacity-30')
      background.classList.add('opacity-0')
    }

    const buyLink = document.getElementById('buyLink')
    if (buyLink) {
      buyLink.classList.add('hidden')
    }

    // Make inputs editable again
    const rollLengthInput = document.getElementById("rollLengthInput")
    const rollWidthInput = document.getElementById("rollWidthInput")
    const repeatLengthInput = document.getElementById("repeatLengthInput")

    if (rollLengthInput) {
      rollLengthInput.removeAttribute('readonly')
      rollLengthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }
    if (rollWidthInput) {
      rollWidthInput.removeAttribute('readonly')
      rollWidthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }
    if (repeatLengthInput) {
      repeatLengthInput.removeAttribute('readonly')
      repeatLengthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }

    // Recalculate with current values
    setNumbers()
  })
}

function updateUrl(rollLength, rollWidth, repeatLength, wallLength, wallHeight, productHandle = null) {
  const baseurl = window.location.href.split('?')[0]
  let queryString = `?rol=${rollLength}&row=${rollWidth}&repl=${repeatLength}&wl=${wallLength}&wh=${wallHeight}`

  // Add product handle if a preset is selected
  if (productHandle) {
    queryString += `&product=${productHandle}`
  }

  history.pushState(null, null, queryString);
}

function calculateRollsRequired(rollLength, rollWidth, repeatLength, wallLength, wallHeight, isABSet = false) {

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

  // Round lengthPerStrip to 1 decimal place for display
  const lengthPerStripRounded = Math.round(lengthPerStrip * 10) / 10

  // Use "sets" for A/B set wallpapers, "rolls" for regular wallpapers
  const unitText = isABSet
    ? (total === 1 ? "set" : "sets")
    : (total === 1 ? "roll" : "rolls")

  // Return object with rolls count and formatted strings
  return {
    rollsCount: total,
    stripLength: lengthPerStripRounded,
    stripsToCover: pluralise(stripsRequired),
    stripsPerRoll: pluralise(stripsPerRoll),
    totalFormatted: `${total} ${unitText}`
  }
}

function updateFromUrlParams() {
  const urlParams = getAllUrlParams(url)
  if (!isEmpty(urlParams)) {
    // If a product is specified, ignore roll/repeat params (they come from Shopify)
    const hasProduct = !!urlParams.product

    if (!hasProduct && urlParams.rol) {
      const input = document.getElementById("rollLengthInput")
      if (input) input.value = parseInt(urlParams.rol)
    }
    if (!hasProduct && urlParams.row) {
      const input = document.getElementById("rollWidthInput")
      if (input) input.value = parseInt(urlParams.row)
    }
    if (!hasProduct && urlParams.repl) {
      const input = document.getElementById("repeatLengthInput")
      if (input) input.value = parseInt(urlParams.repl)
    }
    // Wall dimensions are handled in initializeWalls()
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

// ===== SHOPIFY PRESET FUNCTIONS =====

/**
 * Check if cached data is still valid based on timestamp
 */
function isCacheValid() {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
  if (!timestamp) return false

  const now = new Date().getTime()
  const cacheAge = now - parseInt(timestamp)
  return cacheAge < CACHE_DURATION
}

/**
 * Load wallpaper presets from cache or fetch from Shopify
 */
async function loadWallpaperPresets() {
  try {
    let presets = null

    // Try to load from cache first
    if (isCacheValid()) {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        presets = JSON.parse(cachedData)
        console.log('Loaded presets from cache')
      }
    }

    // If no valid cache, fetch from Shopify
    if (!presets) {
      presets = await fetchShopifyPresets()

      // Save to cache with timestamp
      if (presets && presets.length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(presets))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString())
        console.log('Fetched and cached presets from Shopify')
      }
    }

    // Populate the grid
    if (presets && presets.length > 0) {
      populatePresetDropdown(presets)
    }
  } catch (error) {
    console.error('Error loading wallpaper presets:', error)
  }
}

/**
 * Fetch wallpaper presets from Shopify Storefront API
 */
async function fetchShopifyPresets() {
  // If no access token is configured, return empty array
  if (!SHOPIFY_CONFIG.storefrontAccessToken) {
    console.warn('Shopify Storefront API token not configured. Presets will not be available.')
    return []
  }

  const query = `
    {
      collection(handle: "${SHOPIFY_CONFIG.collectionHandle}") {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
              variants(first: 10) {
                edges {
                  node {
                    sku
                  }
                }
              }
              metafields(identifiers: [
                {namespace: "custom", key: "roll_width"},
                {namespace: "custom", key: "repeat_length"},
                {namespace: "custom", key: "a_b_set"}
              ]) {
                namespace
                key
                value
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch(
    `https://${SHOPIFY_CONFIG.storeDomain}/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
      },
      body: JSON.stringify({ query })
    }
  )

  if (!response.ok) {
    throw new Error(`Shopify API request failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`Shopify API errors: ${JSON.stringify(data.errors)}`)
  }

  // Parse the response and extract preset data
  const products = data.data?.collection?.products?.edges || []

  return products.map(({ node }) => {
    // Filter out null metafields
    const metafields = (node.metafields || []).filter(m => m !== null)

    // Extract dimensions from metafields
    const rollWidthRaw = metafields.find(m => m.key === 'roll_width')?.value
    const repeatLengthRaw = metafields.find(m => m.key === 'repeat_length')?.value
    const isABSet = metafields.find(m => m.key === 'a_b_set')?.value === 'true'

    // Default roll length to 1000cm (10 meters) - standard for wallpaper
    const rollLength = 1000

    // Parse values
    const rollWidth = rollWidthRaw ? parseFloat(rollWidthRaw) : null
    const repeatLength = repeatLengthRaw ? parseFloat(repeatLengthRaw) : null

    // If A/B set, double the effective roll width since two rolls are needed
    const effectiveRollWidth = rollWidth && isABSet ? rollWidth * 2 : rollWidth

    // Extract variant SKUs
    const variantSkus = (node.variants?.edges || [])
      .map(edge => edge.node.sku)
      .filter(sku => sku && sku.trim() !== '')

    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      variantSkus: variantSkus,
      imageUrl: node.featuredImage?.url || null,
      imageAlt: node.featuredImage?.altText || node.title,
      rollLength: rollLength,
      rollWidth: effectiveRollWidth,
      repeatLength: repeatLength,
      isABSet: isABSet
    }
  }).filter(preset => preset.rollWidth && preset.repeatLength)
}

/**
 * Populate the preset dropdown with wallpaper options
 */
function populatePresetDropdown(presets) {
  const select = document.getElementById('presetSelect')
  if (!select) {
    console.error('Preset select element not found')
    return
  }

  console.log('Populating dropdown with', presets.length, 'presets')

  // Clear loading state and enable dropdown
  select.innerHTML = ''
  select.removeAttribute('disabled')

  // Add preset options to the dropdown
  presets.forEach(preset => {
    const option = document.createElement('option')

    const widthRounded = Math.round(preset.rollWidth * 10) / 10
    const lengthRounded = Math.round(preset.repeatLength * 10) / 10
    const displayTitle = preset.isABSet ? `${preset.title} (A/B set)` : preset.title

    console.log('Adding preset:', preset.title, 'handle:', preset.handle)

    option.value = JSON.stringify({
      rollLength: preset.rollLength,
      rollWidth: preset.rollWidth,
      repeatLength: preset.repeatLength,
      imageUrl: preset.imageUrl || '',
      handle: preset.handle || '',
      isABSet: preset.isABSet,
      variantSkus: preset.variantSkus || []
    })

    option.textContent = `${displayTitle} - ${widthRounded}cm × ${lengthRounded}cm`
    select.appendChild(option)
  })

  // Check if there's a product parameter in the URL
  const urlParams = getAllUrlParams(window.location.search)
  let selectedPreset = false

  console.log('URL params:', urlParams)

  if (urlParams.product) {
    console.log('Looking for product:', urlParams.product)
    // Try to find and select the preset with matching handle or variant SKU
    const options = select.options
    const searchTerm = urlParams.product.toLowerCase()

    for (let i = 0; i < options.length; i++) {
      try {
        const preset = JSON.parse(options[i].value)
        const handle = (preset.handle || '').toLowerCase()

        console.log('Comparing:', handle, 'with', searchTerm)

        // Match against product handle (exact or partial) or any variant SKU
        if (handle === searchTerm ||
            handle.includes(searchTerm) ||
            (preset.variantSkus && preset.variantSkus.includes(urlParams.product))) {
          select.selectedIndex = i
          selectedPreset = true
          console.log('✓ Selected preset from URL:', preset.handle)
          break
        }
      } catch (e) {
        console.error('Error parsing preset:', e)
      }
    }

    if (!selectedPreset) {
      console.warn('✗ Product not found:', urlParams.product)
    }
  }

  // Check if we should use custom dimensions instead
  const hasCustomDimensions = urlParams.rol || urlParams.row || urlParams.repl

  if (!selectedPreset && hasCustomDimensions) {
    // Switch to custom tab
    console.log('Switching to custom size tab (custom dimensions in URL)')
    const customTab = document.getElementById('customTab')
    if (customTab) {
      customTab.click()
      // Manually trigger calculation since we're not selecting a preset
      setTimeout(() => setNumbers(), 100)
    }
  } else {
    // If no URL-based selection and no custom dimensions, select the first preset by default
    if (!selectedPreset && presets.length > 0) {
      select.selectedIndex = 0
    }

    // Trigger the handler to display the selected preset
    if (presets.length > 0) {
      handlePresetSelection({ target: select })
    }
  }
}

/**
 * Handle preset selection from dropdown
 */
function handlePresetSelection(event) {
  const select = event.target
  const value = select.value

  const background = document.getElementById('wallpaperBackground')
  const rollLengthInput = document.getElementById("rollLengthInput")
  const rollWidthInput = document.getElementById("rollWidthInput")
  const repeatLengthInput = document.getElementById("repeatLengthInput")

  // If "Custom dimensions" selected
  if (!value) {
    // Clear background image
    if (background) {
      background.style.backgroundImage = ''
      background.classList.remove('opacity-30')
      background.classList.add('opacity-0')
    }

    // Hide buy link
    const buyLink = document.getElementById('buyLink')
    if (buyLink) {
      buyLink.classList.add('hidden')
    }

    // Make paper inputs editable again
    if (rollLengthInput) {
      rollLengthInput.removeAttribute('readonly')
      rollLengthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }
    if (rollWidthInput) {
      rollWidthInput.removeAttribute('readonly')
      rollWidthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }
    if (repeatLengthInput) {
      repeatLengthInput.removeAttribute('readonly')
      repeatLengthInput.classList.remove('bg-gray-100', 'cursor-not-allowed')
    }
    return
  }

  // Parse preset data
  try {
    const preset = JSON.parse(value)

    // Update background image
    if (background && preset.imageUrl) {
      background.style.backgroundImage = `url(${preset.imageUrl})`
      background.classList.remove('opacity-0')
      background.classList.add('opacity-30')
    }

    // Update input fields (make them read-only when preset is selected)
    rollLengthInput.value = preset.rollLength
    rollWidthInput.value = preset.rollWidth
    repeatLengthInput.value = preset.repeatLength

    // Make paper dimension inputs read-only but keep wall inputs editable
    rollLengthInput.setAttribute('readonly', true)
    rollWidthInput.setAttribute('readonly', true)
    repeatLengthInput.setAttribute('readonly', true)

    rollLengthInput.classList.add('bg-gray-100', 'cursor-not-allowed')
    rollWidthInput.classList.add('bg-gray-100', 'cursor-not-allowed')
    repeatLengthInput.classList.add('bg-gray-100', 'cursor-not-allowed')

    // Show buy link if we have a product handle
    if (preset.handle) {
      const buyLink = document.getElementById('buyLink')
      const buyLinkUrl = document.getElementById('buyLinkUrl')
      if (buyLink && buyLinkUrl) {
        // Construct product URL - adjust domain as needed
        const productUrl = `https://living-quarters.co/products/${preset.handle}&utm_source=wallpaper-calculator-buy-link`
        buyLinkUrl.href = productUrl
        buyLink.classList.remove('hidden')
      }
    }

    // Recalculate
    setNumbers()
  } catch (error) {
    console.error('Error parsing preset data:', error)
  }
}

init_page()