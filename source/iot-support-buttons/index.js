/*
IoT button Event:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}
*/
'use strict'

const url = require('url')
const https = require('https')
const AWS = require('aws-sdk')
const SES = new AWS.SES()

const conf = require('./conf.json')
const emailFrom = process.env.SES_FROM

exports.handler = async (event, context, callback) => {
  console.log(event) // debug

  const deviceID = event.serialNumber
  if (conf[deviceID]) {
    const location = conf[deviceID].location
    const email = conf[deviceID].email
    const emailSubject = conf[deviceID].emailSubject
    const teamsWebHook = conf[deviceID].teamsWebHook

    if (email) {
      try {
        await emailNotification(deviceID, email, emailSubject, location)
        console.log(`support request from ${location} sent via email to ${email}`)
      } catch (err) {
        console.log(err, err.stack)
        return callback(new Error('error sending email notification'))
      }
    }

    if (teamsWebHook) {
      try {
        await teamsNotification(teamsWebHook, location)
        console.log(`support request from ${location} sent to MsTeams`)
      } catch (err) {
        console.log(err, err.stack)
        return callback(new Error('error sending Teams notification'))
      }
    } else {
      callback(new Error(`no configuration found for device: ${deviceID}`))
    }
  }
}

function emailNotification (deviceID, email, emailSubject, location) {
  const params = {
    Source: emailFrom,
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Subject: {
        Data: `${emailSubject} - ${location}`
      },
      Body: {
        Html: {
          Data: `Support request from ${location}. Device ID: ${deviceID}`
        }
      }
    }
  }

  return SES.sendEmail(params).promise()
}

function teamsNotification (teamsWebHook, location) {
  const body = JSON.stringify({
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    'originator': '',
    'title': `Support request from ${location}`,
    'text': 'Please provide support.',
    'themeColor': 'c0c0c0'
  })
  const uri = url.parse(teamsWebHook)
  const options = {
    hostname: uri.hostname,
    path: uri.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let buf = ''
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(buf)
        }
        resolve(buf)
      })
      res.on('data', (chunk) => {
        buf += chunk
      })
    })

    req.write(body)
    req.on('error', reject)
    req.end()
  })
}

// eof
