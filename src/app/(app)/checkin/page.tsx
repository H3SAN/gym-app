'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Shield, QrCode, ScanFace } from 'lucide-react'
import FaceVerify from '@/components/face/FaceVerify'

const QR_LIFETIME = 60 // seconds

export default function CheckInPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [tab, setTab] = useState<'qr' | 'face'>('qr')
  const [faceSuccess, setFaceSuccess] = useState(false)
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(QR_LIFETIME)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQr = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      const res = await fetch('/api/qr', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setQrSrc(data.qrCode)
        setExpiresAt(new Date(data.expiresAt))
        setSecondsLeft(QR_LIFETIME)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchQr()
  }, [fetchQr])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff <= 0) {
        fetchQr()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, fetchQr])

  // Auto-refresh 5s before expiry
  useEffect(() => {
    if (secondsLeft === 5 && !refreshing) {
      fetchQr()
    }
  }, [secondsLeft, refreshing, fetchQr])

  const progressPct = (secondsLeft / QR_LIFETIME) * 100
  const isExpiringSoon = secondsLeft <= 15

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Gym Check-In</h1>
        {tab === 'qr' && (
          <button
            onClick={fetchQr}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={`text-gray-700 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex mx-4 mt-3 bg-gray-100 rounded-2xl p-1 gap-1">
        <button
          onClick={() => setTab('qr')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'qr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <QrCode size={15} /> QR Code
        </button>
        <button
          onClick={() => { setTab('face'); setFaceSuccess(false) }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'face' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScanFace size={15} /> Face ID
        </button>
      </div>

      {/* Face tab */}
      {tab === 'face' && (
        <div className="flex-1 flex flex-col px-4 pt-4">
          {faceSuccess ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <ScanFace size={32} className="text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">Check-in Successful!</p>
              <p className="text-sm text-gray-400">Welcome to the gym. Enjoy your workout!</p>
              <button
                onClick={() => router.back()}
                className="mt-4 px-8 py-3 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700"
              >
                Done
              </button>
            </div>
          ) : token ? (
            <FaceVerify
              token={token}
              apiEndpoint="/api/face/checkin"
              onVerified={() => setFaceSuccess(true)}
            />
          ) : null}
        </div>
      )}

      {/* QR tab */}
      {tab === 'qr' && (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Security badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-4 py-2 rounded-full">
          <Shield size={14} className="text-green-600" />
          <p className="text-xs font-medium text-green-700">Secure · Single Use · Expires Soon</p>
        </div>

        {/* QR Code with animated ring */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div
            className={`absolute w-72 h-72 rounded-3xl border-4 transition-colors ${
              isExpiringSoon ? 'border-red-400 animate-pulse' : 'border-green-400 animate-pulse-ring'
            }`}
          />
          {/* QR Container */}
          <div className="w-64 h-64 bg-white rounded-2xl border-2 border-gray-100 shadow-lg flex items-center justify-center overflow-hidden relative z-10">
            {loading ? (
              <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl" />
            ) : qrSrc ? (
              <Image
                src={qrSrc}
                alt="Check-in QR Code"
                width={220}
                height={220}
                className="rounded-xl"
              />
            ) : (
              <div className="text-center">
                <p className="text-gray-400 text-sm">Failed to load QR</p>
                <button
                  onClick={fetchQr}
                  className="text-green-600 text-sm font-medium mt-2 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <div className="flex items-center gap-2">
            <p
              className={`text-3xl font-bold tabular-nums ${
                isExpiringSoon ? 'text-red-500' : 'text-gray-900'
              }`}
            >
              {secondsLeft}s
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isExpiringSoon ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-xs text-gray-400 text-center">
            {isExpiringSoon
              ? 'Refreshing soon...'
              : 'QR code auto-refreshes every 60 seconds'}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-2xl p-4 w-full max-w-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 text-center">
            Scan at entrance
          </h3>
          <ol className="space-y-1.5">
            {[
              'Show this QR code at the gym entrance',
              'Staff will scan to verify your membership',
              'Code is valid for one entry only',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      )}
    </div>
  )
}
