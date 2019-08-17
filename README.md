# webtreemap

Fork of https://github.com/evmar/webtreemap

## Usage

### Web

The data format is a tree of `Node`, where each node is an object in the shape
described at the top of [tree.ts].

[tree.ts]: https://github.com/evmar/webtreemap/blob/master/src/tree.ts


Add the contents of [src/styles-to-add.css] to your stylesheets.

```html
<script src='webtreemap.js'></script>
<script>
// Container must have its own width/height.
const container = document.getElementById('myContainer');
// See typings for full API definition.
webtreemap.render(container, data, options);
```


## Development

The modules of webtreemap can be used both from the web and from the command
line, so the build has two layers. The command line app embeds the output
of the build into its output so it's a bit confusing.

To build everything, run `yarn run build`.

### Build layout

To hack on webtreemap, the pieces of the build are:

1. `yarn run build` builds all the `.ts` files and runs rollup


### Command line app

Use `yarn run tsc -w` to keep the npm-compatible JS up to date, then run e.g.:

```sh
$ du -ab node_modules/ | node build/src/cli.js --title 'node_modules usage' -o demo.html
```

## License

webtreemap is licensed under the Apache License v2.0. See `LICENSE.txt` for the
complete license text.
