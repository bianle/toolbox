import { useState } from 'react'
import { CheckIcon, CopyIcon, ShieldCheckIcon } from 'lucide-react'
import { compare, hash } from 'bcryptjs'

import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

const COST_OPTIONS = ['8', '9', '10', '11', '12', '13', '14'] as const

function parseHashMeta(value: string) {
  const match = value.trim().match(/^\$2[aby]?\$(\d{2})\$([./A-Za-z0-9]{22})/)
  if (!match) return null
  return {
    cost: Number(match[1]),
    salt: match[2] ?? '',
  }
}

export default function BcryptTool() {
  const [plain, setPlain] = useState('password')
  const [cost, setCost] = useState('10')
  const [hashValue, setHashValue] = useState('')
  const [hashError, setHashError] = useState<string | null>(null)
  const [hashing, setHashing] = useState(false)

  const [comparePlain, setComparePlain] = useState('password')
  const [compareHash, setCompareHash] = useState('')
  const [compareResult, setCompareResult] = useState<boolean | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)

  const { copied, copy } = useCopyToClipboard()
  const meta = hashValue ? parseHashMeta(hashValue) : null

  async function handleHash() {
    if (!plain) {
      setHashError('请输入明文')
      setHashValue('')
      return
    }
    setHashing(true)
    setHashError(null)
    try {
      const next = await hash(plain, Number(cost))
      setHashValue(next)
      setCompareHash(next)
    } catch (error) {
      setHashValue('')
      setHashError(error instanceof Error ? error.message : '加密失败')
    } finally {
      setHashing(false)
    }
  }

  async function handleCompare() {
    if (!comparePlain || !compareHash.trim()) {
      setCompareResult(null)
      setCompareError('请填写明文和哈希')
      return
    }
    setComparing(true)
    setCompareError(null)
    try {
      const matched = await compare(comparePlain, compareHash.trim())
      setCompareResult(matched)
    } catch (error) {
      setCompareResult(null)
      setCompareError(error instanceof Error ? error.message : '比对失败')
    } finally {
      setComparing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium">加密</h2>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bcrypt-plain">明文</FieldLabel>
            <Input
              id="bcrypt-plain"
              value={plain}
              onChange={(event) => setPlain(event.target.value)}
              spellCheck={false}
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field className="sm:w-40">
              <FieldLabel>成本因子</FieldLabel>
              <Select value={cost} onValueChange={setCost}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {COST_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}（2^{value}）
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button
              type="button"
              onClick={() => void handleHash()}
              disabled={hashing}
            >
              <ShieldCheckIcon data-icon="inline-start" />
              {hashing ? '计算中…' : '生成哈希'}
            </Button>
          </div>
          <FieldDescription>
            每次盐不同，同明文多次结果会变；数值越大越慢越安全。全程本地计算。
          </FieldDescription>

          <Field>
            <FieldLabel htmlFor="bcrypt-hash">哈希结果</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                id="bcrypt-hash"
                value={hashValue}
                readOnly
                className="min-h-24 font-mono text-sm"
                placeholder="点击生成后显示"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => void copy(hashValue)}
                disabled={!hashValue}
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <CopyIcon data-icon="inline-start" />
                )}
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
          </Field>

          {meta ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">cost: {meta.cost}</Badge>
              <Badge variant="secondary" className="font-mono">
                salt: {meta.salt}
              </Badge>
            </div>
          ) : null}

          {hashError ? (
            <p className="text-sm text-destructive" role="alert">
              {hashError}
            </p>
          ) : null}
        </FieldGroup>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-medium">比对</h2>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bcrypt-compare-plain">明文</FieldLabel>
            <Input
              id="bcrypt-compare-plain"
              value={comparePlain}
              onChange={(event) => setComparePlain(event.target.value)}
              spellCheck={false}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bcrypt-compare-hash">哈希</FieldLabel>
            <Textarea
              id="bcrypt-compare-hash"
              value={compareHash}
              onChange={(event) => setCompareHash(event.target.value)}
              className="min-h-24 font-mono text-sm"
              spellCheck={false}
              placeholder="$2a$10$..."
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCompare()}
            disabled={comparing}
          >
            {comparing ? '比对中…' : '开始比对'}
          </Button>

          {compareResult !== null ? (
            <p
              className={cn(
                'text-sm font-medium',
                compareResult ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}
            >
              {compareResult ? '匹配成功' : '不匹配'}
            </p>
          ) : null}

          {compareError ? (
            <p className="text-sm text-destructive" role="alert">
              {compareError}
            </p>
          ) : null}
        </FieldGroup>
      </section>
    </div>
  )
}
