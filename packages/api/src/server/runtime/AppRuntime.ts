import { BrowserCrypto } from '@effect/platform-browser'
import { env } from 'cloudflare:workers'
import * as Layer from 'effect/Layer'
import * as ManagedRuntime from 'effect/ManagedRuntime'
import D1Client from '../infrastructure/persistence/d1/client/D1Client'
import D1TodoRepository from '../infrastructure/persistence/d1/repositories/D1TodoRepository'

const InfrastructureLive = Layer.mergeAll(D1Client.layer(env.DB), BrowserCrypto.layer)

const AppServicesLive = Layer.provide(D1TodoRepository, InfrastructureLive)

const AppRuntime = ManagedRuntime.make(AppServicesLive)

export type AppRunPromise = typeof AppRuntime.runPromise

export default AppRuntime
