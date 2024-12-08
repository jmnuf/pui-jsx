
namespace JSX {
  export type IntrinsicElements = {
    [K in keyof HTMLElementTagNameMap]: HTMLAttributes;
  };

  // Declare the shape of JSX rendering result
  // This is required so the return types of components can be inferred
  export type Element = PUIElement;
  export type Node = PUINode;

  type NonFn<T> = T extends (...args: any[]) => any ? never : T;
  type PickElement<TKey extends keyof HTMLElementTagNameMap> = HTMLElementTagNameMap[TKey];

  type EventCallback<TEvent extends Event> = (event: TEvent, model: Record<string, unknown | undefined> | { item: Record<string, unknown | undefined> & { $index: number } }) => void;

  export type HTMLAttributes = JSXChildren & {
    [Key in keyof PickElement<keyof HTMLElementTagNameMap>]?:
    | Key extends "children" ? JSXChildren["children"]
    : NonFn<PickElement<keyof HTMLElementTagNameMap>[Key] | (JSXNode & {})>;
  } & {
    [Key in keyof HTMLElementEventMap as `on${Capitalize<Key>}`]?:
    | EventCallback<HTMLElementEventMap[Key]>
    | undefined;
  } & {
    [key: string & {}]: JSXNode | JSXNode[] | ((event: Event) => void) | undefined;
  };
}

export type { JSX };

type JSXChildren = {
  children?: JSXNode | JSXNode[] | undefined;
};

export type JSXNode =
  | PUINode
  | PUIElement
  | JSX.Element
  | JSX.Node
  | (() => JSX.Node)
  | (() => JSX.Element)
  | boolean
  | number
  | bigint
  | string
  | null
  | undefined;

export type BaseCompProps = Record<string, unknown> & JSXChildren;

export type FunctionComponent<TProps extends BaseCompProps = BaseCompProps> = (
  props: TProps,
) => JSX.Element;

export type PUINodeAttributes = Record<
  string,
  object | string | number | ((event: Event) => void)
>;

export type PUINodeType = "custom" | "element" | "text" | "state";

export class PUINode {
  constructor(
    public ntype: PUINodeType,
    public tag: string,
    public attrs: PUINodeAttributes,
  ) { }
}

export type BindStyleType = "basic" | "onetime" | "model" | "attr" | "twoway" | "ref.view" | "ref.elem";
export type BindStyle = BindStyleType | true | undefined;

export class PUIState<T> extends PUINode {
  constructor(
    public tag: string,
    public attrs: PUINodeAttributes & { value: T },
    public bindStyle: BindStyle = "model",
  ) {
    super("state", tag, attrs);
    this.sync = this.sync.bind(this);
    this.model = this.model.bind(this);
    this.once = this.once.bind(this);
    this.attr = this.attr.bind(this);

    const self = this;
    Object.defineProperties(self, {
      [Symbol.toPrimitive]: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: self[Symbol.toPrimitive].bind(self),
      },
      valueOf: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: self.valueOf.bind(self),
      },
      toString: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: self.toString.bind(self),
      },
    });
  }

  get value(): T {
    return this.attrs.value as any;
  }
  set value(v: T) {
    this.attrs.value = v as any;
  }

  sync() {
    const self = this;
    const clone = new PUIState(self.tag, {} as any, "twoway");
    Object.defineProperty(clone, "attrs", {
      enumerable: true,
      configurable: false,
      get() {
        return self.attrs;
      },
    });
    return clone;
  }

  model() {
    const self = this;
    const clone = new PUIState(self.tag, {} as any, "model");
    Object.defineProperty(clone, "attrs", {
      enumerable: true,
      configurable: false,
      get() {
        return self.attrs;
      },
    });
    return clone;
  }

  once() {
    const self = this;
    const clone = new PUIState(self.tag, {} as any, "onetime");
    Object.defineProperty(clone, "attrs", {
      enumerable: true,
      configurable: false,
      get() {
        return self.attrs;
      },
    });
    return clone;
  }

  attr() {
    const self = this;
    const clone = new PUIState(self.tag, {} as any, "attr");
    Object.defineProperty(clone, "attrs", {
      enumerable: true,
      configurable: false,
      get() {
        return self.attrs;
      },
    });
    return clone;
  }

  [Symbol.toPrimitive](hint: "number" | "string" | "default") {
    if (hint == "string") {
      return String(this.attrs.value);
    }
    if (hint == "number") {
      return Number(this.attrs.value);
    }
    return this.attrs.value;
  }
  valueOf() {
    return this.attrs.value;
  }
  toString() {
    return String(this.attrs.value);
  }
}

export class PUIElement extends PUINode {
  constructor(
    public data: Record<string, PUIState<unknown>>,
    public children: Array<PUINode>,
    tag: string,
    attrs: PUINodeAttributes,
  ) {
    super(tag.includes("-") ? "custom" : "element", tag, attrs);
  }
}
