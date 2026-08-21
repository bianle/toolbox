import { useEffect, useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, RefreshCwIcon } from 'lucide-react'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

const ALGORITHMS = ['SHA1', 'SHA256', 'SHA512'] as const
const DIGITS = ['6', '8'] as const
const PERIODS = ['30', '60'] as const

type Algorithm = (typeof ALGORITHMS)[number]

function randomBase32Secret(length = 20) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

function normalizeBase32(secret: string) {
  return secret.replace(/\s+/g, '').toUpperCase()
}

function normalizeHex(secret: string) {
  return secret.replace(/[\s:]+/g, '').toLowerCase()
}

function base32ToHex(secret: string) {
  return OTPAuth.Secret.fromBase32(normalizeBase32(secret)).hex
}

function hexToBase32(secret: string) {
  return OTPAuth.Secret.fromHex(normalizeHex(secret)).base32
}

function createInitialSecrets() {
  const base32 = randomBase32Secret()
  try {
    return { base32, hex: base32ToHex(base32) }
  } catch {
    return { base32, hex: '' }
  }
}

function TokenCard({
  label,
  value,
  muted,
  emphasized,
}: {
  label: string
  value: string
  muted?: boolean
  emphasized?: boolean
}) {
  const { copy } = useCopyToClipboard()

  return (
    <button
      type="button"
      onClick={() => value && void copy(value, `已复制${label}验证码`)}
      disabled={!value}
      title={value ? '点击复制' : undefined}
      className="flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-muted/50 disabled:cursor-default disabled:hover:bg-transparent"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          emphasized
            ? 'font-mono text-2xl font-medium leading-9 tracking-[0.18em]'
            : muted
              ? 'font-mono text-2xl leading-9 tracking-[0.18em] text-muted-foreground'
              : 'font-mono text-2xl leading-9 tracking-[0.18em]'
        }
      >
        {value || '------'}
      </span>
    </button>
  )
}

export default function OtpTool() {
  const [initial] = useState(createInitialSecrets)
  const [base32, setBase32] = useState(initial.base32)
  const [hex, setHex] = useState(initial.hex)
  const [issuer, setIssuer] = useState('Toolbox')
  const [label, setLabel] = useState('demo')
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA1')
  const [digits, setDigits] = useState('6')
  const [period, setPeriod] = useState('30')
  const [previousToken, setPreviousToken] = useState('')
  const [token, setToken] = useState('')
  const [nextToken, setNextToken] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { copied: copiedUri, copy: copyUri } = useCopyToClipboard()
  const { copied: copiedBase32, copy: copyBase32 } = useCopyToClipboard()
  const { copied: copiedHex, copy: copyHex } = useCopyToClipboard()

  function applyRandomSecret() {
    const next = randomBase32Secret()
    setBase32(next)
    try {
      setHex(base32ToHex(next))
    } catch {
      setHex('')
    }
  }

  function handleBase32Change(value: string) {
    setBase32(value)
    const normalized = normalizeBase32(value)
    if (!normalized) {
      setHex('')
      return
    }
    try {
      setHex(base32ToHex(normalized))
    } catch {
      setHex('')
    }
  }

  function handleHexChange(value: string) {
    setHex(value)
    const normalized = normalizeHex(value)
    if (!normalized) {
      setBase32('')
      return
    }
    try {
      setBase32(hexToBase32(normalized))
    } catch {
      // 输入过程中可能暂时非法，保留另一侧
    }
  }

  const totp = useMemo(() => {
    const normalized = normalizeBase32(base32)
    if (!normalized) return null
    try {
      return new OTPAuth.TOTP({
        issuer: issuer.trim() || 'Toolbox',
        label: label.trim() || 'account',
        algorithm,
        digits: Number(digits),
        period: Number(period),
        secret: OTPAuth.Secret.fromBase32(normalized),
      })
    } catch {
      return null
    }
  }, [base32, issuer, label, algorithm, digits, period])

  const uri = totp?.toString() ?? ''
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    if (!uri) {
      setQrDataUrl('')
      return
    }

    let cancelled = false
    void QRCode.toDataURL(uri, {
      width: 210,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })

    return () => {
      cancelled = true
    }
  }, [uri])

  useEffect(() => {
    if (!totp) {
      setPreviousToken('')
      setToken('')
      setNextToken('')
      setRemaining(0)
      setError(normalizeBase32(base32) ? '密钥无效，请检查 Base32 / Hex' : null)
      return
    }

    setError(null)
    const periodMs = totp.period * 1000

    const tick = () => {
      const now = Date.now()
      setPreviousToken(totp.generate({ timestamp: now - periodMs }))
      setToken(totp.generate({ timestamp: now }))
      setNextToken(totp.generate({ timestamp: now + periodMs }))
      setRemaining(totp.period - (Math.floor(now / 1000) % totp.period))
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [totp, base32])

  const progress = totp ? (totp.period - remaining) / totp.period : 0

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="otp-secret-base32">密钥（Base32）</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="otp-secret-base32"
                value={base32}
                onChange={(event) => handleBase32Change(event.target.value)}
                spellCheck={false}
                className="font-mono"
                placeholder="JBSWY3DPEHPK3PXP"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => void copyBase32(normalizeBase32(base32))}
                disabled={!normalizeBase32(base32)}
              >
                {copiedBase32 ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copiedBase32 ? '已复制' : '复制'}
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="otp-secret-hex">密钥（Hex）</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="otp-secret-hex"
                value={hex}
                onChange={(event) => handleHexChange(event.target.value)}
                spellCheck={false}
                className="font-mono"
                placeholder="48656c6c6f21dead"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => void copyHex(normalizeHex(hex))}
                disabled={!normalizeHex(hex)}
              >
                {copiedHex ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copiedHex ? '已复制' : '复制'}
              </Button>
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={applyRandomSecret}>
            <RefreshCwIcon data-icon="inline-start" />
            随机密钥
          </Button>
        </div>
        <FieldDescription>
          Base32 与 Hex 为同一密钥的不同编码，可互转；全程本地计算。
        </FieldDescription>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="otp-issuer">发行方</FieldLabel>
            <Input
              id="otp-issuer"
              value={issuer}
              onChange={(event) => setIssuer(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="otp-label">账户名</FieldLabel>
            <Input
              id="otp-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel>算法</FieldLabel>
            <Select
              value={algorithm}
              onValueChange={(value) => setAlgorithm(value as Algorithm)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ALGORITHMS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>位数</FieldLabel>
            <Select value={digits} onValueChange={setDigits}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DIGITS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>周期（秒）</FieldLabel>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PERIODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-4 rounded-xl p-4 ring-1 ring-foreground/10">
        <div className="grid gap-3 sm:grid-cols-3">
          <TokenCard label="上一个" value={previousToken} muted />
          <TokenCard label="当前" value={token} emphasized />
          <TokenCard label="下一个" value={nextToken} muted />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {remaining > 0 ? `${remaining}s 后刷新` : '—'}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[210px_1fr] md:items-start">
        <div className="flex size-[210px] items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-foreground/10">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="otpauth 绑定二维码"
              className="size-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-sm text-muted-foreground">
              有效密钥后生成二维码
            </p>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="otp-uri">otpauth URI</FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="otp-uri"
              value={uri}
              readOnly
              className="font-mono text-xs"
              placeholder="有效密钥后自动生成"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={() => void copyUri(uri)}
              disabled={!uri}
            >
              {copiedUri ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copiedUri ? '已复制' : '复制'}
            </Button>
          </div>
          <FieldDescription>
            可用 Authenticator 等 App 扫左侧二维码绑定。
          </FieldDescription>
        </Field>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
