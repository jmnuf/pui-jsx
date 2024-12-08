# PUI-JSX

Minor project aimed into enabling the usage of JSX for building templates/models for [@peasy-lib/peasy-ui](https://github.com/peasy-lib/peasy-lib/blob/main/packages/peasy-ui/README.md) (a.k.a. PUI) by providing a JSX node builder and a function for generating a model that PUI will use through those nodes.

This project was initially inspired by [How to render JSX to whatever you want with a custom JSX Renderer](https://dev.to/afl_ext/how-to-render-jsx-to-whatever-you-want-with-a-custom-jsx-renderer-cjk) by [Adrian](https://dev.to/afl_ext). You could call it fate that this particular post just randomly reached me while I was looking up something completely unrelated to this.

## Roadmap
Done Tasks:
- [x] Build and render a proper PUI model/template
- [x] Display simple states
- [x] Bind event callback functions
- [x] Attribute one way binding to state (attribute is always set to state value)
- [x] Attribute two way binding to state (state value and attribute will try to remain synced to one another)

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
