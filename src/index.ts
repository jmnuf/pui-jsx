import type { PUIElement, PUIState, BaseCompProps, FunctionComponent } from "./types";
import { PUINode } from "./types";
import { createStateNode, isTagSelfClosing } from "./jsx-node-builder";
import { escapeHTMLAttr, escapeHTMLChild } from "./static";

export type FC<T extends BaseCompProps = BaseCompProps> = FunctionComponent<T>;

type StateObject<T> = (
  T extends string | number
  ? (T & { value: T }) : { value: T; }
);
type StateGetter<T> = {
  (): StateObject<T>;
  sync(): StateObject<T>;
  model(): StateObject<T>;
  once(): StateObject<T>;
  attr(): StateObject<T>;
};


export function modelData<T>(value: T) {
  const stateNode = createStateNode<T>("", value);
  const getValue: StateGetter<T> = (() => stateNode as any as StateObject<T>) as any;
  getValue.sync = stateNode.sync as any;
  getValue.model = stateNode.model as any;
  getValue.once = stateNode.once as any;
  getValue.attr = stateNode.attr as any;
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


type PUIModel = Record<string, any> & { template: string };
export function genModel(
  elem: PUIElement,
): PUIModel {
  const { tag, attrs, data } = elem;
  const model: PUIModel = {} as any;
  let template = `<${tag}`;
  const attrsEntries = Object.entries(attrs).filter(
    ([key, _]) => key != "children",
  );
  const dataEntries = Object.entries(data);
  if (attrsEntries.length > 0 || dataEntries.length > 0) {
    template += renderAttributesTemplate(model, dataEntries, attrsEntries);
  }
  if (isTagSelfClosing(tag)) {
    template += " />";
    if (elem.children.length > 0) {
      console.error("Can't have children in void element");
    }
    model.template = template;
    return model as any;
  }
  template += ">";
  if (elem.children.length > 0) {
    let child_idx = -1;
    for (const child of elem.children) {
      child_idx += 1;
      if (child.ntype == "text") {
        template += escapeHTMLChild(child.tag);
        continue;
      }
      const mark = createMarker(child_idx, []);
      const childId = mark("");
      if (child.ntype == "custom") {
        const model = genModel(child as PUIElement);
        model[childId] = model;
        template += `<\${ ${childId} === }>`;
        continue;
      }
      if (child.ntype == "state") {
        Object.defineProperty(model, childId, {
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
        const selfClosing = isTagSelfClosing(subelem.tag);
        let subtemplate = `<${subelem.tag}`;
        const subattrs = Object.entries(subelem.attrs).filter(([key, _]) => key != "children");
        const subdata = Object.entries(subelem.data);
        if (subattrs.length > 0) {
          subtemplate += renderAttributesTemplate(model, subdata, subattrs);
        }
        if (subelem.children.length > 0 && !selfClosing) {
          subtemplate += ">";
          subtemplate += renderChildrenTemplate([child_idx], subelem, model, elem);
          subtemplate += `</${subelem.tag}>`;
        } else {
          if (selfClosing) {
            subtemplate += " />";
          } else {
            subtemplate += `></${subelem.tag}>`;
          }
        }
        template += subtemplate;
      }
    }
  }
  template += `</${tag}>`;
  model.template = template;
  return model as any;
}

function renderAttributesTemplate(model: PUIModel, data: Array<[string, PUIState<unknown>]>, attrs: Array<[string, any]>) {
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
      const modelKey = `__root_${key}__`;
      template += ` \${ ${eventName} @=> ${modelKey} }`;
      model[modelKey] = val as any;
      continue;
    }
    if (typeof val == "object") {
      console.error("Objects not supported as properties");
      continue;
    }
    if (typeof val == "function") {
      console.warn(
        `Setting property ${key} as event handler but not using 'on' prefix makes it unclear. It's recommended to use 'on' prefix for events`,
      );
      template += ` \${ ${key} @=> ${key} }`;
      model[key] = val;
      continue;
    }
    // equal to null | undefined
    // then don't render
    if (val == null) {
      continue;
    }
    // In best faith assuming a normal value
    const escaped = escapeHTMLAttr(`${val}`);
    template += ` ${key}="${escaped}"`;
  }

  for (const [tag, val] of data) {
    const key = `__root_attr_${tag}__`;
    Object.defineProperty(model, key, {
      enumerable: true,
      configurable: false,
      get() {
        return val.attrs.value;
      },
      set(v: unknown) {
        val.attrs.value = v;
      },
    });
    const bindStyle = val.bindStyle;
    if (bindStyle == undefined) {
      template += ` ${tag}="\${ ${key} }"`;
      continue;
    }
    if (bindStyle === true || bindStyle === "twoway") {
      template += ` \${ ${tag} <=> ${key} }`;
      continue;
    }
    if (bindStyle === "onetime") {
      template += ` \${ ${tag} <=| ${key} }`;
      continue;
    }
    if (bindStyle === "model") {
      template += ` \${ ${tag} <== ${key} }`;
      continue;
    }
    if (bindStyle === "attr") {
      template += ` \${ ${tag} ==> ${key} }`;
      continue;
    }
    if (bindStyle === "ref.view" || bindStyle === "ref.elem") {
      console.warn("View and element ref bindings are not yet supported");
      continue;
    }
    template += ` ${tag}="\${ ${key} }"`;
    console.error(`Invalid bindStyle set ${bindStyle} defaulting to basic model to attribute binding`);
  }
  return template;
}

function renderChildrenTemplate(idxs: Array<number>, elem: PUIElement, model: any, parent: PUIElement) {
  let template = '';
  let child_idx = -1;
  for (const child of elem.children) {
    child_idx += 1;
    if (child.ntype == "text") {
      template += escapeHTMLChild(child.tag);
      continue;
    }
    const mark = createMarker(child_idx, idxs);
    const childId = mark("");
    if (child.ntype == "custom") {
      const model = genModel(child as PUIElement);
      model[childId] = model;
      template += `<\${ ${childId} === } />`;
      continue;
    }
    if (child.ntype == "state") {
      Object.defineProperty(model, childId, {
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
          const escaped = escapeHTMLAttr(`${v}`);
          subtemplate += ` ${sk}="${escaped}"`;
          continue;
        }
        const key = mark(sk);
        model[key] = v;
        if (sk.startsWith("on")) {
          let eventName = sk.substring(2);
          eventName = `${eventName[0].toLowerCase()}${eventName.substring(1)}`;
          subtemplate += ` \${ ${eventName} @=> ${key} }`;
        } else {
          subtemplate += ` \${ ${sk} @=> ${key} }`;
        }
      }
      for (const [sk, val] of Object.entries(subelem.data)) {
        const key = mark(`attr_${sk}`);
        const tag = sk;
        val.tag = sk;
        Object.defineProperty(model, key, {
          enumerable: true,
          configurable: false,
          get() {
            return val.attrs.value;
          },
          set(v: unknown) {
            val.attrs.value = v;
          },
        });
        const bindStyle = val.bindStyle;
        if (bindStyle == undefined) {
          template += ` ${tag}="\${ ${key} }"`;
          continue;
        }
        if (bindStyle === true || bindStyle === "twoway") {
          template += ` \${ ${tag} <=> ${key} }`;
          continue;
        }
        if (bindStyle === "onetime") {
          template += ` \${ ${tag} <=| ${key} }`;
          continue;
        }
        if (bindStyle === "model") {
          template += ` \${ ${tag} <== ${key} }`;
          continue;
        }
        if (bindStyle === "attr") {
          template += ` \${ ${tag} ==> ${key} }`;
          continue;
        }
        if (bindStyle === "ref.view" || bindStyle === "ref.elem") {
          console.warn("View and element ref bindings are not yet supported");
          continue;
        }
        template += ` ${tag}="\${ ${key} }"`;
        console.error(`Invalid bindStyle set ${bindStyle} defaulting to basic model to attribute binding`);
      }
      if (isTagSelfClosing(subelem.tag)) {
        subtemplate += " />";
      } else {
        subtemplate += ">";
        if (subelem.children.length > 0) {
          subtemplate += renderChildrenTemplate([...idxs, child_idx], subelem, model, parent);
        }
        subtemplate += `</${subelem.tag}>`;
      }
      template += subtemplate;
    }
  }
  return template;
}


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
