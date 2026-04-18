'use client'

import { useState, useEffect } from 'react'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

let cached: LoadState = 'idle'
const listeners: Array<(s: LoadState) => void> = []

function notify(s: LoadState) {
  cached = s
  listeners.forEach((fn) => fn(s))
}

export function useFaceApi() {
  const [state, setState] = useState<LoadState>(cached)

  useEffect(() => {
    listeners.push(setState)
    setState(cached)

    if (cached === 'idle') {
      loadModels()
    }

    return () => {
      const i = listeners.indexOf(setState)
      if (i >= 0) listeners.splice(i, 1)
    }
  }, [])

  return state
}

async function loadModels() {
  notify('loading')
  try {
    const faceapi = await import('face-api.js')
    const MODEL_URL = '/models'
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    notify('ready')
  } catch (err) {
    console.error('[FACE-API LOAD]', err)
    notify('error')
  }
}
