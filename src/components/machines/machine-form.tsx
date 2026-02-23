'use client'

import { useState, useCallback } from 'react'
import type { Machine } from '@/lib/machines/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MachineFormProps {
  machine?: Machine
  onSubmit: (data: MachineFormData) => void
  onCancel: () => void
  submitting?: boolean
}

export interface MachineFormData {
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password?: string
  privateKeyPath?: string
  passphrase?: string
  openclawPath: string
}

const INITIAL_DATA: MachineFormData = {
  name: '',
  host: '',
  port: 22,
  username: 'root',
  authType: 'password',
  password: '',
  privateKeyPath: '',
  passphrase: '',
  openclawPath: '~/.openclaw',
}

function formDataFromMachine(machine: Machine): MachineFormData {
  return {
    name: machine.name,
    host: machine.host,
    port: machine.port,
    username: machine.username,
    authType: machine.authType,
    password: '',
    privateKeyPath: machine.privateKeyPath ?? '',
    passphrase: '',
    openclawPath: machine.openclawPath,
  }
}

export function MachineForm({ machine, onSubmit, onCancel, submitting }: MachineFormProps) {
  const [formData, setFormData] = useState<MachineFormData>(
    machine ? formDataFromMachine(machine) : INITIAL_DATA
  )

  const handleChange = useCallback(
    (field: keyof MachineFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(formData)
    },
    [formData, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="名称" required>
        <input
          className={inputClass}
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="例：生产服务器 A"
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="主机" required>
          <input
            className={inputClass}
            value={formData.host}
            onChange={(e) => handleChange('host', e.target.value)}
            placeholder="192.168.1.100"
            required
          />
        </FormField>
        <FormField label="端口">
          <input
            className={inputClass}
            type="number"
            value={formData.port}
            onChange={(e) => handleChange('port', Number(e.target.value))}
            min={1}
            max={65535}
          />
        </FormField>
      </div>

      <FormField label="用户名" required>
        <input
          className={inputClass}
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          required
        />
      </FormField>

      <FormField label="认证方式">
        <div className="flex gap-2">
          {(['password', 'privateKey'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleChange('authType', type)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                formData.authType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {type === 'password' ? '密码' : '私钥'}
            </button>
          ))}
        </div>
      </FormField>

      {formData.authType === 'password' ? (
        <FormField label="密码">
          <input
            className={inputClass}
            type="password"
            value={formData.password ?? ''}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={machine ? '留空保持不变' : ''}
          />
        </FormField>
      ) : (
        <>
          <FormField label="私钥路径" required>
            <input
              className={inputClass}
              value={formData.privateKeyPath ?? ''}
              onChange={(e) => handleChange('privateKeyPath', e.target.value)}
              placeholder="~/.ssh/id_rsa"
              required
            />
          </FormField>
          <FormField label="私钥密码">
            <input
              className={inputClass}
              type="password"
              value={formData.passphrase ?? ''}
              onChange={(e) => handleChange('passphrase', e.target.value)}
              placeholder="可选"
            />
          </FormField>
        </>
      )}

      <FormField label="OpenClaw 配置目录">
        <input
          className={inputClass}
          value={formData.openclawPath}
          onChange={(e) => handleChange('openclawPath', e.target.value)}
          placeholder="~/.openclaw"
        />
        <p className="text-xs text-muted-foreground mt-1">
          用户配置主目录，程序安装在 /usr/lib/node_modules/openclaw/
        </p>
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : machine ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  )
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
