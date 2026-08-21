import { useMemo, useState } from 'react'
import { CheckIcon, CopyIcon, RefreshCwIcon } from 'lucide-react'
import {
  entropyToMnemonic,
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import {
  CHAIN_OPTIONS,
  deriveAddresses,
  type ChainId,
} from '@/tools/bip39/derive-addresses'
import {
  WORDLIST_OPTIONS,
  getWordlist,
  type WordlistId,
} from '@/tools/bip39/wordlists'

const STRENGTHS = [
  { value: '128', words: 12, label: '12 词（128 bit）' },
  { value: '160', words: 15, label: '15 词（160 bit）' },
  { value: '192', words: 18, label: '18 词（192 bit）' },
  { value: '224', words: 21, label: '21 词（224 bit）' },
  { value: '256', words: 24, label: '24 词（256 bit）' },
] as const

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeMnemonic(value: string) {
  return value
    .normalize('NFKD')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
}

export default function Bip39Tool() {
  const [strength, setStrength] = useState('128')
  const [wordlistId, setWordlistId] = useState<WordlistId>('english')
  const [mnemonic, setMnemonic] = useState(() =>
    generateMnemonic(getWordlist('english'), 128),
  )
  const [passphrase, setPassphrase] = useState('')
  const [chainId, setChainId] = useState<ChainId>('ethereum')
  const { copied: copiedMnemonic, copy: copyMnemonic } = useCopyToClipboard()
  const { copied: copiedSeed, copy: copySeed } = useCopyToClipboard()
  const { copy: copyAddress } = useCopyToClipboard()
  const { copy: copyPrivateKey } = useCopyToClipboard()

  const wordlist = getWordlist(wordlistId)
  const wordlistLabel =
    WORDLIST_OPTIONS.find((item) => item.id === wordlistId)?.name ?? wordlistId
  const normalized = normalizeMnemonic(mnemonic)
  const wordCount = normalized ? normalized.split(' ').length : 0
  const valid = normalized ? validateMnemonic(normalized, wordlist) : false
  const chain = CHAIN_OPTIONS.find((item) => item.id === chainId)

  const derived = useMemo(() => {
    if (!normalized || !valid) {
      return {
        seedHex: '',
        addresses: [] as ReturnType<typeof deriveAddresses>,
      }
    }
    try {
      const seed = mnemonicToSeedSync(normalized, passphrase)
      return {
        seedHex: bytesToHex(seed),
        addresses: deriveAddresses(seed, chainId, 5),
      }
    } catch {
      return { seedHex: '', addresses: [] }
    }
  }, [normalized, valid, passphrase, chainId])

  function handleGenerate() {
    setMnemonic(generateMnemonic(wordlist, Number(strength)))
  }

  function handleWordlistChange(value: string) {
    const nextId = value as WordlistId
    const nextWordlist = getWordlist(nextId)
    setWordlistId(nextId)
    if (!normalized || !validateMnemonic(normalized, wordlist)) return
    try {
      const entropy = mnemonicToEntropy(normalized, wordlist)
      setMnemonic(entropyToMnemonic(entropy, nextWordlist))
    } catch {
      // 保持原文本，仅切换校验词表
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert variant="destructive">
        <AlertTitle>勿导入真实助记词</AlertTitle>
        <AlertDescription>
          本工具仅供学习与本地演示。请使用「生成助记词」得到的测试词组，不要粘贴真实主钱包助记词。全程本地计算、不上传、不保存；请勿截图或发给他人。
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="sm:w-56">
            <FieldLabel>词表语言</FieldLabel>
            <Select value={wordlistId} onValueChange={handleWordlistChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {WORDLIST_OPTIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field className="sm:w-56">
            <FieldLabel>强度</FieldLabel>
            <Select value={strength} onValueChange={setStrength}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STRENGTHS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Button type="button" onClick={handleGenerate}>
            <RefreshCwIcon data-icon="inline-start" />
            生成助记词
          </Button>
        </div>

        <Field>
          <FieldLabel htmlFor="bip39-mnemonic">
            助记词（{wordlistLabel}）
          </FieldLabel>
          <Textarea
            id="bip39-mnemonic"
            value={mnemonic}
            onChange={(event) => setMnemonic(event.target.value)}
            className="min-h-28 font-mono text-sm"
            spellCheck={false}
            placeholder="按当前词表输入或生成"
          />
          <FieldDescription>
            当前 {wordCount} 词 ·{' '}
            {normalized
              ? valid
                ? '校验通过'
                : '校验失败（词表或校验和不正确）'
              : '请输入助记词'}
            。切换语言会用同一熵换词表（不重新随机）；BIP39 seed 由词句本身派生，换语言后 seed/地址会变。多数钱包默认英文。
          </FieldDescription>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void copyMnemonic(normalized)}
            disabled={!normalized}
          >
            {copiedMnemonic ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {copiedMnemonic ? '已复制' : '复制助记词'}
          </Button>
        </div>

        <Field>
          <FieldLabel htmlFor="bip39-passphrase">
            BIP39 Passphrase（可选）
          </FieldLabel>
          <Input
            id="bip39-passphrase"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            spellCheck={false}
            placeholder="留空即可；填写会改变 seed 与地址"
          />
          <FieldDescription>
            这是可选密码短语，不是钱包登录密码；填错会得到另一套钱包。
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="bip39-seed">Seed（hex）</FieldLabel>
          <Textarea
            id="bip39-seed"
            value={derived.seedHex}
            readOnly
            className="min-h-28 font-mono text-xs break-all"
            placeholder="助记词校验通过后显示"
          />
        </Field>

        <Button
          type="button"
          variant="secondary"
          onClick={() => void copySeed(derived.seedHex)}
          disabled={!derived.seedHex}
        >
          {copiedSeed ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          {copiedSeed ? '已复制' : '复制 Seed'}
        </Button>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium">钱包地址 / 私钥</h2>
            <p className="text-sm text-muted-foreground">
              同一 seed，按链切换派生路径。私钥为 hex；单把私钥泄露通常只影响对应地址。
            </p>
          </div>

          <Field className="sm:max-w-md">
            <FieldLabel>链</FieldLabel>
            <Select
              value={chainId}
              onValueChange={(value) => setChainId(value as ChainId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CHAIN_OPTIONS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {chain ? (
              <FieldDescription>
                路径 <code className="font-mono">{chain.pathTemplate}</code>
                {chain.note ? ` · ${chain.note}` : ''}
              </FieldDescription>
            ) : null}
          </Field>

          {derived.addresses.length > 0 ? (
            <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>私钥（hex）</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {derived.addresses.map((item, index) => (
                    <TableRow key={item.path}>
                      <TableCell className="text-muted-foreground">
                        {index}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs break-all">
                            {item.address}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0"
                            title="复制地址"
                            onClick={() =>
                              void copyAddress(
                                item.address,
                                `已复制地址 #${index}`,
                              )
                            }
                          >
                            <CopyIcon />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs break-all">
                            {item.privateKey}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="shrink-0"
                            title="复制私钥"
                            onClick={() =>
                              void copyPrivateKey(
                                item.privateKey,
                                `已复制私钥 #${index}`,
                              )
                            }
                          >
                            <CopyIcon />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              助记词校验通过后显示前 5 组地址与私钥。
            </p>
          )}
        </div>
      </FieldGroup>
    </div>
  )
}
