import { useEffect, useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  calculateSubnet,
  splitSubnets,
  type SubnetResult,
} from '@/tools/subnet-calculator/calc'

function ResultRow({ label, value }: { label: string; value: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <div className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center">
      <div className="min-w-40 shrink-0 text-sm text-muted-foreground">
        {label}
      </div>
      <Input value={value} readOnly className="flex-1 font-mono text-sm" />
      <Button
        type="button"
        variant="secondary"
        className="shrink-0"
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
  )
}

function buildRows(result: SubnetResult) {
  return [
    { label: '子网掩码', value: result.subnetMask },
    { label: '前缀长度', value: `/${result.prefix}` },
    { label: '通配符掩码', value: result.wildcardMask },
    { label: '网络地址', value: result.network },
    { label: '广播地址', value: result.broadcast },
    { label: 'IP 性质', value: result.ipRole },
    { label: '可用主机范围', value: result.hostRange },
    { label: '可用主机数', value: result.usableHosts.toLocaleString('en-US') },
    { label: '地址总数', value: result.totalHosts.toLocaleString('en-US') },
    { label: 'IP 类别', value: result.ipClass },
    { label: '地址类型', value: result.scope },
    { label: 'IP 二进制', value: result.ipBinary },
    { label: '掩码二进制', value: result.maskBinary },
    { label: '网络地址二进制', value: result.networkBinary },
    { label: '广播地址二进制', value: result.broadcastBinary },
  ]
}

const DEFAULT_IP = '192.168.1.10'
const DEFAULT_MASK = '24'
const DEFAULT_TARGET_PREFIX = '24'

export default function SubnetCalculatorTool() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ip, setIp] = useState(() => searchParams.get('ip') ?? DEFAULT_IP)
  const [mask, setMask] = useState(
    () => searchParams.get('mask') ?? DEFAULT_MASK,
  )
  const [targetPrefix, setTargetPrefix] = useState(
    () => searchParams.get('target') ?? DEFAULT_TARGET_PREFIX,
  )

  useEffect(() => {
    const next = new URLSearchParams()
    if (ip.trim()) next.set('ip', ip.trim())
    if (mask.trim()) next.set('mask', mask.trim())
    if (targetPrefix.trim()) next.set('target', targetPrefix.trim())
    setSearchParams(next, { replace: true })
  }, [ip, mask, targetPrefix, setSearchParams])

  const result = useMemo(() => {
    if (!ip.trim() && !mask.trim()) {
      return { ok: false as const, error: null }
    }
    try {
      return { ok: true as const, value: calculateSubnet(ip, mask) }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '计算失败',
      }
    }
  }, [ip, mask])

  const prefixOptions = result.ok
    ? Array.from(
        { length: 33 - result.value.prefix },
        (_, index) => result.value.prefix + index,
      )
    : []
  const selectedPrefix = result.ok
    ? prefixOptions.includes(Number(targetPrefix))
      ? Number(targetPrefix)
      : result.value.prefix
    : null

  const split = useMemo(() => {
    if (!result.ok || selectedPrefix === null) {
      return null
    }
    try {
      return {
        ok: true as const,
        value: splitSubnets(
          result.value.network,
          result.value.prefix,
          selectedPrefix,
        ),
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '拆分失败',
      }
    }
  }, [result, selectedPrefix])

  const rows = result.ok ? buildRows(result.value) : []

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="subnet-ip">IP 地址</FieldLabel>
            <Input
              id="subnet-ip"
              value={ip}
              onChange={(event) => setIp(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="192.168.1.10 或 192.168.1.10/24"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="subnet-mask">子网掩码 / 前缀</FieldLabel>
            <Input
              id="subnet-mask"
              value={mask}
              onChange={(event) => setMask(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="24、/24 或 255.255.255.0"
            />
          </Field>
        </div>
        <FieldDescription>
          支持 CIDR 前缀或点分十进制掩码；IP 中带
          <span className="font-mono"> /24 </span>
          时会优先生效。全程本地计算。
        </FieldDescription>
      </FieldGroup>

      {result.ok ? (
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">网段信息</TabsTrigger>
            <TabsTrigger value="split">子网划分</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex flex-col gap-3 pt-2">
            {rows.map((row) => (
              <ResultRow key={row.label} label={row.label} value={row.value} />
            ))}
          </TabsContent>

          <TabsContent value="split" className="flex flex-col gap-4 pt-2">
            <FieldGroup>
              <Field>
                <FieldLabel>目标前缀</FieldLabel>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[selectedPrefix ?? result.value.prefix]}
                    min={result.value.prefix}
                    max={32}
                    step={1}
                    ticks={prefixOptions}
                    disabled={result.value.prefix >= 32}
                    onValueChange={(values) =>
                      setTargetPrefix(
                        String(values[0] ?? result.value.prefix),
                      )
                    }
                    className="flex-1"
                  />
                  <span className="w-12 shrink-0 text-right font-mono text-sm">
                    /{selectedPrefix ?? result.value.prefix}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>/{result.value.prefix}</span>
                  <span>/32</span>
                </div>
              </Field>
              <FieldDescription>
                将当前 /{result.value.prefix} 网段按目标前缀拆分，逐段列出起始
                IP。目标前缀需不小于当前前缀。
              </FieldDescription>
            </FieldGroup>

            {split?.ok ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  /{result.value.prefix} → /{split.value.targetPrefix}：共{' '}
                  {split.value.total.toLocaleString('en-US')} 段
                  {split.value.truncated
                    ? `，仅显示前 ${split.value.segments.length} 段`
                    : ''}
                </p>
                <ScrollArea className="h-80 rounded-lg ring-1 ring-foreground/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">#</TableHead>
                        <TableHead>网络地址（CIDR）</TableHead>
                        <TableHead>起始可用 IP</TableHead>
                        <TableHead>结束可用 IP</TableHead>
                        <TableHead>可用 IP 数</TableHead>
                        <TableHead>广播地址</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {split.value.segments.map((segment) => (
                        <TableRow key={segment.index}>
                          <TableCell className="text-muted-foreground">
                            {segment.index}
                          </TableCell>
                          <TableCell className="font-mono">
                            {segment.cidr}
                          </TableCell>
                          <TableCell className="font-mono">
                            {segment.firstHost}
                          </TableCell>
                          <TableCell className="font-mono">
                            {segment.lastHost}
                          </TableCell>
                          <TableCell className="font-mono">
                            {segment.usableHosts.toLocaleString('en-US')}
                          </TableCell>
                          <TableCell className="font-mono">
                            {segment.broadcast}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : split && !split.ok ? (
              <p className="text-sm text-destructive" role="alert">
                {split.error}
              </p>
            ) : null}
          </TabsContent>
        </Tabs>
      ) : result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  )
}
