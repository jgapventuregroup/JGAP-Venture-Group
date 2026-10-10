const test = require('node:test');
const assert = require('node:assert/strict');
const { mount } = require('../workspace-picker.js');
class Element {
  constructor(doc, tag) { this.ownerDocument = doc; this.tag = tag; this.children = []; this.listeners = {}; this.value = ''; this.textContent = ''; this.disabled = false; }
  createElement(tag) { return new Element(this, tag); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this[key] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
const doc = new Element(null, 'document');
doc.ownerDocument = doc;
const workspace = (id) => ({ company_id: id, company_name: id.toUpperCase(), member_role: 'owner' });
test('multi-company UI requires user selection', () => {
  const container = new Element(doc, 'div'); const selected = [];
  const { select } = mount(container, [workspace('alpha'), workspace('beta')], row => selected.push(row.id));
  assert.equal(select.value, '');
  assert.deepEqual(selected, []);
  select.value = 'beta'; select.listeners.change();
  assert.deepEqual(selected, ['beta']);
});
test('single-company UI selects authorized membership automatically', () => {
  const container = new Element(doc, 'div'); const selected = [];
  const { select } = mount(container, [workspace('alpha')], row => selected.push(row.id));
  assert.equal(select.value, 'alpha');
  assert.deepEqual(selected, ['alpha']);
});
test('unknown workspace is rejected and reset', () => {
  const container = new Element(doc, 'div'); const selected = [];
  const { select, status } = mount(container, [workspace('alpha'), workspace('beta')], row => selected.push(row.id));
  select.value = 'outsider'; select.listeners.change();
  assert.equal(select.value, '');
  assert.match(status.textContent, /not authorized/);
  assert.deepEqual(selected, []);
});
