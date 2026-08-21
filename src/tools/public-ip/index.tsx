import { useCallback, useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, SearchIcon } from 'lucide-react'

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
import {
  DEFAULT_PROVIDER_ID,
  fetchPublicIpsFromProvider,
  PUBLIC_IP_PROVIDERS,
  type IpSlot,
} from '@/tools/public-ip/fetch-public-ip'

function slotText(slot: IpSlot, loading: boolean) {
  if (loading) return '查询中…'
  switch (slot.status) {
    case 'idle':
      return ''
    case 'unsupported':
      return '不支持'
    case 'loading':
      return '查询中…'
    case 'ok':
      return slot.ip
    case 'error':
      return `失败：${slot.message}`
  }
}

function IpRow({
  id,
  label,
  slot,
  loading,
}: {
  id: string
  label: string
  slot: IpSlot
  loading: boolean
}) {
  const { copied, copy } = useCopyToClipboard()
  const value = slotText(slot, loading)
  const canCopy = slot.status === 'ok' && !loading

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={value}
          readOnly
          className="font-mono"
          placeholder="点击查询获取"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => slot.status === 'ok' && void copy(slot.ip)}
          disabled={!canCopy}
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
  )
}

const idleSlot: IpSlot = { status: 'idle' }

export default function PublicIpTool() {
  const [providerId, setProviderId] = useState(DEFAULT_PROVIDER_ID)
  const [ipv4, setIpv4] = useState<IpSlot>(idleSlot)
  const [ipv6, setIpv6] = useState<IpSlot>(idleSlot)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const query = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    setIpv4({ status: 'loading' })
    setIpv6({ status: 'loading' })
    try {
      const result = await fetchPublicIpsFromProvider(providerId, signal)
      setIpv4(result.ipv4)
      setIpv6(result.ipv6)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setIpv4(idleSlot)
      setIpv6(idleSlot)
      setError(err instanceof Error ? err.message : '获取失败')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    const controller = new AbortController()
    void query(controller.signal)
    return () => controller.abort()
    // 仅进页用默认源（icanhazip）查一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel>查询源</FieldLabel>
          <div className="flex w-full flex-row items-center gap-2">
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="min-w-0 flex-1 sm:max-w-56 sm:flex-none sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PUBLIC_IP_PROVIDERS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="shrink-0"
              onClick={() => void query()}
              disabled={loading}
            >
              <SearchIcon data-icon="inline-start" />
              {loading ? '查询中…' : '查询'}
            </Button>
          </div>
          <FieldDescription>
            进入页面会用默认源查询一次；切换源后需手动再查。不支持的协议显示「不支持」。
          </FieldDescription>
        </Field>

        <IpRow id="public-ipv4" label="IPv4" slot={ipv4} loading={loading} />
        <IpRow id="public-ipv6" label="IPv6" slot={ipv6} loading={loading} />
      </FieldGroup>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
