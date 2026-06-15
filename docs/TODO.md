# URGENT: when i click manage subscription i get 0hnh.6n-z~cz_.js:59  POST https://ai-app-icons.vercel.app/api/stripe/portal 500 (Internal Server Error)
Failed to execute 'json' on 'Response': Unexpected end of JSON input

why?




find where the current icon.png is in the project and put all icons there.

also, would it have been better overall in the long run to just have the backend be ts not python? then exactly use the same code in this create-app-icon package?

 

android adaptive icons should be 512x512 - look at how expo sdk 55 has its icons

 

make the usage not be down in the profile chip in the header, but rather as a bar above the textarea. make it also have border radius for the top corners. but make it touch naturally the chat area.

 

option to use emojis/icons

 

stream image and text data

consider
Yes, two clean paths:

Emojis: Pull from a data package like unicode-emoji-json (~80KB) or emojibase-data — gives you the full CLDR set already categorized with searchable names/keywords. Drop-in replacement for EMOJI_CATEGORIES and ALL_EMOJIS, plus you get real keyword search instead of the no-op fallback we have now.

Icons: lucide-react ships dynamicIconImports — a name → () => import('./icons/foo') map of all ~1500 icons. We'd swap the explicit imports for that map plus React's lazy(), render visible cells with Suspense, and add a small virtualized grid (or IntersectionObserver lazy mounting) so we don't try to render 1500 icons at once. Bundle stays tree-shaken — only icons the user actually views/picks get fetched.

The tradeoff is complexity (virtualization + lazy loading) vs. the current curated approach. My recommendation: do emojis now (cheap win, big improvement), defer icons unless users start asking for ones we don't have. Want me to swap the emoji list?

for not hardcoding icons and emojis

right now we look for any icon.png or adaptive-icon.png and then place the assets in that parent folder, but would it be easier to just read the roots' app.config.ts/js or app.json, see what expo.ios.icon value's parent folder is, and write there? (for npx create-expo_app)
