import type { PUIElement, BaseCompProps, FunctionComponent } from "./types";
import { PUINode } from "./types";
import { createStateNode } from "./jsx-node-builder";

export type FC<T extends BaseCompProps = BaseCompProps> = FunctionComponent<T>;

export function modelData<T>(value: T) {
  const stateNode = createStateNode<T>("", value);
  const getValue = () => stateNode as unknown as T & { value: T };
  // const setValue = (value: T): void => (stateNode.attrs.value = value as any);
  const setValue = (valOrSetter: T | ((v: T) => T)) => {
    if (typeof valOrSetter == "function") {
      stateNode.attrs.value = (valOrSetter as (v: T) => T)(
        stateNode.attrs.value as any,
      ) as any;
      return;
    }
    stateNode.attrs.value = valOrSetter as any;
  };
  return [getValue, setValue] as const;
}

const createMarker = (child_idx: number, idxs: Array<number>) => {
  if (idxs.length == 0) {
    return (s: string) => s.length == 0 ? `__child_${child_idx}__` : `__child_${child_idx}_${s}__`;
  }
  return (s: string) =>
    s.length == 0 ? `__child_${idxs.join("_")}_${child_idx}__` : `__child_${idxs.join("_")}_${child_idx}_${s}__`;
}

export function genModel(
  elem: PUIElement,
): Record<string, any> & { template: string } {
  const { tag, attrs, data } = elem;
  let template = `<${tag}`;
  const attrsEntries = Object.entries(attrs).filter(
    ([key, _]) => key != "children",
  );
  if (attrsEntries.length > 0) {
    template += renderAttributesTemplate(elem, data, attrsEntries);
  }
  if (elem.children.length > 0) {
    template += ">";
    let child_idx = -1;
    for (const child of elem.children) {
      child_idx += 1;
      if (child.ntype == "text") {
        template += child.tag;
        continue;
      }
      const mark = createMarker(child_idx, []);
      const childId = mark("");
      if (child.ntype == "custom") {
        const model = genModel(child as PUIElement);
        data[childId] = model;
        template += `<\${ ${childId} === }>`;
        continue;
      }
      if (child.ntype == "state") {
        Object.defineProperty(data, childId, {
          enumerable: true,
          configurable: false,
          get() {
            return child.attrs.value;
          },
          set(v: any) {
            child.attrs.value = v;
          },
        });
        template += `\${ ${childId} }`;
        continue;
      }
      if (child.ntype == "element") {
        const subelem = child as PUIElement;
        let subtemplate = `<${subelem.tag}`;
        const subattrs = Object.entries(subelem.attrs).filter(([key, _]) => key != "children");
        if (subattrs.length > 0) {
          subtemplate += renderAttributesTemplate(subelem, data, subattrs);
        }
        if (subelem.children.length > 0) {
          subtemplate += ">";
          subtemplate += renderChildrenTemplate([child_idx], subelem, data, elem);
          subtemplate += `</${subelem.tag}>`;
        } else {
          subtemplate += " />";
        }
        template += subtemplate;
      }
    }
    template += `</${tag}>`;
  } else {
    template += " />";
  }
  data.template = template;
  return data as any;
}

function renderAttributesTemplate(_elem: PUIElement, data: any, attrs: Array<[string, any]>) {
  let template = "";
  for (const [key, val] of attrs) {
    if (key == "children") {
      continue;
    }
    if (key.startsWith("on")) {
      if (typeof val != "function") {
        console.error("Expected function for property " + key);
        continue;
      }
      let eventName = key.substring(2);
      eventName = eventName[0].toLowerCase() + eventName.substring(1);
      template += ` \${ ${eventName} @=> __root_${key}__ }`;
      data[key] = val as (ev: Event) => void;
      continue;
    }
    if (typeof val == "object") {
      console.error(
        "Objects not supported as properties, if you're using states it's not supported yet",
      );
      continue;
    }
    if (typeof val == "function") {
      console.warn(
        `Setting property ${key} as event handler but not using 'on' prefix makes it unclear. It's recommended to use 'on' prefix for events`,
      );
      template += ` \${ ${key} @=> ${key} }`;
      data[key] = val;
      continue;
    }
    template += ` ${key}="${val}"`;
  }
  return template;
}

