# PWA push subscription handler

Handling PWA push notifications subscription flow made easier. [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/PushManager)

## Installation

`npm install --save-dev pwa-push-subscription-handler`

## Usage

### HTML

```html
<button role="button" id="pushToggleButton" style="display: none;"></button>
```

### JavaScript

```javascript
import PwaPushSubscriptionHandler from 'pwa-push-subscription-handler'

const $button = document.querySelector('#pushToggleButton')

const publishSubscription = async (subscription: PushSubscription) => {
	// Send user's subscription object to your server and save it
	return fetch('http://example.com/submit/', {
		method: 'POST',
		body: JSON.stringify(subscription),
	})
}

const unpublishSubscription = async () => {
	// Let your server know user's user agent won't accept any new notifications
	return
}

const pwaPushSubscriptionHandler = new PwaPushSubscriptionHandler(
	'***', // Public Vapid key - see https://www.npmjs.com/package/web-push
	publishSubscription,
	unpublishSubscription // May be omitted
)

pwaPushSubscriptionHandler.addListener((state) => {
	// state = 'loading' | 'updating' | 'not-supported' | 'disabled' | 'not-subscribed' | 'subscribed' | 'error'

	$button.style.display = ['disabled', 'not-supported'].includes(state)
		? 'none'
		: 'inline-block'

	$button.setAttribute(
		'disabled',
		['loading', 'updating', 'error'].includes(state)
	)

	switch (state) {
		case 'subscribed':
			$button.innerText = 'Disable notifications'
			break
		case 'not-subscribed':
			$button.innerText = 'Enable notifications'
			break
		default:
			$button.innerText = 'Loading'
	}
})

$button.addEventListener('click', pwaPushSubscriptionHandler.toggle})
```

### Screencast

![UI example](./screencast.gif)
