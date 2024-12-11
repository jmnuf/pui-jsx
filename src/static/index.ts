import type { FunctionComponent, PUINode, PUIState, PUIElement } from "../types";
import { isTagSelfClosing } from "../jsx-node-builder";

function escapeHTMLAttr(value: string): string {
  return value
    .replaceAll('&', "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll('<', "&lt;")
    .replaceAll('>', "&gt;")
    .replaceAll('\n', "&#10;");
}

function escapeHTMLChild(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br />");
}


export function renderHTML(Component: FunctionComponent): string {
  const elem = Component({ children: [] });
  const { tag, data, attrs } = elem;
  let html = `<${tag}`;
  const dataEntries = Object.entries(data);
  const attrsEntries = Object.entries(attrs);
  if (dataEntries.length > 0 || attrsEntries.length > 0) {
    html += renderAttributesHTML(dataEntries, attrsEntries);
  }
  if (isTagSelfClosing(tag)) {
    if (elem.children.length > 0) {
      console.error(`Self closing tag can't have children: <${tag} />`);
    }
    html += " />";
    return html;
  }
  html += ">";
  if (elem.children.length > 0) {
    html += renderChildrenHTML(elem.children);
  }
  html += `</${tag}>`;
  return html;
}

function renderAttributesHTML(data: Array<[string, PUIState<unknown>]>, attrs: Array<[string, any]>): string {
  let html = "";
  for (const [key, val] of attrs) {
    const vt = typeof val;
    switch (vt) {
      case "function":
      case "undefined":
        continue;
      case "bigint":
      case "number":
      case "boolean":
      case "string":
        {
          const vstr = escapeHTMLAttr(`${val}`);
          html += ` ${key}="${vstr}"`;
        }
        continue;
      case "object":
        if (typeof val.toString == "function") {
          const vstr = escapeHTMLAttr(val.toString());
          html += ` ${key}="${vstr}"`;
          continue;
        }
        if (typeof val[Symbol.toPrimitive] == "function") {
          const vstr = escapeHTMLAttr(val[Symbol.toPrimitive]("string"));
          html += ` ${key}="${vstr}"`;
          continue;
        }
        break;
    };
    console.error("Unsupported attribute value type on HTML render:", vt, val);
  }
  for (const [key, ref] of data) {
    const val = ref.attrs.value as any;
    const vt = typeof val;
    switch (vt) {
      case "function":
      case "undefined":
        continue;
      case "bigint":
      case "number":
      case "boolean":
      case "string":
        html += ` ${key}="${val}"`;
        continue;
      case "object":
        if (typeof val.toString != "function") {
          break;
        }
        html += ` ${key}="${val.toString()}"`;
        continue;
    };
    console.error("Unsupported data attribute value type on HTML render:", vt, val);
  }
  return html;
}

function renderChildrenHTML(children: Array<PUINode>) {
  let html = "";
  for (const child of children) {
    // "custom" | "element" | "text" | "state"
    switch (child.ntype) {
      case "text":
        html += escapeHTMLChild(child.tag);
        break;
      case "state":
        // TODO: Probably should care more about what's here
        html += escapeHTMLChild(`${(child as PUIState<any>).value}`);
        break;
      // TODO: Maybe custom elements need special handling sometimes?
      case "custom":
      case "element":
        const subelem = child as PUIElement;
        let subHtml = `<${subelem.tag}`;
        const dataEntries = Object.entries(subelem.data);
        const attrsEntries = Object.entries(subelem.attrs);
        if (dataEntries.length > 0 || attrsEntries.length > 0) {
          subHtml += renderAttributesHTML(dataEntries, attrsEntries);
        }
        if (isTagSelfClosing(subelem.tag)) {
          if (subelem.children.length > 0) {
            console.error(`Self closing tag can't have children: <${subelem.tag} />`);
          }
          subHtml += " />";
        } else {
          subHtml += ">";
          if (subelem.children.length > 0) {
            subHtml += renderChildrenHTML(subelem.children);
          }
          subHtml += `</${subelem.tag}>`;
        }
        html += subHtml;
        break;
    }
  }
  return html;
}

// TODO: Handle building both clean HTML and Template HTML strings
// export function renderHTMLWithTemplate(Component: FunctionComponent) {}
