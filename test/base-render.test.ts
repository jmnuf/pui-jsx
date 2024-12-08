import { expect, test, describe } from "bun:test";

import { genModel, modelData } from "../src/index";
import { jsxElement } from "../src/jsx-node-builder";


describe("Template rendering", () => {
  describe("Element with no attributes", () => {
    test("Render with no children", () => {
      const node = jsxElement("div", {});
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<div />");
    });

    test("Render with single child", () => {
      const node = jsxElement("div", {
        children: jsxElement("span", {})
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<div><span /></div>");
    });

    test("Render with children array", () => {
      const node = jsxElement("div", {
        children: [
          jsxElement("span", {}),
          "Urmom",
          jsxElement("span", {}),
        ],
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<div><span />Urmom<span /></div>");
    });
  });

  describe("Element with attributes", () => {
    test("Render with no children", () => {
      const node = jsxElement("input", {
        type: "text",
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<input type=\"text\" />");
    });

    test("Render with single child", () => {
      const node = jsxElement("p", {
        class: "text-left",
        children: "Lorem ipsum",
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<p class=\"text-left\">Lorem ipsum</p>");
    });

    test("Render with child array", () => {
      const node = jsxElement("div", {
        class: "flex flex-col justify-center",
        lorem: 32,
        ipsum: 32,
        children: [
          jsxElement("span", { class: "text-center", children: "Lorem ipsum" }),
          "Lorem picsum",
          jsxElement("input", { type: "number" }),
        ],
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<div class=\"flex flex-col justify-center\" lorem=\"32\" ipsum=\"32\"><span class=\"text-center\">Lorem ipsum</span>Lorem picsum<input type=\"number\" /></div>");
    });
  });

  describe("Basic state binding", () => {
    test("State as lone child", () => {
      const [state] = modelData(0);
      const node = jsxElement("span", {
        children: state(),
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<span>${ __child_0__ }</span>");
    });

    test("State as a child between nodes", () => {
      const [state] = modelData(0);
      const node = jsxElement("p", {
        children: [
          "Foo ",
          state(),
          jsxElement("span", {
            children: "bar",
          }),
        ],
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<p>Foo ${ __child_1__ }<span>bar</span></p>");
    });

    test("State as a child of a child", () => {
      const [state] = modelData("name");
      const node = jsxElement("div", {
        children: [
          jsxElement("h2", { children: "Names" }),
          jsxElement("p", {
            children: [
              "Is your name ",
              state(),
              "?",
            ],
          }),
        ],
      });
      expect(node).toBeDefined();
      const model = genModel(node);
      expect(model).toBeDefined();
      expect(model.template).toEqual("<div><h2>Names</h2><p>Is your name ${ __child_1_1__ }?</p></div>");
    });

    describe("State as an attribute", () => {
      const [state] = modelData("flex");
      test("model to attribute", () => {
        const node = jsxElement("div", {
          class: state.model(),
          children: "Hello, World"
        });
        expect(node).toBeDefined();
        const model = genModel(node);
        expect(model).toBeDefined();
        expect(model.template).toEqual("<div ${ class <== __root_attr_class__ }>Hello, World</div>");
      });

      test("attribute to model", () => {
        const node = jsxElement("input", {
          value: state.attr(),
          type: "number",
        });
        expect(node).toBeDefined();
        const model = genModel(node);
        expect(model).toBeDefined();
        expect(model.template).toEqual("<input type=\"number\" ${ value ==> __root_attr_value__ } />");
      });

      test("one time", () => {
        const node = jsxElement("input", {
          value: state.once(),
          type: "number",
        });
        expect(node).toBeDefined();
        const model = genModel(node);
        expect(model).toBeDefined();
        expect(model.template).toEqual("<input type=\"number\" ${ value <=| __root_attr_value__ } />");
      });

      test("two-way", () => {
        const node = jsxElement("input", {
          value: state.sync(),
          type: "number",
        });
        expect(node).toBeDefined();
        const model = genModel(node);
        expect(model).toBeDefined();
        expect(model.template).toEqual("<input type=\"number\" ${ value <=> __root_attr_value__ } />");
      });
    });
  });

  test("Event callback on base element", () => {
    const onClick = () => { };
    const node = jsxElement("button", {
      children: "Don't click on me!",
      onClick,
    });
    expect(node).toBeDefined();
    const model = genModel(node);
    expect(model).toBeDefined();
    expect(model.template).toEqual("<button ${ click @=> __root_onClick__ }>Don't click on me!</button>");
  });

  test("Event callback on child element", () => {
    const onClick = () => { };
    const node = jsxElement("div", {
      children: jsxElement("label", {
        for: "gae-btn",
        children: [
          "Click if gae ",
          jsxElement("button", {
            children: "GAE",
            id: "gae-btn",
            onClick,
          })
        ],
      }),
    });
    expect(node).toBeDefined();
    const model = genModel(node);
    expect(model).toBeDefined();
    expect(model.template).toEqual("<div><label for=\"gae-btn\">Click if gae <button id=\"gae-btn\" ${ click @=> __child_0_1_onClick__ }>GAE</button></label></div>");
  });
});

