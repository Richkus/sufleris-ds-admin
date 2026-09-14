const Encore = require('@symfony/webpack-encore');

// Manually configure the runtime environment if not already configured yet by the "encore" command.
if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // directory where compiled assets will be stored
    .setOutputPath('public/build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')

    // main entry point: bundles JS (Alpine.js) and its imported SCSS
    .addEntry('app', './assets/js/app.js')

    .enableSingleRuntimeChunk()

    /*
     * FEATURE CONFIG
     */
    .cleanupOutputBeforeBuild()
    .enableSourceMaps(!Encore.isProduction())
    // Versioning is intentionally OFF: this is a static site with no
    // backend to resolve manifest.json -> hashed filenames, and the Twig
    // templates reference /build/app.css /build/app.js directly. Keep
    // output filenames stable across dev/production builds.
    .enableVersioning(false)

    // enables Sass/SCSS support and Bootstrap customization
    .enableSassLoader()
;

module.exports = Encore.getWebpackConfig();
