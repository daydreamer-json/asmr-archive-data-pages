import log4js from 'log4js';

log4js.configure({
  appenders: {
    System: {
      type: 'stdout',
    },
  },
  categories: {
    default: {
      appenders: ['System'],
      level: 'trace',
    },
  },
});

const logger: log4js.Logger = log4js.getLogger('System');
logger.trace('Logger initialized');
export default logger;