function renderChildrenTemplate(idxs: Array<number>, elem: PUIElement, data: any, parent: PUIElement) {
  let template = '';
  let child_idx = -1;
  for (const child of elem.children) {
    child_idx += 1;
    if (child.ntype == "text") {
      template += child.tag;
      continue;
    }
    const mark = createMarker(child_idx, idxs);
    const childId = mark("");
    if (child.ntype == "custom") {
      const model = genModel(child as PUIElement);
      data[childId] = model;
      template += `<\${ ${childId} === } />`;
      continue;
    }
    if (child.ntype == "state") {
      Object.defineProperty(data, childId, {
        enumerable: true,
        configurable: false,
        get() {
          return child.attrs.value;
        },
        set(v: any) {
          child.attrs.value = v;
        },
      });
      template += `\${ ${childId} }`;
      continue;
    }
    if (child.ntype == "element") {
      const subelem = child as PUIElement;
      let subtemplate = `<${subelem.tag}`;
      for (const [sk, v] of Object.entries(subelem.attrs)) {
        if (v instanceof PUINode) {
          console.error("Unexpected JSX.Node");
          continue;
        }
        if (typeof v != "function") {
          // TODO: Not sure how to handle non-event attributes yet
          subtemplate += ` ${sk}="${v}"`;
          continue;
        }
        const key = mark(sk);
        data[key] = v;
        if (sk.startsWith("on")) {
          let eventName = sk.substring(2);
          eventName = `${eventName[0].toLowerCase()}${eventName.substring(1)}`;
          subtemplate += ` \${ ${eventName} @=> ${key} }`;
        } else {
          subtemplate += ` \${ ${sk} @=> ${key} }`;
        }
      }
      if (subelem.children.length == 0) {
        subtemplate += " />";
      } else {
        subtemplate += ">";
        subtemplate += renderChildrenTemplate([...idxs, child_idx], subelem, data, parent);
        subtemplate += `</${subelem.tag}>`;
      }
      template += subtemplate;
    }
  }
  return template;
}


// TODO: Handle building both clean HTML and Template HTML strings
// function renderSimpleHTML(Component: FunctionComponent) {}
// NOTE: Only thing that is missing for this to be right is to also generate
//  the full template of sub-components. Which currently only render as a binding
// function renderTemplateHTML(Component: FunctionComponent) {
//   return genModel(Component({ children: [] })).template;
// }

/**
 * Generates a model object with a template for the Component and passes them
 * to the create function which we expect to handle the render of the Component.
 *
 * Specifically is expecting the @peasy-lib/peasy-ui UI object.
 * Though nothing stops anyone from using the same model and template to render
 * per say onto an HTML5 Canvas.
 */
export function render<T>(
  UI: {
    create: (
      parent: HTMLElement,
      model: Record<string, any>,
      template: string,
    ) => T;
  },
  parent: HTMLElement,
  Component: FunctionComponent,
) {
  const model = genModel(Component({ children: [] }));
  return UI.create(parent, model, model.template);
}

/**
 * Generates a model object for the Component and using passed in create function
 * uses the parent HTML Element as the template, useful if you generated the HTML
 * on the server somehow or just wanted to build the template right on the HTML.
 * 
 * NOTE: If you wrote the HTML by hand then the Component MUST match the HTML, which means
 * possible duplication.
 */
export function bindToDOM<T>(
  UI: {
    create: (
      parent: HTMLElement,
      model: Record<string, any>,
    ) => T;
  },
  parent: HTMLElement,
  Component: FunctionComponent,
) {
  const model = genModel(Component({ children: [] }));
  return UI.create(parent, model);
}
