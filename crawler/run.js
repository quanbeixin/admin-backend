const { runAll } = require('./scheduler/tasks');
const logger = require('./core/logger').child('run');

(async () => {
  logger.info('Crawler started.');
  try {
    await runAll();
  } catch (err) {
    logger.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
  logger.info('Crawler finished.');
  process.exit(0);
})();
