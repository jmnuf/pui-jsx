
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

export class PUIElement extends PUINode {
  constructor(
    public data: Record<string, unknown>,
    public children: Array<PUINode>,
    tag: string,
    attrs: PUINodeAttributes,
  ) {
    super(tag.includes("-") ? "custom" : "element", tag, attrs);
  }
}
