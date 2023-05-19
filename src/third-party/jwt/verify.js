const jwa = require( "jwa" );
const timespan = require( "./timespan" );
const JWS_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

function isObject(thing) {
    return Object.prototype.toString.call( thing ) === "[object Object]";
}

function safeJsonParse(thing) {
    if ( isObject( thing ) )
        return thing;
    try {
        return JSON.parse( thing );
    } catch ( e ) {
        return undefined;
    }
}

function headerFromJWS(jwsSig) {
    const encodedHeader = jwsSig.split( ".", 1 )[0];
    return safeJsonParse( Buffer.from( encodedHeader, "base64" ).toString( "binary" ) );
}

function securedInputFromJWS(jwsSig) {
    return jwsSig.split( ".", 2 ).join( "." );
}

function signatureFromJWS(jwsSig) {
    return jwsSig.split( "." )[2];
}

function payloadFromJWS(jwsSig, encoding) {
    encoding = encoding || "utf8";
    const payload = jwsSig.split( "." )[1];
    return Buffer.from( payload, "base64" ).toString( encoding );
}

function isValidJws(string) {
    return JWS_REGEX.test( string ) && !!headerFromJWS( string );
}

function decode(jwsSig, opts) {
    opts = opts || {};

    if ( !isValidJws( jwsSig ) )
        return null;

    const header = headerFromJWS( jwsSig );

    if ( !header )
        return null;

    let payload = payloadFromJWS( jwsSig );
    if ( header.typ === "JWT" || opts.json )
        payload = JSON.parse( payload, opts.encoding );

    return {
        header   : header,
        payload  : payload,
        signature: signatureFromJWS( jwsSig )
    };
}

function verify(jwsSig, algorithm, secretOrKey) {
    if ( !algorithm ) {
        const err = new Error( "Missing algorithm parameter for verify" );
        err.code = "MISSING_ALGORITHM";
        throw err;
    }

    // jwsSig = toString(jwsSig);
    const signature = signatureFromJWS( jwsSig );
    const securedInput = securedInputFromJWS( jwsSig );
    const algo = jwa( algorithm );
    return algo.verify( securedInput, signature, secretOrKey );
}

exports.decode = decode();

module.exports = function (token, secretOrPublicKey, options, callback) {
    if ( ( typeof options === "function" ) && !callback ) {
        callback = options;
        options = {};
    }

    if ( !options )
        options = {};

    // clone this object since we are going to mutate it.
    options = Object.assign( {}, options );
    let done;

    if ( callback )
        done = callback;
    else {
        done = function (err, data) {
            if ( err ) throw err;
            return data;
        };
    }

    const clockTimestamp = Math.floor( Date.now() / 1000 );

    if ( !token )
        return done( "JWT must be provided" );

    if ( typeof token !== "string" )
        return done( "JWT must be a string" );

    const parts = token.split( "." );

    if ( parts.length !== 3 )
        return done( "JWT malformed" );

    let decodedToken;
    try {
        decodedToken = decode( token, { complete: true } );
    } catch ( err ) {
        return done( err );
    }

    if ( !decodedToken )
        return done( "Invalid token" );

    const header = decodedToken.header;
    let getSecret;

    if ( typeof secretOrPublicKey === "function" ) {
        if ( !callback )
            return done( "Verify must be called asynchronous if secret or public key is provided as a callback" );

        getSecret = secretOrPublicKey;
    } else {
        getSecret = function (header, secretCallback) {
            return secretCallback( null, secretOrPublicKey );
        };
    }

    return getSecret( header, function (err, secretOrPublicKey) {
        if ( err )
            return done( "Error in secret or public key callback: " + err.message );

        const hasSignature = parts[2].trim() !== "";
        if ( !hasSignature && secretOrPublicKey )
            return done( "JWT signature is required" );

        if ( hasSignature && !secretOrPublicKey ) {
            return done( "Secret or public key is missing" );
        }

        let valid;
        try {
            valid = verify( token, decodedToken.header.alg, secretOrPublicKey );
        } catch ( e ) {
            return done( e );
        }
        const payload = decodedToken.payload;

        if ( !valid )
            return done( "Invalid signature", payload );

        if ( !payload.tenantId )
            return done( "TenatId is missing from token" );

        if ( typeof payload.nbf !== "undefined" && !options.ignoreNotBefore ) {
            if ( typeof payload.nbf !== "number" )
                return done( "Invalid NotBefore (nbf) value" );


            if ( payload.nbf > clockTimestamp + ( options.clockTolerance || 0 ) )
                return done( "JWT not active", new Date( payload.nbf * 1000 ) );
        }

        if ( typeof payload.exp !== "undefined" ) {
            if ( typeof payload.exp !== "number" )
                return done( "Invalid Expiry(exp) value" );

            if ( clockTimestamp >= payload.exp + ( options.clockTolerance || 0 ) ) {
                return done( "JWT expired", new Date( payload.exp * 1000 ) );
            }
        }

        if ( options.issuer ) {
            const invalid_issuer =
                      ( typeof options.issuer === "string" && payload.iss !== options.issuer ) ||
                      ( Array.isArray( options.issuer ) && options.issuer.indexOf( payload.iss ) === -1 );

            if ( invalid_issuer )
                return done( "JWT issuer invalid. expected: " + options.issuer );
        }

        if ( options.subject ) {
            if ( payload.sub !== options.subject ) {
                return done( "JWT subject invalid. expected: " + options.subject );
            }
        }

        if ( options.jwtid ) {
            if ( payload.jti !== options.jwtid ) {
                return done( "JWT jwtid invalid. expected: " + options.jwtid );
            }
        }

        if ( options.maxAge ) {
            if ( typeof payload.iat !== "number" )
                return done( "Iat required when maxAge is specified" );

            const maxAgeTimestamp = timespan( options.maxAge, payload.iat );
            if ( typeof maxAgeTimestamp === "undefined" )
                return done( "\"MaxAge\" should be a number of seconds or string representing a timespan eg: \"1d\", \"20h\", 60" );

            if ( clockTimestamp >= maxAgeTimestamp + ( options.clockTolerance || 0 ) )
                return done( "MaxAge exceeded", new Date( maxAgeTimestamp * 1000 ) );
        }

        if ( options.complete === true ) {
            const signature = decodedToken.signature;
            return done( null,
                {
                    header   : header,
                    payload  : payload,
                    signature: signature
                }
            );
        }

        return done( null, payload );
    } );
};
