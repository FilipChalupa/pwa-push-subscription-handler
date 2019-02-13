// Based on https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey

export default function urlBase64ToUint8Array(input: string): Uint8Array {
	const padding = '='.repeat((4 - (input.length % 4)) % 4)
	const base64 = (input + padding).replace(/\-/g, '+').replace(/_/g, '/')

	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}
