# Shopify Presets Setup Guide

This guide will help you configure the wallpaper calculator to fetch product presets from your Shopify store.

## 1. Get Your Storefront API Access Token

1. Go to your Shopify admin: `https://living-quarters-3.myshopify.com/admin`
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps** (at the bottom)
4. Click **Create an app** or select an existing app
5. Go to **API credentials** tab
6. Under **Storefront API**, click **Configure**
7. Enable the following access scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
8. Click **Save**
9. Go back to **API credentials** and reveal the **Storefront API access token**
10. Copy this token

## 2. Add the Token to Your .env File

The project is already configured with a `.env` file. Simply add your Storefront API access token:

1. Open the `.env` file in the project root
2. Add your token to the `VITE_SHOPIFY_STOREFRONT_TOKEN` variable:

```env
VITE_SHOPIFY_STORE_DOMAIN=living-quarters-3.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_actual_token_here
VITE_SHOPIFY_COLLECTION_HANDLE=wallpaper
```

3. Save the file and restart the dev server

**Note**: The `.env` file is in `.gitignore`, so your API token won't be committed to git.

## 3. Set Up Product Metafields

The calculator uses the following custom metafields from your products:

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| `custom` | `roll_width` | Integer | Width of the roll in cm (e.g., `70`) |
| `custom` | `repeat_length` | Decimal | Pattern repeat length in cm (e.g., `66.24`) |
| `custom` | `a_b_set` | Boolean | Set to `true` if this wallpaper requires A/B matching |

**Note about A/B Sets**: When `a_b_set` is `true`, the calculator automatically doubles the effective roll width since two rolls are needed side-by-side to complete the pattern.

**Note about Roll Length**: All wallpaper rolls are 1000cm (10 meters), so roll length is hardcoded in the calculator and doesn't need to be set as a metafield.

### Verifying Your Metafields:

1. Go to **Products** → Select any wallpaper product
2. Scroll down to **Metafields**
3. Ensure these three fields are present with values
4. The system will only show products in the preset dropdown if they have both `roll_width` and `repeat_length` set

## 4. How It Works

- **Automatic Caching**: Product data is fetched once and cached in the browser's localStorage for 24 hours
- **Daily Refresh**: After 24 hours, the calculator will automatically fetch fresh data from Shopify
- **Offline Support**: Once cached, presets work even without an API connection
- **Fallback**: If the API token is not configured, the calculator still works with manual entry

## 5. Testing

1. Add the API token to your `.env` file
2. Restart the dev server (`npm run dev`)
3. Make sure you have at least one product in the "wallpaper" collection with the metafields set
4. Reload the page in your browser
5. Open browser console (F12) to see if presets loaded successfully
6. The dropdown should now show your wallpaper products

## 6. Collection Setup

Make sure your wallpaper products are in a collection with handle `wallpaper`. To check or change:

1. Go to **Products** → **Collections**
2. Find or create the collection
3. Check the URL handle (Settings panel on the right)
4. If different, update `VITE_SHOPIFY_COLLECTION_HANDLE` in your `.env` file

## Troubleshooting

### Presets not loading?

1. Check browser console for errors
2. Verify API token is correct
3. Ensure products have the metafields set
4. Check collection handle matches
5. Clear localStorage: `localStorage.clear()` in browser console

### Products missing from dropdown?

- Products must have ALL three metafields (`roll_length`, `roll_width`, `repeat_length`)
- Products without complete data are filtered out automatically
