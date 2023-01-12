# cli-js

This is a NodeJS package for quickly implementing a CLI interface for your application.
It is written in the ES Module style.

## Installation

```shell
$ npm i @nianyi-wang/cli
```

## Usage


```javascript
import { CLI } from '@nianyi-wang/cli';

new CLI({
	options: [
		{
			name: 'out',
			shortNames: 'o',
			argumentCount: 1
		},
	],
	handler() {
		const inSrc = this.arguments[0];
		const outSrc = this.GetSingle('out');
		console.log(`${inSrc} => ${outSrc}`);
	}
}).Execute();
```
