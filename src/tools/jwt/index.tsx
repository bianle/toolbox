import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, KeyRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'
import {
  formatJwtClaimTime,
  getJwtExpiryState,
  parseJwt,
} from '@/tools/jwt/parse-jwt'

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function JsonBlock({
  title,
  value,
}: {
  title: string
  value: string
}) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <Field>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{title}</FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void copy(value)}
          disabled={!value}
        >
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <Textarea
        value={value}
        readOnly
        className="min-h-40 font-mono text-sm"
      />
    </Field>
  )
}

export default function JwtTool() {
  const [input, setInput] = useState(SAMPLE_JWT)
  const { copied, copy } = useCopyToClipboard()

  const result = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      return { ok: false as const, error: null }
    }
    try {
      return { ok: true as const, data: parseJwt(trimmed) }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '解析失败',
      }
    }
  }, [input])

  const headerText = result.ok
    ? JSON.stringify(result.data.header, null, 2)
    : ''
  const payloadText = result.ok
    ? JSON.stringify(result.data.payload, null, 2)
    : ''

  const expiry = result.ok
    ? getJwtExpiryState(result.data.payload)
    : null
  const iatText = result.ok
    ? formatJwtClaimTime(result.data.payload.iat)
    : null
  const expText = result.ok
    ? formatJwtClaimTime(result.data.payload.exp)
    : null
  const nbfText = result.ok
    ? formatJwtClaimTime(result.data.payload.nbf)
    : null

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="jwt-input">JWT</FieldLabel>
          <Textarea
            id="jwt-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="粘贴 JWT，支持 Bearer 前缀…"
            className="min-h-28 font-mono text-sm"
            spellCheck={false}
          />
          <FieldDescription>
            仅本地 Base64Url 解码，不校验签名；密钥不会上传。
          </FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setInput(SAMPLE_JWT)}
          >
            <KeyRound data-icon="inline-start" />
            填入示例
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void copy(input.trim())}
            disabled={!input.trim()}
          >
            {copied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {copied ? '已复制' : '复制原文'}
          </Button>
        </div>
      </FieldGroup>

      {result.ok ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {typeof result.data.header.alg === 'string' ? (
              <Badge variant="secondary">alg: {result.data.header.alg}</Badge>
            ) : null}
            {typeof result.data.header.typ === 'string' ? (
              <Badge variant="secondary">typ: {result.data.header.typ}</Badge>
            ) : null}
            {expiry ? (
              <Badge
                variant={expiry.tone === 'danger' ? 'destructive' : 'secondary'}
                className={cn(
                  expiry.tone === 'ok' &&
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                )}
              >
                {expiry.label}
              </Badge>
            ) : null}
          </div>

          {(iatText || expText || nbfText) && (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {iatText ? <p>iat：{iatText}</p> : null}
              {expText ? <p>exp：{expText}</p> : null}
              {nbfText ? <p>nbf：{nbfText}</p> : null}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <JsonBlock title="Header" value={headerText} />
            <JsonBlock title="Payload" value={payloadText} />
          </div>

          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Signature</FieldLabel>
            </div>
            <Textarea
              value={result.data.signature || '（空）'}
              readOnly
              className="min-h-20 font-mono text-xs break-all"
            />
            <FieldDescription>
              签名未验证。若要验签，需密钥/公钥，本工具不做网络请求。
            </FieldDescription>
          </Field>
        </div>
      ) : result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  )
}
