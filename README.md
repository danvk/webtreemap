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

#### Options
| Option | Type | Default |
| ------------- |:-------------:| -----:|
| padding | [number, number, number, number] | [14, 3, 3, 3] |
| lowerBound | number |  0.1 |
| applyMutations | (node: Node) => void | () => void |
| caption | (node: Node) => string | (node) => node.id || '') |
| showNode | (node: Node, width: number, height: number) => boolean | (_, width, height) => (width > 20) && (height >= options.padding[0]) |
| showChildren | (node: Node, width: number, height: number) => boolean  |  (_, width, height) => (width > 40) && (height > 40) |


| Option | Description |
| ------------- |:-------------:|
| padding | In order: padding-top, padding-right, padding-bottom, padding-left of each node
| lowerBound | Lower bound of ratio that determines how many children can be displayed inside of a node. Example with a lower bound of 0.1: the total area taken up by displaying child nodes of any given node cannot be less than 10% of the area of its parent node.
| applyMutations | A function that exposes a node as an argument after it's dom element has been assigned. Use this to add inline styles and classes. Example: (node) => { node.dom.style.color = 'blue' }
| caption | A function that takes a node as an argument and returns a string that is used to display as the caption for the node passed in.
| showNode | A function that takes a node, its width, and its height, and returns a boolean that determines if that node should be displayed. Fires after showChildren.
| showChildren | A function that takes a node, its width, and its height, and returns a boolean that determines if that node's children should be displayed. Fires before showNode.


## Development

~The modules of webtreemap can be used both from the web and from the command
line, so the build has two layers. The command line app embeds the output
of the build into its output so it's a bit confusing.~

I broke the CLI. Only working output is the dist/webtreemap.js now.

Run `yarn run build` to compile TS -> build/JS with tsc and run rollup to make the dist.



## License

webtreemap is licensed under the Apache License v2.0. See `LICENSE.txt` for the
complete license text.
