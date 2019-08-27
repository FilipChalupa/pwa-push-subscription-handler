import urlBase64ToUint8Array from './urlBase64ToUint8Array'

export type PwaPushSubscriptionHandlerState =
	| 'loading'
	| 'updating'
	| 'not-supported'
	| 'disabled'
	| 'not-subscribed'
	| 'subscribed'
	| 'error'

type StatusChangeCallback = (status: PwaPushSubscriptionHandlerState) => void

class PwaPushSubscriptionHandler {
	private state: PwaPushSubscriptionHandlerState = 'loading'
	private callbacks: StatusChangeCallback[] = []
	private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
	private applicationServerKey?: string

	constructor(
		applicationServerKey?: string,
		private readonly publishSubscription?: (
			subscription: PushSubscription
		) => Promise<any>,
		private readonly unpublishSubscription?: () => Promise<any>
	) {
		if (applicationServerKey) {
			this.applicationServerKey = applicationServerKey
		}

		this.requestStatus()
	}

	private async requestStatus() {
		this.updateStatus(await this.getStatus())
	}

	private updateStatus(status: PwaPushSubscriptionHandlerState) {
		this.state = status
		this.callbacks.forEach((callback) => callback(status))
	}

	public getStatus = async (): Promise<PwaPushSubscriptionHandlerState> => {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
			return 'not-supported'
		}
		if (Notification.permission === 'denied') {
			return 'disabled'
		}
		try {
			this.serviceWorkerRegistration = await navigator.serviceWorker.ready
			const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription()
			if (subscription === null) {
				return 'not-subscribed'
			} else {
				return 'subscribed'
			}
		} catch (error) {
			console.error(error)
			return 'error'
		}
	}

	public subscribe = async (): Promise<void> => {
		if (this.state !== 'not-subscribed') {
			console.warn(
				`Trying to subscribe in state "${this.state}" is not allowed.`
			)
			return Promise.resolve()
		}
		this.updateStatus('updating')
		return Notification.requestPermission().then((result) => {
			if (result === 'denied') {
				this.updateStatus('disabled')
			} else if (result === 'default') {
				this.updateStatus('not-subscribed')
			} else {
				return this.serviceWorkerRegistration!.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: this.applicationServerKey,
				})
					.then(this.updateSubscription)
					.catch(this.handleSubscriptionUpdateFailure)
			}
		})
	}

	public unsubscribe = async (forceSilent = false): Promise<void> => {
		if (this.state !== 'subscribed' && !forceSilent) {
			console.warn(
				`Trying to unsubscribe in state "${this.state}" is not allowed.`
			)
			return Promise.resolve()
		}
		if (!forceSilent) {
			this.updateStatus('updating')
		}
		return this.serviceWorkerRegistration!.pushManager.getSubscription()
			.then((subscription) => {
				if (subscription) {
					subscription.unsubscribe()
				}
				return null
			})
			.then(this.updateSubscription)
			.catch(this.handleSubscriptionUpdateFailure)
	}

	public toggle = async (): Promise<void> => {
		if (this.state === 'subscribed') {
			return this.unsubscribe()
		}
		if (this.state === 'not-subscribed') {
			return this.subscribe()
		} else {
			console.warn(
				`Trying to toggle subscription in state "${this.state}" is not allowed.`
			)
			return Promise.resolve()
		}
	}

	private updateSubscription = async (
		subscription: PushSubscription | null
	): Promise<void> => {
		if (subscription === null) {
			return (this.unpublishSubscription
				? this.unpublishSubscription()
				: Promise.resolve()
			)
				.catch((error) => {
					console.error(error)
				})
				.then(() => {
					this.updateStatus('not-subscribed')
				})
		} else {
			return (this.publishSubscription
				? this.publishSubscription(subscription)
				: Promise.resolve()
			)
				.then(() => {
					this.updateStatus('subscribed')
				})
				.catch((error) => {
					console.error(error)
					this.unsubscribe(true)
				})
		}
	}

	private handleSubscriptionUpdateFailure = (error: Error) => {
		console.error(error)
		this.updateStatus('error')
	}

	public addListener(callback: StatusChangeCallback): void {
		callback(this.state)
		this.callbacks.push(callback)
	}

	public removeListener(callback: StatusChangeCallback): void {
		this.callbacks = this.callbacks.filter((cb) => callback !== cb)
	}
}

export default PwaPushSubscriptionHandler
