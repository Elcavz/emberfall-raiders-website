/* Emberfall Raiders: game version manifest.
   The game loads this file at start-up (assets/scripts/Update.ts in the game repo). A player whose game
   is older than `min` for their platform sees a blocking UPDATE REQUIRED screen.

   Releasing a new version:
     1. Publish the new build (Google Play review done / KiX zip uploaded) and replace downloads/EmberfallRaiders.apk.
     2. THEN raise `latest` and `min` here and deploy the site. Raising `min` before the build is live
        locks players out with nothing to update to.
   Keep `message` short (about 50 characters); it is shown on the update screen. */
window.EMBERFALL_VERSION = {
  latest: '1.0.10',
  min: { android: '1.0.9', kix: '1.0.9' },
  message: '3 new heroes, drag-to-aim skills and more!',
  android: {
    store: 'https://play.google.com/store/apps/details?id=com.elcavz.emberfallraiders',
    apk: 'https://emberfall-raiders-website.onrender.com/downloads/EmberfallRaiders.apk',
  },
};
