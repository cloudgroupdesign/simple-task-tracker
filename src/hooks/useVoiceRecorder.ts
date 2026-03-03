import { useState, useRef, useCallback, useEffect } from 'react'

export interface UseVoiceRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  audioBlob: Blob | null
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown'
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check permission state on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        setPermissionState(result.state as 'prompt' | 'granted' | 'denied')
        result.onchange = () => {
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied')
        }
      }).catch(() => {
        setPermissionState('unknown')
      })
    }
  }, [])

  const startTimer = useCallback(() => {
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    try {
      chunksRef.current = []
      setAudioBlob(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setPermissionState('granted')

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        releaseStream()
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error('Microphone access denied:', err)
      setPermissionState('denied')
      releaseStream()
    }
  }, [startTimer, releaseStream])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    stopTimer()
  }, [stopTimer])

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    stopTimer()
    releaseStream()
    chunksRef.current = []
    setAudioBlob(null)
    setElapsedSeconds(0)
  }, [stopTimer, releaseStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      releaseStream()
    }
  }, [stopTimer, releaseStream])

  return {
    isRecording,
    isPaused,
    elapsedSeconds,
    audioBlob,
    permissionState,
    start,
    stop,
    cancel,
  }
}
