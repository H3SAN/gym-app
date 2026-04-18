'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useFaceApi } from '@/hooks/useFaceApi'
import { ScanFace, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  token: string
  onVerified: () => void
  /** Defaults to /api/face/verify. Pass /api/face/checkin to log a gym entry. */
  apiEndpoint?: string
}

type Phase = 'idle' | 'loading-cam' | 'scanning' | 'verifying' | 'success' | 'fail' | 'error'

export default function FaceVerify({ token, onVerified, apiEndpoint = '/api/face/verify' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const modelState = useFaceApi()

  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const scanLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (scanLoopRef.current) clearTimeout(scanLoopRef.current)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  async function startScan() {
    setPhase('loading-cam')
    setMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setPhase('scanning')
      scanLoop()
    } catch {
      setPhase('error')
      setMessage('Camera access denied.')
    }
  }

  async function scanLoop() {
    if (!videoRef.current) return
    const faceapi = await import('face-api.js')

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor()

    if (!detection) {
      // Keep scanning
      scanLoopRef.current = setTimeout(scanLoop, 600)
      return
    }

    stopCamera()
    setPhase('verifying')
    const embedding = Array.from(detection.descriptor)

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ embedding }),
      })
      const data = await res.json()

      if (res.ok && data.verified) {
        setPhase('success')
        setTimeout(onVerified, 1200)
      } else if (res.status === 404) {
        setPhase('error')
        setMessage('No face enrolled. Please enroll from your Profile page first.')
      } else {
        setPhase('fail')
        setMessage('Face not recognised. Try again or use QR code.')
      }
    } catch {
      setPhase('error')
      setMessage('Network error. Please try again.')
    }
  }

  function reset() {
    stopCamera()
    setPhase('idle')
    setMessage('')
  }

  if (modelState === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Loading face models…
      </div>
    )
  }

  if (modelState === 'error') {
    return (
      <p className="text-center text-sm text-red-500 py-6">
        Failed to load face recognition models.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {phase === 'idle' && (
        <button
          onClick={startScan}
          className="flex flex-col items-center gap-3 w-full p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
        >
          <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-green-200">
            <ScanFace size={28} className="text-gray-400 group-hover:text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Check in with Face ID</p>
            <p className="text-xs text-gray-400 mt-0.5">Tap to open camera and verify your face</p>
          </div>
        </button>
      )}

      {(phase === 'loading-cam' || phase === 'scanning') && (
        <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-black">
          <div className="relative">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Scanning frame */}
              <div className="w-44 h-52 border-2 border-green-400 rounded-3xl opacity-70" />
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 rounded-full text-xs text-white/80">
              {phase === 'loading-cam' ? 'Starting camera…' : 'Scanning…'}
            </div>
          </div>
          <div className="p-3">
            <button
              onClick={reset}
              className="w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'verifying' && (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader2 size={28} className="animate-spin text-green-600" />
          <p className="text-sm text-gray-500">Verifying identity…</p>
        </div>
      )}

      {phase === 'success' && (
        <div className="flex flex-col items-center gap-2 py-4">
          <CheckCircle size={36} className="text-green-500" />
          <p className="text-base font-semibold text-gray-900">Identity verified!</p>
          <p className="text-xs text-gray-400">Logging you in…</p>
        </div>
      )}

      {(phase === 'fail' || phase === 'error') && (
        <div className="w-full flex flex-col items-center gap-3 py-2">
          <div className="flex flex-col items-center gap-1">
            <XCircle size={32} className="text-red-500" />
            <p className="text-sm text-gray-700 text-center">{message}</p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
