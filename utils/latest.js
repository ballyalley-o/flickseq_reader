const fs = require('fs')
const path = require('path')
const { global } = require('../constants')
const {logger} = require('../middleware')

const USERPROFILE = global.userProfile

// folder path to logs to fetch the latest log
const logPath = path.join(
  USERPROFILE,
  'AppData',
  'Roaming',
  'HowickHLCv3',
  'logs'
)

const logType = {
    erp: 'ERP_log_',
    coil: 'COIL_log_',
    prod: 'PRODUCTION_log_',
    operations: 'OPERATIONS_log_'
}

const extType = {
  txt: '.txt',
  json: '.json',
  ini: 'ini'
}


/**
 * Grab the latest log file
 * @param {string} type
 * @param {string} ext
 * @param {func} callback
 */
const latestLog = (type, ext, callback) => {
    fs.readdir(logPath, (err, files) => {
      if (err) {
        console.error('Error reading folder:', err)
        return
      }
      // Filter the files to only include log files
      const logFiles = files.filter(
        (file) => file.startsWith(logType[type]) && file.endsWith(extType[ext])
      )

      if (logFiles.length === 0) {
        console.log('No log files found in the folder.')
        if (callback) {
          callback(null, null)
        }
        return
      }

      const latestLog = logFiles.reduce((latest, current) => {
        if (type === 'operations') {
          const currentDate = new Date(current.match(/\d{4}-\d{2}/)[0])
          const latestDate = new Date(latest.match(/\d{4}-\d{2}/)[0])
          return currentDate > latestDate ? current : latest
        } else if (type === 'erp') {
          const currentDate = new Date(current.match(/\d{4}-\d{2}-\d{2}/))
          const latestDate = new Date(latest.match(/\d{4}-\d{2}-\d{2}/))

          return currentDate > latestDate ? current : latest
        }
      })

      if (callback) {
        callback(null, latestLog)
      }
    })
}


const logLive = (type, ext) => {
  return new Promise((resolve, reject) => {
    latestLog(type, ext, (err, latestLog) => {
      if (err) {
        logger.error(err)
        reject(err)
      } else {
        logger.info('LOG FILE: ', latestLog)
        resolve(latestLog)
      }
    })
  })
}



module.exports = logLive