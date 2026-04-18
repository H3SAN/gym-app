'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const { token } = useAuthStore()
  const [permission, setPermission] = useState<PermissionState>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub)
      })
    })
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported || !token) return
    setIsLoading(true)

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)

      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as string,
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('[PUSH SUBSCRIBE]', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, token])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !token) return
    setIsLoading(true)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint }),
        })
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('[PUSH UNSUBSCRIBE]', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, token])

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
}
