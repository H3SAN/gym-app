#!/usr/bin/env node
/**
 * Downloads the face-api.js model weights needed for facial recognition.
 * Run once: node scripts/download-face-models.js
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const BASE_URL =
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'

const OUT_DIR = path.join(__dirname, '..', 'public', 'models')

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
]

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

function download(filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(OUT_DIR, filename)
    if (fs.existsSync(dest)) {
      console.log(`  skip  ${filename} (already exists)`)
      return resolve()
    }
    const file = fs.createWriteStream(dest)
    https
      .get(`${BASE_URL}/${filename}`, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          fs.unlinkSync(dest)
          https.get(res.headers.location, (r) => r.pipe(file))
          file.on('finish', () => { file.close(); resolve() })
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          console.log(`  done  ${filename}`)
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlinkSync(dest)
        reject(err)
      })
  })
}

;(async () => {
  console.log('Downloading face-api.js models to public/models/ ...')
  for (const f of FILES) {
    await download(f)
  }
  console.log('All models ready.')
})()
