# PUI-JSX

Minor project aimed into enabling the usage of JSX for building templates/models for [@peasy-lib/peasy-ui](https://github.com/peasy-lib/peasy-lib/blob/main/packages/peasy-ui/README.md) (a.k.a. PUI) by providing a JSX node builder and a function for generating a model that PUI will use through those nodes.

This project was initially inspired by [How to render JSX to whatever you want with a custom JSX Renderer](https://dev.to/afl_ext/how-to-render-jsx-to-whatever-you-want-with-a-custom-jsx-renderer-cjk) by [Adrian](https://dev.to/afl_ext). You could call it fate that this particular post just randomly reached me while I was looking up something completely unrelated to this.

## Tasks
NOTE: These tasks don't fully indicate what I'm doing or what will be done and what might not.


Done Tasks:
- [x] Build and render a proper PUI model/template
- [x] Display simple states
- [x] Bind event callback functions
- [x] Simple attribute binding (JSX `<input type={state()} />` == PUI binding `<input type="${ state }" />`)
- [x] Attribute one way binding to state (JSX `<input type={state.model()} />` == PUI binding `<input ${ type <== state } />`)
- [x] State one way binding to attribute (JSX `<input type={state.attr()} />` == PUI binding `<input ${ type ==> state } />`)
- [x] Attribute two way binding to state (JSX `<input value={state.sync()} />` == PUI binding `<input ${ value <=> state } />`)
- [x] Render static HTML from template (`import { renderHTML } from "pui-jsx/static"`)

Main Tasks:
- [ ] State sub-property binding
- [ ] Element ref binding
- [ ] Iteration binding (PUI binding operator: `${ item <=* list }`)

Secondary Tasks:
- [ ] Playground for testing online
- [ ] Proper error messages
- [ ] Differentiate between dev and prod build
- [ ] Vite config for enabling item without plugin

Undecided on whether to do or not to do Tasks:
- [ ] Write some documentation
- [ ] Full proper TypeScript support (not sure how much of a hassle this might be)
- [ ] Actually build a vite plugin for this
- [ ] HTML5 2D Canvas rendering with nodes
