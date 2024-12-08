import type { JSX, FunctionComponent, JSXNode, PUINodeType, PUINodeAttributes } from "./types";
import { PUINode, PUIState, PUIElement } from "./types";

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
  if (className != null) {
    delete attributes.className;
    attributes["class"] = className;
  }
  const dataRefs = findState(attributes);
  // TODO: Handle children rendering
  return createElement(
    tag,
    dataRefs,
    attributes as any,
    buildChildrenNodes(children),
  );
}

function findState(attributes: JSX.HTMLAttributes) {
  const states: Record<string, PUIState<unknown>> = {};
  for (const [key, val] of Object.entries(attributes)) {
    if (!(val instanceof PUINode)) {
      continue;
    }
    if (val.ntype != "state") {
      continue;
    }
    (val as PUIState<unknown>).tag = key;
    states[key] = val as PUIState<unknown>;
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
  initValue: T,
): PUIState<T> {
  return new PUIState<T>(key, {
    value: initValue as any,
  });
}


export function createElement(
  tag: string,
  data: Record<string, PUIState<unknown>>,
  attrs: PUINodeAttributes = {},
  children: Array<PUINode> = [],
) {
  const elem = new PUIElement(data, children, tag, attrs);
  // State of that's bound to an attribute is easier to track separately I think
  // as of the writing of this code.
  for (const key of Object.keys(data)) {
    delete elem.attrs[key];
  }
  return elem;
}
