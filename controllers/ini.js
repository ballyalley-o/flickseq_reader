const fs = require('fs')
// const path = require('path')
// const chokidar = require('chokidar')
// const io = require('../app')
const { logger, iniLooper } = require('../middleware')
const { paths, compareArr } = require('../utils')
const { GLOBAL } = require('../config')
const { BURN_IN_PARAMS, RESPONSE } = require('../constants')

const USERPROFILE = GLOBAL.userProfile

// @desc extract framesSet
// @path /api/0.0.1/ini
// @access Private - Dev [not implemented]
const iniExtract = async (req, res) => {
  if (USERPROFILE) {

    fs.readFile(paths.iniPath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      try {
        const lines = data.split('\n')

        let iniLines = []

        for (const line of lines) {
             const equalSign = line.replace(/=/g, ':')
             iniLines.push(equalSign)
        }

        // parse ini to push to array
        res.status(200).json(iniLines)
      } catch (err) {
        logger.error(err)
        res.status(500).json({ error: err.message })
      }
    })
  }
}

let prevIni = []
let modifiedIni = []

// @desc prepare ini for Simulation
// @path /api/0.0.1/ini/sim
// @access Private - Dev [not implemented]
const iniSimulation = async (req, res) => {
  if (USERPROFILE) {
    fs.readFile(paths.testFilesPath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      try {
        let lines = data.split('\n')
        prevIni.push(lines)

        for (const line of lines) {
          let modifiedLine = line

          iniLooper.iniBool('burnIn', modifiedLine, line)
          // const isBurnIn = line.includes(BURN_IN_PARAMS.burnIn)
          // if (isBurnIn) {
          //   const parts = line.split('=')
          //   if (parts.length === 2) {
          //     const boolValue = JSON.parse(parts[1].trim())
          //     // convert burnin to true
          //     if (boolValue == false) {
          //       parts[1] = 'true'
          //       modifiedLine = parts.join('=')
          //     }
          //   }
          // }

          // change target window value to 20
          const targetWindow = line.match(BURN_IN_PARAMS.targetWindow)
          if (targetWindow) {
            const parts = line.split('=')
            if (parts.length === 2) {
              const targetWinValue = parseFloat(parts[1].trim())

              // convert burnin to true
              if (targetWinValue < 20) {
                parts[1] = 20
                modifiedLine = parts.join('=')
              }
            }
          }

          // change time param to 300 if not already
          const time = line.match(BURN_IN_PARAMS.time)
          if (time) {
            const parts = line.split('=')
            if (parts.length === 2) {
              const timeValue = parseFloat(parts[1].trim())
              // convert burnin to true
              if (timeValue < 300) {
                parts[1] = 300
                modifiedLine = parts.join('=')
              }
            }
          }

          //  change the values for proxes and solenoids
          for (const param of BURN_IN_PARAMS.zeros) {
            const PARAM = line.includes(param)

            if (PARAM) {
              // Split the line to separate the parameter name and its value
              const parts = line.split('=')
              if (parts.length === 2) {
                // Trim and check if it's a valid number
                const value = parseFloat(parts[1].trim())
                if (!isNaN(value) && value !== 0) {
                  // Change the value to 0
                  parts[1] = '0'
                  modifiedLine = parts.join('=')
                }
              }
            }
          }

          modifiedIni.push(modifiedLine)
        }

          let modifiedData
          let counter = 0
          // Join the modified lines back into a single string
          if (data !== modifiedData) {
            counter += 1
            modifiedData = modifiedIni.join('\n')
          }

        prevIniJoin = prevIni.join('\n')
        modIniJoin = modifiedIni.join('\n')

        //compare purposes only: to avoid duplicating the data
        let prevLength = data.length
        let modLength = modifiedData.length

        // Write the modified data back to the file
        if (prevLength > modLength) {

          const changes = compareArr(data, modifiedData)


          fs.writeFile(paths.testFilesPath, modifiedData, (writeErr) => {
            if (writeErr) {
              res.status(500).json({ error: writeErr.message })
            } else {
              modifiedIni = []
              res.status(201).json({
                message: RESPONSE.iniSimulation,
                params: changes,
              })
            }
          })
        } else {
          res.status(200).json({
            message: RESPONSE.noChanges,
            params: [],
          })
        }
      } catch (err) {
        logger.error(err)
        res.status(500).json({ error: err.message })
      }
    })
  }
}

// TODO: ======================================================

// @desc compare ini
// @path /api/0.0.1/ini/compare
// @access Private - Dev [not implemented]
const iniCompare = async (req, res) => {
  let iniOne = []
  let iniTwo = []

  if (USERPROFILE) {
    fs.readFile(paths.iniPath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      try {
        const lines = data.split('\n')
        // push arr one,
        return iniOne.push(lines)
      } catch (err) {
        logger.error(err)
      }
    })
  }

  fs.readFile(paths.testFilesPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: err.message })
    }
    try {
      const lines = data.split('\n')
      // push arr one,
      return iniTwo.push(lines)

    } catch (err) {
      logger.error(err)
      res.status(500).json({ error: err.message })
    }
  })

  const comparisons = compareArr(iniOne, iniTwo)

  res.status(200).json({
    message: 'CHANGES',
    comparisons: { iniOne: iniOne, iniTwo: iniTwo },
  })
}


const iniController = { iniExtract, iniSimulation, iniCompare }
module.exports = iniController