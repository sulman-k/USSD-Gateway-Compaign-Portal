const randomString = require( "randomstring" ),
      config       = require( `${__config}/config` );

/**
 * Generate a random token, output of random string depends on options provided in randomString generator
 */
exports.randomToken = () => {
    return randomString.generate( config.random_code.options );
};

/**
 * Generate a random uuid
 */
exports.uuid = () => {
    return randomString.generate( config.random_code.uuid_options );
};