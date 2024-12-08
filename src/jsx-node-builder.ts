import type { JSX, FunctionComponent, JSXNode, PUINodeType, PUINodeAttributes } from "./types";
import { PUINode, PUIElement } from "./types";

export function jsxElement(
  tag: (keyof JSX.IntrinsicElements) | FunctionComponent | (string & {}) | undefined,
  props: JSX.HTMLAttributes,
  _key?: string,
): JSX.Element {
  if (typeof tag === "function") {
    // handling Function Components
    return tag(props);
  } else if (tag === undefined || tag == "") {
    // handling <></>
    throw new TypeError(
      `Tag is required for rendering PUI JSX element. Fragments aren't supported yet`,
    );
  } else if (typeof tag == "string") {
    // handling plain HTML codes
    return elementFromTag(tag, props);
  } else {
    const err_msg = `Can't handle unknown tag type: ${typeof tag}\n${JSON.stringify(tag)}\n${JSON.stringify(props)}`;
    throw new TypeError(err_msg);
  }
}

export const jsxFragment = jsxElement.bind(undefined, undefined);

function elementFromTag(tag: string, attributes: JSX.HTMLAttributes): JSX.Element {
  const { children, className } = attributes;
  delete attributes.children;
  const dataRefs = findState(attributes);
  if (className != null) {
    delete attributes.className;
    attributes["class"] = className;
  }
  // TODO: Handle children rendering
  return createElement(
    tag,
    dataRefs,
    attributes as any,
    buildChildrenNodes(children),
  );
}

function findState(attributes: JSX.HTMLAttributes) {
  const states: Record<string, JSX.Node> = {};
  for (const [key, val] of Object.entries(attributes)) {
    if (!(val instanceof PUINode)) {
      continue;
    }
    if (val.ntype != "state") {
      continue;
    }
    states[key] = val;
  }
  return states;
}

function buildChildrenNodes(children: JSXNode | Array<JSXNode>): Array<JSX.Node> {
  if (!children) {
    return [];
  }
  const rendered: Array<JSX.Node> = [];
  if (!Array.isArray(children)) {
    children = [children];
  }
  if (children.length == 0) {
    return children as Array<JSX.Node>;
  }
  for (const child of children) {
    switch (typeof child) {
      case "function":
        rendered.push(child());
        break;
      case "number":
      case "string":
      case "boolean":
      case "bigint":
        const node = createTextNode(String(child));
        rendered.push(node);
        break;
      case "object":
        if (child instanceof PUINode) {
          if (child.ntype == "custom") {
            console.error("Custom elements are not supported in JSX yet");
            continue;
          }
          rendered.push(child);
        } else if (Array.isArray(child)) {
          for (const c of buildChildrenNodes(child)) {
            rendered.push(c);
          }
        } else {
          console.warn("Unknown object type", child);
        }
        break;
      case "undefined":
        break;
      default:
        console.error(`Unsupported children type: ${typeof child}`, child);
        break;
    }
  }
  return rendered;
}

export function createNode(ntype: PUINodeType, tag: string, attrs: PUINodeAttributes): PUINode {
  return new PUINode(ntype, tag, attrs);
}

export function createTextNode(text: string): PUINode {
  return new PUINode("text", text, {});
}
export function createStateNode<T = unknown>(
  key: string,
  initValue: any,
): PUINode & { get value(): T; set value(v: T) } {
  const node = new PUINode("state", key, {
    value: initValue,
  });
  // TODO: Move to an actual class loser LOL
  Object.defineProperties(node, {
    value: {
      enumerable: true,
      configurable: false,
      get() {
        return node.attrs.value as unknown as T;
      },
      set(v: T) {
        node.attrs.value = v as any;
      },
    },
    [Symbol.toPrimitive]: {
      enumerable: false,
      writable: false,
      configurable: false,
      value(hint: "number" | "string" | "default") {
        if (hint == "string") {
          return String(node.attrs.value);
        }
        if (hint == "number") {
          return Number(node.attrs.value);
        }
        return node.attrs.value;
      },
    },
    valueOf: {
      enumerable: false,
      writable: false,
      configurable: false,
      value() {
        return node.attrs.value;
      },
    },
    toString: {
      enumerable: false,
      writable: false,
      configurable: false,
      value() {
        return String(node.attrs.value);
      },
    },
  });
  return node as any;
}


export function createElement(
  tag: string,
  data: Record<string, unknown>,
  attrs: PUINodeAttributes = {},
  children: Array<PUINode> = [],
) {
  return new PUIElement(data, children, tag, attrs);
}
