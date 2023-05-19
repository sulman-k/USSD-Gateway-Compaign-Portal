require( './app-globals' );
const cluster = require( 'cluster' ),
      numCPUs = require( 'os' ).cpus().length,
      logger  = require( `${__utils}/logger/logger` )( moduleName ),
      config  = require( `${__config}/config` );

if ( cluster.isMaster ) {
    logger.info( 'This is the master process: ', process.pid );
    for ( let i = 0; i < numCPUs; i++ ) {
        cluster.fork()
    }

    cluster.on( 'exit', worker => {
        logger.info( `Worker process ${process.pid} had died` );
        logger.info( `starting new worker` );
        cluster.fork()
    } )

} else {
    require( './app' );
    logger.info( `started a worker at ${process.pid}` );
}
