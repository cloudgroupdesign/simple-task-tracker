import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../store/AuthContext'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function CodeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const arr = value.split('')
    arr[index] = char
    const next = arr.join('').slice(0, 6)
    onChange(next)
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, 5)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-11 h-13 text-center text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-white"
        />
      ))}
    </div>
  )
}

export function Auth() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Code verification state
  const [showCodeStep, setShowCodeStep] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isLogin) {
      const result = await signIn(email, password)
      setLoading(false)
      if (result) setError(result)
    } else {
      // Registration: show code verification step
      setLoading(false)
      const code = generateCode()
      setGeneratedCode(code)
      setEnteredCode('')
      setCodeError(null)
      setShowCodeStep(true)
      setResendCooldown(120)
    }
  }

  async function handleVerifyCode() {
    if (enteredCode !== generatedCode) {
      setCodeError('Невірний код. Спробуй ще раз.')
      return
    }

    setCodeError(null)
    setLoading(true)

    const result = await signUp(email, password)
    setLoading(false)

    if (result) {
      setCodeError(result)
    }
    // If success, AuthContext will detect the new session and redirect
  }

  function handleResend() {
    const code = generateCode()
    setGeneratedCode(code)
    setEnteredCode('')
    setCodeError(null)
    setResendCooldown(120)
  }

  // Code verification screen
  if (showCodeStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-1">Підтвердження</h1>
          <p className="text-gray-500 text-center mb-2">Введи код для завершення реєстрації</p>

          {/* Show the generated code */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-blue-600 mb-1">Твій код підтвердження:</p>
            <p className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-700">
              {generatedCode}
            </p>
          </div>

          <div className="space-y-4">
            <CodeInput value={enteredCode} onChange={setEnteredCode} />

            {codeError && (
              <p className="text-sm text-red-500 text-center">{codeError}</p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={enteredCode.length < 6 || loading}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Підтвердити'}
            </button>

            {/* Resend button */}
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full py-2 text-sm text-gray-500 hover:text-blue-500 transition disabled:opacity-40 disabled:hover:text-gray-500"
            >
              {resendCooldown > 0
                ? `Новий код через ${resendCooldown} сек`
                : 'Згенерувати новий код'}
            </button>

            <button
              onClick={() => {
                setShowCodeStep(false)
                setGeneratedCode('')
                setEnteredCode('')
              }}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Login / Register form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Simple Tracker</h1>
        <p className="text-gray-500 text-center mb-8">
          {isLogin ? 'Увійди в акаунт' : 'Створи акаунт'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 bg-white"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? 'Увійти' : 'Зареєструватись'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          className="w-full mt-4 text-sm text-gray-500 hover:text-blue-500 transition text-center"
        >
          {isLogin ? 'Немає акаунту? Зареєструватись' : 'Вже є акаунт? Увійти'}
        </button>
      </div>
    </div>
  )
}
