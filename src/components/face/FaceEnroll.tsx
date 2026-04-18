'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useFaceApi } from '@/hooks/useFaceApi'
import { Camera, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'

interface Props {
  token: string
  enrolled: boolean
  onEnrolled: () => void
  onRemoved: () => void
}

type Phase = 'idle' | 'camera' | 'capturing' | 'sending' | 'success' | 'error'

export default function FaceEnroll({ token, enrolled, onEnrolled, onRemoved }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const modelState = useFaceApi()

  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [faceDetected, setFaceDetected] = useState(false)
  const detectionRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (detectionRef.current) clearInterval(detectionRef.current)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  async function startCamera() {
    setPhase('camera')
    setMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream

      // Poll for face presence every 500ms
      const faceapi = await import('face-api.js')
      detectionRef.current = setInterval(async () => {
        if (!videoRef.current) return
        const det = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        setFaceDetected(!!det)
      }, 500)
    } catch {
      setPhase('error')
      setMessage('Camera access denied. Please allow camera permissions.')
    }
  }

  async function capture() {
    if (!videoRef.current || !faceDetected) return
    setPhase('capturing')
    if (detectionRef.current) clearInterval(detectionRef.current)

    try {
      const faceapi = await import('face-api.js')
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      if (!detection) {
        setPhase('camera')
        setMessage('No face detected. Try again.')
        return
      }

      const embedding = Array.from(detection.descriptor)
      setPhase('sending')
      stopCamera()

      const res = await fetch('/api/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ embedding }),
      })

      if (res.ok) {
        setPhase('success')
        onEnrolled()
      } else {
        const data = await res.json()
        setPhase('error')
        setMessage(data.error || 'Enrollment failed')
      }
    } catch (err) {
      console.error(err)
      setPhase('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  async function removeEnrollment() {
    const res = await fetch('/api/face/enroll', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) onRemoved()
  }

  function cancel() {
    stopCamera()
    setPhase('idle')
    setFaceDetected(false)
    setMessage('')
  }

  if (modelState === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin" /> Loading face recognition models…
      </div>
    )
  }

  if (modelState === 'error') {
    return (
      <div className="px-4 py-3 text-xs text-red-500">
        Failed to load face recognition models.
      </div>
    )
  }

  return (
    <div>
      {/* Row in Sign-in methods */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
          <Camera size={16} className="text-gray-600" />
        </div>
        <p className="text-sm text-gray-700 flex-1">Face ID</p>
        {enrolled && phase !== 'camera' && phase !== 'capturing' && phase !== 'sending' ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <button
              onClick={removeEnrollment}
              className="p-1 rounded hover:bg-red-50"
              title="Remove face data"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        ) : phase === 'idle' ? (
          <button
            onClick={startCamera}
            className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-lg hover:bg-green-100"
          >
            Enroll
          </button>
        ) : null}
      </div>

      {/* Webcam panel */}
      {(phase === 'camera' || phase === 'capturing') && (
        <div className="mx-4 mb-3 rounded-2xl overflow-hidden border border-gray-100 bg-black">
          <div className="relative">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />
            {/* Face detected indicator */}
            <div
              className={`absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                faceDetected
                  ? 'bg-green-500 text-white'
                  : 'bg-black/50 text-white/60'
              }`}
            >
              {faceDetected ? 'Face detected' : 'Position your face'}
            </div>
          </div>
          <div className="p-3 flex gap-2">
            <button
              onClick={cancel}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={capture}
              disabled={!faceDetected || phase === 'capturing'}
              className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === 'capturing' ? 'Capturing…' : 'Capture Face'}
            </button>
          </div>
        </div>
      )}

      {phase === 'sending' && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-gray-400 px-1">
          <Loader2 size={13} className="animate-spin" /> Saving face data…
        </div>
      )}

      {phase === 'success' && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-green-600 px-1">
          <CheckCircle size={13} /> Face enrolled! You can now check in with your face.
        </div>
      )}

      {phase === 'error' && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-red-500 px-1">
          <XCircle size={13} /> {message}
          <button
            onClick={() => setPhase('idle')}
            className="underline ml-1"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
