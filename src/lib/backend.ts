// Backend switch. If VITE_CONVEX_URL is set at build time the app uses Convex
// (shared leaderboard + cross-device sync codes). Otherwise it falls back to a
// browser-only version (localStorage) so the site works as a static page.
import { useEffect, useState } from 'react'
import { ConvexReactClient } from 'convex/react'
import * as convexReact from 'convex/react'
import { anyApi } from 'convex/server'

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined
export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null

const LB_KEY = 'pharmacovigilance-detective-leaderboard'
const SYNC_KEY = 'pharmacovigilance-detective-sync-profiles'
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

type Fn = { kind: string }
const localApi = {
  leaderboard: { top: { kind: 'lb.top' }, submit: { kind: 'lb.submit' } },
  sync: { generate: { kind: 'sync.generate' }, push: { kind: 'sync.push' }, pull: { kind: 'sync.pull' } },
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomCode() {
  let out = ''
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return out
}

function localUseMutation(fn: Fn) {
  return async (args: any): Promise<any> => {
    if (fn.kind === 'lb.submit') {
      const name = String(args.name).trim().slice(0, 24)
      if (!name) throw new Error('Name is required')
      if (args.correctDimensions < 0 || args.correctDimensions > args.totalDimensions) throw new Error('Invalid score')
      if (args.casesReviewed < 5) throw new Error('At least 5 cases required before submitting')
      const list = readJson<any[]>(LB_KEY, [])
      const pct = (args.correctDimensions / args.totalDimensions) * 100
      const id = `${Date.now()}-${Math.random()}`
      list.push({ _id: id, name, correctDimensions: args.correctDimensions, totalDimensions: args.totalDimensions, casesReviewed: args.casesReviewed, pct })
      writeJson(LB_KEY, list.slice(-300))
      notify()
      return id
    }
    if (fn.kind === 'sync.generate') {
      const profiles = readJson<Record<string, any>>(SYNC_KEY, {})
      let code = randomCode()
      while (profiles[code]) code = randomCode()
      profiles[code] = { historyJson: '[]', updatedAt: Date.now() }
      writeJson(SYNC_KEY, profiles)
      return code
    }
    if (fn.kind === 'sync.push') {
      const profiles = readJson<Record<string, any>>(SYNC_KEY, {})
      const code = String(args.code).trim().toUpperCase()
      if (!profiles[code]) throw new Error('Sync code not found')
      profiles[code] = { historyJson: args.historyJson, updatedAt: Date.now() }
      writeJson(SYNC_KEY, profiles)
      notify()
      return null
    }
    throw new Error('Unsupported')
  }
}

function localUseQuery(fn: Fn, args: any): any {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  if (args === 'skip') return undefined
  if (typeof window === 'undefined') return undefined
  if (fn.kind === 'lb.top') {
    return readJson<any[]>(LB_KEY, []).sort((x, y) => y.pct - x.pct).slice(0, 20)
  }
  if (fn.kind === 'sync.pull') {
    const profiles = readJson<Record<string, any>>(SYNC_KEY, {})
    return profiles[String(args.code).trim().toUpperCase()] ?? null
  }
  return null
}

export const api: any = CONVEX_URL ? anyApi : localApi
export const useMutation: (fn: any) => (args: any) => Promise<any> = CONVEX_URL ? (convexReact.useMutation as any) : localUseMutation
export const useQuery: (fn: any, args: any) => any = CONVEX_URL ? (convexReact.useQuery as any) : localUseQuery
