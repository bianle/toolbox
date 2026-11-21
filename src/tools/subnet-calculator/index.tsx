import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

export default function SubnetCalculatorTool() {
  const [ip, setIp] = useState('192.168.1.10')
  const [mask, setMask] = useState('24')
  const [targetPrefix, setTargetPrefix] = useState('24')

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

  const split = useMemo(() => {
    if (!result.ok) {
      return null
    }
    const trimmed = targetPrefix.trim()
    if (!trimmed) {
      return null
    }
    if (!/^\d{1,2}$/.test(trimmed)) {
      return { ok: false as const, error: '目标前缀应为 0–32 的整数' }
    }
    try {
      return {
        ok: true as const,
        value: splitSubnets(
          result.value.network,
          result.value.prefix,
          Number(trimmed),
        ),
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : '拆分失败',
      }
    }
  }, [result, targetPrefix])

  const rows = result.ok ? buildRows(result.value) : []

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-3">
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
          <Field>
            <FieldLabel htmlFor="subnet-target">拆分目标前缀</FieldLabel>
            <Input
              id="subnet-target"
              value={targetPrefix}
              onChange={(event) => setTargetPrefix(event.target.value)}
              className="font-mono"
              spellCheck={false}
              placeholder="如 24"
            />
          </Field>
        </div>
        <FieldDescription>
          支持 CIDR 前缀或点分十进制掩码；IP 中带
          <span className="font-mono"> /24 </span>
          时会优先生效。填写拆分目标前缀可逐段列出子网起始 IP。全程本地计算。
        </FieldDescription>
      </FieldGroup>

      {result.ok ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <ResultRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>

          {split?.ok ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium">
                  子网拆分（/{split.value.targetPrefix}）
                </h2>
                <p className="text-xs text-muted-foreground">
                  共 {split.value.total.toLocaleString('en-US')} 段
                  {split.value.truncated
                    ? `，仅显示前 ${split.value.segments.length} 段`
                    : ''}
                </p>
              </div>
              <ScrollArea className="h-80 rounded-lg ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>网络地址（CIDR）</TableHead>
                      <TableHead>起始可用 IP</TableHead>
                      <TableHead>结束可用 IP</TableHead>
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
        </div>
      ) : result.error ? (
        <p className="text-sm text-destructive" role="alert">
          {result.error}
        </p>
      ) : null}
    </div>
  )
}
