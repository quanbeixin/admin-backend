const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

function format(level, source, message) {
  const time = new Date().toISOString();
  const tag = source ? `[${source}]` : '';
  return `${time} [${level.toUpperCase()}]${tag} ${message}`;
}

const logger = {
  error: (msg, source) => currentLevel >= levels.error && console.error(format('error', source, msg)),
  warn:  (msg, source) => currentLevel >= levels.warn  && console.warn(format('warn',  source, msg)),
  info:  (msg, source) => currentLevel >= levels.info  && console.log(format('info',   source, msg)),
  debug: (msg, source) => currentLevel >= levels.debug && console.log(format('debug',  source, msg)),

  // 返回绑定了 source 的子 logger
  child: (source) => ({
    error: (msg) => logger.error(msg, source),
    warn:  (msg) => logger.warn(msg,  source),
    info:  (msg) => logger.info(msg,  source),
    debug: (msg) => logger.debug(msg, source),
  }),
};

module.exports = logger;
